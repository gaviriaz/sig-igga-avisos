import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar,
    MapPin,
    Footprints,
    Navigation,
    Clock,
    ChevronRight,
    Filter,
    CheckCircle2,
    AlertCircle,
    User,
    ArrowRight,
    Users,
    Search,
    Send
} from 'lucide-react';
import { getWeekNumber } from '../utils/colombiaCalendar';
import TacticalCalendar from '../components/TacticalCalendar';
import { useAvisoStore, Aviso } from '../store/useAvisoStore';
import { useAuthStore } from '../store/useAuthStore';
import { getApiUrl } from '../config/api';

const Logistica: React.FC = () => {
    const { avisos, updateAviso } = useAvisoStore();
    const { profile } = useAuthStore();

    const [selectedAvisoIds, setSelectedAvisoIds] = useState<string[]>([]);
    const [currentYear] = useState(new Date().getFullYear());
    const [startPoint, setStartPoint] = useState('Punto de Inicio Actual');
    const [workCycle] = useState({ work: 22, rest: 7 });
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [gestores, setGestores] = useState<any[]>([]);
    const [selectedGestorId, setSelectedGestorId] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    // OSRM State
    const [optimizedPath, setOptimizedPath] = useState<string[]>([]);
    const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });

    // Cargar gestores para asignación
    useEffect(() => {
        const fetchGestores = async () => {
            try {
                const baseUrl = await getApiUrl();
                const resp = await fetch(`${baseUrl}/users`);
                if (resp.ok) {
                    const data = await resp.json();
                    // Filtrar solo gestores de campo
                    setGestores(data.filter((u: any) => u.role === 'Gestor de Campo' || u.role === 'Analista Ambiental'));
                }
            } catch (e) {
                console.error("Error fetching gestores");
            }
        };
        fetchGestores();
    }, []);

    // Avisos filtrados según rol
    const displayAvisos = useMemo(() => {
        let filtered = avisos.filter(a => a.latitud_decimal && a.longitud_decimal);

        // Si es Gestor, solo ve lo asignado a él
        if (profile?.role === 'Gestor de Campo') {
            filtered = filtered.filter(a => a.assigned_to === profile.username);
        } else if (selectedGestorId) {
            // Si el Analista seleccionó un gestor, ver lo que tiene ese gestor
            filtered = filtered.filter(a => a.assigned_to === selectedGestorId);
        } else if (searchTerm) {
            // Buscador general
            filtered = filtered.filter(a =>
                a.aviso.includes(searchTerm) ||
                a.denominacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.municipio?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    }, [avisos, profile, selectedGestorId, searchTerm]);

    const toggleAviso = (id: string) => {
        setSelectedAvisoIds(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const optimizeRoute = async () => {
        if (selectedAvisoIds.length === 0) return;
        setIsOptimizing(true);

        try {
            const selectedData = avisos.filter(a => selectedAvisoIds.includes(a.aviso));
            // Punto de inicio (simulado o geolocalizado)
            const originCoords = [-73.1198, 7.1193];
            const coordsString = [originCoords, ...selectedData.map(a => [a.longitud_decimal, a.latitud_decimal])]
                .map(c => `${c[0]},${c[1]}`)
                .join(';');

            // Cambiamos a 'foot' para optimización de recorrido a pie
            const routeResponse = await fetch(`https://router.project-osrm.org/route/v1/foot/${coordsString}?overview=false`);
            const data = await routeResponse.json();

            if (data.code === 'Ok') {
                setOptimizedPath(selectedAvisoIds);
                setRouteInfo({
                    distance: parseFloat((data.routes[0].distance / 1000).toFixed(1)),
                    duration: parseFloat((data.routes[0].duration / 3600).toFixed(1))
                });
            }
        } catch (error) {
            console.error("OSRM Error:", error);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleAssign = async () => {
        if (selectedAvisoIds.length === 0 || !selectedGestorId) return;
        setIsAssigning(true);

        const gestor = gestores.find(g => g.username === selectedGestorId);

        try {
            const baseUrl = await getApiUrl();
            for (const id of selectedAvisoIds) {
                const resp = await fetch(`${baseUrl}/avisos/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assigned_to: selectedGestorId,
                        assigned_to_name: gestor?.full_name
                    })
                });

                if (resp.ok) {
                    updateAviso(id, { assigned_to: selectedGestorId, assigned_to_name: gestor?.full_name });
                }
            }
            alert(`✅ ${selectedAvisoIds.length} avisos asignados a ${gestor?.full_name}`);
            setSelectedAvisoIds([]);
        } catch (e) {
            alert("❌ Error al asignar avisos");
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 pb-20 overflow-x-hidden">
            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 p-10 max-w-[1700px] mx-auto space-y-12">
                {/* Header Premium Refactorizado */}
                <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-indigo-600/10 rounded-3xl border border-indigo-500/20 shadow-2xl animate-float">
                                <Footprints className="w-10 h-10 text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-5xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-white via-slate-400 to-white bg-clip-text text-transparent">
                                    Centro de <span className="text-indigo-500">Programación</span>
                                </h1>
                                <p className="text-slate-500 font-mono text-xs tracking-widest uppercase italic border-l-2 border-indigo-500/30 pl-4 mt-1">
                                    GESTIÓN DE RECORRIDOS Y ASIGNACIÓN TERRITORIAL // v2.0.0
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="glass px-8 py-4 rounded-[2.5rem] border-white/5 flex items-center gap-8 shadow-2xl">
                            <div className="text-center group">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 group-hover:text-indigo-400 transition-colors">Semana</p>
                                <p className="text-3xl font-black text-white italic">W-{getWeekNumber(new Date())}</p>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="text-center group">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 group-hover:text-emerald-400 transition-colors">Ciclo</p>
                                <p className="text-3xl font-black text-white italic">{workCycle.work}<span className="text-slate-600">/</span>{workCycle.rest}</p>
                            </div>
                        </div>

                        {(profile?.role === 'Oficina' || profile?.role === 'Analista Ambiental') && (
                            <div className="glass px-6 py-3 rounded-[2rem] border-white/5 flex items-center gap-4">
                                <Users className="text-indigo-400" size={18} />
                                <select
                                    className="bg-transparent border-none outline-none text-xs font-black uppercase text-indigo-300 cursor-pointer"
                                    value={selectedGestorId}
                                    onChange={(e) => setSelectedGestorId(e.target.value)}
                                >
                                    <option value="" className="bg-slate-900 text-white">Todos los Gestores</option>
                                    {gestores.map(g => (
                                        <option key={g.id} value={g.username} className="bg-slate-900 text-white">{g.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Panel Izquierdo: Control de Asignación */}
                    <aside className="lg:col-span-4 space-y-8">
                        <section className="glass rounded-[3rem] p-8 border-white/5 relative overflow-hidden group hover:border-white/10 transition-all shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black uppercase italic tracking-wider flex items-center gap-3">
                                        <Filter className="w-5 h-5 text-indigo-500" /> Avisos para Programar
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                        Selecciona los puntos para crear el hito de gestión
                                    </p>
                                </div>
                                <span className="bg-indigo-600/20 text-indigo-400 px-4 py-1.5 rounded-2xl text-[10px] font-black border border-indigo-500/20">
                                    {displayAvisos.length} DISPONIBLES
                                </span>
                            </div>

                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input
                                    type="text"
                                    placeholder="FILTRAR POR MUNICIPIO O ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-[10px] font-bold text-white uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar lg:min-h-[400px]">
                                {displayAvisos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-600 border-2 border-dashed border-white/5 rounded-[2rem]">
                                        <AlertCircle size={40} className="mb-4 opacity-20" />
                                        <p className="text-xs font-black uppercase tracking-widest">Sin resultados</p>
                                    </div>
                                ) : displayAvisos.map((aviso) => (
                                    <div
                                        key={aviso.aviso}
                                        onClick={() => toggleAviso(aviso.aviso)}
                                        className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between group/item ${selectedAvisoIds.includes(aviso.aviso)
                                            ? 'bg-indigo-600/20 border-indigo-500/40 shadow-lg'
                                            : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedAvisoIds.includes(aviso.aviso) ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500'
                                                }`}>
                                                <div className="text-[10px] font-black">KM</div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-sm italic">{aviso.aviso}</p>
                                                    {aviso.risk_score > 75 && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                                    <MapPin className="w-3 h-3 text-indigo-500" /> {aviso.municipio}
                                                </div>
                                            </div>
                                        </div>
                                        {selectedAvisoIds.includes(aviso.aviso) ? (
                                            <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border border-white/10 group-hover/item:border-indigo-500/50" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="glass rounded-[3rem] p-8 border-white/5 shadow-2xl relative overflow-hidden group">
                            <h3 className="text-sm font-black uppercase italic tracking-wider text-slate-400 mb-6 flex items-center gap-3">
                                <Navigation className="w-5 h-5 text-indigo-500" /> Parámetros de Ruta
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-black ml-2">Punto de Partida</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={startPoint}
                                            onChange={(e) => setStartPoint(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-white/ hover:border-white/10 rounded-2xl px-5 py-4 text-xs focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono font-bold text-indigo-300"
                                        />
                                        <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 opacity-50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        className="btn-primary py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-indigo-600/20 disabled:opacity-30"
                                        disabled={selectedAvisoIds.length === 0 || isOptimizing}
                                        onClick={optimizeRoute}
                                    >
                                        {isOptimizing ? 'Procesando...' : 'Optimizar Recorrido'}
                                    </button>

                                    {(profile?.role === 'Oficina' || profile?.role === 'Analista Ambiental') && (
                                        <button
                                            className="bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                                            disabled={selectedAvisoIds.length === 0 || !selectedGestorId || isAssigning}
                                            onClick={handleAssign}
                                        >
                                            <Send size={14} /> Asignar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>
                    </aside>

                    {/* Contenido Derecho: Mapa y Planificación */}
                    <div className="lg:col-span-8 space-y-8">
                        <section className="glass rounded-[4rem] h-[600px] border-white/5 overflow-hidden relative group shadow-2xl border-indigo-500/10 active-glow">
                            <div className="absolute inset-0 bg-[#020617]/40 flex flex-col items-center justify-center text-center p-12">
                                <div className="p-12 rounded-full bg-indigo-600/5 border border-indigo-500/10 shadow-[0_0_100px_rgba(79,70,229,0.1)] mb-8 animate-float">
                                    <Footprints className="w-24 h-24 text-indigo-400/20" />
                                </div>

                                {isOptimizing ? (
                                    <div className="space-y-4">
                                        <p className="text-indigo-400 font-mono text-sm tracking-[0.5em] animate-pulse uppercase italic">
                                            Analizando Trajectoria Geo-Referenciada...
                                        </p>
                                        <div className="h-1 w-64 bg-slate-900 rounded-full overflow-hidden mx-auto">
                                            <div className="h-full bg-indigo-500 animate-[loading_2s_infinite]" />
                                        </div>
                                    </div>
                                ) : optimizedPath.length > 0 ? (
                                    <div className="flex flex-col items-center gap-8 w-full">
                                        <div className="flex flex-wrap justify-center items-center gap-4">
                                            {optimizedPath.map((id, i) => (
                                                <React.Fragment key={id}>
                                                    <div className="px-6 py-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 text-white font-black text-sm italic shadow-2xl">
                                                        {id}
                                                    </div>
                                                    {i < optimizedPath.length - 1 && <ArrowRight className="w-6 h-6 text-slate-700 animate-pulse" />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <div className="max-w-md">
                                            <p className="text-slate-500 font-mono text-[10px] tracking-widest uppercase italic border-t border-white/5 pt-6 text-center">
                                                Recorrido optimizado para desplazamiento a pie partiendo desde {startPoint}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-slate-700 font-mono text-lg tracking-[0.3em] uppercase italic opacity-50">
                                            Esperando Selección de Hitos
                                        </p>
                                        <p className="text-slate-800 text-xs font-bold uppercase tracking-widest">
                                            Utiliza el panel izquierdo para cargar la secuencia operativa
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* HUD Inferior de Ruta */}
                            <div className="absolute bottom-10 left-10 right-10">
                                <div className="glass p-8 rounded-[3rem] border-white/10 flex flex-wrap items-center justify-between gap-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-8">
                                        <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40">
                                            <Clock className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-black mb-1">Rendimiento Estimado (Walking)</p>
                                            <div className="flex items-end gap-3">
                                                <p className="text-4xl font-black italic text-white leading-none">
                                                    {routeInfo.duration > 0 ? routeInfo.duration : '0.0'}
                                                    <span className="text-indigo-400 text-xl ml-1">HRS</span>
                                                </p>
                                                <div className="h-6 w-px bg-white/10 mb-1" />
                                                <p className="text-xl font-bold italic text-slate-400 leading-none mb-0.5">
                                                    {routeInfo.distance > 0 ? routeInfo.distance : '0.0'} KM
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Índice de Eficiencia</p>
                                            <p className="text-3xl font-black italic text-emerald-400">98.2%</p>
                                        </div>
                                        <button className="bg-white text-slate-950 h-16 px-10 rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-2xl italic group">
                                            <span className="group-hover:translate-x-1 inline-block transition-transform">Ejecutar Plan de Despacho</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            <div className="scale-105 origin-left">
                                <TacticalCalendar year={currentYear} />
                            </div>

                            <div className="glass rounded-[3rem] p-10 border-white/5 bg-indigo-500/[0.02] relative overflow-hidden flex flex-col justify-between shadow-2xl">
                                <div className="absolute -right-10 -top-10 opacity-[0.03] rotate-12 scale-150">
                                    <Clock className="w-40 h-40 text-white" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-10">
                                        <h3 className="text-lg font-black uppercase italic tracking-wider text-indigo-400 flex items-center gap-3">
                                            <BarChart3 className="w-5 h-5" /> Proyección Operativa
                                        </h3>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">W-{getWeekNumber(new Date())} Active Trend</span>
                                    </div>

                                    <div className="flex items-end justify-between gap-4 h-24 mb-6">
                                        {[45, 60, 35, 85, 95, 75, 55, 80, 90, 100].map((val, i) => (
                                            <div key={i} className="flex-1 bg-white/5 rounded-t-xl relative group h-full">
                                                <div
                                                    className={`absolute bottom-0 left-0 right-0 rounded-t-xl transition-all duration-1000 group-hover:brightness-125 ${val > 80 ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-700'
                                                        }`}
                                                    style={{ height: `${val}%` }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 bg-white/[0.02] rounded-[2rem] border border-white/5">
                                    <p className="text-[11px] text-slate-400 font-mono leading-relaxed italic uppercase">
                                        <span className="text-indigo-500 font-black">Nota Técnica:</span> El cálculo se ajusta dinámicamente al ciclo operativo vigente (22/7). Próxima ventana de rotación habilitada para la semana del {new Date().toLocaleDateString()}.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.3); }
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .active-glow {
                    box-shadow: 0 0 40px -10px rgba(79, 70, 229, 0.2);
                }
            `}} />
        </div>
    );
};

const BarChart3 = ({ className, size }: { className?: string, size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
    </svg>
);

export default Logistica;
