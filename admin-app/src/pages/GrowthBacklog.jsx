import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Beaker, Star, ArrowUpDown, ChevronDown, CheckCircle, XCircle } from 'lucide-react';

export default function GrowthBacklog() {
  const [experiments, setExperiments] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'ideia',
    impact: 5,
    confidence: 5,
    ease: 5,
    hypothesis: '',
    metricToTrack: '',
    results: '',
    learnings: '',
    clientId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const clientsRes = await fetch('/api/clients');
      const clientsData = await clientsRes.json();
      if (Array.isArray(clientsData)) setClients(clientsData);

      const expUrl = selectedClientId ? `/api/experiments?clientId=${selectedClientId}` : '/api/experiments';
      const expRes = await fetch(expUrl);
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
    setEditingExperiment(null);
    setFormData({
      title: '',
      description: '',
      status: 'ideia',
      impact: 5,
      confidence: 5,
      ease: 5,
      hypothesis: '',
      metricToTrack: '',
      results: '',
      learnings: '',
      clientId: clients[0]?.id || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setEditingExperiment(exp);
    setFormData({
      title: exp.title || '',
      description: exp.description || '',
      status: exp.status || 'ideia',
      impact: exp.impact || 5,
      confidence: exp.confidence || 5,
      ease: exp.ease || 5,
      hypothesis: exp.hypothesis || '',
      metricToTrack: exp.metricToTrack || '',
      results: exp.results || '',
      learnings: exp.learnings || '',
      clientId: exp.clientId || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingExperiment ? `/api/experiments/${editingExperiment.id}` : '/api/experiments';
    const method = editingExperiment ? 'PUT' : 'POST';

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
        alert('Erro ao salvar experimento.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este experimento?')) return;
    try {
      const res = await fetch(`/api/experiments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Erro ao deletar.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calcula pontuação ICE média
  const getIceScore = (impact, confidence, ease) => {
    return ((impact + confidence + ease) / 3).toFixed(1);
  };

  // Ordena por ICE Score decrescente
  const sortedExperiments = [...experiments].sort((a, b) => {
    const scoreA = parseFloat(getIceScore(a.impact, a.confidence, a.ease));
    const scoreB = parseFloat(getIceScore(b.impact, b.confidence, b.ease));
    return scoreB - scoreA;
  });

  const getIceColor = (score) => {
    if (score >= 7.5) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 5.0) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-gray-500 bg-gray-50 border-gray-200';
  };

  // Encontra os destaques (apenas de experimentos ativos para focar no backlog real)
  const activeExps = experiments.filter(e => e.status !== 'concluido' && e.status !== 'cancelado');
  
  let highestImpactExp = null;
  let highestEaseExp = null;

  if (activeExps.length > 0) {
    // Maior impacto (impact)
    highestImpactExp = activeExps.reduce((prev, current) => {
      return (prev.impact > current.impact) ? prev : current;
    });

    // Maior facilidade (ease)
    highestEaseExp = activeExps.reduce((prev, current) => {
      return (prev.ease > current.ease) ? prev : current;
    });
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Backlog de Growth & ICE Score</h2>
          <p className="text-sm text-gray-500">Mensure e classifique suas ideias de teste usando a pontuação ICE.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          disabled={clients.length === 0}
          className={`flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
            clients.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Plus size={16} /> Nova Ideia / Experimento
        </button>
      </div>

      {/* ICE Insights Highlights */}
      {!loading && activeExps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highestImpactExp && (
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-5 rounded-2xl shadow-sm border border-neutral-700/50 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-4 top-4 text-neutral-700/30">
                <Star size={72} strokeWidth={1} />
              </div>
              <div className="z-10">
                <span className="bg-amber-400 text-neutral-950 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider">
                  🔥 Maior Alavanca (Mais Impacto)
                </span>
                <h3 className="font-bold text-lg mt-3 leading-tight text-neutral-50">{highestImpactExp.title}</h3>
                <p className="text-xs text-neutral-300 mt-1 line-clamp-2">{highestImpactExp.description || 'Sem descrição.'}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-700/50 flex justify-between items-center z-10">
                <span className="text-[11px] text-neutral-400 font-medium">{highestImpactExp.client?.empresa}</span>
                <div className="flex gap-3 text-xs">
                  <span>Imp: <strong className="text-amber-400">{highestImpactExp.impact}/10</strong></span>
                  <span>ICE: <strong className="text-white">{getIceScore(highestImpactExp.impact, highestImpactExp.confidence, highestImpactExp.ease)}</strong></span>
                </div>
              </div>
            </div>
          )}

          {highestEaseExp && (
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-4 top-4 text-neutral-100">
                <Beaker size={72} strokeWidth={1} />
              </div>
              <div className="z-10">
                <span className="bg-green-100 text-green-800 border border-green-200 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider">
                  ⚡ Vitória Rápida (Mais Fácil de Executar)
                </span>
                <h3 className="font-bold text-lg mt-3 leading-tight text-neutral-950">{highestEaseExp.title}</h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{highestEaseExp.description || 'Sem descrição.'}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center z-10">
                <span className="text-[11px] text-gray-400 font-medium">{highestEaseExp.client?.empresa}</span>
                <div className="flex gap-3 text-xs">
                  <span>Fácil: <strong className="text-green-600">{highestEaseExp.ease}/10</strong></span>
                  <span>ICE: <strong className="text-gray-800">{getIceScore(highestImpactExp.impact, highestImpactExp.confidence, highestImpactExp.ease)}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Row */}
      <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
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

        <div className="text-xs text-gray-400">
          Rankeado por ICE: Impacto × Confiança × Facilidade
        </div>
      </div>

      {/* Experiments Ranking */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Carregando experimentos...</div>
      ) : sortedExperiments.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <h3 className="font-semibold text-gray-800 text-lg">Nenhum experimento registrado</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">Registre suas hipóteses de crescimento, pontue a facilidade e impacto, e organize o roadmap de validação.</p>
          {clients.length > 0 && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2"
            >
              <Plus size={16} /> Registrar Primeiro Teste
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedExperiments.map((exp, index) => {
            const score = getIceScore(exp.impact, exp.confidence, exp.ease);
            return (
              <div
                key={exp.id}
                className="bg-white border border-gray-200 rounded-xl shadow-xs p-5 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-l-black"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-neutral-100 text-neutral-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">
                      {exp.client?.empresa}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${
                      exp.status === 'concluido' ? 'bg-green-100 text-green-800' :
                      exp.status === 'em_teste' ? 'bg-blue-100 text-blue-800' :
                      exp.status === 'backlog' ? 'bg-amber-100 text-amber-800' :
                      exp.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {exp.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base">{exp.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{exp.description}</p>
                  
                  {exp.hypothesis && (
                    <p className="text-xs text-gray-500">
                      <strong className="text-gray-700">Hipótese:</strong> {exp.hypothesis}
                    </p>
                  )}
                </div>

                {/* ICE Stats and Actions */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-6 w-full md:w-auto justify-between border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="flex gap-4 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Imp</p>
                      <p className="text-sm font-semibold text-gray-800">{exp.impact}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Conf</p>
                      <p className="text-sm font-semibold text-gray-800">{exp.confidence}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Facil</p>
                      <p className="text-sm font-semibold text-gray-800">{exp.ease}</p>
                    </div>
                  </div>

                  <div className={`px-4 py-2 rounded-xl border font-black text-lg text-center flex flex-col justify-center min-w-[70px] ${getIceColor(score)}`}>
                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-70">ICE</span>
                    {score}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(exp)}
                      className="p-2 hover:bg-neutral-100 border border-gray-200 rounded-lg text-gray-600 transition-colors"
                      title="Editar Experimento"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="p-2 hover:bg-red-50 border border-gray-200 hover:border-red-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingExperiment ? 'Editar Experimento' : 'Novo Experimento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-semibold">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-6 md:col-span-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Título do Experimento *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: Teste A/B de Copy na Hero Section"
                  />
                </div>
                
                <div className="col-span-3 md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Cliente *</label>
                  <select
                    value={formData.clientId}
                    onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 bg-white"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.empresa}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Descrição / Contexto</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 h-16"
                    placeholder="Explique o que é o experimento..."
                  />
                </div>

                {/* ICE inputs */}
                <div className="col-span-2 bg-neutral-50 p-3.5 rounded-xl border border-gray-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1 text-center">Impacto (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.impact}
                    onChange={e => setFormData({ ...formData, impact: parseInt(e.target.value) })}
                    className="w-full text-center px-3.5 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none font-bold text-sm border-gray-300"
                  />
                </div>

                <div className="col-span-2 bg-neutral-50 p-3.5 rounded-xl border border-gray-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1 text-center">Confiança (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.confidence}
                    onChange={e => setFormData({ ...formData, confidence: parseInt(e.target.value) })}
                    className="w-full text-center px-3.5 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none font-bold text-sm border-gray-300"
                  />
                </div>

                <div className="col-span-2 bg-neutral-50 p-3.5 rounded-xl border border-gray-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1 text-center">Facilidade (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.ease}
                    onChange={e => setFormData({ ...formData, ease: parseInt(e.target.value) })}
                    className="w-full text-center px-3.5 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none font-bold text-sm border-gray-300"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 bg-white"
                  >
                    <option value="ideia">Ideia</option>
                    <option value="backlog">Backlog</option>
                    <option value="em_teste">Em Teste</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Métrica Chave a Monitorar</label>
                  <input
                    type="text"
                    value={formData.metricToTrack}
                    onChange={e => setFormData({ ...formData, metricToTrack: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: Taxa de Conversão da Lead Page"
                  />
                </div>

                <div className="col-span-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Hipótese Declarada</label>
                  <textarea
                    value={formData.hypothesis}
                    onChange={e => setFormData({ ...formData, hypothesis: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 h-16"
                    placeholder="Se [fizermos X], então [acontecerá Y], porque [motivação]"
                  />
                </div>

                {editingExperiment && (
                  <>
                    <div className="col-span-6 pt-2 border-t border-gray-100">
                      <h4 className="font-bold text-sm text-gray-700 mb-3">Conclusão do Teste</h4>
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Resultados Quantitativos</label>
                      <textarea
                        value={formData.results}
                        onChange={e => setFormData({ ...formData, results: e.target.value })}
                        className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 h-20"
                        placeholder="Ex: Taxa subiu de 2.1% para 3.4% com 95% de significância."
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Aprendizados (Qualitativo)</label>
                      <textarea
                        value={formData.learnings}
                        onChange={e => setFormData({ ...formData, learnings: e.target.value })}
                        className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 h-20"
                        placeholder="Ex: Descobrimos que focar na dor do CAC baixo atrai leads mais qualificados."
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
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
                  Salvar Experimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
