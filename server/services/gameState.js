const roomManager = require('./roomManager');
const auditLogger = require('./auditLogger');
const codeExecutor = require('./codeExecutor');
const db = require('../db');

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

    let eliminationResult = { eliminatedPlayer: null, isTie: false, skipped: false };

    if (skipCount >= highestVotes || isTie || !eliminatedSocket) {
      eliminationResult.skipped = true;
      auditLogger.logEvent(roomCode, {
        type: 'VOTE_RESULT',
        authorName: 'System',
        authorId: 'system',
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
          authorName: 'System',
          authorId: 'system',
          detail: `Player ${player.name} was eliminated! They were a ${player.role}.`
        });
      }
    }

    this.io.to(roomCode).emit('elimination_result', eliminationResult);

    const hasWon = this.checkVictoryConditions(roomCode);
    if (!hasWon) {
      room.round++;
      room.status = 'CODING_PHASE';
      room.timerSeconds = room.settings.codingDuration;
    }

    this.broadcastRoomUpdate(roomCode);
  }

  checkVictoryConditions(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.status === 'GAME_OVER') return true;

    const alivePlayers = Array.from(room.players.values()).filter(p => p.isAlive);
    const aliveMafia = alivePlayers.filter(p => p.role === 'MAFIA');
    const aliveDevs = alivePlayers.filter(p => p.role === 'DEVELOPER' || p.role === 'QA_INSPECTOR');

    // Condition 1: Developers win if 100% of both Public & Hidden unit tests pass!
    if (room.testResults && room.testResults.total > 0 && room.testResults.passed === room.testResults.total) {
      room.status = 'GAME_OVER';
      room.winner = 'DEVELOPERS';
      room.winningReason = '100% of Public AND Hidden edge-case test suites passed! Codebase fully stabilized.';
      this.endGame(roomCode);
      return true;
    }

    // Condition 2: Developers win if all Mafia members are eliminated
    if (aliveMafia.length === 0) {
      room.status = 'GAME_OVER';
      room.winner = 'DEVELOPERS';
      room.winningReason = 'All Mafia saboteurs have been identified and eliminated from the team!';
      this.endGame(roomCode);
      return true;
    }

    // Condition 3: Mafia win if Mafia count equals or exceeds Dev count
    if (aliveMafia.length >= aliveDevs.length) {
      room.status = 'GAME_OVER';
      room.winner = 'MAFIA';
      room.winningReason = 'Mafia saboteurs gained majority control over the software project team!';
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
