// ---- Gplex Docs 2014 fixes (gplex-patched) ----------------------------------------
// The 2014 editor over today's: the Table menu between Tools and Add-ons, the four
// alignment buttons, and a relayout once the side panel's empty gutter is given back.
// Both drive Google's own menus out of sight, so every command is still Google's.
(function ugfDocs2014Fixes() {
    "use strict";
    if (window.location.host !== "docs.google.com" || !/^\/(document|presentation)\//.test(window.location.pathname) || window.top !== window.self) {
        return;
    }
    const CSS = /*__UGF_DOCS2014_CSS__*/ null;
    const html = document.documentElement;
    // the Docs editor (the Slides editor is left as Gplex draws it)
    const wanted = function() {
        return html.getAttribute("gplex-docs") === "d2014" && /^\/document\//.test(window.location.pathname);
    };
    // the Docs list (Gplex draws it as #ugf-docs-home)
    // the Slides editor: only put back in the middle once the rail's room is given back
    const slidesWanted = function() {
        return html.getAttribute("gplex-docs") === "d2014" && /^\/presentation\//.test(window.location.pathname);
    };
    // the Docs or Slides list (Gplex draws both as #ugf-docs-home)
    const homeWanted = function() {
        return html.getAttribute("gplex-docs-home") === "d2014";
    };
    // what the list's strip says and makes, per app: Docs' portrait pages seven to a row,
    // Slides' landscape slides five
    const HOME_APPS = {
        docs: { noun: "document", create: "https://docs.google.com/document/create", recent: 6 },
        slides: { noun: "presentation", create: "https://docs.google.com/presentation/create", recent: 4, recentTitle: "Recently used", fullPage: true }
    };

    const el = function(tag, cls) {
        const n = document.createElement(tag);
        if (cls) {
            n.className = cls;
        }
        return n;
    };
    // the last error, where the lab's probe (and the console) can see it
    const report = function(where, e) {
        console.warn("[Gplex Docs 2014] " + where + ":", e);
        let d = document.getElementById("ugf-d14-debug");
        if (!d) {
            d = el("div");
            d.id = "ugf-d14-debug";
            d.style.display = "none";
            (document.body || html).appendChild(d);
        }
        const line = (where + ": " + (e && e.message || e)).slice(0, 240);
        d.setAttribute("data-tooltip", [line].concat((d.getAttribute("data-tooltip") || "").split(" || ")).slice(0, 3).join(" || "));
    };

    // ---- driving Google's menus ------------------------------------------------------
    const wait = function(ms) {
        return new Promise(function(r) {
            setTimeout(r, ms);
        });
    };
    const until = async function(fn, ms) {
        const end = Date.now() + (ms || 1500);
        while (Date.now() < end) {
            const v = fn();
            if (v) {
                return v;
            }
            await wait(40);
        }
        return null;
    };
    const shown = function(el) {
        if (!el || !el.isConnected) {
            return false;
        }
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
    };
    const fire = function(el, types, extra) {
        const r = el.getBoundingClientRect();
        const at = Object.assign({ bubbles: true, cancelable: true, button: 0, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }, extra);
        types.forEach(function(t) {
            try {
                el.dispatchEvent(/^pointer/.test(t) && typeof PointerEvent === "function" ?
                    new PointerEvent(t, Object.assign({ pointerType: "mouse", isPrimary: true }, at)) : new MouseEvent(t, at));
            } catch (e) {}
        });
    };
    const press = function(el) {
        fire(el, ["pointerover", "mouseover", "pointerdown", "mousedown"], { buttons: 1 });
        fire(el, ["pointerup", "mouseup", "click"], { buttons: 0 });
    };
    // a menu bar name opens on the mouse going down, and a menu item acts on it coming up
    // over the item: press-drag-release, as a hand does it. (A full click on the name opens
    // its menu and shuts it again.)
    const pressOpen = function(el) {
        fire(el, ["pointerover", "mouseover", "pointerdown", "mousedown"], { buttons: 1 });
    };
    const release = function(el) {
        fire(el, ["pointerover", "mouseover", "mouseenter", "pointermove", "mousemove"], { buttons: 1 });
        fire(el, ["pointerup", "mouseup", "click"], { buttons: 0 });
    };
    const hover = function(el) {
        fire(el, ["pointerover", "mouseover", "mouseenter", "pointermove", "mousemove"], { buttons: 0 });
    };
    const norm = function(s) {
        return String(s || "").replace(/…/g, "...").replace(/\s+/g, " ").trim().toLowerCase();
    };
    const labelOf = function(item) {
        const l = item.querySelector(".goog-menuitem-label");
        let t = l ? l.textContent : item.textContent;
        const accel = item.querySelector(".goog-menuitem-accel");
        if (!l && accel) {
            t = t.replace(accel.textContent, "");
        }
        return norm(t);
    };
    const openMenus = function() {
        return [].filter.call(document.querySelectorAll(".goog-menu"), function(m) {
            return m.id !== "ugf-d14-table-dd" && shown(m);
        });
    };
    // an item of the open menus by its words (newest menu first). A shown item is preferred;
    // failing that, one the period's menus hide (Gplex drops today's extras from them), which
    // Google still carries out when pressed.
    const findItem = function(label, within) {
        const want = norm(label);
        const menus = within || openMenus();
        for (const visibleOnly of [true, false]) {
            for (let i = menus.length - 1; i >= 0; i--) {
                const hit = [].find.call(menus[i].querySelectorAll(".goog-menuitem"), function(it) {
                    return (!visibleOnly || shown(it)) && labelOf(it).indexOf(want) === 0;
                });
                if (hit) {
                    return hit;
                }
            }
        }
        return null;
    };
    const closeMenus = function() {
        openMenus().forEach(function(m) {
            m.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, cancelable: true }));
        });
    };
    // Google's menus open unseen while we work them
    const busy = function(on) {
        html.classList.toggle("ugf-d14-busy", on);
    };
    // File > ... > item. Returns "ok", "disabled" or "missing". With leaveOpen the last
    // item is a submenu that stays open (and is returned) for the user to pick from.
    const runMenu = async function(button, path, leaveOpen) {
        if (!button) {
            return "missing";
        }
        busy(true);
        try {
            pressOpen(button);
            for (let i = 0; i < path.length; i++) {
                const item = await until(function() {
                    return findItem(path[i]);
                });
                if (!item) {
                    closeMenus();
                    return "missing";
                }
                if (item.classList.contains("goog-menuitem-disabled") || item.getAttribute("aria-disabled") === "true") {
                    closeMenus();
                    return "disabled";
                }
                const last = i === path.length - 1;
                if (!last || leaveOpen) {
                    const before = openMenus();
                    hover(item);
                    release(item);
                    const sub = await until(function() {
                        return openMenus().find(function(m) {
                            return before.indexOf(m) === -1;
                        });
                    }, 1200);
                    if (last) {
                        return sub || "missing";
                    }
                } else {
                    release(item);
                }
            }
            await wait(60);
            closeMenus();
            return "ok";
        } finally {
            if (!leaveOpen) {
                busy(false);
            }
        }
    };

    // a small note under a control, the way the period's editor said "Can't do that here"
    let noteTimer = 0;
    const note = function(text, near) {
        let n = document.getElementById("ugf-d14-note");
        if (!n) {
            n = document.createElement("div");
            n.id = "ugf-d14-note";
            document.body.appendChild(n);
        }
        const r = near.getBoundingClientRect();
        n.textContent = text;
        n.style.left = Math.round(r.left) + "px";
        n.style.top = Math.round(r.bottom + 4) + "px";
        n.style.display = "block";
        clearTimeout(noteTimer);
        noteTimer = setTimeout(function() {
            n.style.display = "none";
        }, 2500);
    };

    // ---- the four alignment buttons ------------------------------------------------------
    const ALIGN = [["left", "Left align", "L", "⌘+Shift+L"], ["center", "Center align", "E", "⌘+Shift+E"],
        ["right", "Right align", "R", "⌘+Shift+R"], ["justify", "Justify", "J", "⌘+Shift+J"]];
    const mac = /Mac/.test(navigator.platform);
    // the keyboard's way, if Google's menu can't be worked
    const alignByKeys = function(letter) {
        const f = document.querySelector(".docs-texteventtarget-iframe");
        const doc = f && f.contentDocument;
        const t = doc && (doc.querySelector("[contenteditable='true']") || doc.body);
        if (!t) {
            return;
        }
        ["keydown", "keyup"].forEach(function(type) {
            t.dispatchEvent(new KeyboardEvent(type, { key: letter.toLowerCase(), code: "Key" + letter, keyCode: letter.charCodeAt(0), which: letter.charCodeAt(0),
                shiftKey: true, metaKey: mac, ctrlKey: !mac, bubbles: true, cancelable: true }));
        });
    };
    const align = async function(a) {
        const source = document.getElementById("alignButton");
        busy(true);
        try {
            if (source) {
                press(source);
                const pick = await until(function() {
                    return [].find.call(document.querySelectorAll(".goog-menu [aria-label], .goog-menu [data-tooltip]"), function(el) {
                        const t = el.getAttribute("aria-label") || el.getAttribute("data-tooltip") || "";
                        return t.indexOf(a[1]) === 0 && shown(el);
                    });
                }, 1000);
                if (pick) {
                    press(pick);
                    await wait(60);
                    closeMenus();
                    return;
                }
                closeMenus();
            }
            alignByKeys(a[2]);
        } finally {
            busy(false);
        }
    };
    const toolbarButton = function(id, icon, tip) {
        const b = document.createElement("div");
        b.id = id;
        b.className = "goog-toolbar-button goog-inline-block ugf-d14-button";
        b.setAttribute("role", "button");
        b.setAttribute("aria-label", tip);
        b.setAttribute("data-tooltip", tip);
        // (Docs enforces Trusted Types, so the button is built node by node)
        const outer = el("div", "goog-toolbar-button-outer-box goog-inline-block");
        const inner = el("div", "goog-toolbar-button-inner-box goog-inline-block");
        const iconBox = el("div", "docs-icon goog-inline-block");
        iconBox.appendChild(el("div", "docs-icon-img-container docs-icon-img docs-icon-" + icon + "-20"));
        inner.appendChild(iconBox);
        outer.appendChild(inner);
        b.appendChild(outer);
        b.addEventListener("mouseenter", function() {
            b.classList.add("goog-toolbar-button-hover");
        });
        b.addEventListener("mouseleave", function() {
            b.classList.remove("goog-toolbar-button-hover", "goog-toolbar-button-active");
        });
        // keep the document's selection: the button never takes the focus
        b.addEventListener("mousedown", function(e) {
            e.preventDefault();
            b.classList.add("goog-toolbar-button-active");
        });
        b.addEventListener("mouseup", function() {
            b.classList.remove("goog-toolbar-button-active");
        });
        return b;
    };
    const syncAlign = function() {
        const icon = document.querySelector("#alignButton .docs-icon-img");
        const now = icon && (String(icon.className).match(/docs-icon-align-(left|center|right|justify)/) || [])[1];
        ALIGN.forEach(function(a) {
            const b = document.getElementById("ugf-d14-align-" + a[0]);
            if (b) {
                b.classList.toggle("goog-toolbar-button-checked", a[0] === now);
                b.setAttribute("aria-pressed", a[0] === now ? "true" : "false");
            }
        });
    };
    const alignButtons = function() {
        const source = document.getElementById("alignButton");
        if (!source || document.getElementById("ugf-d14-align-left")) {
            return;
        }
        ALIGN.forEach(function(a) {
            const b = toolbarButton("ugf-d14-align-" + a[0], "align-" + a[0], a[1] + " (" + (mac ? a[3] : a[3].replace("⌘", "Ctrl")) + ")");
            b.addEventListener("click", function() {
                align(a);
            });
            source.parentNode.insertBefore(b, source);
        });
        syncAlign();
        new MutationObserver(syncAlign).observe(source, { subtree: true, attributes: true, attributeFilter: ["class"], childList: true });
    };

    // ---- the Table menu ----------------------------------------------------------------
    const TABLE = [["Insert table", "grid"], null, ["Insert row above"], ["Insert row below"], ["Insert column left"], ["Insert column right"], null,
        ["Delete row"], ["Delete column"], ["Delete table"], null, ["Merge cells"], ["Unmerge cells"], null, ["Table properties..."]];
    let dd = null;
    const closeTable = function() {
        if (dd) {
            dd.style.display = "none";
        }
        const b = document.getElementById("ugf-d14-table-menu");
        if (b) {
            b.classList.remove("goog-control-open");
        }
    };
    const tableCommand = async function(label, anchor) {
        closeTable();
        const format = document.getElementById("docs-format-menu");
        const result = await runMenu(format, ["Table", label.replace(/\.\.\.$/, "")]);
        if (result === "disabled") {
            note("Put the cursor in a table first", anchor);
        } else if (result === "missing") {
            note("Google Docs has no “" + label.replace(/\.\.\.$/, "") + "” here", anchor);
        }
    };
    const insertTable = async function(anchor) {
        closeTable();
        const insert = document.getElementById("docs-insert-menu");
        const sub = await runMenu(insert, ["Table"], true);
        if (!sub || typeof sub === "string") {
            busy(false);
            note("Google Docs' table picker didn't open", anchor);
            return;
        }
        // Google's own size picker, shown where the period's was: beside the Table menu
        const r = anchor.getBoundingClientRect();
        sub.classList.add("ugf-d14-keep");
        sub.style.left = Math.round(r.left) + "px";
        sub.style.top = Math.round(r.bottom + 2) + "px";
        const t = setInterval(function() {
            if (!shown(sub)) {
                clearInterval(t);
                sub.classList.remove("ugf-d14-keep");
                busy(false);
            }
        }, 150);
    };
    const tableMenu = function() {
        const tools = document.getElementById("docs-tools-menu");
        if (!tools || document.getElementById("ugf-d14-table-menu")) {
            return;
        }
        const b = document.createElement("div");
        b.id = "ugf-d14-table-menu";
        b.className = "menu-button goog-control goog-inline-block";
        b.setAttribute("role", "menuitem");
        b.setAttribute("aria-haspopup", "true");
        b.textContent = "Table";
        tools.parentNode.insertBefore(b, tools.nextSibling);
        dd = document.createElement("div");
        dd.id = "ugf-d14-table-dd";
        dd.className = "goog-menu goog-menu-vertical";
        dd.setAttribute("role", "menu");
        dd.style.display = "none";
        TABLE.forEach(function(entry) {
            if (!entry) {
                const s = document.createElement("div");
                s.className = "goog-menuseparator";
                dd.appendChild(s);
                return;
            }
            const it = document.createElement("div");
            it.className = "goog-menuitem" + (entry[1] ? " goog-submenu" : "");
            it.setAttribute("role", "menuitem");
            it.appendChild(el("div", "goog-menuitem-content"));
            it.firstChild.textContent = entry[0];
            if (entry[1]) {
                const arrow = document.createElement("span");
                arrow.className = "ugf-d14-subarrow";
                arrow.textContent = "▸";
                it.firstChild.appendChild(arrow);
            }
            it.addEventListener("mouseenter", function() {
                it.classList.add("goog-menuitem-highlight");
            });
            it.addEventListener("mouseleave", function() {
                it.classList.remove("goog-menuitem-highlight");
            });
            it.addEventListener("mousedown", function(e) {
                e.preventDefault();
                e.stopPropagation();
            });
            it.addEventListener("click", function() {
                if (entry[1] === "grid") {
                    insertTable(b);
                } else {
                    tableCommand(entry[0], b);
                }
            });
            dd.appendChild(it);
        });
        document.body.appendChild(dd);
        b.addEventListener("mouseenter", function() {
            b.classList.add("goog-control-hover");
        });
        b.addEventListener("mouseleave", function() {
            b.classList.remove("goog-control-hover");
        });
        b.addEventListener("mousedown", function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (dd.style.display !== "none") {
                closeTable();
                return;
            }
            closeMenus();
            const r = b.getBoundingClientRect();
            dd.style.left = Math.round(r.left) + "px";
            dd.style.top = Math.round(r.bottom - 1) + "px";
            dd.style.display = "block";
            b.classList.add("goog-control-open");
        });
        document.addEventListener("mousedown", function(e) {
            if (dd.style.display !== "none" && !dd.contains(e.target) && e.target !== b) {
                closeTable();
            }
        }, true);
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape") {
                closeTable();
            }
        }, true);
    };

    let laidOutAt = 0;
    // ---- document tabs: today's feature, kept for documents that have more than one ------
    // (the period had no tabs, so a one-tab document keeps the period's editor). Google's tabs
    // panel is shown as it stands, in the grey beside the page, under a plain button of the
    // period's kind that shows and hides it (Gplex hides today's floating tab switcher, and
    // Google won't expand its docked panel from here).
    const TABS_KEY = "ugf-d14-tabs-hidden";
    const tabsHidden = function() {
        try {
            return window.localStorage.getItem(TABS_KEY) === "1";
        } catch (e) {
            return false;
        }
    };
    const docTabs = function() {
        const n = document.querySelectorAll(".left-sidebar-container .chapter-container").length;
        const many = n > 1;
        if (html.hasAttribute("ugf-d14-tabs") !== many) {
            html.toggleAttribute("ugf-d14-tabs", many);
            laidOutAt = 0;
        }
        html.toggleAttribute("ugf-d14-tabs-hidden", many && tabsHidden());
        let b = document.getElementById("ugf-d14-tabs-btn");
        if (!many) {
            if (b) {
                b.remove();
            }
            return;
        }
        const host = document.querySelector(".kix-appview-editor-container");
        if (!b && host) {
            b = el("div", "ugf-d14-tabs-btn");
            b.id = "ugf-d14-tabs-btn";
            b.setAttribute("role", "button");
            b.addEventListener("mousedown", function(e) {
                e.preventDefault();
            });
            b.addEventListener("click", function() {
                try {
                    window.localStorage.setItem(TABS_KEY, tabsHidden() ? "0" : "1");
                } catch (e) {}
                docTabs();
            });
            host.appendChild(b);
        }
        if (b) {
            const hidden = tabsHidden();
            b.textContent = "Tabs (" + n + ")";
            b.setAttribute("data-tooltip", hidden ? "Show this document's tabs" : "Hide the tabs");
        }
    };

    const relayout = function() {
        const ed = document.getElementById("docs-editor");
        const w = ed ? ed.getBoundingClientRect().width : 0;
        if (w && w !== laidOutAt) {
            laidOutAt = w;
            window.dispatchEvent(new Event("resize"));
        }
    };

    // ---- the home list: the "Start a new document" strip of autumn 2015 ------------------
    // Blank and Google's own templates on a dark band under the blue bar, MORE for the gallery.
    // The templates are the ones Google's page offers (hidden under Gplex's list); a click opens
    // one the way a click on Google's own tile does.
    const TEMPLATE_GALLERY = "https://docs.google.com/templates";
    // Google's own gallery, read from its page under Gplex's list: its categories in order,
    // each with its templates (the first, "Recently used", is the collapsed row). Add-on
    // templates (other companies', which the period's gallery didn't have) are left out.
    const googleGallery = function() {
        const cats = [];
        document.querySelectorAll(".docs-homescreen-templates-gallery .docs-homescreen-grid-container").forEach(function(sec) {
            if (sec.closest("#ugf-docs-home")) {
                return;
            }
            const name = ((sec.querySelector(".docs-homescreen-grid-header-title") || {}).textContent || "").trim();
            const items = [];
            sec.querySelectorAll(".docs-homescreen-templates-templateview").forEach(function(t) {
                const title = ((t.querySelector("[class*='templateview-title']") || {}).textContent || "").trim();
                const style = ((t.querySelector("[class*='templateview-style']") || {}).textContent || "").trim();
                if (!title || /^blank/i.test(title) || /add-on/i.test(t.textContent || "") || /^by /i.test(style)) {
                    return;
                }
                const img = t.querySelector("img");
                items.push({ el: t, title: title, style: style, img: img ? img.src : "" });
            });
            if (items.length) {
                cats.push({ name: name, items: items });
            }
        });
        return cats;
    };
    const openTemplate = function(t) {
        let target = t.el && t.el.isConnected ? t.el : null;
        if (!target) {
            target = [].find.call(document.querySelectorAll(".docs-homescreen-templates-templateview"), function(x) {
                return !x.closest("#ugf-docs-home") &&
                    ((x.querySelector("[class*='templateview-title']") || {}).textContent || "").trim() === t.title &&
                    ((x.querySelector("[class*='templateview-style']") || {}).textContent || "").trim() === t.style;
            });
        }
        if (!target) {
            window.location.href = TEMPLATE_GALLERY;
            return;
        }
        try {
            target.focus();
        } catch (e) {}
        press(target);
        // and the keyboard's way in, which the list also answers
        setTimeout(function() {
            if (document.visibilityState === "visible" && document.getElementById("ugf-docs-home")) {
                ["keydown", "keyup"].forEach(function(type) {
                    target.dispatchEvent(new KeyboardEvent(type, { bubbles: true, cancelable: true, key: "Enter", code: "Enter", keyCode: 13, which: 13 }));
                });
            }
        }, 400);
    };
    let stripKey = "";
    let galleryOpen = false;
    const setGallery = function(open) {
        galleryOpen = open;
        stripKey = "";
        templateStrip();
        const content = document.querySelector("#ugf-docs-home .content");
        if (content) {
            content.scrollTop = 0;
        }
    };
    // Slides' gallery opened like a drawer: the dark band grew down over the list while the
    // Google bar slid up out of sight (and back again on ←), in about a third of a second
    const DRAWER_MS = 350;
    let collapsedHeight = 0;
    const animateGallery = function(open) {
        const shell = document.getElementById("ugf-docs-home");
        const content = shell && shell.querySelector(".content");
        const app = HOME_APPS[shell ? shell.getAttribute("app") : ""];
        const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let strip = document.getElementById("ugf-d14-tpl");
        if (!content || !app || !app.fullPage || !strip || reduce || galleryAnimating) {
            setGallery(open);
            return;
        }
        content.scrollTop = 0;
        const grow = function(from, to, done) {
            strip.style.overflow = "hidden";
            strip.style.maxHeight = from + "px";
            strip.getBoundingClientRect();
            strip.style.transition = "max-height " + DRAWER_MS + "ms cubic-bezier(.4, 0, .2, 1)";
            strip.style.maxHeight = to + "px";
            setTimeout(function() {
                strip.style.overflow = "";
                strip.style.maxHeight = "";
                strip.style.transition = "";
                done();
            }, DRAWER_MS + 40);
        };
        if (open) {
            collapsedHeight = strip.getBoundingClientRect().height;
            galleryOpen = true;
            stripKey = "";
            templateStrip();
            strip = document.getElementById("ugf-d14-tpl");
            shell.classList.add("ugf-d14-anim");
            galleryAnimating = true;
            grow(collapsedHeight, content.clientHeight, function() {
                galleryAnimating = false;
                shell.classList.remove("ugf-d14-anim");
            });
        } else {
            galleryAnimating = true;
            shell.classList.add("ugf-d14-anim");
            shell.removeAttribute("ugf-d14-gallery");
            const bar = document.getElementById("ugf-d14-galbar");
            if (bar) {
                bar.remove();
            }
            grow(content.clientHeight, collapsedHeight || 242, function() {
                galleryAnimating = false;
                shell.classList.remove("ugf-d14-anim");
                galleryOpen = false;
                stripKey = "";
                templateStrip();
            });
        }
    };
    // Slides' unfolded gallery took the whole page: a "← Start a new presentation" bar in
    // place of the Google bar and the app bar, and nothing but the gallery under it
    const galleryPage = function(shell, app) {
        const on = !!(shell && app && app.fullPage && galleryOpen);
        let bar = document.getElementById("ugf-d14-galbar");
        if (shell) {
            shell.toggleAttribute("ugf-d14-gallery", on);
        }
        if (!on) {
            if (bar) {
                bar.remove();
            }
            return;
        }
        const appbar = shell.querySelector(".appbar");
        if (bar && bar.parentNode === shell && (!appbar || appbar.nextElementSibling === bar)) {
            return;
        }
        if (bar) {
            bar.remove();
        }
        bar = el("div");
        bar.id = "ugf-d14-galbar";
        const back = el("span", "back");
        back.setAttribute("role", "button");
        back.setAttribute("aria-label", "Back");
        back.setAttribute("data-tooltip", "Back");
        back.addEventListener("click", function() {
            animateGallery(false);
        });
        const t = el("span", "t");
        t.textContent = "Start a new " + app.noun;
        bar.append(back, t);
        if (appbar) {
            appbar.after(bar);
        } else {
            shell.insertBefore(bar, shell.firstChild);
        }
    };
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && galleryOpen && document.getElementById("ugf-d14-galbar")) {
            animateGallery(false);
        }
    });
    let galleryAnimating = false;
    const templateStrip = function() {
        if (galleryAnimating) {
            return;
        }
        const shell = document.getElementById("ugf-docs-home");
        const content = shell && shell.querySelector(".content");
        let strip = document.getElementById("ugf-d14-tpl");
        // only from autumn 2015, when the strip came: Gplex's list then carries the Google
        // logo of 1 September 2015 (late 2015 and 2016); not over search results either
        const late2015 = !!(shell && shell.querySelector(".gtop .glogo img.n"));
        const app = HOME_APPS[shell ? shell.getAttribute("app") : ""];
        if (!content || !late2015 || !app || new URLSearchParams(window.location.search).get("q")) {
            if (strip) {
                strip.remove();
            }
            galleryPage(shell, null);
            return;
        }
        galleryPage(shell, app);
        const cats = googleGallery();
        const recent = (cats[0] ? cats[0].items : []).slice(0, app.recent);
        const more = galleryOpen ? cats.slice(1) : [];
        const key = (galleryOpen ? "open" : "shut") + "/" + [{ items: recent }].concat(more).map(function(c) {
            return (c.name || "") + ":" + c.items.map(function(t) {
                return t.title + "|" + t.style + "|" + t.img;
            }).join(",");
        }).join("/");
        // Gplex redraws its list: put the strip back when it goes, rebuild when the templates change
        if (strip && strip.parentNode === content && content.firstElementChild === strip && key === stripKey) {
            return;
        }
        stripKey = key;
        if (strip) {
            strip.remove();
        }
        strip = el("div");
        strip.id = "ugf-d14-tpl";
        strip.classList.toggle("open", galleryOpen);
        const inner = el("div", "tin");
        const head = el("div", "thead");
        const title = el("span", "tt");
        title.textContent = "Start a new " + app.noun;
        const toggle = el("a", "more");
        toggle.href = "#";
        toggle.textContent = galleryOpen ? "LESS" : "MORE";
        toggle.appendChild(el("span", "ar"));
        toggle.addEventListener("click", function(e) {
            e.preventDefault();
            animateGallery(!galleryOpen);
        });
        head.append(title, toggle);
        const tile = function(t) {
            const a = el("a", "tile");
            const pg = el("span", "pg");
            const lb = el("span", "lb");
            lb.textContent = t.title;
            a.append(pg, lb);
            if (t.style) {
                const st = el("span", "st");
                st.textContent = t.style;
                a.appendChild(st);
            }
            a.href = "#";
            a.title = t.title + (t.style ? " (" + t.style + ")" : "");
            if (t.img) {
                const img = el("img");
                img.src = t.img;
                img.alt = "";
                pg.appendChild(img);
            }
            a.addEventListener("click", function(e) {
                e.preventDefault();
                openTemplate(t);
            });
            return a;
        };
        const row = function(items, withBlank) {
            const tiles = el("div", "tiles");
            if (withBlank) {
                const blank = el("a", "tile blank");
                blank.href = app.create;
                blank.target = "_blank";
                const pg = el("span", "pg");
                pg.appendChild(el("span", "plus"));
                const lb = el("span", "lb");
                lb.textContent = "Blank";
                blank.append(pg, lb);
                tiles.appendChild(blank);
            }
            items.forEach(function(t) {
                tiles.appendChild(tile(t));
            });
            // Google's templates come a moment after the page: keep their places meanwhile,
            // so the strip doesn't grow under the pointer when they arrive
            if (withBlank) {
                for (let i = items.length; i < app.recent; i++) {
                    const ph = el("span", "tile ph");
                    ph.appendChild(el("span", "pg"));
                    tiles.appendChild(ph);
                }
            }
            return tiles;
        };
        inner.append(head);
        // unfolded, Slides' gallery names its first row too
        if (galleryOpen && app.recentTitle) {
            const h = el("div", "cat first");
            h.textContent = app.recentTitle;
            inner.appendChild(h);
        }
        inner.appendChild(row(recent, true));
        more.forEach(function(c) {
            const h = el("div", "cat");
            h.textContent = c.name;
            inner.append(h, row(c.items, false));
        });
        strip.appendChild(inner);
        // inside the list, so it scrolls away with it under the blue bar
        content.insertBefore(strip, content.firstChild);
    };

    // ---- the list's "Owned by anyone ▾": Google's own owner filter, from the list's header --
    const OWNERS = ["Owned by anyone", "Owned by me", "Not owned by me"];
    const googleOwnerButton = function() {
        return [].find.call(document.querySelectorAll(".docs-homescreen-owner-filter-button"), function(b) {
            return !b.closest("#ugf-docs-home");
        }) || null;
    };
    // what Google's filter is set to (its menu keeps the ticked option once built)
    let ownerNow = OWNERS[0];
    const readOwner = function() {
        const picked = [].find.call(document.querySelectorAll(".goog-menu .goog-option-selected"), function(it) {
            return OWNERS.indexOf((it.textContent || "").trim()) > -1;
        });
        if (picked) {
            ownerNow = picked.textContent.trim();
        }
        return ownerNow;
    };
    const setOwner = async function(label, anchorEl) {
        const button = googleOwnerButton();
        if (!button) {
            note("Google Docs' owner filter isn't on this page", anchorEl);
            return;
        }
        busy(true);
        try {
            const before = openMenus();
            pressOpen(button);
            const item = await until(function() {
                return findItem(label, openMenus().filter(function(m) {
                    return before.indexOf(m) === -1;
                }));
            }, 1200);
            if (item) {
                release(item);
                ownerNow = label;
            } else {
                note("Google Docs' owner filter didn't open", anchorEl);
            }
            await wait(60);
            closeMenus();
        } finally {
            busy(false);
        }
    };
    let ownerMenu = null;
    const closeOwnerMenu = function() {
        if (ownerMenu) {
            ownerMenu.remove();
            ownerMenu = null;
        }
        document.querySelectorAll(".ugf-d14-own.open").forEach(function(b) {
            b.classList.remove("open");
        });
    };
    const ownerFilter = function() {
        const head = document.querySelector("#ugf-docs-home .content .rhead");
        if (!head || !googleOwnerButton()) {
            return;
        }
        const now = readOwner();
        let own = head.querySelector(".ugf-d14-own");
        if (!own) {
            own = el("span", "ugf-d14-own");
            own.setAttribute("role", "button");
            own.appendChild(el("span", "tx"));
            own.appendChild(el("span", "ar"));
            own.addEventListener("click", function(e) {
                e.stopPropagation();
                if (ownerMenu) {
                    closeOwnerMenu();
                    return;
                }
                ownerMenu = el("div", "ugf-d14-ownmenu");
                OWNERS.forEach(function(label) {
                    const it = el("div", "it" + (label === readOwner() ? " on" : ""));
                    it.textContent = label;
                    it.addEventListener("click", function(ev) {
                        ev.stopPropagation();
                        closeOwnerMenu();
                        own.firstChild.textContent = label;
                        setOwner(label, own);
                    });
                    ownerMenu.appendChild(it);
                });
                // inside Gplex's list, which lies over Google's page (as its own sort menu does)
                const r = own.getBoundingClientRect();
                ownerMenu.style.top = Math.round(r.bottom + 6) + "px";
                ownerMenu.style.right = Math.round(window.innerWidth - r.right) + "px";
                (document.getElementById("ugf-docs-home") || document.body).appendChild(ownerMenu);
                own.classList.add("open");
            });
            head.appendChild(own);
        }
        if (own.firstChild.textContent !== now) {
            own.firstChild.textContent = now;
        }
    };
    // a click anywhere else shuts the menu (the button itself toggles it)
    document.addEventListener("click", function(e) {
        if (ownerMenu && !ownerMenu.contains(e.target) && !(e.target.closest && e.target.closest(".ugf-d14-own"))) {
            closeOwnerMenu();
        }
    }, true);

    const start = function() {
        if (CSS && !document.getElementById("ugf-d14-styles")) {
            const style = document.createElement("style");
            style.id = "ugf-d14-styles";
            style.textContent = CSS;
            (document.head || html).appendChild(style);
        }
        const keepLast = function() {
            const style = document.getElementById("ugf-d14-styles");
            if (style && document.head && document.head.lastElementChild !== style) {
                document.head.appendChild(style);
            }
        };
        const steps = homeWanted() ? [["style", keepLast], ["templates", templateStrip], ["owner", ownerFilter]] :
            slidesWanted() ? [["style", keepLast], ["relayout", relayout]] :
            [["style", keepLast], ["align", alignButtons], ["table", tableMenu], ["tabs", docTabs], ["relayout", relayout]];
        const tick = function() {
            steps.forEach(function(step) {
                try {
                    step[1]();
                } catch (e) {
                    report(step[0], e);
                }
            });
        };
        tick();
        setInterval(tick, 1000);
        // on the list, at once whenever Gplex draws it (so nothing appears a beat late)
        if (homeWanted()) {
            let queued = false;
            new MutationObserver(function() {
                if (queued) {
                    return;
                }
                queued = true;
                requestAnimationFrame(function() {
                    queued = false;
                    tick();
                });
            }).observe(document.documentElement, { childList: true, subtree: true });
        }
    };
    let started = false;
    const tryStart = function() {
        if (!started && (wanted() || homeWanted() || slidesWanted())) {
            started = true;
            watch.disconnect();
            clearInterval(t);
            start();
        }
    };
    const watch = new MutationObserver(tryStart);
    watch.observe(html, { attributes: true, attributeFilter: ["gplex-docs", "gplex-docs-home"] });
    const t = setInterval(tryStart, 300);
    setTimeout(function() {
        clearInterval(t);
        watch.disconnect();
    }, 60000);
    tryStart();
})();
