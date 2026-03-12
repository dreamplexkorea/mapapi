/**
 * 배지 시스템
 * 8개의 배지와 획득 조건 정의
 */

export const BADGES = [
  { id: 'first_step',    emoji: '🌱', name: '첫 걸음',     description: '첫 훈련 완료' },
  { id: 'week_warrior',  emoji: '⚔️', name: '일주일 전사', description: '7일 연속 훈련' },
  { id: 'month_miracle', emoji: '🏆', name: '한 달의 기적', description: '30일 연속 훈련' },
  { id: 'morning_bird',  emoji: '🌅', name: '아침형 인간', description: '오전 6-9시 훈련 10회' },
  { id: 'night_owl',     emoji: '🦉', name: '올빼미',       description: '밤 9시 후 훈련 10회' },
  { id: 'sleep_master',  emoji: '😴', name: '수면 마스터', description: '7시간+ 수면 후 훈련 10회' },
  { id: 'century',       emoji: '💯', name: '100회 달성',  description: '총 100회 훈련' },
  { id: 'champion',      emoji: '👑', name: '혀 근력왕',   description: '8주 프로그램 완주' }
];

/**
 * 배지 ID로 배지 정보 조회
 * @param {string} badgeId
 * @returns {Object|null}
 */
export function getBadgeById(badgeId) {
  return BADGES.find(b => b.id === badgeId) || null;
}

/**
 * 사용자 통계 기반으로 획득 가능한 배지 계산
 * @param {Object} stats - 사용자 통계
 * @param {number} stats.totalSessions - 총 세션 수
 * @param {number} stats.maxStreak - 최장 연속일
 * @param {number} stats.morningCount - 아침 훈련 횟수 (6-9시)
 * @param {number} stats.eveningCount - 저녁 훈련 횟수 (21시 이후)
 * @param {number} stats.goodSleepCount - 7시간+ 수면 후 훈련 횟수
 * @param {number} stats.programWeeks - 완료한 프로그램 주차
 * @returns {string[]} 획득 가능한 배지 ID 배열
 */
export function getEarnedBadges(stats) {
  const earned = [];

  if (stats.totalSessions >= 1) earned.push('first_step');
  if (stats.maxStreak >= 7) earned.push('week_warrior');
  if (stats.maxStreak >= 30) earned.push('month_miracle');
  if (stats.morningCount >= 10) earned.push('morning_bird');
  if (stats.eveningCount >= 10) earned.push('night_owl');
  if (stats.goodSleepCount >= 10) earned.push('sleep_master');
  if (stats.totalSessions >= 100) earned.push('century');
  if (stats.programWeeks >= 8) earned.push('champion');

  return earned;
}

/**
 * 새로 획득한 배지 확인
 * @param {string[]} currentBadges - 현재 보유 배지
 * @param {string[]} earnedBadges - 획득 가능한 배지
 * @returns {string[]} 새로 획득한 배지 ID 배열
 */
export function getNewBadges(currentBadges, earnedBadges) {
  return earnedBadges.filter(b => !currentBadges.includes(b));
}

/**
 * 히스토리에서 배지 관련 통계 계산
 * @param {Array} history - 세션 히스토리
 * @param {Object} sleepData - 수면 데이터 { [date]: { hours } }
 * @param {number} maxStreak - 최장 연속일
 * @returns {Object} 배지용 통계
 */
export function calculateBadgeStats(history, sleepData = {}, maxStreak = 0) {
  let morningCount = 0;
  let eveningCount = 0;
  let goodSleepCount = 0;

  history.forEach(session => {
    const hour = new Date(session.timestamp).getHours();

    // 아침 (6-9시)
    if (hour >= 6 && hour < 9) {
      morningCount++;
    }

    // 저녁 (21시 이후)
    if (hour >= 21 || hour < 5) {
      eveningCount++;
    }

    // 7시간+ 수면 후 훈련
    const sleep = sleepData[session.date];
    if (sleep && parseFloat(sleep.hours) >= 7) {
      goodSleepCount++;
    }
  });

  // 프로그램 주차 계산 (첫 훈련 날짜 기준)
  let programWeeks = 0;
  if (history.length > 0) {
    const sortedDates = [...new Set(history.map(s => s.date))].sort();
    const firstDate = new Date(sortedDates[0]);
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const daysDiff = Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24));
    programWeeks = Math.floor(daysDiff / 7) + 1;
  }

  return {
    totalSessions: history.length,
    maxStreak,
    morningCount,
    eveningCount,
    goodSleepCount,
    programWeeks
  };
}

/**
 * 프로필에서 배지 저장/로드
 */
const PROFILE_KEY = 'tongueProfile';

export function loadProfile(storage = localStorage) {
  const data = storage.getItem(PROFILE_KEY);
  if (!data) {
    return { xp: 0, level: 1, badges: [], badgeNotified: [] };
  }
  return JSON.parse(data);
}

export function saveProfile(profile, storage = localStorage) {
  storage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

/**
 * 배지 업데이트 (새 배지 획득 시 프로필 저장)
 * @param {Object} stats - 사용자 통계
 * @param {Storage} storage
 * @returns {Object} { newBadges: string[], profile: Object }
 */
export function updateBadges(stats, storage = localStorage) {
  const profile = loadProfile(storage);
  const earnedBadges = getEarnedBadges(stats);
  const newBadges = getNewBadges(profile.badges, earnedBadges);

  if (newBadges.length > 0) {
    profile.badges = earnedBadges;
    saveProfile(profile, storage);
  }

  return { newBadges, profile };
}
