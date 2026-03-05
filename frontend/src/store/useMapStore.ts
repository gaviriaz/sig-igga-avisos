import { create } from 'zustand';
import { Coordinate } from 'ol/coordinate';

interface MapState {
    viewRequest: {
        center: Coordinate | null;
        zoom?: number;
        extent?: any;
        timestamp: number;
    };
    flyTo: (center: Coordinate, zoom?: number) => void;
    fitExtent: (extent: any) => void;
}

export const useMapStore = create<MapState>((set) => ({
    viewRequest: {
        center: null,
        timestamp: 0
    },
    flyTo: (center, zoom) => set({
        viewRequest: { center, zoom, timestamp: Date.now() }
    }),
    fitExtent: (extent) => set({
        viewRequest: { center: null, extent, timestamp: Date.now() }
    })
}));
