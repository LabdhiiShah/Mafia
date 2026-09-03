import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Character } from '../Landing/Character';

export function SignUpPage({ onNavigateToLogin, onSignupSuccess, onBackToLanding }) {
  const [formData, setFormData] = useState({
    playerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    dob: '',
    terms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [serverError, setServerError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Character Interaction States
  const [speaker, setSpeaker] = useState(null);
  const [detectiveAction, setDetectiveAction] = useState('idle');
  const [mafiaAction, setMafiaAction] = useState('idle');

  useEffect(() => {
    setMounted(true);
    
    // Different random actions for signup page
    const detInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        const actions = ['typing', 'thinking', 'nod'];
        setDetectiveAction(actions[Math.floor(Math.random() * actions.length)]);
        setTimeout(() => setDetectiveAction('idle'), 2000);
      }
    }, 4500);

    const mafInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        const actions = ['laugh', 'impatient', 'flip'];
        setMafiaAction(actions[Math.floor(Math.random() * actions.length)]);
        setTimeout(() => setMafiaAction('idle'), 2000);
      }
    }, 5500);

    return () => {
      clearInterval(detInterval);
      clearInterval(mafInterval);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (serverError) {
      setServerError('');
      setStatus('idle');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.playerName || formData.playerName.trim().length < 3) {
      newErrors.playerName = 'Player name must be at least 3 characters';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password || formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.terms) {
      newErrors.terms = 'You must agree to the Terms of Service';
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
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.playerName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          avatar: 'avatar_1'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        setServerError(data.error || 'Account creation failed. Please try again.');
        setStatus('error');
        return;
      }

      // Store Auth Token
      localStorage.setItem('code_mafia_token', data.token);
      localStorage.setItem('code_mafia_user', JSON.stringify(data.user));
      setStatus('success');

      if (onSignupSuccess) {
        onSignupSuccess(data.user);
      } else if (onNavigateToLogin) {
        onNavigateToLogin();
      }
    } catch (err) {
      console.error('Signup error:', err);
      setServerError('Unable to connect to authentication server. Check connection.');
      setStatus('error');
    }
  };

  const isValid = true;

  return (
    <main className={`min-h-screen w-full relative flex items-center justify-center bg-[#0a0510] selection:bg-purple-500/30 overflow-hidden py-12 px-4 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      
      <style>{`
        @keyframes signup-typing {
          0%, 100% { transform: translateY(0) scale(1); }
          25% { transform: translateY(2px) rotate(1deg); }
          50% { transform: translateY(-2px) rotate(-1deg); }
          75% { transform: translateY(2px) rotate(1deg); }
        }
        @keyframes signup-thinking {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-10px) rotate(5deg) scale(1.02); }
        }
        @keyframes signup-nod {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(8deg); }
          75% { transform: rotate(8deg); }
        }
        @keyframes signup-laugh {
          0%, 100% { transform: translateY(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateY(-8px); }
          20%, 40%, 60%, 80% { transform: translateY(0); }
        }
        @keyframes signup-impatient {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-2deg); }
          75% { transform: translateX(5px) rotate(2deg); }
        }
        @keyframes signup-flip {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(-1); }
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

      {/* Interactive Characters */}
      <div className="absolute bottom-0 left-4 sm:left-12 lg:left-24 z-20 pointer-events-auto flex items-end h-[350px]">
        <div className={`transition-transform duration-300 ${detectiveAction === 'typing' ? 'animate-[signup-typing_2s_ease-in-out]' : detectiveAction === 'thinking' ? 'animate-[signup-thinking_2s_ease-in-out]' : detectiveAction === 'nod' ? 'animate-[signup-nod_2s_ease-in-out]' : ''}`}>
          <Character
            id="detective-signup"
            name="The Detective"
            src="/sprites/detective.png"
            width={220}
            height={460}
            quote="Logging all credentials..."
            isSpeaking={speaker === 'detective'}
            onToggle={() => setSpeaker(current => current === 'detective' ? null : 'detective')}
            className="h-48 sm:h-64 lg:h-80 transition-transform"
          />
        </div>
      </div>

      <div className="absolute bottom-0 right-4 sm:right-12 lg:right-24 z-20 pointer-events-auto flex items-end h-[350px]">
        <div className={`transition-transform duration-300 ${mafiaAction === 'laugh' ? 'animate-[signup-laugh_2s_ease-in-out]' : mafiaAction === 'impatient' ? 'animate-[signup-impatient_2s_ease-in-out]' : mafiaAction === 'flip' ? 'animate-[signup-flip_2s_ease-in-out]' : ''}`}>
          <Character
            id="mafia-signup"
            name="The Mafia"
            src="/sprites/mafia.png"
            width={250}
            height={520}
            quote="Another soul joins the network."
            isSpeaking={speaker === 'mafia'}
            onToggle={() => setSpeaker(current => current === 'mafia' ? null : 'mafia')}
            className="h-48 sm:h-64 lg:h-80 transition-transform"
          />
        </div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-lg bg-black/60 backdrop-blur-xl border border-purple-500/50 rounded-lg p-8 shadow-[0_0_80px_rgba(168,85,247,0.25)] animate-in fade-in slide-in-from-bottom-8 duration-700 hover:shadow-[0_0_100px_rgba(168,85,247,0.35)] transition-all">
        
        <form onSubmit={handleSubmit} className={`transition-opacity duration-300 ${status === 'loading' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="text-center mb-8">
            <h1 className="font-pixel text-2xl text-white mb-3 [text-shadow:0_0_20px_rgba(255,255,255,0.8),0_0_15px_rgba(168,85,247,0.8)]">CREATE YOUR IDENTITY</h1>
            <p className="text-white text-xs font-pixel tracking-wider [text-shadow:0_0_10px_rgba(255,255,255,0.5)]">Join the network. Choose your identity wisely.</p>
          </div>

          {serverError && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-md flex items-center gap-3 animate-in zoom-in-95 duration-200">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-white font-pixel text-[10px]">{serverError}</p>
            </div>
          )}

          <div className="space-y-5">
            
            <div className="group">
              <input
                type="text"
                name="playerName"
                value={formData.playerName}
                onChange={handleChange}
                placeholder="Player Name"
                className="w-full bg-black/70 border border-purple-500/40 rounded-md px-4 py-3 text-white placeholder-gray-400 font-pixel text-xs focus:outline-none focus:border-purple-400 focus:[box-shadow:0_0_25px_rgba(168,85,247,0.5)] transition-all"
              />
              {errors.playerName && <p className="text-white font-pixel text-[8px] mt-1.5 ml-1 bg-red-500/20 px-2 py-1 rounded inline-block">{errors.playerName}</p>}
            </div>

            <div className="group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="w-full bg-black/70 border border-purple-500/40 rounded-md px-4 py-3 text-white placeholder-gray-400 font-pixel text-xs focus:outline-none focus:border-purple-400 focus:[box-shadow:0_0_25px_rgba(168,85,247,0.5)] transition-all"
              />
              {errors.email && <p className="text-white font-pixel text-[8px] mt-1.5 ml-1 bg-red-500/20 px-2 py-1 rounded inline-block">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full bg-black/70 border border-purple-500/40 rounded-md px-4 py-3 text-white placeholder-gray-400 font-pixel text-xs focus:outline-none focus:border-purple-400 focus:[box-shadow:0_0_25px_rgba(168,85,247,0.5)] transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 hover:[text-shadow:0_0_10px_rgba(168,85,247,0.8)] transition-all">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {errors.password && <p className="text-white font-pixel text-[8px] mt-1.5 ml-1 bg-red-500/20 px-2 py-1 rounded inline-block">{errors.password}</p>}
              </div>

              <div className="group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="w-full bg-black/70 border border-purple-500/40 rounded-md px-4 py-3 text-white placeholder-gray-400 font-pixel text-xs focus:outline-none focus:border-purple-400 focus:[box-shadow:0_0_25px_rgba(168,85,247,0.5)] transition-all"
                />
                {errors.confirmPassword && <p className="text-white font-pixel text-[8px] mt-1.5 ml-1 bg-red-500/20 px-2 py-1 rounded inline-block">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group">
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full bg-black/70 border border-purple-500/40 rounded-md px-4 py-3 font-pixel text-xs focus:outline-none focus:border-purple-400 focus:[box-shadow:0_0_25px_rgba(168,85,247,0.5)] transition-all appearance-none ${formData.country ? 'text-white' : 'text-gray-400'}`}
                >
                  <option value="" disabled>Select Country</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="OT">Other</option>
                </select>
                {errors.country && <p className="text-white font-pixel text-[8px] mt-1.5 ml-1 bg-red-500/20 px-2 py-1 rounded inline-block">{errors.country}</p>}
              </div>

              <div className="group">
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className={`w-full bg-black/70 border border-purple-500/40 rounded-md px-4 py-3 font-pixel text-xs focus:outline-none focus:border-purple-400 focus:[box-shadow:0_0_25px_rgba(168,85,247,0.5)] transition-all ${formData.dob ? 'text-white' : 'text-gray-400'}`}
                />
                {errors.dob && <p className="text-white font-pixel text-[8px] mt-1.5 ml-1 bg-red-500/20 px-2 py-1 rounded inline-block">{errors.dob}</p>}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-purple-500/50 rounded-sm bg-black/70 peer-checked:bg-purple-600 peer-checked:border-purple-400 transition-all group-hover:border-purple-400"></div>
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-pixel text-[8px] text-white [text-shadow:0_0_5px_rgba(255,255,255,0.3)] group-hover:text-purple-300 transition-colors">
                  I agree to the Terms of Service and Privacy Policy
                </span>
              </label>
              {errors.terms && <p className="text-white font-pixel text-[8px] mt-1.5 ml-1 bg-red-500/20 px-2 py-1 rounded inline-block">{errors.terms}</p>}
            </div>

          </div>

          <div className="mt-10">
            <button
              type="submit"
              disabled={!isValid || status === 'loading'}
              className={`w-full py-4 font-pixel text-xs tracking-wider rounded-sm transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group cursor-pointer ${
                isValid
                  ? 'bg-purple-600/80 text-white border border-purple-400 [box-shadow:0_0_25px_rgba(168,85,247,0.6)] hover:bg-purple-500 hover:[box-shadow:0_0_40px_rgba(168,85,247,0.9)] active:scale-[0.98]'
                  : 'bg-black/80 border border-purple-900/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isValid && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />}
              <span className="relative z-10 flex items-center gap-2">
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> ENCRYPTING DATA...
                  </>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </span>
            </button>
          </div>
          
          <div className="mt-8 text-center border-t border-purple-500/30 pt-6">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-pixel text-[10px] text-white hover:text-purple-300 hover:[text-shadow:0_0_12px_rgba(168,85,247,0.8)] transition-all bg-transparent border-none cursor-pointer"
            >
              ALREADY HAVE AN ACCOUNT? LOGIN
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default SignUpPage;
