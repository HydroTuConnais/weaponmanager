import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { triggerWeaponUpdate } from '@/lib/pusher-server';

export async function GET() {
  try {
    const weapons = await prisma.weapon.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        weaponType: true,
      },
    });
    return NextResponse.json(weapons);
  } catch (error) {
    console.error('Error fetching weapons:', error);
    return NextResponse.json({ error: 'Failed to fetch weapons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serialNumber, name, type, description, ammunition } = body;

    const weapon = await prisma.weapon.create({
      data: {
        serialNumber,
        name,
        weaponTypeId: type,
        description,
        status: 'AVAILABLE',
        ammunition: ammunition || 0,
      },
      include: {
        weaponType: true,
      },
    });

    // Create log entry
    await prisma.weaponLog.create({
      data: {
        weaponId: weapon.id,
        userId: body.userId || 'system',
        action: 'CREATED',
        notes: `Weapon ${name} created`,
      },
    });

    // Trigger Pusher event pour mise à jour temps réel
    await triggerWeaponUpdate('WEAPON_CREATED', { id: weapon.id });

    return NextResponse.json(weapon);
  } catch (error) {
    console.error('Error creating weapon:', error);
    return NextResponse.json({ error: 'Failed to create weapon' }, { status: 500 });
  }
}
