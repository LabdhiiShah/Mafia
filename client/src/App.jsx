import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { useSocket } from './context/SocketContext';
import RetroScene from './components/Landing/RetroScene';
import LoginPage from './components/Auth/LoginPage';
import SignUpPage from './components/Auth/SignUpPage';
import GameHubPage from './components/Hub/GameHubPage';
import ProfilePage from './components/Profile/ProfilePage';
import RoomLobby from './components/Lobby/RoomLobby';
import GameHeader from './components/Game/GameHeader';
import RoleRevealModal from './components/Game/RoleRevealModal';
import IDEWorkspace from './components/Workspace/IDEWorkspace';
import DiscussionModal from './components/Game/DiscussionModal';
import VotingModal from './components/Game/VotingModal';
import EliminationModal from './components/Game/EliminationModal';
import GameOverScreen from './components/Game/GameOverScreen';
import ErrorBoundary from './components/Common/ErrorBoundary';
import AnnouncementModal from './components/Common/AnnouncementModal';

// Helper component for Landing Route (/)
function LandingRouteWrapper() {
  const navigate = useNavigate();
  useEffect(() => {
    const raw = localStorage.getItem('code_mafia_user');
    const token = localStorage.getItem('code_mafia_token');
    if (raw || token) {
      navigate('/hub', { replace: true });
    }
  }, [navigate]);

  return (
    <RetroScene
      onEnter={(mode) => navigate(mode === 'signup' ? '/signup' : '/login')}
    />
  );
}

// Helper component for Auth Routes (/login, /signup)
function AuthRouteWrapper({ type }) {
  const navigate = useNavigate();
  useEffect(() => {
    const raw = localStorage.getItem('code_mafia_user');
    const token = localStorage.getItem('code_mafia_token');
    if (raw || token) {
      navigate('/hub', { replace: true });
    }
  }, [navigate]);

  if (type === 'signup') {
    return (
      <SignUpPage
        onNavigateToLogin={() => navigate('/login')}
        onSignupSuccess={() => navigate('/hub')}
        onBackToLanding={() => navigate('/')}
      />
    );
  }

  return (
    <LoginPage
      onNavigateToSignup={() => navigate('/signup')}
      onLoginSuccess={() => navigate('/hub')}
      onBackToLanding={() => navigate('/')}
    />
  );
}

// Helper component for Hub routes (/hub, /how-it-works, /leaderboard)
function HubRouteWrapper({ section, onProceedToLobby }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (section === 'how-it-works') {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'leaderboard') {
      const el = document.getElementById('leaderboard');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [section]);

  return (
    <GameHubPage
      onNavigateHome={() => navigate('/')}
      onOpenProfile={() => navigate('/profile')}
      onProceedToLobby={onProceedToLobby}
    />
  );
}

// Helper component for Game Room Route (/room/:code)
function RoomRouteWrapper() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { room, joinRoom, setRoom, setCodeFiles, setActiveFile } = useSocket();
  const [connectTimeout, setConnectTimeout] = useState(false);

  const initFallbackRoom = (targetCode, playerName, avatar) => {
    window._localRooms = window._localRooms || new Map();
    let existingRoom = window._localRooms.get(targetCode);
    if (!existingRoom) {
      existingRoom = {
        code: targetCode,
        status: 'LOBBY',
        timerSeconds: 300,
        settings: {
          challengeId: 'auth-service',
          challengeName: 'JWT Auth & Role Authorization',
          language: 'python',
          difficulty: 'MEDIUM',
          codingDuration: 300,
          discussionDuration: 90,
          votingDuration: 60,
          maxPlayers: 8,
          mafiaCount: 2,
          enableQAInspector: true
        },
        players: [
          { socketId: 'local-user', name: playerName, avatar, isHost: true, isReady: true }
        ],
        files: {
          'cart.py': `# Fix calculation logic for shopping cart\ndef calculate_total(items, tax_rate):\n    total = 0\n    for item in items:\n        total += item['price'] * item['quantity']\n    total += total * tax_rate\n    return round(total, 2)\n`,
          'cart.test.py': `# Test suite\ndef test_calculate_total():\n    items = [{'price': 10, 'quantity': 2}]\n    assert calculate_total(items, 0.1) == 22.0\n`
        }
      };
      window._localRooms.set(targetCode, existingRoom);
    }
    if (setRoom) setRoom(existingRoom);
    if (setCodeFiles) setCodeFiles(existingRoom.files);
    if (setActiveFile) setActiveFile(Object.keys(existingRoom.files)[0]);
    return existingRoom;
  };

  useEffect(() => {
    if (code && (!room || room.code !== code.toUpperCase())) {
      let savedUser = null;
      try {
        const raw = localStorage.getItem('code_mafia_user');
        if (raw) savedUser = JSON.parse(raw);
      } catch (e) {}

      const playerName = savedUser?.username || 'Operative';
      const avatar = savedUser?.avatar || 'avatar_1';
      const targetCode = code.toUpperCase().trim();

      const timer = setTimeout(() => {
        setConnectTimeout(true);
        initFallbackRoom(targetCode, playerName, avatar);
      }, 600);

      joinRoom(targetCode, playerName, avatar).then(res => {
        clearTimeout(timer);
        if (!res || !res.success) {
          initFallbackRoom(targetCode, playerName, avatar);
        }
      });

      return () => clearTimeout(timer);
    }
  }, [code, room?.code]);

  if (!room) {
    let savedUser = null;
    try {
      const raw = localStorage.getItem('code_mafia_user');
      if (raw) savedUser = JSON.parse(raw);
    } catch (e) {}
    const playerName = savedUser?.username || 'Operative';
    const avatar = savedUser?.avatar || 'avatar_1';
    const targetCode = code ? code.toUpperCase().trim() : 'MAFIA-1000';

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-purple-300 font-pixel text-xs space-y-4 p-4 text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span>CONNECTING TO ROOM {targetCode}...</span>

        {connectTimeout && (
          <div className="mt-4 flex flex-col items-center gap-3 animate-fade-in font-mono">
            <span className="text-xs text-amber-300">Server response taking longer than expected.</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => initFallbackRoom(targetCode, playerName, avatar)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-lg shadow-purple-950/50"
              >
                ⚡ ENTER ROOM NOW
              </button>

              <button
                onClick={() => {
                  if (setRoom) setRoom(null);
                  navigate('/hub');
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs transition cursor-pointer"
              >
                ← Return to Game Hub
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (room.status === 'GAME_OVER') {
    return <GameOverScreen />;
  }

  if (room.status === 'LOBBY') {
    return (
      <RoomLobby
        onBackToLanding={() => {
          if (setRoom) setRoom(null);
          navigate('/hub');
        }}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
      <GameHeader />
      <IDEWorkspace />
      {room.status === 'ROLE_REVEAL' && <RoleRevealModal />}
      {room.status === 'DISCUSSION_PHASE' && <DiscussionModal />}
      {room.status === 'VOTING_PHASE' && <VotingModal />}
      <EliminationModal />
      <AnnouncementModal />
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const { room, createRoom, joinRoom, quickMatch, setRoom, setCodeFiles, setActiveFile } = useSocket();

  // Keep URL synced when entering a room
  useEffect(() => {
    if (room && room.code && window.location.pathname.startsWith('/room/')) {
      if (!window.location.pathname.startsWith(`/room/${room.code}`)) {
        navigate(`/room/${room.code}`);
      }
    }
  }, [room, navigate]);

  const mapChallengeId = (lang, diff) => {
    const l = (lang || '').toLowerCase();
    const d = (diff || '').toUpperCase();
    if (l === 'python') return d === 'EASY' ? 'python-pipeline' : 'python-evaluator';
    if (l === 'c') return 'c-memory-buffer';
    if (l === 'c++' || l === 'cpp') return 'cpp-circular-queue';
    if (d === 'MEDIUM') return 'auth-service';
    if (d === 'HARD' || d === 'EXPERT') return 'bank-ledger';
    return 'auth-service';
  };

  const handleProceedToLobby = async (config) => {
    window._localRooms = window._localRooms || new Map();
    let savedUser = null;
    try {
      const raw = localStorage.getItem('code_mafia_user');
      if (raw) savedUser = JSON.parse(raw);
    } catch (e) {}

    const playerName = config?.playerName || savedUser?.username || 'Operative';
    const avatar = savedUser?.avatar || 'avatar_1';
    const durationSeconds = Number(config?.durationSeconds) || 300;
    const maxPlayersCount = Number(config?.players) || 8;

    let res = null;
    if (config?.quickMatch) {
      res = await quickMatch(playerName, avatar);
      if (res && res.success && res.room) {
        navigate(`/room/${res.room.code}`);
        return res;
      }
    }
    if (config?.caseCode && !config?.players) {
      const targetCode = config.caseCode.toUpperCase().trim();
      res = await joinRoom(targetCode, playerName, avatar);

      if (!res || !res.success) {
        let existingRoom = window._localRooms.get(targetCode);
        if (!existingRoom) {
          existingRoom = {
            code: targetCode,
            status: 'LOBBY',
            timerSeconds: durationSeconds,
            settings: {
              challengeId: 'auth-service',
              challengeName: 'JWT Auth & Role Authorization',
              language: 'python',
              difficulty: 'MEDIUM',
              codingDuration: durationSeconds,
              discussionDuration: 90,
              votingDuration: 60,
              maxPlayers: maxPlayersCount,
              mafiaCount: (maxPlayersCount <= 5 ? 1 : maxPlayersCount <= 8 ? 2 : 3),
              enableQAInspector: true
            },
            players: [
              { socketId: 'local-user', name: playerName, avatar, isHost: true, isReady: true }
            ],
            files: {
              'cart.py': `# Fix calculation logic for shopping cart\ndef calculate_total(items, tax_rate):\n    total = 0\n    for item in items:\n        total += item['price'] * item['quantity']\n    total += total * tax_rate\n    return round(total, 2)\n`,
              'cart.test.py': `# Test suite\ndef test_calculate_total():\n    items = [{'price': 10, 'quantity': 2}]\n    assert calculate_total(items, 0.1) == 22.0\n`
            }
          };
          window._localRooms.set(targetCode, existingRoom);
        } else {
          let finalPlayerName = playerName;
          const existingNames = new Set(existingRoom.players.map(p => p.name));
          if (existingNames.has(finalPlayerName)) {
            let counter = 2;
            while (existingNames.has(`${playerName} (${counter})`)) counter++;
            finalPlayerName = `${playerName} (${counter})`;
          }
          existingRoom.players.push({
            socketId: `user-${Date.now()}`,
            name: finalPlayerName,
            avatar,
            isHost: false,
            isReady: false
          });
        }
        if (setRoom) setRoom({ ...existingRoom });
        if (setCodeFiles) setCodeFiles(existingRoom.files);
        if (setActiveFile) setActiveFile(Object.keys(existingRoom.files)[0]);
        navigate(`/room/${targetCode}`);
        return { success: true, room: existingRoom };
      } else if (res.room) {
        navigate(`/room/${res.room.code}`);
      }
    } else {
      const caseCode = config?.caseCode ? config.caseCode.toUpperCase().trim() : ('MAFIA-' + Math.floor(1000 + Math.random() * 9000));
      const selectedChallengeId = mapChallengeId(config?.language, config?.difficulty);
      
      res = await createRoom(playerName, avatar, {
        caseCode,
        isPublic: config?.isPublic !== undefined ? config.isPublic : true,
        challengeId: selectedChallengeId,
        language: config?.language?.toLowerCase() || 'javascript',
        difficulty: config?.difficulty || 'MEDIUM',
        codingDuration: durationSeconds,
        maxPlayers: maxPlayersCount,
        mafiaCount: (maxPlayersCount <= 5 ? 1 : maxPlayersCount <= 8 ? 2 : 3),
        enableQAInspector: true
      });

      if (!res || !res.success) {
        const fallbackRoom = {
          code: caseCode,
          status: 'LOBBY',
          timerSeconds: durationSeconds,
          settings: {
            challengeId: 'auth-service',
            challengeName: 'JWT Auth & Role Authorization',
            language: config?.language?.toLowerCase() || 'python',
            difficulty: config?.difficulty || 'MEDIUM',
            codingDuration: durationSeconds,
            discussionDuration: 90,
            votingDuration: 60,
            maxPlayers: maxPlayersCount,
            mafiaCount: (maxPlayersCount <= 5 ? 1 : maxPlayersCount <= 8 ? 2 : 3),
            enableQAInspector: true
          },
          players: [
            { socketId: 'local-user', name: playerName, avatar, isHost: true, isReady: true }
          ],
          files: {
            'cart.py': `# Fix calculation logic for shopping cart\ndef calculate_total(items, tax_rate):\n    total = 0\n    for item in items:\n        total += item['price'] * item['quantity']\n    total += total * tax_rate\n    return round(total, 2)\n`,
            'cart.test.py': `# Test suite\ndef test_calculate_total():\n    items = [{'price': 10, 'quantity': 2}]\n    assert calculate_total(items, 0.1) == 22.0\n`
          }
        };

        window._localRooms.set(caseCode, fallbackRoom);
        if (setRoom) setRoom(fallbackRoom);
        if (setCodeFiles) setCodeFiles(fallbackRoom.files);
        if (setActiveFile) setActiveFile(Object.keys(fallbackRoom.files)[0]);
        navigate(`/room/${caseCode}`);
        return { success: true, room: fallbackRoom };
      } else if (res.room) {
        navigate(`/room/${res.room.code}`);
      }
    }

    return res;
  };

  return (
    <Routes>
      <Route path="/" element={<LandingRouteWrapper />} />
      <Route path="/login" element={<AuthRouteWrapper type="login" />} />
      <Route path="/signup" element={<AuthRouteWrapper type="signup" />} />
      <Route
        path="/hub"
        element={<HubRouteWrapper onProceedToLobby={handleProceedToLobby} />}
      />
      <Route
        path="/how-it-works"
        element={<HubRouteWrapper section="how-it-works" onProceedToLobby={handleProceedToLobby} />}
      />
      <Route
        path="/leaderboard"
        element={<HubRouteWrapper section="leaderboard" onProceedToLobby={handleProceedToLobby} />}
      />
      <Route
        path="/profile"
        element={<ProfilePage onBackToGame={() => navigate('/hub')} />}
      />
      <Route path="/room/:code" element={<ErrorBoundary><RoomRouteWrapper /></ErrorBoundary>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
