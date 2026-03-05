import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Server, Activity, Shield, Cpu, ArrowLeft,
    Layers, Terminal as TerminalIcon, Radio, Database,
    Zap, HardDrive, Share2, Globe
} from 'lucide-react';

const Infraestructura: React.FC = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-primary/30 overflow-x-hidden font-sans noise-overlay">
            {/* Global Overlays */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 grid-pattern opacity-20" />
                <div className="absolute inset-0 grid-pattern-fine opacity-10" />
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-950 to-transparent" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 h-24 glass-morphism border-b border-white/10 px-8">
                <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between">
                    <div className="flex items-center gap-6 cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10">
                            <ArrowLeft size={20} className="text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tight leading-none text-white uppercase italic">Infraestructura <span className="text-primary ml-1">OS</span></span>
                            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Core Deployment Assets</span>
                        </div>
                    </div>
                    <div className="hidden xl:flex flex-col items-end border-r border-white/5 pr-6">
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Network Status</span>
                        <span className="text-xs font-mono font-bold text-emerald-500">OPTIMAL / {currentTime}</span>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-44 pb-32 px-8">
                <div className="max-w-[1400px] mx-auto">
                    {/* Hero Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-32 items-center">
                        <div className="lg:col-span-12 xl:col-span-7">
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-lg mb-10">
                                <Server size={14} className="text-primary" />
                                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-primary">High-Availability Architecture</span>
                            </div>
                            <h1 className="text-7xl lg:text-[100px] font-black leading-[0.85] tracking-tighter mb-10 italic">
                                Arquitectura de <br />
                                <span className="text-shine">Grado Militar</span>
                            </h1>
                            <p className="text-xl text-slate-400 font-medium leading-relaxed italic max-w-2xl">
                                Despliegue distribuido con redundancia global, diseñado para soportar las operaciones críticas de infraestructura energética con latencia mínima.
                            </p>
                        </div>

                        <div className="hidden lg:flex lg:col-span-5">
                            <div className="w-full glass-card rounded-[3rem] p-12 border-2 border-primary/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 grid-pattern opacity-20" />
                                <Cpu size={64} className="text-primary mb-8 group-hover:scale-110 transition-transform duration-1000" />
                                <h3 className="text-2xl font-black italic uppercase tracking-tight mb-4">Compute Engine</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Cloud Provider', val: 'AWS / AZURE HYBRID' },
                                        { label: 'Region', val: 'US-EAST-1 (COL-SOUTH-1)' },
                                        { label: 'Core Specs', val: '64-VCPU / 256GB RAM' }
                                    ].map(item => (
                                        <div key={item.label} className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{item.label}</span>
                                            <span className="text-[10px] font-mono font-black text-white">{item.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bento Grid - Audience vs Expert */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-auto lg:h-[700px]">
                        {/* Non-Expert Section */}
                        <div className="lg:col-span-6 glass-morphism rounded-[3.5rem] p-16 relative overflow-hidden group border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                            <div className="absolute top-0 right-0 w-full h-1 bg-emerald-500 opacity-50" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-12">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                                        <Activity size={24} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Visión de Usuario</span>
                                </div>
                                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-8 tracking-tight">Eficacia y <br /> Confiabilidad Total</h2>
                                <p className="text-lg text-slate-400 font-medium leading-relaxed mb-12 italic">
                                    Nuestra infraestructura garantiza que el sistema esté disponible el 99.99% del tiempo. Esto significa que usted puede gestionar sus activos sin interrupciones, con la seguridad de que sus datos están protegidos y accesibles desde cualquier lugar.
                                </p>
                                <ul className="space-y-4">
                                    {['Carga Instantánea de Mapas', 'Acceso Remoto 24/7', 'Copias de Seguridad Automáticas'].map(item => (
                                        <li key={item} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Expert Section */}
                        <div className="lg:col-span-6 glass-card rounded-[3.5rem] p-16 relative overflow-hidden group border-primary/10 hover:border-primary/40 transition-all scanline">
                            <div className="absolute top-0 right-0 w-full h-1 bg-primary opacity-50" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-12">
                                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                        <TerminalIcon size={24} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Expert Documentation</span>
                                </div>
                                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-8 tracking-tight">Especificaciones <br /> de Bajo Nivel</h2>
                                <div className="grid grid-cols-2 gap-8 mb-12">
                                    {[
                                        { label: 'DB Engine', val: 'PostgreSQL 16' },
                                        { label: 'Caching', val: 'Redis v7.2-L1' },
                                        { label: 'Latency', val: '< 20ms Edge' },
                                        { label: 'Encryption', val: 'TLS 1.3 v-RSA' }
                                    ].map(spec => (
                                        <div key={spec.label}>
                                            <p className="text-[9px] font-mono font-black text-slate-600 uppercase tracking-widest">{spec.label}</p>
                                            <p className="text-lg font-mono font-black text-white">{spec.val}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed italic uppercase">
                                    Utilizamos un stack de microservicios contenerizados en Docker con orquestación automática, permitiendo un escalado vertical dinámico basado en la densidad de avisos activos.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Signature */}
                    <div className="mt-40 pt-20 border-t border-white/5 flex flex-col items-center gap-8 opacity-40">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-black italic">IG</span>
                        </div>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.8em]">End of Core Infrastructure Document</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Infraestructura;
