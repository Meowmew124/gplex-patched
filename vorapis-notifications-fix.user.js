// ==UserScript==
// @name         VORAPIS notifications fix
// @namespace    gplex-patched
// @version      1.3
// @description  YouTube's notification menu request (notification/get_notification_menu) now comes back empty, so VORAPIS's bell shows nothing. This answers it from YouTube's notification inbox (browse FEnotifications_inbox), which still has them, in the menu's own format. VORAPIS itself is left untouched.
// @match        https://www.youtube.com/*
// @run-at       document-start
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/Meowmew124/gplex-patched/main/vorapis-notifications-fix.user.js
// @updateURL    https://raw.githubusercontent.com/Meowmew124/gplex-patched/main/vorapis-notifications-fix.user.js
// ==/UserScript==
(function () {
    "use strict";
    const MENU = "/youtubei/v1/notification/get_notification_menu";
    const real = window.fetch;
    if (!real || real.__ugfNotifFix) {
        return;
    }
    // every notificationRenderer in an answer, wherever YouTube has put it
    const collect = function (o, out) {
        if (!o || typeof o !== "object") {
            return out;
        }
        if (o.notificationRenderer) {
            out.push({ notificationRenderer: o.notificationRenderer });
        }
        Object.keys(o).forEach(function (k) {
            if (k !== "notificationRenderer") {
                collect(o[k], out);
            }
        });
        return out;
    };
    // newest first (YouTube's inbox puts its "Important" group ahead of the rest): by the
    // "2 hours ago" each one says; YouTube's own order breaks ties
    const UNIT = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2629800, year: 31557600 };
    const text = function (t) {
        return !t ? "" : t.simpleText || (t.runs || []).map(function (r) {
            return r.text || "";
        }).join("");
    };
    const age = function (item) {
        const t = text(item.notificationRenderer.sentTimeText).toLowerCase();
        const m = t.match(/(\d+)\s*(second|minute|hour|day|week|month|year)/);
        return m ? Number(m[1]) * UNIT[m[2]] : (/just now|moments? ago/.test(t) ? 0 : Infinity);
    };
    const newestFirst = function (items) {
        return items.map(function (n, i) {
            return { n: n, i: i, a: age(n) };
        }).sort(function (x, y) {
            return x.a - y.a || x.i - y.i;
        }).map(function (x) {
            return x.n;
        });
    };
    const menuFrom = function (inbox, items) {
        return {
            responseContext: inbox.responseContext || {},
            actions: [{
                openPopupAction: {
                    popup: {
                        multiPageMenuRenderer: {
                            header: { simpleMenuHeaderRenderer: { title: { simpleText: "Notifications" } } },
                            sections: [{ multiPageMenuNotificationSectionRenderer: { items: items, trackingParams: inbox.trackingParams || "" } }],
                            style: "MULTI_PAGE_MENU_STYLE_TYPE_NOTIFICATIONS",
                            trackingParams: inbox.trackingParams || ""
                        }
                    },
                    popupType: "DROPDOWN"
                }
            }],
            trackingParams: inbox.trackingParams || ""
        };
    };
    const fixed = async function (input, init) {
        const url = typeof input === "string" ? input : (input && input.url) || String(input);
        if (url.indexOf(MENU) < 0) {
            return real.apply(this, arguments);
        }
        // the menu as asked, first: if it has notifications again, it is left alone
        const answer = await real.apply(this, arguments);
        try {
            const menu = await answer.clone().json();
            if (collect(menu, []).length) {
                return answer;
            }
            const bodyText = init && typeof init.body === "string" ? init.body : (input && input.clone ? await input.clone().text() : "{}");
            const body = JSON.parse(bodyText || "{}");
            delete body.notificationsMenuRequestType;
            body.browseId = "FEnotifications_inbox";
            const headers = (init && init.headers) || (input && input.headers) || {};
            const inboxRes = await real.call(window, url.replace("/notification/get_notification_menu", "/browse"), {
                method: "POST",
                credentials: "include",
                mode: "cors",
                headers: headers,
                body: JSON.stringify(body)
            });
            const inbox = await inboxRes.json();
            const items = newestFirst(collect(inbox, []));
            if (!items.length) {
                return answer;
            }
            return new Response(JSON.stringify(menuFrom(inbox, items)), { status: 200, headers: { "Content-Type": "application/json" } });
        } catch (e) {
            console.warn("[VORAPIS notifications fix]", e);
            return answer;
        }
    };
    fixed.__ugfNotifFix = true;
    window.fetch = fixed;

    // youtube.com/#notifications (the "See all" of Gplex's bell and of Loogle+): VORAPIS has no
    // notifications page, so the bell's dropdown is opened instead. VORAPIS draws the bell before
    // it answers clicks, so it is pressed (as a mouse does) until its notifications panel shows.
    if (window.location.hash === "#notifications") {
        const started = Date.now();
        let pressed = 0;
        const panelShown = function () {
            const p = document.querySelector(".sb-notification-frame, .yt-uix-clickcard-card-visible, ytd-multi-page-menu-renderer, #sb-button-notify.yt-uix-button-toggled");
            return !!p && p.getBoundingClientRect().height > 0;
        };
        const press = function (el) {
            const r = el.getBoundingClientRect();
            const at = { bubbles: true, cancelable: true, view: window, button: 0, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
            ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(function (t) {
                try {
                    el.dispatchEvent(/^pointer/.test(t) ? new PointerEvent(t, at) : new MouseEvent(t, at));
                } catch (e) {}
            });
        };
        const tryOpen = function () {
            if (panelShown()) {
                history.replaceState(null, "", window.location.pathname + window.location.search);
                return;
            }
            const bell = document.querySelector("#sb-button-notify, ytd-notification-topbar-button-renderer button, ytd-notification-topbar-button-renderer #button");
            if (bell && bell.getBoundingClientRect().width > 0 && Date.now() - pressed > 1500) {
                pressed = Date.now();
                press(bell);
            }
            if (Date.now() - started < 15000) {
                setTimeout(tryOpen, 300);
            }
        };
        if (document.readyState === "complete") {
            setTimeout(tryOpen, 800);
        } else {
            window.addEventListener("load", function () {
                setTimeout(tryOpen, 800);
            });
        }
    }
})();
