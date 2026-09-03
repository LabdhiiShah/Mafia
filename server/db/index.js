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
  if (!isConnected) return null;
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
  if (!isConnected) return null;
  const res = await pool.query(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );
  return res.rows[0];
}

// Find user by ID
async function findUserById(id) {
  if (!isConnected) return null;
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
  if (!isConnected) return [];
  try {
    const res = await pool.query(
      `SELECT username, avatar, total_games, dev_wins, mafia_wins,
              (dev_wins + mafia_wins) as total_wins
       FROM users
       ORDER BY total_wins DESC, total_games DESC
       LIMIT 10`
    );
    return res.rows;
  } catch (err) {
    return [];
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
  getLeaderboard
};
