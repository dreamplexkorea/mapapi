/**
 * 마일스톤 시스템
 * 특정 달성 시점에 축하 메시지/모달 표시
 */

// 연속일 마일스톤
export const STREAK_MILESTONES = [
  { days: 3,  emoji: '🔥', message: '3일 연속 달성!', description: '습관의 시작이에요' },
  { days: 7,  emoji: '⚔️', message: '일주일 전사!', description: '꾸준히 잘하고 있어요' },
  { days: 14, emoji: '🌟', message: '2주 연속!', description: '습관이 자리잡고 있어요' },
  { days: 21, emoji: '💪', message: '21일 습관 형성!', description: '이제 몸이 기억해요' },
  { days: 30, emoji: '🏆', message: '한 달의 기적!', description: '대단해요!' },
  { days: 60, emoji: '👑', message: '60일 마스터!', description: '진정한 혀 근력왕' },
  { days: 100, emoji: '💯', message: '100일 전설!', description: '당신은 전설입니다' }
];

// 세션 수 마일스톤
export const SESSION_MILESTONES = [
  { count: 1,   emoji: '🌱', message: '첫 훈련 완료!', description: '여정이 시작되었어요' },
  { count: 10,  emoji: '⭐', message: '10회 달성!', description: '점점 익숙해지고 있어요' },
  { count: 25,  emoji: '🎯', message: '25회 달성!', description: '꾸준함이 빛나요' },
  { count: 50,  emoji: '🎖️', message: '50회 달성!', description: '절반 왔어요!' },
  { count: 100, emoji: '💯', message: '100회 달성!', description: '세 자릿수 돌파!' },
  { count: 365, emoji: '🎊', message: '1년치 훈련!', description: '365회, 놀라워요!' }
];

// 레벨업 메시지
export const LEVEL_UP_MESSAGES = {
  '초보자': { emoji: '🌱', message: '성장하고 있어요!' },
  '중급자': { emoji: '⭐', message: '중급자로 승급!' },
  '숙련자': { emoji: '💪', message: '숙련자의 영역!' },
  '마스터': { emoji: '👑', message: '마스터 등극!' }
};

/**
 * 연속일 마일스톤 확인
 * @param {number} streak - 현재 연속일
 * @returns {Object|null} 달성한 마일스톤 또는 null
 */
export function checkStreakMilestone(streak) {
  return STREAK_MILESTONES.find(m => m.days === streak) || null;
}

/**
 * 세션 수 마일스톤 확인
 * @param {number} sessionCount - 총 세션 수
 * @returns {Object|null} 달성한 마일스톤 또는 null
 */
export function checkSessionMilestone(sessionCount) {
  return SESSION_MILESTONES.find(m => m.count === sessionCount) || null;
}

/**
 * 레벨업 메시지 조회
 * @param {number} oldLevel
 * @param {number} newLevel
 * @param {string} newTier
 * @returns {Object} { leveledUp, message, tierChanged, tierMessage }
 */
export function getLevelUpMessage(oldLevel, newLevel, newTier) {
  const leveledUp = newLevel > oldLevel;
  const tierMessage = LEVEL_UP_MESSAGES[newTier] || LEVEL_UP_MESSAGES['초보자'];

  // 티어 변경 확인
  const oldTierThresholds = [1, 6, 11, 21];
  const oldTierIndex = oldTierThresholds.filter(t => oldLevel >= t).length - 1;
  const newTierIndex = oldTierThresholds.filter(t => newLevel >= t).length - 1;
  const tierChanged = newTierIndex > oldTierIndex;

  return {
    leveledUp,
    newLevel,
    message: leveledUp ? `레벨 ${newLevel} 달성!` : null,
    tierChanged,
    tierMessage: tierChanged ? tierMessage : null
  };
}

/**
 * 모든 달성 이벤트 확인 (세션 완료 후 호출)
 * @param {Object} params
 * @param {number} params.streak - 현재 연속일
 * @param {number} params.sessionCount - 총 세션 수
 * @param {number} params.oldLevel - 이전 레벨
 * @param {number} params.newLevel - 새 레벨
 * @param {string} params.newTier - 새 티어
 * @param {string[]} params.newBadges - 새로 획득한 배지 ID
 * @returns {Object} { streakMilestone, sessionMilestone, levelUp, newBadges }
 */
export function checkAllMilestones({
  streak = 0,
  sessionCount = 0,
  oldLevel = 1,
  newLevel = 1,
  newTier = '초보자',
  newBadges = []
}) {
  return {
    streakMilestone: checkStreakMilestone(streak),
    sessionMilestone: checkSessionMilestone(sessionCount),
    levelUp: getLevelUpMessage(oldLevel, newLevel, newTier),
    newBadges
  };
}

/**
 * 다음 마일스톤까지 남은 일수/횟수 계산
 * @param {number} current - 현재 값
 * @param {Array} milestones - 마일스톤 배열
 * @param {string} key - 비교할 키 (days 또는 count)
 * @returns {Object|null} { next, remaining }
 */
export function getNextMilestone(current, milestones, key) {
  const upcoming = milestones.filter(m => m[key] > current);
  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  return {
    next,
    remaining: next[key] - current
  };
}
