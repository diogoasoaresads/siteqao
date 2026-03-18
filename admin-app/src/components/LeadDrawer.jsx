import React, { useState, useEffect } from 'react';

export default function LeadDrawer({ lead, isOpen, onClose }) {
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (lead) {
      setObservacoes(lead.observacoes || '');
    }
  }, [lead]);

  const handleSalvarObservacoes = async () => {
    if (!lead) return;
    setSalvando(true);
    try {
      await fetch(`/api/leads/${lead.id}/observacoes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacoes })
      });
      setTimeout(() => setSalvando(false), 600);
    } catch(e) {
      console.error("Falha ao salvar nota", e);
      setSalvando(false);
    }
  };
  if (!isOpen || !lead) return null;

  const formatDate = (dateString) => {
    if(!dateString) return 'Data desconhecida';
    return new Date(dateString).toLocaleDateString('pt-BR', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const s = status || 'novo';
    switch(s) {
        case 'novo': return 'bg-blue-100 text-blue-800';
        case 'contato_iniciado': return 'bg-yellow-100 text-yellow-800';
        case 'qualificado': return 'bg-purple-100 text-purple-800';
        case 'proposta_enviada': return 'bg-orange-100 text-orange-800';
        case 'fechado': return 'bg-emerald-100 text-emerald-800';
        case 'perdido': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formattedPhone = lead.telefone ? lead.telefone.replace(/\D/g, '') : '';
  const waLink = `https://wa.me/${formattedPhone}?text=Ol%C3%A1%20${encodeURIComponent(lead.nome)}%2C%20tudo%20bem%3F%20Vimos%20seu%20cadastro%20no%20site%20da%20QAO...`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      ></div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          {/* Drawer Panel */}
          <div className="pointer-events-auto w-screen max-w-md transform transition-all shadow-2xl bg-white border-l flex flex-col h-full">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900" id="slide-over-title">Detalhes do Lead</h2>
                <p className="text-sm text-gray-500 mt-1">Capturado em {formatDate(lead.createdAt)}</p>
              </div>
              <div className="ml-3 flex h-7 items-center">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 p-1"
                >
                  <span className="sr-only">Fechar painel</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              
              {/* Status Badge */}
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                    {(lead.status || 'novo').replace('_', ' ')}
                </span>
              </div>

              {/* Contato Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Informações de Contato</h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="block text-xs text-gray-400">Nome</span>
                    <span className="block text-sm font-medium text-gray-900">{lead.nome}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400">E-mail</span>
                    <span className="block text-sm font-medium text-gray-900">{lead.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400">Telefone / WhatsApp</span>
                    <span className="block text-sm font-medium text-gray-900">{lead.telefone}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400">Empresa</span>
                    <span className="block text-sm font-medium text-gray-900">{lead.empresa || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Contexto da Conversão */}
               <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Contexto da Captura</h3>
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-sm">
                    <p><span className="font-semibold text-blue-900">Origem:</span> <span className="text-blue-800">{lead.origem_da_pagina || 'Orgânico / Desconhecida'}</span></p>
                </div>
              </div>

              {/* Mensagem / Dados do Form */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Respostas do Formulário</h3>
                <div className="bg-white border rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed shadow-sm">
                    {lead.mensagem || 'Nenhuma mensagem ou dados detalhados preenchidos por este lead.'}
                </div>
              </div>

              {/* Anotações CRM */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Anotações Internas (CRM)</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm shadow-sm flex flex-col gap-2">
                    <textarea 
                      className="w-full text-sm text-gray-700 p-2 border border-transparent hover:border-gray-200 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none resize-none transition-all" 
                      rows={4}
                      placeholder="Adicione comentários sobre as reuniões, objeções de venda, ou perfil..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end">
                      <button 
                        type="button" 
                        onClick={handleSalvarObservacoes}
                        disabled={salvando}
                        className="bg-black text-white text-xs font-medium px-4 py-2 rounded disabled:opacity-50 hover:bg-gray-800 transition-colors"
                      >
                        {salvando ? 'Salvando...' : 'Salvar Nota'}
                      </button>
                    </div>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <a 
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex justify-center items-center gap-2 rounded-md bg-[#25D366] px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1EBE5D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  Iniciar Conversa no WhatsApp
                </a>
                <p className="text-center text-xs text-gray-400 mt-3 mb-1">Dica: Movimente o card pelo Pipeline Kanban</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
