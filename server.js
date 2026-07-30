const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const HASH_CODE = "GZTXX7-189jaiu-&B!(p093=2-0!#45v";
const USERS_DIR = path.join(__dirname, "users");

// Cria a pasta 'users/' se não existir
if (!fs.existsSync(USERS_DIR)) {
  fs.mkdirSync(USERS_DIR, { recursive: true });
}

// 1. Gera um ID aleatório estritamente entre 1 e 1001
function generateRandomId() {
  return Math.floor(Math.random() * 1001) + 1;
}

// 2. Gera 4 caracteres aleatórios (Letras maiúsculas + Números)
function generateRandomSuffix(length = 4) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Carrega o modelo base
function loadUserTemplate() {
  const filePath = path.join(__dirname, "userTemplate.json");
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  
  return {
    User: {
      Id: 0,
      Username: "",
      Name: "",
      DeviceId: "",
      Token: "",
      Country: "XX",
      Region: "XX",
      Crowns: 0,
      Gems: 500,
      Coins: 500,
      Dust: 500,
      Experience: 0,
      SkillRating: 0,
      Level: 1,
      Banned: false,
      Created: "",
      LastLogin: "",
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
    },
    RewardHash: "hash_ok_12345"
  };
}

// Salva o JSON na pasta /users/
function saveUserToFile(userData) {
  try {
    const userFilePath = path.join(USERS_DIR, `${userData.User.DeviceId}.json`);
    fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2), "utf8");
    console.log(`💾 Usuário salvo em: users/${userData.User.DeviceId}.json`);
  } catch (err) {
    console.error("Erro ao salvar arquivo de usuário:", err);
  }
}

// Lê o JSON da pasta /users/
function getUserFromFile(deviceId) {
  try {
    const userFilePath = path.join(USERS_DIR, `${deviceId}.json`);
    if (fs.existsSync(userFilePath)) {
      return JSON.parse(fs.readFileSync(userFilePath, "utf8"));
    }
  } catch (err) {
    console.error("Erro ao ler arquivo de usuário:", err);
  }
  return null;
}

// ================= ROTA DE LOGIN =================

app.post("/user/login", (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const { DeviceId, deviceId } = req.body || {};
    const activeDeviceId = DeviceId || deviceId || "default_device";

    let userData = getUserFromFile(activeDeviceId);

    if (!userData) {
      userData = loadUserTemplate();
      const now = new Date().toISOString();

      // Regras pedidas:
      const randomId = generateRandomId(); // ID de 1 a 1001
      const randomUsername = `StumbleZesty#${generateRandomSuffix(4)}`; // Nick: StumbleZesty#XXXX

      userData.User.Id = randomId;
      userData.User.Username = randomUsername;
      userData.User.Name = randomUsername;
      userData.User.DeviceId = activeDeviceId;
      userData.User.Token = "session_token_" + Date.now();
      userData.User.Country = "XX";
      userData.User.Region = "XX";
      userData.User.Created = now;
      userData.User.LastLogin = now;

      console.log(`[NOVO USER] Nick: ${userData.User.Username} | ID: ${userData.User.Id}`);
    } else {
      userData.User.LastLogin = new Date().toISOString();
      console.log(`[USER LOGADO] Nick: ${userData.User.Username} | ID: ${userData.User.Id}`);
    }

    // Grava/Atualiza o JSON do jogador na pasta users/
    saveUserToFile(userData);

    return res.status(200).json(userData);
  } catch (err) {
    console.error("[LOGIN ERROR]:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Outras rotas obrigatórias
app.get("/auth", (req, res) => res.send("on"));
app.get("/shared/*", (req, res) => res.json({ Shared: { Version: 1, Data: {} } }));
app.get("/servers*", (req, res) => res.json({ Servers: [{ Name: "XX", Region: "XX", Ping: 20 }] }));

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
