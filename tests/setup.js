/**
 * Vitest 테스트 설정
 * - localStorage 모킹
 * - Date 모킹 헬퍼
 */

import { vi, beforeEach, afterEach } from 'vitest';

// localStorage 모킹
function createLocalStorageMock() {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i) => Object.keys(store)[i] ?? null),
    // 테스트용 헬퍼
    _getStore: () => store,
    _setStore: (newStore) => { store = newStore; }
  };
}

const localStorageMock = createLocalStorageMock();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Date 모킹 헬퍼
export function mockDate(dateString) {
  const fixedDate = new Date(dateString);
  vi.useFakeTimers();
  vi.setSystemTime(fixedDate);
  return fixedDate;
}

export function resetDate() {
  vi.useRealTimers();
}

// 테스트용 localStorage 헬퍼
export function createMockStorage(initialData = {}) {
  const store = { ...initialData };
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    _getStore: () => store
  };
}

// 각 테스트 전 초기화
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// 각 테스트 후 정리
afterEach(() => {
  vi.useRealTimers();
});
