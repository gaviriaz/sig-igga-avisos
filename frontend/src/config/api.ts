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

    // 3. Intento de Auto-Descubrimiento vía Supabase Bridge
    try {
        const { data, error } = await supabase
            .from('system_config')
            .select('value')
            .eq('key', 'gateway_url')
            .single();

        if (data && data.value) {
            console.log('📡 Auto-Discovery: Pointing to', data.value);
            return data.value;
        }
    } catch (e) {
        console.warn('Auto-Discovery failed, using generic fallback.');
    }

    // Si todo falla, asumimos que el backend corre localmente
    return 'http://localhost:8000';
};

// Mantenemos la constante para compatibilidad, pero marcada como legacy
/** @deprecated Use getApiUrl() for dynamic discovery */
export const API_URL = currentApiUrl;
