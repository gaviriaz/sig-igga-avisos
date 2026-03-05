import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, Globe, Database, Map as MapIcon, ChevronRight,
    Activity, Cpu, Lock, Terminal as TerminalIcon, ShieldCheck,
    Zap, Layers, Target, Radio, HardDrive, BarChart3
} from 'lucide-react';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(timer);
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-primary/30 overflow-x-hidden font-sans noise-overlay">
            {/* 🌐 Global Expert Overlays */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 grid-pattern opacity-20" />
                <div className="absolute inset-0 grid-pattern-fine opacity-10" />
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-950 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-950 to-transparent" />

                {/* Expert Light Leaks */}
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[30%] bg-indigo-500/10 blur-[120px] rounded-full animate-float" />
            </div>

            {/* 🛰️ Navbar - Expert Precision */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-8 ${scrolled ? 'h-16 glass-morphism border-b border-white/10' : 'h-24 bg-transparent'}`}>
                <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between">
                    <div className="flex items-center gap-6 cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="relative">
                            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:rotate-[360deg] transition-all duration-1000">
                                <span className="text-xl font-black italic">IG</span>
                            </div>
                            <div className="absolute -inset-1 bg-primary/20 blur-md rounded-xl animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tight leading-none text-white">SIG IGGA <span className="text-primary italic font-black text-xs ml-1">OS</span></span>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">System Status: Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-12">
                        {[
                            { name: 'Infraestructura', path: '/infraestructura' },
                            { name: 'Sistemas GIS', path: '/sistemas-gis' },
                            { name: 'Ciberseguridad', path: '/ciberseguridad' },
                            { name: 'Protocolos', path: '/protocolos' }
                        ].map((item) => (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.path)}
                                className="group relative py-2 bg-transparent border-none cursor-pointer"
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-white transition-colors">{item.name}</span>
                                <span className="absolute bottom-0 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden xl:flex flex-col items-end mr-6 border-r border-white/5 pr-6">
                            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Network Time</span>
                            <span className="text-xs font-mono font-bold text-primary">{currentTime} UTC-5</span>
                        </div>
                        <button onClick={() => navigate('/login')} className="hidden sm:flex text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Acceso Operador</button>
                        <button onClick={() => navigate('/register')} className="btn-primary h-10 px-8 text-[10px] font-black uppercase tracking-widest">Obtener Credenciales</button>
                    </div>
                </div>
            </nav>

            {/* 🛡️ Hero Section - Command Center Command */}
            <header className="relative z-10 pt-44 lg:pt-56 pb-24 px-8">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-12 xl:col-span-7 flex flex-col items-start">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-lg mb-10 group cursor-help">
                            <TerminalIcon size={14} className="text-primary group-hover:rotate-12 transition-transform" />
                            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-primary">SIG-ISA Advanced Deployment</span>
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse ml-2" />
                        </div>

                        <h1 className="text-7xl lg:text-[110px] font-black leading-[0.85] tracking-tighter mb-12">
                            Gestión Espacial <br />
                            <span className="text-shine italic">Alta Precisión</span>
                        </h1>

                        <p className="text-xl lg:text-2xl text-slate-400 max-w-2xl mb-14 leading-relaxed font-medium">
                            La plataforma de ingeniería geoespacial definitiva para el sector energético. Gestión de servidumbres con resolución centimétrica y auditoría total.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6">
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary h-20 px-10 text-lg font-black group"
                            >
                                INICIAR TERMINAL <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="btn-secondary h-20 px-10 text-lg font-black group border-dashed">
                                DESPLEGAR DOCUMENTACIÓN
                                <ChevronRight className="ml-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>

                        {/* Status Accents */}
                        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-12 w-full pt-12 border-t border-white/5">
                            {[
                                { label: 'Latency', value: '14ms', icon: Radio },
                                { label: 'Precision', value: '1.2cm', icon: Target },
                                { label: 'Uptime', value: '99.99%', icon: Activity },
                                { label: 'Security', value: 'AES-512', icon: Lock }
                            ].map((stat) => (
                                <div key={stat.label} className="flex flex-col gap-1 group">
                                    <div className="flex items-center gap-2 mb-1">
                                        <stat.icon size={12} className="text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-[8px] font-mono font-black uppercase tracking-widest text-slate-500">{stat.label}</span>
                                    </div>
                                    <span className="text-lg font-black font-mono text-white group-hover:text-primary transition-colors">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Expert Visual Sidebar */}
                    <div className="hidden xl:flex xl:col-span-5 relative">
                        <div className="w-full h-[700px] glass-morphism rounded-[3rem] relative overflow-hidden scanline group/card border-2 border-primary/20">
                            <div className="absolute top-8 left-8 flex items-center gap-3 z-20">
                                <div className="w-3 h-3 rounded-full bg-rose-500" />
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="ml-4 text-[10px] font-mono font-black uppercase text-slate-500">Live Telemetry Feed</span>
                            </div>

                            <div className="absolute inset-0 bg-slate-950/20 z-10" />
                            <img
                                src="/tech_bg.png"
                                alt="Technical Infrastructure"
                                className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:scale-110 transition-all [transition-duration:3000ms]"
                            />

                            <div className="absolute inset-x-8 bottom-8 z-20 glass h-48 rounded-[2rem] p-8 flex flex-col justify-between border-primary/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                            <Layers size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase tracking-tighter">Vector Layer A-12</h4>
                                            <p className="text-[10px] font-mono font-bold text-slate-500 tracking-widest">LAT: 4.5422 - LNG: -74.1205</p>
                                        </div>
                                    </div>
                                    <div className="w-16 h-1 bg-primary/30 rounded-full" />
                                </div>
                                <div className="flex gap-2">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} className="flex-1 h-8 bg-primary/10 rounded-sm overflow-hidden relative group/bar">
                                            <div className="absolute bottom-0 left-0 w-full bg-primary/40 group-hover:bg-primary transition-all duration-500" style={{ height: `${Math.random() * 80 + 20}%` }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 🧬 Master Architecture - Bento Expertise */}
            <section className="relative z-10 py-32 px-8">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-12">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="w-12 h-px bg-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Scientific Methodology</span>
                            </div>
                            <h2 className="text-6xl font-black mb-8 tracking-tighter leading-[0.95]">Ingeniería Robusta <br /> para Datos <span className="text-primary italic">Masivos</span></h2>
                            <p className="text-xl text-slate-500 font-medium leading-relaxed italic">Arquitectura distribuida capaz de procesar billones de puntos de datos geoespaciales por segundo con redundancia de grado militar.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 h-auto lg:h-[800px]">
                        {/* Huge Bento Feature */}
                        <div className="md:col-span-3 lg:col-span-8 glass-card rounded-[3.5rem] p-12 relative overflow-hidden group">
                            <div className="relative z-20 h-full flex flex-col justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Globe size={40} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2 block">Core Engine</span>
                                        <h3 className="text-4xl font-black italic tracking-tight leading-none uppercase">Geo-Kernel Primaris</h3>
                                    </div>
                                </div>

                                <div className="max-w-xl">
                                    <p className="text-xl text-slate-400 font-medium leading-relaxed mb-10 italic">
                                        Nuestro motor propietario permite la visualización de nubes de puntos LiDAR y modelos 3D sin latencia, integrando capas ambientales, sociales e infraestructura en un solo lienzo táctico.
                                    </p>
                                    <div className="flex gap-4">
                                        {['LiDAR 10bit', 'RTK-Enabled', 'AI Integration'].map(tag => (
                                            <span key={tag} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors cursor-default">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Decorative Grid on Card */}
                            <div className="absolute top-0 right-0 w-1/2 h-full grid-pattern opacity-10 pointer-events-none" />
                        </div>

                        <div className="md:col-span-3 lg:col-span-4 glass-card rounded-[3.5rem] p-12 group flex flex-col justify-between">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-12">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black italic tracking-tight mb-4 uppercase">Protocolo <br /> Cipher-9</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed italic uppercase">Seguridad perimetral digital con encriptación cuántica y auditoría de huella inmutable sobre cada activo del sistema.</p>
                            </div>
                        </div>

                        <div className="md:col-span-2 lg:col-span-4 glass-card rounded-[3.5rem] p-12 group flex flex-col justify-between">
                            <Activity size={40} className="text-amber-500 mb-12" />
                            <div>
                                <p className="text-5xl font-mono font-black tracking-tighter italic mb-2">99.9997%</p>
                                <p className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-slate-500 leading-none">High Reliability Threshold</p>
                            </div>
                        </div>

                        <div className="md:col-span-4 lg:col-span-8 glass-card rounded-[3.5rem] p-12 group relative overflow-hidden flex items-center">
                            <div className="relative z-10 w-full grid grid-cols-2 md:grid-cols-4 gap-8">
                                {[
                                    { icon: HardDrive, label: 'Almacenamiento', val: 'PETABYTE-SCALE' },
                                    { icon: Zap, label: 'Procesamiento', val: 'REAL-TIME OPS' },
                                    { icon: MapIcon, label: 'Cartografía', val: 'VECT-RASTER V5' },
                                    { icon: BarChart3, label: 'Analítica', val: 'PREDICTIVE-BI' }
                                ].map((item) => (
                                    <div key={item.label} className="flex flex-col gap-4 text-center md:text-left">
                                        <item.icon size={24} className="text-primary mx-auto md:mx-0 opacity-50" />
                                        <div>
                                            <p className="text-[8px] font-mono font-black uppercase tracking-widest text-slate-600 mb-1">{item.label}</p>
                                            <p className="text-xs font-mono font-black text-white">{item.val}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 🏁 Expert Footer - Technical Signature */}
            <footer className="relative z-10 pt-40 pb-20 border-t border-white/5 bg-slate-950/80 backdrop-blur-3xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <div className="absolute inset-0 grid-pattern opacity-5 pointer-events-none" />

                <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-20">
                    <div className="lg:col-span-5">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40">
                                <span className="text-2xl font-black italic">SIG</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-black tracking-tighter italic leading-none text-white uppercase">SIG IGGA</span>
                                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.4em]">Enterprise Territorial Platform</span>
                            </div>
                        </div>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed italic max-w-md mb-12">
                            Transformando la ingeniería civil y eléctrica mediante una capa digital de inteligencia suprema. Gestión de infraestructura crítica para un futuro interconectado.
                        </p>
                        <div className="flex items-center gap-4 text-[9px] font-mono font-black uppercase tracking-[0.5em] text-slate-700">
                            <span>Precision</span>
                            <span className="w-1 h-1 rounded-full bg-slate-800" />
                            <span>Traction</span>
                            <span className="w-1 h-1 rounded-full bg-slate-800" />
                            <span>Dominion</span>
                        </div>
                    </div>

                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-16">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-10 border-b border-white/5 pb-4">Despliegues</h4>
                            <ul className="space-y-6 text-xs font-bold text-slate-600">
                                {['Terminal GIS v7.8', 'Auditoría Predial', 'SLA Analytics', 'Cloud Sync Gateway'].map(li => (
                                    <li key={li} className="hover:text-primary transition-colors cursor-pointer group flex items-center gap-2 italic uppercase">
                                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-all -ml-4 group-hover:ml-0" />
                                        {li}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-10 border-b border-white/5 pb-4">Seguridad</h4>
                            <ul className="space-y-6 text-xs font-bold text-slate-600">
                                {['ISO/IEC 27001', 'SOC2 Compliance', 'Encripción RSA', 'Multi-Tenant Isolation'].map(li => (
                                    <li key={li} className="hover:text-primary transition-colors cursor-pointer group flex items-center gap-2 italic uppercase">
                                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-all -ml-4 group-hover:ml-0" />
                                        {li}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-10 border-b border-white/5 pb-4">Soporte</h4>
                            <ul className="space-y-6 text-xs font-bold text-slate-600">
                                {['NOC Command', 'Knowledge Base', 'L1-L3 Support', 'System Specs'].map(li => (
                                    <li key={li} className="hover:text-primary transition-colors cursor-pointer group flex items-center gap-2 italic uppercase">
                                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-all -ml-4 group-hover:ml-0" />
                                        {li}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-40 pt-10 border-t border-white/5 flex flex-col items-center text-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-[0.6em] mb-1">
                            © 2026 DGZ ENGINEERING GROUP <span className="mx-4 text-slate-800">|</span> IGGA PLATFORM OS X-TERMINAL
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="w-8 h-px bg-slate-900" />
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">All systems operating within nominal parameters.</span>
                            <span className="w-8 h-px bg-slate-900" />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
