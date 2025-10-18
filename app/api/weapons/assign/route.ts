import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { triggerWeaponUpdate } from '@/lib/pusher-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { weaponId, userId } = body;

    // Update weapon status
    const weapon = await prisma.weapon.update({
      where: { id: weaponId },
      data: {
        assignedToId: userId,
        status: 'ASSIGNED',
      },
    });

    // Create log entry
    await prisma.weaponLog.create({
      data: {
        weaponId,
        userId,
        action: 'ASSIGNED',
        notes: `Weapon assigned to user`,
      },
    });

    // Trigger Pusher event pour mise à jour temps réel
    await triggerWeaponUpdate('WEAPON_UPDATED', { id: weapon.id });

    return NextResponse.json(weapon);
  } catch (error) {
    console.error('Error assigning weapon:', error);
    return NextResponse.json({ error: 'Failed to assign weapon' }, { status: 500 });
  }
}
