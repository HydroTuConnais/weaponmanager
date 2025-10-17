import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const userId = '6mxRgF3soWSmhrp5PGaUl4av7F8zCVTr';

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
