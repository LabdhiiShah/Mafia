import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Eye, Shield, Target, AlertTriangle, CheckCircle, X, Zap } from 'lucide-react';

export default function DetectivePanel() {
  const { room, myPlayer, triggerDetectiveKill, triggerDetectiveProtect, setActiveAnnouncement } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPower, setSelectedPower] = useState(null); // 'kill' | 'protect'
  const [targetSocketId, setTargetSocketId] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  if (!room || (room.status !== 'CODING_PHASE' && room.status !== 'DISCUSSION_PHASE')) return null;

  const isDetective = (myPlayer?.role === 'DETECTIVE' || myPlayer?.role === 'QA_INSPECTOR') && myPlayer?.isAlive;
  if (!isDetective) return null;

  const detectiveState = room.detectiveState || {};
  const livingPlayers = (room?.players || []).filter(p => p && p.isAlive && p.socketId !== myPlayer?.socketId);

  const handleExecute = async () => {
    if (!targetSocketId) {
      setFeedbackMsg({ type: 'error', text: 'Please select a target player first!' });
      return;
    }

    setIsActivating(true);
    setFeedbackMsg(null);

    let res = null;
    if (selectedPower === 'kill') {
      res = await triggerDetectiveKill(targetSocketId);
    } else if (selectedPower === 'protect') {
      res = await triggerDetectiveProtect(targetSocketId);
    }

    setIsActivating(false);

    if (res && res.success) {
      if (selectedPower === 'kill') {
        if (res.isMafia) {
          setFeedbackMsg({ type: 'success', text: `🎯 DIRECT KILL SUCCESS: ${res.targetName} was MAFIA! Civilians win the round!` });
          if (setActiveAnnouncement) {
            setActiveAnnouncement({
              type: 'DETECTIVE_KILL_SUCCESS',
              title: '🕵️ DIRECT KILL SUCCESS!',
              message: 'Mafia was killed by Detective! Civilians win the match!',
              sprite: '/sprites/detective.png',
              icon: '🎯',
              theme: 'EMERALD'
            });
          }
        } else {
          setFeedbackMsg({ type: 'error', text: `💥 MISFIRE: Target was INNOCENT! Both have been eliminated!` });
          if (setActiveAnnouncement) {
            setActiveAnnouncement({
              type: 'DETECTIVE_KILL_MISFIRE',
              title: '💥 DETECTIVE MISFIRE & SUICIDE!',
              message: 'Innocent was killed and Detective suicided!',
              sprite: '/sprites/detective.png',
              icon: '💥',
              theme: 'RED'
            });
          }
        }
      } else {
        setFeedbackMsg({ type: 'success', text: `🛡️ PROTECTIVE SHIELD ACTIVATED for ${res.targetName}!` });
        if (setActiveAnnouncement) {
          setActiveAnnouncement({
            type: 'DETECTIVE_PROTECT',
            title: '🛡️ PROTECTIVE SHIELD ACTIVATED!',
            message: `Secret sanctuary shield has been cast over ${res.targetName} for this round!`,
            sprite: '/sprites/detective.png',
            icon: '🛡️',
            theme: 'PURPLE'
          });
        }
      }

      setTimeout(() => {
        setIsOpen(false);
        setSelectedPower(null);
        setFeedbackMsg(null);
      }, 1500);
    } else {
      setFeedbackMsg({ type: 'error', text: res?.error || 'Failed to execute power' });
    }
  };

  return (
    <>
      {/* Floating Bottom-Left Detective Action Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative px-5 py-3.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 text-white font-pixel text-xs rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.6)] border-2 border-purple-400 hover:border-white hover:shadow-[0_0_35px_rgba(168,85,247,0.9)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 cursor-pointer"
        >
          <div className="relative">
            <Eye className="w-5 h-5 text-purple-200 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
          </div>
          <span className="tracking-widest font-bold">DETECTIVE POWERS</span>
          <Shield className="w-4 h-4 text-purple-300 group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Detective Powers Control Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-purple-950 border-2 border-purple-600/80 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.4)] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-purple-950/80 border-b border-purple-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 border border-purple-500/40 rounded-xl">
                  <Eye className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-pixel text-sm text-purple-100 tracking-wider flex items-center gap-2">
                    DETECTIVE SPECIAL POWERS
                  </h3>
                  <p className="text-xs text-purple-300/70 font-mono">
                    High-risk vigilante execution or secret sanctuary shield
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

            {/* Feedback Banner */}
            {feedbackMsg && (
              <div className={`px-6 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2 ${
                feedbackMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-500/40' : 'bg-red-950/80 text-red-300 border-b border-red-500/40'
              }`}>
                {feedbackMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            {/* Powers Options List */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Power 1: Direct Kill */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  detectiveState.usedDirectKill
                    ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
                    : selectedPower === 'kill'
                    ? 'bg-slate-900 border-red-500 ring-2 ring-red-500/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-red-500/50 cursor-pointer'
                }`}
                onClick={() => !detectiveState.usedDirectKill && setSelectedPower(selectedPower === 'kill' ? null : 'kill')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-600 to-rose-900 border border-red-500 shadow">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-100">Direct Kill (Vigilante Strike)</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                          INSTANT WIN OR DOUBLE DEATH
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Execute a target player instantly. <strong className="text-emerald-400">If target is Mafia → Instant Round Victory!</strong> <strong className="text-red-400">If target is Innocent → Both target AND Detective die immediately!</strong>
                      </p>
                    </div>
                  </div>

                  <div>
                    {detectiveState.usedDirectKill ? (
                      <span className="text-xs font-mono font-bold text-slate-500 px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700">USED</span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 bg-emerald-950/60 rounded-lg border border-emerald-800 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> READY
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Power 2: Protective Shield */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  detectiveState.usedProtect
                    ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
                    : selectedPower === 'protect'
                    ? 'bg-slate-900 border-purple-500 ring-2 ring-purple-500/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-purple-500/50 cursor-pointer'
                }`}
                onClick={() => !detectiveState.usedProtect && setSelectedPower(selectedPower === 'protect' ? null : 'protect')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-900 border border-purple-500 shadow">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-100">Protective Shield (Sanctuary)</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                          SECRET VOTE IMMUNITY
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Secretly shield 1 player for the round. If they receive the highest votes during Voting Phase, their elimination is <strong className="text-purple-300">BLOCKED</strong>. Identity remains hidden.
                      </p>
                    </div>
                  </div>

                  <div>
                    {detectiveState.usedProtect ? (
                      <span className="text-xs font-mono font-bold text-slate-500 px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700">USED</span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 bg-emerald-950/60 rounded-lg border border-emerald-800 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> READY
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Target Selection Dropdown */}
              {selectedPower && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 bg-slate-950/60 p-4 rounded-xl">
                  <label className="text-xs font-mono text-slate-300 block font-bold">
                    SELECT TARGET PLAYER:
                  </label>
                  <select
                    value={targetSocketId}
                    onChange={(e) => setTargetSocketId(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-purple-500/40 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="">-- Choose Target Player --</option>
                    {livingPlayers.map((p) => (
                      <option key={p.socketId} value={p.socketId}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">
                1 activation per match
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
                  disabled={!selectedPower || !targetSocketId || isActivating}
                  onClick={handleExecute}
                  className={`px-6 py-2.5 rounded-xl font-pixel text-xs tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                    !selectedPower || !targetSocketId || isActivating
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.6)]'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  {isActivating ? 'EXECUTING...' : 'EXECUTE POWER'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
