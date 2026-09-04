const roomManager = require('./roomManager');
const auditLogger = require('./auditLogger');
const codeExecutor = require('./codeExecutor');
const db = require('../db');
const { gamification } = require('./gamificationEngine');

class GameStateEngine {
  constructor() {
    this.timers = new Map(); // roomCode -> setInterval handle
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  startGame(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.players.size < 2) return false;

    roomManager.assignRoles(room);
    room.status = 'ROLE_REVEAL';
    room.timerSeconds = 10;
    room.round = 1;
    room.winner = null;
    room.winningReason = '';
    room.eliminatedPlayers = [];

    // Run initial test suite to record baseline test results
    codeExecutor.executeTestSuite(room.files, room.challengeObj).then(res => {
      room.testResults = res;
      this.broadcastRoomUpdate(roomCode);
    });

    auditLogger.logEvent(roomCode, {
      type: 'GAME_STARTED',
      authorName: 'System',
      authorId: 'system',
      detail: `Game started with ${room.players.size} players. Language: ${room.settings.language.toUpperCase()}.`
    });

    this.startPhaseTimer(roomCode);
    return true;
  }

  startPhaseTimer(roomCode) {
    if (this.timers.has(roomCode)) {
      clearInterval(this.timers.get(roomCode));
    }

    const interval = setInterval(() => {
      const room = roomManager.getRoom(roomCode);
      if (!room) {
        clearInterval(interval);
        this.timers.delete(roomCode);
        return;
      }

      if (room.timerSeconds > 0) {
        room.timerSeconds--;
        this.io.to(roomCode).emit('timer_tick', { timerSeconds: room.timerSeconds, phase: room.status });
      } else {
        this.advancePhase(roomCode);
      }
    }, 1000);

    this.timers.set(roomCode, interval);
  }

  advancePhase(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    if (room.status === 'ROLE_REVEAL') {
      room.status = 'CODING_PHASE';
      room.timerSeconds = room.settings.codingDuration;
      auditLogger.logEvent(roomCode, {
        type: 'PHASE_CHANGE',
        authorName: 'System',
        authorId: 'system',
        detail: `Sprint Phase started! ${room.timerSeconds}s to code & test.`
      });
    } else if (room.status === 'CODING_PHASE') {
      room.status = 'DISCUSSION_PHASE';
      room.timerSeconds = room.settings.discussionDuration;
      auditLogger.logEvent(roomCode, {
        type: 'PHASE_CHANGE',
        authorName: 'System',
        authorId: 'system',
        detail: `Coding locked! Discussion & Code Review Phase started.`
      });
    } else if (room.status === 'DISCUSSION_PHASE') {
      room.status = 'VOTING_PHASE';
      room.timerSeconds = room.settings.votingDuration;
      room.votes.clear();
      auditLogger.logEvent(roomCode, {
        type: 'PHASE_CHANGE',
        authorName: 'System',
        authorId: 'system',
        detail: `Voting Phase started! Submit votes to eliminate suspected Mafia.`
      });
    } else if (room.status === 'VOTING_PHASE') {
      this.processVotingResults(roomCode);
      return;
    }

    this.checkVictoryConditions(roomCode);
    this.broadcastRoomUpdate(roomCode);
  }

  processVotingResults(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const voteCounts = new Map();
    let skipCount = 0;

    for (const [voterSocket, targetSocket] of room.votes.entries()) {
      if (targetSocket === 'SKIP' || !targetSocket) {
        skipCount++;
      } else {
        voteCounts.set(targetSocket, (voteCounts.get(targetSocket) || 0) + 1);
      }
    }

    let highestVotes = 0;
    let eliminatedSocket = null;
    let isTie = false;

    for (const [targetSocket, count] of voteCounts.entries()) {
      if (count > highestVotes) {
        highestVotes = count;
        eliminatedSocket = targetSocket;
        isTie = false;
      } else if (count === highestVotes) {
        isTie = true;
      }
    }

    let eliminationResult = { eliminatedPlayer: null, isTie: false, skipped: false, protected: false };

    if (room.detectiveState?.sacrificialSaveAccepted) {
      eliminationResult.skipped = true;
      auditLogger.logEvent(roomCode, {
        type: 'VOTE_RESULT',
        detail: `🕯️ VOTES SACRIFICED: Innocents sacrificed their voting rights to resurrect the Detective. No elimination this round.`
      });
    } else if (eliminatedSocket && room.detectiveState?.protectedSocketId === eliminatedSocket) {
      eliminationResult.protected = true;
      eliminationResult.skipped = true;
      auditLogger.logEvent(roomCode, {
        type: 'VOTE_RESULT',
        detail: `🛡️ PROTECTIVE SHIELD ACTIVATED: Target player was shielded by the Detective and SURVIVED the vote!`
      });
    } else if (skipCount >= highestVotes || isTie || !eliminatedSocket) {
      eliminationResult.skipped = true;
      auditLogger.logEvent(roomCode, {
        type: 'VOTE_RESULT',
        detail: `No player was eliminated (Tie or majority skipped).`
      });
    } else {
      const player = room.players.get(eliminatedSocket);
      if (player) {
        player.isAlive = false;
        room.eliminatedPlayers.push({
          id: player.id,
          name: player.name,
          role: player.role,
          round: room.round
        });
        eliminationResult.eliminatedPlayer = {
          name: player.name,
          role: player.role
        };
        auditLogger.logEvent(roomCode, {
          type: 'VOTE_RESULT',
          detail: `Player eliminated! Role revealed: ${player.role}.`
        });
      }
    }

    this.io.to(roomCode).emit('elimination_result', eliminationResult);

    const hasWon = this.checkVictoryConditions(roomCode);
    if (!hasWon) {
      setTimeout(() => {
        const r = roomManager.getRoom(roomCode);
        if (r && r.status !== 'GAME_OVER') {
          roomManager.advanceRoomRound(roomCode);
          r.status = 'CODING_PHASE';
          r.timerSeconds = r.settings.codingDuration;
          this.broadcastRoomUpdate(roomCode);
        }
      }, 5000);
    }
  }

  checkVictoryConditions(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.status === 'GAME_OVER') return true;

    const alivePlayers = Array.from(room.players.values()).filter(p => p.isAlive);
    const aliveMafia = alivePlayers.filter(p => p.role === 'MAFIA');
    const aliveCivilians = alivePlayers.filter(p => p.role === 'CIVILIAN' || p.role === 'DETECTIVE' || p.role === 'DEVELOPER' || p.role === 'QA_INSPECTOR');

    const mode = room.settings?.victoryMode || room.settings?.victory || 'STANDARD';
    const targetPassRate = mode === 'SURVIVAL' ? 80 : 100;

    // Condition 1: Civilians win if required test pass rate is met!
    if (room.testResults && room.testResults.total > 0 && room.testResults.passRate >= targetPassRate) {
      room.status = 'GAME_OVER';
      room.winner = 'CIVILIANS';
      room.winningReason = `${room.testResults.passRate}% of test suites passed (${mode} target met)! Codebase fully stabilized.`;
      this.endGame(roomCode);
      return true;
    }

    // Condition 2: Civilians win if all Mafia members are eliminated
    if (aliveMafia.length === 0) {
      room.status = 'GAME_OVER';
      room.winner = 'CIVILIANS';
      room.winningReason = 'All Mafia saboteurs have been identified and voted out!';
      this.endGame(roomCode);
      return true;
    }

    // Condition 3: Mafia win if Mafia count equals or exceeds Civilian count
    if (aliveMafia.length >= aliveCivilians.length) {
      room.status = 'GAME_OVER';
      room.winner = 'MAFIA';
      room.winningReason = 'Mafia saboteurs gained majority control over the team!';
      this.endGame(roomCode);
      return true;
    }

    // Condition 4: Mafia win if timer runs out in final round without passing tests
    if (room.status === 'CODING_PHASE' && room.timerSeconds === 0 && room.round >= 3) {
      room.status = 'GAME_OVER';
      room.winner = 'MAFIA';
      room.winningReason = 'Sprint time expired before tests could be fixed. Sabotage successful!';
      this.endGame(roomCode);
      return true;
    }

    return false;
  }

  endGame(roomCode) {
    if (this.timers.has(roomCode)) {
      clearInterval(this.timers.get(roomCode));
      this.timers.delete(roomCode);
    }
    const room = roomManager.getRoom(roomCode);
    if (room) {
      gamification.awardMatchEndXP(roomCode, room.winner, room.players);

      auditLogger.logEvent(roomCode, {
        type: 'GAME_OVER',
        authorName: 'System',
        authorId: 'system',
        detail: `Game Over! Winners: ${room.winner}. ${room.winningReason}`
      });

      db.saveMatchHistory({
        ...room,
        players: Array.from(room.players.values())
      });

      this.broadcastRoomUpdate(roomCode);
    }
  }

  broadcastRoomUpdate(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room || !this.io) return;

    for (const socketId of room.players.keys()) {
      const clientData = roomManager.serializeRoom(room, socketId);
      this.io.to(socketId).emit('room_state_update', clientData);
    }
  }
}

module.exports = new GameStateEngine();
