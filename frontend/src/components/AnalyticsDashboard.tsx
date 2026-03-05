import React from 'react';
import { useAvisoStore } from '../store/useAvisoStore';
import {
    Zap,
    ShieldAlert,
    TrendingUp,
    PieChart,
    BarChart,
    Calendar,
    Target,
    Activity,
    MapPin
} from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
    const { avisos } = useAvisoStore();

    const criticalCount = avisos.filter(a => a.risk_score > 75).length;
    const mediumCount = avisos.filter(a => a.risk_score > 40 && a.risk_score <= 75).length;
    const lowCount = avisos.filter(a => a.risk_score <= 40).length;

    const sections = [
        { label: 'Norte', count: avisos.filter(a => (a.sector || '').includes('NORTE')).length, color: 'bg-indigo-500' },
        { label: 'Sur', count: avisos.filter(a => (a.sector || '').includes('SUR')).length, color: 'bg-emerald-500' },
        { label: 'Centro', count: avisos.filter(a => (a.sector || '').includes('CENTRO')).length, color: 'bg-amber-500' },
        { label: 'Oriente', count: avisos.filter(a => (a.sector || '').includes('ORIENTE')).length, color: 'bg-rose-500' },
    ];

    const maxSector = Math.max(...sections.map(s => s.count), 1);

    return (
        <div className="h-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* 💎 Main KPIs */}
            <header className="grid grid-cols-4 gap-6">
                {[
                    { label: 'Eficiencia SLA', val: '94.2%', icon: Target, trend: '+2.1%', color: 'text-emerald-400' },
                    { label: 'Carga de Trabajo', val: avisos.length, icon: Activity, trend: 'Normal', color: 'text-indigo-400' },
                    { label: 'Riesgo Promedio', val: '42 pts', icon: ShieldAlert, trend: '-5%', color: 'text-amber-400' },
                    { label: 'Cierre Mensual', val: '128', icon: Calendar, trend: '+12 unidades', color: 'text-white' },
                ].map((kpi, i) => (
                    <div key={i} className="glass p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-white/20 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/5 rounded-2xl text-slate-400 group-hover:text-white transition-colors">
                                <kpi.icon size={20} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${kpi.trend.includes('+') ? 'text-emerald-500' : 'text-slate-500'}`}>
                                {kpi.trend}
                            </span>
                        </div>
                        <p className="text-3xl font-black text-white tracking-tighter mb-1">{kpi.val}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                    </div>
                ))}
            </header>

            <div className="grid grid-cols-3 gap-8">
                {/* 📊 Distribution Chart */}
                <section className="col-span-2 glass rounded-[3rem] p-8 flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">Distribución Geográfica de Avisos</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Análisis por Sector Operativo</p>
                        </div>
                        <BarChart size={20} className="text-indigo-500" />
                    </div>

                    <div className="flex-1 flex flex-col justify-end gap-6 h-64 px-4">
                        <div className="flex items-end justify-between gap-12 h-full">
                            {sections.map((s, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                    <div className="w-full relative flex flex-col justify-end h-full bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                                        <div
                                            className={`${s.color} w-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(99,102,241,0.2)]`}
                                            style={{ height: `${(s.count / maxSector) * 100 || 5}%` }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs font-black text-white">{s.count}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 🎯 Risk Level Breakdown */}
                <section className="glass rounded-[3rem] p-8 flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">Niveles de Amenaza</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Priorización de Despacho</p>
                        </div>
                        <ShieldAlert size={20} className="text-rose-500" />
                    </div>

                    <div className="space-y-6">
                        {[
                            { label: 'Crítico (SLA 24h)', count: criticalCount, color: 'bg-rose-500', pct: (criticalCount / avisos.length) * 100 },
                            { label: 'Medio (SLA 7d)', count: mediumCount, color: 'bg-amber-500', pct: (mediumCount / avisos.length) * 100 },
                            { label: 'Normal (SLA 30d)', count: lowCount, color: 'bg-emerald-500', pct: (lowCount / avisos.length) * 100 },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">{item.label}</span>
                                    <span className="text-white">{item.count}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                                    <div
                                        className={`${item.color} h-full transition-all duration-1000`}
                                        style={{ width: `${item.pct || 10}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp size={16} className="text-indigo-400" />
                            <p className="text-[11px] font-black text-white uppercase italic tracking-tighter">Tendencia Semanal</p>
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Los avisos críticos en el <span className="text-indigo-400">Sector Norte</span> han disminuido un 12% tras la última campaña de poda intensiva.
                        </p>
                    </div>
                </section>
            </div>

            {/* 📍 Hotspot Summary */}
            <footer className="glass rounded-[2.5rem] p-6 flex items-center justify-between border-indigo-500/10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-600" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Hotspot del día:</span>
                    </div>
                    <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/5">Municipio de Barbosa (Antioquia)</span>
                    <span className="text-[10px] font-bold text-rose-500 animate-pulse">8 AVISOS CRÍTICOS ACTIVOS</span>
                </div>
                <button className="h-10 px-6 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
                    Generar Reporte PDF
                </button>
            </footer>
        </div>
    );
};

export default AnalyticsDashboard;
