/**
 * QAO Growth Tracking Engine
 * Inicializa e dispara eventos de conversão Baseados nos IDs do Banco de Dados
 */

window.qaoTrackingSettings = window.qaoTrackingSettings || {};
document.documentElement.dataset.qaoTracking = 'ready';
window.qaoTrackLead = function(origemLabel = 'Formulário Geral') {
    try {
        const settings = window.qaoTrackingSettings || {};

        if (typeof window.gtag === 'function') {
            window.gtag('event', 'conversion', {
                'send_to': settings.google_ads_id ? `${settings.google_ads_id}/lead` : undefined,
                'event_category': 'Leads',
                'event_label': origemLabel
            });

            window.gtag('event', 'generate_lead', {
                currency: "BRL",
                value: 100.00
            });
        }

        if (typeof window.fbq === 'function') {
            window.fbq('track', 'Lead', {
                content_name: origemLabel,
                currency: 'BRL',
                value: 100.00
            });
        }

        if (typeof window.dataLayer !== 'undefined') {
            window.dataLayer.push({
                'event': 'qao_lead_conversion',
                'lead_source': origemLabel
            });
        }

        console.log(`🎯 [Conversion Tracking Disparado]: ${origemLabel}`);
    } catch (e) {
        console.error('Falha ao acionar Pixels', e);
    }
};

async function initQaoTracking() {
    try {
        const res = await fetch('/api/settings/tracking');
        if (!res.ok) return;
        
        const settings = await res.json();
        window.qaoTrackingSettings = settings;
        
        // Inicializa Google Analytics/Ads (gtag.js) nativamente sem precisar de código inserido manualmente
        if (settings.google_analytics_id || settings.google_ads_id) {
            const gtagId = settings.google_analytics_id || settings.google_ads_id; // Pega o primário
            
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            window.gtag = function(){ dataLayer.push(arguments); }
            window.gtag('js', new Date());

            if (settings.google_analytics_id) window.gtag('config', settings.google_analytics_id);
            if (settings.google_ads_id) window.gtag('config', settings.google_ads_id);
            
            console.log('✅ [Tracking] Google Tags Initialized');
        }

        // Inicializa Meta Pixel
        if (settings.meta_pixel_id) {
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            window.fbq('init', settings.meta_pixel_id);
            window.fbq('track', 'PageView');
            console.log('✅ [Tracking] Meta Pixel Initialized');
        }

    } catch (err) {
        console.error("QAO Tracking initialization failed:", err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQaoTracking);
} else {
    initQaoTracking();
}
