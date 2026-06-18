import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Globe, DollarSign, TrendingUp, BarChart3, LineChart as LineIcon, Percent, 
  Calendar, Check, Clipboard, AlertCircle, ArrowUpRight, Award, Zap, 
  Layers, CheckCircle2, Clock, Play, HelpCircle
} from 'lucide-react';

export default function ClientPortal() {
  const { accessKey } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('resultados');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/client-portal/data/${accessKey}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Link de acesso inválido ou expirado.');
        }
        return res.json();
      })
      .then(data => {
        setClient(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [accessKey]);

  if (loading) {
    return (
      <div className="bg-neutral-950 text-neutral-100 min-h-screen flex flex-col items-center justify-center font-sans">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-neutral-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-indigo-500 animate-spin"></div>
        </div>
        <p className="mt-4 text-neutral-400 text-sm tracking-wider animate-pulse">Carregando painel de growth exclusivo...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="bg-neutral-950 text-neutral-100 min-h-screen flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        
        <div className="bg-neutral-900/60 border border-red-500/20 max-w-md w-full p-8 rounded-2xl text-center backdrop-blur-md relative z-10">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Acesso Não Autorizado</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Este link de acesso seguro é inválido, está expirado ou foi revogado pelo seu Growth Advisor.
          </p>
          <div className="text-xs text-neutral-500 border-t border-neutral-800 pt-4">
            Se você é cliente da <strong>QAO Growth Advisory</strong>, solicite um novo link de acesso direto via WhatsApp para o seu assessor.
          </div>
        </div>
      </div>
    );
  }

  // Prepara dados para os gráficos
  const chartData = client.metrics.map(m => ({
    periodo: m.periodo,
    Faturamento: m.faturamento,
    Investimento: m.investimentoAds,
    Leads: m.leadsGerados,
    ROI: m.roi,
    CAC: m.cac,
    LTV: m.ltv,
    Conversao: m.taxaConversao
  }));

  // Pega a métrica mais recente para os KPI cards
  const latestMetric = client.metrics[client.metrics.length - 1] || {
    faturamento: 0,
    investimentoAds: 0,
    leadsGerados: 0,
    roi: 0,
    cac: 0,
    ltv: 0,
    taxaConversao: 0
  };

  const handleCopyPix = (invoice) => {
    if (!invoice.pixCode) return;
    navigator.clipboard.writeText(invoice.pixCode);
    setCopiedInvoiceId(invoice.id);
    setTimeout(() => setCopiedInvoiceId(null), 3000);
  };

  const getICEColor = (score) => {
    if (score >= 20) return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5';
    if (score >= 15) return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5';
    return 'text-neutral-400 border-neutral-700/30 bg-neutral-800/20';
  };

  return (
    <div className="bg-neutral-950 text-neutral-100 min-h-screen font-sans relative overflow-x-hidden pb-12">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none"></div>

      {/* Main Header */}
      <header className="border-b border-neutral-900 bg-neutral-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              QAO
            </span>
            <div className="h-5 w-[1px] bg-neutral-800"></div>
            <span className="text-xs uppercase font-bold tracking-widest text-neutral-500 bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800/80">
              Portal do Cliente
            </span>
          </div>

          <div className="text-center sm:text-right">
            <h1 className="text-lg font-bold text-white tracking-tight">{client.empresa}</h1>
            <p className="text-xs text-neutral-400">Parceiro de Growth Advisory • Responsável: {client.nome}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 relative z-10">
        
        {/* Welcome Section */}
        <section className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-neutral-850 p-8 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Assessoria de Growth Ativa</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Olá, {client.nome.split(' ')[0]}!</h2>
            <p className="text-neutral-400 text-sm mt-1 max-w-xl">
              Bem-vindo ao seu painel estratégico. Aqui você acompanha a performance das nossas campanhas, o backlog de experimentos de growth e os entregáveis programados.
            </p>
          </div>

          <div className="flex gap-4 self-stretch md:self-auto border-t md:border-t-0 pt-4 md:pt-0 border-neutral-900">
            <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-850/80 flex-1 md:flex-none min-w-[120px] text-center">
              <span className="text-xs text-neutral-500 font-medium block">Investimento Anúncios</span>
              <span className="text-base font-bold text-white block mt-1">
                {(client.budgetAds || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-850/80 flex-1 md:flex-none min-w-[120px] text-center">
              <span className="text-xs text-neutral-500 font-medium block">Experimentos Totais</span>
              <span className="text-base font-bold text-cyan-400 block mt-1">{client.experiments.length}</span>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-900 mb-8 overflow-x-auto gap-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('resultados')}
            className={`pb-4 px-4 font-semibold text-sm transition-all relative border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'resultados' 
                ? 'text-cyan-400 border-cyan-500' 
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <TrendingUp size={16} />
            Resultados e Métricas
          </button>
          <button
            onClick={() => setActiveTab('experimentos')}
            className={`pb-4 px-4 font-semibold text-sm transition-all relative border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'experimentos' 
                ? 'text-cyan-400 border-cyan-500' 
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <Layers size={16} />
            Experimentos ({client.experiments.length})
          </button>
          <button
            onClick={() => setActiveTab('tarefas')}
            className={`pb-4 px-4 font-semibold text-sm transition-all relative border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'tarefas' 
                ? 'text-cyan-400 border-cyan-500' 
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <Clock size={16} />
            Entregáveis e Tarefas
          </button>
          <button
            onClick={() => setActiveTab('financeiro')}
            className={`pb-4 px-4 font-semibold text-sm transition-all relative border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'financeiro' 
                ? 'text-cyan-400 border-cyan-500' 
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <DollarSign size={16} />
            Mensalidades e Faturamento
          </button>
        </div>

        {/* Tab Content: Resultados */}
        {activeTab === 'resultados' && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Metrics row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Faturamento Período</span>
                    <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg"><DollarSign size={14} /></span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-white">
                    {latestMetric.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="text-[10px] text-neutral-500 mt-4 font-medium tracking-wide">Mês de referência: {latestMetric.periodo || 'N/A'}</div>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Leads Gerados</span>
                    <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg"><Zap size={14} /></span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-white">{latestMetric.leadsGerados.toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-[10px] text-neutral-500 mt-4 font-medium tracking-wide">Taxa de conv.: {latestMetric.taxaConversao}%</div>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Custo Aquisição (CAC)</span>
                    <span className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg"><TrendingUp size={14} /></span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-white">
                    {latestMetric.cac.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="text-[10px] text-neutral-500 mt-4 font-medium tracking-wide">LTV Estimado: R$ {latestMetric.ltv}</div>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Retorno ROI</span>
                    <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg"><Award size={14} /></span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-white">{latestMetric.roi}x</p>
                </div>
                <div className="text-[10px] text-neutral-500 mt-4 font-medium tracking-wide">Sobre mídias digitais</div>
              </div>
            </div>

            {/* LTV/CAC Health Badge */}
            {latestMetric.cac > 0 && (
              <div className={`border p-4 rounded-xl flex items-center justify-between gap-4 ${
                (latestMetric.ltv / latestMetric.cac) >= 3 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                  : (latestMetric.ltv / latestMetric.cac) >= 1.5
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                    : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-neutral-900 rounded-lg">🛡️</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Relação LTV / CAC</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">Mede a saúde financeira e escalabilidade do crescimento do seu negócio.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black block">{(latestMetric.ltv / latestMetric.cac).toFixed(2)}x</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {(latestMetric.ltv / latestMetric.cac) >= 3 ? 'Altamente Saudável' : (latestMetric.ltv / latestMetric.cac) >= 1.5 ? 'Atenção' : 'Alto Risco'}
                  </span>
                </div>
              </div>
            )}

            {/* Charts Grid */}
            {chartData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart 1: Faturamento e Investimento */}
                <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl backdrop-blur-md">
                  <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                    <BarChart3 size={18} className="text-cyan-400" />
                    Crescimento de Receita vs Verba de Anúncios
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="periodo" stroke="#737373" fontSize={11} />
                        <YAxis stroke="#737373" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Bar dataKey="Faturamento" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Receita Bruta" />
                        <Bar dataKey="Investimento" fill="#6366f1" radius={[4, 4, 0, 0]} name="Verba Ads" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Leads e ROI */}
                <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl backdrop-blur-md">
                  <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                    <LineIcon size={18} className="text-indigo-400" />
                    Geração de Leads e Evolução do ROI
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="periodo" stroke="#737373" fontSize={11} />
                        <YAxis stroke="#737373" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Line type="monotone" dataKey="Leads" stroke="#818cf8" strokeWidth={3} name="Leads" dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="ROI" stroke="#10b981" strokeWidth={3} name="ROI (x)" dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-900/40 border border-dashed border-neutral-800 rounded-2xl p-12 text-center">
                <BarChart3 size={48} className="text-neutral-700 mx-auto mb-4" />
                <h3 className="font-bold text-white">Nenhum dado analítico</h3>
                <p className="text-neutral-500 text-sm mt-1 max-w-sm mx-auto">
                  Seu Growth Advisor lançará os primeiros resultados operacionais do mês em breve.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Experimentos */}
        {activeTab === 'experimentos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Cofre de Experimentos (Backlog & Testes)</h3>
                <p className="text-xs text-neutral-400">Metodologia ICE Score de priorização de hipóteses de crescimento.</p>
              </div>
            </div>

            {client.experiments.length === 0 ? (
              <div className="bg-neutral-900/40 border border-dashed border-neutral-800 rounded-2xl p-12 text-center">
                <Layers size={48} className="text-neutral-700 mx-auto mb-4" />
                <h3 className="font-bold text-white">Nenhum experimento cadastrado</h3>
                <p className="text-neutral-500 text-sm mt-1 max-w-sm mx-auto">
                  A assessoria de growth está mapeando e estruturando as primeiras alavancas e ideias de testes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {client.experiments.map(exp => {
                  const iceScore = (exp.impact || 5) * (exp.confidence || 5) * (exp.ease || 5);
                  return (
                    <div key={exp.id} className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                      
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            exp.status === 'em_teste' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                            exp.status === 'concluido' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            exp.status === 'backlog' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                            exp.status === 'cancelado' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                            'bg-neutral-800/60 border-neutral-700 text-neutral-400'
                          }`}>
                            {exp.status === 'em_teste' ? 'Em Teste 🧪' : exp.status.toUpperCase()}
                          </span>

                          <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold font-mono ${getICEColor(iceScore)}`} title={`Impacto: ${exp.impact} x Confiança: ${exp.confidence} x Facilidade: ${exp.ease}`}>
                            ICE: {iceScore}
                          </div>
                        </div>

                        <h4 className="font-bold text-white text-base tracking-tight mb-2">{exp.title}</h4>
                        {exp.hypothesis && (
                          <div className="bg-neutral-950/50 border border-neutral-900 p-3 rounded-lg text-xs text-neutral-400 italic mb-4">
                            <strong>Hipótese:</strong> "{exp.hypothesis}"
                          </div>
                        )}
                        {exp.description && <p className="text-neutral-400 text-xs line-clamp-3 mb-4 leading-relaxed">{exp.description}</p>}
                      </div>

                      {/* Resultados e Aprendizados (caso concluido) */}
                      {(exp.results || exp.learnings) && (
                        <div className="mt-4 pt-4 border-t border-neutral-850/80 space-y-3">
                          {exp.results && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 block mb-0.5">Resultados Obtidos:</span>
                              <p className="text-xs text-neutral-300 bg-neutral-950/30 p-2.5 rounded-lg border border-neutral-900/60">{exp.results}</p>
                            </div>
                          )}
                          {exp.learnings && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-0.5">Aprendizado Consolidado:</span>
                              <p className="text-xs text-neutral-300 bg-neutral-950/30 p-2.5 rounded-lg border border-neutral-900/60">{exp.learnings}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Tarefas */}
        {activeTab === 'tarefas' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Acompanhamento de Entregas (Roadmap)</h3>
              <p className="text-xs text-neutral-400">Verifique as tarefas operacionais que a assessoria está executando no momento.</p>
            </div>

            {client.tasks.length === 0 ? (
              <div className="bg-neutral-900/40 border border-dashed border-neutral-800 rounded-2xl p-12 text-center">
                <Clock size={48} className="text-neutral-700 mx-auto mb-4" />
                <h3 className="font-bold text-white">Nenhuma tarefa no roadmap</h3>
                <p className="text-neutral-500 text-sm mt-1 max-w-sm mx-auto">
                  Não há tarefas ativas agendadas para esta conta no momento.
                </p>
              </div>
            ) : (
              <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl overflow-hidden">
                <div className="divide-y divide-neutral-900">
                  {client.tasks.map(task => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'concluido';
                    return (
                      <div key={task.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-neutral-900/20 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${
                              task.status === 'concluido' ? 'bg-emerald-500' :
                              task.status === 'em_andamento' ? 'bg-blue-500' :
                              task.status === 'revisao' ? 'bg-amber-500' :
                              'bg-neutral-600'
                            }`} title={task.status.replace('_', ' ')}></span>
                            <h4 className={`font-semibold text-sm ${task.status === 'concluido' ? 'text-neutral-500 line-through' : 'text-white'}`}>
                              {task.title}
                            </h4>
                          </div>
                          {task.description && <p className="text-neutral-400 text-xs ml-5 leading-relaxed">{task.description}</p>}
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          {task.dueDate && (
                            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                              <Calendar size={13} />
                              <span className={isOverdue ? 'text-rose-500 font-bold' : ''}>
                                {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                {isOverdue && ' (Atrasada)'}
                              </span>
                            </div>
                          )}
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            task.status === 'concluido' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            task.status === 'em_andamento' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                            task.status === 'revisao' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                            'bg-neutral-800 border-neutral-700 text-neutral-400'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Financeiro */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Histórico de Mensalidades da Assessoria</h3>
              <p className="text-xs text-neutral-400">Verifique cobranças passadas e efetue pagamentos pendentes via Pix.</p>
            </div>

            {client.invoices.length === 0 ? (
              <div className="bg-neutral-900/40 border border-dashed border-neutral-800 rounded-2xl p-12 text-center">
                <DollarSign size={48} className="text-neutral-700 mx-auto mb-4" />
                <h3 className="font-bold text-white">Nenhuma fatura lançada</h3>
                <p className="text-neutral-500 text-sm mt-1 max-w-sm mx-auto">
                  A assessoria financeira gerará sua primeira mensalidade em lote no início do período de faturamento.
                </p>
              </div>
            ) : (
              <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-900 bg-neutral-950/40 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-4 pl-6">Período</th>
                      <th className="p-4">Valor</th>
                      <th className="p-4">Vencimento</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 text-sm text-neutral-300">
                    {client.invoices.map(invoice => (
                      <tr key={invoice.id} className="hover:bg-neutral-900/10 transition-colors">
                        <td className="p-4 pl-6 font-semibold text-white">{invoice.periodo}</td>
                        <td className="p-4">
                          {invoice.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-4">
                          {new Date(invoice.vencimento).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            invoice.status === 'pago' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            invoice.status === 'atrasado' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                            'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          {invoice.status === 'pendente' || invoice.status === 'atrasado' ? (
                            <button
                              onClick={() => setSelectedInvoice(invoice)}
                              className="bg-cyan-500 hover:bg-cyan-600 text-neutral-950 font-bold px-3 py-1 rounded-lg text-xs transition-colors shadow-sm inline-flex items-center gap-1"
                            >
                              Pagar Pix <ArrowUpRight size={12} />
                            </button>
                          ) : invoice.nfeUrl ? (
                            <a
                              href={invoice.nfeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-neutral-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 font-semibold"
                            >
                              Nota Fiscal (PDF) 📄
                            </a>
                          ) : (
                            <span className="text-xs text-neutral-500 italic">Pago (Pix)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Pix Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            <button 
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white font-bold text-lg"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-1">Efetuar Pagamento</span>
              <h3 className="text-xl font-extrabold text-white">Mensalidade QAO Advisory</h3>
              <p className="text-xs text-neutral-400 mt-1">Período: {selectedInvoice.periodo}</p>
            </div>

            {/* QR Code Real dynamically loaded via Google/QRServer API based on Sicredi pixCode */}
            {selectedInvoice.pixCode ? (
              <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto mb-6 flex items-center justify-center shadow-lg border border-neutral-800">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedInvoice.pixCode)}`} 
                  alt="QR Code Pix"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-805 text-center mb-6">
                <AlertCircle size={28} className="text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">Erro ao renderizar QR Code. Por favor, solicite a chave copia e cola manual.</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-850">
                <div className="flex justify-between items-center text-xs text-neutral-500 mb-1">
                  <span>Valor de Faturamento</span>
                  <span>Vencimento</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-white">
                  <span className="text-base font-black text-cyan-400">
                    {selectedInvoice.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span>{new Date(selectedInvoice.vencimento).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {selectedInvoice.pixCode && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Pix Copia e Cola</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={selectedInvoice.pixCode}
                      className="bg-neutral-950 text-neutral-400 font-mono text-xs px-3.5 py-2.5 border border-neutral-850 rounded-xl flex-1 select-all focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopyPix(selectedInvoice)}
                      className="bg-cyan-500 hover:bg-cyan-600 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Clipboard size={14} />
                      {copiedInvoiceId === selectedInvoice.id ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-neutral-500 text-center mt-6 leading-relaxed">
              O faturamento Pix é gerado de forma segura e autenticada. <br />
              Assim que o pagamento for liquidado, sua nota fiscal será emitida automaticamente.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
