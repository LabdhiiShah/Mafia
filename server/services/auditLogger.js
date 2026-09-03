const { diffLines } = require('diff');
const { v4: uuidv4 } = require('uuid');

class AuditLogger {
  constructor() {
    // Map roomCode -> Array of audit events
    this.roomLogs = new Map();
    // Map roomCode -> Map of filename -> Array of file snapshots { version, content, author, timestamp }
    this.fileSnapshots = new Map();
  }

  initRoom(roomCode, initialFiles) {
    this.roomLogs.set(roomCode, []);
    const fileMap = new Map();

    for (const [filename, content] of Object.entries(initialFiles)) {
      fileMap.set(filename, [{
        version: 1,
        content,
        authorName: 'System (Initial)',
        authorId: 'system',
        timestamp: new Date().toISOString(),
        diff: null
      }]);
    }

    this.fileSnapshots.set(roomCode, fileMap);
    this.logEvent(roomCode, {
      type: 'ROOM_CREATED',
      authorName: 'System',
      authorId: 'system',
      detail: 'Game room initialized with starter challenge files.'
    });
  }

  logEvent(roomCode, event) {
    const logs = this.roomLogs.get(roomCode) || [];
    const entry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...event
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

    // Calculate line diffs
    const lineDiffs = diffLines(oldContent, newContent);
    let addedCount = 0;
    let removedCount = 0;

    lineDiffs.forEach(part => {
      if (part.added) addedCount += part.count || 0;
      if (part.removed) removedCount += part.count || 0;
    });

    // Only store snapshot if there are actual diffs
    if (addedCount > 0 || removedCount > 0) {
      const version = history.length + 1;
      const snapshot = {
        version,
        filename,
        content: newContent,
        authorId,
        authorName,
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
        authorId,
        authorName,
        version,
        addedCount,
        removedCount,
        detail: `Modified ${filename} (+${addedCount} / -${removedCount} lines)`
      });
    }
  }

  logTestRun(roomCode, authorId, authorName, testResults) {
    this.logEvent(roomCode, {
      type: 'TEST_RUN',
      authorId,
      authorName,
      passed: testResults.passed,
      failed: testResults.failed,
      total: testResults.total,
      passRate: testResults.passRate,
      detail: `Ran test suite: ${testResults.passed}/${testResults.total} passed (${testResults.passRate}%)`
    });
  }

  logVote(roomCode, voterName, targetName) {
    this.logEvent(roomCode, {
      type: 'PLAYER_VOTED',
      voterName,
      targetName,
      detail: `${voterName} voted to eliminate ${targetName || 'Skip'}`
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
