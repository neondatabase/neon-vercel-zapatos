# neon-edge-zapatos

This repo demonstrates the use of [Zapatos](https://jawj.github.io/zapatos/) with [Neon's serverless driver](https://www.npmjs.com/package/@neondatabase/serverless) on [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions) and [Cloudflare Workers](https://workers.cloudflare.com/).

We implement a simple app that generates a JSON listing of the user's nearest 10 UNESCO World Heritage sites via IP geolocation (data copyright © 1992 – 2022 [UNESCO/World Heritage Centre](https://whc.unesco.org/en/syndication/)).

Note: at the time of writing, WebSockets are not supported in the local Vercel development environment, so `npx vercel dev` is not usable.


## How it works

The `@neondatabase/serverless` driver is compatible with (and built on top of) [node-postgres](https://node-postgres.com/), the `pg` package. But because Zapatos tries to import the `pg` package directly, we have a small amount of extra work to do.

First, we include a tiny [local-path package](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#local-paths), which you'll find in `shims/pg`. This calls itself `pg` but simply re-exports the contents of `@neondatabase/serverless`. That makes Zapatos work in a serverless environment.

Second, we generate and update the Zapatos schema types (inside `./zapatos`) at development-time using Node, by running `npm run update-zapatos-types`. Because Node has no native `WebSocket` object, this calls a simple custom script, `update-zapatos-types.mjs`, in which we configure the serverless driver to use the `ws` package.

Finally, note that it's important to set `"strict": true` and add `"zapatos/**/*"` to the `"include"` directive in `tsconfig.json`.

## Platform-specific files

The following files are specific to Cloudflare Worker deployment. You can delete these if you're deploying only to Vercel:

* `wrangler.toml`

The following files are specific to Vercel Edge Function deployment. You can delete these if you're deploying only to Cloudflare:

* `.vercelignore`
* `vercel.json`
* `api/sites.ts` (and the `api` folder)

## Deploy

* Ensure the `psql` client is installed

* Create a Neon database, and create a `.dev.vars` file defining the environment variable `DATABASE_URL="postgres://user:pass@host/db"` using the database connection string provided in the Neon dashboard.

* Clone this repo, then:

```bash
# get dependencies
npm install

# create the schema and copy data to DB
(source .dev.vars \
 && curl -s https://gist.githubusercontent.com/jawj/a8d53ff339707c65128af83b4783f4fe/raw/45dbcc819b00ecb72f80b0cf91e01b3d055662b5/whc-sites-2021.psql \
 | psql $DATABASE_URL)

# update Zapatos types from the DB
npm run update-zapatos-types

# deploy to Vercel
npx vercel login
(source .dev.vars && echo $DATABASE_URL | npx vercel env add DATABASE_URL preview)
npx vercel deploy

# deploy to Cloudflare
npx wrangler login
(source .dev.vars && echo $DATABASE_URL | wrangler secret put DATABASE_URL)
npx wrangler publish
```

* Now visit the deployed function at the URL returned
