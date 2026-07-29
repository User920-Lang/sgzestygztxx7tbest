const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

const USERS_FILE = path.join(__dirname, "userslogin.json");
const HASH_CODE = "GZTXX7-189jaiu-&B!(p093=2-0!#45v";

function ensureUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

function readUsers() {
  ensureUsersFile();
  const data = fs.readFileSync(USERS_FILE, "utf-8");
  return JSON.parse(data);
}

function writeUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function validateHash(hash) {
  return hash === HASH_CODE;
}

function generateRandomId() {
  return Math.floor(Math.random() * 1001) + 1;
}

function generateRandomUsername() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `StumbleZesty#${suffix}`;
}

function getContinent(country) {
  const continents = {
    BR: "SA", AR: "SA", CL: "SA", CO: "SA", PE: "SA", VE: "SA",
    US: "NA", CA: "NA", MX: "NA",
    DE: "EU", FR: "EU", GB: "EU", IT: "EU", ES: "EU", PT: "EU",
    CN: "AS", JP: "AS", KR: "AS", IN: "AS", TH: "AS",
    AU: "OC", NZ: "OC",
  };
  return continents[country?.toUpperCase()] || "XX";
}

function createNewUser(deviceId, country) {
  const now = new Date().toISOString();

  return {
    id: generateRandomId(),
    deviceId: deviceId,
    username: generateRandomUsername(),
    country: getContinent(country),
    region: "XX",
    crowns: 0,
    gems: 500,
    coins: 250,
    dust: 250,
    aec: 0,
    trophys: 0,
    experience: 0,
    skillRating: 0,
    level: 1,
    kicked: false,
    kickReason: null,
    banned: false,
    temporary_banned: false,
    ban_expires_at: null,
    created: now,
    lastLogin: now,
    playtime_hours: 0,
    matches_played: 0,
    matches_won: 0,
    win_rate: 0,
    friends: [],
    skins: ["SKIN1"],
    skinVariants: [],
    emotes: [],
    animations: [],
    footsteps: [],
    rewards: [],
    balances: [
      { Name: "gems", Amount: 500 },
      { Name: "coins", Amount: 250 },
      { Name: "dust", Amount: 250 },
      { Name: "aec", Amount: 0 }
    ],
    statistics: {
      totalKills: 0,
      totalDeaths: 0,
      kd_ratio: 0,
      longest_streak: 0,
      favorite_skin: "SKIN1",
      favorite_emote: ""
    },
    achievements: [],
    daily_rewards: {
      current_streak: 0,
      last_claimed: null,
      next_available: now
    },
    battle_pass: {
      season: 0,
      level: 0,
      progress: 0,
      premium: false,
      premium_unlocked_at: null
    }
  };
}

app.post("/user/login", (req, res) => {
  try {
    const { deviceId, country, hash } = req.body;

    if (!hash) {
      return res.status(400).json({ error: "hash required" });
    }

    if (!validateHash(hash)) {
      return res.status(401).json({ error: "invalid hash" });
    }

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId required" });
    }

    const data = readUsers();
    let user = data.users.find(u => u.deviceId === deviceId);

    if (!user) {
      user = createNewUser(deviceId, country);
      data.users.push(user);
      writeUsers(data);
      console.log(`✓ Novo usuário: ${user.username} (ID: ${user.id})`);
    } else {
      user.lastLogin = new Date().toISOString();
      writeUsers(data);
    }

    if (user.banned) {
      return res.json({ banned: true });
    }

    // Retornar EXATAMENTE o que o C# espera
    res.json({
      id: user.id,
      username: user.username,
      deviceId: user.deviceId,
      country: user.country,
      region: user.region,
      crowns: user.crowns,
      gems: user.gems,
      coins: user.coins,
      dust: user.dust,
      aec: user.aec,
      trophys: user.trophys,
      experience: user.experience,
      skillRating: user.skillRating,
      level: user.level,
      kicked: user.kicked,
      kickReason: user.kickReason,
      banned: user.banned,
      temporary_banned: user.temporary_banned,
      ban_expires_at: user.ban_expires_at,
      created: user.created,
      lastLogin: user.lastLogin,
      playtime_hours: user.playtime_hours,
      matches_played: user.matches_played,
      matches_won: user.matches_won,
      win_rate: user.win_rate,
      friends: user.friends,
      skins: user.skins,
      skinVariants: user.skinVariants,
      emotes: user.emotes,
      animations: user.animations,
      footsteps: user.footsteps,
      rewards: user.rewards,
      balances: user.balances,
      statistics: user.statistics,
      achievements: user.achievements,
      daily_rewards: user.daily_rewards,
      battle_pass: user.battle_pass
    });
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/user/update", (req, res) => {
  try {
    const { deviceId, username, hash } = req.body;

    if (!validateHash(hash)) {
      return res.status(401).json({ error: "invalid hash" });
    }

    if (!deviceId || !username) {
      return res.status(400).json({ error: "deviceId and username required" });
    }

    const data = readUsers();
    const user = data.users.find(u => u.deviceId === deviceId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    user.username = username.trim();
    writeUsers(data);

    res.json({
      id: user.id,
      username: user.username,
      banned: false
    });
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/users", (req, res) => {
  try {
    const data = readUsers();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error reading users" });
  }
});

app.get("/hash", (req, res) => {
  res.json({ hash: HASH_CODE });
});

app.get("/onlinecheck", (req, res) => {
  res.send("on");
});

app.get("/config.json", (req, res) => {
  res.json({
    name: "StumbleZesty",
    version: "1.0.0",
    maintenance: false
  });
});

app.get("/auth", (req, res) => {
  const hash = (req.query.hash || "").trim();

  if (!validateHash(hash)) {
    return res.status(401).send("invalid_hash");
  }

  res.send("on");
});

ensureUsersFile();

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🔑 Hash Code: ${HASH_CODE}`);
  console.log(`📁 Arquivo JSON: ${USERS_FILE}`);
  console.log(`✓ Pronto para receber logins!\n`);
});
