import { describe, it, expect, vi } from 'vitest';
import { getTodaySleep, getSleepByDate, saveSleep, getAllSleepData, resetSleepData } from '../../src/utils/sleep.js';
import { createMockStorage } from '../setup.js';

describe('sleep', () => {
  const fixedNow = new Date('2026-03-11T10:00:00Z').getTime();
  const today = '2026-03-11';
  const yesterday = '2026-03-10';

  describe('getTodaySleep', () => {
    it('수면 데이터가 없으면 null을 반환해야 한다', () => {
      const storage = createMockStorage();
      expect(getTodaySleep(storage, fixedNow)).toBeNull();
    });

    it('오늘 수면 데이터를 반환해야 한다', () => {
      const storage = createMockStorage({
        tongueSleep: JSON.stringify({
          [today]: { hours: 7, quality: 'good' }
        })
      });
      expect(getTodaySleep(storage, fixedNow)).toEqual({ hours: 7, quality: 'good' });
    });

    it('어제 데이터만 있으면 null을 반환해야 한다', () => {
      const storage = createMockStorage({
        tongueSleep: JSON.stringify({
          [yesterday]: { hours: 8, quality: 'great' }
        })
      });
      expect(getTodaySleep(storage, fixedNow)).toBeNull();
    });
  });

  describe('getSleepByDate', () => {
    it('특정 날짜의 수면 데이터를 반환해야 한다', () => {
      const storage = createMockStorage({
        tongueSleep: JSON.stringify({
          [yesterday]: { hours: 6, quality: 'bad' },
          [today]: { hours: 7, quality: 'good' }
        })
      });
      expect(getSleepByDate(yesterday, storage)).toEqual({ hours: 6, quality: 'bad' });
    });

    it('데이터가 없는 날짜는 null을 반환해야 한다', () => {
      const storage = createMockStorage({
        tongueSleep: JSON.stringify({
          [today]: { hours: 7, quality: 'good' }
        })
      });
      expect(getSleepByDate('2026-03-01', storage)).toBeNull();
    });
  });

  describe('saveSleep', () => {
    it('수면 데이터를 저장해야 한다', () => {
      const storage = createMockStorage();
      const result = saveSleep(7.5, 'great', storage, fixedNow);

      expect(result).toEqual({ hours: 7.5, quality: 'great' });
      expect(storage.setItem).toHaveBeenCalled();
    });

    it('기존 데이터를 유지하면서 오늘 데이터만 업데이트해야 한다', () => {
      const storage = createMockStorage({
        tongueSleep: JSON.stringify({
          [yesterday]: { hours: 6, quality: 'bad' }
        })
      });
      saveSleep(8, 'good', storage, fixedNow);

      const savedData = JSON.parse(storage.setItem.mock.calls[0][1]);
      expect(savedData[yesterday]).toEqual({ hours: 6, quality: 'bad' });
      expect(savedData[today]).toEqual({ hours: 8, quality: 'good' });
    });

    it('같은 날 다시 저장하면 덮어써야 한다', () => {
      const storage = createMockStorage({
        tongueSleep: JSON.stringify({
          [today]: { hours: 5, quality: 'bad' }
        })
      });
      saveSleep(9, 'great', storage, fixedNow);

      const savedData = JSON.parse(storage.setItem.mock.calls[0][1]);
      expect(savedData[today]).toEqual({ hours: 9, quality: 'great' });
    });
  });

  describe('getAllSleepData', () => {
    it('모든 수면 데이터를 반환해야 한다', () => {
      const sleepData = {
        [yesterday]: { hours: 6, quality: 'bad' },
        [today]: { hours: 7, quality: 'good' }
      };
      const storage = createMockStorage({
        tongueSleep: JSON.stringify(sleepData)
      });

      expect(getAllSleepData(storage)).toEqual(sleepData);
    });

    it('데이터가 없으면 빈 객체를 반환해야 한다', () => {
      const storage = createMockStorage();
      expect(getAllSleepData(storage)).toEqual({});
    });
  });

  describe('resetSleepData', () => {
    it('수면 데이터를 삭제해야 한다', () => {
      const storage = createMockStorage({
        tongueSleep: JSON.stringify({ [today]: { hours: 7, quality: 'good' } })
      });
      resetSleepData(storage);

      expect(storage.removeItem).toHaveBeenCalledWith('tongueSleep');
    });
  });
});
