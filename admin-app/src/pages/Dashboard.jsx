import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Beaker, CheckSquare, Target, ArrowUpRight, TrendingUp, Sparkles, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loadingDigest, setLoadingDigest] = useState(false);
  const [digestStatus, setDigestStatus] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.error) { window.location.href = '/admin/login'; return; }
        setData(d);
      })
      .catch(console.error);
  }, []);

  const handleDailyDigest = async () => {
    setLoadingDigest(true);
    setDigestStatus(null);
    try {
      const res = await fetch('/api/dashboard/daily-digest', { method: 'POST' });
      const d = await res.json();
      if (res.ok) {
        setDigestStatus({ type: 'success', message: d.message });
      } else {
        setDigestStatus({ type: 'error', message: d.error || 'Erro ao enviar resumo diário.' });
      }
    } catch (err) {
      setDigestStatus({ type: 'error', message: 'Falha de comunicação com o servidor.' });
    } finally {
      setLoadingDigest(false);
    }
  };

  if (!data) return <div className="p-8 text-gray-500">Carregando métricas da assessoria...</div>;

  const { metrics, recentes, portfolio } = data;

  const growthStats = [
    { label: 'Clientes Ativos', value: metrics?.activeClients || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { 
      label: 'Faturamento Mensal (MRR)', 
      value: (metrics?.mrr || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
      icon: DollarSign, 
      color: 'text-green-600 bg-green-50' 
    },
    { label: 'Experimentos Ativos', value: metrics?.runningExperiments || 0, icon: Beaker, color: 'text-purple-600 bg-purple-50' },
    { label: 'Tarefas de Growth', value: metrics?.pendingTasks || 0, icon: CheckSquare, color: 'text-amber-600 bg-amber-50' },
  ];

  const salesStats = [
    { label: 'Leads Capturados', value: metrics?.total || 0 },
    { label: 'Oportunidades Novas', value: metrics?.novos || 0 },
    { label: 'Qualificados (MQL)', value: metrics?.qualificados || 0 },
    { label: 'Contratos Fechados', value: metrics?.fechados || 0 },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Banner de Boas Vindas */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 p-6 rounded-2xl text-white shadow-xs relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full w-max">
            <Sparkles size={12} /> QAO Growth Advisory
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Relatório Executivo Geral</h2>
          <p className="text-neutral-400 text-sm max-w-lg">
            Pilote a assessoria de growth com visibilidade financeira completa, controle total de experimentos ativos, ROI e tarefas operacionais.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Target size={240} className="text-white translate-x-12 translate-y-12" />
        </div>
      </div>

      {/* Seção 1: Operações da Assessoria */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Saúde da Assessoria (Growth)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {growthStats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs flex items-center justify-between hover:shadow-md transition-all">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-gray-500">{s.label}</h4>
                  <p className="text-2xl font-black text-gray-950">{s.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${s.color}`}>
                  <Icon size={22} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção 2: Relatório Executivo da Carteira */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Portfólio Executivo e Saúde de Growth</h3>
        <div className="bg-white border border-gray-250 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Cliente / Empresa</th>
                  <th className="px-6 py-4">Retainer Mensal</th>
                  <th className="px-6 py-4">Verba de Ads</th>
                  <th className="px-6 py-4 text-center">Experimentos (Teste)</th>
                  <th className="px-6 py-4 text-center">Tarefas Ativas</th>
                  <th className="px-6 py-4 text-center">Atrasos</th>
                  <th className="px-6 py-4 text-center">Saúde LTV/CAC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm">
                {(!portfolio || portfolio.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 font-semibold">
                      Nenhum cliente ativo no portfólio no momento.
                    </td>
                  </tr>
                ) : (
                  portfolio.map(client => {
                    let healthBadge = null;
                    if (client.ltvCacHealth === 'saudavel') {
                      healthBadge = (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <ShieldCheck size={12} /> Saudável ({client.ltvCacRatio}x)
                        </span>
                      );
                    } else if (client.ltvCacHealth === 'atencao') {
                      healthBadge = (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                          <AlertTriangle size={12} /> Atenção ({client.ltvCacRatio}x)
                        </span>
                      );
                    } else if (client.ltvCacHealth === 'alerta') {
                      healthBadge = (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                          <AlertTriangle size={12} /> Alerta ({client.ltvCacRatio}x)
                        </span>
                      );
                    } else {
                      healthBadge = (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200 inline-flex items-center gap-1">
                          <HelpCircle size={12} /> Sem Dados
                        </span>
                      );
                    }

                    return (
                      <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{client.empresa}</div>
                          <div className="text-xs text-gray-500">{client.nome}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {client.valorMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {client.budgetAds.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {client.activeExperimentsCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {client.activeTasksCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {client.overdueTasksCount > 0 ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse inline-flex items-center gap-1">
                              ⚠️ {client.overdueTasksCount} atrasada{client.overdueTasksCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                              Em dia
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {healthBadge}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Seção 3: Funil de Vendas */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Pipeline e Prospecção Comercial</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {salesStats.map(s => (
            <div key={s.label} className="bg-white border border-gray-150 p-5 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</span>
              <p className="text-2xl font-bold mt-1 text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de Atividades e Atalhos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entradas recentes */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-250 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm">Novos Leads Recebidos</h3>
            <Link to="/pipeline" className="text-xs font-semibold text-neutral-600 hover:text-black flex items-center gap-1">
              Ver Funil Kanban <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-150">
            {(!recentes || recentes.length === 0) ? (
              <p className="px-6 py-8 text-center text-sm text-gray-500">Nenhum evento detectado.</p>
            ) : null}
            {recentes?.map(lead => (
              <div key={lead.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-bold text-sm text-gray-900">{lead.nome}</p>
                  <p className="text-xs text-gray-500">{lead.empresa} • Origem: {lead.origem_da_pagina || 'Desconhecida'}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-neutral-900 text-white uppercase">
                  {(lead.status || 'novo').replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Atalhos Rápidos */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-gray-950 text-sm">Ações de Growth</h3>
          <p className="text-xs text-gray-500">Navegue rapidamente pelas ferramentas integradas da assessoria.</p>
          
          <div className="space-y-2.5 pt-2">
            <button 
              onClick={handleDailyDigest}
              disabled={loadingDigest}
              className="w-full flex items-center justify-between p-3.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold text-sm disabled:opacity-50 cursor-pointer shadow-xs shadow-emerald-100"
            >
              <span>{loadingDigest ? '⚡ Enviando resumo...' : '⚡ Disparar Resumo Diário no WhatsApp'}</span>
              <span>📱</span>
            </button>

            {digestStatus && (
              <div className={`p-2.5 rounded-lg text-xs font-bold border ${digestStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                {digestStatus.message}
              </div>
            )}

            <Link 
              to="/clients" 
              className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-neutral-50 transition-all font-semibold text-sm text-gray-800"
            >
              <span>📂 Carteira de Clientes</span>
              <ArrowUpRight size={16} className="text-gray-400" />
            </Link>
            
            <Link 
              to="/backlog" 
              className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-neutral-50 transition-all font-semibold text-sm text-gray-800"
            >
              <span>🧪 Quadro de Experimentos ICE</span>
              <ArrowUpRight size={16} className="text-gray-400" />
            </Link>
            
            <Link 
              to="/tasks" 
              className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-neutral-50 transition-all font-semibold text-sm text-gray-800"
            >
              <span>📋 Kanban de Tarefas</span>
              <ArrowUpRight size={16} className="text-gray-400" />
            </Link>

            <Link 
              to="/metrics" 
              className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-neutral-50 transition-all font-semibold text-sm text-gray-800"
            >
              <span>📈 Métricas e ROI dos Clientes</span>
              <ArrowUpRight size={16} className="text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
