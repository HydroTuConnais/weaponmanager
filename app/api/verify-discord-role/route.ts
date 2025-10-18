import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkDiscordRole } from '@/lib/discord-role-check';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Récupérer le compte Discord de l'utilisateur avec son token
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        providerId: 'discord',
      },
    });

    if (!account || !account.accessToken) {
      return NextResponse.json(
        { error: 'No Discord account or access token found', hasRole: false },
        { status: 404 }
      );
    }

    const guildId = process.env.DISCORD_GUILD_ID;
    const requiredRoleId = process.env.DISCORD_REQUIRED_ROLE_ID;

    // Si pas configuré, autoriser par défaut (mode développement)
    if (!guildId || !requiredRoleId) {
      console.warn('[Discord Role Check] Not configured, allowing by default');
      return NextResponse.json({ hasRole: true });
    }

    // Vérifier le rôle avec le token OAuth de l'utilisateur
    const roleCheck = await checkDiscordRole(
      account.accessToken,
      guildId,
      requiredRoleId
    );

    // Si le token a expiré, on déconnecte l'utilisateur SANS le supprimer
    // Il pourra se reconnecter et son compte sera réutilisé
    if (roleCheck.tokenExpired) {
      console.log('[Discord Role Check] Token expired, logging out user without deletion');

      // Supprimer uniquement les sessions (déconnexion)
      await prisma.session.deleteMany({
        where: { userId },
      });

      return NextResponse.json(
        {
          hasRole: false,
          tokenExpired: true,
          message: "Votre session a expiré. Veuillez vous reconnecter.",
        },
        { status: 401 } // 401 Unauthorized au lieu de 403 Forbidden
      );
    }

    // Si l'utilisateur n'a vraiment pas le rôle (et token valide), on supprime tout
    if (!roleCheck.hasRole) {
      console.log('[Discord Role Check] User does not have required role, deleting account');

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

    // Récupérer les infos du membre sur le serveur (nickname)
    try {
      const memberResponse = await fetch(
        `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
        }
      );

      if (memberResponse.ok) {
        const memberData = await memberResponse.json();
        // Le nickname du serveur (ou username si pas de nickname)
        const serverNickname = memberData.nick || memberData.user?.username;

        if (serverNickname) {
          // Mettre à jour le nom de l'utilisateur avec le pseudonyme Discord du serveur
          await prisma.user.update({
            where: { id: userId },
            data: { name: serverNickname },
          });
        }
      }
    } catch (error) {
      console.error('[Discord Role Check] Error fetching member info:', error);
      // Continue même si on ne peut pas récupérer le nickname
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
