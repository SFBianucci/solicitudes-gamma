import React, { useEffect, useRef } from 'react';
import { ChatMessage, Role } from '../types';
import { MessageSquare, X } from './Icons';
import { Button } from './ui/button';

interface ChatSidebarProps {
  messages: ChatMessage[];
  onClose?: () => void; // Optional prop to handle closing on mobile
}

const RoleColors: Record<Role, string> = {
  [Role.COORDINATOR]: 'text-blue-600',
  [Role.ADMISSION]: 'text-purple-600',
  [Role.HOUSEKEEPING]: 'text-orange-600',
  [Role.NURSING]: 'text-emerald-600',
};

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ messages, onClose }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl w-80 shrink-0">
      {/* Header imitation Mattermost - Matches App Header Height (h-16) */}
      <div className="h-16 bg-slate-950 flex items-center px-4 justify-between shrink-0 border-b border-slate-900">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center backdrop-blur-sm">
             <MessageSquare className="w-4 h-4 text-white" />
           </div>
           <div className="flex flex-col">
             <span className="text-white font-bold text-sm leading-tight">Town Square</span>
             <span className="text-slate-400 text-[10px] font-medium leading-tight">Canal General</span>
           </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center px-6">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-2">
                <MessageSquare className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No hay actividad reciente en el canal.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'bg-white p-3 rounded-lg border border-slate-200 shadow-sm' : ''}`}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`font-bold text-xs ${RoleColors[msg.role] || 'text-slate-800'}`}>
                {msg.sender}
              </span>
              <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
            </div>
            <p className={`text-sm ${msg.isSystem ? 'text-slate-600' : 'text-slate-800'}`}>
              {msg.text}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Placeholder */}
      <div className="p-4 border-t border-gray-200 shrink-0 bg-white">
        <div className="border border-gray-300 rounded-md px-3 py-2.5 bg-slate-50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <input 
            disabled 
            placeholder="Solo lectura (Simulación)" 
            className="w-full text-sm outline-none bg-transparent cursor-not-allowed text-slate-500"
          />
        </div>
      </div>
    </div>
  );
};