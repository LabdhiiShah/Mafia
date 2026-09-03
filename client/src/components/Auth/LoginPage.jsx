import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Character } from '../Landing/Character';

export function LoginPage({ onNavigateToSignup, onLoginSuccess, onBackToLanding }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [serverError, setServerError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Character Interaction States
  const [speaker, setSpeaker] = useState(null);
  const [loginSuccessAnim, setLoginSuccessAnim] = useState(false);

  // Random Animation States
  const [detectiveAction, setDetectiveAction] = useState('idle');
  const [mafiaAction, setMafiaAction] = useState('idle');
  const [randomEvent, setRandomEvent] = useState(null);

  useEffect(() => {
    setMounted(true);
    
    // Character random idle/action loops
    const detInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        const actions = ['look-around', 'inspect', 'point'];
        setDetectiveAction(actions[Math.floor(Math.random() * actions.length)]);
        setTimeout(() => setDetectiveAction('idle'), 2000);
      }
    }, 4500);

    const mafInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        const actions = ['look-back', 'hide', 'sneak'];
        setMafiaAction(actions[Math.floor(Math.random() * actions.length)]);
        setTimeout(() => setMafiaAction('idle'), 2000);
      }
    }, 5500);

    // Random Scene Events
    const eventInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const events = ['glitch', 'scan', 'file'];
        setRandomEvent(events[Math.floor(Math.random() * events.length)]);
        setTimeout(() => setRandomEvent(null), 3000);
      }
    }, 8000);

    return () => {
      clearInterval(detInterval);
      clearInterval(mafInterval);
      clearInterval(eventInterval);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (status === 'error') {
      setStatus('idle');
      setServerError('');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username || !formData.username.trim()) {
      newErrors.username = 'Player name is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus('loading');
    setServerError('');
    
    try {
      const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        setServerError(data.error || 'Authentication failed. Please check your credentials.');
        setStatus('error');
        return;
      }

      // Save auth session
      localStorage.setItem('code_mafia_token', data.token);
      localStorage.setItem('code_mafia_user', JSON.stringify(data.user));

      setStatus('success');
      setLoginSuccessAnim(true);
      
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      }, 700);

    } catch (err) {
      console.error('Login error:', err);
      setServerError('Unable to connect to authentication server. Check connection.');
      setStatus('error');
    }
  };

  return (
    <main className={`min-h-screen w-full relative flex items-center justify-center bg-[#0a0510] selection:bg-purple-500/30 overflow-hidden py-12 px-4 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'} ${loginSuccessAnim ? 'animate-[shake_0.3s_ease-in-out_0.1s]' : ''}`}>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-4px, 2px) rotate(-1deg); }
          50% { transform: translate(4px, -2px) rotate(1deg); }
          75% { transform: translate(-4px, -2px) rotate(-1deg); }
        }
        @keyframes shoot-projectile {
          0% { transform: translateX(0) scale(1); opacity: 1; }
          10% { transform: translateX(10vw) scale(1.5); opacity: 1; }
          100% { transform: translateX(80vw) scale(0.5); opacity: 0; }
        }
        @keyframes gun-recoil {
          0% { transform: translateX(0) rotate(0); }
          10% { transform: translateX(-15px) rotate(-15deg); }
          50% { transform: translateX(5px) rotate(5deg); }
          100% { transform: translateX(0) rotate(0); }
        }
        @keyframes det-look {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(-1); }
        }
        @keyframes det-inspect {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(10px) scale(1.05); }
        }
        @keyframes det-point {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(10deg) translateX(10px); }
        }
        @keyframes maf-look {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(-1); }
        }
        @keyframes maf-hide {
          0%, 100% { transform: scaleY(1) translateY(0); }
          50% { transform: scaleY(0.8) translateY(20px); }
        }
        @keyframes maf-sneak {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-15px); }
          75% { transform: translateX(15px); }
        }
        @keyframes security-scan {
          0% { transform: translateX(-100vw) skewX(-45deg); opacity: 0; }
          10% { opacity: 0.3; }
          50% { opacity: 0.3; }
          90% { opacity: 0; }
          100% { transform: translateX(100vw) skewX(-45deg); opacity: 0; }
        }
        @keyframes scene-glitch {
          0%, 100% { opacity: 1; transform: translate(0); filter: hue-rotate(0deg); }
          20% { opacity: 0.7; transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
          40% { opacity: 0.9; transform: translate(2px, -2px); filter: hue-rotate(0deg); }
          60% { opacity: 0.6; transform: translate(-2px, -2px); filter: hue-rotate(180deg); }
          80% { opacity: 1; transform: translate(2px, 2px); filter: hue-rotate(0deg); }
        }
      `}</style>

      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e] to-[#0a0510]" />
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0510] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" />
      
      {/* Fog/Particles overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none animate-[ping_10s_ease-in-out_infinite]" />

      {/* Top Bar Back Option */}
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="absolute top-6 left-6 z-30 font-pixel text-[10px] text-purple-300 hover:text-white bg-purple-950/80 border border-purple-500/40 px-4 py-2.5 rounded-sm shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
        >
          ← RETRO HOME
        </button>
      )}

      {/* Random Scene Events */}
      {randomEvent === 'scan' && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden mix-blend-screen">
          <div className="absolute top-0 bottom-0 w-64 bg-cyan-400/20 blur-2xl animate-[security-scan_3s_linear]" />
        </div>
      )}
      {randomEvent === 'glitch' && (
        <div className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay animate-[scene-glitch_0.5s_ease-in-out_3]">
          <div className="w-full h-full bg-[url('https://transparenttextures.com/patterns/diagmonds-light.png')] opacity-30" />
        </div>
      )}
      {randomEvent === 'file' && (
        <div className="absolute bottom-20 left-[35%] z-10 pointer-events-none animate-[pulse_1s_ease-in-out_3]">
          <div className="w-8 h-10 border border-purple-400 bg-black/60 rounded flex flex-col items-center justify-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.5)]">
            <div className="w-4 h-[2px] bg-purple-400" />
            <div className="w-4 h-[2px] bg-purple-400" />
            <div className="w-2 h-[2px] bg-purple-400" />
          </div>
        </div>
      )}

      {/* Interactive Characters */}
      <div className="absolute bottom-0 left-4 sm:left-12 lg:left-24 z-20 pointer-events-auto flex items-end h-[350px]">
        <div className={`relative transition-transform duration-300 ${loginSuccessAnim ? '' : detectiveAction === 'look-around' ? 'animate-[det-look_2s_ease-in-out]' : detectiveAction === 'inspect' ? 'animate-[det-inspect_2s_ease-in-out]' : detectiveAction === 'point' ? 'animate-[det-point_2s_ease-in-out]' : ''}`}>
          <Character
            id="detective"
            name="The Detective"
            src="/sprites/detective.png"
            width={220}
            height={460}
            quote="Something isn't right here..."
            isSpeaking={speaker === 'detective'}
            onToggle={() => setSpeaker(current => current === 'detective' ? null : 'detective')}
            className={`h-48 sm:h-64 lg:h-80 transition-transform ${loginSuccessAnim ? '-rotate-6 scale-105' : ''}`}
          />
        </div>
      </div>

      <div className="absolute bottom-0 right-4 sm:right-12 lg:right-24 z-20 pointer-events-auto flex items-end h-[350px]">
        <div className={`transition-transform duration-300 ${loginSuccessAnim ? '' : mafiaAction === 'look-back' ? 'animate-[maf-look_2s_ease-in-out]' : mafiaAction === 'hide' ? 'animate-[maf-hide_2s_ease-in-out]' : mafiaAction === 'sneak' ? 'animate-[maf-sneak_2s_ease-in-out]' : ''}`}>
          <Character
            id="mafia"
            name="The Mafia"
            src="/sprites/mafia.png"
            width={250}
            height={520}
            quote="You didn't see anything."
            isSpeaking={speaker === 'mafia'}
            onToggle={() => setSpeaker(current => current === 'mafia' ? null : 'mafia')}
            className={`h-48 sm:h-64 lg:h-80 transition-all duration-[0.6s] ease-in ${loginSuccessAnim ? 'translate-x-[120vw] opacity-0' : 'translate-x-0 opacity-100'}`}
          />
        </div>
      </div>

      {/* Main Login Card */}
      <div className={`relative z-10 w-full max-w-md bg-black/60 backdrop-blur-xl border border-purple-500/50 rounded-lg p-8 sm:p-10 shadow-[0_0_80px_rgba(168,85,247,0.25)] animate-in fade-in slide-in-from-bottom-8 duration-500 hover:shadow-[0_0_100px_rgba(168,85,247,0.35)] transition-all ${loginSuccessAnim ? 'opacity-0 scale-95 duration-500' : ''}`}>
        
        <form onSubmit={handleSubmit} className={`transition-opacity duration-300 ${status === 'loading' ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
          <div className="text-center mb-10">
            <h1 className="font-pixel text-xl sm:text-2xl text-white mb-4 leading-tight [text-shadow:0_0_20px_rgba(255,255,255,0.8),0_0_15px_rgba(168,85,247,0.8)]">WELCOME BACK,<br/>OPERATIVE</h1>
            <p className="text-white text-xs font-pixel tracking-wider [text-shadow:0_0_10px_rgba(255,255,255,0.5)]">Enter your credentials to access the network.</p>
          </div>

          {serverError && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-md flex items-center gap-3 animate-in zoom-in-95 duration-200">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-white font-pixel text-[10px]">{serverError}</p>
            </div>
          )}

          <div className="space-y-6">
            
            {/* USERNAME FIELD */}
            <div className="group">
              <div className="relative flex items-center">
                <div className="absolute left-4 text-purple-400 pointer-events-none group-focus-within:text-purple-300 group-focus-within:[text-shadow:0_0_10px_rgba(168,85,247,0.8)] transition-all">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter player name"
                  className="w-full bg-black/70 border border-purple-500/40 rounded-md pl-12 pr-4 py-4 text-white placeholder-gray-400 font-pixel text-xs focus:outline-none focus:border-purple-400 focus:[box-shadow:0_0_25px_rgba(168,85,247,0.5)] transition-all"
                />
              </div>
              {errors.username && <p className="text-white font-pixel text-[8px] mt-2 ml-1 animate-in fade-in bg-red-500/20 px-2 py-1 rounded inline-block">{errors.username}</p>}
            </div>

            {/* PASSWORD FIELD */}
            <div className="group">
              <div className="relative flex items-center">
                <div className="absolute left-4 text-purple-400 pointer-events-none group-focus-within:text-purple-300 group-focus-within:[text-shadow:0_0_10px_rgba(168,85,247,0.8)] transition-all">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full bg-black/70 border border-purple-500/40 rounded-md pl-12 pr-12 py-4 text-white placeholder-gray-400 font-pixel text-xs focus:outline-none focus:border-purple-400 focus:[box-shadow:0_0_25px_rgba(168,85,247,0.5)] transition-all"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 text-purple-400 hover:text-purple-300 hover:[text-shadow:0_0_10px_rgba(168,85,247,0.8)] transition-all"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-white font-pixel text-[8px] mt-2 ml-1 animate-in fade-in bg-red-500/20 px-2 py-1 rounded inline-block">{errors.password}</p>}
            </div>

          </div>

          <div className="mt-10">
            <button
              type="submit"
              disabled={status === 'loading' || loginSuccessAnim}
              className="w-full py-5 font-pixel text-xs tracking-wider rounded-sm transition-all duration-300 flex items-center justify-center gap-2 bg-purple-600/80 text-white border border-purple-400 [box-shadow:0_0_25px_rgba(168,85,247,0.6)] hover:bg-purple-500 hover:[box-shadow:0_0_40px_rgba(168,85,247,0.9)] active:scale-[0.98] group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative z-10 flex items-center gap-2">
                {status === 'loading' || loginSuccessAnim ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> AUTHENTICATING...
                  </>
                ) : (
                  'ENTER THE NETWORK'
                )}
              </span>
            </button>
          </div>
          
          <div className="mt-8 text-center border-t border-purple-500/30 pt-6">
            <button
              type="button"
              onClick={onNavigateToSignup}
              className="font-pixel text-[10px] text-white hover:text-purple-300 hover:[text-shadow:0_0_12px_rgba(168,85,247,0.8)] transition-all bg-transparent border-none cursor-pointer"
            >
              DON'T HAVE AN ACCOUNT? SIGN UP
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default LoginPage;
