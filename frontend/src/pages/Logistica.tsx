import React, { useState, useEffect } from 'react';
import {
    Calendar,
    MapPin,
    Truck,
    Navigation,
    Clock,
    ChevronRight,
    Filter,
    CheckCircle2,
    AlertCircle,
    User,
    ArrowRight
} from 'lucide-react';
import { getColombiaHolidays, getWeekNumber, Holiday } from '../utils/colombiaCalendar';

// Mock data para los avisos
const MOCK_AVISOS = [
    { id: 'AV-001', ciudad: 'Bucaramanga (Centro)', tipo: 'Inspección', coords: [-73.1198, 7.1193] },
    { id: 'AV-002', ciudad: 'Girón', tipo: 'Auditoría', coords: [-73.1667, 7.0667] },
    { id: 'AV-003', ciudad: 'Piedecuesta', tipo: 'Protocolo', coords: [-73.0495, 6.9875] },
    { id: 'AV-004', ciudad: 'Labateca', tipo: 'Inspección', coords: [-72.4950, 7.3150] },
    { id: 'AV-005', ciudad: 'Floridablanca', tipo: 'SLA Analysis', coords: [-73.0864, 7.0621] },
];

const Logistica: React.FC = () => {
    const [selectedAvisos, setSelectedAvisos] = useState<string[]>([]);
    const [currentYear] = useState(new Date().getFullYear());
    const [holidays] = useState<Holiday[]>(getColombiaHolidays(currentYear));
    const [gestorPos, setGestorPos] = useState('Bucaramanga - Oficinas Centrales');
    const [workCycle] = useState({ work: 22, rest: 7 });
    const [isOptimizing, setIsOptimizing] = useState(false);

    // Toggle selección de aviso
    const toggleAviso = (id: string) => {
        setSelectedAvisos(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    // Lógica de Optimización Táctica Real (OSRM API - Open Source)
    const [optimizedPath, setOptimizedPath] = useState<string[]>([]);
    const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });

    const optimizeRoute = async () => {
        if (selectedAvisos.length === 0) return;
        setIsOptimizing(true);

        try {
            const selectedData = MOCK_AVISOS.filter(a => selectedAvisos.includes(a.id));
            const originCoords = [-73.1198, 7.1193];
            const coordsString = [originCoords, ...selectedData.map(a => a.coords)]
                .map(c => `${c[0]},${c[1]}`)
                .join(';');

            const response = await fetch(`https://router.project-osrm.org/dtm/driving/${coordsString}?overview=false`);
            // Nota: Se usa dtm para obtener la matriz de duraciones si se quisiera TSP real
            // Por ahora usamos route para obtener la trayectoria simple
            const routeResponse = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=false`);
            const data = await routeResponse.json();

            if (data.code === 'Ok') {
                setOptimizedPath(selectedAvisos);
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

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-primary/30">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <main className="relative z-10 p-4 md:p-8 max-w-[1400px] mx-auto space-y-8">
                {/* Header Táctico */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Truck className="w-8 h-8 text-primary animate-pulse" />
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
                                Logistic <span className="text-primary">Command</span> Center
                            </h1>
                        </div>
                        <p className="text-slate-400 font-mono text-sm tracking-widest border-l-2 border-primary pl-4">
                            SISTEMA DE ASIGNACIÓN Y RUTA EFICIENTE OS // v1.2.0
                        </p>
                    </div>

                    <div className="glass px-6 py-3 rounded-2xl border-white/5 flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Semana Actual</p>
                            <p className="text-2xl font-black text-primary italic">W-{getWeekNumber(new Date())}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div className="text-center">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Ciclo Laboral</p>
                            <p className="text-2xl font-black italic">{workCycle.work}/{workCycle.rest}</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Panel Izquierdo: Avisos y Selección */}
                    <aside className="lg:col-span-4 space-y-6">
                        <section className="glass rounded-[2.5rem] p-6 border-white/5 relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black uppercase italic tracking-wider flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-primary" /> Inventario de Avisos
                                </h3>
                                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-black">
                                    {MOCK_AVISOS.length} DISNIBLES
                                </span>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {MOCK_AVISOS.map((aviso) => (
                                    <div
                                        key={aviso.id}
                                        onClick={() => toggleAviso(aviso.id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group/item ${selectedAvisos.includes(aviso.id)
                                            ? 'bg-primary/10 border-primary/30'
                                            : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedAvisos.includes(aviso.id) ? 'bg-primary text-slate-950' : 'bg-slate-900 text-slate-400'
                                                }`}>
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm">{aviso.id}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold">
                                                    <MapPin className="w-3 h-3" /> {aviso.ciudad}
                                                </div>
                                            </div>
                                        </div>
                                        {selectedAvisos.includes(aviso.id) && (
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Configuración de Origen */}
                        <section className="glass rounded-[2rem] p-6 border-white/5">
                            <h3 className="text-sm font-black uppercase italic tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                <User className="w-4 h-4" /> Configuración Despacho
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Punto de Inicio</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={gestorPos}
                                            onChange={(e) => setGestorPos(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
                                        />
                                        <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                                    </div>
                                </div>
                                <button
                                    className="btn-primary w-full py-4 text-xs font-black uppercase italic tracking-[0.2em] group disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={selectedAvisos.length === 0 || isOptimizing}
                                    onClick={optimizeRoute}
                                >
                                    {isOptimizing ? 'Calculando Vuelo...' : 'Optimizar Recorrido'}
                                    <Navigation className="w-4 h-4 ml-2 group-hover:rotate-45 transition-transform" />
                                </button>
                            </div>
                        </section>
                    </aside>

                    {/* Panel Central: Mapa y Planificación */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Mapa Táctico Placeholder */}
                        <section className="glass rounded-[3rem] h-[500px] border-white/5 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center">
                                <div className="p-8 rounded-full bg-primary/5 border border-primary/10 animate-pulse mb-4">
                                    <Navigation className="w-16 h-16 text-primary/30 rotate-45" />
                                </div>
                                {isOptimizing ? (
                                    <p className="text-primary font-mono text-sm tracking-widest animate-pulse uppercase italic">
                                        Calculating optimal trajectories...
                                    </p>
                                ) : optimizedPath.length > 0 ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            {optimizedPath.map((id, i) => (
                                                <React.Fragment key={id}>
                                                    <div className="glass px-3 py-1 rounded-lg border-primary/30 text-primary font-black text-[10px]">{id}</div>
                                                    {i < optimizedPath.length - 1 && <ArrowRight className="w-4 h-4 text-slate-600" />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <p className="text-slate-500 font-mono text-[9px] tracking-widest uppercase italic">
                                            Route Optimized for {gestorPos}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 font-mono text-sm tracking-widest animate-pulse uppercase italic">
                                        Initializing OpenStreetMap Grid...
                                    </p>
                                )}
                            </div>

                            {/* HUD Controles Mapa */}
                            <div className="absolute top-6 right-6 space-y-2">
                                <div className="glass p-2 rounded-xl border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>

                            {/* Info de Ruta */}
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="glass p-6 rounded-[2rem] border-white/10 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                            < Clock className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Tiempo Estimado</p>
                                            <p className="text-xl font-black italic">{routeInfo.duration > 0 ? routeInfo.duration : '4.2'} HORAS <span className="text-slate-500 font-normal text-xs font-mono ml-2">// {routeInfo.distance > 0 ? routeInfo.distance + ' KM' : 'TOTAL ROUTE'}</span></p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Eficiencia</p>
                                            <p className="text-xl font-black italic text-emerald-400">94.8%</p>
                                        </div>
                                        <button className="bg-white text-slate-950 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors italic">
                                            Asignar Ruta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Calendario de Festivos y Ciclos Laborales */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass rounded-[2rem] p-6 border-white/5">
                                <h3 className="text-sm font-black uppercase italic tracking-wider text-slate-300 mb-6 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" /> Festivos Colombia {currentYear}
                                </h3>
                                <div className="space-y-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                    {holidays.map((h, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                                            <span className="text-sm font-bold text-slate-400">{h.name}</span>
                                            <span className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded text-primary">{h.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass rounded-[2rem] p-6 border-white/5 bg-primary/5 relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 opacity-5 rotate-12">
                                    <Clock className="w-24 h-24" />
                                </div>
                                <h3 className="text-sm font-black uppercase italic tracking-wider text-primary mb-4">Cronograma de Rendimiento</h3>
                                <div className="flex items-end justify-between gap-2 h-16 mb-4">
                                    {[65, 80, 45, 90, 70, 85, 95].map((val, i) => (
                                        <div key={i} className="flex-1 bg-primary/20 rounded-t-lg relative group">
                                            <div
                                                className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all duration-1000"
                                                style={{ height: `${val}%` }}
                                            ></div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono leading-relaxed italic uppercase">
                                    * Cálculo basado en ciclo 22/7. Próxima rotación de descanso estimada en 12 días calendarios.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(239, 68, 68, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(239, 68, 68, 0.5); }
            `}} />
        </div>
    );
};

export default Logistica;
