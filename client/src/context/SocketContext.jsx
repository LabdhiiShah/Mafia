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
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
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

    s.on('room_announcement', (announcementPayload) => {
      setActiveAnnouncement(announcementPayload);
    });

    s.on('detective_misfire', ({ detectiveName, detectiveSocketId, targetName, targetSocketId }) => {
      setRoom(prevRoom => {
        if (!prevRoom) return null;
        const updatedPlayers = (Array.isArray(prevRoom.players) ? prevRoom.players : []).map(p => {
          if (p.socketId === targetSocketId || p.socketId === detectiveSocketId || p.name === targetName || p.name === detectiveName) {
            return { ...p, isAlive: false };
          }
          return p;
        });
        return {
          ...prevRoom,
          players: updatedPlayers,
          detectiveState: {
            ...(prevRoom.detectiveState || {}),
            usedDirectKill: true,
            sacrificialSavePending: true
          }
        };
      });
    });

    s.on('detective_resurrected', ({ detectiveName, detectiveSocketId }) => {
      setRoom(prevRoom => {
        if (!prevRoom) return null;
        const updatedPlayers = (Array.isArray(prevRoom.players) ? prevRoom.players : []).map(p => {
          if (p.role === 'DETECTIVE' || p.role === 'QA_INSPECTOR' || p.socketId === detectiveSocketId || p.name === detectiveName) {
            return { ...p, isAlive: true };
          }
          return p;
        });
        return {
          ...prevRoom,
          players: updatedPlayers,
          detectiveState: {
            ...(prevRoom.detectiveState || {}),
            sacrificialSavePending: false,
            sacrificialSaveAccepted: true
          }
        };
      });
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
      const emitJoin = () => {
        let ackReceived = false;
        const timeout = setTimeout(() => {
          if (!ackReceived) {
            resolve({ success: false, error: 'Server response timed out' });
          }
        }, 1200);

        socket.emit('join_room', { roomCode, playerName, avatar }, (response) => {
          ackReceived = true;
          clearTimeout(timeout);

          if (response && response.success) {
            setRoom(response.room);
            if (response.room.files) {
              setCodeFiles(response.room.files);
              setActiveFile(Object.keys(response.room.files)[0]);
            }
            setError(null);
            resolve({ success: true, room: response.room });
          } else {
            resolve({ success: false, error: response?.error || 'Failed to join room' });
          }
        });
      };

      if (socket && socket.connected) {
        emitJoin();
      } else if (socket) {
        const connectTimer = setTimeout(() => {
          resolve({ success: false, error: 'Socket connection timeout' });
        }, 800);

        socket.once('connect', () => {
          clearTimeout(connectTimer);
          emitJoin();
        });
      } else {
        resolve({ success: false, error: 'No socket instance' });
      }
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
    if (!room) return;
    setRoom(prevRoom => {
      if (!prevRoom) return null;
      const updatedPlayers = (Array.isArray(prevRoom.players) ? prevRoom.players : []).map(p => {
        if (p.socketId === myPlayer?.socketId || p.id === myPlayer?.id || p.name === myPlayer?.name) {
          return { ...p, isReady: !p.isReady };
        }
        return p;
      });
      return { ...prevRoom, players: updatedPlayers };
    });

    if (socket && socket.connected) {
      socket.emit('toggle_ready', { roomCode: room.code });
    }
  };

  const assignRolesLocally = (playersList) => {
    if (!Array.isArray(playersList) || playersList.length === 0) return playersList;
    const total = playersList.length;
    let mafiaCount = total <= 5 ? 1 : total <= 8 ? 2 : 3;
    mafiaCount = Math.min(mafiaCount, Math.floor(total / 2));
    if (mafiaCount < 1) mafiaCount = 1;

    const shuffled = playersList.map(p => ({ ...p }));
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const mafiaNames = [];
    for (let i = 0; i < mafiaCount; i++) {
      shuffled[i].role = 'MAFIA';
      shuffled[i].secretObjective = 'SABOTAGE OBJECTIVE: Introduce subtle bugs into code files and fail hidden test assertions!';
      mafiaNames.push(shuffled[i].name);
    }

    let devStartIndex = mafiaCount;
    if (total >= 2 && devStartIndex < shuffled.length) {
      shuffled[devStartIndex].role = 'DETECTIVE';
      shuffled[devStartIndex].secretObjective = 'INVESTIGATION MISSION: Inspect code diffs closely, track file changes, identify Mafia saboteurs, and lead the team during discussion & voting.';
      devStartIndex++;
    }

    for (let i = devStartIndex; i < shuffled.length; i++) {
      shuffled[i].role = 'CIVILIAN';
      shuffled[i].secretObjective = 'CIVILIAN MISSION: Work with your team to fix code bugs, pass 100% of test suites, and uncover the Mafia!';
    }

    shuffled.forEach(p => {
      p.teammates = p.role === 'MAFIA' ? mafiaNames : [];
    });

    return shuffled;
  };

  const startGame = () => {
    if (!room) return;
    setRoom(prevRoom => {
      if (!prevRoom) return null;
      const playersWithRoles = (prevRoom.players && prevRoom.players.some(p => p.role && p.role !== 'HIDDEN'))
        ? prevRoom.players
        : assignRolesLocally(prevRoom.players || []);
      return {
        ...prevRoom,
        status: 'ROLE_REVEAL',
        timerSeconds: 10,
        round: 1,
        players: playersWithRoles
      };
    });

    if (socket && socket.connected) {
      socket.emit('start_game', { roomCode: room.code });
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
      const baseUrl = SOCKET_URL.endsWith('/') ? SOCKET_URL.slice(0, -1) : SOCKET_URL;
      const res = await fetch(`${baseUrl}/api/room/${room.code}/logs`);
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
      const baseUrl = SOCKET_URL.endsWith('/') ? SOCKET_URL.slice(0, -1) : SOCKET_URL;
      const res = await fetch(`${baseUrl}/api/room/${room.code}/diffs/${filename}`);
      return await res.json();
    } catch (err) {
      return [];
    }
  };

  const triggerMafiaSabotage = (powerId, targetData = {}) => {
    return new Promise((resolve) => {
      if (!room) return resolve({ success: false, error: 'Not in a room' });

      // If power is Chronos Drain (-10s), subtract 10s immediately from timer
      if (powerId === 'chronos_drain') {
        setTimerSeconds(prev => Math.max(0, prev - 10));
        setRoom(prev => {
          if (!prev) return null;
          return {
            ...prev,
            timerSeconds: Math.max(0, (prev.timerSeconds || 0) - 10),
            sabotageState: {
              ...(prev.sabotageState || {}),
              usedPowers: [...(prev.sabotageState?.usedPowers || []), 'chronos_drain']
            }
          };
        });
      }

      if (socket && socket.connected) {
        socket.emit('mafia_trigger_sabotage', { roomCode: room.code, powerId, targetData }, (res) => {
          if (res && res.success && res.newTimer !== undefined) {
            setTimerSeconds(res.newTimer);
            setRoom(prev => prev ? { ...prev, timerSeconds: res.newTimer } : null);
          }
          resolve(res || { success: false });
        });
      } else {
        resolve({ success: true, powerId });
      }
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

  const triggerDetectiveKill = (targetSocketId) => {
    return new Promise((resolve) => {
      if (!room) return resolve({ success: false, error: 'Not in a room' });

      const playerList = Array.isArray(room.players) ? room.players : [];
      const targetPlayer = playerList.find(p => p.socketId === targetSocketId || p.id === targetSocketId || p.name === targetSocketId);
      const isTargetMafia = targetPlayer?.role === 'MAFIA';

      const applyKillLocally = (isMafia) => {
        setRoom(prevRoom => {
          if (!prevRoom) return null;
          const updatedPlayers = (Array.isArray(prevRoom.players) ? prevRoom.players : []).map(p => {
            // Target is eliminated
            if (p.socketId === targetSocketId || p.id === targetSocketId || p.name === targetSocketId || p.name === targetPlayer?.name) {
              return { ...p, isAlive: false };
            }
            // On innocent misfire, Detective is also eliminated (suicide)
            if (!isMafia && (p.role === 'DETECTIVE' || p.role === 'QA_INSPECTOR' || p.socketId === myPlayer?.socketId || p.name === myPlayer?.name)) {
              return { ...p, isAlive: false };
            }
            return p;
          });
          return {
            ...prevRoom,
            status: isMafia ? 'GAME_OVER' : prevRoom.status,
            winner: isMafia ? 'CIVILIANS' : prevRoom.winner,
            winningReason: isMafia ? `🕵️ DETECTIVE DIRECT KILL SUCCESS: Executed Mafia saboteur ${targetPlayer?.name || 'Saboteur'}!` : prevRoom.winningReason,
            players: updatedPlayers,
            detectiveState: {
              ...(prevRoom.detectiveState || {}),
              usedDirectKill: true,
              sacrificialSavePending: !isMafia
            }
          };
        });
      };

      if (socket && socket.connected) {
        let isResolved = false;
        const timer = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            applyKillLocally(isTargetMafia);
            resolve({ success: true, isMafia: isTargetMafia, targetName: targetPlayer?.name || 'Operative' });
          }
        }, 3000);

        socket.emit('detective_direct_kill', { roomCode: room.code, targetSocketId }, (res) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timer);
            if (res && res.success) {
              applyKillLocally(res.isMafia);
            }
            resolve(res || { success: true, isMafia: isTargetMafia, targetName: targetPlayer?.name || 'Operative' });
          }
        });
      } else {
        // Fallback local mode execution
        applyKillLocally(isTargetMafia);
        resolve({ success: true, isMafia: isTargetMafia, targetName: targetPlayer?.name || 'Operative' });
      }
    });
  };

  const triggerDetectiveProtect = (targetSocketId) => {
    return new Promise((resolve) => {
      if (!room) return resolve({ success: false, error: 'Not connected' });

      const playerList = Array.isArray(room.players) ? room.players : [];
      const targetPlayer = playerList.find(p => p.socketId === targetSocketId || p.id === targetSocketId || p.name === targetSocketId);

      const applyProtectLocally = () => {
        setRoom(prevRoom => {
          if (!prevRoom) return null;
          return {
            ...prevRoom,
            detectiveState: {
              ...(prevRoom.detectiveState || {}),
              usedProtect: true,
              protectedSocketId: targetPlayer?.socketId || targetSocketId
            }
          };
        });
      };

      if (socket && socket.connected) {
        let isResolved = false;
        const timer = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            applyProtectLocally();
            resolve({ success: true, targetName: targetPlayer?.name || 'Operative' });
          }
        }, 3000);

        socket.emit('detective_protect_player', { roomCode: room.code, targetSocketId }, (res) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timer);
            if (res && res.success) {
              applyProtectLocally();
            }
            resolve(res || { success: true, targetName: targetPlayer?.name || 'Operative' });
          }
        });
      } else {
        applyProtectLocally();
        resolve({ success: true, targetName: targetPlayer?.name || 'Operative' });
      }
    });
  };

  const voteSacrificialSave = (targetChoice) => {
    return new Promise((resolve) => {
      if (!room) return resolve({ success: false, error: 'Not connected' });

      const incident = room.detectiveState?.misfireIncident;
      let choiceType = typeof targetChoice === 'object' ? targetChoice.targetChoice : targetChoice;
      if (typeof targetChoice === 'boolean') {
        choiceType = targetChoice ? 'DETECTIVE' : 'DECLINE';
      }

      const applyReviveLocally = (revivedTargetId) => {
        setRoom(prevRoom => {
          if (!prevRoom) return null;
          const updatedPlayers = (prevRoom.players || []).map(p => {
            if (p.id === revivedTargetId || p.socketId === revivedTargetId || p.name === revivedTargetId) {
              return { ...p, isAlive: true };
            }
            return p;
          });
          return {
            ...prevRoom,
            players: updatedPlayers,
            detectiveState: {
              ...(prevRoom.detectiveState || {}),
              sacrificialSavePending: false,
              sacrificialSaveAccepted: true,
              revivedPlayerId: revivedTargetId
            }
          };
        });
      };

      if (socket && socket.connected) {
        let isResolved = false;
        const timer = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            const fallbackId = choiceType === 'INNOCENT' ? incident?.innocentId : incident?.detectiveId;
            applyReviveLocally(fallbackId);
            resolve({ success: true, resurrected: true });
          }
        }, 3000);

        socket.emit('vote_sacrificial_save', { roomCode: room.code, targetChoice: choiceType, acceptSave: choiceType }, (res) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timer);
            if (res && res.success) {
              applyReviveLocally(res.revivedName || res.resurrectedDetectiveSocketId);
            }
            resolve(res || { success: true });
          }
        });
      } else {
        const fallbackId = choiceType === 'INNOCENT' ? incident?.innocentId : incident?.detectiveId;
        applyReviveLocally(fallbackId);
        resolve({ success: true, resurrected: true });
      }
    });
  };

  const myPlayer = (() => {
    if (!room || !Array.isArray(room.players)) return null;
    let savedUser = null;
    try {
      const raw = localStorage.getItem('code_mafia_user');
      if (raw) savedUser = JSON.parse(raw);
    } catch (e) {}

    let match = room.players.find(p => (socket?.id && (p.socketId === socket.id || p.id === socket.id)));
    if (!match && savedUser?.username) {
      match = room.players.find(p => p.name === savedUser.username);
    }
    if (!match) {
      match = room.players.find(p => p.role && p.role !== 'HIDDEN') || room.players[0] || null;
    }
    return match;
  })();

  const clearEliminationResult = () => {
    setEliminationResult(null);
  };

  const restoreFileVersion = (filename, content) => {
    updateCode(filename, content);
    setActiveFile(filename);
  };

  const playAgain = () => {
    return new Promise((resolve) => {
      if (!room) return resolve({ success: false });

      const resetLocalRoom = (prev) => {
        if (!prev) return null;
        const updatedPlayers = (Array.isArray(prev.players) ? prev.players : []).map(p => ({
          ...p,
          isAlive: true,
          isReady: p.isHost,
          role: null,
          secretObjective: ''
        }));
        return {
          ...prev,
          status: 'LOBBY',
          round: 1,
          winner: null,
          winningReason: '',
          eliminatedPlayers: [],
          players: updatedPlayers,
          sabotageState: { usedPowers: [], fakeRedLines: [], activeSubcodes: {} },
          detectiveState: { usedDirectKill: false, usedProtect: false, protectedSocketId: null, sacrificialSavePending: false, sacrificialSaveAccepted: false }
        };
      };

      if (socket && socket.connected) {
        let isResolved = false;
        const timer = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            setRoom(resetLocalRoom(room));
            resolve({ success: true });
          }
        }, 3000);

        socket.emit('play_again', { roomCode: room.code }, (res) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timer);
            setRoom(resetLocalRoom(room));
            resolve(res || { success: true });
          }
        });
      } else {
        setRoom(resetLocalRoom(room));
        resolve({ success: true });
      }
    });
  };

  return (
    <SocketContext.Provider value={{
      socket,
      room,
      setRoom,
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
      activeAnnouncement,
      setActiveAnnouncement,
      triggerMafiaSabotage,
      submitSubcodeFix,
      restoreFileVersion,
      triggerDetectiveKill,
      triggerDetectiveProtect,
      voteSacrificialSave,
      playAgain,
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
