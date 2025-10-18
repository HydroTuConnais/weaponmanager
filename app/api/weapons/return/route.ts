import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { triggerWeaponUpdate } from '@/lib/pusher-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { weaponId, ammunition } = body;

    // Get current weapon to log the user who returned it
    const currentWeapon = await prisma.weapon.findUnique({
      where: { id: weaponId },
    });

    // Update weapon status
    console.log('Returning weapon with ID:', weaponId, 'and ammunition:', ammunition);
    const weapon = await prisma.weapon.update({
      where: { id: weaponId },
      data: {
        assignedTo: {
          disconnect: true,
        },
        status: 'AVAILABLE',
        ...(ammunition !== undefined && { ammunition }),
      },
    });

    // Create log entry
    if (currentWeapon?.assignedToId) {
      await prisma.weaponLog.create({
        data: {
          weaponId,
          userId: currentWeapon.assignedToId,
          action: 'RETURNED',
          notes: `Weapon returned`,
        },
      });
    }

    // Trigger Pusher event pour mise à jour temps réel
    await triggerWeaponUpdate('WEAPON_UPDATED', { id: weapon.id });

    return NextResponse.json(weapon);
  } catch (error) {
    console.error('Error returning weapon:', error);
    return NextResponse.json({ error: 'Failed to return weapon' }, { status: 500 });
  }
}
