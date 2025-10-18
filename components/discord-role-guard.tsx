'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function DiscordRoleGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const hasCheckedRef = useRef(false); // Pour vérifier UNE SEULE FOIS
  const router = useRouter();

  useEffect(() => {
    const verifyDiscordRole = async () => {
      // Ne vérifier qu'une seule fois par session
      if (!session?.user?.id || isVerified || isVerifying || hasCheckedRef.current) {
        return;
      }

      hasCheckedRef.current = true;
      setIsVerifying(true);

      try {
        const response = await fetch('/api/verify-discord-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id }),
        });

        const data = await response.json();

        if (!data.hasRole) {
          // Rediriger vers la page de connexion avec un message d'erreur
          alert(
            data.message ||
              "Vous n'avez pas le rôle requis sur le serveur Discord pour accéder à cette application."
          );
          router.push('/');
          return;
        }

        setIsVerified(true);
      } catch (error) {
        console.error('[Discord Role Guard] Error verifying role:', error);
        // En cas d'erreur, on autorise quand même (pour éviter de bloquer l'utilisateur)
        setIsVerified(true);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyDiscordRole();
  }, [session?.user?.id]); // Dépendances réduites pour éviter les re-renders

  if (isVerifying) {
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
