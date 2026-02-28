# Wallbit CLI Dashboard

Terminal dashboard for Wallbit.

![wallbit-demo-image](./assets/login-screen.png)


![wallbit-demo-image](./assets/demo.png)

![wallbit-demo-image](./assets/assets-table.png)

![wallbit-demo-image](./assets/assets-search.png)

![wallbit-demo-image](./assets/asset-details.png)

## Requirements

- A Wallbit API key with `read` permission

## Install

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/lucaspiritogit/wallbit-cli/main/install.sh | sh
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/lucaspiritogit/wallbit-cli/main/install.ps1 | iex
```

After install, run:

```bash
wallbit-cli
```

## Development Requirements

- Bun installed (`bun --version`)

## Features

- Session-based masked API key login (no env var required)
- Checking balance panel
- Crypto wallets panel
- Latest transactions panel with pagination
- Stocks portfolio side panel
- Interactive asset list

## Setup

1. Install dependencies:

```bash
bun install
```

## Run

```bash
bun run start
```

For development with file watching:

```bash
bun run dev
```

On each new session, the app shows a masked API key input screen. Paste your Wallbit API key there and press `enter`.

## Keyboard shortcuts

- `h`: hide/show all currency values (balances + transactions)
- `left` / `right`: previous/next transactions page
- `w`: open wallets modal (copy wallet addresses)
- `up` / `down` + `c` or `enter` (inside wallets modal): select and copy address
- `esc` or `ctrl+c` or `q`: quit

## Disclaimer

- This is a community project and is not affiliated with Wallbit.

## Security disclosure

- Never share terminal output containing environment variables.
- Never paste or commit API keys into code, screenshots, logs, or chat.
