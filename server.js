const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Expose public static files explicitly so we don't leak backend data
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/diagnostico-marketing', express.static(path.join(__dirname, 'diagnostico-marketing')));

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Public Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin App (React SPA Built)
app.use('/admin', express.static(path.join(__dirname, 'admin-app/dist')));
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-app/dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`[QAO Server] Running on port ${PORT}`);
});
