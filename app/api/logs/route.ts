import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weaponId = searchParams.get('weaponId');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (weaponId) where.weaponId = weaponId;
    if (userId) where.userId = userId;

    const logs = await prisma.weaponLog.findMany({
      where,
      include: {
        weapon: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
