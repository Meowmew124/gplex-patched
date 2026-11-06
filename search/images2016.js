// ---- Google Images' preview panel as it was from 2014 to 2016 (gplex-patched) ----------------
// Measured on footage of the real thing, not remembered: a February 2016 screen recording at 1:1
// (window 1440 by 911), an October 2016 one (1600 by 770) and a December 2014 screenshot (924 wide).
//
// The panel runs the width of the page. Its height is 46.1% of that, less if the window can't show
// it (the window's height less 206): 657 in February, 564 in October, 432 in December 2014. The right
// column is a third of the width and 12 (487 in February, 539 in October), never under 462. A picture is shown at its own size (October: 845 by
// 450 shown 845 by 450) and only ever made smaller: 45 to the left of it, 20 before the divider
// (February: 1920 by 1080 shown 872 by 490). How much room Google left above and below a tall
// picture isn't in the footage, so the 20 used for that is an estimate.
//
// Opening, from the frames of both recordings: the panel is revealed from its top in about a quarter
// of a second while the rows under it are pushed down and the page scrolls so the panel's top lands
// 165 under the top of the window; the text is there from the start, the related pictures come last.
// The recordings never close the panel, step through pictures or move to another row, so closing
// here is the opening backwards, stepping swaps the picture in place and a new row does both.
var ugfPanel2016 = (function() {
    "use strict";
    const html = document.documentElement;
    const OPEN_MS = 250;
    const SCROLL_MS = 300;
    const THUMBS_MS = 350;
    const LAND = 165;
    const FEEDBACK = "https://www.google.com/tools/feedback/survey/html?productId=196";
    let anchor = null; // the picture in the results the panel hangs under
    let shown = null; // the picture in the panel (a related picture opens without moving the panel)
    let keep = false;
    let row = [];
    let rowM = 0;
    let fading = [];
    let frame = 0;
    let guard = 0;
    let running = false;
    let closing = false;
    let again = null;
    let resizeWired = false;

    const q = function(s) {
        return document.querySelector(s);
    };
    const ease = function(t) {
        return 1 - (1 - t) * (1 - t);
    };
    const size = function() {
        const w = html.clientWidth;
        return {
            w: w,
            right: Math.max(462, Math.round(w / 3 + 12)),
            h: Math.max(432, Math.min(Math.round(w * 0.461), window.innerHeight - 206))
        };
    };
    const setM = function(list, m) {
        list.forEach(function(e) {
            e.setAttribute("ugf-iv-row", "");
            e.style.setProperty("margin-bottom", m + "px", "important");
        });
    };
    const clearM = function(list) {
        list.forEach(function(e) {
            e.removeAttribute("ugf-iv-row");
            e.style.removeProperty("margin-bottom");
        });
    };
    const stop = function() {
        if (frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
        clearTimeout(guard);
        running = false;
        clearM(fading);
        fading = [];
    };
    // a movement in time, frame by frame (and it still ends if the browser has stopped drawing frames,
    // as it does for a hidden window)
    const animate = function(ms, step, done) {
        stop();
        const start = performance.now();
        const finish = function() {
            cancelAnimationFrame(frame);
            frame = 0;
            clearTimeout(guard);
            running = false;
            step(ms);
            done();
        };
        const tick = function() {
            const now = performance.now() - start;
            if (now >= ms) {
                finish();
                return;
            }
            step(now);
            frame = requestAnimationFrame(tick);
        };
        running = true;
        guard = setTimeout(finish, ms + 100);
        tick();
    };
    const rowOf = function(item) {
        const top = item.offsetTop;
        return [].filter.call(item.parentElement.querySelectorAll(".ugf-image-result"), function(e) {
            return Math.abs(e.offsetTop - top) < 6;
        });
    };

    const CSS = [
        "html[ugf-p16] #ugf-image-viewer { right: auto; }",
        "html[ugf-p16] #ugf-image-viewer-inner { background: #222; }",
        // the two sides, and the divider: two lines, 21 short of the top and bottom
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-left { flex: 0 0 auto; width: calc(100% - var(--ugf-p16-right)); padding: 0 20px 0 45px; border: 0; box-shadow: none; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-image img { box-shadow: 0 2px 12px rgba(0,0,0,.5); }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-right { flex: 0 0 var(--ugf-p16-right); padding: 0 35px 0 20px; }",
        'html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-right::before { content: ""; position: absolute; left: -1px; top: 21px; bottom: 21px; width: 2px; background: linear-gradient(to right, #111 50%, #2a2a2a 50%); }',
        // the words
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-title { font-size: 22px; line-height: 26px; color: #e8e8e8; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-meta { font-size: 13px; line-height: 16px; margin: 1px 0 0; color: #999; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-domain { color: #999; margin-right: 1px; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-size { color: #999; margin: 0 1px; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-sbi { color: #999; margin-left: 1px; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-domain:hover, html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-sbi:hover { color: #ccc; }",
        // the buttons
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-buttons { display: flex; margin-top: 17px; }",
        "html[ugf-p16] #ugf-image-viewer-inner .ugf-image-viewer-btn { height: 31px; padding: 0 8px; margin-right: 10px; background: linear-gradient(to bottom, #3e3e3e, #343434); border: 1px solid #151515; border-radius: 2px; box-shadow: inset 0 1px 0 #454545, 0 1px 0 #343434; color: #bbb; font: bold 11px/29px arial, sans-serif; }",
        "html[ugf-p16] #ugf-image-viewer-inner .ugf-image-viewer-btn:hover { background: linear-gradient(to bottom, #484848, #3c3c3c); border-color: #111; color: #eee; }",
        // the rule, from the divider to 35 short of the edge, and the pictures under it: 80 by 80, 91 apart
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-related { display: block; margin: 20px 0 0 -20px; padding: 19px 0 5px 20px; border-top: 1px solid #141414; box-shadow: inset 0 1px 0 #292929; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-related-title { font-size: 13px; line-height: 16px; color: #bbb; margin: 0 0 8px; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-related-grid { grid-template-columns: repeat(4, 80px); grid-auto-rows: 80px; gap: 11px; margin-left: 3px; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-related-grid a { position: relative; border: 0; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-related-grid a:hover, html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-related-grid a.ugf-p16-sel { outline: 2px solid #bebebe; outline-offset: 1px; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-related-grid a.ugf-p16-sel { background: #c1c1c1; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-related-grid a.ugf-p16-sel img { opacity: .72; }",
        "html[ugf-p16] .ugf-p16-more { position: absolute; left: 0; top: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; text-align: center; background: rgba(0,0,0,.5); color: #fff; font-size: 16px; line-height: 18px; white-space: pre-line; }",
        // the copyright line
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-copy { left: 20px; bottom: 19px; font-size: 11px; line-height: 13px; color: #777; white-space: nowrap; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-copy a { color: #999; text-decoration: none; margin-left: 2px; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-copy a:hover { text-decoration: underline; }",
        // the tabs at the sides: 32 by 80 with a dark edge, the thin arrow in them
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-prev, html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-next { width: 32px; height: 80px; margin-top: -38px; background: linear-gradient(to bottom, #3e3e3e, #323232); box-sizing: content-box; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-prev { border-right: 1px solid #151517; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-next { border-left: 1px solid #151517; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-prev:hover, html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-next:hover { background: linear-gradient(to bottom, #4a4a4a, #3c3c3c); }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-prev::before, html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-next::before { top: 30px; width: 16px; height: 16px; box-sizing: border-box; border: solid #a8a8a8; transform: rotate(45deg); }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-prev::before { left: 13px; border-width: 0 0 2px 2px; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-next::before { left: 3px; border-width: 2px 2px 0 0; }",
        // the close cross: thin, 19 by 19
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-close { right: 23px; top: 22px; width: 19px; height: 19px; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-close::before, html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-close::after { left: -4px; top: 9px; width: 27px; height: 1px; background: #6e6e6e; }",
        "html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-close:hover::before, html[ugf-p16] #ugf-image-viewer-inner #ugf-image-viewer-close:hover::after { background: #ccc; }"
    ].join("\n");

    // the measured panel is for the 2014-2016 layouts on a window wide enough to hold it
    // (the narrowest it was seen on is 924); anything else stays Gplex's own
    const on = function() {
        const yes = /^(2014|2015|2016|2016C)$/.test(html.getAttribute("layout") || "") && !html.hasAttribute("ugf-mobile") && html.clientWidth >= 800;
        if (yes) {
            if (!document.getElementById("ugf-p16-styles")) {
                const st = document.createElement("style");
                st.id = "ugf-p16-styles";
                st.textContent = CSS;
                (document.head || html).appendChild(st);
            }
            html.setAttribute("ugf-p16", "");
        } else if (html.hasAttribute("ugf-p16")) {
            html.removeAttribute("ugf-p16");
            stop();
            row = [];
            anchor = null;
            shown = null;
            const box = q("#ugf-image-viewer");
            if (box) {
                box.style.removeProperty("left");
                box.style.removeProperty("width");
            }
            const inner = q("#ugf-image-viewer-inner");
            if (inner) {
                inner.style.removeProperty("clip-path");
            }
        }
        return yes;
    };

    const place = function(item, fit, me) {
        again = me;
        stop();
        closing = false;
        const box = q("#ugf-image-viewer");
        const host = q("#ugf-image-results");
        const inner = q("#ugf-image-viewer-inner");
        if (!item || !box || !host || !inner || !item.isConnected) {
            clearM(row);
            row = [];
            anchor = null;
            shown = null;
            keep = false;
            return;
        }
        const target = (keep || item === shown) && anchor && anchor.isConnected ? anchor : item;
        keep = false;
        shown = item;
        const s = size();
        inner.style.height = s.h + "px";
        inner.style.setProperty("--ugf-p16-right", s.right + "px");
        inner.style.removeProperty("clip-path");
        const img = inner.querySelector("#ugf-image-viewer-image img");
        if (img) {
            img.style.maxHeight = "none";
            fit(img, s.h);
        }
        const oldRow = row;
        const oldM = rowM;
        const y0 = window.scrollY;
        const stay = oldRow.indexOf(target) > -1;
        const natural = stay ? 0 : parseFloat(getComputedStyle(target).marginBottom) || 0;
        const oldAbove = !stay && oldRow.length > 0 && oldRow[0].offsetTop < target.offsetTop;
        const newRow = rowOf(target);
        const M = s.h + 30;
        clearM(oldRow.filter(function(e) {
            return newRow.indexOf(e) < 0;
        }));
        setM(newRow, M);
        anchor = target;
        row = newRow;
        rowM = M;
        // where everything ends up
        const hr = host.getBoundingClientRect();
        let bottom = 0;
        newRow.forEach(function(e) {
            bottom = Math.max(bottom, e.getBoundingClientRect().bottom);
        });
        const top = Math.round(bottom - hr.top + 18);
        box.style.left = -hr.left + "px";
        box.style.width = s.w + "px";
        box.style.top = top + "px";
        const r = target.getBoundingClientRect();
        const notch = inner.querySelector("#ugf-image-viewer-notch");
        if (notch) {
            notch.style.left = Math.round(r.left + r.width / 2) + "px";
        }
        if (!resizeWired) {
            resizeWired = true;
            const follow = function() {
                if (shown && again && !running && !closing) {
                    again(shown);
                }
            };
            window.addEventListener("resize", follow);
            // (and when the rows wrap differently, once their pictures have come)
            const grid = q("#ugf-image-results-container");
            if (grid && window.ResizeObserver) {
                new ResizeObserver(follow).observe(grid);
            }
        }
        if (stay) {
            // (Gplex's step scrolls the picture into view after this; the page stays where it is)
            Promise.resolve().then(function() {
                window.scrollTo(0, y0);
            });
            return;
        }
        const y1 = Math.max(0, Math.round(hr.top + top + y0 - LAND));
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            window.scrollTo(0, y1);
            return;
        }
        // from the start of the movement: the old row closing, this one opening
        const leaving = oldRow.filter(function(e) {
            return newRow.indexOf(e) < 0;
        });
        animate(SCROLL_MS, function(ms) {
            const a = ease(Math.min(1, ms / OPEN_MS));
            setM(newRow, natural + (M - natural) * a);
            if (leaving.length) {
                setM(leaving, oldM + (natural - oldM) * a);
            }
            box.style.top = (oldAbove ? top + (oldM - natural) * (1 - a) : top) + "px";
            if (a < 1) {
                inner.style.setProperty("clip-path", "inset(-10px 0 " + ((1 - a) * s.h) + "px 0)");
            } else {
                inner.style.removeProperty("clip-path");
            }
            window.scrollTo(0, y0 + (y1 - y0) * ease(Math.min(1, ms / SCROLL_MS)));
        }, function() {
            clearM(leaving);
        });
        fading = leaving;
    };

    // what's in the panel but not in Gplex's: the picture itself first among the related ones, "View
    // more" on the last, and "Send feedback" (the row of three more buttons, Save, View saved and
    // Share, came later in 2016, and Save has nothing to save to now)
    const dress = function(item) {
        const inner = q("#ugf-image-viewer-inner");
        if (!inner) {
            return;
        }
        const copy = inner.querySelector("#ugf-image-viewer-copy");
        if (copy) {
            copy.textContent = "Images may be subject to copyright. - ";
            const a = document.createElement("a");
            a.href = FEEDBACK;
            a.target = "_blank";
            a.textContent = "Send feedback";
            copy.appendChild(a);
        }
        const grid = inner.querySelector("#ugf-image-viewer-related-grid");
        if (!grid) {
            return;
        }
        const tiles = [].slice.call(grid.children);
        const src = item.getAttribute("img-src") || (item.querySelector("img") ? item.querySelector("img").getAttribute("src") : "");
        if (src) {
            const sel = document.createElement("a");
            sel.href = "#";
            sel.className = "ugf-p16-sel";
            const im = document.createElement("img");
            im.src = src;
            im.referrerPolicy = "no-referrer";
            sel.appendChild(im);
            sel.addEventListener("click", function(ev) {
                ev.preventDefault();
            });
            grid.insertBefore(sel, grid.firstChild);
        }
        tiles.slice(7).forEach(function(t) {
            t.remove();
        });
        const sbi = inner.querySelector("#ugf-image-viewer-sbi");
        if (tiles[6] && sbi && /^https?:/.test(sbi.getAttribute("href") || "")) {
            const more = tiles[6].cloneNode(true);
            more.href = sbi.href;
            more.target = "_blank";
            const label = document.createElement("span");
            label.className = "ugf-p16-more";
            label.textContent = "View\nmore";
            more.appendChild(label);
            tiles[6].replaceWith(more);
        }
        // a related picture opens where the panel is
        grid.addEventListener("click", function() {
            keep = true;
        }, true);
        if (running) {
            grid.style.visibility = "hidden";
            setTimeout(function() {
                grid.style.removeProperty("visibility");
            }, THUMBS_MS);
        }
    };

    const close = function(done) {
        const inner = q("#ugf-image-viewer-inner");
        if (!inner || !row.length || closing) {
            return false;
        }
        stop();
        const list = row;
        const M = rowM;
        const natural = (function() {
            const e = list[0];
            const was = e.style.getPropertyValue("margin-bottom");
            e.style.removeProperty("margin-bottom");
            const n = parseFloat(getComputedStyle(e).marginBottom) || 0;
            e.style.setProperty("margin-bottom", was, "important");
            return n;
        })();
        const h = parseInt(inner.style.height, 10) || 0;
        animate(OPEN_MS, function(ms) {
            const a = ease(ms / OPEN_MS);
            setM(list, M + (natural - M) * a);
            inner.style.setProperty("clip-path", "inset(-10px 0 " + (a * h) + "px 0)");
        }, function() {
            closing = false;
            done();
        });
        closing = true;
        return true;
    };

    return {
        on: on,
        place: place,
        dress: dress,
        close: close,
        isClosing: function() {
            return closing;
        }
    };
})();
