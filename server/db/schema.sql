-- CODE MAFIA PostgreSQL Database Initialization Schema

-- 1. Users & Stats persistent table (with password authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    avatar VARCHAR(50) DEFAULT 'avatar_1',
    total_games INT DEFAULT 0,
    dev_wins INT DEFAULT 0,
    mafia_wins INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure password_hash column exists if table was created previously
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 2. Match History table
CREATE TABLE IF NOT EXISTS match_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(20) NOT NULL,
    challenge_id VARCHAR(50) NOT NULL,
    winner VARCHAR(20) NOT NULL, -- 'DEVELOPERS' or 'MAFIA'
    winning_reason TEXT,
    total_rounds INT DEFAULT 1,
    player_count INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Match Players table
CREATE TABLE IF NOT EXISTS match_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES match_history(id) ON DELETE CASCADE,
    player_name VARCHAR(50) NOT NULL,
    role VARCHAR(30) NOT NULL, -- 'DEVELOPER', 'MAFIA', 'QA_INSPECTOR'
    is_alive BOOLEAN DEFAULT true,
    won BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Audit Trail & Diff Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(20) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    author_name VARCHAR(50) NOT NULL,
    detail TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Custom Challenges table
CREATE TABLE IF NOT EXISTS custom_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'Medium',
    description TEXT,
    files JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
