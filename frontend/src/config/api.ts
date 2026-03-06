import { supabase } from '../lib/supabase';

// URL Base persistente (Fallbacks)
const meta = (import.meta as any);
let currentApiUrl = meta.env?.VITE_API_URL || 'http://localhost:8000';

export const getApiUrl = async () => {
    // Si ya estamos en localhost, no buscamos en la nube
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return currentApiUrl;
    }

    try {
        // Intento de Auto-Descubrimiento vía Supabase Bridge
        const { data, error } = await supabase
            .from('system_config')
            .select('value')
            .eq('key', 'gateway_url')
            .single();

        if (data && data.value) {
            console.log('📡 Auto-Discovery: Pointing to', data.value);
            currentApiUrl = data.value;
        }
    } catch (e) {
        console.warn('Auto-Discovery failed, using fallback.');
    }

    return currentApiUrl;
};

// Mantenemos la constante para compatibilidad, pero marcada como legacy
/** @deprecated Use getApiUrl() for dynamic discovery */
export const API_URL = currentApiUrl;
