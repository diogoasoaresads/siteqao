const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpeza do banco de dados...');
  try {
    // Ordem correta de deleção para evitar violação de FKs
    await prisma.invoice.deleteMany();
    console.log('✅ Invoices deletados.');
    
    await prisma.clientMetric.deleteMany();
    console.log('✅ ClientMetrics deletados.');
    
    await prisma.growthTask.deleteMany();
    console.log('✅ GrowthTasks deletados.');
    
    await prisma.growthExperiment.deleteMany();
    console.log('✅ GrowthExperiments deletados.');
    
    await prisma.client.deleteMany();
    console.log('✅ Clients deletados.');
    
    await prisma.lead.deleteMany();
    console.log('✅ Leads deletados.');
    
    await prisma.systemLog.deleteMany();
    console.log('✅ SystemLogs deletados.');
    
    await prisma.siteSettings.deleteMany();
    await prisma.siteSettings.create({ data: {} });
    console.log('✅ SiteSettings reiniciado.');
    
    await prisma.whatsappSettings.deleteMany();
    await prisma.whatsappSettings.create({ data: {} });
    console.log('✅ WhatsappSettings reiniciado.');

    console.log('✨ Banco de dados limpo com sucesso!');
  } catch (err) {
    console.error('❌ Erro durante a limpeza:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
