const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const HASH_CODE = "GZTXX7-189jaiu-&B!(p093=2-0!#45v";
const USERS_DIR = path.join(__dirname, "users");

if (!fs.existsSync(USERS_DIR)) {
  fs.mkdirSync(USERS_DIR, { recursive: true });
}

function generateRandomId() {
  return Math.floor(Math.random() * 1001) + 1;
}

function generateRandomSuffix(length = 4) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
      Gems: 1000,
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

function saveUserToFile(userData) {
  try {
    const userFilePath = path.join(USERS_DIR, `${userData.User.DeviceId}.json`);
    fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2), "utf8");
  } catch (err) {}
}

function getUserFromFile(deviceId) {
  try {
    const userFilePath = path.join(USERS_DIR, `${deviceId}.json`);
    if (fs.existsSync(userFilePath)) {
      return JSON.parse(fs.readFileSync(userFilePath, "utf8"));
    }
  } catch (err) {}
  return null;
}

// Headers Globais
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// 1. Rota de Autenticação /auth
app.get("/auth", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  const { hash } = req.query;
  if (hash === HASH_CODE) {
    return res.status(200).send("on");
  }
  return res.status(403).send("off");
});

// 2. Rota do Shared (Garante envio estruturado para o client)
app.get(["/shared/*", "/shared"], (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const sharedPath = path.join(__dirname, "Shared.json");

  if (fs.existsSync(sharedPath)) {
    try {
      const rawData = fs.readFileSync(sharedPath, "utf8");
      const parsedData = JSON.parse(rawData);

      const payload = {
        Shared: {
          Version: 1,
          Data: parsedData
        },
        Hash: "shared_ok_hash_123"
      };

      return res.status(200).send(JSON.stringify(payload));
    } catch (err) {
      console.error("[SHARED ERROR]:", err);
    }
  }

  return res.status(200).send(JSON.stringify({
    Shared: { Version: 1, Data: {} },
    Hash: "shared_ok_hash"
  }));
});

// 3. Login (/user/login) - Resposta compacta obrigatória para Backend.cs
app.post("/user/login", (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const { DeviceId, deviceId } = req.body || {};
    const activeDeviceId = DeviceId || deviceId || "default_device";

    let userData = getUserFromFile(activeDeviceId);

    if (!userData) {
      userData = loadUserTemplate();
      const now = new Date().toISOString();
      const randomId = generateRandomId();
      const randomUsername = `StumbleZesty#${generateRandomSuffix(4)}`;

      userData.User.Id = randomId;
      userData.User.Username = randomUsername;
      userData.User.Name = randomUsername;
      userData.User.DeviceId = activeDeviceId;
      userData.User.Token = "session_token_" + Date.now();
      userData.User.Country = "XX";
      userData.User.Region = "XX";
      userData.User.Created = now;
      userData.User.LastLogin = now;
    } else {
      userData.User.LastLogin = new Date().toISOString();
    }

    saveUserToFile(userData);

    // IMPORTANTE: Envia sem formatação/espaços no início para passar no StartsWith("{\"User\":")
    const jsonString = JSON.stringify(userData);
    return res.status(200).send(jsonString);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. Nickname e Perfis
app.post(["/user/update", "/user/updateusername"], (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const { DeviceId, deviceId, Username, username } = req.body || {};
  const activeDeviceId = DeviceId || deviceId || "default_device";
  const newName = Username || username;

  let userData = getUserFromFile(activeDeviceId);
  if (userData && newName) {
    userData.User.Username = newName;
    userData.User.Name = newName;
    saveUserToFile(userData);
  }

  const responseData = userData || { success: true };
  return res.status(200).send(JSON.stringify(responseData));
});

// 5. Servidores
app.get(["/servers", "/servers/*"], (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(JSON.stringify({
    Servers: [
      { Name: "XX", Region: "XX", Ping: 20 }
    ]
  }));
});

// 6. Finim da Partida / Round Finish
app.post(["/round/finish", "/round/finish/*", "/round/finishv2/*"], (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(JSON.stringify({ success: true, reward: {} }));
});

app.post("/round/check", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(JSON.stringify({ success: true, valid: true }));
});

// 7. Loja, Economia e BattlePass
app.get(["/economy/*", "/user/refresheconomy", "/battlepass/*"], (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(JSON.stringify({ success: true }));
});

app.post(["/economy/*", "/battlepass/*"], (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(JSON.stringify({ success: true }));
});

// 8. Ranking, Social e Checagens
app.get("/highscore/*", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(JSON.stringify({ Ranks: [], Highscores: [] }));
});

app.get(["/user/profile/*", "/user/news", "/user/friend/*"], (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(JSON.stringify({ success: true }));
});

app.post(["/user/search", "/user/linkgoogle", "/user/linkfacebook", "/user/cheat"], (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(JSON.stringify({ success: true }));
});

app.get(["/onlinecheck", "/tests/*"], (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  return res.status(200).send("on");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
