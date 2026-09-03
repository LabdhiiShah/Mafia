import React, { useState } from 'react';
import { ProfileHeader } from './ProfileHeader';
import { StatCard } from './StatCard';
import { Achievements } from './Achievements';
import { MatchHistory } from './MatchHistory';
import { EditProfileDialog } from './EditProfileDialog';

export function ProfilePage({ onBackToGame }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#5a1a9e] to-[#2a1d3f] p-4 sm:p-8 md:p-12 pb-24 text-[#fffaf0]">
      <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
        
        {/* Navigation / Back Button */}
        <div className="flex items-center justify-between">
          <button 
            type="button"
            onClick={onBackToGame}
            className="inline-flex items-center gap-2 font-pixel text-[10px] sm:text-xs text-[#a99fd6] hover:text-[#fffaf0] hover:-translate-x-1 transition-all bg-transparent border-none cursor-pointer"
          >
            <span>&lt;</span> Back to Game
          </button>
          <h1 className="font-pixel text-xl sm:text-2xl text-[#ffb3f0] [text-shadow:3px_3px_0_#6d1c96] animate-bob">PLAYER PROFILE</h1>
        </div>

        {/* Header Section */}
        <ProfileHeader 
          onEditProfile={() => setIsEditOpen(true)}
          onSettings={() => setIsSettingsOpen(true)}
        />
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b-4 border-purple-500/40">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'history', label: 'Match History' },
            { id: 'achievements', label: 'Achievements' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-pixel text-[10px] uppercase whitespace-nowrap transition-all duration-300 cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-[#c87ae8] text-[#1a1026] border-t-4 border-l-4 border-r-4 border-[#ffb3f0] translate-y-1 shadow-[0_-4px_0_#6d1c96_inset]' 
                  : 'bg-[#2a1d3f]/80 text-[#a99fd6] hover:bg-[#5a1a9e] hover:text-[#fffaf0] hover:-translate-y-1 border-4 border-transparent hover:border-[#8b2ba6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex flex-col gap-12 mt-4">
          
          {activeTab === 'overview' && (
            <>
              {/* Player Performance */}
              <section className="flex flex-col gap-4">
                <h2 className="font-pixel text-lg text-[#ffb3f0] mb-2 [text-shadow:1px_1px_0_#6d1c96]">Player Performance</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Games Played" value={142} subtitle="Total Matches" />
                  <StatCard title="Win Rate" value="68%" subtitle="Overall" className="text-purple-300" />
                  <StatCard title="Current Streak" value={3} subtitle="Wins" />
                  <StatCard title="Best Streak" value={12} subtitle="Wins" />
                  <StatCard title="Bugs Fixed" value={845} />
                  <StatCard title="Tests Passed" value="1.2k" />
                  <StatCard title="Avg Debug Time" value="4m 12s" />
                  <StatCard title="Total XP" value="12,450" className="text-purple-300" />
                </div>
              </section>

              {/* Code Mastery */}
              <section className="flex flex-col gap-4">
                <h2 className="font-pixel text-lg text-[#ffb3f0] mb-2 [text-shadow:1px_1px_0_#6d1c96]">Code Mastery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard title="Favorite Language" value="TypeScript" subtitle="45 Matches" className="bg-[#1e40af]/40 border-[#3b82f6] text-[#93c5fd] shadow-[4px_4px_0_#1e3a8a] hover:border-[#60a5fa] hover:shadow-[6px_6px_0_#2563eb]" />
                  <StatCard title="Highest Win Rate" value="Rust" subtitle="82% Win Rate" className="bg-[#b91c1c]/40 border-[#ef4444] text-[#fca5a5] shadow-[4px_4px_0_#7f1d1d] hover:border-[#f87171] hover:shadow-[6px_6px_0_#dc2626]" />
                  <StatCard title="Preferred Diff" value="Hard" subtitle="Played 80 times" className="bg-[#b45309]/40 border-[#f59e0b] text-[#fde68a] shadow-[4px_4px_0_#78350f] hover:border-[#fbbf24] hover:shadow-[6px_6px_0_#d97706]" />
                </div>
              </section>

              {/* Code Mafia Stats */}
              <section className="flex flex-col gap-4">
                <h2 className="font-pixel text-lg text-[#ffd84a] mb-2 [text-shadow:1px_1px_0_#b45309]">Code Mafia Stats</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard title="Developer Wins" value={85} />
                  <StatCard title="Mafia Wins" value={12} />
                  <StatCard title="Regressions" value={34} subtitle="Detected" />
                  <StatCard title="Sabotages" value={15} subtitle="Successful" />
                </div>
                <p className="font-pixel text-[8px] text-[#a99fd6] mt-2">* Note: Hidden rule statistics from active matches are not displayed.</p>
              </section>
            </>
          )}

          {activeTab === 'history' && (
            <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="font-pixel text-lg text-[#ffb3f0] mb-2 [text-shadow:1px_1px_0_#6d1c96]">Match History</h2>
              <MatchHistory />
            </section>
          )}

          {activeTab === 'achievements' && (
            <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="font-pixel text-lg text-[#ffb3f0] mb-2 [text-shadow:1px_1px_0_#6d1c96]">Achievements</h2>
              <Achievements />
            </section>
          )}

        </div>
      </div>
      
      {/* Dialogs */}
      {isEditOpen && (
        <EditProfileDialog 
          onClose={() => setIsEditOpen(false)} 
          onSave={() => console.log('Saved profile')} 
        />
      )}
      
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border-4 border-purple-500/40 bg-[#1a0b2e] p-6 shadow-[8px_8px_0_#5a1a9e] flex flex-col gap-6 animate-pop">
            <h2 className="font-pixel text-xl uppercase text-white">Settings</h2>
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-4 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-purple-500" defaultChecked />
                <span className="font-pixel text-[10px] text-white">Sound Effects</span>
              </label>
              <label className="flex items-center gap-4 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-purple-500" defaultChecked />
                <span className="font-pixel text-[10px] text-white">Push Notifications</span>
              </label>
              <label className="flex items-center gap-4 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-purple-500" />
                <span className="font-pixel text-[10px] text-white">Streamer Mode (Hide ID)</span>
              </label>
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t-2 border-purple-500/20">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 border-2 border-red-500 text-red-400 font-pixel text-[10px] hover:bg-red-500/10 cursor-pointer"
              >
                Logout
              </button>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 border-2 border-purple-400 bg-purple-600 font-pixel text-[10px] text-white hover:bg-purple-500 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
    </main>
  );
}

export default ProfilePage;
