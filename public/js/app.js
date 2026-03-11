// ==========================================================================
// APP ROOT — data loading, view routing, auth
// ==========================================================================
const App = () => {
  const [view, setView] = useState('public');
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);
  const [permits, setPermits] = useState(SAMPLE_PERMITS);
  const [parcels, setParcels] = useState(SAMPLE_PARCELS);
  const [stats, setStats] = useState(null);
  const [permitTypes, setPermitTypes] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const cfg = await api.getConfig();
      setServerOnline(true);
      setConfig(normalizeConfig(cfg));

      const [permitsData, parcelsData, statsData, typesData] = await Promise.all([
        api.getPermits(), api.getParcels(), api.getStats(), api.getPermitTypes(),
      ]);

      if (permitsData) setPermits(permitsData.map(transformPermit));
      if (parcelsData) setParcels(parcelsData);
      if (statsData) setStats(statsData);
      if (typesData) setPermitTypes(typesData);

      try { const me = await api.getMe(); if (me) setUser(me); } catch {}
    } catch {
      setServerOnline(false);
      setDemoMode(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { document.title = `Town of ${config.cityName} — City Services`; }, [config.cityName]);

  const handleLogin = (userData) => { setUser(userData); setShowLogin(false); setView('staff'); };
  const handleLogout = async () => {
    if (serverOnline) { try { await api.logout(); } catch {} }
    setUser(null); setDemoMode(false); setView('public');
  };
  const handleStaffLogin = () => { setShowLogin(true); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="none" style={{opacity: 0.06}}>
          <path d="M0,600 L120,580 L280,500 L380,530 L500,420 L620,480 L720,380 L840,430 L960,350 L1100,400 L1200,320 L1320,370 L1440,300 L1440,900 L0,900 Z" fill="white"/>
        </svg>
        <div className="text-center relative z-10 fade-in">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-white/15 backdrop-blur border border-white/20" style={{animation: 'pulse-slow 2s ease-in-out infinite'}}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
              <path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19"/>
            </svg>
          </div>
          <h2 className="text-white text-2xl font-extrabold tracking-tight">Town of Three Forks</h2>
          <p className="text-sky-300 text-sm mt-1 font-medium">City Services Portal</p>
          <div className="mt-6 flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-sky-400 rounded-full" style={{animation: 'pulse-slow 1.5s ease-in-out infinite'}} />
            <div className="w-1.5 h-1.5 bg-sky-400 rounded-full" style={{animation: 'pulse-slow 1.5s ease-in-out 0.3s infinite'}} />
            <div className="w-1.5 h-1.5 bg-sky-400 rounded-full" style={{animation: 'pulse-slow 1.5s ease-in-out 0.6s infinite'}} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      {view === 'staff' ? (
        <StaffDashboard
          config={config} permits={permits} parcels={parcels}
          stats={stats} permitTypes={permitTypes} user={user}
          demoMode={demoMode} onLogout={handleLogout}
          onSwitchToPublic={() => setView('public')} onRefresh={loadData}
        />
      ) : (
        <PublicPortal config={config} permits={permits} parcels={parcels} permitTypes={permitTypes}
          demoMode={demoMode} onStaffLogin={handleStaffLogin} onRefresh={loadData} />
      )}
      {showLogin && (
        <LoginModal
          onLogin={handleLogin}
          onCancel={() => setShowLogin(false)}
          onDemoMode={() => { setDemoMode(true); setShowLogin(false); setView('staff'); }}
        />
      )}
    </ToastProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
