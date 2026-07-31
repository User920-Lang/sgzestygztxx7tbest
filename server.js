const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const HASH_CODE = "GZTXX7-189jaiu-&B!(p093=2-0!#45v";

if (MONGO_URI) {
    mongoose.connect(MONGO_URI).catch(err => console.error("Erro no Mongo:", err));
}

// Schema com Gems (500), Tokens/Dust (250) e Crowns (250)
const userSchema = new mongoose.Schema({
    DeviceId: { type: String, required: true, unique: true },
    Username: { type: String, required: true },
    Gems: { type: Number, default: 500 },
    Tokens: { type: Number, default: 250 },
    Crowns: { type: Number, default: 250 },
    SkillRating: { type: Number, default: 0 },
    Experience: { type: Number, default: 0 },
    AuthToken: { type: String, default: "" }
});

const newsSchema = new mongoose.Schema({
    Header: { type: String, required: true },
    Message: { type: String, required: true },
    TimeStamp: { type: String, required: true }
});

const UserModel = mongoose.model('User', userSchema);
const NewsModel = mongoose.model('News', newsSchema);

function generateRandomTag() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `StumbleZesty#${code}`;
}

function extractDeviceId(req) {
    if (req.body && req.body.DeviceId) {
        return req.body.DeviceId;
    }
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        try {
            const parsed = JSON.parse(authHeader);
            if (parsed.DeviceId) return parsed.DeviceId;
        } catch (e) {
            if (typeof authHeader === 'string' && authHeader.length > 5) {
                return authHeader;
            }
        }
    }
    return null;
}

// Auth Check
app.get('/auth', (req, res) => {
    try {
        const hash = req.query.hash;
        if (hash === HASH_CODE) {
            return res.send("on");
        }
        return res.status(401).send("off");
    } catch (error) {
        return res.status(500).send("error");
    }
});

// Shared Config
app.all('/shared/:version/:type', (req, res) => {
    const sharedPath = path.join(__dirname, 'Shared.json');

    if (fs.existsSync(sharedPath)) {
        res.setHeader('Content-Type', 'application/json');
        return res.sendFile(sharedPath);
    }

    return res.json({
        "round_time": 180,
        "max_players": 32,
        "disable_ads": true,
        "free_spins": 999,
        "version": req.params.version || "1766",
        "type": req.params.type || "LIVE"
    });
});

// Função Helper para formatar o usuário exatamente como o C# desserializa
function formatUserResponse(user) {
    return {
        Id: 100000,
        DeviceId: user.DeviceId,
        Username: user.Username,
        Country: "US",
        Gems: user.Gems,
        Tokens: user.Tokens,
        Crowns: user.Crowns,
        SkillRating: user.SkillRating,
        Experience: user.Experience,
        Token: user.AuthToken,
        FreeNameChange: false,
        // Balances é onde o C# da v0.33 busca moedas/dust/tokens
        Balances: [
            { Currency: "Gems", Amount: user.Gems },
            { Currency: "Tokens", Amount: user.Tokens },
            { Currency: "Dust", Amount: user.Tokens },
            { Currency: "Crowns", Amount: user.Crowns }
        ],
        Currencies: {
            Gems: user.Gems,
            Tokens: user.Tokens,
            Dust: user.Tokens,
            Crowns: user.Crowns
        },
        Skins: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        Emotes: [],
        Animations: [],
        Footsteps: []
    };
}

// Login
app.post('/user/login', async (req, res) => {
    try {
        const deviceId = extractDeviceId(req);

        if (!deviceId) {
            return res.status(400).json({ error: "DeviceId missing" });
        }

        let user = await UserModel.findOne({ DeviceId: deviceId });

        if (!user) {
            user = new UserModel({
                DeviceId: deviceId,
                Username: generateRandomTag(),
                Gems: 500,
                Tokens: 250,
                Crowns: 250,
                SkillRating: 0,
                Experience: 0,
                AuthToken: `token_${Date.now()}`
            });
            await user.save();
        }

        return res.json({
            User: formatUserResponse(user)
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Update Username desconta 100 Gemas
const handleUserUpdate = async (req, res) => {
    try {
        const deviceId = extractDeviceId(req);
        const newUsername = req.body.Username || req.body.Name || req.body.user;

        if (!deviceId) {
            return res.status(400).json({ error: "DeviceId missing" });
        }

        if (!newUsername) {
            return res.status(400).json({ error: "New Username missing" });
        }

        let user = await UserModel.findOne({ DeviceId: deviceId });

        if (!user) {
            return res.
