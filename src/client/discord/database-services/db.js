import * as dotenv from "dotenv";
dotenv.config();

import * as mysql from "mysql2/promise";

const CA_CERT = process.env.CA_CERT
  ? process.env.CA_CERT.split("\\n").join("\n")
  : undefined;

const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
  ssl: CA_CERT
    ? {
        rejectUnauthorized: true,
        ca: CA_CERT,
      }
    : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let db;

try {
  db = mysql.createPool(dbConfig);
  console.log("✅ Securely connected to MySQL (pool).");
} catch (err) {
  console.error("❌ MySQL pool creation failed:", err);
  process.exit(1);
}

/* ------------------------------------------------ */
/*                    TABLE SETUP                   */
/* ------------------------------------------------ */

async function initializeTables() {
  console.log("🔎 Checking if tables exist...");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS linked_accounts (
      discord_id VARCHAR(255) NOT NULL,
      roblox_id BIGINT NOT NULL,
      roblox_username VARCHAR(255) NOT NULL,
      xp INT DEFAULT 0,
      \`rank\` INT DEFAULT 1,
      medals_int INT DEFAULT 0,
      PRIMARY KEY (discord_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✔ linked_accounts ready");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS medals (
      id INT AUTO_INCREMENT NOT NULL,
      name VARCHAR(255),
      description VARCHAR(255),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✔ medals ready");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS rank_xp (
      group_id INT NOT NULL,
      rank_id VARCHAR(45) NOT NULL,
      required_xp INT NOT NULL,
      PRIMARY KEY (group_id, rank_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✔ rank_xp ready");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_group_data (
      discord_id VARCHAR(255) NOT NULL,
      group_id VARCHAR(255) NOT NULL,
      xp INT DEFAULT 0,
      \`rank\` INT DEFAULT 1,
      PRIMARY KEY (discord_id, group_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✔ user_group_data ready");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_medals (
      discord_id VARCHAR(255) NOT NULL,
      group_id VARCHAR(255) NOT NULL,
      medal_name VARCHAR(255) NOT NULL,
      awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (discord_id, group_id, medal_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✔ user_medals ready");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS verifications (
      discord_id VARCHAR(32) PRIMARY KEY,
      roblox_id BIGINT,
      roblox_username VARCHAR(255),
      code VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✔ verifications ready");

  console.log("✅ All tables initialized.");
}

await initializeTables();

/* ------------------------------------------------ */
/*                   HELPER QUERY                   */
/* ------------------------------------------------ */

async function exec(query, params = []) {
  try {
    const [rows] = await db.execute(query, params);
    return rows;
  } catch (err) {
    console.error("❌ Database query error:", err);
    throw err;
  }
}

/* ------------------------------------------------ */
/*                MEDAL FUNCTIONS                   */
/* ------------------------------------------------ */

async function createMedal(name, description) {
  await exec(
    `INSERT INTO medals (name, description) VALUES (?, ?)`,
    [name, description]
  );
}

async function getAllMedals() {
  return await exec(`SELECT * FROM medals ORDER BY id ASC`);
}

async function awardMedal(discordId, groupId, medalName) {
  await exec(
    `INSERT IGNORE INTO user_medals (discord_id, group_id, medal_name)
     VALUES (?, ?, ?)`,
    [discordId, groupId, medalName]
  );
}

async function getUserMedals(discordId, groupId) {
  return await exec(
    `SELECT medal_name, awarded_at
     FROM user_medals
     WHERE discord_id = ? AND group_id = ?
     ORDER BY awarded_at DESC`,
    [discordId, groupId]
  );
}

/* ------------------------------------------------ */
/*                  RANK SYSTEM                     */
/* ------------------------------------------------ */

async function setRankXP(groupId, rankId, xp) {
  await exec(
    `INSERT INTO rank_xp (group_id, rank_id, required_xp)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE required_xp = VALUES(required_xp)`,
    [groupId, rankId, xp]
  );
}

async function getRankXP(groupId, rankId) {
  const rows = await exec(
    `SELECT required_xp FROM rank_xp WHERE group_id = ? AND rank_id = ?`,
    [groupId, rankId]
  );
  return rows[0]?.required_xp ?? 0;
}

/* ------------------------------------------------ */
/*               USER GROUP DATA                    */
/* ------------------------------------------------ */

async function isUserLinked(discordId, groupId) {
  const rows = await exec(
    `SELECT 1 FROM user_group_data WHERE discord_id = ? AND group_id = ?`,
    [discordId, groupId]
  );
  return rows.length > 0;
}

async function getUserGroupData(discordId, groupId) {
  const rows = await exec(
    `SELECT xp, \`rank\`
     FROM user_group_data
     WHERE discord_id = ? AND group_id = ?`,
    [discordId, groupId]
  );
  return rows[0] || null;
}

async function updateUserXP(discordId, groupId, xpToAdd, newRank = null) {
  const current = await getUserGroupData(discordId, groupId);

  const currentXP = current?.xp ?? 0;
  const currentRank = current?.rank ?? 1;

  const updatedXP = currentXP + xpToAdd;
  const updatedRank = newRank ?? currentRank;

  await exec(
    `INSERT INTO user_group_data (discord_id, group_id, xp, \`rank\`)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       xp = VALUES(xp),
       \`rank\` = VALUES(\`rank\`)`,
    [discordId, groupId, updatedXP, updatedRank]
  );

  return updatedXP;
}

/* ------------------------------------------------ */
/*                LINKED ACCOUNTS                   */
/* ------------------------------------------------ */

async function getUserBaseData(discordId) {
  const rows = await exec(
    `SELECT roblox_username, roblox_id
     FROM linked_accounts
     WHERE discord_id = ?`,
    [discordId]
  );
  return rows[0] || null;
}

async function setUserBaseData(discordId, robloxId, robloxUsername) {
  await exec(
    `INSERT INTO linked_accounts (discord_id, roblox_id, roblox_username)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       roblox_id = VALUES(roblox_id),
       roblox_username = VALUES(roblox_username)`,
    [discordId, robloxId, robloxUsername]
  );
}

/* ------------------------------------------------ */
/*            ERROR & SHUTDOWN HANDLING             */
/* ------------------------------------------------ */

db.on("error", (err) => {
  console.error("❌ MySQL Pool Error:", err);
});

process.on("SIGINT", async () => {
  console.log("🔌 Closing MySQL pool...");
  await db.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🔌 Closing MySQL pool...");
  await db.end();
  process.exit(0);
});

/* ------------------------------------------------ */
/*                    EXPORTS                       */
/* ------------------------------------------------ */

export {
  db,
  exec,
  setRankXP,
  getRankXP,
  updateUserXP,
  getUserGroupData,
  getUserBaseData,
  setUserBaseData,
  isUserLinked,
  awardMedal,
  getUserMedals,
  createMedal,
  getAllMedals,
};
