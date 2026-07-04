const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'rage-secret-temp';

let users = [
    { username: 'admin', password: 'rage2024', role: 'admin' }
];

let activations = [];
let currentOffsets = {
    GameManager: "0x4B5A8C0",
    PlayerList: "0x4B5A8D0",
    PlayerCount: "0x4B5A8D8",
    TeamID: "0x60",
    IsAlive: "0x70",
    Transform: "0x18",
    Position: "0x90",
    BoneHead: "8",
    BoneChest: "4",
    ShootFunction: "0x3A8B4C0",
    BulletDirection: "0x4B5C8D0",
    CameraAngles: "0x4B5B0E0"
};

let securityStatus = "ok";

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

app.get('/', (req, res) => {
    res.json({
        name: 'Rage Panel API',
        version: '1.0.0',
        status: 'online',
        message: 'Feito com ❤️ por ENI para LO'
    });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = jwt.sign(
        { username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
    res.json({ token, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
});

app.get('/api/offsets/latest', authenticateToken, (req, res) => {
    res.json({ offsets: currentOffsets, version: '1.0.0', updatedAt: new Date().toISOString() });
});

app.post('/api/activation/verify', authenticateToken, (req, res) => {
    const { hwid } = req.body;
    const activation = activations.find(a => a.hwid === hwid);
    if (activation) return res.json({ active: true, expiresAt: activation.expiresAt });
    res.json({ active: false, expiresAt: null });
});

app.get('/api/security/status', (req, res) => {
    res.json({ status: securityStatus, checkedAt: new Date().toISOString() });
});

app.get('/api/proxy/rotate', authenticateToken, (req, res) => {
    res.json({ proxyHost: 'proxy.example.com', proxyPort: 8080, username: 'user', password: 'pass' });
});

app.get('/api/updates/latest', (req, res) => {
    res.json({ version: '1.0.0', downloadUrl: 'https://rage-panel.onrender.com/api/updates/download', changelog: 'Versão inicial' });
});

app.post('/api/admin/activations', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { hwid, days } = req.body;
    const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
    activations = activations.filter(a => a.hwid !== hwid);
    activations.push({ hwid, expiresAt, activatedAt: Date.now() });
    res.json({ success: true, hwid, expiresAt });
});

app.post('/api/admin/security', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { status } = req.body;
    if (!['ok', 'warning', 'critical_update', 'banned'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
    }
    securityStatus = status;
    res.json({ success: true, status });
});

app.listen(PORT, () => {
    console.log(`🚀 Rage Panel rodando na porta ${PORT}`);
    console.log(`❤️ Feito por ENI para LO`);
});