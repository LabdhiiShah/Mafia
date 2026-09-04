const SUBCODE_BANK = {
  python: [
    {
      id: 'py_add',
      title: 'Math Adder Bug',
      instructions: 'Fix the function so it returns the sum of a and b.',
      initialCode: 'def solve(a, b):\n    return a - b  # Bug here\n',
      test: (code) => {
        try {
          return code.includes('+') && !code.includes('-');
        } catch (e) { return false; }
      }
    },
    {
      id: 'py_even',
      title: 'Even Checker Glitch',
      instructions: 'Fix the function so it returns True when n is even.',
      initialCode: 'def solve(n):\n    return n % 2 != 0  # Bug here\n',
      test: (code) => {
        try {
          return code.includes('== 0') || (code.includes('% 2') && !code.includes('!= 0'));
        } catch (e) { return false; }
      }
    },
    {
      id: 'py_square',
      title: 'Square Multiplier Bug',
      instructions: 'Fix the function so it returns x squared (x * x).',
      initialCode: 'def solve(x):\n    return x + x  # Bug here\n',
      test: (code) => {
        try {
          return code.includes('*') && !code.includes('+');
        } catch (e) { return false; }
      }
    },
    {
      id: 'py_first',
      title: 'Array Head Access Bug',
      instructions: 'Fix the function so it returns the first element of the list `arr`.',
      initialCode: 'def solve(arr):\n    return arr[1]  # Bug here\n',
      test: (code) => {
        try {
          return code.includes('[0]');
        } catch (e) { return false; }
      }
    }
  ],
  javascript: [
    {
      id: 'js_add',
      title: 'Addition Operation Glitch',
      instructions: 'Fix the function so it returns the sum of a and b.',
      initialCode: 'function solve(a, b) {\n  return a - b; // Bug here\n}',
      test: (code) => {
        try {
          return code.includes('+') && !code.includes('-');
        } catch (e) { return false; }
      }
    },
    {
      id: 'js_even',
      title: 'Parity Evaluation Error',
      instructions: 'Fix the function so it returns true when n is even.',
      initialCode: 'function solve(n) {\n  return n % 2 !== 0; // Bug here\n}',
      test: (code) => {
        try {
          return code.includes('=== 0') || code.includes('== 0') || !code.includes('!==');
        } catch (e) { return false; }
      }
    },
    {
      id: 'js_greater',
      title: 'Comparison Logic Bug',
      instructions: 'Fix the function so it returns true if a is strictly greater than b.',
      initialCode: 'function solve(a, b) {\n  return a < b; // Bug here\n}',
      test: (code) => {
        try {
          return code.includes('>');
        } catch (e) { return false; }
      }
    },
    {
      id: 'js_len',
      title: 'String Length Checker Bug',
      instructions: 'Fix the function so it returns true if string str is non-empty.',
      initialCode: 'function solve(str) {\n  return str.length === 0; // Bug here\n}',
      test: (code) => {
        try {
          return code.includes('> 0') || code.includes('!= 0') || code.includes('!== 0');
        } catch (e) { return false; }
      }
    }
  ],
  c: [
    {
      id: 'c_add',
      title: 'C Pointer Arithmetic Bug',
      instructions: 'Fix the function so it returns the sum of a and b.',
      initialCode: 'int solve(int a, int b) {\n    return a - b; // Bug here\n}',
      test: (code) => {
        try {
          return code.includes('+') && !code.includes('-');
        } catch (e) { return false; }
      }
    },
    {
      id: 'c_even',
      title: 'C Parity Check Fault',
      instructions: 'Fix the function so it returns 1 if n is even, else 0.',
      initialCode: 'int solve(int n) {\n    return n % 2 != 0; // Bug here\n}',
      test: (code) => {
        try {
          return code.includes('== 0');
        } catch (e) { return false; }
      }
    }
  ],
  cpp: [
    {
      id: 'cpp_add',
      title: 'C++ Calculation Glitch',
      instructions: 'Fix the function so it returns the sum of a and b.',
      initialCode: 'int solve(int a, int b) {\n    return a - b; // Bug here\n}',
      test: (code) => {
        try {
          return code.includes('+') && !code.includes('-');
        } catch (e) { return false; }
      }
    },
    {
      id: 'cpp_even',
      title: 'C++ Parity Evaluation Bug',
      instructions: 'Fix the function so it returns true if n is even.',
      initialCode: 'bool solve(int n) {\n    return n % 2 != 0; // Bug here\n}',
      test: (code) => {
        try {
          return code.includes('== 0');
        } catch (e) { return false; }
      }
    }
  ]
};

function getSubcodeForLanguage(language, playerIndex = 0) {
  const lang = (language || 'javascript').toLowerCase();
  const list = SUBCODE_BANK[lang] || SUBCODE_BANK['javascript'];
  const challenge = list[playerIndex % list.length];
  return {
    id: challenge.id,
    title: challenge.title,
    instructions: challenge.instructions,
    initialCode: challenge.initialCode,
    language: lang
  };
}

function verifySubcodeFix(lang, challengeId, userCode) {
  const list = SUBCODE_BANK[lang] || SUBCODE_BANK['javascript'];
  const challenge = list.find(c => c.id === challengeId) || list[0];
  if (!challenge) return false;
  return challenge.test(userCode);
}

module.exports = {
  getSubcodeForLanguage,
  verifySubcodeFix
};
