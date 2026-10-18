// ---- The search tabs as Google had them from 2014 to 2016 (gplex-patched) ----------
// From 22 January 2014 Google chose the tabs after "All" for each search, the most relevant first:
// four of them in the row, the rest (and Flights and Apps) under "More", with "Search tools"
// spaced like a tab right after it. Captures of the time (archive.today, June 2016): "donald trump"
// and "hillary clinton" both read All, News, Images, Videos, Books, More (Maps, Shopping, Flights,
// Apps), Search tools. Gplex drew the same six for every search. Here the row follows the order
// today's Google gives its own tabs for the search (still in its page under Gplex's), kept for the
// search so the other tabs' pages show the same row; the tab you are on always stays in it.
(function ugfTabs2016() {
    "use strict";
    if (window.top !== window.self || !/(^|\.)google\.[a-z.]+$/.test(window.location.hostname)) {
        return;
    }
    const VERT = ["images", "videos", "news", "maps", "shopping", "books"];
    const NAME = { images: "Images", videos: "Videos", news: "News", maps: "Maps", shopping: "Shopping", books: "Books" };
    const wanted = function() {
        const h = document.documentElement;
        return /^(2014|2015|2016)$/.test(h.getAttribute("layout") || "") && !h.hasAttribute("gplex2013n");
    };
    // which of the 2016 tabs one of today's Google tab links is
    const kind = function(a) {
        let u;
        try {
            u = new URL(a.getAttribute("href"), window.location.href);
        } catch (e) {
            return "";
        }
        const udm = u.searchParams.get("udm") || "";
        const tbm = u.searchParams.get("tbm") || "";
        if (/(^|\.)maps\.google\./.test(u.hostname) || /^\/maps/.test(u.pathname)) {
            return "maps";
        }
        if (udm === "2" || tbm === "isch") {
            return "images";
        }
        if (udm === "7" || udm === "vids" || tbm === "vid") {
            return "videos";
        }
        if (tbm === "nws" || udm === "12") {
            return "news";
        }
        if (udm === "28" || tbm === "shop") {
            return "shopping";
        }
        if (udm === "36" || tbm === "bks") {
            return "books";
        }
        return "";
    };
    const query = function() {
        return new URLSearchParams(window.location.search).get("q") || "";
    };
    const order = function() {
        const seen = [];
        document.querySelectorAll('[role="navigation"] a[href], [role="list"] a[href]').forEach(function(a) {
            if (!a.closest("#ugf")) {
                const k = kind(a);
                if (k && seen.indexOf(k) < 0) {
                    seen.push(k);
                }
            }
        });
        // (Shopping is on nearly every search now; in 2016 it took a place in the row only for
        // shopping searches. Unless Google puts it in its first two, it goes to the back, as in
        // the captures: "donald trump" had Books in the row and Maps, Shopping under More.)
        const shop = seen.indexOf("shopping");
        if (shop > 1) {
            seen.splice(shop, 1);
            seen.push("shopping");
        }
        const key = "ugf-tabs2016:" + query();
        let o = seen;
        try {
            if (seen.length >= 3) {
                sessionStorage.setItem(key, seen.join(","));
            } else {
                o = String(sessionStorage.getItem(key) || "").split(",").filter(function(v) {
                    return VERT.indexOf(v) > -1;
                });
            }
        } catch (e) {}
        // (any Google didn't show, in Gplex's own order)
        VERT.forEach(function(v) {
            if (o.indexOf(v) < 0) {
                o.push(v);
            }
        });
        return o;
    };
    const tab = function(v) {
        return document.getElementById("ugf-" + v + "-tab");
    };
    const hrefOf = function(v) {
        const t = tab(v);
        const m = document.getElementById("ugf-" + v + "-more");
        return (t && t.getAttribute("href")) || (m && m.getAttribute("href")) || "";
    };
    let last = "";
    const arrange = function() {
        if (!wanted()) {
            return;
        }
        const mid = document.getElementById("ugf-navbar-middle");
        const all = document.getElementById("ugf-all-tab");
        const more = document.getElementById("ugf-more-tab");
        const dd = document.getElementById("ugf-more-dd");
        const img = tab("images");
        if (!mid || !all || !more || !dd || !img || all.parentNode !== mid) {
            return;
        }
        // Books as a tab of the row (Gplex has it under More only)
        let books = tab("books");
        if (!books) {
            books = img.cloneNode(true);
            books.id = "ugf-books-tab";
            books.classList.remove("active");
            books.removeAttribute("ugf-wired");
            const s = books.querySelector("span");
            if (s) {
                s.textContent = "Books";
            }
            mid.insertBefore(books, more);
        }
        const bm = document.getElementById("ugf-books-more");
        if (bm && bm.getAttribute("href") && books.getAttribute("href") !== bm.getAttribute("href")) {
            books.setAttribute("href", bm.getAttribute("href"));
        }
        const o = order();
        const active = VERT.filter(function(v) {
            return tab(v) && tab(v).classList.contains("active");
        })[0];
        const row = o.slice(0, 4);
        if (active && row.indexOf(active) < 0) {
            row[3] = active;
        }
        const rest = o.filter(function(v) {
            return row.indexOf(v) < 0;
        });
        const sig = row.join() + "|" + rest.map(hrefOf).join() + "|" + rest.join();
        if (sig === last && mid.contains(tab(row[0])) && (all.nextElementSibling === tab(row[0]))) {
            return;
        }
        last = sig;
        // the row: All, the four, then More and Search tools as they were
        let after = all;
        row.forEach(function(v) {
            const t = tab(v);
            if (t) {
                t.style.removeProperty("display");
                if (after.nextElementSibling !== t) {
                    mid.insertBefore(t, after.nextElementSibling);
                }
                after = t;
            }
        });
        rest.forEach(function(v) {
            const t = tab(v);
            if (t) {
                t.style.setProperty("display", "none", "important");
            }
        });
        // More: the rest in the same order, then Flights and Apps (Gplex's own Books entry steps aside)
        if (bm) {
            bm.style.setProperty("display", "none", "important");
        }
        dd.querySelectorAll(".ugf-tabs2016-more").forEach(function(a) {
            a.remove();
        });
        const anchor = dd.firstChild;
        rest.forEach(function(v) {
            const a = document.createElement("a");
            a.className = "ugf-tabs2016-more";
            a.textContent = NAME[v];
            const href = hrefOf(v);
            if (href) {
                a.setAttribute("href", href);
            }
            dd.insertBefore(a, anchor);
        });
    };
    const CSS = [
        // "Search tools" right after More, and More's arrow, measured on the June 2016 captures:
        // the arrow 4px after the word, 8 by 5px; "Search tools" 70px from the start of "More"
        'html[layout="2014"]:not([gplex2013n]) #ugf-tools-tab, html[layout="2015"] #ugf-tools-tab, html[layout="2016"] #ugf-tools-tab { margin-left: 4px !important; }',
        'html[layout="2014"]:not([gplex2013n]) .ugf-k-caret, html[layout="2015"] .ugf-k-caret, html[layout="2016"] .ugf-k-caret { margin-left: 4px !important; border-top-width: 5px !important; }'
    ].join("\n");
    let queued = false;
    const kick = function() {
        if (!queued) {
            queued = true;
            requestAnimationFrame(function() {
                queued = false;
                try {
                    arrange();
                } catch (e) {}
            });
        }
    };
    const start = function() {
        const st = document.createElement("style");
        st.id = "ugf-tabs2016-styles";
        st.textContent = CSS;
        (document.head || document.documentElement).appendChild(st);
        new MutationObserver(kick).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "href", "layout"] });
        kick();
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
