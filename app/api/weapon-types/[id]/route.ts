import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// PATCH /api/weapon-types/[id] - Update weapon type
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, image, category } = body;

    const weaponType = await prisma.weaponType.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(image !== undefined && { image: image || '' }),
        ...(category !== undefined && { category }),
      },
    });

    return NextResponse.json(weaponType);
  } catch (error) {
    console.error('Error updating weapon type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/weapon-types/[id] - Delete weapon type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if any weapons use this type
    const weaponsCount = await prisma.weapon.count({
      where: { weaponTypeId: id },
    });

    if (weaponsCount > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer: ${weaponsCount} arme(s) utilisent ce type` },
        { status: 400 }
      );
    }

    await prisma.weaponType.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting weapon type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
