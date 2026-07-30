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

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.get("/auth", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  const { hash } = req.query;
  if (hash === HASH_CODE) {
    return res.status(200).send("on");
  }
  return res.status(403).send("off");
});

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
    return res.status(200).json(userData);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/shared/*", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({
    Shared: {
      Version: 1,
      Data: {}
    }
  });
});

app.get("/servers*", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({
    Servers: [
      { Name: "XX", Region: "XX", Ping: 20 }
    ]
  });
});

app.get("/onlinecheck", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  return res.status(200).send("on");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
