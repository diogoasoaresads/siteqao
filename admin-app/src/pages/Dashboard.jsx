import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return <div className="p-8 text-gray-500">Carregando métricas seguras...</div>;

  const { metrics, recentes } = data;

  const statCards = [
    { label: 'Total Válidos', value: metrics?.total || 0 },
    { label: 'Oportunidades Novas', value: metrics?.novos || 0 },
    { label: 'Qualificados (MQL)', value: metrics?.qualificados || 0 },
    { label: 'Contratos Fechados', value: metrics?.fechados || 0 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Visão Geral de Aquisição</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex flex-col justify-between">
             <h3 className="text-sm font-medium text-gray-500">{s.label}</h3>
             <p className="text-3xl font-bold mt-2 text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Entradas Recentes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {(!recentes || recentes.length === 0) ? <p className="px-6 py-4 text-sm text-gray-500">Nenhum evento detectado.</p> : null}
          {recentes?.map(lead => (
            <div key={lead.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
               <div>
                  <p className="font-medium text-gray-900">{lead.nome}</p>
                  <p className="text-sm text-gray-500">{lead.empresa} • {lead.origem_da_pagina}</p>
               </div>
               <span className="px-3 py-1 rounded-full text-xs font-medium bg-black text-white">{lead.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
