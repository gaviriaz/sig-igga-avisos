import React from 'react';
import { ArrowLeft, Globe2, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 flex selection:bg-primary/30 selection:text-white noise-overlay">
            {/* 🟦 Left: Decorative Brand Panel - Evolved */}
            <div className="hidden lg:flex w-[45%] h-screen sticky top-0 p-16 flex-col justify-between bg-slate-950 border-r border-white/5 relative overflow-hidden group">
                {/* Dynamic Background Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-primary/20 blur-[120px] rounded-full animate-float opacity-50" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-150" />
                </div>

                <div className="relative z-10 flex items-center gap-4 cursor-pointer group/logo" onClick={() => navigate('/')}>
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 group-hover/logo:scale-110 transition-transform">
                        <span className="text-xl font-black italic">IG</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">SIG IGGA</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Geospatial Enterprise</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                        <Zap size={10} fill="currentColor" /> Nova Project v7.5
                    </div>
                    <h2 className="text-5xl font-black mb-8 leading-[1.1] tracking-tight text-white">
                        Infraestructura Crítica <br />
                        <span className="text-slate-500">Bajo Control Total.</span>
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed font-medium">
                        Plataforma unificada para la gestión territorial y monitoreo de activos eléctricos con inteligencia geoespacial de alta fidelidad.
                    </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-4">
                    <div className="p-6 glass-morphism rounded-[2rem] flex flex-col gap-3 group/stat">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover/stat:scale-110 transition-transform">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <span className="block text-2xl font-black text-white">100%</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trazabilidad</span>
                        </div>
                    </div>
                    <div className="p-6 glass-morphism rounded-[2rem] flex flex-col gap-3 group/stat">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover/stat:scale-110 transition-transform">
                            <Globe2 size={20} />
                        </div>
                        <div>
                            <span className="block text-2xl font-black text-white">Real-Time</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sincronización</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ⬜ Right: Form Panel */}
            <div className="flex-1 flex flex-col p-12 lg:p-24 justify-center items-center relative">
                <div className="w-full max-w-sm relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 text-sm font-bold group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Inicio
                    </button>

                    <h1 className="text-4xl font-black mb-4 text-white uppercase tracking-tighter leading-none">{title}</h1>
                    <p className="text-slate-500 mb-10 text-lg font-medium">{subtitle}</p>

                    <div className="relative">
                        {children}
                    </div>
                </div>

                <div className="absolute bottom-12 text-[10px] font-black text-slate-800 uppercase tracking-[0.5em]">
                    Encrypted Asset Management Protocol
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;

