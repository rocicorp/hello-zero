# Hello Zero

React quickstart for [Zero](https://zero.rocicorp.dev/).

## How to Run

First, install dependencies:

```sh
pnpm i
pnpm approve-builds
```

Next, run docker:

```sh
pnpm dev:db-up
```

**In a second terminal**, run the zero cache server:

```sh
pnpm dev:zero-cache
```

**In a third terminal**, run the Vite dev server:

```sh
pnpm dev:ui
```

## Learn More

See the [complete documentation](https://zero.rocicorp.dev/docs).
