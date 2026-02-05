# AGENTS Guide

## Architecture

- `apps/server`: WebSocket server + room management
- `apps/client`: Vite + TypeScript UI
- `contracts`: protocol docs and optional schemas

## Message Contract

All WebSocket messages include `type` and follow `contracts/message-contract.md`.

## Adding features

1. Update `SPEC.md` and `contracts/message-contract.md` first.
2. Implement changes in server/client.
3. Update `CHANGELOG.md`.
4. Add/adjust tests.

## Do

- Keep modules small and focused.
- Validate payloads at boundaries.
- Keep room management in-memory.
- Prefer composition over inheritance.

## Don’t

- Do not add persistence without updating the spec.
- Do not weaken tests to force them to pass.
