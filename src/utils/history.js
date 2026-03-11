/**
 * 세션 히스토리 관리 함수
 */

import { getToday } from './date.js';
import { getTodaySleep } from './sleep.js';

const STORAGE_KEY = 'tongueHistory';

/**
 * 모든 세션 히스토리 조회
 * @param {Storage} storage - localStorage 또는 mock
 * @returns {Array} 세션 배열
 */
export function getHistory(storage = localStorage) {
  return JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
}

/**
 * 세션 저장
 * @param {number} duration - 훈련 시간 (초)
 * @param {number} reps - 완료한 반복 횟수
 * @param {Storage} storage
 * @param {number} now - 현재 타임스탬프
 * @returns {Object} 저장된 세션 객체
 */
export function saveSession(duration, reps, storage = localStorage, now = Date.now()) {
  const history = getHistory(storage);
  const today = getToday(now);
  const session = {
    date: today,
    timestamp: now,
    duration,
    reps,
    sleep: getTodaySleep(storage, now)
  };
  history.push(session);
  storage.setItem(STORAGE_KEY, JSON.stringify(history));
  return session;
}

/**
 * 특정 날짜의 세션들 조회
 * @param {string} date - YYYY-MM-DD 형식
 * @param {Storage} storage
 * @returns {Array} 해당 날짜의 세션 배열
 */
export function getSessionsByDate(date, storage = localStorage) {
  const history = getHistory(storage);
  return history.filter(session => session.date === date);
}

/**
 * 최근 N일간의 세션 조회
 * @param {number} days - 일수
 * @param {Storage} storage
 * @param {number} now
 * @returns {Array} 세션 배열
 */
export function getRecentSessions(days, storage = localStorage, now = Date.now()) {
  const history = getHistory(storage);
  const cutoffDate = new Date(now - days * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  return history.filter(session => session.date >= cutoffStr);
}

/**
 * 히스토리 초기화 (테스트용)
 * @param {Storage} storage
 */
export function resetHistory(storage = localStorage) {
  storage.removeItem(STORAGE_KEY);
}
