import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { triggerWeaponUpdate } from '@/lib/pusher-server';

// PATCH /api/weapons/[id] - Update weapon
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
    const { serialNumber, name, type, description, status, ammunition } = body;

    // Get current weapon state to check if it was assigned
    const currentWeapon = await prisma.weapon.findUnique({
      where: { id: id },
      include: {
        assignedTo: true,
      },
    });

    // If status is changing to AVAILABLE, unassign the weapon
    const shouldUnassign = status === 'AVAILABLE' && currentWeapon?.assignedToId;

    const weapon = await prisma.weapon.update({
      where: { id: id },
      data: {
        ...(serialNumber && { serialNumber }),
        ...(name && { name }),
        ...(type && { weaponTypeId: type }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(ammunition !== undefined && { ammunition }),
        // Unassign if status is AVAILABLE
        ...(shouldUnassign && {
          assignedTo: {
            disconnect: true,
          },
        }),
      },
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

    // Create appropriate log
    if (shouldUnassign) {
      await prisma.weaponLog.create({
        data: {
          weaponId: weapon.id,
          userId: session.user.id,
          action: 'RETURNED',
          notes: `Arme retournée et remise dans le stock (par ${currentWeapon.assignedTo?.name || currentWeapon.assignedTo?.email})`,
        },
      });
    } else {
      await prisma.weaponLog.create({
        data: {
          weaponId: weapon.id,
          userId: session.user.id,
          action: 'UPDATED',
          notes: `Arme mise à jour${status ? ` - Statut: ${status}` : ''}`,
        },
      });
    }

    // Trigger Pusher event pour mise à jour temps réel
    await triggerWeaponUpdate('WEAPON_UPDATED', { id: weapon.id });

    return NextResponse.json(weapon);
  } catch (error) {
    console.error('Error updating weapon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/weapons/[id] - Delete weapon
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

    const weapon = await prisma.weapon.findUnique({
      where: { id: id },
    });

    if (!weapon) {
      return NextResponse.json({ error: 'Weapon not found' }, { status: 404 });
    }

    // Create log before deletion
    await prisma.weaponLog.create({
      data: {
        weaponId: weapon.id,
        userId: session.user.id,
        action: 'DELETED',
        notes: `Arme supprimée: ${weapon.name} (S/N: ${weapon.serialNumber})`,
      },
    });

    // Delete weapon (logs will be cascade deleted)
    await prisma.weapon.delete({
      where: { id: id },
    });

    // Trigger Pusher event pour mise à jour temps réel
    await triggerWeaponUpdate('WEAPON_DELETED', { id: weapon.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting weapon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
