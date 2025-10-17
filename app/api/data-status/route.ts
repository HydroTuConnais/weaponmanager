import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get the most recent update timestamp for weapons
    const latestWeapon = await prisma.weapon.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    // Get the most recent update timestamp for weapon types
    const latestWeaponType = await prisma.weaponType.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    // Get the most recent update timestamp for users
    const latestUser = await prisma.user.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    return NextResponse.json({
      weapons: latestWeapon?.updatedAt?.getTime() || 0,
      weaponTypes: latestWeaponType?.updatedAt?.getTime() || 0,
      users: latestUser?.updatedAt?.getTime() || 0,
    });
  } catch (error) {
    console.error('Error fetching data status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data status' },
      { status: 500 }
    );
  }
}
