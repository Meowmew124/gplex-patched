// ---- Google Images: the preview panel opens sharp (gplex-patched) ----------------------------
// Google's page only carries small thumbnails (about 225 across), so the panel used to start with one
// stretched until the real picture had come from its own site, and its size label wasn't the picture's
// real one. Here every picture on or near the screen is fetched ahead in the background and held, so
// the panel has the real picture the moment it opens. The grid itself keeps Google's thumbnails: the
// originals are only ever shown in the panel. (One clicked before it has arrived starts as the
// thumbnail, by Gplex's own code, until it comes. So do the sites Gplex won't embed.)
var ugfImagesFull = (function() {
    "use strict";
    const SLOTS = 6; // at a time; hovering over a picture starts it anyway
    const NEAR = "800px 0px"; // how far off the screen a picture is fetched ahead of being seen
    const GIVE_UP_MS = 15000; // a slow site stops holding up the others (its picture is still kept if it comes)
    const KEEP = 60; // pictures held in memory, the newest; hovering over an older one fetches it again
    const kept = new Map();
    const state = new WeakMap();
    let queue = [];
    let busy = 0;
    let io = null;

    const num = function(el, name) {
        return parseInt(el.getAttribute(name), 10) || 0;
    };
    // the size the label on the picture gives
    const label = function(el) {
        const w = num(el, "img-orig-w");
        const h = num(el, "img-orig-h");
        if (!w || !h) {
            return;
        }
        el.querySelectorAll(".ugf-image-result-size-first, .ugf-image-result-size-second").forEach(function(sz) {
            if (sz.children.length >= 3) {
                sz.children[0].textContent = w;
                sz.children[2].textContent = h;
                sz.removeAttribute("title");
            }
        });
    };
    // decoded ahead, for the picture the pointer is on: the panel then draws it without a pause
    const decode = function(im) {
        if (im.decode) {
            im.decode().catch(function() {});
        }
    };
    const load = function(el) {
        if (state.get(el) !== "waiting") {
            return;
        }
        state.set(el, "loading");
        queue = queue.filter(function(e) {
            return e !== el;
        });
        if (io) {
            io.unobserve(el);
        }
        const big = el.getAttribute("img-big-src");
        const im = new Image();
        let holding = true;
        busy++;
        const release = function() {
            if (holding) {
                holding = false;
                busy--;
                pump();
            }
        };
        const slow = setTimeout(release, GIVE_UP_MS);
        im.onload = function() {
            clearTimeout(slow);
            kept.delete(big);
            kept.set(big, im);
            while (kept.size > KEEP) {
                kept.delete(kept.keys().next().value);
            }
            if (el.matches(":hover")) {
                decode(im);
            }
            state.set(el, "done");
            release();
        };
        im.onerror = function() {
            clearTimeout(slow);
            state.set(el, "failed");
            release();
        };
        im.referrerPolicy = "no-referrer";
        im.decoding = "async";
        im.src = big;
    };
    function pump() {
        while (busy < SLOTS && queue.length) {
            load(queue[0]);
        }
    }
    const watch = function() {
        if (!io) {
            io = new IntersectionObserver(function(entries) {
                entries.forEach(function(en) {
                    if (state.get(en.target) !== "waiting") {
                        return;
                    }
                    const at = queue.indexOf(en.target);
                    if (en.isIntersecting && at < 0) {
                        queue.push(en.target);
                    } else if (!en.isIntersecting && at > -1) {
                        // scrolled past before its turn came
                        queue.splice(at, 1);
                    }
                });
                pump();
            }, { rootMargin: NEAR });
        }
        return io;
    };
    // a picture in the results, as Gplex makes it
    const tile = function(el, excluded, lookup) {
        if (!num(el, "img-orig-w") && lookup) {
            const found = lookup(el.getAttribute("img-docid"));
            if (found) {
                el.setAttribute("img-big-src", el.getAttribute("img-big-src") || found.origUrl || "");
                el.setAttribute("img-orig-w", found.origWidth || "");
                el.setAttribute("img-orig-h", found.origHeight || "");
            }
        }
        label(el);
        const big = el.getAttribute("img-big-src") || "";
        if (!/^https?:/.test(big) || (excluded && excluded(big))) {
            return;
        }
        state.set(el, "waiting");
        watch().observe(el);
        el.addEventListener("pointerenter", function() {
            const im = kept.get(big);
            if (im) {
                decode(im);
                return;
            }
            if (state.get(el) === "done") {
                state.set(el, "waiting");
            }
            load(el);
        }, { passive: true });
    };
    return {
        tile: tile,
        want: load,
        ready: function(url) {
            return !!url && kept.has(url);
        }
    };
})();
