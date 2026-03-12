import { describe, it, expect, vi } from 'vitest';
import {
  BADGES,
  getBadgeById,
  getEarnedBadges,
  getNewBadges,
  calculateBadgeStats,
  loadProfile,
  saveProfile,
  updateBadges
} from '../../src/gamification/badges.js';
import { createMockStorage } from '../setup.js';

describe('badges', () => {
  describe('BADGES', () => {
    it('8개의 배지가 정의되어야 한다', () => {
      expect(BADGES).toHaveLength(8);
    });

    it('각 배지는 id, emoji, name, description을 가져야 한다', () => {
      BADGES.forEach(badge => {
        expect(badge).toHaveProperty('id');
        expect(badge).toHaveProperty('emoji');
        expect(badge).toHaveProperty('name');
        expect(badge).toHaveProperty('description');
      });
    });
  });

  describe('getBadgeById', () => {
    it('존재하는 배지 ID로 배지 정보를 반환해야 한다', () => {
      const badge = getBadgeById('first_step');
      expect(badge).not.toBeNull();
      expect(badge.emoji).toBe('🌱');
      expect(badge.name).toBe('첫 걸음');
    });

    it('존재하지 않는 배지 ID는 null을 반환해야 한다', () => {
      expect(getBadgeById('nonexistent')).toBeNull();
    });
  });

  describe('getEarnedBadges', () => {
    it('첫 세션 완료 시 first_step 배지를 획득해야 한다', () => {
      const stats = { totalSessions: 1, maxStreak: 1 };
      expect(getEarnedBadges(stats)).toContain('first_step');
    });

    it('7일 연속 시 week_warrior 배지를 획득해야 한다', () => {
      const stats = { totalSessions: 7, maxStreak: 7 };
      const badges = getEarnedBadges(stats);
      expect(badges).toContain('first_step');
      expect(badges).toContain('week_warrior');
    });

    it('30일 연속 시 month_miracle 배지를 획득해야 한다', () => {
      const stats = { totalSessions: 30, maxStreak: 30 };
      expect(getEarnedBadges(stats)).toContain('month_miracle');
    });

    it('아침 10회 훈련 시 morning_bird 배지를 획득해야 한다', () => {
      const stats = { totalSessions: 10, morningCount: 10 };
      expect(getEarnedBadges(stats)).toContain('morning_bird');
    });

    it('저녁 10회 훈련 시 night_owl 배지를 획득해야 한다', () => {
      const stats = { totalSessions: 10, eveningCount: 10 };
      expect(getEarnedBadges(stats)).toContain('night_owl');
    });

    it('좋은 수면 후 10회 훈련 시 sleep_master 배지를 획득해야 한다', () => {
      const stats = { totalSessions: 10, goodSleepCount: 10 };
      expect(getEarnedBadges(stats)).toContain('sleep_master');
    });

    it('100회 훈련 시 century 배지를 획득해야 한다', () => {
      const stats = { totalSessions: 100 };
      expect(getEarnedBadges(stats)).toContain('century');
    });

    it('8주 프로그램 완주 시 champion 배지를 획득해야 한다', () => {
      const stats = { totalSessions: 56, programWeeks: 8 };
      expect(getEarnedBadges(stats)).toContain('champion');
    });
  });

  describe('getNewBadges', () => {
    it('새로 획득한 배지만 반환해야 한다', () => {
      const current = ['first_step'];
      const earned = ['first_step', 'week_warrior'];
      expect(getNewBadges(current, earned)).toEqual(['week_warrior']);
    });

    it('이미 모든 배지를 가지고 있으면 빈 배열을 반환해야 한다', () => {
      const current = ['first_step', 'week_warrior'];
      const earned = ['first_step', 'week_warrior'];
      expect(getNewBadges(current, earned)).toEqual([]);
    });
  });

  describe('calculateBadgeStats', () => {
    it('빈 히스토리는 모든 값이 0이어야 한다', () => {
      const stats = calculateBadgeStats([], {}, 0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.morningCount).toBe(0);
      expect(stats.eveningCount).toBe(0);
      expect(stats.goodSleepCount).toBe(0);
      expect(stats.programWeeks).toBe(0);
    });

    it('아침 훈련 (6-9시)을 정확히 카운트해야 한다', () => {
      const history = [
        { date: '2026-03-10', timestamp: new Date('2026-03-10T07:00:00').getTime() },
        { date: '2026-03-11', timestamp: new Date('2026-03-11T08:30:00').getTime() },
        { date: '2026-03-12', timestamp: new Date('2026-03-12T10:00:00').getTime() } // 아침 아님
      ];
      const stats = calculateBadgeStats(history, {}, 3);
      expect(stats.morningCount).toBe(2);
    });

    it('저녁 훈련 (21시 이후)을 정확히 카운트해야 한다', () => {
      const history = [
        { date: '2026-03-10', timestamp: new Date('2026-03-10T21:30:00').getTime() },
        { date: '2026-03-11', timestamp: new Date('2026-03-11T23:00:00').getTime() },
        { date: '2026-03-12', timestamp: new Date('2026-03-12T02:00:00').getTime() } // 새벽도 포함
      ];
      const stats = calculateBadgeStats(history, {}, 3);
      expect(stats.eveningCount).toBe(3);
    });

    it('7시간+ 수면 후 훈련을 정확히 카운트해야 한다', () => {
      const history = [
        { date: '2026-03-10', timestamp: Date.now() },
        { date: '2026-03-11', timestamp: Date.now() }
      ];
      const sleepData = {
        '2026-03-10': { hours: 8 },
        '2026-03-11': { hours: 5 }
      };
      const stats = calculateBadgeStats(history, sleepData, 2);
      expect(stats.goodSleepCount).toBe(1);
    });

    it('프로그램 주차를 계산해야 한다', () => {
      const history = [
        { date: '2026-03-01', timestamp: Date.now() },
        { date: '2026-03-15', timestamp: Date.now() } // 2주 후
      ];
      const stats = calculateBadgeStats(history, {}, 2);
      expect(stats.programWeeks).toBe(3); // 1일차 = 1주, 15일차 = 3주
    });
  });

  describe('loadProfile / saveProfile', () => {
    it('저장된 프로필이 없으면 기본값을 반환해야 한다', () => {
      const storage = createMockStorage();
      const profile = loadProfile(storage);
      expect(profile).toEqual({
        xp: 0,
        level: 1,
        badges: [],
        badgeNotified: []
      });
    });

    it('프로필을 저장하고 로드할 수 있어야 한다', () => {
      const storage = createMockStorage();
      const profile = { xp: 100, level: 2, badges: ['first_step'], badgeNotified: [] };
      saveProfile(profile, storage);

      expect(storage.setItem).toHaveBeenCalledWith('tongueProfile', JSON.stringify(profile));
    });
  });

  describe('updateBadges', () => {
    it('새 배지 획득 시 프로필을 업데이트해야 한다', () => {
      const storage = createMockStorage();
      const stats = { totalSessions: 1, maxStreak: 1 };

      const result = updateBadges(stats, storage);

      expect(result.newBadges).toContain('first_step');
      expect(result.profile.badges).toContain('first_step');
      expect(storage.setItem).toHaveBeenCalled();
    });

    it('새 배지가 없으면 프로필을 업데이트하지 않아야 한다', () => {
      const storage = createMockStorage({
        tongueProfile: JSON.stringify({
          xp: 50, level: 1, badges: ['first_step'], badgeNotified: ['first_step']
        })
      });
      const stats = { totalSessions: 1, maxStreak: 1 };

      const result = updateBadges(stats, storage);

      expect(result.newBadges).toEqual([]);
    });
  });
});
