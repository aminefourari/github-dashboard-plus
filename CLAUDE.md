# GitHub Dashboard+

Manifest V3 Chrome extension, vanilla JS, no build step, no dependencies.

## Commands
- Test: `node extension/test.mjs` (asserts on pure helpers in `lib.js`)
- Run: load `extension/` unpacked at `chrome://extensions`, then open https://github.com/

## Structure
- `extension/manifest.json` — content script on `https://github.com/*`, runs at `document_start`
- `extension/lib.js` — pure helpers (`recentRepos`, `esc`); loaded before `content.js`, no chrome/DOM APIs
- `extension/content.js` — only acts when `location.pathname === '/'`; fetches the GitHub REST API with a PAT from `chrome.storage.local`, renders into `#ghd` inside `.application-main`
- `extension/theme.css` — site-wide restyle on every github.com page by overriding Primer tokens (`--bgColor-*`, `--borderColor-*`, `--borderRadius-*`, `--fontStack-sansSerif`) with `!important`; owns the font-face
- `extension/dashboard.css` — hides the stock dashboard via `html.ghd`; own `--ghd-*` tokens, dark set follows GitHub's `data-color-mode`
- `extension/fonts/` — bundled Instrument Sans (OFL), loaded via `chrome-extension://__MSG_@@extension_id__/`

## Conventions
- Restyle GitHub through Primer CSS variables, not its hashed component class names (`Box__0K17vj` etc. change on deploy).
- Escape every API string with `esc()` before putting it in `innerHTML`.
- Storage keys: `token`, `favorites` (array of `owner/repo`).
