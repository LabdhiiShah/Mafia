import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Play, CheckCircle2, XCircle, Terminal, AlertCircle, RefreshCw, FlaskConical, Flame, Zap } from 'lucide-react';

export default function TestRunnerPanel() {
  const { runTests, testResults, room } = useSocket();
  const [isRunning, setIsRunning] = useState(false);
  const [isRiskyRun, setIsRiskyRun] = useState(false);
  const [xpBanner, setXpBanner] = useState(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    const res = await runTests(isRiskyRun);
    setIsRunning(false);
    if (res && res.xpEarned > 0) {
      setXpBanner({ xp: res.xpEarned, streak: res.streak || 1, multiplier: res.multiplier || 1.0 });
      setTimeout(() => setXpBanner(null), 4500);
    }
  };

  const total = testResults?.total || 0;
  const passed = testResults?.passed || 0;
  const failed = testResults?.failed || 0;
  const passRate = testResults?.passRate || 0;
  const results = testResults?.results || [];
  const stdout = testResults?.stdout || [];

  return (
    <div className="flex flex-col h-full bg-slate-900 border-t border-slate-800 text-slate-100 font-mono text-xs">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">Test Execution Engine</span>
          </div>

          {/* Risky Run Toggle */}
          <button
            onClick={() => setIsRiskyRun(!isRiskyRun)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-bold transition ${
              isRiskyRun
                ? 'bg-purple-950/60 text-purple-300 border-purple-500 shadow-md shadow-purple-950/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Risky Run Mode: 2x XP Bonus if tests pass, -15s Sprint Timer penalty if tests fail!"
          >
            <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
            <span>Risky Mode {isRiskyRun ? '(2x XP Active)' : '(Off)'}</span>
          </button>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning || room?.status === 'DISCUSSION_PHASE' || room?.status === 'VOTING_PHASE'}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition shadow ${
            isRunning
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : isRiskyRun
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
          }`}
        >
          {isRunning ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          {isRunning ? 'Executing Tests...' : isRiskyRun ? 'Run Risky Test Suite (2x XP)' : 'Run Test Suite'}
        </button>
      </div>

      {/* Animated XP Reward Banner */}
      {xpBanner && (
        <div className="px-4 py-2 bg-gradient-to-r from-emerald-950/90 via-purple-950/90 to-emerald-950/90 border-b border-emerald-500/50 flex items-center justify-between text-xs font-mono text-emerald-300 shadow-md">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-current animate-pulse" />
            <span className="font-bold text-white">+{xpBanner.xp} XP EARNED!</span>
            <span className="text-[11px] text-emerald-300/80">(Streak Multiplier: {xpBanner.multiplier}x)</span>
          </div>
          {xpBanner.streak > 1 && (
            <span className="flex items-center gap-1 font-bold text-amber-300 text-[11px]">
              <Flame className="w-3.5 h-3.5 fill-current text-rose-400" /> {xpBanner.streak}x COMBO STREAK!
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {testResults && (
        <div className="w-full bg-slate-950 h-1.5">
          <div
            className={`h-full transition-all duration-500 ${
              passRate === 100 ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${passRate}%` }}
          />
        </div>
      )}

      {/* Test Results Output */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3 font-mono">
        {!testResults ? (
          <div className="text-slate-500 flex flex-col items-center justify-center h-full gap-2">
            <Terminal className="w-8 h-8 opacity-40" />
            <span>Click "Run Test Suite" to evaluate code stability & unit assertions</span>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {results.map((res, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs ${
                    res.status === 'PASSED'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-950/30 border-red-500/40 text-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {res.status === 'PASSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span className="font-bold">{res.name}</span>
                    </div>
                    <span className="text-[10px] opacity-60">{res.duration}ms</span>
                  </div>

                  {res.status === 'FAILED' && res.error && (
                    <div className="mt-2 p-2 bg-slate-950 rounded border border-red-900/50 text-[11px] font-mono text-red-400 overflow-x-auto">
                      <div className="flex items-center gap-1 text-red-300 font-bold mb-1">
                        <AlertCircle className="w-3 h-3" /> Assertion Failure:
                      </div>
                      <pre className="whitespace-pre-wrap leading-relaxed">{res.error}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {stdout && stdout.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  Console Standard Output:
                </span>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  {stdout.map((line, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-slate-600 select-none">&gt;</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
