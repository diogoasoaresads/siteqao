import React, { useEffect, useState } from 'react';

export default function SettingsScripts() {
  const [settings, setSettings] = useState({
    google_tag_manager_id: '',
    google_analytics_id: '',
    google_ads_id: '',
    meta_pixel_id: '',
    script_head: '',
    script_body: ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings/scripts')
      .then(res => res.json())
      .then(data => {
        setSettings({
          google_tag_manager_id: data.google_tag_manager_id || '',
          google_analytics_id: data.google_analytics_id || '',
          google_ads_id: data.google_ads_id || '',
          meta_pixel_id: data.meta_pixel_id || '',
          script_head: data.script_head || '',
          script_body: data.script_body || ''
        });
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    
    try {
      await fetch('/api/settings/scripts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erro ao salvar scripts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Scripts de Marketing</h2>
      <p className="text-gray-500 text-sm">Gerencie os códigos de rastreamento do site sem precisar alterar o código-fonte manualmente.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Bloco Google */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Ecossistema Google</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Tag Manager ID</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                placeholder="GTM-XXXXXXX"
                value={settings.google_tag_manager_id}
                onChange={(e) => setSettings({...settings, google_tag_manager_id: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                placeholder="G-XXXXXXXX"
                value={settings.google_analytics_id}
                onChange={(e) => setSettings({...settings, google_analytics_id: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Ads ID</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                placeholder="AW-XXXXXXXX"
                value={settings.google_ads_id}
                onChange={(e) => setSettings({...settings, google_ads_id: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Bloco Meta */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Ecossistema Meta (Facebook/Instagram)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Pixel ID</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                placeholder="123456789012345"
                value={settings.meta_pixel_id}
                onChange={(e) => setSettings({...settings, meta_pixel_id: e.target.value})}
              />
            </div>
        </div>

        {/* Custom Scripts */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Scripts Personalizados (Avançado)</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Script na tag <code>&lt;head&gt;</code>
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black font-mono text-sm"
              placeholder="Ex: <script>console.log('Head');</script>"
              value={settings.script_head}
              onChange={(e) => setSettings({...settings, script_head: e.target.value})}
            />
            <p className="text-xs text-gray-400 mt-1">Insira a tag &lt;script&gt; ou &lt;style&gt; completa.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Script no fim da tag <code>&lt;body&gt;</code>
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black font-mono text-sm"
              placeholder="Ex: <script>console.log('Body');</script>"
              value={settings.script_body}
              onChange={(e) => setSettings({...settings, script_body: e.target.value})}
            />
            <p className="text-xs text-gray-400 mt-1">Insira a tag &lt;script&gt; completa.</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-6 mt-6">
          <span className="text-sm font-medium text-green-600">
            {saved && "Configurações atualizadas com sucesso!"}
          </span>
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </form>
    </div>
  );
}
