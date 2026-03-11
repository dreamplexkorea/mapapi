/**
 * 날짜 유틸리티 함수
 * 테스트 용이성을 위해 now 파라미터로 현재 시간 주입 가능
 */

/**
 * 오늘 날짜를 ISO 형식으로 반환 (YYYY-MM-DD)
 * @param {number} now - 현재 타임스탬프 (기본: Date.now())
 * @returns {string} YYYY-MM-DD 형식 날짜
 */
export function getToday(now = Date.now()) {
  return new Date(now).toISOString().split('T')[0];
}

/**
 * 오늘 날짜를 문자열로 반환 (예: "Wed Mar 11 2026")
 * @param {number} now - 현재 타임스탬프
 * @returns {string} Date.toDateString() 형식
 */
export function getTodayString(now = Date.now()) {
  return new Date(now).toDateString();
}

/**
 * 어제 날짜를 문자열로 반환
 * @param {number} now - 현재 타임스탬프
 * @returns {string} Date.toDateString() 형식
 */
export function getYesterdayString(now = Date.now()) {
  return new Date(now - 86400000).toDateString();
}

/**
 * 두 날짜 사이의 일수 차이 계산
 * @param {string} date1 - 첫 번째 날짜 (YYYY-MM-DD)
 * @param {string} date2 - 두 번째 날짜 (YYYY-MM-DD)
 * @returns {number} 일수 차이
 */
export function getDaysDiff(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 날짜가 연속인지 확인 (하루 차이)
 * @param {string} date1 - 이전 날짜 (YYYY-MM-DD)
 * @param {string} date2 - 이후 날짜 (YYYY-MM-DD)
 * @returns {boolean}
 */
export function isConsecutive(date1, date2) {
  return getDaysDiff(date1, date2) === 1;
}
