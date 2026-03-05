import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { supabase } from '../lib/supabase';
import { UserPlus, Mail, Lock, User, Loader2, AlertCircle, ShieldCheck, Briefcase, CheckCircle2 } from 'lucide-react';

const Register: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Oficina');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        role: role
                    }
                }
            });

            if (signUpError) throw signUpError;
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Error al crear la cuenta');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout title="Registro Exitoso" subtitle="Revise su correo para confirmar su cuenta.">
                <div className="flex flex-col items-center gap-8 p-10 glass-morphism rounded-[3rem] text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 size={40} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">¡Misión Cumplida!</h3>
                        <p className="text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">Su solicitud ha sido procesada. Redirigiendo a la terminal de acceso...</p>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 animate-[progress_3s_linear]" />
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Nuevo Operador"
            subtitle="Cree su perfil técnico para acceder a los activos SIG ISA."
        >
            <form onSubmit={handleRegister} className="flex flex-col gap-6">
                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold animate-in fade-in zoom-in duration-300">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <div className="flex flex-col gap-2 group/field">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4 group-focus-within/field:text-primary transition-colors">Nombre de Operador</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            required
                            placeholder="Ej: Ing. Juan Pérez"
                            className="input-premium w-full pl-12"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2 group/field">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4 group-focus-within/field:text-primary transition-colors">Rango / Perfil</label>
                    <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-primary transition-colors" size={18} />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="input-premium w-full pl-12 appearance-none cursor-pointer"
                        >
                            <option value="Oficina" className="bg-slate-900 font-bold">Oficina (Analista de Datos)</option>
                            <option value="Analista Ambiental" className="bg-slate-900 font-bold">Analista Ambiental</option>
                            <option value="Coordinador Predial Junior" className="bg-slate-900 font-bold">Coordinador Predial Junior</option>
                            <option value="Coordinador Predial Senior" className="bg-slate-900 font-bold">Coordinador Predial Senior</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-2 group/field">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4 group-focus-within/field:text-primary transition-colors">Correo Institucional</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-primary transition-colors" size={18} />
                        <input
                            type="email"
                            required
                            placeholder="juan.perez@igga.com"
                            className="input-premium w-full pl-12"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2 group/field">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4 group-focus-within/field:text-primary transition-colors">Seguridad de Acceso</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-primary transition-colors" size={18} />
                        <input
                            type="password"
                            required
                            placeholder="Mínimo 8 caracteres"
                            className="input-premium w-full pl-12"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary h-14 w-full text-sm uppercase tracking-[0.2em] font-black mt-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                    {loading ? 'Validando...' : 'Obtener Acceso Técnico'}
                </button>

                <div className="text-center mt-6">
                    <p className="text-sm text-slate-500 font-medium">
                        ¿Ya posee credenciales? <br />
                        <Link to="/login" className="text-primary font-black hover:text-white transition-colors uppercase text-xs tracking-tighter mt-2 inline-block">Acceso Directo a Terminal</Link>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export default Register;

