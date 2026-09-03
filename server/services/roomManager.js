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
    const roomCode = 'MAFIA-' + Math.floor(1000 + Math.random() * 9000);
    const challengeKey = options.challengeId && challenges[options.challengeId] ? options.challengeId : 'shopping-cart';
    const challenge = challenges[challengeKey];

    const room = {
      code: roomCode,
      hostId: hostPlayer.id,
      status: 'LOBBY',
      settings: {
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
      winningReason: ''
    };

    this.addPlayerToRoom(room, hostPlayer, true);
    auditLogger.initRoom(roomCode, room.files);
    gamification.initRoom(roomCode);
    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }

  addPlayerToRoom(room, player, isHost = false) {
    if (room.players.size >= room.settings.maxPlayers) {
      throw new Error(`Room is full (Max ${room.settings.maxPlayers} players)`);
    }

    const avatarSeed = player.avatar || `avatar_${(room.players.size % 8) + 1}`;
    
    const playerObj = {
      id: player.id,
      socketId: player.socketId,
      name: player.name,
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
    let mafiaCount = Math.min(room.settings.mafiaCount, Math.floor(total / 2));
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
    if (room.settings.enableQAInspector && total >= 4) {
      shuffled[devStartIndex].role = 'QA_INSPECTOR';
      shuffled[devStartIndex].secretObjective = 'MISSION OBJECTIVE: Investigate code diffs closely to identify saboteurs and guide the team during voting.';
      devStartIndex++;
    }

    for (let i = devStartIndex; i < shuffled.length; i++) {
      shuffled[i].role = 'DEVELOPER';
      shuffled[i].secretObjective = 'MISSION OBJECTIVE: Fix bugs in the project files to pass 100% of public and hidden test suites!';
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
      gamification: gamificationState
    };
  }
}

module.exports = new RoomManager();
