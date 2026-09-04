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
app.get('/api/leaderboard', async (req, res) => {
  try {
    const list = await db.getLeaderboard();
    res.json(list);
  } catch (err) {
    res.status(500).json([]);
  }
});

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

app.get('/api/user/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await db.getUserProfile(username);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/user/profile', async (req, res) => {
  try {
    const { currentUsername, newUsername, avatar, preferred_language, preferred_difficulty } = req.body;
    const updated = await db.updateUserProfile(currentUsername || newUsername, {
      newUsername,
      avatar,
      preferred_language,
      preferred_difficulty
    });
    res.json({ success: true, profile: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
        detail: `Room ${room.code} created (${room.settings.challengeName} - ${room.settings.language.toUpperCase()})`
      });
      db.saveAuditLog(room.code, 'ROOM_CREATED', 'Anonymous', `Room ${room.code} created`);

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
        // Check if player is reconnecting to an ongoing or finished room (match by handle or socket)
        let existingPlayer = Array.from(room.players.values()).find(
          p => p.name === playerName || p.socketId === socket.id
        );

        if (existingPlayer) {
          if (existingPlayer.socketId !== socket.id) {
            room.players.delete(existingPlayer.socketId);
            existingPlayer.socketId = socket.id;
            room.players.set(socket.id, existingPlayer);
          }
          socket.join(room.code);
          const serialized = roomManager.serializeRoom(room, socket.id);
          if (callback) callback({ success: true, room: serialized, reconnected: true });
          gameStateEngine.broadcastRoomUpdate(room.code);
          return;
        }

        if (room.status === 'GAME_OVER') {
          socket.join(room.code);
          const serialized = roomManager.serializeRoom(room, socket.id);
          if (callback) callback({ success: true, room: serialized });
          return;
        }

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
        detail: `Player connected to room ${room.code}.`
      });
      db.saveAuditLog(room.code, 'PLAYER_JOINED', 'Anonymous', `Player connected to room ${room.code}.`);

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
        detail: `Player connected to public room ${room.code} via Quick Match.`
      });
      db.saveAuditLog(room.code, 'PLAYER_JOINED', 'Anonymous', `Player connected to public room ${room.code} via Quick Match.`);

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

    let player = room.players.get(socket.id);
    if (!player) {
      player = Array.from(room.players.values()).find(p => p.socketId === socket.id || p.id === socket.id);
    }
    if (player) {
      player.isReady = !player.isReady;
      gameStateEngine.broadcastRoomUpdate(roomCode);
    }
  });

  // Start Game
  socket.on('start_game', ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    let player = room.players.get(socket.id);
    if (!player) {
      player = Array.from(room.players.values()).find(p => p.socketId === socket.id || p.id === socket.id || p.isHost);
    }
    const isHost = player && (player.isHost || room.hostId === player.id || room.hostId === player.socketId);
    if (isHost) {
      db.saveAuditLog(roomCode, 'GAME_STARTED', 'Anonymous', `Game match started.`);
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
        detail: `🧪 Risky Test Run failed! -15s Sprint Timer penalty applied!`
      });
    }

    auditLogger.logTestRun(roomCode, player.id, player.name, results);
    db.saveAuditLog(roomCode, 'TEST_RUN', 'Anonymous', `Ran tests (${isRiskyRun ? 'RISKY RUN' : 'NORMAL'}): ${results.passed}/${results.total} passed (+${xpResult.xpEarned} XP)`);

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
        detail: `Hint (${hintType}) purchased for ${result.cost} XP!`
      });
      db.saveAuditLog(roomCode, 'HINT_UNLOCKED', 'Anonymous', `Purchased ${hintType} hint for ${result.cost} XP.`);

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
      detail: `Anonymous chat message: ${message}`
    });
    db.saveAuditLog(roomCode, 'CHAT_MESSAGE', 'Anonymous', `Anonymous chat message: ${message}`);

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
                detail: `☣️ Subcode Outbreak timer expired! Player eliminated.`
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
        detail: `☣️ MAFIA SABOTAGE: Subcode Outbreak unleashed! Non-Mafia members have 30s to fix subcodes or face elimination!`
      });

      if (callback) callback({ success: true, powerId });
      gameStateEngine.broadcastRoomUpdate(roomCode);

    } else if (powerId === 'chronos_drain') {
      room.timerSeconds = Math.max(0, room.timerSeconds - 10);

      auditLogger.logEvent(roomCode, {
        type: 'MAFIA_SABOTAGE',
        detail: `⏳ MAFIA SABOTAGE: Chronos Drain activated! -10 seconds subtracted from Sprint Timer!`
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
      const xpRes = gamification.recordSubcodeFix(roomCode, socket.id, player ? player.name : 'Operative');
      
      auditLogger.logEvent(roomCode, {
        type: 'SUBCODE_RESOLVED',
        detail: `✅ Subcode Outbreak challenge successfully debugged! (+${xpRes.xpEarned} XP)`
      });

      if (callback) callback({ success: true, xpEarned: xpRes.xpEarned });
      socket.emit('subcode_resolved');
      gameStateEngine.broadcastRoomUpdate(roomCode);
    } else {
      if (callback) callback({ success: false, error: 'Incorrect fix. Inspect your code changes!' });
    }
  });

  // Detective Direct Kill (Vigilante Strike)
  socket.on('detective_direct_kill', ({ roomCode, targetSocketId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      if (callback) callback({ success: false, error: 'Room not found' });
      return;
    }

    let player = room.players.get(socket.id);
    if (!player) {
      for (const p of room.players.values()) {
        if (p.socketId === socket.id || p.id === socket.id || p.role === 'DETECTIVE' || p.role === 'QA_INSPECTOR') {
          player = p;
          break;
        }
      }
    }

    const isDetective = player && player.role !== 'MAFIA' && player.isAlive;
    if (!isDetective) {
      if (callback) callback({ success: false, error: 'Only living Detectives/Civilians can activate Direct Kill' });
      return;
    }

    if (room.status !== 'CODING_PHASE' && room.status !== 'DISCUSSION_PHASE') {
      if (callback) callback({ success: false, error: 'Direct Kill can only be used during Coding or Discussion Phase' });
      return;
    }

    if (!room.detectiveState) {
      room.detectiveState = { usedDirectKill: false, usedProtect: false, protectedSocketId: null, sacrificialSavePending: false, sacrificialSaveAccepted: false, sacrificialSaveVotes: {} };
    }

    if (room.detectiveState.usedDirectKill) {
      if (callback) callback({ success: false, error: 'Direct Kill power has already been used this match' });
      return;
    }

    let targetPlayer = room.players.get(targetSocketId);
    if (!targetPlayer) {
      for (const p of room.players.values()) {
        if (p.socketId === targetSocketId || p.id === targetSocketId || p.name === targetSocketId) {
          targetPlayer = p;
          break;
        }
      }
    }

    if (!targetPlayer || !targetPlayer.isAlive) {
      if (callback) callback({ success: false, error: 'Invalid or already eliminated target' });
      return;
    }

    room.detectiveState.usedDirectKill = true;

    if (targetPlayer.role === 'MAFIA') {
      targetPlayer.isAlive = false;
      room.eliminatedPlayers.push({
        id: targetPlayer.id,
        name: targetPlayer.name,
        role: targetPlayer.role,
        round: room.round
      });

      room.status = 'GAME_OVER';
      room.winner = 'CIVILIANS';
      room.winningReason = `🕵️ DETECTIVE DIRECT KILL SUCCESS: Detective ${player.name} executed Mafia saboteur ${targetPlayer.name}! Civilians win the match!`;

      auditLogger.logEvent(roomCode, {
        type: 'DETECTIVE_KILL_SUCCESS',
        detail: `🕵️ DETECTIVE DIRECT KILL SUCCESS: Detective executed Mafia saboteur!`
      });

      io.to(roomCode).emit('room_announcement', {
        id: uuidv4(),
        type: 'DETECTIVE_KILL_SUCCESS',
        title: '🕵️ DIRECT KILL SUCCESS!',
        message: 'Mafia was killed by Detective! Civilians win the match!',
        sprite: '/sprites/detective.png',
        icon: '🎯',
        theme: 'EMERALD'
      });

      if (callback) callback({ success: true, isMafia: true, targetName: targetPlayer.name });
      gameStateEngine.endGame(roomCode);
    } else {
      // Innocent Misfire: Both target AND Detective are eliminated!
      targetPlayer.isAlive = false;
      player.isAlive = false;

      room.eliminatedPlayers.push({
        id: targetPlayer.id,
        name: targetPlayer.name,
        role: targetPlayer.role,
        round: room.round
      });

      room.eliminatedPlayers.push({
        id: player.id,
        name: player.name,
        role: player.role,
        round: room.round
      });

      room.detectiveState.sacrificialSavePending = true;
      room.detectiveState.sacrificialSaveVotes = {};

      auditLogger.logEvent(roomCode, {
        type: 'DETECTIVE_MISFIRE',
        detail: `💥 DETECTIVE MISFIRE: Detective accidentally executed Innocent! Both have been eliminated!`
      });

      io.to(roomCode).emit('detective_misfire', {
        detectiveName: player.name,
        detectiveSocketId: player.socketId,
        targetName: targetPlayer.name,
        targetSocketId: targetPlayer.socketId
      });

      io.to(roomCode).emit('room_announcement', {
        id: uuidv4(),
        type: 'DETECTIVE_KILL_MISFIRE',
        title: '💥 DETECTIVE MISFIRE & SUICIDE!',
        message: 'Innocent was killed and Detective suicided!',
        sprite: '/sprites/detective.png',
        icon: '💥',
        theme: 'RED'
      });

      if (callback) callback({ success: true, isMafia: false, targetName: targetPlayer.name, detectiveName: player.name });
      gameStateEngine.checkVictoryConditions(roomCode);
      gameStateEngine.broadcastRoomUpdate(roomCode);
    }
  });

  // Detective Protective Shield
  socket.on('detective_protect_player', ({ roomCode, targetSocketId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      if (callback) callback({ success: false, error: 'Room not found' });
      return;
    }

    let player = room.players.get(socket.id);
    if (!player) {
      for (const p of room.players.values()) {
        if (p.socketId === socket.id || p.id === socket.id || p.role === 'DETECTIVE' || p.role === 'QA_INSPECTOR') {
          player = p;
          break;
        }
      }
    }

    const isDetective = player && (player.role === 'DETECTIVE' || player.role === 'QA_INSPECTOR') && player.isAlive;
    if (!isDetective) {
      if (callback) callback({ success: false, error: 'Only living Detectives can activate Protective Shield' });
      return;
    }

    if (!room.detectiveState) {
      room.detectiveState = { usedDirectKill: false, usedProtect: false, protectedSocketId: null, sacrificialSavePending: false, sacrificialSaveAccepted: false, sacrificialSaveVotes: {} };
    }

    let targetPlayer = room.players.get(targetSocketId);
    if (!targetPlayer) {
      for (const p of room.players.values()) {
        if (p.socketId === targetSocketId || p.id === targetSocketId || p.name === targetSocketId) {
          targetPlayer = p;
          break;
        }
      }
    }

    const protTargetId = targetPlayer ? targetPlayer.socketId : targetSocketId;
    room.detectiveState.usedProtect = true;
    room.detectiveState.protectedSocketId = protTargetId;

    auditLogger.logEvent(roomCode, {
      type: 'DETECTIVE_PROTECT',
      detail: `🛡️ Detective activated Protective Shield for this round.`
    });

    if (callback) callback({ success: true, targetName: targetPlayer ? targetPlayer.name : 'Target' });
    gameStateEngine.broadcastRoomUpdate(roomCode);
  });

  // Innocents Revive Power (Sacrificial Save)
  socket.on('vote_sacrificial_save', ({ roomCode, acceptSave, targetChoice, targetReviveId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.detectiveState?.sacrificialSavePending) {
      if (callback) callback({ success: false, error: 'No active revive opportunity' });
      return;
    }

    const player = room.players.get(socket.id);
    if (!player || player.role === 'MAFIA' || !player.isAlive) {
      if (callback) callback({ success: false, error: 'Only living Innocents can use the Revive power' });
      return;
    }

    if (room.votes.has(socket.id)) {
      if (callback) callback({ success: false, error: 'You have already used your vote/revive action for this round' });
      return;
    }

    let choice = targetChoice;
    if (!choice && typeof acceptSave === 'string') choice = acceptSave;
    if (!choice && typeof acceptSave === 'boolean') choice = acceptSave ? 'DETECTIVE' : 'DECLINE';

    if (choice === 'DECLINE') {
      if (callback) callback({ success: true, resurrected: false });
      return;
    }

    const incident = room.detectiveState.misfireIncident;
    let targetPlayer = null;

    if (choice === 'DETECTIVE') {
      targetPlayer = Array.from(room.players.values()).find(p => p.role === 'DETECTIVE' || p.role === 'QA_INSPECTOR' || (incident && p.id === incident.detectiveId));
    } else if (choice === 'INNOCENT') {
      targetPlayer = Array.from(room.players.values()).find(p => incident && (p.id === incident.innocentId || p.socketId === incident.innocentSocketId || p.name === incident.innocentName));
    } else if (targetReviveId) {
      targetPlayer = room.players.get(targetReviveId);
      if (!targetPlayer) {
        for (const p of room.players.values()) {
          if (p.id === targetReviveId || p.socketId === targetReviveId || p.name === targetReviveId) {
            targetPlayer = p;
            break;
          }
        }
      }
    }

    if (!targetPlayer) {
      if (callback) callback({ success: false, error: 'Target player for revive not found' });
      return;
    }

    // Revive target player!
    targetPlayer.isAlive = true;
    room.eliminatedPlayers = (room.eliminatedPlayers || []).filter(p => p.id !== targetPlayer.id && p.name !== targetPlayer.name);

    // Consume voting power for the user who cast the revive
    room.votes.set(socket.id, 'REVIVE_ACTION');

    // Consume revive opportunity so both cannot be revived
    room.detectiveState.sacrificialSavePending = false;
    room.detectiveState.sacrificialSaveAccepted = true;
    room.detectiveState.revivedPlayerId = targetPlayer.id;

    auditLogger.logEvent(roomCode, {
      type: 'REVIVE_SUCCESS',
      detail: `🕯️ INNOCENT REVIVE POWER USED: ${targetPlayer.name} was revived back to life by Innocents!`
    });

    io.to(roomCode).emit('detective_resurrected', {
      detectiveName: targetPlayer.name,
      detectiveSocketId: targetPlayer.socketId,
      revivedRole: targetPlayer.role
    });

    io.to(roomCode).emit('room_announcement', {
      id: uuidv4(),
      type: 'PLAYER_REVIVED',
      title: '🕯️ PLAYER REVIVED!',
      message: `${targetPlayer.name} has been revived and returned to the team!`,
      sprite: '/sprites/detective.png',
      icon: '✨',
      theme: 'EMERALD'
    });

    if (callback) callback({ success: true, resurrected: true, revivedName: targetPlayer.name });
    gameStateEngine.broadcastRoomUpdate(roomCode);
  });

  // Play Again (Reset Room to Lobby)
  socket.on('play_again', ({ roomCode }, callback) => {
    const room = roomManager.resetRoomToLobby(roomCode);
    if (room) {
      if (callback) callback({ success: true });
      gameStateEngine.broadcastRoomUpdate(roomCode);
    } else {
      if (callback) callback({ success: false, error: 'Room not found' });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const res = roomManager.removePlayer(socket.id);
    if (res) {
      const { room, player } = res;
      auditLogger.logEvent(room.code, {
        type: 'PLAYER_LEFT',
        detail: `Player disconnected from room.`
      });
      gameStateEngine.broadcastRoomUpdate(room.code);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Code Mafia Backend Server] Listening on http://localhost:${PORT}`);
});
