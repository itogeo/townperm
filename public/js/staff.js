// ==========================================================================
// STAFF DASHBOARD — City Management Platform
// ==========================================================================
const StaffDashboard = ({ config, permits, parcels, stats, permitTypes, user, demoMode, onLogout, onSwitchToPublic, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [permitDetail, setPermitDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('details');
  const [showNewPermit, setShowNewPermit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewNotes, setReviewNotes] = useState('');
  const [conditions, setConditions] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newInspType, setNewInspType] = useState('');
  const [newInspDate, setNewInspDate] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('check');
  const [payRef, setPayRef] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sortField, setSortField] = useState('submitted');
  const [sortDir, setSortDir] = useState('desc');
  // New module state
  const [licenses, setLicenses] = useState([]);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [licenseDetail, setLicenseDetail] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservationDetail, setReservationDetail] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDetail, setRequestDetail] = useState(null);
  const [moduleSearch, setModuleSearch] = useState('');
  const [moduleComment, setModuleComment] = useState('');
  const toast = useToast();

  const pendingCount = permits.filter(p => p.status === 'pending' || p.status === 'under_review').length;
  const pendingLicenses = licenses.filter(l => l.status === 'pending').length;
  const openRequests = requests.filter(r => r.status === 'submitted' || r.status === 'in_progress').length;
  const pendingReservations = reservations.filter(r => r.status === 'pending').length;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'permits', label: 'Permits', icon: 'file-text', badge: pendingCount },
    { id: 'licenses', label: 'Business Licenses', icon: 'badge', badge: pendingLicenses },
    { id: 'parks', label: 'Park Reservations', icon: 'trees', badge: pendingReservations },
    { id: 'requests', label: 'Citizen Requests', icon: 'message-circle', badge: openRequests },
    { id: 'calendar', label: 'Calendar', icon: 'calendar', badge: stats?.upcoming_inspections || 0 },
    { id: 'map', label: 'Map View', icon: 'map' },
    { id: 'reports', label: 'Reports', icon: 'bar-chart-3' },
  ];

  useEffect(() => { if (demoMode) return; if (activeTab === 'licenses' && !licenses.length) api.getLicenses().then(setLicenses).catch(() => {}); if (activeTab === 'parks' && !reservations.length) api.getReservations().then(setReservations).catch(() => {}); if (activeTab === 'requests' && !requests.length) api.getRequests().then(setRequests).catch(() => {}); }, [activeTab, demoMode]);
  useEffect(() => { if (demoMode) return; api.getLicenses().then(setLicenses).catch(() => {}); api.getReservations().then(setReservations).catch(() => {}); api.getRequests().then(setRequests).catch(() => {}); api.getCalendar().then(setCalendarEvents).catch(() => {}); api.getActivity(30).then(setActivityFeed).catch(() => {}); }, [demoMode]);

  const notifications = useMemo(() => {
    const items = [], today = new Date().toISOString().split('T')[0];
    calendarEvents.filter(e => e.date < today && e.status !== 'completed' && e.type !== 'inspection').forEach(e => items.push({ type: 'overdue', icon: 'alert-triangle', color: 'red', title: `Overdue: ${e.title}`, sub: `Due ${e.date}`, id: `dl-${e.id}` }));
    permits.filter(p => p.status === 'pending').forEach(p => { const days = Math.floor((Date.now() - new Date(p.submitted).getTime()) / 86400000); if (days > 14) items.push({ type: 'warning', icon: 'clock', color: 'amber', title: `${p.id} pending ${days} days`, sub: p.address, id: `p-${p.id}` }); });
    calendarEvents.filter(e => e.type === 'inspection' && e.date === today && e.status === 'scheduled').forEach(e => items.push({ type: 'info', icon: 'clipboard-check', color: 'blue', title: `Inspection today: ${e.title}`, sub: e.address, id: `i-${e.id}` }));
    return items;
  }, [calendarEvents, permits]);

  const calendarDays = useMemo(() => { const y = calendarMonth.getFullYear(), m = calendarMonth.getMonth(), first = new Date(y, m, 1).getDay(), total = new Date(y, m + 1, 0).getDate(), days = []; for (let i = 0; i < first; i++) days.push(null); for (let d = 1; d <= total; d++) days.push(d); return days; }, [calendarMonth]);
  const getEventsForDay = useCallback((day) => { if (!day) return []; const ds = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; return calendarEvents.filter(e => e.date === ds); }, [calendarMonth, calendarEvents]);

  const loadDetail = async (permit) => { setSelectedPermit(permit); setDetailTab('details'); setPermitDetail(null); if (!demoMode && permit.dbId) { try { setPermitDetail(await api.getPermitDetail(permit.dbId)); } catch {} } };
  const loadLicenseDetail = async (lic) => { setSelectedLicense(lic); setLicenseDetail(null); setModuleComment(''); if (!demoMode && lic.id) { try { setLicenseDetail(await api.getLicenseDetail(lic.id)); } catch {} } };
  const loadReservationDetail = async (res) => { setSelectedReservation(res); setReservationDetail(null); setModuleComment(''); if (!demoMode && res.id) { try { setReservationDetail(await api.getReservationDetail(res.id)); } catch {} } };
  const loadRequestDetail = async (req) => { setSelectedRequest(req); setRequestDetail(null); setModuleComment(''); if (!demoMode && req.id) { try { setRequestDetail(await api.getRequestDetail(req.id)); } catch {} } };

  const filteredPermits = useMemo(() => {
    return permits.filter(p => {
      const q = searchQuery.toLowerCase();
      const ms = !q || p.address.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.applicant.toLowerCase().includes(q) || (p.type||'').toLowerCase().includes(q) || (p.zone||'').toLowerCase().includes(q);
      return ms && (statusFilter === 'all' || p.status === statusFilter);
    }).sort((a, b) => {
      const numFields = ['valuation', 'fees', 'fees_paid'];
      let va = numFields.includes(sortField) ? (Number(a[sortField]) || 0) : (a[sortField] || '');
      let vb = numFields.includes(sortField) ? (Number(b[sortField]) || 0) : (b[sortField] || '');
      return va < vb ? (sortDir === 'asc' ? -1 : 1) : va > vb ? (sortDir === 'asc' ? 1 : -1) : 0;
    });
  }, [permits, searchQuery, statusFilter, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // Permit actions
  const handleAction = async (permit, status, extra = {}) => {
    if (demoMode) { toast('Demo mode — changes not saved', 'warning'); return; }
    setUpdating(true);
    try {
      await api.updatePermit(permit.dbId, { status, review_notes: reviewNotes, conditions, ...extra });
      toast(`Permit ${permit.id} ${status.replace('_', ' ')}`);
      setSelectedPermit(null); setPermitDetail(null);
      setReviewNotes(''); setConditions(''); setDenialReason(''); setShowDenyForm(false);
      onRefresh();
    } catch (err) { toast(err.message, 'error'); }
    setUpdating(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPermit) return;
    if (demoMode) { toast('Demo mode', 'warning'); return; }
    try {
      await api.addComment(selectedPermit.dbId, { comment: newComment });
      setNewComment(''); setPermitDetail(await api.getPermitDetail(selectedPermit.dbId));
      toast('Comment added');
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleAddInspection = async () => {
    if (!newInspType || !newInspDate || !selectedPermit) return;
    if (demoMode) { toast('Demo mode', 'warning'); return; }
    try {
      await api.addInspection(selectedPermit.dbId, { inspection_type: newInspType, scheduled_date: newInspDate });
      setNewInspType(''); setNewInspDate('');
      setPermitDetail(await api.getPermitDetail(selectedPermit.dbId));
      api.getCalendar().then(setCalendarEvents).catch(() => {});
      toast('Inspection scheduled');
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleInspResult = async (inspId, result) => {
    if (demoMode) { toast('Demo mode', 'warning'); return; }
    try {
      await api.updateInspection(inspId, { status: result === 'pass' ? 'passed' : 'failed', result });
      setPermitDetail(await api.getPermitDetail(selectedPermit.dbId));
      toast(`Inspection ${result === 'pass' ? 'passed' : 'failed'}`);
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleAddPayment = async () => {
    if (!payAmount || !selectedPermit) return;
    if (demoMode) { toast('Demo mode', 'warning'); return; }
    try {
      await api.addPayment(selectedPermit.dbId, { amount: parseFloat(payAmount), payment_method: payMethod, reference_number: payRef });
      setPayAmount(''); setPayRef('');
      setPermitDetail(await api.getPermitDetail(selectedPermit.dbId));
      onRefresh(); toast('Payment recorded');
    } catch (err) { toast(err.message, 'error'); }
  };

  // Module update action
  const handleModuleAction = async (type, id, data) => {
    if (demoMode) { toast('Demo mode', 'warning'); return; }
    setUpdating(true);
    try {
      if (type === 'license') { await api.updateLicense(id, data); setLicenseDetail(await api.getLicenseDetail(id)); setLicenses(await api.getLicenses()); }
      else if (type === 'reservation') { await api.updateReservation(id, data); setReservationDetail(await api.getReservationDetail(id)); setReservations(await api.getReservations()); }
      else if (type === 'request') { await api.updateRequest(id, data); setRequestDetail(await api.getRequestDetail(id)); setRequests(await api.getRequests()); }
      toast(`Updated successfully`);
    } catch (err) { toast(err.message, 'error'); }
    setUpdating(false);
  };

  const printPermit = useCallback((permit, detail) => {
    const w = window.open('', '_blank');
    const sc = STATUS_CONFIG[permit.status] || STATUS_CONFIG.pending;
    w.document.write(`<!DOCTYPE html><html><head><title>Permit ${permit.id}</title><style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#333;font-size:14px;line-height:1.5}h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;color:#0369a1;margin:20px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #0369a1;padding-bottom:12px;margin-bottom:20px}.badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.lbl{font-size:11px;color:#888;text-transform:uppercase;font-weight:600}.val{font-size:14px;font-weight:600}table{width:100%;border-collapse:collapse;margin:8px 0}td,th{border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:12px}th{background:#f9fafb;font-weight:600}@media print{body{margin:20px}}</style></head><body>
      <div class="hdr"><div><h1>Town of Three Forks</h1><div style="font-size:12px;color:#0369a1">Development & Permitting</div></div><div style="text-align:right"><div style="font-size:18px;font-weight:800">${permit.id}</div><span class="badge" style="background:${sc.color}20;color:${sc.color}">${sc.label}</span></div></div>
      <div class="grid"><div><div class="lbl">Address</div><div class="val">${permit.address}</div></div><div><div class="lbl">Applicant</div><div class="val">${permit.applicant}</div></div><div><div class="lbl">Type</div><div class="val">${permit.type}</div></div><div><div class="lbl">Value</div><div class="val">$${(permit.valuation||0).toLocaleString()}</div></div><div><div class="lbl">Submitted</div><div class="val">${permit.submitted||'--'}</div></div><div><div class="lbl">Zone</div><div class="val">${permit.zone||'--'}</div></div></div>
      <h2>Description</h2><p>${permit.description||'--'}</p>
      ${permit.conditions ? `<h2>Conditions</h2><p>${permit.conditions}</p>` : ''}${permit.denial_reason ? `<h2>Denial Reason</h2><p>${permit.denial_reason}</p>` : ''}
      ${detail?.inspections?.length ? `<h2>Inspections</h2><table><tr><th>Type</th><th>Date</th><th>Status</th><th>Notes</th></tr>${detail.inspections.map(i=>`<tr><td>${i.inspection_type}</td><td>${i.scheduled_date}</td><td>${i.status}</td><td>${i.notes||''}</td></tr>`).join('')}</table>` : ''}
      ${detail?.payments?.length ? `<h2>Payments</h2><table><tr><th>Amount</th><th>Method</th><th>Ref</th><th>Date</th></tr>${detail.payments.map(p=>`<tr><td>$${p.amount}</td><td>${p.payment_method}</td><td>${p.reference_number||''}</td><td>${(p.received_at||'').split('T')[0]}</td></tr>`).join('')}</table>` : ''}
      <div style="margin-top:40px;border-top:1px solid #e5e7eb;padding-top:12px;font-size:11px;color:#888;text-align:center">Town of Three Forks &bull; 206 Main Street &bull; Three Forks, MT 59752 &bull; (406) 285-3431<br/>Printed ${new Date().toLocaleDateString()}</div>
    </body></html>`);
    w.document.close(); w.print();
  }, []);

  const exportCSV = () => {
    const h = ['Permit #','Type','Address','Applicant','Status','Submitted','Valuation','Fees Due','Fees Paid'];
    const rows = permits.map(p => [p.id,p.type,p.address,p.applicant,p.status,p.submitted,p.valuation,p.fees||'',p.fees_paid||'']);
    const csv = [h,...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `permits_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    toast('CSV exported');
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const inp = "w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none";

  // Reusable field renderer
  const Field = ({ label, children }) => (
    <div><div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">{label}</div><div className="text-sm font-medium">{children}</div></div>
  );

  // Generic module table + detail panel
  const ModulePanel = ({ items, selected, onSelect, onClose, columns, renderDetail, filterFn }) => {
    const q = moduleSearch.toLowerCase();
    const filtered = items.filter(item => {
      const ms = !q || (filterFn ? filterFn(item, q) : JSON.stringify(item).toLowerCase().includes(q));
      return ms;
    });
    return (
      <div className="flex gap-5 h-full">
        <div className={`${selected ? 'w-full lg:w-1/2 xl:w-3/5' : 'w-full'} flex-shrink-0`}>
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-3 border-b flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search..." value={moduleSearch} onChange={e => setModuleSearch(e.target.value)} className="pl-9 pr-3 py-2 border rounded-lg text-sm w-full focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <span className="text-xs text-gray-400">{filtered.length} items</span>
            </div>
            <div className="max-h-[calc(100vh-240px)] overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider sticky top-0">
                  <tr>{columns.map(c => <th key={c.key} className={`${c.hideMobile ? 'hidden sm:table-cell' : ''} px-3 py-2.5 font-semibold`}>{c.label}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(item => (
                    <tr key={item.id} className={`hover:bg-sky-50/50 cursor-pointer transition ${selected?.id === item.id ? 'bg-sky-50 border-l-2 border-sky-500' : ''}`} onClick={() => onSelect(item)}>
                      {columns.map(c => <td key={c.key} className={`${c.hideMobile ? 'hidden sm:table-cell' : ''} px-3 py-2.5 text-sm`}>{c.render ? c.render(item) : item[c.key]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {selected && (
          <div className="permit-detail-overlay flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border sticky top-0">
              <div className="p-3 border-b flex items-center justify-between bg-gray-50 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="lg:hidden flex items-center gap-1 text-sky-600 text-xs font-semibold px-2 py-1 rounded hover:bg-sky-100"><Icon name="arrow-left" size={14} /> Back</button>
                  <span className="font-bold text-sm">{selected.license_number || selected.reservation_number || selected.request_number || `#${selected.id}`}</span>
                  <StatusBadge status={selected.status} />
                </div>
                <button onClick={onClose} className="hidden lg:flex text-gray-400 hover:text-gray-600 w-7 h-7 rounded items-center justify-center hover:bg-gray-200"><Icon name="x" size={16} /></button>
              </div>
              <div className="p-4 max-h-[calc(100vh-320px)] overflow-auto">{renderDetail(selected)}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Action button helper
  const ActBtn = ({ onClick, color, icon, label }) => (
    <button onClick={onClick} disabled={updating} className={`flex-1 bg-${color}-600 text-white py-2 rounded-lg hover:bg-${color}-700 disabled:opacity-50 flex items-center justify-center gap-1 text-sm font-medium`}>
      <Icon name={icon} size={15} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      {/* Sidebar */}
      <aside className={`w-64 bg-gray-900 text-white flex flex-col min-h-screen flex-shrink-0 fixed lg:relative z-50 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 hero-gradient rounded-lg flex items-center justify-center shadow">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
            </div>
            <div><h1 className="font-bold text-sm">Ito DevTracker</h1><p className="text-xs text-gray-400">{config.cityName}, {config.cityState}</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {tabs.map(tab => (
              <li key={tab.id}>
                <button onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); setModuleSearch(''); if (tab.id !== 'permits') { setSelectedPermit(null); setPermitDetail(null); } if (tab.id !== 'licenses') setSelectedLicense(null); if (tab.id !== 'parks') setSelectedReservation(null); if (tab.id !== 'requests') setSelectedRequest(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${activeTab === tab.id ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                  <Icon name={tab.icon} size={18} /><span>{tab.label}</span>
                  {tab.badge > 0 && <span className="ml-auto bg-yellow-500 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tab.badge}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-1">
          <button onClick={onSwitchToPublic} className="w-full text-left text-sm text-gray-400 hover:text-white flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800 transition"><Icon name="eye" size={16} /> Public Portal</button>
          <button onClick={onLogout} className="w-full text-left text-sm text-gray-400 hover:text-white flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800 transition"><Icon name="log-out" size={16} /> Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {demoMode && <div className="bg-amber-400 text-amber-900 text-center text-xs py-1.5 font-semibold tracking-wide">DEMO MODE — Sample data. Log in with staff credentials for live data.</div>}
        <header className="bg-white border-b px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"><Icon name="menu" size={20} /></button>
            <div><h2 className="text-lg font-bold text-gray-900">{tabs.find(t => t.id === activeTab)?.label}</h2><p className="text-xs text-gray-500">{today}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setShowNotifications(false); }}>
              <button onClick={() => setShowNotifications(!showNotifications)} className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${notifications.length > 0 ? 'text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                <Icon name="bell" size={18} />
                {notifications.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{notifications.length}</span>}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border z-50 max-h-96 overflow-auto">
                  <div className="p-3 border-b flex items-center justify-between"><span className="font-bold text-sm text-gray-900">Notifications</span><span className="text-[10px] text-gray-400">{notifications.length}</span></div>
                  {notifications.length === 0 && <div className="p-6 text-center text-sm text-gray-400">All clear!</div>}
                  {notifications.map(n => (
                    <div key={n.id} className="px-3 py-2.5 border-b last:border-0 hover:bg-gray-50 flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg bg-${n.color}-100 flex items-center justify-center flex-shrink-0 mt-0.5`}><Icon name={n.icon} size={14} className={`text-${n.color}-600`} /></div>
                      <div><div className="text-xs font-semibold text-gray-900">{n.title}</div><div className="text-[10px] text-gray-500">{n.sub}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowNewPermit(true)} className="flex items-center gap-1.5 bg-sky-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-sky-700 shadow-sm font-medium">
              <Icon name="plus" size={15} /> <span className="hidden sm:inline">New Permit</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l">
              <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{user ? `${user.first_name?.[0]||''}${user.last_name?.[0]||''}` : 'DM'}</div>
              <div><div className="text-sm font-medium text-gray-900">{user ? `${user.first_name} ${user.last_name}` : 'Demo User'}</div><div className="text-[10px] text-gray-500">{user?.title || 'Staff'}</div></div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-5 overflow-auto">
          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Needs Review', value: pendingCount, color: 'amber', icon: 'clock' },
                  { label: 'Active Licenses', value: licenses.filter(l => l.status === 'active').length, color: 'emerald', icon: 'badge' },
                  { label: 'Open Requests', value: openRequests, color: 'blue', icon: 'message-circle' },
                  { label: 'Upcoming Reservations', value: reservations.filter(r => r.status === 'approved' || r.status === 'pending').length, color: 'violet', icon: 'trees' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</span>
                      <div className={`w-8 h-8 bg-${s.color}-100 rounded-lg flex items-center justify-center`}><Icon name={s.icon} size={16} className={`text-${s.color}-600`} /></div>
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2"><Icon name="alert-circle" size={15} className="text-amber-500" /> Action Required</h3>
                    <span className="text-xs text-gray-400">{pendingCount + pendingLicenses + openRequests + pendingReservations} items</span>
                  </div>
                  <div className="divide-y max-h-72 overflow-auto">
                    {permits.filter(p => p.status === 'pending' || p.status === 'under_review').map(p => (
                      <div key={`p-${p.id}`} className="p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => { setActiveTab('permits'); loadDetail(p); }}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${p.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <div><div className="font-medium text-sm">{p.id}</div><div className="text-xs text-gray-500">{p.address} — Permit</div></div>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    ))}
                    {licenses.filter(l => l.status === 'pending').map(l => (
                      <div key={`l-${l.id}`} className="p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => { setActiveTab('licenses'); loadLicenseDetail(l); }}>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <div><div className="font-medium text-sm">{l.license_number || `License #${l.id}`}</div><div className="text-xs text-gray-500">{l.business_name} — License</div></div>
                        </div>
                        <StatusBadge status="pending" />
                      </div>
                    ))}
                    {reservations.filter(r => r.status === 'pending').map(r => (
                      <div key={`rv-${r.id}`} className="p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => { setActiveTab('parks'); loadReservationDetail(r); }}>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div><div className="font-medium text-sm">{r.reservation_number || `Res #${r.id}`}</div><div className="text-xs text-gray-500">{r.event_name || r.facility_name} — Reservation</div></div>
                        </div>
                        <StatusBadge status="pending" />
                      </div>
                    ))}
                    {requests.filter(r => r.status === 'submitted').slice(0, 5).map(r => (
                      <div key={`rq-${r.id}`} className="p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => { setActiveTab('requests'); loadRequestDetail(r); }}>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <div><div className="font-medium text-sm">{r.request_number || `Request #${r.id}`}</div><div className="text-xs text-gray-500">{r.category} — Request</div></div>
                        </div>
                        <StatusBadge status="submitted" />
                      </div>
                    ))}
                    {(pendingCount + pendingLicenses + pendingReservations + openRequests) === 0 && <div className="p-6 text-center text-gray-400 text-sm">All caught up!</div>}
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Icon name="dollar-sign" size={15} className="text-emerald-600" /> Fee Collection</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Due</span><span className="font-semibold">${(stats?.fees_due || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Collected</span><span className="font-semibold text-emerald-600">${(stats?.fees_collected || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm border-t pt-2"><span className="text-gray-500">Outstanding</span><span className="font-semibold text-amber-600">${(stats?.fees_outstanding || 0).toLocaleString()}</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 mt-1 overflow-hidden"><div className="bg-emerald-500 h-full rounded-full" style={{width:`${stats?.fees_due?Math.min(100,(stats.fees_collected/stats.fees_due)*100):0}%`}} /></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Icon name="calendar" size={15} className="text-blue-600" /> Upcoming</h3>
                    <div className="space-y-2">
                      {calendarEvents.filter(e => e.date >= new Date().toISOString().split('T')[0]).slice(0, 5).map(e => (
                        <div key={e.id} className="flex items-start gap-2.5 cursor-pointer hover:bg-gray-50 rounded-lg p-1 -mx-1" onClick={() => setActiveTab('calendar')}>
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.type==='inspection'?'bg-blue-500':e.type==='reservation'?'bg-violet-500':e.type==='hearing'?'bg-purple-500':'bg-gray-400'}`} />
                          <div><div className="text-xs font-medium text-gray-900">{e.title}</div><div className="text-[10px] text-gray-500">{e.date}</div></div>
                        </div>
                      ))}
                      {calendarEvents.filter(e => e.date >= new Date().toISOString().split('T')[0]).length === 0 && <p className="text-xs text-gray-400">No upcoming events</p>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-4 border-b"><h3 className="font-bold text-sm flex items-center gap-2"><Icon name="activity" size={15} className="text-sky-600" /> Recent Activity</h3></div>
                  <div className="divide-y max-h-64 overflow-auto">
                    {activityFeed.slice(0, 10).map(a => (
                      <div key={a.id} className="px-4 py-2.5 flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${a.action?.includes('approved')?'bg-emerald-100':a.action?.includes('denied')?'bg-red-100':a.action?.includes('Payment')?'bg-emerald-100':'bg-sky-100'}`}>
                          <Icon name={a.action?.includes('approved')?'check':a.action?.includes('denied')?'x':a.action?.includes('Payment')?'dollar-sign':'file-text'} size={13}
                            className={a.action?.includes('approved')?'text-emerald-600':a.action?.includes('denied')?'text-red-600':a.action?.includes('Payment')?'text-emerald-600':'text-sky-600'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900">{a.action}</div>
                          <div className="text-[10px] text-gray-500">{a.permit_number||''}{a.details?` — ${a.details}`:''}</div>
                          <div className="text-[10px] text-gray-400">{a.created_at?.replace('T',' ').split('.')[0]}</div>
                        </div>
                      </div>
                    ))}
                    {activityFeed.length === 0 && <div className="p-6 text-center text-sm text-gray-400">No recent activity</div>}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="p-4 border-b"><h3 className="font-bold text-sm flex items-center gap-2"><Icon name="map-pin" size={15} className="text-violet-600" /> Active Permits Map</h3></div>
                  <div style={{height:'264px'}}><PermitMap permits={permits} parcels={parcels} onPermitClick={p => { setActiveTab('permits'); loadDetail(p); }} config={config} /></div>
                </div>
              </div>
            </div>
          )}

          {/* ===== PERMITS ===== */}
          {activeTab === 'permits' && (
            <div className="flex gap-5 h-full">
              <div className={`${selectedPermit ? 'w-full lg:w-1/2 xl:w-3/5' : 'w-full'} flex-shrink-0`}>
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-3 border-b flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative flex-1 max-w-xs">
                        <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search permits..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-3 py-2 border rounded-lg text-sm w-full focus:ring-2 focus:ring-sky-500 outline-none" />
                      </div>
                      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border px-2 py-2 rounded-lg text-sm">
                        <option value="all">All ({permits.length})</option>
                        <option value="pending">Pending ({permits.filter(p=>p.status==='pending').length})</option>
                        <option value="under_review">Under Review ({permits.filter(p=>p.status==='under_review').length})</option>
                        <option value="approved">Approved ({permits.filter(p=>p.status==='approved').length})</option>
                        <option value="denied">Denied ({permits.filter(p=>p.status==='denied').length})</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{filteredPermits.length}</span>
                      <button onClick={exportCSV} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg" title="Export CSV"><Icon name="download" size={15} /></button>
                    </div>
                  </div>
                  <div className="max-h-[calc(100vh-240px)] overflow-x-auto overflow-y-auto">
                    <table className="w-full min-w-[1200px] text-xs">
                      <thead className="bg-gray-50 text-left text-[10px] text-gray-500 uppercase tracking-wider sticky top-0 z-10">
                        <tr>
                          {[
                            {f:'id',l:'Permit #',w:'w-28'},
                            {f:'type',l:'Type',w:'w-36'},
                            {f:'address',l:'Address',w:'w-44'},
                            {f:'applicant',l:'Applicant',w:'w-36'},
                            {f:'zone',l:'Zone',w:'w-16'},
                            {f:'status',l:'Status',w:'w-28'},
                            {f:'submitted',l:'Submitted',w:'w-24'},
                            {f:'reviewed',l:'Reviewed',w:'w-24'},
                            {f:'valuation',l:'Value',w:'w-24'},
                            {f:'fees',l:'Fees Due',w:'w-20'},
                            {f:'fees_paid',l:'Fees Paid',w:'w-20'},
                          ].map(c => (
                            <th key={c.f} className={`${c.w} px-2 py-2 font-semibold cursor-pointer hover:text-gray-700 select-none whitespace-nowrap border-b border-gray-200`} onClick={() => toggleSort(c.f)}>
                              <span className="flex items-center gap-0.5">{c.l}{sortField===c.f && <Icon name={sortDir==='asc'?'chevron-up':'chevron-down'} size={10} />}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredPermits.map(p => {
                          const feesDue = p.fees || 0, feesPaid = p.fees_paid || 0;
                          const feeColor = feesPaid >= feesDue ? 'text-green-600' : feesPaid > 0 ? 'text-amber-600' : 'text-red-500';
                          return (
                          <tr key={p.id} className={`hover:bg-sky-50/50 cursor-pointer transition ${selectedPermit?.id===p.id?'bg-sky-50 ring-1 ring-inset ring-sky-300':''}`} onClick={() => loadDetail(p)}>
                            <td className="px-2 py-2 font-semibold text-sky-700 whitespace-nowrap">{p.id}</td>
                            <td className="px-2 py-2 text-gray-700 whitespace-nowrap">{p.type}</td>
                            <td className="px-2 py-2 text-gray-800 font-medium">{p.address}</td>
                            <td className="px-2 py-2 text-gray-600">{p.applicant}</td>
                            <td className="px-2 py-2 text-gray-500 text-center font-mono">{p.zone || '—'}</td>
                            <td className="px-2 py-2"><StatusBadge status={p.status} /></td>
                            <td className="px-2 py-2 text-gray-500 whitespace-nowrap">{p.submitted || '—'}</td>
                            <td className="px-2 py-2 text-gray-500 whitespace-nowrap">{p.reviewed || '—'}</td>
                            <td className="px-2 py-2 text-gray-700 text-right font-mono whitespace-nowrap">{p.valuation ? `$${Number(p.valuation).toLocaleString()}` : '—'}</td>
                            <td className="px-2 py-2 text-gray-600 text-right font-mono whitespace-nowrap">{feesDue ? `$${feesDue.toLocaleString()}` : '—'}</td>
                            <td className={`px-2 py-2 text-right font-mono font-semibold whitespace-nowrap ${feeColor}`}>{feesPaid ? `$${feesPaid.toLocaleString()}` : '—'}</td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {selectedPermit && (
                <div className="permit-detail-overlay flex-1 min-w-0">
                  <div className="bg-white rounded-xl shadow-sm border sticky top-0">
                    <div className="p-3 border-b flex items-center justify-between bg-gray-50 rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedPermit(null); setPermitDetail(null); }} className="lg:hidden flex items-center gap-1 text-sky-600 text-xs font-semibold px-2 py-1 rounded hover:bg-sky-100"><Icon name="arrow-left" size={14} /> Back</button>
                        <span className="font-bold text-sm">{selectedPermit.id}</span>
                        <StatusBadge status={selectedPermit.status} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => printPermit(selectedPermit, permitDetail)} className="text-gray-400 hover:text-gray-600 w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200" title="Print"><Icon name="printer" size={14} /></button>
                        <button onClick={() => { setSelectedPermit(null); setPermitDetail(null); }} className="hidden lg:flex text-gray-400 hover:text-gray-600 w-7 h-7 rounded items-center justify-center hover:bg-gray-200"><Icon name="x" size={16} /></button>
                      </div>
                    </div>
                    <div className="flex border-b overflow-x-auto">
                      {[{id:'details',l:'Details',ic:'file-text'},{id:'inspections',l:'Inspections',ic:'clipboard-check',ct:permitDetail?.inspections?.length},{id:'notes',l:'Comments',ic:'message-square',ct:permitDetail?.comments?.length},{id:'payments',l:'Payments',ic:'dollar-sign'},{id:'documents',l:'Docs',ic:'paperclip',ct:permitDetail?.documents?.length},{id:'timeline',l:'Activity',ic:'clock'}].map(t => (
                        <button key={t.id} onClick={() => setDetailTab(t.id)} className={`flex items-center gap-1 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition ${detailTab===t.id?'border-sky-500 text-sky-700':'border-transparent text-gray-500 hover:text-gray-700'}`}>
                          <Icon name={t.ic} size={13} /> {t.l}
                          {t.ct > 0 && <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 rounded-full">{t.ct}</span>}
                        </button>
                      ))}
                    </div>
                    <div className="p-4 max-h-[calc(100vh-320px)] overflow-auto">
                      {detailTab === 'details' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Type">{selectedPermit.type}</Field>
                            <Field label="Address">{selectedPermit.address}</Field>
                            <Field label="Applicant">{selectedPermit.applicant}</Field>
                            <Field label="Value">${selectedPermit.valuation?.toLocaleString()}</Field>
                            <Field label="Submitted">{selectedPermit.submitted}</Field>
                            <Field label="Zone">{selectedPermit.zone}</Field>
                          </div>
                          <Field label="Parcel"><span className="font-mono">{selectedPermit.parcel_id}</span></Field>
                          <div><div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1">Description</div><div className="text-sm text-gray-700 leading-relaxed">{selectedPermit.description}</div></div>
                          {permitDetail?.applicant_email && <Field label="Email"><span className="text-sky-600">{permitDetail.applicant_email}</span></Field>}
                          {permitDetail?.applicant_phone && <Field label="Phone">{permitDetail.applicant_phone}</Field>}
                          {selectedPermit.conditions && <div className="bg-emerald-50 p-3 rounded-lg"><div className="text-[10px] text-emerald-600 uppercase font-semibold mb-1">Conditions</div><div className="text-sm text-emerald-700">{selectedPermit.conditions}</div></div>}
                          {selectedPermit.denial_reason && <div className="bg-red-50 p-3 rounded-lg"><div className="text-[10px] text-red-600 uppercase font-semibold mb-1">Denial Reason</div><div className="text-sm text-red-700">{selectedPermit.denial_reason}</div></div>}
                          {selectedPermit.status === 'pending' && (
                            <div className="pt-3 border-t"><button onClick={() => handleAction(selectedPermit, 'under_review')} disabled={updating} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"><Icon name="eye" size={15} /> Begin Review</button></div>
                          )}
                          {selectedPermit.status === 'under_review' && (
                            <div className="pt-3 border-t space-y-3">
                              <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Review notes..." rows={2} className={inp} />
                              <textarea value={conditions} onChange={e => setConditions(e.target.value)} placeholder="Conditions of approval..." rows={2} className={inp} />
                              <div className="flex gap-2">
                                <ActBtn onClick={() => handleAction(selectedPermit, 'approved')} color="emerald" icon="check" label="Approve" />
                                <ActBtn onClick={() => setShowDenyForm(!showDenyForm)} color="red" icon="x" label="Deny" />
                              </div>
                              {showDenyForm && (
                                <div className="bg-red-50 p-3 rounded-lg space-y-2">
                                  <textarea value={denialReason} onChange={e => setDenialReason(e.target.value)} placeholder="Reason for denial (required)..." rows={2} className={`${inp} border-red-200`} />
                                  <button onClick={() => handleAction(selectedPermit, 'denied', { denial_reason: denialReason })} disabled={updating||!denialReason.trim()} className="w-full bg-red-600 text-white py-1.5 rounded-lg text-sm disabled:opacity-50 font-medium">Confirm Denial</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {detailTab === 'inspections' && (
                        <div className="space-y-3">
                          {permitDetail?.inspections?.map(insp => (
                            <div key={insp.id} className={`p-3 rounded-lg border ${insp.status==='passed'?'bg-emerald-50 border-emerald-200':insp.status==='failed'?'bg-red-50 border-red-200':'bg-gray-50 border-gray-200'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm">{insp.inspection_type}</span>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${insp.status==='passed'?'bg-emerald-100 text-emerald-700':insp.status==='failed'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}`}>{insp.status}</span>
                              </div>
                              <div className="text-xs text-gray-500">{insp.scheduled_date}{insp.inspector_first?` — ${insp.inspector_first} ${insp.inspector_last}`:''}</div>
                              {insp.notes && <div className="text-xs text-gray-600 mt-1">{insp.notes}</div>}
                              {insp.status === 'scheduled' && (
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => handleInspResult(insp.id, 'pass')} className="flex-1 bg-emerald-600 text-white py-1 rounded text-xs font-medium hover:bg-emerald-700">Pass</button>
                                  <button onClick={() => handleInspResult(insp.id, 'fail')} className="flex-1 bg-red-600 text-white py-1 rounded text-xs font-medium hover:bg-red-700">Fail</button>
                                </div>
                              )}
                            </div>
                          ))}
                          {(!permitDetail?.inspections?.length) && <p className="text-sm text-gray-400 text-center py-4">No inspections scheduled</p>}
                          <div className="border-t pt-3 mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Schedule Inspection</p>
                            <div className="flex gap-2">
                              <select value={newInspType} onChange={e => setNewInspType(e.target.value)} className={`${inp} flex-1`}>
                                <option value="">Type...</option>
                                {['Foundation/Setback','Framing','Final','Elevation Certificate','Fire/Safety','Other'].map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <input type="date" value={newInspDate} onChange={e => setNewInspDate(e.target.value)} className={inp} style={{width:'140px'}} />
                            </div>
                            <button onClick={handleAddInspection} disabled={!newInspType||!newInspDate} className="mt-2 w-full bg-sky-600 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700 disabled:opacity-40">Schedule Inspection</button>
                          </div>
                        </div>
                      )}
                      {detailTab === 'notes' && (
                        <div className="space-y-3">
                          <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a note..." rows={2} className={inp} />
                          <button onClick={handleAddComment} disabled={!newComment.trim()} className="bg-sky-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700 disabled:opacity-40">Add Note</button>
                          <div className="space-y-2 pt-2 border-t">
                            {permitDetail?.comments?.map(c => (
                              <div key={c.id} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-1"><span className="text-xs font-semibold text-gray-900">{c.author_name || `${c.first_name} ${c.last_name}`}</span><span className="text-[10px] text-gray-400">{c.created_at?.split('T')[0]}</span></div>
                                <p className="text-xs text-gray-700 leading-relaxed">{c.comment}</p>
                              </div>
                            ))}
                            {(!permitDetail?.comments?.length) && <p className="text-sm text-gray-400 text-center py-4">No notes yet</p>}
                          </div>
                        </div>
                      )}
                      {detailTab === 'payments' && (
                        <div className="space-y-3">
                          <div className="bg-gray-50 rounded-lg p-3 flex justify-between text-sm">
                            <div><span className="text-gray-500">Due:</span> <span className="font-semibold">${permitDetail?.fees_calculated||selectedPermit.fees||0}</span></div>
                            <div><span className="text-gray-500">Paid:</span> <span className="font-semibold text-emerald-600">${permitDetail?.fees_paid||selectedPermit.fees_paid||0}</span></div>
                            <div><span className="text-gray-500">Owed:</span> <span className="font-semibold text-amber-600">${(permitDetail?.fees_calculated||0)-(permitDetail?.fees_paid||0)}</span></div>
                          </div>
                          {permitDetail?.payments?.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-2 border-b">
                              <div><div className="text-sm font-medium">${p.amount}</div><div className="text-[10px] text-gray-500">{p.payment_method}{p.reference_number?` #${p.reference_number}`:''} — {p.received_at?.split('T')[0]}</div></div>
                              <div className="text-[10px] text-gray-400">{p.received_first} {p.received_last}</div>
                            </div>
                          ))}
                          {(permitDetail?.fees_calculated||0)-(permitDetail?.fees_paid||0) > 0 && (
                            <div className="border-t pt-3">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Record Payment</p>
                              <div className="flex gap-2">
                                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Amount" className={inp} style={{width:'90px'}} />
                                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className={inp}><option value="check">Check</option><option value="cash">Cash</option><option value="credit_card">Card</option></select>
                                <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Ref #" className={inp} />
                              </div>
                              <button onClick={handleAddPayment} disabled={!payAmount} className="mt-2 w-full bg-emerald-600 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-40">Record Payment</button>
                            </div>
                          )}
                        </div>
                      )}
                      {detailTab === 'documents' && (
                        <div className="space-y-2">
                          {permitDetail?.documents?.map(d => (
                            <div key={d.id} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition">
                              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0"><Icon name={d.filename?.endsWith('.pdf')?'file-text':'image'} size={16} className="text-red-500" /></div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{d.filename}</div>
                                <div className="text-[10px] text-gray-400">{d.doc_type?.replace('_',' ')} — {d.file_size?`${(d.file_size/1e6).toFixed(1)} MB`:''} — {d.created_at?.split('T')[0]}</div>
                              </div>
                              <button onClick={async () => { try { const res = await api.downloadDocument(d.id); if(res.file_data){const a=document.createElement('a');a.href=res.file_data;a.download=res.filename;a.click();}else toast('No file data','warning'); } catch{toast('Download failed','error');} }}
                                className="text-sky-600 hover:text-sky-800 p-1.5 hover:bg-sky-50 rounded-lg"><Icon name="download" size={14} /></button>
                            </div>
                          ))}
                          {(!permitDetail?.documents?.length) && <p className="text-sm text-gray-400 text-center py-4">No documents</p>}
                          <div className="border-t pt-3 mt-2">
                            <button onClick={() => {
                              const el = document.createElement('input'); el.type='file'; el.multiple=true; el.accept='.pdf,.png,.jpg,.jpeg,.tiff';
                              el.onchange = () => Array.from(el.files).forEach(file => { const reader = new FileReader(); reader.onload = async () => { try { await api.addDocument(selectedPermit.dbId, { filename:file.name, doc_type:file.name.toLowerCase().includes('site')?'site_plan':'other', file_size:file.size, file_data:reader.result }); toast(`Uploaded ${file.name}`); setPermitDetail(await api.getPermitDetail(selectedPermit.dbId)); } catch { toast('Upload failed','error'); } }; reader.readAsDataURL(file); });
                              el.click();
                            }} className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-sky-400 hover:text-sky-600 transition">
                              <Icon name="upload" size={14} /> Upload Document
                            </button>
                          </div>
                        </div>
                      )}
                      {detailTab === 'timeline' && (
                        <div>
                          {permitDetail?.activity?.map((a, i) => (
                            <div key={a.id} className="flex gap-3 pb-3">
                              <div className="flex flex-col items-center"><div className="w-2 h-2 rounded-full bg-sky-400 mt-1.5" />{i<(permitDetail.activity.length-1) && <div className="w-px flex-1 bg-gray-200 mt-1" />}</div>
                              <div><div className="text-xs font-semibold text-gray-900">{a.action}</div><div className="text-[10px] text-gray-500">{a.created_at?.replace('T',' ').split('.')[0]}{a.first_name?` — ${a.first_name} ${a.last_name}`:''}</div></div>
                            </div>
                          ))}
                          {(!permitDetail?.activity?.length) && <p className="text-sm text-gray-400 text-center py-4">No activity</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== BUSINESS LICENSES ===== */}
          {activeTab === 'licenses' && (
            <ModulePanel items={licenses} selected={selectedLicense} onSelect={loadLicenseDetail} onClose={() => { setSelectedLicense(null); setLicenseDetail(null); }}
              filterFn={(item, q) => (item.business_name||'').toLowerCase().includes(q) || (item.license_number||'').toLowerCase().includes(q)}
              columns={[
                { key:'license_number', label:'License #', render: l => <div><div className="font-semibold text-sm text-sky-700">{l.license_number||`#${l.id}`}</div><div className="text-[10px] text-gray-400">{l.license_type||l.type}</div></div> },
                { key:'business_name', label:'Business', hideMobile:true },
                { key:'type', label:'Type', hideMobile:true, render: l => <span className="text-gray-600">{l.license_type||l.type}</span> },
                { key:'status', label:'Status', render: l => <StatusBadge status={l.status} /> },
                { key:'expires_at', label:'Expires', render: l => <span className="text-xs text-gray-500">{l.expires_at?.split('T')[0]||l.expiration_date?.split('T')[0]||'--'}</span> },
              ]}
              renderDetail={(lic) => (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Business">{lic.business_name}</Field>
                    <Field label="Type">{lic.license_type||lic.type}</Field>
                    <Field label="Owner">{lic.owner_name||licenseDetail?.owner_name||'--'}</Field>
                    <Field label="Address">{lic.address||licenseDetail?.address||'--'}</Field>
                    <Field label="Phone">{licenseDetail?.phone||'--'}</Field>
                    <Field label="Email"><span className="text-sky-600">{licenseDetail?.email||'--'}</span></Field>
                    <Field label="Issued">{lic.issued_at?.split('T')[0]||'--'}</Field>
                    <Field label="Expires">{lic.expires_at?.split('T')[0]||lic.expiration_date?.split('T')[0]||'--'}</Field>
                  </div>
                  {licenseDetail?.fees_due != null && (
                    <div className="bg-gray-50 rounded-lg p-3 flex justify-between text-sm">
                      <div><span className="text-gray-500">Fee:</span> <span className="font-semibold">${licenseDetail.fees_due||0}</span></div>
                      <div><span className="text-gray-500">Paid:</span> <span className="font-semibold text-emerald-600">${licenseDetail.fees_paid||0}</span></div>
                    </div>
                  )}
                  {licenseDetail?.payments?.map(p => (
                    <div key={p.id} className="flex justify-between p-2 border-b text-sm"><span className="font-medium">${p.amount}</span><span className="text-xs text-gray-500">{p.payment_method} — {p.received_at?.split('T')[0]}</span></div>
                  ))}
                  {licenseDetail?.comments?.map(c => (
                    <div key={c.id} className="bg-gray-50 p-3 rounded-lg"><div className="flex justify-between mb-1"><span className="text-xs font-semibold">{c.author_name||'Staff'}</span><span className="text-[10px] text-gray-400">{c.created_at?.split('T')[0]}</span></div><p className="text-xs text-gray-700">{c.comment}</p></div>
                  ))}
                  <div className="pt-3 border-t space-y-2">
                    <textarea value={moduleComment} onChange={e => setModuleComment(e.target.value)} placeholder="Add comment..." rows={2} className={inp} />
                    {moduleComment.trim() && <button onClick={() => { handleModuleAction('license', lic.id, { comment: moduleComment }); setModuleComment(''); }} className="bg-sky-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700">Add Comment</button>}
                  </div>
                  <div className="flex gap-2 pt-2">
                    {lic.status === 'pending' && <><ActBtn onClick={() => handleModuleAction('license', lic.id, { status: 'active' })} color="emerald" icon="check" label="Approve" /><ActBtn onClick={() => handleModuleAction('license', lic.id, { status: 'denied' })} color="red" icon="x" label="Deny" /></>}
                    {lic.status === 'active' && <ActBtn onClick={() => handleModuleAction('license', lic.id, { status: 'active', renew: true })} color="blue" icon="refresh-cw" label="Renew" />}
                  </div>
                </div>
              )}
            />
          )}

          {/* ===== PARK RESERVATIONS ===== */}
          {activeTab === 'parks' && (
            <ModulePanel items={reservations} selected={selectedReservation} onSelect={loadReservationDetail} onClose={() => { setSelectedReservation(null); setReservationDetail(null); }}
              filterFn={(item, q) => (item.event_name||'').toLowerCase().includes(q) || (item.facility_name||'').toLowerCase().includes(q) || (item.reservation_number||'').toLowerCase().includes(q)}
              columns={[
                { key:'reservation_number', label:'Res #', render: r => <div className="font-semibold text-sm text-sky-700">{r.reservation_number||`#${r.id}`}</div> },
                { key:'event_name', label:'Event', hideMobile:true, render: r => <span>{r.event_name||r.title||'--'}</span> },
                { key:'facility_name', label:'Facility', hideMobile:true, render: r => <span className="text-gray-600">{r.facility_name||'--'}</span> },
                { key:'event_date', label:'Date', render: r => <span className="text-xs text-gray-500">{r.event_date?.split('T')[0]||'--'}</span> },
                { key:'status', label:'Status', render: r => <StatusBadge status={r.status} /> },
              ]}
              renderDetail={(res) => (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Event">{res.event_name||res.title}</Field>
                    <Field label="Facility">{res.facility_name}</Field>
                    <Field label="Date">{res.event_date?.split('T')[0]}</Field>
                    <Field label="Time">{res.start_time||'--'} — {res.end_time||'--'}</Field>
                    <Field label="Contact">{res.contact_name||reservationDetail?.contact_name||'--'}</Field>
                    <Field label="Phone">{res.contact_phone||reservationDetail?.contact_phone||'--'}</Field>
                    <Field label="Attendees">{res.expected_attendees||reservationDetail?.expected_attendees||'--'}</Field>
                    <Field label="Fee">${res.fee||reservationDetail?.fee||0}</Field>
                  </div>
                  {(res.description||reservationDetail?.description) && <div><div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Description</div><div className="text-sm text-gray-700">{res.description||reservationDetail?.description}</div></div>}
                  {reservationDetail?.special_requests && <div className="bg-blue-50 p-3 rounded-lg"><div className="text-[10px] text-blue-600 uppercase font-semibold mb-1">Special Requests</div><div className="text-sm text-blue-700">{reservationDetail.special_requests}</div></div>}
                  <div className="flex gap-2 pt-3 border-t">
                    {res.status === 'pending' && <><ActBtn onClick={() => handleModuleAction('reservation', res.id, { status: 'approved' })} color="emerald" icon="check" label="Approve" /><ActBtn onClick={() => handleModuleAction('reservation', res.id, { status: 'denied' })} color="red" icon="x" label="Deny" /></>}
                    {res.status === 'approved' && <ActBtn onClick={() => handleModuleAction('reservation', res.id, { status: 'cancelled' })} color="gray" icon="x" label="Cancel" />}
                  </div>
                </div>
              )}
            />
          )}

          {/* ===== CITIZEN REQUESTS ===== */}
          {activeTab === 'requests' && (
            <ModulePanel items={requests} selected={selectedRequest} onSelect={loadRequestDetail} onClose={() => { setSelectedRequest(null); setRequestDetail(null); }}
              filterFn={(item, q) => (item.category||'').toLowerCase().includes(q) || (item.location||'').toLowerCase().includes(q) || (item.request_number||'').toLowerCase().includes(q) || (item.description||'').toLowerCase().includes(q)}
              columns={[
                { key:'request_number', label:'Request #', render: r => <div className="font-semibold text-sm text-sky-700">{r.request_number||`#${r.id}`}</div> },
                { key:'category', label:'Category', hideMobile:true },
                { key:'location', label:'Location', hideMobile:true, render: r => <span className="text-gray-600 truncate max-w-[150px] block">{r.location||'--'}</span> },
                { key:'status', label:'Status', render: r => <StatusBadge status={r.status} /> },
                { key:'priority', label:'Priority', render: r => <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.priority==='high'||r.priority==='urgent'?'bg-red-100 text-red-700':r.priority==='medium'?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-700'}`}>{r.priority||'normal'}</span> },
              ]}
              renderDetail={(req) => (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Category">{req.category}</Field>
                    <Field label="Priority"><span className={req.priority==='high'||req.priority==='urgent'?'text-red-600 font-bold':''}>{req.priority||'normal'}</span></Field>
                    <Field label="Location">{req.location||'--'}</Field>
                    <Field label="Submitted">{req.created_at?.split('T')[0]||'--'}</Field>
                    <Field label="Reporter">{req.reporter_name||requestDetail?.reporter_name||'Anonymous'}</Field>
                    <Field label="Phone">{req.reporter_phone||requestDetail?.reporter_phone||'--'}</Field>
                    <Field label="Email"><span className="text-sky-600">{req.reporter_email||requestDetail?.reporter_email||'--'}</span></Field>
                    {req.assigned_to && <Field label="Assigned">{req.assigned_to_name||req.assigned_to}</Field>}
                  </div>
                  <div><div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Description</div><div className="text-sm text-gray-700 leading-relaxed">{req.description||requestDetail?.description||'--'}</div></div>
                  {(req.latitude && req.longitude) && <div className="bg-gray-50 p-2 rounded-lg text-xs font-mono">{req.latitude}, {req.longitude}</div>}
                  {requestDetail?.comments?.map(c => (
                    <div key={c.id} className="bg-gray-50 p-3 rounded-lg"><div className="flex justify-between mb-1"><span className="text-xs font-semibold">{c.author_name||'Staff'}</span><span className="text-[10px] text-gray-400">{c.created_at?.split('T')[0]}</span></div><p className="text-xs text-gray-700">{c.comment}</p></div>
                  ))}
                  <div className="pt-3 border-t space-y-2">
                    <textarea value={moduleComment} onChange={e => setModuleComment(e.target.value)} placeholder="Add comment..." rows={2} className={inp} />
                    {moduleComment.trim() && <button onClick={() => { handleModuleAction('request', req.id, { comment: moduleComment }); setModuleComment(''); }} className="bg-sky-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700">Add Comment</button>}
                  </div>
                  <div className="flex gap-2 pt-2 flex-wrap">
                    {req.status === 'submitted' && <ActBtn onClick={() => handleModuleAction('request', req.id, { status: 'in_progress' })} color="blue" icon="play" label="In Progress" />}
                    {(req.status === 'submitted' || req.status === 'in_progress') && <ActBtn onClick={() => handleModuleAction('request', req.id, { status: 'resolved' })} color="emerald" icon="check" label="Resolve" />}
                    {req.status !== 'resolved' && req.status !== 'cancelled' && (
                      <button onClick={() => { const name = prompt('Assign to (name):'); if (name) handleModuleAction('request', req.id, { assigned_to_name: name }); }} disabled={updating}
                        className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-1 text-sm font-medium"><Icon name="user-plus" size={15} /> Assign</button>
                    )}
                  </div>
                </div>
              )}
            />
          )}

          {/* ===== CALENDAR ===== */}
          {activeTab === 'calendar' && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-4 border-b flex items-center justify-between">
                  <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()-1))} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"><Icon name="chevron-left" size={18} /></button>
                  <h3 className="font-bold text-sm">{calendarMonth.toLocaleString('default',{month:'long',year:'numeric'})}</h3>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCalendarMonth(new Date())} className="px-2 py-1 text-[10px] font-semibold text-sky-700 hover:bg-sky-50 rounded">Today</button>
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()+1))} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"><Icon name="chevron-right" size={18} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2 border-b bg-gray-50">{d}</div>)}
                  {calendarDays.map((day, i) => {
                    const events = getEventsForDay(day);
                    const isToday = day && new Date().getDate()===day && new Date().getMonth()===calendarMonth.getMonth() && new Date().getFullYear()===calendarMonth.getFullYear();
                    return (
                      <div key={i} className={`min-h-[52px] sm:min-h-[80px] border-b border-r p-1 ${!day?'bg-gray-50':'hover:bg-sky-50/30'} ${i%7===0?'border-l':''}`}>
                        {day && (<>
                          <div className={`text-xs font-semibold mb-0.5 w-6 h-6 flex items-center justify-center rounded-full ${isToday?'bg-sky-600 text-white':'text-gray-600'}`}>{day}</div>
                          <div className="space-y-0.5">
                            {events.slice(0,3).map(e => (
                              <div key={e.id} className={`text-[9px] font-medium px-1 py-0.5 rounded truncate ${e.type==='inspection'?'bg-blue-100 text-blue-800':e.type==='hearing'?'bg-purple-100 text-purple-800':e.type==='reservation'?'bg-violet-100 text-violet-800':e.type==='review'?'bg-amber-100 text-amber-800':e.type==='expiration'||e.type==='renewal'?'bg-red-100 text-red-800':'bg-gray-100 text-gray-700'}`}
                                title={`${e.title}${e.address?' - '+e.address:''}`}>{e.title?.substring(0,20)}</div>
                            ))}
                            {events.length > 3 && <div className="text-[9px] text-gray-400 pl-1">+{events.length-3} more</div>}
                          </div>
                        </>)}
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 bg-gray-50 rounded-b-xl flex items-center gap-4 flex-wrap">
                  {[{l:'Inspection',c:'bg-blue-100'},{l:'Hearing',c:'bg-purple-100'},{l:'Reservation',c:'bg-violet-100'},{l:'Deadline',c:'bg-amber-100'},{l:'Renewal/Expiry',c:'bg-red-100'}].map(x => (
                    <div key={x.l} className="flex items-center gap-1.5"><span className={`w-3 h-2 rounded-sm ${x.c}`} /><span className="text-[10px] text-gray-500 font-medium">{x.l}</span></div>
                  ))}
                </div>
              </div>
              <div className="grid lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-4 border-b"><h3 className="font-bold text-sm flex items-center gap-2"><Icon name="clipboard-check" size={16} className="text-blue-600" /> Upcoming Inspections</h3></div>
                  <div className="divide-y max-h-64 overflow-auto">
                    {calendarEvents.filter(e => e.type==='inspection' && e.date >= new Date().toISOString().split('T')[0]).map(e => (
                      <div key={e.id} className="p-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{e.title}</span><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${e.status==='passed'?'bg-emerald-100 text-emerald-700':e.status==='failed'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}`}>{e.status}</span></div>
                        <div className="text-xs text-gray-500">{e.date} — {e.address}</div>
                      </div>
                    ))}
                    {calendarEvents.filter(e => e.type==='inspection' && e.date >= new Date().toISOString().split('T')[0]).length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No upcoming inspections</div>}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-4 border-b"><h3 className="font-bold text-sm flex items-center gap-2"><Icon name="alert-circle" size={16} className="text-amber-600" /> Deadlines &amp; Events</h3></div>
                  <div className="divide-y max-h-64 overflow-auto">
                    {calendarEvents.filter(e => e.type!=='inspection').map(e => (
                      <div key={e.id} className="p-3 hover:bg-gray-50">
                        <div className="flex items-center gap-2 mb-1"><div className={`w-2 h-2 rounded-full ${e.type==='hearing'?'bg-purple-500':e.type==='reservation'?'bg-violet-500':e.type==='renewal'?'bg-amber-500':e.type==='expiration'?'bg-red-500':'bg-gray-400'}`} /><span className="font-semibold text-sm">{e.title}</span></div>
                        <div className="text-xs text-gray-500">{e.date}{e.address?` — ${e.address}`:''}</div>
                      </div>
                    ))}
                    {calendarEvents.filter(e => e.type!=='inspection').length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No upcoming events</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== MAP ===== */}
          {activeTab === 'map' && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{height:'calc(100vh - 160px)'}}>
              <PermitMap permits={permits} parcels={parcels} selectedPermit={selectedPermit} onPermitClick={p => { setActiveTab('permits'); loadDetail(p); }} config={config} />
            </div>
          )}

          {/* ===== REPORTS ===== */}
          {activeTab === 'reports' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label:'Total Permits', value: stats?.total||permits.length, sub:'All time' },
                  { label:'Avg Processing', value: stats?.avg_processing_days?`${stats.avg_processing_days} days`:'--', sub:'Submit to decision' },
                  { label:'Approval Rate', value: stats?`${Math.round((stats.approved/(stats.approved+(stats.denied||1)))*100)}%`:'--', sub:`${stats?.approved||0} of ${(stats?.approved||0)+(stats?.denied||0)}` },
                  { label:'Total Investment', value: `$${((stats?.total_valuation||0)/1e6).toFixed(2)}M`, sub:'Project valuations' },
                ].map((s,i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{s.label}</div>
                    <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
                    <div className="text-[10px] text-gray-400">{s.sub}</div>
                  </div>
                ))}
              </div>
              <div className="grid lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-4 border-b"><h3 className="font-bold text-sm">Permits by Type</h3></div>
                  <div className="p-4 space-y-3">
                    {(stats?.by_type||[]).map((t,i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-24 text-xs text-gray-500 truncate">{t.name?.replace('Zoning Permit - ','')}</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden"><div className="bg-sky-500 h-full rounded-full" style={{width:`${(t.count/(stats?.total||1))*100}%`}} /></div>
                        <div className="w-6 text-xs font-bold text-right">{t.count}</div>
                        <div className="w-16 text-[10px] text-gray-400 text-right">${((t.value||0)/1000).toFixed(0)}k</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-bold text-sm">Fee Summary</h3>
                    <button onClick={exportCSV} className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"><Icon name="download" size={12} /> Export CSV</button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between"><span className="text-sm text-gray-500">Total Assessed</span><span className="font-bold">${(stats?.fees_due||0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-500">Collected</span><span className="font-bold text-emerald-600">${(stats?.fees_collected||0).toLocaleString()}</span></div>
                    <div className="flex justify-between border-t pt-2"><span className="text-sm text-gray-500">Outstanding</span><span className="font-bold text-amber-600">${(stats?.fees_outstanding||0).toLocaleString()}</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden"><div className="bg-emerald-500 h-full rounded-full" style={{width:`${stats?.fees_due?Math.min(100,(stats.fees_collected/stats.fees_due)*100):0}%`}} /></div>
                    <div className="text-[10px] text-gray-400 text-center">{stats?.fees_due?Math.round((stats.fees_collected/stats.fees_due)*100):0}% collected</div>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-emerald-800 flex items-center gap-2 text-sm"><Icon name="check-circle" size={18} className="text-emerald-600" /> Council Meeting Summary</h3>
                  <button onClick={() => {
                    const w = window.open('','_blank');
                    w.document.write(`<!DOCTYPE html><html><head><title>Council Report</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#333;font-size:13px}h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;color:#0369a1;margin:20px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}.stats{display:flex;gap:16px;margin:16px 0}.stat{flex:1;text-align:center;background:#f9fafb;border-radius:8px;padding:12px}.stat .num{font-size:24px;font-weight:800}.stat .lbl{font-size:10px;color:#888;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px}th{background:#f9fafb;font-weight:600}@media print{body{margin:20px}}</style></head><body>
                      <h1>Town of Three Forks — City Management Report</h1><div style="font-size:12px;color:#666">Prepared ${new Date().toLocaleDateString()} for City Council</div>
                      <div class="stats"><div class="stat"><div class="num">${stats?.total||permits.length}</div><div class="lbl">Permits</div></div><div class="stat"><div class="num">${licenses.filter(l=>l.status==='active').length}</div><div class="lbl">Active Licenses</div></div><div class="stat"><div class="num" style="color:#16a34a">${stats?.approved||0}</div><div class="lbl">Approved</div></div><div class="stat"><div class="num">$${((stats?.total_valuation||0)/1e6).toFixed(2)}M</div><div class="lbl">Investment</div></div><div class="stat"><div class="num">$${(stats?.fees_collected||0).toLocaleString()}</div><div class="lbl">Collected</div></div></div>
                      <h2>All Permits</h2><table><tr><th>Permit #</th><th>Type</th><th>Address</th><th>Applicant</th><th>Status</th><th>Submitted</th><th>Value</th><th>Fee</th></tr>
                      ${permits.map(p=>`<tr><td>${p.id}</td><td>${p.type}</td><td>${p.address}</td><td>${p.applicant}</td><td>${p.status}</td><td>${p.submitted}</td><td>$${(p.valuation||0).toLocaleString()}</td><td>$${p.fees||0}</td></tr>`).join('')}</table>
                      ${(stats?.by_type||[]).length?`<h2>By Type</h2><table><tr><th>Type</th><th>Count</th><th>Value</th></tr>${(stats.by_type||[]).map(t=>`<tr><td>${t.name}</td><td>${t.count}</td><td>$${(t.value||0).toLocaleString()}</td></tr>`).join('')}</table>`:''}
                      <div style="margin-top:40px;border-top:1px solid #e5e7eb;padding-top:12px;font-size:10px;color:#888;text-align:center">Town of Three Forks &bull; 206 Main Street &bull; Three Forks, MT 59752</div>
                    </body></html>`);
                    w.document.close(); w.print();
                  }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700">
                    <Icon name="printer" size={13} /> Print Report
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                  <div className="bg-white rounded-lg p-3"><div className="text-xl font-extrabold text-gray-900">{stats?.total||permits.length}</div><div className="text-[10px] text-gray-500">Total Permits</div></div>
                  <div className="bg-white rounded-lg p-3"><div className="text-xl font-extrabold text-gray-900">{licenses.filter(l=>l.status==='active').length}</div><div className="text-[10px] text-gray-500">Active Licenses</div></div>
                  <div className="bg-white rounded-lg p-3"><div className="text-xl font-extrabold text-emerald-600">{stats?.approved||0}</div><div className="text-[10px] text-gray-500">Approved</div></div>
                  <div className="bg-white rounded-lg p-3"><div className="text-xl font-extrabold text-gray-900">${((stats?.total_valuation||0)/1e6).toFixed(2)}M</div><div className="text-[10px] text-gray-500">Investment</div></div>
                  <div className="bg-white rounded-lg p-3"><div className="text-xl font-extrabold text-gray-900">${(stats?.fees_collected||0).toLocaleString()}</div><div className="text-[10px] text-gray-500">Collected</div></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      {showNewPermit && <NewPermitModal permitTypes={permitTypes} demoMode={demoMode} onClose={() => setShowNewPermit(false)} onCreated={onRefresh} />}
    </div>
  );
};
