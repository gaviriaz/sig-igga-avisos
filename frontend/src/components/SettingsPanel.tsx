import React, { useState, useEffect } from 'react';
import { Settings, X, Moon, Sun, Monitor, Bell, Shield, Zap, Palette, Loader2, Save } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { API_URL } from '../config/api';

const SettingsPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { profile } = useAuthStore();
    const [preferences, setPreferences] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchPrefs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/preferences`);
            const data = await res.json();
            setPreferences(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`${API_URL}/preferences`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });
            // Refrescar localmente (Simulado)
            alert("✅ Preferencias Actualizadas: Reinicio de Interfaz Sugerido");
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchPrefs();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[#0a0f1d]/80 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-4xl h-[700px] glass rounded-[3rem] border border-white/10 shadow-2xl flex overflow-hidden">
                {/* 🛠️ Sidebar UI */}
                <aside className="w-80 border-r border-white/5 bg-white/[0.01] p-10 flex flex-col gap-6">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Settings</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Personalize your Engine</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {[
                            { id: 'general', label: 'Interfaz & Estilo', icon: Palette, active: true },
                            { id: 'notifications', label: 'Notificaciones', icon: Bell },
                            { id: 'security', label: 'Seguridad', icon: Shield },
                            { id: 'performance', label: 'Rendimiento', icon: Zap }
                        ].map(item => (
                            <button key={item.id} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-xs font-black uppercase tracking-widest ${item.active ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
                                <item.icon size={18} />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto p-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">Master Senior Account</p>
                        <p className="text-[11px] font-bold text-white mb-2">{profile?.full_name}</p>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full w-3/4 bg-indigo-500" />
                        </div>
                    </div>
                </aside>

                {/* 🎨 Content Area */}
                <main className="flex-1 p-12 flex flex-col">
                    <div className="flex justify-between items-center mb-12">
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Interfaz & Estilo</h2>
                        <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 transition-colors"><X size={24} /></button>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
                            <Loader2 size={48} className="animate-spin text-indigo-400" />
                            <p className="text-xs font-black uppercase tracking-widest">Cargando Preferecias...</p>
                        </div>
                    ) : (
                        <div className="flex-1 space-y-10 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/5">
                            {/* Theme Selector */}
                            <section>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">Esquema de Color</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'dark', label: 'Deep Dark', icon: Moon, desc: 'Optimizado para analítica' },
                                        { id: 'light', label: 'Clarity', icon: Sun, desc: 'Ideal para campo exterior' },
                                        { id: 'system', label: 'Operativo', icon: Monitor, desc: 'Sincronizado con el OS' }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setPreferences({ ...preferences, theme: t.id })}
                                            className={`p-6 rounded-[2rem] border transition-all text-left flex flex-col gap-3 ${preferences?.theme === t.id ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400 shadow-inner' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                                        >
                                            <t.icon size={24} />
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-tight">{t.label}</p>
                                                <p className="text-[9px] font-medium opacity-60 leading-tight">{t.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* View Options */}
                            <section className="space-y-6">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Configuración de Visualización</label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                        <div>
                                            <h4 className="text-sm font-black text-white italic tracking-tight">Modo Zen por Defecto</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Inicia el sistema con todos los paneles colapsados</p>
                                        </div>
                                        <button
                                            onClick={() => setPreferences({ ...preferences, zen_mode: !preferences?.zen_mode })}
                                            className={`w-14 h-8 rounded-full transition-all relative p-1 ${preferences?.zen_mode ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full transition-all ${preferences?.zen_mode ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                        <div>
                                            <h4 className="text-sm font-black text-white italic tracking-tight">Alertas Críticas Automáticas</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Sincronización via Email para emergencias de campo</p>
                                        </div>
                                        <button
                                            onClick={() => setPreferences({ ...preferences, notificaciones_email: !preferences?.notificaciones_email })}
                                            className={`w-14 h-8 rounded-full transition-all relative p-1 ${preferences?.notificaciones_email ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full transition-all ${preferences?.notificaciones_email ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    <footer className="mt-12 pt-8 border-t border-white/5 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving || !preferences}
                            className="h-14 px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Guardar Cambios
                        </button>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default SettingsPanel;
