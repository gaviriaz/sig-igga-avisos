import React, { useState, useEffect } from 'react';
import { useAvisoStore } from '../store/useAvisoStore';
import { useAuthStore } from '../store/useAuthStore';
import { API_URL } from '../config/api';
import {
    Zap, MapPin, Loader2, AlertTriangle, CheckCircle2, Clock,
    FolderKanban, Sparkles, History, Info, MessageSquare, Send,
    ChevronRight, TreeDeciduous, Home, HardHat, ChevronDown,
    FileText, User, Tag
} from 'lucide-react';

type DetailTab = 'resumen' | 'tecnico' | 'comunicacion' | 'archivos' | 'auditoria';

const AvisoDetail: React.FC = () => {
    const { selectedAviso, updateAviso } = useAvisoStore();
    const { profile } = useAuthStore();
    const [currentTab, setCurrentTab] = useState<DetailTab>('resumen');

    // States
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
        fetch(`${API_URL}/domains/workflow_status`)
            .then(res => res.json())
            .then(data => setWorkflowStates(data))
            .catch(e => console.error("Error loading workflow states"));
    }, []);

    useEffect(() => {
        if (!selectedAviso) return;
        setAiInsight(null);
        setLoadingAi(true);
        setCurrentTab('resumen');

        fetch(`${API_URL}/avisos/${selectedAviso.aviso}/ai-insight`)
            .then(res => res.json())
            .then(data => setAiInsight(data))
            .catch(e => console.error(e))
            .finally(() => setLoadingAi(false));

        fetch(`${API_URL}/avisos/${selectedAviso.aviso}/history`)
            .then(res => res.json())
            .then(data => setHistorial(data))
            .catch(e => console.error(e));

        fetchComments();
    }, [selectedAviso]);

    const handleStatusChange = async (newState: string) => {
        if (!selectedAviso) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`${API_URL}/avisos/${selectedAviso.aviso}/state?new_state=${newState}`, {
                method: 'PATCH'
            });
            if (res.ok) {
                updateAviso(selectedAviso.aviso, { estado_workflow_interno: newState, tipo_status: newState });
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

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (selectedAviso && currentTab === 'comunicacion') {
            interval = setInterval(fetchComments, 3000);
        }
        return () => { if (interval) clearInterval(interval); }
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
            const res = await fetch(`${API_URL}/avisos/${selectedAviso.aviso}/validate-insumos`, { method: 'POST' });
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
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900/50 h-full">
                <div className="w-24 h-24 bg-slate-800/80 rounded-full flex items-center justify-center shadow-inner mb-6">
                    <Zap size={36} className="text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Ningún Aviso Seleccionado</h3>
                <p className="text-sm text-slate-500 max-w-xs text-center">Seleccione un aviso desde el panel de operaciones a la izquierda para ver su detalle.</p>
            </div>
        );
    }

    const isReadOnly = !['Oficina', 'Analista Ambiental', 'Coordinador Predial Senior'].includes(profile?.role || '');

    // Helpers
    const isCritico = selectedAviso.risk_score > 75;
    const isMedio = selectedAviso.risk_score > 40 && selectedAviso.risk_score <= 75;

    return (
        <div className="flex-1 overflow-hidden flex flex-col bg-[#0F172A] text-slate-200">
            {/* 💎 Header Ejecutivo */}
            <header className="px-8 pt-8 pb-6 bg-slate-900/80 border-b border-slate-800 shrink-0 shadow-sm relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-semibold border border-indigo-500/20">
                            #{selectedAviso.aviso}
                        </span>
                        {isCritico ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-400 rounded-full text-xs font-bold border border-rose-500/20">
                                <AlertTriangle size={14} /> Riesgo Crítico
                            </span>
                        ) : isMedio ? (
                            <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-full text-xs font-bold border border-amber-500/20">
                                Riesgo Medio
                            </span>
                        ) : (
                            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                                Riesgo Bajo
                            </span>
                        )}
                    </div>
                    {/* Status animado suave */}
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Online</span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                    {selectedAviso.denominacion || 'Identidad de Aviso Pendiente'}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-indigo-400" /> {selectedAviso.municipio || 'Sector Desconocido'}</span>
                    <span className="w-1 h-1 bg-slate-600 rounded-full" />
                    <span className="flex items-center gap-1.5"><Tag size={16} /> {selectedAviso.tipo_de_gestion || 'Gestión Standard'}</span>
                </div>
            </header>

            {/* 📑 Pestañas Limpias (Clean Tabs) */}
            <div className="flex items-center px-8 border-b border-slate-800 bg-slate-900 shrink-0 gap-6">
                {[
                    { id: 'resumen', label: 'Resumen' },
                    { id: 'tecnico', label: 'Datos Técnicos' },
                    { id: 'comunicacion', label: 'Comunicaciones' },
                    { id: 'archivos', label: 'Archivos' },
                    { id: 'auditoria', label: 'Auditoría' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setCurrentTab(tab.id as DetailTab)}
                        className={`py-4 text-sm font-semibold transition-all relative border-b-2 ${currentTab === tab.id
                            ? 'text-indigo-400 border-indigo-400'
                            : 'text-slate-400 border-transparent hover:text-slate-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ⚙️ Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">

                {/* 1. RESUMEN TAB */}
                {currentTab === 'resumen' && (
                    <div className="space-y-6 animate-in fade-in duration-300">

                        {/* Tarjeta de IA Soft */}
                        <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl relative">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={18} className="text-indigo-400" />
                                <h3 className="text-sm font-semibold text-indigo-300">Resumen Inteligente</h3>
                            </div>
                            {loadingAi ? (
                                <div className="space-y-3 animate-pulse opacity-50">
                                    <div className="h-2 bg-slate-600 rounded w-full" />
                                    <div className="h-2 bg-slate-600 rounded w-2/3" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-slate-300 text-sm leading-relaxed">{aiInsight?.summary}</p>
                                    <div className="p-4 bg-slate-900/50 rounded-xl text-sm text-slate-300 border border-slate-800">
                                        <span className="text-indigo-400 font-semibold block mb-1">Recomendación:</span>
                                        {aiInsight?.recommendation}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Estado Workflow */}
                        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                            <h3 className="text-sm font-semibold text-slate-400 mb-4">Estado Operativo</h3>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xl font-bold text-white">{selectedAviso.estado_workflow_interno || 'INGRESADO'}</p>

                                {!isReadOnly && (
                                    <div className="relative w-48">
                                        <select
                                            disabled={isUpdating}
                                            value={selectedAviso.tipo_status || 'VALIDAR'}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-300 appearance-none outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                                        >
                                            {["VALIDAR", "GEAM", "GPRE", "PRER", "TAMB", "AMPO", "APROBADO", "CERRADO"].map((s, i) => (
                                                <option key={i} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
                                    </div>
                                )}
                            </div>
                            {/* Simple progreso visual */}
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-indigo-500 transition-all duration-1000`}
                                    style={{ width: selectedAviso.estado_workflow_interno === 'APROBADO' ? '100%' : selectedAviso.estado_workflow_interno === 'EN_GESTION' ? '50%' : '25%' }}
                                />
                            </div>
                        </div>

                        {/* Grid de Datos Clave */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Ubicación Técnica', val: selectedAviso.ubicacion_tecnica || 'N/D', icon: Zap },
                                { label: 'Gestor Asignado', val: selectedAviso.gestor_predial || 'Pendiente', icon: User },
                                { label: 'Autor del Aviso', val: selectedAviso.autor_aviso || 'Sistema', icon: Info },
                                { label: 'Sector', val: selectedAviso.sector || 'N/D', icon: MapPin }
                            ].map((item, i) => (
                                <div key={i} className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30 flex items-start gap-4 hover:bg-slate-800/50 transition-colors">
                                    <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                                        <item.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium mb-1">{item.label}</p>
                                        <p className="text-sm font-semibold text-slate-200">{item.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Descripción Base */}
                        <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                            <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2"><FileText size={16} /> Descripción Base</h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {selectedAviso.descripcion || 'Este aviso no cuenta con una descripción detallada en la base de datos.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* 2. TÉCNICO TAB */}
                {currentTab === 'tecnico' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {selectedAviso.tipo_de_gestion?.includes('VEGETA') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                    <p className="text-xs text-slate-500 mb-1">Distancia Copa-Fase</p>
                                    <p className="text-3xl font-bold text-white mb-1">{selectedAviso.distancia_copa_fase || '0.00'}<span className="text-sm text-slate-500 ml-1">metros</span></p>
                                </div>
                                <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                    <p className="text-xs text-slate-500 mb-1">Altura Estimada</p>
                                    <p className="text-3xl font-bold text-white mb-1">{selectedAviso.altura_individuo || '0.00'}<span className="text-sm text-slate-500 ml-1">metros</span></p>
                                </div>
                                <div className="col-span-2 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                    <p className="text-xs text-slate-500 mb-2">Especie Predominante</p>
                                    <p className="text-lg font-medium text-slate-200">{selectedAviso.especie_con_mas_riesgo || 'No identificada de forma específica'}</p>
                                </div>
                            </div>
                        )}

                        {selectedAviso.tipo_de_gestion?.includes('CONSTRU') && (
                            <div className="space-y-4">
                                <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-xs text-slate-500">Estado Constructivo</p>
                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full font-semibold">{selectedAviso.status_sistema || 'EN OBRA'}</span>
                                    </div>
                                    <p className="text-lg font-medium text-white">{selectedAviso.tipo_construccion || 'Sin clasificar'}</p>
                                </div>
                            </div>
                        )}

                        <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                            <h4 className="text-sm font-semibold text-slate-400 mb-4">Cartera Predial</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                                    <span className="text-sm text-slate-500">Propietario / Predio</span>
                                    <span className="text-sm font-semibold text-white">{selectedAviso.predio_propietario || 'S/D'}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                                    <span className="text-sm text-slate-500">Actividad Realizada</span>
                                    <span className="text-sm font-semibold text-indigo-400">{selectedAviso.actividad_predial || 'Pte Gestión'}</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-2">Observación Operativa</p>
                                    <p className="text-sm text-slate-300 bg-slate-900 p-4 rounded-xl">{selectedAviso.observacion_predial || 'Sin novedades registradas.'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. COMUNICACIONES TAB */}
                {currentTab === 'comunicacion' && (
                    <div className="h-full flex flex-col animate-in fade-in duration-300 max-h-[500px]">
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-700 mb-4">
                            {comments.length > 0 ? comments.map((c, i) => (
                                <div key={i} className={`flex gap-3 ${c.usuario === profile?.full_name ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                                        {c.usuario?.substring(0, 2).toUpperCase() || 'OP'}
                                    </div>
                                    <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${c.usuario === profile?.full_name ? 'bg-indigo-600/90 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                                        <div className="flex justify-between gap-4 mb-2 opacity-60 text-xs">
                                            <span>{c.usuario}</span>
                                            <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="leading-relaxed">{c.comentario}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                                    <MessageSquare size={32} />
                                    <p className="text-sm">No hay mensajes. Rompe el hielo.</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-800 flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                placeholder="Escribe un mensaje o actualización..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                            />
                            <button
                                onClick={handlePostComment}
                                disabled={isSending || !newComment.trim()}
                                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                            >
                                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* 4. ARCHIVOS TAB */}
                {currentTab === 'archivos' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <FolderKanban size={24} className="text-indigo-400" />
                                    <div>
                                        <h3 className="text-base font-semibold text-white">Directorio Integrado</h3>
                                        <p className="text-sm text-slate-400">Archivos y evidencias en nube</p>
                                    </div>
                                </div>
                                {!isReadOnly && (
                                    <button
                                        onClick={handleValidateInsumos}
                                        disabled={validating}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {validating ? <Loader2 size={16} className="animate-spin inline" /> : 'Auditar Archivos'}
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2">
                                {[
                                    { label: 'Carpeta Predial Asociada', ok: true },
                                    { label: 'Evidencia Fotográfica', ok: true },
                                    { label: 'Archivo KML Generado', ok: !!selectedAviso.longitud_decimal }
                                ].map((step, i) => (
                                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${step.ok ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}>
                                        <span className="text-sm font-medium">{step.label}</span>
                                        {step.ok ? <CheckCircle2 size={18} /> : <span className="text-xs">Falta</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. AUDITORÍA TAB */}
                {currentTab === 'auditoria' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {historial.length > 0 ? historial.map((h, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 font-bold shrink-0">
                                    {(h.rol || 'A').substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold text-slate-200">{h.rol || 'Sistema'}</span>
                                        <span className="text-xs text-slate-500">{h.timestamp?.split('T')[0]}</span>
                                    </div>
                                    <p className="text-sm text-slate-400">Actualizó <span className="text-indigo-400 font-medium">{h.campo}</span></p>
                                    <div className="flex items-center gap-2 mt-2 text-xs bg-slate-900 px-3 py-2 rounded-lg inline-flex max-w-full overflow-hidden">
                                        <span className="text-slate-500 line-through truncate max-w-[100px]">{h.valor_anterior}</span>
                                        <ChevronRight size={14} className="text-slate-600 shrink-0" />
                                        <span className="text-emerald-400 font-medium truncate max-w-[100px]">{h.valor_nuevo}</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-12 text-center text-slate-500">
                                <History size={32} className="mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Sin registros de auditoría</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AvisoDetail;
