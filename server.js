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

const fs = require('fs');

async function renderHtmlWithScripts(filePath, res) {
    try {
        let html = fs.readFileSync(filePath, 'utf8');
        
        let settings = {
            google_tag_manager_id: '',
            google_analytics_id: '',
            google_ads_id: '',
            meta_pixel_id: '',
            script_head: '',
            script_body: ''
        };

        try {
            const { PrismaClient } = require('@prisma/client');
            if (!process.env.DATABASE_URL) {
                process.env.DATABASE_URL = 'file:./dev.db';
            }
            const prisma = new PrismaClient();
            const data = await prisma.siteSettings.findFirst();
            if (data) settings = data;
            await prisma.$disconnect();
        } catch (e) {
            console.error("Erro ao puxar scripts no DB", e);
        }

        let headInjection = '';
        let bodyInjection = '';

        // 1. Google Analytics (gtag.js)
        if (settings.google_analytics_id) {
            headInjection += `
                <!-- Google Analytics -->
                <script async src="https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}"></script>
                <script>
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${settings.google_analytics_id}');
                </script>
            `;
        }

        // 2. Google Ads (gtag.js)
        if (settings.google_ads_id) {
            headInjection += `
                <!-- Google Ads -->
                <script async src="https://www.googletagmanager.com/gtag/js?id=${settings.google_ads_id}"></script>
                <script>
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${settings.google_ads_id}');
                </script>
            `;
        }

        // 3. Meta Pixel
        if (settings.meta_pixel_id) {
            headInjection += `
                <!-- Meta Pixel Code -->
                <script>
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${settings.meta_pixel_id}');
                fbq('track', 'PageView');
                </script>
                <noscript><img height="1" width="1" style="display:none"
                src="https://www.facebook.com/tr?id=${settings.meta_pixel_id}&ev=PageView&noscript=1"
                /></noscript>
                <!-- End Meta Pixel Code -->
            `;
        }

        // 4. Google Tag Manager
        if (settings.google_tag_manager_id) {
            headInjection += `
                <!-- Google Tag Manager -->
                <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${settings.google_tag_manager_id}');</script>
                <!-- End Google Tag Manager -->
            `;
            
            bodyInjection += `
                <!-- Google Tag Manager (noscript) -->
                <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${settings.google_tag_manager_id}"
                height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
                <!-- End Google Tag Manager (noscript) -->
            `;
        }

        // 5. Custom Scripts Head
        if (settings.script_head) {
            headInjection += `\n<!-- Custom Head Scripts -->\n${settings.script_head}\n`;
        }

        // 6. Custom Scripts Body
        if (settings.script_body) {
            bodyInjection += `\n<!-- Custom Body Scripts -->\n${settings.script_body}\n`;
        }

        // Fallback robusto simples com replace nativo
        // Injeção HEAD logo antes de fechar </head>
        html = html.replace('</head>', `${headInjection}\n</head>`);
        
        // Injeção BODY logo após abrir <body>
        html = html.replace('<body>', `<body>\n${bodyInjection}`);

        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send('Servidor falhou ao renderizar a página');
    }
}

// Public Routes (agora processados)
app.get('/', (req, res) => {
    renderHtmlWithScripts(path.join(__dirname, 'index.html'), res);
});

// A Rota estática do diagnostico agora vira rota de renderização express
app.use('/diagnostico-marketing', express.static(path.join(__dirname, 'diagnostico-marketing'), { index: false })); // Impede Nginx de servir o index padrão

app.get('/diagnostico-marketing', (req, res) => {
    renderHtmlWithScripts(path.join(__dirname, 'diagnostico-marketing/index.html'), res);
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
