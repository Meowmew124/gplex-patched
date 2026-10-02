// ---- Gplex+ settings, and the buttons following them at once (gplex-patched) -------------
// Gplex's own Gplex+ helpers (ugfPlusLink and the rest) are private to its code, so the same
// rules are kept here for the blocks after it (the notifications bell reads them too): the
// "Gplex+ link" setting (empty or Google's old address = Gplex+ itself), the "Gplex+ name",
// and who you are on Gplex+ (counted only while the link leads to Gplex+).
var ugfPatchedPlus = (function() {
    "use strict";
    const HOME = "https://plus.gplexextended.com/";
    const get = function(k) {
        let v = null;
        try {
            v = typeof GM_getValue === "function" ? GM_getValue(k, null) : null;
        } catch (e) {}
        if (v === null || v === undefined) {
            try {
                v = window.localStorage.getItem(k);
            } catch (e) {}
        }
        return v === null || v === undefined ? "" : String(v);
    };
    const link = function() {
        const v = get("UGF_PLUS_LINK").trim();
        return !v || /^https?:\/\/plus\.google\.com\/?$/i.test(v) ? HOME : v;
    };
    const name = function() {
        return get("UGF_PLUS_NAME").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 30) || "Gplex+";
    };
    const isGplex = function(l) {
        return /^https?:\/\/plus\.gplexextended\.com(\/|$)/i.test(l === undefined ? link() : l);
    };
    const me = function() {
        if (!isGplex()) {
            return null;
        }
        try {
            const v = typeof GM_getValue === "function" ? GM_getValue("UGF_PLUS_ME", "") : "";
            const m = v ? JSON.parse(String(v)) : null;
            if (m && typeof m.name === "string" && m.name && /^[a-z0-9_]{3,20}$/.test(String(m.user || ""))) {
                return m;
            }
        } catch (e) {}
        return null;
    };
    const first = function() {
        const m = me();
        return m ? (m.name.split(" ")[0] || m.name) : "You";
    };
    const profile = function() {
        const m = me();
        return m ? "https://plus.gplexextended.com/u/" + m.user : link();
    };
    // where its notifications come from: Gplex+, Loogle+ (a link to a loogle host), or nowhere
    const kind = function() {
        const l = link();
        return isGplex(l) ? "gplex" : /^https?:\/\/[^\/]*loogle[^\/]*/i.test(l) ? "loogle" : "";
    };
    // Gplex+'s Notifications page, one .person each (the ones new since it was last opened
    // tinted): the photo, or the coloured letter of a member without one; who; what (a link to
    // the post); when. Read by the bell, and by Gplex+'s own page when you open it there.
    const GPX = "https://plus.gplexextended.com/";
    const abs = function(u) {
        try {
            return new URL(u, GPX).href;
        } catch (e) {
            return GPX;
        }
    };
    const items = function(doc) {
        return [].map.call(doc.querySelectorAll("#main .person"), function(p) {
            const who = p.querySelector("a.who");
            const pt = p.querySelector(".pt") || p;
            let msg = "";
            let url = "";
            for (let c = pt.firstChild; c && c.nodeName !== "BR"; c = c.nextSibling) {
                if (c === who) {
                    continue;
                }
                msg += c.textContent;
                if (!url && c.nodeName === "A" && c.getAttribute("href")) {
                    url = c.getAttribute("href");
                }
            }
            const img = p.querySelector(".av img");
            const letter = p.querySelector(".av span");
            const n = {
                who: who ? who.textContent.trim() : "",
                msg: msg.replace(/\s+/g, " ").trim(),
                url: abs(url || (who && who.getAttribute("href")) || "/notifications"),
                tm: ((p.querySelector(".muted") || {}).textContent || "").trim(),
                fresh: /background/i.test(p.getAttribute("style") || ""),
                img: img && img.getAttribute("src") ? abs(img.getAttribute("src")) : "",
                letter: letter ? letter.textContent.trim().slice(0, 1) : "",
                color: letter ? letter.style.backgroundColor : ""
            };
            // (Gplex+ gives them no id: who, what and where; the time reads differently by tomorrow)
            n.key = [n.url, n.who, n.msg].join("|");
            return n;
        });
    };
    // which ones you have read: clicked, dismissed or marked read in the bell's box, or seen on
    // Gplex+'s own Notifications page. (Gplex+ itself counts every one as read once its page has
    // been asked for, which the bell has to do to show them at all.)
    const READ = "UGF_NB_GPX_READ";
    const readKeys = function() {
        try {
            return JSON.parse(get(READ) || "[]") || [];
        } catch (e) {
            return [];
        }
    };
    const markRead = function(keys) {
        const r = readKeys();
        keys.forEach(function(k) {
            if (r.indexOf(k) < 0) {
                r.push(k);
            }
        });
        try {
            if (typeof GM_setValue === "function") {
                GM_setValue(READ, JSON.stringify(r.slice(-500)));
            }
        } catch (e) {}
    };
    return { HOME: HOME, link: link, name: name, me: me, first: first, profile: profile, kind: kind, isGplex: isGplex,
        items: items, readKeys: readKeys, markRead: markRead };
})();

// on Gplex+'s own Notifications page: what is on it has been read
(function ugfPlusSeen() {
    "use strict";
    if (window.top !== window.self || !/^plus\.gplexextended\.com$/i.test(window.location.hostname) || window.location.pathname !== "/notifications") {
        return;
    }
    const run = function() {
        ugfPatchedPlus.markRead(ugfPatchedPlus.items(document).map(function(n) {
            return n.key;
        }));
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", run);
    } else {
        run();
    }
})();

// Gplex reads the settings when it draws a page, so the buttons already drawn (in this tab and
// in every other one) kept the old ones until a reload. When either setting changes, or who you
// are on Gplex+, the buttons on the page are pointed at the new link and given the new name:
// the +You / +Name buttons and "Your profile" lead to your profile (on Gplex+) or the link;
// everything else (the apps menus' tile, the products page, the notifications box...) to the link.
(function ugfPlusLive() {
    "use strict";
    if (window.top !== window.self || /^plus\.gplexextended\.com$/i.test(window.location.hostname)) {
        return;
    }
    const P = ugfPatchedPlus;
    const PROFILE = "a.plus, a.plusname, #gp-gbar-plusyou, #ugf-email-button, #ugf-username-button, #ugf-account-profile";
    const now = function() {
        return { link: P.link(), profile: P.profile(), name: P.name(), first: P.first() };
    };
    let was = now();
    const words = function(a, from, to) {
        if (from === to) {
            return;
        }
        const w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
        let t;
        while ((t = w.nextNode())) {
            const core = t.nodeValue.trim();
            if (core === from) {
                t.nodeValue = t.nodeValue.replace(from, to);
            } else if (core === from + " notifications") {
                t.nodeValue = t.nodeValue.replace(from + " notifications", to + " notifications");
            }
        }
    };
    const swap = function() {
        const is = now();
        if (is.link === was.link && is.profile === was.profile && is.name === was.name && is.first === was.first) {
            return;
        }
        document.querySelectorAll("a[href]").forEach(function(a) {
            const h = a.getAttribute("href");
            if (h !== was.link && h !== was.profile) {
                return;
            }
            if (a.matches(PROFILE)) {
                a.setAttribute("href", is.profile);
                words(a, "+" + was.first, "+" + is.first);
            } else {
                a.setAttribute("href", is.link);
                words(a, was.name, is.name);
            }
        });
        was = is;
    };
    // a change saved here or in another tab (any Google site, YouTube or the settings page)
    let listening = false;
    try {
        if (typeof GM_addValueChangeListener === "function") {
            ["UGF_PLUS_LINK", "UGF_PLUS_NAME", "UGF_PLUS_ME"].forEach(function(k) {
                GM_addValueChangeListener(k, function() {
                    setTimeout(swap, 0);
                });
            });
            listening = true;
        }
    } catch (e) {}
    document.addEventListener("visibilitychange", swap);
    window.addEventListener("focus", swap);
    if (!listening) {
        setInterval(function() {
            if (document.visibilityState === "visible") {
                swap();
            }
        }, 3000);
    }
})();
