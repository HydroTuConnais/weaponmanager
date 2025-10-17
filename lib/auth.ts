import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { checkDiscordRole, getDiscordUserId } from "./discord-role-check";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      enabled: true,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET as string,
  baseURL: process.env.BETTER_AUTH_URL as string,
  trustedOrigins: ["*"],

  // Hook pour vérifier le rôle Discord lors de la connexion
  hooks: {
    after: [
      {
        matcher(context) {
          return context.path === "/sign-in/social" || context.path === "/callback/discord";
        },
        async handler(ctx) {
          // Vérifier si c'est une authentification Discord
          if (ctx.body?.provider !== "discord" && !ctx.query?.state) {
            return;
          }

          // Récupérer l'utilisateur qui vient de se connecter
          const session = ctx.context?.session;
          if (!session?.user?.id) {
            console.log("[Auth Hook] No session found, skipping role check");
            return;
          }

          // Récupérer le compte Discord de l'utilisateur
          const account = await prisma.account.findFirst({
            where: {
              userId: session.user.id,
              providerId: "discord",
            },
          });

          if (!account || !account.accountId) {
            console.log("[Auth Hook] No Discord account found");
            throw new Error("Aucun compte Discord trouvé");
          }

          const discordUserId = account.accountId;
          const guildId = process.env.DISCORD_GUILD_ID;
          const requiredRoleId = process.env.DISCORD_REQUIRED_ROLE_ID;
          const botToken = process.env.DISCORD_BOT_TOKEN;

          // Vérifier que les variables d'environnement sont définies
          if (!guildId || !requiredRoleId || !botToken) {
            console.warn("[Auth Hook] Discord role verification is not configured");
            return; // Ne pas bloquer si pas configuré
          }

          // Vérifier si l'utilisateur a le rôle requis
          const hasRequiredRole = await checkDiscordRole(
            discordUserId,
            guildId,
            requiredRoleId,
            botToken
          );

          if (!hasRequiredRole) {
            console.log("[Auth Hook] User does not have required role, deleting account");

            // Supprimer la session et l'utilisateur
            await prisma.session.deleteMany({
              where: { userId: session.user.id },
            });

            await prisma.account.deleteMany({
              where: { userId: session.user.id },
            });

            await prisma.user.delete({
              where: { id: session.user.id },
            });

            throw new Error(
              "Vous n'avez pas le rôle requis sur le serveur Discord pour accéder à cette application."
            );
          }

          console.log("[Auth Hook] User has required role, access granted");
        },
      },
    ],
  },
});
