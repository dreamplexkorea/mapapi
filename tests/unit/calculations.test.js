import { describe, it, expect } from 'vitest';
import {
  calculateStats,
  calculateMaxStreak,
  calculateHeatmapData,
  calculateWeeklyData,
  calculateSleepInsight,
  calculateBestTrainingTime,
  calculateCorrelationData
} from '../../src/stats/calculations.js';

describe('calculations', () => {
  describe('calculateStats', () => {
    it('빈 히스토리에 대해 모든 값이 0이어야 한다', () => {
      expect(calculateStats([])).toEqual({
        uniqueDays: 0,
        totalReps: 0,
        totalMinutes: 0,
        maxStreak: 0
      });
    });

    it('null 히스토리에 대해 모든 값이 0이어야 한다', () => {
      expect(calculateStats(null)).toEqual({
        uniqueDays: 0,
        totalReps: 0,
        totalMinutes: 0,
        maxStreak: 0
      });
    });

    it('고유 날짜 수를 정확히 계산해야 한다', () => {
      const history = [
        { date: '2026-03-10', duration: 120, reps: 35 },
        { date: '2026-03-10', duration: 60, reps: 20 }, // 같은 날 두 번
        { date: '2026-03-11', duration: 130, reps: 35 }
      ];
      expect(calculateStats(history).uniqueDays).toBe(2);
    });

    it('총 반복 횟수를 정확히 계산해야 한다', () => {
      const history = [
        { date: '2026-03-10', reps: 35 },
        { date: '2026-03-11', reps: 30 },
        { date: '2026-03-12', reps: 25 }
      ];
      expect(calculateStats(history).totalReps).toBe(90);
    });

    it('총 시간을 분 단위로 정확히 계산해야 한다', () => {
      const history = [
        { date: '2026-03-10', duration: 120 }, // 2분
        { date: '2026-03-11', duration: 180 }  // 3분
      ];
      expect(calculateStats(history).totalMinutes).toBe(5);
    });
  });

  describe('calculateMaxStreak', () => {
    it('빈 히스토리면 0을 반환해야 한다', () => {
      expect(calculateMaxStreak([])).toBe(0);
    });

    it('단일 날짜면 1을 반환해야 한다', () => {
      const history = [{ date: '2026-03-10' }];
      expect(calculateMaxStreak(history)).toBe(1);
    });

    it('연속 3일 훈련을 정확히 계산해야 한다', () => {
      const history = [
        { date: '2026-03-09' },
        { date: '2026-03-10' },
        { date: '2026-03-11' }
      ];
      expect(calculateMaxStreak(history)).toBe(3);
    });

    it('5일 연속 후 2일 연속이면 최장 5일을 반환해야 한다', () => {
      const history = [
        { date: '2026-03-01' },
        { date: '2026-03-02' },
        { date: '2026-03-03' },
        { date: '2026-03-04' },
        { date: '2026-03-05' },
        // 하루 건너뜀
        { date: '2026-03-10' },
        { date: '2026-03-11' }
      ];
      expect(calculateMaxStreak(history)).toBe(5);
    });

    it('같은 날 여러 세션은 하나로 계산해야 한다', () => {
      const history = [
        { date: '2026-03-10' },
        { date: '2026-03-10' },
        { date: '2026-03-11' }
      ];
      expect(calculateMaxStreak(history)).toBe(2);
    });
  });

  describe('calculateHeatmapData', () => {
    it('빈 히스토리면 빈 객체를 반환해야 한다', () => {
      expect(calculateHeatmapData([])).toEqual({});
    });

    it('날짜별 세션 수를 정확히 집계해야 한다', () => {
      const history = [
        { date: '2026-03-10' },
        { date: '2026-03-10' },
        { date: '2026-03-11' }
      ];
      expect(calculateHeatmapData(history)).toEqual({
        '2026-03-10': 2,
        '2026-03-11': 1
      });
    });
  });

  describe('calculateWeeklyData', () => {
    // 2026-03-11 (수요일)
    const fixedNow = new Date('2026-03-11T10:00:00Z').getTime();

    it('주간 7일 데이터를 반환해야 한다', () => {
      const { weekData } = calculateWeeklyData([], fixedNow);
      expect(weekData).toHaveLength(7);
    });

    it('요일을 올바르게 표시해야 한다', () => {
      const { weekData } = calculateWeeklyData([], fixedNow);
      expect(weekData.map(d => d.day)).toEqual(['월', '화', '수', '목', '금', '토', '일']);
    });

    it('오늘을 표시해야 한다', () => {
      const { weekData } = calculateWeeklyData([], fixedNow);
      const today = weekData.find(d => d.isToday);
      expect(today).toBeDefined();
      expect(today.date).toBe('2026-03-11');
    });

    it('해당 주의 훈련 시간을 계산해야 한다', () => {
      const history = [
        { date: '2026-03-09', duration: 120 }, // 월요일
        { date: '2026-03-10', duration: 180 }, // 화요일
        { date: '2026-03-01', duration: 300 }  // 지난주 (포함 안 됨)
      ];
      const { weekData } = calculateWeeklyData(history, fixedNow);

      expect(weekData.find(d => d.date === '2026-03-09').minutes).toBe(2);
      expect(weekData.find(d => d.date === '2026-03-10').minutes).toBe(3);
    });
  });

  describe('calculateSleepInsight', () => {
    it('수면 데이터가 3일 미만이면 hasEnoughData가 false여야 한다', () => {
      const history = [{ date: '2026-03-10', reps: 35 }];
      const sleepData = { '2026-03-10': { hours: 7, quality: 'good' } };

      expect(calculateSleepInsight(history, sleepData).hasEnoughData).toBe(false);
    });

    it('7시간 이상/미만 수면 완주율을 계산해야 한다', () => {
      const history = [
        { date: '2026-03-08', reps: 35 },
        { date: '2026-03-09', reps: 35 },
        { date: '2026-03-10', reps: 20 },
        { date: '2026-03-11', reps: 35 }
      ];
      const sleepData = {
        '2026-03-08': { hours: 8 },   // 좋은 수면, 완주
        '2026-03-09': { hours: 7 },   // 좋은 수면, 완주
        '2026-03-10': { hours: 5 },   // 나쁜 수면, 미완주
        '2026-03-11': { hours: 6 }    // 나쁜 수면, 완주
      };

      const result = calculateSleepInsight(history, sleepData, 35);
      expect(result.hasEnoughData).toBe(true);
      expect(result.goodRate).toBe(100);  // 2/2 = 100%
      expect(result.badRate).toBe(50);    // 1/2 = 50%
      expect(result.diff).toBe(50);
    });
  });

  describe('calculateBestTrainingTime', () => {
    it('시간대별 완주율을 계산해야 한다', () => {
      const history = [
        { timestamp: new Date('2026-03-10T08:00:00').getTime(), reps: 35 }, // 아침, 완주
        { timestamp: new Date('2026-03-10T09:00:00').getTime(), reps: 35 }, // 아침, 완주
        { timestamp: new Date('2026-03-11T14:00:00').getTime(), reps: 20 }, // 오후, 미완주
        { timestamp: new Date('2026-03-11T20:00:00').getTime(), reps: 35 }  // 저녁, 완주
      ];

      const result = calculateBestTrainingTime(history, 35);
      expect(result.bestTime).toBe('morning');
      expect(result.bestRate).toBe(100);
      expect(result.rates.morning.rate).toBe(1);
      expect(result.rates.afternoon.rate).toBe(0);
      expect(result.rates.evening.rate).toBe(1);
    });

    it('최적 시간대 레이블을 반환해야 한다', () => {
      const history = [
        { timestamp: new Date('2026-03-10T08:00:00').getTime(), reps: 35 }
      ];

      const result = calculateBestTrainingTime(history, 35);
      expect(result.bestTimeLabel).toBe('아침 (5-12시)');
    });
  });

  describe('calculateCorrelationData', () => {
    it('수면 데이터가 있는 세션만 반환해야 한다', () => {
      const history = [
        { date: '2026-03-10', duration: 120, reps: 35 },
        { date: '2026-03-11', duration: 130, reps: 35 }
      ];
      const sleepData = {
        '2026-03-10': { hours: 7 }
        // '2026-03-11' 없음
      };

      const result = calculateCorrelationData(history, sleepData, 35);
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2026-03-10');
    });

    it('좌표를 올바르게 계산해야 한다', () => {
      const history = [
        { date: '2026-03-10', duration: 420, reps: 35 } // 7분 정확히
      ];
      const sleepData = {
        '2026-03-10': { hours: 7 } // (7-4)/6 = 0.5
      };

      const result = calculateCorrelationData(history, sleepData, 35);
      expect(result[0].x).toBe(0.5);    // 7시간 수면 -> (7-4)/6 = 0.5
      expect(result[0].y).toBeCloseTo(0.467, 2);  // 7분/15분 ≈ 0.467
      expect(result[0].completed).toBe(true);
    });

    it('좌표를 0-1 범위로 제한해야 한다', () => {
      const history = [
        { date: '2026-03-10', duration: 1200, reps: 35 } // 20분
      ];
      const sleepData = {
        '2026-03-10': { hours: 12 } // 범위 초과
      };

      const result = calculateCorrelationData(history, sleepData, 35);
      expect(result[0].x).toBe(1);  // 최대값 제한
      expect(result[0].y).toBe(1);  // 최대값 제한
    });
  });
});
