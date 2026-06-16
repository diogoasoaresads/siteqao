import React, { useEffect, useState } from 'react';
import { CreditCard, QrCode, FileText, CheckCircle2, Clock, AlertTriangle, Plus, Copy, Check, ExternalLink, RefreshCw, MessageSquare } from 'lucide-react';

export default function Financial() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [copiedId, setCopiedId] = useState('');
  const [issuingNfeId, setIssuingNfeId] = useState('');
  const [sendingNoticeId, setSendingNoticeId] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    valor: '',
    periodo: '',
    vencimento: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const clientsRes = await fetch('/api/clients');
      const clientsData = await clientsRes.json();
      if (Array.isArray(clientsData)) {
        setClients(clientsData);
      }

      const invoicesRes = await fetch('/api/invoices');
      const invoicesData = await invoicesRes.json();
      if (Array.isArray(invoicesData)) setInvoices(invoicesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const dueDateStr = nextWeek.toISOString().split('T')[0];

    const defaultClient = clients[0];

    setFormData({
      clientId: defaultClient?.id || '',
      valor: defaultClient?.valorMensal || '',
      periodo: currentPeriod,
      vencimento: dueDateStr
    });
    setIsModalOpen(true);
  };

  const handleClientChangeInForm = (cid) => {
    const client = clients.find(c => c.id === cid);
    setFormData(prev => ({
      ...prev,
      clientId: cid,
      valor: client ? client.valorMensal : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert('Erro ao gerar cobrança.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pago' ? 'pendente' : 'pago';
    try {
      const res = await fetch(`/api/invoices/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmitNfe = async (id) => {
    setIssuingNfeId(id);
    // Simula delay de 1.2 segundos para processamento NFS-e
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/invoices/${id}/nfe`, {
          method: 'POST'
        });
        if (res.ok) {
          fetchData();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIssuingNfeId('');
      }
    }, 1200);
  };

  const handleSendWhatsappNotice = async (id) => {
    setSendingNoticeId(id);
    try {
      const res = await fetch(`/api/invoices/${id}/whatsapp-notice`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert('Lembrete de vencimento com PIX enviado via WhatsApp com sucesso!');
      } else {
        alert(data.error || 'Erro ao disparar WhatsApp.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha ao tentar se comunicar com o servidor.');
    } finally {
      setSendingNoticeId('');
    }
  };

  const [generatingRecurring, setGeneratingRecurring] = useState(false);
  const [simulatingPaymentId, setSimulatingPaymentId] = useState('');

  const handleGenerateRecurring = async () => {
    if (!confirm('Deseja gerar faturas automáticas para todos os clientes ativos neste mês?')) return;
    setGeneratingRecurring(true);
    try {
      const res = await fetch('/api/invoices/generate-recurring', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || 'Erro ao faturar carteira.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingRecurring(false);
    }
  };

  const handleSimulatePayment = async (id) => {
    setSimulatingPaymentId(id);
    try {
      const res = await fetch(`/api/invoices/${id}/simulate-payment`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || 'Erro na simulação do Pix.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulatingPaymentId('');
    }
  };

  const handleCopyPix = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Cálculos financeiros
  const totalRecebido = invoices.filter(i => i.status === 'pago').reduce((acc, i) => acc + i.valor, 0);
  const totalPendente = invoices.filter(i => i.status === 'pendente').reduce((acc, i) => acc + i.valor, 0);
  const mrrAtivo = clients.filter(c => c.status === 'ativo').reduce((acc, c) => acc + c.valorMensal, 0);

  const formatPeriod = (periodStr) => {
    if (!periodStr) return '';
    const [year, month] = periodStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]}/${year.substring(2)}`;
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Financeiro & Faturamento</h2>
          <p className="text-sm text-gray-500">Controle de mensalidades, faturas PIX e emissão automática de Nota Fiscal.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerateRecurring}
            disabled={clients.length === 0 || generatingRecurring}
            className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-850 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {generatingRecurring ? 'Gerando...' : 'Faturar Carteira Ativa'}
          </button>
          <button
            onClick={handleOpenCreate}
            disabled={clients.length === 0}
            className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Emitir Cobrança
          </button>
        </div>
      </div>

      {/* Cards Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-gray-500">MRR Ativo (Mensalidades)</h4>
            <p className="text-2xl font-black text-gray-950">
              {mrrAtivo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <CreditCard size={22} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-gray-500">Total Recebido (Caixa)</h4>
            <p className="text-2xl font-black text-green-600">
              {totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 text-green-600">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-gray-500">Contas a Receber</h4>
            <p className="text-2xl font-black text-amber-600">
              {totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Listagem de Faturas */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-150 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-850 text-sm">Faturas e Cobranças Geradas</h3>
          <span className="text-xs text-gray-400">Total de faturas: {invoices.length}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando dados financeiros...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Nenhuma fatura gerada. Clique em Emitir Cobrança para iniciar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 min-w-[900px]">
              <thead className="bg-gray-100/80 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Período</th>
                  <th className="px-6 py-3">Vencimento</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">PIX</th>
                  <th className="px-6 py-3 text-center">Notificação</th>
                  <th className="px-6 py-3 text-center">Nota Fiscal (NFS-e)</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 leading-tight">{invoice.client?.empresa}</p>
                      <p className="text-xs text-gray-400">{invoice.client?.nome}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{formatPeriod(invoice.periodo)}</td>
                    <td className="px-6 py-4">
                      {new Date(invoice.vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-950">
                      {invoice.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        invoice.status === 'pago' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {invoice.status === 'pago' ? (
                        <span className="text-xs text-gray-400 font-medium">Pago</span>
                      ) : (
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <QrCode size={12} /> Ver PIX
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {invoice.status === 'pago' ? (
                        <span className="text-xs text-gray-400 font-medium">Pago</span>
                      ) : sendingNoticeId === invoice.id ? (
                        <span className="text-xs text-gray-500 font-semibold flex items-center justify-center gap-1">
                          <RefreshCw size={12} className="animate-spin" /> Enviando...
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendWhatsappNotice(invoice.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#25D366] text-white rounded-lg text-xs font-bold hover:bg-[#1EBE5D] transition-colors cursor-pointer border border-[#1EBE5D]"
                        >
                          <MessageSquare size={12} /> Cobrar
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {invoice.nfeStatus === 'emitida' ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-0.5">
                            Emitida
                          </span>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              alert(`[Nota Fiscal nº ${invoice.nfeNumero}]\nNFS-e Emitida pela SEFAZ/Prefeitura com sucesso.\nValor: R$ ${invoice.valor.toFixed(2)}.`);
                            }}
                            className="text-[10px] text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
                          >
                            Visualizar <ExternalLink size={10} />
                          </a>
                        </div>
                      ) : issuingNfeId === invoice.id ? (
                        <span className="text-xs text-gray-500 font-semibold flex items-center justify-center gap-1">
                          <RefreshCw size={12} className="animate-spin" /> Emitindo...
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEmitNfe(invoice.id)}
                          className="px-2.5 py-1 border border-gray-300 hover:border-black rounded-lg text-xs font-bold text-gray-700 hover:text-black transition-colors cursor-pointer"
                        >
                          Emitir Nota
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {invoice.status === 'pendente' && (
                        <button
                          onClick={() => handleSimulatePayment(invoice.id)}
                          disabled={simulatingPaymentId === invoice.id}
                          className="text-xs font-bold py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                          title="Registra o Pix recebido diretamente, emite a NFS-e e envia o recibo por WhatsApp"
                        >
                          {simulatingPaymentId === invoice.id ? 'Processando...' : '⚡ Baixa e Emitir Nota'}
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleStatus(invoice.id, invoice.status)}
                        className={`text-xs font-bold py-1 px-2.5 rounded-lg border transition-colors cursor-pointer ${
                          invoice.status === 'pago' ? 'border-gray-200 text-gray-500 hover:bg-gray-100' : 'border-green-600 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {invoice.status === 'pago' ? 'Marcar Pendente' : 'Confirmar Pago'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Fatura/Pix */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-gray-250 flex flex-col items-center space-y-4">
            <div className="w-full flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-800 text-base">Cobrança via PIX</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600 font-semibold">✕</button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">Faturamento QAO</p>
              <h4 className="font-bold text-lg text-gray-900 mt-1">{selectedInvoice.client?.empresa}</h4>
              <p className="text-2xl font-black text-gray-950 mt-1">
                {selectedInvoice.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>

            {/* QR Code Mocked representation */}
            <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-xs flex flex-col items-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(selectedInvoice.pixCode || '')}`}
                alt="PIX QR Code"
                className="w-40 h-40"
              />
              <span className="text-[10px] text-gray-400 font-medium mt-2">Aponte a câmera do banco no QR Code</span>
            </div>

            {/* Pix Copia e Cola */}
            <div className="w-full space-y-1.5 text-left">
              <label className="block text-[10px] uppercase font-bold text-gray-400">PIX Copia e Cola</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={selectedInvoice.pixCode || ''}
                  className="flex-1 text-xs px-3 py-2 border rounded-xl bg-gray-50 text-gray-500 font-mono focus:outline-none overflow-hidden select-all"
                />
                <button
                  onClick={() => handleCopyPix(selectedInvoice.pixCode || '', selectedInvoice.id)}
                  className="p-2.5 bg-black hover:bg-neutral-850 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center min-w-[42px]"
                >
                  {copiedId === selectedInvoice.id ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedInvoice(null)}
              className="w-full py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Fechar Janela
            </button>
          </div>
        </div>
      )}

      {/* Modal Criar Fatura */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-250">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Nova Cobrança</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-semibold">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Selecionar Cliente *</label>
                <select
                  value={formData.clientId}
                  onChange={e => handleClientChangeInForm(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300 bg-white"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.empresa} ({c.nome})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Valor do Faturamento *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.valor}
                    onChange={e => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                    placeholder="Ex: 5000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Mês do Período *</label>
                  <input
                    type="month"
                    required
                    value={formData.periodo}
                    onChange={e => setFormData({ ...formData, periodo: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-sm border-gray-300"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={formData.vencimento}
                    onChange={e => setFormData({ ...formData, vencimento: e.target.value })}
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
                  Gerar Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
