import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus as PlusIcon, Check, FileSpreadsheet, Edit2, TrendingUp, BarChart3, LineChart as LineIcon, Percent, DollarSign, Calendar } from 'lucide-react';


export default function PerformanceMetrics() {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    periodo: '',
    faturamento: '',
    investimentoAds: '',
    leadsGerados: '',
    cac: '',
    ltv: '',
    roi: '',
    taxaConversao: ''
  });

  const [syncing, setSyncing] = useState(false);

  const handleSyncAds = async () => {
    if (!selectedClientId) return;
    setSyncing(true);

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    try {
      const res = await fetch(`/api/clients/${selectedClientId}/sync-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo: currentPeriod })
      });

      if (res.ok) {
        alert('Campanhas do Google e Meta Ads sincronizadas com sucesso!');
        fetchMetrics();
      } else {
        const errData = await res.json();
        alert(`Erro ao sincronizar anúncios: ${errData.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao sincronizar campanhas de anúncios.');
    } finally {
      setSyncing(false);
    }
  };

  const fetchClients = () => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClients(data);
          if (data.length > 0) {
            setSelectedClientId(data[0].id);
          }
        }
      })
      .catch(console.error);
  };

  const fetchMetrics = () => {
    if (!selectedClientId) return;
    setLoading(true);
    fetch(`/api/metrics/${selectedClientId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [selectedClientId]);

  const handleOpenCreate = () => {
    // Pegar o mês atual no formato YYYY-MM
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    setFormData({
      periodo: currentPeriod,
      faturamento: '',
      investimentoAds: '',
      leadsGerados: '',
      cac: '',
      ltv: '',
      roi: '',
      taxaConversao: ''
    });
    setIsModalOpen(true);
  };

  const handleEditMetric = (m) => {
    setFormData({
      periodo: m.periodo,
      faturamento: m.faturamento || 0,
      investimentoAds: m.investimentoAds || 0,
      leadsGerados: m.leadsGerados || 0,
      cac: m.cac || 0,
      ltv: m.ltv || 0,
      roi: m.roi || 0,
      taxaConversao: m.taxaConversao || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) return;

    try {
      const res = await fetch(`/api/metrics/${selectedClientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchMetrics();
      } else {
        alert('Erro ao salvar métricas.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Formatar período para o gráfico (ex: "2026-05" -> "Mai/26")
  const formatPeriod = (periodStr) => {
    if (!periodStr) return '';
    const [year, month] = periodStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]}/${year.substring(2)}`;
  };

  const chartData = metrics.map(m => ({
    ...m,
    name: formatPeriod(m.periodo),
    ROI: parseFloat(m.roi || 0),
    Faturamento: parseFloat(m.faturamento || 0),
    Investimento: parseFloat(m.investimentoAds || 0),
    CAC: parseFloat(m.cac || 0),
    LTV: parseFloat(m.ltv || 0),
    Conversao: parseFloat(m.taxaConversao || 0)
  }));

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Ordenar as métricas para pegar o último período lançado
  const sortedMetricsByPeriod = [...metrics].sort((a, b) => b.periodo.localeCompare(a.periodo));
  const latestMetric = sortedMetricsByPeriod[0];
  
  let ltvCacRatio = null;
  let ltvCacStatus = '';
  let ltvCacColorClass = '';
  
  if (latestMetric && latestMetric.cac > 0) {
    ltvCacRatio = parseFloat((latestMetric.ltv / latestMetric.cac).toFixed(2));
    if (ltvCacRatio < 1.5) {
      ltvCacStatus = 'Alerta de Ineficiência (LTV/CAC abaixo de 1.5x)';
      ltvCacColorClass = 'bg-red-50 border-red-200 text-red-700';
    } else if (ltvCacRatio >= 1.5 && ltvCacRatio <= 3.0) {
      ltvCacStatus = 'Saudável (LTV/CAC saudável entre 1.5x e 3.0x)';
      ltvCacColorClass = 'bg-amber-50 border-amber-200 text-amber-700';
    } else {
      ltvCacStatus = 'Excelente (LTV/CAC excelente acima de 3.0x - Recomendado escalar orçamento)';
      ltvCacColorClass = 'bg-green-50 border-green-200 text-green-700';
    }
  }

  const handleCopyReport = () => {
    if (!latestMetric) {
      alert('Nenhuma métrica lançada para este cliente para gerar o relatório.');
      return;
    }

    const valueFaturamento = latestMetric.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const valueAds = latestMetric.investimentoAds.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const valueCac = latestMetric.cac.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const valueLtv = latestMetric.ltv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const ltvCacCalculated = latestMetric.cac > 0 ? (latestMetric.ltv / latestMetric.cac).toFixed(1) + 'x' : 'N/A';
    
    const reportText = `📊 *RELATÓRIO DE PERFORMANCE - ${selectedClient?.empresa.toUpperCase()}*
📅 Período: ${formatPeriod(latestMetric.periodo)}

*Resultados Financeiros:*
💰 Faturamento Gerado: ${valueFaturamento}
📢 Investimento Ads: ${valueAds}
🚀 ROI: ${latestMetric.roi}x

*Métricas de Growth:*
🎯 Leads Gerados: ${latestMetric.leadsGerados} leads
📈 Taxa de Conversão: ${latestMetric.taxaConversao}%
🔴 CAC: ${valueCac}
🟢 LTV: ${valueLtv}
⚖️ Saúde (LTV/CAC): ${ltvCacCalculated}

_Gerado automaticamente pelo Growth CRM QAO_`;

    navigator.clipboard.writeText(reportText);
    alert('Relatório de performance copiado com sucesso! Pronto para colar no WhatsApp.');
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Performance e Métricas de Growth</h2>
          <p className="text-sm text-gray-500">Monitore o ROI, faturamento gerado, CAC e LTV das estratégias executadas.</p>
        </div>
        
        {selectedClientId && (
          <div className="flex gap-3">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-850 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              Copiar Relatório p/ WhatsApp
            </button>
            <button
              onClick={handleSyncAds}
              disabled={syncing}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-60"
            >
              {syncing ? 'Sincronizando...' : '⚡ Sincronizar Google/Meta Ads'}
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <PlusIcon size={16} /> Lançar Métricas Mensais
            </button>
          </div>
        )}
      </div>

      {/* Select Client header */}
      <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Selecione o Cliente:</span>
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.empresa}</option>
            ))}
          </select>
        </div>

        {selectedClient && (
          <div className="text-xs text-gray-500 flex gap-4">
            <div><strong className="text-gray-700">Retainer Fee:</strong> {selectedClient.valorMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <div><strong className="text-gray-700">Budget Ads Contratual:</strong> {selectedClient.budgetAds.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          </div>
        )}
      </div>

      {/* LTV/CAC Health Card */}
      {selectedClient && latestMetric && (
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${ltvCacColorClass || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 block mb-1">
              Saúde da Assessoria ({formatPeriod(latestMetric.periodo)})
            </span>
            <h3 className="text-lg font-bold leading-tight">Índice Proporção LTV / CAC</h3>
            <p className="text-xs mt-1 font-semibold opacity-90">{ltvCacStatus || 'Lançar CAC e LTV válidos para analisar a saúde.'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-xs opacity-90">
              <div>LTV: <strong>{(latestMetric.ltv || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
              <div>CAC: <strong>{(latestMetric.cac || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
            </div>
            {ltvCacRatio !== null ? (
              <div className="text-2xl font-black px-4 py-2 bg-white rounded-xl border border-inherit shadow-xs min-w-[85px] text-center text-gray-950">
                {ltvCacRatio}x
              </div>
            ) : (
              <div className="text-xs font-semibold px-3 py-2 bg-white rounded-xl border text-gray-400">
                N/A
              </div>
            )}
          </div>
        </div>
      )}

      {metrics.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <h3 className="font-semibold text-gray-800 text-lg">Nenhum dado mensal registrado para este cliente</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">Lance as métricas de faturamento, leads gerados e custo por lead do primeiro mês para desenhar os gráficos de performance.</p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2"
          >
            <PlusIcon size={16} /> Lançar Dados Iniciais
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Revenue vs Ads Spend */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Retorno de Faturamento vs Investimento Ads</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} stroke="#9ca3af" />
                  <YAxis fontSize={11} stroke="#9ca3af" tickFormatter={(v) => `R$${v >= 1000 ? v/1000 + 'k' : v}`} />
                  <Tooltip formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Faturamento" name="Faturamento Gerado" fill="#000000" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Investimento" name="Investimento Ads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: CAC & LTV */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Saúde do LTV e CAC</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} stroke="#9ca3af" />
                  <YAxis fontSize={11} stroke="#9ca3af" />
                  <Tooltip formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="LTV" name="LTV (Valor do Cliente)" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="CAC" name="CAC (Custo Aquisição)" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: ROI */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Retorno sobre Investimento (ROI)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} stroke="#9ca3af" />
                  <YAxis fontSize={11} stroke="#9ca3af" tickFormatter={(v) => `${v}x`} />
                  <Tooltip formatter={(value) => `${value}x ROI`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ROI" name="ROI Multiplicador" stroke="#8b5cf6" strokeWidth={3} dot={{ strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Conversion & Leads */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Volume de Leads e Taxa de Conversão</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} stroke="#9ca3af" />
                  <YAxis fontSize={11} stroke="#9ca3af" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="leadsGerados" name="Leads Gerados" fill="#6b7280" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="Conversao" name="Conversão (%)" stroke="#f59e0b" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table history */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs lg:col-span-2 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-850 text-sm">Histórico de Performance Logado</h3>
              <span className="text-xs text-gray-400">Clique na linha para editar os dados</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-100/80 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Período</th>
                    <th className="px-6 py-3">Faturamento</th>
                    <th className="px-6 py-3">Investimento Ads</th>
                    <th className="px-6 py-3">Leads</th>
                    <th className="px-6 py-3">CAC</th>
                    <th className="px-6 py-3">LTV</th>
                    <th className="px-6 py-3">ROI</th>
                    <th className="px-6 py-3">Conversão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {metrics.map(m => (
                    <tr
                      key={m.id}
                      onClick={() => handleEditMetric(m)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3.5 font-semibold text-gray-900">{formatPeriod(m.periodo)}</td>
                      <td className="px-6 py-3.5">{(m.faturamento || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-6 py-3.5">{(m.investimentoAds || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-6 py-3.5 font-medium">{m.leadsGerados} leads</td>
                      <td className="px-6 py-3.5 text-red-600 font-semibold">{(m.cac || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-6 py-3.5 text-green-600 font-semibold">{(m.ltv || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-6 py-3.5 font-black text-purple-600">{m.roi || 0}x</td>
                      <td className="px-6 py-3.5 font-medium">{m.taxaConversao || 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Métricas do Período</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-semibold">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Mês de Referência (Período) *</label>
                  <input
                    type="month"
                    required
                    value={formData.periodo}
                    onChange={e => setFormData({ ...formData, periodo: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Faturamento Gerado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.faturamento}
                    onChange={e => setFormData({ ...formData, faturamento: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: 45000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Investimento Ads (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.investimentoAds}
                    onChange={e => setFormData({ ...formData, investimentoAds: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: 8000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Leads Gerados *</label>
                  <input
                    type="number"
                    required
                    value={formData.leadsGerados}
                    onChange={e => setFormData({ ...formData, leadsGerados: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: 350"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Taxa Conversão (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.taxaConversao}
                    onChange={e => setFormData({ ...formData, taxaConversao: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: 4.8"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">CAC (Custo por Aquisição R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cac}
                    onChange={e => setFormData({ ...formData, cac: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: 250"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">LTV (Valor Vitalício Cliente R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ltv}
                    onChange={e => setFormData({ ...formData, ltv: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: 1500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">ROI Multiplicador (ex: 3.5 para 350% de retorno)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.roi}
                    onChange={e => setFormData({ ...formData, roi: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 font-bold"
                    placeholder="Ex: 5.6"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
