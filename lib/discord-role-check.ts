/**
 * Vérifie si un utilisateur Discord a un rôle spécifique sur un serveur
 * Utilise le token OAuth de l'utilisateur au lieu d'un bot
 */
export async function checkDiscordRole(
  accessToken: string,
  guildId: string,
  requiredRoleId: string
): Promise<boolean> {
  try {
    // Récupérer les serveurs de l'utilisateur avec ses rôles
    const response = await fetch(
      `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[Discord] Failed to fetch guild member:', response.status, response.statusText);
      return false;
    }

    const member = await response.json();

    // Vérifier si l'utilisateur a le rôle requis
    const hasRole = member.roles?.includes(requiredRoleId);

    console.log('[Discord] Role check:', {
      hasRole,
      userRoles: member.roles,
      requiredRole: requiredRoleId,
      guildId,
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
