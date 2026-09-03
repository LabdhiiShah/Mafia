import React, { useState } from 'react';
import { useSocket } from './context/SocketContext';
import RetroScene from './components/Landing/RetroScene';
import LoginPage from './components/Auth/LoginPage';
import SignUpPage from './components/Auth/SignUpPage';
import GameHubPage from './components/Hub/GameHubPage';
import ProfilePage from './components/Profile/ProfilePage';
import GameHeader from './components/Game/GameHeader';
import RoleRevealModal from './components/Game/RoleRevealModal';
import IDEWorkspace from './components/Workspace/IDEWorkspace';
import DiscussionModal from './components/Game/DiscussionModal';
import VotingModal from './components/Game/VotingModal';
import GameOverScreen from './components/Game/GameOverScreen';

export default function App() {
  const { room, createRoom, joinRoom, setRoom, setCodeFiles, setActiveFile } = useSocket();
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'login' | 'signup' | 'hub' | 'profile' | 'editor'

  // Active Game / IDE Editor Workspace view
  if (room || currentView === 'editor') {
    if (room?.status === 'GAME_OVER') {
      return <GameOverScreen />;
    }

    return (
      <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
        {/* Top Navigation & Live Ticker */}
        <GameHeader />

        {/* Main IDE Workspace Editor */}
        <IDEWorkspace />

        {/* Phase Overlays */}
        {room?.status === 'ROLE_REVEAL' && <RoleRevealModal />}
        {room?.status === 'DISCUSSION_PHASE' && <DiscussionModal />}
        {room?.status === 'VOTING_PHASE' && <VotingModal />}
      </div>
    );
  }

  // Pre-game / Auth views
  if (currentView === 'landing') {
    return (
      <RetroScene
        onEnter={(mode) => {
          if (mode === 'login') {
            setCurrentView('login');
          } else if (mode === 'signup') {
            setCurrentView('signup');
          } else {
            setCurrentView('login');
          }
        }}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onNavigateToSignup={() => setCurrentView('signup')}
        onLoginSuccess={() => setCurrentView('hub')}
        onBackToLanding={() => setCurrentView('landing')}
      />
    );
  }

  if (currentView === 'signup') {
    return (
      <SignUpPage
        onNavigateToLogin={() => setCurrentView('login')}
        onSignupSuccess={() => setCurrentView('hub')}
        onBackToLanding={() => setCurrentView('landing')}
      />
    );
  }

  if (currentView === 'profile') {
    return (
      <ProfilePage
        onBackToGame={() => setCurrentView('hub')}
      />
    );
  }

  // Challenge selector helper based on language and difficulty
  const mapChallengeId = (lang, diff) => {
    const l = (lang || '').toLowerCase();
    const d = (diff || '').toUpperCase();

    if (l === 'python') {
      return d === 'EASY' ? 'python-pipeline' : 'python-evaluator';
    }
    if (l === 'c') {
      return 'c-memory-buffer';
    }
    if (l === 'c++' || l === 'cpp') {
      return 'cpp-circular-queue';
    }
    if (d === 'MEDIUM') return 'auth-service';
    if (d === 'HARD' || d === 'EXPERT') return 'bank-ledger';
    return 'shopping-cart';
  };

  // Single Purple Theme Frontend for Investigation Creation & Joining
  return (
    <GameHubPage
      onNavigateHome={() => setCurrentView('landing')}
      onOpenProfile={() => setCurrentView('profile')}
      onProceedToLobby={async (config) => {
        let res = null;
        if (config?.caseCode && !config?.players) {
          res = await joinRoom(config.caseCode, 'Operative', 'avatar_1');
        } else {
          const selectedChallengeId = mapChallengeId(config?.language, config?.difficulty);
          res = await createRoom('Operative', 'avatar_1', {
            challengeId: selectedChallengeId,
            language: config?.language?.toLowerCase() || 'javascript',
            difficulty: config?.difficulty || 'MEDIUM',
            maxPlayers: config?.players || 8,
            mafiaCount: 2,
            enableQAInspector: true
          });
        }

        if (!res || !res.success) {
          // Fallback room workspace if backend socket fails
          const fallbackRoom = {
            code: config?.caseCode || 'MAFIA-101',
            status: 'CODING_PHASE',
            settings: {
              challengeId: 'shopping-cart',
              challengeName: 'Fix Shopping Cart Calculation & Tax',
              language: config?.language?.toLowerCase() || 'python',
              difficulty: config?.difficulty || 'MEDIUM',
              codingDuration: 900,
              discussionDuration: 90,
              votingDuration: 60,
              maxPlayers: config?.players || 8,
              mafiaCount: 2,
              enableQAInspector: true
            },
            players: [
              { socketId: 'local-user', name: 'Operative', avatar: 'avatar_1', isHost: true, isReady: true }
            ],
            files: {
              'cart.py': `# Fix the calculation logic for the shopping cart\ndef calculate_total(items, tax_rate):\n    total = 0\n    for item in items:\n        total += item['price'] * item['quantity']\n    total += total * tax_rate\n    return round(total, 2)\n`,
              'cart.test.py': `# Test suite\ndef test_calculate_total():\n    items = [{'price': 10, 'quantity': 2}]\n    assert calculate_total(items, 0.1) == 22.0\n`
            }
          };
          if (setRoom) setRoom(fallbackRoom);
          if (setCodeFiles) setCodeFiles(fallbackRoom.files);
          if (setActiveFile) setActiveFile(Object.keys(fallbackRoom.files)[0]);
        }

        setCurrentView('editor');
      }}
    />
  );
}





