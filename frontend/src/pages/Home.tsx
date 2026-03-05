import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Globe, BarChart3, Database, Map as MapIcon } from 'lucide-react';

const Home: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 overflow-x-hidden">
            {/* ✨ Background Decorative Elements */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
            </div>

            {/* 🧭 Navbar */}
            <nav className="relative z-10 h-24 px-12 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span className="text-lg font-black italic">IG</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">SIG IGGA / ISA</span>
                </div>
                <div className="flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Características</a>
                    <a href="#tech" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Tecnología</a>
                    <button
                        onClick={() => navigate('/login')}
                        className="h-11 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all"
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => navigate('/register')}
                        className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        Registrarse
                    </button>
                </div>
            </nav>

            {/* 🚀 Hero Section */}
            <header className="relative z-10 pt-32 pb-20 px-8 flex flex-col items-center text-center">
                <div className="mb-6 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Plataforma de Gestión Territorial v7.5</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black mb-8 max-w-5xl leading-[1.1] tracking-tight text-shine">
                    Gestión Integral de Infraestructura <br /> <span className="text-slate-500">en Tiempo Real</span>
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
                    Visualización avanzada de activos, gestión predial y monitoreo de servidumbres para el sector energético. Potenciado por motores GIS de alta fidelidad.
                </p>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="h-16 px-10 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-lg font-bold shadow-2xl shadow-indigo-600/20 flex items-center gap-3 transition-all group scale-100 hover:scale-105 active:scale-95"
                    >
                        Acceder al Sistema <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="h-16 px-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-lg font-bold flex items-center gap-3 transition-all">
                        Explorar Demo
                    </button>
                </div>
            </header>

            {/* 📊 Metrics Grid */}
            <section className="relative z-10 max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Torres Monitoreadas', value: '19,521', icon: BarChart3, color: 'text-indigo-400' },
                    { label: 'Kilómetros de Red', value: '2,480 km', icon: Globe, color: 'text-emerald-400' },
                    { label: 'Gestión Predial', value: '18,194', icon: Database, color: 'text-amber-400' }
                ].map((stat, idx) => (
                    <div key={idx} className="glass p-8 rounded-[2.5rem] hover:border-white/20 transition-all group">
                        <div className={`w-12 h-12 ${stat.color} bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-4xl font-black mb-2 tracking-tight">{stat.value}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    </div>
                ))}
            </section>

            {/* 🛠️ Features Section */}
            <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 py-32 border-t border-white/5">
                <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl font-black mb-4 tracking-tight">Capacidades del Ecosistema SIG</h2>
                        <p className="text-slate-400 text-lg">Diseñado para la toma de decisiones basada en datos espaciales con precisión milimétrica.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500/30" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500/30" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'Motor GIS 60FPS', desc: 'Renderizado asíncrono de millones de puntos sin lag.', icon: MapIcon },
                        { title: 'Seguridad Militar', desc: 'Auth robusto y trazabilidad total de acciones.', icon: Shield },
                        { title: 'Sincronización Cloud', desc: 'Conexión directa con SharePoint y Supabase.', icon: Database },
                        { title: 'Alertas IA', desc: 'Análisis de riesgos y detección de intrusiones.', icon: Zap }
                    ].map((f, idx) => (
                        <div key={idx} className="p-8 rounded-[2rem] border border-white/5 hover:bg-white/5 transition-all outline outline-0 hover:outline-1 outline-white/10">
                            <f.icon size={32} className="text-indigo-400 mb-6" />
                            <h3 className="text-lg font-bold mb-3">{f.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 🏁 Footer */}
            <footer className="relative z-10 py-20 border-t border-white/5 bg-slate-950">
                <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
                    <div>
                        <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-black italic">IG</span>
                            </div>
                            <span className="font-bold">SIG IGGA</span>
                        </div>
                        <p className="text-sm text-slate-500 max-w-sm">
                            Soluciones geoespaciales avanzadas para el desarrollo sostenible de infraestructura crítica.
                        </p>
                    </div>
                    <div className="flex gap-12">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Plataforma</h4>
                            <ul className="space-y-3 text-sm font-medium text-slate-400">
                                <li>Mapa</li>
                                <li>Avisos</li>
                                <li>SLA Metrics</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Compañía</h4>
                            <ul className="space-y-3 text-sm font-medium text-slate-400">
                                <li>Soporte</li>
                                <li>Privacidad</li>
                                <li>Contacto</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-20 text-center text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em]">
                    © 2026 IGGA SAS & ISA INTERCONEXIÓN ELÉCTRICA S.A.
                </div>
            </footer>
        </div>
    );
};

export default Home;
