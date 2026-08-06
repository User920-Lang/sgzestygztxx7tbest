const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} -> ${req.url}`);
    next();
});

const MONGO_URI = process.env.MONGO_URI;
const HASH_CODE = "GZTXX7-189jaiu-&B!(p093=2-0!#45v";

if (MONGO_URI) {
    mongoose.connect(MONGO_URI).catch(err => console.error("Erro no Mongo:", err));
}

const userSchema = new mongoose.Schema({
    DeviceId: { type: String, required: true, unique: true },
    UserId: { type: Number, required: true },
    Username: { type: String, required: true },
    Gems: { type: Number, default: 200 },
    Tokens: { type: Number, default: 100 },
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
    return `StumbleZesty#${code}`;
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

// Estrutura completa de skins para a v0.33 não dar NullReferenceException em GetSharedSkin
const fullSkinsList = [
    { id: "0", name: "Stumble Guy", tier: 0, type: "skin" },
    { id: "1", name: "Skin 1", tier: 0, type: "skin" },
    { id: "2", name: "Skin 2", tier: 0, type: "skin" },
    { id: "3", name: "Skin 3", tier: 0, type: "skin" },
    { id: "4", name: "Skin 4", tier: 0, type: "skin" },
    { id: "5", name: "Skin 5", tier: 0, type: "skin" },
    { id: "6", name: "Skin 6", tier: 0, type: "skin" },
    { id: "7", name: "Skin 7", tier: 0, type: "skin" },
    { id: "8", name: "Skin 8", tier: 0, type: "skin" },
    { id: "9", name: "Skin 9", tier: 0, type: "skin" }
];

const skinIds = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function formatUserResponse(user) {
    const userId = user.UserId || 1;
    const username = user.Username || "StumbleZesty#Player";
    const gems = user.Gems !== undefined ? user.Gems : 200;
    const tokens = user.Tokens !== undefined ? user.Tokens : 100;

    return {
        Id: userId,
        id: userId,
        UserId: userId,
        user_id: userId,
        DeviceId: user.DeviceId || "device_default",
        deviceId: user.DeviceId || "device_default",
        Username: username,
        username: username,
        Name: username,
        name: username,
        Country: "US",
        country: "US",
        Region: "USE",
        region: "USE",
        Gems: gems,
        gems: gems,
        Tokens: tokens,
        tokens: tokens,
        Dust: tokens,
        dust: tokens,
        Crowns: user.Crowns || 0,
        crowns: user.Crowns || 0,
        SkillRating: user.SkillRating || 0,
        skillRating: user.SkillRating || 0,
        Experience: user.Experience || 0,
        experience: user.Experience || 0,
        Token: user.AuthToken || "token_default",
        token: user.AuthToken || "token_default",
        banned: false,
        FreeNameChange: true,
        freeNameChange: true,

        Balances: [
            { Name: "Gems", Amount: gems },
            { Name: "Tokens", Amount: tokens }
        ],
        balances: [
            { Name: "Gems", Amount: gems },
            { Name: "Tokens", Amount: tokens }
        ],

        Skins: skinIds,
        skins: skinIds,
        SkinVariants: [],
        skinVariants: [],
        Emotes: ["emote_happy", "emote_cry", "emote_hi"],
        emotes: ["emote_happy", "emote_cry", "emote_hi"],
        Animations: ["animation1"],
        animations: ["animation1"],
        Footsteps: ["footsteps_smoke"],
        footsteps: ["footsteps_smoke"]
    };
}

app.get('/auth', (req, res) => {
    try {
        const hash = req.query.hash;
        if (hash === HASH_CODE) {
            return res.send("on");
        }
        return res.send("invalid_hash");
    } catch (error) {
        return res.send("off");
    }
});

const handleSharedConfig = (req, res) => {
    const version = req.params.version || req.query.version || "0.33";
    const type = req.params.type || req.query.type || "LIVE";

    const sharedPayload = {
        "round_time": 180,
        "roundTime": 180,
        "max_players": 32,
        "maxPlayers": 32,
        "disable_ads": true,
        "disableAds": true,
        "free_spins": 0,
        "freeSpins": 0,
        "version": version,
        "Version": version,
        "type": type,
        "Type": type,
        "maintenance": false,
        "Maintenance": false,
        "force_update": false,
        "forceUpdate": false,
        "custom_party_enabled": true,
        "customPartyEnabled": true,
        "wheel": {
            "free_spins": 0,
            "freeSpins": 0,
            "cost_gems": 0,
            "costGems": 0
        },
        "Wheel": {
            "free_spins": 0,
            "freeSpins": 0,
            "cost_gems": 0,
            "costGems": 0
        },
        "maps": ["BlockDash", "LaserTracer", "CannonClimb", "PivotPush", "FloorFlip"],
        "Maps": ["BlockDash", "LaserTracer", "CannonClimb", "PivotPush", "FloorFlip"],
        
        "skins": fullSkinsList,
        "Skins": fullSkinsList,
        "emotes": [],
        "Emotes": [],
        "animations": [],
        "Animations": [],
        "footsteps": [],
        "Footsteps": []
    };

    return res.json({
        ...sharedPayload,
        "sharedData": sharedPayload,
        "SharedData": sharedPayload
    });
};

app.get('/shared/:version/:type', handleSharedConfig);
app.post('/shared/:version/:type', handleSharedConfig);
app.get('/shared', handleSharedConfig);
app.post('/shared', handleSharedConfig);
app.all('/shared*', handleSharedConfig);

app.all(['/shop*', '/user/shop'], (req, res) => {
    return res.json({
        "Status": "OK",
        "status": "OK",
        "Offers": [],
        "offers": [],
        "Items": []
    });
});

const handleClaimReward = async (req, res) => {
    let deviceId = extractDeviceId(req) || "device_default";
    let user = await UserModel.findOne({ DeviceId: deviceId });

    if (!user) {
        user = { Gems: 200, Tokens: 100, UserId: 1, Username: "StumbleZesty#Player", DeviceId: deviceId };
    }

    const userData = formatUserResponse(user);

    return res.json({
        "Status": "OK",
        "status": "OK",
        "Success": true,
        "success": true,
        "Reward": {
            "Type": "Gems",
            "type": "Gems",
            "Amount": 0,
            "amount": 0,
            "Id": "gems_0",
            "id": "gems_0"
        },
        "User": userData,
        "user": userData
    });
};

app.all('/user/spin', handleClaimReward);
app.all('/round/spin', handleClaimReward);
app.all('/shop/claim', handleClaimReward);
app.all('/shop/purchase', handleClaimReward);

app.all('/user/login', async (req, res) => {
    try {
        let deviceId = extractDeviceId(req) || `device_${Date.now()}`;
        let user = await UserModel.findOne({ DeviceId: deviceId });

        if (!user) {
            user = new UserModel({
                DeviceId: deviceId,
                UserId: generateRandomUserId(),
                Username: generateRandomTag(),
                Gems: 200,
                Tokens: 100,
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
            Version: "0.33",
            version: "0.33",
            Type: "LIVE",
            type: "LIVE"
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.all('/user/news*', (req, res) => {
    return res.json([
        {
            Header: "STUMBLE-ZESTY ON!",
            Message: "Conectado com sucesso na versão 0.33.",
            TimeStamp: "2024-01-01 12:00:00"
        }
    ]);
});

app.use(async (req, res) => {
    let dummyUser = {
        UserId: 1,
        Username: "StumbleZesty#Player",
        Gems: 200,
        Tokens: 100,
        Crowns: 0,
        SkillRating: 0,
        Experience: 0,
        AuthToken: "token_default",
        DeviceId: "device_default"
    };
    const userData = formatUserResponse(dummyUser);

    return res.json({
        Status: "OK",
        status: "OK",
        User: userData,
        user: userData,
        Version: "0.33",
        version: "0.33"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Stumble-Zesty v0.33 rodando na porta ${PORT}`);
});
