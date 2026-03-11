const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Configuro a senha padrão qao12345 (que passará por hash do bcrypt)
  const email = 'contato@qao.com.br';
  const plainPassword = 'qao' + new Date().getFullYear(); // qao2026 or something, let's just do qao12345
  const password = await bcrypt.hash('qao12345', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password },
    create: {
      email,
      password,
    },
  });

  console.log(`\n================================`);
  console.log(`✅ [Seed] Banco SQLite Pronto!`);
  console.log(`👤 Usuário Admin: ${user.email}`);
  console.log(`🔑 Senha padrão: qao12345`);
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
