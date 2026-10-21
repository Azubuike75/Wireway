/* WireWay service worker: works offline after the first visit.
   Bump CACHE when you change index.html so users get the new version. */
var CACHE="wireway-v8";
var SHELL=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener("fetch",function(e){
  var req=e.request;
  if(req.method!=="GET")return;
  var url=new URL(req.url);
  var fonts=url.hostname==="fonts.googleapis.com"||url.hostname==="fonts.gstatic.com";
  if(req.mode==="navigate"){
    /* network first so updates arrive, cache as the offline fallback */
    e.respondWith(fetch(req).then(function(res){
      var copy=res.clone();caches.open(CACHE).then(function(c){c.put("./index.html",copy)});return res;
    }).catch(function(){return caches.match("./index.html")}));
    return;
  }
  if(url.origin===location.origin||fonts){
    /* stale while revalidate */
    e.respondWith(caches.match(req).then(function(hit){
      var net=fetch(req).then(function(res){
        if(res&&(res.ok||res.type==="opaque")){var copy=res.clone();caches.open(CACHE).then(function(c){c.put(req,copy)})}
        return res;
      }).catch(function(){return hit});
      return hit||net;
    }));
  }
});
