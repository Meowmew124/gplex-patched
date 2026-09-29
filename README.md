# Gplex Extended, with the Google+ link fix and 2014–2016 Docs, Sheets, Slides, Forms and Drive fixes

An automatically patched copy of [Gplex Extended](https://github.com/Ziptino9098/Gplex-Fixed) by Ziptino9098 and lightbeam24.

The patch makes every Google+ button follow Gplex's "Custom link for Google+ buttons" setting. Upstream, three of those buttons are hardcoded to plus.google.com: the waffle menu's Google+ tile and two "+You" links. It also shares the setting with Gmail, Calendar, My Account and the other Google sites, so it works everywhere, not just on google.com.

It also redresses the Google Docs editor to match the Docs of 2014–2016 more exactly when Gplex's layout is 2014, 2015 or 2016 (`docs2014/`, named after Gplex's own `d2014` era, which covers all three):
- header, menus and toolbar at the period's sizes and positions (the blue app block, grey italic "Untitled document", star and folder, Comments and Share with its lock)
- the toolbar order of the time, with four alignment buttons, Editing ▾ and ︽ at the right, and no vertical ruler
- menus in the period style, plus the Table menu between Tools and Add-ons
- no side-panel gutter and no Gemini prompt bar
- on the Docs list, the "Start a new document" strip of late 2015 (Blank plus Google's own templates; MORE unfolds the whole gallery by category, LESS folds it), scrolling with the list, without the round + button
- a working "Owned by anyone ▾" beside "Recent documents" (it sets Google's own owner filter)
- document tabs (today's feature) kept, in the period's style, only for documents that have more than one tab; a "Tabs (n)" button shows and hides them

And Google Slides, on the same layouts:
- the editor in the same 2014 frame as Docs (the yellow app block, the header and toolbar at the period's sizes, the toolbar in the period's order with Background beside Layout, Theme and Transition, ︽ at the right), without today's content-library rail
- the Slides list's "Start a new presentation" strip (from late 2015): Blank and Google's own templates as landscape slides, five to a row; MORE opens the whole gallery as its own page ("← Start a new presentation"), sliding open like a drawer as 2016's did
- the list's presentations as landscape cards, four to a row, and the working "Owned by anyone ▾"

And Google Sheets, on the same layouts:
- the editor in the same 2014 frame (the green block with the period's grid mark, the header and toolbar at the period's sizes), the toolbar in 2016's order (print, undo, redo, paint format first; link, comment, chart, filter ▾ and Σ at the end), without today's side-panel gutter
- the Sheets list's "Start a new spreadsheet" strip: Blank and Google's own templates, five to a row, on the period's slate band; MORE opens the whole gallery as its own page, like Slides; the list's spreadsheets as landscape cards and a working "Owned by anyone ▾"

And Google Forms, on the same layouts:
- the Forms list's "Start a new form" strip: Blank and Google's own templates, five to a row; MORE opens the whole gallery as its own page, like Slides and Sheets; the list's forms as landscape cards and a working "Owned by anyone ▾"
- in the form editor, 2016's Add-ons and Colour palette buttons beside Preview: Add-ons lists your add-ons (and "Get add-ons..."), the palette's colours recolour the form (saved through Google's own theme panel)

And Google Drive, on the 2016 layouts: the Drive triangle of 2014-2016 back beside "Drive" in the header.

And the notifications bell of the 2015-2017 Google bar, on google.com and Gplex's own pages (the 2015-2017 layouts): the grey circle with its bell, red with the count when there's something new, and a box of two parts:
- YouTube: your notifications (from YouTube's notification inbox, which still has them), newest first, the newest five with "Show all" for the rest
- Google+: your notifications on Loogle+ (give your Loogle+ username in the box once), dismissed one by one or "Mark all as read"

Your Google profile photo is also fetched sharp on Gplex's pages (Google hands out a small copy that blurs when shown bigger).

The alignment buttons and the Table menu work Google's own menus behind the scenes, so every command is still Google's.

## VORAPIS notifications fix

YouTube's notification menu request now comes back empty, so VORAPIS's bell (and YouTube's own) shows nothing. [`vorapis-notifications-fix.user.js`](../../raw/main/vorapis-notifications-fix.user.js) answers it from YouTube's notification inbox, newest first, without changing VORAPIS. Install it alongside VORAPIS; it updates from here.

## Install

Open [`main.user.js`](../../raw/main/main.user.js) (the raw file) with Tampermonkey installed. Tampermonkey then updates from this repo on its own.

## How it stays up to date

A GitHub Action (`.github/workflows/patch.yml`) runs every 6 hours. When upstream changes, it downloads the new Gplex, applies `gplex-plus-link-patch.py`, gives the build a higher version (`<upstream version>.<build number>`) and publishes it here.

If an upstream change moves the code the patch edits, the run fails and nothing is published: you keep the last working build, and GitHub emails you about the failed run. You can also run it by hand from the Actions tab ("Run workflow").

## License

Gplex is MIT licensed; see `LICENSE`.
