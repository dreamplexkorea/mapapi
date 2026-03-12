import { describe, it, expect } from 'vitest';
import {
  STREAK_MILESTONES,
  SESSION_MILESTONES,
  checkStreakMilestone,
  checkSessionMilestone,
  getLevelUpMessage,
  checkAllMilestones,
  getNextMilestone
} from '../../src/gamification/milestones.js';

describe('milestones', () => {
  describe('STREAK_MILESTONES', () => {
    it('7개의 연속일 마일스톤이 정의되어야 한다', () => {
      expect(STREAK_MILESTONES).toHaveLength(7);
    });

    it('각 마일스톤은 days, emoji, message, description을 가져야 한다', () => {
      STREAK_MILESTONES.forEach(m => {
        expect(m).toHaveProperty('days');
        expect(m).toHaveProperty('emoji');
        expect(m).toHaveProperty('message');
        expect(m).toHaveProperty('description');
      });
    });
  });

  describe('SESSION_MILESTONES', () => {
    it('6개의 세션 마일스톤이 정의되어야 한다', () => {
      expect(SESSION_MILESTONES).toHaveLength(6);
    });
  });

  describe('checkStreakMilestone', () => {
    it('7일 연속은 마일스톤이어야 한다', () => {
      const milestone = checkStreakMilestone(7);
      expect(milestone).not.toBeNull();
      expect(milestone.days).toBe(7);
      expect(milestone.emoji).toBe('⚔️');
    });

    it('30일 연속은 한 달의 기적이어야 한다', () => {
      const milestone = checkStreakMilestone(30);
      expect(milestone.message).toBe('한 달의 기적!');
    });

    it('마일스톤이 아닌 날짜는 null을 반환해야 한다', () => {
      expect(checkStreakMilestone(5)).toBeNull();
      expect(checkStreakMilestone(8)).toBeNull();
    });
  });

  describe('checkSessionMilestone', () => {
    it('첫 세션은 마일스톤이어야 한다', () => {
      const milestone = checkSessionMilestone(1);
      expect(milestone).not.toBeNull();
      expect(milestone.emoji).toBe('🌱');
    });

    it('100회는 마일스톤이어야 한다', () => {
      const milestone = checkSessionMilestone(100);
      expect(milestone.emoji).toBe('💯');
    });

    it('마일스톤이 아닌 횟수는 null을 반환해야 한다', () => {
      expect(checkSessionMilestone(5)).toBeNull();
      expect(checkSessionMilestone(99)).toBeNull();
    });
  });

  describe('getLevelUpMessage', () => {
    it('레벨업 시 메시지를 반환해야 한다', () => {
      const result = getLevelUpMessage(1, 2, '초보자');
      expect(result.leveledUp).toBe(true);
      expect(result.message).toBe('레벨 2 달성!');
    });

    it('레벨업이 없으면 leveledUp이 false이어야 한다', () => {
      const result = getLevelUpMessage(5, 5, '초보자');
      expect(result.leveledUp).toBe(false);
      expect(result.message).toBeNull();
    });

    it('티어 변경 시 tierChanged가 true이어야 한다', () => {
      const result = getLevelUpMessage(5, 6, '중급자');
      expect(result.tierChanged).toBe(true);
      expect(result.tierMessage).not.toBeNull();
      expect(result.tierMessage.message).toBe('중급자로 승급!');
    });

    it('같은 티어 내 레벨업은 tierChanged가 false이어야 한다', () => {
      const result = getLevelUpMessage(2, 3, '초보자');
      expect(result.tierChanged).toBe(false);
      expect(result.tierMessage).toBeNull();
    });
  });

  describe('checkAllMilestones', () => {
    it('모든 마일스톤을 한 번에 확인해야 한다', () => {
      const result = checkAllMilestones({
        streak: 7,
        sessionCount: 10,
        oldLevel: 1,
        newLevel: 2,
        newTier: '초보자',
        newBadges: ['week_warrior']
      });

      expect(result.streakMilestone).not.toBeNull();
      expect(result.sessionMilestone).not.toBeNull();
      expect(result.levelUp.leveledUp).toBe(true);
      expect(result.newBadges).toContain('week_warrior');
    });

    it('달성한 마일스톤이 없으면 null을 반환해야 한다', () => {
      const result = checkAllMilestones({
        streak: 2,
        sessionCount: 5,
        oldLevel: 3,
        newLevel: 3,
        newTier: '초보자',
        newBadges: []
      });

      expect(result.streakMilestone).toBeNull();
      expect(result.sessionMilestone).toBeNull();
      expect(result.levelUp.leveledUp).toBe(false);
      expect(result.newBadges).toHaveLength(0);
    });
  });

  describe('getNextMilestone', () => {
    it('다음 연속일 마일스톤을 반환해야 한다', () => {
      const result = getNextMilestone(5, STREAK_MILESTONES, 'days');
      expect(result).not.toBeNull();
      expect(result.next.days).toBe(7);
      expect(result.remaining).toBe(2);
    });

    it('다음 세션 마일스톤을 반환해야 한다', () => {
      const result = getNextMilestone(8, SESSION_MILESTONES, 'count');
      expect(result.next.count).toBe(10);
      expect(result.remaining).toBe(2);
    });

    it('모든 마일스톤을 달성했으면 null을 반환해야 한다', () => {
      const result = getNextMilestone(100, STREAK_MILESTONES, 'days');
      expect(result).toBeNull();
    });

    it('현재 값이 0이면 첫 번째 마일스톤을 반환해야 한다', () => {
      const result = getNextMilestone(0, SESSION_MILESTONES, 'count');
      expect(result.next.count).toBe(1);
      expect(result.remaining).toBe(1);
    });
  });
});
