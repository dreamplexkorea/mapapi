/**
 * 혀 훈련 PWA - Service Worker
 * 오프라인 지원 및 캐싱 전략
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `tt-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tt-dynamic-${CACHE_VERSION}`;

// 정적 리소스 - Cache First
const STATIC_ASSETS = [
  '/',
  '/tongue-training.html',
  '/manifest.json',
  '/icons/icon.svg'
];

// 외부 리소스 - Stale While Revalidate
const EXTERNAL_PATTERNS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'unpkg.com/@splinetool'
];

// 설치 이벤트 - 정적 리소스 캐싱
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('tt-') &&
                     name !== STATIC_CACHE &&
                     name !== DYNAMIC_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch 이벤트 - 캐싱 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Chrome extension 등 제외
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 외부 리소스 - Stale While Revalidate
  if (isExternalResource(url.href)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 정적 리소스 - Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 기타 - Network First with Cache Fallback
  event.respondWith(networkFirst(request));
});

/**
 * Cache First 전략
 * 캐시에 있으면 캐시 반환, 없으면 네트워크 요청 후 캐싱
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    return createOfflineResponse();
  }
}

/**
 * Network First 전략
 * 네트워크 우선, 실패 시 캐시 폴백
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return createOfflineResponse();
  }
}

/**
 * Stale While Revalidate 전략
 * 캐시 즉시 반환, 백그라운드에서 업데이트
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

/**
 * 정적 리소스 확인
 */
function isStaticAsset(pathname) {
  return STATIC_ASSETS.includes(pathname) ||
         pathname.endsWith('.html') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.ico');
}

/**
 * 외부 리소스 확인
 */
function isExternalResource(url) {
  return EXTERNAL_PATTERNS.some(pattern => url.includes(pattern));
}

/**
 * 오프라인 응답 생성
 */
function createOfflineResponse() {
  const html = `
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
        .offline-container {
          max-width: 400px;
        }
        .offline-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 12px;
        }
        p {
          color: rgba(255,255,255,0.6);
          margin-bottom: 24px;
          line-height: 1.6;
        }
        button {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        button:active {
          transform: scale(0.95);
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📶</div>
        <h1>오프라인 상태입니다</h1>
        <p>인터넷 연결을 확인해주세요.<br>연결되면 자동으로 다시 시도합니다.</p>
        <button onclick="location.reload()">다시 시도</button>
      </div>
      <script>
        window.addEventListener('online', () => location.reload());
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

// 백그라운드 동기화 이벤트 (향후 Phase 5)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sessions') {
    console.log('[SW] Background sync triggered');
    // 향후 서버 동기화 구현
  }
});

// 푸시 알림 이벤트 (향후 확장)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || '훈련 시간이에요!',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/tongue-training.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '혀 훈련', options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

console.log('[SW] Service Worker loaded');
