import React, { useState, useEffect } from 'react';
import { useAvisoStore, Aviso } from '../store/useAvisoStore';
import { useMapStore } from '../store/useMapStore';
import { Search, Table as TableIcon, Maximize, MapPin, Filter, X, ShieldAlert, Layers } from 'lucide-react';

const AttributeTable: React.FC = () => {
    const { avisos, selectAviso, selectedAviso } = useAvisoStore();
    const { flyTo } = useMapStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredAvisos = avisos.filter(a =>
        String(a.aviso).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(a.denominacion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(a.municipio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(a.gestor_predial || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (a: Aviso) => {
        selectAviso(a);
        if (a.latitud_decimal && a.longitud_decimal) {
            flyTo([parseFloat(a.longitud_decimal as any), parseFloat(a.latitud_decimal as any)], 18);
        }
    };

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-all duration-700 ease-in-out ${isOpen ? 'h-[450px]' : 'h-12'}`}>
            {/* Header / Toggle */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="h-12 bg-[#0a0f1d]/95 backdrop-blur-3xl border-t border-white/10 flex items-center justify-between px-8 cursor-pointer hover:bg-slate-900 transition-all shadow-[0_-20px_60px_rgba(0,0,0,0.8)]"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg shadow-inner">
                        <TableIcon size={16} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">Explorador de Atributos Geoespaciales</span>
                        <span className="ml-4 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-black border border-emerald-500/20 uppercase">
                            {filteredAvisos.length} Entidades Cargadas
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isOpen && (
                        <div className="hidden md:flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-4 h-8 rounded-full border border-white/5">
                            <span className="flex items-center gap-2"><span className="w-2 h-2 bg-indigo-500 rounded-full" /> Normal</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-500 rounded-full" /> Riesgo</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 bg-rose-500 rounded-full" /> Crítico</span>
                        </div>
                    )}
                    <button className="h-8 px-4 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-full text-[10px] font-black uppercase transition-all border border-indigo-500/20">
                        {isOpen ? 'Cerrar Panel' : 'Maximizar'}
                    </button>
                </div>
            </div>

            {/* Table Content */}
            <div className={`h-[calc(450px-48px)] bg-[#020617]/98 backdrop-blur-3xl p-6 overflow-hidden flex flex-col ${!isOpen && 'hidden'} border-t border-white/5`}>
                {/* Search Bar */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Interrogar tabla por Aviso, Denominación, Gestor o Municipio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium transition-all placeholder:text-slate-700"
                        />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"><X size={16} /></button>}
                    </div>
                    <button className="h-11 px-6 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5 transition-all">
                        <Filter size={14} /> Filtrar Columnas
                    </button>
                    <button className="h-11 px-6 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5 transition-all">
                        <Layers size={14} /> Exportar CSV
                    </button>
                </div>

                {/* Grid Header (QGIS Style) */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-indigo-600/5 border-x border-t border-white/5 rounded-t-[1.5rem] text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] shadow-inner mb-px">
                    <div className="col-span-1">AVISO</div>
                    <div className="col-span-1">RIESGO</div>
                    <div className="col-span-3">DENOMINACIÓN / ACTIVO</div>
                    <div className="col-span-2">TIPO GESTIÓN</div>
                    <div className="col-span-2">ESTADO WORKFLOW</div>
                    <div className="col-span-2">MUNICIPIO</div>
                    <div className="col-span-1 text-right">ACCIONES</div>
                </div>

                {/* Grid Body */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500/40 pr-2 border border-white/5 rounded-b-[1.5rem] bg-slate-900/10">
                    {filteredAvisos.map((a, idx) => (
                        <div
                            key={a.aviso}
                            onClick={() => handleSelect(a)}
                            className={`grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-white/[0.02] hover:bg-indigo-600/[0.07] transition-all cursor-pointer group items-center ${selectedAviso?.aviso === a.aviso ? 'bg-indigo-600/[0.12] border-l-2 border-l-indigo-500' : ''}`}
                        >
                            <div className="col-span-1">
                                <span className="text-xs font-mono font-black text-slate-400 group-hover:text-indigo-400 transition-colors">#{a.aviso}</span>
                            </div>
                            <div className="col-span-1">
                                <div className={`flex items-center gap-1.5 ${a.risk_score > 75 ? 'text-rose-500' : a.risk_score > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    <ShieldAlert size={12} />
                                    <span className="text-[10px] font-black">{a.risk_score}%</span>
                                </div>
                            </div>
                            <div className="col-span-3">
                                <p className="text-[11px] font-bold text-slate-200 truncate uppercase tracking-tight group-hover:text-white transition-colors">{a.denominacion || '-'}</p>
                                <p className="text-[9px] text-slate-600 font-bold truncate tracking-tighter">{a.ubicacion_tecnica || 'PENDIENTE GEORREFERENCIACIÓN'}</p>
                            </div>
                            <div className="col-span-2">
                                <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-300 transition-colors uppercase italic">{a.tipo_de_gestion || 'S/D'}</span>
                            </div>
                            <div className="col-span-2">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${(a.estado_workflow_interno || '').includes('Aprobado') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                                        (a.estado_workflow_interno || '').includes('VALIDAR') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                            'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                    }`}>
                                    {a.estado_workflow_interno || 'INGRESADO'}
                                </span>
                            </div>
                            <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-tight group-hover:text-white">{a.municipio || '-'}</div>
                            <div className="col-span-1 flex justify-end gap-2 pr-2">
                                <button className="p-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl transition-all group-hover:scale-110 shadow-lg border border-indigo-500/10">
                                    <MapPin size={12} />
                                </button>
                                <button className="p-2 bg-slate-800/40 hover:bg-slate-700 text-slate-500 hover:text-white rounded-xl transition-all border border-white/5">
                                    <Maximize size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredAvisos.length === 0 && (
                        <div className="p-24 text-center flex flex-col items-center gap-6 opacity-30">
                            <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-dashed border-white/10">
                                <Search className="text-slate-600" size={32} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2">Sin Resultados</h4>
                                <p className="text-xs font-bold text-slate-600 uppercase">Ajuste los parámetros de búsqueda o verifique la conexión con el servidor ETL.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttributeTable;
