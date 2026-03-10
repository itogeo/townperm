// ==========================================================================
// MAP COMPONENT — Mapbox GL JS with overlay layers
// ==========================================================================
const CADASTRAL_TILE_URL = 'https://gisservicemt.gov/arcgis/rest/services/MSDI_Framework/Parcels/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true&f=image';

const PermitMap = ({ permits, parcels, selectedPermit, onPermitClick, onParcelClick, config, className = 'h-full', showControls = true }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState('streets');
  const [layers, setLayers] = useState({ zoning: false, cadastral: false });
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const permitsRef = useRef(permits);
  const onPermitClickRef = useRef(onPermitClick);
  const onParcelClickRef = useRef(onParcelClick);
  const layersRef = useRef(layers);
  permitsRef.current = permits;
  onPermitClickRef.current = onPermitClick;
  onParcelClickRef.current = onParcelClick;
  layersRef.current = layers;

  const permitGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: permits.filter(p => p.coords).map(p => ({
      type: 'Feature',
      properties: { id: p.id, typeCode: p.typeCode, status: p.status, address: p.address, type: p.type, applicant: p.applicant },
      geometry: { type: 'Point', coordinates: p.coords },
    })),
  }), [permits]);

  const handleMarkerClick = useCallback((e) => {
    const permitId = e.features[0].properties.id;
    const permit = permitsRef.current.find(p => p.id === permitId);
    if (permit && onPermitClickRef.current) onPermitClickRef.current(permit);
  }, []);

  const handleMarkerHover = useCallback((e) => {
    map.current.getCanvas().style.cursor = 'pointer';
    const f = e.features[0];
    const statusCfg = STATUS_CONFIG[f.properties.status] || STATUS_CONFIG.pending;
    popup.current = new mapboxgl.Popup({ closeButton: false, offset: 14 })
      .setLngLat(f.geometry.coordinates)
      .setHTML(`<div style="padding:10px 14px;min-width:180px"><div style="font-weight:700;font-size:13px;margin-bottom:4px">${f.properties.id}</div><div style="font-size:12px;color:#555;margin-bottom:6px">${f.properties.address}</div><div style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;background:${statusCfg.color}20;color:${statusCfg.color}"><span style="width:6px;height:6px;border-radius:50%;background:${statusCfg.color}"></span>${statusCfg.label}</div></div>`)
      .addTo(map.current);
  }, []);

  const handleMarkerLeave = useCallback(() => {
    map.current.getCanvas().style.cursor = '';
    if (popup.current) { popup.current.remove(); popup.current = null; }
  }, []);

  const addOverlayLayers = useCallback((isSatellite) => {
    const lv = layersRef.current;
    if (!map.current.getSource('cadastral')) {
      map.current.addSource('cadastral', { type: 'raster', tiles: [CADASTRAL_TILE_URL], tileSize: 512 });
      map.current.addLayer({ id: 'cadastral-layer', type: 'raster', source: 'cadastral', layout: { visibility: lv.cadastral ? 'visible' : 'none' }, paint: { 'raster-opacity': 0.75 } });
    }
    if (!map.current.getSource('parcels')) {
      map.current.addSource('parcels', { type: 'geojson', data: parcels });
      map.current.addLayer({ id: 'parcels-fill', type: 'fill', source: 'parcels', layout: { visibility: lv.zoning ? 'visible' : 'none' },
        paint: { 'fill-color': ['match', ['get', 'zoning'], 'R', ZONING_COLORS['R'], 'CBD', ZONING_COLORS['CBD'], 'NHB', ZONING_COLORS['NHB'], 'GI', ZONING_COLORS['GI'], 'AG', ZONING_COLORS['AG'], 'PLI', ZONING_COLORS['PLI'], 'SE', ZONING_COLORS['SE'], '#9ca3af'], 'fill-opacity': isSatellite ? 0.18 : 0.32 } });
      map.current.addLayer({ id: 'parcels-line', type: 'line', source: 'parcels', layout: { visibility: lv.zoning ? 'visible' : 'none' }, paint: { 'line-color': isSatellite ? '#ffffff' : '#374151', 'line-width': 1 } });
      map.current.on('click', 'parcels-fill', (e) => { if (e.features.length > 0 && onParcelClickRef.current) onParcelClickRef.current(e.features[0].properties); });
      map.current.on('mouseenter', 'parcels-fill', () => { map.current.getCanvas().style.cursor = 'pointer'; });
      map.current.on('mouseleave', 'parcels-fill', () => { map.current.getCanvas().style.cursor = ''; });
    }
  }, [parcels]);

  const addPermitLayers = useCallback(() => {
    if (!map.current.getSource('permits')) {
      map.current.addSource('permits', { type: 'geojson', data: permitGeoJSON });
      map.current.addLayer({ id: 'permits-glow', type: 'circle', source: 'permits', paint: { 'circle-radius': 18, 'circle-color': ['match', ['get', 'status'], 'pending', '#eab308', 'under_review', '#3b82f6', 'approved', '#22c55e', 'denied', '#ef4444', 'completed', '#059669', '#6b7280'], 'circle-opacity': 0.2 }});
      map.current.addLayer({ id: 'permits-markers', type: 'circle', source: 'permits', paint: { 'circle-radius': 10, 'circle-color': ['match', ['get', 'status'], 'pending', '#eab308', 'under_review', '#3b82f6', 'approved', '#22c55e', 'denied', '#ef4444', 'completed', '#059669', '#6b7280'], 'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff' }});
      map.current.addLayer({ id: 'permits-labels', type: 'symbol', source: 'permits', layout: { 'text-field': ['get', 'typeCode'], 'text-size': 9, 'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'], 'text-allow-overlap': true }, paint: { 'text-color': '#ffffff' }});
      map.current.on('click', 'permits-markers', handleMarkerClick);
      map.current.on('click', 'permits-labels', handleMarkerClick);
      map.current.on('mouseenter', 'permits-markers', handleMarkerHover);
      map.current.on('mouseenter', 'permits-labels', handleMarkerHover);
      map.current.on('mouseleave', 'permits-markers', handleMarkerLeave);
      map.current.on('mouseleave', 'permits-labels', handleMarkerLeave);
    }
  }, [handleMarkerClick, handleMarkerHover, handleMarkerLeave, permitGeoJSON]);

  useEffect(() => {
    if (map.current) return;
    mapboxgl.accessToken = config.mapboxToken;
    map.current = new mapboxgl.Map({ container: mapContainer.current, style: 'mapbox://styles/mapbox/streets-v12', center: config.mapCenter, zoom: config.mapZoom });
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
    map.current.on('load', () => { addOverlayLayers(false); addPermitLayers(); setLoaded(true); });
    return () => { if (map.current) { map.current.remove(); map.current = null; } };
  }, []);

  useEffect(() => { if (loaded && map.current?.getSource('permits')) map.current.getSource('permits').setData(permitGeoJSON); }, [loaded, permitGeoJSON]);
  useEffect(() => { if (loaded && map.current && selectedPermit?.coords) map.current.flyTo({ center: selectedPermit.coords, zoom: 17, duration: 1000 }); }, [loaded, selectedPermit]);
  useEffect(() => { if (!loaded || !map.current) return; const vis = layers.zoning ? 'visible' : 'none'; if (map.current.getLayer('parcels-fill')) map.current.setLayoutProperty('parcels-fill', 'visibility', vis); if (map.current.getLayer('parcels-line')) map.current.setLayoutProperty('parcels-line', 'visibility', vis); }, [loaded, layers.zoning]);
  useEffect(() => { if (!loaded || !map.current) return; const vis = layers.cadastral ? 'visible' : 'none'; if (map.current.getLayer('cadastral-layer')) map.current.setLayoutProperty('cadastral-layer', 'visibility', vis); }, [loaded, layers.cadastral]);

  const toggleLayer = (id) => setLayers(prev => ({ ...prev, [id]: !prev[id] }));
  const MAP_LAYERS = [
    { id: 'zoning', label: 'Three Forks Zoning', desc: 'R · CBD · GI · AG · PLI', color: '#4ade80' },
    { id: 'cadastral', label: 'MT Cadastral', desc: 'Statewide parcel boundaries', color: '#60a5fa' },
  ];

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      {showControls && (
        <>
          <div className="absolute top-4 right-14 flex bg-white rounded-lg shadow-md border overflow-hidden z-10">
            {[{ id: 'streets', label: 'Streets', icon: 'map' }, { id: 'satellite', label: 'Satellite', icon: 'globe' }].map(s => (
              <button key={s.id} onClick={() => {
                setMapStyle(s.id);
                if (map.current) {
                  const style = s.id === 'satellite' ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/streets-v12';
                  const center = map.current.getCenter(); const zoom = map.current.getZoom();
                  map.current.setStyle(style);
                  map.current.once('style.load', () => { map.current.flyTo({ center, zoom, duration: 0 }); addOverlayLayers(s.id === 'satellite'); addPermitLayers(); });
                }
              }} className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium transition ${mapStyle === s.id ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Icon name={s.icon} size={12} /> {s.label}
              </button>
            ))}
          </div>
          <div className="absolute top-14 right-14 z-10">
            <button onClick={() => setShowLayerPanel(v => !v)} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg shadow-md border transition ${showLayerPanel || layers.zoning || layers.cadastral ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              <Icon name="layers" size={12} /> Layers
              {(layers.zoning || layers.cadastral) && <span className="bg-white/25 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 ml-0.5">{[layers.zoning, layers.cadastral].filter(Boolean).length}</span>}
            </button>
            {showLayerPanel && (
              <div className="absolute top-9 right-0 bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-52 z-20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5 px-1">Map Layers</p>
                <div className="space-y-1">
                  {MAP_LAYERS.map(l => (
                    <button key={l.id} onClick={() => toggleLayer(l.id)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition text-left ${layers[l.id] ? 'bg-sky-50 border border-sky-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                      <div className={`flex-shrink-0 w-8 h-4 rounded-full relative transition-colors ${layers[l.id] ? 'bg-sky-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${layers[l.id] ? 'left-4' : 'left-0.5'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: l.color }} /><span className="text-xs font-semibold text-gray-800 truncate">{l.label}</span></div>
                        <div className="text-[10px] text-gray-400 mt-0.5 pl-3.5">{l.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <div className="absolute bottom-8 left-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-3 text-xs max-w-xs border border-white/50 hidden md:block">
        <p className="font-bold text-gray-800 mb-2 text-[11px] uppercase tracking-wider">Permit Status</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(STATUS_CONFIG).filter(([k]) => ['pending','under_review','approved','denied'].includes(k)).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-white shadow" style={{ backgroundColor: val.color }} /><span className="text-gray-600">{val.label}</span></div>
          ))}
        </div>
        {layers.zoning && (
          <>
            <p className="font-bold text-gray-800 mb-2 mt-3 pt-2 border-t text-[11px] uppercase tracking-wider">Zoning</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(ZONING_COLORS).map(([zone, color]) => (
                <div key={zone} className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ backgroundColor: color, opacity: 0.6 }} /><span className="text-gray-600">{zone}</span></div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
