import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useSocket } from '../../context/SocketContext';

export default function MonacoEditor({ filename, content, readOnly }) {
  const { updateCode, sendCursor, remoteCursors, room } = useSocket();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const fakeRedLines = room?.sabotageState?.fakeRedLines || [];

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Track local cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      sendCursor(filename, e.position.lineNumber, e.position.column);
    });
  };

  // Google Docs-style remote inline cursor decorations & Phantom Fault fake error lines
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const newDecorations = [];

    // 1. Remote user cursors
    Object.entries(remoteCursors).forEach(([sId, data]) => {
      if (data.cursor && data.cursor.file === filename && data.cursor.line > 0) {
        const line = data.cursor.line;
        const col = data.cursor.column || 1;

        newDecorations.push({
          range: new monaco.Range(line, col, line, col + 1),
          options: {
            className: 'remote-cursor-glow',
            beforeContentClassName: 'remote-cursor-caret',
            glyphMarginClassName: 'remote-cursor-glyph',
            hoverMessage: { value: `**${data.playerName}** is editing here` },
            inlineClassName: 'remote-cursor-text'
          }
        });
      }
    });

    // 2. Phantom Fault (Fake Red Error Lines)
    fakeRedLines.forEach((item) => {
      if (item.filename === filename && item.line > 0) {
        newDecorations.push({
          range: new monaco.Range(item.line, 1, item.line, 200),
          options: {
            isWholeLine: true,
            className: 'phantom-fault-line',
            inlineClassName: 'phantom-fault-squiggly',
            hoverMessage: { value: `⚠️ **SYNTAX/RUNTIME ERROR**: ${item.message}` }
          }
        });
      }
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [remoteCursors, fakeRedLines, filename]);

  const handleCodeChange = (newContent) => {
    if (readOnly) return;
    if (newContent !== undefined) {
      updateCode(filename, newContent);
    }
  };

  const getLanguage = (fname) => {
    if (!fname || typeof fname !== 'string') return 'javascript';
    if (fname.endsWith('.json')) return 'json';
    if (fname.endsWith('.py')) return 'python';
    if (fname.endsWith('.c')) return 'c';
    if (fname.endsWith('.cpp')) return 'cpp';
    if (fname.endsWith('.ts')) return 'typescript';
    return 'javascript';
  };

  return (
    <div className="relative w-full h-full bg-slate-950">
      {/* Inline Styles for Google Docs-style remote cursors */}
      <style>{`
        .remote-cursor-caret {
          border-left: 2px solid #38bdf8;
          margin-left: -1px;
          display: inline-block;
          height: 100%;
          position: relative;
        }
        .remote-cursor-glow {
          background-color: rgba(56, 189, 248, 0.15);
          border-radius: 2px;
        }
        .remote-cursor-text {
          background-color: rgba(56, 189, 248, 0.2);
        }
        .phantom-fault-line {
          background-color: rgba(239, 68, 68, 0.25) !important;
          border-left: 3px solid #ef4444 !important;
        }
        .phantom-fault-squiggly {
          text-decoration: underline #ef4444 wavy !important;
          font-weight: bold;
        }
      `}</style>

      <Editor
        height="100%"
        language={getLanguage(filename)}
        theme="vs-dark"
        value={content || ''}
        onChange={handleCodeChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          fontSize: 13,
          fontFamily: "'Fira Code', 'Consolas', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          renderWhitespace: 'selection',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          lineNumbersMinChars: 3
        }}
      />
    </div>
  );
}
