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
