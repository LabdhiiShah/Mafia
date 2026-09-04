import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import MonacoEditor from './MonacoEditor';
import TestRunnerPanel from './TestRunnerPanel';
import AuditTimeline from './AuditTimeline';
import MafiaSabotagePanel from './MafiaSabotagePanel';
import DetectivePanel from './DetectivePanel';
import SubcodeChallengeModal from './SubcodeChallengeModal';
import SacrificialSaveModal from '../Game/SacrificialSaveModal';
import { FolderTree, FileCode, Play, Eye, Terminal, Lock } from 'lucide-react';

export default function IDEWorkspace() {
  const { codeFiles, activeFile, switchFile, room } = useSocket();
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'logs'

  if (!codeFiles) return null;

  const fileList = Object.keys(codeFiles);
  const currentContent = codeFiles[activeFile] || '';

  // Code editor is active ONLY during CODING_PHASE when timer > 0
  const isTimerExpired = room?.timerSeconds === 0;
  const isReadOnly = (room?.status && room.status !== 'CODING_PHASE') || isTimerExpired;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-slate-100 relative">
      {/* Subcode Challenge Modal overlay for Innocents/Detectives */}
      <SubcodeChallengeModal />

      {/* Floating Mafia Sabotage Control Panel (bottom-right for alive Mafia) */}
      <MafiaSabotagePanel />

      {/* Floating Detective Action Panel */}
      <DetectivePanel />

      {/* Sacrificial Save Modal for Innocents */}
      <SacrificialSaveModal />

      {/* Audit Diff Inspector Overlay Modal */}
      {showAuditModal && (
        <AuditTimeline onClose={() => setShowAuditModal(false)} />
      )}

      {/* Main IDE Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: File Tree & Detective Tool */}
        <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
          <div>
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-blue-400" /> Workspace
              </span>
              {isReadOnly && (
                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 flex items-center gap-1 font-mono">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>

            {/* File List */}
            <div className="p-2 space-y-1">
              {fileList.map((filename) => {
                const isActive = filename === activeFile;
                const isTest = typeof filename === 'string' && (filename.endsWith('.test.js') || filename.endsWith('.test.py'));
                return (
                  <button
                    key={filename}
                    onClick={() => { switchFile(filename); setActiveTab('editor'); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition text-left ${
                      isActive && activeTab === 'editor'
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className={`w-4 h-4 ${isTest ? 'text-amber-400' : 'text-blue-400'}`} />
                    <span className="truncate">{filename}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audit Diff Inspector Trigger */}
          <div className="p-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => setShowAuditModal(true)}
              className="w-full py-2.5 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <Eye className="w-4 h-4" /> Detective Audit Logs
            </button>
          </div>
        </aside>

        {/* Center IDE Editor & Bottom Terminal */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* File Tabs & Mode Switcher */}
          <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-2 pt-2 overflow-x-auto custom-scrollbar">
            <div className="flex gap-1">
              {fileList.map((filename) => {
                const isActive = filename === activeFile && activeTab === 'editor';
                return (
                  <button
                    key={filename}
                    onClick={() => { switchFile(filename); setActiveTab('editor'); }}
                    className={`px-4 py-2 rounded-t-xl text-xs font-mono flex items-center gap-2 border-t border-x transition ${
                      isActive
                        ? 'bg-slate-950 text-white border-slate-800 border-b-transparent font-bold'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                    <span>{filename}</span>
                  </button>
                );
              })}
            </div>

            {/* Editor vs Logs View Toggle */}
            <div className="flex items-center gap-2 pb-1 pr-2">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                  activeTab === 'editor' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" /> Editor
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                  activeTab === 'logs' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> Audit Logs
              </button>
            </div>
          </div>

          {/* Locked Notification Bar */}
          {isReadOnly && (
            <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300 font-mono">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>
                  {isTimerExpired
                    ? '⚡ SPRINT TIME EXPIRED — Code editor locked for this round. Review logs below.'
                    : '🔒 CODING LOCKED — Discussion/Voting Phase active.'}
                </span>
              </div>
              <button
                onClick={() => setShowAuditModal(true)}
                className="underline hover:text-white transition cursor-pointer"
              >
                View Full Change Audit
              </button>
            </div>
          )}

          {/* Editor or Audit Logs View */}
          {activeTab === 'logs' ? (
            <div className="flex-1 p-4 bg-slate-950 overflow-hidden">
              <AuditTimeline onClose={() => setActiveTab('editor')} isEmbedded={true} />
            </div>
          ) : (
            <div className="flex-1 relative overflow-hidden">
              <MonacoEditor
                filename={activeFile}
                content={currentContent}
                readOnly={isReadOnly}
              />
            </div>
          )}

          {/* Bottom Test Runner Terminal */}
          <div className="h-64 border-t border-slate-800">
            <TestRunnerPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
