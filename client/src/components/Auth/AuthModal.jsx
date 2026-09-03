import React, { useState } from 'react';
import { User, Lock, LogIn, UserPlus, X, Check, Shield, AlertCircle } from 'lucide-react';

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

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isSignup
      ? `${API_BASE}/api/auth/signup`
      : `${API_BASE}/api/auth/login`;

    const payload = isSignup
      ? { username, password, avatar: selectedAvatar }
      : { username, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const rawText = await res.text();
      let data = {};

      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        setLoading(false);
        setError('Backend server on port 4000 is unreachable or starting up.');
        return;
      }

      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        return;
      }

      // Store JWT token
      localStorage.setItem('code_mafia_token', data.token);
      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }
      onClose();
    } catch (err) {
      setLoading(false);
      setError('Connection error: Please ensure backend server on port 4000 is running.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 mb-3">
            {isSignup ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-black text-white">
            {isSignup ? 'Create Developer Account' : 'Developer Sign In'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSignup ? 'Register to save win stats and match records to PostgreSQL' : 'Sign in to access your player stats & leaderboard standing'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username / Handle
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                minLength={3}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. AlexCoder"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500/60 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500/60 transition"
              />
            </div>
          </div>

          {isSignup && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Choose Avatar
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVATARS.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => setSelectedAvatar(a.id)}
                    className={`p-2 rounded-xl text-xl border transition flex items-center justify-center ${
                      selectedAvatar === a.id
                        ? 'bg-red-500/20 border-red-500 scale-105'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {a.icon}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-900/40 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isSignup ? (
              <>
                <UserPlus className="w-4 h-4" /> Register Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={() => { setIsSignup(!isSignup); setError(null); }}
            className="text-xs text-slate-400 hover:text-slate-200 transition font-semibold"
          >
            {isSignup ? 'Already have an account? Sign In' : 'Need an account? Create one here'}
          </button>
        </div>
      </div>
    </div>
  );
}
