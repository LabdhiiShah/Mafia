const { v4: uuidv4 } = require('uuid');
const challenges = require('../challenges');
const auditLogger = require('./auditLogger');
const { getRandomSabotageObjective } = require('../challenges/sabotageObjectives');
const { gamification } = require('./gamificationEngine');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(hostPlayer, options = {}) {
    const roomCode = options.caseCode ? options.caseCode.toUpperCase().trim() : ('MAFIA-' + Math.floor(1000 + Math.random() * 9000));
    const challengeKey = options.challengeId && challenges[options.challengeId] ? options.challengeId : 'auth-service';
    const challenge = challenges[challengeKey];

    const room = {
      code: roomCode,
      hostId: hostPlayer.id,
      status: 'LOBBY',
      settings: {
        isPublic: options.isPublic !== undefined ? Boolean(options.isPublic) : true,
        challengeId: challengeKey,
        challengeName: challenge.name,
        language: challenge.language || 'javascript',
        difficulty: challenge.difficulty || 'Easy',
        codingDuration: options.codingDuration || 240,
        discussionDuration: options.discussionDuration || 90,
        votingDuration: options.votingDuration || 60,
        maxPlayers: options.maxPlayers || 8,
        mafiaCount: options.mafiaCount || 1,
        enableQAInspector: options.enableQAInspector || false
      },
      usedChallengeIds: [challengeKey],
      challengeObj: challenge,
      players: new Map(),
      files: JSON.parse(JSON.stringify(challenge.files)),
      activeFile: Object.keys(challenge.files)[0],
      currentPhase: 'LOBBY',
      timerSeconds: 0,
      round: 1,
      testResults: { passed: 0, failed: 0, total: 0, passRate: 0, results: [] },
      votes: new Map(),
      eliminatedPlayers: [],
      winner: null,
      winningReason: '',
      sabotageState: {
        usedPowers: [],
        fakeRedLines: [],
        activeSubcodes: {}
      }
    };

    this.addPlayerToRoom(room, hostPlayer, true);
    auditLogger.initRoom(roomCode, room.files);
    gamification.initRoom(roomCode);
    this.rooms.set(roomCode, room);
    return room;
  }

  advanceRoomRound(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    room.round++;
    if (!room.usedChallengeIds) {
      room.usedChallengeIds = [room.settings.challengeId];
    }

    const DIFFICULTY_TIERS = ['Easy', 'Medium', 'Hard', 'Expert'];
    const currentLang = (room.settings.language || 'javascript').toLowerCase();
    const initialDiff = room.settings.difficulty || 'Easy';

    let baseIndex = DIFFICULTY_TIERS.findIndex(d => d.toLowerCase() === initialDiff.toLowerCase());
    if (baseIndex === -1) baseIndex = 0;

    let targetTierIndex = Math.min(baseIndex + (room.round - 1), DIFFICULTY_TIERS.length - 1);
    let targetDifficulty = DIFFICULTY_TIERS[targetTierIndex];

    const allChallenges = Object.values(challenges);

    // 1. Find unused challenge matching exact language and target difficulty tier
    let nextChallenge = allChallenges.find(c => 
      c.language.toLowerCase() === currentLang && 
      c.difficulty.toLowerCase() === targetDifficulty.toLowerCase() && 
      !room.usedChallengeIds.includes(c.id)
    );

    // 2. Fallback: find unused challenge in same language of higher difficulty
    if (!nextChallenge) {
      nextChallenge = allChallenges.find(c => 
        c.language.toLowerCase() === currentLang && 
        !room.usedChallengeIds.includes(c.id)
      );
    }

    // 3. Fallback: find unused challenge matching target difficulty in any language
    if (!nextChallenge) {
      nextChallenge = allChallenges.find(c => 
        c.difficulty.toLowerCase() === targetDifficulty.toLowerCase() && 
        !room.usedChallengeIds.includes(c.id)
      );
    }

    // 4. Fallback: find any unused challenge
    if (!nextChallenge) {
      nextChallenge = allChallenges.find(c => !room.usedChallengeIds.includes(c.id));
    }

    // 5. Ultimate fallback: keep current challenge or first available
    if (!nextChallenge) {
      nextChallenge = room.challengeObj || allChallenges[0];
    }

    room.usedChallengeIds.push(nextChallenge.id);
    room.challengeObj = nextChallenge;
    room.settings.challengeId = nextChallenge.id;
    room.settings.challengeName = nextChallenge.name;
    room.settings.difficulty = nextChallenge.difficulty;
    room.files = JSON.parse(JSON.stringify(nextChallenge.files));
    room.activeFile = Object.keys(nextChallenge.files)[0];
    room.testResults = { passed: 0, failed: 0, total: 0, passRate: 0, results: [] };
    room.votes.clear();

    auditLogger.logEvent(roomCode, {
      type: 'ROUND_ADVANCED',
      authorName: 'System',
      authorId: 'system',
      detail: `Advanced to Round ${room.round}. New Challenge: ${nextChallenge.name} (Difficulty: ${nextChallenge.difficulty})`
    });

    return room;
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }

  findPublicRoom(language, difficulty) {
    for (const room of this.rooms.values()) {
      if (
        room.status === 'LOBBY' &&
        room.settings.isPublic !== false &&
        room.players.size < room.settings.maxPlayers
      ) {
        if (!language || room.settings.language.toLowerCase() === language.toLowerCase()) {
          return room;
        }
      }
    }
    for (const room of this.rooms.values()) {
      if (
        room.status === 'LOBBY' &&
        room.settings.isPublic !== false &&
        room.players.size < room.settings.maxPlayers
      ) {
        return room;
      }
    }
    return null;
  }

  addPlayerToRoom(room, player, isHost = false) {
    if (room.players.size >= room.settings.maxPlayers) {
      throw new Error(`Room is full (Max ${room.settings.maxPlayers} players)`);
    }

    // Disambiguate duplicate player names if multiple players join with the same handle
    let finalName = player.name || 'Developer';
    const existingNames = new Set(Array.from(room.players.values()).map(p => p.name));
    if (existingNames.has(finalName)) {
      let counter = 2;
      while (existingNames.has(`${player.name} (${counter})`)) {
        counter++;
      }
      finalName = `${player.name} (${counter})`;
    }

    const avatarSeed = player.avatar || `avatar_${(room.players.size % 8) + 1}`;
    
    const playerObj = {
      id: player.id,
      socketId: player.socketId,
      name: finalName,
      avatar: avatarSeed,
      isHost,
      isReady: isHost,
      isAlive: true,
      role: null,
      secretObjective: '',
      cursor: { file: room.activeFile, line: 1, column: 1 },
      color: this.generatePlayerColor(room.players.size)
    };

    room.players.set(player.socketId, playerObj);
    return playerObj;
  }

  removePlayer(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) {
        const player = room.players.get(socketId);
        room.players.delete(socketId);

        if (player.isHost && room.players.size > 0) {
          const nextHost = room.players.values().next().value;
          nextHost.isHost = true;
          room.hostId = nextHost.id;
        }

        if (room.players.size === 0) {
          auditLogger.clearRoom(room.code);
          this.rooms.delete(room.code);
        }

        return { room, player };
      }
    }
    return null;
  }

  generatePlayerColor(index) {
    const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#c084fc', '#f472b6', '#38bdf8', '#a3e635'];
    return colors[index % colors.length];
  }

  assignRoles(room) {
    const playerList = Array.from(room.players.values());
    const total = playerList.length;
    let mafiaCount = total <= 5 ? 1 : total <= 8 ? 2 : 3;
    mafiaCount = Math.min(mafiaCount, Math.floor(total / 2));
    if (mafiaCount < 1) mafiaCount = 1;

    const shuffled = [...playerList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const mafiaPlayers = [];
    
    for (let i = 0; i < mafiaCount; i++) {
      shuffled[i].role = 'MAFIA';
      shuffled[i].secretObjective = `SABOTAGE OBJECTIVE: ${getRandomSabotageObjective()}`;
      mafiaPlayers.push(shuffled[i].name);
    }

    let devStartIndex = mafiaCount;
    if (total >= 4) {
      shuffled[devStartIndex].role = 'DETECTIVE';
      shuffled[devStartIndex].secretObjective = 'INVESTIGATION MISSION: Inspect code diffs closely, track file changes, identify Mafia saboteurs, and lead the team during discussion & voting.';
      devStartIndex++;
    }

    for (let i = devStartIndex; i < shuffled.length; i++) {
      shuffled[i].role = 'CIVILIAN';
      shuffled[i].secretObjective = 'CIVILIAN MISSION: Work with your team to fix code bugs, pass 100% of test suites, and uncover the Mafia!';
    }

    shuffled.forEach(p => {
      p.teammates = p.role === 'MAFIA' ? mafiaPlayers : [];
    });
  }

  serializeRoom(room, forSocketId = null) {
    const gamificationState = gamification.getRoomGamificationState(room.code);

    const playerList = Array.from(room.players.values()).map(p => {
      const isTarget = p.socketId === forSocketId;
      const requestingPlayer = forSocketId ? room.players.get(forSocketId) : null;
      
      let visibleRole = 'HIDDEN';
      let secretObjective = '';
      let teammates = [];

      if (room.status === 'GAME_OVER' || isTarget) {
        visibleRole = p.role;
        secretObjective = p.secretObjective;
        teammates = p.teammates || [];
      } else if (requestingPlayer && requestingPlayer.role === 'MAFIA' && p.role === 'MAFIA') {
        visibleRole = 'MAFIA';
      }

      const pState = gamification.getPlayerState(room.code, p.socketId, p.name);

      return {
        id: p.id,
        socketId: p.socketId,
        name: p.name,
        avatar: p.avatar,
        isHost: p.isHost,
        isReady: p.isReady,
        isAlive: p.isAlive,
        color: p.color,
        cursor: p.cursor,
        role: visibleRole,
        secretObjective,
        teammates,
        xp: pState.xp,
        streak: pState.streak,
        badges: pState.badges
      };
    });

    return {
      code: room.code,
      hostId: room.hostId,
      status: room.status,
      settings: room.settings,
      players: playerList,
      files: room.files,
      activeFile: room.activeFile,
      timerSeconds: room.timerSeconds,
      round: room.round,
      testResults: room.testResults,
      eliminatedPlayers: room.eliminatedPlayers,
      winner: room.winner,
      winningReason: room.winningReason,
      gamification: gamificationState,
      sabotageState: room.sabotageState || { usedPowers: [], fakeRedLines: [], activeSubcodes: {} }
    };
  }
}

module.exports = new RoomManager();
