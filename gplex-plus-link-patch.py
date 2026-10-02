#!/usr/bin/env python3
"""Re-apply Akhil's changes to a new Gplex Extended release: the Gmail fixes (gmail/edits.py),
the Docs 2014 fixes (docs2014/: the editor's layout, menus, Table menu and alignment buttons,
appended as their own block), the notifications bell (notify/: YouTube and Gplex+ or Loogle+
notifications in the bar, and sharp profile photos) and plus/: the Gplex+ buttons already on a
page follow the "Gplex+ link" and "Gplex+ name" settings as soon as they are saved.

Gplex 7.2.8 and later have the Gplex+ link setting themselves; for older releases the edits
below make every Google+ button honour the "Custom link for Google+ buttons" setting
(UGF_PLUS_LINK).

Usage: python3 gplex-plus-link-patch.py path/to/main.user.js [--out FILE]
           [--strict] [--update-url URL] [--version-suffix N]
Without --out the file is patched in place (keeping a .orig copy). Each edit is
reported; NOT FOUND means upstream changed that code and it needs patching by
hand (with --strict that's an error and nothing is written). --update-url points
Tampermonkey's @updateURL/@downloadURL at the patched copy, and --version-suffix
appends ".N" to @version so every published build is newer than the last.
Line endings (Gplex ships CRLF) are preserved.
"""
import argparse
import json
import os
import re
import shutil
import sys

DEFAULT = "https://plus.google.com/"
HERE = os.path.dirname(os.path.abspath(__file__))
DOCS_MARK = "ugfDocs2014Fixes"
NOTIFY_MARK = "ugfNotify"
PLUS_MARK = "ugfPlusLive"
# what the Gplex+ buttons need to hear a setting saved in another tab
PLUS_HEADERS = [("grant", "GM_addValueChangeListener")]
# what the notifications bell needs: YouTube's, Gplex+'s and Loogle+'s servers (Gplex itself is not
# run on Loogle+: its main block would draw the google.com homepage over any other site)
NOTIFY_HEADERS = [("connect", "www.youtube.com"), ("connect", "plus.loogle.mooo.com"), ("connect", "plus.gplexextended.com")]
# the Gmail fixes (gmail/edits.py): edits inside Gplex's Gmail code, which has no hooks to append to
sys.path.insert(0, os.path.join(HERE, "gmail"))
from edits import EDITS as GMAIL_EDITS  # noqa: E402


def docs2014_block():
    """The Docs 2014 module with its stylesheet baked in."""
    js = open(os.path.join(HERE, "docs2014", "docs2014.js")).read().replace("\r\n", "\n")
    css = open(os.path.join(HERE, "docs2014", "docs2014.css")).read().replace("\r\n", "\n")
    placeholder = "/*__UGF_DOCS2014_CSS__*/ null"
    if placeholder not in js:
        sys.exit("docs2014.js has lost its CSS placeholder")
    return js.replace(placeholder, json.dumps(css))

EDITS = [
    ("waffle Google+ tile",
     '<a class="gp-app-inner" href="https://plus.google.com/">',
     '<a class="gp-app-inner" href="${gPlusLink}">'),
    ("+You on the Advanced Search page",
     """let links = plus ? '<a class="plus" href="https://plus.google.com/">+' + esc(signedIn ? plusName : "You")""",
     """let links = plus ? '<a class="plus" href="' + esc(window.localStorage.getItem("UGF_PLUS_LINK") || "https://plus.google.com/") + '">+' + esc(signedIn ? plusName : "You")"""),
    ("+You on the My Account / Keep bar",
     """let links = plus ? '<a class="plus" href="https://plus.google.com/">+' + esc(w.first || "You")""",
     """let links = plus ? '<a class="plus" href="' + esc(gv("UGF_PLUS_LINK", "") || "https://plus.google.com/") + '">+' + esc(w.first || "You")"""),
    ("share the setting across Google origins",
     """    if (gPlusLink == null) {
        localStorage.setItem("UGF_PLUS_LINK","https://plus.google.com/");
        gPlusLink = "https://plus.google.com/";
    }
""",
     """    if (gPlusLink == null) {
        localStorage.setItem("UGF_PLUS_LINK","https://plus.google.com/");
        gPlusLink = "https://plus.google.com/";
    }
    // the Google+ link has to cross origins too: it's set on www.google.com, but Gmail,
    // Calendar, My Account and the rest draw Google+ buttons as well
    try {
        if (window.location.host === "www.google.com") {
            if (typeof GM_setValue === "function") {
                GM_setValue("UGF_PLUS_LINK", gPlusLink);
            }
        } else if (typeof GM_getValue === "function") {
            const sharedPlus = GM_getValue("UGF_PLUS_LINK", null);
            if (sharedPlus) {
                gPlusLink = String(sharedPlus);
            }
        }
    } catch (e) {}
"""),
    ("save: share + re-point links already drawn",
     """                        localStorage.setItem("UGF_PLUS_LINK",value);
                        gPlusLink = value;
""",
     """                        localStorage.setItem("UGF_PLUS_LINK",value);
                        try {
                            if (typeof GM_setValue === "function") {
                                GM_setValue("UGF_PLUS_LINK", value);
                            }
                        } catch (e) {}
                        // re-point the Google+ buttons already drawn (waffle, +You, account card)
                        document.querySelectorAll("a[href]").forEach(function(a) {
                            if (a.getAttribute("href") === gPlusLink) {
                                a.setAttribute("href", value);
                            }
                        });
                        gPlusLink = value;
"""),
]


def add_header(text, key, value):
    """Add a // @key value line to the userscript header unless it is already there."""
    if re.search(r"^// @" + key + r"[ \t]+" + re.escape(value) + r"[ \t]*$", text, re.M):
        return text
    return text.replace("// ==/UserScript==", "// @" + key + "      " + value + "\n// ==/UserScript==", 1)


def set_header(text, key, value):
    """Set a // @key line in the userscript header, adding it if missing."""
    line = re.compile(r"^// @" + key + r"[ \t]+.*$", re.M)
    new = "// @" + key + " " + value
    if line.search(text):
        return line.sub(lambda m: new, text, count=1)
    return text.replace("// ==/UserScript==", new + "\n// ==/UserScript==", 1)


def main():
    parser = argparse.ArgumentParser(description="Re-apply the Google+ link fix to Gplex Extended.")
    parser.add_argument("file")
    parser.add_argument("--out", help="write here instead of patching FILE in place")
    parser.add_argument("--strict", action="store_true", help="fail, writing nothing, if any edit can't be applied")
    parser.add_argument("--update-url", help="point @updateURL/@downloadURL here")
    parser.add_argument("--version-suffix", help='append ".N" to @version')
    args = parser.parse_args()

    raw = open(args.file, newline="").read()
    crlf = "\r\n" in raw
    text = raw.replace("\r\n", "\n")
    ok = True
    if 'GM_setValue("UGF_PLUS_LINK"' in text:
        print("already has the Google+ link fix; no edits needed")
    else:
        for name, old, new in EDITS:
            count = text.count(old)
            if count == 1:
                text = text.replace(old, new)
                print("patched   " + name)
            else:
                ok = False
                print(("NOT FOUND " if count == 0 else "AMBIGUOUS ") + name + " (" + str(count) + " matches)")
    for name, old, new in GMAIL_EDITS:
        if new in text:
            print("already   " + name)
            continue
        count = text.count(old)
        if count == 1:
            text = text.replace(old, new)
            print("patched   " + name)
        else:
            ok = False
            print(("NOT FOUND " if count == 0 else "AMBIGUOUS ") + name + " (" + str(count) + " matches)")
    if DOCS_MARK in text:
        print("already has the Docs 2014 fixes; not appended again")
    else:
        text = text.rstrip("\n") + "\n\n" + docs2014_block().rstrip("\n") + "\n"
        print("appended  Docs 2014 fixes (layout, menus, Table menu, alignment buttons)")
    # (before the bell, which reads the settings through it)
    if PLUS_MARK in text:
        print("already has the live Gplex+ buttons; not appended again")
    else:
        text = text.rstrip("\n") + "\n\n" + open(os.path.join(HERE, "plus", "plus-live.js")).read().replace("\r\n", "\n").rstrip("\n") + "\n"
        for key, value in PLUS_HEADERS:
            text = add_header(text, key, value)
        print("appended  live Gplex+ buttons (link and name follow the settings at once, in every tab)")
    if NOTIFY_MARK in text:
        print("already has the notifications bell; not appended again")
    else:
        text = text.rstrip("\n") + "\n\n" + open(os.path.join(HERE, "notify", "notify.js")).read().replace("\r\n", "\n").rstrip("\n") + "\n"
        for key, value in NOTIFY_HEADERS:
            text = add_header(text, key, value)
        print("appended  notifications bell (YouTube + Gplex+ or Loogle+, sharp profile photos)")
    leftover = text.count('href="' + DEFAULT + '"')
    if leftover:
        print("note: %d other hardcoded href=\"%s\" left; check whether they're new Google+ buttons" % (leftover, DEFAULT))
    if not ok and args.strict:
        sys.exit("upstream changed; the edits above need patching by hand. Nothing written.")

    if args.update_url:
        text = set_header(text, "downloadURL", args.update_url)
        text = set_header(text, "updateURL", args.update_url)
    if args.version_suffix:
        version = re.search(r"^// @version[ \t]+(\S+)", text, re.M)
        if not version:
            sys.exit("no @version line found")
        text = set_header(text, "version", "     " + version.group(1) + "." + args.version_suffix)

    out = args.out or args.file
    if not args.out:
        shutil.copyfile(args.file, args.file + ".orig")
    open(out, "w", newline="").write(text.replace("\n", "\r\n") if crlf else text)
    print("wrote " + out + ("" if ok else "  (INCOMPLETE: fix the edits above by hand)"))


if __name__ == "__main__":
    main()
