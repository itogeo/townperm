// ==========================================================================
// SHARED — Config, API layer, shared components
// ==========================================================================
const { useState, useEffect, useRef, useCallback, useMemo } = React;

const DEFAULT_CONFIG = {
  mapboxToken: '',
  cityName: 'Three Forks', cityState: 'MT',
  mapCenter: [-111.5513, 45.8930], mapZoom: 14,
};

const STATUS_CONFIG = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', color: '#eab308', label: 'PENDING' },
  under_review: { bg: 'bg-blue-100', text: 'text-blue-800', color: '#3b82f6', label: 'UNDER REVIEW' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', color: '#22c55e', label: 'APPROVED' },
  denied: { bg: 'bg-red-100', text: 'text-red-800', color: '#ef4444', label: 'DENIED' },
  active: { bg: 'bg-green-100', text: 'text-green-800', color: '#22c55e', label: 'ACTIVE' },
  submitted: { bg: 'bg-yellow-100', text: 'text-yellow-800', color: '#eab308', label: 'SUBMITTED' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', color: '#3b82f6', label: 'IN PROGRESS' },
  resolved: { bg: 'bg-green-100', text: 'text-green-800', color: '#22c55e', label: 'RESOLVED' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', color: '#6b7280', label: 'CANCELLED' },
};

const ZONING_COLORS = { 'R': '#4ade80', 'CBD': '#3b82f6', 'NHB': '#f97316', 'GI': '#a855f7', 'AG': '#84cc16', 'PLI': '#06b6d4', 'SE': '#f59e0b' };

const DEFAULT_PERMIT_TYPES = [
  { code: 'ZP-R', name: 'Zoning Permit - Residential', base_fee: 200 },
  { code: 'ZP-C', name: 'Zoning Permit - Commercial', base_fee: 200 },
  { code: 'ZP-G', name: 'Zoning Permit - Garage/Addition', base_fee: 100 },
  { code: 'ZP-D', name: 'Zoning Permit - Deck/Shed/Carport', base_fee: 50 },
  { code: 'ZP-A', name: 'Zoning Permit - ADU', base_fee: 250 },
  { code: 'FP', name: 'Floodplain Permit', base_fee: 500 },
  { code: 'CUP', name: 'Conditional Use Permit', base_fee: 500 },
  { code: 'VAR', name: 'Variance', base_fee: 500 },
  { code: 'SUB', name: 'Subdivision', base_fee: 500 },
  { code: 'WSC', name: 'Water/Sewer Connection', base_fee: 250 },
];

const SAMPLE_PARCELS = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { parcel_id: '06-0450-12-1-01-01-0000', address: '121 E Jefferson St', owner: 'Matt & Kelly Bugland', acres: 0.18, zoning: 'R', assessed_value: 245000 }, geometry: { type: 'Polygon', coordinates: [[[-111.5497,45.8932],[-111.5488,45.8932],[-111.5488,45.8927],[-111.5497,45.8927],[-111.5497,45.8932]]] } },
    { type: 'Feature', properties: { parcel_id: '06-0450-15-3-02-08-0000', address: '5 N Main St', owner: 'Sacajawea Hotel LLC', acres: 0.35, zoning: 'CBD', assessed_value: 1250000 }, geometry: { type: 'Polygon', coordinates: [[[-111.5518,45.8944],[-111.5508,45.8944],[-111.5508,45.8939],[-111.5518,45.8939],[-111.5518,45.8944]]] } },
  ],
};

const SAMPLE_PERMITS = [
  { id: 'ZP-R-2026-001', dbId: 1, type: 'Zoning Permit - Residential', typeCode: 'ZP-R', address: '121 E Jefferson St', applicant: 'Matt Bugland', status: 'approved', submitted: '2026-01-08', description: 'New duplex construction', zone: 'R', valuation: 385000, coords: [-111.54925, 45.89295] },
  { id: 'FP-2026-001', dbId: 2, type: 'Floodplain Permit', typeCode: 'FP', address: '502 1st Ave E', applicant: 'Robert Hansen', status: 'pending', submitted: '2026-02-18', description: 'Covered deck in flood zone', zone: 'R', valuation: 12500, coords: [-111.54985, 45.89050] },
  { id: 'ZP-C-2026-001', dbId: 3, type: 'Zoning Permit - Commercial', typeCode: 'ZP-C', address: '75 Vigilante Way', applicant: 'Bridger Brewing LLC', status: 'approved', submitted: '2026-01-22', description: 'Brewery taproom buildout', zone: 'NHB', valuation: 175000, coords: [-111.55500, 45.88650] },
  { id: 'CUP-2026-001', dbId: 4, type: 'Conditional Use Permit', typeCode: 'CUP', address: '219 4th Ave E', applicant: 'Diane Hay', status: 'under_review', submitted: '2026-02-05', description: 'Home massage therapy', zone: 'R', valuation: 0, coords: [-111.54730, 45.89340] },
];

// API layer
const api = {
  async request(path, opts = {}) {
    const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
    if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || `HTTP ${res.status}`); }
    return res.json();
  },
  getConfig: () => api.request('/api/config'),
  getPermits: (params = {}) => { const qs = new URLSearchParams(params).toString(); return api.request(`/api/permits${qs ? '?' + qs : ''}`); },
  getPermitDetail: (id) => api.request(`/api/permits/${id}`),
  createPermit: (data) => api.request('/api/permits', { method: 'POST', body: JSON.stringify(data) }),
  updatePermit: (id, data) => api.request(`/api/permits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getParcels: () => api.request('/api/parcels'),
  getStats: () => api.request('/api/stats'),
  getPermitTypes: () => api.request('/api/permit-types'),
  getCalendar: (start, end) => api.request(`/api/calendar${start ? `?start=${start}&end=${end}` : ''}`),
  getActivity: (limit = 30) => api.request(`/api/activity?limit=${limit}`),
  addComment: (permitId, data) => api.request(`/api/permits/${permitId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  addInspection: (permitId, data) => api.request(`/api/permits/${permitId}/inspections`, { method: 'POST', body: JSON.stringify(data) }),
  updateInspection: (id, data) => api.request(`/api/inspections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addPayment: (permitId, data) => api.request(`/api/permits/${permitId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  addDocument: (permitId, data) => api.request(`/api/permits/${permitId}/documents`, { method: 'POST', body: JSON.stringify(data) }),
  downloadDocument: (id) => api.request(`/api/documents/${id}/download`),
  getStaff: () => api.request('/api/staff'),
  login: (email, password) => api.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => api.request('/api/auth/logout', { method: 'POST' }),
  getMe: () => api.request('/api/auth/me'),
  // New module APIs
  getLicenses: (params = {}) => { const qs = new URLSearchParams(params).toString(); return api.request(`/api/licenses${qs ? '?' + qs : ''}`); },
  getLicenseDetail: (id) => api.request(`/api/licenses/${id}`),
  createLicense: (data) => api.request('/api/licenses', { method: 'POST', body: JSON.stringify(data) }),
  updateLicense: (id, data) => api.request(`/api/licenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLicenseTypes: () => api.request('/api/license-types'),
  getLicenseRenewals: (months = 3) => api.request(`/api/licenses/renewals?months=${months}`),
  getReservations: (params = {}) => { const qs = new URLSearchParams(params).toString(); return api.request(`/api/parks/reservations${qs ? '?' + qs : ''}`); },
  getReservationDetail: (id) => api.request(`/api/parks/reservations/${id}`),
  createReservation: (data) => api.request('/api/parks/reservations', { method: 'POST', body: JSON.stringify(data) }),
  updateReservation: (id, data) => api.request(`/api/parks/reservations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getFacilities: () => api.request('/api/parks/facilities'),
  getParkAvailability: (facilityId, month) => api.request(`/api/parks/availability?facility_id=${facilityId}&month=${month}`),
  getRequests: (params = {}) => { const qs = new URLSearchParams(params).toString(); return api.request(`/api/requests${qs ? '?' + qs : ''}`); },
  getRequestDetail: (id) => api.request(`/api/requests/${id}`),
  createRequest: (data) => api.request('/api/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateRequest: (id, data) => api.request(`/api/requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getRequestCategories: () => api.request('/api/request-categories'),
  getRequestsMap: () => api.request('/api/requests/map'),
};

function transformPermit(p) {
  return {
    id: p.permit_number, dbId: p.id, type: p.type_name, typeCode: p.type_code,
    address: p.address || '', parcel_id: p.parcel_id || '', applicant: p.applicant_name || '',
    status: p.status, submitted: p.submitted_at, reviewed: p.decision_date || p.reviewed_at,
    description: p.description || '', zone: p.zoning_district || '', valuation: p.valuation || 0,
    coords: (p.longitude && p.latitude) ? [p.longitude, p.latitude] : null,
    denial_reason: p.denial_reason, review_notes: p.review_notes, conditions: p.conditions,
    fees: p.fees_calculated, fees_paid: p.fees_paid,
  };
}

function normalizeConfig(cfg) {
  return {
    mapboxToken: cfg.mapbox_token || cfg.mapboxToken || DEFAULT_CONFIG.mapboxToken,
    cityName: cfg.city_name || cfg.cityName || DEFAULT_CONFIG.cityName,
    cityState: cfg.city_state || cfg.cityState || DEFAULT_CONFIG.cityState,
    mapCenter: cfg.map_center || cfg.mapCenter || DEFAULT_CONFIG.mapCenter,
    mapZoom: cfg.map_zoom || cfg.mapZoom || DEFAULT_CONFIG.mapZoom,
  };
}

// Toast system
const ToastContext = React.createContext(() => {});
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`toast-enter px-4 py-3 rounded-lg shadow-lg text-white text-sm max-w-sm ${t.type === 'error' ? 'bg-red-600' : t.type === 'warning' ? 'bg-yellow-600' : 'bg-green-600'}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
const useToast = () => React.useContext(ToastContext);

// Shared components
const Icon = ({ name, size = 20, className = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || typeof lucide === 'undefined') return;
    ref.current.innerHTML = '';
    const camel = name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
    const pascal = camel[0].toUpperCase() + camel.slice(1);
    const icon = lucide.icons?.[name] ?? lucide.icons?.[camel] ?? lucide.icons?.[pascal];
    if (icon?.toSvg) ref.current.innerHTML = icon.toSvg({ width: size, height: size });
    else if (icon && lucide.createElement) { const el = lucide.createElement(icon); el.setAttribute('width', size); el.setAttribute('height', size); ref.current.appendChild(el); }
  }, [name, size]);
  return <span ref={ref} className={`inline-flex items-center ${className}`} />;
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
};

const LoginModal = ({ onLogin, onCancel, onDemoMode }) => {
  const [email, setEmail] = useState('ksmith@threeforksmt.gov');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const user = await api.login(email, password); onLogin(user); } catch (err) { setError(err.message || 'Login failed'); }
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4"><Icon name="shield" size={32} className="text-white" /></div>
          <h2 className="text-xl font-bold text-gray-900">Staff Login</h2>
          <p className="text-sm text-gray-500 mt-1">Access the staff dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none" required style={{fontSize:'16px'}} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Any password (demo)" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none" style={{fontSize:'16px'}} /></div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div className="mt-4 pt-4 border-t text-center space-y-2">
          <button onClick={onDemoMode} className="text-sm text-green-600 hover:text-green-700 font-medium">Enter Demo Mode</button><br/>
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">Back to Public View</button>
        </div>
      </div>
    </div>
  );
};
