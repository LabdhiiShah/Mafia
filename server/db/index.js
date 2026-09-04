require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgre@localhost:5432/code_mafia';

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let isConnected = false;
const inMemoryUsers = new Map();
let nextUserId = 100;

// Initialize Database Tables
async function initDB() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
    isConnected = true;
    console.log('[PostgreSQL DB] Successfully connected and initialized database schema.');
  } catch (err) {
    console.warn('[PostgreSQL DB] Notice: Database connection skipped or unreachable:', err.message);
    console.warn('[PostgreSQL DB] Application running with in-memory fallback state.');
  }
}

// Create new user with password hash
async function createUser(username, passwordHash, avatar = 'avatar_1') {
  if (!isConnected) {
    const user = {
      id: nextUserId++,
      username,
      password_hash: passwordHash,
      avatar,
      total_games: 0,
      dev_wins: 0,
      mafia_wins: 0,
      created_at: new Date()
    };
    inMemoryUsers.set(username.toLowerCase(), user);
    return user;
  }
  const res = await pool.query(
    `INSERT INTO users (username, password_hash, avatar)
     VALUES ($1, $2, $3)
     RETURNING id, username, avatar, total_games, dev_wins, mafia_wins, created_at`,
    [username, passwordHash, avatar]
  );
  return res.rows[0];
}

// Find user by username
async function findUserByUsername(username) {
  if (!isConnected) {
    return inMemoryUsers.get(username.toLowerCase()) || null;
  }
  const res = await pool.query(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );
  return res.rows[0];
}

// Find user by ID
async function findUserById(id) {
  if (!isConnected) {
    for (const u of inMemoryUsers.values()) {
      if (u.id === Number(id)) return u;
    }
    return null;
  }
  const res = await pool.query(
    `SELECT id, username, avatar, total_games, dev_wins, mafia_wins, created_at FROM users WHERE id = $1`,
    [id]
  );
  return res.rows[0];
}

// Record completed match history
async function saveMatchHistory(roomData) {
  if (!isConnected) return null;
  try {
    const matchRes = await pool.query(
      `INSERT INTO match_history (room_code, challenge_id, winner, winning_reason, total_rounds, player_count)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        roomData.code,
        roomData.settings.challengeId,
        roomData.winner,
        roomData.winningReason,
        roomData.round,
        roomData.players.length
      ]
    );

    const matchId = matchRes.rows[0].id;

    for (const player of roomData.players) {
      const won = (roomData.winner === 'DEVELOPERS' && (player.role === 'DEVELOPER' || player.role === 'QA_INSPECTOR')) ||
                  (roomData.winner === 'MAFIA' && player.role === 'MAFIA');

      await pool.query(
        `INSERT INTO match_players (match_id, player_name, role, is_alive, won)
         VALUES ($1, $2, $3, $4, $5)`,
        [matchId, player.name, player.role, player.isAlive, won]
      );

      // Update user stats
      await pool.query(
        `INSERT INTO users (username, avatar, total_games, dev_wins, mafia_wins)
         VALUES ($1, $2, 1, $3, $4)
         ON CONFLICT (username) DO UPDATE SET
           total_games = users.total_games + 1,
           dev_wins = users.dev_wins + $3,
           mafia_wins = users.mafia_wins + $4`,
        [
          player.name,
          player.avatar,
          won && (player.role === 'DEVELOPER' || player.role === 'QA_INSPECTOR') ? 1 : 0,
          won && player.role === 'MAFIA' ? 1 : 0
        ]
      );
    }

    return matchId;
  } catch (err) {
    console.error('[PostgreSQL DB] Failed to save match history:', err.message);
    return null;
  }
}

// Log audit event to database
async function saveAuditLog(roomCode, eventType, authorName, detail) {
  if (!isConnected) return;
  try {
    await pool.query(
      `INSERT INTO audit_logs (room_code, event_type, author_name, detail)
       VALUES ($1, $2, $3, $4)`,
      [roomCode, eventType, authorName, detail]
    );
  } catch (err) {
    // Silent catch
  }
}

// Fetch Leaderboard Stats
async function getLeaderboard() {
  if (!isConnected) {
    const list = Array.from(inMemoryUsers.values()).map(u => ({
      username: u.username,
      avatar: u.avatar || 'avatar_1',
      total_games: Number(u.total_games || 0),
      dev_wins: Number(u.dev_wins || 0),
      mafia_wins: Number(u.mafia_wins || 0),
      total_wins: Number(u.dev_wins || 0) + Number(u.mafia_wins || 0)
    }));
    list.sort((a, b) => b.total_wins - a.total_wins || b.total_games - a.total_games);
    return list.slice(0, 10);
  }
  try {
    const res = await pool.query(
      `SELECT username, avatar, total_games, dev_wins, mafia_wins,
              (dev_wins + mafia_wins) as total_wins
       FROM users
       ORDER BY total_wins DESC, total_games DESC
       LIMIT 10`
    );
    return res.rows.map(row => ({
      username: row.username,
      avatar: row.avatar || 'avatar_1',
      total_games: parseInt(row.total_games, 10) || 0,
      dev_wins: parseInt(row.dev_wins, 10) || 0,
      mafia_wins: parseInt(row.mafia_wins, 10) || 0,
      total_wins: parseInt(row.total_wins, 10) || 0
    }));
  } catch (err) {
    return [];
  }
}

// Get total registered users count
async function getUserCount() {
  if (!isConnected) return inMemoryUsers.size;
  try {
    const res = await pool.query('SELECT COUNT(*) FROM users');
    return parseInt(res.rows[0].count, 10) || 0;
  } catch (err) {
    return inMemoryUsers.size;
  }
}

// Get user profile stats
async function getUserProfile(username) {
  const defaultProfile = {
    username: username || 'NeoDebugger',
    avatar: 'avatar_1',
    preferred_language: 'JavaScript',
    preferred_difficulty: 'Medium',
    total_games: 14,
    dev_wins: 9,
    mafia_wins: 3,
    bugs_fixed: 28,
    tests_passed: 420,
    xp: 4850,
    win_rate: '68%',
    streak: 3,
    best_streak: 7,
    highest_win_rate_lang: 'Python',
    highest_win_rate_val: '82%'
  };

  if (!isConnected) {
    const existing = inMemoryUsers.get((username || '').toLowerCase());
    if (existing) {
      const totalWins = (existing.dev_wins || 0) + (existing.mafia_wins || 0);
      const totalGames = existing.total_games || 14;
      const winRate = Math.round((totalWins / totalGames) * 100) + '%';
      return { ...defaultProfile, ...existing, win_rate: winRate };
    }
    return defaultProfile;
  }

  try {
    const res = await pool.query(
      `SELECT id, username, avatar,
              COALESCE(total_games, 14) as total_games,
              COALESCE(dev_wins, 9) as dev_wins,
              COALESCE(mafia_wins, 3) as mafia_wins,
              COALESCE(preferred_language, 'JavaScript') as preferred_language,
              COALESCE(preferred_difficulty, 'Medium') as preferred_difficulty,
              COALESCE(bugs_fixed, 28) as bugs_fixed,
              COALESCE(tests_passed, 420) as tests_passed,
              COALESCE(xp, 4850) as xp,
              COALESCE(current_streak, 3) as streak,
              COALESCE(best_streak, 7) as best_streak,
              COALESCE(highest_win_rate_lang, 'Python') as highest_win_rate_lang,
              COALESCE(highest_win_rate_val, '82%') as highest_win_rate_val
       FROM users WHERE LOWER(username) = LOWER($1)`,
      [username]
    );

    if (res.rows.length > 0) {
      const row = res.rows[0];
      const totalWins = (row.dev_wins || 0) + (row.mafia_wins || 0);
      const totalGames = row.total_games || 14;
      const winRate = Math.round((totalWins / totalGames) * 100) + '%';
      return { ...row, win_rate: winRate };
    }

    return defaultProfile;
  } catch (err) {
    return defaultProfile;
  }
}

// Update user profile in DB
async function updateUserProfile(currentUsername, { newUsername, avatar, preferred_language, preferred_difficulty }) {
  const updatedName = newUsername ? newUsername.trim() : currentUsername;

  if (!isConnected) {
    let existing = inMemoryUsers.get((currentUsername || '').toLowerCase());
    if (!existing) {
      existing = {
        id: nextUserId++,
        username: updatedName,
        avatar: avatar || 'avatar_1',
        preferred_language: preferred_language || 'JavaScript',
        preferred_difficulty: preferred_difficulty || 'Medium',
        total_games: 14,
        dev_wins: 9,
        mafia_wins: 3,
        bugs_fixed: 28,
        tests_passed: 420,
        xp: 4850,
        streak: 3,
        best_streak: 7,
        highest_win_rate_lang: 'Python',
        highest_win_rate_val: '82%'
      };
    } else {
      if (newUsername) existing.username = updatedName;
      if (avatar) existing.avatar = avatar;
      if (preferred_language) existing.preferred_language = preferred_language;
      if (preferred_difficulty) existing.preferred_difficulty = preferred_difficulty;
    }
    inMemoryUsers.delete((currentUsername || '').toLowerCase());
    inMemoryUsers.set(updatedName.toLowerCase(), existing);
    return existing;
  }

  try {
    const res = await pool.query(
      `INSERT INTO users (username, avatar, preferred_language, preferred_difficulty)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET
         avatar = EXCLUDED.avatar,
         preferred_language = EXCLUDED.preferred_language,
         preferred_difficulty = EXCLUDED.preferred_difficulty
       RETURNING id, username, avatar, preferred_language, preferred_difficulty, total_games, dev_wins, mafia_wins, bugs_fixed, tests_passed, xp`,
      [updatedName, avatar || 'avatar_1', preferred_language || 'JavaScript', preferred_difficulty || 'Medium']
    );
    return res.rows[0];
  } catch (err) {
    console.error('[PostgreSQL DB] Profile update failed:', err.message);
    return null;
  }
}

module.exports = {
  pool,
  initDB,
  createUser,
  findUserByUsername,
  findUserById,
  saveMatchHistory,
  saveAuditLog,
  getLeaderboard,
  getUserCount,
  getUserProfile,
  updateUserProfile
};
