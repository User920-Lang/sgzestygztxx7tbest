const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const HASH_CODE = "GZTXX7-189jaiu-&B!(p093=2-0!#45v";

if (MONGO_URI) {
    mongoose.connect(MONGO_URI).catch(err => console.error("Erro no Mongo:", err));
}

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

// Rota obrigatoria do Unity para carregar moedas/configurações da economia
app.get('/shared/:version/:type', (req, res) => {
    return res.json({
        Version: parseInt(req.params.version) || 1766,
        Type: req.params.type || "LIVE",
        Config: {}
    });
});

app.post('/user/login', async (req, res) => {
    try {
        const deviceId = req.body.DeviceId;

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
                Gems: user.Gems,
                FreeGems: user.FreeGems,
                Crowns: user.Crowns,
                SkillRating: user.SkillRating,
                Experience: user.Experience,
                Token: user.Token,
                Balances: [
                    { Currency: "gems", Amount: user.Gems },
                    { Currency: "crowns", Amount: user.Crowns }
                ]
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post('/user/update', async (req, res) => {
    try {
        const { Username } = req.body;
        let authHeader = req.headers['authorization'];
        let deviceId = null;

        if (authHeader) {
            try {
                const parsed = JSON.parse(authHeader);
                deviceId = parsed.DeviceId;
            } catch (e) {}
        }

        if (deviceId && Username) {
            const user = await UserModel.findOneAndUpdate(
                { DeviceId: deviceId },
                { Username: Username },
                { new: true }
            );

            if (user) {
                return res.json({
                    User: {
                        DeviceId: user.DeviceId,
                        Username: user.Username,
                        Gems: user.Gems,
                        Crowns: user.Crowns,
                        SkillRating: user.SkillRating
                    }
                });
            }
        }

        return res.status(400).json({ error: "Update failed" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

async function getNewsResponse() {
    let newsList = await NewsModel.find();

    if (!newsList || newsList.length === 0) {
        return [
            {
                Header: "OI",
                Message: "OI.",
                TimeStamp: "2024-01-01 12:00:00"
            },
            {
                Header: "OI",
                Message: "WORKIGOU",
                TimeStamp: "2024-01-02 15:30:00"
            },
            {
                Header: "SGZESTY",
                Message: "SLA MAN, FAZ O L!",
                TimeStamp: "2024-01-03 18:00:00"
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
