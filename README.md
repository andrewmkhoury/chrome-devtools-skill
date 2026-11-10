# chrome-devtools skill

On-demand Chrome DevTools access for coding agents — attaches to the user's real Chrome (keeps SSO logins) for screenshots, console/network inspection, JS evaluation, DOM snapshots, performance traces, and Lighthouse audits. Wraps the official `chrome-devtools` CLI from the [`chrome-devtools-mcp`](https://www.npmjs.com/package/chrome-devtools-mcp) package; no always-on MCP server.

## Install

Via the [skills CLI](https://skills.sh) (Node 22.20+), from any project or user directory:

```bash
# install globally (user-level) for all detected agents, non-interactive:
npx skills add https://github.com/andrewmkhoury/chrome-devtools-skill -g -y

# or target specific agents:
npx skills add andrewmkhoury/chrome-devtools-skill -g -a opencode -a claude-code -y
```

The skills CLI installs to a canonical store and symlinks it into each agent's skills directory, so `npx skills update` keeps it current.

Manual (no Node tooling):

```bash
git clone --depth 1 https://github.com/andrewmkhoury/chrome-devtools-skill /tmp/cdts-skill
cp -R /tmp/cdts-skill ~/.config/opencode/skills/chrome-devtools   # OpenCode
# or: cp -R /tmp/cdts-skill ~/.claude/skills/chrome-devtools     # Claude Code
```

The skill itself is self-sufficient: on first use it checks for the `chrome-devtools` CLI and runs `npm i -g chrome-devtools-mcp@latest` if missing.

## Documentation

Everything an agent needs — workflow, common tools, troubleshooting (remote-debugging toggle, Chrome 155 debug-server regression, daemon workspace restrictions) — is in [SKILL.md](SKILL.md).
