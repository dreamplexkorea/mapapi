/**
 * 통계 계산 함수 (순수 함수)
 * DOM 의존성 없이 데이터만 처리
 */

/**
 * 기본 통계 계산
 * @param {Array} history - 세션 히스토리
 * @returns {Object} { uniqueDays, totalReps, totalMinutes, maxStreak }
 */
export function calculateStats(history) {
  if (!history || history.length === 0) {
    return { uniqueDays: 0, totalReps: 0, totalMinutes: 0, maxStreak: 0 };
  }

  const uniqueDays = new Set(history.map(s => s.date)).size;
  const totalReps = history.reduce((sum, s) => sum + (s.reps || 0), 0);
  const totalSeconds = history.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const maxStreak = calculateMaxStreak(history);

  return { uniqueDays, totalReps, totalMinutes, maxStreak };
}

/**
 * 최장 연속일 계산
 * @param {Array} history - 세션 히스토리
 * @returns {number} 최장 연속일
 */
export function calculateMaxStreak(history) {
  if (!history || history.length === 0) return 0;

  const dates = [...new Set(history.map(s => s.date))].sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate = null;

  for (const dateStr of dates) {
    const d = new Date(dateStr);
    if (prevDate) {
      const diff = (d - prevDate) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    prevDate = d;
  }

  return maxStreak;
}

/**
 * 히트맵 데이터 계산 (날짜별 세션 수)
 * @param {Array} history
 * @returns {Object} { [date]: count }
 */
export function calculateHeatmapData(history) {
  const dayCounts = {};
  history.forEach(s => {
    dayCounts[s.date] = (dayCounts[s.date] || 0) + 1;
  });
  return dayCounts;
}

/**
 * 주간 데이터 계산
 * @param {Array} history
 * @param {number} now - 현재 타임스탬프
 * @returns {Object} { weekData, weekRange, maxMinutes }
 */
export function calculateWeeklyData(history, now = Date.now()) {
  const today = new Date(now);
  const dayOfWeek = today.getDay() || 7; // 일요일(0) -> 7
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1);
  monday.setHours(0, 0, 0, 0);

  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const weekData = [];
  let maxMinutes = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const sessions = history.filter(s => s.date === dateStr);
    const totalMin = Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60);

    maxMinutes = Math.max(maxMinutes, totalMin);

    weekData.push({
      day: days[i],
      date: dateStr,
      minutes: totalMin,
      isToday: dateStr === today.toISOString().split('T')[0]
    });
  }

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekRange = `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`;

  return { weekData, weekRange, maxMinutes };
}

/**
 * 수면-훈련 인사이트 계산
 * @param {Array} history - 세션 히스토리
 * @param {Object} sleepData - { [date]: { hours, quality } }
 * @param {number} totalReps - 완주 기준 반복 횟수 (기본 35)
 * @returns {Object}
 */
export function calculateSleepInsight(history, sleepData, totalReps = 35) {
  const sessionsWithSleep = history.filter(s => {
    const sleep = sleepData[s.date];
    return sleep && sleep.hours;
  });

  if (sessionsWithSleep.length < 3) {
    return { hasEnoughData: false };
  }

  let goodSleepDays = 0, goodSleepComplete = 0;
  let badSleepDays = 0, badSleepComplete = 0;

  sessionsWithSleep.forEach(s => {
    const sleep = sleepData[s.date];
    const hours = parseFloat(sleep.hours) || 0;
    if (hours >= 7) {
      goodSleepDays++;
      if ((s.reps || 0) >= totalReps) goodSleepComplete++;
    } else {
      badSleepDays++;
      if ((s.reps || 0) >= totalReps) badSleepComplete++;
    }
  });

  const goodRate = goodSleepDays > 0 ? Math.round((goodSleepComplete / goodSleepDays) * 100) : 0;
  const badRate = badSleepDays > 0 ? Math.round((badSleepComplete / badSleepDays) * 100) : 0;

  return {
    hasEnoughData: true,
    goodSleepDays,
    badSleepDays,
    goodRate,
    badRate,
    diff: goodRate - badRate
  };
}

/**
 * 최적 훈련 시간대 계산
 * @param {Array} history
 * @param {number} totalReps - 완주 기준
 * @returns {Object}
 */
export function calculateBestTrainingTime(history, totalReps = 35) {
  const timeSlots = { morning: [], afternoon: [], evening: [] };

  history.forEach(s => {
    const h = new Date(s.timestamp).getHours();
    const completed = (s.reps || 0) >= totalReps;

    if (h >= 5 && h < 12) {
      timeSlots.morning.push(completed);
    } else if (h >= 12 && h < 18) {
      timeSlots.afternoon.push(completed);
    } else {
      timeSlots.evening.push(completed);
    }
  });

  const getRate = arr => arr.length > 0 ? arr.filter(x => x).length / arr.length : 0;

  const rates = {
    morning: { rate: getRate(timeSlots.morning), count: timeSlots.morning.length },
    afternoon: { rate: getRate(timeSlots.afternoon), count: timeSlots.afternoon.length },
    evening: { rate: getRate(timeSlots.evening), count: timeSlots.evening.length }
  };

  let bestTime = 'morning';
  let bestRate = rates.morning.rate;

  if (rates.afternoon.rate > bestRate) {
    bestTime = 'afternoon';
    bestRate = rates.afternoon.rate;
  }
  if (rates.evening.rate > bestRate) {
    bestTime = 'evening';
    bestRate = rates.evening.rate;
  }

  const timeLabels = {
    morning: '아침 (5-12시)',
    afternoon: '오후 (12-18시)',
    evening: '저녁/밤 (18-5시)'
  };

  return {
    bestTime,
    bestTimeLabel: timeLabels[bestTime],
    bestRate: Math.round(bestRate * 100),
    rates
  };
}

/**
 * 상관관계 차트 데이터 계산
 * @param {Array} history
 * @param {Object} sleepData
 * @param {number} totalReps
 * @returns {Array} [{ x, y, completed, date }]
 */
export function calculateCorrelationData(history, sleepData, totalReps = 35) {
  return history
    .filter(s => sleepData[s.date] && sleepData[s.date].hours)
    .map(s => {
      const sleep = sleepData[s.date];
      const hours = parseFloat(sleep.hours) || 0;
      const minutes = Math.round((s.duration || 0) / 60);
      const completed = (s.reps || 0) >= totalReps;

      return {
        date: s.date,
        sleepHours: hours,
        trainingMinutes: minutes,
        completed,
        // 좌표 계산 (수면 4-10시간, 훈련 0-15분 기준)
        x: Math.min(Math.max((hours - 4) / 6, 0), 1),
        y: Math.min(minutes / 15, 1)
      };
    });
}
