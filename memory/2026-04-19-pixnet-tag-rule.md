# 2026-04-19 PIXNET whisky tag rule update

- Alan requested that PIXNET whisky posts always include one additional fixed tag: `Whisky`.
- Updated `tmp/pixnet-playwright-test/pixnet-publish-one.js` so the tag list now starts with `Whisky`, then appends region-split tags from `row[6]`, plus non-empty `row[1]`, `row[2]`, and `row[7]`.
