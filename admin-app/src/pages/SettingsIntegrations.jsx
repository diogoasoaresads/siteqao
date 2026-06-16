import React, { useEffect, useState } from 'react';
import { Settings, ShieldCheck, QrCode, FileText, Save, Info } from 'lucide-react';

export default function SettingsIntegrations() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // State for config
  const [config, setConfig] = useState({
    sicredi_client_id: '',
    sicredi_client_secret: '',
    sicredi_chave_pix: '',
    sicredi_certificado: '',
    sicredi_chave_privada: '',
    sicredi_sandbox: true,
    nfe_cnpj_emissor: '',
    nfe_inscricao_municipal: '',
    nfe_usuario_prefeitura: '',
    nfe_senha_prefeitura: '',
    nfe_token_integracao: '',
    nfe_sandbox: true
  });

  useEffect(() => {
    fetch('/api/settings/integrations')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error(data.error);
        } else {
          setConfig(prev => ({
            ...prev,
            ...data
          }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/settings/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Erro ao salvar configurações de integração.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Carregando integrações de faturamento...</div>;

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-sans">Integrações de Faturamento e Notas</h2>
        <p className="text-sm text-gray-500">Insira suas credenciais da API do Sicredi PIX e do faturamento NFS-e de Vila Velha (ES).</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Sicredi PIX */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <QrCode size={18} className="text-blue-600" />
            <h3 className="font-bold text-sm text-gray-900">Integração Sicredi (API PIX)</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-800">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p>
                Esta integração conecta a API do Sicredi para a emissão de cobranças dinâmicas via PIX. 
                Certifique-se de gerar o certificado digital (.PEM) no seu painel corporativo do Sicredi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Chave PIX Cadastrada *</label>
                <input
                  type="text"
                  required
                  value={config.sicredi_chave_pix}
                  onChange={e => setConfig({ ...config, sicredi_chave_pix: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                  placeholder="Ex: CNPJ, E-mail, Celular ou Chave Aleatória"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Modo de Operação</label>
                <div className="flex items-center mt-2.5 gap-4">
                  <label className="inline-flex items-center cursor-pointer text-xs font-medium text-gray-700">
                    <input
                      type="radio"
                      name="sicredi_sandbox"
                      checked={config.sicredi_sandbox === true}
                      onChange={() => setConfig({ ...config, sicredi_sandbox: true })}
                      className="mr-2 accent-black"
                    />
                    Homologação (Sandbox)
                  </label>
                  <label className="inline-flex items-center cursor-pointer text-xs font-medium text-gray-700">
                    <input
                      type="radio"
                      name="sicredi_sandbox"
                      checked={config.sicredi_sandbox === false}
                      onChange={() => setConfig({ ...config, sicredi_sandbox: false })}
                      className="mr-2 accent-black"
                    />
                    Produção
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Client ID (API Sicredi) *</label>
                <input
                  type="text"
                  required
                  value={config.sicredi_client_id}
                  onChange={e => setConfig({ ...config, sicredi_client_id: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                  placeholder="Seu Client ID"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Client Secret *</label>
                <input
                  type="password"
                  required
                  value={config.sicredi_client_secret}
                  onChange={e => setConfig({ ...config, sicredi_client_secret: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                  placeholder="Seu Client Secret"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Certificado Digital (.PEM) *</label>
                <textarea
                  required
                  value={config.sicredi_certificado}
                  onChange={e => setConfig({ ...config, sicredi_certificado: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-xs font-mono border-gray-300 h-24"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;MIIE...&#10;-----END CERTIFICATE-----"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Chave Privada do Certificado (.PEM) *</label>
                <textarea
                  required
                  value={config.sicredi_chave_privada}
                  onChange={e => setConfig({ ...config, sicredi_chave_privada: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-xs font-mono border-gray-300 h-24"
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;MIIE...&#10;-----END PRIVATE KEY-----"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Vila Velha NFS-e */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <FileText size={18} className="text-emerald-600" />
            <h3 className="font-bold text-sm text-gray-900">Emissão de Nota Fiscal (Vila Velha - ES)</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-800">
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <p>
                Vila Velha/ES exige autenticação com Usuário e Senha do Portal Tributário municipal ou token de um integrador contratado (FocusNFe / e-Notas). 
                Preencha os dados abaixo de faturamento para permitir a emissão automática.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">CNPJ Emissor da Assessoria *</label>
                <input
                  type="text"
                  required
                  value={config.nfe_cnpj_emissor}
                  onChange={e => setConfig({ ...config, nfe_cnpj_emissor: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Inscrição Municipal *</label>
                <input
                  type="text"
                  required
                  value={config.nfe_inscricao_municipal}
                  onChange={e => setConfig({ ...config, nfe_inscricao_municipal: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                  placeholder="Ex: 123456-7"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Usuário do Portal Prefeitura (Vila Velha) *</label>
                <input
                  type="text"
                  required
                  value={config.nfe_usuario_prefeitura}
                  onChange={e => setConfig({ ...config, nfe_usuario_prefeitura: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                  placeholder="Seu CPF ou código de login"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Senha do Portal Prefeitura *</label>
                <input
                  type="password"
                  required
                  value={config.nfe_senha_prefeitura}
                  onChange={e => setConfig({ ...config, nfe_senha_prefeitura: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                  placeholder="Sua senha tributária municipal"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Token de Integração FocusNFe/e-Notas (Opcional)</label>
                <input
                  type="text"
                  value={config.nfe_token_integracao}
                  onChange={e => setConfig({ ...config, nfe_token_integracao: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                  placeholder="Token do webservice"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Ambiente de Emissão NFS-e</label>
                <div className="flex items-center mt-2.5 gap-4">
                  <label className="inline-flex items-center cursor-pointer text-xs font-medium text-gray-700">
                    <input
                      type="radio"
                      name="nfe_sandbox"
                      checked={config.nfe_sandbox === true}
                      onChange={() => setConfig({ ...config, nfe_sandbox: true })}
                      className="mr-2 accent-black"
                    />
                    Homologação (Sem Valor Fiscal)
                  </label>
                  <label className="inline-flex items-center cursor-pointer text-xs font-medium text-gray-700">
                    <input
                      type="radio"
                      name="nfe_sandbox"
                      checked={config.nfe_sandbox === false}
                      onChange={() => setConfig({ ...config, nfe_sandbox: false })}
                      className="mr-2 accent-black"
                    />
                    Produção (Valor Fiscal Real)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div>
            {success && (
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                ✓ Configurações de integração salvas com sucesso!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
}
