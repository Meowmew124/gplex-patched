# Gplex Extended, with the Google+ link fix

An automatically patched copy of [Gplex Extended](https://github.com/Ziptino9098/Gplex-Fixed) by Ziptino9098 and lightbeam24.

The patch makes every Google+ button follow Gplex's "Custom link for Google+ buttons" setting. Upstream, three of those buttons are hardcoded to plus.google.com: the waffle menu's Google+ tile and two "+You" links. It also shares the setting with Gmail, Calendar, My Account and the other Google sites, so it works everywhere, not just on google.com.

## Install

Open [`main.user.js`](../../raw/main/main.user.js) (the raw file) with Tampermonkey installed. Tampermonkey then updates from this repo on its own.

## How it stays up to date

A GitHub Action (`.github/workflows/patch.yml`) runs every 6 hours. When upstream changes, it downloads the new Gplex, applies `gplex-plus-link-patch.py`, gives the build a higher version (`<upstream version>.<build number>`) and publishes it here.

If an upstream change moves the code the patch edits, the run fails and nothing is published: you keep the last working build, and GitHub emails you about the failed run. You can also run it by hand from the Actions tab ("Run workflow").

## License

Gplex is MIT licensed; see `LICENSE`.
