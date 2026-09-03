import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { CreateGameModal } from './CreateGameModal';
import { JoinGameModal } from './JoinGameModal';
import { QuickMatchModal } from './QuickMatchModal';

export function GameHubPage({ onNavigateHome, onOpenProfile, onProceedToLobby }) {
  const [modal, setModal] = useState('none');

  return (
    <main className="min-h-screen w-full relative bg-[#0a0510] overflow-x-hidden selection:bg-purple-500/30">
      <Navbar onNavigateHome={onNavigateHome} onOpenProfile={onOpenProfile} />

      <div className="relative bg-gradient-to-b from-[#0a0510] via-[#1a0b2e] to-[#0a0510]">
        {/* Animated background grid texture */}
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-screen" />
        
        <HeroSection 
          onCreateClick={() => setModal('create')}
          onJoinClick={() => setModal('join')}
          onQuickMatchClick={() => setModal('quick')}
        />
      </div>

      {/* Modals */}
      {modal === 'create' && (
        <CreateGameModal
          onClose={() => setModal('none')}
          onProceedToLobby={(config) => {
            setModal('none');
            if (onProceedToLobby) onProceedToLobby(config);
          }}
        />
      )}
      {modal === 'join' && (
        <JoinGameModal
          onClose={() => setModal('none')}
          onProceedToLobby={(config) => {
            setModal('none');
            if (onProceedToLobby) onProceedToLobby(config);
          }}
        />
      )}
      {modal === 'quick' && (
        <QuickMatchModal
          onClose={() => setModal('none')}
          onProceedToLobby={(config) => {
            setModal('none');
            if (onProceedToLobby) onProceedToLobby(config);
          }}
        />
      )}
    </main>
  );
}

export default GameHubPage;
