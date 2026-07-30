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
    Gems: 1000,
    Coins: 500,
    Dust: 500,
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
      { Name: "gems", Amount: 1000 },
      { Name: "coins", Amount: 500 },
      { Name: "dust", Amount: 500 }
    ],
    BattlePass: null
  };
}

// 1. Rota de Validação /auth
app.get("/auth", (req, res) => {
  const { hash } = req.query;
  if (hash === HASH_CODE) {
    return res.send("on");
  } else {
    return res.status(403).send("off");
  }
});

// 2. Rota Oficial de Login (/user/login) exata para o Backend.cs
app.post("/user/login", (req, res) => {
  try {
    const { DeviceId, deviceId } = req.body;
    const activeDeviceId = DeviceId || deviceId || "default_device";

    let user = users.get(activeDeviceId);

    if (!user) {
      user = createNewUser(activeDeviceId);
      users.set(activeDeviceId, user);
      console.log(`[LOGIN] Novo usuário gerado: ${user.Username} (ID: ${user.Id})`);
    } else {
      user.LastLogin = new Date().toISOString();
      console.log(`[LOGIN] Usuário autenticado: ${user.Username}`);
    }

    // O Backend.cs exige a chave 'RewardHash' no topo do JSON
    res.json({
      User: user,
      RewardHash: "hash_ok_12345"
    });
  } catch (err) {
    console.error("Erro no /user/login:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Rota Coringa para o Shared (/shared/1766/LIVE, /shared/0/all, etc.)
app.get("/shared/*", (req, res) => {
  res.json({
    Shared: {
      Version: 1,
      Data: {}
    }
  });
});

// 4. Rotas de Servidores
app.get("/servers", (req, res) => {
  res.json({ Servers: [{ Name: "SA", Region: "SA", Ping: 20 }] });
});

app.get("/servers/region/:region", (req, res) => {
  res.json({ Servers: [{ Name: req.params.region, Region: req.params.region, Ping: 20 }] });
});

// 5. Rota de Atualização do Perfil (/user/update)
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

// 6. Verificações Adicionais
app.get("/onlinecheck", (req, res) => res.send("on"));
app.get("/config.json", (req, res) => res.json({ name: "StumbleZesty", version: "1.0.0", maintenance: false }));

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor do Stumble Zesty rodando perfeitamente na porta ${PORT}`);
});
