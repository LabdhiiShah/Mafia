const crypto = require('crypto');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'code-mafia-super-secret-jwt-key-2026';

// Built-in PBKDF2 Password Hashing & Verification (Zero external dependencies)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// Built-in JWT Token Signing & Verification
function signJWT(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 3600);
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) throw new Error('Invalid signature');
  const decoded = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return decoded;
}

// Register / Sign Up
async function signup(req, res) {
  try {
    const { username, password, avatar } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    // Check if user exists
    const existing = await db.findUserByUsername(username.trim());
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Hash password with PBKDF2
    const passwordHash = hashPassword(password);

    // Save user to PostgreSQL
    const user = await db.createUser(username.trim(), passwordHash, avatar || 'avatar_1');

    // Generate JWT token
    const token = signJWT({ userId: user.id, username: user.username, avatar: user.avatar });

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        total_games: user.total_games || 0,
        dev_wins: user.dev_wins || 0,
        mafia_wins: user.mafia_wins || 0
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error during signup: ' + err.message });
  }
}

// Sign In / Login
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await db.findUserByUsername(username.trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = signJWT({ userId: user.id, username: user.username, avatar: user.avatar });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        total_games: user.total_games || 0,
        dev_wins: user.dev_wins || 0,
        mafia_wins: user.mafia_wins || 0
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login: ' + err.message });
  }
}

// Get Current User Profile
async function getMe(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJWT(token);

    const user = await db.findUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        total_games: user.total_games || 0,
        dev_wins: user.dev_wins || 0,
        mafia_wins: user.mafia_wins || 0
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

module.exports = {
  signup,
  login,
  getMe
};
