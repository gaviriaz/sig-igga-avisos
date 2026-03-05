import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, LogIn, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

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
            title="Bienvenido de Nuevo"
            subtitle="Acceda a su terminal de operaciones territoriales."
        >
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold animate-in fade-in zoom-in duration-300">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <div className="flex flex-col gap-2 group/field">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4 group-focus-within/field:text-primary transition-colors">Identidad Digital</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-primary transition-colors" size={18} />
                        <input
                            type="email"
                            required
                            placeholder="nombre@igga.com"
                            className="input-premium w-full pl-12"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2 group/field">
                    <div className="flex items-center justify-between px-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Clave de Acceso</label>
                        <Link to="#" className="text-[10px] font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-widest">¿Olvidó su clave?</Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/field:text-primary transition-colors" size={18} />
                        <input
                            type="password"
                            required
                            placeholder="••••••••••••"
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
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                    {loading ? 'Sincronizando...' : 'Autenticar en el Sistema'}
                </button>

                <div className="mt-8 flex items-center justify-center gap-4">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Procedimiento Externo</span>
                    <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="text-center group/register">
                    <p className="text-sm text-slate-500 font-medium">
                        ¿No tiene autorización de acceso? <br />
                        <Link to="/register" className="inline-flex items-center gap-1 text-primary font-black hover:text-white transition-all uppercase text-xs tracking-tighter mt-2 group-hover/register:translate-x-1">
                            Solicitar Credenciales de Operador <ArrowRight size={12} />
                        </Link>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export default Login;

