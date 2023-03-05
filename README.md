# neon-vercel-zapatos

This repo demonstrates the use of [Zapatos](https://jawj.github.io/zapatos/) with [Neon's serverless driver](https://www.npmjs.com/package/@neondatabase/serverless) on [Vercel](https://vercel.com/) Edge Functions.

We implement a simple app that generates a JSON listing of the user's nearest 10 UNESCO World Heritage sites via IP geolocation (data copyright © 1992 – 2022 [UNESCO/World Heritage Centre](https://whc.unesco.org/en/syndication/)).

Note: at the time of writing, WebSockets are not supported in the local Vercel development environment, so `npx vercel dev` is not usable.


## How it works

The `@neondatabase/serverless` driver is compatible with (and built on top of) [node-postgres](https://node-postgres.com/), the `pg` package. But because Zapatos tries to import the `pg` package directly, we have a small amount of extra work to do.

First, we include a tiny [local-path package](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#local-paths), which you'll find in `shims/pg`. This calls itself `pg` but simply re-exports the contents of `@neondatabase/serverless`. That makes Zapatos work in a serverless environment.

Second, we generate and update the Zapatos schema types (inside `./zapatos`) at development-time using Node, by running `npm run update-zapatos-types`. Node has no native `WebSocket` object, but the `@neondatabase/serverless` driver tries to import the `ws` package in this case, so we include `ws` as one the `devDependencies` in `package.json`.

Third, it's important to set `"strict": true` and add `"zapatos/**/*"` to the `"include"` directive in `tsconfig.json`.


## Deploy

* Ensure the `psql` client is installed

* Create a Neon database and make a note of the connection string.

* Clone this repo, then:

```bash
# get dependencies
npm install

# set up Vercel
npx vercel login
npx vercel link

# create DATABASE_URL environment variable, remote and local
npx vercel env add DATABASE_URL  # paste in the connection string: postgres://...
npx vercel env pull .dev.vars  # now bring it down into .dev.vars for local use

# create the schema and copy data to DB
(source .dev.vars \
 && curl -s https://gist.githubusercontent.com/jawj/a8d53ff339707c65128af83b4783f4fe/raw/45dbcc819b00ecb72f80b0cf91e01b3d055662b5/whc-sites-2021.psql \
 | psql $DATABASE_URL)

# update Zapatos types from DB
npm run update-zapatos-types

# ... and deploy
npx vercel deploy
```

* Now visit the deployed function at the URL given

# Cloudflare Worker

```
npx wrangler secret put DATABASE_URL
```
