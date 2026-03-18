const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateAdmin() {
  try {
    const email = 'diogoasoaresads@gmail.com';
    const plainPassword = '06112005';
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    // Buscamos se já tem algum usuário para sobrescrever (o demo "contato@qao.com.br")
    const existingUsers = await prisma.user.findMany();
    
    if (existingUsers.length > 0) {
        const user = existingUsers[0];
        console.log(`[Script Admin] Atualizando usuario ID ${user.id}...`);
        
        await prisma.user.update({
            where: { id: user.id },
            data: { email, password: hashedPassword }
        });
        console.log(`[Sucesso] Email alterado para: ${email} e senha atualizada.`);
    } else {
        console.log(`[Script Admin] Nenhum usuario base encontrado. Criando novo...`);
        await prisma.user.create({
            data: { email, password: hashedPassword }
        });
        console.log(`[Sucesso] Usuario admin Criado: ${email}.`);
    }
  } catch (err) {
    console.error("Erro ao rodar seed admin:", err);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();
