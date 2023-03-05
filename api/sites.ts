// this file re-exports the request handler for Vercel Edge Functions

import sites from '../src/sites';

export default (req: Request, ctx: any) => {
  const env = { DATABASE_URL: process.env.DATABASE_URL };
  return sites.fetch(req, env, ctx);  // note: passing process.env straight through oddly doesn't work
}

export const config = {
  runtime: 'edge',
  regions: ['fra1'],  // fra1 = Frankfurt: pick the Vercel region nearest your Neon DB
};
