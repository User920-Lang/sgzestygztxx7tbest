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
    Country: "XX",
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
    Skins: ["SKIN1"],
    SkinVariants: [],
    Emotes: [],
    Animations: [],
    Footsteps: [],
    Rewards: [],
    Friends: [],
    Balances: [
      { Name: "gems", Amount: 500 },
      { Name: "coins", Amount: 250 },
      { Name: "dust", Amount: 250 }
    ],
    BattlePass: {
      Season: 1,
      Level: 0,
      Progress: 0,
      Premium: false,
      EndTime: new Date(Date.now() + 30 * 86400000).toISOString()
    }
  };
}

// ================= ROTA DE LOGIN =================
app.post("/user/login", (req, res) => {
  try {
    const { DeviceId, deviceId } = req.body;
    const activeDeviceId = DeviceId || deviceId || "default_device";

    let user = users.get(activeDeviceId);

    if (!user) {
      user = createNewUser(activeDeviceId);
      users.set(activeDeviceId, user);
      console.log(`[LOGIN] Novo usuário criado: ${user.Username} (ID: ${user.Id})`);
    } else {
      user.LastLogin = new Date().toISOString();
      console.log(`[LOGIN] Usuário logado: ${user.Username}`);
    }

    res.json({
      User: user,
      RewardHash: "hash_ok"
    });
  } catch (err) {
    console.error("Erro no /user/login:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================= ROTAS DE SUPORTE =================
app.get("/shared/:version/:type", (req, res) => {
  res.json({ Shared: { Version: req.params.version || 0, Data: {} } });
});

app.get("/servers", (req, res) => {
  res.json({ Servers: [{ Name: "SA", Region: "SA", Ping: 20 }] });
});

app.get("/servers/region/:region", (req, res) => {
  res.json({ Servers: [{ Name: req.params.region, Region: req.params.region, Ping: 20 }] });
});

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
