import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Map as OLMap, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import { GeoJSON } from 'ol/format';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { Maximize2, Layers, Zap, TowerControl as Tower, Map as MapIcon, ShieldCheck } from 'lucide-react';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import { useAvisoStore, Aviso } from '../store/useAvisoStore';
import { useMapStore } from '../store/useMapStore';

interface MapProps {
    onMapReady?: (map: OLMap) => void;
}

const Map: React.FC<MapProps> = ({ onMapReady }) => {
    const mapElement = useRef<HTMLDivElement>(null);
    const mapRef = useRef<OLMap | null>(null);
    const { avisos } = useAvisoStore();
    const { viewRequest } = useMapStore();

    const [layersVisible, setLayersVisible] = useState({
        avisos: true,
        lineas: true,
        torres: false,
        servidumbre: false,
        predios: false
    });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loadedLayers, setLoadedLayers] = useState<Set<string>>(new Set());

    const avisosSource = useRef(new VectorSource());
    const infraSources = useRef<{ [key: string]: VectorSource }>({
        lineas: new VectorSource(),
        torres: new VectorSource(),
        servidumbre: new VectorSource(),
        predios: new VectorSource()
    });
    const layerRefs = useRef<{ [key: string]: VectorLayer<VectorSource> }>({});

    // 1. Registro de Proyecciones de Colombia (Local sin CDN)
    useEffect(() => {
        proj4.defs('EPSG:9377', '+proj=tmerc +lat_0=4 +lon_0=-73 +k=1 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
        proj4.defs('EPSG:3116', '+proj=tmerc +lat_0=4.596200416666667 +lon_0=-74.07750791666666 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
        register(proj4);
    }, []);

    // 2. Motor de Carga Asíncrona (Senior Master Optimizado)
    const loadLayerData = async (layerKey: string) => {
        if (loadedLayers.has(layerKey)) return;
        const fileMap: { [key: string]: string } = {
            lineas: 'Lineas_Transmision_Energia.geojson',
            torres: 'Torres.geojson',
            servidumbre: 'Servidumbre.geojson',
            predios: 'Predios_Catastro.geojson'
        };
        const filename = fileMap[layerKey];
        if (!filename) return;

        try {
            console.log(`📡 Iniciando descarga diferida: ${layerKey}...`);
            const resp = await fetch(`http://localhost:8000/capas/${filename}`);
            if (resp.ok) {
                const geojsonData = await resp.json();
                const format = new GeoJSON();
                const features = geojsonData.features || [];
                const batchSize = 400;
                let index = 0;

                const firstFeatWithGeom = features.find((f: any) => f.geometry && f.geometry.coordinates);
                const coords = firstFeatWithGeom?.geometry?.coordinates?.[0]?.[0] || firstFeatWithGeom?.geometry?.coordinates?.[0] || [];
                const isProjected = Array.isArray(coords) ? coords[0] > 1000000 : coords > 1000000;
                const dataProj = isProjected ? 'EPSG:9377' : 'EPSG:4326';

                const processChunk = () => {
                    const chunk = features.slice(index, index + batchSize);
                    const chunkFeatures: Feature<Geometry>[] = [];

                    chunk.forEach((f: any) => {
                        try {
                            if (!f || !f.geometry || !f.geometry.coordinates) return;
                            const feat = format.readFeature(f, {
                                dataProjection: dataProj,
                                featureProjection: 'EPSG:3857'
                            });
                            if (feat) chunkFeatures.push(feat as Feature<Geometry>);
                        } catch (err) { }
                    });

                    infraSources.current[layerKey].addFeatures(chunkFeatures);
                    index += batchSize;

                    if (index < features.length) {
                        if (window.requestIdleCallback) {
                            window.requestIdleCallback(processChunk);
                        } else {
                            setTimeout(processChunk, 10);
                        }
                    } else {
                        setLoadedLayers(prev => {
                            const next = new Set(prev);
                            next.add(layerKey);
                            return next;
                        });
                        console.log(`✅ Capa ${layerKey} cargada.`);
                    }
                };
                processChunk();
            }
        } catch (e) {
            console.warn(`Error loading ${layerKey}:`, e);
        }
    };

    // 3. Sincronización de Avisos (Ordenada por Riesgo para que Críticos queden Arriba)
    useEffect(() => {
        avisosSource.current.clear();
        
        // Función auxiliar para calcular prioridad de renderizado (Z-Index simulado)
        const getRiskPriority = (a: Aviso) => {
            const dist = typeof a.distancia_copa_fase === 'string' ? parseFloat(a.distancia_copa_fase) : a.distancia_copa_fase;
            const prio = (a.prioridad_operativa || '').toUpperCase();
            if (a.risk_score > 80 || (dist !== undefined && dist <= 5) || ['CRITICO', 'MUY ALTA', 'ALTA'].includes(prio)) return 3;
            if (a.risk_score > 50 || (dist !== undefined && dist <= 10)) return 2;
            return 1;
        };

        const features = [...avisos]
            .filter(a => a.latitud_decimal && a.longitud_decimal)
            .sort((a, b) => getRiskPriority(a) - getRiskPriority(b)) // Menor prioridad primero, críticos al final (arriba)
            .map((a: Aviso) => {
                const lon = typeof a.longitud_decimal === 'string' ? parseFloat(a.longitud_decimal) : a.longitud_decimal;
                const lat = typeof a.latitud_decimal === 'string' ? parseFloat(a.latitud_decimal) : a.latitud_decimal;

                return new GeoJSON().readFeature({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [lon, lat] },
                    properties: { ...a }
                }, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }) as Feature<Geometry>;
            });
        avisosSource.current.addFeatures(features);
    }, [avisos]);

    // 4. Inicialización
    useEffect(() => {
        if (!mapElement.current) return;
        const baseLayer = new TileLayer({ source: new OSM() });
        const styles: { [key: string]: any } = {
            lineas: new Style({ stroke: new Stroke({ color: '#fbbf24', width: 2.5 }) }),
            torres: new Style({ image: new Circle({ radius: 3, fill: new Fill({ color: '#f87171' }), stroke: new Stroke({ color: '#fff', width: 1 }) }) }),
            servidumbre: new Style({ fill: new Fill({ color: 'rgba(52, 211, 153, 0.12)' }), stroke: new Stroke({ color: '#34d399', width: 0.8, lineDash: [4, 4] }) }),
            predios: new Style({ fill: new Fill({ color: 'rgba(59, 130, 246, 0.05)' }), stroke: new Stroke({ color: '#3b82f6', width: 0.4 }) }),
            avisos: (feature: any) => {
                const a = feature.getProperties() as Aviso;
                let color = '#3b82f6'; // Default Blue

                if (a.prioridad_operativa === 'CRITICO' || a.risk_score > 80) {
                    color = '#f43f5e'; // Rose (Crítico)
                } else if ((a.distancia_copa_fase && a.distancia_copa_fase < 2.5) || a.risk_score > 60) {
                    color = '#f59e0b'; // Amber (Alto Riesgo)
                } else if (a.prioridad_operativa === 'MEDIA' || a.risk_score > 30) {
                    color = '#fbbf24'; // Yellow (Medio)
                } else {
                    color = '#10b981'; // Emerald (Bajo/Gestión)
                }

                return new Style({
                    image: new Circle({
                        radius: 6,
                        fill: new Fill({ color }),
                        stroke: new Stroke({ color: '#fff', width: 2 })
                    })
                });
            }
        };

        layerRefs.current.lineas = new VectorLayer({ source: infraSources.current.lineas, style: styles.lineas, visible: layersVisible.lineas });
        layerRefs.current.torres = new VectorLayer({ source: infraSources.current.torres, style: styles.torres, visible: layersVisible.torres });
        layerRefs.current.servidumbre = new VectorLayer({ source: infraSources.current.servidumbre, style: styles.servidumbre, visible: layersVisible.servidumbre });
        layerRefs.current.predios = new VectorLayer({ source: infraSources.current.predios, style: styles.predios, visible: layersVisible.predios });
        layerRefs.current.avisos = new VectorLayer({ source: avisosSource.current, style: styles.avisos, visible: layersVisible.avisos });

        const map = new OLMap({
            target: mapElement.current,
            layers: [baseLayer, layerRefs.current.servidumbre, layerRefs.current.predios, layerRefs.current.lineas, layerRefs.current.torres, layerRefs.current.avisos],
            view: new View({ center: fromLonLat([-74.07, 4.6]), zoom: 6 }),
        });

        // 🏘️ Map Interactions: Click-to-Select (Senior Master)
        map.on('click', (evt) => {
            const feature = map.forEachFeatureAtPixel(evt.pixel, (feat) => feat, {
                layerFilter: (layer) => layer === layerRefs.current.avisos
            });

            if (feature) {
                const props = feature.getProperties();
                console.log("📍 Aviso Seleccionado desde Mapa:", props.aviso);
                useAvisoStore.getState().selectAviso(props as Aviso);
            }
        });

        // Hover Effect
        map.on('pointermove', (evt) => {
            const hit = map.hasFeatureAtPixel(evt.pixel, {
                layerFilter: (layer) => layer === layerRefs.current.avisos
            });
            mapElement.current!.style.cursor = hit ? 'pointer' : '';
        });

        mapRef.current = map;
        if (onMapReady) onMapReady(map);

        // 🛠️ SENIOR MASTER FIX: Forzar actualización de tamaño tras renderizado
        setTimeout(() => map.updateSize(), 100);
        setTimeout(() => map.updateSize(), 500);

        Object.entries(layersVisible).forEach(([k, v]) => { if (v && k !== 'avisos') loadLayerData(k); });

        return () => {
            map.setTarget(undefined);
            mapRef.current = null;
        };
    }, []);

    // 5. Soporte para Navegación Global
    useEffect(() => {
        if (!mapRef.current || !viewRequest.timestamp) return;
        const view = mapRef.current.getView();
        if (viewRequest.center) {
            const coords = fromLonLat(viewRequest.center);
            view.animate({ center: coords, zoom: viewRequest.zoom || 18, duration: 1500 });
        } else if (viewRequest.extent) {
            view.fit(viewRequest.extent, { duration: 1500, padding: [100, 100, 100, 100] });
        }
    }, [viewRequest]);

    const toggleLayer = (layer: keyof typeof layersVisible) => {
        const newState = !layersVisible[layer];
        setLayersVisible(prev => ({ ...prev, [layer]: newState }));
        if (newState && layer !== 'avisos') loadLayerData(layer);
        if (layerRefs.current[layer]) layerRefs.current[layer].setVisible(newState);
    };

    const handleFitView = () => {
        const source = infraSources.current.lineas;
        const extent = source.getExtent();
        if (extent && extent[0] !== Infinity && mapRef.current) {
            mapRef.current.getView().fit(extent, { duration: 1000, padding: [50, 50, 50, 50] });
        }
    };

    return (
        <div className="relative w-full h-full min-h-[500px] rounded-[1.5rem] overflow-hidden border border-white/5 bg-slate-950 shadow-2xl">
            <div ref={mapElement} className="w-full h-full grayscale-[0.05] brightness-[0.8] contrast-[1.1]" />
            <button onClick={handleFitView} className="absolute bottom-20 right-6 z-20 w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 group">
                <Maximize2 size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
            <div className={`absolute top-6 right-6 z-20 transition-all ${isMenuOpen ? 'w-64' : 'w-12'}`}>
                <div className="glass rounded-2xl overflow-hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-12 h-12 flex items-center justify-center text-indigo-400 hover:bg-white/5">
                        <Layers size={20} className={isMenuOpen ? 'rotate-90' : ''} />
                    </button>
                    <div className={`${isMenuOpen ? 'p-4 flex flex-col gap-2' : 'h-0 overflow-hidden opacity-0'}`}>
                        {[
                            { id: 'avisos', label: 'Avisos de Gestión', icon: Zap },
                            { id: 'lineas', label: 'Líneas Transmisión', icon: Zap },
                            { id: 'torres', label: 'Torres y Estructuras', icon: Tower },
                            { id: 'servidumbre', label: 'Zonas Servidumbre', icon: ShieldCheck },
                            { id: 'predios', label: 'Predios Catastrales', icon: MapIcon }
                        ].map((l) => (
                            <button key={l.id} onClick={() => toggleLayer(l.id as any)} className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold transition-all ${layersVisible[l.id as keyof typeof layersVisible] ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 border border-transparent hover:bg-white/5'}`}>
                                <l.icon size={16} /> <span>{l.label}</span>
                                <div className={`ml-auto w-2 h-2 rounded-full ${layersVisible[l.id as keyof typeof layersVisible] ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="absolute bottom-6 left-6 z-10 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-white/5 shadow-xl">
                <p className="text-[10px] font-bold text-white tracking-[0.2em] flex items-center gap-2 uppercase">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    SIG IGGA V7.5 ENGINE
                </p>
            </div>
        </div>
    );
};

export default Map;
