const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Log no console para monitorar as rotas que o Unity chama
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

// Skins completas formatadas para o SharedData
const sharedSkinsList = [
    { Id: "0", id: "0", Name: "Stumble Guy", name: "Stumble Guy", Tier: 0, tier: 0, Type: "skin", type: "skin" },
    { Id: "1", id: "1", Name: "Skin 1", name: "Skin 1", Tier: 0, tier: 0, Type: "skin", type: "skin" },
    { Id: "2", id: "2", Name: "Skin 2", name: "Skin 2", Tier: 0, tier: 0, Type: "skin", type: "skin" },
    { Id: "3", id: "3", Name: "Skin 3", name: "Skin 3", Tier: 0, tier: 0, Type: "skin", type: "skin" },
    { Id: "4", id: "4", Name: "Skin 4", name: "Skin 4", Tier: 0, tier: 0, Type: "skin", type: "skin" },
    { Id: "5", id: "5", Name: "Skin 5", name: "Skin 5", Tier: 0, tier: 0, Type: "skin", type: "skin" },
    { Id: "6", id: "6", Name: "Skin 6", name: "Skin 6", Tier: 0, tier: 0, Type: "skin", type: "skin" },
    { Id: "7", id: "7", Name: "Skin 7", name: "Skin 7", Tier: 0, tier: 0, Type: "skin", type: "skin" },
    { Id: "8", id: "8", Name: "Skin 8", name: "Skin 8", Tier: 0, tier: 0, Type: "skin", type: "skin" },
    { Id: "9", id: "9", Name: "Skin 9", name: "Skin 9", Tier: 0, tier: 0, Type: "skin", type: "skin" }
];

const sharedSkinsMap = {};
sharedSkinsList.forEach(s => { sharedSkinsMap[s.Id] = s; });

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

// Manipulador do /shared corrigido para impedir o erro do AdManager e carregar o SharedData
const handleSharedConfig = (req, res) => {
    const version = req.params.version || req.query.version || "1766";
    const type = req.params.type || req.query.type || "LIVE";

    const config = {
        Status: "OK",
        status: "OK",
        RoundTime: 180,
        round_time: 180,
        roundTime: 180,
        MaxPlayers: 32,
        max_players: 32,
        maxPlayers: 32,
        DisableAds: true,
        disable_ads: true,
        disableAds: true,
        FreeSpins: 0,
        free_spins: 0,
        freeSpins: 0,
        Version: version,
        version: version,
        Type: type,
        type: type,
        Maintenance: false,
        maintenance: false,
        ForceUpdate: false,
        force_update: false,
        forceUpdate: false,
        CustomPartyEnabled: true,
        custom_party_enabled: true,
        customPartyEnabled: true,

        // Objeto exigido para o AdManager.OnSharedLoded não tomar NullReference
        Ads: {
            Disabled: true,
            disabled: true,
            Providers: [],
            providers: []
        },
        ads: {
            disabled: true,
            providers: []
        },
        AdConfig: {
            Disabled: true,
            disabled: true
        },
        adConfig: {
            disabled: true
        },

        Wheel: {
            FreeSpins: 0,
            free_spins: 0,
            CostGems: 0,
            cost_gems: 0
        },
        wheel: {
            free_spins: 0,
            cost_gems: 0
        },

        BattlePass: {
            PassTokens: 0,
            passTokens: 0,
            FreePassRewards: [],
            freePassRewards: [],
            PremiumPassRewards: [],
            premiumPassRewards: []
        },

        Maps: ["BlockDash", "LaserTracer", "CannonClimb", "PivotPush", "FloorFlip"],
        maps: ["BlockDash", "LaserTracer", "CannonClimb", "PivotPush", "FloorFlip"],

        // Suporte duplo para Skins (Array e Dicionário)
        Skins: sharedSkinsList,
        skins: sharedSkinsList,
        SharedSkins: sharedSkinsMap,

        Emotes: [],
        emotes: [],
        Animations: [],
        animations: [],
        Footsteps: [],
        footsteps: []
    };

    return res.json(config);
};

// Mapeia todas as URLs do /shared
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
            Header: "STUMBLE-ZESTY ON!",
            Message: "Conectado com sucesso na versão 1766.",
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
    console.log(`Servidor Stumble-Zesty v1766 rodando na porta ${PORT}`);
});
