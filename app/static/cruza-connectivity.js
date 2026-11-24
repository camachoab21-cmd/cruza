'use strict';
const connectionNotice = document.getElementById('cruza-connection');
function showConnectionNotice() {
  connectionNotice.hidden = false;
}
function hideConnectionNotice() {
  connectionNotice.hidden = true;
}
window.addEventListener('offline', showConnectionNotice);
window.addEventListener('cruza:connection-lost', showConnectionNotice);
window.addEventListener('cruza:connection-restored', hideConnectionNotice);
window.addEventListener('online', async () => {
  try {
    const response = await fetch('/api/session', {cache: 'no-store'});
    if (response.ok) hideConnectionNotice();
  } catch {
    showConnectionNotice();
  }
});
if (!navigator.onLine) showConnectionNotice();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/cruza-offline-worker.js').catch(() => {});
}
