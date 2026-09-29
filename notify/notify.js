// ---- Gplex notifications (gplex-patched) ------------------------------------------
// The bell of the 2015-2017 Google bar, with a box of two parts: YouTube (the videos of
// the channels you subscribe to, from YouTube's own notification menu) and Google+ (from
// Loogle+, the Google+ revival that Gplex's "Custom link for Google+ buttons" points at).
(function ugfNotify() {
    "use strict";
    if (window.top !== window.self) {
        return;
    }
    const gv = function(k, d) {
        let v = null;
        try {
            v = typeof GM_getValue === "function" ? GM_getValue(k, null) : null;
        } catch (e) {}
        if (v === null || v === undefined) {
            try {
                v = window.localStorage.getItem(k);
            } catch (e) {}
        }
        return v === null || v === undefined ? d : v;
    };
    const sv = function(k, v) {
        try {
            if (typeof GM_setValue === "function") {
                GM_setValue(k, v);
            }
        } catch (e) {}
    };
    const LOOGLE_DEFAULT = "http://plus.loogle.mooo.com";

    // ---- on Loogle+ itself: remember who is signed in (the username only), for the box
    if (/(^|\.)loogle\.mooo\.com$/.test(window.location.hostname)) {
        const remember = function() {
            const m = document.cookie.split(";").map(function(c) {
                return c.trim();
            }).filter(function(c) {
                return c.indexOf("username=") === 0;
            })[0];
            const u = m ? decodeURIComponent(m.slice(9)) : "";
            if (u && u !== "Guest") {
                sv("UGF_LOOGLE_USER", u);
                sv("UGF_LOOGLE_BASE", window.location.protocol + "//" + window.location.host);
            } else if (/\/account\/login/.test(window.location.pathname)) {
                sv("UGF_LOOGLE_USER", "");
            }
        };
        remember();
        setTimeout(remember, 3000);
        return;
    }
    if (!/\.google\.com$/.test(window.location.hostname)) {
        return;
    }
    // ---- your profile photo, sharp: Gplex (and Google's own bar) use the small copy Google
    // hands out (=s32-c, /s64-c/...) at every size, blurry when shown bigger or on a Retina
    // screen. Profile photos only (lh*.googleusercontent.com/a/, /a-/, /ogw/...), never
    // thumbnails or logos; asked for at 256px.
    const PHOTO = /^https:\/\/lh\d\.googleusercontent\.com\/(a\/|a-\/|ogw\/|-[\w-]+\/[\w-]+\/[\w-]+\/[\w-]+\/)/;
    const sharp = function(u) {
        if (!PHOTO.test(u)) {
            return u;
        }
        let v = u.replace(/=s\d+(-[\w-]*)?$/, "=s256-c").replace(/=w\d+-h\d+([-\w]*)$/, "=s256-c");
        v = v.replace(/\/s\d+(-c)?(\/[^\/]+)$/, "/s256-c$2");
        if (v === u && !/=s256/.test(u) && !/\/s256/.test(u) && u.indexOf("=") < 0 && /\/a-?\//.test(u)) {
            v = u + "=s256-c";
        }
        return v;
    };
    const sharpen = function(root) {
        (root.querySelectorAll ? root.querySelectorAll("img[src*='googleusercontent.com'], [style*='googleusercontent.com']") : []).forEach(function(n) {
            if (n.tagName === "IMG") {
                const v = sharp(n.getAttribute("src") || "");
                if (v === n.getAttribute("src")) {
                    return;
                }
                // kept at the size the small copy was drawn at: the size its own address asked for
                // (=s96, /s64-c/, =w48-h48), where nothing else sizes it; otherwise the photo would
                // grow to the sharp copy's 256px
                const old = n.getAttribute("src") || "";
                const m = old.match(/=s(\d+)/) || old.match(/\/s(\d+)(-c)?\/[^\/]+$/);
                const wh = old.match(/=w(\d+)-h(\d+)/);
                if (!n.hasAttribute("width")) {
                    if (wh) {
                        n.setAttribute("width", wh[1]);
                        n.setAttribute("height", wh[2]);
                    } else if (m) {
                        n.setAttribute("width", m[1]);
                        n.setAttribute("height", m[1]);
                    } else if (n.complete && n.naturalWidth) {
                        n.setAttribute("width", String(n.naturalWidth));
                        n.setAttribute("height", String(n.naturalHeight));
                    }
                }
                n.setAttribute("src", v);
                n.removeAttribute("srcset");
                return;
            }
            const bg = n.style.backgroundImage || "";
            const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
            if (m) {
                const v = sharp(m[1]);
                if (v !== m[1]) {
                    n.style.backgroundImage = "url(\"" + v + "\")";
                }
            }
        });
    };
    (function() {
        const st = document.createElement("style");
        st.id = "ugf-nb-photo-styles";
        st.textContent = "#ugf-account-pfp img, #ugf-account-normal-pfp img { width: 96px; height: 96px; }";
        (document.head || document.documentElement).appendChild(st);
        let queued = false;
        const run = function() {
            queued = false;
            sharpen(document);
        };
        const kick = function() {
            if (!queued) {
                queued = true;
                requestAnimationFrame(run);
            }
        };
        new MutationObserver(kick).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "style"] });
        kick();
    })();

    // the bell's years: the 2015-2017 bar (2013-2014 had the red count box instead)
    const layout = String(gv("UGF_LAYOUT", "2015"));
    if (["2015", "2015L", "2016", "2016C", "2016L", "2017"].indexOf(layout) < 0) {
        return;
    }
    const html = document.documentElement;

    const CSS = [
        // the 2016 bar's notifications button: a grey circle with the bell in white, drawn at 1x
        // and grey at 55% like the app grid beside it (so it is as soft as the grid)
        "#ugf-nb-bell { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; margin: 0 6px; cursor: pointer; flex: 0 0 auto; }",
        "#ugf-nb-bell .gi { display: block; width: 20px; height: 20px; background: var(--ugf-nb-circle) center / 20px 20px no-repeat; opacity: .55; }",
        "#ugf-nb-bell:hover .gi, #ugf-nb-bell.open .gi { opacity: .85; }",
        // in Gplex's bar, as the 2016 bar spaced them: 26px from the grid's dots, 18px to the photo
        "#ugf-top-right #ugf-nb-bell { margin: 0 18px 0 3px; }",
        // with notifications, as the 2016 bar did: the circle turns red and the number takes the
        // bell's place (white on #db4437, a pill for two digits and more)
        ".ugf-nb-count { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); min-width: 20px; height: 20px; padding: 0 5px; box-sizing: border-box; " +
            "border-radius: 10px; background: #db4437; color: #fff; font: bold 11px/20px Arial, sans-serif; text-align: center; display: none; pointer-events: none; }",
        ".ugf-nb-has .ugf-nb-count { display: block; }",
        "#ugf-nb-bell.ugf-nb-has .gi { visibility: hidden; }",
        "#ugf-nb-bell.ugf-nb-has:hover .ugf-nb-count, #ugf-nb-bell.ugf-nb-has.open .ugf-nb-count { background: #c23321; }",
        ".kic.bell[data-ugf-nb] { position: relative; cursor: pointer; }",
        // Gplex's own bells, as the 2016 circle too (their Material bell set aside)
        ".ugf-nb-g { display: inline-flex !important; align-items: center; justify-content: center; }",
        ".ugf-nb-g > :not(.gi):not(.ugf-nb-count) { display: none !important; }",
        ".ugf-nb-g .gi { display: block; width: 20px; height: 20px; background: var(--ugf-nb-circle) center / 20px 20px no-repeat; opacity: .55; }",
        ".ugf-nb-g:hover .gi, .ugf-nb-g.open .gi { opacity: .85; }",
        ".ugf-nb-g.ugf-nb-has .gi { visibility: hidden; }",
        "#ugf-docs-home .gtop .corner .ugf-nb-g { width: 40px; height: 40px; margin: 0 6px 0 2px; cursor: pointer; }",
        // the box: Google's notifications panel of 2015-2016, from the screenshots of the time
        // (google.com, June 2015; the panel as it stood before the redesign of February 2017):
        // flat #e5e5e5, "Google notifications" over a gear, Mr. Jingles when all caught up,
        // "Previously read (Google+)" along the foot; the notifications as white cards
        "#ugf-nb-box { position: fixed; z-index: 2147483600; width: 400px; max-height: calc(100vh - 80px); display: flex; flex-direction: column; background: #e5e5e5; color: #333; " +
            "border: 1px solid #ccc; border-color: rgba(0,0,0,.2); box-shadow: 0 2px 10px rgba(0,0,0,.2); font: 13px Roboto, Arial, sans-serif; text-align: left; }",
        "#ugf-nb-box::before, #ugf-nb-box::after { content: ''; position: absolute; top: -9px; right: var(--arrow, 22px); border: 8px solid transparent; border-top: 0; border-bottom: 9px solid rgba(0,0,0,.2); }",
        "#ugf-nb-box::after { top: -8px; border-bottom-color: #e5e5e5; }",
        "#ugf-nb-box .view { display: flex; flex-direction: column; min-height: 0; flex: 1 1 auto; }",
        "#ugf-nb-box .view[hidden] { display: none; }",
        "#ugf-nb-box .hd { position: relative; display: flex; align-items: center; justify-content: center; height: 50px; flex: 0 0 auto; font-size: 16px; color: #666; }",
        "#ugf-nb-box .hd .ic { position: absolute; left: 14px; top: 13px; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }",
        "#ugf-nb-box .hd .ic svg { width: 20px; height: 20px; fill: #777; display: block; }",
        "#ugf-nb-box .hd .ic:hover svg { fill: #444; }",
        "#ugf-nb-box .scroll { overflow: auto; flex: 1 1 auto; min-height: 0; padding: 0 0 4px; }",
        "#ugf-nb-box .sec[hidden], #ugf-nb-box .jingles[hidden], #ugf-nb-box .loading[hidden] { display: none; }",
        "#ugf-nb-box .loading { padding: 40px 0; text-align: center; color: #999; }",
        "#ugf-nb-box .sh { display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 16px; font-size: 12px; color: #737373; }",
        "#ugf-nb-box .sh .lg { width: 16px; height: 16px; flex: 0 0 16px; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: #fff; font: bold 8px Arial, sans-serif; }",
        "#ugf-nb-box .lg.yt { background: #e62117; }",
        "#ugf-nb-box .lg.gp { border-radius: 50%; background: url(data:image/png;base64,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) center / 100% 100% no-repeat; font-size: 0; }",
        "#ugf-nb-box .sh .sp { flex: 1 1 auto; }",
        "#ugf-nb-box .sh a { color: #427fed; text-decoration: none; cursor: pointer; }",
        "#ugf-nb-box .sh a:hover { text-decoration: underline; }",
        "#ugf-nb-box .it { display: flex; align-items: flex-start; gap: 12px; margin: 0 12px 6px; padding: 12px; background: #fff; box-shadow: 0 1px 1px rgba(0,0,0,.12); cursor: pointer; text-decoration: none; color: inherit; position: relative; }",
        "#ugf-nb-box .it.read { background: #f4f6f9; box-shadow: none; }",
        "#ugf-nb-box .it:hover { box-shadow: 0 1px 4px rgba(0,0,0,.2); }",
        "#ugf-nb-box .it .av { width: 40px; height: 40px; flex: 0 0 40px; border-radius: 50%; background: #ddd center / cover no-repeat; }",
        "#ugf-nb-box .it .tx { flex: 1 1 auto; min-width: 0; }",
        "#ugf-nb-box .it .who { font-weight: bold; color: #262626; }",
        "#ugf-nb-box .it .msg { color: #404040; line-height: 18px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }",
        "#ugf-nb-box .it .tm { margin-top: 3px; font-size: 12px; color: #999; }",
        "#ugf-nb-box .it .th { width: 86px; height: 48px; flex: 0 0 86px; background: #000 center / cover no-repeat; }",
        "#ugf-nb-box .it .x { position: absolute; right: 6px; top: 6px; width: 20px; height: 20px; opacity: 0; display: flex; align-items: center; justify-content: center; color: #999; font-size: 16px; line-height: 1; }",
        "#ugf-nb-box .it:hover .x { opacity: 1; } #ugf-nb-box .it .x:hover { color: #333; }",
        "#ugf-nb-box .note { margin: 0 12px 6px; padding: 12px; background: #fff; box-shadow: 0 1px 1px rgba(0,0,0,.12); color: #666; line-height: 18px; }",
        "#ugf-nb-box .note a { color: #427fed; text-decoration: none; cursor: pointer; }",
        "#ugf-nb-box .list.collapsed .it.more { display: none; }",
        "#ugf-nb-box .tog { display: block; margin: 0 12px 8px; padding: 8px; text-align: center; color: #737373; cursor: pointer; }",
        "#ugf-nb-box .tog:hover { color: #333; }",
        // Mr. Jingles
        "#ugf-nb-box .jingles { display: flex; flex-direction: column; align-items: center; padding: 58px 0 60px; }",
        "#ugf-nb-box .jingles .bub { position: relative; white-space: nowrap; padding: 11px 18px; background: #fff; color: #aaa; font-size: 13px; box-shadow: 0 1px 2px rgba(0,0,0,.15); margin-bottom: 12px; }",
        "#ugf-nb-box .jingles .bub::after { content: ''; position: absolute; left: 50%; bottom: -6px; margin-left: -6px; border: 6px solid transparent; border-bottom: 0; border-top-color: #fff; }",
        "#ugf-nb-box .jingles .bell { width: 64px; height: 82px; background: var(--ugf-nb-jingles) center / 64px 82px no-repeat; }",
        // the foot
        "#ugf-nb-box .ft2 { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; height: 48px; margin: 8px 20px 0; background: #ebebeb; color: #737373; cursor: pointer; text-decoration: none; }",
        "#ugf-nb-box .ft2:hover { background: #f2f2f2; color: #555; }",
        // the settings page behind the gear
        "#ugf-nb-box .sbody { padding: 6px 20px 20px; }",
        "#ugf-nb-box .sbody .lead { font-size: 15px; color: #555; margin: 4px 0 18px; }",
        "#ugf-nb-box .srow { display: flex; align-items: center; gap: 14px; height: 44px; }",
        "#ugf-nb-box .srow .lg { width: 18px; height: 18px; flex: 0 0 18px; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: #fff; font: bold 9px Arial, sans-serif; }",
        "#ugf-nb-box .srow .nm { color: #222; font-size: 14px; }",
        "#ugf-nb-box .srow a { color: #427fed; text-decoration: none; font-size: 14px; }",
        "#ugf-nb-box .srow .sp { flex: 1 1 auto; }",
        "#ugf-nb-box .chk { width: 18px; height: 18px; border-radius: 2px; background: #fff; border: 1px solid #bbb; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; justify-content: center; }",
        "#ugf-nb-box .chk.on { background: #666; border-color: #666; }",
        "#ugf-nb-box .chk.on::after { content: ''; width: 5px; height: 10px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg) translate(-1px, -1px); }",
        "#ugf-nb-box .ask { display: flex; gap: 8px; margin: 14px 0 0; }",
        "#ugf-nb-box .ask input { flex: 1 1 auto; height: 28px; padding: 0 8px; border: 1px solid #d9d9d9; border-top-color: #c0c0c0; border-radius: 0; font: 13px Arial, sans-serif; outline: none; background: #fff; }",
        "#ugf-nb-box .ask input:focus { border-color: #4d90fe; }",
        "#ugf-nb-box .ask button { height: 30px; padding: 0 12px; border: 1px solid #3079ed; border-radius: 2px; background: linear-gradient(#4d90fe, #4787ed); color: #fff; font: bold 11px Arial, sans-serif; cursor: pointer; }",
        "#ugf-nb-box .who2 { margin-top: 6px; color: #777; font-size: 12px; }"
    ].join("\n");

    const el = function(tag, cls, text) {
        const n = document.createElement(tag);
        if (cls) {
            n.className = cls;
        }
        if (text !== undefined) {
            n.textContent = text;
        }
        return n;
    };
    const SVGNS = "http://www.w3.org/2000/svg";
    const bellSvg = function() {
        const svg = document.createElementNS(SVGNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        const p = document.createElementNS(SVGNS, "path");
        p.setAttribute("d", "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z");
        svg.appendChild(p);
        return svg;
    };
    const xhr = function(opts) {
        return new Promise(function(resolve, reject) {
            if (typeof GM_xmlhttpRequest !== "function") {
                reject(new Error("no GM_xmlhttpRequest"));
                return;
            }
            GM_xmlhttpRequest(Object.assign({
                timeout: 15000,
                onload: function(r) {
                    resolve(r);
                },
                onerror: function() {
                    reject(new Error("network error"));
                },
                ontimeout: function() {
                    reject(new Error("timed out"));
                }
            }, opts));
        });
    };
    // what happened last, where the lab's probe (and the console) can see it
    const trail = function(what) {
        try {
            let d = document.getElementById("ugf-nb-debug");
            if (!d) {
                d = el("div");
                d.id = "ugf-nb-debug";
                d.style.display = "none";
                (document.body || html).appendChild(d);
            }
            d.setAttribute("data-tooltip", [String(what).slice(0, 400)].concat((d.getAttribute("data-tooltip") || "").split(" || ")).slice(0, 14).join(" || "));
        } catch (e) {}
    };
    const decode = function(s) {
        return String(s || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#0?39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    };
    const textOf = function(t) {
        if (!t) {
            return "";
        }
        if (typeof t === "string") {
            return t;
        }
        if (t.simpleText) {
            return t.simpleText;
        }
        return (t.runs || []).map(function(r) {
            return r.text || "";
        }).join("");
    };

    // ---- YouTube: the notification menu, as youtube.com's own bell asks for it ----------
    const YT = "https://www.youtube.com";
    const cookie = function(name) {
        const m = document.cookie.split(";").map(function(c) {
            return c.trim();
        }).filter(function(c) {
            return c.indexOf(name + "=") === 0;
        })[0];
        return m ? m.slice(name.length + 1) : "";
    };
    const sha1 = async function(s) {
        const b = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
        return Array.prototype.map.call(new Uint8Array(b), function(x) {
            return ("0" + x.toString(16)).slice(-2);
        }).join("");
    };
    const ytAuth = async function() {
        const sid = cookie("SAPISID") || cookie("__Secure-3PAPISID");
        if (!sid) {
            return "";
        }
        const ts = Math.floor(Date.now() / 1000);
        return "SAPISIDHASH " + ts + "_" + (await sha1(ts + " " + sid + " " + YT));
    };
    // youtube.com's own settings for you, read off its page (an hour at a time): the client
    // version, which signed-in account (SESSION_INDEX) and which channel, when it is a Brand
    // Account's (DELEGATED_SESSION_ID), so the notifications are the ones youtube.com shows
    let ytCfgCache = null;
    const ytConfig = async function() {
        if (ytCfgCache && Date.now() - ytCfgCache.at < 36e5) {
            return ytCfgCache;
        }
        const cfg = { at: Date.now(), ver: String(gv("UGF_NB_YTVER", "")) || "2.20260915.01.00", index: "0", page: "" };
        try {
            const t = String((await xhr({ method: "GET", url: YT + "/feed/notifications" })).responseText || "");
            const pick = function(k) {
                const m = t.match(new RegExp('"' + k + '":"?([^",}]*)'));
                return m ? m[1] : "";
            };
            cfg.ver = pick("INNERTUBE_CLIENT_VERSION") || cfg.ver;
            cfg.index = pick("SESSION_INDEX") || "0";
            cfg.page = pick("DELEGATED_SESSION_ID");
            cfg.user = pick("DATASYNC_ID");
            cfg.loggedIn = pick("LOGGED_IN");
            sv("UGF_NB_YTVER", cfg.ver);
            trail("youtube.com config: v" + cfg.ver + " index " + cfg.index + (cfg.page ? " brand channel" : " own channel") + " logged in " + pick("LOGGED_IN"));
        } catch (e) {
            trail("youtube.com config unread: " + e.message);
        }
        ytCfgCache = cfg;
        return cfg;
    };
    const yt = async function(endpoint, body, as) {
        const auth = await ytAuth();
        if (!auth) {
            trail("no SAPISID cookie on " + window.location.hostname);
            throw new Error("signed out");
        }
        const cfg = await ytConfig();
        const ver = cfg.ver;
        const headers = {
            "Content-Type": "application/json",
            "Authorization": auth,
            "X-Origin": YT,
            "X-Goog-AuthUser": cfg.index,
            "X-Youtube-Client-Name": "1",
            "X-Youtube-Client-Version": ver
        };
        const client = Object.assign({ clientName: "WEB", clientVersion: ver, hl: "en", gl: "US" }, (as && as.client) || {});
        if (as && as.client) {
            headers["X-Youtube-Client-Name"] = String(as.id);
            headers["X-Youtube-Client-Version"] = as.client.clientVersion;
        }
        const user = {};
        if (cfg.page) {
            headers["X-Goog-PageId"] = cfg.page;
            user.onBehalfOfUser = cfg.page;
        }
        const r = await xhr({
            method: "POST",
            url: YT + "/youtubei/v1/" + endpoint + "?prettyPrint=false",
            headers: headers,
            data: JSON.stringify(Object.assign({ context: { client: client, user: user } }, body || {}))
        });
        const txt = String(r.responseText || "");
        trail(endpoint + " -> " + r.status + " (" + txt.length + " bytes, v" + ver + ") " + txt.slice(0, 160).replace(/\s+/g, " "));
        if (r.status === 401 || r.status === 403) {
            throw new Error("signed out");
        }
        if (r.status !== 200) {
            throw new Error("YouTube said " + r.status);
        }
        const j = JSON.parse(txt);
        trail(endpoint + " keys: " + Object.keys(j).join(",") + (j.responseContext && j.responseContext.mainAppWebResponseContext ? " loggedOut=" + j.responseContext.mainAppWebResponseContext.loggedOut : ""));
        return j;
    };
    // every notificationRenderer in the answer, wherever YouTube has put it this year
    const findAll = function(o, key, out) {
        if (!o || typeof o !== "object") {
            return out;
        }
        if (o[key]) {
            out.push(o[key]);
        }
        Object.keys(o).forEach(function(k) {
            if (k !== key) {
                findAll(o[k], key, out);
            }
        });
        return out;
    };
    let lastYt = "";
    // the notifications: YouTube's inbox page (its web notification menu has been coming back
    // empty since YouTube changed it; the inbox still has them), then the menu
    const ytList = async function() {
        let j = null;
        try {
            j = await yt("browse", { browseId: "FEnotifications_inbox" });
            if (!findAll(j, "notificationRenderer", []).length) {
                j = null;
            }
        } catch (e) {
            trail("inbox failed: " + e.message);
        }
        if (!j) {
            j = await yt("notification/get_notification_menu", { notificationsMenuRequestType: "NOTIFICATIONS_MENU_REQUEST_TYPE_INBOX" });
        }
        // what came back, in brief (for when there is nothing to show)
        const kinds = {};
        (function walk(o, depth) {
            if (!o || typeof o !== "object" || depth > 12) {
                return;
            }
            Object.keys(o).forEach(function(k) {
                if (/Renderer$|Command$|Action$/.test(k)) {
                    kinds[k] = (kinds[k] || 0) + 1;
                }
                walk(o[k], depth + 1);
            });
        })(j, 0);
        const promo = findAll(j, "backgroundPromoRenderer", [])[0];
        if (promo && !findAll(j, "notificationRenderer", []).length) {
            const c = ytCfgCache || {};
            lastYt = "YouTube says: " + [textOf(promo.title), textOf(promo.bodyText)].filter(Boolean).join(" - ") +
                " [asked as account " + (c.index || "0") + ", " + (c.page ? "Brand Account channel" : "the account's own channel") + (c.loggedIn ? ", youtube.com logged in " + c.loggedIn : "") + "]";
            trail(lastYt);
            return [];
        }
        lastYt = Object.keys(kinds).slice(0, 12).map(function(k) {
            return k + (kinds[k] > 1 ? " x" + kinds[k] : "");
        }).join(", ") || "empty answer: " + Object.keys(j).join(",");
        trail("notificationRenderer x" + findAll(j, "notificationRenderer", []).length + " | " + lastYt);
        return findAll(j, "notificationRenderer", []).map(function(n) {
            const thumb = function(t) {
                const a = (t && t.thumbnails) || [];
                return a.length ? a[a.length - 1].url : "";
            };
            const nav = n.navigationEndpoint || {};
            const url = ((nav.commandMetadata || {}).webCommandMetadata || {}).url ||
                (nav.watchEndpoint ? "/watch?v=" + nav.watchEndpoint.videoId : "");
            return {
                av: thumb(n.thumbnail),
                th: thumb(n.videoThumbnail),
                msg: textOf(n.shortMessage),
                tm: textOf(n.sentTimeText),
                url: url ? (/^https?:/.test(url) ? url : YT + url) : YT + "/feed/notifications",
                unread: n.read === false
            };
        }).filter(function(n) {
            return n.msg;
        });
    };
    // when YouTube has no notifications to give at all: the uploads of the channels you
    // subscribe to, from the Subscriptions feed ("Channel uploaded a video", newest first)
    const subsCache = { at: 0, items: [] };
    const ytSubs = async function(fresh) {
        if (!fresh && Date.now() - subsCache.at < 5 * 6e4) {
            return subsCache.items;
        }
        const j = await yt("browse", { browseId: "FEsubscriptions" });
        const out = [];
        const thumb = function(t) {
            const a2 = (t && (t.thumbnails || t.sources)) || [];
            return a2.length ? a2[a2.length - 1].url : "";
        };
        findAll(j, "videoRenderer", []).forEach(function(v) {
            const ch = textOf(v.ownerText || v.shortBylineText || v.longBylineText);
            const av = (((v.channelThumbnailSupportedRenderers || {}).channelThumbnailWithLinkRenderer || {}).thumbnail) || v.channelThumbnail;
            out.push({ id: v.videoId, ch: ch, title: textOf(v.title), av: thumb(av), th: thumb(v.thumbnail), tm: textOf(v.publishedTimeText) });
        });
        // the 2024-on grid's lockups
        findAll(j, "lockupViewModel", []).forEach(function(l) {
            if (!l.contentId || l.contentId.length !== 11) {
                return;
            }
            const md = ((l.metadata || {}).lockupMetadataViewModel) || {};
            const rows = (((md.metadata || {}).contentMetadataViewModel || {}).metadataRows) || [];
            const parts = [];
            rows.forEach(function(r) {
                (r.metadataParts || []).forEach(function(p) {
                    if (p.text && p.text.content) {
                        parts.push(p.text.content);
                    }
                });
            });
            const avm = findAll(md.image || {}, "avatarViewModel", [])[0];
            out.push({ id: l.contentId, ch: parts[0] || "", title: (md.title || {}).content || "", av: avm ? thumb(avm.image) : "",
                th: thumb(findAll(l.contentImage || {}, "thumbnailViewModel", [])[0] ? findAll(l.contentImage, "thumbnailViewModel", [])[0].image : null),
                tm: parts.filter(function(p) {
                    return /ago|hour|minute|day|week|month|year|Streamed|Premiere/i.test(p);
                })[0] || "" });
        });
        const seenIds = {};
        subsCache.items = out.filter(function(v) {
            if (!v.id || !v.title || seenIds[v.id]) {
                return false;
            }
            seenIds[v.id] = 1;
            return true;
        }).slice(0, 20);
        subsCache.at = Date.now();
        trail("subscriptions: " + subsCache.items.length + " uploads");
        return subsCache.items;
    };
    // which uploads you have already seen in the box
    const seenList = function() {
        try {
            return JSON.parse(String(gv("UGF_NB_YT_SEEN", "[]")));
        } catch (e) {
            return [];
        }
    };
    const markSeen = function(ids) {
        const all = seenList().concat(ids).filter(function(v, i, a2) {
            return a2.indexOf(v) === i;
        }).slice(-300);
        sv("UGF_NB_YT_SEEN", JSON.stringify(all));
    };
    // YouTube's own unseen count. Opening the box here doesn't tell YouTube they were seen,
    // so what was already counted when the box was last opened is taken off (and when YouTube
    // itself is cleared, on youtube.com, its count is followed again)
    let ytRaw = 0;
    const ytUnseen = async function() {
        const j = await yt("notification/get_unseen_count", {});
        const a2 = findAll(j, "updateNotificationsUnseenCountAction", [])[0];
        ytRaw = a2 ? Number(a2.unseenCount) || 0 : Number(j.unseenCount) || 0;
        let base = Number(gv("UGF_NB_YT_BASE", 0)) || 0;
        if (ytRaw < base) {
            base = ytRaw;
            sv("UGF_NB_YT_BASE", base);
        }
        return Math.max(0, ytRaw - base);
    };

    // ---- Google+: Loogle+'s notifications, for the username Gplex saw signed in there ----
    const loogleBase = function() {
        const saved = String(gv("UGF_LOOGLE_BASE", ""));
        if (saved) {
            return saved;
        }
        const link = String(gv("UGF_PLUS_LINK", ""));
        const m = link.match(/^(https?:\/\/[^\/]*loogle[^\/]*)/i);
        return m ? m[1] : LOOGLE_DEFAULT;
    };
    const loogleUser = function() {
        return String(gv("UGF_LOOGLE_USER", ""));
    };
    const loogle = async function(params) {
        const q = Object.keys(params).map(function(k) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
        }).join("&");
        const r = await xhr({ method: "GET", url: loogleBase() + "/api/v1/notifications.php?" + q, headers: { "Accept": "application/json" } });
        const j = JSON.parse(r.responseText);
        if (j.status !== "success") {
            throw new Error(j.message || "Loogle+ said no");
        }
        return j.data || {};
    };
    // Loogle+ is http only: its pictures come through the script (an https page won't show them)
    const pics = {};
    const loogleAvatar = function(name) {
        if (!pics[name]) {
            pics[name] = xhr({ method: "GET", url: loogleBase() + "/api/v1/fetch_profile_picture.php?name=" + encodeURIComponent(name), responseType: "blob" })
                .then(function(r) {
                    return r.status === 200 && r.response ? URL.createObjectURL(r.response) : "";
                }).catch(function() {
                    return "";
                });
        }
        return pics[name];
    };
    const gpList = async function() {
        const d = await loogle({ username: loogleUser(), request: "all_data" });
        return (d.notifications || []).map(function(n) {
            return {
                id: n.id,
                who: decode(n.sender),
                msg: decode(n.content),
                tm: decode(n.created_at || n.timestamp || n.date || n.time || ""),
                unread: !(n.read === 1 || n.read === "1" || n.is_read === 1 || n.is_read === "1")
            };
        });
    };
    const gpUnread = async function() {
        const d = await loogle({ username: loogleUser(), request: "unread_count" });
        return Number(d.count) || 0;
    };

    // ---- the count on the bell ------------------------------------------------------------
    let counts = { yt: 0, gp: 0 };
    const paint = function() {
        const n = counts.yt + counts.gp;
        document.querySelectorAll("#ugf-nb-bell, .kic.bell[data-ugf-nb]").forEach(function(b) {
            let c = b.querySelector(".ugf-nb-count");
            if (!c) {
                c = el("i", "ugf-nb-count");
                b.appendChild(c);
            }
            c.textContent = n > 99 ? "99+" : String(n);
            b.classList.toggle("ugf-nb-has", n > 0);
            b.setAttribute("title", n ? "Notifications (" + n + ")" : "Notifications");
        });
    };
    const refresh = async function() {
        if (document.visibilityState !== "visible") {
            return;
        }
        const results = await Promise.all([
            showing("yt") ? ytUnseen().catch(function() {
                return 0;
            }) : Promise.resolve(0),
            showing("gp") && loogleUser() ? gpUnread().catch(function() {
                return 0;
            }) : Promise.resolve(0)
        ]);
        counts = { yt: results[0], gp: results[1] };
        paint();
    };

    // ---- the box ---------------------------------------------------------------------------
    const close = function() {
        const b = document.getElementById("ugf-nb-box");
        if (b) {
            b.remove();
        }
        document.querySelectorAll("#ugf-nb-bell.open, .kic.bell.open").forEach(function(x) {
            x.classList.remove("open");
        });
    };
    // which of the two the box shows (the gear's settings page)
    const showing = function(kind) {
        return String(gv(kind === "yt" ? "UGF_NB_SHOW_YT" : "UGF_NB_SHOW_GP", "1")) !== "0";
    };
    const SVG_ICON = {
        gear: "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z",
        back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
    };
    const svgIcon = function(name) {
        const svg = document.createElementNS(SVGNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        const p = document.createElementNS(SVGNS, "path");
        p.setAttribute("d", SVG_ICON[name]);
        svg.appendChild(p);
        return svg;
    };
    const logo = function(kind) {
        return el("span", "lg " + kind, kind === "yt" ? "▶" : "");
    };
    const section = function(box, kind, title, link, linkUrl) {
        const s = el("div", "sec " + kind);
        s.hidden = true;
        const h = el("div", "sh");
        h.appendChild(logo(kind));
        h.appendChild(el("span", "", title));
        h.appendChild(el("span", "sp"));
        if (link) {
            const a = el("a", "", link);
            a.className = "hl";
            if (linkUrl) {
                a.href = linkUrl;
                a.target = "_blank";
            }
            h.appendChild(a);
        }
        s.appendChild(h);
        const list = el("div", "list");
        s.appendChild(list);
        box.querySelector(".scroll").insertBefore(s, box.querySelector(".scroll .jingles"));
        return list;
    };
    // what each part came to: "ok" (something to show), "empty", or still loading; with
    // nothing to show anywhere, Mr. Jingles says "All caught up!"
    const settle = function(box, list, state) {
        const sec = list.parentNode;
        sec.hidden = state === "empty";
        sec.setAttribute("data-state", state);
        const secs = [].slice.call(box.querySelectorAll(".view.main .sec"));
        const loading = secs.some(function(x) {
            return !x.hasAttribute("data-state");
        });
        const any = secs.some(function(x) {
            return x.getAttribute("data-state") === "ok";
        });
        box.querySelector(".loading").hidden = !loading || any;
        box.querySelector(".jingles").hidden = loading || any;
    };
    // a message in the place of the cards (signed out, couldn't load...)
    const none = function(list, text, linkText, url) {
        list.textContent = "";
        const n = el("div", "note", text);
        if (linkText) {
            n.appendChild(document.createTextNode(" "));
            const a = el("a", "", linkText);
            a.href = url;
            a.target = "_blank";
            n.appendChild(a);
        }
        list.appendChild(n);
    };
    const fillYouTube = async function(list, box) {
        let items;
        try {
            items = await ytList();
            if (!items.length) {
                const seen = seenList();
                const subs = await ytSubs(true);
                items = subs.map(function(v) {
                    return { av: v.av, th: v.th, msg: (v.ch ? v.ch + " uploaded a video: " : "") + v.title, tm: v.tm,
                        url: YT + "/watch?v=" + v.id, unread: seen.indexOf(v.id) < 0, id: v.id };
                });
                markSeen(subs.map(function(v) {
                    return v.id;
                }));
            }
        } catch (e) {
            trail("YouTube list failed: " + e.message);
            none(list, /signed out/.test(e.message) ? "Sign in to YouTube to see its notifications here." : "YouTube's notifications couldn't be loaded.",
                /signed out/.test(e.message) ? "Sign in" : "Open YouTube", /signed out/.test(e.message) ? "https://accounts.google.com/ServiceLogin?service=youtube&continue=" + encodeURIComponent(YT + "/") : YT + "/feed/notifications");
            settle(box, list, "ok");
            return;
        }
        if (!items.length) {
            settle(box, list, "empty");
            return;
        }
        // newest first (YouTube's inbox puts its "Important" group ahead of the rest): by the
        // "2 hours ago" each one says; the order YouTube gave breaks ties
        const UNIT = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2629800, year: 31557600 };
        const age = function(t) {
            const m = String(t || "").toLowerCase().match(/(\d+)\s*(second|minute|hour|day|week|month|year)/);
            if (m) {
                return Number(m[1]) * UNIT[m[2]];
            }
            return /just now|moments? ago/.test(String(t || "").toLowerCase()) ? 0 : Infinity;
        };
        items = items.map(function(n, i) {
            return { n: n, i: i, a: age(n.tm) };
        }).sort(function(x, y) {
            return x.a - y.a || x.i - y.i;
        }).map(function(x) {
            return x.n;
        });
        list.textContent = "";
        // collapsed to the newest few; the rest behind "Show all"
        const FEW = 5;
        items.slice(0, 30).forEach(function(n, i) {
            const a = el("a", "it" + (n.unread ? "" : " read") + (i >= FEW ? " more" : ""));
            a.href = n.url;
            a.target = "_blank";
            const av = el("span", "av");
            if (n.av) {
                av.style.backgroundImage = "url(\"" + n.av.replace(/"/g, "%22") + "\")";
            }
            const tx = el("span", "tx");
            tx.appendChild(el("div", "msg", n.msg));
            if (n.tm) {
                tx.appendChild(el("div", "tm", n.tm));
            }
            a.appendChild(av);
            a.appendChild(tx);
            if (n.th) {
                const th = el("span", "th");
                th.style.backgroundImage = "url(\"" + n.th.replace(/"/g, "%22") + "\")";
                a.appendChild(th);
            }
            list.appendChild(a);
        });
        const shown = Math.min(items.length, 30);
        if (shown > FEW) {
            list.classList.add("collapsed");
            const t = el("a", "tog", "Show all " + shown + " ▾");
            t.addEventListener("click", function(e) {
                e.preventDefault();
                const open = list.classList.toggle("collapsed") === false;
                t.textContent = open ? "Show fewer ▴" : "Show all " + shown + " ▾";
            });
            list.appendChild(t);
        }
        settle(box, list, "ok");
        counts.yt = 0;
        sv("UGF_NB_YT_BASE", ytRaw);
        paint();
    };
    const fillGooglePlus = async function(list, box) {
        if (!loogleUser()) {
            none(list, "Give your Loogle+ username behind the gear, and its notifications will show here.", "", "");
            const go = el("a", "", "Settings");
            go.addEventListener("click", function() {
                box.querySelector(".hd .gear").click();
            });
            list.firstChild.appendChild(document.createTextNode(" "));
            list.firstChild.appendChild(go);
            settle(box, list, "ok");
            return;
        }
        let items;
        try {
            items = await gpList();
        } catch (e) {
            trail("Loogle+ failed: " + e.message);
            none(list, "Loogle+'s notifications couldn't be loaded for +" + loogleUser() + " (" + e.message + ").", "Open Loogle+", loogleBase() + "/");
            settle(box, list, "ok");
            return;
        }
        if (!items.length) {
            settle(box, list, "empty");
            return;
        }
        list.textContent = "";
        const markAll = list.parentNode.querySelector(".sh .hl");
        if (markAll) {
            markAll.addEventListener("click", function(e) {
                e.preventDefault();
                loogle({ username: loogleUser(), request: "read_all_notifications" }).catch(function() {});
                list.textContent = "";
                counts.gp = 0;
                paint();
                settle(box, list, "empty");
            });
        }
        items.forEach(function(n) {
            const a = el("a", "it" + (n.unread ? "" : " read"));
            a.href = loogleBase() + "/";
            a.target = "_blank";
            const av = el("span", "av");
            loogleAvatar(n.who).then(function(u) {
                if (u) {
                    av.style.backgroundImage = "url(\"" + u + "\")";
                }
            });
            const tx = el("span", "tx");
            tx.appendChild(el("div", "who", n.who));
            tx.appendChild(el("div", "msg", n.msg));
            if (n.tm) {
                tx.appendChild(el("div", "tm", n.tm));
            }
            const x = el("span", "x", "×");
            x.setAttribute("title", "Dismiss");
            x.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                loogle({ request: "read_notification", username: loogleUser(), id: n.id }).catch(function() {});
                a.remove();
                counts.gp = Math.max(0, counts.gp - (n.unread ? 1 : 0));
                paint();
                if (!list.querySelector(".it")) {
                    settle(box, list, "empty");
                }
            });
            a.appendChild(av);
            a.appendChild(tx);
            a.appendChild(x);
            list.appendChild(a);
        });
        settle(box, list, "ok");
    };
    // the gear's page: "Allow notifications here from:", as the panel had it
    const settingsView = function(box) {
        const v = el("div", "view settings");
        v.hidden = true;
        const hd = el("div", "hd");
        const back = el("span", "ic back");
        back.setAttribute("title", "Back");
        back.appendChild(svgIcon("back"));
        hd.appendChild(back);
        hd.appendChild(el("span", "", "Settings"));
        v.appendChild(hd);
        const body = el("div", "sbody");
        body.appendChild(el("div", "lead", "Allow notifications here from:"));
        let changed = false;
        [["gp", "Google+", loogleBase() + "/", "UGF_NB_SHOW_GP"], ["yt", "YouTube", YT + "/account_notifications", "UGF_NB_SHOW_YT"]].forEach(function(r) {
            const row = el("div", "srow");
            row.appendChild(logo(r[0]));
            row.appendChild(el("span", "nm", r[1]));
            const a = el("a", "", "Settings");
            a.href = r[2];
            a.target = "_blank";
            row.appendChild(a);
            row.appendChild(el("span", "sp"));
            const c = el("span", "chk" + (showing(r[0]) ? " on" : ""));
            c.setAttribute("role", "checkbox");
            c.setAttribute("aria-label", r[1]);
            c.addEventListener("click", function() {
                const on = !c.classList.contains("on");
                c.classList.toggle("on", on);
                sv(r[3], on ? "1" : "0");
                changed = true;
            });
            row.appendChild(c);
            body.appendChild(row);
        });
        // who you are on Loogle+ (its notifications are asked for by username)
        const f = el("form", "ask");
        const inp = el("input");
        inp.type = "text";
        inp.placeholder = "Loogle+ username";
        inp.value = loogleUser();
        const ok = el("button", "", "Save");
        ok.type = "submit";
        f.appendChild(inp);
        f.appendChild(ok);
        const said = el("div", "who2", loogleUser() ? "Google+ notifications from Loogle+ for +" + loogleUser() : "Google+ notifications come from Loogle+: give your username there.");
        f.addEventListener("submit", function(e) {
            e.preventDefault();
            sv("UGF_LOOGLE_USER", inp.value.trim().replace(/^\+/, ""));
            said.textContent = inp.value.trim() ? "Saved: +" + inp.value.trim().replace(/^\+/, "") : "Cleared";
            changed = true;
        });
        body.appendChild(f);
        body.appendChild(said);
        v.appendChild(body);
        back.addEventListener("click", function() {
            if (changed) {
                // start again with what was chosen
                const bell = document.querySelector("#ugf-nb-bell.open, .kic.bell.open");
                close();
                refresh();
                if (bell) {
                    open(bell);
                }
                return;
            }
            v.hidden = true;
            box.querySelector(".view.main").hidden = false;
        });
        return v;
    };
    const open = function(bell) {
        if (bell.classList.contains("open")) {
            close();
            return;
        }
        close();
        bell.classList.add("open");
        const box = el("div");
        box.id = "ugf-nb-box";
        const main = el("div", "view main");
        const hd = el("div", "hd");
        const gear = el("span", "ic gear");
        gear.setAttribute("title", "Settings");
        gear.appendChild(svgIcon("gear"));
        hd.appendChild(gear);
        hd.appendChild(el("span", "", "Google notifications"));
        main.appendChild(hd);
        const scroll = el("div", "scroll");
        scroll.appendChild(el("div", "loading", "Loading..."));
        const j = el("div", "jingles");
        j.hidden = true;
        j.appendChild(el("div", "bub", "All caught up!"));
        j.appendChild(el("div", "bell"));
        scroll.appendChild(j);
        main.appendChild(scroll);
        const ft = el("a", "ft2", "Previously read (Google+)");
        ft.href = loogleBase() + "/";
        ft.target = "_blank";
        main.appendChild(ft);
        box.appendChild(main);
        const sv2 = settingsView(box);
        box.appendChild(sv2);
        gear.addEventListener("click", function() {
            main.hidden = true;
            sv2.hidden = false;
        });
        // (on <html> itself: Gplex hides everything else in <body> on google.com)
        html.appendChild(box);
        const r = bell.getBoundingClientRect();
        const right = Math.max(8, window.innerWidth - r.right - 8);
        box.style.top = Math.round(r.bottom + 10) + "px";
        box.style.right = right + "px";
        box.style.setProperty("--arrow", Math.max(8, Math.round(window.innerWidth - right - r.left - r.width / 2 - 8)) + "px");
        let any = false;
        if (showing("yt")) {
            any = true;
            fillYouTube(section(box, "yt", "YouTube", "See all", YT + "/feed/notifications"), box);
        }
        if (showing("gp")) {
            any = true;
            fillGooglePlus(section(box, "gp", "Google+", loogleUser() ? "Mark all as read" : "", ""), box);
        }
        if (!any) {
            box.querySelector(".loading").hidden = true;
            j.hidden = false;
        }
    };
    document.addEventListener("mousedown", function(e) {
        const b = document.getElementById("ugf-nb-box");
        if (e.isTrusted && b && !b.contains(e.target) && !e.target.closest("#ugf-nb-bell, .kic.bell[data-ugf-nb]")) {
            close();
        }
    }, true);
    document.addEventListener("keydown", function(e) {
        if (e.isTrusted && e.key === "Escape") {
            close();
        }
    }, true);

    // ---- where the bell goes ---------------------------------------------------------------
    // Gplex's own pages (Drive, the Docs lists...) already draw a bell: it is given the box.
    // On google.com, Google's own bar has none: one goes between the app grid and the photo.
    const bellClick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        open(e.currentTarget);
    };
    const place = function() {
        let changed = false;
        document.querySelectorAll(".kic.bell:not([data-ugf-nb]), #ugf-cal-account .ic.bell:not([data-ugf-nb])").forEach(function(b) {
            b.setAttribute("data-ugf-nb", "");
            b.classList.add("kic", "bell", "ugf-nb-g");
            b.appendChild(el("span", "gi"));
            b.addEventListener("click", bellClick);
            changed = true;
        });
        // the Docs, Sheets, Slides and Forms lists: Gplex's 2016 corner has the grid and the photo
        // only; the bell goes between them
        document.querySelectorAll("#ugf-docs-home .gtop .corner .ib.apps").forEach(function(apps) {
            const next = apps.nextElementSibling;
            if (next && next.hasAttribute("data-ugf-nb")) {
                return;
            }
            if (next && next.classList.contains("bell")) {
                return;
            }
            const b = el("span", "kic bell ugf-nb-g");
            b.setAttribute("data-ugf-nb", "");
            b.setAttribute("role", "button");
            b.setAttribute("aria-label", "Notifications");
            b.appendChild(el("span", "gi"));
            b.addEventListener("click", bellClick);
            apps.parentNode.insertBefore(b, apps.nextSibling);
            changed = true;
        });
        // Gplex's own bar on google.com (Google's is hidden under it): after its app grid
        const shown = function(n) {
            const r = n && n.getBoundingClientRect();
            return !!r && r.width > 0 && r.height > 0;
        };
        let bell = document.getElementById("ugf-nb-bell");
        const gapps = document.querySelector("#ugf-top-right #ugf-apps");
        let after = null;
        if (gapps && shown(gapps)) {
            after = gapps;
        } else {
            // Google's own bar, where it is the one showing: between the grid and the photo
            const gb = document.querySelector("header#gb, #gb");
            const apps = gb && shown(gb) && gb.querySelector("#gbwa");
            const me = apps && gb.querySelector("a[aria-label^='Google Account'], a[href*='SignOutOptions']");
            if (apps && me) {
                after = apps;
                while (after.parentElement && !after.parentElement.contains(me)) {
                    after = after.parentElement;
                }
            }
        }
        if (after && (!bell || bell.previousElementSibling !== after)) {
            if (!bell) {
                bell = el("div");
                bell.id = "ugf-nb-bell";
                bell.setAttribute("role", "button");
                bell.setAttribute("aria-label", "Notifications");
                bell.appendChild(el("span", "gi"));
                bell.addEventListener("click", bellClick);
            }
            after.parentElement.insertBefore(bell, after.nextSibling);
            changed = true;
        }
        if (changed) {
            paint();
        }
    };
    // the circle and its white bell, painted at 1x (20px) and handed to the CSS
    const paintCircle = function() {
        try {
            const c = document.createElement("canvas");
            c.width = 20;
            c.height = 20;
            const g = c.getContext("2d");
            g.fillStyle = "#000";
            g.beginPath();
            g.arc(10, 10, 10, 0, Math.PI * 2);
            g.fill();
            g.translate(3.5, 3);
            g.scale(13 / 24, 13 / 24);
            g.fillStyle = "#fff";
            g.fill(new Path2D("M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"));
            html.style.setProperty("--ugf-nb-circle", "url(" + c.toDataURL("image/png") + ")");
        } catch (e) {}
    };
    // Mr. Jingles: the smiling grey bell of "All caught up!" (#c6c6c6, his clapper #8f8f8f)
    const JINGLES = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="82" viewBox="0 0 64 82">' +
        '<circle cx="32" cy="6" r="4" fill="none" stroke="#c6c6c6" stroke-width="2.5"/>' +
        '<path d="M32 10C19 10 11 21 11 35v21h42V35c0-14-8-25-21-25z" fill="#c6c6c6"/>' +
        '<rect x="2" y="55" width="60" height="7" rx="3.5" fill="#c6c6c6"/>' +
        '<path d="M24 62a8 8 0 0 0 8 8V62z" fill="#8f8f8f"/><path d="M32 62v8a8 8 0 0 0 8-8z" fill="#a8a8a8"/>' +
        '<circle cx="25.5" cy="37" r="2.4" fill="#8f8f8f"/><circle cx="38.5" cy="37" r="2.4" fill="#8f8f8f"/>' +
        '<path d="M26.5 43.5h11a5.5 5.5 0 0 1-11 0z" fill="#8f8f8f"/></svg>';
    const start = function() {
        paintCircle();
        html.style.setProperty("--ugf-nb-jingles", "url(\"data:image/svg+xml," + encodeURIComponent(JINGLES) + "\")");
        const st = el("style");
        st.id = "ugf-nb-styles";
        st.textContent = CSS;
        (document.head || html).appendChild(st);
        place();
        let queued = false;
        new MutationObserver(function() {
            if (queued) {
                return;
            }
            queued = true;
            requestAnimationFrame(function() {
                queued = false;
                place();
            });
        }).observe(html, { childList: true, subtree: true });
        refresh();
        setInterval(refresh, 60000);
        document.addEventListener("visibilitychange", refresh);
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
