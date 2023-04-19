import { Pool } from '@neondatabase/serverless';
// since it's shimmed, `import { Pool } from 'pg';` would have exactly the same effect

import * as db from 'zapatos/db';
import * as s from 'zapatos/schema';

export const config = {
  runtime: 'edge',
  regions: ['fra1'],  // fra1 = Frankfurt: pick the Vercel region nearest your Neon DB
};

export default async (req: Request, ctx: any) => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
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
  // uncomment these lines for visibility into the issued SQL + parameters
  const querySQL = query.compile();
  console.log(querySQL.text, querySQL.values);
  */

  const sites = await query.run(pool);
  ctx.waitUntil(pool.end());

  return new Response(JSON.stringify({ longitude, latitude, sites }, null, 2));
}
