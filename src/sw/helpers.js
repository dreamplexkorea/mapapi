/**
 * Service Worker 헬퍼 함수
 */

// 정적 리소스 목록
export const STATIC_ASSETS = [
  '/',
  '/tongue-training.html',
  '/manifest.json',
  '/icons/icon.svg'
];

// 외부 리소스 패턴
export const EXTERNAL_PATTERNS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'unpkg.com/@splinetool'
];

/**
 * 정적 리소스 여부 확인
 * @param {string} pathname - URL 경로
 * @param {string[]} staticAssets - 정적 리소스 목록 (테스트용)
 * @returns {boolean}
 */
export function isStaticAsset(pathname, staticAssets = STATIC_ASSETS) {
  return staticAssets.includes(pathname) ||
         pathname.endsWith('.html') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.ico');
}

/**
 * 외부 리소스 여부 확인
 * @param {string} url - 전체 URL
 * @param {string[]} patterns - 외부 리소스 패턴 (테스트용)
 * @returns {boolean}
 */
export function isExternalResource(url, patterns = EXTERNAL_PATTERNS) {
  return patterns.some(pattern => url.includes(pattern));
}

/**
 * 오프라인 응답 HTML 생성
 * @returns {string}
 */
export function getOfflineHtml() {
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>오프라인 - 혀 훈련</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          color: #fff;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
        }
        .offline-container { max-width: 400px; }
        .offline-icon { font-size: 64px; margin-bottom: 24px; }
        h1 { font-size: 24px; margin-bottom: 12px; }
        p { color: rgba(255,255,255,0.6); margin-bottom: 24px; line-height: 1.6; }
        button {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 16px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📶</div>
        <h1>오프라인 상태입니다</h1>
        <p>인터넷 연결을 확인해주세요.</p>
        <button onclick="location.reload()">다시 시도</button>
      </div>
    </body>
    </html>
  `;
}
