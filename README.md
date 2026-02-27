# Wallbit CLI Dashboard

Terminal dashboard for Wallbit.

![wallbit-demo-image](./assets/login-screen.png)


![wallbit-demo-image](./assets/demo.png)

## Requirements

- Bun installed (`bun --version`)
- A Wallbit API key with `read` permission

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

- `h`: hide/show balance amounts
- `t`: hide/show transaction amounts
- `left` / `right`: previous/next transactions page
- `esc` or `ctrl+c` or `q`: quit

## Security disclosure

- Never share terminal output containing environment variables.
- Never paste or commit API keys into code, screenshots, logs, or chat.
