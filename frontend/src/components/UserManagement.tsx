import React from 'react';
import { Users, UserPlus, Shield, Mail, MoreHorizontal, Loader2 } from 'lucide-react';
import { API_URL } from '../config/api';

const UserManagement: React.FC = () => {
    const [users, setUsers] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchUsers = async () => {
            try {
                const resp = await fetch(`${API_URL}/users/all`);
                if (resp.ok) {
                    const data = await resp.json();
                    setUsers(data);
                }
            } catch (e) {
                console.error("Error fetching users");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    return (
        <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex items-center justify-between bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5">
                <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Gestión de Personal Técnico</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Control de Accesos (RBAC) y Roles Corporativos</p>
                </div>
                <button className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-indigo-600/20">
                    <UserPlus size={16} /> Registrar Nuevo Técnico
                </button>
            </header>

            <div className="flex-1 glass rounded-[3rem] border-white/5 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                            <Loader2 size={40} className="animate-spin text-indigo-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Directorio...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {users.map((user, i) => (
                                <div key={i} className="group p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl flex items-center justify-between hover:bg-white/[0.04] hover:border-indigo-500/20 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner group-hover:scale-105 transition-transform font-black">
                                            {(user.full_name || 'U').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{user.full_name}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold"><Mail size={10} /> {user.email}</span>
                                                <span className="w-1 h-1 bg-slate-800 rounded-full" />
                                                <span className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-black uppercase tracking-tighter bg-indigo-500/10 px-2 py-0.5 rounded-full"><Shield size={10} /> {user.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${user.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                            {user.active ? 'ACTIVO' : 'INACTIVO'}
                                        </span>
                                        <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <footer className="p-6 bg-slate-950/40 border-t border-white/5 text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-between">
                    <span className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full" /> {users.length} TÉCNICOS REGISTRADOS</span>
                    <span className="italic">SISTEMA INTEGRAL DE SEGURIDAD ISA</span>
                </footer>
            </div>
        </div>
    );
};

export default UserManagement;
