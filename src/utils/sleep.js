/**
 * 수면 데이터 관리 함수
 */

import { getToday } from './date.js';

const STORAGE_KEY = 'tongueSleep';

/**
 * 오늘 수면 데이터 조회
 * @param {Storage} storage - localStorage 또는 mock
 * @param {number} now - 현재 타임스탬프
 * @returns {Object|null} { hours, quality } 또는 null
 */
export function getTodaySleep(storage = localStorage, now = Date.now()) {
  const data = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
  const today = getToday(now);
  return data[today] || null;
}

/**
 * 특정 날짜의 수면 데이터 조회
 * @param {string} date - YYYY-MM-DD 형식
 * @param {Storage} storage
 * @returns {Object|null}
 */
export function getSleepByDate(date, storage = localStorage) {
  const data = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
  return data[date] || null;
}

/**
 * 수면 데이터 저장
 * @param {number|string} hours - 수면 시간
 * @param {string} quality - 'great' | 'good' | 'bad'
 * @param {Storage} storage
 * @param {number} now
 * @returns {Object} 저장된 수면 데이터
 */
export function saveSleep(hours, quality, storage = localStorage, now = Date.now()) {
  const data = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
  const today = getToday(now);
  data[today] = { hours, quality };
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data[today];
}

/**
 * 모든 수면 데이터 조회
 * @param {Storage} storage
 * @returns {Object} { [date]: { hours, quality } }
 */
export function getAllSleepData(storage = localStorage) {
  return JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
}

/**
 * 수면 데이터 초기화 (테스트용)
 * @param {Storage} storage
 */
export function resetSleepData(storage = localStorage) {
  storage.removeItem(STORAGE_KEY);
}
