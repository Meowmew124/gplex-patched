# Gplex Extended, with the Google+ link fix and 2014 Docs fixes

An automatically patched copy of [Gplex Extended](https://github.com/Ziptino9098/Gplex-Fixed) by Ziptino9098 and lightbeam24.

The patch makes every Google+ button follow Gplex's "Custom link for Google+ buttons" setting. Upstream, three of those buttons are hardcoded to plus.google.com: the waffle menu's Google+ tile and two "+You" links. It also shares the setting with Gmail, Calendar, My Account and the other Google sites, so it works everywhere, not just on google.com.

It also redresses the Google Docs editor to match 2014 Docs more exactly when Gplex's layout is 2014-2016 (`docs2014/`):
- header, menus and toolbar at the period's sizes and positions (the blue app block, grey italic "Untitled document", star and folder, Comments and Share with its lock)
- the 2014 toolbar order, with four alignment buttons, Editing ▾ and ︽ at the right, and no vertical ruler
- 2014-style menus, plus the Table menu between Tools and Add-ons
- no side-panel gutter and no Gemini prompt bar

The alignment buttons and the Table menu work Google's own menus behind the scenes, so every command is still Google's.

## Install

Open [`main.user.js`](../../raw/main/main.user.js) (the raw file) with Tampermonkey installed. Tampermonkey then updates from this repo on its own.

## How it stays up to date

A GitHub Action (`.github/workflows/patch.yml`) runs every 6 hours. When upstream changes, it downloads the new Gplex, applies `gplex-plus-link-patch.py`, gives the build a higher version (`<upstream version>.<build number>`) and publishes it here.

If an upstream change moves the code the patch edits, the run fails and nothing is published: you keep the last working build, and GitHub emails you about the failed run. You can also run it by hand from the Actions tab ("Run workflow").

## License

Gplex is MIT licensed; see `LICENSE`.
