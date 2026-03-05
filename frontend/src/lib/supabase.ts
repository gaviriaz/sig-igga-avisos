import { createClient } from '@supabase/supabase-js';

// Las variables se configurarán en .env.local (Costo 0 - Supabase Free Tier)
const FALLBACK_URL = 'https://vdzfamjklmwlptitxvvd.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkemZhbWprbG13bHB0aXR4dnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjMwMDYsImV4cCI6MjA4ODAzOTAwNn0.vTgeIcQK8beqhV8gpGjDFXM2sHZEE0c90yYDptMAjVo';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

if (!supabaseUrl || supabaseUrl === 'undefined') {
    console.error('CRITICAL: supabaseUrl is missing or invalid. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


export const getAvisosGeoJSON = async () => {
    const { data, error } = await supabase
        .rpc('get_avisos_as_geojson'); // RPC Function in Postgres for fast GIS delivery

    if (error) {
        console.error('Error fetching avisos as GeoJSON:', error);
        return null;
    }
    return data;
};
