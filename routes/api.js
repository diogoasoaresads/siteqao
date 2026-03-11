const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || 'qao_growth_secret_sD89s9aD8';

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Acesso negado' });

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

/* --- AUTH --- */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'Credenciais inválidas' });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Credenciais inválidas' });

        const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '24h' });
        // Use httpOnly cookie for better security vs localStorage
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 });
        res.json({ message: 'Login bem sucedido', user: { id: user.id, email: user.email } });
    } catch (e) {
        res.status(500).json({ error: 'Erro no servidor interno' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout bem sucedido' });
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        res.json({ id: user.id, email: user.email });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao validar sessão' });
    }
});

/* --- LEADS (PUBLIC & PRIVATE) --- */
// Público: Submissão de leads via LP
router.post('/leads', async (req, res) => {
    try {
        const { nome, telefone, email, empresa, faturamento, desafio, origem_da_pagina } = req.body;
        
        // Combina faturamento e desafio em "mensagem" se existirem
        let mensagem = req.body.mensagem || '';
        if (faturamento || desafio) {
            mensagem = `Faturamento: ${faturamento || 'N/A'}\nDesafio: ${desafio || 'N/A'}\n${mensagem}`;
        }

        const lead = await prisma.lead.create({
            data: { nome, telefone, email, empresa, mensagem, origem_da_pagina }
        });
        res.status(201).json({ message: 'Lead capturado! Logo entraremos em contato.', leadId: lead.id });
    } catch (e) {
        console.error("Erro lead:", e);
        res.status(500).json({ error: 'Erro ao processar captura do Lead' });
    }
});

// Admin Privado: Listar todos
router.get('/leads', authenticateToken, async (req, res) => {
    try {
        const rotuloStatus = req.query.status;
        const whereClause = rotuloStatus ? { status: rotuloStatus } : {};
        const leads = await prisma.lead.findMany({ where: whereClause, orderBy: { createdAt: 'desc' } });
        res.json(leads);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar leads' });
    }
});

// Admin Privado: Único Lead
router.get('/leads/:id', authenticateToken, async (req, res) => {
    try {
        const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
        res.json(lead);
    } catch (e) {
        res.status(500).json({ error: 'Lead não encontrado' });
    }
});

// Admin Privado: Pipeline Drag-and-Drop / Alteração de Status
router.put('/leads/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const lead = await prisma.lead.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json(lead);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao mover pipeline do lead' });
    }
});

// Admin Privado: Anotações do Lead
router.put('/leads/:id/observacoes', authenticateToken, async (req, res) => {
    try {
        const { observacoes } = req.body;
        const lead = await prisma.lead.update({
            where: { id: req.params.id },
            data: { observacoes }
        });
        res.json(lead);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao salvar observação' });
    }
});

// Admin Privado: Deletar Lead Lixo
router.delete('/leads/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.lead.delete({ where: { id: req.params.id } });
        res.json({ message: 'Lead excluído permanentemente' });
    } catch (e) {
        res.status(500).json({ error: 'Erro de deleção' });
    }
});

/* --- SETTINGS DA PLATAFORMA --- */
// Público (Dinâmico para o Script do Botão WA no frontend)
router.get('/settings/whatsapp', async (req, res) => {
    try {
        let settings = await prisma.whatsappSettings.findFirst();
        if (!settings) {
            settings = await prisma.whatsappSettings.create({ data: {} });
        }
        res.json({
            numero: settings.numero_whatsapp,
            texto: settings.texto_botao,
            mensagem: settings.mensagem_padrao,
            ativo: settings.botao_ativo,
            posicao: settings.posicao_botao
        });
    } catch (e) {
        // Fallback robusto se DB falhar
        res.json({ ativo: false });
    }
});

// Admin Privado: Editar configs WA
router.put('/settings/whatsapp', authenticateToken, async (req, res) => {
    try {
        const data = req.body;
        let settings = await prisma.whatsappSettings.findFirst();
        if (!settings) {
            settings = await prisma.whatsappSettings.create({ data });
        } else {
            settings = await prisma.whatsappSettings.update({
                where: { id: settings.id },
                data
            });
        }
        res.json(settings);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao salvar Widget' });
    }
});
// Público: Dinâmico para Configs Globais (A gente injeta internamente, mas essa rota GET pode ser útil no admin)
router.get('/settings/scripts', authenticateToken, async (req, res) => {
    try {
        let settings = await prisma.siteSettings.findFirst();
        if (!settings) {
            settings = await prisma.siteSettings.create({ data: {} });
        }
        res.json(settings);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao carregar scripts' });
    }
});

// Admin Privado: Editar configs Scripts
router.put('/settings/scripts', authenticateToken, async (req, res) => {
    try {
        const data = req.body;
        let settings = await prisma.siteSettings.findFirst();
        if (!settings) {
            settings = await prisma.siteSettings.create({ data });
        } else {
            settings = await prisma.siteSettings.update({
                where: { id: settings.id },
                data
            });
        }
        res.json(settings);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao salvar scripts' });
    }
});

/* --- ADMIN DASHBOARD ANALYTICS --- */
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const total = await prisma.lead.count();
        const novos = await prisma.lead.count({ where: { status: 'novo' } });
        const qualificados = await prisma.lead.count({ where: { status: 'qualificado' } });
        const fechados = await prisma.lead.count({ where: { status: 'fechado' } });
        const perdidos = await prisma.lead.count({ where: { status: 'perdido' } });
        
        // Agrupamento SQL
        const pipelineStatus = await prisma.lead.groupBy({
            by: ['status'],
            _count: { id: true }
        });
        
        const origens = await prisma.lead.groupBy({
            by: ['origem_da_pagina'],
            _count: { id: true }
        });

        const recentes = await prisma.lead.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            metrics: { total, novos, qualificados, fechados, perdidos },
            charts: { pipeline: pipelineStatus, origens },
            recentes
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Dashboard Error' });
    }
});

module.exports = router;
