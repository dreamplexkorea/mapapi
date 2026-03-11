import { describe, it, expect, vi } from 'vitest';
import { getHistory, saveSession, getSessionsByDate, getRecentSessions, resetHistory } from '../../src/utils/history.js';
import { createMockStorage } from '../setup.js';

describe('history', () => {
  const fixedNow = new Date('2026-03-11T10:00:00Z').getTime();
  const today = '2026-03-11';
  const yesterday = '2026-03-10';

  describe('getHistory', () => {
    it('데이터가 없으면 빈 배열을 반환해야 한다', () => {
      const storage = createMockStorage();
      expect(getHistory(storage)).toEqual([]);
    });

    it('저장된 히스토리를 반환해야 한다', () => {
      const history = [
        { date: yesterday, duration: 120, reps: 35 },
        { date: today, duration: 130, reps: 35 }
      ];
      const storage = createMockStorage({
        tongueHistory: JSON.stringify(history)
      });

      expect(getHistory(storage)).toEqual(history);
    });
  });

  describe('saveSession', () => {
    it('새 세션을 히스토리에 추가해야 한다', () => {
      const storage = createMockStorage();
      const session = saveSession(120, 35, storage, fixedNow);

      expect(session.date).toBe(today);
      expect(session.timestamp).toBe(fixedNow);
      expect(session.duration).toBe(120);
      expect(session.reps).toBe(35);
    });

    it('기존 히스토리에 세션을 추가해야 한다', () => {
      const existing = [{ date: yesterday, duration: 100, reps: 30 }];
      const storage = createMockStorage({
        tongueHistory: JSON.stringify(existing)
      });

      saveSession(120, 35, storage, fixedNow);

      const savedData = JSON.parse(storage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
      expect(savedData[0].date).toBe(yesterday);
      expect(savedData[1].date).toBe(today);
    });

    it('오늘 수면 데이터를 포함해야 한다', () => {
      const storage = createMockStorage({
        tongueSleep: JSON.stringify({
          [today]: { hours: 7, quality: 'good' }
        })
      });

      const session = saveSession(120, 35, storage, fixedNow);

      expect(session.sleep).toEqual({ hours: 7, quality: 'good' });
    });

    it('수면 데이터가 없으면 null이어야 한다', () => {
      const storage = createMockStorage();
      const session = saveSession(120, 35, storage, fixedNow);

      expect(session.sleep).toBeNull();
    });
  });

  describe('getSessionsByDate', () => {
    it('특정 날짜의 세션만 반환해야 한다', () => {
      const history = [
        { date: yesterday, duration: 100, reps: 30 },
        { date: today, duration: 120, reps: 35 },
        { date: today, duration: 60, reps: 20 }
      ];
      const storage = createMockStorage({
        tongueHistory: JSON.stringify(history)
      });

      const sessions = getSessionsByDate(today, storage);
      expect(sessions).toHaveLength(2);
      expect(sessions.every(s => s.date === today)).toBe(true);
    });

    it('세션이 없는 날짜면 빈 배열을 반환해야 한다', () => {
      const storage = createMockStorage({
        tongueHistory: JSON.stringify([{ date: today, duration: 120, reps: 35 }])
      });

      expect(getSessionsByDate('2026-03-01', storage)).toEqual([]);
    });
  });

  describe('getRecentSessions', () => {
    it('최근 N일간의 세션을 반환해야 한다', () => {
      const history = [
        { date: '2026-03-01', duration: 100, reps: 30 },
        { date: '2026-03-05', duration: 110, reps: 32 },
        { date: yesterday, duration: 120, reps: 35 },
        { date: today, duration: 130, reps: 35 }
      ];
      const storage = createMockStorage({
        tongueHistory: JSON.stringify(history)
      });

      // 최근 7일
      const recent = getRecentSessions(7, storage, fixedNow);
      expect(recent).toHaveLength(3); // 03-05, 03-10, 03-11
      expect(recent.every(s => s.date >= '2026-03-04')).toBe(true);
    });

    it('최근 2일이면 오늘과 어제를 반환해야 한다', () => {
      const history = [
        { date: '2026-03-08', duration: 100, reps: 30 },
        { date: yesterday, duration: 120, reps: 35 },
        { date: today, duration: 130, reps: 35 }
      ];
      const storage = createMockStorage({
        tongueHistory: JSON.stringify(history)
      });

      const recent = getRecentSessions(2, storage, fixedNow);
      expect(recent).toHaveLength(2);
      expect(recent.map(s => s.date)).toContain(today);
      expect(recent.map(s => s.date)).toContain(yesterday);
    });
  });

  describe('resetHistory', () => {
    it('히스토리를 삭제해야 한다', () => {
      const storage = createMockStorage({
        tongueHistory: JSON.stringify([{ date: today, duration: 120, reps: 35 }])
      });
      resetHistory(storage);

      expect(storage.removeItem).toHaveBeenCalledWith('tongueHistory');
    });
  });
});
