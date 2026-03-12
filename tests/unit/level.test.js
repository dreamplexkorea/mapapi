import { describe, it, expect } from 'vitest';
import {
  XP_VALUES,
  LEVEL_THRESHOLDS,
  calculateLevel,
  calculateSessionXp,
  addXp,
  getLevelInfo
} from '../../src/gamification/level.js';

describe('level', () => {
  describe('XP_VALUES', () => {
    it('올바른 XP 값이 정의되어야 한다', () => {
      expect(XP_VALUES.SESSION_COMPLETE).toBe(50);
      expect(XP_VALUES.FULL_COMPLETE_BONUS).toBe(20);
      expect(XP_VALUES.STREAK_MULTIPLIER).toBe(5);
      expect(XP_VALUES.BADGE_EARNED).toBe(100);
    });
  });

  describe('LEVEL_THRESHOLDS', () => {
    it('21개 레벨이 정의되어야 한다', () => {
      expect(LEVEL_THRESHOLDS.length).toBe(21);
    });

    it('레벨 1은 0 XP로 시작해야 한다', () => {
      expect(LEVEL_THRESHOLDS[0].xpRequired).toBe(0);
    });
  });

  describe('calculateLevel', () => {
    it('0 XP는 레벨 1이어야 한다', () => {
      const result = calculateLevel(0);
      expect(result.level).toBe(1);
      expect(result.tier).toBe('초보자');
    });

    it('100 XP는 레벨 2이어야 한다', () => {
      const result = calculateLevel(100);
      expect(result.level).toBe(2);
    });

    it('500 XP는 레벨 6이어야 한다 (중급자 시작)', () => {
      const result = calculateLevel(500);
      expect(result.level).toBe(6);
      expect(result.tier).toBe('중급자');
    });

    it('1500 XP는 레벨 11이어야 한다 (숙련자 시작)', () => {
      const result = calculateLevel(1500);
      expect(result.level).toBe(11);
      expect(result.tier).toBe('숙련자');
    });

    it('4500 XP는 레벨 21이어야 한다 (마스터 시작)', () => {
      const result = calculateLevel(4500);
      expect(result.level).toBe(21);
      expect(result.tier).toBe('마스터');
    });

    it('5000 XP는 레벨 22이어야 한다', () => {
      const result = calculateLevel(5000);
      expect(result.level).toBe(22);
      expect(result.tier).toBe('마스터');
    });

    it('진행률을 올바르게 계산해야 한다', () => {
      // 레벨 1: 0-100 XP, 50 XP = 50%
      const result = calculateLevel(50);
      expect(result.level).toBe(1);
      expect(result.currentXp).toBe(50);
      expect(result.progress).toBeCloseTo(0.5, 1);
    });
  });

  describe('calculateSessionXp', () => {
    it('기본 훈련 완료 시 50 XP를 획득해야 한다', () => {
      const result = calculateSessionXp({});
      expect(result.total).toBe(50);
      expect(result.breakdown.base).toBe(50);
    });

    it('완주 시 +20 XP 보너스를 획득해야 한다', () => {
      const result = calculateSessionXp({ completed: true });
      expect(result.total).toBe(70);
      expect(result.breakdown.completionBonus).toBe(20);
    });

    it('연속일 보너스를 계산해야 한다 (streak × 5)', () => {
      const result = calculateSessionXp({ streak: 7 });
      expect(result.breakdown.streakBonus).toBe(35);
      expect(result.total).toBe(85); // 50 + 35
    });

    it('배지 획득 보너스를 계산해야 한다', () => {
      const result = calculateSessionXp({ newBadgeCount: 2 });
      expect(result.breakdown.badgeBonus).toBe(200);
      expect(result.total).toBe(250); // 50 + 200
    });

    it('모든 보너스를 합산해야 한다', () => {
      const result = calculateSessionXp({
        completed: true,
        streak: 7,
        newBadgeCount: 1
      });
      // 50 + 20 + 35 + 100 = 205
      expect(result.total).toBe(205);
    });
  });

  describe('addXp', () => {
    it('XP를 추가해야 한다', () => {
      const result = addXp(50, 30);
      expect(result.newXp).toBe(80);
    });

    it('레벨업을 감지해야 한다', () => {
      const result = addXp(90, 20); // 90 + 20 = 110 → 레벨 2
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(2);
      expect(result.leveledUp).toBe(true);
    });

    it('레벨업이 없으면 leveledUp이 false이어야 한다', () => {
      const result = addXp(50, 10);
      expect(result.leveledUp).toBe(false);
    });

    it('여러 레벨을 한 번에 올라갈 수 있어야 한다', () => {
      const result = addXp(0, 500); // 0 → 500 = 레벨 1 → 레벨 6
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(6);
      expect(result.levelsGained).toBe(5);
    });
  });

  describe('getLevelInfo', () => {
    it('유효한 레벨 정보를 반환해야 한다', () => {
      const info = getLevelInfo(5);
      expect(info).not.toBeNull();
      expect(info.level).toBe(5);
      expect(info.xpRequired).toBe(400);
      expect(info.tier).toBe('초보자');
    });

    it('레벨 21 이상도 정보를 반환해야 한다', () => {
      const info = getLevelInfo(25);
      expect(info.level).toBe(25);
      expect(info.xpRequired).toBe(4500 + (4 * 500)); // 6500
      expect(info.tier).toBe('마스터');
    });

    it('레벨 0 이하는 null을 반환해야 한다', () => {
      expect(getLevelInfo(0)).toBeNull();
      expect(getLevelInfo(-1)).toBeNull();
    });
  });
});
