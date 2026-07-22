import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const db = new Low(new JSONFile("db.json"), {});
await db.read();

function generateNumericID() {
  return Math.floor(100000 + Math.random() * 900000);
}

function getHash() {
  return process.env.SERVER_HASH || db.data.config?.hash || null;
}

function validateHash(hash) {
  const serverHash = getHash();
  if (!serverHash) return true;
  return hash === serverHash;
}

const COUNTRY_TO_CONTINENT = {
  BR: "SA", AR: "SA", CL: "SA", CO: "SA", PE: "SA", VE: "SA",
  BO: "SA", PY: "SA", UY: "SA", EC: "SA", GY: "SA", SR: "SA",
  US: "NA", CA: "NA", MX: "NA",
  GT: "NA", HN: "NA", SV: "NA", NI: "NA", CR: "NA", PA: "NA",
  CU: "NA", DO: "NA", HT: "NA", JM: "NA", PR: "NA",
  DE: "EU", FR: "EU", GB: "EU", IT: "EU", ES: "EU", PT: "EU",
  NL: "EU", BE: "EU", CH: "EU", AT: "EU", SE: "EU", NO: "EU",
  DK: "EU", FI: "EU", PL: "EU", CZ: "EU", SK: "EU", HU: "EU",
  RO: "EU", BG: "EU", HR: "EU", RS: "EU", GR: "EU", TR: "EU",
  UA: "EU", RU: "EU",
  CN: "AS", JP: "AS", KR: "AS", IN: "AS", ID: "AS", TH: "AS",
  VN: "AS", PH: "AS", MY: "AS", SG: "AS", PK: "AS", BD: "AS",
  NG: "AF", ZA: "AF", EG: "AF", KE: "AF", GH: "AF", ET: "AF",
  AU: "OC", NZ: "OC",
  SA: "ME", AE: "ME", IL: "ME", IR: "ME", IQ: "ME",
};

function getContinent(countryCode) {
  if (!countryCode) return "XX";
  return COUNTRY_TO_CONTINENT[countryCode.toUpperCase()] ?? "XX";
}

let writeTimer = null;

function scheduleWrite() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(async () => {
    await db.write();
    writeTimer = null;
  }, 500);
}

setInterval(async () => {
  await db.read();
}, 500);

app.get("/config.json", (req, res) => {
  const { hash, ...safeConfig } = db.data.config;
  res.json(safeConfig);
});

app.get("/hash", (req, res) => {
  const currentHash = getHash();
  if (!currentHash) {
    return res.json({ hash: null, message: "No hash configured." });
  }
  res.json({ hash: currentHash });
});

app.get("/auth", (req, res) => {
  const queryUser = (req.query.user || "").trim().toLowerCase();
  const hash = (req.query.hash || "").trim();

  if (!validateHash(hash)) {
    return res.status(401).send("invalid_hash");
  }

  if (db.data.config.maintenance) {
    return res.send("off");
  }

  const isBanned = db.data.bans.some((b) => {
    const val = String(b).trim().toLowerCase();
    return val === queryUser;
  });

  if (isBanned) {
    return res.send("banned");
  }

  res.send("on");
});

app.post("/user/login/", async (req, res) => {
  const { deviceId, country, hash } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId required" });
  }

  if (!validateHash(hash)) {
    return res.status(401).json({ error: "invalid hash" });
  }

  let user = db.data.users.find((u) => u.deviceId === deviceId);

  if (!user) {
    let newId = generateNumericID();
    while (db.data.users.some((u) => u.id === newId || u.userId === newId)) {
      newId = generateNumericID();
    }

    user = {
      id: newId,
      userId: newId,
      deviceId,
      continent: getContinent(country),
      username: "StumbleZesty " + newId,
      crowns: 0,
      gems: 0,
      trophys: 0,
      experience: 0,
      coins: 250,
      banned: false,
      createdAt: new Date().toISOString(),
    };
    db.data.users.push(user);
    scheduleWrite();
  }

  const isBanned =
    user.banned ||
    db.data.bans.some((b) => {
      const val = String(b).trim().toLowerCase();
      return (
        val === String(user.id) ||
        val === String(user.userId) ||
        val === user.username.trim().toLowerCase()
      );
    });

  if (isBanned) {
    return res.json({ banned: true });
  }

  res.json({
    id: user.id,
    userId: user.id,
    username: user.username,
    country: user.continent,
    trophys: user.trophys,
    crowns: user.crowns,
    experience: user.experience,
    gems: user.gems,
    coins: user.coins,
    banned: false,
  });
});

app.post("/user/update", async (req, res) => {
  const { deviceId, hash } = req.body;
  const username = req.body.username || req.body.Username;

  if (!validateHash(hash)) {
    return res.status(401).json({ error: "invalid hash" });
  }

  if (!deviceId || !username) {
    return res.status(400).json({ error: "deviceId and username required" });
  }

  const trimmed = username.trim();

  await db.read();

  const user = db.data.users.find((u) => u.deviceId === deviceId);

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  user.username = trimmed;
  scheduleWrite();

  res.json({
    id: user.id,
    userId: user.id,
    username: user.username,
    country: user.continent,
    trophys: user.trophys,
    crowns: user.crowns,
    experience: user.experience,
    gems: user.gems,
    coins: user.coins,
    banned: false,
  });
});

app.post("/user/updateusername", async (req, res) => {
  const { deviceId, hash } = req.body;
  const username = req.body.username || req.body.Username;

  if (!validateHash(hash)) {
    return res.status(401).json({ error: "invalid hash" });
  }

  if (!deviceId || !username) {
    return res.status(400).json({ error: "deviceId and username required" });
  }

  const trimmed = username.trim();

  await db.read();

  const user = db.data.users.find((u) => u.deviceId === deviceId);

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  const GEM_COST = 100;
  if (user.gems < GEM_COST) {
    return res.status(402).json({ error: "not enough gems" });
  }

  user.username = trimmed;
  user.gems -= GEM_COST;
  scheduleWrite();

  res.json({
    id: user.id,
    userId: user.id,
    username: user.username,
    country: user.continent,
    trophys: user.trophys,
    crowns: user.crowns,
    experience: user.experience,
    gems: user.gems,
    coins: user.coins,
    banned: false,
  });
});

app.post("/admin/ban", async (req, res) => {
  const { target, action } = req.body;
  const queryTarget = target || req.body.username || req.body.id || req.body.userId;

  if (!queryTarget || !["ban", "unban"].includes(action)) {
    return res.status(400).json({ error: "target + action required" });
  }

  await db.read();

  const targetStr = String(queryTarget).trim().toLowerCase();

  const userObj = db.data.users.find(
    (u) =>
      String(u.id) === targetStr ||
      String(u.userId) === targetStr ||
      u.username.trim().toLowerCase() === targetStr
  );

  if (action === "ban") {
    if (!db.data.bans.includes(targetStr)) {
      db.data.bans.push(targetStr);
    }
    if (userObj) {
      userObj.banned = true;
    }
    await db.write();
    return res.json({ success: true });
  }

  db.data.bans = db.data.bans.filter((b) => String(b).trim().toLowerCase() !== targetStr);
  if (userObj) {
    userObj.banned = false;
  }
  await db.write();
  res.json({ success: true });
});

app.post("/admin/set-hash", async (req, res) => {
  const { newHash } = req.body;

  if (!newHash) {
    return res.status(400).json({ error: "newHash required" });
  }

  await db.read();
  db.data.config.hash = newHash.trim();
  await db.write();

  res.json({ success: true });
});

app.get("/admin/users", async (req, res) => {
  await db.read();
  res.json(db.data.users);
});

app.listen(PORT, () => {
  const currentHash = getHash();
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔑 Hash: ${currentHash ?? "OFF"}`);
});
