// ==========================================================================
// MAP COMPONENT — Mapbox GL JS with overlay layers + city infrastructure
// ==========================================================================
const CADASTRAL_TILE_URL = 'https://gisservicemt.gov/arcgis/rest/services/MSDI_Framework/Parcels/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true&f=image';
const FEMA_FLOOD_URL = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true&layers=show:28&f=image';
const HYDRANTS_URL = 'https://gis.gallatin.mt.gov/arcgis/rest/services/ESZ/ESZ/MapServer/3/query';
const WATER_SUPPLY_URL = 'https://gis.gallatin.mt.gov/arcgis/rest/services/ESZ/ESZ/MapServer/7/query';
const WASTEWATER_URL = 'https://gis.gallatin.mt.gov/arcgis/rest/services/ESZ/ESZ/MapServer/6/query';
const SUBDIVISIONS_URL = 'https://gis.gallatin.mt.gov/arcgis/rest/services/Subdivision/SubDivision/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true&f=image';
const FIRE_DISTRICTS_URL = 'https://gis.gallatin.mt.gov/arcgis/rest/services/ESZ/ESZ/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true&layers=show:0&f=image';

// Infrastructure layer definitions
const INFRA_LAYERS = [
  { id: 'zoning', label: 'Three Forks Zoning', desc: 'R · CBD · GI · AG · PLI', color: '#4ade80', group: 'Planning' },
  { id: 'cadastral', label: 'MT Cadastral', desc: 'Statewide parcel boundaries', color: '#60a5fa', group: 'Planning' },
  { id: 'subdivisions', label: 'Subdivisions', desc: 'Major & minor subdivisions', color: '#a78bfa', group: 'Planning' },
  { id: 'floodplain', label: 'FEMA Floodplain', desc: '100-year flood zones', color: '#38bdf8', group: 'Hazards' },
  { id: 'fire_districts', label: 'Fire Districts', desc: 'Fire service boundaries', color: '#f87171', group: 'Services' },
  { id: 'hydrants', label: 'Fire Hydrants', desc: 'Hydrants & fill sites', color: '#ef4444', group: 'Services' },
  { id: 'water', label: 'Water Supply', desc: 'Water supply systems', color: '#06b6d4', group: 'Utilities' },
  { id: 'wastewater', label: 'Wastewater', desc: 'Treatment systems', color: '#8b5cf6', group: 'Utilities' },
];

const PERMIT_STATUSES = [
  { id: 'pending', label: 'Pending', color: '#eab308' },
  { id: 'under_review', label: 'Under Review', color: '#3b82f6' },
  { id: 'approved', label: 'Approved', color: '#22c55e' },
  { id: 'denied', label: 'Denied', color: '#ef4444' },
  { id: 'completed', label: 'Completed', color: '#059669' },
];

const PermitMap = ({ permits, parcels, selectedPermit, onPermitClick, onParcelClick, config, className = 'h-full', showControls = true, showInfrastructure = false }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState('streets');
  const [layers, setLayers] = useState({ zoning: false, cadastral: false, floodplain: false, hydrants: false, water: false, wastewater: false, subdivisions: false, fire_districts: false });
  const [statusFilters, setStatusFilters] = useState({ pending: true, under_review: true, approved: true, denied: true, completed: true });
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
    features: permits.filter(p => p.coords && statusFilters[p.status]).map(p => ({
      type: 'Feature',
      properties: { id: p.id, typeCode: p.typeCode, status: p.status, address: p.address, type: p.type, applicant: p.applicant },
      geometry: { type: 'Point', coordinates: p.coords },
    })),
  }), [permits, statusFilters]);

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

  // Load point features from ArcGIS REST (hydrants, water, wastewater)
  const loadPointFeatures = useCallback(async (sourceId, url, color, iconLabel) => {
    if (map.current.getSource(sourceId)) return;
    try {
      const bounds = map.current.getBounds();
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      const res = await fetch(`${url}?where=1=1&geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=4326&outSR=4326&outFields=*&f=geojson&resultRecordCount=500`);
      const data = await res.json();
      if (!data.features) return;
      map.current.addSource(sourceId, { type: 'geojson', data });
      map.current.addLayer({ id: `${sourceId}-markers`, type: 'circle', source: sourceId, paint: {
        'circle-radius': 5, 'circle-color': color, 'circle-stroke-width': 1.5, 'circle-stroke-color': '#ffffff',
      }});
    } catch {}
  }, []);

  const addOverlayLayers = useCallback((isSatellite) => {
    const lv = layersRef.current;
    // Cadastral
    if (!map.current.getSource('cadastral')) {
      map.current.addSource('cadastral', { type: 'raster', tiles: [CADASTRAL_TILE_URL], tileSize: 512 });
      map.current.addLayer({ id: 'cadastral-layer', type: 'raster', source: 'cadastral', layout: { visibility: lv.cadastral ? 'visible' : 'none' }, paint: { 'raster-opacity': 0.75 } });
    }
    // FEMA Floodplain
    if (!map.current.getSource('floodplain')) {
      map.current.addSource('floodplain', { type: 'raster', tiles: [FEMA_FLOOD_URL], tileSize: 512 });
      map.current.addLayer({ id: 'floodplain-layer', type: 'raster', source: 'floodplain', layout: { visibility: lv.floodplain ? 'visible' : 'none' }, paint: { 'raster-opacity': 0.5 } });
    }
    // Subdivisions
    if (!map.current.getSource('subdivisions')) {
      map.current.addSource('subdivisions', { type: 'raster', tiles: [SUBDIVISIONS_URL], tileSize: 512 });
      map.current.addLayer({ id: 'subdivisions-layer', type: 'raster', source: 'subdivisions', layout: { visibility: lv.subdivisions ? 'visible' : 'none' }, paint: { 'raster-opacity': 0.6 } });
    }
    // Fire Districts
    if (!map.current.getSource('fire_districts')) {
      map.current.addSource('fire_districts', { type: 'raster', tiles: [FIRE_DISTRICTS_URL], tileSize: 512 });
      map.current.addLayer({ id: 'fire_districts-layer', type: 'raster', source: 'fire_districts', layout: { visibility: lv.fire_districts ? 'visible' : 'none' }, paint: { 'raster-opacity': 0.4 } });
    }
    // Zoning (from GeoJSON parcels)
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

  // Toggle raster/vector layers visibility
  useEffect(() => { if (!loaded || !map.current) return; const vis = layers.zoning ? 'visible' : 'none'; if (map.current.getLayer('parcels-fill')) map.current.setLayoutProperty('parcels-fill', 'visibility', vis); if (map.current.getLayer('parcels-line')) map.current.setLayoutProperty('parcels-line', 'visibility', vis); }, [loaded, layers.zoning]);
  useEffect(() => { if (!loaded || !map.current) return; const vis = layers.cadastral ? 'visible' : 'none'; if (map.current.getLayer('cadastral-layer')) map.current.setLayoutProperty('cadastral-layer', 'visibility', vis); }, [loaded, layers.cadastral]);
  useEffect(() => { if (!loaded || !map.current) return; const vis = layers.floodplain ? 'visible' : 'none'; if (map.current.getLayer('floodplain-layer')) map.current.setLayoutProperty('floodplain-layer', 'visibility', vis); }, [loaded, layers.floodplain]);
  useEffect(() => { if (!loaded || !map.current) return; const vis = layers.subdivisions ? 'visible' : 'none'; if (map.current.getLayer('subdivisions-layer')) map.current.setLayoutProperty('subdivisions-layer', 'visibility', vis); }, [loaded, layers.subdivisions]);
  useEffect(() => { if (!loaded || !map.current) return; const vis = layers.fire_districts ? 'visible' : 'none'; if (map.current.getLayer('fire_districts-layer')) map.current.setLayoutProperty('fire_districts-layer', 'visibility', vis); }, [loaded, layers.fire_districts]);

  // Load/remove point layers (hydrants, water, wastewater) on toggle
  useEffect(() => {
    if (!loaded || !map.current) return;
    if (layers.hydrants) { loadPointFeatures('hydrants', HYDRANTS_URL, '#ef4444', 'H'); }
    else if (map.current.getLayer('hydrants-markers')) { map.current.removeLayer('hydrants-markers'); map.current.removeSource('hydrants'); }
  }, [loaded, layers.hydrants]);
  useEffect(() => {
    if (!loaded || !map.current) return;
    if (layers.water) { loadPointFeatures('water', WATER_SUPPLY_URL, '#06b6d4', 'W'); }
    else if (map.current.getLayer('water-markers')) { map.current.removeLayer('water-markers'); map.current.removeSource('water'); }
  }, [loaded, layers.water]);
  useEffect(() => {
    if (!loaded || !map.current) return;
    if (layers.wastewater) { loadPointFeatures('wastewater', WASTEWATER_URL, '#8b5cf6', 'S'); }
    else if (map.current.getLayer('wastewater-markers')) { map.current.removeLayer('wastewater-markers'); map.current.removeSource('wastewater'); }
  }, [loaded, layers.wastewater]);

  const toggleLayer = (id) => setLayers(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleStatus = (id) => setStatusFilters(prev => ({ ...prev, [id]: !prev[id] }));
  const activeLayerCount = Object.values(layers).filter(Boolean).length;
  const groups = [...new Set(INFRA_LAYERS.map(l => l.group))];

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      {showControls && (
        <>
          {/* Style toggle */}
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
          {/* Layers button — only for staff infrastructure view */}
          {showInfrastructure && <div className="absolute top-14 right-14 z-10">
            <button onClick={() => setShowLayerPanel(v => !v)} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg shadow-md border transition ${showLayerPanel || activeLayerCount > 0 ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              <Icon name="layers" size={12} /> Layers
              {activeLayerCount > 0 && <span className="bg-white/25 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 ml-0.5">{activeLayerCount}</span>}
            </button>
            {showLayerPanel && (
              <div className="absolute top-9 right-0 bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-64 z-20 max-h-[70vh] overflow-auto">
                {groups.map(g => (
                  <div key={g} className="mb-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 px-1">{g}</p>
                    <div className="space-y-0.5">
                      {INFRA_LAYERS.filter(l => l.group === g).map(l => (
                        <button key={l.id} onClick={() => toggleLayer(l.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition text-left ${layers[l.id] ? 'bg-sky-50 border border-sky-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                          <div className={`flex-shrink-0 w-7 h-3.5 rounded-full relative transition-colors ${layers[l.id] ? 'bg-sky-500' : 'bg-gray-300'}`}>
                            <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-all ${layers[l.id] ? 'left-3.5' : 'left-0.5'}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: l.color }} /><span className="text-[11px] font-semibold text-gray-800 truncate">{l.label}</span></div>
                            <div className="text-[9px] text-gray-400 pl-3">{l.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>}
        </>
      )}
      {/* Legend with toggleable permit statuses */}
      <div className="absolute bottom-8 left-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-3 text-xs max-w-xs border border-white/50 hidden md:block">
        <p className="font-bold text-gray-800 mb-2 text-[11px] uppercase tracking-wider">Permit Status</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {PERMIT_STATUSES.map(s => (
            <button key={s.id} onClick={() => toggleStatus(s.id)} className={`flex items-center gap-2 py-0.5 px-1 rounded transition text-left ${statusFilters[s.id] ? '' : 'opacity-30'}`}>
              <span className="w-3 h-3 rounded-full border-2 border-white shadow flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-gray-600">{s.label}</span>
            </button>
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
        {(layers.hydrants || layers.water || layers.wastewater) && (
          <>
            <p className="font-bold text-gray-800 mb-2 mt-3 pt-2 border-t text-[11px] uppercase tracking-wider">Infrastructure</p>
            <div className="space-y-1">
              {layers.hydrants && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor:'#ef4444'}} /><span className="text-gray-600">Fire Hydrants</span></div>}
              {layers.water && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor:'#06b6d4'}} /><span className="text-gray-600">Water Supply</span></div>}
              {layers.wastewater && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor:'#8b5cf6'}} /><span className="text-gray-600">Wastewater</span></div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ---------- Construction Map ----------
const CONSTRUCTION_COLORS = { approved: '#f59e0b', completed: '#059669' };
const ConstructionMap = ({ config, permits, parcels, onBack }) => {
  const [filter, setFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  const projects = useMemo(() =>
    permits.filter(p => (p.status === 'approved' || p.status === 'completed') && p.coords)
      .filter(p => filter === 'all' || p.status === filter),
  [permits, filter]);

  const geoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: projects.map(p => ({
      type: 'Feature',
      properties: { id: p.id, status: p.status, address: p.address, type: p.type, applicant: p.applicant, valuation: p.valuation || 0, description: p.description || '', submitted: p.submitted || '' },
      geometry: { type: 'Point', coordinates: p.coords },
    })),
  }), [projects]);

  useEffect(() => {
    if (map.current) return;
    if (!config.mapboxToken) { setMapError('Map configuration not available. Please try again later.'); return; }
    try {
    mapboxgl.accessToken = config.mapboxToken;
    map.current = new mapboxgl.Map({ container: mapContainer.current, style: 'mapbox://styles/mapbox/light-v11', center: config.mapCenter, zoom: config.mapZoom });
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.on('error', (e) => { if (!loaded) setMapError('Map failed to load. Check your connection.'); });
    map.current.on('load', () => {
      map.current.addSource('construction', { type: 'geojson', data: geoJSON });
      map.current.addLayer({ id: 'construction-glow', type: 'circle', source: 'construction', paint: {
        'circle-radius': 22, 'circle-opacity': 0.15,
        'circle-color': ['match', ['get', 'status'], 'approved', CONSTRUCTION_COLORS.approved, 'completed', CONSTRUCTION_COLORS.completed, '#6b7280'],
      }});
      map.current.addLayer({ id: 'construction-markers', type: 'circle', source: 'construction', paint: {
        'circle-radius': 10, 'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff',
        'circle-color': ['match', ['get', 'status'], 'approved', CONSTRUCTION_COLORS.approved, 'completed', CONSTRUCTION_COLORS.completed, '#6b7280'],
      }});
      map.current.addLayer({ id: 'construction-labels', type: 'symbol', source: 'construction', layout: {
        'text-field': ['match', ['get', 'status'], 'approved', '🔨', '✓'], 'text-size': 12, 'text-allow-overlap': true,
      }});
      map.current.on('click', 'construction-markers', (e) => {
        const f = e.features[0].properties;
        setSelectedProject(projects.find(p => p.id === f.id) || null);
      });
      map.current.on('mouseenter', 'construction-markers', (e) => {
        map.current.getCanvas().style.cursor = 'pointer';
        const f = e.features[0];
        const color = CONSTRUCTION_COLORS[f.properties.status] || '#6b7280';
        popup.current = new mapboxgl.Popup({ closeButton: false, offset: 14 })
          .setLngLat(f.geometry.coordinates)
          .setHTML(`<div style="padding:10px 14px;min-width:180px"><div style="font-weight:700;font-size:13px">${f.properties.address}</div><div style="font-size:12px;color:#555;margin:4px 0">${f.properties.type}</div><div style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;background:${color}20;color:${color}">${f.properties.status === 'approved' ? 'Under Construction' : 'Completed'}</div></div>`)
          .addTo(map.current);
      });
      map.current.on('mouseleave', 'construction-markers', () => {
        map.current.getCanvas().style.cursor = '';
        if (popup.current) { popup.current.remove(); popup.current = null; }
      });
      setLoaded(true);
    });
    return () => { if (map.current) { map.current.remove(); map.current = null; } };
    } catch (err) { setMapError('Failed to initialize map: ' + (err.message || 'Unknown error')); }
  }, [config.mapboxToken]);

  useEffect(() => { if (loaded && map.current?.getSource('construction')) map.current.getSource('construction').setData(geoJSON); }, [loaded, geoJSON]);

  const activeCount = permits.filter(p => p.status === 'approved' && p.coords).length;
  const completedCount = permits.filter(p => p.status === 'completed' && p.coords).length;

  if (mapError) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sky-700 hover:text-sky-800 text-sm font-medium"><Icon name="arrow-left" size={16} /> Back</button>
          <div className="h-5 w-px bg-gray-200" /><h1 className="text-lg font-bold text-gray-900">Construction Activity Map</h1>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md"><div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"><Icon name="alert-triangle" size={28} className="text-amber-600" /></div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Map Unavailable</h3>
          <p className="text-gray-500 text-sm mb-4">{mapError}</p>
          <button onClick={onBack} className="px-4 py-2 bg-sky-700 text-white rounded-lg text-sm font-medium hover:bg-sky-800">Return to Portal</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sky-700 hover:text-sky-800 text-sm font-medium"><Icon name="arrow-left" size={16} /> Back</button>
            <div className="h-5 w-px bg-gray-200" />
            <h1 className="text-lg font-bold text-gray-900">Construction Activity Map</h1>
          </div>
          <div className="flex items-center gap-2">
            {[{v:'all',l:'All Projects',ct:activeCount+completedCount},{v:'approved',l:'Active',ct:activeCount,c:'bg-amber-100 text-amber-800'},{v:'completed',l:'Completed',ct:completedCount,c:'bg-emerald-100 text-emerald-800'}].map(f => (
              <button key={f.v} onClick={() => setFilter(f.v)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter===f.v ? (f.c||'bg-sky-100 text-sky-800') : 'text-gray-500 hover:bg-gray-100'}`}>
                {f.l} ({f.ct})
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="flex-1 relative" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div ref={mapContainer} className="absolute inset-0" />
        <div className="absolute bottom-6 left-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 text-xs border z-10">
          <p className="font-bold text-gray-800 mb-2 text-[11px] uppercase tracking-wider">Construction Status</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-white shadow" style={{backgroundColor:CONSTRUCTION_COLORS.approved}} /><span className="text-gray-700 font-medium">Active Construction</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-white shadow" style={{backgroundColor:CONSTRUCTION_COLORS.completed}} /><span className="text-gray-700 font-medium">Completed</span></div>
          </div>
        </div>
        {selectedProject && (
          <div className="absolute top-4 right-4 bg-white rounded-xl shadow-xl border w-80 z-20 overflow-hidden">
            <div className={`px-4 py-3 ${selectedProject.status === 'approved' ? 'bg-amber-50 border-b border-amber-100' : 'bg-emerald-50 border-b border-emerald-100'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">{selectedProject.id}</span>
                <button onClick={() => setSelectedProject(null)} className="text-gray-400 hover:text-gray-600"><Icon name="x" size={16} /></button>
              </div>
              <StatusBadge status={selectedProject.status} />
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div><div className="text-[10px] text-gray-400 uppercase font-semibold">Address</div><div className="font-medium">{selectedProject.address}</div></div>
              <div><div className="text-[10px] text-gray-400 uppercase font-semibold">Project Type</div><div className="font-medium">{selectedProject.type}</div></div>
              <div><div className="text-[10px] text-gray-400 uppercase font-semibold">Applicant</div><div className="text-gray-600">{selectedProject.applicant}</div></div>
              {selectedProject.valuation > 0 && <div><div className="text-[10px] text-gray-400 uppercase font-semibold">Project Value</div><div className="font-medium">${Number(selectedProject.valuation).toLocaleString()}</div></div>}
              {selectedProject.description && <div><div className="text-[10px] text-gray-400 uppercase font-semibold">Description</div><div className="text-gray-600 text-xs leading-relaxed">{selectedProject.description}</div></div>}
              {selectedProject.submitted && <div><div className="text-[10px] text-gray-400 uppercase font-semibold">Submitted</div><div className="text-gray-500 text-xs">{selectedProject.submitted}</div></div>}
            </div>
          </div>
        )}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <div className="bg-white/95 backdrop-blur rounded-lg shadow px-3 py-2 text-center border">
            <div className="text-lg font-bold text-amber-600">{activeCount}</div>
            <div className="text-[10px] text-gray-500 font-medium">Active</div>
          </div>
          <div className="bg-white/95 backdrop-blur rounded-lg shadow px-3 py-2 text-center border">
            <div className="text-lg font-bold text-emerald-600">{completedCount}</div>
            <div className="text-[10px] text-gray-500 font-medium">Completed</div>
          </div>
          <div className="bg-white/95 backdrop-blur rounded-lg shadow px-3 py-2 text-center border">
            <div className="text-lg font-bold text-sky-600">${permits.filter(p => p.status === 'approved' && p.coords).reduce((s, p) => s + (p.valuation || 0), 0).toLocaleString()}</div>
            <div className="text-[10px] text-gray-500 font-medium">Active Value</div>
          </div>
        </div>
      </div>
    </div>
  );
};
