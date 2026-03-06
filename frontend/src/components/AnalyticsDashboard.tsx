import React, { useState, useEffect } from 'react';
import { useAvisoStore } from '../store/useAvisoStore';
import { getApiUrl } from '../config/api';
import {
    Zap, ShieldAlert, TrendingUp, BarChart, Calendar,
    Target, Activity, MapPin, Loader2, Gauge
} from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
    const { avisos } = useAvisoStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const baseUrl = await getApiUrl();
                const res = await fetch(`${baseUrl}/stats/strategic`);
                const data = await res.json();
                setStats(data);
            } catch (e) {
                console.error("Error fetching stats", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [avisos]);

    if (loading || !stats) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <Gauge className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={24} />
                </div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Compilando Inteligencia Estratégica...</p>
            </div>
        );
    }

    const { summary, top_municipios, by_state } = stats;

    return (
        <div className="h-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 p-2">
            {/* 💎 Main KPIs Ejecutivo */}
            <header className="grid grid-cols-4 gap-6">
                {[
                    { label: 'Eficiencia SLA', val: `${summary.sla_efficiency}%`, icon: Target, trend: 'Global', color: 'text-emerald-400' },
                    { label: 'Carga Sistémica', val: summary.total, icon: Activity, trend: 'Total Avisos', color: 'text-indigo-400' },
                    { label: 'Alertas Críticas', val: summary.critical, icon: ShieldAlert, trend: 'Nivel 1', color: 'text-rose-400' },
                    { label: 'Nuevos de Semana', val: `+${summary.new_this_week}`, icon: Calendar, trend: 'Tendencia', color: 'text-white' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/5 rounded-2xl text-slate-400 group-hover:text-indigo-400 transition-colors">
                                <kpi.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">
                                {kpi.trend}
                            </span>
                        </div>
                        <p className={`text-4xl font-black ${kpi.color} tracking-tighter mb-1`}>{kpi.val}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <kpi.icon size={80} />
                        </div>
                    </div>
                ))}
            </header>

            <div className="grid grid-cols-3 gap-8">
                {/* 📊 Territorial Distribution (Real data from Top Municipios) */}
                <section className="col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[3rem] p-8 flex flex-col gap-8 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">Distribución Territorial (Top 5 Municipios)</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Análisis de Concentración Operativa</p>
                        </div>
                        <BarChart size={20} className="text-indigo-500" />
                    </div>

                    <div className="flex-1 flex flex-col justify-end gap-6 h-64 px-4">
                        <div className="flex items-end justify-between gap-12 h-full">
                            {top_municipios.map((m: any, i: number) => {
                                const maxVal = Math.max(...top_municipios.map((mx: any) => mx.count), 1);
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                        <div className="w-full relative flex flex-col justify-end h-full bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                                            <div
                                                className="bg-gradient-to-t from-indigo-600 to-indigo-400 w-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                                style={{ height: `${(m.count / maxVal) * 100}%` }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-xs font-black text-white">{m.count}</span>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center truncate w-full">{m.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 🎯 Workflow Health Breakdown */}
                <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[3rem] p-8 flex flex-col gap-8 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">Salud del Workflow</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Status en Tiempo Real</p>
                        </div>
                        <ShieldAlert size={20} className="text-rose-500" />
                    </div>

                    <div className="space-y-6">
                        {[
                            { label: 'INGRESADO / PENDIENTE', count: by_state['INGRESADO'] || 0, color: 'bg-indigo-500' },
                            { label: 'EN GESTIÓN CAMPO (GPRE/PRER)', count: (by_state['GPRE'] || 0) + (by_state['PRER'] || 0), color: 'bg-amber-500' },
                            { label: 'VALIDACIÓN / QA', count: (by_state['VALIDAR_QA'] || 0) + (by_state['VALIDAR'] || 0), color: 'bg-emerald-500' },
                            { label: 'CERRADOS / APROBADOS', count: (by_state['CERRADO'] || 0) + (by_state['APROBADO'] || 0), color: 'bg-slate-600' },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">{item.label}</span>
                                    <span className="text-white">{item.count}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                                    <div
                                        className={`${item.color} h-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.05)]`}
                                        style={{ width: `${(item.count / summary.total) * 100 || 5}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp size={16} className="text-indigo-400" />
                            <p className="text-[11px] font-black text-white uppercase italic tracking-tighter">Resumen IA Senior Master</p>
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            {summary.overdue > 0 ? (
                                <>Detectamos <span className="text-rose-400">{summary.overdue} avisos con SLA vencido</span>. Se recomienda priorizar la asignación en municipios del Top Territorial.</>
                            ) : (
                                <>El sistema opera bajo <span className="text-emerald-400">Eficiencia Óptima</span>. Todos los avisos están capturados dentro de su ventana de gestión.</>
                            )}
                        </p>
                    </div>
                </section>
            </div>

            {/* 📍 Hotspot & Analytics Summary */}
            <footer className="bg-slate-900/60 backdrop-blur-lg rounded-[2.5rem] p-6 flex items-center justify-between border border-white/5 shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Foco Operativo:</span>
                    </div>
                    {top_municipios.length > 0 ? (
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 bg-indigo-500/10 rounded-lg text-[10px] font-black text-indigo-300 uppercase tracking-widest border border-indigo-500/20">
                                {top_municipios[0].name}
                            </span>
                            <span className="text-[10px] font-bold text-rose-500 animate-pulse">
                                {top_municipios[0].count} AVISOS DETECTADOS
                            </span>
                        </div>
                    ) : (
                        <span className="text-[10px] font-bold text-slate-500">SIN NOVEDADES RECIENTES</span>
                    )}
                </div>
                <div className="text-[10px] font-black text-slate-600 italic">
                    Última Sincronización: {new Date(stats.timestamp).toLocaleTimeString()}
                </div>
            </footer>
        </div>
    );
};

export default AnalyticsDashboard;
