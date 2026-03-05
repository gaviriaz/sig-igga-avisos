import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 flex selection:bg-indigo-500/30">
            {/* 🟦 Left: Decorative Brand Panel */}
            <div className="hidden lg:flex w-[40%] h-screen sticky top-0 p-12 flex-col justify-between bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 border-r border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-indigo-500/10" />
                </div>

                <div className="relative z-10 flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                        <span className="text-lg font-black italic">IG</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white uppercase italic">SIG IGGA / ISA</span>
                </div>

                <div className="relative z-10">
                    <h2 className="text-4xl font-black mb-6 leading-tight tracking-tight">El futuro de la gestión <br /> territorial comienza aquí.</h2>
                    <p className="text-slate-400 max-w-sm leading-relaxed">Únase a la plataforma de monitoreo de infraestructura más avanzada de la región con precisión de grado operativo.</p>
                </div>

                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
                        <span className="text-xs font-black text-indigo-400 mb-1">99.9%</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Uptime</span>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
                        <span className="text-xs font-black text-emerald-400 mb-1">0ms</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Latency</span>
                    </div>
                </div>
            </div>

            {/* ⬜ Right: Form Panel */}
            <div className="flex-1 flex flex-col p-12 justify-center items-center">
                <div className="w-full max-w-md">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 text-sm font-bold group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Inicio
                    </button>

                    <h1 className="text-3xl font-black mb-3 text-shine uppercase tracking-tight">{title}</h1>
                    <p className="text-slate-500 mb-10 font-medium">{subtitle}</p>

                    {children}
                </div>

                <div className="mt-20 text-[10px] font-black text-slate-800 uppercase tracking-widest">
                    Seguridad Cifrada de Punta a Punta
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
