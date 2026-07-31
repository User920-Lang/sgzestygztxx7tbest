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

// Modelos do Banco de Dados
const userSchema = new mongoose.Schema({
    DeviceId: { type: String, required: true, unique: true },
    Username: { type: String, required: true },
    Gems: { type: Number, default: 99999 },
    FreeGems: { type: Number, default: 99999 },
    Crowns: { type: Number, default: 9999 },
    SkillRating: { type: Number, default: 5000 },
    Experience: { type: Number, default: 10000 },
    Token: { type: String, default: "" }
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

// User Login - Retorna a conta carregada de moedas e liberação de troca de nome
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
                Gems: 99999,
                FreeGems: 99999,
                Crowns: 9999,
                SkillRating: 5000,
                Experience: 10000,
                Token: `token_${Date.now()}`
            });
            await user.save();
        }

        return res.json({
            User: {
                Id: 100000,
                DeviceId: user.DeviceId,
                Username: user.Username,
                Country: "US",
                Gems: user.Gems,
                FreeGems: user.FreeGems,
                Crowns: user.Crowns,
                SkillRating: user.SkillRating,
                Experience: user.Experience,
                Token: user.Token,
                FreeNameChange: true, // Libera a troca de nick gratuita no Unity
                Skins: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
                Emotes: [],
                Animations: [],
                Footsteps: []
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Atualização de Nome / Update Username
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

        const user = await UserModel.findOneAndUpdate(
            { DeviceId: deviceId },
            { Username: newUsername },
            { new: true }
        );

        if (user) {
            return res.json({
                User: {
                    Id: 100000,
                    DeviceId: user.DeviceId,
                    Username: user.Username,
                    Gems: user.Gems,
                    FreeGems: user.FreeGems,
                    Crowns: user.Crowns,
                    SkillRating: user.SkillRating,
                    Experience: user.Experience,
                    FreeNameChange: true
                }
            });
        }

        return res.status(404).json({ error: "User not found" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

app.post('/user/update', handleUserUpdate);
app.post('/user/name/change', handleUserUpdate);

// Fim de Partida (Ganha Coroas/Troféus)
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
                    User: {
                        DeviceId: user.DeviceId,
                        Username: user.Username,
                        Crowns: user.Crowns,
                        SkillRating: user.SkillRating
                    }
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

// Highscores / Ranking
async function getLeaderboardData(sortField) {
    const sortOption = {};
    sortOption[sortField] = -1;

    const topUsers = await UserModel.find().sort(sortOption).limit(50);

    return topUsers.map((u, index) => ({
        Rank: index + 1,
        User: {
            Id: 100000 + index,
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
            UserRank: {
                Rank: 1,
                Score: 5000
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
app.get('/user/highscore', handleHighscoreList);
app.post('/user/highscore', handleHighscoreList);

// News
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
app.listen(PORT);
