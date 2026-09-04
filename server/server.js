const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const roomManager = require('./services/roomManager');
const gameStateEngine = require('./services/gameState');
const auditLogger = require('./services/auditLogger');
const codeExecutor = require('./services/codeExecutor');
const challenges = require('./challenges');
const db = require('./db');
const authController = require('./auth/authController');
const { gamification } = require('./services/gamificationEngine');
const subcodes = require('./challenges/subcodes');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

gameStateEngine.setIO(io);

db.initDB();

// Authentication REST Endpoints
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authController.getMe);

// REST API Endpoints
app.get('/api/challenges', (req, res) => {
  const challengeList = Object.values(challenges).map(c => ({
    id: c.id,
    name: c.name,
    language: c.language || 'javascript',
    difficulty: c.difficulty || 'Easy',
    description: c.description
  }));
  res.json(challengeList);
});

app.get('/api/room/:code/logs', (req, res) => {
  const { code } = req.params;
  const logs = auditLogger.getLogs(code);
  res.json(logs);
});

app.get('/api/room/:code/diffs/:filename', (req, res) => {
  const { code, filename } = req.params;
  const history = auditLogger.getFileHistory(code, filename);
  res.json(history);
});

app.get('/api/leaderboard', async (req, res) => {
  const leaderboard = await db.getLeaderboard();
  res.json(leaderboard);
});

app.get('/api/stats/online', async (req, res) => {
  try {
    const totalRegistered = await db.getUserCount();
    const activeSockets = io.sockets.sockets ? io.sockets.sockets.size : 0;
    const onlineCount = Math.max(activeSockets, totalRegistered);
    res.json({ onlinePlayers: onlineCount, activeSockets, totalRegistered });
  } catch (err) {
    const activeSockets = io.sockets.sockets ? io.sockets.sockets.size : 0;
    res.json({ onlinePlayers: activeSockets || 1, activeSockets });
  }
});

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // Create Room
  socket.on('create_room', ({ playerName, avatar, options }, callback) => {
    try {
      const player = {
        id: uuidv4(),
        socketId: socket.id,
        name: playerName || 'Lead Dev',
        avatar: avatar || 'avatar_1'
      };

      const room = roomManager.createRoom(player, options || {});
      socket.join(room.code);

      auditLogger.logEvent(room.code, {
        type: 'ROOM_CREATED',
        authorName: player.name,
        authorId: player.id,
        detail: `${player.name} created room ${room.code} (${room.settings.challengeName} - ${room.settings.language.toUpperCase()})`
      });
      db.saveAuditLog(room.code, 'ROOM_CREATED', player.name, `${player.name} created room ${room.code}`);

      const serialized = roomManager.serializeRoom(room, socket.id);
      if (callback) callback({ success: true, room: serialized });

      gameStateEngine.broadcastRoomUpdate(room.code);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Join Room
  socket.on('join_room', ({ roomCode, playerName, avatar }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode.toUpperCase().trim());
      if (!room) {
        if (callback) callback({ success: false, error: 'Room code not found' });
        return;
      }

      if (room.status !== 'LOBBY') {
        if (callback) callback({ success: false, error: 'Game is already in progress' });
        return;
      }

      const player = {
        id: uuidv4(),
        socketId: socket.id,
        name: playerName || 'Developer',
        avatar: avatar || 'avatar_2'
      };

      roomManager.addPlayerToRoom(room, player);
      socket.join(room.code);

      auditLogger.logEvent(room.code, {
        type: 'PLAYER_JOINED',
        authorName: player.name,
        authorId: player.id,
        detail: `${player.name} joined room ${room.code}.`
      });
      db.saveAuditLog(room.code, 'PLAYER_JOINED', player.name, `${player.name} joined room ${room.code}.`);

      const serialized = roomManager.serializeRoom(room, socket.id);
      if (callback) callback({ success: true, room: serialized });

      gameStateEngine.broadcastRoomUpdate(room.code);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Quick Matchmaking
  socket.on('quick_match', ({ playerName, avatar, language, difficulty }, callback) => {
    try {
      let room = roomManager.findPublicRoom(language, difficulty);
      const player = {
        id: uuidv4(),
        socketId: socket.id,
        name: playerName || 'Operative',
        avatar: avatar || 'avatar_1'
      };

      if (!room) {
        const caseCode = 'MAFIA-' + Math.floor(1000 + Math.random() * 9000);
        room = roomManager.createRoom(player, {
          caseCode,
          isPublic: true,
          language: language || 'javascript',
          difficulty: difficulty || 'MEDIUM'
        });
        socket.join(room.code);
        const serialized = roomManager.serializeRoom(room, socket.id);
        if (callback) callback({ success: true, room: serialized, isHost: true });
        gameStateEngine.broadcastRoomUpdate(room.code);
        return;
      }

      roomManager.addPlayerToRoom(room, player);
      socket.join(room.code);

      auditLogger.logEvent(room.code, {
        type: 'PLAYER_JOINED',
        authorName: player.name,
        authorId: player.id,
        detail: `${player.name} joined public room ${room.code} via Quick Match.`
      });
      db.saveAuditLog(room.code, 'PLAYER_JOINED', player.name, `${player.name} joined public room ${room.code} via Quick Match.`);

      const serialized = roomManager.serializeRoom(room, socket.id);
      if (callback) callback({ success: true, room: serialized, isHost: false });

      gameStateEngine.broadcastRoomUpdate(room.code);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Toggle Ready State
  socket.on('toggle_ready', ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (player) {
      player.isReady = !player.isReady;
      gameStateEngine.broadcastRoomUpdate(roomCode);
    }
  });

  // Start Game
  socket.on('start_game', ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (player && player.isHost) {
      db.saveAuditLog(roomCode, 'GAME_STARTED', player.name, `Host ${player.name} started the game match.`);
      gameStateEngine.startGame(roomCode);
    }
  });

  // Code Edit Sync
  socket.on('code_edit', ({ roomCode, filename, content }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    if (room.status !== 'CODING_PHASE' && room.status !== 'LOBBY') return;

    const player = room.players.get(socket.id);
    if (!player || !player.isAlive) return;

    room.files[filename] = content;

    auditLogger.logCodeEdit(roomCode, filename, content, player.id, player.name);

    socket.to(roomCode).emit('code_updated', {
      filename,
      content,
      authorId: player.id,
      authorName: player.name
    });
  });

  // Active File Tab Switch
  socket.on('switch_file', ({ roomCode, filename }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.files[filename]) return;

    const player = room.players.get(socket.id);
    if (player) {
      player.cursor.file = filename;
      socket.to(roomCode).emit('player_switched_file', {
        socketId: socket.id,
        playerName: player.name,
        filename
      });
    }
  });

  // Cursor position broadcast
  socket.on('cursor_move', ({ roomCode, filename, line, column }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (player) {
      player.cursor = { file: filename, line, column };
      socket.to(roomCode).emit('cursor_updated', {
        socketId: socket.id,
        playerName: player.name,
        color: player.color,
        cursor: player.cursor
      });
    }
  });

  // Run Test Suite (with Risky Run mode support)
  socket.on('run_tests', async ({ roomCode, isRiskyRun }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      if (callback) callback({ error: 'Room not found' });
      return;
    }

    const player = room.players.get(socket.id);
    if (!player) return;

    const results = await codeExecutor.executeTestSuite(room.files, room.challengeObj);
    room.testResults = results;

    const isSuccess = results.total > 0 && results.passed === results.total;

    // Record XP & Streaks
    const xpResult = gamification.recordTestRun(roomCode, socket.id, player.name, isSuccess, isRiskyRun);

    // Apply Risky Run time penalty if failed
    if (isRiskyRun && !isSuccess) {
      room.timerSeconds = Math.max(0, room.timerSeconds - 15);
      auditLogger.logEvent(roomCode, {
        type: 'RISKY_RUN_FAILED',
        authorName: player.name,
        authorId: player.id,
        detail: `🧪 ${player.name} attempted a Risky Test Run and failed! -15s Sprint Timer penalty applied!`
      });
    }

    auditLogger.logTestRun(roomCode, player.id, player.name, results);
    db.saveAuditLog(roomCode, 'TEST_RUN', player.name, `Ran tests (${isRiskyRun ? 'RISKY RUN' : 'NORMAL'}): ${results.passed}/${results.total} passed (+${xpResult.xpEarned} XP)`);

    if (callback) callback({ ...results, xpEarned: xpResult.xpEarned, streak: xpResult.currentStreak, multiplier: xpResult.multiplier });

    io.to(roomCode).emit('test_results_updated', {
      results,
      executedBy: player.name,
      xpEarned: xpResult.xpEarned,
      isRiskyRun
    });

    gameStateEngine.checkVictoryConditions(roomCode);
    gameStateEngine.broadcastRoomUpdate(roomCode);
  });

  // Buy Hint Event Handler
  socket.on('buy_hint', ({ roomCode, hintType }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      if (callback) callback({ success: false, error: 'Room not found' });
      return;
    }

    const player = room.players.get(socket.id);
    if (!player) return;

    const result = gamification.buyHint(roomCode, hintType);

    if (result.success) {
      let hintText = '';
      if (hintType === 'LOCATION') {
        const fileKeys = Object.keys(room.files);
        hintText = `💡 HINT REVEALED [Bug Location]: Inspect file "${fileKeys[0]}" near functions performing subtotal/calculation operations.`;
      } else {
        hintText = `💡 HINT REVEALED [Bug Type]: Look for inverted conditional operators, off-by-one boundary checks, or missing double-shipping charge validations.`;
      }

      auditLogger.logEvent(roomCode, {
        type: 'HINT_UNLOCKED',
        authorName: player.name,
        authorId: player.id,
        detail: `${player.name} purchased Hint (${hintType}) for ${result.cost} XP!`
      });
      db.saveAuditLog(roomCode, 'HINT_UNLOCKED', player.name, `${player.name} purchased ${hintType} hint for ${result.cost} XP.`);

      io.to(roomCode).emit('hint_unlocked', {
        hintType,
        hintText,
        unlockedBy: player.name,
        cost: result.cost
      });

      if (callback) callback({ success: true, hintText, cost: result.cost });

      gameStateEngine.broadcastRoomUpdate(roomCode);
    } else {
      if (callback) callback(result);
    }
  });

  // Submit Vote
  socket.on('submit_vote', ({ roomCode, targetSocketId }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.status !== 'VOTING_PHASE') return;

    const player = room.players.get(socket.id);
    if (!player || !player.isAlive) return;

    room.votes.set(socket.id, targetSocketId);

    const targetPlayer = room.players.get(targetSocketId);
    auditLogger.logVote(roomCode, player.name, targetPlayer ? targetPlayer.name : 'Skip');

    io.to(roomCode).emit('vote_cast', {
      voterSocketId: socket.id,
      voterName: player.name,
      totalVotes: room.votes.size,
      aliveCount: Array.from(room.players.values()).filter(p => p.isAlive).length
    });

    const aliveCount = Array.from(room.players.values()).filter(p => p.isAlive).length;
    if (room.votes.size >= aliveCount) {
      gameStateEngine.processVotingResults(roomCode);
    }
  });

  // Chat message
  socket.on('send_chat', ({ roomCode, message }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const chatPayload = {
      id: uuidv4(),
      authorId: player.id,
      authorName: player.name,
      avatar: player.avatar,
      color: player.color,
      isAlive: player.isAlive,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    auditLogger.logEvent(roomCode, {
      type: 'CHAT_MESSAGE',
      authorName: player.name,
      authorId: player.id,
      detail: `${player.name}: ${message}`
    });
    db.saveAuditLog(roomCode, 'CHAT_MESSAGE', player.name, `${player.name}: ${message}`);

    io.to(roomCode).emit('chat_received', chatPayload);
  });

  // Mafia Sabotage Event Trigger
  socket.on('mafia_trigger_sabotage', ({ roomCode, powerId, targetData }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      if (callback) callback({ success: false, error: 'Room not found' });
      return;
    }

    const player = room.players.get(socket.id);
    if (!player || player.role !== 'MAFIA' || !player.isAlive) {
      if (callback) callback({ success: false, error: 'Unauthorized power activation' });
      return;
    }

    if (room.status !== 'CODING_PHASE') {
      if (callback) callback({ success: false, error: 'Sabotage powers can only be used during Coding Phase' });
      return;
    }

    if (!room.sabotageState) {
      room.sabotageState = { usedPowers: [], fakeRedLines: [], activeSubcodes: {} };
    }

    if (room.sabotageState.usedPowers.includes(powerId)) {
      if (callback) callback({ success: false, error: 'This power has already been used this match' });
      return;
    }

    room.sabotageState.usedPowers.push(powerId);

    if (powerId === 'subcode_outbreak') {
      const nonMafiaAlive = Array.from(room.players.values()).filter(p => p.role !== 'MAFIA' && p.isAlive);
      const lang = room.settings.language || 'javascript';

      nonMafiaAlive.forEach((targetPlayer, idx) => {
        const subcodeChallenge = subcodes.getSubcodeForLanguage(lang, idx);
        room.sabotageState.activeSubcodes[targetPlayer.socketId] = {
          challenge: subcodeChallenge,
          startTime: Date.now(),
          duration: 30
        };

        io.to(targetPlayer.socketId).emit('subcode_sabotage_start', {
          challenge: subcodeChallenge,
          durationSeconds: 30
        });

        // 30 seconds expiration timer on server
        setTimeout(() => {
          const currentRoom = roomManager.getRoom(roomCode);
          if (currentRoom && currentRoom.sabotageState?.activeSubcodes[targetPlayer.socketId]) {
            delete currentRoom.sabotageState.activeSubcodes[targetPlayer.socketId];
            const p = currentRoom.players.get(targetPlayer.socketId);
            if (p && p.isAlive) {
              p.isAlive = false;
              currentRoom.eliminatedPlayers.push({
                id: p.id,
                name: p.name,
                role: p.role,
                round: currentRoom.round
              });

              auditLogger.logEvent(roomCode, {
                type: 'SUBCODE_FAILED',
                authorName: 'System',
                authorId: 'system',
                detail: `☣️ ${p.name} failed to resolve Subcode Outbreak in 30 seconds and was ELIMINATED!`
              });

              io.to(roomCode).emit('elimination_result', {
                eliminatedPlayer: { name: p.name, role: p.role },
                isTie: false,
                skipped: false
              });

              gameStateEngine.checkVictoryConditions(roomCode);
              gameStateEngine.broadcastRoomUpdate(roomCode);
            }
          }
        }, 30500);
      });

      auditLogger.logEvent(roomCode, {
        type: 'MAFIA_SABOTAGE',
        authorName: player.name,
        authorId: player.id,
        detail: `☣️ MAFIA SABOTAGE: ${player.name} unleashed Subcode Outbreak! Non-Mafia members have 30s to fix subcodes or face elimination!`
      });

      if (callback) callback({ success: true, powerId });
      gameStateEngine.broadcastRoomUpdate(roomCode);

    } else if (powerId === 'chronos_drain') {
      room.timerSeconds = Math.max(0, room.timerSeconds - 10);

      auditLogger.logEvent(roomCode, {
        type: 'MAFIA_SABOTAGE',
        authorName: player.name,
        authorId: player.id,
        detail: `⏳ MAFIA SABOTAGE: ${player.name} activated Chronos Drain! -10 seconds subtracted from Sprint Timer!`
      });

      if (callback) callback({ success: true, powerId, newTimer: room.timerSeconds });
      io.to(roomCode).emit('timer_tick', { timerSeconds: room.timerSeconds, phase: room.status });
      gameStateEngine.broadcastRoomUpdate(roomCode);

    } else if (powerId === 'phantom_fault') {
      const line = Number(targetData?.line) || 1;
      const filename = targetData?.filename || room.activeFile;
      const message = targetData?.message || 'SYNTAX ERROR: Unexpected token / Memory Leak';

      room.sabotageState.fakeRedLines.push({
        filename,
        line,
        message,
        id: uuidv4()
      });

      auditLogger.logEvent(roomCode, {
        type: 'MAFIA_SABOTAGE',
        authorName: player.name,
        authorId: player.id,
        detail: `🔴 MAFIA SABOTAGE: Phantom Fault line decoration injected on file "${filename}" line ${line}.`
      });

      if (callback) callback({ success: true, powerId, fakeRedLines: room.sabotageState.fakeRedLines });
      gameStateEngine.broadcastRoomUpdate(roomCode);
    } else {
      if (callback) callback({ success: false, error: 'Unknown power ID' });
    }
  });

  // Submit Subcode Solution Fix
  socket.on('submit_subcode_fix', ({ roomCode, code }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      if (callback) callback({ success: false, error: 'Room not found' });
      return;
    }

    const activeEntry = room.sabotageState?.activeSubcodes?.[socket.id];
    if (!activeEntry) {
      if (callback) callback({ success: false, error: 'No active subcode challenge' });
      return;
    }

    const player = room.players.get(socket.id);
    const lang = room.settings.language || 'javascript';
    const isFixed = subcodes.verifySubcodeFix(lang, activeEntry.challenge.id, code);

    if (isFixed) {
      delete room.sabotageState.activeSubcodes[socket.id];
      auditLogger.logEvent(roomCode, {
        type: 'SUBCODE_RESOLVED',
        authorName: player ? player.name : 'Operative',
        authorId: player ? player.id : socket.id,
        detail: `✅ ${player ? player.name : 'Operative'} successfully debugged their Subcode Outbreak challenge!`
      });

      if (callback) callback({ success: true });
      socket.emit('subcode_resolved');
      gameStateEngine.broadcastRoomUpdate(roomCode);
    } else {
      if (callback) callback({ success: false, error: 'Incorrect fix. Inspect your code changes!' });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const res = roomManager.removePlayer(socket.id);
    if (res) {
      const { room, player } = res;
      auditLogger.logEvent(room.code, {
        type: 'PLAYER_LEFT',
        authorName: player.name,
        authorId: player.id,
        detail: `${player.name} left the room.`
      });
      gameStateEngine.broadcastRoomUpdate(room.code);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Code Mafia Backend Server] Listening on http://localhost:${PORT}`);
});
