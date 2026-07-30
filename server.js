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
  return Math.floor(Math.random() * 899999) + 100000;
}

function generateRandomUsername() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `StumbleZesty#${suffix.toUpperCase()}`;
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
    Id: generateRandomId(),
    DeviceId: deviceId,
    Username: generateRandomUsername(),
    Country: getContinent(country),
    Region: "XX",
    Crowns: 0,
    Gems: 500,
    Coins: 250,
    Dust: 250,
    Experience: 0,
    SkillRating: 0,
    Level: 1,
    Banned: false,
    Created: now,
    LastLogin: now,
    Playtime_hours: 0,
    Matches_played: 0,
    Matches_won: 0,
    Win_rate: 0,
    Friends: [],
    Skins: ["SKIN1"],
    Balances: [
      { Name: "gems", Amount: 500 },
      { Name: "coins", Amount: 250 },
      { Name: "dust", Amount: 250 }
    ],
    Statistics: {
      totalKills: 0,
      totalDeaths: 0,
      kd_ratio: 0
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
      console.log(`✓ Novo usuário criado: ${user.Username} (ID: ${user.Id})`);
    } else {
      user.LastLogin = new Date().toISOString();
    }

    if (user.Banned) {
      return res.json({ banned: true });
    }
    res.json({
      User: user
    });
  } catch (err) {
    console.error("Erro no login:", err);
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

    user.Statistics.totalKills += kills || 0;
    user.Statistics.totalDeaths += deaths || 0;
    user.Experience += experience_gained || 0;
    user.Gems += gems_earned || 0;
    user.Coins += coins_earned || 0;

    const gemsBalance = user.Balances.find(b => b.Name === "gems");
    const coinsBalance = user.Balances.find(b => b.Name === "coins");
    if (gemsBalance) gemsBalance.Amount = user.Gems;
    if (coinsBalance) coinsBalance.Amount = user.Coins;

    user.Matches_played += 1;
    if (match_won) {
      user.Matches_won += 1;
      user.Crowns += 1; 
    }

    user.Win_rate = ((user.Matches_won / user.Matches_played) * 100).toFixed(1);
    user.Level = Math.floor(user.Experience / 1000) + 1;

    console.log(`✓ ${user.Username} finalizou partida - Kills: ${kills}`);

    res.json({
      success: true,
      User: user
    });
  } catch (err) {
    console.error("Erro no finish round:", err);
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

    user.Username = username.trim();

    res.json({
      User: user
    });
  } catch (err) {
    console.error("Erro no update:", err);
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

    res.json({ User: user });
  } catch (err) {
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
  console.log(`📊 Dados em MEMÓRIA\n`);
});
