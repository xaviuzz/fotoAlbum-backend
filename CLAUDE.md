# fotoAlbum-backend

TypeScript API on Bun. Owns the contract, `openapi.yaml`. Part of the fotoAlbum umbrella; cross-repo rules and decisions live in the umbrella's `CLAUDE.md` and `.claude/decisions.md`.

## Commands

- `bun run test`: `bun test`
- `bun run lint`: Biome check (lint and format); `bunx biome check --write .` fixes
- `bun run typecheck`: `tsc --noEmit`
- `bun run build`: `bun build` into `dist/`

A change is done when test, lint, typecheck and build pass.

## Image

`Dockerfile` runs `bun run start` from source on port 3000 (`PORT`); `fotoAlbum-e2e` builds it. `docker build -t fotoalbum-backend .`. In this sandbox `docker run` fails on bridge networking; add `--network host`.

## Stack

`Bun.serve` and `bun test`, no framework, no validation library. Biome and TypeScript are the only dev dependencies. Add nothing else without asking.

## Layout

`test/` mirrors `src/`. Tests assert on public behavior.

Every `expect(...).rejects` and `.resolves` is awaited. Bun waits for an unawaited one, but the `await` makes the check explicit instead of relying on the runner.
