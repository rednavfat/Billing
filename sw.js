/* Bottom Time — service worker.
   The point of this file is that the app opens and works with no signal.

   The page is fetched network-first so a new deploy lands on the next open,
   falling back to cache when there is nothing to reach. Everything else —
   icons, and the Google Fonts stylesheet and font files — is cache-first, so
   after one online visit the whole app runs offline. */

var VERSION = 'bottom-time-v2';
var PAGE = './index.html';
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(VERSION)
      /* One missing file must not fail the whole install, so each is added
         on its own and a failure is tolerated. */
      .then(function(c){
        return Promise.all(SHELL.map(function(u){
          return c.add(u).catch(function(){});
        }));
      })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k===VERSION ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function isFontHost(h){
  return h==='fonts.googleapis.com' || h==='fonts.gstatic.com';
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch(err){ return; }

  /* The page itself: network first, so a redeploy is picked up. */
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(VERSION).then(function(c){ c.put(PAGE, copy); }).catch(function(){});
        return res;
      }).catch(function(){
        return caches.match(PAGE).then(function(hit){
          return hit || caches.match('./');
        });
      })
    );
    return;
  }

  /* Our own assets and the web fonts: cache first, filled in on first use. */
  if(url.origin === self.location.origin || isFontHost(url.hostname)){
    e.respondWith(
      caches.match(req).then(function(hit){
        if(hit) return hit;
        return fetch(req).then(function(res){
          /* status 0 is an opaque cross-origin response — not worth storing. */
          if(res && res.status === 200){
            var copy = res.clone();
            caches.open(VERSION).then(function(c){ c.put(req, copy); }).catch(function(){});
          }
          return res;
        }).catch(function(){ return hit; });
      })
    );
  }
});
