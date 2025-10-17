'use client';

import { useSession, signIn } from '@/lib/auth-client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si l'utilisateur est connecté, rediriger vers /profile
    if (session?.user) {
      router.push('/profile');
    }
  }, [session, router]);

  // Si connecté, on affiche rien (car redirection en cours)
  if (session?.user) {
    return null;
  }

  // Si pas connecté, afficher le bouton de connexion
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-card border shadow-sm">
            <Shield className="w-12 h-12" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Gestion d'Armes</h1>
          <p className="text-sm text-muted-foreground">Connectez-vous pour continuer</p>
        </div>
        <Button
          onClick={() => signIn.social({ provider: 'discord' })}
          size="lg"
          className="shadow-sm"
        >
          <LogIn className="mr-2 h-5 w-5" />
          Se connecter avec Discord
        </Button>
      </div>
    </main>
  );
}
