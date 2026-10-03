"""Gmail fixes for Gplex Extended, applied by gplex-plus-link-patch.py.

Each edit is (name, old, new): `old` must appear exactly once in upstream's main.user.js.
An edit whose `new` text is already there is skipped, so re-running on a patched file is safe.
Every block added here is marked "(gplex-patched)".
"""

# helpers, added once just before ugfGmailRows()
HELPERS = r'''    // (gplex-patched) what Gmail's own sidebar says is unread in a mailbox ("Inbox 1792 unread")
    function ugfGmailNavCount(hash) {
        const h = String(hash || "").split("/")[0];
        if (!/^#(inbox|drafts|spam|starred|imp|label)/.test(h) || /^#starred/.test(h)) {
            return "";
        }
        const link = [].filter.call(document.querySelectorAll("a.J-Ke[href]"), function(a) {
            const href = a.getAttribute("href") || "";
            return !ugfGmailOurs(a) && href.slice(href.indexOf("#")) === hash;
        })[0];
        const m = link && /(\d[\d,.\s]*)\s+unread/i.exec(link.getAttribute("aria-label") || "");
        const n = m ? parseInt(m[1].replace(/[^\d]/g, ""), 10) : 0;
        return n ? n.toLocaleString() : "";
    }
    // (gplex-patched) Maximum page size, for real: Gmail's own setting, shown as it is and saved there
    function ugfGmailPageSizeSelect() {
        const sizes = [10, 15, 20, 25, 50, 100];
        let cur = 0;
        // a full first page says it for certain; failing that, what was last saved from here
        const c = ugfGmailCount();
        if (c) {
            const from = parseInt(String(c.from).replace(/[^\d]/g, ""), 10);
            const to = parseInt(String(c.to).replace(/[^\d]/g, ""), 10);
            const total = parseInt(String(c.total).replace(/[^\d]/g, ""), 10);
            if (from === 1 && (c.unknown || total > to)) {
                cur = to;
            }
        }
        cur = cur || parseInt(ugfGmailShared("UGF_GMAIL_PAGESIZE"), 10) || 50;
        if (sizes.indexOf(cur) < 0) {
            cur = 50;
        }
        return '<select id="ugf-gmail-pagesize" data-now="' + cur + '">' + sizes.map(function(n) {
            return '<option value="' + n + '"' + (n === cur ? " selected" : "") + ">" + n + "</option>";
        }).join("") + "</select>";
    }
    function ugfGmailSetPageSize(n, say, done) {
        const disarm = ugfGmailArm();
        const before = window.location.hash || "#inbox";
        const giveUp = function(msg) {
            disarm();
            say(msg);
            if (window.location.hash !== before) {
                window.location.hash = before;
            }
        };
        say("Saving\u2026");
        // Gmail's settings open in the layer Gplex hides, while Gplex's settings page stays on screen
        window.location.hash = "#settings/general";
        let tries = 0;
        const iv = setInterval(function() {
            tries++;
            const sel = [].filter.call(document.querySelectorAll("select"), function(s) {
                const has = function(v) {
                    return [].some.call(s.options, function(o) {
                        return o.value === v;
                    });
                };
                return !ugfGmailOurs(s) && has("15") && has("100");
            })[0];
            if (!sel) {
                if (tries > 40) {
                    clearInterval(iv);
                    giveUp("Gmail's settings did not open.");
                }
                return;
            }
            clearInterval(iv);
            try {
                sel.focus();
                sel.value = String(n);
                sel.dispatchEvent(new Event("input", { bubbles: true }));
                sel.dispatchEvent(new Event("change", { bubbles: true }));
            } catch (e) {}
            setTimeout(function() {
                const words = ugfGmailAlt(["Save Changes"]).map(function(w) {
                    return String(w).toLowerCase();
                });
                const save = [].filter.call(document.querySelectorAll('button, [role="button"]'), function(b) {
                    return !ugfGmailOurs(b) && !b.disabled && words.indexOf((b.textContent || "").replace(/\s+/g, " ").trim().toLowerCase()) > -1;
                })[0];
                if (!save) {
                    giveUp("Gmail did not offer Save Changes.");
                    return;
                }
                try {
                    if (typeof GM_setValue === "function") {
                        GM_setValue("UGF_GMAIL_PAGESIZE", String(n));
                    }
                } catch (e) {}
                ugfGmailRealClick(save);
                setTimeout(function() {
                    disarm();
                    say("Saved: " + n + " conversations per page.");
                    setTimeout(done, 600);
                }, 2500);
            }, 400);
        }, 250);
    }
    // (gplex-patched) Gmail's themes as the 2016 picker had them, from the pictures Google still serves: the plain
    // ones, the photo themes of 2011 (some changing with the day or the hour, as they did), and the featured photos
    function ugfGmailThemesHere() {
        return /^2016/.test(String(layout || ""));
    }
    function ugfGmailThemes() {
        if (ugfGmailThemes.list) {
            return ugfGmailThemes.list;
        }
        const hd = "https://ssl.gstatic.com/ui/v1/icons/mail/themes/";
        const day = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const planet = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
        const hour = function() {
            const h = new Date().getHours();
            return h < 6 ? "night" : h < 11 ? "morning" : h < 14 ? "noon" : h < 18 ? "afternoon" : h < 21 ? "evening" : "night";
        };
        const list = [
            { id: "light", name: "Light", plain: true }, { id: "dark", name: "Dark", plain: true },
            { id: "softgray", name: "Soft Gray", plain: true }, { id: "contrast", name: "High Contrast", plain: true }
        ];
        const classic = [
            ["beach", "Beach", function() { return hd + "beach2/bg_" + day[new Date().getDay()] + "_2560x1600.jpg"; }, hd + "beach2/bg_fri_1280x800.jpg"],
            ["mountains", "Mountains", function() { return hd + "mountains/bg_" + day[new Date().getDay()] + "_2560x1600.jpg"; }, hd + "mountains/bg_fri_1280x800.jpg"],
            ["phantasea", "Phantasea", function() { return hd + "phantasea/bg_" + hour() + "_2560x1600.jpg"; }, hd + "phantasea/bg_afternoon_1280x800.jpg"],
            ["planets", "Planets", function() { return hd + "planets/bg_" + planet[new Date().getDay()] + "_2560x1600.jpg"; }, hd + "planets/bg_moon_1280x800.jpg"],
            ["desk", "Desk", hd + "desk/bg2_2560x1600.jpg", hd + "desk/bg2_1280x800.jpg"],
            ["wood", "Wood", hd + "wood/bg_2560x1600.jpg", hd + "wood/bg_1280x800.jpg"],
            ["treetops", "Treetops", hd + "treetops/bg4_2560x1600.jpg", hd + "treetops/bg4_1280x800.jpg"],
            ["turf", "Turf", hd + "turf/bg3_2560x1600.jpg", hd + "turf/preview.png"],
            ["pebbles", "Pebbles", hd + "pebbles/bg4_2560x1600.jpg", hd + "pebbles/preview.png"],
            ["graffiti", "Graffiti", hd + "graffiti/bg_2560x1600.jpg", hd + "graffiti/bg_1440x900.jpg"],
            ["android", "Android", hd + "android/bg.jpg", hd + "android/previewHD.png"],
            ["ocean", "Ocean", hd + "ocean/bg.jpg", hd + "ocean/bg.jpg"]
        ];
        classic.forEach(function(c) {
            list.push({ id: c[0], name: c[1], img: c[2], thumb: c[3] });
        });
        for (let n = 1; n <= 257; n++) {
            list.push({ id: "f" + n, name: "", featured: n });
        }
        ugfGmailThemes.list = list;
        return list;
    }
    function ugfGmailThemeImg(t, thumb) {
        if (t.featured) {
            const base = "https://www.gstatic.com/mail/themes/featured/f" + t.featured + ".jpg";
            if (thumb) {
                return base + "=w380-h234-e365-k-no-nd";
            }
            const w = Math.min(2560, Math.round((window.screen.width || 1920) * (window.devicePixelRatio || 1)));
            return base + "=w" + w + "-h" + Math.round(w / 1.6) + "-e365-k-no-nd";
        }
        if (thumb && t.thumb) {
            return t.thumb;
        }
        return typeof t.img === "function" ? t.img() : (t.img || "");
    }
    // what is saved: the theme, its text background (light or dark), vignette and blur (0-100)
    function ugfGmailThemeState() {
        const n = function(k) {
            const v = parseInt(ugfGmailShared(k), 10);
            return isNaN(v) ? 0 : Math.max(0, Math.min(100, v));
        };
        return { id: ugfGmailShared("UGF_GMAIL_THEME") || "light", text: ugfGmailShared("UGF_GMAIL_THEME_TEXT") === "dark" ? "dark" : "light",
            vig: n("UGF_GMAIL_THEME_VIG"), blur: n("UGF_GMAIL_THEME_BLUR") };
    }
    function ugfGmailTheme() {
        const id = ugfGmailThemeState().id;
        return ugfGmailThemes().filter(function(t) {
            return t.id === id;
        })[0] || ugfGmailThemes()[0];
    }
    function ugfGmailApplyTheme(chrome, state) {
        const h = document.documentElement;
        const s = state || ugfGmailThemeState();
        const t = ugfGmailThemes().filter(function(x) {
            return x.id === s.id;
        })[0] || ugfGmailThemes()[0];
        ["ugf-gmail-theme", "ugf-gmail-text"].forEach(function(a) {
            h.removeAttribute(a);
        });
        ["--ugf-gmail-bg", "--ugf-gmail-blur", "--ugf-gmail-vig"].forEach(function(p) {
            h.style.removeProperty(p);
        });
        if (t.id === "light" || ugfGmailFeatures(ugfGmailEra()).settings.indexOf("Themes") < 0) {
            return;
        }
        if (t.plain) {
            h.setAttribute("ugf-gmail-theme", t.id);
            return;
        }
        h.setAttribute("ugf-gmail-theme", "photo");
        h.setAttribute("ugf-gmail-text", s.text);
        h.style.setProperty("--ugf-gmail-bg", 'url("' + ugfGmailThemeImg(t) + '")');
        h.style.setProperty("--ugf-gmail-blur", (s.blur / 100 * 24).toFixed(1) + "px");
        h.style.setProperty("--ugf-gmail-vig", (s.vig / 100 * 0.85).toFixed(2));
    }
    function ugfGmailSaveTheme(s) {
        try {
            if (typeof GM_setValue === "function") {
                GM_setValue("UGF_GMAIL_THEME", s.id);
                GM_setValue("UGF_GMAIL_THEME_TEXT", s.text);
                GM_setValue("UGF_GMAIL_THEME_VIG", String(s.vig));
                GM_setValue("UGF_GMAIL_THEME_BLUR", String(s.blur));
            }
        } catch (e) {}
        ugfGmailApplyTheme(ugfGmailChrome(ugfGmailEra()), s);
    }
    // (gplex-patched) "Pick your theme", the 2014-2016 window: pictures in a grid, Save and Cancel, and along the foot
    // the text background (Light or Dark), vignette and blur; what is picked shows behind it at once
    function ugfGmailThemePicker(onDone) {
        if (document.getElementById("ugf-gmail-themepick")) {
            return;
        }
        const esc = ugfEscapeHtml;
        const chrome = ugfGmailChrome(ugfGmailEra());
        const saved = ugfGmailThemeState();
        const now = { id: saved.id, text: saved.text, vig: saved.vig, blur: saved.blur };
        const scrim = document.createElement("div");
        scrim.id = "ugf-gmail-themepick";
        let grid = "";
        ugfGmailThemes().forEach(function(t) {
            const img = t.plain ? "" : ugfGmailThemeImg(t, true);
            grid += '<a href="#" class="tp-th' + (t.id === now.id ? " on" : "") + '" data-theme="' + esc(t.id) + '" data-plain="' + (t.plain ? t.id : "") + '"' +
                (t.name ? ' title="' + esc(t.name) + '"' : "") + ">" +
                (img ? '<img loading="lazy" alt="" src="' + esc(img) + '">' : "") +
                (t.plain || t.name ? '<span class="tp-name">' + esc(t.name) + "</span>" : "") + "</a>";
        });
        scrim.innerHTML = trusted_policy.createHTML(
            '<div class="tp-box" role="dialog" aria-label="Pick your theme">' +
                '<div class="tp-head">Pick your theme<a href="#" class="tp-x" title="Close">&times;</a></div>' +
                '<div class="tp-grid">' + grid + "</div>" +
                '<div class="tp-foot">' +
                    '<button class="tp-save">Save</button><button class="tp-cancel">Cancel</button>' +
                    '<span class="tp-sep"></span>' +
                    '<button class="tp-tool" data-tool="text" title="Text background"><b>A</b></button>' +
                    '<button class="tp-tool" data-tool="vig" title="Vignette"><i class="tp-vig"></i></button>' +
                    '<button class="tp-tool" data-tool="blur" title="Blur"><i class="tp-blur"></i></button>' +
                    '<div class="tp-pop" data-pop="text" hidden><div class="tp-poptitle">Text background</div>' +
                        '<div class="tp-seg"><button data-text="light">Light</button><button data-text="dark">Dark</button></div></div>' +
                    '<div class="tp-pop" data-pop="vig" hidden><div class="tp-poptitle">Vignette</div><input type="range" min="0" max="100" data-range="vig"></div>' +
                    '<div class="tp-pop" data-pop="blur" hidden><div class="tp-poptitle">Blur</div><input type="range" min="0" max="100" data-range="blur"></div>' +
                "</div>" +
            "</div>");
        // on <html>, beside the page Gplex hides
        document.documentElement.appendChild(scrim);
        const box = scrim.querySelector(".tp-box");
        const preview = function() {
            ugfGmailApplyTheme(chrome, now);
            const t = ugfGmailThemes().filter(function(x) {
                return x.id === now.id;
            })[0];
            // a plain theme has no picture to lay text, vignette or blur over
            box.querySelectorAll(".tp-tool").forEach(function(b) {
                b.disabled = !t || !!t.plain;
            });
            box.querySelectorAll(".tp-seg button").forEach(function(b) {
                b.classList.toggle("on", b.getAttribute("data-text") === now.text);
            });
            box.querySelectorAll("input[data-range]").forEach(function(r) {
                r.value = String(now[r.getAttribute("data-range")]);
            });
        };
        const closePops = function() {
            box.querySelectorAll(".tp-pop").forEach(function(p) {
                p.hidden = true;
            });
            box.querySelectorAll(".tp-tool").forEach(function(b) {
                b.classList.remove("open");
            });
        };
        const finish = function(keep) {
            if (keep) {
                ugfGmailSaveTheme(now);
            } else {
                ugfGmailApplyTheme(chrome, saved);
            }
            scrim.remove();
            if (typeof onDone === "function") {
                onDone();
            }
        };
        box.querySelectorAll(".tp-th").forEach(function(a) {
            a.addEventListener("click", function(ev) {
                ev.preventDefault();
                now.id = a.getAttribute("data-theme");
                box.querySelectorAll(".tp-th.on").forEach(function(o) {
                    o.classList.remove("on");
                });
                a.classList.add("on");
                closePops();
                preview();
            });
        });
        box.querySelectorAll(".tp-tool").forEach(function(b) {
            b.addEventListener("click", function(ev) {
                ev.preventDefault();
                const pop = box.querySelector('.tp-pop[data-pop="' + b.getAttribute("data-tool") + '"]');
                const was = !pop.hidden;
                closePops();
                if (!was) {
                    pop.hidden = false;
                    b.classList.add("open");
                    const r = b.getBoundingClientRect();
                    const f = box.querySelector(".tp-foot").getBoundingClientRect();
                    pop.style.left = Math.round(r.left - f.left + r.width / 2 - pop.offsetWidth / 2) + "px";
                }
            });
        });
        box.querySelectorAll(".tp-seg button").forEach(function(b) {
            b.addEventListener("click", function(ev) {
                ev.preventDefault();
                now.text = b.getAttribute("data-text");
                preview();
            });
        });
        box.querySelectorAll("input[data-range]").forEach(function(r) {
            r.addEventListener("input", function() {
                now[r.getAttribute("data-range")] = parseInt(r.value, 10) || 0;
                preview();
            });
        });
        box.querySelector(".tp-save").addEventListener("click", function() {
            finish(true);
        });
        box.querySelector(".tp-cancel").addEventListener("click", function() {
            finish(false);
        });
        box.querySelector(".tp-x").addEventListener("click", function(ev) {
            ev.preventDefault();
            finish(false);
        });
        scrim.addEventListener("mousedown", function(ev) {
            if (ev.target === scrim) {
                finish(false);
            } else if (!ev.target.closest(".tp-pop, .tp-tool")) {
                closePops();
            }
        });
        preview();
        const on = box.querySelector(".tp-th.on");
        if (on) {
            on.scrollIntoView({ block: "center" });
        }
    }
    // (gplex-patched) 2013-2016: "More" at the foot of the sidebar, as Gmail had it, holding Chats and the inbox
    // categories (in place of the "Chat / Set status here" box, a Hangouts list that never filled)
    function ugfGmailFoldNav(shell, chrome) {
        const nav = shell.querySelector("#ugf-gmail-nav");
        if (!nav || chrome !== "m2013" || nav.querySelector(".ugf-gmail-more")) {
            return;
        }
        const m = /^\/mail\/u\/(\d+)\//.exec(window.location.pathname || "");
        const box = document.createElement("div");
        box.className = "ugf-gmail-more";
        const item = function(text, href, cls) {
            const a = document.createElement("a");
            a.href = href;
            a.textContent = text;
            if (cls) {
                a.className = cls;
            }
            box.appendChild(a);
            return a;
        };
        const chats = item("Chats", "https://chat.google.com/u/" + (m ? m[1] : "0") + "/", "ugf-gmail-chats");
        chats.target = "_blank";
        chats.rel = "noopener";
        const head = document.createElement("div");
        head.className = "ugf-gmail-morehead";
        head.textContent = "Categories";
        box.appendChild(head);
        [["Social", "social"], ["Promotions", "promotions"], ["Updates", "updates"], ["Forums", "forums"]].forEach(function(c) {
            const a = item(c[0], ugfGmailMailUrl("#category/" + c[1]), "ugf-gmail-cat");
            if (ugfGmailListOf(window.location.hash) === "#category/" + c[1]) {
                a.classList.add("active");
            }
            a.addEventListener("click", function(ev) {
                if (ev.ctrlKey || ev.metaKey || ev.shiftKey) {
                    return;
                }
                ev.preventDefault();
                window.location.hash = "#category/" + c[1];
                setTimeout(ugfGmailRender, 900);
            });
        });
        const open = ugfGmailShared("UGF_GMAIL_MORE") === "1" || /^#category\//.test(window.location.hash || "");
        const tog = document.createElement("a");
        tog.href = "#";
        tog.className = "ugf-gmail-moretog";
        const label = function(on) {
            tog.textContent = on ? "Less " : "More ";
            const c = document.createElement("span");
            c.className = "caret";
            c.textContent = on ? "▴" : "▾";
            tog.appendChild(c);
        };
        label(open);
        box.hidden = !open;
        tog.addEventListener("click", function(ev) {
            ev.preventDefault();
            box.hidden = !box.hidden;
            label(!box.hidden);
            try {
                if (typeof GM_setValue === "function") {
                    GM_setValue("UGF_GMAIL_MORE", box.hidden ? "0" : "1");
                }
            } catch (e) {}
        });
        const chat = nav.querySelector("#ugf-gmail-chat");
        nav.insertBefore(tog, chat);
        nav.insertBefore(box, chat);
        if (chat) {
            chat.remove();
        }
    }
    function ugfGmailThemeCss() {
        const P = 'html[gplex-gmail][ugf-gmail-theme="photo"]';
        const PD = P + '[ugf-gmail-text="dark"]';
        const D = 'html[gplex-gmail][ugf-gmail-theme="dark"]';
        // photo and Dark alike: white words over the page, the toolbar's buttons lightened over it
        const PX = function(sel) {
            return P + " " + sel + ", " + D + " " + sel;
        };
        return [
            // More / Less, and what it holds
            "#ugf-gmail-nav .ugf-gmail-more[hidden] { display: none; }",
            "#ugf-gmail[chrome=\"m2013\"] #ugf-gmail-nav a.ugf-gmail-moretog { color: #222; }",
            "#ugf-gmail-nav .ugf-gmail-morehead { padding: 6px 0 0 31px; font-size: 13px; line-height: 28px; color: #222; }",
            "#ugf-gmail[chrome=\"m2013\"] #ugf-gmail-nav a.ugf-gmail-cat { padding-left: 44px; }",
            "#ugf-gmail-nav .ugf-gmail-moretog .caret { font-size: 10px; margin-left: 3px; color: #777; }",
            // Settings > Themes on the 2016 layout
            "#ugf-gmail-settheme { height: 29px; padding: 0 14px; border: 1px solid rgba(0,0,0,.1); border-radius: 2px; background: linear-gradient(#f5f5f5, #f1f1f1); color: #444; font: bold 11px arial, sans-serif; cursor: pointer; }",
            "#ugf-gmail-settheme:hover { border-color: #c6c6c6; box-shadow: 0 1px 1px rgba(0,0,0,.1); color: #222; }",
            // ---- Pick your theme, as the 2014-2016 window
            "#ugf-gmail-themepick { position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.25); font-family: arial, sans-serif; }",
            "#ugf-gmail-themepick .tp-box { width: min(1176px, calc(100vw - 80px)); height: min(766px, calc(100vh - 60px)); background: #fff; border: 1px solid #acacac; border-color: rgba(0,0,0,.33); box-shadow: 0 4px 16px rgba(0,0,0,.2); display: flex; flex-direction: column; }",
            "#ugf-gmail-themepick .tp-head { position: relative; padding: 38px 44px 20px; font-size: 20px; color: #222; }",
            "#ugf-gmail-themepick .tp-x { position: absolute; right: 22px; top: 26px; font-size: 26px; line-height: 1; color: #777; text-decoration: none; }",
            "#ugf-gmail-themepick .tp-x:hover { color: #222; }",
            "#ugf-gmail-themepick .tp-grid { flex: 1 1 auto; overflow-y: auto; padding: 4px 44px 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px 12px; align-content: start; border-top: 1px solid #ebebeb; }",
            // (each tile 263 x 162, as the window's were, held by its padding: the grid squeezed them flat otherwise)
            "#ugf-gmail-themepick .tp-th { position: relative; display: block; height: 0; padding-top: 61.6%; background: #eee center / cover no-repeat; outline: 3px solid transparent; outline-offset: 0; overflow: hidden; }",
            "#ugf-gmail-themepick .tp-th img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }",
            "#ugf-gmail-themepick .tp-th:hover { outline-color: rgba(77,144,254,.5); }",
            "#ugf-gmail-themepick .tp-th.on { outline-color: #4d90fe; }",
            "#ugf-gmail-themepick .tp-name { position: absolute; left: 0; right: 0; bottom: 0; padding: 4px 8px; font-size: 12px; color: #fff; background: linear-gradient(transparent, rgba(0,0,0,.55)); text-shadow: 0 1px 1px rgba(0,0,0,.5); }",
            "#ugf-gmail-themepick .tp-th[data-plain] .tp-name { color: #444; background: none; text-shadow: none; bottom: 6px; }",
            "#ugf-gmail-themepick .tp-th[data-plain=\"light\"] { background: #fff; box-shadow: inset 0 0 0 1px #ddd; }",
            "#ugf-gmail-themepick .tp-th[data-plain=\"dark\"] { background: linear-gradient(#222 0 26%, #fff 26% 100%); box-shadow: inset 0 0 0 1px #444; }",
            "#ugf-gmail-themepick .tp-th[data-plain=\"softgray\"] { background: linear-gradient(#d9d9d9 0 26%, #f5f5f5 26% 100%); box-shadow: inset 0 0 0 1px #ddd; }",
            "#ugf-gmail-themepick .tp-th[data-plain=\"contrast\"] { background: linear-gradient(#000 0 26%, #fff 26% 100%); box-shadow: inset 0 0 0 2px #000; }",
            "#ugf-gmail-themepick .tp-foot { position: relative; display: flex; align-items: center; gap: 12px; padding: 18px 44px 30px; border-top: 1px solid #ebebeb; }",
            "#ugf-gmail-themepick .tp-foot button { height: 38px; min-width: 98px; padding: 0 16px; border-radius: 2px; font: bold 13px arial, sans-serif; cursor: pointer; }",
            "#ugf-gmail-themepick .tp-save { border: 1px solid #3079ed; background: linear-gradient(#4d90fe, #4787ed); color: #fff; }",
            "#ugf-gmail-themepick .tp-save:hover { background: linear-gradient(#4d90fe, #357ae8); border-color: #2f5bb7; }",
            "#ugf-gmail-themepick .tp-cancel { border: 1px solid rgba(0,0,0,.1); background: linear-gradient(#f5f5f5, #f1f1f1); color: #444; }",
            "#ugf-gmail-themepick .tp-cancel:hover { border-color: #c6c6c6; color: #222; }",
            "#ugf-gmail-themepick .tp-sep { width: 1px; height: 28px; background: #e5e5e5; margin: 0 6px; }",
            "#ugf-gmail-themepick .tp-foot .tp-tool { min-width: 0; width: 74px; padding: 0; border: 1px solid transparent; background: none; color: #777; display: inline-flex; align-items: center; justify-content: center; }",
            "#ugf-gmail-themepick .tp-tool:hover:not(:disabled), #ugf-gmail-themepick .tp-tool.open { border-color: #c6c6c6; background: linear-gradient(#eee, #e0e0e0); box-shadow: inset 0 1px 2px rgba(0,0,0,.1); }",
            "#ugf-gmail-themepick .tp-tool:disabled { opacity: .35; cursor: default; }",
            "#ugf-gmail-themepick .tp-tool b { display: inline-block; width: 22px; height: 22px; line-height: 22px; border: 2px solid #777; border-radius: 2px; background: #999; color: #fff; font: bold 17px arial, sans-serif; text-align: center; }",
            "#ugf-gmail-themepick .tp-vig { display: inline-block; width: 28px; height: 18px; border: 2px solid #777; border-radius: 4px; background: radial-gradient(ellipse at center, #fff 45%, #999 100%); }",
            "#ugf-gmail-themepick .tp-blur { display: inline-block; width: 22px; height: 22px; background: radial-gradient(circle, #999 1.6px, transparent 2.2px) 0 0 / 5.5px 5.5px; opacity: .8; }",
            "#ugf-gmail-themepick .tp-pop { position: absolute; bottom: 74px; min-width: 200px; padding: 14px 20px 18px; background: #fff; border: 1px solid #ccc; border-color: rgba(0,0,0,.2); box-shadow: 0 2px 4px rgba(0,0,0,.2); }",
            "#ugf-gmail-themepick .tp-pop::after { content: ''; position: absolute; left: 50%; bottom: -9px; margin-left: -9px; border: 9px solid transparent; border-bottom: 0; border-top-color: #fff; filter: drop-shadow(0 1px 0 rgba(0,0,0,.2)); }",
            "#ugf-gmail-themepick .tp-pop[hidden] { display: none; }",
            "#ugf-gmail-themepick .tp-poptitle { font-size: 16px; color: #555; margin-bottom: 12px; white-space: nowrap; }",
            "#ugf-gmail-themepick .tp-seg { display: flex; }",
            "#ugf-gmail-themepick .tp-foot .tp-seg button { min-width: 98px; height: 36px; border: 1px solid #ccc; background: linear-gradient(#f5f5f5, #f1f1f1); color: #444; border-radius: 0; }",
            "#ugf-gmail-themepick .tp-seg button + button { border-left: 0; }",
            "#ugf-gmail-themepick .tp-seg button.on { background: linear-gradient(#eee, #e0e0e0); box-shadow: inset 0 1px 2px rgba(0,0,0,.1); color: #222; }",
            "#ugf-gmail-themepick .tp-pop input[type=range] { width: 180px; }",
            // the grid of themes (Settings > Themes, outside the 2016 layout)
            ".ugf-gmail-themes { display: flex; flex-wrap: wrap; gap: 10px; max-width: 620px; max-height: 420px; overflow-y: auto; padding: 2px; }",
            ".ugf-gmail-themes .theme { width: 108px; font-size: 11px; text-align: center; cursor: pointer; color: inherit; text-decoration: none; }",
            ".ugf-gmail-themes .theme i { position: relative; display: block; height: 64px; border: 1px solid #ccc; margin-bottom: 3px; overflow: hidden; background: #fff; }",
            ".ugf-gmail-themes .theme i img { width: 100%; height: 100%; object-fit: cover; display: block; }",
            ".ugf-gmail-themes .theme.on i { border: 2px solid #4d90fe; }",
            ".ugf-gmail-themes .theme[data-plain=\"dark\"] i { background: linear-gradient(#222 0 26%, #fff 26%); }",
            ".ugf-gmail-themes .theme[data-plain=\"softgray\"] i { background: linear-gradient(#d9d9d9 0 26%, #f5f5f5 26%); }",
            ".ugf-gmail-themes .theme[data-plain=\"contrast\"] i { background: linear-gradient(#000 0 26%, #fff 26%); border-color: #000; }",
            // Gplex's dark mode turns pages negative; a themed Gmail already has its own colours (and its photo
            // would come out negative), so it is left as it is
            "html[ugf-dark][gplex-gmail][ugf-gmail-theme] { filter: none !important; }",
            "html[ugf-dark][gplex-gmail][ugf-gmail-theme] :is(img, video, canvas, embed, object, iframe, picture, [ugf-dark-keep]) { filter: none !important; }",
            // ---- the themes on the page
            // the picture, its blur and its vignette: behind Gplex's page, in front of the Gmail it hides
            P + " body { background: #222 !important; }",
            P + " body::before { content: ''; position: fixed; inset: -40px; z-index: 1; pointer-events: none; background: var(--ugf-gmail-bg) center / cover no-repeat; filter: blur(var(--ugf-gmail-blur, 0px)); }",
            P + " body::after { content: ''; position: fixed; inset: 0; z-index: 1; pointer-events: none; background: radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,var(--ugf-gmail-vig, 0)) 100%); }",
            D + " body { background: #333 !important; }",
            PX("#ugf-gmail") + " { background: transparent !important; }",
            PX("#ugf-gmail[chrome] #ugf-gmail-top") + ", " + PX("#ugf-gmail[chrome] #ugf-gmail-nav") + ", " + PX("#ugf-gmail[chrome] #ugf-gmail-main") + " { background: transparent !important; border-bottom-color: transparent !important; }",
            PX("#ugf-gmail[chrome] #ugf-gmail-footer") + " { border-top: 0; }",
            // white over the picture, with a shadow to hold it off it
            PX("#ugf-gmail[chrome] #ugf-gmail-nav a") + ", " + PX("#ugf-gmail-nav .ugf-gmail-morehead") + ", " + PX("#ugf-gmail-gmark .wordmark") + ", " + PX("#ugf-gmail-gmark .caret") + ", " +
                PX("#ugf-gmail-nav .ugf-gmail-moretog .caret") + ", " + PX("#ugf-gmail-count") + ", " + PX("#ugf-gmail-footer") + ", " + PX("#ugf-gmail-footer a") + ", " + PX("#ugf-gmail-footer *") +
                " { color: #fff !important; text-shadow: 0 1px 1px rgba(0,0,0,.45); }",
            PX("#ugf-gmail[chrome] #ugf-gmail-nav a.active") + " { color: #fff !important; border-left-color: #fff !important; background: transparent !important; font-weight: bold; }",
            PX("#ugf-gmail[chrome] #ugf-gmail-nav a:hover") + " { background: rgba(255,255,255,.15) !important; }",
            PX("#ugf-gmail-count") + " { font-weight: bold; }",
            // the other eras' words on the page itself: the Google bar's links (2007-2010), search options,
            // the account links and +You, Select: All None..., Older/Oldest, Chat, and 2011's "Mail"
            [PX("#ugf-gmail-gbar a"), PX("#ugf-gmail-gbar b"), PX("#ugf-gmail-gbar span"), PX("#ugf-gmail-gbar-settings"), PX("#ugf-gmail-opts"), PX("#ugf-gmail-opts a"),
                PX("#ugf-gmail-filter"), PX("#ugf-gmail-filter a"), PX("#ugf-gmail-account > a"), PX("#ugf-gmail-account .plusname"), PX("#ugf-gmail-select"),
                PX("#ugf-gmail-select a"), PX("#ugf-gmail-count a"), PX("#ugf-gmail-count span"), PX("#ugf-gmail-chat"), PX("#ugf-gmail-chat *"), PX("#ugf-gmail-navtitle"),
                PX("#ugf-gmail-nav .ugf-gmail-navhead"), PX("#ugf-gmail-top > a"), PX("#ugf-gmail-searchrow a")].join(", ") +
                " { color: #fff !important; text-shadow: 0 1px 1px rgba(0,0,0,.45); }",
            PX("#ugf-gmail-chat") + " { border-top-color: rgba(255,255,255,.3) !important; }",
            // the white Google bar of 2007-2010 over the picture (the black one of 2011-2012 stays black)
            PX("#ugf-gmail[chrome=\"classic\"] #ugf-gmail-gbar") + " { background: rgba(0,0,0,.18) !important; border-color: rgba(255,255,255,.25) !important; }",
            // 2018 on (Material): its own grey and white panels and dark icons gave way to the picture
            [PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-body"), PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-logo"), PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-top"),
                PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-nav"), PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-main")].join(", ") + " { background: transparent !important; border-color: transparent !important; }",
            PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-logo img") + ", " + PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-nav a:not(#ugf-gmail-compose) :is(svg, img)") +
                " { filter: brightness(0) invert(1) drop-shadow(0 1px 1px rgba(0,0,0,.4)); }",
            PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-logo .hamburger i") + " { background: #fff !important; }",
            PX("#ugf-gmail[chrome] #ugf-gmail-nav a#ugf-gmail-compose.pill") + " { color: #3c4043 !important; text-shadow: none; }",
            PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-nav a.active") + " { background: rgba(255,255,255,.22) !important; border-left-color: transparent !important; }",
            PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-toolbar button.icon") + ", " + PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-thread-bar button.icon") +
                " { background: transparent !important; border-color: transparent !important; }",
            PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-toolbar button.icon svg") + ", " + PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-thread-bar button.icon svg") +
                " { fill: #fff !important; filter: drop-shadow(0 1px 1px rgba(0,0,0,.4)); }",
            PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-account .ic svg") + ", " + PX("#ugf-gmail[chrome=\"m2018\"] #ugf-gmail-account .ic svg *") +
                " { fill: #fff !important; }",
            PX("#ugf-gmail-logo img.google-mark") + " { filter: brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.5)); }",
            PX("#ugf-gmail-apps") + " { filter: brightness(0) invert(1); }",
            // the toolbar's buttons, lightened over the picture
            PX("#ugf-gmail-toolbar button") + ", " + PX("#ugf-gmail-toolbar .btn") + ", " + PX("#ugf-gmail-thread-bar button") + ", " + PX("#ugf-gmail-thread-nav button") +
                " { background: rgba(255,255,255,.75) !important; border-color: rgba(0,0,0,.12) !important; }",
            PX("#ugf-gmail-toolbar button:hover") + ", " + PX("#ugf-gmail-thread-bar button:hover") + " { background: rgba(255,255,255,.92) !important; }",
            // Compose: the light button of the themed pages, not the red one
            PX("#ugf-gmail[chrome] #ugf-gmail-nav a#ugf-gmail-compose.shot") + " { position: relative; display: block !important; width: 117px !important; height: 29px !important; box-sizing: border-box; " +
                "background: linear-gradient(#f8f8f8, #ececec) !important; border: 1px solid rgba(0,0,0,.12) !important; border-radius: 2px; text-shadow: none; }",
            PX("#ugf-gmail[chrome] #ugf-gmail-nav a#ugf-gmail-compose.shot:hover") + " { background: linear-gradient(#fff, #f1f1f1) !important; border-color: #c6c6c6 !important; opacity: 1; }",
            PX("#ugf-gmail-compose.shot img") + " { visibility: hidden; }",
            PX("#ugf-gmail-compose.shot::after") + " { content: 'COMPOSE'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: bold 11px/1 arial, sans-serif; color: #444; letter-spacing: .2px; }",
            // the list: light (or dark) and see-through, the picture showing through it
            PX("#ugf-gmail-list tr") + " { background: rgba(255,255,255,.62) !important; }",
            PX("#ugf-gmail-list tr.unread") + " { background: rgba(255,255,255,.8) !important; }",
            PX("#ugf-gmail-list tr:hover") + " { background: rgba(255,255,255,.9) !important; }",
            PX("#ugf-gmail-list") + " { border-collapse: collapse; box-shadow: 0 0 0 1px rgba(0,0,0,.18), 0 1px 3px rgba(0,0,0,.2); }",
            PX("#ugf-gmail-list td") + " { border-top: 1px solid rgba(0,0,0,.1) !important; border-bottom: 0 !important; }",
            PD + " #ugf-gmail-list tr { background: rgba(0,0,0,.5) !important; }",
            PD + " #ugf-gmail-list tr.unread { background: rgba(0,0,0,.66) !important; }",
            PD + " #ugf-gmail-list tr:hover { background: rgba(0,0,0,.75) !important; }",
            PD + " #ugf-gmail-list td { color: #fff !important; border-top-color: rgba(255,255,255,.1) !important; }",
            PD + " #ugf-gmail-list { box-shadow: 0 0 0 1px rgba(255,255,255,.15), 0 1px 3px rgba(0,0,0,.3); }",
            PD + " #ugf-gmail-list .snippet { color: rgba(255,255,255,.7) !important; }",
            PD + " #ugf-gmail-list td.ugf-gmail-star:not(.on) { color: rgba(255,255,255,.5) !important; }",
            PX("#ugf-gmail-list tr.checked") + " { background: rgba(255,249,196,.92) !important; }",
            // a conversation and the settings stay on white, to be read
            PX("#ugf-gmail-settings-body") + ", " + PX("#ugf-gmail-settings-tabs") + " { background: #fff; }",
            PX("#ugf-gmail-thread") + " { background: rgba(255,255,255,.82); padding: 0 12px 12px; box-shadow: 0 0 0 1px rgba(0,0,0,.18), 0 1px 3px rgba(0,0,0,.2); }",
            PD + " #ugf-gmail-thread { background: rgba(0,0,0,.6); color: #fff; }",
            PD + " #ugf-gmail-thread .ugf-gmail-msg-addr, " + PD + " #ugf-gmail-thread .ugf-gmail-msg-to, " + PD + " #ugf-gmail-thread .ugf-gmail-msg-right { color: rgba(255,255,255,.75) !important; }",
            PX("#ugf-gmail-thread #ugf-gmail-thread-bar") + " { background: transparent; }",
            PX("h1#ugf-gmail-subject") + " { background: transparent; }",
            // Soft Gray
            'html[gplex-gmail][ugf-gmail-theme="softgray"] body, html[gplex-gmail][ugf-gmail-theme="softgray"] #ugf-gmail, html[gplex-gmail][ugf-gmail-theme="softgray"] #ugf-gmail[chrome] #ugf-gmail-top, html[gplex-gmail][ugf-gmail-theme="softgray"] #ugf-gmail[chrome] #ugf-gmail-nav { background: #e9e9e9 !important; }',
            'html[gplex-gmail][ugf-gmail-theme="softgray"] #ugf-gmail[chrome] #ugf-gmail-main { background: #fff !important; padding: 0 12px 20px 12px; margin: 0 16px 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,.2); }',
            // High Contrast: black on white, every edge drawn
            'html[gplex-gmail][ugf-gmail-theme="contrast"] #ugf-gmail[chrome] #ugf-gmail-top { background: #000 !important; }',
            'html[gplex-gmail][ugf-gmail-theme="contrast"] #ugf-gmail[chrome] #ugf-gmail-main { box-shadow: none; border: 1px solid #000; padding: 0 12px 20px 12px; margin: 0 16px 16px 0; }',
            'html[gplex-gmail][ugf-gmail-theme="contrast"] #ugf-gmail-list tr { background: #fff !important; color: #000 !important; }',
            'html[gplex-gmail][ugf-gmail-theme="contrast"] #ugf-gmail-list td { border-bottom: 1px solid #000 !important; }',
            'html[gplex-gmail][ugf-gmail-theme="contrast"] #ugf-gmail-list td:not(.ugf-gmail-star):not(.ugf-gmail-imp) { color: #000 !important; }',
            'html[gplex-gmail][ugf-gmail-theme="contrast"] #ugf-gmail-list .snippet { color: #333 !important; }',
            'html[gplex-gmail][ugf-gmail-theme="contrast"] #ugf-gmail[chrome] #ugf-gmail-nav a { color: #000 !important; }',
            'html[gplex-gmail][ugf-gmail-theme="contrast"] #ugf-gmail[chrome] #ugf-gmail-nav a.active { color: #000 !important; border-left-color: #000 !important; text-decoration: underline; }',
            'html[gplex-gmail][ugf-gmail-theme="contrast"] #ugf-gmail-logo img.google-mark { filter: brightness(0) invert(1); }'
        ].join("\n");
    }
    // (gplex-patched) the sender column as Gmail fills it: "me, Greg (4)", "To: Greg" in Sent, "Draft"
    function ugfGmailFromCell(tr) {
        const cell = tr.querySelector(".yW");
        if (!cell) {
            return "";
        }
        const c = cell.cloneNode(true);
        let count = "";
        c.querySelectorAll(".bx0").forEach(function(n) {
            count = (n.textContent || "").trim();
            n.remove();
        });
        if (!count) {
            const n = tr.querySelector(".bx0");
            count = n ? (n.textContent || "").trim() : "";
        }
        const txt = (c.textContent || "").replace(/\s+/g, " ").trim();
        return txt ? txt + (count ? " (" + count + ")" : "") : "";
    }
    // (gplex-patched) Gmail's print view says "Thu, Sep 24, 2026 at 11:21 AM" and the conversation
    // "Sep 24, 2026, 11:21 AM": the same message is the same sender on the same day at the same minute
    function ugfGmailMsgTime(m) {
        const t = Date.parse(String(m.date || "").replace(/\s+at\s+/, " ").replace(/\u202f/g, " "));
        return isNaN(t) ? 0 : t;
    }
    function ugfGmailMsgKey(m) {
        const d = String(m.date || "");
        const day = d.match(/([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})/);
        const tm = d.match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
        if (!day || !tm) {
            return "";
        }
        return String(m.email || "").toLowerCase() + "|" + day[1].toLowerCase() + day[2] + day[3] + "|" + tm[1] + ":" + tm[2] + (tm[3] || "").toLowerCase();
    }
    // (gplex-patched) the print view's "To: Lakshmipathi K <klpathi@yahoo.com>, Akhil K <you@...>" as
    // Gmail writes it under a sender: "to Lakshmipathi, me"
    function ugfGmailShortTo(list) {
        const raw = String(list || "").replace(/\s*\b(Cc|Bcc):\s*/gi, ", ");
        if (raw.indexOf("@") < 0) {
            return raw || ugfT("to me");
        }
        const me = String(ugfGmailIdentity().email || "").toLowerCase();
        const out = [];
        (raw.match(/(?:"[^"]*"|<[^>]*>|[^,<"])+/g) || []).forEach(function(p) {
            const mail = (p.match(/<([^>]+)>/) || [])[1] || (p.indexOf("@") > -1 ? p.trim() : "");
            const name = p.replace(/<[^>]*>/g, "").replace(/"/g, "").trim();
            if (mail && mail.toLowerCase() === me) {
                out.push("me");
            } else if (name && name.indexOf("@") < 0) {
                out.push(name.split(" ")[0]);
            } else if (mail) {
                out.push(mail.split("@")[0]);
            }
        });
        return out.length ? "to " + out.join(", ") : ugfT("to me");
    }
    // (gplex-patched) your own photo, as Gmail shows it beside its reply box
    function ugfGmailMyPhoto() {
        const mine = [].filter.call(document.querySelectorAll("img.ajn.bofPge[src]"), function(i) {
            return !ugfGmailOurs(i);
        })[0];
        const src = mine ? mine.getAttribute("src") : ugfGmailIdentity().photo;
        return src ? '<span class="ugf-gmail-avatar sq has-photo"><img src="' + ugfEscapeHtml(src) + '" alt=""></span>'
            : '<span class="ugf-gmail-avatar sq"></span>';
    }
    // (gplex-patched) where the open conversation sits in the list it was opened from (Gmail's own
    // counter is the list's, "1-50 of 2,002", and its Newer and Older are greyed out for a
    // conversation opened from its address, as Gplex opens them)
    function ugfGmailThreadPos() {
        const o = ugfGmailOpenRow.list;
        if (!o || !o.items.length || ugfGmailListOf(window.location.hash) !== o.hash) {
            return null;
        }
        const tid = ugfGmailPrintTid();
        let i = -1;
        o.items.forEach(function(it, n) {
            if (i < 0 && tid && it.tid === tid) {
                i = n;
            }
        });
        return i < 0 ? null : { list: o.items, i: i, from: o.from, total: o.total };
    }
    function ugfGmailThreadCounter() {
        const p = ugfGmailThreadPos();
        return p ? (p.from + p.i) + " of " + (p.total || p.list.length) : "";
    }
    function ugfGmailPrintOpen() {
        const tid = ugfGmailPrintTid();
        const m = /^\/mail\/u\/\d+\//.exec(window.location.pathname || "");
        if (tid) {
            window.open((m ? m[0] : "/mail/u/0/") + "?ui=2&view=pt&search=all&th=" + tid, "_blank");
        } else {
            window.print();
        }
    }
    // (gplex-patched) The open conversation's own toolbar. Gmail leaves its buttons there unnamed (no
    // tooltip or label, only its action numbers), so looking them up by name found the list's
    // hidden toolbar instead, which acts on nothing.
    function ugfGmailThreadBtn(names) {
        const map = {
            "archive": '[act="7"]', "report spam": '[act="9"]', "delete": '[act="10"]',
            "mark as unread": '[act="2"]', "mark as read": '[act="1"]', "move to": ".ns",
            "labels": ".mw", "label as": ".mw", "more": ".nf", "more email options": ".nf", "more options": ".nf"
        };
        const usable = function(el) {
            return !ugfGmailOurs(el) && ugfGmailShown(el) && el.getAttribute("aria-disabled") !== "true";
        };
        for (let i = 0; i < names.length; i++) {
            const sel = map[String(names[i]).toLowerCase()];
            if (sel) {
                const hit = [].filter.call(document.querySelectorAll('div[role="button"]' + sel), usable)[0];
                if (hit) {
                    return hit;
                }
            }
        }
        const named = ugfGmailActionBtn(names);
        return named && ugfGmailShown(named) ? named : null;
    }
    // (gplex-patched) Works through the plans on the open conversation, as ugfGmailRunAction does on
    // ticked rows: a button, then the item of the menu it opens, then Apply for labels.
    function ugfGmailThreadAct(plans, after) {
        const disarm = ugfGmailArm();
        const finish = function() {
            ugfGmailConfirm(function() {
                setTimeout(disarm, 400);
                if (typeof after === "function") {
                    after();
                } else {
                    setTimeout(ugfGmailRender, 900);
                }
            });
        };
        const attempt = function(i) {
            const plan = plans[i];
            if (!plan) {
                disarm();
                console.log("[Gplex] Gmail: Gmail did not offer that on this conversation");
                return;
            }
            let waits = 0;
            const go = setInterval(function() {
                waits++;
                let btn = null;
                try {
                    btn = ugfGmailThreadBtn(plan.buttons);
                } catch (e) {}
                if (btn) {
                    clearInterval(go);
                    ugfGmailRealClick(btn);
                    if (!plan.menuItem) {
                        finish();
                        return;
                    }
                    ugfGmailMenuPick(plan.menuItem, function(ok) {
                        if (!ok) {
                            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", keyCode: 27, which: 27, bubbles: true }));
                            attempt(i + 1);
                            return;
                        }
                        if (plan.apply) {
                            ugfGmailMenuPick(ugfGmailAlt(["Apply"]), function() {
                                finish();
                            });
                        } else {
                            finish();
                        }
                    });
                    return;
                }
                if (waits > 10) {
                    clearInterval(go);
                    attempt(i + 1);
                }
            }, 150);
        };
        attempt(0);
    }
    // (gplex-patched) Gplex's own menus for what Gmail's would show in the layer Gplex hides
    function ugfGmailOwnLabels() {
        return ugfGmailLabels().filter(function(l) {
            return String(l.hash).indexOf("#label/") === 0;
        }).map(function(l) {
            return l.name;
        });
    }
    function ugfGmailMoreItems(inThread) {
        return (inThread ? ["Mark as unread"] : ["Mark as read", "Mark as unread"])
            .concat(["Mark as important", "Mark as not important", "Add star", "Remove star", "Mute"])
            .concat(inThread ? ["Print all"] : []);
    }
    function ugfGmailMorePlans(name) {
        return [{ buttons: [name] }, { buttons: ["More", "More email options", "More options"], menuItem: ugfGmailAlt([name]) }];
    }
    function ugfGmailPickMenu(anchor, chrome, head, names, onPick) {
        const shell = document.querySelector("#ugf-gmail");
        if (!shell || !anchor) {
            return;
        }
        if (document.querySelector("#ugf-gmail-movemenu")) {
            ugfGmailCloseMenus();
            return;
        }
        ugfGmailCloseMenus();
        const esc = ugfEscapeHtml;
        const menu = document.createElement("div");
        menu.id = "ugf-gmail-movemenu";
        menu.setAttribute("chrome", chrome || "");
        menu.innerHTML = trusted_policy.createHTML((head ? '<div class="head">' + esc(head) + "</div>" : "") +
            (names.length
                ? names.map(function(d, i) {
                    return '<a href="#" data-d="' + i + '" data-ugf-raw>' + esc(d) + "</a>";
                }).join("")
                : '<div class="none">No labels yet</div>'));
        document.body.appendChild(menu);
        const r = anchor.getBoundingClientRect();
        menu.style.left = Math.round(r.left) + "px";
        menu.style.top = Math.round(r.bottom + 2) + "px";
        const box = menu.getBoundingClientRect();
        if (box.right > window.innerWidth - 8) {
            menu.style.left = Math.max(8, Math.round(window.innerWidth - box.width - 8)) + "px";
        }
        menu.querySelectorAll("a[data-d]").forEach(function(a) {
            a.addEventListener("click", function(ev) {
                ev.preventDefault();
                const d = names[parseInt(a.getAttribute("data-d"), 10)];
                ugfGmailCloseMenus();
                if (d) {
                    onPick(d);
                }
            });
        });
        const away = function(ev) {
            if (!menu.contains(ev.target)) {
                ugfGmailCloseMenus();
                document.removeEventListener("mousedown", away);
            }
        };
        setTimeout(function() {
            document.addEventListener("mousedown", away);
        }, 0);
    }
    // (gplex-patched) Reply, Reply all and Forward through Gmail's own, at the foot of the open
    // conversation: the answer goes to whoever Gmail would send it to and stays in the conversation
    function ugfGmailReplySend(mode, data, status) {
        const disarm = ugfGmailArm();
        const cls = mode === "forward" ? "bkG" : mode === "replyall" ? "bkI" : "bkH";
        const links = [].filter.call(document.querySelectorAll(".ams." + cls), function(el) {
            return !ugfGmailOurs(el) && ugfGmailShown(el);
        });
        const link = links[links.length - 1];
        if (!link) {
            disarm();
            status("Gmail did not offer " + (mode === "forward" ? "Forward" : "Reply") + " here.");
            return;
        }
        const bodySel = 'div[aria-label="Message Body"][contenteditable="true"], div[g_editable="true"]';
        const toSel = 'input[peoplekit-id], textarea[name="to"], input[name="to"], input[aria-label^="To"]';
        const sendSel = 'div[role="button"].aoO, ' + ugfGmailAlt(["Send"]).map(function(w) {
            const v = String(w).replace(/"/g, '\\"');
            return 'div[role="button"][data-tooltip^="' + v + '"], div[aria-label^="' + v + '"]';
        }).join(", ");
        const before = [].slice.call(document.querySelectorAll(bodySel));
        ugfGmailRealClick(link);
        let tries = 0;
        const iv = setInterval(function() {
            tries++;
            const body = [].filter.call(document.querySelectorAll(bodySel), function(b) {
                return !ugfGmailOurs(b) && ugfGmailShown(b) && before.indexOf(b) === -1;
            })[0];
            if (!body) {
                if (tries > 40) {
                    clearInterval(iv);
                    disarm();
                    status("Gmail's reply box did not open in time.");
                }
                return;
            }
            clearInterval(iv);
            try {
                if (mode === "forward") {
                    let to = null;
                    for (let n = body, up = 0; n && !to && up < 25; up++, n = n.parentElement) {
                        if (n === document.body) {
                            break;
                        }
                        to = n.querySelector(toSel);
                    }
                    if (!to || !String(data.to || "").trim()) {
                        disarm();
                        status(to ? "Who should it go to?" : "Could not find Gmail's To box.");
                        return;
                    }
                    ugfGmailSetField(to, data.to);
                    ugfGmailCommitTo(to);
                }
                // what you wrote goes above what Gmail put there (the forwarded message, a signature)
                body.focus();
                body.innerHTML = trusted_policy.createHTML(ugfEscapeHtml(data.body || "").replace(/\n/g, "<br>") + "<br>" + body.innerHTML);
                body.dispatchEvent(new Event("input", { bubbles: true }));
            } catch (e) {
                disarm();
                console.log("[Gplex] Gmail: could not fill the reply box - " + e);
                status("Could not fill Gmail's reply box.");
                return;
            }
            const send = ugfGmailFindSend(body, sendSel);
            if (!send) {
                disarm();
                status("Could not find Gmail's Send button.");
                return;
            }
            status("Sending\u2026");
            setTimeout(function() {
                ugfGmailRealClick(send);
                let waited = 0;
                let nudged = false;
                const check = setInterval(function() {
                    waited++;
                    const outcome = ugfGmailSendOutcome();
                    const open = body.isConnected && ugfGmailShown(body);
                    if (outcome === "sent" || (!open && waited >= 6)) {
                        clearInterval(check);
                        disarm();
                        status("Message sent.");
                        setTimeout(function() {
                            const form = document.querySelector("#ugf-gmail-compose-form");
                            if (form) {
                                form.remove();
                            }
                            ugfGmailRender();
                        }, 900);
                        return;
                    }
                    if (open && !nudged && waited >= 4) {
                        nudged = true;
                        ugfGmailSendKey(body);
                        return;
                    }
                    if (waited > 30) {
                        clearInterval(check);
                        disarm();
                        status("Gmail did not send it. Its reply box is still open.");
                    }
                }, 300);
            }, 500);
        }, 250);
    }
    function ugfGmailFixCss() {
        return [
            ".ugf-gmail-avatar.has-photo { background: none !important; border-color: transparent !important; overflow: hidden; padding: 0; }",
            ".ugf-gmail-avatar.has-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }",
            ".ugf-gmail-msg-body .ajR { cursor: pointer; }",
            ".ugf-gmail-msg-body.ugf-trim-open .h5, .ugf-gmail-msg-body.ugf-trim-open .adL { display: block !important; }",
            "#ugf-gmail-subject .labelchip .x { cursor: pointer; }",
            "#ugf-gmail-compose-form input[readonly] { background: #f5f5f5; color: #555; }",
            // the Compose button is a picture of the 2014 one with a strip of white page down each side (4 of its
            // 238px) and white rounded corners, which showed on a theme
            "#ugf-gmail-compose.shot img { clip-path: inset(0 1.69% round 2px); }",
            // the reply button and its ▾ sat 5px apart (an icon and a character on one baseline)
            ".ugf-gmail-msg-right .grp > button { vertical-align: top; }",
            ".ugf-gmail-msg { position: relative; }",
            ".ugf-gmail-msg-to { cursor: pointer; }",
            ".ugf-gmail-details { position: absolute; z-index: 20; margin-top: -6px; background: #fff; border: 1px solid #ccc; border-color: rgba(0,0,0,.2); " +
                "box-shadow: 0 2px 4px rgba(0,0,0,.2); padding: 8px 12px; font-size: 12px; color: #222; max-width: 520px; }",
            ".ugf-gmail-details td { padding: 2px 4px; vertical-align: top; }",
            ".ugf-gmail-details td.k { color: #777; text-align: right; white-space: nowrap; }"
        ].join("\n");
    }
'''

THREAD_NEW = r'''    function ugfGmailThread() {
        const t = ugfGmailThreadLive();
        // (gplex-patched) Gmail folds a conversation's older messages, and a folded message's text is not
        // in the page at all (only its sender and a line of it): those came out with an empty body,
        // "to me", and the ones Gmail gathers under "n older messages" not at all. Gmail's print view
        // has every message in full, so the conversation is read from there too and filled in from it.
        const tid = ugfGmailPrintTid();
        const cache = ugfGmailPrintFetch.cache || {};
        if (tid && t.msgs.length) {
            const had = cache[tid];
            // (a reply has come in since it was read)
            if (had && !had.loading && had.msgs && had.msgs.length && had.msgs.length < t.msgs.length) {
                delete cache[tid];
            }
            ugfGmailPrintFetch(tid);
        }
        const got = tid && ugfGmailPrintFetch.cache ? ugfGmailPrintFetch.cache[tid] : null;
        if (!t.msgs.length) {
            if (got && got.msgs && got.msgs.length) {
                return { subject: got.subject || t.subject, msgs: got.msgs, chips: t.chips, counter: t.counter, danger: t.danger };
            }
            return t;
        }
        const norm = function(s) {
            return String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
        };
        // (the print page's subject can come with the account's name before it: "School Mail - AP Bio")
        const gs = norm(got && got.subject);
        const ts = norm(t.subject);
        // (all of it open in the page already: nothing to fill in)
        if (got && got.msgs && got.msgs.length === t.msgs.length && !t.msgs.some(function(m) {
            return !m.html;
        })) {
            return t;
        }
        if (!got || got.loading || !got.msgs || got.msgs.length < t.msgs.length ||
                (gs && ts && gs !== ts && gs.slice(-ts.length - 3) !== " - " + ts)) {
            return t;
        }
        // Gmail's own copy where it has the message open (its quoted part folds and unfolds there), the
        // print view's for the rest, and Gmail's photos for all
        const live = {};
        const photos = {};
        t.msgs.forEach(function(m) {
            const k = ugfGmailMsgKey(m);
            if (k) {
                live[k] = m;
            }
            if (m.photo && m.email) {
                photos[m.email.toLowerCase()] = m.photo;
            }
        });
        document.querySelectorAll("img.ajn[jid][src]").forEach(function(i) {
            const k = (i.getAttribute("jid") || "").toLowerCase();
            if (k && !photos[k] && !ugfGmailOurs(i)) {
                photos[k] = i.getAttribute("src");
            }
        });
        const msgs = got.msgs.map(function(p) {
            let l = live[ugfGmailMsgKey(p)];
            if (!l) {
                // (the print view can round the minute the other way)
                const pt = ugfGmailMsgTime(p);
                l = t.msgs.filter(function(m) {
                    return pt && m.email && p.email && m.email.toLowerCase() === p.email.toLowerCase() &&
                        Math.abs(ugfGmailMsgTime(m) - pt) <= 120000;
                })[0];
            }
            return {
                from: (l && l.from) || p.from,
                email: p.email || (l && l.email) || "",
                to: l && l.toKnown ? l.to : ugfGmailShortTo(p.to),
                toFull: String(p.to || "").indexOf("@") > -1 ? p.to : "",
                date: (l && l.date) || p.date,
                dateFull: p.date,
                html: l && l.html ? l.html : p.html,
                photo: (l && l.photo) || photos[String(p.email || "").toLowerCase()] || ""
            };
        });
        return { subject: t.subject || got.subject, msgs: msgs, chips: t.chips, counter: t.counter, danger: t.danger };
    }'''

THREAD_OLD = r'''    function ugfGmailThread() {
        const t = ugfGmailThreadLive();
        if (!t.msgs.length && ugfGmailPrintFetch.cache) {
            const got = ugfGmailPrintFetch.cache[ugfGmailPrintTid()];
            if (got && got.msgs && got.msgs.length) {
                return { subject: got.subject || t.subject, msgs: got.msgs, chips: t.chips, counter: t.counter, danger: t.danger };
            }
        }
        return t;
    }'''

THREAD_ACTS_OLD = r'''                if (act === "print") {
                    window.print();
                    return;
                }
                if (act === "delete") {
                    const inBin = /^#trash|^#spam/.test(window.location.hash || "");
                    const disarm = ugfGmailArm();
                    let btn = null;
                    try {
                        btn = ugfGmailActionBtn(inBin ? ["Delete forever", "Delete"]
                            : ["Delete", "Move to Trash", "Delete forever"]);
                    } catch (e) {}
                    if (!btn) {
                        disarm();
                        console.log("[Gplex] Gmail: Gmail did not offer Delete on this conversation");
                        return;
                    }
                    const listHash = ugfGmailListHash();
                    ugfGmailRealClick(btn);
                    ugfGmailConfirm(function() {
                        setTimeout(disarm, 400);
                        setTimeout(function() {
                            if (/^#[^/]+\/.+/.test(window.location.hash || "") &&
                                    window.location.hash !== listHash) {
                                window.location.hash = listHash;
                            }
                            ugfGmailRender();
                        }, 700);
                    });
                    return;
                }
                // Gmail's own words for each, in whatever language Gmail is set to
                const map = {
                    archive: ugfGmailLabelSel(["Archive"]),
                    spam: ugfGmailLabelSel(["Report spam"]),
                    notspam: ugfGmailLabelSel(["Not spam"]),
                    "delete": ugfGmailLabelSel(["Delete", "Delete forever"]),
                    unread: ugfGmailLabelSel(["Mark as unread"]),
                    snooze: ugfGmailLabelSel(["Snooze"]),
                    move: ugfGmailLabelSel(["Move to"]),
                    labels: ugfGmailLabelSel(["Labels"]),
                    more: ugfGmailLabelSel(["More"]),
                    star: '[aria-label*="Star"], .T-KT',
                    popout: ugfGmailLabelSel(["In new window"])
                };
                if (!map[act] || !ugfGmailClickReal(map[act])) {
                    return;
                }
                setTimeout(ugfGmailRender, 1200);'''

THREAD_ACTS_NEW = r'''                // (gplex-patched) Gmail's own print page of the conversation (it prints itself), not the Gplex page
                if (act === "print") {
                    ugfGmailPrintOpen();
                    return;
                }
                if (act === "popout") {
                    window.open(window.location.href, "_blank", "width=900,height=760");
                    return;
                }
                // (gplex-patched) Every action goes to the conversation's own toolbar (see ugfGmailThreadBtn):
                // by name they reached the list's hidden one and did nothing, and Delete then went back to
                // the list as if the conversation had gone. Move to, Labels and More are Gplex's own menus,
                // since Gmail's open in the layer Gplex hides.
                const leave = function() {
                    const listHash = ugfGmailListHash();
                    setTimeout(function() {
                        if (ugfGmailThreadOpen() && window.location.hash !== listHash) {
                            window.location.hash = listHash;
                        }
                        ugfGmailRender();
                    }, 700);
                };
                if (act === "move") {
                    ugfGmailMoveMenu(b, chrome, function(dest) {
                        ugfGmailThreadAct(ugfGmailMovePlans(dest), leave);
                    });
                    return;
                }
                if (act === "labels") {
                    ugfGmailPickMenu(b, chrome, "Label as", ugfGmailOwnLabels(), function(name) {
                        ugfGmailThreadAct([{ buttons: ["Labels", "Label as"], menuItem: [name], apply: true }]);
                    });
                    return;
                }
                if (act === "more") {
                    ugfGmailPickMenu(b, chrome, "", ugfGmailMoreItems(true), function(name) {
                        if (name === "Print all") {
                            ugfGmailPrintOpen();
                            return;
                        }
                        ugfGmailThreadAct(ugfGmailMorePlans(name), name === "Mark as unread" || name === "Mute" ? leave : null);
                    });
                    return;
                }
                if (act === "star") {
                    // the star of the conversation's last message, not the first star anywhere on the page
                    const stars = [].filter.call(document.querySelectorAll("div.adn .T-KT"), function(s) {
                        return !ugfGmailOurs(s) && ugfGmailShown(s);
                    });
                    if (stars.length) {
                        const disarmStar = ugfGmailArm();
                        ugfGmailRealClick(stars[stars.length - 1]);
                        setTimeout(disarmStar, 300);
                        b.classList.toggle("on");
                    }
                    return;
                }
                const inBin = /^#trash|^#spam/.test(window.location.hash || "");
                const plans = {
                    archive: [{ buttons: ["Archive"] }],
                    spam: [{ buttons: ["Report spam", "Report as spam", "Mark as spam"] }],
                    notspam: [{ buttons: ["Not spam"] }],
                    "delete": inBin ? [{ buttons: ["Delete forever", "Delete"] }] : [{ buttons: ["Delete", "Move to Trash"] }],
                    unread: [{ buttons: ["Mark as unread"] }]
                };
                if (!plans[act]) {
                    return;
                }
                ugfGmailThreadAct(plans[act], leave);'''

EDITS = [
    ("Gmail: helpers",
     "    function ugfGmailRows() {\n",
     HELPERS + "    function ugfGmailRows() {\n"),
    ("Gmail: the person's own labels from Gmail's sidebar",
     """        document.querySelectorAll('div[role="navigation"] a[href*="#"]').forEach(function(a) {""",
     """        // (gplex-patched) Gmail's sidebar is no longer inside role="navigation": its label links are a.J-Ke
        document.querySelectorAll('div[role="navigation"] a[href*="#"], a.J-Ke[href*="#label/"]').forEach(function(a) {"""),
    ("Gmail: the sidebar's real unread counts",
     """            const count = n.name === "Inbox" && unread ? unread : 0;""",
     """            // (gplex-patched) Gmail's own figure ("Inbox (1,792)"), not the unread rows on this page
            const count = ugfGmailNavCount(hash) || (n.name === "Inbox" && unread ? unread : 0);"""),
    ("Gmail: Maximum page size is a real setting",
     """            ["Maximum page size", "Show <b>50</b> conversations per page"],""",
     """            // (gplex-patched) a real setting: Gmail's own, saved there on Save Changes
            ["Maximum page size", "Show " + ugfGmailPageSizeSelect() + " conversations per page"],"""),
    ("Gmail: Save Changes saves the page size",
     """        main.querySelector("#ugf-gmail-settings-save").addEventListener("click", back);""",
     """        main.querySelector("#ugf-gmail-settings-save").addEventListener("click", function() {
            // (gplex-patched) the page size is Gmail's own setting: saved there, then back to the mail
            const ps = main.querySelector("#ugf-gmail-pagesize");
            const want = ps ? parseInt(ps.value, 10) : 0;
            if (!want || String(want) === ps.getAttribute("data-now")) {
                back();
                return;
            }
            let note = main.querySelector("#ugf-gmail-settings-status");
            if (!note) {
                note = document.createElement("span");
                note.id = "ugf-gmail-settings-status";
                note.style.marginLeft = "10px";
                main.querySelector("#ugf-gmail-settings-actions").appendChild(note);
            }
            ugfGmailSetPageSize(want, function(msg) {
                note.textContent = msg;
            }, back);
        });"""),
    ("Gmail: the search box keeps what was searched for",
     """                    decodeURIComponent(hashNow.slice(8).replace(/\\+/g, " "));""",
     """                    // (gplex-patched) the search alone: with a conversation open from the results the address
                    // goes on with its id (#search/greg+bork/FMfcgz...), which came into the box with it
                    decodeURIComponent(ugfGmailListOf(hashNow).slice(8).replace(/\\+/g, " "));"""),
    ("Gmail: the theme in use",
     """        h.setAttribute("gplex-gmail", era);""",
     """        h.setAttribute("gplex-gmail", era);
        ugfGmailApplyTheme(chrome);"""),
    ("Gmail: More in the sidebar",
     """        shell.querySelectorAll("#ugf-gmail-nav a[data-n]").forEach(function(a) {""",
     """        ugfGmailFoldNav(shell, chrome);
        shell.querySelectorAll("#ugf-gmail-nav a[data-n]").forEach(function(a) {"""),
    ("Gmail: themes that work",
     """            const themes = era === "g2018"
                ? ["Default", "Dark", "Soft Grey", "High Contrast", "Terminal", "Mountains", "Beach", "Tree"]
                : ["Classic", "Shiny", "Soft Grey", "High Contrast", "Ninja", "Tree", "Beach", "Planets"];
            let h = '<div class="ugf-gmail-themes">';
            themes.forEach(function(t, i) {
                h += '<span class="theme' + (i === 0 ? " on" : "") + '"><i></i>' + esc(t) + "</span>";
            });""",
     """            // (gplex-patched) themes that work: on the 2016 layout "Set Theme" opens Gmail's window of the time; on
            // the others the themes are here to pick from
            const cur = ugfGmailTheme();
            if (ugfGmailThemesHere() && era === "g2013") {
                return [["Themes", '<button id="ugf-gmail-settheme">Set Theme</button>' +
                    '<span class="note">' + esc(cur.plain || cur.name ? "Now: " + (cur.name || "") : "Now: a featured photo") + "</span>"]];
            }
            let ht = '<div class="ugf-gmail-themes">';
            ugfGmailThemes().forEach(function(t) {
                const img = t.plain ? "" : ugfGmailThemeImg(t, true);
                ht += '<a href="#" class="theme' + (t.id === cur.id ? " on" : "") + '" data-theme="' + esc(t.id) + '"' + (t.plain ? ' data-plain="' + t.id + '"' : "") + ">" +
                    "<i>" + (img ? '<img loading="lazy" alt="" src="' + esc(img) + '">' : "") + "</i>" + esc(t.name || "") + "</a>";
            });
            ht += "</div>";
            return [["Choose a theme", ht]];
            const themes = era === "g2018"
                ? ["Default", "Dark", "Soft Grey", "High Contrast", "Terminal", "Mountains", "Beach", "Tree"]
                : ["Classic", "Shiny", "Soft Grey", "High Contrast", "Ninja", "Tree", "Beach", "Planets"];
            let h = '<div class="ugf-gmail-themes">';
            themes.forEach(function(t, i) {
                h += '<span class="theme' + (i === 0 ? " on" : "") + '"><i></i>' + esc(t) + "</span>";
            });"""),
    ("Gmail: picking a theme",
     """        main.querySelectorAll('input[name="ugfcats"]').forEach(function(r) {""",
     """        // (gplex-patched) a theme from the grid takes at once
        main.querySelectorAll(".ugf-gmail-themes .theme[data-theme]").forEach(function(t) {
            t.addEventListener("click", function(ev) {
                ev.preventDefault();
                const st = ugfGmailThemeState();
                st.id = t.getAttribute("data-theme");
                ugfGmailSaveTheme(st);
                main.querySelectorAll(".ugf-gmail-themes .theme").forEach(function(o) {
                    o.classList.toggle("on", o === t);
                });
            });
        });
        // (gplex-patched) Set Theme: Gmail's "Pick your theme" window
        const setTheme = main.querySelector("#ugf-gmail-settheme");
        if (setTheme) {
            setTheme.addEventListener("click", function() {
                ugfGmailThemePicker(function() {
                    ugfGmailRender();
                });
            });
        }
        main.querySelectorAll('input[name="ugfcats"]').forEach(function(r) {"""),
    ("Gmail: list sender column as Gmail fills it (To: in Sent, reply counts)",
     '''                from: from ? (from.getAttribute("name") || from.textContent || "").trim() : "",''',
     '''                from: ugfGmailFromCell(tr) || (from ? (from.getAttribute("name") || from.textContent || "").trim() : ""),'''),
    ("Gmail: remember the list a conversation is opened from",
     r'''    function ugfGmailOpenRow(item) {
        // (6.5.5) remembered, so a conversation that doesn't open that way can be clicked open instead
        ugfGmailOpenRow.last = { item: item, at: Date.now(), clicked: false };
''',
     r'''    function ugfGmailOpenRow(item) {
        // (6.5.5) remembered, so a conversation that doesn't open that way can be clicked open instead
        ugfGmailOpenRow.last = { item: item, at: Date.now(), clicked: false };
        // (gplex-patched) and the list it was opened from, for Newer and Older and "3 of 1,795"
        if (!ugfGmailThreadOpen()) {
            const c = ugfGmailCount();
            ugfGmailOpenRow.list = {
                hash: ugfGmailListOf(window.location.hash),
                items: ugfGmailRows().map(function(r) {
                    return { tid: r.tid, rowId: r.rowId, subject: r.subject, row: r.row };
                }),
                from: c ? parseInt(String(c.from).replace(/[^\d]/g, ""), 10) || 1 : 1,
                total: c ? c.total : ""
            };
        }
'''),
    ("Gmail: only a conversation's id opens a conversation",
     r"""        return /#[^/]+\/[^/]+/.test(h);
    }""",
     r"""        // (gplex-patched) a conversation's id is long (FMfcgz..., or 16 hex): #settings/general or #inbox/themes
        // is not one, and waiting for it left an empty page
        if (/^#settings\//.test(h)) {
            return false;
        }
        return /#[^/]+\/(?:[^/]+\/)?[A-Za-z0-9_-]{16,}$/.test(h) || /#[^/]+\/[A-Za-z0-9_-]{16,}(?:\/|$)/.test(h);
    }"""),
    ("Gmail: print view id from the open conversation",
     r'''    function ugfGmailPrintTid() {
        const last = String(window.location.hash || "").split("/").pop();
        if (/^[0-9a-f]{12,20}$/.test(last)) {
            return last;
        }
''',
     r'''    function ugfGmailPrintTid() {
        const last = String(window.location.hash || "").split("/").pop();
        if (/^[0-9a-f]{12,20}$/.test(last)) {
            return last;
        }
        // (gplex-patched) Gmail's addresses carry its new kind of id (#inbox/FMfcgz...), which the print
        // view doesn't take; the conversation Gmail has open gives its old one on its subject line
        const heads = [].filter.call(document.querySelectorAll("h2[data-legacy-thread-id]"), function(h) {
            return !ugfGmailOurs(h) && /^[0-9a-f]{12,20}$/.test(h.getAttribute("data-legacy-thread-id") || "");
        });
        const head = heads.filter(function(h) {
            return h.getClientRects().length;
        })[0] || (heads.length === 1 ? heads[0] : null);
        if (head) {
            return head.getAttribute("data-legacy-thread-id");
        }
'''),
    ("Gmail: whole conversation from the print view", THREAD_OLD, THREAD_NEW),
    ("Gmail: the print page's subject line, not its title",
     '''                const subj = doc.querySelector("font[size='+1'] b, .maincontent font b, h2, title");''',
     '''                // (gplex-patched) its own subject line first: the <title> comes first in the page, and says the
                // account's name before the subject
                const subj = doc.querySelector(".maincontent font[size='+1'] b") || doc.querySelector("font[size='+1'] b, .maincontent font b, h2, title");'''),
    ("Gmail: sender photos and folded messages",
     r'''            const to = m.querySelector(".hb, .g2, span.hb");
            if (!body && !sender) {
                return;
            }
            msgs.push({
                from: sender ? (sender.getAttribute("name") || sender.textContent || "").trim() : "",
                email: sender ? (sender.getAttribute("email") || "") : "",
                to: to ? (to.textContent || "").trim() : ugfT("to me"),
                date: when ? (when.getAttribute("title") || when.textContent || "").trim() : "",
                html: body ? body.innerHTML : ""
            });''',
     r'''            const to = m.querySelector(".hb, .g2, span.hb");
            if (!body && !sender) {
                return;
            }
            // (gplex-patched) a folded message (.kv) has no body in the page, only a line of it; and the
            // sender's photo, as Gmail shows it beside the message
            const folded = !!m.closest(".kv");
            const mail = sender ? (sender.getAttribute("email") || "") : "";
            const holder2 = m.closest(".adn, .kv, .h7") || m;
            let pic = holder2.querySelector("img.ajn[src]");
            if (!pic && mail) {
                pic = [].filter.call(document.querySelectorAll("img.ajn[jid][src]"), function(i) {
                    return (i.getAttribute("jid") || "").toLowerCase() === mail.toLowerCase();
                })[0] || null;
            }
            msgs.push({
                from: sender ? (sender.getAttribute("name") || sender.textContent || "").trim() : "",
                email: mail,
                to: to ? (to.textContent || "").trim() : ugfT("to me"),
                toKnown: !!to,
                date: when ? (when.getAttribute("title") || when.textContent || "").trim() : "",
                html: body && !folded ? body.innerHTML : "",
                photo: pic ? pic.getAttribute("src") : ""
            });'''),
    ("Gmail: conversation counter from the list",
     '''        const counter = t.counter || "1 of " + Math.max(1, ugfGmailRows().length);''',
     '''        // (gplex-patched) Gmail's own counter is the list's ("1-50 of 2,002"): where this conversation sits in it
        const counter = ugfGmailThreadCounter();'''),
    ("Gmail: sender photos in the conversation",
     '''                '<span class="ugf-gmail-avatar">' + esc(initial) + "</span>" +''',
     '''                (m.photo ? '<span class="ugf-gmail-avatar has-photo"><img src="' + esc(m.photo) + '" alt=""></span>'
                    : '<span class="ugf-gmail-avatar">' + esc(initial) + "</span>") +'''),
    ("Gmail: your photo beside the reply box",
     '''            html += '<div id="ugf-gmail-replybox"><span class="ugf-gmail-avatar sq"></span>' +''',
     '''            html += '<div id="ugf-gmail-replybox">' + ugfGmailMyPhoto() +'''),
    ("Gmail: trimmed quotes and the label's x",
     r'''        const main = shell.querySelector("#ugf-gmail-main");
        main.innerHTML = trusted_policy.createHTML(html);
        // history.back() went nowhere''',
     r'''        const main = shell.querySelector("#ugf-gmail-main");
        main.innerHTML = trusted_policy.createHTML(html);
        // (gplex-patched) Gmail's "..." for the trimmed (quoted) part of a message
        main.querySelectorAll(".ugf-gmail-msg-body .ajR").forEach(function(dots) {
            dots.addEventListener("click", function(ev) {
                ev.preventDefault();
                const body = dots.closest(".ugf-gmail-msg-body");
                if (body) {
                    body.classList.toggle("ugf-trim-open");
                }
            });
        });
        // (gplex-patched) the ▾ beside "to me": the message's details, as Gmail showed them under it
        main.querySelectorAll(".ugf-gmail-msg").forEach(function(row, i) {
            const who = row.querySelector(".ugf-gmail-msg-to");
            const m = t.msgs[i];
            if (!who || !m) {
                return;
            }
            who.addEventListener("click", function(ev) {
                ev.preventDefault();
                ev.stopPropagation();
                const had = row.querySelector(".ugf-gmail-details");
                main.querySelectorAll(".ugf-gmail-details").forEach(function(d) {
                    d.remove();
                });
                if (had) {
                    return;
                }
                const line = function(k, v) {
                    return v ? '<tr><td class="k">' + esc(k) + ":</td><td>" + v + "</td></tr>" : "";
                };
                const box = document.createElement("div");
                box.className = "ugf-gmail-details";
                box.innerHTML = trusted_policy.createHTML("<table>" +
                    line("from", "<b>" + esc(m.from || m.email) + "</b>" + (m.email && m.from ? " &lt;" + esc(m.email) + "&gt;" : "")) +
                    line("to", esc(String(m.toFull || m.to || "").replace(/^to\s+/i, "").replace(/\s*\b(Cc|Bcc):\s*/gi, ", "))) +
                    line("date", esc(m.dateFull || m.date)) +
                    line("subject", esc(t.subject || "")) + "</table>");
                const head = row.querySelector(".ugf-gmail-msg-head") || row;
                head.parentNode.insertBefore(box, head.nextSibling);
                const r = who.getBoundingClientRect();
                const rr = row.getBoundingClientRect();
                box.style.left = Math.max(0, Math.round(r.left - rr.left)) + "px";
                const away = function(e2) {
                    if (!box.contains(e2.target) && !who.contains(e2.target)) {
                        box.remove();
                        document.removeEventListener("mousedown", away);
                    }
                };
                setTimeout(function() {
                    document.addEventListener("mousedown", away);
                }, 0);
            });
        });
        // (gplex-patched) the x on the label beside the subject: Gmail's own "Remove label"
        const chipX = main.querySelector("#ugf-gmail-subject .labelchip .x");
        if (chipX) {
            chipX.addEventListener("click", function(ev) {
                ev.preventDefault();
                ev.stopPropagation();
                const all = [].filter.call(document.querySelectorAll('[aria-label^="Remove label"], .hO'), function(x) {
                    return !ugfGmailOurs(x) && ugfGmailShown(x);
                });
                const rm = all.filter(function(x) {
                    return (x.getAttribute("aria-label") || "").indexOf(" " + label + " ") > -1;
                })[0] || all[0];
                if (!rm) {
                    return;
                }
                const disarmX = ugfGmailArm();
                ugfGmailRealClick(rm);
                setTimeout(disarmX, 400);
                const listHash0 = ugfGmailListHash();
                setTimeout(function() {
                    // (the mailbox's own label taken off: the conversation has left it)
                    if (ugfGmailThreadOpen() && ugfGmailThreadLabel() === label && window.location.hash !== listHash0) {
                        window.location.hash = listHash0;
                    }
                    ugfGmailRender();
                }, 800);
            });
        }
        // history.back() went nowhere'''),
    ("Gmail: Reply and Forward through Gmail's own",
     r'''        main.querySelectorAll("[data-msg]").forEach(function(b) {
            b.addEventListener("click", function() {
                const last = t.msgs[t.msgs.length - 1];
                if (b.getAttribute("data-msg") === "reply") {
                    ugfGmailCompose({
                        to: last.email,
                        subject: /^re:/i.test(t.subject) ? t.subject : "Re: " + t.subject,
                        body: "\n\n---------- On " + last.date + ", " + (last.from || last.email) + " wrote: ----------\n"
                    });
                } else {
                    ugfGmailCompose({ to: "", subject: "Fwd: " + t.subject });
                }
            });
        });''',
     r'''        // (gplex-patched) Reply and Forward are Gmail's own on this conversation (see ugfGmailReplySend): a
        // new message to the last sender went to yourself when the last message was yours, and
        // started a conversation of its own
        main.querySelectorAll("[data-msg]").forEach(function(b) {
            b.addEventListener("click", function(ev) {
                if (ev) {
                    ev.preventDefault();
                }
                const mode = b.getAttribute("data-msg") === "forward" ? "forward" : "reply";
                const me = String(ugfGmailIdentity().email || "").toLowerCase();
                const others = t.msgs.filter(function(m) {
                    return m.email && m.email.toLowerCase() !== me;
                });
                const last = others[others.length - 1] || t.msgs[t.msgs.length - 1];
                ugfGmailCompose({
                    mode: mode,
                    to: mode === "forward" ? "" : (last.from || last.email),
                    subject: mode === "forward" ? "Fwd: " + t.subject : (/^re:/i.test(t.subject) ? t.subject : "Re: " + t.subject)
                });
            });
        });'''),
    ("Gmail: Newer and Older from the list",
     r'''                const which = b.getAttribute("data-nav") === "prev" ? "Newer" : "Older";
                if (!ugfGmailClickReal(ugfGmailLabelSel([which]))) {
                    goBack();
                }
                setTimeout(ugfGmailRender, 900);''',
     r'''                // (gplex-patched) Gmail greys out its own Newer and Older for a conversation opened from its
                // address (as Gplex opens them): the next one is taken from the list it was opened from
                const step = b.getAttribute("data-nav") === "prev" ? -1 : 1;
                const pos = ugfGmailThreadPos();
                const next = pos ? pos.list[pos.i + step] : null;
                if (next) {
                    ugfGmailOpenRow(next);
                } else {
                    goBack();
                }
                setTimeout(ugfGmailRender, 900);'''),
    ("Gmail: conversation toolbar actions", THREAD_ACTS_OLD, THREAD_ACTS_NEW),
    ("Gmail: Labels and More menus on the list",
     '''                if (act === "move" || (act === "more" && chrome === "classic" &&''',
     '''                // (gplex-patched) Labels and More open Gmail's own menus, in the layer Gplex hides: offered
                // here instead, as Move to already is
                if (act === "labels") {
                    ugfGmailPickMenu(b, chrome, "Label as", ugfGmailOwnLabels(), function(name) {
                        ugfGmailRunAction(picked, [{ buttons: ["Labels", "Label as"], menuItem: [name], apply: true }]);
                    });
                    return;
                }
                if (act === "more" && chrome !== "classic") {
                    ugfGmailPickMenu(b, chrome, "", ugfGmailMoreItems(false), function(name) {
                        ugfGmailRunAction(picked, ugfGmailMorePlans(name));
                    });
                    return;
                }
                if (act === "move" || (act === "more" && chrome === "classic" &&'''),
    ("Gmail: Apply after picking labels",
     r'''                    ugfGmailRealClick(btn);
                    if (plan.menuItem) {
                        ugfGmailMenuPick(plan.menuItem, function(ok) {
                            if (ok) {
                                settle();
                            } else {''',
     r'''                    ugfGmailRealClick(btn);
                    if (plan.menuItem) {
                        ugfGmailMenuPick(plan.menuItem, function(ok) {
                            if (ok && plan.apply) {
                                // (gplex-patched) Gmail's label menu ticks, then applies on Apply
                                ugfGmailMenuPick(ugfGmailAlt(["Apply"]), function() {
                                    settle();
                                });
                            } else if (ok) {
                                settle();
                            } else {'''),
    ("Gmail: label menu items are checkboxes",
     '''            document.querySelectorAll('[role="menuitem"], .J-N, .J-LC .J-N').forEach(function(el) {''',
     '''            document.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], .J-N, .J-LC').forEach(function(el) {'''),
    ("Gmail: compose title for replies",
     '''            '<div id="ugf-gmail-compose-head">New Message<span''',
     '''            '<div id="ugf-gmail-compose-head">' + esc(prefill.mode === "forward" ? "Forward" : prefill.mode ? "Reply" : "New Message") + '<span'''),
    ("Gmail: reply's To and Subject are Gmail's",
     '''            '<div class="field"><label>To</label><input type="text" id="ugf-gmail-to" value="' + esc(prefill.to || "") + '"></div>' +
            '<div class="field"><label>Subject</label><input type="text" id="ugf-gmail-subj" value="' + esc(prefill.subject || "") + '"></div>' +''',
     '''            '<div class="field"><label>To</label><input type="text" id="ugf-gmail-to" value="' + esc(prefill.to || "") + '"' +
                (prefill.mode && prefill.mode !== "forward" ? " readonly" : "") + "></div>" +
            '<div class="field"><label>Subject</label><input type="text" id="ugf-gmail-subj" value="' + esc(prefill.subject || "") + '"' +
                (prefill.mode ? " readonly" : "") + "></div>" +'''),
    ("Gmail: no fake Save on replies",
     '''(feat.saveLabel ? '<button id="ugf-gmail-do-save">''',
     '''(feat.saveLabel && !prefill.mode ? '<button id="ugf-gmail-do-save">'''),
    ("Gmail: replies sent through Gmail's reply box",
     '''        box.querySelector("#ugf-gmail-do-send").addEventListener("click", function() {''',
     '''        box.querySelector("#ugf-gmail-do-send").addEventListener("click", function() {
            if (prefill.mode) {
                ugfGmailReplySend(prefill.mode, {
                    to: box.querySelector("#ugf-gmail-to").value,
                    body: box.querySelector("#ugf-gmail-msgbody").value
                }, status);
                return;
            }'''),
    ("Gmail: Save draft saves",
     r'''            save.addEventListener("click", function() {
                status("Draft saved at " + new Date().toLocaleTimeString() + ".");
            });''',
     r'''            save.addEventListener("click", function() {
                // (gplex-patched) saved for real, by Gmail (it only said so before)
                ugfGmailSend({
                    to: box.querySelector("#ugf-gmail-to").value,
                    subject: box.querySelector("#ugf-gmail-subj").value,
                    body: box.querySelector("#ugf-gmail-msgbody").value
                }, status, true);
            });'''),
    ("Gmail: draft mode for the compose driver",
     '''    function ugfGmailSend(data, status) {''',
     '''    function ugfGmailSend(data, status, asDraft) {'''),
    ("Gmail: a draft is the compose window closed unsent",
     r'''                status("Sending\u2026");
                setTimeout(function() {
                    ugfGmailRealClick(send);''',
     r'''                if (asDraft) {
                    // (gplex-patched) a draft is Gmail's compose window closed without sending: Gmail keeps
                    // what was in it in Drafts
                    status("Saving\u2026");
                    setTimeout(function() {
                        let shut = null;
                        for (let n = subject, up = 0; n && !shut && up < 25; up++, n = n.parentElement) {
                            if (n === document.body) {
                                break;
                            }
                            shut = n.querySelector('img.Ha, [aria-label^="Save & close"], [data-tooltip^="Save & close"]');
                        }
                        if (shut) {
                            ugfGmailRealClick(shut);
                        }
                        setTimeout(function() {
                            disarm();
                            status("Draft saved.");
                            setTimeout(function() {
                                const form = document.querySelector("#ugf-gmail-compose-form");
                                if (form) {
                                    form.remove();
                                }
                                ugfGmailRender();
                            }, 900);
                        }, 1500);
                    }, 800);
                    return;
                }
                status("Sending\u2026");
                setTimeout(function() {
                    ugfGmailRealClick(send);'''),
    ("Gmail: fixes' styles",
     '''        styles.textContent = ugfGmailCss();''',
     '''        styles.textContent = ugfGmailCss() + "\\n" + ugfGmailFixCss() + "\\n" + ugfGmailThemeCss();'''),
    ("dark mode: search box text stays readable",
     '''            if (tag === "VIDEO" || tag === "CANVAS" || tag === "SCRIPT" || tag === "STYLE" || tag === "svg") {''',
     '''            // (gplex-patched) a text box is darkened with the page, never kept as it is: kept, its
            // typing stayed black on the darkened box behind it
            if (tag === "VIDEO" || tag === "CANVAS" || tag === "SCRIPT" || tag === "STYLE" || tag === "svg" || tag === "INPUT" || tag === "TEXTAREA") {'''),
    ("dark mode: a box with a text field in it is darkened too",
     '''            const pic = /url\\(/.test(cs.backgroundImage) && w >= 80 && h >= 28;''',
     '''            // (gplex-patched) nor a box with a text field in it (the search box's frame): kept, the
            // typing in it stayed black over the darkened page showing through the frame
            const pic = /url\\(/.test(cs.backgroundImage) && w >= 80 && h >= 28 &&
                !el.querySelector("input:not([type]), input[type=text], input[type=search], textarea, [contenteditable=true]");'''),
    ("dark mode: a text field darkens a frame kept before it was put in",
     '''            // (gplex-patched) a text box is darkened with the page, never kept as it is: kept, its''',
     '''            // (gplex-patched) and a frame already kept before the text box was put in it is let go
            // (Firefox looks at the search box's frame before Gplex puts the field in it)
            if ((tag === "INPUT" && /^(text|search|email|url|tel|password)?$/i.test(el.getAttribute("type") || "")) || tag === "TEXTAREA") {
                const keptBox = el.closest("[ugf-dark-keep]");
                if (keptBox) {
                    keptBox.removeAttribute("ugf-dark-keep");
                    keptBox.removeAttribute("ugf-dark-logo");
                }
            }
            // (gplex-patched) a text box is darkened with the page, never kept as it is: kept, its'''),
    ("dark mode: text boxes drawn in the page's light colours, then darkened",
     '''        "html[ugf-dark] ::selection{background:#3a6ad9;color:#fff}";''',
     '''        "html[ugf-dark] ::selection{background:#3a6ad9;color:#fff}" +
        // (gplex-patched) the page is drawn light and then darkened, so the browser must draw its
        // text boxes light too: a browser with a dark look of its own (Nocturne, or a dark system
        // theme) writes their typing in white, which the darkening turned black
        "html[ugf-dark]{color-scheme:light!important}" +
        "html[ugf-dark] [ugf-dark-ink]{color:#000!important;-webkit-text-fill-color:#000!important}";'''),
    ("dark mode: light typing in a text box made black before the darkening",
     '''                const keptBox = el.closest("[ugf-dark-keep]");''',
     '''                // (gplex-patched) typing the browser writes light (its own dark look, where the
                // page's light colours above aren't understood): black, so the darkening turns it light
                if (lum(getComputedStyle(el).color)[0] > 0.6) {
                    el.setAttribute("ugf-dark-ink", "");
                }
                const keptBox = el.closest("[ugf-dark-keep]");'''),
]
