const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db';
}
const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || 'qao_growth_secret_sD89s9aD8';

// Helper para gravação de log limpa no BD
const logSystemEvent = async (level, source, message, details = null) => {
    try {
        await prisma.systemLog.create({
            data: { level, source, message, details: details ? JSON.stringify(details) : null }
        });
    } catch(e) {
        console.error("Critical falha ao gravar log no BD:", e);
    }
};

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
const sendNotificationWebhook = async (lead) => {
    try {
        const settings = await prisma.siteSettings.findFirst();
        if (!settings) return;

        if (settings.notificacao_email && settings.smtp_host && settings.smtp_user && settings.destinatario_email) {
            const nodemailer = require('nodemailer');
            // Hostgator, Hostinger e maioria = TLS 465/587
            const port = parseInt(settings.smtp_port) || 465;
            const transporter = nodemailer.createTransport({
                host: settings.smtp_host,
                port: port,
                secure: port === 465,
                auth: { user: settings.smtp_user, pass: settings.smtp_pass }
            });
            await transporter.sendMail({
                from: `"QAO Notificações" <${settings.smtp_user}>`,
                to: settings.destinatario_email,
                subject: `🔥 Novo Lead Capturado: ${lead.nome} (${lead.origem_da_pagina || 'Indefinida'})`,
                text: `Temos um novo contato no funil QAO!\n\nNome: ${lead.nome}\nTelefone: ${lead.telefone}\nEmail: ${lead.email || 'N/A'}\nEmpresa: ${lead.empresa || 'N/A'}\nOrigem: ${lead.origem_da_pagina || 'Indefinida'}\nMensagem: ${lead.mensagem || 'N/A'}\n\nAcesse o seu painel de Admin para acompanhar e mover o card deste lead.`
            });
            await logSystemEvent('success', 'email_notification', `E-mail enviado para o lead: ${lead.nome}`);
        }

        if (settings.notificacao_whatsapp && settings.api_whatsapp_url && settings.telefone_notificacao) {
            const message = `*🎯 NOVO LEAD CAPTURADO!*\n\n*Nome:* ${lead.nome}\n*Whats:* ${lead.telefone}\n*Empresa:* ${lead.empresa || 'N/A'}\n*Origem:* ${lead.origem_da_pagina || 'Indefinida'}\n\nAbra o painel admin para gerenciar.`;
            
            // Aceita formatos de N8N, Evolution ou Z-API mesclando as keys 'number', 'phone', 'text' e 'message' no payload e auth
            const headers = { 'Content-Type': 'application/json' };
            if(settings.api_whatsapp_token) {
                headers['Authorization'] = `Bearer ${settings.api_whatsapp_token}`;
                headers['apikey'] = settings.api_whatsapp_token;
            }

            let numeroLimpo = settings.telefone_notificacao.replace(/\D/g, '');
            // Se o usuário esqueceu o DDI do Brasil (55)
            if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
                numeroLimpo = '55' + numeroLimpo;
            }
            
            const reqWa = await fetch(settings.api_whatsapp_url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    number: numeroLimpo,
                    options: { delay: 1200, presence: 'composing' },
                    textMessage: { text: message },
                    text: message
                })
            });
            
            const waResponse = await reqWa.text();
            if (reqWa.ok) {
                await logSystemEvent('success', 'webhook_evolution', `Webhook disparado com sucesso p/ o número ${numeroLimpo}`);
            } else {
                await logSystemEvent('error', 'webhook_evolution', `Evolution API recusou o pacote (HTTP ${reqWa.status})`, waResponse);
            }
        }
    } catch(err) {
        await logSystemEvent('error', 'webhook_evolution', `Falha total no request assíncrono`, err.message || err.toString());
    }
};

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

        // Dispara assincronamente as notificações sem travar o response da View
        sendNotificationWebhook(lead);
        await logSystemEvent('info', 'lead_capture', `Novo lead recebido: ${nome} via ${origem_da_pagina || 'site'}`);

        res.status(201).json({ message: 'Lead capturado! Logo entraremos em contato.', leadId: lead.id });
    } catch (e) {
        await logSystemEvent('error', 'lead_capture', `Erro ao cadastrar lead no BD`, e.message);
        res.status(500).json({ error: 'Erro ao processar captura do Lead' });
    }
});

// Público: Atualização parcial de lead para formulário multistep
router.patch('/leads/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, telefone, email, empresa, faturamento, desafio } = req.body;

        // Buscar lead existente
        const lead = await prisma.lead.findUnique({ where: { id } });
        if (!lead) {
            return res.status(404).json({ error: 'Lead não encontrado' });
        }

        // Trata faturamento e desafio em "mensagem"
        let novaMensagem = lead.mensagem || '';
        if (faturamento || desafio) {
            const partes = [];
            if (faturamento) partes.push(`Faturamento: ${faturamento}`);
            if (desafio) partes.push(`Desafio: ${desafio}`);
            novaMensagem = partes.join('\n');
        }

        const updatedLead = await prisma.lead.update({
            where: { id },
            data: {
                nome: nome !== undefined ? nome : lead.nome,
                telefone: telefone !== undefined ? telefone : lead.telefone,
                email: email !== undefined ? email : lead.email,
                empresa: empresa !== undefined ? empresa : lead.empresa,
                mensagem: novaMensagem || lead.mensagem
            }
        });

        await logSystemEvent('info', 'lead_update', `Lead atualizado (multistep): ${updatedLead.nome} (${updatedLead.empresa || 'Sem empresa'})`);

        res.json({ message: 'Lead atualizado com sucesso!', leadId: updatedLead.id });
    } catch (e) {
        await logSystemEvent('error', 'lead_update', `Erro ao atualizar lead (multistep) no BD`, e.message);
        res.status(500).json({ error: 'Erro ao processar atualização do Lead' });
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

// Público: IDs mínimos para eventos de conversão no frontend.
// Não expõe scripts customizados nem configurações sensíveis do admin.
router.get('/settings/tracking', async (req, res) => {
    try {
        const settings = await prisma.siteSettings.findFirst();
        res.json({
            google_analytics_id: settings?.google_analytics_id || '',
            google_ads_id: settings?.google_ads_id || '',
            meta_pixel_id: settings?.meta_pixel_id || ''
        });
    } catch (e) {
        res.json({
            google_analytics_id: '',
            google_ads_id: '',
            meta_pixel_id: ''
        });
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

// Logs Endpoint
router.get('/settings/logs', authenticateToken, async (req, res) => {
    try {
        const logs = await prisma.systemLog.findMany({
            take: 30,
            orderBy: { createdAt: 'desc' }
        });
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar auditoria' });
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

        // Métricas de Growth adicionais
        const totalClients = await prisma.client.count();
        const activeClients = await prisma.client.count({ where: { status: 'ativo' } });
        const activeClientsList = await prisma.client.findMany({ where: { status: 'ativo' } });
        const mrr = activeClientsList.reduce((acc, c) => acc + (c.valorMensal || 0), 0);
        
        const runningExperiments = await prisma.growthExperiment.count({
            where: { status: { in: ['em_teste', 'backlog'] } }
        });
        const pendingTasks = await prisma.growthTask.count({
            where: { status: { in: ['a_fazer', 'em_andamento'] } }
        });

        // Portfólio Executivo de Clientes Ativos
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const activeClientsFull = await prisma.client.findMany({
            where: { status: 'ativo' },
            include: {
                experiments: {
                    where: { status: 'em_teste' }
                },
                tasks: {
                    where: {
                        status: { not: 'concluido' }
                    }
                },
                metrics: {
                    orderBy: { periodo: 'desc' },
                    take: 1
                }
            }
        });

        const portfolio = activeClientsFull.map(c => {
            const activeExperimentsCount = c.experiments.length;
            const activeTasksCount = c.tasks.length;
            const overdueTasksCount = c.tasks.filter(t => t.dueDate && new Date(t.dueDate) < hoje).length;
            
            const lastMetric = c.metrics[0] || null;
            let ltvCacRatio = null;
            let ltvCacHealth = 'sem_dados';
            
            if (lastMetric && lastMetric.cac > 0) {
                ltvCacRatio = lastMetric.ltv / lastMetric.cac;
                if (ltvCacRatio >= 3) {
                    ltvCacHealth = 'saudavel';
                } else if (ltvCacRatio >= 1.5) {
                    ltvCacHealth = 'atencao';
                } else {
                    ltvCacHealth = 'alerta';
                }
            } else if (lastMetric && lastMetric.ltv > 0 && lastMetric.cac === 0) {
                ltvCacRatio = lastMetric.ltv;
                ltvCacHealth = 'saudavel';
            }

            return {
                id: c.id,
                nome: c.nome,
                empresa: c.empresa,
                valorMensal: c.valorMensal,
                budgetAds: c.budgetAds,
                activeExperimentsCount,
                activeTasksCount,
                overdueTasksCount,
                ltvCacRatio: ltvCacRatio !== null ? Number(ltvCacRatio.toFixed(2)) : null,
                ltvCacHealth
            };
        });

        res.json({
            metrics: { 
                total, novos, qualificados, fechados, perdidos,
                totalClients, activeClients, mrr, runningExperiments, pendingTasks
            },
            charts: { pipeline: pipelineStatus, origens },
            recentes,
            portfolio
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Dashboard Error' });
    }
});

router.post('/dashboard/daily-digest', authenticateToken, async (req, res) => {
    try {
        const settings = await prisma.siteSettings.findFirst();
        if (!settings || !settings.api_whatsapp_url || !settings.telefone_notificacao) {
            return res.status(400).json({ error: 'Configurações de integração de WhatsApp incompletas. Por favor, acerte nas configurações de integrações.' });
        }

        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const fimDeHoje = new Date();
        fimDeHoje.setHours(23,59,59,999);

        // Buscar tarefas atrasadas (não concluidas e vencimento < hoje)
        const overdueTasks = await prisma.growthTask.findMany({
            where: {
                status: { not: 'concluido' },
                dueDate: { lt: hoje }
            },
            include: { client: true }
        });

        // Buscar tarefas para hoje (não concluidas e vencimento entre hoje 00:00 e 23:59)
        const todayTasks = await prisma.growthTask.findMany({
            where: {
                status: { not: 'concluido' },
                dueDate: {
                    gte: hoje,
                    lte: fimDeHoje
                }
            },
            include: { client: true }
        });

        // Buscar experimentos ativos (em_teste)
        const activeExperiments = await prisma.growthExperiment.findMany({
            where: { status: 'em_teste' },
            include: { client: true }
        });

        // Formatar mensagem
        let message = `🚀 *QAO Growth Advisory - Resumo Executivo Diário* 🚀\n`;
        message += `Período: ${new Date().toLocaleDateString('pt-BR')}\n\n`;

        message += `⚠️ *TAREFAS ATRASADAS:*\n`;
        if (overdueTasks.length === 0) {
            message += `• Nenhuma tarefa atrasada. Excelente trabalho!\n`;
        } else {
            overdueTasks.forEach(t => {
                const dataFormatada = t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : '';
                message += `• *[${t.client?.empresa || 'Sem Cliente'}]* ${t.title} (Venceu em: ${dataFormatada})\n`;
            });
        }
        message += `\n`;

        message += `📅 *TAREFAS PARA HOJE:*\n`;
        if (todayTasks.length === 0) {
            message += `• Nenhuma tarefa agendada para hoje.\n`;
        } else {
            todayTasks.forEach(t => {
                message += `• *[${t.client?.empresa || 'Sem Cliente'}]* ${t.title}\n`;
            });
        }
        message += `\n`;

        message += `🧪 *EXPERIMENTOS EM TESTE:*\n`;
        if (activeExperiments.length === 0) {
            message += `• Nenhum experimento ativo no momento.\n`;
        } else {
            activeExperiments.forEach(e => {
                message += `• *[${e.client?.empresa || 'Sem Cliente'}]* ${e.title}\n`;
            });
        }
        message += `\n`;
        message += `📈 _Tenha um excelente dia de muito growth e ROI!_`;

        const headers = { 'Content-Type': 'application/json' };
        if (settings.api_whatsapp_token) {
            headers['Authorization'] = `Bearer ${settings.api_whatsapp_token}`;
            headers['apikey'] = settings.api_whatsapp_token;
        }

        let numeroLimpo = settings.telefone_notificacao.replace(/\D/g, '');
        if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
            numeroLimpo = '55' + numeroLimpo;
        }

        const reqWa = await fetch(settings.api_whatsapp_url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                number: numeroLimpo,
                options: { delay: 1200, presence: 'composing' },
                textMessage: { text: message },
                text: message
            })
        });

        const waResponse = await reqWa.text();
        if (reqWa.ok) {
            await logSystemEvent('success', 'whatsapp_daily_digest', `Resumo diário enviado via WhatsApp para o assessor (${numeroLimpo})`);
            res.json({ message: 'Resumo diário enviado com sucesso para o seu WhatsApp!' });
        } else {
            await logSystemEvent('error', 'whatsapp_daily_digest', `Erro no disparo do Resumo Diário via Evolution API (HTTP ${reqWa.status})`, waResponse);
            res.status(500).json({ error: `Evolution API recusou o envio: HTTP ${reqWa.status}` });
        }
    } catch (e) {
        await logSystemEvent('error', 'whatsapp_daily_digest', `Falha ao tentar enviar resumo diário via WhatsApp`, e.message);
        res.status(500).json({ error: 'Erro interno no servidor ao disparar resumo diário.' });
    }
});

/* --- CLIENTS --- */
router.get('/clients', authenticateToken, async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { experiments: true, tasks: true }
                }
            }
        });
        res.json(clients);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
});

router.post('/clients', authenticateToken, async (req, res) => {
    try {
        const { nome, empresa, email, telefone, status, valorMensal, budgetAds, observacoes } = req.body;
        const client = await prisma.client.create({
            data: {
                nome,
                empresa,
                email,
                telefone,
                status: status || 'ativo',
                valorMensal: parseFloat(valorMensal) || 0,
                budgetAds: parseFloat(budgetAds) || 0,
                observacoes
            }
        });
        await logSystemEvent('success', 'client_creation', `Cliente criado: ${nome} - ${empresa}`);
        res.status(201).json(client);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao criar cliente' });
    }
});

router.put('/clients/:id', authenticateToken, async (req, res) => {
    try {
        const { nome, empresa, email, telefone, status, valorMensal, budgetAds, observacoes } = req.body;
        const client = await prisma.client.update({
            where: { id: req.params.id },
            data: {
                nome,
                empresa,
                email,
                telefone,
                status,
                valorMensal: valorMensal !== undefined ? parseFloat(valorMensal) : undefined,
                budgetAds: budgetAds !== undefined ? parseFloat(budgetAds) : undefined,
                observacoes
            }
        });
        res.json(client);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
});

router.delete('/clients/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.client.delete({ where: { id: req.params.id } });
        res.json({ message: 'Cliente removido com sucesso' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
});

/* --- EXPERIMENTS --- */
router.get('/experiments', authenticateToken, async (req, res) => {
    try {
        const { clientId } = req.query;
        const whereClause = clientId ? { clientId } : {};
        const experiments = await prisma.growthExperiment.findMany({
            where: whereClause,
            include: { client: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(experiments);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar experimentos' });
    }
});

const generateExperimentTasks = async (experimentId, clientId) => {
    try {
        const taskTemplates = [
            { title: 'Setup de Rastreamento e Conversões (GTM/GA4/Pixel)', priority: 'alta', description: 'Instalar tags, metas e eventos para o experimento.' },
            { title: 'Copywriting e Imagens/Criativos do Teste', priority: 'alta', description: 'Redigir a oferta, chamadas e criar os banners/anúncios.' },
            { title: 'Construção Técnica / Landing Pages do Teste', priority: 'media', description: 'Estruturar a página ou fazer alterações no site.' },
            { title: 'Auditoria de Leads e Integrações de CRM', priority: 'media', description: 'Garantir que os leads gerados estão caindo nas planilhas/CRM.' },
            { title: 'Análise Quantitativa e Aprendizados do Teste', priority: 'baixa', description: 'Compilar os números finais e logar aprendizados no backlog.' }
        ];

        const today = new Date();
        const daysAdd = [2, 4, 5, 7, 14];

        for (let i = 0; i < taskTemplates.length; i++) {
            const template = taskTemplates[i];
            const dueDate = new Date();
            dueDate.setDate(today.getDate() + daysAdd[i]);
            
            await prisma.growthTask.create({
                data: {
                    title: template.title,
                    description: template.description,
                    status: 'a_fazer',
                    priority: template.priority,
                    responsible: 'Growth Advisor',
                    dueDate,
                    clientId,
                    experimentId
                }
            });
        }
        await logSystemEvent('success', 'experiment_tasks_automation', `Tarefas padrão criadas automaticamente para o experimento ID ${experimentId}`);
    } catch (err) {
        await logSystemEvent('error', 'experiment_tasks_automation', `Falha ao gerar tarefas padrão: ${err.message}`);
    }
};

router.post('/experiments', authenticateToken, async (req, res) => {
    try {
        const { title, description, status, impact, confidence, ease, hypothesis, metricToTrack, clientId } = req.body;
        const experiment = await prisma.growthExperiment.create({
            data: {
                title,
                description,
                status: status || 'ideia',
                impact: parseInt(impact) || 5,
                confidence: parseInt(confidence) || 5,
                ease: parseInt(ease) || 5,
                hypothesis,
                metricToTrack,
                clientId
            }
        });

        if (status === 'em_teste') {
            await generateExperimentTasks(experiment.id, clientId);
        }

        res.status(201).json(experiment);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao criar experimento' });
    }
});

router.put('/experiments/:id', authenticateToken, async (req, res) => {
    try {
        const { title, description, status, impact, confidence, ease, hypothesis, metricToTrack, results, learnings } = req.body;
        
        const oldExperiment = await prisma.growthExperiment.findUnique({
            where: { id: req.params.id }
        });

        const experiment = await prisma.growthExperiment.update({
            where: { id: req.params.id },
            data: {
                title,
                description,
                status,
                impact: impact !== undefined ? parseInt(impact) : undefined,
                confidence: confidence !== undefined ? parseInt(confidence) : undefined,
                ease: ease !== undefined ? parseInt(ease) : undefined,
                hypothesis,
                metricToTrack,
                results,
                learnings
            }
        });

        if (status === 'em_teste' && oldExperiment && oldExperiment.status !== 'em_teste') {
            await generateExperimentTasks(experiment.id, experiment.clientId);
        }

        res.json(experiment);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao atualizar experimento' });
    }
});

router.delete('/experiments/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.growthExperiment.delete({ where: { id: req.params.id } });
        res.json({ message: 'Experimento removido com sucesso' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao deletar experimento' });
    }
});

/* --- TASKS --- */
router.get('/tasks', authenticateToken, async (req, res) => {
    try {
        const { clientId } = req.query;
        const whereClause = clientId ? { clientId } : {};
        const tasks = await prisma.growthTask.findMany({
            where: whereClause,
            include: { client: true, experiment: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar tarefas' });
    }
});

router.post('/tasks', authenticateToken, async (req, res) => {
    try {
        const { title, description, status, priority, responsible, dueDate, clientId, experimentId } = req.body;
        const task = await prisma.growthTask.create({
            data: {
                title,
                description,
                status: status || 'a_fazer',
                priority: priority || 'media',
                responsible,
                dueDate: dueDate ? new Date(dueDate) : null,
                clientId,
                experimentId: experimentId || null
            }
        });
        res.status(201).json(task);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
});

router.put('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { title, description, status, priority, responsible, dueDate, experimentId } = req.body;
        const task = await prisma.growthTask.update({
            where: { id: req.params.id },
            data: {
                title,
                description,
                status,
                priority,
                responsible,
                dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
                experimentId: experimentId !== undefined ? (experimentId || null) : undefined
            }
        });
        res.json(task);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
});

router.delete('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.growthTask.delete({ where: { id: req.params.id } });
        res.json({ message: 'Tarefa removida com sucesso' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao deletar tarefa' });
    }
});

/* --- CLIENT METRICS --- */
router.get('/metrics/:clientId', authenticateToken, async (req, res) => {
    try {
        const metrics = await prisma.clientMetric.findMany({
            where: { clientId: req.params.clientId },
            orderBy: { periodo: 'asc' }
        });
        res.json(metrics);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar métricas do cliente' });
    }
});

router.post('/metrics/:clientId', authenticateToken, async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const { periodo, faturamento, investimentoAds, leadsGerados, cac, ltv, roi, taxaConversao } = req.body;
        
        const existing = await prisma.clientMetric.findFirst({
            where: { clientId, periodo }
        });

        const data = {
            faturamento: parseFloat(faturamento) || 0,
            investimentoAds: parseFloat(investimentoAds) || 0,
            leadsGerados: parseInt(leadsGerados) || 0,
            cac: parseFloat(cac) || 0,
            ltv: parseFloat(ltv) || 0,
            roi: parseFloat(roi) || 0,
            taxaConversao: parseFloat(taxaConversao) || 0
        };

        let metric;
        if (existing) {
            metric = await prisma.clientMetric.update({
                where: { id: existing.id },
                data
            });
        } else {
            metric = await prisma.clientMetric.create({
                data: {
                    clientId,
                    periodo,
                    ...data
                }
            });
        }
        res.json(metric);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao salvar métrica do cliente' });
    }
});

/* --- PROMOTE LEAD TO CLIENT --- */
router.post('/leads/:id/promote', authenticateToken, async (req, res) => {
    try {
        const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
        if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

        // Atualiza status do lead
        await prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'fechado' }
        });

        // Constrói observações iniciais com dados do lead
        let initialObservacoes = '';
        if (lead.mensagem) initialObservacoes += `[Mensagem do Formulário]: ${lead.mensagem}\n`;
        if (lead.observacoes) initialObservacoes += `[Notas comerciais]: ${lead.observacoes}`;
        initialObservacoes = initialObservacoes.trim() || null;

        // Cria o cliente
        const client = await prisma.client.create({
            data: {
                nome: lead.nome,
                empresa: lead.empresa,
                email: lead.email,
                telefone: lead.telefone,
                status: 'ativo',
                valorMensal: 0,
                budgetAds: 0,
                observacoes: initialObservacoes
            }
        });

        await logSystemEvent('success', 'lead_promotion', `Lead promovido a Cliente: ${lead.nome} (${lead.empresa})`);
        res.json({ message: 'Lead promovido com sucesso', client });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao promover lead' });
    }
});

/* --- INVOICES (FINANCIAL) --- */
const generatePixCode = (id, valor) => {
    const cleanValor = parseFloat(valor).toFixed(2);
    // Simula uma string PIX válida no formato BR Code
    return `00020101021226870014br.gov.bcb.pix2565pix.qao.com.br/cobranca/${id.replace(/-/g, '')}52040000530398654${cleanValor.length < 10 ? '0' + cleanValor.length : cleanValor.length}${cleanValor}5802BR5912QAO_GROWTH6009SAO_PAULO62070503***6304`;
};

router.get('/invoices', authenticateToken, async (req, res) => {
    try {
        const { clientId, status } = req.query;
        const whereClause = {};
        if (clientId) whereClause.clientId = clientId;
        if (status) whereClause.status = status;

        const invoices = await prisma.invoice.findMany({
            where: whereClause,
            include: { client: true },
            orderBy: { vencimento: 'desc' }
        });
        res.json(invoices);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar faturas' });
    }
});

router.post('/invoices', authenticateToken, async (req, res) => {
    try {
        const { clientId, valor, periodo, vencimento } = req.body;
        
        // Cria registro inicial
        const invoice = await prisma.invoice.create({
            data: {
                clientId,
                valor: parseFloat(valor),
                periodo,
                vencimento: new Date(vencimento),
                status: 'pendente'
            }
        });

        // Gera o Pix Code dinamicamente com base no ID gerado
        const pixCode = generatePixCode(invoice.id, valor);
        
        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoice.id },
            data: { pixCode }
        });

        await logSystemEvent('info', 'invoice_creation', `Fatura gerada para o cliente ID ${clientId} no valor de R$ ${valor}`);
        res.status(201).json(updatedInvoice);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao gerar fatura' });
    }
});

router.put('/invoices/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const invoice = await prisma.invoice.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json(invoice);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao atualizar status do pagamento' });
    }
});

router.post('/invoices/generate-recurring', authenticateToken, async (req, res) => {
    try {
        const now = new Date();
        const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 10);
        if (now.getDate() > 10) {
            dueDate.setDate(now.getDate() + 7);
        }

        const activeClients = await prisma.client.findMany({
            where: { status: 'ativo' }
        });

        let createdCount = 0;
        const generatedInvoices = [];

        for (const client of activeClients) {
            const existing = await prisma.invoice.findFirst({
                where: {
                    clientId: client.id,
                    periodo: currentPeriod
                }
            });

            if (!existing && client.valorMensal > 0) {
                const invoice = await prisma.invoice.create({
                    data: {
                        clientId: client.id,
                        valor: client.valorMensal,
                        periodo: currentPeriod,
                        vencimento: dueDate,
                        status: 'pendente'
                    }
                });

                const pixCode = generatePixCode(invoice.id, client.valorMensal);
                const updatedInvoice = await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { pixCode },
                    include: { client: true }
                });

                generatedInvoices.push(updatedInvoice);
                createdCount++;
            }
        }

        await logSystemEvent('success', 'recurring_invoice_generation', `Faturamento mensal gerado em lote. ${createdCount} novas faturas criadas para o período ${currentPeriod}`);
        res.json({ message: `Faturamento gerado! ${createdCount} novas faturas foram geradas com sucesso.`, count: createdCount, invoices: generatedInvoices });
    } catch (e) {
        await logSystemEvent('error', 'recurring_invoice_generation', `Falha ao rodar faturamento automático: ${e.message}`);
        res.status(500).json({ error: 'Erro ao gerar faturamento recorrente' });
    }
});

router.post('/invoices/:id/simulate-payment', authenticateToken, async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: { client: true }
        });

        if (!invoice) return res.status(404).json({ error: 'Fatura não encontrada' });
        if (invoice.status === 'pago') return res.status(400).json({ error: 'Fatura já está paga' });

        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'pago' }
        });

        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const nfeNumero = `${new Date().getFullYear()}${randomNum}`;
        const nfeUrl = `https://www.nfe.fazenda.gov.br/portal/consultaRecipiente.aspx?nfe=${nfeNumero}`;

        await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                nfeStatus: 'emitida',
                nfeNumero,
                nfeUrl
            }
        });

        const settings = await prisma.siteSettings.findFirst();
        let whatsappSent = false;

        if (invoice.client?.telefone && settings && settings.api_whatsapp_url) {
            const valueFormatted = invoice.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const message = `Prezado(a) *${invoice.client.nome}* (${invoice.client.empresa})!\n\nConfirmamos o recebimento do Pix referente à fatura de Growth (*${invoice.periodo}*) no valor de *${valueFormatted}*.\n\nAgradecemos a parceria! Sua Nota Fiscal Eletrônica (NFS-e Vila Velha) foi emitida com sucesso.\n\n*Nota Fiscal Nº:* ${nfeNumero}\n*Visualizar PDF da Nota:* ${nfeUrl}\n\n_Esse é um aviso automático de conciliação financeira._`;

            const headers = { 'Content-Type': 'application/json' };
            if (settings.api_whatsapp_token) {
                headers['Authorization'] = `Bearer ${settings.api_whatsapp_token}`;
                headers['apikey'] = settings.api_whatsapp_token;
            }

            let numeroLimpo = invoice.client.telefone.replace(/\D/g, '');
            if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
                numeroLimpo = '55' + numeroLimpo;
            }

            try {
                const reqWa = await fetch(settings.api_whatsapp_url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        number: numeroLimpo,
                        options: { delay: 1200, presence: 'composing' },
                        textMessage: { text: message },
                        text: message
                    })
                });
                
                if (reqWa.ok) {
                    whatsappSent = true;
                    await logSystemEvent('success', 'whatsapp_payment_confirmation', `Aviso de recebimento e NFS-e enviados via WhatsApp para ${invoice.client.empresa}`);
                } else {
                    await logSystemEvent('warning', 'whatsapp_payment_confirmation', `Falha no disparo da Evolution API (HTTP ${reqWa.status})`);
                }
            } catch (waErr) {
                await logSystemEvent('error', 'whatsapp_payment_confirmation', `Erro de conexão com Evolution API: ${waErr.message}`);
            }
        }

        await logSystemEvent('success', 'invoice_reconciliation', `Fatura ID ${invoice.id} conciliada automaticamente via Simulador Pix. NFS-e gerada.`);
        
        res.json({
            message: 'Pagamento conciliado com sucesso! Status atualizado para PAGO, Nota Fiscal emitida e recibo disparado por WhatsApp.',
            invoice: {
                ...updatedInvoice,
                nfeStatus: 'emitida',
                nfeNumero,
                nfeUrl
            },
            whatsappSent
        });
    } catch (e) {
        res.status(500).json({ error: `Falha na conciliação: ${e.message}` });
    }
});

router.post('/invoices/:id/nfe', authenticateToken, async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: { client: true }
        });
        if (!invoice) return res.status(404).json({ error: 'Fatura não encontrada' });

        // Simula processamento com timeout
        // No Express, podemos apenas atualizar diretamente gerando dados mockados
        const randomNum = Math.floor(100000 + Math.random() * 900000); // Ex: 498321
        const nfeNumero = `${new Date().getFullYear()}${randomNum}`;
        const nfeUrl = `https://www.nfe.fazenda.gov.br/portal/consultaRecipiente.aspx?nfe=${nfeNumero}`;

        const updated = await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                nfeStatus: 'emitida',
                nfeNumero,
                nfeUrl
            }
        });

        await logSystemEvent('success', 'nfe_issuance', `Nota Fiscal emitida para o cliente ${invoice.client.empresa}. Nota Nº ${nfeNumero}`);
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao emitir Nota Fiscal' });
    }
});

router.post('/invoices/:id/whatsapp-notice', authenticateToken, async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: { client: true }
        });
        if (!invoice) return res.status(404).json({ error: 'Fatura não encontrada' });
        if (!invoice.client?.telefone) return res.status(400).json({ error: 'Cliente não possui telefone cadastrado' });

        const settings = await prisma.siteSettings.findFirst();
        if (!settings || !settings.api_whatsapp_url) {
            return res.status(400).json({ error: 'Integração de WhatsApp/Evolution não configurada nas configurações.' });
        }

        const dateFormatted = new Date(invoice.vencimento).toLocaleDateString('pt-BR');
        const valueFormatted = invoice.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        const message = `Olá, *${invoice.client.nome}* (${invoice.client.empresa})!\n\nPassando para lembrar que a fatura da sua Assessoria de Growth referente ao período *${invoice.periodo}* vence em *${dateFormatted}*.\n\n*Valor:* ${valueFormatted}\n\n*Código PIX Copia e Cola para pagamento:*\n\`${invoice.pixCode}\`\n\n_Por favor, após realizar o pagamento, envie o comprovante por aqui. Obrigado!_`;

        const headers = { 'Content-Type': 'application/json' };
        if (settings.api_whatsapp_token) {
            headers['Authorization'] = `Bearer ${settings.api_whatsapp_token}`;
            headers['apikey'] = settings.api_whatsapp_token;
        }

        let numeroLimpo = invoice.client.telefone.replace(/\D/g, '');
        if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
            numeroLimpo = '55' + numeroLimpo;
        }

        const reqWa = await fetch(settings.api_whatsapp_url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                number: numeroLimpo,
                options: { delay: 1200, presence: 'composing' },
                textMessage: { text: message },
                text: message
            })
        });

        const waResponse = await reqWa.text();
        if (reqWa.ok) {
            await logSystemEvent('success', 'whatsapp_invoice_notice', `Cobrança enviada via WhatsApp para ${invoice.client.empresa} (${numeroLimpo})`);
            res.json({ message: 'Lembrete enviado com sucesso!' });
        } else {
            await logSystemEvent('error', 'whatsapp_invoice_notice', `Erro no disparo Evolution API (HTTP ${reqWa.status})`, waResponse);
            res.status(500).json({ error: `Evolution API recusou o envio: HTTP ${reqWa.status}` });
        }
    } catch (e) {
        await logSystemEvent('error', 'whatsapp_invoice_notice', `Falha ao tentar enviar cobrança via WhatsApp`, e.message);
        res.status(500).json({ error: 'Erro interno no servidor ao disparar WhatsApp.' });
    }
});

/* --- INTEGRATION SETTINGS (SICREDI & NFS-E) --- */
router.get('/settings/integrations', authenticateToken, async (req, res) => {
    try {
        let settings = await prisma.siteSettings.findFirst();
        if (!settings) {
            settings = await prisma.siteSettings.create({ data: {} });
        }
        res.json({
            sicredi_client_id: settings.sicredi_client_id || '',
            sicredi_client_secret: settings.sicredi_client_secret || '',
            sicredi_chave_pix: settings.sicredi_chave_pix || '',
            sicredi_certificado: settings.sicredi_certificado || '',
            sicredi_chave_privada: settings.sicredi_chave_privada || '',
            sicredi_sandbox: settings.sicredi_sandbox,
            nfe_cnpj_emissor: settings.nfe_cnpj_emissor || '',
            nfe_inscricao_municipal: settings.nfe_inscricao_municipal || '',
            nfe_usuario_prefeitura: settings.nfe_usuario_prefeitura || '',
            nfe_senha_prefeitura: settings.nfe_senha_prefeitura || '',
            nfe_token_integracao: settings.nfe_token_integracao || '',
            nfe_sandbox: settings.nfe_sandbox
        });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao carregar configurações de integração' });
    }
});

router.put('/settings/integrations', authenticateToken, async (req, res) => {
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
        await logSystemEvent('info', 'integration_settings_update', 'Configurações de integração atualizadas.');
        res.json(settings);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao salvar configurações de integração' });
    }
});

module.exports = router;

