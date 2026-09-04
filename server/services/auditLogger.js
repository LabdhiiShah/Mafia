const { diffLines } = require('diff');
const { v4: uuidv4 } = require('uuid');

class AuditLogger {
  constructor() {
    // Map roomCode -> Array of audit events
    this.roomLogs = new Map();
    // Map roomCode -> Map of filename -> Array of file snapshots { version, content, timestamp, addedCount, removedCount, lineRange }
    this.fileSnapshots = new Map();
  }

  initRoom(roomCode, initialFiles) {
    this.roomLogs.set(roomCode, []);
    const fileMap = new Map();

    for (const [filename, content] of Object.entries(initialFiles)) {
      fileMap.set(filename, [{
        version: 1,
        content,
        timestamp: new Date().toISOString(),
        lineRange: '1-1',
        addedCount: 0,
        removedCount: 0,
        diffs: null
      }]);
    }

    this.fileSnapshots.set(roomCode, fileMap);
    this.logEvent(roomCode, {
      type: 'ROOM_CREATED',
      detail: 'Game room initialized with starter challenge files.'
    });
  }

  logEvent(roomCode, event) {
    const logs = this.roomLogs.get(roomCode) || [];
    const { authorName, authorId, ...sanitizedEvent } = event;
    const entry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...sanitizedEvent
    };
    logs.push(entry);
    this.roomLogs.set(roomCode, logs);
    return entry;
  }

  logCodeEdit(roomCode, filename, newContent, authorId, authorName) {
    const fileMap = this.fileSnapshots.get(roomCode);
    if (!fileMap) return;

    const history = fileMap.get(filename) || [];
    const previousSnapshot = history[history.length - 1];
    const oldContent = previousSnapshot ? previousSnapshot.content : '';

    // Calculate line diffs & affected line numbers
    const lineDiffs = diffLines(oldContent, newContent);
    let addedCount = 0;
    let removedCount = 0;
    let currentLine = 1;
    let firstModifiedLine = 1;
    let foundFirstMod = false;

    lineDiffs.forEach(part => {
      const lineCount = part.count || (part.value ? part.value.split('\n').length - 1 : 0);
      if (part.added || part.removed) {
        if (!foundFirstMod) {
          firstModifiedLine = currentLine;
          foundFirstMod = true;
        }
        if (part.added) addedCount += lineCount;
        if (part.removed) removedCount += lineCount;
      }
      if (!part.removed) {
        currentLine += lineCount;
      }
    });

    // Only store snapshot if there are actual diffs
    if (addedCount > 0 || removedCount > 0) {
      const version = history.length + 1;
      const lastLine = firstModifiedLine + Math.max(0, addedCount - 1);
      const lineRangeStr = addedCount > 1 || removedCount > 1 ? `lines ${firstModifiedLine}-${lastLine}` : `line ${firstModifiedLine}`;

      const snapshot = {
        version,
        filename,
        content: newContent,
        lineRange: lineRangeStr,
        timestamp: new Date().toISOString(),
        addedCount,
        removedCount,
        diffs: lineDiffs
      };

      history.push(snapshot);
      fileMap.set(filename, history);

      this.logEvent(roomCode, {
        type: 'FILE_EDITED',
        filename,
        version,
        lineRange: lineRangeStr,
        addedCount,
        removedCount,
        detail: `Modified "${filename}" on ${lineRangeStr} (+${addedCount} / -${removedCount} lines)`
      });
    }
  }

  logTestRun(roomCode, authorId, authorName, testResults) {
    this.logEvent(roomCode, {
      type: 'TEST_RUN',
      passed: testResults.passed,
      failed: testResults.failed,
      total: testResults.total,
      passRate: testResults.passRate,
      detail: `Executed test suite: ${testResults.passed}/${testResults.total} passed (${testResults.passRate}%)`
    });
  }

  logVote(roomCode, voterName, targetName) {
    this.logEvent(roomCode, {
      type: 'PLAYER_VOTED',
      detail: `Anonymous vote recorded during Voting Phase.`
    });
  }

  getLogs(roomCode) {
    return this.roomLogs.get(roomCode) || [];
  }

  getFileHistory(roomCode, filename) {
    const fileMap = this.fileSnapshots.get(roomCode);
    if (!fileMap) return [];
    return fileMap.get(filename) || [];
  }

  clearRoom(roomCode) {
    this.roomLogs.delete(roomCode);
    this.fileSnapshots.delete(roomCode);
  }
}

module.exports = new AuditLogger();
