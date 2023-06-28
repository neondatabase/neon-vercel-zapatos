# neon-vercel-zapatos

This repo demonstrates the use of [Zapatos](https://jawj.github.io/zapatos/) with [Neon's serverless driver](https://www.npmjs.com/package/@neondatabase/serverless) on [Vercel](https://vercel.com/) Edge Functions.

We implement a simple app that generates a JSON listing of the user's nearest 10 UNESCO World Heritage sites via IP geolocation (data copyright © 1992 – 2022 [UNESCO/World Heritage Centre](https://whc.unesco.org/en/syndication/)).

Note: at the time of writing, there's a bug in `vercel dev` which causes a 500 error when you try to use Zapatos. We hope this will be fixed shortly. In the meantime, `vercel deploy` works fine.


## How it works

The `@neondatabase/serverless` driver is compatible with (and built on top of) [node-postgres](https://node-postgres.com/), the `pg` package. But because Zapatos tries to import the `pg` package directly, we have a small amount of extra work to do.

First, we include a tiny [local-path package](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#local-paths), which you'll find in `shims/pg`. This calls itself `pg` but simply re-exports the contents of `@neondatabase/serverless`. That makes Zapatos work in a serverless environment.

Second, we generate and update the Zapatos schema types (inside `./zapatos`) at development-time using Node, by running `npm run update-zapatos-types`. Because Node has no native `WebSocket` object, this calls a simple custom script, `update-zapatos-types.mjs`, in which we configure the serverless driver to use the `ws` package.

Third, it's important to set `"strict": true` and add `"zapatos/**/*"` to the `"include"` directive in `tsconfig.json`.


## Deploy

* Ensure the `psql` client is installed.

* Create a Neon database and make a note of the connection string from the [Neon console](https://console.neon.tech/).

* Clone this repo, then:

```bash
# get dependencies
npm install
npm install -g vercel@latest

# create DATABASE_URL environment variable, remote and local
npx vercel env add DATABASE_URL  # paste in the connection string and select all environments
npx vercel env pull .env.local  # now bring it down into ./.env.local for local use

# create the schema and copy data to DB
(source .env.local \
 && curl -s https://gist.githubusercontent.com/jawj/a8d53ff339707c65128af83b4783f4fe/raw/45dbcc819b00ecb72f80b0cf91e01b3d055662b5/whc-sites-2021.psql \
 | psql $DATABASE_URL)

# update Zapatos types from DB
npm run update-zapatos-types

# test
npx vercel dev

# ... and deploy
npx vercel deploy
```

## Feedback and support

Please visit [Neon Community](https://community.neon.tech/) or [Support](https://neon.tech/docs/introduction/support).
