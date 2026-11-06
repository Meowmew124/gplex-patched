// ---- Google Images: the real pictures, not the thumbnails (gplex-patched) --------------------
// Google's page only carries small thumbnails (about 225 across), soft on a sharp screen, and a size
// label that isn't the picture's real one. Here every picture on or near the screen is fetched from
// its own site in the background and put in place of its thumbnail when it has arrived, at exactly
// the thumbnail's place and size, so nothing on the page moves. The preview panel then opens with the
// full picture straight away (Gplex's own code falls back to the thumbnail until a slower one comes).
//
// A picture is left as its thumbnail when it can't be used: the sites Gplex already won't embed,
// animated GIFs (they'd all start moving in the grid), one that fails to load, and one that turns out
// to be something else, such as a site's "no hotlinking" graphic (smaller than the thumbnail, or not
// the shape Google says the picture is).
var ugfImagesFull = (function() {
    "use strict";
    const SLOTS = 6; // at a time; hovering over a picture starts it anyway
    const NEAR = "800px 0px"; // how far off the screen a picture is fetched ahead of being seen
    const GIVE_UP_MS = 15000; // a slow site stops holding up the others (its picture still goes in if it comes)
    const ready = new Set(); // the originals that have arrived and are good
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
    const genuine = function(el, im) {
        const thumb = el.querySelector("img");
        const w = num(el, "img-orig-w");
        const h = num(el, "img-orig-h");
        if (thumb && im.naturalWidth < thumb.naturalWidth) {
            return false;
        }
        return !w || !h || Math.abs(im.naturalWidth / im.naturalHeight - w / h) < 0.15;
    };
    const swap = function(el, big, anyway) {
        const img = el.querySelector("img");
        if (!img || img.getAttribute("src") === big) {
            return;
        }
        const broken = img.complete && img.naturalWidth === 0;
        // (a thumbnail Google hasn't filled in yet: its place isn't known until it has)
        if (!broken && !anyway && (!img.complete || img.naturalWidth < 2)) {
            img.addEventListener("load", function() {
                swap(el, big);
            }, { once: true });
            setTimeout(function() {
                swap(el, big, true);
            }, 3000);
            return;
        }
        // same place, same size (one whose thumbnail never came takes its natural place)
        if (img.naturalWidth >= 2) {
            const cs = getComputedStyle(img);
            if (!parseFloat(cs.width) || !parseFloat(cs.height)) {
                return;
            }
            img.style.width = cs.width;
            img.style.height = cs.height;
            img.style.objectFit = "cover";
            // the thumbnail stays behind it for the moment the big one takes to draw
            img.style.background = 'url("' + (img.currentSrc || img.src).replace(/"/g, "%22") + '") 0 0 / 100% 100% no-repeat';
            setTimeout(function() {
                img.style.removeProperty("background");
            }, 800);
        }
        img.referrerPolicy = "no-referrer";
        img.decoding = "async";
        img.src = big;
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
            if (genuine(el, im)) {
                ready.add(big);
                swap(el, big);
            }
            state.set(el, "done");
            release();
        };
        im.onerror = function() {
            clearTimeout(slow);
            state.set(el, "done");
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
        if (!/^https?:/.test(big) || /\.gif(\?|$)/i.test(big) || (excluded && excluded(big))) {
            return;
        }
        state.set(el, "waiting");
        watch().observe(el);
        el.addEventListener("pointerenter", function() {
            load(el);
        }, { passive: true });
    };
    return {
        tile: tile,
        want: load,
        ready: function(url) {
            return !!url && ready.has(url);
        }
    };
})();
