import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Shield, Eye, Clock, FileCode, Play, GitCommit, X, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuditTimeline({ onClose, isEmbedded = false }) {
  const { fetchAuditLogs, fetchFileDiffs, activeFile, restoreFileVersion } = useSocket();
  const [logs, setLogs] = useState([]);
  const [selectedFileHistory, setSelectedFileHistory] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoreFeedback, setRestoreFeedback] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeFile]);

  const loadData = async () => {
    setLoading(true);
    const l = await fetchAuditLogs();
    setLogs(l.reverse()); // Most recent first
    const history = await fetchFileDiffs(activeFile);
    setSelectedFileHistory(history);
    if (history && history.length > 0) {
      setSelectedSnapshot(history[history.length - 1]);
    }
    setLoading(false);
  };

  const handleRestoreVersion = (snapshot) => {
    if (!snapshot || !snapshot.content) return;
    restoreFileVersion(activeFile, snapshot.content);
    setRestoreFeedback(`Version v${snapshot.version} restored to active editor!`);
    setTimeout(() => setRestoreFeedback(null), 3000);
  };

  const content = (
    <div className={`w-full ${isEmbedded ? 'h-full' : 'max-w-5xl h-[85vh]'} bg-slate-900 border border-slate-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden font-sans`}>
      {/* Header */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-xl">
            <Eye className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              ANONYMOUS AUDIT LOG & CODE VERSION TIMELINE
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Inspect file line changes & restore historic code snapshots by timestamp
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Body Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Left Column: Anonymous Activity Log Feed */}
        <div className="border-r border-slate-800 p-4 flex flex-col h-full overflow-hidden bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Clock className="w-4 h-4 text-blue-400" /> Anonymous Action Trail
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
              Line-Based Anonymity
            </span>
          </div>

          {loading ? (
            <div className="text-slate-500 text-xs flex items-center justify-center h-full font-mono">Loading logs...</div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {logs.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs flex items-start gap-3"
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
                  <div className="flex-1 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300">
                        {item.type === 'FILE_EDITED' ? `File Mod (${item.filename || 'code'})` : item.type}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Code Version History & Time-Travel Restore */}
        <div className="p-4 flex flex-col h-full overflow-hidden bg-slate-950">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
              <GitCommit className="w-4 h-4 text-emerald-400" /> Timestamped Version History ({activeFile})
            </h3>
          </div>

          {restoreFeedback && (
            <div className="mb-3 px-3 py-2 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2 animate-bounce">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{restoreFeedback}</span>
            </div>
          )}

          {selectedFileHistory.length === 0 ? (
            <div className="text-slate-500 text-xs font-mono flex items-center justify-center h-full">
              No version snapshots recorded yet for {activeFile}.
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Timestamped Version Selector Chips */}
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-3">
                {selectedFileHistory.map((snap) => {
                  const isSelected = selectedSnapshot?.version === snap.version;
                  const timeStr = new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <button
                      key={snap.version}
                      onClick={() => setSelectedSnapshot(snap)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-md shadow-purple-950/50'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>v{snap.version}</span>
                      <span className="text-[10px] opacity-75">• {timeStr}</span>
                    </button>
                  );
                })}
              </div>

              {/* Diff & Code Version View */}
              <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-4 overflow-y-auto custom-scrollbar font-mono text-xs flex flex-col justify-between">
                {!selectedSnapshot ? (
                  <div className="text-slate-500 flex items-center justify-center h-full">
                    Select a timestamped version above to inspect
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    {/* Snapshot Metadata Header */}
                    <div className="mb-3 border-b border-slate-800 pb-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <div>
                        <span>VERSION: <strong className="text-white">v{selectedSnapshot.version}</strong></span>
                        <span className="mx-2">•</span>
                        <span>TIME: <strong className="text-purple-300">{new Date(selectedSnapshot.timestamp).toLocaleTimeString()}</strong></span>
                        {selectedSnapshot.lineRange && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-slate-300">{selectedSnapshot.lineRange}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-bold">+{selectedSnapshot.addedCount || 0}</span>
                        <span className="text-red-400 font-bold">-{selectedSnapshot.removedCount || 0}</span>
                        
                        <button
                          type="button"
                          onClick={() => handleRestoreVersion(selectedSnapshot)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 shadow cursor-pointer ml-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> RESTORE THIS VERSION
                        </button>
                      </div>
                    </div>

                    {/* Diff View */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
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
