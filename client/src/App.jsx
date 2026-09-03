import React, { useState } from 'react';
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
import GameOverScreen from './components/Game/GameOverScreen';

export default function App() {
  const { room } = useSocket();
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'login' | 'signup' | 'hub' | 'profile' | 'lobby'

  // If in room or game, show game/lobby states
  if (room && room.status !== 'LOBBY') {
    if (room.status === 'GAME_OVER') {
      return <GameOverScreen />;
    }

    return (
      <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
        {/* Top Navigation & Live Ticker */}
        <GameHeader />

        {/* Main IDE Workspace */}
        <IDEWorkspace />

        {/* Phase Overlays */}
        {room.status === 'ROLE_REVEAL' && <RoleRevealModal />}
        {room.status === 'DISCUSSION_PHASE' && <DiscussionModal />}
        {room.status === 'VOTING_PHASE' && <VotingModal />}
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

  if (currentView === 'hub') {
    return (
      <GameHubPage
        onNavigateHome={() => setCurrentView('landing')}
        onOpenProfile={() => setCurrentView('profile')}
        onProceedToLobby={() => setCurrentView('lobby')}
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

  return (
    <RoomLobby
      onBackToLanding={() => setCurrentView('landing')}
    />
  );
}




