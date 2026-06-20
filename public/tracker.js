/**
 * CausalFunnel Analytics Tracker
 * Embed: <script src="/tracker.js" data-endpoint="https://your-app.com/api/events"></script>
 */
(function () {
  "use strict";

  var STORAGE_KEY = "cf_session_id";
  var ENDPOINT =
    (document.currentScript && document.currentScript.dataset.endpoint) ||
    window.CF_ENDPOINT ||
    "/api/events";

  /* ── Session ID ── */
  function getOrCreateSession() {
    var id = localStorage.getItem(STORAGE_KEY) || readCookie(STORAGE_KEY);
    if (!id) {
      id =
        "cf_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 9);
      localStorage.setItem(STORAGE_KEY, id);
      setCookie(STORAGE_KEY, id, 30);
    }
    return id;
  }

  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie =
      name + "=" + value + ";expires=" + expires + ";path=/;SameSite=Lax";
  }

  function readCookie(name) {
    var match = document.cookie.match(
      new RegExp("(?:^|; )" + name + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  /* ── requestIdleCallback Polyfill ── */
  var requestIdle =
    window.requestIdleCallback ||
    function (cb) {
      var start = Date.now();
      return setTimeout(function () {
        cb({
          didTimeout: false,
          timeRemaining: function () {
            return Math.max(0, 50 - (Date.now() - start));
          },
        });
      }, 1);
    };

  /* ── Queue & Flush ── */
  var queue = [];
  var flushTimer = null;

  function enqueue(event) {
    requestIdle(function () {
      queue.push(event);
      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = setTimeout(flush, 500); // batch within 500ms
    });
  }

  function flush() {
    if (!queue.length) return;
    var batch = queue.slice();
    queue = [];

    var payload = JSON.stringify(batch);

    // Use sendBeacon when available (page unload safe)
    if (navigator.sendBeacon) {
      var blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", ENDPOINT, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(payload);
    }
  }

  // Flush on page hide
  window.addEventListener("pagehide", flush);
  window.addEventListener("beforeunload", flush);

  /* ── Build Event ── */
  var SESSION_ID = getOrCreateSession();

  function buildEvent(type, extra) {
    var base = {
      session_id: SESSION_ID,
      event_type: type,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    };
    return Object.assign(base, extra || {});
  }

  /* ── page_view ── */
  function trackPageView() {
    enqueue(buildEvent("page_view"));
  }

  /* ── click ── */
  document.addEventListener(
    "click",
    function (e) {
      enqueue(
        buildEvent("click", {
          x: Math.round(e.clientX),
          y: Math.round(e.clientY),
          target_tag: e.target ? e.target.tagName : null,
          target_text:
            e.target && e.target.innerText
              ? e.target.innerText.slice(0, 100)
              : null,
        })
      );
    },
    { passive: true }
  );

  /* ── SPA Route Changes ── */
  (function patchHistory() {
    var orig = history.pushState.bind(history);
    history.pushState = function () {
      orig.apply(history, arguments);
      trackPageView();
    };
    window.addEventListener("popstate", trackPageView);
  })();

  /* ── Init ── */
  trackPageView();

  // Expose manual API
  window.CausalFunnel = {
    track: function (type, extra) {
      enqueue(buildEvent(type, extra));
    },
    flush: flush,
    sessionId: SESSION_ID,
  };
})();
