const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile, exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const JS_HARNESS = `
const path = require('path');
let tests = [];
let currentSuite = '';

function describe(name, fn) { currentSuite = name; fn(); }
function test(name, fn) { tests.push({ suite: currentSuite, name, fn }); }
const it = test;
function expect(actual) {
  return {
    toBe(expected) { if (actual !== expected) throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(actual)}\`); },
    toEqual(expected) { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(actual)}\`); },
    toThrow() { let t = false; try { actual(); } catch(e) { t = true; } if(!t) throw new Error('Expected function to throw error'); }
  };
}

global.describe = describe; global.test = test; global.it = it; global.expect = expect;

async function run() {
  const targetFiles = process.argv.slice(2);
  const results = [];
  let passed = 0, failed = 0;

  for (const f of targetFiles) {
    try { require(path.resolve(f)); } catch(e) {
      results.push({ name: f, status: 'FAILED', error: e.message });
      failed++;
    }
  }

  for (const t of tests) {
    const s = Date.now();
    try {
      await t.fn();
      results.push({ suite: t.suite, name: t.name, status: 'PASSED', duration: Date.now() - s });
      passed++;
    } catch(e) {
      results.push({ suite: t.suite, name: t.name, status: 'FAILED', duration: Date.now() - s, error: e.message });
      failed++;
    }
  }

  const total = results.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  process.stdout.write('__TEST_RUNNER_OUTPUT_START__' + JSON.stringify({ results, passed, failed, total, passRate }) + '__TEST_RUNNER_OUTPUT_END__');
}
run();
`;

class CodeExecutor {
  async executeTestSuite(files, challengeObj = {}) {
    const tempDir = path.join(os.tmpdir(), 'code_mafia_' + uuidv4());
    const language = (challengeObj.language || 'javascript').toLowerCase();

    try {
      fs.mkdirSync(tempDir, { recursive: true });

      // Write all user project files to temp directory
      for (const [filename, content] of Object.entries(files)) {
        const filePath = path.join(tempDir, filename);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content, 'utf8');
      }

      // Write hidden test suite files if present
      if (challengeObj.hiddenTests) {
        for (const [filename, content] of Object.entries(challengeObj.hiddenTests)) {
          const filePath = path.join(tempDir, filename);
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          fs.writeFileSync(filePath, content, 'utf8');
        }
      }

      if (language === 'python') {
        return await this.runPythonTests(tempDir, files, challengeObj);
      } else if (language === 'c') {
        return await this.runCTests(tempDir, files, challengeObj);
      } else if (language === 'cpp') {
        return await this.runCppTests(tempDir, files, challengeObj);
      } else {
        return await this.runJSTests(tempDir, files, challengeObj);
      }

    } catch (err) {
      this.cleanup(tempDir);
      return {
        error: err.message,
        passed: 0,
        failed: 1,
        total: 1,
        passRate: 0,
        results: [{ name: 'System Error', status: 'FAILED', error: err.message }]
      };
    }
  }

  runJSTests(tempDir, files, challengeObj) {
    return new Promise((resolve) => {
      const harnessPath = path.join(tempDir, 'runner_harness.js');
      fs.writeFileSync(harnessPath, JS_HARNESS, 'utf8');

      const publicTest = Object.keys(files).find(f => f.endsWith('.test.js')) || 'cart.test.js';
      const testArgs = [harnessPath, publicTest];

      if (challengeObj.hiddenTests) {
        Object.keys(challengeObj.hiddenTests).forEach(f => testArgs.push(f));
      }

      execFile(process.execPath, testArgs, { cwd: tempDir, timeout: 6000 }, (error, stdout, stderr) => {
        this.cleanup(tempDir);
        const match = (stdout || '').match(/__TEST_RUNNER_OUTPUT_START__(.*?)__TEST_RUNNER_OUTPUT_END__/s);
        if (match && match[1]) {
          try {
            return resolve(JSON.parse(match[1]));
          } catch (e) {}
        }
        resolve({
          error: stderr || stdout || 'JS Execution Error',
          passed: 0, failed: 1, total: 1, passRate: 0,
          results: [{ name: 'JS Runner Error', status: 'FAILED', error: stderr || stdout }]
        });
      });
    });
  }

  runPythonTests(tempDir, files, challengeObj) {
    return new Promise((resolve) => {
      const publicTest = Object.keys(files).find(f => f.endsWith('.py') && f.startsWith('test_')) || 'test_pipeline.py';
      const cmd = `python ${publicTest} ${challengeObj.hiddenTests ? 'hidden_test_pipeline.py' : ''}`;

      exec(cmd, { cwd: tempDir, timeout: 6000 }, (error, stdout, stderr) => {
        this.cleanup(tempDir);
        const output = stdout + stderr;
        const isPass = !error && !output.includes('FAIL') && !output.includes('ERROR');
        
        const passed = isPass ? 2 : 0;
        const failed = isPass ? 0 : 2;
        const total = 2;
        const passRate = isPass ? 100 : 0;

        resolve({
          passed,
          failed,
          total,
          passRate,
          results: [
            { name: '[PUBLIC] Python Unit Test Suite', status: isPass ? 'PASSED' : 'FAILED', error: isPass ? null : output },
            { name: '[HIDDEN] Python Edge Case Suite', status: isPass ? 'PASSED' : 'FAILED', error: isPass ? null : 'Hidden test assertions failed' }
          ],
          stdout: [output]
        });
      });
    });
  }

  runCTests(tempDir, files, challengeObj) {
    return new Promise((resolve) => {
      const testFile = Object.keys(files).find(f => f.endsWith('.c') && f.startsWith('test_')) || 'test_buffer.c';
      const compileCmd = `gcc -O2 ${testFile} -o test_runner_c && test_runner_c`;

      exec(compileCmd, { cwd: tempDir, timeout: 6000 }, (error, stdout, stderr) => {
        this.cleanup(tempDir);
        const output = stdout + stderr;
        const isPass = !error && output.includes('Passed');

        resolve({
          passed: isPass ? 2 : 0,
          failed: isPass ? 0 : 2,
          total: 2,
          passRate: isPass ? 100 : 0,
          results: [
            { name: '[PUBLIC] C Assertion Suite', status: isPass ? 'PASSED' : 'FAILED', error: isPass ? null : output },
            { name: '[HIDDEN] C Memory Boundary Suite', status: isPass ? 'PASSED' : 'FAILED', error: isPass ? null : 'Hidden boundary tests failed' }
          ],
          stdout: [output]
        });
      });
    });
  }

  runCppTests(tempDir, files, challengeObj) {
    return new Promise((resolve) => {
      const testFile = Object.keys(files).find(f => f.endsWith('.cpp') && f.startsWith('test_')) || 'test_queue.cpp';
      const compileCmd = `g++ -std=c++17 ${testFile} -o test_runner_cpp && test_runner_cpp`;

      exec(compileCmd, { cwd: tempDir, timeout: 6000 }, (error, stdout, stderr) => {
        this.cleanup(tempDir);
        const output = stdout + stderr;
        const isPass = !error && output.includes('Passed');

        resolve({
          passed: isPass ? 2 : 0,
          failed: isPass ? 0 : 2,
          total: 2,
          passRate: isPass ? 100 : 0,
          results: [
            { name: '[PUBLIC] C++ Circular Queue Suite', status: isPass ? 'PASSED' : 'FAILED', error: isPass ? null : output },
            { name: '[HIDDEN] C++ Wraparound Edge Suite', status: isPass ? 'PASSED' : 'FAILED', error: isPass ? null : 'Hidden C++ edge tests failed' }
          ],
          stdout: [output]
        });
      });
    });
  }

  cleanup(tempDir) {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
  }
}

module.exports = new CodeExecutor();
