import React, { useEffect, useState } from 'react';

export default function SettingsNotifications() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [settings, setSettings] = useState({
    notificacao_email: false,
    smtp_host: '',
    smtp_port: '465',
    smtp_user: '',
    smtp_pass: '',
    destinatario_email: '',
    
    notificacao_whatsapp: false,
    api_whatsapp_url: '',
    api_whatsapp_token: '',
    telefone_notificacao: ''
  });

  useEffect(() => {
    fetch('/api/settings/scripts')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/settings/scripts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage('Configurações salvas com sucesso!');
      } else {
        setMessage('Erro ao salvar as configurações.');
      }
    } catch (err) {
      setMessage('Falha na comunicação.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Carregando configurações...</div>;

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Notificações e Alertas</h2>
        <p className="text-sm text-gray-500 mt-1">Configure o recebimento de avisos automáticos sempre que houver um novo lead capturado.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Bloco Email SMTP */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Alertas por E-mail</h3>
              <p className="text-sm text-gray-500">Credenciais SMTP para disparo de e-mails (Hostinger, AWS, Gmail, etc).</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input type="checkbox" name="notificacao_email" checked={settings.notificacao_email} onChange={handleChange} className="sr-only" />
                <div className={`block w-10 h-6 rounded-full transition-colors ${settings.notificacao_email ? 'bg-black' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.notificacao_email ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          
          {settings.notificacao_email && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="col-span-2 md:col-span-1">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Host SMTP</label>
                 <input type="text" name="smtp_host" value={settings.smtp_host || ''} onChange={handleChange} placeholder="ex: smtp.hostinger.com" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black" />
               </div>
               <div className="col-span-2 md:col-span-1">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Porta (TLS/SSL)</label>
                 <input type="text" name="smtp_port" value={settings.smtp_port || ''} onChange={handleChange} placeholder="465 ou 587" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black" />
               </div>
               <div className="col-span-2 md:col-span-1">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Usuário / Email Autenticador</label>
                 <input type="email" name="smtp_user" value={settings.smtp_user || ''} onChange={handleChange} placeholder="contato@qao.com.br" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black" />
               </div>
               <div className="col-span-2 md:col-span-1">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Senha do Email</label>
                 <input type="password" name="smtp_pass" value={settings.smtp_pass || ''} onChange={handleChange} placeholder="••••••••" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black" />
               </div>
               <div className="col-span-2 border-t pt-4 mt-2">
                 <label className="block text-sm font-bold text-gray-900 mb-1">E-mail(s) de Destino (Quem vai receber)</label>
                 <input type="text" name="destinatario_email" value={settings.destinatario_email || ''} onChange={handleChange} placeholder="vendas@qao.com.br" className="w-full px-3 py-2 border border-blue-300 bg-blue-50/30 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600" />
               </div>
            </div>
          )}
        </div>

        {/* Bloco API WhatsApp */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Alertas por WhatsApp (Webhook)</h3>
              <p className="text-sm text-gray-500">Envio de JSON via POST genérico para N8N, Evolution API, Z-API, Chatpro, etc.</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input type="checkbox" name="notificacao_whatsapp" checked={settings.notificacao_whatsapp} onChange={handleChange} className="sr-only" />
                <div className={`block w-10 h-6 rounded-full transition-colors ${settings.notificacao_whatsapp ? 'bg-black' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.notificacao_whatsapp ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>

          {settings.notificacao_whatsapp && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">URL da API / Endpoint do Webhook</label>
                 <p className="text-xs text-gray-400 mb-2">Ex: https://seu-n8n.com/webhook/1234  ou  https://api.evolution.com/message/sendText</p>
                 <input type="url" name="api_whatsapp_url" value={settings.api_whatsapp_url || ''} onChange={handleChange} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black" />
               </div>
               <div className="col-span-2 md:col-span-1">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Token de Autorização (Opcional)</label>
                 <input type="text" name="api_whatsapp_token" value={settings.api_whatsapp_token || ''} onChange={handleChange} placeholder="Bearer Token ou Apikey" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black" />
               </div>
               <div className="col-span-2 md:col-span-1">
                 <label className="block text-sm font-bold text-gray-900 mb-1">WhatsApp de Destino</label>
                 <input type="text" name="telefone_notificacao" value={settings.telefone_notificacao || ''} onChange={handleChange} placeholder="5511999999999" className="w-full px-3 py-2 border border-green-300 bg-green-50/30 rounded-md focus:outline-none focus:ring-1 focus:ring-green-600" />
               </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          {message && <span className="text-sm font-medium text-green-600">{message}</span>}
        </div>
      </form>
    </div>
  );
}
