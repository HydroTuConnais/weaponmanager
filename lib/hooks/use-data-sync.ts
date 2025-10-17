import { useEffect, useRef, useState } from 'react';

interface DataStatus {
  weapons: number;
  weaponTypes: number;
  users: number;
}

interface UseDataSyncOptions {
  onWeaponsChange?: () => void;
  onWeaponTypesChange?: () => void;
  onUsersChange?: () => void;
  pollingInterval?: number; // in milliseconds
  enabled?: boolean;
}

/**
 * Hook personnalisé pour synchroniser les données en temps réel via polling optimisé
 * Vérifie les timestamps de modification et déclenche des callbacks uniquement si les données ont changé
 */
export function useDataSync(options: UseDataSyncOptions = {}) {
  const {
    onWeaponsChange,
    onWeaponTypesChange,
    onUsersChange,
    pollingInterval = 3000, // 3 secondes par défaut
    enabled = true,
  } = options;

  const lastStatusRef = useRef<DataStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const checkForUpdates = async () => {
      try {
        setIsChecking(true);
        const response = await fetch('/api/data-status');
        const currentStatus: DataStatus = await response.json();

        // Si c'est la première vérification, on stocke juste les timestamps
        if (!lastStatusRef.current) {
          lastStatusRef.current = currentStatus;
          setIsChecking(false);
          return;
        }

        // Vérifier si les weapons ont changé
        if (
          currentStatus.weapons !== lastStatusRef.current.weapons &&
          onWeaponsChange
        ) {
          console.log('[DataSync] Weapons updated, refreshing...');
          onWeaponsChange();
        }

        // Vérifier si les weaponTypes ont changé
        if (
          currentStatus.weaponTypes !== lastStatusRef.current.weaponTypes &&
          onWeaponTypesChange
        ) {
          console.log('[DataSync] Weapon types updated, refreshing...');
          onWeaponTypesChange();
        }

        // Vérifier si les users ont changé
        if (
          currentStatus.users !== lastStatusRef.current.users &&
          onUsersChange
        ) {
          console.log('[DataSync] Users updated, refreshing...');
          onUsersChange();
        }

        // Mettre à jour les derniers timestamps
        lastStatusRef.current = currentStatus;
      } catch (error) {
        console.error('[DataSync] Error checking for updates:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Vérification initiale
    checkForUpdates();

    // Configurer le polling
    const interval = setInterval(checkForUpdates, pollingInterval);

    return () => {
      clearInterval(interval);
    };
  }, [
    enabled,
    pollingInterval,
    onWeaponsChange,
    onWeaponTypesChange,
    onUsersChange,
  ]);

  return { isChecking };
}
