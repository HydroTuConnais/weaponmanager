import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET /api/weapon-types - Get all weapon types
export async function GET() {
  try {
    const weaponTypes = await prisma.weaponType.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(weaponTypes);
  } catch (error) {
    console.error('Error fetching weapon types:', error);
    return NextResponse.json({ error: 'Failed to fetch weapon types' }, { status: 500 });
  }
}

// POST /api/weapon-types - Create new weapon type (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, image, category } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const weaponType = await prisma.weaponType.create({
      data: {
        name,
        image: image || '',
        category,
      },
    });

    return NextResponse.json(weaponType);
  } catch (error) {
    console.error('Error creating weapon type:', error);
    return NextResponse.json({ error: 'Failed to create weapon type' }, { status: 500 });
  }
}
