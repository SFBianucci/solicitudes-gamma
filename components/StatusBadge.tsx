import React from 'react';
import { TicketStatus } from '../types';
import { Badge } from './ui/badge';

interface Props {
  status: TicketStatus;
}

const statusConfig: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple" }> = {
  [TicketStatus.REQUESTED]: { label: 'Solicitado', variant: 'secondary' },
  [TicketStatus.VALIDATED]: { label: 'Validado', variant: 'info' },
  [TicketStatus.BED_ASSIGNED]: { label: 'Cama Asignada', variant: 'purple' }, // Changed from default (black) to purple/blue
  [TicketStatus.CLEANING_REQUIRED]: { label: 'Limpieza Req.', variant: 'destructive' }, // Red/Orange for attention
  [TicketStatus.CLEANING_DONE]: { label: 'Lista / Limpia', variant: 'success' },
  [TicketStatus.IN_TRANSIT]: { label: 'En Traslado', variant: 'warning' },
  [TicketStatus.COMPLETED]: { label: 'Finalizado', variant: 'outline' },
};

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className="whitespace-nowrap shadow-sm">
      {config.label}
    </Badge>
  );
};