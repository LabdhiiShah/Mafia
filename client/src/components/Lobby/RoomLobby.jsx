import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import AuthModal from '../Auth/AuthModal';
import { Shield, Skull, Code, Play, User, Users, Copy, Check, Sliders, AlertTriangle, LogIn, LogOut, Award, Trophy, Cpu, Clock, RefreshCw } from 'lucide-react';

const AVATARS = [
  { id: 'avatar_1', name: 'Cyber Ninja', icon: '🥷' },
  { id: 'avatar_2', name: 'Hacker Cat', icon: '🐱‍💻' },
  { id: 'avatar_3', name: 'Robot Dev', icon: '🤖' },
  { id: 'avatar_4', name: 'Ghost Hacker', icon: '👻' },
  { id: 'avatar_5', name: 'Wizard Coder', icon: '🧙‍♂️' },
  { id: 'avatar_6', name: 'Alien Architect', icon: '👽' },
  { id: 'avatar_7', name: 'Detective QA', icon: '🕵️' },
  { id: 'avatar_8', name: 'Skull Saboteur', icon: '💀' },
];

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

const getMafiaCount = (p) => {
  const num = Number(p);
  if (num <= 5) return 1;
  if (num <= 8) return 2;
  return 3;
};

export default function RoomLobby({ initialAuthMode, onBackToLanding }) {
  const { createRoom, joinRoom, room, myPlayer, toggleReady, startGame, error, setError } = useSocket();

  const [mode, setMode] = useState('JOIN');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');
  const [copied, setCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(Boolean(initialAuthMode));
  const [authUser, setAuthUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Room Settings
  const [challengesList, setChallengesList] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [selectedChallenge, setSelectedChallenge] = useState('auth-service');
  const [codingDuration, setCodingDuration] = useState(240);
  const [discussionDuration, setDiscussionDuration] = useState(90);
  const [votingDuration, setVotingDuration] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [enableQAInspector, setEnableQAInspector] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/challenges`)
      .then(res => res.json())
      .then(data => {
        setChallengesList(data);
        if (data.length > 0) setSelectedChallenge(data[0].id);
      })
      .catch(() => {});

    const token = localStorage.getItem('code_mafia_token');
    if (token) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setAuthUser(data.user);
            setPlayerName(data.user.username);
            setSelectedAvatar(data.user.avatar || 'avatar_1');
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (challengesList.length === 0) return;
    const filtered = selectedLanguage === 'ALL'
      ? challengesList
      : challengesList.filter(c => c.language === selectedLanguage.toLowerCase());

    if (filtered.length > 0 && !filtered.some(c => c.id === selectedChallenge)) {
      setSelectedChallenge(filtered[0].id);
    }
  }, [selectedLanguage, challengesList]);

  const filteredChallenges = selectedLanguage === 'ALL'
    ? challengesList
    : challengesList.filter(c => c.language === selectedLanguage.toLowerCase());

  const handleAuthSuccess = (user) => {
    setAuthUser(user);
    setPlayerName(user.username);
    if (user.avatar) setSelectedAvatar(user.avatar);
  };

  const handleLogout = () => {
    localStorage.removeItem('code_mafia_token');
    setAuthUser(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter your developer handle');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    await createRoom(playerName.trim(), selectedAvatar, {
      challengeId: selectedChallenge,
      codingDuration: Number(codingDuration),
      discussionDuration: Number(discussionDuration),
      votingDuration: Number(votingDuration),
      maxPlayers: Number(maxPlayers),
      mafiaCount: getMafiaCount(maxPlayers),
      enableQAInspector
    });

    setIsSubmitting(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) {
      setError('Please enter your name and a valid 4-digit room code');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    await joinRoom(roomCode.trim(), playerName.trim(), selectedAvatar);
    setIsSubmitting(false);
  };

  const copyRoomCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (room) {
    const playersList = Array.isArray(room.players) ? room.players : [];
    const settings = room.settings || {};
    const maxPlayersCount = settings.maxPlayers || 8;
    const isHost = Boolean(myPlayer?.isHost || room?.hostId === myPlayer?.id || room?.hostId === myPlayer?.socketId);
    const hasFullTeam = playersList.length >= maxPlayersCount;
    const readyPlayersCount = playersList.filter(p => p.isReady).length;
    const allOthersReady = playersList.filter(p => !p.isHost).every(p => p.isReady);
    const canLaunch = hasFullTeam && allOthersReady;

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top Banner */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Skull className="w-3.5 h-3.5" /> Lobby Active
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Challenge: <strong className="text-slate-200">{settings.challengeName || 'JWT Auth & Authorization'}</strong> ({settings.language?.toUpperCase() || 'PYTHON'})
                </span>
              </div>
              <h1 className="text-3xl font-extrabold mt-1 tracking-tight text-white flex items-center gap-2">
                CODE MAFIA <span className="text-slate-500 text-lg font-normal">| Waiting Room</span>
              </h1>
            </div>

            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl">
              <span className="text-xs text-slate-400 font-mono">ROOM CODE:</span>
              <span className="font-mono text-2xl font-bold tracking-widest text-red-400">{room.code}</span>
              <button
                onClick={copyRoomCode}
                className="ml-2 p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Lobby Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" /> Connected Developers ({playersList.length}/{maxPlayersCount})
                </h3>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  {canLaunch ? 'Full Team Ready! Host Can Launch' : !hasFullTeam ? `Requires ${maxPlayersCount} Players to Launch (${playersList.length}/${maxPlayersCount})` : `Waiting for Ready (${readyPlayersCount}/${maxPlayersCount})`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {playersList.map((p) => {
                  const avatarObj = AVATARS.find(a => a.id === p.avatar) || AVATARS[0];
                  return (
                    <div
                      key={p.socketId}
                      className={`flex items-center justify-between p-3 rounded-lg border transition ${
                        p.socketId === myPlayer?.socketId
                          ? 'bg-blue-950/20 border-blue-500/40'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{avatarObj.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm flex items-center gap-1.5 flex-wrap">
                            <span className="truncate max-w-[110px] font-bold text-white" title={p.name}>{p.name}</span>
                            {p.isHost && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-500/30 shrink-0 inline-flex items-center">
                                HOST
                              </span>
                            )}
                            <span className="text-[10px] bg-purple-950/60 text-purple-300 px-1.5 py-0.5 rounded font-mono border border-purple-800 shrink-0 inline-flex items-center">
                              ⭐ {p.xp || 0} XP
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                            {p.socketId === myPlayer?.socketId ? '(You)' : 'Developer'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border shrink-0 ${
                          p.isReady
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {p.isReady ? 'READY' : 'NOT READY'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Room Config Summary */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Sliders className="w-4 h-4 text-purple-400" /> Configured Rules
                </h3>
                <div className="space-y-2 text-xs font-mono text-slate-400">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>Language:</span>
                    <span className="text-blue-400 font-bold uppercase">{settings.language || 'PYTHON'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>Difficulty:</span>
                    <span className="text-amber-400 font-bold">{settings.difficulty || 'MEDIUM'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>Sprint Timer:</span>
                    <span className="text-slate-200">{settings.codingDuration || 300}s</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>Discussion:</span>
                    <span className="text-slate-200">{settings.discussionDuration || 90}s</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>Voting Timer:</span>
                    <span className="text-slate-200">{settings.votingDuration || 60}s</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>Mafia Count:</span>
                    <span className="text-red-400 font-bold">{settings.mafiaCount || 1} Saboteur</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Public & Hidden Test Assertions Enabled
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={toggleReady}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                myPlayer?.isReady
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30'
              }`}
            >
              {myPlayer?.isReady ? 'Cancel Ready' : 'I am Ready!'}
            </button>

            {isHost ? (
              <button
                onClick={startGame}
                disabled={!canLaunch}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                  canLaunch
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                }`}
              >
                <Play className="w-4 h-4 fill-current" /> {
                  canLaunch
                    ? 'Launch Code Mafia Match'
                    : !hasFullTeam
                    ? `Need full team to start (${playersList.length}/${maxPlayersCount})`
                    : `Waiting for all players to be READY (${readyPlayersCount}/${maxPlayersCount})`
                }
              </button>
            ) : (
              <span className="text-xs font-mono text-slate-500">Waiting for host to start the game...</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 relative">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Top Auth Bar */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-pixel text-[10px] rounded-2xl transition shadow"
          >
            ← Retro Landing
          </button>
        )}
        {authUser ? (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl shadow">
            <span className="text-xl">{(AVATARS.find(a => a.id === authUser.avatar) || AVATARS[0]).icon}</span>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">{authUser.username}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                Wins: Dev {authUser.dev_wins || 0} | Mafia {authUser.mafia_wins || 0}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs rounded-2xl transition shadow"
          >
            <LogIn className="w-4 h-4 text-red-400" /> Sign In / Sign Up
          </button>
        )}
      </div>

      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Skull className="w-4 h-4" /> Multiplayer Debugging Game
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">CODE MAFIA</h1>
          <p className="text-slate-400 text-sm mt-2">
            Multi-Language Debugging Game (C, C++, Python, JavaScript) with Public & Secret Hidden Test Assertions.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-6">
          <button
            onClick={() => { setMode('JOIN'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
              mode === 'JOIN' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Join Existing Room
          </button>
          <button
            onClick={() => { setMode('CREATE'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
              mode === 'CREATE' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create New Room
          </button>
        </div>

        <form onSubmit={mode === 'JOIN' ? handleJoin : handleCreate} className="space-y-5">
          {/* Handle Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Developer Handle
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. AlexCoder"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-red-500/60 transition"
              />
            </div>
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Choose Avatar
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATARS.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setSelectedAvatar(a.id)}
                  className={`p-2 rounded-xl text-2xl border transition flex items-center justify-center ${
                    selectedAvatar === a.id
                      ? 'bg-red-500/20 border-red-500 scale-105 shadow-md shadow-red-900/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                  title={a.name}
                >
                  {a.icon}
                </button>
              ))}
            </div>
          </div>

          {mode === 'JOIN' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Room Code
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. MAFIA-4921"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-red-400 uppercase focus:outline-none focus:border-red-500 transition"
              />
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {/* Language & Challenge Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="ALL">All Languages</option>
                    <option value="JAVASCRIPT">JavaScript (Node.js)</option>
                    <option value="PYTHON">Python (pytest/unittest)</option>
                    <option value="C">C (gcc compiler)</option>
                    <option value="CPP">C++ (g++ compiler)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Software Challenge
                  </label>
                  <select
                    value={selectedChallenge}
                    onChange={(e) => setSelectedChallenge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                  >
                    {filteredChallenges.map(c => (
                      <option key={c.id} value={c.id}>
                        [{c.language.toUpperCase()}] [{c.difficulty}] {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Player & Mafia Sliders (Min 3 players) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Max Player Count: <span className="text-white font-bold">{maxPlayers}</span> (Min 3)
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={12}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Mafia Count
                  </label>
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-red-400 font-bold flex items-center justify-between">
                    <span>{getMafiaCount(maxPlayers)} Saboteur(s)</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Auto-calculated)</span>
                  </div>
                </div>
              </div>

              {/* Timers Sliders */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Sprint: {Math.floor(codingDuration / 60)}m
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={600}
                    value={codingDuration}
                    onChange={(e) => setCodingDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Discussion: {discussionDuration}s
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={300}
                    value={discussionDuration}
                    onChange={(e) => setDiscussionDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Voting: {votingDuration}s
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={120}
                    value={votingDuration}
                    onChange={(e) => setVotingDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-red-900/40 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{mode === 'JOIN' ? 'Joining Room...' : 'Creating Room...'}</span>
              </>
            ) : (
              <span>{mode === 'JOIN' ? 'Join Room' : 'Create Room & Host'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
