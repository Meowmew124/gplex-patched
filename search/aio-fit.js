// ---- AI Overview fits Gplex's card (gplex-patched) ----------------------------------
// Gplex shows a copy of Google's AI Overview in its own card, but Google's styles for the
// expanded overview are for its wide page: the answer and a 372px column of sources side by
// side, a wrapper at least 500px wide, the sources held in place as you scroll. In the card
// the text ran past its edge and the sources sat outside it, to the right. And the copy's
// pictures stay Google's blank placeholders (Google's own script fills them in, on its page).
// Each time the overview changes, inside the card: a column pushed out past the card's edge
// goes under the rest, nothing is kept wider than the card, nothing sticks, and pictures still
// waiting for Google get their real address. (Done by measuring, not by Google's class names,
// which change.)
(function ugfAioFit() {
    "use strict";
    if (window.top !== window.self || !/(^|\.)google\.[a-z.]+$/.test(window.location.hostname)) {
        return;
    }
    const BLANK = /^data:image\/gif;base64,R0lGODlhAQABAI/;
    const done = new WeakMap();
    const put = function(el, prop, value) {
        el.style.setProperty(prop, value, "important");
    };
    const fit = function(inner) {
        const W = inner.clientWidth;
        if (!W) {
            return;
        }
        const ir = inner.getBoundingClientRect();
        inner.querySelectorAll("img").forEach(function(img) {
            const real = img.getAttribute("data-src");
            if (real && /^https?:\/\//.test(real) && BLANK.test(img.getAttribute("src") || "")) {
                img.setAttribute("src", real);
            }
        });
        inner.querySelectorAll("*").forEach(function(el) {
            if (el instanceof SVGElement) {
                return;
            }
            const cs = getComputedStyle(el);
            // (Google's own dialogs and menus, out of the card on purpose)
            if (cs.position === "fixed" || cs.display === "none") {
                return;
            }
            if (cs.position === "sticky") {
                put(el, "position", "static");
            }
            if (parseFloat(cs.minWidth) > W) {
                put(el, "min-width", "0");
            }
            if (parseFloat(cs.width) > W && !/^(img|video|canvas|iframe)$/i.test(el.tagName)) {
                put(el, "max-width", "100%");
            }
            // a row with a column starting at or past the card's right edge: that column goes under
            if (cs.display === "flex" && /^row/.test(cs.flexDirection) && cs.flexWrap === "nowrap" && el.children.length > 1) {
                const pushed = [].filter.call(el.children, function(c) {
                    const r = c.getBoundingClientRect();
                    return r.width > 0 && r.left >= ir.right - 8;
                });
                if (pushed.length) {
                    put(el, "flex-wrap", "wrap");
                    pushed.forEach(function(c) {
                        put(c, "flex", "1 1 100%");
                        put(c, "max-width", "100%");
                        put(c, "margin-left", "0");
                        put(c, "margin-top", "12px");
                        // (its wrappers' gap from the column beside it, and their column-sized width cap,
                        // a few levels down: the boxes inside keep their own padding)
                        const wrap = function(n, depth) {
                            [].forEach.call(n.children, function(k) {
                                if (k instanceof SVGElement || /^(img|video|canvas|iframe)$/i.test(k.tagName)) {
                                    return;
                                }
                                const ks = getComputedStyle(k);
                                if (parseFloat(ks.paddingLeft) > 40) {
                                    put(k, "padding-left", "0");
                                }
                                if (/px$/.test(ks.maxWidth) && parseFloat(ks.maxWidth) >= 300 && parseFloat(ks.maxWidth) < W) {
                                    put(k, "max-width", "100%");
                                }
                                if (depth < 3) {
                                    wrap(k, depth + 1);
                                }
                            });
                        };
                        wrap(c, 0);
                    });
                }
            }
        });
    };
    let queued = false;
    const run = function() {
        queued = false;
        document.querySelectorAll("#ugf .ugf-neuro-content-inner").forEach(function(inner) {
            // (only when the overview has changed: opened, closed, or new content)
            const sig = inner.childElementCount + ":" + (inner.textContent || "").length + ":" + inner.offsetHeight + ":" + inner.clientWidth;
            if (done.get(inner) === sig) {
                return;
            }
            fit(inner);
            done.set(inner, inner.childElementCount + ":" + (inner.textContent || "").length + ":" + inner.offsetHeight + ":" + inner.clientWidth);
        });
    };
    const kick = function() {
        if (!queued) {
            queued = true;
            requestAnimationFrame(run);
        }
    };
    const start = function() {
        new MutationObserver(kick).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "aria-expanded"] });
        window.addEventListener("resize", kick);
        kick();
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
