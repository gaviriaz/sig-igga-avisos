import { supabase } from '../lib/supabase';

// URL Base persistente (Fallbacks)
const meta = (import.meta as any);
// FORZAMOS localhost como base para evitar que variables viejas de Cloudflare Build nos rompan el sistema
let currentApiUrl = 'http://localhost:8000';

export const getApiUrl = async () => {
    // 1. PRIORIDAD MÁXIMA: Si viene por URL en GitHub Pages (ej: ?apiUrl=http://localhost:8000)
    const urlParams = new URLSearchParams(window.location.search);
    const queryUrl = urlParams.get('apiUrl');
    if (queryUrl) {
        return queryUrl;
    }

    // 2. Si estamos en desarrollo/local o hay un fallo de red
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }

    // 3. PRIORIDAD ALTA: Render (Nuestro nuevo estándar)
    const renderUrl = 'https://sig-igga-avisos.onrender.com';

    // Opcional: Podríamos validar si Render responde antes de regresarlo, 
    // pero para arreglar el error del usuario ahora mismo lo daremos como primario:
    return renderUrl;

    /* 
    // Mantenemos esto comentado por si en el futuro queremos volver a descubrimiento vía DB, 
    // pero ahora mismo la DB tiene un link de Cloudflare viejo:
    try {
        const { data } = await supabase.from('system_config').select('value').eq('key', 'gateway_url').single();
        if (data && data.value && !data.value.includes('cloudflare')) { 
            return data.value;
        }
    } catch (e) { }
    return renderUrl;
    */
};

// Mantenemos la constante para compatibilidad, pero marcada como legacy
/** @deprecated Use getApiUrl() for dynamic discovery */
export const API_URL = currentApiUrl;
