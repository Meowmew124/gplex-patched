# Gplex Extended, with the Google+ link fix, Gmail fixes and themes, and Docs, Sheets, Slides, Forms and Drive fixes

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

And the toolbars of the other periods' Docs, Sheets and Slides lined up: on the 2011-2013 layouts the icons, words and ▾ sat at the top of their buttons (the font size box low beside them); on 2007-2010 "Normal text" and "Arial" sat above the icons and the dividers 10px above the buttons.

And Gmail (`gmail/`, edits inside Gplex's Gmail):
- conversations: every message in full (Gmail folds older replies, and a folded one's text isn't in the page, so they came out empty or not at all: they're read from Gmail's print view now), who each was sent to, the senders' photos and yours, "3 of 1,795", Newer and Older, the quoted text's "...", the label's ×, Print all (Gmail's print page) and In new window
- the conversation's buttons act on it (Archive, Report spam, Delete, Mark as unread, Star), and Move to, Labels and More open menus you can see (Gmail's opened in the page Gplex hides); Labels and More work on the list too
- Reply and Forward go through Gmail's own reply box, so they reach the right people and stay in the conversation; Save Now really saves a draft
- the list's sender column as Gmail fills it ("To: Greg" in Sent, "Greg (4)"), the sidebar's real unread counts and your own labels, and the search box keeps what you searched for after opening a result
- Settings: Maximum page size is a real setting (saved in Gmail's own settings), and themes work: on the 2016 layout "Set Theme" opens the "Pick your theme" window of 2014-2016 (Light, Dark, Soft Gray, High Contrast, the classic photo themes, some changing with the day or hour as they did, and Google's featured photos; Text background Light or Dark, vignette and blur), and on the other layouts from 2009 on the same themes are in Settings > Themes; a themed page keeps its own colours under Gplex's dark mode
- 2013-2016's "More ▾" at the foot of the sidebar (Chats, opening Google Chat, and the inbox categories), and the bell in Gmail's bar works

And the notifications box on every Google bar from 2011 on (google.com and Gplex's own pages: Gmail, Maps, the Docs, Sheets, Slides and Forms lists, Drive, Photos, Translate, News and Calendar): on 2011-2014 the Google+ count square shows the count, red when there's something new; on 2015-2017 the grey circle with its bell, red with the count; on 2018 on the Material bell, with a red badge. Each opens the "Google notifications" panel of 2015-2016 (grey, the gear for its settings, Mr. Jingles when you're all caught up, "Previously read" at the foot), with two parts:
- YouTube: your notifications (from YouTube's notification inbox, which still has them), newest first, the newest five with "Show all" for the rest
- Google+, under your "Gplex+ name" and from wherever your "Gplex+ link" leads: Gplex+ (the default; your Gplex+ sign-in in the same browser is used; every one you haven't read stays on the front until you open it, dismiss it, "Mark all as read" or see it on Gplex+'s own Notifications page, then it's under "Previously read"; the number on the bell is the new ones since you last opened the box) or Loogle+ (give your Loogle+ username in the box once; dismissed one by one or "Mark all as read"). The box's settings (the gear) switch between the two, which changes the Gplex+ link itself, and keep the Loogle+ username there to change any time; for Gplex+ they show who you're signed in as, with "Switch account"

The Gplex+ buttons follow the Gplex+ link and name settings the moment they're saved, on every open tab, without a reload: the +You / +Name buttons and "Your profile" lead to your Gplex+ profile (or the link), the rest (the apps menus' tile, the products page...) to the link.

Your Google profile photo is also fetched sharp on Gplex's pages (Google hands out a small copy that blurs when shown bigger).

The alignment buttons and the Table menu work Google's own menus behind the scenes, so every command is still Google's.

## VORAPIS notifications fix

YouTube's notification menu request now comes back empty, so VORAPIS's bell (and YouTube's own) shows nothing. [`vorapis-notifications-fix.user.js`](../../raw/main/vorapis-notifications-fix.user.js) answers it from YouTube's notification inbox, newest first, without changing VORAPIS. Install it alongside VORAPIS; it updates from here.

## Install

Open [`main.user.js`](../../raw/main/main.user.js) (the raw file) with Tampermonkey installed. Tampermonkey then updates from this repo on its own.

## How it stays up to date

A GitHub Action (`.github/workflows/patch.yml`) runs every 6 hours. When upstream changes, it downloads the new Gplex (the newer of Gplex's GitHub copy and the download on Gplex's website, which gets releases first), applies `gplex-plus-link-patch.py`, gives the build a higher version (`<upstream version>.<build number>`) and publishes it here.

If an upstream change moves the code the patch edits, the run fails and nothing is published: you keep the last working build, and GitHub emails you about the failed run. You can also run it by hand from the Actions tab ("Run workflow").

## License

Gplex is MIT licensed; see `LICENSE`.
