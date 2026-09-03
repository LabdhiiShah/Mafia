import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { MessageSquare, Send, Eye, Skull, Shield, Lock, AlertTriangle } from 'lucide-react';
import AuditTimeline from '../Workspace/AuditTimeline';

export default function DiscussionModal() {
  const { room, myPlayer, chatMessages, sendChat, timerSeconds } = useSocket();
  const [text, setText] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);

  if (!room) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim()) {
      sendChat(text);
      setText('');
    }
  };

  const alivePlayers = room.players.filter(p => p.isAlive);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      {showAuditModal && (
        <AuditTimeline onClose={() => setShowAuditModal(false)} />
      )}

      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                CODE REVIEW & DISCUSSION PHASE
              </h2>
              <p className="text-xs text-slate-400">
                Code editing is locked! Review suspicious edits, share findings, and deliberate before voting.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-4 py-2 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" /> Inspect Audit Diffs
            </button>

            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl font-mono text-sm font-bold text-amber-400">
              {timerSeconds}s remaining
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Left Column: Suspect Roster */}
          <div className="border-r border-slate-800 p-4 bg-slate-950/40 flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Alive Team Members ({alivePlayers.length})
            </h3>
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {room.players.map((p) => (
                <div
                  key={p.socketId}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    !p.isAlive
                      ? 'bg-slate-950/60 border-slate-800/40 opacity-50 line-through text-slate-500'
                      : p.socketId === myPlayer?.socketId
                      ? 'bg-blue-950/20 border-blue-500/40 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <span className="font-semibold">{p.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${p.isAlive ? 'text-green-400' : 'text-red-400'}`}>
                    {p.isAlive ? 'ALIVE' : 'ELIMINATED'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right 2 Columns: Chat Feed */}
          <div className="md:col-span-2 flex flex-col bg-slate-950">
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-slate-500 text-xs text-center my-auto flex flex-col items-center gap-2">
                  <MessageSquare className="w-8 h-8 opacity-30" />
                  <span>Use the chat below to share evidence and debate who broke the unit tests!</span>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col text-xs p-3 rounded-xl max-w-md ${
                      msg.authorId === myPlayer?.id
                        ? 'bg-blue-950/30 border border-blue-500/30 ml-auto text-right'
                        : 'bg-slate-900 border border-slate-800 mr-auto text-left'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-200" style={{ color: msg.color }}>
                        {msg.authorName}
                      </span>
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-slate-300 font-sans leading-relaxed">{msg.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share suspicious edit findings or state your case..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition font-sans"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
