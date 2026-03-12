import { describe, it, expect } from 'vitest';
import {
  isStaticAsset,
  isExternalResource,
  getOfflineHtml,
  STATIC_ASSETS,
  EXTERNAL_PATTERNS
} from '../../src/sw/helpers.js';

describe('sw helpers', () => {
  describe('STATIC_ASSETS', () => {
    it('기본 정적 리소스 목록을 포함해야 한다', () => {
      expect(STATIC_ASSETS).toContain('/');
      expect(STATIC_ASSETS).toContain('/tongue-training.html');
      expect(STATIC_ASSETS).toContain('/manifest.json');
      expect(STATIC_ASSETS).toContain('/icons/icon.svg');
    });
  });

  describe('EXTERNAL_PATTERNS', () => {
    it('외부 리소스 패턴을 포함해야 한다', () => {
      expect(EXTERNAL_PATTERNS).toContain('fonts.googleapis.com');
      expect(EXTERNAL_PATTERNS).toContain('fonts.gstatic.com');
      expect(EXTERNAL_PATTERNS).toContain('unpkg.com/@splinetool');
    });
  });

  describe('isStaticAsset', () => {
    it('STATIC_ASSETS에 포함된 경로는 true를 반환해야 한다', () => {
      expect(isStaticAsset('/')).toBe(true);
      expect(isStaticAsset('/tongue-training.html')).toBe(true);
      expect(isStaticAsset('/manifest.json')).toBe(true);
      expect(isStaticAsset('/icons/icon.svg')).toBe(true);
    });

    it('.html 파일은 true를 반환해야 한다', () => {
      expect(isStaticAsset('/other-page.html')).toBe(true);
      expect(isStaticAsset('/pages/about.html')).toBe(true);
    });

    it('.css 파일은 true를 반환해야 한다', () => {
      expect(isStaticAsset('/styles.css')).toBe(true);
      expect(isStaticAsset('/css/main.css')).toBe(true);
    });

    it('.js 파일은 true를 반환해야 한다', () => {
      expect(isStaticAsset('/app.js')).toBe(true);
      expect(isStaticAsset('/src/utils/date.js')).toBe(true);
    });

    it('.svg 파일은 true를 반환해야 한다', () => {
      expect(isStaticAsset('/icon.svg')).toBe(true);
      expect(isStaticAsset('/images/logo.svg')).toBe(true);
    });

    it('.png 파일은 true를 반환해야 한다', () => {
      expect(isStaticAsset('/image.png')).toBe(true);
      expect(isStaticAsset('/icons/icon-192.png')).toBe(true);
    });

    it('.ico 파일은 true를 반환해야 한다', () => {
      expect(isStaticAsset('/favicon.ico')).toBe(true);
    });

    it('API 경로는 false를 반환해야 한다', () => {
      expect(isStaticAsset('/api/data')).toBe(false);
      expect(isStaticAsset('/api/sessions')).toBe(false);
    });

    it('.jpg, .webp 등 지원하지 않는 확장자는 false를 반환해야 한다', () => {
      expect(isStaticAsset('/image.jpg')).toBe(false);
      expect(isStaticAsset('/photo.webp')).toBe(false);
      expect(isStaticAsset('/video.mp4')).toBe(false);
    });

    it('커스텀 정적 리소스 목록을 사용할 수 있어야 한다', () => {
      const customAssets = ['/custom.html'];
      expect(isStaticAsset('/custom.html', customAssets)).toBe(true);
      expect(isStaticAsset('/', customAssets)).toBe(false);
    });
  });

  describe('isExternalResource', () => {
    it('구글 폰트 URL은 true를 반환해야 한다', () => {
      expect(isExternalResource('https://fonts.googleapis.com/css2?family=Inter')).toBe(true);
      expect(isExternalResource('https://fonts.gstatic.com/s/inter/v13/font.woff2')).toBe(true);
    });

    it('Spline URL은 true를 반환해야 한다', () => {
      expect(isExternalResource('https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js')).toBe(true);
    });

    it('다른 외부 URL은 false를 반환해야 한다', () => {
      expect(isExternalResource('https://example.com/resource')).toBe(false);
      expect(isExternalResource('https://cdn.jsdelivr.net/npm/library')).toBe(false);
    });

    it('로컬 URL은 false를 반환해야 한다', () => {
      expect(isExternalResource('http://localhost:3000/api')).toBe(false);
      expect(isExternalResource('/tongue-training.html')).toBe(false);
    });

    it('커스텀 패턴 목록을 사용할 수 있어야 한다', () => {
      const customPatterns = ['cdn.example.com'];
      expect(isExternalResource('https://cdn.example.com/lib.js', customPatterns)).toBe(true);
      expect(isExternalResource('https://fonts.googleapis.com/css', customPatterns)).toBe(false);
    });
  });

  describe('getOfflineHtml', () => {
    it('HTML 문자열을 반환해야 한다', () => {
      const html = getOfflineHtml();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="ko">');
    });

    it('오프라인 메시지를 포함해야 한다', () => {
      const html = getOfflineHtml();
      expect(html).toContain('오프라인');
    });

    it('새로고침 버튼을 포함해야 한다', () => {
      const html = getOfflineHtml();
      expect(html).toContain('다시 시도');
      expect(html).toContain('location.reload()');
    });
  });
});
