import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  WorkflowType, 
  Role, 
  Ticket, 
  TicketStatus, 
  ChatMessage,
  User,
  Notification,
  NotificationType
} from './types';
import { ChatSidebar } from './components/ChatSidebar';
import { StatusBadge } from './components/StatusBadge';
import { 
  Activity, 
  Users, 
  ClipboardCheck, 
  ArrowRightLeft, 
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  BedDouble,
  LayoutDashboard,
  Home as HomeIcon,
  Settings,
  LogOut,
  Menu,
  X,
  PanelRightClose,
  PanelRightOpen,
  MessageSquare,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Clock,
  Timer,
  ShieldCheck,
  UserCog,
  Bell,
  Info
} from './components/Icons';

// UI Components
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";

// --- CONSTANTS ---
const HOSPITAL_LOCATIONS = [
  "Guardia Médica",
  "Shockroom",
  "UTI-1 (Terapia Intensiva)",
  "UTI-2",
  "UCO (Unidad Coronaria)",
  "Habitación 101-A",
  "Habitación 101-B",
  "Habitación 102-Individual",
  "Habitación 201-A",
  "Habitación 201-B",
  "Habitación 205-VIP",
  "Habitación 304-A",
  "Habitación 404-B",
  "Quirófano Central"
];

const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Administrador',
  [Role.COORDINATOR]: 'Coordinador',
  [Role.ADMISSION]: 'Admisión',
  [Role.HOUSEKEEPING]: 'Higiene',
  [Role.NURSING]: 'Enfermería',
};

const INITIAL_USERS: User[] = [
  { id: 'USR-001', name: 'Admin Principal', email: 'admin@hospital.com', role: Role.ADMIN, avatar: 'AP', lastLogin: 'Hace 5 min' },
  { id: 'USR-002', name: 'Dr. Carlos Benitez', email: 'cbenitez@hospital.com', role: Role.COORDINATOR, avatar: 'CB', lastLogin: 'Hace 1 hora' },
  { id: 'USR-003', name: 'Lic. Marta Gomez', email: 'mgomez@hospital.com', role: Role.ADMISSION, avatar: 'MG', lastLogin: 'Hace 2 horas' },
  { id: 'USR-004', name: 'Aux. Roberto Perez', email: 'rperez@hospital.com', role: Role.HOUSEKEEPING, avatar: 'RP', lastLogin: 'Hace 10 min' },
  { id: 'USR-005', name: 'Cam. Juan Soto', email: 'jsoto@hospital.com', role: Role.NURSING, avatar: 'JS', lastLogin: 'Hoy, 09:00' },
];

// --- TYPES & ENUMS ---
type ViewMode = 'HOME' | 'REQUESTS' | 'USERS';
type SortKey = 'status' | 'patientName' | 'origin' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

// --- UTILS ---
const getTimeDiffInMinutes = (start: string, end: string) => {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  const date1 = new Date(2000, 0, 1, h1, m1);
  const date2 = new Date(2000, 0, 1, h2, m2);
  const diffMs = date2.getTime() - date1.getTime();
  return Math.round(diffMs / 60000);
};

// --- MAIN COMPONENT ---

export default function App() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState<ViewMode>('HOME');
  const [activeRole, setActiveRole] = useState<Role>(Role.COORDINATOR);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });

  // Layout State
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile Menu
  const [isChatOpen, setChatOpen] = useState(true); // Desktop Chat Toggle

  // Dummy Initial Data
  const [tickets, setTickets] = useState<Ticket[]>([
    {
       id: 'TKT-9921',
       patientName: 'Roberto Gómez',
       origin: 'Guardia Médica',
       destination: null,
       workflow: WorkflowType.ITR_TO_FLOOR,
       status: TicketStatus.REQUESTED,
       createdAt: '09:15',
       isBedClean: false,
       isReasonValidated: false,
       itrSource: 'GUARDIA'
    },
    {
       id: 'TKT-9924',
       patientName: 'Maria Estévez',
       origin: 'UTI-1 (Terapia Intensiva)',
       destination: 'Habitación 404-B',
       workflow: WorkflowType.INTERNAL,
       status: TicketStatus.CLEANING_REQUIRED,
       createdAt: '10:30',
       bedAssignedAt: '10:42', // 12 mins wait
       isBedClean: false,
       isReasonValidated: false
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Modal State
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isAssignBedOpen, setIsAssignBedOpen] = useState(false);
  const [isConfirmCompleteOpen, setIsConfirmCompleteOpen] = useState(false);
  
  // Temporary state for actions
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [bedInput, setBedInput] = useState('');
  const [ticketToComplete, setTicketToComplete] = useState<string | null>(null);

  // Form State
  const [formWorkflow, setFormWorkflow] = useState<WorkflowType>(WorkflowType.INTERNAL);
  const [formPatientName, setFormPatientName] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formItrSource, setFormItrSource] = useState<'GUARDIA' | 'SISTEMA' | 'ADMISION'>('GUARDIA');
  const [formChangeReason, setFormChangeReason] = useState<'FAMILIAR' | 'AISLAMIENTO' | 'MANTENIMIENTO'>('FAMILIAR');

  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check screen size on mount to auto-close chat on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setChatOpen(false);
      } else {
        setChatOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- CALCULATIONS ---
  const averageWaitTime = useMemo(() => {
    const assignedTickets = tickets.filter(t => t.bedAssignedAt && t.createdAt);
    if (assignedTickets.length === 0) return 0;
    
    const totalMinutes = assignedTickets.reduce((sum, t) => {
      return sum + getTimeDiffInMinutes(t.createdAt, t.bedAssignedAt!);
    }, 0);
    
    return Math.round(totalMinutes / assignedTickets.length);
  }, [tickets]);

  // --- ACTIONS ---

  const addNotification = (type: NotificationType, title: string, message: string, ticketId?: string) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      ticketId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const addSystemMessage = (text: string, role: Role, sender: string) => {
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      role,
      sender,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    };
    setChatMessages(prev => [...prev, newMsg]);
  };

  const handleUpdateUserRole = (userId: string, newRole: Role) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    const user = users.find(u => u.id === userId);
    addSystemMessage(`Rol de ${user?.name} cambiado a ${ROLE_LABELS[newRole]}.`, Role.ADMIN, 'Admin Sistema');
    addNotification(NotificationType.ROLE_CHANGE, 'Cambio de Rol', `El usuario ${user?.name} ahora es ${ROLE_LABELS[newRole]}.`);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientName || !formOrigin) return;

    const newTicket: Ticket = {
      id: `TKT-${Math.floor(Math.random() * 10000)}`,
      patientName: formPatientName,
      origin: formOrigin,
      destination: null,
      workflow: formWorkflow,
      status: TicketStatus.REQUESTED,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBedClean: false,
      isReasonValidated: false,
      itrSource: formWorkflow === WorkflowType.ITR_TO_FLOOR ? formItrSource : undefined,
      changeReason: formWorkflow === WorkflowType.ROOM_CHANGE ? formChangeReason : undefined,
    };

    setTickets(prev => [newTicket, ...prev]);
    setFormPatientName('');
    setFormOrigin('');
    setIsNewRequestOpen(false);
    
    let logMsg = `Nueva solicitud: ${newTicket.patientName} (${newTicket.origin}).`;
    if (formWorkflow === WorkflowType.ROOM_CHANGE) logMsg += ` Motivo: ${formChangeReason}.`;
    addSystemMessage(logMsg, Role.COORDINATOR, 'Coordinadora');
    addNotification(NotificationType.NEW_TICKET, 'Nueva Solicitud', `${newTicket.patientName} requiere traslado desde ${newTicket.origin}.`, newTicket.id);
    setCurrentView('REQUESTS');
  };

  const handleValidateReason = (ticketId: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, isReasonValidated: true, status: TicketStatus.VALIDATED } : t
    ));
    addSystemMessage(`Motivo validado para ticket #${ticketId}.`, Role.ADMISSION, 'Admisión');
    addNotification(NotificationType.STATUS_UPDATE, 'Motivo Validado', `El ticket #${ticketId} ha sido validado por Admisión.`, ticketId);
  };

  const openAssignBedModal = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setBedInput('');
    setIsAssignBedOpen(true);
  };

  const handleAssignBedSubmit = () => {
    if (!selectedTicketId || !bedInput) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTickets(prev => prev.map(t => 
      t.id === selectedTicketId ? { 
        ...t, 
        destination: bedInput, 
        status: TicketStatus.BED_ASSIGNED,
        bedAssignedAt: nowStr
      } : t
    ));
    addSystemMessage(`Cama ${bedInput} asignada al ticket #${selectedTicketId}.`, Role.ADMISSION, 'Admisión');
    addNotification(NotificationType.STATUS_UPDATE, 'Cama Asignada', `Se asignó la cama ${bedInput} para el ticket #${selectedTicketId}.`, selectedTicketId);
    setIsAssignBedOpen(false);
    setSelectedTicketId(null);
  };

  const handleHousekeepingAction = (ticketId: string, action: 'mark_dirty' | 'mark_clean') => {
    let newStatus = TicketStatus.CLEANING_REQUIRED;
    if (action === 'mark_clean') newStatus = TicketStatus.CLEANING_DONE;

    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return { ...t, isBedClean: action === 'mark_clean', status: newStatus };
    }));

    const msg = action === 'mark_clean' ? 'Habitación confirmada limpia.' : 'Habitación reportada sucia.';
    addSystemMessage(`${msg} Ticket #${ticketId}.`, Role.HOUSEKEEPING, 'Azafata');
    addNotification(NotificationType.STATUS_UPDATE, action === 'mark_clean' ? 'Cama Lista' : 'Cama Sucia', `El ticket #${ticketId} ahora está ${action === 'mark_clean' ? 'listo' : 'pendiente de limpieza'}.`, ticketId);
  };

  const handleStartTransport = (ticketId: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: TicketStatus.IN_TRANSIT } : t
    ));
    addSystemMessage(`Iniciando traslado #${ticketId}.`, Role.NURSING, 'Camillero');
    addNotification(NotificationType.STATUS_UPDATE, 'Traslado Iniciado', `El paciente del ticket #${ticketId} está en tránsito.`, ticketId);
  };

  const openCompleteConfirmation = (ticketId: string) => {
    setTicketToComplete(ticketId);
    setIsConfirmCompleteOpen(true);
  };

  const handleConfirmComplete = () => {
    if (!ticketToComplete) return;
    setTickets(prev => prev.map(t => 
      t.id === ticketToComplete ? { ...t, status: TicketStatus.COMPLETED } : t
    ));
    addSystemMessage(`Traslado completado #${ticketToComplete}.`, Role.NURSING, 'Camillero');
    addNotification(NotificationType.STATUS_UPDATE, 'Traslado Finalizado', `El traslado #${ticketToComplete} se completó con éxito.`, ticketToComplete);
    setIsConfirmCompleteOpen(false);
    setTicketToComplete(null);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  // --- SORTING LOGIC ---

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTickets = useMemo(() => {
    const roleFiltered = tickets.filter(t => {
      if (activeRole === Role.COORDINATOR || activeRole === Role.ADMIN) return true;
      if (activeRole === Role.ADMISSION) {
        return t.status === TicketStatus.REQUESTED || 
               t.status === TicketStatus.VALIDATED ||
               t.status === TicketStatus.BED_ASSIGNED || 
               (t.workflow === WorkflowType.ROOM_CHANGE && !t.isReasonValidated);
      }
      if (activeRole === Role.HOUSEKEEPING) {
        return t.status === TicketStatus.BED_ASSIGNED || 
               t.status === TicketStatus.CLEANING_REQUIRED || 
               t.status === TicketStatus.CLEANING_DONE;
      }
      if (activeRole === Role.NURSING) {
        return t.status === TicketStatus.CLEANING_DONE || 
               t.status === TicketStatus.IN_TRANSIT;
      }
      return false;
    });

    const sortableItems = [...roleFiltered];
    sortableItems.sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [tickets, activeRole, sortConfig]);

  const renderActionCell = (ticket: Ticket) => {
    if (activeRole === Role.COORDINATOR || activeRole === Role.ADMIN) return <span className="text-slate-400 text-xs italic">Monitoreo</span>;
    if (activeRole === Role.ADMISSION) {
        if (ticket.workflow === WorkflowType.ROOM_CHANGE && !ticket.isReasonValidated) {
            return (
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 h-8 text-xs" onClick={() => handleValidateReason(ticket.id)}>
                   <CheckCircle2 className="w-3 h-3 mr-1" /> Validar
                </Button>
            );
        }
        if (ticket.status === TicketStatus.REQUESTED || ticket.status === TicketStatus.VALIDATED) {
             return (
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 text-xs" onClick={() => openAssignBedModal(ticket.id)}>
                   <BedDouble className="w-3 h-3 mr-1" /> Asignar
                </Button>
            );
        }
        return <span className="text-slate-400 text-xs">—</span>;
    }
    if (activeRole === Role.HOUSEKEEPING) {
        const isCurrentlyClean = ticket.isBedClean;
        return (
            <div className="flex items-center gap-2">
                 <Button 
                    size="sm" 
                    variant={isCurrentlyClean ? "outline" : "default"}
                    className={`h-8 px-2 text-xs ${isCurrentlyClean ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                    onClick={() => handleHousekeepingAction(ticket.id, 'mark_clean')}
                 >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {isCurrentlyClean ? 'Lista' : 'Limpia'}
                 </Button>
                 <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-xs"
                    onClick={() => handleHousekeepingAction(ticket.id, 'mark_dirty')}
                 >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Sucia
                 </Button>
            </div>
        );
    }
    if (activeRole === Role.NURSING) {
        if (ticket.status === TicketStatus.CLEANING_DONE) {
            return (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 text-xs" onClick={() => handleStartTransport(ticket.id)}>
                    <Users className="w-3 h-3 mr-1" /> Iniciar
                </Button>
            );
        }
        if (ticket.status === TicketStatus.IN_TRANSIT) {
             return (
                <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs" onClick={() => openCompleteConfirmation(ticket.id)}>
                    <ClipboardCheck className="w-3 h-3 mr-1" /> Confirmar
                </Button>
            );
        }
    }
  };

  // --- VIEWS ---

  const HomeView = () => {
    const pending = tickets.filter(t => t.status === TicketStatus.REQUESTED || t.status === TicketStatus.VALIDATED);
    const process = tickets.filter(t => t.status !== TicketStatus.REQUESTED && t.status !== TicketStatus.VALIDATED && t.status !== TicketStatus.COMPLETED);

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex justify-end mb-4">
                 <Card className="w-full md:w-auto p-4 bg-white border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900 leading-none">{tickets.length}</p>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Activos</p>
                    </div>
                </Card>
            </div>

            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                    <h3 className="text-lg font-semibold text-slate-800">Pendientes de Admisión</h3>
                    <Badge variant="warning" className="ml-2">{pending.length}</Badge>
                </div>
                {pending.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 bg-slate-50">
                        No hay solicitudes pendientes.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {pending.map(t => (
                            <Card key={t.id} className="hover:shadow-md transition-shadow border-l-4 border-l-amber-500 bg-white">
                                <CardHeader className="pb-3 p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="bg-slate-50 font-mono text-[10px]">{t.id}</Badge>
                                        <StatusBadge status={t.status} />
                                    </div>
                                    <CardTitle className="text-base font-bold text-slate-800">{t.patientName}</CardTitle>
                                    <CardDescription className="flex items-center gap-1 text-xs">
                                        <ArrowRightLeft className="w-3 h-3" /> {t.origin}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    <h3 className="text-lg font-semibold text-slate-800">En Proceso Operativo</h3>
                    <Badge variant="info" className="ml-2">{process.length}</Badge>
                </div>
                {process.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 bg-slate-50">
                        No hay solicitudes en proceso.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {process.map(t => (
                            <Card key={t.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500 bg-white">
                                <CardHeader className="pb-3 p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="bg-slate-50 font-mono text-[10px]">{t.id}</Badge>
                                        <StatusBadge status={t.status} />
                                    </div>
                                    <CardTitle className="text-base font-bold text-slate-800">{t.patientName}</CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                                        <span>{t.origin}</span>
                                        <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                                        <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{t.destination}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex gap-2 mt-2">
                                         {t.isBedClean ? 
                                            <Badge variant="success" className="text-[10px]">Limpia</Badge> : 
                                            <Badge variant="destructive" className="text-[10px]">Sucia</Badge>
                                         }
                                         {t.status === TicketStatus.IN_TRANSIT && 
                                            <Badge variant="warning" className="text-[10px] animate-pulse">En Camino</Badge>
                                         }
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
  };

  const UserManagementView = () => {
    return (
        <div className="p-4 md:p-8 animate-in slide-in-from-right-4 duration-300 max-w-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <UserCog className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h2>
                        <p className="text-sm text-slate-500 font-medium">Asigna roles y permisos granulares</p>
                    </div>
                </div>
                <Button className="bg-slate-900 hover:bg-slate-800 shadow-md">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            <Card className="shadow-sm border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow>
                                <TableHead className="w-[300px]">Usuario</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol Asignado</TableHead>
                                <TableHead>Último Acceso</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                                                {user.avatar}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">{user.name}</div>
                                                <div className="text-[10px] font-mono text-slate-400">{user.id}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {user.email}
                                    </TableCell>
                                    <TableCell>
                                        <Select 
                                            value={user.role} 
                                            onValueChange={(val) => handleUpdateUserRole(user.id, val as Role)}
                                        >
                                            <SelectTrigger className="w-[160px] h-8 text-xs bg-white border-slate-200 font-medium">
                                                <SelectValue placeholder={ROLE_LABELS[user.role]} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={Role.ADMIN}>{ROLE_LABELS[Role.ADMIN]}</SelectItem>
                                                <SelectItem value={Role.COORDINATOR}>{ROLE_LABELS[Role.COORDINATOR]}</SelectItem>
                                                <SelectItem value={Role.ADMISSION}>{ROLE_LABELS[Role.ADMISSION]}</SelectItem>
                                                <SelectItem value={Role.HOUSEKEEPING}>{ROLE_LABELS[Role.HOUSEKEEPING]}</SelectItem>
                                                <SelectItem value={Role.NURSING}>{ROLE_LABELS[Role.NURSING]}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        {user.lastLogin}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900">
                                            <Settings className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
  };

  const SortHeader = ({ label, sortKey }: { label: string, sortKey: SortKey }) => {
    const isActive = sortConfig.key === sortKey;
    return (
        <TableHead 
            className="cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
            onClick={() => requestSort(sortKey)}
        >
            <div className="flex items-center gap-1.5">
                <span className={isActive ? "text-slate-900 font-bold" : ""}>{label}</span>
                <div className="flex flex-col opacity-30 group-hover:opacity-100 transition-opacity">
                    {!isActive ? (
                        <ArrowUpDown className="w-3 h-3" />
                    ) : sortConfig.direction === 'asc' ? (
                        <ChevronUp className="w-3 h-3 text-slate-900" />
                    ) : (
                        <ChevronDown className="w-3 h-3 text-slate-900" />
                    )}
                </div>
            </div>
        </TableHead>
    );
  };

  const RequestsView = () => {
    return (
        <div className="p-4 md:p-8 animate-in slide-in-from-right-4 duration-300 max-w-full">
             <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4">
                 <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400 pl-2 whitespace-nowrap">Simular Rol:</span>
                        <Tabs value={activeRole} onValueChange={(val) => setActiveRole(val as Role)} className="w-full sm:w-auto">
                            <TabsList className="bg-slate-100 h-8 w-full sm:w-auto">
                                <TabsTrigger value={Role.ADMIN} className="h-6 text-[10px] flex-1 sm:flex-none">Admin</TabsTrigger>
                                <TabsTrigger value={Role.COORDINATOR} className="h-6 text-[10px] flex-1 sm:flex-none">Coord.</TabsTrigger>
                                <TabsTrigger value={Role.ADMISSION} className="h-6 text-[10px] flex-1 sm:flex-none">Admisión</TabsTrigger>
                                <TabsTrigger value={Role.HOUSEKEEPING} className="h-6 text-[10px] flex-1 sm:flex-none">Higiene</TabsTrigger>
                                <TabsTrigger value={Role.NURSING} className="h-6 text-[10px] flex-1 sm:flex-none">Enf.</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm whitespace-nowrap w-full sm:w-auto">
                        <div className="p-1.5 bg-emerald-100 rounded-full text-emerald-600">
                            <Timer className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-emerald-600 leading-tight">Espera Promedio</p>
                            <p className="text-sm font-bold text-emerald-900 leading-tight">{averageWaitTime || '--'} min</p>
                        </div>
                    </div>
                 </div>

                 {(activeRole === Role.COORDINATOR || activeRole === Role.ADMISSION || activeRole === Role.ADMIN) && (
                    <Button onClick={() => setIsNewRequestOpen(true)} size="sm" className="bg-slate-900 hover:bg-slate-800 w-full lg:w-auto shadow-sm">
                        <Plus className="w-3 h-3 mr-2" />
                        Nueva Solicitud
                    </Button>
                )}
           </div>

           <Card className="shadow-sm border-slate-200 overflow-hidden">
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader className="bg-slate-50 border-b border-slate-200">
                   <TableRow>
                     <SortHeader label="Estado" sortKey="status" />
                     <SortHeader label="Paciente" sortKey="patientName" />
                     <SortHeader label="Origen" sortKey="origin" />
                     <SortHeader label="Hora" sortKey="createdAt" />
                     <TableHead className="min-w-[140px]">Detalles</TableHead>
                     <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {sortedTickets.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={6} className="h-48 text-center text-slate-500 bg-white">
                          <div className="flex flex-col items-center justify-center gap-3">
                             <Search className="w-10 h-10 opacity-10" />
                             <p>No se encontraron solicitudes.</p>
                          </div>
                       </TableCell>
                     </TableRow>
                   ) : (
                     sortedTickets.map((ticket) => (
                       <TableRow key={ticket.id} className="group hover:bg-slate-50/60 transition-colors">
                         <TableCell>
                           <StatusBadge status={ticket.status} />
                         </TableCell>
                         <TableCell>
                            <div className="font-semibold text-slate-900">{ticket.patientName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{ticket.id}</div>
                         </TableCell>
                         <TableCell>
                            <div className="text-slate-600 text-sm">
                                {ticket.origin}
                            </div>
                            {ticket.destination && (
                                <div className="flex items-center gap-1 mt-1">
                                    <ArrowRightLeft className="w-2.5 h-2.5 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500">{ticket.destination}</span>
                                </div>
                            )}
                         </TableCell>
                         <TableCell>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                    <Clock className="w-3 h-3" />
                                    {ticket.createdAt}
                                </div>
                                {ticket.bedAssignedAt && (
                                    <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-100 bg-emerald-50 text-emerald-600 font-normal">
                                        Cama: {ticket.bedAssignedAt}
                                    </Badge>
                                )}
                            </div>
                         </TableCell>
                         <TableCell>
                           <div className="flex flex-col gap-1.5 items-start">
                             <Badge variant="outline" className="text-[10px] bg-white text-slate-500 border-slate-200 font-normal">
                                {ticket.workflow === WorkflowType.INTERNAL ? 'Interno' :
                                 ticket.workflow === WorkflowType.ITR_TO_FLOOR ? 'Ingreso ITR' : 'Cambio Hab.'}
                             </Badge>
                             {ticket.changeReason && (
                               <Badge variant="warning" className="text-[10px] font-medium border border-amber-200/50">
                                 {ticket.changeReason}
                               </Badge>
                             )}
                           </div>
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex justify-end">
                             {renderActionCell(ticket)}
                           </div>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
             </div>
           </Card>
        </div>
    );
  };

  // --- MENU ITEMS ---
  const NavItems = () => (
    <>
        <button 
            onClick={() => { setCurrentView('HOME'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${currentView === 'HOME' ? 'bg-zinc-800 text-white shadow-lg shadow-zinc-900/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
        >
            <HomeIcon className="w-4 h-4" />
            Dashboard
        </button>
        <button 
            onClick={() => { setCurrentView('REQUESTS'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${currentView === 'REQUESTS' ? 'bg-zinc-800 text-white shadow-lg shadow-zinc-900/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
        >
            <LayoutDashboard className="w-4 h-4" />
            Solicitudes
        </button>

        {activeRole === Role.ADMIN && (
            <div className="pt-4 mt-4 border-t border-zinc-900">
                <p className="px-3 text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Administración</p>
                <button 
                    onClick={() => { setCurrentView('USERS'); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${currentView === 'USERS' ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-900/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
                >
                    <ShieldCheck className="w-4 h-4" />
                    Gestión Usuarios
                </button>
            </div>
        )}
    </>
  );

  // --- RENDER APP LAYOUT ---

  const renderCurrentView = () => {
    switch (currentView) {
        case 'HOME': return <HomeView />;
        case 'REQUESTS': return <RequestsView />;
        case 'USERS': return <UserManagementView />;
        default: return <HomeView />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="h-screen w-full flex bg-slate-100 overflow-hidden font-sans text-slate-900">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex w-56 bg-zinc-950 text-zinc-300 flex-col shrink-0 border-r border-zinc-800 z-20">
         <div className="h-16 flex items-center px-6 border-b border-zinc-900 bg-zinc-950">
            <Activity className="w-5 h-5 text-white mr-3" />
            <span className="font-bold text-white tracking-tight text-lg">MediFlow</span>
         </div>
         <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <NavItems />
         </nav>
         <div className="p-4 border-t border-zinc-900 bg-zinc-950">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors">
                <Settings className="w-4 h-4" />
                Configuración
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors mt-1">
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
            </button>
         </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
              <div className="relative flex-1 w-full max-w-xs bg-zinc-950 p-4 shadow-2xl animate-in slide-in-from-left duration-300">
                  <div className="flex items-center justify-between mb-8 px-2">
                     <div className="flex items-center gap-2">
                         <Activity className="w-6 h-6 text-white" />
                         <span className="font-bold text-white text-xl">MediFlow</span>
                     </div>
                     <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 hover:text-white">
                         <X className="w-6 h-6" />
                     </button>
                  </div>
                  <nav className="space-y-2">
                     <NavItems />
                  </nav>
              </div>
          </div>
      )}

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative transition-all duration-300">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm shrink-0 z-10">
             <div className="flex items-center gap-4">
                 <Button variant="ghost" size="icon" className="md:hidden text-slate-500" onClick={() => setSidebarOpen(true)}>
                     <Menu className="w-5 h-5" />
                 </Button>
                 
                 <h1 className="text-lg md:text-xl font-bold text-slate-800 truncate">
                    {currentView === 'HOME' ? 'Dashboard Operativo' : 
                     currentView === 'REQUESTS' ? 'Centro de Solicitudes' : 'Gestión de Personal'}
                 </h1>
             </div>

             <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
                <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sistema Online
                </div>

                {/* Notification Bell */}
                <div className="relative" ref={notificationsRef}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`relative text-slate-600 hover:bg-slate-100 ${showNotifications ? 'bg-slate-100' : ''}`}
                    onClick={() => {
                        setShowNotifications(!showNotifications);
                        if (!showNotifications) markAllAsRead();
                    }}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 shadow-2xl rounded-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h4 className="font-bold text-slate-900 text-sm">Notificaciones</h4>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 text-slate-500 hover:text-red-600" onClick={clearNotifications}>
                          Limpiar todo
                        </Button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                            <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Sin notificaciones nuevas</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <div className="flex gap-3">
                                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                                  n.type === NotificationType.NEW_TICKET ? 'bg-amber-100 text-amber-600' :
                                  n.type === NotificationType.STATUS_UPDATE ? 'bg-blue-100 text-blue-600' :
                                  'bg-emerald-100 text-emerald-600'
                                }`}>
                                  {n.type === NotificationType.NEW_TICKET ? <Plus className="w-4 h-4" /> :
                                   n.type === NotificationType.STATUS_UPDATE ? <Activity className="w-4 h-4" /> :
                                   <UserCog className="w-4 h-4" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-bold text-xs text-slate-900">{n.title}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{n.timestamp}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 leading-normal">{n.message}</p>
                                  {n.ticketId && (
                                    <button 
                                      className="text-[10px] font-bold text-blue-600 mt-2 hover:underline"
                                      onClick={() => { setCurrentView('REQUESTS'); setShowNotifications(false); }}
                                    >
                                      Ver ticket {n.ticketId}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Chat Toggle Button */}
                <Button 
                    variant={isChatOpen ? "secondary" : "outline"} 
                    size="sm" 
                    className={`gap-2 ${isChatOpen ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600'}`}
                    onClick={() => setChatOpen(!isChatOpen)}
                >
                    {isChatOpen ? <PanelRightClose className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isChatOpen ? 'Ocultar Chat' : 'Ver Chat'}</span>
                </Button>

                <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white">
                    JS
                </div>
             </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {renderCurrentView()}
        </main>
      </div>

      {/* 3. RIGHT SIDEBAR (Chat) */}
      {isChatOpen && (
          <div className="hidden lg:block animate-in slide-in-from-right duration-300">
             <ChatSidebar messages={chatMessages} />
          </div>
      )}
      
      {/* Mobile Chat Drawer (Overlay) */}
      {isChatOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex justify-end">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={() => setChatOpen(false)} />
           <div className="relative h-full w-80 shadow-2xl animate-in slide-in-from-right duration-300">
             <ChatSidebar messages={chatMessages} onClose={() => setChatOpen(false)} />
           </div>
        </div>
      )}

      {/* --- MODALS (Global) --- */}

      {/* Create Request Modal */}
      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Solicitud de Traslado</DialogTitle>
          </DialogHeader>
          <form id="create-ticket-form" onSubmit={handleCreateTicket} className="grid gap-4 py-4">
            
            <div className="grid gap-2">
              <Label>Tipo de Escenario</Label>
              <Select 
                  value={formWorkflow}
                  onValueChange={(val) => setFormWorkflow(val as WorkflowType)}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Seleccione flujo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={WorkflowType.INTERNAL}>1. Traslado Interno (Crítica -> Sala)</SelectItem>
                    <SelectItem value={WorkflowType.ITR_TO_FLOOR}>2. Ingreso ITR a Piso</SelectItem>
                    <SelectItem value={WorkflowType.ROOM_CHANGE}>3. Cambio de Habitación</SelectItem>
                  </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="patientName">Paciente</Label>
                    <Input 
                    id="patientName"
                    required
                    placeholder="Nombre completo"
                    value={formPatientName}
                    onChange={e => setFormPatientName(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="origin">Origen Actual</Label>
                    <Select value={formOrigin} onValueChange={setFormOrigin}>
                      <SelectTrigger className="bg-white border-slate-200" id="origin">
                        <SelectValue placeholder="Seleccionar Origen" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {HOSPITAL_LOCATIONS.map(loc => (
                           <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
            </div>

            {/* DYNAMIC FIELDS */}
            {formWorkflow === WorkflowType.ITR_TO_FLOOR && (
              <div className="grid gap-2 p-4 bg-blue-50/50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
                <Label className="text-blue-900 font-semibold">Origen del Pedido (Requisito ITR)</Label>
                <Select 
                    value={formItrSource}
                    onValueChange={(val) => setFormItrSource(val as any)}
                >
                  <SelectTrigger className="w-full bg-white h-9">
                    <SelectValue placeholder="Seleccione origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GUARDIA">Guardia Médica</SelectItem>
                    <SelectItem value="SISTEMA">Automático (Sistema)</SelectItem>
                    <SelectItem value="ADMISION">Admisión Guardia</SelectItem>
                    <SelectItem value="RECEPCION">Recepción Central</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formWorkflow === WorkflowType.ROOM_CHANGE && (
              <div className="grid gap-2 p-4 bg-amber-50/50 rounded-lg border border-amber-100 animate-in fade-in slide-in-from-top-2">
                <Label className="text-amber-900 font-semibold">Motivo del Cambio</Label>
                <Select 
                    value={formChangeReason}
                    onValueChange={(val) => setFormChangeReason(val as any)}
                >
                  <SelectTrigger className="w-full bg-white border-amber-200 h-9">
                      <SelectValue placeholder="Seleccione motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAMILIAR">Solicitud Familiar</SelectItem>
                    <SelectItem value="AISLAMIENTO">Aislamiento / Infectología</SelectItem>
                    <SelectItem value="MANTENIMIENTO">Mantenimiento Edilicio</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-xs text-amber-700 mt-2 bg-amber-100/50 p-2 rounded">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Requiere validación manual por Admisión.</span>
                </div>
              </div>
            )}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>Cancelar</Button>
            <Button type="submit" form="create-ticket-form" className="bg-slate-900">Generar Solicitud</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Bed Modal */}
      <Dialog open={isAssignBedOpen} onOpenChange={setIsAssignBedOpen}>
        <DialogContent className="sm:max-w-[400px]">
           <DialogHeader>
              <DialogTitle>Asignar Cama</DialogTitle>
           </DialogHeader>
           <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="bedNumber">Cama / Habitación Destino</Label>
                <Select value={bedInput} onValueChange={setBedInput}>
                  <SelectTrigger className="bg-white border-slate-200" id="bedNumber">
                    <SelectValue placeholder="Seleccionar Cama" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {HOSPITAL_LOCATIONS.map(loc => (
                       <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
           </div>
           <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignBedOpen(false)}>Cancelar</Button>
              <Button onClick={handleAssignBedSubmit} className="bg-purple-600 hover:bg-purple-700">Confirmar</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Complete Modal */}
      <Dialog open={isConfirmCompleteOpen} onOpenChange={setIsConfirmCompleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-amber-500" />
               Confirmar Finalización
            </DialogTitle>
            <DialogDescription>
               ¿Estás seguro de que deseas marcar este traslado como <strong>COMPLETADO</strong>? Esta acción notificará a todos los sectores y cerrará el ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm">
             <div className="flex justify-between mb-1">
                <span className="text-slate-500">Ticket:</span>
                <span className="font-mono font-bold">{ticketToComplete}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-slate-500">Paciente:</span>
                <span className="font-semibold">{tickets.find(t => t.id === ticketToComplete)?.patientName}</span>
             </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsConfirmCompleteOpen(false)}>Volver</Button>
            <Button onClick={handleConfirmComplete} className="bg-green-600 hover:bg-green-700">
               Confirmar Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
