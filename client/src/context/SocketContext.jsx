import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '/';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activeFile, setActiveFile] = useState('');
  const [codeFiles, setCodeFiles] = useState({});
  const [testResults, setTestResults] = useState(null);
  const [eliminationResult, setEliminationResult] = useState(null);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [unlockedHints, setUnlockedHints] = useState([]);
  const [activeSubcodeChallenge, setActiveSubcodeChallenge] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_URL, { autoConnect: true, reconnectionAttempts: 5 });

    s.on('connect', () => {
      console.log('Connected to Code Mafia Backend socket:', s.id);
      setError(null);
    });

    s.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setError('Cannot connect to backend server on http://localhost:4000');
    });

    s.on('room_state_update', (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.files) {
        setCodeFiles(updatedRoom.files);
        if (!activeFile || !updatedRoom.files[activeFile]) {
          setActiveFile(Object.keys(updatedRoom.files)[0]);
        }
      }
      if (updatedRoom.testResults) {
        setTestResults(updatedRoom.testResults);
      }
    });

    s.on('timer_tick', ({ timerSeconds: sec }) => {
      setTimerSeconds(sec);
    });

    s.on('code_updated', ({ filename, content }) => {
      setCodeFiles(prev => ({ ...prev, [filename]: content }));
    });

    s.on('cursor_updated', ({ socketId, playerName, color, cursor }) => {
      setRemoteCursors(prev => ({
        ...prev,
        [socketId]: { playerName, color, cursor }
      }));
    });

    s.on('test_results_updated', ({ results }) => {
      setTestResults(results);
    });

    s.on('hint_unlocked', (hintPayload) => {
      setUnlockedHints(prev => [...prev, hintPayload]);
    });

    s.on('subcode_sabotage_start', (subcodePayload) => {
      setActiveSubcodeChallenge(subcodePayload);
    });

    s.on('subcode_resolved', () => {
      setActiveSubcodeChallenge(null);
    });

    s.on('chat_received', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    s.on('elimination_result', (result) => {
      setEliminationResult(result);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const createRoom = (playerName, avatar, options) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        const errMsg = 'Backend server (http://localhost:4000) is not connected.';
        setError(errMsg);
        return resolve({ success: false, error: errMsg });
      }

      let ackReceived = false;
      const timeout = setTimeout(() => {
        if (!ackReceived) {
          setError('Server response timed out. Please try again.');
          resolve({ success: false, error: 'Server response timed out' });
        }
      }, 4000);

      socket.emit('create_room', { playerName, avatar, options }, (response) => {
        ackReceived = true;
        clearTimeout(timeout);

        if (response && response.success) {
          setRoom(response.room);
          setCodeFiles(response.room.files);
          setActiveFile(Object.keys(response.room.files)[0]);
          setError(null);
          resolve({ success: true, room: response.room });
        } else {
          const err = response ? response.error : 'Failed to create room';
          setError(err);
          resolve({ success: false, error: err });
        }
      });
    });
  };

  const joinRoom = (roomCode, playerName, avatar) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        const errMsg = 'Backend server (http://localhost:4000) is not connected.';
        setError(errMsg);
        return resolve({ success: false, error: errMsg });
      }

      let ackReceived = false;
      const timeout = setTimeout(() => {
        if (!ackReceived) {
          setError('Server response timed out.');
          resolve({ success: false, error: 'Server response timed out' });
        }
      }, 4000);

      socket.emit('join_room', { roomCode, playerName, avatar }, (response) => {
        ackReceived = true;
        clearTimeout(timeout);

        if (response && response.success) {
          setRoom(response.room);
          setCodeFiles(response.room.files);
          setActiveFile(Object.keys(response.room.files)[0]);
          setError(null);
          resolve({ success: true, room: response.room });
        } else {
          const err = response ? response.error : 'Failed to join room';
          setError(err);
          resolve({ success: false, error: err });
        }
      });
    });
  };

  const quickMatch = (playerName, avatar, options = {}) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        const errMsg = 'Backend server is not connected.';
        setError(errMsg);
        return resolve({ success: false, error: errMsg });
      }

      let ackReceived = false;
      const timeout = setTimeout(() => {
        if (!ackReceived) {
          setError('Quick match timed out.');
          resolve({ success: false, error: 'Quick match timed out' });
        }
      }, 5000);

      socket.emit('quick_match', { playerName, avatar, ...options }, (response) => {
        ackReceived = true;
        clearTimeout(timeout);

        if (response && response.success) {
          setRoom(response.room);
          setCodeFiles(response.room.files);
          setActiveFile(Object.keys(response.room.files)[0]);
          setError(null);
          resolve({ success: true, room: response.room });
        } else {
          const err = response ? response.error : 'Failed to find quick match';
          setError(err);
          resolve({ success: false, error: err });
        }
      });
    });
  };

  const toggleReady = () => {
    if (room) socket.emit('toggle_ready', { roomCode: room.code });
  };

  const startGame = () => {
    if (room) {
      if (socket && socket.connected) {
        socket.emit('start_game', { roomCode: room.code });
      } else {
        setRoom(prev => prev ? { ...prev, status: 'CODING_PHASE' } : null);
      }
    }
  };

  const updateCode = (filename, content) => {
    setCodeFiles(prev => ({ ...prev, [filename]: content }));
    if (room) {
      socket.emit('code_edit', { roomCode: room.code, filename, content });
    }
  };

  const switchFile = (filename) => {
    setActiveFile(filename);
    if (room) {
      socket.emit('switch_file', { roomCode: room.code, filename });
    }
  };

  const sendCursor = (filename, line, column) => {
    if (room) {
      socket.emit('cursor_move', { roomCode: room.code, filename, line, column });
    }
  };

  const runTests = (isRiskyRun = false) => {
    return new Promise((resolve) => {
      if (!room) return resolve(null);
      socket.emit('run_tests', { roomCode: room.code, isRiskyRun }, (res) => {
        setTestResults(res);
        resolve(res);
      });
    });
  };

  const buyHint = (hintType) => {
    return new Promise((resolve) => {
      if (!room) return resolve({ success: false });
      socket.emit('buy_hint', { roomCode: room.code, hintType }, (res) => {
        resolve(res);
      });
    });
  };

  const submitVote = (targetSocketId) => {
    if (room) {
      socket.emit('submit_vote', { roomCode: room.code, targetSocketId });
    }
  };

  const sendChat = (message) => {
    if (room && message.trim()) {
      socket.emit('send_chat', { roomCode: room.code, message });
    }
  };

  const fetchAuditLogs = async () => {
    if (!room) return [];
    try {
      const res = await fetch(`${SOCKET_URL}api/room/${room.code}/logs`);
      const logs = await res.json();
      setAuditLogs(logs);
      return logs;
    } catch (err) {
      return [];
    }
  };

  const fetchFileDiffs = async (filename) => {
    if (!room) return [];
    try {
      const res = await fetch(`${SOCKET_URL}api/room/${room.code}/diffs/${filename}`);
      return await res.json();
    } catch (err) {
      return [];
    }
  };

  const triggerMafiaSabotage = (powerId, targetData = {}) => {
    return new Promise((resolve) => {
      if (!room || !socket) return resolve({ success: false, error: 'Not connected' });
      socket.emit('mafia_trigger_sabotage', { roomCode: room.code, powerId, targetData }, (res) => {
        resolve(res || { success: false });
      });
    });
  };

  const submitSubcodeFix = (code) => {
    return new Promise((resolve) => {
      if (!room || !socket) return resolve({ success: false, error: 'Not connected' });
      socket.emit('submit_subcode_fix', { roomCode: room.code, code }, (res) => {
        if (res && res.success) {
          setActiveSubcodeChallenge(null);
        }
        resolve(res || { success: false });
      });
    });
  };

  const myPlayer = room && socket ? room.players.find(p => p.socketId === socket.id) : null;

  const clearEliminationResult = () => {
    setEliminationResult(null);
  };

  return (
    <SocketContext.Provider value={{
      socket,
      room,
      myPlayer,
      chatMessages,
      timerSeconds,
      activeFile,
      codeFiles,
      testResults,
      eliminationResult,
      clearEliminationResult,
      remoteCursors,
      auditLogs,
      unlockedHints,
      activeSubcodeChallenge,
      setActiveSubcodeChallenge,
      triggerMafiaSabotage,
      submitSubcodeFix,
      error,
      setError,
      createRoom,
      joinRoom,
      quickMatch,
      toggleReady,
      startGame,
      updateCode,
      switchFile,
      sendCursor,
      runTests,
      buyHint,
      submitVote,
      sendChat,
      fetchAuditLogs,
      fetchFileDiffs
    }}>
      {children}
    </SocketContext.Provider>
  );
};
