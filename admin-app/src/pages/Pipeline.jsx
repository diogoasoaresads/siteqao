import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import LeadDrawer from '../components/LeadDrawer';

const COLUMNS = [
  { id: 'novo', title: 'Novos Leads' },
  { id: 'contato_iniciado', title: 'Em Contato' },
  { id: 'qualificado', title: 'Qualificados' },
  { id: 'proposta_enviada', title: 'Proposta' },
  { id: 'fechado', title: 'Fechados (Ganho)' },
  { id: 'perdido', title: 'Perdidos' }
];

export default function Pipeline() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = (lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };
  
  const fetchLeads = () => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        if (data.error) { window.location.href = '/admin/login'; return; }
        if (Array.isArray(data)) setLeads(data);
      })
      .catch(console.error);
  };
  
  useEffect(() => { fetchLeads(); }, []);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    // Optimistic UI update
    const newStatus = destination.droppableId;
    setLeads(prev => prev.map(l => l.id === draggableId ? { ...l, status: newStatus } : l));

    // API update
    await fetch(`/api/leads/${draggableId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
  };

  const leadsByStatus = (statusId) => leads.filter(l => l.status === statusId);

  return (
    <div className="space-y-6 h-full flex flex-col font-sans">
      <h2 className="text-2xl font-bold tracking-tight">Funil de Vendas (Kanban)</h2>
      
      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full min-w-max items-start">
            {COLUMNS.map(col => {
              const colLeads = leadsByStatus(col.id);
              return (
                <div key={col.id} className="w-[300px] bg-gray-100/60 border border-gray-200 rounded-xl flex flex-col h-[calc(100vh-180px)]">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80 rounded-t-xl">
                    <h3 className="font-semibold text-gray-700 text-sm">{col.title}</h3>
                    <span className="bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-full font-bold">{colLeads.length}</span>
                  </div>
                  
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}
                        style={{ minHeight: '150px' }}
                      >
                        {colLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => openDrawer(lead)}
                                className={`bg-white p-4 rounded-lg border shadow-sm transition-all cursor-pointer ${snapshot.isDragging ? 'shadow-xl border-black rotate-2 scale-105' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                              >
                                <p className="font-semibold text-sm text-gray-900 mb-1 leading-tight">{lead.nome}</p>
                                <p className="text-xs text-gray-500 mb-3 truncate">{lead.empresa}</p>
                                
                                <div className="text-xs bg-gray-50 p-2 rounded border border-gray-100 mb-3 text-gray-600 line-clamp-2">
                                  {lead.mensagem || 'Sem mensagem descritiva...'}
                                </div>

                                <div className="flex justify-between items-end">
                                  <span className="text-[10px] text-gray-400 font-medium tracking-wide">{lead.origem_da_pagina || 'Indefinida'}</span>
                                  <button onClick={(e) => { e.stopPropagation(); openDrawer(lead); }} className="text-xs font-semibold text-blue-600 hover:underline">
                                    Abrir Card
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      <LeadDrawer 
        lead={selectedLead} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
}
