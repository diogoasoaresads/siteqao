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
