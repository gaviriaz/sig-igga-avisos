import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { supabase } from '../lib/supabase';
import { UserPlus, Mail, Lock, User, Loader2, AlertCircle, ShieldCheck, Briefcase } from 'lucide-react';

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
                <div className="flex flex-col items-center gap-6 p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center animate-bounce">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white mb-2 uppercase">¡Cuenta Solicitada!</h3>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">Redirigiendo a la pantalla de acceso en 3 segundos...</p>
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
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre Completo</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <input
                            type="text"
                            required
                            placeholder="Ej: Ing. Juan Pérez"
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm text-white"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Perfil Técnico</label>
                    <div className="relative group">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm text-white appearance-none cursor-pointer"
                        >
                            <option value="Oficina" className="bg-slate-900">Oficina (Analista de Datos)</option>
                            <option value="Analista Ambiental" className="bg-slate-900">Analista Ambiental</option>
                            <option value="Coordinador Predial Junior" className="bg-slate-900">Coordinador Predial Junior</option>
                            <option value="Coordinador Predial Senior" className="bg-slate-900">Coordinador Predial Senior</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Email Corporativo</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <input
                            type="email"
                            required
                            placeholder="juan.perez@igga.com"
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm text-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Contraseña de Acceso</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <input
                            type="password"
                            required
                            placeholder="Mínimo 8 caracteres"
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm text-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl shadow-indigo-600/20 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                    {loading ? 'Procesando Registro...' : 'Crear Cuenta Técnica'}
                </button>

                <div className="text-center mt-4">
                    <p className="text-sm text-slate-500 font-medium">
                        ¿Ya posee credenciales? <Link to="/login" className="text-indigo-400 font-black hover:text-white transition-colors uppercase text-xs tracking-tighter">Acceso Directo</Link>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export default Register;
