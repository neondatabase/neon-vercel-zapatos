import { generate } from 'zapatos/generate';

// since pg is mapped to @neondatabase/serverless, we need to provide a
// WebSocket implementation when we're running on Node.js
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

generate({
  db: { connectionString: process.env.DATABASE_URL },
  schemas: {
    public: {
      include: "*",
      exclude: [
        "geography_columns",
        "geometry_columns",
        "raster_columns",
        "raster_overviews",
        "spatial_ref_sys"
      ]
    }
  }
});
