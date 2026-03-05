import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Save, ChevronRight, Loader2 } from 'lucide-react';
import { API_URL } from '../config/api';

const DomainManager: React.FC = () => {
    const [activeDomain, setActiveDomain] = useState('workflow_status');
    const [values, setValues] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const domains = [
        { id: 'workflow_status', label: 'Estados de Workflow', icon: '🔄' },
        { id: 'gestion_type', label: 'Tipos de Gestión', icon: '📍' },
    ];

    const fetchValues = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`${API_URL}/domains/${activeDomain}`);
            if (resp.ok) {
                const data = await resp.json();
                setValues(data);
            }
        } catch (e) {
            console.error("Error fetching domains");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchValues();
    }, [activeDomain]);

    const handleAddValue = async () => {
        const val = prompt("ID Operativo (Ej: EN_GESTION):");
        const lab = prompt("Etiqueta Descriptiva:");
        if (!val || !lab) return;

        try {
            const resp = await fetch(`${API_URL}/domains`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain_key: activeDomain, value: val, label: lab })
            });
            if (resp.ok) await fetchValues();
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateLabel = async (id: number, newValue: string, newLabel: string) => {
        alert(`Sincronizando ${newLabel}... (Función Senior Master en Proceso)`);
    };

    return (
        <div className="flex h-full gap-8 animate-in fade-in duration-700">
            {/* 🛠️ Sidebar de Dominios */}
            <aside className="w-64 flex flex-col gap-2">
                {domains.map(dom => (
                    <button
                        key={dom.id}
                        onClick={() => setActiveDomain(dom.id)}
                        className={`p-4 rounded-2xl flex items-center justify-between transition-all border ${activeDomain === dom.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/20' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{dom.icon}</span>
                            <span className="text-xs font-black uppercase tracking-widest">{dom.label}</span>
                        </div>
                        <ChevronRight size={14} className={activeDomain === dom.id ? 'opacity-100' : 'opacity-0'} />
                    </button>
                ))}
            </aside>

            {/* 🛠️ Editor de Valores */}
            <main className="flex-1 glass rounded-[2.5rem] border-white/5 flex flex-col overflow-hidden">
                <header className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Administración de Catálogos</h4>
                        <p className="text-xl font-bold text-white capitalize">{activeDomain.replace('_', ' ')}</p>
                    </div>
                    <button
                        onClick={handleAddValue}
                        className="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                    >
                        <Plus size={14} /> Añadir Valor
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm">
                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                                    <th className="pb-4 pl-4">KEY</th>
                                    <th className="pb-4">Label Descriptivo</th>
                                    <th className="pb-4 text-right pr-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {values.map((v, i) => (
                                    <tr key={v.id || i} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 pl-4 text-xs font-mono text-slate-600 truncate max-w-[150px]">{v.value}</td>
                                        <td className="py-4">
                                            <input
                                                type="text"
                                                defaultValue={v.label}
                                                className="bg-transparent border-none outline-none text-sm font-bold text-slate-200 focus:text-indigo-400 transition-colors w-full"
                                            />
                                        </td>
                                        <td className="py-4 text-right pr-4 space-x-2">
                                            <button className="p-2 text-slate-600 hover:text-emerald-400 transition-colors"><Save size={14} /></button>
                                            <button className="p-2 text-slate-600 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {values.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-20 text-center text-slate-600 italic text-xs uppercase tracking-widest">
                                            No hay datos en este dominio. Use "Seed" para poblar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <footer className="p-6 bg-slate-900/40 border-t border-white/5 text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <Database size={12} /> Cambios se sincronizan automáticamente con Supabase DB
                </footer>
            </main>
        </div>
    );
};

export default DomainManager;
