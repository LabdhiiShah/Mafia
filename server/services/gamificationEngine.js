// Code Mafia Gamification Engine: XP, Streaks, Achievements & Badges

const ACHIEVEMENTS = {
  BUG_HUNTER: { id: 'BUG_HUNTER', name: 'Bug Hunter', icon: '🐛', description: 'Fixed 3 failing unit test suites.' },
  MASTER_DETECTIVE: { id: 'MASTER_DETECTIVE', name: 'Master Detective', icon: '🕵️', description: 'Correctly voted out a Mafia saboteur.' },
  STEALTH_SABOTEUR: { id: 'STEALTH_SABOTEUR', name: 'Stealth Saboteur', icon: '💀', description: 'Won a match as Mafia without receiving votes.' },
  STREAK_MASTER: { id: 'STREAK_MASTER', name: 'Streak Master', icon: '🔥', description: 'Achieved a 3x consecutive test pass streak combo.' },
  RISK_TAKER: { id: 'RISK_TAKER', name: 'High Roller', icon: '🧪', description: 'Successfully executed a high-stakes Risky Run.' }
};

class GamificationEngine {
  constructor() {
    // Map roomCode -> { xpPool, playerStats: Map(socketId -> { xp, streak, badges }) }
    this.roomStats = new Map();
  }

  initRoom(roomCode) {
    this.roomStats.set(roomCode, {
      teamXp: 300, // Starting team XP pool (can buy hints)
      hintsAvailable: 2,
      hintsUsed: [],
      players: new Map()
    });
  }

  getPlayerState(roomCode, socketId, playerName) {
    const room = this.roomStats.get(roomCode);
    if (!room) return { xp: 0, streak: 0, badges: [] };

    if (!room.players.has(socketId)) {
      room.players.set(socketId, {
        name: playerName,
        xp: 0,
        streak: 0,
        badges: []
      });
    }

    return room.players.get(socketId);
  }

  recordTestRun(roomCode, socketId, playerName, isSuccess, isRiskyRun = false) {
    const room = this.roomStats.get(roomCode);
    if (!room) return { xpEarned: 0, currentStreak: 0, multiplier: 1.0 };

    const pState = this.getPlayerState(roomCode, socketId, playerName);

    if (isSuccess) {
      pState.streak += 1;
      let multiplier = pState.streak >= 3 ? 2.0 : pState.streak >= 2 ? 1.5 : 1.0;
      let baseXP = isRiskyRun ? 150 : 50;

      const totalXP = Math.round(baseXP * multiplier);
      pState.xp += totalXP;
      room.teamXp += totalXP;

      // Check badges
      if (pState.streak >= 3 && !pState.badges.includes('STREAK_MASTER')) {
        pState.badges.push('STREAK_MASTER');
      }
      if (isRiskyRun && !pState.badges.includes('RISK_TAKER')) {
        pState.badges.push('RISK_TAKER');
      }

      return { xpEarned: totalXP, currentStreak: pState.streak, multiplier };
    } else {
      // Reset streak on failed test run
      pState.streak = 0;
      return { xpEarned: 0, currentStreak: 0, multiplier: 1.0 };
    }
  }

  recordSubcodeFix(roomCode, socketId, playerName) {
    const room = this.roomStats.get(roomCode);
    if (!room) return { xpEarned: 0 };
    const pState = this.getPlayerState(roomCode, socketId, playerName);
    const xpEarned = 100;
    pState.xp += xpEarned;
    room.teamXp += xpEarned;
    return { xpEarned };
  }

  recordCorrectVote(roomCode, socketId, playerName) {
    const room = this.roomStats.get(roomCode);
    if (!room) return { xpEarned: 0 };
    const pState = this.getPlayerState(roomCode, socketId, playerName);
    const xpEarned = 150;
    pState.xp += xpEarned;
    if (!pState.badges.includes('MASTER_DETECTIVE')) {
      pState.badges.push('MASTER_DETECTIVE');
    }
    return { xpEarned };
  }

  recordDirectKillBonus(roomCode, socketId, playerName) {
    const room = this.roomStats.get(roomCode);
    if (!room) return { xpEarned: 0 };
    const pState = this.getPlayerState(roomCode, socketId, playerName);
    const xpEarned = 250;
    pState.xp += xpEarned;
    if (!pState.badges.includes('BUG_HUNTER')) {
      pState.badges.push('BUG_HUNTER');
    }
    return { xpEarned };
  }

  awardMatchEndXP(roomCode, winner, playersMap = new Map()) {
    const room = this.roomStats.get(roomCode);
    if (!room) return;

    for (const playerObj of playersMap.values()) {
      const pState = this.getPlayerState(roomCode, playerObj.socketId || playerObj.id, playerObj.name);
      const isCivilianTeam = playerObj.role === 'CIVILIAN' || playerObj.role === 'DETECTIVE' || playerObj.role === 'DEVELOPER' || playerObj.role === 'QA_INSPECTOR';
      const isMafiaTeam = playerObj.role === 'MAFIA';

      if (winner === 'CIVILIANS' && isCivilianTeam) {
        pState.xp += 300; // Base match victory bonus
        if (playerObj.isAlive) pState.xp += 150; // Survival bonus
        if (playerObj.role === 'DETECTIVE' || playerObj.role === 'QA_INSPECTOR') {
          pState.xp += 200; // Detective investigation bonus
        }
      } else if (winner === 'MAFIA' && isMafiaTeam) {
        pState.xp += 300; // Mafia sabotage victory bonus
        if (playerObj.isAlive) pState.xp += 150; // Survival bonus
      } else {
        // Consolation participation bonus for good effort
        pState.xp += 100;
      }
    }
  }

  buyHint(roomCode, hintType) {
    const room = this.roomStats.get(roomCode);
    if (!room || room.hintsAvailable <= 0) {
      return { success: false, error: 'No hints remaining for this match' };
    }

    const cost = hintType === 'LOCATION' ? 100 : 250;

    if (room.teamXp < cost) {
      return { success: false, error: `Insufficient Team XP pool. Need ${cost} XP (Current: ${room.teamXp} XP)` };
    }

    room.teamXp -= cost;
    room.hintsAvailable -= 1;
    room.hintsUsed.push({ type: hintType, cost });

    return {
      success: true,
      remainingTeamXp: room.teamXp,
      hintsAvailable: room.hintsAvailable,
      cost
    };
  }

  getRoomGamificationState(roomCode) {
    const room = this.roomStats.get(roomCode);
    if (!room) return { teamXp: 300, hintsAvailable: 2, hintsUsed: [] };
    return {
      teamXp: room.teamXp,
      hintsAvailable: room.hintsAvailable,
      hintsUsed: room.hintsUsed
    };
  }
}

module.exports = {
  gamification: new GamificationEngine(),
  ACHIEVEMENTS
};
