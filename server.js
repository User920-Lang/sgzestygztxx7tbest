const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

const HASH_CODE = "GZTXX7-189jaiu-&B!(p093=2-0!#45v";
const users = new Map();

function generateRandomId() {
  return Math.floor(Math.random() * 899999) + 100000;
}

function generateRandomUsername() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `StumbleZesty#${suffix}`;
}

function createNewUser(deviceId) {
  const now = new Date().toISOString();

  return {
    Id: generateRandomId(),
    Username: generateRandomUsername(),
    DeviceId: deviceId,
    Token: "session_token_" + Date.now(),
    Country: "SA",
    Region: "SA",
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
    Skins: ["SKIN1"],
    Balances: [
      { Name: "gems", Amount: 500 },
      { Name: "coins", Amount: 250 },
      { Name: "dust", Amount: 250 }
    ]
  };
}

// ================= ROTA DE LOGIN (Corrigida sem exigi hash no body) =================
app.post("/user/login", (req, res) => {
  try {
    const { DeviceId, deviceId } = req.body;
    const activeDeviceId = DeviceId || deviceId;

    if (!activeDeviceId) {
      return res.status(400).json({ error: "DeviceId is required" });
    }

    let user = users.get(activeDeviceId);

    if (!user) {
      user = createNewUser(activeDeviceId);
      users.set(activeDeviceId, user);
      console.log(`[LOGIN] Novo usuário criado: ${user.Username} (ID: ${user.Id})`);
    } else {
      user.LastLogin = new Date().toISOString();
      console.log(`[LOGIN] Usuário logado: ${user.Username}`);
    }

    // Retorna envelopado em "User" exatamente como o Backend.cs exige
    res.json({
      User: user,
      RewardHash: "hash_ok"
    });
  } catch (err) {
    console.error("Erro no /user/login:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================= ROTAS PARA CORRIGIR O 'Shared update error!' =================
app.get("/shared/:version/:type", (req, res) => {
  res.json({
    Shared: {
      Version: req.params.version || 0,
      Data: {}
    }
  });
});

app.get("/servers", (req, res) => {
  res.json({
    Servers: [
      { Name: "SA", Region: "SA", Ping: 20 }
    ]
  });
});

app.get("/servers/region/:region", (req, res) => {
  res.json({
    Servers: [
      { Name: req.params.region, Region: req.params.region, Ping: 20 }
    ]
  });
});

// ================= DEMAIS ROTAS =================
app.post("/user/update", (req, res) => {
  try {
    const { DeviceId, deviceId, Username, username } = req.body;
    const id = DeviceId || deviceId;
    const newName = Username || username;

    const user = users.get(id);
    if (!user) return res.status(404).json({ error: "user not found" });

    if (newName) user.Username = newName;

    res.json({ User: user });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/onlinecheck", (req, res) => res.send("on"));
app.get("/config.json", (req, res) => res.json({ name: "StumbleZesty", version: "1.0.0", maintenance: false }));

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor Backend rodando na porta ${PORT}`);
});
