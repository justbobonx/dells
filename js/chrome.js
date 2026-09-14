/** Fullscreen + wake lock, same idea as Jumbler. */

function PlayChrome() {
  this.wakeLock = null;
}

PlayChrome.prototype.isFullscreen = function () {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
};

PlayChrome.prototype.requestFullscreen = function () {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen;
  if (!req) return Promise.resolve();
  try {
    const p = req.call(el);
    if (p && typeof p.then === "function") return p.catch(function () {});
  } catch (err) {}
  return Promise.resolve();
};

PlayChrome.prototype.requestWakeLock = function () {
  const api = navigator.wakeLock;
  if (!api || typeof api.request !== "function") return Promise.resolve();
  const self = this;
  return api
    .request("screen")
    .then(function (lock) {
      self.wakeLock = lock;
      lock.addEventListener("release", function () {
        if (self.wakeLock === lock) self.wakeLock = null;
      });
    })
    .catch(function () {});
};

PlayChrome.prototype.enter = function () {
  const self = this;
  const fs = this.isFullscreen() ? Promise.resolve() : this.requestFullscreen();
  return fs.then(function () {
    return self.requestWakeLock();
  });
};
