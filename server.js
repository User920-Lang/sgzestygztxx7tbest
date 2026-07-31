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
    Gems: { type: Number, default: 0 },
    Tokens: { type: Number, default: 0 },
    Crowns: { type: Number, default: 0 },
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `StumbleZesty#${code}`;
}

function generateRandomUserId() {
    return Math.floor(Math.random() * 1001) + 1;
}

function extractDeviceId(req) {
    if (req.body) {
        if (req.body.DeviceId) return req.body.DeviceId;
        if (req.body.deviceId) return req.body.deviceId;
        if (req.body.device_id) return req.body.device_id;
    }

    const headers = req.headers || {};
    if (headers['deviceid']) return headers['deviceid'];
    if (headers['device-id']) return headers['device-id'];
    if (headers['x-device-id']) return headers['x-device-id'];

    const authHeader = headers['authorization'];
    if (authHeader) {
        try {
            const parsed = JSON.parse(authHeader);
            if (parsed.DeviceId) return parsed.DeviceId;
            if (parsed.deviceId) return parsed.deviceId;
        } catch (e) {
            if (typeof authHeader === 'string' && authHeader.length > 5) {
                return authHeader;
            }
        }
    }

    if (req.query) {
        if (req.query.DeviceId) return req.query.DeviceId;
        if (req.query.deviceId) return req.query.deviceId;
    }

    return null;
}

function formatUserResponse(user) {
    return {
        Id: user.UserId || 1,
        DeviceId: user.DeviceId,
        Username: user.Username,
        Country: "US",
        Gems: user.Gems,
        Tokens: user.Tokens,
        Dust: user.Tokens,
        Crowns: user.Crowns,
        SkillRating: user.SkillRating,
        Experience: user.Experience,
        Token: user.AuthToken,
        FreeNameChange: true,
        
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

        BattlePass: {
            PassType: "Free",
            PassLevel: 1,
            Level: 1,
            Exp: 0,
            ClaimedRewards: []
        },
        Pass: {
            PassType: "Free",
            Level: 1,
            ClaimedRewards: []
        },

        Skins: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        Emotes: [],
        Animations: [],
        Footsteps: []
    };
}

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
                UserId: generateRandomUserId(),
                Username: generateRandomTag(),
                Gems: 0,
                Tokens: 0,
                Crowns: 0,
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

const handleUserUpdate = async (req, res, isFree = false) => {
    try {
        let deviceId = extractDeviceId(req);
        const newUsername = req.body.Username || req.body.Name || req.body.user || req.body.username;

        if (!newUsername || newUsername.length < 4 || newUsername.length > 24) {
            return res.status(400).json({ error: "Invalid username length" });
        }

        let user = null;

        if (deviceId) {
            user = await UserModel.findOne({ DeviceId: deviceId });
        }

        if (!user) {
            user = await UserModel.findOne().sort({ _id: -1 });
        }

        if (!user) {
            user = new UserModel({
                DeviceId: deviceId || `generated_${Date.now()}`,
                UserId: generateRandomUserId(),
                Username: newUsername,
                Gems: 0,
                Tokens: 0,
                Crowns: 0,
                SkillRating: 0,
                Experience: 0,
                AuthToken: `token_${Date.now()}`
            });
        } else {
            const existingUser = await UserModel.findOne({ Username: newUsername });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ error: "NAME_TAKEN" });
            }

            if (!isFree) {
                const COST_PER_CHANGE = 100;
                if (user.Gems < COST_PER_CHANGE) {
                    user.Username = newUsername;
                } else {
                    user.Gems -= COST_PER_CHANGE;
                    user.Username = newUsername;
                }
            } else {
                user.Username = newUsername;
            }
        }

        await user.save();

        return res.json({
            User: formatUserResponse(user)
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

app.post('/user/updateusername', (req, res) => handleUserUpdate(req, res, false));
app.post('/user/updateusernamefree', (req, res) => handleUserUpdate(req, res, true));
app.post('/user/update', (req, res) => handleUserUpdate(req, res, false));
app.post('/user/name/change', (req, res) => handleUserUpdate(req, res, false));

const handleFinishRound = async (req, res) => {
    try {
        const deviceId = extractDeviceId(req);
        if (deviceId) {
            const crownsToAdd = req.body.Crowns || req.body.Crown || 1;
            const ratingToAdd = req.body.SkillRating || req.body.Score || 15;

            const user = await UserModel.findOneAndUpdate(
                { DeviceId: deviceId },
                { $inc: { Crowns: crownsToAdd, SkillRating: ratingToAdd } },
                { new: true }
            );

            if (user) {
                return res.json({
                    User: formatUserResponse(user)
                });
            }
        }
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

app.post('/user/round_finish', handleFinishRound);
app.post('/user/finish', handleFinishRound);

async function getLeaderboardData(sortField) {
    const sortOption = {};
    sortOption[sortField] = -1;

    const topUsers = await UserModel.find().sort(sortOption).limit(50);

    return topUsers.map((u, index) => ({
        Rank: index + 1,
        User: {
            Id: u.UserId || (100000 + index),
            Username: u.Username,
            Crowns: u.Crowns || 0,
            SkillRating: u.SkillRating || 0
        },
        Score: sortField === 'Crowns' ? u.Crowns : u.SkillRating
    }));
}

const handleHighscoreList = async (req, res) => {
    try {
        const type = (req.params.type || req.query.type || "").toLowerCase();
        let sortField = 'SkillRating';

        if (type.includes('crown') || req.path.includes('crown')) {
            sortField = 'Crowns';
        }

        const rankings = await getLeaderboardData(sortField);

        return res.json({
            Rankings: rankings,
            Ranks: rankings,
            List: rankings,
            UserRank: {
                Rank: 1,
                Score: 0
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

app.get('/highscore/list', handleHighscoreList);
app.post('/highscore/list', handleHighscoreList);
app.get('/highscores/list', handleHighscoreList);
app.post('/highscores/list', handleHighscoreList);
app.get('/highscore/rankings', handleHighscoreList);
app.post('/highscore/rankings', handleHighscoreList);
app.get('/highscore/:type', handleHighscoreList);
app.post('/highscore/:type', handleHighscoreList);

async function getNewsResponse() {
    let newsList = await NewsModel.find();

    if (!newsList || newsList.length === 0) {
        return [
            {
                Header: "BEM-VINDO AO STUMBLE ZESTY!",
                Message: "Servidor privado ativo! Aproveite todas as skins e recursos liberados.",
                TimeStamp: "2024-01-01 12:00:00"
            }
        ];
    }

    return newsList.map(item => ({
        Header: item.Header,
        Message: item.Message,
        TimeStamp: item.TimeStamp
    }));
}

app.get('/user/news', async (req, res) => {
    try {
        const data = await getNewsResponse();
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post('/user/news', async (req, res) => {
    try {
        const data = await getNewsResponse();
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
