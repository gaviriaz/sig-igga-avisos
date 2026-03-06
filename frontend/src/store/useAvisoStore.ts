import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Aviso {
    aviso: string;
    prioridad: string;
    prioridad_fuente?: string;
    prioridad_operativa?: string;
    clase_aviso?: string;
    denominacion: string;
    descripcion: string;
    autor_aviso?: string;
    fecha_aviso?: string;
    inicio_deseado?: string;
    fin_deseado?: string;
    fecha_cierre?: string;

    zona_trabajo?: string;
    ubicacion_tecnica?: string;
    sector?: string;
    zona_ejecutora?: string;
    municipio?: string;
    departamento?: string;
    latitud_decimal?: number;
    longitud_decimal?: number;

    status_usuario?: string;
    status_sistema?: string;
    tipo_status?: string;
    estado_workflow_interno: string;

    pto_trabajo_resp?: string;
    gestor_predial?: string;
    asistente_predial?: string;
    analista_ambiental?: string;
    programacion_gestor?: string;

    gestion_ambiental_predial?: string;
    actividad_ambiental?: string;
    fecha_inicial_tapf?: string;
    fecha_final_tapf?: string;
    plazo_ejecucion?: string;
    estado_ambiental?: string;
    car?: string;
    predio_propietario?: string;
    actividad_predial?: string;
    observacion_predial?: string;
    legalizacion?: string;
    fecha_reunion?: string;
    compromisos?: string;

    especie_con_mas_riesgo?: string;
    distancia_copa_fase?: number;
    altura_individuo?: number;
    cantidad_arboles?: number;
    observacion_riesgo?: string;

    tipo_construccion?: string;
    valor_acuerdo_presupuesto?: number;
    flag_intervencion_franja?: boolean;

    tipo_de_gestion?: string;
    tipo_de_linea?: string;
    distancia_estructura?: number;
    riesgo_cimentacion?: string;

    ruta_insumos_onedrive?: string;
    not_presente_en_corte?: boolean;
    assigned_to?: string;
    assigned_to_name?: string;
    risk_score: number;
    deadline_sla?: string;
    estado_sla?: string;
}

interface AvisoState {
    avisos: Aviso[];
    selectedAviso: Aviso | null;
    filteredAvisos: Aviso[];
    isLoading: boolean;

    // Actions
    setAvisos: (avisos: Aviso[]) => void;
    selectAviso: (aviso: Aviso | null) => void;
    filterAvisos: (term: string) => void;
    setLoading: (loading: boolean) => void;
    updateAviso: (avisoId: string, updates: Partial<Aviso>) => void;
    subscribeRealtime: () => () => void;
}

export const useAvisoStore = create<AvisoState>((set, get) => ({
    avisos: [],
    selectedAviso: null,
    filteredAvisos: [],
    isLoading: false,

    setAvisos: (avisos) => set({ avisos, filteredAvisos: avisos }),
    selectAviso: (aviso) => set({ selectedAviso: aviso }),
    setLoading: (loading) => set({ isLoading: loading }),

    subscribeRealtime: () => {
        const channel = supabase
            .channel('db-aviso-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'aviso' },
                (payload) => {
                    console.log('📡 Realtime Change:', payload);
                    const { eventType, new: newRecord, old: oldRecord } = payload;

                    const currentAvisos = get().avisos;

                    if (eventType === 'INSERT') {
                        const updated = [newRecord as Aviso, ...currentAvisos];
                        set({ avisos: updated, filteredAvisos: updated });
                    } else if (eventType === 'UPDATE') {
                        const updated = currentAvisos.map(a =>
                            a.aviso === newRecord.aviso ? { ...a, ...newRecord } : a
                        );
                        const newSelected = get().selectedAviso?.aviso === newRecord.aviso
                            ? { ...get().selectedAviso, ...newRecord } as Aviso
                            : get().selectedAviso;

                        set({
                            avisos: updated,
                            filteredAvisos: updated,
                            selectedAviso: newSelected
                        });
                    } else if (eventType === 'DELETE') {
                        const updated = currentAvisos.filter(a => a.aviso !== oldRecord.aviso);
                        set({ avisos: updated, filteredAvisos: updated });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    filterAvisos: (term) => set((state) => ({
        filteredAvisos: state.avisos.filter(a =>
            a.aviso.includes(term) ||
            a.denominacion?.toLowerCase().includes(term.toLowerCase()) ||
            a.tipo_de_gestion?.toLowerCase().includes(term.toLowerCase()) ||
            a.municipio?.toLowerCase().includes(term.toLowerCase()) ||
            a.gestor_predial?.toLowerCase().includes(term.toLowerCase())
        )
    })),

    updateAviso: (avisoId, updates) => set((state) => {
        const newAvisos = state.avisos.map(a => a.aviso === avisoId ? { ...a, ...updates } : a);
        const newFiltered = state.filteredAvisos.map(a => a.aviso === avisoId ? { ...a, ...updates } : a);
        const newSelected = state.selectedAviso?.aviso === avisoId ? { ...state.selectedAviso, ...updates } : state.selectedAviso;
        return { avisos: newAvisos, filteredAvisos: newFiltered, selectedAviso: newSelected };
    }),
}));
