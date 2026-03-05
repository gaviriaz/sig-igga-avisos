import React, { useState, useEffect } from 'react';
import { useAvisoStore, Aviso } from '../store/useAvisoStore';
import { useAuthStore } from '../store/useAuthStore';
import { API_URL } from '../config/api';
import {
    Zap,
    ShieldCheck,
    FileText,
    MapPin,
    ChevronRight,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    FolderKanban,
    Sparkles,
    History,
    Info,
    FileCheck,
    ExternalLink,
    AlertCircle,
    Plus,
    TreeDeciduous,
    HardHat,
    Home,
    SearchCode,
    ChevronDown,
    MessageSquare,
    Send
} from 'lucide-react';

type DetailTab = 'info' | 'tecnico' | 'insumos' | 'history' | 'chat';

const AvisoDetail: React.FC = () => {
    const { selectedAviso, updateAviso } = useAvisoStore();
    const { profile } = useAuthStore();
    const [currentTab, setCurrentTab] = useState<DetailTab>('info');
    const [validating, setValidating] = useState(false);
    const [valResult, setValResult] = useState<any>(null);
    const [aiInsight, setAiInsight] = useState<any>(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [historial, setHistorial] = useState<any[]>([]);
    const [workflowStates, setWorkflowStates] = useState<any[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        // Cargar Catálogo de Estados (Senior Master Engine)
        fetch(`${API_URL}/domains/workflow_status`)
            .then(res => res.json())
            .then(data => setWorkflowStates(data))
            .catch(e => console.error("Error loading workflow states"));
    }, []);

    useEffect(() => {
        if (!selectedAviso) return;
        setAiInsight(null);
        setLoadingAi(true);
        setCurrentTab('info');

        // Fetch AI Insight
        fetch(`${API_URL}/avisos/${selectedAviso.aviso}/ai-insight`)
            .then(res => res.json())
            .then(data => setAiInsight(data))
            .catch(e => console.error(e))
            .finally(() => setLoadingAi(false));

        // Fetch Historial Real
        fetch(`${API_URL}/avisos/${selectedAviso.aviso}/history`)
            .then(res => res.json())
            .then(data => setHistorial(data))
            .catch(e => console.error(e));

        // Fetch Comunicaciones
        fetchComments();

        setValResult(null);
    }, [selectedAviso]);

    const handleStatusChange = async (newState: string) => {
        if (!selectedAviso) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`${API_URL}/avisos/${selectedAviso.aviso}/state?new_state=${newState}`, {
                method: 'PATCH'
            });
            if (res.ok) {
                updateAviso(selectedAviso.aviso, { estado_workflow_interno: newState });
                // Refresh history
                const hRes = await fetch(`${API_URL}/avisos/${selectedAviso.aviso}/history`);
                const hData = await hRes.json();
                setHistorial(hData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsUpdating(false);
        }
    };

    const fetchComments = async () => {
        if (!selectedAviso) return;
        try {
            const res = await fetch(`${API_URL}/avisos/${selectedAviso.aviso}/comments`);
            const data = await res.json();
            setComments(data);
        } catch (e) {
            console.error(e);
        }
    };

    // Real-time Simulativo Polling (Solo activo si están en 'chat')
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (selectedAviso && currentTab === 'chat') {
            interval = setInterval(fetchComments, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        }
    }, [selectedAviso, currentTab]);


    const handlePostComment = async () => {
        if (!newComment.trim() || !selectedAviso) return;
        setIsSending(true);
        try {
            const res = await fetch(`${API_URL}/avisos/${selectedAviso.aviso}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comentario: newComment,
                    usuario: profile?.full_name || "Desconocido"
                })
            });
            if (res.ok) {
                setNewComment('');
                await fetchComments();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    const handleValidateInsumos = async () => {
        if (!selectedAviso) return;
        setValidating(true);
        try {
            const res = await fetch(`${API_URL}/avisos/${selectedAviso.aviso}/validate-insumos`, {
                method: 'POST'
            });
            const data = await res.json();
            setValResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setValidating(false);
        }
    };

    if (!selectedAviso) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center border border-dashed border-white/10 text-slate-700">
                    <Zap size={32} />
                </div>
                <div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Selección Pendiente</h3>
                    <p className="text-sm text-slate-600 max-w-[200px] leading-relaxed">Active un aviso desde el panel lateral para iniciar la gestión operativa.</p>
                </div>
            </div>
        );
    }

    const isReadOnly = !['Oficina', 'Analista Ambiental', 'Coordinador Predial Senior'].includes(profile?.role || '');

    return (
        <div className="flex-1 overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-8 duration-500 bg-[#0a0f1d]/40">
            {/* 💎 Header Section */}
            <header className="p-8 border-b border-white/5 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                    <Zap size={140} className="text-indigo-500" />
                </div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-indigo-600 rounded-lg text-[10px] font-black italic shadow-lg shadow-indigo-600/30 text-white">
                            AVISO #{selectedAviso.aviso}
                        </span>
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${selectedAviso.risk_score > 75 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            selectedAviso.risk_score > 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            RIESGO {selectedAviso.risk_score > 75 ? 'CRÍTICO' : selectedAviso.risk_score > 40 ? 'MEDIO' : 'BAJO'}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] italic">Snapshot Activo</span>
                    </div>
                </div>

                <h3 className="text-2xl font-black text-white mb-2 leading-tight tracking-tighter uppercase max-w-[90%]">
                    {selectedAviso.denominacion || 'Identidad en Proceso'}
                </h3>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-6">
                    <span className="flex items-center gap-1.5"><MapPin size={12} className="text-indigo-400" /> {selectedAviso.municipio || 'Sector Desconocido'}</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span className="flex items-center gap-1.5"><History size={12} className="text-amber-400" /> {selectedAviso.status_usuario || 'ABIE'}</span>
                </div>

                {/* 🚀 Progression Stepper (Senior Master) */}
                <div className="flex items-center gap-2 px-1">
                    {[
                        { id: 'INGRESADO', label: 'Registro' },
                        { id: 'EN_GESTION', label: 'Campo' },
                        { id: 'VALIDAR_QA', label: 'QA' },
                        { id: 'APROBADO', label: 'Aprobado' }
                    ].map((step, idx, arr) => {
                        const isCurrent = (selectedAviso.estado_workflow_interno || 'INGRESADO').includes(step.id);
                        const isPast = arr.findIndex(s => (selectedAviso.estado_workflow_interno || 'INGRESADO').includes(s.id)) > idx;

                        return (
                            <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className={`w-3 h-3 rounded-full border-2 transition-all duration-700 ${isCurrent ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,1)] scale-125' : isPast ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-800 border-white/10'}`} />
                                    <span className={`text-[7px] font-black uppercase tracking-tighter ${isCurrent ? 'text-white' : 'text-slate-600'}`}>{step.label}</span>
                                </div>
                                {idx < arr.length - 1 && (
                                    <div className={`flex-1 h-px transition-all duration-1000 ${isPast ? 'bg-emerald-500/50' : 'bg-white/5'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </header>

            {/* 📑 Tab Navigation */}
            <nav className="flex items-center border-b border-white/5 bg-slate-900/20 shrink-0">
                {[
                    { id: 'info', label: 'Info', icon: Info },
                    { id: 'chat', label: 'Comunicación', icon: MessageSquare },
                    { id: 'tecnico', label: 'Campo', icon: TreeDeciduous },
                    { id: 'insumos', label: 'Insumos', icon: FolderKanban },
                    { id: 'history', label: 'Auditoría', icon: History }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setCurrentTab(tab.id as DetailTab)}
                        className={`flex-1 h-12 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${currentTab === tab.id ? 'text-indigo-400 bg-white/[0.02]' : 'text-slate-500 hover:text-white hover:bg-white/[0.01]'
                            }`}
                    >
                        <tab.icon size={13} />
                        {tab.label}
                        {currentTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                        )}
                    </button>
                ))}
            </nav>

            {/* ⚙️ Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin scrollbar-thumb-white/5">

                {currentTab === 'info' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 🧠 AI Intelligence Section */}
                        <section className="p-6 bg-gradient-to-br from-indigo-600/10 via-slate-900/60 to-transparent border border-indigo-500/20 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-20">
                                <Sparkles size={40} className="text-indigo-400" />
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Operational Insight</h4>
                            </div>
                            {loadingAi ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-4 bg-white/5 rounded-full w-3/4" />
                                    <div className="h-4 bg-white/5 rounded-full w-1/2" />
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm font-bold text-white leading-relaxed mb-4 italic">"{aiInsight?.summary || 'Analizando variables de riesgo...'}"</p>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-medium text-slate-400">
                                        <span className="text-indigo-400 font-black block mb-1">RECOMENDACIÓN TÉCNICA:</span>
                                        {aiInsight?.recommendation || 'Evaluar distancia fase-tierra en sitio.'}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* 🔄 Workflow Status Selector (Senior Master) */}
                        <section className="p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-inner">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Estado de Gestión Interna</h4>
                                    <p className="text-sm font-black text-white italic tracking-tight">{selectedAviso.estado_workflow_interno || 'INGRESADO'}</p>
                                </div>
                                <div className={`p-3 rounded-2xl ${(selectedAviso.estado_workflow_interno || '').includes('Aprobado') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                    {(selectedAviso.estado_workflow_interno || '').includes('Aprobado') ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                                </div>
                            </div>

                            {!isReadOnly && (
                                <div className="grid grid-cols-1 gap-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Cambiar Estado Operativo</label>
                                    <div className="relative group">
                                        <select
                                            disabled={isUpdating}
                                            value={selectedAviso.tipo_status || 'VALIDAR'}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-slate-300 appearance-none outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            {/* Domains specifically required */}
                                            {["VALIDAR", "GEAM", "GPRE", "PRER", "TAMB", "AMPO", "AMPO/GPRE", "AMPO/PRER", "TAMB/GPRE", "TAMB/AMPO", "TAMB/PRER", "GEAM/RSP", "SCOR/GEAM"].map((s, i) => (
                                                <option key={i} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-indigo-400 transition-colors">
                                            {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                                        </div>
                                    </div>
                                    <p className="text-[8px] text-slate-600 italic mt-1 uppercase tracking-tighter">* El cambio quedará registrado en el historial de auditoría bajo la capa RAW vs NORMALIZADA.</p>
                                </div>
                            )}
                        </section>

                        {/* General Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Ubic. Técnica', val: selectedAviso.ubicacion_tecnica || 'N/A', icon: Zap },
                                { label: 'TIPO GESTIÓN', val: selectedAviso.tipo_de_gestion || 'N/A', icon: HardHat },
                                { label: 'Gestor', val: selectedAviso.gestor_predial || 'Pte Asignar', icon: FileText },
                                { label: 'Autor', val: selectedAviso.autor_aviso || 'N/A', icon: Info }
                            ].map((item, i) => (
                                <div key={i} className="p-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl group hover:border-indigo-500/20 transition-all">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <item.icon size={12} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-200 truncate">{item.val}</p>
                                </div>
                            ))}
                        </div>

                        <section>
                            <div className="flex items-center gap-2 mb-4 text-slate-500">
                                <FileText size={14} />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Descripción Base</h4>
                            </div>
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] text-xs text-slate-400 leading-relaxed font-medium">
                                {selectedAviso.descripcion || 'Sin descripción detallada.'}
                            </div>
                        </section>
                    </div>
                )}

                {currentTab === 'tecnico' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Conditional Logic by Type (Section 3) */}
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                                {selectedAviso.tipo_de_gestion?.includes('VEGETA') ? <TreeDeciduous size={20} /> :
                                    selectedAviso.tipo_de_gestion?.includes('CONSTRU') ? <Home size={20} /> : <HardHat size={20} />}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-tight">{selectedAviso.tipo_de_gestion}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Reglas de Negocio Aplicadas</p>
                            </div>
                        </div>

                        {/* VEGETACIÓN MODULE (Section 1) */}
                        {selectedAviso.tipo_de_gestion?.includes('VEGETA') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl group">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">Distancia Copa-Fase</p>
                                    <p className="text-xl font-black text-white">{selectedAviso.distancia_copa_fase || '0.00'} <span className="text-xs text-slate-500">metros</span></p>
                                </div>
                                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl group">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 group-hover:text-amber-400 transition-colors">Altura Estimada</p>
                                    <p className="text-xl font-black text-white">{selectedAviso.altura_individuo || '0.00'} <span className="text-xs text-slate-500">metros</span></p>
                                </div>
                                <div className="col-span-2 p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Especie Predominante</p>
                                    <p className="text-sm font-bold text-slate-300 italic">"{selectedAviso.especie_con_mas_riesgo || 'No identificada'}"</p>
                                </div>
                            </div>
                        )}

                        {/* CONSTRUCCIÓN MODULE (Section 1) */}
                        {selectedAviso.tipo_de_gestion?.includes('CONSTRU') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Estado Constructivo</p>
                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black rounded-lg border border-amber-500/20">{selectedAviso.status_sistema || 'EN OBRA'}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-200">{selectedAviso.tipo_construccion || 'Vivienda / Bodega'}</p>
                                </div>
                                {selectedAviso.flag_intervencion_franja && (
                                    <div className="col-span-2 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                        <AlertTriangle size={16} /> Intervención en Franja de Servidumbre
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PREDIAL MODULE (Section 3.5) */}
                        <section className="p-6 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-inner">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Cartera Predial</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Propietario / Predio</span>
                                    <span className="text-white font-black">{selectedAviso.predio_propietario || 'S/D'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Actividad Realizada</span>
                                    <span className="text-indigo-400 font-black">{selectedAviso.actividad_predial || 'Pte Gestión'}</span>
                                </div>
                                <div className="pt-2 border-t border-white/5">
                                    <p className="text-[8px] font-black text-slate-700 uppercase mb-1">Observación Operativa</p>
                                    <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed">{selectedAviso.observacion_predial || 'Sin novedades prediales registradas.'}</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {currentTab === 'insumos' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Check Insumos 17.5 */}
                        <section className="p-8 bg-slate-900 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-inner">
                                        <FolderKanban size={28} />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-black text-white tracking-tighter uppercase italic">Control SharePoint</h5>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase italic">Auditoría Estructural</p>
                                    </div>
                                </div>
                                {!isReadOnly && (
                                    <button
                                        onClick={handleValidateInsumos}
                                        disabled={validating}
                                        className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
                                    >
                                        {validating ? <Loader2 size={16} className="animate-spin" /> : 'Auditar Carpeta'}
                                    </button>
                                )}
                            </div>

                            {/* Checklist (Section 17.5) */}
                            <div className="space-y-3">
                                {[
                                    { label: 'Subcarpeta PREDIAL', ok: true },
                                    { label: 'Subcarpeta INVENTARIO', ok: true },
                                    { label: 'Archivo KML en SHP', ok: selectedAviso.longitud_decimal ? true : false },
                                    { label: 'Geometría dentro del Buffer', ok: selectedAviso.risk_score < 90 },
                                ].map((step, i) => (
                                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${step.ok === true ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                                        'bg-rose-500/5 border-rose-500/20 text-rose-400'
                                        }`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                                        {step.ok === true ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {currentTab === 'history' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {historial.length > 0 ? historial.map((h, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all font-black text-[10px]">
                                        {h.usuario?.substring(0, 1) || 'S'}
                                    </div>
                                    <div className="w-px flex-1 bg-white/5" />
                                </div>
                                <div className="flex-1 pb-8">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{h.created_at?.split('T')[0]} - {h.usuario}</p>
                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl group-hover:border-white/10 transition-all shadow-sm">
                                        <p className="text-xs font-bold text-slate-300">Modificación de <span className="text-indigo-400">{h.campo}</span></p>
                                        <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-slate-500">
                                            <span className="line-through opacity-50">{h.valor_anterior}</span>
                                            <ChevronRight size={10} />
                                            <span className="text-emerald-400 font-bold">{h.valor_nuevo}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center opacity-30">
                                <SearchCode size={40} className="mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">Sin registros de auditoría</p>
                            </div>
                        )}
                    </div>
                )}

                {currentTab === 'chat' && (
                    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <section className="flex-1 space-y-4 mb-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/5">
                            {comments.length > 0 ? comments.map((c, i) => (
                                <div key={i} className={`flex gap-3 ${c.usuario === profile?.full_name ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center text-[10px] font-black text-indigo-400 shrink-0">
                                        {c.usuario?.substring(0, 2).toUpperCase() || 'OP'}
                                    </div>
                                    <div className={`max-w-[80%] p-4 rounded-3xl text-xs font-bold ${c.usuario === profile?.full_name ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-300 rounded-tl-none border border-white/5'}`}>
                                        <div className="flex justify-between gap-4 mb-1 opacity-50 text-[8px] uppercase tracking-tighter">
                                            <span>{c.usuario}</span>
                                            <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="leading-relaxed">{c.comentario}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                                    <MessageSquare size={48} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sin mensajes operativos</p>
                                </div>
                            )}
                        </section>

                        <div className="shrink-0 pt-4 border-t border-white/5">
                            <div className="relative">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Instrucciones para campo o reporte de oficina..."
                                    className="w-full h-24 bg-white/5 border border-white/10 rounded-[1.5rem] p-4 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-all resize-none"
                                />
                                <button
                                    onClick={handlePostComment}
                                    disabled={isSending || !newComment.trim()}
                                    className="absolute bottom-4 right-4 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg transition-all disabled:opacity-50 active:scale-90"
                                >
                                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* ⚙️ Footer Actions */}
            <footer className="p-8 border-t border-white/5 bg-slate-950/50 flex gap-4 shrink-0">
                <button
                    onClick={() => setCurrentTab('history')}
                    className="flex-1 h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    <History size={14} className="inline mr-2" /> Auditoría
                </button>
                {!isReadOnly && (
                    <button className="flex-[1.5] h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/40 active:scale-95 group">
                        Gestionar <ChevronRight size={16} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                )}
            </footer>
        </div>
    );
};

export default AvisoDetail;
