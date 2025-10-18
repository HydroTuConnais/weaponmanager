'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDiscordRoleCheck } from '@/lib/hooks/use-queries';

export function DiscordRoleGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const hasCheckedRef = useRef(false);

  // TanStack Query hook - ne s'exécute que si userId est défini
  const { data, isLoading, isError } = useDiscordRoleCheck(session?.user?.id || '');

  useEffect(() => {
    // Vérifier une seule fois
    if (!session?.user?.id || hasCheckedRef.current || isLoading) {
      return;
    }

    if (data && !data.hasRole && !hasCheckedRef.current) {
      hasCheckedRef.current = true;

      // Si le token a expiré, message différent
      if (data.tokenExpired) {
        alert(data.message || "Votre session a expiré. Veuillez vous reconnecter.");
        window.location.href = '/api/auth/signin/discord';
      } else {
        // L'utilisateur n'a vraiment pas le rôle
        alert(
          data.message ||
            "Vous n'avez pas le rôle requis sur le serveur Discord pour accéder à cette application."
        );
        router.push('/');
      }
    } else if (data?.hasRole) {
      hasCheckedRef.current = true;
    }
  }, [data, session?.user?.id, router, isLoading]);

  // En cas d'erreur, on autorise quand même pour ne pas bloquer l'utilisateur
  if (isLoading && session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Vérification de vos permissions Discord...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
