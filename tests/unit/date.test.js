import { describe, it, expect } from 'vitest';
import { getToday, getTodayString, getYesterdayString, getDaysDiff, isConsecutive } from '../../src/utils/date.js';

describe('date utils', () => {
  // 고정된 날짜: 2026-03-11 10:00:00 UTC
  const fixedNow = new Date('2026-03-11T10:00:00Z').getTime();

  describe('getToday', () => {
    it('ISO 형식 날짜를 반환해야 한다', () => {
      expect(getToday(fixedNow)).toBe('2026-03-11');
    });

    it('기본값으로 현재 날짜를 사용해야 한다', () => {
      const today = getToday();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getTodayString', () => {
    it('Date.toDateString 형식을 반환해야 한다', () => {
      const result = getTodayString(fixedNow);
      expect(result).toBe('Wed Mar 11 2026');
    });
  });

  describe('getYesterdayString', () => {
    it('어제 날짜를 반환해야 한다', () => {
      const result = getYesterdayString(fixedNow);
      expect(result).toBe('Tue Mar 10 2026');
    });
  });

  describe('getDaysDiff', () => {
    it('같은 날짜면 0을 반환해야 한다', () => {
      expect(getDaysDiff('2026-03-11', '2026-03-11')).toBe(0);
    });

    it('하루 차이면 1을 반환해야 한다', () => {
      expect(getDaysDiff('2026-03-10', '2026-03-11')).toBe(1);
    });

    it('일주일 차이면 7을 반환해야 한다', () => {
      expect(getDaysDiff('2026-03-04', '2026-03-11')).toBe(7);
    });

    it('순서가 바뀌어도 절대값을 반환해야 한다', () => {
      expect(getDaysDiff('2026-03-11', '2026-03-04')).toBe(7);
    });
  });

  describe('isConsecutive', () => {
    it('연속된 날짜면 true를 반환해야 한다', () => {
      expect(isConsecutive('2026-03-10', '2026-03-11')).toBe(true);
    });

    it('같은 날짜면 false를 반환해야 한다', () => {
      expect(isConsecutive('2026-03-11', '2026-03-11')).toBe(false);
    });

    it('2일 이상 차이면 false를 반환해야 한다', () => {
      expect(isConsecutive('2026-03-09', '2026-03-11')).toBe(false);
    });
  });
});
