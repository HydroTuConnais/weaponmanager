import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const userId = 'NDGK2PfkuwhGsuvN9bigOV8ci3sRxD5c';

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
    });

    console.log('✅ User updated successfully!');
    console.log('User:', user.name || user.email);
    console.log('Role:', user.role);
  } catch (error) {
    console.error('❌ Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
