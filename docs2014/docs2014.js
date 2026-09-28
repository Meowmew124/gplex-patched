// ---- Gplex Docs 2014 fixes (gplex-patched) ----------------------------------------
// The 2014 editor over today's: the Table menu between Tools and Add-ons, the four
// alignment buttons, and a relayout once the side panel's empty gutter is given back.
// Both drive Google's own menus out of sight, so every command is still Google's.
(function ugfDocs2014Fixes() {
    "use strict";
    if (window.location.host !== "docs.google.com" || !/^\/document\//.test(window.location.pathname) || window.top !== window.self) {
        return;
    }
    const CSS = /*__UGF_DOCS2014_CSS__*/ null;
    const html = document.documentElement;
    const wanted = function() {
        return html.getAttribute("gplex-docs") === "d2014";
    };
    // the Docs list (Gplex draws it as #ugf-docs-home)
    const homeWanted = function() {
        return html.getAttribute("gplex-docs-home") === "d2014";
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
    const googleTemplates = function() {
        const out = [];
        document.querySelectorAll(".docs-homescreen-templates-templateview").forEach(function(t) {
            if (t.closest("#ugf-docs-home")) {
                return;
            }
            const title = ((t.querySelector("[class*='templateview-title']") || {}).textContent || "").trim();
            if (!title || /^blank/i.test(title) || out.some(function(x) {
                return x.title === title;
            })) {
                return;
            }
            const img = t.querySelector("img");
            out.push({ title: title, style: ((t.querySelector("[class*='templateview-style']") || {}).textContent || "").trim(), img: img ? img.src : "" });
        });
        return out;
    };
    const openTemplate = function(title) {
        const t = [].find.call(document.querySelectorAll(".docs-homescreen-templates-templateview"), function(x) {
            return !x.closest("#ugf-docs-home") && ((x.querySelector("[class*='templateview-title']") || {}).textContent || "").trim() === title;
        });
        if (!t) {
            window.location.href = TEMPLATE_GALLERY;
            return;
        }
        try {
            t.focus();
        } catch (e) {}
        press(t);
        // and the keyboard's way in, which the list also answers
        setTimeout(function() {
            if (document.visibilityState === "visible" && document.getElementById("ugf-docs-home")) {
                ["keydown", "keyup"].forEach(function(type) {
                    t.dispatchEvent(new KeyboardEvent(type, { bubbles: true, cancelable: true, key: "Enter", code: "Enter", keyCode: 13, which: 13 }));
                });
            }
        }, 400);
    };
    let stripKey = "";
    const templateStrip = function() {
        const shell = document.getElementById("ugf-docs-home");
        const content = shell && shell.querySelector(".content");
        let strip = document.getElementById("ugf-d14-tpl");
        // not over search results, as the period's list had it
        if (!content || new URLSearchParams(window.location.search).get("q")) {
            if (strip) {
                strip.remove();
            }
            return;
        }
        const tpls = googleTemplates().slice(0, 6);
        const key = tpls.map(function(t) {
            return t.title + "|" + t.img;
        }).join("/");
        // Gplex redraws its list: put the strip back when it goes, rebuild when the templates change
        if (strip && strip.parentNode === shell && strip.nextElementSibling === content && key === stripKey) {
            return;
        }
        stripKey = key;
        if (strip) {
            strip.remove();
        }
        strip = el("div");
        strip.id = "ugf-d14-tpl";
        const inner = el("div", "tin");
        const head = el("div", "thead");
        const title = el("span", "tt");
        title.textContent = "Start a new document";
        const more = el("a", "more");
        more.href = TEMPLATE_GALLERY;
        more.textContent = "MORE";
        more.appendChild(el("span", "ar"));
        head.append(title, more);
        const tiles = el("div", "tiles");
        const tile = function(label, style, cls) {
            const a = el("a", "tile" + (cls ? " " + cls : ""));
            const pg = el("span", "pg");
            const lb = el("span", "lb");
            lb.textContent = label;
            a.append(pg, lb);
            if (style) {
                const st = el("span", "st");
                st.textContent = style;
                a.appendChild(st);
            }
            return a;
        };
        const blank = tile("Blank", "", "blank");
        blank.href = "https://docs.google.com/document/create";
        blank.target = "_blank";
        blank.firstChild.appendChild(el("span", "plus"));
        tiles.appendChild(blank);
        tpls.forEach(function(t) {
            const a = tile(t.title, t.style);
            a.href = "#";
            a.title = t.title + (t.style ? " (" + t.style + ")" : "");
            if (t.img) {
                const img = el("img");
                img.src = t.img;
                img.alt = "";
                a.firstChild.appendChild(img);
            }
            a.addEventListener("click", function(e) {
                e.preventDefault();
                openTemplate(t.title);
            });
            tiles.appendChild(a);
        });
        inner.append(head, tiles);
        strip.appendChild(inner);
        shell.insertBefore(strip, content);
    };

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
        const steps = homeWanted() ? [["style", keepLast], ["templates", templateStrip]] :
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
    };
    const t = setInterval(function() {
        if (wanted() || homeWanted()) {
            clearInterval(t);
            start();
        }
    }, 300);
    setTimeout(function() {
        clearInterval(t);
    }, 60000);
})();
