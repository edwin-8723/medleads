export const PROCEDURES = [
  "Rinoplastia",
  "Mamoplastia de aumento",
  "Lipoescultura",
  "Abdominoplastia",
  "Blefaroplastia",
  "Ritidectomía (lifting facial)",
  "Armonización facial",
  "Bichectomía",
  "Otro / no estoy seguro(a)",
];

// Colombia primero; el resto en orden alfabético.
export const COUNTRIES = [
  "Colombia",
  "Alemania",
  "Argentina",
  "Aruba",
  "Australia",
  "Bolivia",
  "Brasil",
  "Canadá",
  "Chile",
  "Costa Rica",
  "Cuba",
  "Curazao",
  "Ecuador",
  "El Salvador",
  "España",
  "Estados Unidos",
  "Francia",
  "Guatemala",
  "Honduras",
  "Italia",
  "México",
  "Nicaragua",
  "Países Bajos",
  "Panamá",
  "Paraguay",
  "Perú",
  "Portugal",
  "Puerto Rico",
  "Reino Unido",
  "República Dominicana",
  "Suiza",
  "Uruguay",
  "Venezuela",
  "Otro país",
];

export type Coordination = "NACIONAL" | "INTERNACIONAL";
export type LeadStatus = "NUEVO" | "CONTACTADO" | "CONVERTIDO" | "DESCARTADO";

export interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  procedure: string;
  message: string | null;
  coordination: Coordination;
  status: LeadStatus;
  createdAt: string;
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  CONVERTIDO: "Convertido",
  DESCARTADO: "Descartado",
};

export const COORDINATION_LABEL: Record<Coordination, string> = {
  NACIONAL: "Nacional",
  INTERNACIONAL: "Internacional",
};

/** Mismas transiciones que valida el servidor (el servidor es quien decide). */
export const NEXT_STATUSES: Record<LeadStatus, LeadStatus[]> = {
  NUEVO: ["CONTACTADO", "DESCARTADO"],
  CONTACTADO: ["CONVERTIDO", "DESCARTADO"],
  CONVERTIDO: [],
  DESCARTADO: [],
};
