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

// 1. Rota de autenticação simples
app.get("/auth", (req, res) => {
  const { hash } = req.query;
  if (hash === HASH_CODE) {
    return res.send("on");
  } else {
    return res.status(403).send("off");
  }
});

// 2. Rota oficial de Login que o Backend.cs chama
app.post("/user/login", (req, res) => {
  try {
    const { DeviceId, deviceId } = req.body;
    const activeDeviceId = DeviceId || deviceId || "default_device";

    let user = users.get(activeDeviceId);

    if (!user) {
      user = createNewUser(activeDeviceId);
      users.set(activeDeviceId, user);
      console.log(`[LOGIN] Criado novo usuário: ${user.Username}`);
    } else {
      user.LastLogin = new Date().toISOString();
      console.log(`[LOGIN] Usuário autenticado: ${user.Username}`);
    }

    // Estrutura EXATA exigida pelo Backend.cs
    res.json({
      User: user,
      RewardHash: "hash_ok_12345"
    });
  } catch (err) {
    console.error("Erro no /user/login:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Rota /shared/* que o MonoSingleton<Shared> solicita antes do login
app.get("/shared/*", (req, res) => {
  res.json({
    Shared: {
      Version: 1,
      Data: {}
    }
  });
});

// 4. Rotas de Servidores solicitadas pelo GetServers() no Backend.cs
app.get("/servers", (req, res) => {
  res.json({ Servers: [{ Name: "SA", Region: "SA", Ping: 20 }] });
});

app.get("/servers/region/:region", (req, res) => {
  res.json({ Servers: [{ Name: req.params.region, Region: req.params.region, Ping: 20 }] });
});

// 5. Demais checagens do jogo
app.get("/onlinecheck", (req, res) => res.send("on"));

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor do Stumble Guys totalmente pronto na porta ${PORT}`);
});
