export enum WorkflowType {
  INTERNAL = 'INTERNAL', // Crítica -> Sala Gral
  ITR_TO_FLOOR = 'ITR_TO_FLOOR', // Ingreso: Guardia/Sistema -> Piso
  ROOM_CHANGE = 'ROOM_CHANGE', // Cambio de Habitación
}

export enum Role {
  COORDINATOR = 'COORDINATOR', // Solicitante
  ADMISSION = 'ADMISSION', // Gestión de Cama / Censo
  HOUSEKEEPING = 'HOUSEKEEPING', // Azafata
  NURSING = 'NURSING', // Enfermería / Camillero
}

export enum TicketStatus {
  REQUESTED = 'REQUESTED',
  VALIDATED = 'VALIDATED', // Solo para Cambio de Habitación
  BED_ASSIGNED = 'BED_ASSIGNED',
  CLEANING_REQUIRED = 'CLEANING_REQUIRED',
  CLEANING_DONE = 'CLEANING_DONE',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: Role;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface Ticket {
  id: string;
  patientName: string;
  origin: string;
  destination: string | null; // Asignado por admisión
  workflow: WorkflowType;
  status: TicketStatus;
  createdAt: string;
  
  // Workflow specific fields
  itrSource?: 'GUARDIA' | 'SISTEMA' | 'ADMISION' | 'RECEPCION';
  changeReason?: 'FAMILIAR' | 'AISLAMIENTO' | 'MANTENIMIENTO';
  
  // Flags
  isBedClean: boolean;
  isReasonValidated: boolean; // Para flujo 3
}