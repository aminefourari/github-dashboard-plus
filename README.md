<img src="assets/icon.svg" width="64" height="64" alt="">

# GitHub Dashboard+

Chrome extension that restyles all of github.com (softer borders, rounder corners, zinc neutrals, Instrument Sans) and replaces the home dashboard (top bar kept) with:

- **Favorite repositories** — click ☆ on any repo to pin it
- **Recently active repositories** — repos you recently pushed to, created, or opened a PR on
- **Open pull requests** and **open issues** involving you

## Install

1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select `extension/`.
2. Open https://github.com/ and paste a personal access token
   ([create one](https://github.com/settings/tokens/new?scopes=repo&description=GitHub%20Dashboard%2B), `repo` scope).

## Test

`node extension/test.mjs`

## License

[MIT](LICENSE). Bundled font Instrument Sans is under the [SIL Open Font License](extension/fonts/OFL.txt).
