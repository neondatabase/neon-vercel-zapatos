import { Pool } from '@neondatabase/serverless';
import * as db from 'zapatos/db';
import * as s from 'zapatos/schema';

// this handler works directly with Cloudflare Workers;
// it's re-exported for Vercel Edge Functions in api/sites.ts

export default {
  async fetch(req: Request, env: any, ctx: any) {
    const pool = new Pool({ connectionString: env.DATABASE_URL });

    const longitude = parseFloat(req.headers.get('x-vercel-ip-longitude') ?? '-122.47');
    const latitude = parseFloat(req.headers.get('x-vercel-ip-latitude') ?? '37.81');

    const distance = db.sql<s.whc_sites_2021.SQL, number>
      `${"location"} <-> st_makepoint(${db.param(longitude)}, ${db.param(latitude)})`;

    const link = db.sql<s.whc_sites_2021.SQL, string>
      `'https://whc.unesco.org/en/list/' || ${"id_no"} || '/'`;

    const query = db.select('whc_sites_2021', db.all, {
      columns: ["id_no", "name_en", "category"],
      extras: { link, distance },
      order: [{ by: distance, direction: 'ASC' }],
      limit: 10,
    });

    /*
    // uncomment this section for visibility into the issued SQL + parameters
    const querySQL = query.compile();
    console.log(querySQL.text, querySQL.values);
    */

    const sites = await query.run(pool);
    ctx.waitUntil(pool.end());

    return new Response(JSON.stringify({ longitude, latitude, sites }, null, 2));
  }
}
