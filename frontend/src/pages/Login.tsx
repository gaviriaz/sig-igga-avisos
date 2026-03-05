import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, LogIn, Loader2, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signIn } = useAuthStore();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            if (data.user) {
                await signIn(data.user);
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Inicie Sesión"
            subtitle="Acceda a su panel de control territorial para continuar."
        >
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Email Corporativo</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <input
                            type="email"
                            required
                            placeholder="nombre@igga.com"
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm text-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contraseña Seguridad</label>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <input
                            type="password"
                            required
                            placeholder="••••••••••••"
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
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                    {loading ? 'Validando Credenciales...' : 'Entrar al Sistema'}
                </button>

                <div className="mt-6 flex items-center justify-center gap-3">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase italic">O continuar con</span>
                    <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="text-center">
                    <p className="text-sm text-slate-500 font-medium">
                        ¿Aún no tiene cuenta activa? <br />
                        <Link to="/register" className="text-indigo-400 font-black hover:text-white transition-colors uppercase text-xs tracking-tighter">Solicitar Acceso Ahora</Link>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export default Login;
