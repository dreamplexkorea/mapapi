/**
 * XP 및 레벨 시스템
 */

// XP 획득량
export const XP_VALUES = {
  SESSION_COMPLETE: 50,    // 훈련 완료
  FULL_COMPLETE_BONUS: 20, // 완주 보너스 (35회 완료)
  STREAK_MULTIPLIER: 5,    // 연속일 × 5
  BADGE_EARNED: 100        // 배지 획득
};

// 레벨 테이블
export const LEVEL_THRESHOLDS = [
  // Level 1-5: 100 XP/Lv (초보자)
  { level: 1, xpRequired: 0, tier: '초보자' },
  { level: 2, xpRequired: 100, tier: '초보자' },
  { level: 3, xpRequired: 200, tier: '초보자' },
  { level: 4, xpRequired: 300, tier: '초보자' },
  { level: 5, xpRequired: 400, tier: '초보자' },
  // Level 6-10: 200 XP/Lv (중급자)
  { level: 6, xpRequired: 500, tier: '중급자' },
  { level: 7, xpRequired: 700, tier: '중급자' },
  { level: 8, xpRequired: 900, tier: '중급자' },
  { level: 9, xpRequired: 1100, tier: '중급자' },
  { level: 10, xpRequired: 1300, tier: '중급자' },
  // Level 11-20: 300 XP/Lv (숙련자)
  { level: 11, xpRequired: 1500, tier: '숙련자' },
  { level: 12, xpRequired: 1800, tier: '숙련자' },
  { level: 13, xpRequired: 2100, tier: '숙련자' },
  { level: 14, xpRequired: 2400, tier: '숙련자' },
  { level: 15, xpRequired: 2700, tier: '숙련자' },
  { level: 16, xpRequired: 3000, tier: '숙련자' },
  { level: 17, xpRequired: 3300, tier: '숙련자' },
  { level: 18, xpRequired: 3600, tier: '숙련자' },
  { level: 19, xpRequired: 3900, tier: '숙련자' },
  { level: 20, xpRequired: 4200, tier: '숙련자' },
  // Level 21+: 500 XP/Lv (마스터)
  { level: 21, xpRequired: 4500, tier: '마스터' }
];

/**
 * XP로 레벨 계산
 * @param {number} xp - 총 XP
 * @returns {Object} { level, tier, currentXp, nextLevelXp, progress }
 */
export function calculateLevel(xp) {
  let levelInfo = LEVEL_THRESHOLDS[0];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xpRequired) {
      levelInfo = LEVEL_THRESHOLDS[i];
      break;
    }
  }

  // 다음 레벨까지 필요한 XP 계산
  let nextLevelXp;
  const currentLevelIndex = LEVEL_THRESHOLDS.findIndex(t => t.level === levelInfo.level);

  if (currentLevelIndex < LEVEL_THRESHOLDS.length - 1) {
    nextLevelXp = LEVEL_THRESHOLDS[currentLevelIndex + 1].xpRequired;
  } else {
    // 레벨 21 이상: 500 XP씩 증가
    const levelsAbove21 = levelInfo.level - 21;
    const currentThreshold = 4500 + (levelsAbove21 * 500);
    nextLevelXp = currentThreshold + 500;

    // 실제 레벨 재계산 (21 이상)
    if (xp >= 4500) {
      const xpAbove21 = xp - 4500;
      const extraLevels = Math.floor(xpAbove21 / 500);
      levelInfo = {
        level: 21 + extraLevels,
        tier: '마스터',
        xpRequired: 4500 + (extraLevels * 500)
      };
      nextLevelXp = levelInfo.xpRequired + 500;
    }
  }

  const currentXp = xp - levelInfo.xpRequired;
  const xpForNextLevel = nextLevelXp - levelInfo.xpRequired;
  const progress = xpForNextLevel > 0 ? currentXp / xpForNextLevel : 1;

  return {
    level: levelInfo.level,
    tier: levelInfo.tier,
    totalXp: xp,
    currentXp,
    nextLevelXp,
    xpForNextLevel,
    progress: Math.min(progress, 1)
  };
}

/**
 * 세션 완료 시 획득 XP 계산
 * @param {Object} options
 * @param {boolean} options.completed - 완주 여부 (35회)
 * @param {number} options.streak - 현재 연속일
 * @param {number} options.newBadgeCount - 새로 획득한 배지 수
 * @returns {Object} { total, breakdown }
 */
export function calculateSessionXp({ completed = false, streak = 0, newBadgeCount = 0 }) {
  const breakdown = {
    base: XP_VALUES.SESSION_COMPLETE,
    completionBonus: completed ? XP_VALUES.FULL_COMPLETE_BONUS : 0,
    streakBonus: streak * XP_VALUES.STREAK_MULTIPLIER,
    badgeBonus: newBadgeCount * XP_VALUES.BADGE_EARNED
  };

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { total, breakdown };
}

/**
 * XP 추가 및 레벨업 확인
 * @param {number} currentXp - 현재 XP
 * @param {number} gainedXp - 획득한 XP
 * @returns {Object} { newXp, oldLevel, newLevel, leveledUp }
 */
export function addXp(currentXp, gainedXp) {
  const oldLevelInfo = calculateLevel(currentXp);
  const newXp = currentXp + gainedXp;
  const newLevelInfo = calculateLevel(newXp);

  return {
    newXp,
    oldLevel: oldLevelInfo.level,
    newLevel: newLevelInfo.level,
    leveledUp: newLevelInfo.level > oldLevelInfo.level,
    levelsGained: newLevelInfo.level - oldLevelInfo.level
  };
}

/**
 * 레벨 정보 조회
 * @param {number} level
 * @returns {Object|null}
 */
export function getLevelInfo(level) {
  if (level <= 0) return null;

  if (level <= 20) {
    return LEVEL_THRESHOLDS.find(t => t.level === level) || null;
  }

  // 레벨 21 이상
  return {
    level,
    xpRequired: 4500 + ((level - 21) * 500),
    tier: '마스터'
  };
}
