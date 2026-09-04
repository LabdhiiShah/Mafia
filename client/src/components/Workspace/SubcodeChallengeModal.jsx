import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Skull, AlertOctagon, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SubcodeChallengeModal() {
  const { activeSubcodeChallenge, submitSubcodeFix } = useSocket();
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (activeSubcodeChallenge?.challenge) {
      setCode(activeSubcodeChallenge.challenge.initialCode || '');
      setSecondsLeft(activeSubcodeChallenge.durationSeconds || 30);
      setErrorMsg(null);
    }
  }, [activeSubcodeChallenge]);

  // Live 30-second timer
  useEffect(() => {
    if (!activeSubcodeChallenge) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSubcodeChallenge]);

  if (!activeSubcodeChallenge) return null;

  const challenge = activeSubcodeChallenge.challenge;

  const handleSubmitFix = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    const res = await submitSubcodeFix(code);
    setIsSubmitting(false);

    if (!res || !res.success) {
      setErrorMsg(res?.error || 'Subcode fix failed assertion check. Try again!');
    }
  };

  const progressPercent = Math.max(0, (secondsLeft / 30) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg font-sans animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-red-950/90 border-2 border-red-600 rounded-2xl shadow-[0_0_60px_rgba(225,29,72,0.6)] overflow-hidden">
        {/* Animated Warning Header */}
        <div className="px-6 py-4 bg-red-950/90 border-b border-red-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/30 border border-red-500/50 rounded-xl animate-pulse">
              <Skull className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-pixel text-sm text-red-100 tracking-wider flex items-center gap-2">
                ☣️ SUBCODE OUTBREAK DETECTED
              </h3>
              <p className="text-xs text-red-300 font-mono">
                A corrupt subcode snippet has infected your terminal! Fix it in <strong className="text-yellow-300 underline">{secondsLeft}s</strong> or get <strong className="text-red-400">ELIMINATED</strong>!
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-2xl font-mono font-bold text-red-400 tracking-widest animate-pulse">
              00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
            </div>
            <span className="text-[10px] font-mono text-red-300/80">REMAINING</span>
          </div>
        </div>

        {/* 30s Countdown Progress Bar */}
        <div className="w-full bg-slate-900 h-2 overflow-hidden border-b border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-rose-500 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(239,68,68,0.8)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Error Feedback Banner */}
        {errorMsg && (
          <div className="px-6 py-2 bg-red-950/90 border-b border-red-700/50 text-xs font-mono text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Challenge Instructions & Code Editor */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <h4 className="font-bold text-sm text-purple-200">{challenge?.title || 'Subcode Challenge'}</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                {challenge?.language || 'javascript'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              {challenge?.instructions}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>MINI TERMINAL EDITOR:</span>
              <span className="text-[10px] text-amber-400">Edit code below & click Deploy Fix</span>
            </label>
            <textarea
              rows={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border-2 border-red-900/60 focus:border-red-500 rounded-xl font-mono text-xs text-emerald-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 custom-scrollbar shadow-inner"
              spellCheck="false"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <AlertOctagon className="w-4 h-4" />
            <span>Failure to debug in time = Immediate Death</span>
          </div>

          <button
            type="button"
            disabled={isSubmitting || secondsLeft === 0}
            onClick={handleSubmitFix}
            className={`px-6 py-2.5 rounded-xl font-pixel text-xs tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
              isSubmitting || secondsLeft === 0
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.6)]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'VERIFYING FIX...' : 'DEPLOY SUBCODE FIX'}
          </button>
        </div>
      </div>
    </div>
  );
}
