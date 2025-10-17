import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkDiscordRole } from '@/lib/discord-role-check';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Récupérer le compte Discord de l'utilisateur
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        providerId: 'discord',
      },
    });

    if (!account || !account.accountId) {
      return NextResponse.json(
        { error: 'No Discord account found', hasRole: false },
        { status: 404 }
      );
    }

    const discordUserId = account.accountId;
    const guildId = process.env.DISCORD_GUILD_ID;
    const requiredRoleId = process.env.DISCORD_REQUIRED_ROLE_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;

    // Si pas configuré, autoriser par défaut
    if (!guildId || !requiredRoleId || !botToken) {
      console.warn('[Discord Role Check] Not configured, allowing by default');
      return NextResponse.json({ hasRole: true });
    }

    // Vérifier le rôle
    const hasRequiredRole = await checkDiscordRole(
      discordUserId,
      guildId,
      requiredRoleId,
      botToken
    );

    if (!hasRequiredRole) {
      // Supprimer l'utilisateur si pas le bon rôle
      await prisma.session.deleteMany({
        where: { userId },
      });

      await prisma.account.deleteMany({
        where: { userId },
      });

      await prisma.user.delete({
        where: { id: userId },
      });

      return NextResponse.json(
        {
          hasRole: false,
          message: "Vous n'avez pas le rôle requis sur le serveur Discord.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ hasRole: true });
  } catch (error) {
    console.error('[Discord Role Check] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', hasRole: false },
      { status: 500 }
    );
  }
}
