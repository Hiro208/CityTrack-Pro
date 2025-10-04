self.addEventListener('push', (event) => {
  let data = { title: 'Transit Alert', body: 'New service alert received.' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    // ignore malformed payload
  }

  const title = data.title || 'Transit Alert';
  const body = data.body || 'New service alert received.';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: 'transit-alert',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
