import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export type UserRole = 'Oficina' | 'Analista Ambiental' | 'Coordinador Predial Junior' | 'Coordinador Predial Senior' | 'Gestor de Campo' | 'Asistente Predial' | 'Administrador';

interface AuthState {
    user: User | null;
    profile: {
        role: UserRole;
        full_name: string;
        email?: string;
        username?: string;
    } | null;
    loading: boolean;
    initialized: boolean;

    signIn: (user: User) => Promise<void>;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    loading: true,
    initialized: false,

    signIn: async (user) => {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id);

        const profile = profileData && profileData.length > 0 ? profileData[0] : null;

        set({
            user,
            profile: {
                role: profile?.role || 'Oficina',
                full_name: profile?.full_name || user.user_metadata?.full_name || 'Usuario',
                email: user.email,
                username: user.email?.split('@')[0]
            },
            loading: false
        });
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, loading: false });
    },

    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', session.user.id);

                const profile = profileData && profileData.length > 0 ? profileData[0] : null;

                set({
                    user: session.user,
                    profile: {
                        role: profile?.role || 'Oficina',
                        full_name: profile?.full_name || session.user.user_metadata?.full_name || 'Usuario',
                        email: session.user.email,
                        username: session.user.email?.split('@')[0]
                    },
                    initialized: true,
                    loading: false
                });
            } else {
                set({ user: null, profile: null, initialized: true, loading: false });
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ user: null, profile: null, initialized: true, loading: false });
        }
    }
}));
