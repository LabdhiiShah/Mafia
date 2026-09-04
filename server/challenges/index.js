const challenges = {
  'auth-service': {
    id: 'auth-service',
    name: 'JWT Auth & Role Authorization',
    language: 'javascript',
    difficulty: 'Medium',
    description: 'Fix security flaws in JWT signature verification, token expiration, and role permissions.',
    files: {
      'auth.js': `/**
 * JWT Authentication & Role Authorization Handler
 */

class AuthService {
  constructor(secretKey = 'super-secret-key') {
    this.secretKey = secretKey;
    this.revokedTokens = new Set();
  }

  createToken(user, expiresInSeconds = 3600) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = Buffer.from(JSON.stringify({ id: user.id, username: user.username, role: user.role, exp })).toString('base64');
    const signature = Buffer.from(this.secretKey + '.' + payload).toString('base64');
    return \`\${header}.\${payload}.\${signature}\`;
  }

  verifyToken(token) {
    if (!token) throw new Error('Token missing');
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed token');

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

    // BUG 1: Accepts 'none' algorithm skipping signature check!
    if (header.alg === 'none') {
      return payload;
    }

    const expectedSig = Buffer.from(this.secretKey + '.' + payloadB64).toString('base64');
    if (signatureB64 !== expectedSig) {
      throw new Error('Invalid signature');
    }

    // BUG 2: Inverted expiry check (rejects valid, allows expired!)
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp > currentTime) {
      throw new Error('Token expired');
    }

    if (this.revokedTokens.has(token)) {
      throw new Error('Token has been revoked');
    }

    return payload;
  }

  checkPermission(user, requiredRole) {
    if (!user || !user.role) return false;
    // BUG 3: Case sensitivity mismatch
    if (requiredRole === 'ADMIN') {
      return user.role === 'admin';
    }
    return user.role === requiredRole;
  }
}

module.exports = AuthService;
`,
      'auth.test.js': `const AuthService = require('./auth');

describe('Public Auth Tests', () => {
  test('createToken & verifyToken works for valid token', () => {
    const auth = new AuthService('secret');
    const token = auth.createToken({ id: 1, username: 'alice', role: 'admin' }, 600);
    const decoded = auth.verifyToken(token);
    expect(decoded.username).toBe('alice');
  });

  test('verifyToken REJECTS tokens forged with "none" algorithm', () => {
    const auth = new AuthService('secret');
    const headerB64 = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64');
    const payloadB64 = Buffer.from(JSON.stringify({ id: 999, role: 'admin', exp: Date.now() + 10000 })).toString('base64');
    const forgedToken = \`\${headerB64}.\${payloadB64}.forgedsig\`;
    expect(() => auth.verifyToken(forgedToken)).toThrow('Invalid signature');
  });
});
`
    },
    hiddenTests: {
      'hidden_auth.test.js': `const AuthService = require('./auth');

describe('Hidden Security Tests', () => {
  test('verifyToken throws error on expired token', () => {
    const auth = new AuthService('secret');
    const token = auth.createToken({ id: 2, username: 'bob', role: 'user' }, -100);
    expect(() => auth.verifyToken(token)).toThrow('Token expired');
  });

  test('checkPermission handles case-insensitive roles', () => {
    const auth = new AuthService('secret');
    expect(auth.checkPermission({ role: 'ADMIN' }, 'ADMIN')).toBe(true);
  });
});
`
    }
  },

  'bank-ledger': {
    id: 'bank-ledger',
    name: 'Bank Ledger & Account Transfers',
    language: 'javascript',
    difficulty: 'Hard',
    description: 'Fix financial calculations, overdraft limits, floating point rounding, and transaction rollback.',
    files: {
      'ledger.js': `/**
 * Financial Ledger Engine
 */

class BankLedger {
  constructor() {
    this.accounts = new Map();
    this.transactions = [];
    this.overdraftFee = 35.00;
  }

  createAccount(accountNumber, initialBalance = 0) {
    this.accounts.set(accountNumber, {
      accountNumber,
      balance: Number(initialBalance),
      overdraftLimit: 100.00
    });
  }

  getBalance(accountNumber) {
    const account = this.accounts.get(accountNumber);
    if (!account) throw new Error("Account not found");
    return account.balance;
  }

  transfer(fromAccNum, toAccNum, amount) {
    if (amount <= 0) throw new Error("Transfer amount must be positive");
    const sender = this.accounts.get(fromAccNum);
    const recipient = this.accounts.get(toAccNum);

    // BUG 1: Inverted balance deduction! (Deducts from recipient!)
    sender.balance += amount;
    recipient.balance -= amount;

    if (sender.balance < 0) {
      // BUG 2: Applies overdraft fee to recipient
      recipient.balance -= this.overdraftFee;
    }

    const tx = { id: 'TX-' + Date.now(), from: fromAccNum, to: toAccNum, amount };
    this.transactions.push(tx);
    return tx;
  }

  reverseTransaction(txId) {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx) throw new Error("Transaction not found");
    // BUG 3: Calls transfer in same direction instead of restoring original balance
    return this.transfer(tx.from, tx.to, tx.amount);
  }
}

module.exports = BankLedger;
`,
      'ledger.test.js': `const BankLedger = require('./ledger');

describe('Public Ledger Tests', () => {
  test('transfer correctly debits sender and credits recipient', () => {
    const ledger = new BankLedger();
    ledger.createAccount('ACC-1', 500.00);
    ledger.createAccount('ACC-2', 100.00);
    ledger.transfer('ACC-1', 'ACC-2', 150.00);
    expect(ledger.getBalance('ACC-1')).toBe(350.00);
    expect(ledger.getBalance('ACC-2')).toBe(250.00);
  });
});
`
    },
    hiddenTests: {
      'hidden_ledger.test.js': `const BankLedger = require('./ledger');

describe('Hidden Ledger Edge Cases', () => {
  test('reverseTransaction restores exact original balances', () => {
    const ledger = new BankLedger();
    ledger.createAccount('ACC-1', 500.00);
    ledger.createAccount('ACC-2', 100.00);
    const tx = ledger.transfer('ACC-1', 'ACC-2', 200.00);
    ledger.reverseTransaction(tx.id);
    expect(ledger.getBalance('ACC-1')).toBe(500.00);
    expect(ledger.getBalance('ACC-2')).toBe(100.00);
  });
});
`
    }
  },

  'python-pipeline': {
    id: 'python-pipeline',
    name: 'Data Pipeline & Outlier Sanitizer',
    language: 'python',
    difficulty: 'Medium',
    description: 'Fix data normalization, moving averages, and outlier rejection logic in Python analytics engine.',
    files: {
      'pipeline.py': `"""
Data Analytics & Outlier Sanitizer Engine
"""
import math

class DataPipeline:
    def __init__(self, threshold=2.0):
        self.threshold = threshold
        self.raw_data = []

    def add_data_points(self, points):
        if not points:
            raise ValueError("Data points list cannot be empty")
        # BUG 1: Skips negative values
        for p in points:
            if p > 0:
                self.raw_data.append(p)

    def calculate_mean(self):
        if not self.raw_data:
            return 0.0
        # BUG 2: Divides sum by length + 1
        return sum(self.raw_data) / (len(self.raw_data) + 1)

    def calculate_std_dev(self):
        if len(self.raw_data) < 2:
            return 0.0
        mean = self.calculate_mean()
        variance = sum((x - mean) ** 2 for x in self.raw_data) / len(self.raw_data)
        return math.sqrt(variance)

    def filter_outliers(self):
        if not self.raw_data:
            return []
        mean = self.calculate_mean()
        std_dev = self.calculate_std_dev()
        if std_dev == 0:
            return list(self.raw_data)
        # BUG 3: Filter condition inverted (keeps outliers!)
        return [x for x in self.raw_data if abs(x - mean) > self.threshold * std_dev]
`,
      'test_pipeline.py': `import unittest
from pipeline import DataPipeline

class TestDataPipeline(unittest.TestCase):
    def test_add_data_points(self):
        p = DataPipeline()
        p.add_data_points([10.0, -5.0, 15.0])
        self.assertEqual(len(p.raw_data), 3)

    def test_calculate_mean(self):
        p = DataPipeline()
        p.add_data_points([10.0, 20.0, 30.0])
        self.assertAlmostEqual(p.calculate_mean(), 20.0)

if __name__ == '__main__':
    unittest.main()
`
    },
    hiddenTests: {
      'hidden_test_pipeline.py': `import unittest
from pipeline import DataPipeline

class TestHiddenEdgeCases(unittest.TestCase):
    def test_filter_outliers(self):
        p = DataPipeline(threshold=1.5)
        p.add_data_points([10.0, 12.0, 11.0, 100.0, 9.0])
        filtered = p.filter_outliers()
        self.assertNotIn(100.0, filtered)

if __name__ == '__main__':
    unittest.main()
`
    }
  },

  'python-evaluator': {
    id: 'python-evaluator',
    name: 'Expression Evaluator & Math Parser',
    language: 'python',
    difficulty: 'Medium',
    description: 'Fix operator precedence, parentheses parsing, and division-by-zero checks in expression parser.',
    files: {
      'evaluator.py': `"""
Math Expression Parser
"""
class ExpressionEvaluator:
    def evaluate(self, expr):
        if not expr:
            return 0
        # Clean whitespace
        tokens = expr.replace(" ", "")
        # BUG 1: Ignores parenthesized expressions!
        return self._eval_simple(tokens)

    def _eval_simple(self, tokens):
        # BUG 2: Inverted multiplication vs addition precedence
        if "+" in tokens:
            parts = tokens.split("+")
            return sum(self._eval_simple(p) for p in parts)
        if "*" in tokens:
            parts = tokens.split("*")
            res = 1
            for p in parts:
                res *= float(p)
            return res
        return float(tokens)
`,
      'test_evaluator.py': `import unittest
from evaluator import ExpressionEvaluator

class TestEvaluator(unittest.TestCase):
    def test_simple_addition(self):
        ev = ExpressionEvaluator()
        self.assertEqual(ev.evaluate("10 + 20"), 30.0)

    def test_precedence(self):
        ev = ExpressionEvaluator()
        self.assertEqual(ev.evaluate("2 + 3 * 4"), 14.0)

if __name__ == '__main__':
    unittest.main()
`
    },
    hiddenTests: {
      'hidden_test_evaluator.py': `import unittest
from evaluator import ExpressionEvaluator

class TestHiddenEvaluator(unittest.TestCase):
    def test_parentheses(self):
        ev = ExpressionEvaluator()
        self.assertEqual(ev.evaluate("(2 + 3) * 4"), 20.0)

if __name__ == '__main__':
    unittest.main()
`
    }
  },

  'c-memory-buffer': {
    id: 'c-memory-buffer',
    name: 'Dynamic Memory Buffer & Ring Queue',
    language: 'c',
    difficulty: 'Hard',
    description: 'Fix pointer off-by-one bugs, string sanitization, and buffer overflows in C memory manager.',
    files: {
      'buffer.c': `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char *data;
    size_t capacity;
    size_t size;
} DynamicBuffer;

DynamicBuffer* create_buffer(size_t initial_capacity) {
    DynamicBuffer *buf = (DynamicBuffer*)malloc(sizeof(DynamicBuffer));
    if (!buf) return NULL;
    buf->capacity = initial_capacity;
    buf->size = 0;
    // BUG 1: Allocates capacity - 1 bytes
    buf->data = (char*)malloc(initial_capacity - 1);
    return buf;
}

int append_string(DynamicBuffer *buf, const char *str) {
    if (!buf || !str) return -1;
    size_t len = strlen(str);
    if (buf->size + len >= buf->capacity) {
        size_t new_cap = buf->capacity * 2 + len;
        char *new_data = (char*)realloc(buf->data, new_cap);
        if (!new_data) return -1;
        buf->data = new_data;
        buf->capacity = new_cap;
    }
    // BUG 2: Truncates null terminator
    memcpy(buf->data + buf->size, str, len);
    buf->size += len;
    buf->data[buf->size - 1] = '\\0';
    return 0;
}

void free_buffer(DynamicBuffer *buf) {
    if (buf) {
        if (buf->data) free(buf->data);
        free(buf);
    }
}
`,
      'test_buffer.c': `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "buffer.c"

int main() {
    printf("Running C Dynamic Buffer Unit Tests...\\n");
    DynamicBuffer *buf = create_buffer(16);
    assert(buf != NULL);
    assert(buf->capacity == 16);
    int status = append_string(buf, "CODE_MAFIA");
    assert(status == 0);
    assert(strcmp(buf->data, "CODE_MAFIA") == 0);
    free_buffer(buf);
    printf("All Public C Unit Tests Passed!\\n");
    return 0;
}
`
    },
    hiddenTests: {
      'hidden_test_buffer.c': `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "buffer.c"

int main() {
    DynamicBuffer *buf = create_buffer(8);
    append_string(buf, "Hello ");
    append_string(buf, "World!");
    assert(strcmp(buf->data, "Hello World!") == 0);
    free_buffer(buf);
    printf("All Hidden C Tests Passed!\\n");
    return 0;
}
`
    }
  },

  'cpp-circular-queue': {
    id: 'cpp-circular-queue',
    name: 'Thread-Safe Circular Task Queue',
    language: 'cpp',
    difficulty: 'Hard',
    description: 'Fix circular buffer indexing, move semantics, and wraparound bugs in C++ Template Queue.',
    files: {
      'queue.cpp': `#include <iostream>
#include <vector>
#include <stdexcept>
#include <string>

template <typename T>
class CircularQueue {
private:
    std::vector<T> buffer;
    size_t head;
    size_t tail;
    size_t count;
    size_t capacity;

public:
    explicit CircularQueue(size_t cap) 
        : buffer(cap), head(0), tail(0), count(0), capacity(cap) {}

    bool enqueue(const T& item) {
        if (isFull()) return false;
        buffer[tail] = item;
        // BUG 1: Modulo uses count instead of capacity!
        tail = (tail + 1) % (count + 1);
        count++;
        return true;
    }

    bool dequeue(T& outItem) {
        if (isEmpty()) return false;
        outItem = buffer[head];
        // BUG 2: Head increments twice!
        head = (head + 2) % capacity;
        count--;
        return true;
    }

    bool isFull() const { return count == capacity; }
    bool isEmpty() const { return count == 0; }
    size_t size() const { return count; }
};
`,
      'test_queue.cpp': `#include <iostream>
#include <cassert>
#include "queue.cpp"

int main() {
    std::cout << "Running C++ Circular Queue Unit Tests..." << std::endl;
    CircularQueue<int> q(5);
    assert(q.isEmpty() == true);
    assert(q.enqueue(10) == true);
    assert(q.enqueue(20) == true);
    int val;
    assert(q.dequeue(val) == true);
    assert(val == 10);
    std::cout << "All Public C++ Unit Tests Passed!" << std::endl;
    return 0;
}
`
    },
    hiddenTests: {
      'hidden_test_queue.cpp': `#include <iostream>
#include <cassert>
#include "queue.cpp"

int main() {
    CircularQueue<std::string> q(3);
    q.enqueue("Task1");
    q.enqueue("Task2");
    q.enqueue("Task3");
    assert(q.isFull() == true);
    std::string val;
    q.dequeue(val);
    assert(val == "Task1");
    std::cout << "All Hidden C++ Tests Passed!" << std::endl;
    return 0;
}
`
    }
  },

  'python-async-cache': {
    id: 'python-async-cache',
    name: 'LRU Cache Engine with TTL & Eviction',
    language: 'python',
    difficulty: 'Hard',
    description: 'Fix cache eviction ordering, TTL expiry validation, and capacity overflow in Python LRU Cache.',
    files: {
      'cache.py': `"""
LRU Cache with Time-To-Live (TTL) Eviction
"""
import time

class LRUCache:
    def __init__(self, capacity=3, default_ttl=60):
        self.capacity = capacity
        self.default_ttl = default_ttl
        self.cache = {}
        self.access_order = []

    def put(self, key, value, ttl=None):
        expire_time = time.time() + (ttl if ttl is not None else self.default_ttl)
        if key in self.cache:
            self.access_order.remove(key)
        elif len(self.cache) >= self.capacity:
            # BUG 1: Evicts newest item instead of oldest LRU item!
            lru_key = self.access_order.pop(-1)
            del self.cache[lru_key]
        
        self.cache[key] = {'value': value, 'expire_time': expire_time}
        self.access_order.append(key)

    def get(self, key):
        if key not in self.cache:
            return None
        item = self.cache[key]
        # BUG 2: Inverted expiration check (returns expired items!)
        if time.time() < item['expire_time']:
            del self.cache[key]
            self.access_order.remove(key)
            return None
        
        self.access_order.remove(key)
        self.access_order.append(key)
        return item['value']
`,
      'test_cache.py': `import unittest
import time
from cache import LRUCache

class TestLRUCache(unittest.TestCase):
    def test_put_and_get(self):
        c = LRUCache(capacity=2, default_ttl=10)
        c.put("a", 100)
        c.put("b", 200)
        self.assertEqual(c.get("a"), 100)

    def test_lru_eviction(self):
        c = LRUCache(capacity=2, default_ttl=10)
        c.put("x", 1)
        c.put("y", 2)
        c.get("x")
        c.put("z", 3)
        self.assertIsNone(c.get("y"))
        self.assertEqual(c.get("x"), 1)

if __name__ == '__main__':
    unittest.main()
`
    },
    hiddenTests: {
      'hidden_test_cache.py': `import unittest
import time
from cache import LRUCache

class TestHiddenCache(unittest.TestCase):
    def test_ttl_expiry(self):
        c = LRUCache(capacity=5, default_ttl=0.1)
        c.put("temp", "value")
        time.sleep(0.15)
        self.assertIsNone(c.get("temp"))

if __name__ == '__main__':
    unittest.main()
`
    }
  },

  'cpp-graph-routing': {
    id: 'cpp-graph-routing',
    name: 'Network Graph & Shortest Path Router',
    language: 'cpp',
    difficulty: 'Hard',
    description: 'Fix adjacency matrix bounds, edge weight accumulation, and Dijkstra priority queue in C++ Graph Router.',
    files: {
      'router.cpp': `#include <iostream>
#include <vector>
#include <queue>
#include <climits>

class GraphRouter {
private:
    int numNodes;
    std::vector<std::vector<std::pair<int, int>>> adj;

public:
    explicit GraphRouter(int nodes) : numNodes(nodes), adj(nodes) {}

    void addEdge(int u, int v, int weight) {
        if (u < 0 || u >= numNodes || v < 0 || v >= numNodes) return;
        adj[u].push_back({v, weight});
    }

    int shortestPath(int start, int target) {
        if (start < 0 || start >= numNodes || target < 0 || target >= numNodes) return -1;
        std::vector<int> dist(numNodes, INT_MAX);
        dist[start] = 0;

        std::priority_queue<std::pair<int, int>, 
                            std::vector<std::pair<int, int>>, 
                            std::greater<std::pair<int, int>>> pq;
        pq.push({0, start});

        while (!pq.empty()) {
            auto [d, u] = pq.top();
            pq.pop();

            if (u == target) return d;

            for (auto& edge : adj[u]) {
                int v = edge.first;
                int weight = edge.second;
                if (dist[u] != INT_MAX && dist[u] * weight < dist[v]) {
                    dist[v] = dist[u] + weight;
                    pq.push({dist[v], v});
                }
            }
        }
        return dist[target] == INT_MAX ? -1 : dist[target];
    }
};
`,
      'test_router.cpp': `#include <iostream>
#include <cassert>
#include "router.cpp"

int main() {
    std::cout << "Running Graph Router Unit Tests..." << std::endl;
    GraphRouter router(4);
    router.addEdge(0, 1, 4);
    router.addEdge(1, 2, 2);
    router.addEdge(0, 2, 10);
    assert(router.shortestPath(0, 2) == 6);
    std::cout << "All Public Graph Router Tests Passed!" << std::endl;
    return 0;
}
`
    },
    hiddenTests: {
      'hidden_test_router.cpp': `#include <iostream>
#include <cassert>
#include "router.cpp"

int main() {
    GraphRouter router(5);
    router.addEdge(0, 1, 2);
    router.addEdge(1, 3, 5);
    router.addEdge(0, 2, 1);
    router.addEdge(2, 3, 1);
    assert(router.shortestPath(0, 3) == 2);
    std::cout << "All Hidden Graph Router Tests Passed!" << std::endl;
    return 0;
}
`
    }
  }
};

module.exports = challenges;
