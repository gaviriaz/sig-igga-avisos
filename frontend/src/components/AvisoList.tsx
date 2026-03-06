import React from 'react';
import { useAvisoStore } from '../store/useAvisoStore';
import { AlertCircle, Clock, CheckCircle2, ShieldAlert, MapPin, Zap } from 'lucide-react';

const AvisoList: React.FC = () => {
    const { filteredAvisos, selectAviso, selectedAviso } = useAvisoStore();

    return (
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-900/10">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 pr-1 space-y-px">
                {filteredAvisos.map((a) => (
                    <div
                        key={a.aviso}
                        onClick={() => selectAviso(a)}
                        className={`
                            group cursor-pointer p-6 transition-all relative border-b border-white/[0.03]
                            ${selectedAviso?.aviso === a.aviso ? 'bg-indigo-600/10 shadow-inner' : 'hover:bg-white/[0.02]'}
                        `}
                    >
                        {selectedAviso?.aviso === a.aviso && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,1)]" />
                        )}

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${a.risk_score > 75 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                        a.risk_score > 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>
                                        R:{a.risk_score}
                                    </span>
                                    {a.not_presente_en_corte && (
                                        <span className="text-[9px] font-black text-slate-500 bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Fuera de Corte</span>
                                    )}
                                </div>
                                <span className="text-[10px] font-black text-slate-600 italic">#{a.aviso}</span>
                            </div>

                            <div>
                                <h4 className={`text-[13px] font-black transition-colors uppercase tracking-tight leading-tight mb-1 ${selectedAviso?.aviso === a.aviso ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                                    {a.denominacion || 'Identificando Activo...'}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <MapPin size={10} className="text-slate-600" />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter truncate">{a.municipio || 'Sector No Definido'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded-md ${(a.estado_workflow_interno || '').includes('Aprobado') ? 'bg-emerald-500/20 text-emerald-400' :
                                        (a.estado_workflow_interno || '').includes('VALIDAR') ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-indigo-500/20 text-indigo-400'
                                        }`}>
                                        {(a.estado_workflow_interno || '').includes('Aprobado') ? <CheckCircle2 size={10} /> :
                                            (a.estado_sla === 'VENCIDO' || a.risk_score > 80) ? <AlertCircle size={10} className="text-rose-400 animate-pulse" /> :
                                                <Zap size={10} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-[0.1em]">{a.estado_workflow_interno || 'INGRESADO'}</span>
                                        {a.estado_sla && (
                                            <span className={`text-[8px] font-bold uppercase ${a.estado_sla === 'VENCIDO' ? 'text-rose-500' : 'text-slate-500'}`}>
                                                SLA: {a.estado_sla}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {a.tipo_de_gestion && (
                                    <span className="text-[10px] font-black text-indigo-400/80 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 uppercase italic">
                                        {a.tipo_de_gestion.split(' ')[0]}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredAvisos.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-30 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-dashed border-white/20">
                            <AlertCircle size={30} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Cola de Trabajo Vacía</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AvisoList;
