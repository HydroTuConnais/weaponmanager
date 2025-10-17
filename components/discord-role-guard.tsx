'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function DiscordRoleGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyDiscordRole = async () => {
      if (!session?.user?.id || isVerified || isVerifying) {
        return;
      }

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
      } finally {
        setIsVerifying(false);
      }
    };

    verifyDiscordRole();
  }, [session, isVerified, isVerifying, router]);

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
