const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} -> ${req.url}`);
    next();
});

const MONGO_URI = process.env.MONGO_URI;
const HASH_CODE = "GZTXX7-189jaiu-&B!(p093=2-0!#45v";

if (MONGO_URI) {
    mongoose.connect(MONGO_URI).catch(err => console.error("MongoDB Error:", err));
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

const userOwnedSkinIds = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

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

        Skins: userOwnedSkinIds,
        skins: userOwnedSkinIds,
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

let SharedData = null;
const jsonPath = path.join(__dirname, 'DefaultShared.json');

try {
    if (fs.existsSync(jsonPath)) {
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        SharedData = JSON.parse(rawData);
    }
} catch (err) {
    console.error(err.message);
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

const handleShared = (req, res) => {
    const version = req.params.version || req.query.version || "1766";
    const type = req.params.type || req.query.type || "LIVE";

    if (SharedData) {
        return res.json({
            ...SharedData,
            Status: "OK",
            status: "OK",
            Version: version,
            version: version,
            Type: type,
            type: type
        });
    }

    return res.json({
        Status: "OK",
        status: "OK",
        Version: version,
        Type: type,
        RoundTime: 180,
        MaxPlayers: 32,
        DisableAds: true,
        AdSettings: { UseTestAds: false, DisableForDevices: [] },
        Ads: { Disabled: true, Providers: [] },
        AdConfig: { Disabled: true },
        BattlePass: { PassTokens: 0, FreePassRewards: [], PremiumPassRewards: [] },
        Maps: ["BlockDash", "LaserTracer", "CannonClimb"],
        Skins: [],
        Emotes: [],
        Animations: [],
        Footsteps: []
    });
};

app.all('/shared*', handleShared);

app.all(['/shop*', '/user/shop'], (req, res) => {
    return res.json({
        Status: "OK",
        status: "OK",
        Offers: [],
        offers: [],
        Items: []
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
        Status: "OK",
        status: "OK",
        Success: true,
        success: true,
        Reward: {
            Type: "Gems",
            type: "Gems",
            Amount: 0,
            amount: 0,
            Id: "gems_0",
            id: "gems_0"
        },
        User: userData,
        user: userData
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
            Version: "1766",
            version: "1766",
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
            Header: "STUMBLE-ZESTY",
            Message: "OK",
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
        Version: "1766",
        version: "1766"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
