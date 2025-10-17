// Traductions pour les actions de log
export const logActionTranslations: Record<string, string> = {
  ASSIGNED: 'Assignée',
  RETURNED: 'Retournée',
  MAINTENANCE_START: 'Maintenance débutée',
  MAINTENANCE_END: 'Maintenance terminée',
  CREATED: 'Créée',
  UPDATED: 'Mise à jour',
  DELETED: 'Supprimée',
};

// Traductions pour les statuts d'armes
export const weaponStatusTranslations: Record<string, string> = {
  AVAILABLE: 'Disponible',
  ASSIGNED: 'Assignée',
  MAINTENANCE: 'En maintenance',
  RETIRED: 'Retirée',
};

// Fonction pour traduire une action de log
export function translateLogAction(action: string): string {
  return logActionTranslations[action] || action;
}

// Fonction pour traduire un statut d'arme
export function translateWeaponStatus(status: string): string {
  return weaponStatusTranslations[status] || status;
}
