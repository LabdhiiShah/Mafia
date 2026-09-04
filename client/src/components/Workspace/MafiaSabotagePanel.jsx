import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Skull, Clock, AlertTriangle, Zap, CheckCircle, X, ShieldAlert } from 'lucide-react';

export default function MafiaSabotagePanel() {
  const { room, myPlayer, triggerMafiaSabotage, activeFile } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPower, setSelectedPower] = useState(null);
  const [phantomLine, setPhantomLine] = useState(1);
  const [phantomMessage, setPhantomMessage] = useState('SYNTAX ERROR: Unexpected token / Memory Leak');
  const [isActivating, setIsActivating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  if (!room || room.status !== 'CODING_PHASE') return null;

  // Check if current player is alive Mafia
  const isMafia = myPlayer?.role === 'MAFIA' && myPlayer?.isAlive;
  if (!isMafia) return null;

  const usedPowers = room.sabotageState?.usedPowers || [];

  const POWERS = [
    {
      id: 'subcode_outbreak',
      name: 'Subcode Outbreak',
      icon: Skull,
      color: 'from-rose-600 to-red-800 border-red-500',
      badge: '30s TIMED MORTALITY',
      description: 'Dispatches unique broken mini-code tasks to every Innocent & Detective. If they fail to fix it within 30s, they get ELIMINATED!',
    },
    {
      id: 'chronos_drain',
      name: 'Chronos Drain (-10s)',
      icon: Clock,
      color: 'from-amber-600 to-yellow-800 border-amber-500',
      badge: 'TIME DRAIN',
      description: 'Drains 10 seconds from the active Sprint Timer immediately, shortening the developers\' window to fix bugs.',
    },
    {
      id: 'phantom_fault',
      name: 'Phantom Fault',
      icon: AlertTriangle,
      color: 'from-purple-600 to-indigo-800 border-purple-500',
      badge: 'DECEPTIVE ERROR DECORATION',
      description: 'Injects a terrifying red error line decoration into a clean line of code to deceive and confuse developers.',
      requiresLine: true
    }
  ];

  const handleActivate = async (powerId) => {
    setIsActivating(true);
    setFeedbackMsg(null);

    let targetData = {};
    if (powerId === 'phantom_fault') {
      targetData = {
        filename: activeFile || 'main',
        line: Number(phantomLine) || 1,
        message: phantomMessage
      };
    }

    const res = await triggerMafiaSabotage(powerId, targetData);
    setIsActivating(false);

    if (res && res.success) {
      setFeedbackMsg({ type: 'success', text: `Power "${powerId.toUpperCase()}" ACTIVATED successfully!` });
      setTimeout(() => {
        setIsOpen(false);
        setSelectedPower(null);
        setFeedbackMsg(null);
      }, 1200);
    } else {
      setFeedbackMsg({ type: 'error', text: res?.error || 'Failed to activate power' });
    }
  };

  return (
    <>
      {/* Floating Bottom-Right Mafia Sabotage Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative px-5 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-purple-800 text-white font-pixel text-xs rounded-xl shadow-[0_0_25px_rgba(225,29,72,0.6)] border-2 border-red-400 hover:border-white hover:shadow-[0_0_35px_rgba(225,29,72,0.9)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 cursor-pointer"
        >
          <div className="relative">
            <Skull className="w-5 h-5 text-rose-200 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-ping" />
          </div>
          <span className="tracking-widest font-bold">MAFIA SABOTAGE</span>
          <Zap className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Mafia Sabotage Control Panel Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-red-950 border-2 border-red-600/80 rounded-2xl shadow-[0_0_50px_rgba(225,29,72,0.4)] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-red-950/80 border-b border-red-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600/20 border border-red-500/40 rounded-xl">
                  <ShieldAlert className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-pixel text-sm text-red-100 tracking-wider flex items-center gap-2">
                    MAFIA SABOTAGE CONTROL PANEL
                  </h3>
                  <p className="text-xs text-red-300/70 font-mono">
                    Select 1 Sabotage Power. Each power can be used only ONCE per match.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Feedback Banner */}
            {feedbackMsg && (
              <div className={`px-6 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2 ${
                feedbackMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-500/40' : 'bg-red-950/80 text-red-300 border-b border-red-500/40'
              }`}>
                {feedbackMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            {/* Powers List */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {POWERS.map((power) => {
                const Icon = power.icon;
                const isUsed = usedPowers.includes(power.id);
                const isSelected = selectedPower === power.id;

                return (
                  <div
                    key={power.id}
                    className={`relative p-4 rounded-xl border transition-all ${
                      isUsed
                        ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? `bg-slate-900 border-red-500 ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(225,29,72,0.25)]`
                        : 'bg-slate-900/70 border-slate-800 hover:border-red-500/50 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!isUsed) setSelectedPower(isSelected ? null : power.id);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${power.color} border shadow`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-100">{power.name}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                              {power.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {power.description}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isUsed ? (
                          <span className="text-xs font-mono font-bold text-slate-500 px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700">
                            USED
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 bg-emerald-950/60 rounded-lg border border-emerald-800 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> READY
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Target options if Phantom Fault is selected */}
                    {isSelected && power.requiresLine && (
                      <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 bg-slate-950/60 p-3 rounded-lg">
                        <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                          <span>TARGET FILE: <strong className="text-purple-300">{activeFile || 'main'}</strong></span>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-xs font-mono text-slate-400">Target Line Number:</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={phantomLine}
                            onChange={(e) => setPhantomLine(e.target.value)}
                            className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-mono text-slate-400 block mb-1">Fake Error Tooltip Label:</label>
                          <input
                            type="text"
                            value={phantomMessage}
                            onChange={(e) => setPhantomMessage(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                            placeholder="e.g. SYNTAX ERROR: Unexpected token"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">
                Only 1 power active per activation
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={!selectedPower || isActivating}
                  onClick={() => selectedPower && handleActivate(selectedPower)}
                  className={`px-6 py-2.5 rounded-xl font-pixel text-xs tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                    !selectedPower || isActivating
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white border border-red-400 shadow-[0_0_20px_rgba(225,29,72,0.6)]'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  {isActivating ? 'ACTIVATING...' : 'EXECUTE SABOTAGE'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
