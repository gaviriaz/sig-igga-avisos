import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Settings,
    Bell,
    Filter,
    BarChart3,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Menu,
    X,
    Zap,
    Database,
    Share2,
    Loader2,
    Map as MapIcon,
    LogOut,
    Plus,
    Users,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';

import Map from '../components/Map';
import AvisoList from '../components/AvisoList';
import AvisoDetail from '../components/AvisoDetail';
import AttributeTable from '../components/AttributeTable';
import DomainManager from '../components/DomainManager';
import UserManagement from '../components/UserManagement';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import NotificationCenter from '../components/NotificationCenter';
import SettingsPanel from '../components/SettingsPanel';
import { useAvisoStore } from '../store/useAvisoStore';
import { useAuthStore } from '../store/useAuthStore';

type DashboardTab = 'operations' | 'analytics' | 'settings' | 'users';

const Dashboard: React.FC = () => {
    const { avisos, setAvisos, setLoading, filterAvisos } = useAvisoStore();
    const { profile, signOut, initialize } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentTab, setCurrentTab] = useState<DashboardTab>('operations');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [leftPanelVisible, setLeftPanelVisible] = useState(true);
    const [rightPanelVisible, setRightPanelVisible] = useState(true);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        initialize();
    }, []);

    const fetchAvisos = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/avisos');
            if (response.ok) {
                const data = await response.json();
                setAvisos(data);
            }
        } catch (error) {
            console.error("Backend offline.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvisos();
    }, []);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const resp = await fetch('http://localhost:8000/etl/sync', { method: 'POST' });
            if (resp.ok) {
                alert("✅ Sincronización SharePoint Exitosa");
                await fetchAvisos();
            } else {
                const err = await resp.json();
                alert(`❌ Error Sync: ${err.detail}`);
            }
        } catch (e) {
            alert("❌ Backend no responde");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSeed = async () => {
        setIsSeeding(true);
        try {
            const resp = await fetch('http://localhost:8000/dev/seed', { method: 'POST' });
            if (resp.ok) {
                alert("✅ Datos Inyectados con Éxito");
                await fetchAvisos();
            }
        } catch (e) {
            alert("❌ Fallo el Seed");
        } finally {
            setIsSeeding(false);
        }
    };

    const handleCorteMaestro = async () => {
        setIsSyncing(true);
        try {
            const resp = await fetch('http://localhost:8000/etl/sync-geam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: profile?.email })
            });
            const data = await resp.json();
            if (resp.ok) {
                alert(`✅ CORTE SINCRONIZADO: ${data.filename}\nBatch: ${data.batch_id}`);
                await fetchAvisos();
            } else {
                alert(`❌ ERROR: ${data.detail}`);
            }
        } catch (e) {
            alert("❌ Fallo de conexión con el servidor");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSyncing(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const resp = await fetch(`http://localhost:8000/etl/upload-geam?email=${profile?.email}`, {
                method: 'POST',
                body: formData
            });
            const data = await resp.json();
            if (resp.ok) {
                alert(`✅ CARGA MANUAL EXITOSA: ${data.filename}`);
                await fetchAvisos();
            } else {
                alert(`❌ ERROR: ${data.detail}`);
            }
        } catch (e) {
            alert("❌ Fallo al subir el archivo");
        } finally {
            setIsSyncing(false);
        }
    };

    const stats = [
        { label: 'Críticos', value: avisos.filter(a => a.risk_score > 75).length, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { label: 'Pendientes QA', value: avisos.filter(a => (a.estado_workflow_interno || '').includes('VALIDAR')).length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Aprobados', value: avisos.filter(a => (a.estado_workflow_interno || '').includes('Aprobado')).length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'SLA OK', value: `${avisos.length > 0 ? Math.round((avisos.filter(a => a.risk_score < 75).length / avisos.length) * 100) : 100}%`, icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
    ];

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        filterAvisos(e.target.value);
    };

    // RBAC: Menú dinámico según el rol
    const menuItems = [
        { id: 'operations', icon: MapIcon, label: 'Operaciones', roles: ['Oficina', 'Analista Ambiental', 'Coordinador Predial Junior', 'Coordinador Predial Senior'] },
        { id: 'analytics', icon: BarChart3, label: 'Estadísticas', roles: ['Oficina', 'Coordinador Predial Senior'] },
        { id: 'users', icon: Users, label: 'Usuarios', roles: ['Oficina'] },
        { id: 'settings', icon: Settings, label: 'Catálogos', roles: ['Oficina', 'Coordinador Predial Senior'] },
    ];

    return (
        <div className="flex h-screen w-screen bg-[#020617] text-slate-200 font-sans overflow-hidden selection:bg-indigo-500/30">
            {/* 🛠️ Sidebar Refactorizada (RBAC) */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-20 bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 flex flex-col items-center py-8 gap-8 transition-all duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div
                    onClick={() => navigate('/')}
                    className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 cursor-pointer hover:scale-105 transition-transform"
                >
                    <span className="text-xl font-black text-white italic">IG</span>
                </div>

                <nav className="flex-1 flex flex-col gap-6">
                    {menuItems.filter(item => item.roles.includes(profile?.role || 'Oficina')).map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentTab(item.id as DashboardTab)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative ${currentTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            title={item.label}
                        >
                            <item.icon size={22} className="group-hover:scale-110 transition-transform" />
                            {currentTab === item.id && (
                                <div className="absolute left-14 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    ))}
                </nav>

                <button
                    onClick={handleLogout}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-all group"
                    title="Cerrar Sesión"
                >
                    <LogOut size={22} className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                    onClick={handleSeed}
                    disabled={isSeeding}
                    className={`mt-auto mb-8 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isSeeding ? 'bg-amber-500/20 text-amber-500 animate-pulse' : 'text-slate-600 hover:text-amber-500 hover:bg-amber-500/10'}`}
                    title="Sincronizar Maestro (Seed)"
                >
                    <Database size={22} />
                </button>
            </aside>

            {/* 🛠️ Main Content */}
            <main className={`flex-1 flex flex-col h-full transition-all duration-500 ${isSidebarOpen ? 'pl-20' : 'pl-0'}`}>
                <header className="h-20 flex items-center justify-between px-8 bg-slate-900/20 backdrop-blur-md border-b border-white/5 sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-white transition-colors">
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div>
                            <h1 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">
                                {currentTab === 'operations' ? 'Gestión Territorial' :
                                    currentTab === 'analytics' ? 'Dashboard Ejecutivo' :
                                        currentTab === 'settings' ? 'Configuración de Dominios' : 'Gestión de Personal'}
                            </h1>
                            <p className="text-xl font-bold text-shine italic">SIG IGGA / ISA v7.5</p>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl px-12 flex items-center gap-4">
                        {currentTab === 'operations' && (
                            <div className="relative group flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar aviso, gestor o municipio..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-full pl-12 pr-6 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm placeholder:text-slate-600"
                                />
                            </div>
                        )}

                        <div className="flex gap-2">
                            {profile?.email === 'agaviria@igga.com.co' ? (
                                <>
                                    <button
                                        onClick={handleCorteMaestro}
                                        disabled={isSyncing}
                                        className={`h-11 px-6 rounded-2xl flex items-center gap-2 font-black text-xs transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30`}
                                        title="Sincronización Automática desde SharePoint"
                                    >
                                        {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="fill-white" />}
                                        SINCRONIZAR CORTE (AUTO)
                                    </button>

                                    <label className="h-11 px-4 rounded-2xl flex items-center gap-2 font-bold text-xs bg-slate-800 border border-white/10 hover:bg-slate-700 cursor-pointer transition-all text-slate-300">
                                        <Database size={14} className="text-indigo-400" />
                                        SUBIR EXCEL
                                        <input type="file" className="hidden" accept=".xlsx" onChange={handleManualUpload} disabled={isSyncing} />
                                    </label>
                                </>
                            ) : (profile?.role === 'Oficina' || profile?.role === 'Coordinador Predial Senior') && (
                                <>
                                    <button onClick={handleSync} disabled={isSyncing} className={`h-11 px-4 rounded-2xl flex items-center gap-2 font-bold text-xs transition-all ${isSyncing ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}`}>
                                        {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                                        {isSyncing ? 'Sync...' : 'Sync SP'}
                                    </button>
                                    <button onClick={handleSeed} disabled={isSeeding} className={`h-11 px-4 rounded-2xl flex items-center gap-2 font-bold text-xs border border-white/10 ${isSeeding ? 'bg-slate-800' : 'bg-white/5 hover:bg-white/10'}`}>
                                        <Database size={14} className="text-emerald-400" /> Seed
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                const isZen = !leftPanelVisible && !rightPanelVisible;
                                setLeftPanelVisible(isZen ? true : false);
                                setRightPanelVisible(isZen ? true : false);
                            }}
                            className={`px-4 h-10 rounded-xl border border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${(!leftPanelVisible && !rightPanelVisible) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                            title="Modo Zen (Maximizar Mapa)"
                        >
                            <Zap size={14} className={(!leftPanelVisible && !rightPanelVisible) ? 'animate-pulse' : ''} />
                            Zen
                        </button>
                        <button
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            className={`relative p-2.5 rounded-xl border transition-all group ${isNotificationOpen ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            <Bell size={18} className={isNotificationOpen ? '' : 'group-hover:text-white'} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-950 animate-pulse" />
                        </button>
                        <div className="h-8 w-px bg-white/10 mx-2" />
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsSettingsOpen(true)}>
                            <div className="text-right">
                                <p className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-indigo-400 transition-colors">{profile?.full_name || 'Operador SIG'}</p>
                                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-tighter bg-emerald-500/10 px-2 py-0.5 rounded-full">{profile?.role || 'Oficina'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 font-black italic shadow-inner group-hover:border-indigo-400 transition-all">
                                {profile?.full_name?.substring(0, 2).toUpperCase() || 'AG'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* 🛠️ Contenido Dinámico */}
                {currentTab === 'operations' ? (
                    <>
                        <section className="grid grid-cols-4 gap-6 p-8 bg-slate-950/20 shrink-0">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="glass p-5 rounded-3xl hover:border-white/20 transition-all group hover:-translate-y-1 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <stat.icon size={48} />
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`p-2.5 ${stat.bg} ${stat.color} rounded-2xl shadow-inner relative z-10`}>
                                            <stat.icon size={20} />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-white tracking-tight relative z-10">{stat.value}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10">{stat.label}</p>
                                </div>
                            ))}
                        </section>

                        <section className="flex-1 flex p-8 gap-6 overflow-hidden pt-0 relative">
                            {/* Toggle Left */}
                            <button
                                onClick={() => setLeftPanelVisible(!leftPanelVisible)}
                                className={`absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-full border border-indigo-500/20 backdrop-blur-xl transition-all shadow-2xl ${leftPanelVisible ? 'translate-x-[405px]' : 'translate-x-0'}`}
                            >
                                <ChevronRight size={16} className={`transition-transform duration-500 ${leftPanelVisible ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Left Panel: List */}
                            <div className={`rounded-[2.5rem] overflow-hidden flex flex-col glass border-white/5 transition-all duration-500 origin-left ${leftPanelVisible ? 'w-[420px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
                                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Bandeja de Entrada</h3>
                                    <div className="flex gap-2">
                                        <button className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"><Plus size={14} /></button>
                                        <button className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"><Filter size={14} /></button>
                                    </div>
                                </div>
                                <AvisoList />
                            </div>

                            {/* Center: Map */}
                            <div className="flex-1 relative rounded-[3rem] overflow-hidden glass border-white/5 shadow-2xl min-h-[500px]">
                                <Map />
                            </div>

                            {/* Toggle Right */}
                            <button
                                onClick={() => setRightPanelVisible(!rightPanelVisible)}
                                className={`absolute right-4 top-1/2 -translate-y-1/2 z-40 p-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-full border border-indigo-500/20 backdrop-blur-xl transition-all shadow-2xl ${rightPanelVisible ? '-translate-x-[435px]' : 'translate-x-0'}`}
                            >
                                <ChevronRight size={16} className={`transition-transform duration-500 ${rightPanelVisible ? '' : 'rotate-180'}`} />
                            </button>

                            {/* Right Panel: Detail */}
                            <div className={`rounded-[2.5rem] overflow-hidden flex flex-col glass border-white/5 transition-all duration-500 origin-right ${rightPanelVisible ? 'w-[450px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
                                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <Zap size={16} className="text-indigo-400" />
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Ficha Operativa</h3>
                                    </div>
                                    <div className="flex gap-1">
                                        <button className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-[9px] font-black uppercase text-slate-400 transition-all border border-white/5">Auditoría</button>
                                        <button className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full text-[9px] font-black uppercase text-emerald-400 transition-all border border-emerald-500/20">Cerrar</button>
                                    </div>
                                </div>
                                <AvisoDetail />
                            </div>
                        </section>
                    </>
                ) : (
                    <div className="flex-1 overflow-auto p-8">
                        {currentTab === 'settings' ? <DomainManager /> :
                            currentTab === 'users' ? <UserManagement /> :
                                currentTab === 'analytics' ? <AnalyticsDashboard /> :
                                    <div className="glass rounded-[3rem] border-white/5 p-12 flex flex-col items-center justify-center text-center gap-6 h-full">
                                        <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-indigo-400 mb-4 border border-white/10">
                                            <BarChart3 size={48} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Módulo en Desarrollo</h3>
                                            <p className="text-slate-500 max-w-sm mx-auto font-medium">Estamos configurando los servicios avanzados de análisis de hotspots.</p>
                                        </div>
                                        <button onClick={() => setCurrentTab('operations')} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-600/20">
                                            Volver a Operaciones
                                        </button>
                                    </div>
                        }
                    </div>
                )}

                <footer className="h-10 px-8 border-t border-white/5 bg-slate-950/80 backdrop-blur-md flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] shrink-0">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> DB: SUPABASE CONNECTED</span>
                        <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> ROLE: {profile?.role?.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-400/80 italic font-black">
                        PLATINUM EDITION v7.5.4
                    </div>
                </footer>
            </main>

            <AttributeTable />

            <NotificationCenter
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
            />

            <SettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
};

export default Dashboard;
