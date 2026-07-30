const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

const HASH_CODE = "GZTXX7-189jaiu-&B!(p093=2-0!#45v";
const users = new Map();

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

    let user = users.get(deviceId);

    if (!user) {
      user = createNewUser(deviceId, country);
      users.set(deviceId, user);
      console.log(`✓ Novo usuário: ${user.username} (ID: ${user.id})`);
    } else {
      user.lastLogin = new Date().toISOString();
    }

    if (user.banned) {
      return res.json({ banned: true });
    }

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
app.post("/round/finish", (req, res) => {
  try {
    const { deviceId, hash, kills, deaths, experience_gained, gems_earned, coins_earned, match_won } = req.body;

    if (!validateHash(hash)) {
      return res.status(401).json({ error: "invalid hash" });
    }

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId required" });
    }

    let user = users.get(deviceId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    user.statistics.totalKills += kills || 0;
    user.statistics.totalDeaths += deaths || 0;
    user.statistics.kd_ratio = user.statistics.totalDeaths > 0 
      ? (user.statistics.totalKills / user.statistics.totalDeaths).toFixed(2) 
      : user.statistics.totalKills;
    user.experience += experience_gained || 0;
    user.gems += gems_earned || 0;
    user.coins += coins_earned || 0;
    const gemsBalance = user.balances.find(b => b.Name === "gems");
    const coinsBalance = user.balances.find(b => b.Name === "coins");
    if (gemsBalance) gemsBalance.Amount = user.gems;
    if (coinsBalance) coinsBalance.Amount = user.coins;
    user.matches_played += 1;
    if (match_won) {
      user.matches_won += 1;
      user.crowns += 1; 
    }
    user.win_rate = ((user.matches_won / user.matches_played) * 100).toFixed(1);)
    user.level = Math.floor(user.experience / 1000) + 1;
    user.trophys = Math.floor(user.statistics.kd_ratio * 100);
    user.skillRating = user.trophys;

    user.lastLogin = new Date().toISOString();

    console.log(`✓ ${user.username} finalizou partida - Kills: ${kills}, Experience: ${experience_gained}`);

    res.json({
      success: true,
      id: user.id,
      experience: user.experience,
      level: user.level,
      gems: user.gems,
      coins: user.coins,
      crowns: user.crowns,
      trophys: user.trophys,
      matches_played: user.matches_played,
      matches_won: user.matches_won,
      win_rate: user.win_rate,
      statistics: user.statistics
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

    const user = users.get(deviceId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    user.username = username.trim();

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
app.get("/user/:deviceId", (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = users.get(deviceId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/users", (req, res) => {
  try {
    const userList = Array.from(users.values());
    res.json({ users: userList, total: userList.length });
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

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🔑 Hash Code: ${HASH_CODE}`);
  console.log(`📊 Dados em MEMÓRIA (sem arquivo)\n`);
  console.log(`Usuários conectados: ${users.size}\n`);
});
