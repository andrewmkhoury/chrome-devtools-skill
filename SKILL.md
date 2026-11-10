---
name: chrome-devtools
description: On-demand Chrome DevTools access via the official chrome-devtools CLI. Attaches to the user's real Chrome (keeps SSO logins) for screenshots, console/network inspection, JS evaluation, DOM snapshots, performance traces, and Lighthouse audits. Nothing runs until a command is issued; always stop the daemon when done. Use when the user wants to debug their live browser, inspect an open tab, check why a page is slow or throwing errors, screenshot a page, or verify something in Chrome.
---

# Chrome DevTools (on-demand CLI)

Wraps the official `chrome-devtools` CLI (from the `chrome-devtools-mcp` package). It runs a background daemon **only while you need it**: the first tool call starts it, `chrome-devtools stop` kills it. No persistent process, no always-on MCP server.

**Prereqs (one-time; auto-install if missing):**
- First check `command -v chrome-devtools`. If it is empty (fresh machine, not yet installed), run `npm i -g chrome-devtools-mcp@latest` (provides the `chrome-devtools` command), then continue.
- Chrome 144+ with remote debugging enabled — see Troubleshooting if `list_pages` says it cannot find `DevToolsActivePort`.

## Workflow

1. `chrome-devtools status` — if not running: `chrome-devtools start --autoConnect` (attaches to the user's real Chrome; keeps their logins/cookies).
2. `chrome-devtools list_pages` — get the numeric `<pageId>` of the tab you need.
3. Run the tools you need (page-scoped tools take `<pageId>` as first positional arg).
4. **Always finish with `chrome-devtools stop`** so nothing lingers. Re-verify with `status` if unsure.

If the daemon is already running but was started with the wrong flags (e.g. no `--autoConnect`, or wrong workspace), `chrome-devtools stop` then start again with the right flags.

## Common tools

```sh
chrome-devtools list_pages                          # all open tabs: pageId, url, title
chrome-devtools new_page "https://..."              # open a new tab
chrome-devtools navigate_page 1 --url "https://..." # navigate
chrome-devtools take_screenshot 1 --filePath shot.png --fullPage
chrome-devtools take_snapshot 1                     # accessibility snapshot w/ element uids
chrome-devtools click 1 "uid-123"                   # click element from snapshot
chrome-devtools fill 1 "uid-456" "text"
chrome-devtools evaluate_script "() => document.title" --pageId 1
chrome-devtools list_console_messages 1
chrome-devtools list_network_requests 1
chrome-devtools performance_start 1 && chrome-devtools performance_stop 1   # perf trace + insights
chrome-devtools lighthouse_audit 1 --mode snapshot
```

The CLI exposes every MCP tool as a subcommand. Run `chrome-devtools --help` for the full list before guessing a tool name. Add `--output-format=json` for machine-readable output.

## Reading a page's text

`take_snapshot` returns the accessibility tree (element uids) — good for clicking, wrong for reading prose. To get a page's readable text, especially SPAs that render their content in a **shadow root** (Backstage idocs, MkDocs — where `document.body.innerText` comes back nearly empty and a plain `evaluate_script` walk misses it), use the bundled extractor:

```sh
chrome-devtools evaluate_script "$(cat scripts/read_page_text.js)" --pageId 1
```

It walks the light DOM **and** every open shadow root and returns the largest "main content" region it finds (selectors: `article.md-content`, `[role=main]`, `.md-content`, `article`, `main`), falling back to `document.body.innerText`. For a long page, slice the returned string rather than reading it all.

## Troubleshooting

- **"Could not find DevToolsActivePort for chrome at .../Google/Chrome/DevToolsActivePort"** — remote debugging is off in the user's Chrome (the file at `~/Library/Application Support/Google/Chrome/DevToolsActivePort` proves it's on when present). Ask them to open `chrome://inspect/#remote-debugging` in their real Chrome and enable the toggle. Then `chrome-devtools stop` and `chrome-devtools start --autoConnect` again.
- **Chrome shows "Server running at: starting…" forever after enabling the toggle** (seen on Chrome 155; related to Chromium regression 485420898) — the running browser fails to bind the debug server on a pref change, but the pref persists (`"remote_debugging":{"user-enabled":true}` in `Local State`). Quit Chrome completely (`osascript -e 'tell application "Google Chrome" to quit'`, wait, confirm with pgrep) and relaunch (`open -a "Google Chrome"`, tabs restore); the server binds at startup.
- **CLI hangs or can't connect to daemon** — `chrome-devtools stop`, then `NODE_DEBUG=* chrome-devtools start --autoConnect --logFile=/tmp/chrome-devtools.log` and check the log file.
- **File tools (screenshot etc.) refuse a path** — the daemon restricts writes to its workspace; restart with `chrome-devtools start --autoConnect --workspace=/path/to/dir`.
- **`stop` does not close the user's browser** — it only detaches and kills the daemon. Their Chrome keeps running with the (harmless, localhost-only) debug port until they toggle it off in `chrome://inspect/#remote-debugging`.

## Notes

- Remote debugging grants full control of the user's browser. It is localhost-only, but treat pages as sensitive — do not exfiltrate cookies or token values anywhere.
- Prefer `--autoConnect` (real Chrome, real logins) per this user's setup. Use `--browserUrl http://127.0.0.1:9222` only if they explicitly ran a separate debuggable Chrome.
