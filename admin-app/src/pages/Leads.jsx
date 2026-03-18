import React, { useEffect, useState } from 'react';

export default function Leads() {
  const [leads, setLeads] = useState([]);

  const fetchLeads = () => {
    fetch('/api/leads')
      .then(data => {
        if (data.error) { window.location.href = '/admin/login'; return; }
        if (Array.isArray(data)) setLeads(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDelete = async (id) => {
    if(!window.confirm('Excluir permanentemente este lead?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    fetchLeads();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Base de Contatos (CRM)</h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato & Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{lead.nome}</div>
                    <div className="text-sm text-gray-500">{lead.empresa}</div>
                    <div className="text-xs text-gray-400 mt-1">{lead.email} • {lead.telefone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex px-2 py-1 bg-gray-100 rounded text-xs">{lead.origem_da_pagina || 'Orgânico'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {(lead.status || 'novo').replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`https://wa.me/${lead.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-900 mr-4 font-semibold">
                      WhatsApp
                    </a>
                    <button onClick={() => handleDelete(lead.id)} className="text-red-500 hover:text-red-700 font-semibold">Excluir</button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">Base vazia. Nenhum lead capturado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
