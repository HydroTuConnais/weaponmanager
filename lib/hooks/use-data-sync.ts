import { useCallback, useEffect, useRef, useState } from 'react';

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
    pollingInterval = 15000, // 15 secondes par défaut
    enabled = true,
  } = options;

  const lastStatusRef = useRef<DataStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const isCheckingRef = useRef(false);
  const [isVisible, setIsVisible] = useState(true);

  // Envelopper les callbacks dans useCallback pour éviter les recréations
  const memoizedOnWeaponsChange = useCallback(
    onWeaponsChange || (() => {}),
    [onWeaponsChange]
  );
  const memoizedOnWeaponTypesChange = useCallback(
    onWeaponTypesChange || (() => {}),
    [onWeaponTypesChange]
  );
  const memoizedOnUsersChange = useCallback(
    onUsersChange || (() => {}),
    [onUsersChange]
  );

  // Détecter si l'onglet est visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !isVisible) return;

    const checkForUpdates = async () => {
      // Éviter les appels multiples simultanés
      if (isCheckingRef.current) {
        return;
      }

      try {
        isCheckingRef.current = true;
        setIsChecking(true);

        const response = await fetch('/api/data-status');

        if (!response.ok) {
          console.error('[DataSync] Failed to fetch status:', response.status);
          return;
        }

        const currentStatus: DataStatus = await response.json();

        // Si c'est la première vérification, on stocke juste les données
        if (!lastStatusRef.current) {
          lastStatusRef.current = currentStatus;
          return;
        }

        // Vérifier si les weapons ont changé
        if (currentStatus.weapons !== lastStatusRef.current.weapons) {
          console.log('[DataSync] Weapons updated');
          memoizedOnWeaponsChange();
        }

        // Vérifier si les weaponTypes ont changé
        if (currentStatus.weaponTypes !== lastStatusRef.current.weaponTypes) {
          console.log('[DataSync] Weapon types updated');
          memoizedOnWeaponTypesChange();
        }

        // Vérifier si les users ont changé
        if (currentStatus.users !== lastStatusRef.current.users) {
          console.log('[DataSync] Users updated');
          memoizedOnUsersChange();
        }

        // Mettre à jour les dernières données
        lastStatusRef.current = currentStatus;
      } catch (error) {
        console.error('[DataSync] Error checking for updates:', error);
      } finally {
        setIsChecking(false);
        isCheckingRef.current = false;
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
    isVisible,
    memoizedOnWeaponsChange,
    memoizedOnWeaponTypesChange,
    memoizedOnUsersChange,
  ]);

  return { isChecking };
}