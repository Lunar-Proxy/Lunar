if (navigator.userAgent.includes('Firefox')) {
  Object.defineProperty(globalThis, 'crossOriginIsolated', {
    value: true,
    writable: false,
  });
}
importScripts(
  '/assets/packaged/v/bundle.js',
  '/assets/packaged/v/config.js',
  '/assets/packaged/v/sw.js',
  '/assets/packaged/scram/wasm.js',
  '/assets/packaged/scram/shared.js',
  '/assets/packaged/scram/worker.js'
);

const uv = new UVServiceWorker();
const scramjet = new ScramjetServiceWorker();

let playgroundData;

self.addEventListener('message', ({ data }) => {
  if (data.type === 'playgroundData') {
    playgroundData = data;
  }
});

async function handleRequest(event) {
  if (uv.route(event)) {
    return await uv.fetch(event);
  }

  await scramjet.loadConfig();
  if (scramjet.route(event)) {
    return scramjet.fetch(event);
  }
  return fetch(event.request);
}

self.addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});
