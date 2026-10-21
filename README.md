# PROBE Lab / Version 11

Bilingual PROBE Lab redesign. Version10 is unchanged.

## Development

- Develop in the `version11` worktree on `dev/probe-v11`.
- Publish from the `version_github` worktree on `main` after merging the tested development commit.
- Publishing this dark-theme release was authorized on 2026-10-21. Real-browser visual QA remains pending; automated DOM checks are not a substitute.

Start a local server from this directory:

```sh
python3 -m http.server 5511 --bind 127.0.0.1
```

Open `http://127.0.0.1:5511/`, or use VS Code Live Server on `index.html`.
The app supports serving from a subdirectory such as `/version11/`.

## Editing and Rebuilding

- `app.js`: shared page components, translations, filtering, carousels and map interactions.
- `probe.css`: responsive design, fixed-height paper-cover mode and natural-height subfigure mode.
- `data/study-articles.json`: the 20 existing bilingual research narratives.
- `data/publications.json`, `data/research-map.json`: original publication records and assets.
- `data/publication-authors.json`: full author order for all 20 papers, equal-contribution and corresponding-author indices (1-based), and source PDF page numbers. Verified against local PDFs on 2026-10-21; symbols are normalized in the UI and explained in a legend.
- `scripts/build.mjs`: four-direction associations, selected people, route generation and normalized `data/site.json`.
- `data/news.json`, `source/news-v10.html`: original bilingual news/activity content and date/link mapping.
- `data/join.json`: source recruitment content; build converts recruitment years to 2026, keeps monetary amounts, and avoids inventing dated official notices.
- `assets/branding/probe-logo.png`: supplied W image. CSS displays the W artwork without its original embedded wording; the approved names are accessible HTML text. The original image file is unchanged.

```sh
node scripts/build.mjs
```

Do not hand-edit `data/site.json` or generated HTML entry points; rebuild them.

## Hometown Data

The user's root `memberlist.xlsx` has an empty hometown column. The actual source is
`20260920_课题组学生信息收集.zip`, containing `成员名单及信息汇总.xlsx`.

```sh
python3 scripts/import-origins.py ../20260920_课题组学生信息收集.zip
node scripts/build.mjs
```

The importer reads the archive without extracting its portraits. It exports only 17
distinct province/municipality locations, without names or member counts.
Coordinates are schematic province label points from the existing licensed
`assets/people/china.svg`; Hangzhou is a separate lab-location marker.
The archive and personal roster are not included in the new site.

## Included

Home, Vision, four Research directions with linked study maps, Discoveries,
All Publications, Minds, PI and three researcher stories, Culture with ten activities,
eleven news records, a methods/resources page without tool links, and Join Us for 2026.
Old entry paths are retained as compatible new-page entry points, including People,
Publications, Software, Join and research study URLs.

Publication cards retain the 170px Version8 cover-image height. Important-subfigure
mode uses natural image heights and two independently flowing columns, becoming one
column on narrow screens. Expanding shows two Show Less controls.

## Validation and Remaining Review

On 2026-10-21, all 2,567 DOM assertions passed; JavaScript syntax and Git whitespace checks also passed. Real-browser inspection is still blocked by the empty browser-tool inventory.

```sh
node --check app.js
node scripts/build.mjs
node scripts/test.mjs
node scripts/test-theme.mjs
```

DOM tests use `jsdom` installed outside this site. Set `JSDOM_PATH` to its `lib/api.js`
if it is not at `/tmp/probe-v11-qa/node_modules/jsdom/lib/api.js`.
They exercise generated routes in both languages, asset/link existence, publication
filters and URL restoration, image modes, collapse controls, autoplay, reduced motion,
the map and recruitment dates. This is not browser layout verification.

- No browser connection was available during implementation; desktop/mobile visual,
  touch and assistive-technology review is still required.
- Video and portraits are deliberately omitted, per the user's decision.
- Standalone software links are deferred; method publications remain available.
- Cards and study details expose expandable full author lists, contribution marks and
  source-page links. Short citations still use `et al.` for compact previews. Search includes every author.
- Recruitment amounts are inherited, not independently verified as 2026 institutional
  policy. The page identifies final benefits as subject to the institute's actual offer.
- Research classification and PI biographical claims should receive academic review.
- No external analytics, third-party fonts or remote scripts are added.

## Dark Theme (2026-10-21)

The user reference sets a deep navy / teal direction: background `#091d33`,
section `#10273e`, card `#142e46`, primary text `#edf4fa`, secondary text
`#b6c8d8`, accent `#67d9cc`. Shared tokens are in `probe.css`. Header, mobile
menu, controls, footer, map and activity gradients follow the same palette.
Raster logos and scientific figures retain light backing and their original colors;
no inversion or destructive image edits are used. Palette contrast is tested
separately from DOM behavior; real-browser visual inspection remains pending.
