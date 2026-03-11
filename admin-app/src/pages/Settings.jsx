import React, { useEffect, useState } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState({
    numero: '',
    texto: '',
    mensagem: '',
    ativo: true,
    posicao: 'direita'
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings/whatsapp')
      .then(res => res.json())
      .then(data => {
        setSettings({
          numero: data.numero || '',
          texto: data.texto || '',
          mensagem: data.mensagem || '',
          ativo: data.ativo ?? true,
          posicao: data.posicao || 'direita'
        });
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    
    // We map frontend keys to database fields
    const payload = {
      numero_whatsapp: settings.numero,
      texto_botao: settings.texto,
      mensagem_padrao: settings.mensagem,
      botao_ativo: settings.ativo,
      posicao_botao: settings.posicao
    };

    try {
      await fetch('/api/settings/whatsapp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Configurações do Widget</h2>
      <p className="text-gray-500 text-sm">Altere as informações do botão flutuante de WhatsApp do seu site. As mudanças refletem imediatamente para seus visitantes.</p>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        
        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">Ativar Botão Flutuante</h3>
            <p className="text-sm text-gray-500">Exibe o ícone do WhatsApp no canto da tela.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.ativo}
              onChange={(e) => setSettings({...settings, ativo: e.target.checked})}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Número do WhatsApp</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              placeholder="5511999999999"
              value={settings.numero}
              onChange={(e) => setSettings({...settings, numero: e.target.value})}
            />
            <p className="text-xs text-gray-400 mt-1">Apenas números, com DDI (55).</p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Posição na Tela</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              value={settings.posicao}
              onChange={(e) => setSettings({...settings, posicao: e.target.value})}
            >
              <option value="direita">Canto Inferior Direito</option>
              <option value="esquerda">Canto Inferior Esquerdo</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem Predefinida</label>
            <textarea
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              placeholder="Olá! Gostaria de conversar..."
              value={settings.mensagem}
              onChange={(e) => setSettings({...settings, mensagem: e.target.value})}
            />
            <p className="text-xs text-gray-400 mt-1">Texto que já virá escrito quando o cliente abrir seu contato.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-green-600">
            {saved && "Configurações atualizadas!"}
          </span>
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
