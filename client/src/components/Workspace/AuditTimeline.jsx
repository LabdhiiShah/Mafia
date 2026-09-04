import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Shield, Eye, Clock, FileCode, Play, User, GitCommit, X } from 'lucide-react';

export default function AuditTimeline({ onClose, isEmbedded = false }) {
  const { fetchAuditLogs, fetchFileDiffs, activeFile } = useSocket();
  const [logs, setLogs] = useState([]);
  const [selectedFileHistory, setSelectedFileHistory] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const l = await fetchAuditLogs();
    setLogs(l.reverse()); // Most recent first
    const history = await fetchFileDiffs(activeFile);
    setSelectedFileHistory(history);
    setLoading(false);
  };

  const content = (
    <div className={`w-full ${isEmbedded ? 'h-full' : 'max-w-5xl h-[85vh]'} bg-slate-900 border border-slate-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden`}>
      {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-xl">
              <Eye className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AUDIT LOG & CODE DIFF MONITOR
              </h2>
              <p className="text-xs text-slate-400">
                Inspect player commit history, line-by-line diffs (+green/-red), and suspicious edits
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          {/* Left Column: Chronological Audit Trail */}
          <div className="border-r border-slate-800 p-4 flex flex-col h-full overflow-hidden bg-slate-900/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" /> Action Activity Feed
            </h3>

            {loading ? (
              <div className="text-slate-500 text-xs flex items-center justify-center h-full">Loading logs...</div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {logs.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-start gap-3"
                  >
                    <div className="mt-0.5">
                      {item.type === 'FILE_EDITED' ? (
                        <FileCode className="w-4 h-4 text-amber-400" />
                      ) : item.type === 'TEST_RUN' ? (
                        <Play className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <GitCommit className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{item.authorName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1 text-[11px] leading-relaxed font-mono">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: File Line Diff Inspection */}
          <div className="p-4 flex flex-col h-full overflow-hidden bg-slate-950">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-emerald-400" /> Line-by-Line Commit History ({activeFile})
              </h3>
            </div>

            {selectedFileHistory.length === 0 ? (
              <div className="text-slate-500 text-xs flex items-center justify-center h-full">
                No commit snapshots recorded yet for this file.
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Snapshot Selector Chips */}
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-3">
                  {selectedFileHistory.map((snap) => (
                    <button
                      key={snap.version}
                      onClick={() => setSelectedSnapshot(snap)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono whitespace-nowrap transition ${
                        selectedSnapshot?.version === snap.version
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      v{snap.version} - {snap.authorName}
                    </button>
                  ))}
                </div>

                {/* Diff Viewer */}
                <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-4 overflow-y-auto custom-scrollbar font-mono text-xs">
                  {!selectedSnapshot ? (
                    <div className="text-slate-500 flex items-center justify-center h-full">
                      Select a commit version above to inspect git diff
                    </div>
                  ) : (
                    <div>
                      <div className="mb-3 border-b border-slate-800 pb-2 flex justify-between text-slate-400 text-[11px]">
                        <span>Author: <strong className="text-white">{selectedSnapshot.authorName}</strong></span>
                        <span className="text-emerald-400 font-bold">+{selectedSnapshot.addedCount || 0}</span>
                        <span className="text-red-400 font-bold">-{selectedSnapshot.removedCount || 0}</span>
                      </div>

                      {selectedSnapshot.diffs ? (
                        <div className="space-y-0.5">
                          {selectedSnapshot.diffs.map((part, index) => {
                            const lines = part.value.split('\n').filter((l, i, a) => i < a.length - 1 || l !== '');
                            return lines.map((line, lIdx) => (
                              <div
                                key={`${index}-${lIdx}`}
                                className={`px-2 py-0.5 rounded font-mono ${
                                  part.added
                                    ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500'
                                    : part.removed
                                    ? 'bg-red-950/60 text-red-300 border-l-2 border-red-500 line-through'
                                    : 'text-slate-400'
                                }`}
                              >
                                <span className="inline-block w-6 text-slate-600 select-none">
                                  {part.added ? '+' : part.removed ? '-' : ' '}
                                </span>
                                {line}
                              </div>
                            ));
                          })}
                        </div>
                      ) : (
                        <pre className="text-slate-300 whitespace-pre-wrap">{selectedSnapshot.content}</pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );

  if (isEmbedded) return content;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      {content}
    </div>
  );
}
