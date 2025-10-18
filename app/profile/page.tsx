'use client';

import { useSession } from '@/lib/auth-client';
import { useWeaponStore } from '@/lib/stores/weapon-store';
import { WeaponCard } from '@/components/weapon-card';
import { DndContext, DragEndEvent, DragOverlay, closestCenter, useDroppable, useDraggable } from '@dnd-kit/core';
import { useState, useMemo } from 'react';
import { User as UserIcon, RefreshCw } from 'lucide-react';
import { usePusher } from '@/lib/hooks/use-pusher';
import { PusherStatus } from '@/components/pusher-status';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWeapons, useAssignWeapon, useReturnWeapon } from '@/lib/hooks/use-queries';

export default function ProfilePage() {
  const { data: session, isPending } = useSession();

  // TanStack Query hooks
  const { data: weapons = [], refetch: refetchWeapons } = useWeapons();
  const assignWeaponMutation = useAssignWeapon();
  const returnWeaponMutation = useReturnWeapon();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAmmunitionDialog, setShowAmmunitionDialog] = useState(false);
  const [returningWeapon, setReturningWeapon] = useState<any>(null);
  const [ammunitionCount, setAmmunitionCount] = useState<number>(0);

  // Pusher real-time updates (uniquement si authentifié)
  usePusher({
    onWeaponsChange: refetchWeapons,
    isAuthenticated: !!session?.user,
  });

  // Compute my weapons and available weapons using useMemo to avoid infinite loops
  const myWeapons = useMemo(() => {
    if (!session?.user?.id) return [];
    return weapons.filter((w) => w.assignedTo?.id === session.user.id);
  }, [weapons, session?.user?.id]);

  const availableWeapons = useMemo(() => {
    return weapons.filter((w) => w.status === 'AVAILABLE');
  }, [weapons]);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !session?.user?.id) return;

    const weaponId = active.id as string;
    const weapon = weapons.find((w) => w.id === weaponId);

    if (!weapon) return;

    // If dropped on "my weapons" area and weapon is available
    if (over.id === 'my-weapons' && weapon.status === 'AVAILABLE') {
      await assignWeaponMutation.mutateAsync({
        weaponId,
        userId: session.user.id,
      });
    }

    // If dropped on "available weapons" area and weapon is assigned to user
    if (over.id === 'available-weapons' && weapon.assignedTo?.id === session.user.id) {
      // Show ammunition dialog before returning
      setReturningWeapon(weapon);
      setAmmunitionCount(weapon.ammunition || 0);
      setShowAmmunitionDialog(true);
    }
  };

  const handleConfirmReturn = async () => {
    if (!returningWeapon || !session?.user?.id) return;

    await returnWeaponMutation.mutateAsync({
      weaponId: returningWeapon.id,
      userId: session.user.id,
    });
    setShowAmmunitionDialog(false);
    setReturningWeapon(null);
  };

  const activeWeapon = activeId ? weapons.find((w) => w.id === activeId) : null;

  // Afficher un loader pendant le chargement de la session
  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-lg text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  // Rediriger si pas connecté (après chargement)
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Veuillez vous connecter pour accéder à votre profil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PusherStatus />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <UserIcon size={32} className="text-gray-600" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{session.user.name || 'User'}</h1>
                <p className="text-gray-600">{session.user.email}</p>
                <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                  {(session.user as any).role || 'USER'}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchWeapons()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DroppableZone
              id="my-weapons"
              title="Mes Armes"
              showDropHint={activeId !== null && availableWeapons.some(w => w.id === activeId)}
            >
              {myWeapons.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Glissez une arme ici pour la prendre
                </p>
              ) : (
                myWeapons.map((weapon) => (
                  <DraggableWeapon key={weapon.id} weapon={weapon} />
                ))
              )}
            </DroppableZone>

            <DroppableZone
              id="available-weapons"
              title="Armes Disponibles"
              showDropHint={activeId !== null && myWeapons.some(w => w.id === activeId)}
            >
              {availableWeapons.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune arme disponible</p>
              ) : (
                availableWeapons.map((weapon) => (
                  <DraggableWeapon key={weapon.id} weapon={weapon} />
                ))
              )}
            </DroppableZone>
          </div>

          <DragOverlay>
            {activeWeapon ? <WeaponCard weapon={activeWeapon} /> : null}
          </DragOverlay>
        </DndContext>

        {/* Ammunition Dialog */}
        <Dialog open={showAmmunitionDialog} onOpenChange={setShowAmmunitionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Retour d'arme</DialogTitle>
              <DialogDescription>
                Le nombre de balles dans le chargeur a-t-il changé ?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="ammunition">Nombre de balles</Label>
              <Input
                id="ammunition"
                type="number"
                min="0"
                value={ammunitionCount}
                onChange={(e) => setAmmunitionCount(parseInt(e.target.value) || 0)}
                className="mt-2"
                placeholder="0"
              />
              {returningWeapon && (
                <p className="text-sm text-muted-foreground mt-2">
                  Arme: {returningWeapon.name} (Numéro de Série: {returningWeapon.serialNumber})
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAmmunitionDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleConfirmReturn}>Confirmer le retour</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Composant pour les zones droppables
function DroppableZone({
  id,
  title,
  children,
  showDropHint
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  showDropHint?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div
        ref={setNodeRef}
        className={`min-h-[400px] border-4 border-dashed rounded-lg p-4 transition-all relative ${
          id === 'my-weapons'
            ? isOver
              ? 'bg-blue-100 border-blue-500 scale-[1.02] shadow-lg'
              : 'bg-blue-50 border-blue-300'
            : isOver
            ? 'bg-green-100 border-green-500 scale-[1.02] shadow-lg'
            : 'bg-green-50 border-green-300'
        }`}
      >
        <div className={`space-y-2 transition-all ${showDropHint ? 'blur-sm' : ''}`}>
          {children}
        </div>

        {/* Overlay avec texte quand on drag */}
        {showDropHint && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-primary text-primary-foreground px-6 py-4 rounded-lg shadow-2xl text-xl font-bold animate-pulse">
              Glissez ici
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour les armes draggables
function DraggableWeapon({ weapon }: { weapon: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: weapon.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <WeaponCard weapon={weapon} />
    </div>
  );
}
