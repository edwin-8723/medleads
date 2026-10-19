export enum Coordination {
  NACIONAL = 'NACIONAL',
  INTERNACIONAL = 'INTERNACIONAL',
}

export enum LeadStatus {
  NUEVO = 'NUEVO',
  CONTACTADO = 'CONTACTADO',
  CONVERTIDO = 'CONVERTIDO',
  DESCARTADO = 'DESCARTADO',
}

/** Flujo permitido: Nuevo → Contactado → Convertido | Descartado (Nuevo también puede descartarse). */
export const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.NUEVO]: [LeadStatus.CONTACTADO, LeadStatus.DESCARTADO],
  [LeadStatus.CONTACTADO]: [LeadStatus.CONVERTIDO, LeadStatus.DESCARTADO],
  [LeadStatus.CONVERTIDO]: [],
  [LeadStatus.DESCARTADO]: [],
};
