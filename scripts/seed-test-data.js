const fs = require("fs");
const { randomBytes, scryptSync } = require("crypto");
const { Pool } = require("pg");

const env = fs.readFileSync(".env", "utf8");
const match = env.match(/DATABASE_URL="([^"]+)"/);
if (!match) { console.error("No DATABASE_URL found"); process.exit(1); }

const pool = new Pool({ connectionString: match[1] });

function hash(pw) {
  const salt = randomBytes(16).toString("hex");
  const h = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${h}`;
}

function cuid() { return randomBytes(12).toString("hex"); }

async function run() {
  const pw = hash("test1234");

  // --- Individual users ---
  const ind1 = cuid(), ind2 = cuid(), ind3 = cuid();
  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, account_type, role, onboarding_complete, planning_year, created_at)
     VALUES ($1, 'imam.omar@gmail.com', 'Imam Omar', $2, 'individual', 'khatib', 1, 2026, NOW() - INTERVAL '5 days')`,
    [ind1, pw]
  );
  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, account_type, role, onboarding_complete, planning_year, created_at)
     VALUES ($1, 'sheikh.yusuf@gmail.com', 'Sheikh Yusuf', $2, 'individual', 'khatib', 1, 2026, NOW() - INTERVAL '3 days')`,
    [ind2, pw]
  );
  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, account_type, role, onboarding_complete, planning_year, created_at)
     VALUES ($1, 'khatib.ali@gmail.com', 'Ali Hassan', $2, 'individual', 'khatib', 1, 2026, NOW() - INTERVAL '1 day')`,
    [ind3, pw]
  );
  console.log("Created 3 individual users");

  // --- Organization: Calgary Islamic Centre ---
  const orgId = cuid();
  const orgAdmin = cuid(), orgKhatib1 = cuid(), orgKhatib2 = cuid();
  await pool.query(
    `INSERT INTO organizations (id, name, type, city, country, created_at)
     VALUES ($1, 'Calgary Islamic Centre', 'organization', 'Calgary', 'Canada', NOW() - INTERVAL '4 days')`,
    [orgId]
  );
  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, account_type, role, organization_id, onboarding_complete, planning_year, created_at)
     VALUES ($1, 'admin@calgaryislamic.org', 'Ibrahim Khan', $2, 'organization', 'admin', $3, 1, 2026, NOW() - INTERVAL '4 days')`,
    [orgAdmin, pw, orgId]
  );
  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, account_type, role, organization_id, onboarding_complete, planning_year, created_at)
     VALUES ($1, 'bilal@calgaryislamic.org', 'Bilal Ahmed', $2, 'organization', 'khatib', $3, 1, 2026, NOW() - INTERVAL '3 days')`,
    [orgKhatib1, pw, orgId]
  );
  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, account_type, role, organization_id, onboarding_complete, planning_year, created_at)
     VALUES ($1, 'hamza@calgaryislamic.org', 'Hamza Malik', $2, 'organization', 'khatib', $3, 1, 2026, NOW() - INTERVAL '2 days')`,
    [orgKhatib2, pw, orgId]
  );

  // org_members for org
  for (const [userId, name, email, role] of [
    [orgAdmin, "Ibrahim Khan", "admin@calgaryislamic.org", "admin"],
    [orgKhatib1, "Bilal Ahmed", "bilal@calgaryislamic.org", "khatib"],
    [orgKhatib2, "Hamza Malik", "hamza@calgaryislamic.org", "khatib"],
  ]) {
    await pool.query(
      `INSERT INTO org_members (id, organization_id, user_id, name, email, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW() - INTERVAL '3 days')`,
      [cuid(), orgId, userId, name, email, role]
    );
  }
  console.log("Created organization: Calgary Islamic Centre (1 admin + 2 khatibs)");

  // --- Institution: Islamic Foundation of Alberta ---
  const instId = cuid();
  const instAdmin = cuid();
  const mosque1 = cuid(), mosque2 = cuid(), mosque3 = cuid();
  const mosqueAdmin1 = cuid(), mosqueAdmin2 = cuid();
  const instKhatib1 = cuid(), instKhatib2 = cuid(), instKhatib3 = cuid();

  await pool.query(
    `INSERT INTO organizations (id, name, type, city, country, max_mosques, max_khatibs, custom_price_cents, billing_status, billing_notes, created_at)
     VALUES ($1, 'Islamic Foundation of Alberta', 'institution', 'Edmonton', 'Canada', 10, 50, 15000, 'active',
       'Annual agreement - $150/mo. Contact: director@ifa.ca. Renewed Sep 2026.', NOW() - INTERVAL '10 days')`,
    [instId]
  );

  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, account_type, role, organization_id, onboarding_complete, planning_year, created_at)
     VALUES ($1, 'director@ifa.ca', 'Dr. Ahmad Syed', $2, 'institution', 'admin', $3, 1, 2026, NOW() - INTERVAL '10 days')`,
    [instAdmin, pw, instId]
  );

  // Mosques
  await pool.query(
    `INSERT INTO mosques (id, name, city, country, capacity, organization_id, created_at)
     VALUES ($1, 'Al-Rashid Mosque', 'Edmonton', 'Canada', 1200, $2, NOW() - INTERVAL '9 days')`,
    [mosque1, instId]
  );
  await pool.query(
    `INSERT INTO mosques (id, name, city, country, capacity, organization_id, created_at)
     VALUES ($1, 'Markaz ul Islam', 'Edmonton', 'Canada', 600, $2, NOW() - INTERVAL '8 days')`,
    [mosque2, instId]
  );
  await pool.query(
    `INSERT INTO mosques (id, name, city, country, capacity, organization_id, created_at)
     VALUES ($1, 'South Edmonton Musalla', 'Edmonton', 'Canada', 300, $2, NOW() - INTERVAL '7 days')`,
    [mosque3, instId]
  );

  // Mosque admins
  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, account_type, role, organization_id, onboarding_complete, planning_year, created_at)
     VALUES ($1, 'rashid.admin@ifa.ca', 'Tariq Rashid', $2, 'institution', 'mosque_admin', $3, 1, 2026, NOW() - INTERVAL '8 days')`,
    [mosqueAdmin1, pw, instId]
  );
  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, account_type, role, organization_id, onboarding_complete, planning_year, created_at)
     VALUES ($1, 'markaz.admin@ifa.ca', 'Fatima Zahra', $2, 'institution', 'mosque_admin', $3, 1, 2026, NOW() - INTERVAL '7 days')`,
    [mosqueAdmin2, pw, instId]
  );

  // Institution khatibs
  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, account_type, role, organization_id, onboarding_complete, planning_year, created_at)
     VALUES ($1, 'khatib1@ifa.ca', 'Imam Abdallah', $2, 'institution', 'khatib', $3, 1, 2026, NOW() - INTERVAL '6 days')`,
    [instKhatib1, pw, instId]
  );
  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, account_type, role, organization_id, onboarding_complete, planning_year, created_at)
     VALUES ($1, 'khatib2@ifa.ca', 'Sheikh Noor', $2, 'institution', 'khatib', $3, 1, 2026, NOW() - INTERVAL '5 days')`,
    [instKhatib2, pw, instId]
  );
  await pool.query(
    `INSERT INTO users (id, email, name, password_hash, account_type, role, organization_id, onboarding_complete, planning_year, created_at)
     VALUES ($1, 'khatib3@ifa.ca', 'Mufti Ismail', $2, 'institution', 'khatib', $3, 1, 2026, NOW() - INTERVAL '4 days')`,
    [instKhatib3, pw, instId]
  );

  // org_members for institution
  const instMembers = [
    [instAdmin, "Dr. Ahmad Syed", "director@ifa.ca", "admin", null],
    [mosqueAdmin1, "Tariq Rashid", "rashid.admin@ifa.ca", "mosque_admin", mosque1],
    [mosqueAdmin2, "Fatima Zahra", "markaz.admin@ifa.ca", "mosque_admin", mosque2],
    [instKhatib1, "Imam Abdallah", "khatib1@ifa.ca", "khatib", mosque1],
    [instKhatib2, "Sheikh Noor", "khatib2@ifa.ca", "khatib", mosque1],
    [instKhatib3, "Mufti Ismail", "khatib3@ifa.ca", "khatib", mosque2],
  ];
  for (const [userId, name, email, role, mosqueId] of instMembers) {
    await pool.query(
      `INSERT INTO org_members (id, organization_id, user_id, name, email, role, status, mosque_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW() - INTERVAL '5 days')`,
      [cuid(), instId, userId, name, email, role, mosqueId]
    );
  }
  console.log("Created institution: Islamic Foundation of Alberta (1 admin, 2 mosque admins, 3 khatibs, 3 mosques)");

  // --- Subscriptions ---
  // 2 active individual, 1 trialing individual
  await pool.query(
    `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, plan, status, current_period_start, current_period_end, created_at)
     VALUES ($1, $2, 'sub_test_ind1', 'individual_monthly', 'active', NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', NOW() - INTERVAL '20 days')`,
    [cuid(), ind1]
  );
  await pool.query(
    `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, plan, status, current_period_start, current_period_end, created_at)
     VALUES ($1, $2, 'sub_test_ind2', 'individual_monthly', 'active', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', NOW() - INTERVAL '15 days')`,
    [cuid(), ind2]
  );
  await pool.query(
    `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, plan, status, current_period_start, current_period_end, trial_end, created_at)
     VALUES ($1, $2, 'sub_test_ind3', 'individual_monthly', 'trialing', NOW() - INTERVAL '5 days', NOW() + INTERVAL '9 days', NOW() + INTERVAL '9 days', NOW() - INTERVAL '5 days')`,
    [cuid(), ind3]
  );

  // 1 active org subscription
  await pool.query(
    `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, plan, status, organization_id, current_period_start, current_period_end, created_at)
     VALUES ($1, $2, 'sub_test_org1', 'org_monthly', 'active', $3, NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', NOW() - INTERVAL '20 days')`,
    [cuid(), orgAdmin, orgId]
  );

  // 1 active institution subscription (custom)
  await pool.query(
    `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, plan, status, organization_id, current_period_start, current_period_end, created_at)
     VALUES ($1, $2, 'sub_test_inst1', 'institution_custom', 'active', $3, NOW() - INTERVAL '30 days', NOW() + INTERVAL '1 day', NOW() - INTERVAL '30 days')`,
    [cuid(), instAdmin, instId]
  );

  console.log("Created 5 subscriptions (2 active individual, 1 trialing individual, 1 org, 1 institution)");

  // --- A few sermons for content ---
  const sermons = [
    ["The Importance of Gratitude", "delivered", ind1, "4 days"],
    ["Patience in Times of Trial", "approved", ind2, "2 days"],
    ["Community Unity", "draft", orgKhatib1, "1 day"],
    ["Rights of Neighbors", "planned", instKhatib1, "3 days"],
  ];
  for (const [title, status, authorId, ago] of sermons) {
    await pool.query(
      `INSERT INTO sermons (id, title, "status", author_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${ago}', NOW() - INTERVAL '${ago}')`,
      [cuid(), title, status, authorId]
    );
  }
  console.log("Created 4 sermons across different users/statuses");

  await pool.end();
  console.log("\nDone! All test data seeded. Refresh admin dashboard to see results.");
  console.log("\nAll test accounts use password: test1234");
  console.log("\nAccounts created:");
  console.log("  Individual: imam.omar@gmail.com, sheikh.yusuf@gmail.com, khatib.ali@gmail.com");
  console.log("  Org admin:  admin@calgaryislamic.org");
  console.log("  Org khatibs: bilal@calgaryislamic.org, hamza@calgaryislamic.org");
  console.log("  Inst admin: director@ifa.ca");
  console.log("  Mosque admins: rashid.admin@ifa.ca, markaz.admin@ifa.ca");
  console.log("  Inst khatibs: khatib1@ifa.ca, khatib2@ifa.ca, khatib3@ifa.ca");
}

run().catch(e => { console.error("Error:", e.message); pool.end(); process.exit(1); });
