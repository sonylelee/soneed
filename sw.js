/* SONEED 푸시 수신 Service Worker — 앱이 꺼져 있어도 백그라운드에서 푸시를 받아 알림을 띄운다.
   GitHub 루트에 sw.js로 올려야 하며, index.html이 navigator.serviceWorker.register('sw.js')로 등록한다. */
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function(event){
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e){ try{ data = { body: event.data.text() }; }catch(_){} }
  var title = data.title || 'SONEED 알림';
  var body  = data.body  || '새 소식이 있습니다.';
  var url   = data.url   || './';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: data.tag || 'soneed',
      data: { url: url },
      requireInteraction: false
    })
  );
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || './';
  var openId = ''; try{ openId = new URL(url).searchParams.get('open') || ''; }catch(e){}
  event.waitUntil(
    self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
      for (var i=0;i<list.length;i++){
        var c = list[i];
        if (c.url.indexOf('sonylelee.github.io/soneed') >= 0 && 'focus' in c){
          if (openId && c.postMessage) c.postMessage({ type:'openRecord', id: openId });   // 이미 열린 앱에 '이 기록 열어' 전달
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);   // 안 열려있으면 새로 (?open=id 포함)
    })
  );
});
