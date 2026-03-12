/**
 * 연속일(Streak) 관리 함수
 * 의존성 주입으로 테스트 가능
 */

import { getTodayString, getYesterdayString } from './date.js';

const STORAGE_KEY = 'tongueTraining';

/**
 * 현재 연속일 로드
 * - 오늘 또는 어제 훈련한 경우: 저장된 streak 반환
 * - 그 외: 0 반환 (연속 끊김)
 *
 * @param {Storage} storage - localStorage 또는 mock
 * @param {number} now - 현재 타임스탬프
 * @returns {number} 연속일 수
 */
export function loadStreak(storage = localStorage, now = Date.now()) {
  const data = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
  const today = getTodayString(now);
  const yesterday = getYesterdayString(now);

  if (data.lastDate === today || data.lastDate === yesterday) {
    return data.streak || 1;
  }
  return 0;
}

/**
 * 연속일 저장 (훈련 완료 시 호출)
 * - 어제 훈련: streak + 1
 * - 오늘 이미 훈련: streak 유지
 * - 그 외: streak = 1 (새로 시작)
 *
 * @param {Storage} storage - localStorage 또는 mock
 * @param {number} now - 현재 타임스탬프
 * @returns {number} 새로운 연속일 수
 */
export function saveStreak(storage = localStorage, now = Date.now()) {
  const data = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
  const today = getTodayString(now);
  const yesterday = getYesterdayString(now);

  let newStreak = 1;

  if (data.lastDate === yesterday) {
    // 어제 훈련 → 연속 이어감
    newStreak = (data.streak || 0) + 1;
  } else if (data.lastDate === today) {
    // 오늘 이미 훈련 → 유지
    newStreak = data.streak || 1;
  }
  // 그 외 → 새로 시작 (newStreak = 1)

  storage.setItem(STORAGE_KEY, JSON.stringify({
    lastDate: today,
    streak: newStreak
  }));

  return newStreak;
}

/**
 * 연속일 데이터 초기화 (테스트용)
 * @param {Storage} storage
 */
export function resetStreak(storage = localStorage) {
  storage.removeItem(STORAGE_KEY);
}
