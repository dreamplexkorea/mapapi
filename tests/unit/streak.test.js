import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadStreak, saveStreak, resetStreak } from '../../src/utils/streak.js';
import { createMockStorage } from '../setup.js';

describe('streak', () => {
  // 고정 날짜: 2026-03-11 10:00:00 UTC (Wed Mar 11 2026)
  const fixedNow = new Date('2026-03-11T10:00:00Z').getTime();
  const today = 'Wed Mar 11 2026';
  const yesterday = 'Tue Mar 10 2026';
  const twoDaysAgo = 'Mon Mar 09 2026';

  describe('loadStreak', () => {
    it('저장된 데이터가 없으면 0을 반환해야 한다', () => {
      const storage = createMockStorage();
      expect(loadStreak(storage, fixedNow)).toBe(0);
    });

    it('오늘 훈련한 경우 저장된 streak을 반환해야 한다', () => {
      const storage = createMockStorage({
        tongueTraining: JSON.stringify({ lastDate: today, streak: 5 })
      });
      expect(loadStreak(storage, fixedNow)).toBe(5);
    });

    it('어제 훈련한 경우 저장된 streak을 반환해야 한다', () => {
      const storage = createMockStorage({
        tongueTraining: JSON.stringify({ lastDate: yesterday, streak: 3 })
      });
      expect(loadStreak(storage, fixedNow)).toBe(3);
    });

    it('2일 이상 지난 경우 0을 반환해야 한다', () => {
      const storage = createMockStorage({
        tongueTraining: JSON.stringify({ lastDate: twoDaysAgo, streak: 10 })
      });
      expect(loadStreak(storage, fixedNow)).toBe(0);
    });

    it('streak이 없으면 1을 반환해야 한다 (오늘 훈련)', () => {
      const storage = createMockStorage({
        tongueTraining: JSON.stringify({ lastDate: today })
      });
      expect(loadStreak(storage, fixedNow)).toBe(1);
    });
  });

  describe('saveStreak', () => {
    it('첫 훈련이면 streak 1을 저장해야 한다', () => {
      const storage = createMockStorage();
      const result = saveStreak(storage, fixedNow);

      expect(result).toBe(1);
      expect(storage.setItem).toHaveBeenCalledWith(
        'tongueTraining',
        expect.stringContaining('"streak":1')
      );
    });

    it('어제 훈련한 경우 streak을 1 증가시켜야 한다', () => {
      const storage = createMockStorage({
        tongueTraining: JSON.stringify({ lastDate: yesterday, streak: 5 })
      });
      const result = saveStreak(storage, fixedNow);

      expect(result).toBe(6);
    });

    it('오늘 이미 훈련한 경우 streak을 유지해야 한다', () => {
      const storage = createMockStorage({
        tongueTraining: JSON.stringify({ lastDate: today, streak: 5 })
      });
      const result = saveStreak(storage, fixedNow);

      expect(result).toBe(5);
    });

    it('연속이 끊긴 경우 streak을 1로 리셋해야 한다', () => {
      const storage = createMockStorage({
        tongueTraining: JSON.stringify({ lastDate: twoDaysAgo, streak: 10 })
      });
      const result = saveStreak(storage, fixedNow);

      expect(result).toBe(1);
    });

    it('lastDate를 오늘로 업데이트해야 한다', () => {
      const storage = createMockStorage();
      saveStreak(storage, fixedNow);

      const savedData = JSON.parse(storage.setItem.mock.calls[0][1]);
      expect(savedData.lastDate).toBe(today);
    });
  });

  describe('resetStreak', () => {
    it('tongueTraining 데이터를 삭제해야 한다', () => {
      const storage = createMockStorage({
        tongueTraining: JSON.stringify({ lastDate: today, streak: 5 })
      });
      resetStreak(storage);

      expect(storage.removeItem).toHaveBeenCalledWith('tongueTraining');
    });
  });
});
