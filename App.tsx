import React, { useState, useEffect } from 'react';
import { 
  WorkflowType, 
  Role, 
  Ticket, 
  TicketStatus, 
  ChatMessage 
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
  MessageSquare
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

// --- TYPES & ENUMS ---
type ViewMode = 'HOME' | 'REQUESTS';

// --- MAIN COMPONENT ---

export default function App() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState<ViewMode>('HOME');
  const [activeRole, setActiveRole] = useState<Role>(Role.COORDINATOR);
  
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
       isBedClean: false,
       isReasonValidated: false
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Modal State
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isAssignBedOpen, setIsAssignBedOpen] = useState(false);
  
  // Temporary state for actions
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [bedInput, setBedInput] = useState('');

  // Form State
  const [formWorkflow, setFormWorkflow] = useState<WorkflowType>(WorkflowType.INTERNAL);
  const [formPatientName, setFormPatientName] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formItrSource, setFormItrSource] = useState<'GUARDIA' | 'SISTEMA' | 'ADMISION'>('GUARDIA');
  const [formChangeReason, setFormChangeReason] = useState<'FAMILIAR' | 'AISLAMIENTO' | 'MANTENIMIENTO'>('FAMILIAR');

  // Check screen size on mount to auto-close chat on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setChatOpen(false);
      } else {
        setChatOpen(true);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- ACTIONS ---

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
    setCurrentView('REQUESTS');
  };

  const handleValidateReason = (ticketId: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, isReasonValidated: true, status: TicketStatus.VALIDATED } : t
    ));
    addSystemMessage(`Motivo validado para ticket #${ticketId}.`, Role.ADMISSION, 'Admisión');
  };

  const openAssignBedModal = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setBedInput('');
    setIsAssignBedOpen(true);
  };

  const handleAssignBedSubmit = () => {
    if (!selectedTicketId || !bedInput) return;
    setTickets(prev => prev.map(t => 
      t.id === selectedTicketId ? { ...t, destination: bedInput, status: TicketStatus.BED_ASSIGNED } : t
    ));
    addSystemMessage(`Cama ${bedInput} asignada al ticket #${selectedTicketId}.`, Role.ADMISSION, 'Admisión');
    setIsAssignBedOpen(false);
    setSelectedTicketId(null);
  };

  const handleHousekeepingAction = (ticketId: string, action: 'mark_dirty' | 'mark_clean') => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      if (action === 'mark_dirty') {
         return { ...t, isBedClean: false, status: TicketStatus.CLEANING_REQUIRED };
      } else {
         return { ...t, isBedClean: true, status: TicketStatus.CLEANING_DONE };
      }
    }));
    const msg = action === 'mark_clean' ? 'Habitación confirmada limpia.' : 'Habitación reportada sucia.';
    addSystemMessage(`${msg} Ticket #${ticketId}.`, Role.HOUSEKEEPING, 'Azafata');
  };

  const handleStartTransport = (ticketId: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: TicketStatus.IN_TRANSIT } : t
    ));
    addSystemMessage(`Iniciando traslado #${ticketId}.`, Role.NURSING, 'Camillero');
  };

  const handleCompleteTransport = (ticketId: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: TicketStatus.COMPLETED } : t
    ));
    addSystemMessage(`Traslado completado #${ticketId}.`, Role.NURSING, 'Camillero');
  };

  // --- FILTERS & UTILS ---
  const filteredTickets = tickets.filter(t => {
    if (activeRole === Role.COORDINATOR) return true;
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

  const renderActionCell = (ticket: Ticket) => {
    if (activeRole === Role.COORDINATOR) return <span className="text-slate-400 text-xs italic">Monitoreo</span>;
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
                <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs" onClick={() => handleCompleteTransport(ticket.id)}>
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
            {/* Stats Summary - Now top right aligned or just simplified */}
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

  const RequestsView = () => {
    return (
        <div className="p-4 md:p-8 animate-in slide-in-from-right-4 duration-300 max-w-full">
             <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                 <div className="flex items-center gap-2 w-full sm:w-auto bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-400 pl-2 whitespace-nowrap">Rol Activo:</span>
                    <Tabs value={activeRole} onValueChange={(val) => setActiveRole(val as Role)} className="w-full sm:w-auto">
                        <TabsList className="bg-slate-100 h-8 w-full sm:w-auto">
                            <TabsTrigger value={Role.COORDINATOR} className="h-6 text-xs flex-1 sm:flex-none">Coord.</TabsTrigger>
                            <TabsTrigger value={Role.ADMISSION} className="h-6 text-xs flex-1 sm:flex-none">Admisión</TabsTrigger>
                            <TabsTrigger value={Role.HOUSEKEEPING} className="h-6 text-xs flex-1 sm:flex-none">Higiene</TabsTrigger>
                            <TabsTrigger value={Role.NURSING} className="h-6 text-xs flex-1 sm:flex-none">Enfermería</TabsTrigger>
                        </TabsList>
                    </Tabs>
                 </div>

                 {(activeRole === Role.COORDINATOR || activeRole === Role.ADMISSION) && (
                    <Button onClick={() => setIsNewRequestOpen(true)} size="sm" className="bg-slate-900 hover:bg-slate-800 w-full sm:w-auto shadow-sm">
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
                     <TableHead className="w-[100px] whitespace-nowrap">Estado</TableHead>
                     <TableHead className="min-w-[150px]">Paciente</TableHead>
                     <TableHead className="whitespace-nowrap">Origen</TableHead>
                     <TableHead className="whitespace-nowrap">Destino</TableHead>
                     <TableHead className="min-w-[140px]">Detalles</TableHead>
                     <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredTickets.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={6} className="h-48 text-center text-slate-500 bg-white">
                          <div className="flex flex-col items-center justify-center gap-3">
                             <Search className="w-10 h-10 opacity-10" />
                             <p>No se encontraron solicitudes.</p>
                          </div>
                       </TableCell>
                     </TableRow>
                   ) : (
                     filteredTickets.map((ticket) => (
                       <TableRow key={ticket.id} className="group hover:bg-slate-50/60 transition-colors">
                         <TableCell>
                           <StatusBadge status={ticket.status} />
                         </TableCell>
                         <TableCell>
                            <div className="font-semibold text-slate-900">{ticket.patientName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{ticket.id}</div>
                         </TableCell>
                         <TableCell>
                            <div className="flex items-center gap-2 text-slate-600 text-sm">
                                {ticket.origin}
                            </div>
                         </TableCell>
                         <TableCell>
                           {ticket.destination ? (
                             <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-800 font-semibold border border-slate-200 text-xs">
                                {ticket.destination}
                             </span>
                           ) : (
                             <span className="text-slate-400 italic text-xs">--</span>
                           )}
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
                             {ticket.itrSource && (
                               <Badge variant="info" className="text-[10px] font-medium border border-blue-200/50">
                                 {ticket.itrSource}
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
            Home
        </button>
        <button 
            onClick={() => { setCurrentView('REQUESTS'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${currentView === 'REQUESTS' ? 'bg-zinc-800 text-white shadow-lg shadow-zinc-900/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
        >
            <LayoutDashboard className="w-4 h-4" />
            Solicitudes
        </button>
    </>
  );

  // --- RENDER APP LAYOUT ---

  return (
    <div className="h-screen w-full flex bg-slate-100 overflow-hidden font-sans text-slate-900">
      
      {/* 1. SIDEBAR NAVIGATION */}
      {/* Desktop Sidebar */}
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
                 {/* Mobile Menu Button */}
                 <Button variant="ghost" size="icon" className="md:hidden text-slate-500" onClick={() => setSidebarOpen(true)}>
                     <Menu className="w-5 h-5" />
                 </Button>
                 
                 <h1 className="text-lg md:text-xl font-bold text-slate-800 truncate">
                    {currentView === 'HOME' ? 'Bienvenido a MediFlow' : 'Solicitudes'}
                 </h1>
             </div>

             <div className="flex items-center gap-3 md:gap-6">
                <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sistema Online
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
            {currentView === 'HOME' ? <HomeView /> : <RequestsView />}
        </main>
      </div>

      {/* 3. RIGHT SIDEBAR (Chat) */}
      {/* Desktop: Collapsible / Mobile: Overlay handled differently if needed, but here simple toggle */}
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

    </div>
  );
}