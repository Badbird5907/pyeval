!(function (e, t) {
  "object" == typeof exports && "object" == typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
      ? define([], t)
      : "object" == typeof exports
        ? (exports.syncMessage = t())
        : (e.syncMessage = t());
})(self, function () {
  return (() => {
    "use strict";
    var e = {
        d: (t, r) => {
          for (var n in r)
            e.o(r, n) &&
              !e.o(t, n) &&
              Object.defineProperty(t, n, { enumerable: !0, get: r[n] });
        },
        o: (e, t) => Object.prototype.hasOwnProperty.call(e, t),
        r: (e) => {
          "undefined" != typeof Symbol &&
            Symbol.toStringTag &&
            Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
            Object.defineProperty(e, "__esModule", { value: !0 });
        },
      },
      t = {};
    e.r(t),
      e.d(t, {
        isServiceWorkerRequest: () => s,
        serviceWorkerFetchListener: () => i,
        asyncSleep: () => u,
        ServiceWorkerError: () => c,
        writeMessageAtomics: () => a,
        writeMessageServiceWorker: () => f,
        writeMessage: () => d,
        makeChannel: () => l,
        makeAtomicsChannel: () => m,
        makeServiceWorkerChannel: () => y,
        readMessage: () => h,
        syncSleep: () => g,
        uuidv4: () => w,
      });
    var r = function (e, t, r, n) {
      return new (r || (r = Promise))(function (o, s) {
        function i(e) {
          try {
            c(n.next(e));
          } catch (e) {
            s(e);
          }
        }
        function u(e) {
          try {
            c(n.throw(e));
          } catch (e) {
            s(e);
          }
        }
        function c(e) {
          var t;
          e.done
            ? o(e.value)
            : ((t = e.value),
              t instanceof r
                ? t
                : new r(function (e) {
                    e(t);
                  })).then(i, u);
        }
        c((n = n.apply(e, t || [])).next());
      });
    };
    const n = "__SyncMessageServiceWorkerInput__",
      o = "__sync-message-v2__";
    function s(e) {
      return "string" != typeof e && (e = e.request.url), e.includes(n);
    }
    function i() {
      const e = {},
        t = {};
      return (n) => {
        const { url: i } = n.request;
        return (
          !!s(i) &&
          (n.respondWith(
            (function () {
              return r(this, void 0, void 0, function* () {
                function r(e) {
                  const t = { message: e, version: o };
                  return new Response(JSON.stringify(t), { status: 200 });
                }
                if (i.endsWith("/read")) {
                  const { messageId: o, timeout: s } = yield n.request.json();
                  if (o in e) {
                    const t = e[o];
                    return delete e[o], r(t);
                  }
                  return yield new Promise((e) => {
                    (t[o] = e),
                      setTimeout(function () {
                        delete t[o], e(new Response("", { status: 408 }));
                      }, s);
                  });
                }
                if (i.endsWith("/write")) {
                  const { message: o, messageId: s } = yield n.request.json(),
                    i = t[s];
                  return (
                    i ? (i(r(o)), delete t[s]) : (e[s] = o), r({ early: !i })
                  );
                }
                if (i.endsWith("/version"))
                  return new Response(o, { status: 200 });
              });
            })(),
          ),
          !0)
        );
      };
    }
    function u(e) {
      return new Promise((t) => setTimeout(t, e));
    }
    class c extends Error {
      constructor(e, t) {
        super(
          `Received status ${t} from ${e}. Ensure the service worker is registered and active.`,
        ),
          (this.url = e),
          (this.status = t),
          (this.type = "ServiceWorkerError"),
          Object.setPrototypeOf(this, c.prototype);
      }
    }
    function a(e, t) {
      const r = new TextEncoder().encode(JSON.stringify(t)),
        { data: n, meta: o } = e;
      if (r.length > n.length)
        throw new Error(
          "Message is too big, increase bufferSize when making channel.",
        );
      n.set(r, 0),
        Atomics.store(o, 0, r.length),
        Atomics.store(o, 1, 1),
        Atomics.notify(o, 1);
    }
    function f(e, t, n) {
      return r(this, void 0, void 0, function* () {
        yield navigator.serviceWorker.ready;
        const r = e.baseUrl + "/write",
          s = Date.now();
        for (;;) {
          const i = { message: t, messageId: n },
            a = yield fetch(r, { method: "POST", body: JSON.stringify(i) });
          if (200 === a.status && (yield a.json()).version === o) return;
          if (!(Date.now() - s < e.timeout)) throw new c(r, a.status);
          yield u(100);
        }
      });
    }
    function d(e, t, n) {
      return r(this, void 0, void 0, function* () {
        "atomics" === e.type ? a(e, t) : yield f(e, t, n);
      });
    }
    function l(e = {}) {
      return "undefined" != typeof SharedArrayBuffer
        ? m(e.atomics)
        : "serviceWorker" in navigator
          ? y(e.serviceWorker)
          : null;
    }
    function m({ bufferSize: e } = {}) {
      return {
        type: "atomics",
        data: new Uint8Array(new SharedArrayBuffer(e || 131072)),
        meta: new Int32Array(
          new SharedArrayBuffer(2 * Int32Array.BYTES_PER_ELEMENT),
        ),
      };
    }
    function y(e = {}) {
      return {
        type: "serviceWorker",
        baseUrl: (e.scope || "/") + n,
        timeout: e.timeout || 5e3,
      };
    }
    function p(e, t) {
      return e > 0 ? +e : t;
    }
    function h(e, t, { checkInterrupt: r, checkTimeout: n, timeout: s } = {}) {
      const i = performance.now();
      n = p(n, r ? 100 : 5e3);
      const u = p(s, Number.POSITIVE_INFINITY);
      let a;
      if ("atomics" === e.type) {
        const { data: t, meta: r } = e;
        a = () => {
          if ("timed-out" === Atomics.wait(r, 1, 0, n)) return null;
          {
            const e = Atomics.exchange(r, 0, 0),
              n = t.slice(0, e);
            Atomics.store(r, 1, 0);
            const o = new TextDecoder().decode(n);
            return JSON.parse(o);
          }
        };
      } else
        a = () => {
          const r = new XMLHttpRequest(),
            s = e.baseUrl + "/read";
          r.open("POST", s, !1);
          const u = { messageId: t, timeout: n };
          r.send(JSON.stringify(u));
          const { status: a } = r;
          if (408 === a) return null;
          if (200 === a) {
            const e = JSON.parse(r.responseText);
            return e.version !== o ? null : e.message;
          }
          if (performance.now() - i < e.timeout) return null;
          throw new c(s, a);
        };
      for (;;) {
        const e = u - (performance.now() - i);
        if (e <= 0) return null;
        n = Math.min(n, e);
        const t = a();
        if (null !== t) return t;
        if (null == r ? void 0 : r()) return null;
      }
    }
    function g(e, t) {
      if ((e = p(e, 0)))
        if ("undefined" != typeof SharedArrayBuffer) {
          const t = new Int32Array(
            new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT),
          );
          (t[0] = 0), Atomics.wait(t, 0, 0, e);
        } else h(t, `sleep ${e} ${w()}`, { timeout: e });
    }
    let w;
    return (
      (w =
        "randomUUID" in crypto
          ? function () {
              return crypto.randomUUID();
            }
          : function () {
              return "10000000-1000-4000-8000-100000000000".replace(
                /[018]/g,
                (e) => {
                  const t = Number(e);
                  return (
                    t ^
                    (crypto.getRandomValues(new Uint8Array(1))[0] &
                      (15 >> (t / 4)))
                  ).toString(16);
                },
              );
            }),
      t
    );
  })();
});
