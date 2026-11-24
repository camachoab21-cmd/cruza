'use strict';
const cacheName = 'cruza-public-game-v1';
const game = '/static/cruza-crucigrama.html';
const assets = [game, '/static/cruza-crucigrama.css', '/static/cruza-crucigrama.js'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys
      .filter(key => key.startsWith('cruza-public-game-') && key !== cacheName)
      .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (assets.includes(url.pathname) && !url.search) {
    event.respondWith(caches.open(cacheName).then(async cache =>
      (await cache.match(request)) || fetch(request)));
  } else if (request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(cacheName);
      return cache.match(game);
    }));
  }
});
