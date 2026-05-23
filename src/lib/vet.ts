/**
 * Shared labels and lookups for visit / dossier display. Kept here so vet,
 * seller, and buyer views agree on wording.
 */

export const VISIT_STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Demande reçue",
  SCHEDULED: "Visite planifiée",
  COMPLETED: "Visite effectuée",
  CANCELLED: "Annulée",
}

export const VISIT_STATUS_LABEL_SELLER: Record<string, string> = {
  REQUESTED: "Demande envoyée",
  SCHEDULED: "Acceptée — visite planifiée",
  COMPLETED: "Visite effectuée",
  CANCELLED: "Refusée / annulée",
}

export const VISIT_TYPE_LABEL: Record<string, string> = {
  PURCHASE_EXAM: "Visite d'achat",
  ROUTINE: "Visite de routine",
  FOLLOW_UP: "Suivi",
  IMAGING_ONLY: "Imagerie seule",
}
