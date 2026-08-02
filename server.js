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
        Gems: user.Gems || 10000,
        gems: user.Gems || 10000,
        Tokens: user.Tokens || 999999,
        tokens: user.Tokens || 999999,
        Dust: user.Tokens || 999999,
        dust: user.Tokens || 999999,
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
    const version = req.params.version || req.query.version || "0.44.2";
    const type = req.params.type || req.query.type || "LIVE";

    return res.json({
        "round_time": 180,
        "roundTime": 180,
        "max_players": 32,
        "maxPlayers": 32,
        "disable_ads": true,
        "disableAds": true,
        "free_spins": 999,
        "freeSpins": 999,
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
            "free_spins": 999,
            "freeSpins": 999,
            "cost_gems": 0,
            "costGems": 0
        },
        "Wheel": {
            "free_spins": 999,
            "freeSpins": 999,
            "cost_gems": 0,
            "costGems": 0
        },
        "maps": ["BlockDash", "LaserTracer", "CannonClimb", "PivotPush", "FloorFlip"],
        "Maps": ["BlockDash", "LaserTracer", "CannonClimb", "PivotPush", "FloorFlip"]
    });
};

app.get('/shared/:version/:type', handleSharedConfig);
app.post('/shared/:version/:type', handleSharedConfig);
app.get('/shared', handleSharedConfig);
app.post('/shared', handleSharedConfig);
app.all('/shared*', handleSharedConfig);

app.all(['/shop*', '/user/shop*'], (req, res) => {
    return res.json({
        "Status": "OK",
        "status": "OK",
        "Offers": [
            {
                "Id": "wheel_free",
                "id": "wheel_free",
                "Type": "Wheel",
                "type": "Wheel",
                "FreeSpins": 999,
                "freeSpins": 999,
                "IsFree": true,
                "isFree": true,
                "Price": 0,
                "price": 0
            }
        ],
        "offers": [
            {
                "Id": "wheel_free",
                "id": "wheel_free",
                "Type": "Wheel",
                "type": "Wheel",
                "FreeSpins": 999,
                "freeSpins": 999,
                "IsFree": true,
                "isFree": true,
                "Price": 0,
                "price": 0
            }
        ],
        "Items": [
            { "Id": "gems_300", "Type": "Gems", "Amount": 10000, "Price": 0 }
        ]
    });
});

const handleClaimReward = async (req, res) => {
    let deviceId = extractDeviceId(req) || "device_default";
    let user = await UserModel.findOne({ DeviceId: deviceId });

    if (!user) {
        user = { Gems: 10000, Tokens: 999999, UserId: 1, Username: "OldStumbled#Player", DeviceId: deviceId };
    } else {
        user.Gems += 100;
        await user.save().catch(() => {});
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
            "Amount": 100,
            "amount": 100,
            "Id": "gems_100",
            "id": "gems_100"
        },
        "reward": {
            "Type": "Gems",
            "type": "Gems",
            "Amount": 100,
            "amount": 100,
            "Id": "gems_100",
            "id": "gems_100"
        },
        "User": userData,
        "user": userData
    });
};

app.all('/user/spin*', handleClaimReward);
app.all('/round/spin*', handleClaimReward);
app.all('/shop/claim*', handleClaimReward);
app.all('/shop/purchase*', handleClaimReward);

app.all('/user/login*', async (req, res) => {
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

app.all('/user/news*', (req, res) => {
    return res.json([
        {
            Header: "OLD-STUMBLED ON!",
            Message: "Conectado com sucesso na versão 0.44.2.",
            TimeStamp: "2024-01-01 12:00:00"
        }
    ]);
});

app.use(async (req, res) => {
    let dummyUser = {
        UserId: 1,
        Username: "OldStumbled#Player",
        Gems: 10000,
        Tokens: 999999,
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
        Version: "0.44.2",
        version: "0.44.2"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Old-Stumbled v0.44.2 rodando na porta ${PORT}`);
});
