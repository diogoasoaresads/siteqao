import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Edit2, Trash2, Calendar, User, CheckSquare, ListFilter } from 'lucide-react';

const COLUMNS = [
  { id: 'a_fazer', title: 'A Fazer' },
  { id: 'em_andamento', title: 'Em Andamento' },
  { id: 'revisao', title: 'Em Revisão' },
  { id: 'concluido', title: 'Concluído' }
];

const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'concluido') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(dueDate);
  taskDate.setHours(0, 0, 0, 0);
  return taskDate < today;
};

export default function GrowthTasks() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'a_fazer',
    priority: 'media',
    responsible: '',
    dueDate: '',
    clientId: '',
    experimentId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const clientsRes = await fetch('/api/clients');
      const clientsData = await clientsRes.json();
      if (Array.isArray(clientsData)) {
        setClients(clientsData);
      }

      const tasksUrl = selectedClientId ? `/api/tasks?clientId=${selectedClientId}` : '/api/tasks';
      const tasksRes = await fetch(tasksUrl);
      const tasksData = await tasksRes.json();
      if (Array.isArray(tasksData)) setTasks(tasksData);

      // Carregar experimentos para vincular se quiser
      const expRes = await fetch('/api/experiments');
      const expData = await expRes.json();
      if (Array.isArray(expData)) setExperiments(expData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClientId]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'a_fazer',
      priority: 'media',
      responsible: '',
      dueDate: '',
      clientId: clients[0]?.id || '',
      experimentId: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'a_fazer',
      priority: task.priority || 'media',
      responsible: task.responsible || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      clientId: task.clientId || '',
      experimentId: task.experimentId || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
    const method = editingTask ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert('Erro ao salvar tarefa.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Erro ao deletar.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    
    // Optimistic UI Update
    setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Erro ao mover tarefa', err);
      fetchData(); // Rollback em caso de falha física
    }
  };

  const filteredExperiments = experiments.filter(e => e.clientId === formData.clientId);

  return (
    <div className="space-y-6 h-full flex flex-col font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Quadro de Tarefas de Growth</h2>
          <p className="text-sm text-gray-500">Gerencie e acompanhe a execução das demandas de marketing e testes por cliente.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          disabled={clients.length === 0}
          className={`flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
            clients.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListFilter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filtrar por Cliente:</span>
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="">Todos os clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.empresa}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Carregando tarefas...</div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-full min-w-max items-start">
              {COLUMNS.map(col => {
                const colTasks = tasks.filter(t => t.status === col.id);
                return (
                  <div key={col.id} className="w-[280px] bg-gray-100/60 border border-gray-200 rounded-xl flex flex-col h-[calc(100vh-220px)]">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80 rounded-t-xl">
                      <h3 className="font-semibold text-gray-700 text-sm">{col.title}</h3>
                      <span className="bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-full font-bold">{colTasks.length}</span>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${
                            snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
                          }`}
                          style={{ minHeight: '150px' }}
                        >
                          {colTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => {
                                const overdue = isOverdue(task.dueDate, task.status);
                                return (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white p-4 rounded-xl border shadow-xs transition-all cursor-pointer ${
                                      overdue 
                                        ? 'border-red-300 bg-red-50/20 hover:border-red-400 hover:shadow-xs' 
                                        : snapshot.isDragging 
                                          ? 'shadow-xl border-black rotate-1' 
                                          : 'border-gray-200 hover:border-gray-300 hover:shadow-xs'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start gap-2 mb-1.5">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate max-w-[120px]">
                                        {task.client?.empresa}
                                      </span>
                                      <div className="flex gap-1">
                                        {overdue && (
                                          <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border bg-red-600 text-white border-red-600 animate-pulse">
                                            Atrasada
                                          </span>
                                        )}
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border ${
                                          task.priority === 'alta' ? 'bg-red-50 text-red-600 border-red-200' :
                                          task.priority === 'media' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                          'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                          {task.priority}
                                        </span>
                                      </div>
                                    </div>

                                    <p className="font-bold text-sm text-gray-900 leading-tight mb-1">{task.title}</p>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description || 'Sem descrição...'}</p>

                                    {task.experiment && (
                                      <div className="text-[10px] bg-neutral-50 border border-neutral-100 p-1.5 rounded text-neutral-600 mb-3 truncate">
                                        🧪 Exp: {task.experiment.title}
                                      </div>
                                    )}

                                    <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-50 pt-2.5">
                                      <div className="flex items-center gap-1">
                                        <User size={10} />
                                        <span>{task.responsible || 'Sem resp.'}</span>
                                      </div>
                                      {task.dueDate && (
                                        <div className={`flex items-center gap-1 font-medium ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                                          <Calendar size={10} />
                                          <span>{new Date(task.dueDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                      )}
                                    </div>

                                  <div className="flex justify-end gap-1.5 mt-3 pt-2 border-t border-dashed border-gray-100">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(task); }}
                                      className="p-1 hover:bg-neutral-100 rounded text-gray-500 transition-colors"
                                    >
                                      <Edit2 size={10} />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                      className="p-1 hover:bg-red-50 hover:text-red-600 rounded text-gray-400 transition-colors"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                </div>
                              );
                            }}
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
      )}

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-semibold">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Título da Tarefa *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                  placeholder="Ex: Criar Landing Page do Teste"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 h-16"
                  placeholder="Destaque as especificações da entrega..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Cliente *</label>
                  <select
                    value={formData.clientId}
                    onChange={e => setFormData({ ...formData, clientId: e.target.value, experimentId: '' })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 bg-white"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.empresa}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Experimento Associado</label>
                  <select
                    value={formData.experimentId}
                    onChange={e => setFormData({ ...formData, experimentId: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 bg-white"
                  >
                    <option value="">Nenhum experimento</option>
                    {filteredExperiments.map(exp => (
                      <option key={exp.id} value={exp.id}>{exp.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 bg-white"
                  >
                    <option value="a_fazer">A Fazer</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="revisao">Em Revisão</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 bg-white"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Responsável</label>
                  <input
                    type="text"
                    value={formData.responsible}
                    onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Nome do integrante"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Prazo de Entrega</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
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
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
