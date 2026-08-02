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

const userSchema = new mongoose.Schema({
    DeviceId: { type: String, required: true, unique: true },
    UserId: { type: Number, required: true },
    Username: { type: String, required: true },
    Gems: { type: Number, default: 10000 },
    Tokens: { type: Number, default: 999999 },
    Crowns: { type: Number, default: 0 },
    SkillRating: { type: Number, default: 0 },
    Experience: { type: Number, default: 0 },
    AuthToken: { type: String, default: "" },
    banned: { type: Boolean, default: false }
});

const UserModel = mongoose.model('User', userSchema);

function generateRandomTag() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `OldStumbled#${code}`;
}

function generateRandomUserId() {
    return Math.floor(Math.random() * 10000) + 1;
}

function extractDeviceId(req) {
    if (req.body) {
        if (req.body.DeviceId) return req.body.DeviceId;
        if (req.body.deviceId) return req.body.deviceId;
    }
    const headers = req.headers || {};
    if (headers['deviceid']) return headers['deviceid'];
    if (headers['device-id']) return headers['device-id'];
    return null;
}

function formatUserResponse(user) {
    const userId = user.UserId || 1;
    const username = user.Username || "OldStumbled#Player";

    return {
        Id: userId,
        id: userId,
        UserId: userId,
        user_id: userId,
        DeviceId: user.DeviceId,
        deviceId: user.DeviceId,
        Username: username,
        username: username,
        Name: username,
        name: username,
        Country: "US",
        country: "US",
        Gems: user.Gems,
        gems: user.Gems,
        Tokens: user.Tokens,
        tokens: user.Tokens,
        Dust: user.Tokens,
        dust: user.Tokens,
        Crowns: user.Crowns,
        crowns: user.Crowns,
        SkillRating: user.SkillRating,
        skillRating: user.SkillRating,
        Experience: user.Experience,
        experience: user.Experience,
        Token: user.AuthToken || "token_default",
        token: user.AuthToken || "token_default",
        banned: false,
        FreeNameChange: true,
        freeNameChange: true,
        Skins: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        skins: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        Emotes: [],
        emotes: [],
        Animations: [],
        animations: [],
        Footsteps: [],
        footsteps: []
    };
}

// Rota de Autenticação / Login Principal
app.post('/user/login', async (req, res) => {
    try {
        let deviceId = extractDeviceId(req) || `device_${Date.now()}`;
        let user = await UserModel.findOne({ DeviceId: deviceId });

        if (!user) {
            user = new UserModel({
                DeviceId: deviceId,
                UserId: generateRandomUserId(),
                Username: generateRandomTag(),
                Gems: 10000,
                Tokens: 999999,
                Crowns: 0,
                SkillRating: 0,
                Experience: 0,
                banned: false,
                AuthToken: `token_${Date.now()}`
            });
            await user.save();
        }

        const userData = formatUserResponse(user);

        return res.json({
            User: userData,
            user: userData,
            Status: "OK",
            status: "OK",
            Version: "0.44.2",
            version: "0.44.2",
            Type: "LIVE",
            type: "LIVE"
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.all('/shared/:version/:type', (req, res) => {
    return res.json({
        "round_time": 180,
        "max_players": 32,
        "disable_ads": true,
        "free_spins": 999,
        "version": req.params.version || "0.37",
        "type": req.params.type || "LIVE"
    });
});

app.all('/shop*', (req, res) => {
    return res.json({
        Offers: [
            { Id: "gems_300", Type: "Gems", Amount: 10000, Price: 0, IsFree: true }
        ],
        Items: [
            { Id: "gems_300", Type: "Gems", Amount: 10000, Price: 0 }
        ]
    });
});

app.all('/user/news', (req, res) => {
    return res.json([
        {
            Header: "OLD-STUMBLED ON!",
            Message: "Servidor privado conectado com sucesso.",
            TimeStamp: "2024-01-01 12:00:00"
        }
    ]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Old-Stumbled rodando na porta ${PORT}`);
});
