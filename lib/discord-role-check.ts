/**
 * Vérifie si un utilisateur Discord a un rôle spécifique sur un serveur
 */
export async function checkDiscordRole(
  discordUserId: string,
  guildId: string,
  requiredRoleId: string,
  botToken: string
): Promise<boolean> {
  try {
    // Récupérer les informations du membre sur le serveur
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[Discord] Failed to fetch member:', response.status, response.statusText);
      return false;
    }

    const member = await response.json();

    // Vérifier si l'utilisateur a le rôle requis
    const hasRole = member.roles?.includes(requiredRoleId);

    console.log('[Discord] Role check:', {
      userId: discordUserId,
      hasRole,
      userRoles: member.roles,
      requiredRole: requiredRoleId,
    });

    return hasRole;
  } catch (error) {
    console.error('[Discord] Error checking role:', error);
    return false;
  }
}

/**
 * Récupère l'ID Discord d'un utilisateur à partir de son token d'accès OAuth
 */
export async function getDiscordUserId(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('[Discord] Failed to fetch user:', response.status);
      return null;
    }

    const user = await response.json();
    return user.id;
  } catch (error) {
    console.error('[Discord] Error fetching user:', error);
    return null;
  }
}
