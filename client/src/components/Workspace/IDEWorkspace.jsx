import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import MonacoEditor from './MonacoEditor';
import TestRunnerPanel from './TestRunnerPanel';
import AuditTimeline from './AuditTimeline';
import { FolderTree, FileCode, Play, Eye, Terminal, Lock } from 'lucide-react';

export default function IDEWorkspace() {
  const { codeFiles, activeFile, switchFile, room } = useSocket();
  const [showAuditModal, setShowAuditModal] = useState(false);

  if (!codeFiles) return null;

  const fileList = Object.keys(codeFiles);
  const currentContent = codeFiles[activeFile] || '';
  const isReadOnly = room?.status === 'DISCUSSION_PHASE' || room?.status === 'VOTING_PHASE';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-slate-100 relative">
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
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>

            {/* File List */}
            <div className="p-2 space-y-1">
              {fileList.map((filename) => {
                const isActive = filename === activeFile;
                const isTest = filename.endsWith('.test.js');
                return (
                  <button
                    key={filename}
                    onClick={() => switchFile(filename)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition text-left ${
                      isActive
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
          <div className="p-3 border-t border-slate-800">
            <button
              onClick={() => setShowAuditModal(true)}
              className="w-full py-2.5 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow"
            >
              <Eye className="w-4 h-4" /> Detective Audit Logs
            </button>
          </div>
        </aside>

        {/* Center IDE Editor & Bottom Terminal */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* File Tabs */}
          <div className="flex bg-slate-900 border-b border-slate-800 px-2 pt-2 gap-1 overflow-x-auto custom-scrollbar">
            {fileList.map((filename) => {
              const isActive = filename === activeFile;
              return (
                <button
                  key={filename}
                  onClick={() => switchFile(filename)}
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

          {/* Monaco Editor Workspace */}
          <div className="flex-1 relative overflow-hidden">
            <MonacoEditor
              filename={activeFile}
              content={currentContent}
              readOnly={isReadOnly}
            />
          </div>

          {/* Bottom Test Runner Terminal */}
          <div className="h-64 border-t border-slate-800">
            <TestRunnerPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
