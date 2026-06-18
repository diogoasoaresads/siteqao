import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Users, Briefcase, Phone, Mail, Globe } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    status: 'ativo',
    valorMensal: '',
    budgetAds: '',
    observacoes: ''
  });

  const fetchClients = () => {
    setLoading(true);
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (data.error) { window.location.href = '/admin/login'; return; }
        if (Array.isArray(data)) setClients(data);
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

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({
      nome: '',
      empresa: '',
      email: '',
      telefone: '',
      status: 'ativo',
      valorMensal: '',
      budgetAds: '',
      observacoes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setFormData({
      nome: client.nome || '',
      empresa: client.empresa || '',
      email: client.email || '',
      telefone: client.telefone || '',
      status: client.status || 'ativo',
      valorMensal: client.valorMensal || '',
      budgetAds: client.budgetAds || '',
      observacoes: client.observacoes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
    const method = editingClient ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchClients();
      } else {
        alert('Erro ao salvar cliente.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente remover este cliente e todos os seus dados associados (experimentos, tarefas, métricas)?')) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchClients();
      } else {
        alert('Erro ao excluir cliente.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeClients = clients.filter(c => c.status === 'ativo').length;
  const totalMRR = clients.reduce((acc, c) => c.status === 'ativo' ? acc + (c.valorMensal || 0) : acc, 0);
  const totalBudgetAds = clients.reduce((acc, c) => c.status === 'ativo' ? acc + (c.budgetAds || 0) : acc, 0);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Gestão de Clientes</h2>
          <p className="text-sm text-gray-500">Gerencie a carteira de clientes ativos da sua assessoria de growth.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-neutral-100 rounded-lg text-black">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Clientes Ativos</p>
            <p className="text-2xl font-bold text-gray-900">{activeClients} / {clients.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-neutral-100 rounded-lg text-green-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Receita Recorrente (MRR)</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalMRR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-neutral-100 rounded-lg text-blue-600">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Budget Ads sob Gestão</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalBudgetAds.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
      </div>

      {/* Client List */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Carregando clientes...</div>
      ) : clients.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <h3 className="font-semibold text-gray-800 text-lg">Nenhum cliente cadastrado</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">Feche negócios no Funil de Vendas e promova leads a clientes ativos para começar a rodar experimentos.</p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2"
          >
            <Plus size={16} /> Cadastrar Primeiro Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => (
            <div key={client.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Cliente</span>
                    <h3 className="font-bold text-lg text-gray-950 leading-tight">{client.empresa}</h3>
                    <p className="text-sm text-gray-500">{client.nome}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    client.status === 'ativo' ? 'bg-green-50 text-green-700 border border-green-200' :
                    client.status === 'pausado' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {client.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2.5 my-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <span>{client.telefone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-dashed border-gray-100">
                    <span className="font-medium">Fee Retainer:</span>
                    <span className="font-bold text-gray-950">{(client.valorMensal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Budget Mídia:</span>
                    <span className="font-bold text-gray-950">{(client.budgetAds || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-dashed border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-neutral-500 font-semibold">
                      <Globe size={13} className="text-neutral-400" />
                      <span>Portal do Cliente:</span>
                    </div>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/admin/portal/${client.accessKey}`;
                        navigator.clipboard.writeText(link);
                        alert('Link de acesso seguro copiado para o WhatsApp!');
                      }}
                      className="text-xs text-blue-600 hover:text-white font-bold bg-blue-50 hover:bg-blue-600 px-2 py-0.5 rounded-md transition-all border border-blue-100 flex items-center gap-0.5"
                      title="Copiar link seguro do portal"
                    >
                      Copiar Link 🔗
                    </button>
                  </div>
                  {client.observacoes && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Anotações / Histórico:</span>
                      <p className="text-xs text-gray-600 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 whitespace-pre-wrap max-h-24 overflow-y-auto">{client.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50/80 px-6 py-4 flex justify-between items-center border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {client._count?.experiments || 0} Exp. • {client._count?.tasks || 0} Tar.
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(client)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                    title="Editar Cliente"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-400 transition-colors"
                    title="Remover Cliente"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-semibold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Empresa *</label>
                  <input
                    type="text"
                    required
                    value={formData.empresa}
                    onChange={e => setFormData({ ...formData, empresa: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Contato Responsável *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: Diogo Soares"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 bg-white"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="pausado">Pausado</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: contato@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Mensalidade (Fee) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.valorMensal}
                    onChange={e => setFormData({ ...formData, valorMensal: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: 5000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Budget Ads Mensal</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budgetAds}
                    onChange={e => setFormData({ ...formData, budgetAds: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: 20000"
                  />
                </div>
                {editingClient && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Link Exclusivo do Portal do Cliente (WhatsApp)</label>
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/admin/portal/${editingClient.accessKey}`}
                      className="w-full px-3.5 py-2 border rounded-xl text-sm border-gray-200 bg-neutral-50 text-neutral-500 font-mono select-all cursor-pointer"
                      onClick={(e) => {
                        e.target.select();
                        navigator.clipboard.writeText(e.target.value);
                        alert('Link do portal copiado!');
                      }}
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Anotações do Cliente / Histórico</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Histórico de vendas, detalhes do onboarding, etc."
                    rows={3}
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
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
