const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db';
}
const prisma = new PrismaClient();

async function main() {
  const email = 'diogoasoaresads@gmail.com';
  const plainPassword = '06112005';
  const password = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password },
    create: {
      email,
      password,
    },
  });

  // Seeding dados demo para a Assessoria de Growth (se não existirem clientes)
  const clientCount = await prisma.client.count();
  if (clientCount === 0) {
    console.log(`[Seed] Populando dados demo para assessoria de growth...`);

    // 1. Clientes
    const saasBooster = await prisma.client.create({
      data: {
        nome: 'Gabriel Medeiros',
        empresa: 'SaaS Booster Inc',
        email: 'gabriel@saasbooster.co',
        telefone: '(11) 98888-7777',
        status: 'ativo',
        valorMensal: 6000,
        budgetAds: 15000
      }
    });

    const calcadosDrop = await prisma.client.create({
      data: {
        nome: 'Aline Schmidt',
        empresa: 'Calçados Drop',
        email: 'contato@calcadosdrop.com.br',
        telefone: '(21) 97777-6666',
        status: 'ativo',
        valorMensal: 4500,
        budgetAds: 8000
      }
    });

    const fintechFacil = await prisma.client.create({
      data: {
        nome: 'Marcos Pimenta',
        empresa: 'Fintech Fácil',
        email: 'm.pimenta@fintechfacil.com',
        telefone: '(11) 96666-5555',
        status: 'ativo',
        valorMensal: 9000,
        budgetAds: 30000
      }
    });

    // 2. Leads para testar
    await prisma.lead.createMany({
      data: [
        { nome: 'Carlos Mendes', empresa: 'Lojas Sul', telefone: '(51) 95555-4444', email: 'carlos@lojassul.com.br', status: 'qualificado', mensagem: 'Gostaria de rodar campanhas de tráfego pago.' },
        { nome: 'Fernanda Lima', empresa: 'Curso Pro', telefone: '(11) 94444-3333', email: 'fernanda@cursopro.com', status: 'fechado', mensagem: 'Contrato acordado. Pronto para conversão em cliente.' },
        { nome: 'Roberto Souza', empresa: 'App Delivery', telefone: '(31) 93333-2222', email: 'roberto@appdelivery.com', status: 'novo', mensagem: 'Preciso de ajuda com retenção de usuários.' }
      ]
    });

    // 3. Experimentos de Growth (ICE)
    const exp1 = await prisma.growthExperiment.create({
      data: {
        title: 'Formulário de LP Simplificado',
        description: 'Remoção de campos adicionais como faturamento e desafio para reduzir a fricção e aumentar a taxa de conversão.',
        status: 'em_teste',
        impact: 8,
        confidence: 7,
        ease: 9,
        hypothesis: 'Se reduzirmos o formulário para apenas Nome e WhatsApp, as conversões subirão em pelo menos 15%.',
        metricToTrack: 'Taxa de Conversão (%)',
        clientId: saasBooster.id
      }
    });

    const exp2 = await prisma.growthExperiment.create({
      data: {
        title: 'Cupom Exit-Intent via Pop-up',
        description: 'Oferecer cupom de 10% de desconto no frete quando o cursor sair da janela do navegador.',
        status: 'concluido',
        impact: 7,
        confidence: 8,
        ease: 9,
        hypothesis: 'Se capturarmos a intenção de saída do usuário com desconto, reteremos 5% das vendas perdidas.',
        metricToTrack: 'Conversão em Vendas',
        results: 'Conversão geral aumentou de 1.8% para 2.6%. Faturamento cresceu R$ 12.400,00 no mês.',
        learnings: 'Visitantes de tráfego frio são altamente sensíveis a cupom imediato.',
        clientId: calcadosDrop.id
      }
    });

    await prisma.growthExperiment.create({
      data: {
        title: 'LinkedIn Retargeting Ads',
        description: 'Exibir anúncios de depoimentos de clientes para quem visitou a página de pricing e não comprou.',
        status: 'backlog',
        impact: 6,
        confidence: 6,
        ease: 5,
        hypothesis: 'Anúncios de prova social no LinkedIn vão acelerar o ciclo de fechamento comercial.',
        metricToTrack: 'SQLs Gerados',
        clientId: fintechFacil.id
      }
    });

    // 4. Kanban de Tarefas
    await prisma.growthTask.createMany({
      data: [
        { title: 'Desenvolver Nova LP Simplificada', description: 'Programar a nova LP no Next.js com formulário reduzido.', status: 'em_andamento', priority: 'alta', responsible: 'Diogo', clientId: saasBooster.id, experimentId: exp1.id },
        { title: 'Instalar Tags de Conversão na LP', description: 'Configurar GTM, Meta Pixel e GA4.', status: 'a_fazer', priority: 'media', responsible: 'Pedro', clientId: saasBooster.id, experimentId: exp1.id },
        { title: 'Configurar script de Exit-Intent', description: 'Inserir trigger de mouseout no carrinho.', status: 'concluido', priority: 'alta', responsible: 'Ana', clientId: calcadosDrop.id, experimentId: exp2.id },
        { title: 'Subir criativos no Facebook Ads', description: 'Criar campanha de conversão para o pop-up.', status: 'concluido', priority: 'media', responsible: 'João', clientId: calcadosDrop.id, experimentId: exp2.id }
      ]
    });

    // 5. Métricas de Performance Históricas (SaaS Booster)
    await prisma.clientMetric.createMany({
      data: [
        { clientId: saasBooster.id, periodo: '2026-01', faturamento: 18000, investimentoAds: 5000, leadsGerados: 120, cac: 250, ltv: 1200, roi: 3.6, taxaConversao: 2.1 },
        { clientId: saasBooster.id, periodo: '2026-02', faturamento: 24000, investimentoAds: 6500, leadsGerados: 160, cac: 220, ltv: 1300, roi: 3.7, taxaConversao: 2.5 },
        { clientId: saasBooster.id, periodo: '2026-03', faturamento: 31000, investimentoAds: 8000, leadsGerados: 210, cac: 195, ltv: 1400, roi: 3.9, taxaConversao: 2.8 },
        { clientId: saasBooster.id, periodo: '2026-04', faturamento: 39000, investimentoAds: 10000, leadsGerados: 280, cac: 180, ltv: 1500, roi: 3.9, taxaConversao: 3.2 },
        { clientId: saasBooster.id, periodo: '2026-05', faturamento: 48000, investimentoAds: 12000, leadsGerados: 360, cac: 165, ltv: 1600, roi: 4.0, taxaConversao: 3.5 }
      ]
    });

    // Métricas de Performance Históricas (Calçados Drop)
    await prisma.clientMetric.createMany({
      data: [
        { clientId: calcadosDrop.id, periodo: '2026-01', faturamento: 12000, investimentoAds: 3000, leadsGerados: 400, cac: 45, ltv: 250, roi: 4.0, taxaConversao: 1.5 },
        { clientId: calcadosDrop.id, periodo: '2026-02', faturamento: 15000, investimentoAds: 4000, leadsGerados: 520, cac: 42, ltv: 260, roi: 3.7, taxaConversao: 1.8 },
        { clientId: calcadosDrop.id, periodo: '2026-03', faturamento: 19000, investimentoAds: 5000, leadsGerados: 680, cac: 39, ltv: 280, roi: 3.8, taxaConversao: 2.0 },
        { clientId: calcadosDrop.id, periodo: '2026-04', faturamento: 25000, investimentoAds: 6500, leadsGerados: 850, cac: 35, ltv: 290, roi: 3.8, taxaConversao: 2.4 },
        { clientId: calcadosDrop.id, periodo: '2026-05', faturamento: 32000, investimentoAds: 8000, leadsGerados: 1100, cac: 32, ltv: 310, roi: 4.0, taxaConversao: 2.7 }
      ]
    });

    // 6. Faturas/Cobranças
    const inv1 = await prisma.invoice.create({
      data: {
        clientId: saasBooster.id,
        valor: 6000,
        periodo: '2026-05',
        vencimento: new Date('2026-05-10'),
        status: 'pago',
        nfeStatus: 'emitida',
        nfeNumero: '2026498321',
        nfeUrl: 'https://www.nfe.fazenda.gov.br/portal/consultaRecipiente.aspx?nfe=2026498321'
      }
    });

    await prisma.invoice.update({
      where: { id: inv1.id },
      data: { pixCode: `00020101021226870014br.gov.bcb.pix2565pix.qao.com.br/cobranca/${inv1.id.replace(/-/g, '')}52040000530398654076000.005802BR5912QAO_GROWTH6009SAO_PAULO62070503***6304` }
    });

    const inv2 = await prisma.invoice.create({
      data: {
        clientId: saasBooster.id,
        valor: 6000,
        periodo: '2026-06',
        vencimento: new Date('2026-06-15'),
        status: 'pendente'
      }
    });

    await prisma.invoice.update({
      where: { id: inv2.id },
      data: { pixCode: `00020101021226870014br.gov.bcb.pix2565pix.qao.com.br/cobranca/${inv2.id.replace(/-/g, '')}52040000530398654076000.005802BR5912QAO_GROWTH6009SAO_PAULO62070503***6304` }
    });

    const inv3 = await prisma.invoice.create({
      data: {
        clientId: calcadosDrop.id,
        valor: 4500,
        periodo: '2026-06',
        vencimento: new Date('2026-06-12'),
        status: 'pendente'
      }
    });

    await prisma.invoice.update({
      where: { id: inv3.id },
      data: { pixCode: `00020101021226870014br.gov.bcb.pix2565pix.qao.com.br/cobranca/${inv3.id.replace(/-/g, '')}52040000530398654074500.005802BR5912QAO_GROWTH6009SAO_PAULO62070503***6304` }
    });
  }

  console.log(`\n================================`);
  console.log(`✅ [Seed] Banco SQLite Pronto!`);
  console.log(`👤 Usuário Admin: ${user.email}`);
  console.log(`🔑 Senha padrão: ${plainPassword}`);
  console.log(`================================\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
