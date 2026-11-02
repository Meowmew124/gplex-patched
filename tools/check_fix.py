#!/usr/bin/env python3
"""Decide whether a fix to gmail/edits.py (made by Claude in the fix-edits workflow) may be merged
without anyone looking at it.

    python3 tools/check_fix.py BEFORE_EDITS AFTER_EDITS UPSTREAM_USER_JS

Exit 0: merge it. It builds against UPSTREAM with no feature left out, passes node's syntax check,
and the code it puts into Gplex (HELPERS and every edit's new text) brings in nothing that could
reach the internet or run hidden code: no new network calls, eval-like calls, cookies or script
tags, and no new web addresses. Exit 1: the build still leaves something out or doesn't parse.
Exit 3: it adds something from that list; a person should look first. The reasons are printed.

The "old" texts (Gplex's own code that each edit looks for) aren't scanned: they come from Gplex
and only decide where an edit goes.
"""
import importlib.util
import os
import re
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RISKY = [
    r"\bfetch\s*\(", r"XMLHttpRequest", r"GM_xmlhttpRequest", r"GM\.xmlHttpRequest", r"\beval\s*\(",
    r"new\s+Function\b", r"\bFunction\s*\(", r"\batob\s*\(", r"fromCharCode", r"document\.cookie",
    r"sendBeacon", r"WebSocket", r"EventSource", r"importScripts", r"createElement\(\s*['\"]script",
    r"<script", r"\.src\s*=", r"setAttribute\(\s*['\"]src", r"\bimport\s*\(", r"window\.open\s*\(",
    r"location\s*=", r"location\.href\s*=", r"localStorage", r"GM_setValue", r"GM_getValue",
    r"postMessage", r"navigator\.", r"unsafeWindow", r"chrome\.", r"browser\.",
]
URL = re.compile(r"(?:https?:)?//([a-z0-9.-]+\.[a-z]{2,})", re.I)


def load(path):
    spec = importlib.util.spec_from_file_location("edits_" + str(abs(hash(path))), path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def ours(mod):
    """The code an edits file puts into Gplex."""
    return "\n".join([getattr(mod, "HELPERS", "")] + [e[2] for e in mod.EDITS])


def main():
    before_path, after_path, upstream = sys.argv[1:4]
    before, after = load(before_path), load(after_path)
    reasons = []
    a, b = ours(before), ours(after)
    for pat in RISKY:
        n0, n1 = len(re.findall(pat, a)), len(re.findall(pat, b))
        if n1 > n0:
            reasons.append("adds %d more of %s" % (n1 - n0, pat))
    new_hosts = sorted(set(h.lower() for h in URL.findall(b)) - set(h.lower() for h in URL.findall(a)))
    if new_hosts:
        reasons.append("adds web addresses: " + ", ".join(new_hosts))
    if reasons:
        print("NOT SAFE TO MERGE UNSEEN:\n- " + "\n- ".join(reasons))
        return 3

    # the build itself, with the fixed edits in place (the patch script reads gmail/edits.py)
    with tempfile.TemporaryDirectory() as tmp:
        out, report = os.path.join(tmp, "out.js"), os.path.join(tmp, "skipped.txt")
        r = subprocess.run([sys.executable, os.path.join(HERE, "gplex-plus-link-patch.py"), upstream,
                            "--out", out, "--report", report], capture_output=True, text=True)
        if r.returncode != 0:
            print("THE PATCH SCRIPT FAILED:\n" + r.stdout[-3000:] + r.stderr[-3000:])
            return 1
        left = open(report).read().strip()
        if left:
            print("STILL LEFT OUT:\n" + left)
            return 1
        s = subprocess.run(["node", "--check", out], capture_output=True, text=True)
        if s.returncode != 0:
            print("SYNTAX CHECK FAILED:\n" + s.stderr[-3000:])
            return 1
    print("OK: every feature applies, the syntax check passes, and nothing risky or new was added.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
