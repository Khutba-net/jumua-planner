const fs = require("fs");
const crypto = require("crypto");
const { Pool } = require("pg");
const env = fs.readFileSync(".env", "utf8");
const m = env.match(/DATABASE_URL="([^"]+)"/);
const pool = new Pool({ connectionString: m[1] });
function cuid() { return crypto.randomBytes(12).toString("hex"); }

async function run() {
  const r = await pool.query(
    "SELECT id, email FROM users WHERE email IN ('imam.omar@gmail.com','sheikh.yusuf@gmail.com','bilal@calgaryislamic.org','khatib1@ifa.ca')"
  );
  const users = {};
  r.rows.forEach(u => { users[u.email] = u.id; });

  const sermons = [
    ["The Importance of Gratitude", "delivered", users["imam.omar@gmail.com"], "4 days"],
    ["Patience in Times of Trial", "approved", users["sheikh.yusuf@gmail.com"], "2 days"],
    ["Community Unity", "draft", users["bilal@calgaryislamic.org"], "1 day"],
    ["Rights of Neighbors", "planned", users["khatib1@ifa.ca"], "3 days"],
  ];

  for (const [title, status, authorId, ago] of sermons) {
    await pool.query(
      `INSERT INTO sermons (id, title, status, author_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${ago}', NOW() - INTERVAL '${ago}')`,
      [cuid(), title, status, authorId]
    );
  }
  console.log("Created 4 sermons");
  await pool.end();
}
run().catch(e => { console.error("Error:", e.message); pool.end(); });
