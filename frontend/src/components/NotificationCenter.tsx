import React, { useState, useEffect } from 'react';
import { Bell, X, Info, AlertTriangle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface Notificacion {
    id: number;
    titulo: string;
    mensaje: string;
    tipo: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    leida: boolean;
    created_at: string;
}

const NotificationCenter: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState<Notificacion[]>([]);
    const [loading, setLoading] = useState(false);
    const { profile } = useAuthStore();

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/notifications');
            const data = await res.json();
            setNotifications(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await fetch(`http://localhost:8000/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (isOpen) fetchNotifications();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="absolute top-20 right-8 z-50 w-[400px] glass rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-500">
            <header className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                        <Bell size={20} />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Centro de Alertas</h3>
                        <p className="text-[10px] font-bold text-slate-400">Tienes {notifications.filter(n => !n.leida).length} notificaciones nuevas</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white">
                    <X size={20} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto max-h-[500px] p-2 scrollbar-thin scrollbar-thumb-white/5">
                {loading ? (
                    <div className="p-12 flex flex-col items-center gap-4 opacity-50">
                        <Loader2 size={32} className="animate-spin text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</span>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="space-y-1">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => !n.leida && markAsRead(n.id)}
                                className={`p-4 rounded-3xl transition-all cursor-pointer group ${n.leida ? 'opacity-50 grayscale' : 'hover:bg-white/[0.03] border border-transparent hover:border-white/5'}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${n.tipo === 'WARNING' ? 'bg-amber-500/10 text-amber-400' :
                                            n.tipo === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                                                n.tipo === 'ERROR' ? 'bg-rose-500/10 text-rose-400' :
                                                    'bg-indigo-500/10 text-indigo-400'
                                        }`}>
                                        {n.tipo === 'WARNING' ? <AlertTriangle size={18} /> :
                                            n.tipo === 'SUCCESS' ? <CheckCircle2 size={18} /> :
                                                n.tipo === 'ERROR' ? <AlertCircle size={18} /> :
                                                    <Info size={18} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-tight">{n.titulo}</h4>
                                            <span className="text-[8px] font-bold text-slate-600 italic">{new Date(n.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{n.mensaje}</p>
                                    </div>
                                    {!n.leida && (
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1 shrink-0 animate-pulse" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 flex flex-col items-center gap-4 opacity-10">
                        <Bell size={48} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Todo está bajo control</span>
                    </div>
                )}
            </div>

            <footer className="p-6 border-t border-white/5 bg-slate-900/20 text-center">
                <button className="text-[9px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors">Marcar todas como leídas</button>
            </footer>
        </div>
    );
};

export default NotificationCenter;
