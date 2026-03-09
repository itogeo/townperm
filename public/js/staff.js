// ==========================================================================
// STAFF DASHBOARD — Admin interface for all city service modules
// ==========================================================================
const NAV_ITEMS = [
  { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
  { id: 'permits', icon: 'file-text', label: 'Permits' },
  { id: 'licenses', icon: 'briefcase', label: 'Licenses' },
  { id: 'parks', icon: 'trees', label: 'Parks' },
  { id: 'requests', icon: 'message-circle', label: 'Requests' },
  { id: 'calendar', icon: 'calendar', label: 'Calendar' },
  { id: 'map', icon: 'map', label: 'Map' },
  { id: 'reports', icon: 'bar-chart-3', label: 'Reports' },
];

const PRIORITY_COLORS = { urgent: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800', normal: 'bg-gray-100 text-gray-700', low: 'bg-slate-100 text-slate-600' };
const MODULE_COLORS = { permits: '#0ea5e9', licenses: '#8b5cf6', parks: '#22c55e', requests: '#f59e0b' };
const fmtDate = d => d ? new Date(d).toLocaleDateString() : '—';
const fmtMoney = v => v != null ? `$${Number(v).toLocaleString()}` : '—';

// Reusable tiny components
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>{children}</div>;
const Btn = ({ children, onClick, variant = 'primary', size = 'sm', className = '', disabled, type = 'button' }) => {
  const base = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const styles = { primary: 'bg-sky-600 text-white hover:bg-sky-700', danger: 'bg-red-600 text-white hover:bg-red-700', secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200', success: 'bg-green-600 text-white hover:bg-green-700' };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} rounded-lg font-medium transition disabled:opacity-50 ${styles[variant] || styles.secondary} ${className}`}>{children}</button>;
};
const Input = (props) => <input {...props} className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none ${props.className || ''}`} style={{ fontSize: '16px', ...props.style }} />;
const Select = ({ value, onChange, children, className = '' }) => <select value={value} onChange={onChange} className={`border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none ${className}`} style={{ fontSize: '16px' }}>{children}</select>;
const SectionTitle = ({ icon, children }) => <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3"><Icon name={icon} size={16} className="text-sky-600" />{children}</h3>;

// Detail slide-over panel wrapper
const DetailPanel = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto" style={{ animation: 'slideIn 0.25s ease-out' }}>
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><Icon name="x" size={20} /></button>
        </div>
        <div className="p-5 space-y-5">{children}</div>
      </div>
    </div>
  );
};

// Comment form mini-component
const CommentForm = ({ onSubmit }) => {
  const [text, setText] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (text.trim()) { onSubmit(text.trim()); setText(''); } };
  return <form onSubmit={handleSubmit} className="flex gap-2"><Input value={text} onChange={e => setText(e.target.value)} placeholder="Add a comment..." className="flex-1" /><Btn type="submit" variant="primary">Post</Btn></form>;
};

// Payment form
const PaymentForm = ({ onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('check');
  const [ref, setRef] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (amount) { onSubmit({ amount: parseFloat(amount), payment_method: method, reference_number: ref || undefined }); setAmount(''); setRef(''); } };
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-28" />
        <Select value={method} onChange={e => setMethod(e.target.value)}><option value="check">Check</option><option value="cash">Cash</option><option value="card">Card</option><option value="other">Other</option></Select>
        <Input value={ref} onChange={e => setRef(e.target.value)} placeholder="Ref #" className="flex-1" />
      </div>
      <Btn type="submit" variant="success" size="sm">Record Payment</Btn>
    </form>
  );
};

// ===== DASHBOARD TAB =====
const DashboardTab = ({ stats, demoMode }) => {
  const [activity, setActivity] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  useEffect(() => {
    if (demoMode) return;
    api.getActivity(15).then(setActivity).catch(() => {});
    const now = new Date(), end = new Date(now.getTime() + 30 * 86400000);
    api.getCalendar(now.toISOString().split('T')[0], end.toISOString().split('T')[0]).then(d => setDeadlines(d.slice(0, 8))).catch(() => {});
  }, [demoMode]);

  const s = stats || {};
  const cards = [
    { label: 'Total Permits', value: s.permits?.total ?? s.total ?? 0, icon: 'file-text', color: 'bg-sky-50 text-sky-700' },
    { label: 'Pending Review', value: (s.permits?.pending ?? s.pending ?? 0) + (s.permits?.under_review ?? s.under_review ?? 0), icon: 'clock', color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Active Licenses', value: s.licenses?.active ?? 0, icon: 'briefcase', color: 'bg-purple-50 text-purple-700' },
    { label: 'Open Requests', value: s.requests?.open ?? 0, icon: 'message-circle', color: 'bg-orange-50 text-orange-700' },
    { label: 'Upcoming Reservations', value: s.parks?.upcoming ?? 0, icon: 'trees', color: 'bg-green-50 text-green-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(c => (
          <Card key={c.label} className="p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${c.color}`}><Icon name={c.icon} size={18} /></div>
            <div className="text-2xl font-bold text-gray-900">{c.value}</div>
            <div className="text-xs text-gray-500">{c.label}</div>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionTitle icon="activity">Recent Activity</SectionTitle>
          {activity.length === 0 ? <p className="text-sm text-gray-400">No recent activity</p> : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: MODULE_COLORS[a.module] || '#6b7280' }} />
                  <div className="min-w-0"><p className="text-sm text-gray-800 truncate">{a.action}</p><p className="text-xs text-gray-400">{a.module} &middot; {fmtDate(a.created_at)}{a.first_name ? ` &middot; ${a.first_name} ${a.last_name}` : ''}</p></div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <SectionTitle icon="calendar">Upcoming Deadlines</SectionTitle>
          {deadlines.length === 0 ? <p className="text-sm text-gray-400">No upcoming deadlines</p> : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {deadlines.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0"><p className="text-sm text-gray-800 truncate">{d.title}</p><p className="text-xs text-gray-400">{d.type} &middot; {d.module}</p></div>
                  <span className="text-xs font-medium text-gray-600 flex-shrink-0 ml-2">{fmtDate(d.date)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// ===== PERMITS TAB =====
const PermitsTab = ({ permits: initPermits, demoMode }) => {
  const toast = useToast();
  const [permits, setPermits] = useState(initPermits || []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    if (demoMode) { setPermits(initPermits || []); return; }
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.getPermits(params).then(d => setPermits(d.map ? d.map(transformPermit) : [])).catch(() => {});
  }, [search, statusFilter, demoMode, initPermits]);
  useEffect(() => { load(); }, [load]);

  const openDetail = async (p) => {
    setSelected(p);
    if (!demoMode && p.dbId) { try { setDetail(await api.getPermitDetail(p.dbId)); } catch { setDetail(null); } }
  };
  const updateStatus = async (status) => {
    if (!selected?.dbId || demoMode) return;
    if (!confirm(`Change status to ${status.replace('_', ' ')}?`)) return;
    try { await api.updatePermit(selected.dbId, { status }); toast(`Status updated to ${status}`); load(); openDetail(selected); } catch (e) { toast(e.message, 'error'); }
  };
  const addComment = async (comment) => {
    if (!selected?.dbId || demoMode) return;
    try { await api.addComment(selected.dbId, { comment }); toast('Comment added'); openDetail(selected); } catch (e) { toast(e.message, 'error'); }
  };
  const addPayment = async (data) => {
    if (!selected?.dbId || demoMode) return;
    try { await api.addPayment(selected.dbId, data); toast('Payment recorded'); openDetail(selected); } catch (e) { toast(e.message, 'error'); }
  };
  const addInspection = async () => {
    const type = prompt('Inspection type (e.g. Foundation, Framing, Final):');
    const date = prompt('Scheduled date (YYYY-MM-DD):');
    if (!type || !date || !selected?.dbId || demoMode) return;
    try { await api.addInspection(selected.dbId, { inspection_type: type, scheduled_date: date }); toast('Inspection scheduled'); openDetail(selected); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search permits..." className="w-64" />
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['pending', 'under_review', 'approved', 'denied'].map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>)}
        </Select>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3">Permit #</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Address</th><th className="px-4 py-3">Applicant</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Submitted</th>
            </tr></thead>
            <tbody>
              {permits.map(p => (
                <tr key={p.id} onClick={() => openDetail(p)} className="border-b hover:bg-sky-50 cursor-pointer transition">
                  <td className="px-4 py-3 font-medium text-sky-700">{p.id}</td>
                  <td className="px-4 py-3">{p.typeCode || p.type_code}</td>
                  <td className="px-4 py-3">{p.address}</td>
                  <td className="px-4 py-3">{p.applicant || p.applicant_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(p.submitted || p.submitted_at)}</td>
                </tr>
              ))}
              {permits.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400">No permits found</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <DetailPanel open={!!selected} onClose={() => { setSelected(null); setDetail(null); }} title={selected?.id || 'Permit Detail'}>
        {selected && <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Type:</span> <span className="font-medium">{selected.type || selected.type_name}</span></div>
            <div><span className="text-gray-500">Status:</span> <StatusBadge status={selected.status} /></div>
            <div><span className="text-gray-500">Address:</span> <span className="font-medium">{selected.address}</span></div>
            <div><span className="text-gray-500">Applicant:</span> <span className="font-medium">{selected.applicant || selected.applicant_name}</span></div>
            <div><span className="text-gray-500">Valuation:</span> <span className="font-medium">{fmtMoney(selected.valuation)}</span></div>
            <div><span className="text-gray-500">Fees:</span> <span className="font-medium">{fmtMoney(detail?.fees_calculated)}</span></div>
          </div>
          {selected.description && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selected.description}</p>}

          <div>
            <SectionTitle icon="refresh-cw">Update Status</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {['pending', 'under_review', 'approved', 'denied'].map(s => (
                <Btn key={s} variant={s === selected.status ? 'primary' : 'secondary'} onClick={() => updateStatus(s)}>{STATUS_CONFIG[s].label}</Btn>
              ))}
            </div>
          </div>

          {detail?.inspections?.length > 0 && <div>
            <SectionTitle icon="clipboard-check">Inspections</SectionTitle>
            {detail.inspections.map(ins => <div key={ins.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50"><span>{ins.inspection_type}</span><span className="text-gray-500">{fmtDate(ins.scheduled_date)} &middot; {ins.status}</span></div>)}
          </div>}
          <Btn onClick={addInspection} variant="secondary"><Icon name="clipboard-check" size={14} className="mr-1" />Schedule Inspection</Btn>

          {detail?.payments?.length > 0 && <div>
            <SectionTitle icon="credit-card">Payments</SectionTitle>
            {detail.payments.map(pay => <div key={pay.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50"><span>{fmtMoney(pay.amount)} via {pay.payment_method}</span><span className="text-gray-500">{fmtDate(pay.received_at)}</span></div>)}
          </div>}
          <div><SectionTitle icon="credit-card">Record Payment</SectionTitle><PaymentForm onSubmit={addPayment} /></div>

          {detail?.comments?.length > 0 && <div>
            <SectionTitle icon="message-square">Comments</SectionTitle>
            {detail.comments.map(c => <div key={c.id} className="bg-gray-50 rounded-lg p-3 text-sm mb-2"><p className="font-medium text-gray-700">{c.author_name}</p><p className="text-gray-600">{c.comment}</p><p className="text-xs text-gray-400 mt-1">{fmtDate(c.created_at)}</p></div>)}
          </div>}
          <div><SectionTitle icon="message-square">Add Comment</SectionTitle><CommentForm onSubmit={addComment} /></div>

          {detail?.documents?.length > 0 && <div>
            <SectionTitle icon="paperclip">Documents</SectionTitle>
            {detail.documents.map(doc => <div key={doc.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50"><span className="flex items-center gap-2"><Icon name="file" size={14} />{doc.filename}</span><span className="text-gray-500">{fmtDate(doc.created_at)}</span></div>)}
          </div>}
        </>}
      </DetailPanel>
    </div>
  );
};

// ===== LICENSES TAB =====
const LicensesTab = ({ demoMode }) => {
  const toast = useToast();
  const [licenses, setLicenses] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    if (demoMode) return;
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.getLicenses(params).then(setLicenses).catch(() => {});
  }, [search, statusFilter, demoMode]);
  useEffect(() => { load(); }, [load]);

  const openDetail = async (lic) => {
    setSelected(lic);
    if (!demoMode) { try { setDetail(await api.getLicenseDetail(lic.id)); } catch { setDetail(null); } }
  };
  const updateStatus = async (status) => {
    if (!selected?.id || demoMode) return;
    if (!confirm(`Change status to ${status.replace('_', ' ')}?`)) return;
    try { await api.updateLicense(selected.id, { status }); toast(`Status updated`); load(); openDetail(selected); } catch (e) { toast(e.message, 'error'); }
  };
  const addComment = async (comment) => {
    if (!selected?.id || demoMode) return;
    try { await api.request(`/api/licenses/${selected.id}/comments`, { method: 'POST', body: JSON.stringify({ comment }) }); toast('Comment added'); openDetail(selected); } catch (e) { toast(e.message, 'error'); }
  };
  const addPayment = async (data) => {
    if (!selected?.id || demoMode) return;
    try { await api.request(`/api/licenses/${selected.id}/payments`, { method: 'POST', body: JSON.stringify(data) }); toast('Payment recorded'); openDetail(selected); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search licenses..." className="w-64" />
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['pending', 'under_review', 'active', 'denied'].map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>)}
        </Select>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3">License #</th><th className="px-4 py-3">Business</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Expires</th>
            </tr></thead>
            <tbody>
              {licenses.map(l => (
                <tr key={l.id} onClick={() => openDetail(l)} className="border-b hover:bg-sky-50 cursor-pointer transition">
                  <td className="px-4 py-3 font-medium text-sky-700">{l.license_number}</td>
                  <td className="px-4 py-3">{l.business_name}</td>
                  <td className="px-4 py-3">{l.type_name}</td>
                  <td className="px-4 py-3">{l.owner_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(l.expiration_date)}</td>
                </tr>
              ))}
              {licenses.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400">{demoMode ? 'Demo mode — no live data' : 'No licenses found'}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <DetailPanel open={!!selected} onClose={() => { setSelected(null); setDetail(null); }} title={selected?.license_number || 'License Detail'}>
        {selected && <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Business:</span> <span className="font-medium">{selected.business_name}</span></div>
            <div><span className="text-gray-500">Status:</span> <StatusBadge status={selected.status} /></div>
            <div><span className="text-gray-500">Owner:</span> <span className="font-medium">{selected.owner_name}</span></div>
            <div><span className="text-gray-500">Type:</span> <span className="font-medium">{selected.type_name}</span></div>
            <div><span className="text-gray-500">Address:</span> <span className="font-medium">{selected.address}</span></div>
            <div><span className="text-gray-500">Annual Fee:</span> <span className="font-medium">{fmtMoney(selected.annual_fee)}</span></div>
          </div>
          <div>
            <SectionTitle icon="refresh-cw">Update Status</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {['pending', 'under_review', 'active', 'denied'].map(s => (
                <Btn key={s} variant={s === selected.status ? 'primary' : 'secondary'} onClick={() => updateStatus(s)}>{STATUS_CONFIG[s].label}</Btn>
              ))}
            </div>
          </div>
          {detail?.payments?.length > 0 && <div>
            <SectionTitle icon="credit-card">Payments</SectionTitle>
            {detail.payments.map(p => <div key={p.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50"><span>{fmtMoney(p.amount)} via {p.payment_method}</span><span className="text-gray-500">{fmtDate(p.received_at)}</span></div>)}
          </div>}
          <div><SectionTitle icon="credit-card">Record Payment</SectionTitle><PaymentForm onSubmit={addPayment} /></div>
          {detail?.comments?.length > 0 && <div>
            <SectionTitle icon="message-square">Comments</SectionTitle>
            {detail.comments.map(c => <div key={c.id} className="bg-gray-50 rounded-lg p-3 text-sm mb-2"><p className="font-medium text-gray-700">{c.author_name}</p><p className="text-gray-600">{c.comment}</p><p className="text-xs text-gray-400 mt-1">{fmtDate(c.created_at)}</p></div>)}
          </div>}
          <div><SectionTitle icon="message-square">Add Comment</SectionTitle><CommentForm onSubmit={addComment} /></div>
        </>}
      </DetailPanel>
    </div>
  );
};

// ===== PARKS TAB =====
const ParksTab = ({ demoMode }) => {
  const toast = useToast();
  const [reservations, setReservations] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [facilityFilter, setFacilityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(() => {
    if (demoMode) return;
    const params = {};
    if (facilityFilter) params.facility_id = facilityFilter;
    if (statusFilter) params.status = statusFilter;
    api.getReservations(params).then(setReservations).catch(() => {});
    api.getFacilities().then(setFacilities).catch(() => {});
  }, [facilityFilter, statusFilter, demoMode]);
  useEffect(() => { load(); }, [load]);

  const updateRes = async (id, status) => {
    if (!confirm(`${status === 'approved' ? 'Approve' : 'Deny'} this reservation?`)) return;
    try { await api.updateReservation(id, { status }); toast(`Reservation ${status}`); load(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={facilityFilter} onChange={e => setFacilityFilter(e.target.value)}>
          <option value="">All Facilities</option>
          {facilities.map(f => <option key={f.id} value={f.id}>{f.park_name} — {f.name}</option>)}
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['pending', 'approved', 'denied', 'cancelled'].map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>)}
        </Select>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3">Res #</th><th className="px-4 py-3">Facility</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-sky-700">{r.reservation_number}</td>
                  <td className="px-4 py-3">{r.facility_name}</td>
                  <td className="px-4 py-3">{r.event_name || '—'}</td>
                  <td className="px-4 py-3">{r.contact_name}</td>
                  <td className="px-4 py-3">{fmtDate(r.event_date)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' && <div className="flex gap-1">
                      <Btn variant="success" onClick={() => updateRes(r.id, 'approved')}>Approve</Btn>
                      <Btn variant="danger" onClick={() => updateRes(r.id, 'denied')}>Deny</Btn>
                    </div>}
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-400">{demoMode ? 'Demo mode — no live data' : 'No reservations found'}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ===== REQUESTS TAB =====
const RequestsTab = ({ demoMode }) => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [staff, setStaff] = useState([]);

  const load = useCallback(() => {
    if (demoMode) return;
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    api.getRequests(params).then(setRequests).catch(() => {});
    api.getStaff().then(setStaff).catch(() => {});
  }, [search, statusFilter, priorityFilter, demoMode]);
  useEffect(() => { load(); }, [load]);

  const openDetail = async (req) => {
    setSelected(req);
    if (!demoMode) { try { setDetail(await api.getRequestDetail(req.id)); } catch { setDetail(null); } }
  };
  const updateRequest = async (data) => {
    if (!selected?.id || demoMode) return;
    try { await api.updateRequest(selected.id, data); toast('Request updated'); load(); openDetail(selected); } catch (e) { toast(e.message, 'error'); }
  };
  const addComment = async (comment) => {
    if (!selected?.id || demoMode) return;
    try { await api.request(`/api/requests/${selected.id}/comments`, { method: 'POST', body: JSON.stringify({ comment }) }); toast('Comment added'); openDetail(selected); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requests..." className="w-64" />
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['submitted', 'in_progress', 'resolved'].map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>)}
        </Select>
        <Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          {['urgent', 'high', 'normal', 'low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </Select>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3">Request #</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Assigned</th>
            </tr></thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} onClick={() => openDetail(r)} className="border-b hover:bg-sky-50 cursor-pointer transition">
                  <td className="px-4 py-3 font-medium text-sky-700">{r.request_number}</td>
                  <td className="px-4 py-3">{r.category_name}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{r.description}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[r.priority] || ''}`}>{r.priority}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{r.assigned_first ? `${r.assigned_first} ${r.assigned_last}` : '—'}</td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400">{demoMode ? 'Demo mode — no live data' : 'No requests found'}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <DetailPanel open={!!selected} onClose={() => { setSelected(null); setDetail(null); }} title={selected?.request_number || 'Request Detail'}>
        {selected && <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Category:</span> <span className="font-medium">{selected.category_name}</span></div>
            <div><span className="text-gray-500">Status:</span> <StatusBadge status={selected.status} /></div>
            <div><span className="text-gray-500">Reporter:</span> <span className="font-medium">{selected.reporter_name}</span></div>
            <div><span className="text-gray-500">Priority:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[selected.priority] || ''}`}>{selected.priority}</span></div>
            <div className="col-span-2"><span className="text-gray-500">Address:</span> <span className="font-medium">{selected.address || '—'}</span></div>
          </div>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selected.description}</p>

          <div>
            <SectionTitle icon="refresh-cw">Update Status</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {['submitted', 'in_progress', 'resolved'].map(s => (
                <Btn key={s} variant={s === selected.status ? 'primary' : 'secondary'} onClick={() => updateRequest({ status: s })}>{STATUS_CONFIG[s].label}</Btn>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle icon="user">Assign To Staff</SectionTitle>
            <Select value={selected.assigned_to || ''} onChange={e => updateRequest({ assigned_to: parseInt(e.target.value) || null })}>
              <option value="">Unassigned</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </Select>
          </div>

          {detail?.comments?.length > 0 && <div>
            <SectionTitle icon="message-square">Comments</SectionTitle>
            {detail.comments.map(c => <div key={c.id} className="bg-gray-50 rounded-lg p-3 text-sm mb-2"><p className="font-medium text-gray-700">{c.author_name}</p><p className="text-gray-600">{c.comment}</p><p className="text-xs text-gray-400 mt-1">{fmtDate(c.created_at)}</p></div>)}
          </div>}
          <div><SectionTitle icon="message-square">Add Comment</SectionTitle><CommentForm onSubmit={addComment} /></div>
        </>}
      </DetailPanel>
    </div>
  );
};

// ===== CALENDAR TAB =====
const CalendarTab = ({ demoMode }) => {
  const [events, setEvents] = useState([]);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  useEffect(() => {
    if (demoMode) return;
    const start = month.toISOString().split('T')[0];
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0];
    api.getCalendar(start, end).then(setEvents).catch(() => {});
  }, [month, demoMode]);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const startDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const pad = Array.from({ length: startDay }, (_, i) => null);
  const cells = [...pad, ...days];

  const eventsForDay = (day) => {
    const dateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><Icon name="chevron-left" size={18} /></button>
        <h3 className="text-lg font-bold text-gray-800">{month.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><Icon name="chevron-right" size={18} /></button>
      </div>
      <div className="grid grid-cols-7 text-xs text-gray-500 font-medium mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {cells.map((day, i) => (
          <div key={i} className={`bg-white min-h-[80px] p-1 ${!day ? 'bg-gray-50' : ''}`}>
            {day && <>
              <div className="text-xs font-medium text-gray-600 mb-0.5">{day}</div>
              {eventsForDay(day).slice(0, 3).map(ev => (
                <div key={ev.id} className="text-[10px] rounded px-1 py-0.5 mb-0.5 truncate text-white" style={{ background: MODULE_COLORS[ev.module] || '#6b7280' }} title={ev.title}>{ev.title}</div>
              ))}
            </>}
          </div>
        ))}
      </div>
    </Card>
  );
};

// ===== MAP TAB =====
const MapTab = ({ permits, parcels, config }) => (
  <div className="h-[calc(100vh-7rem)] rounded-xl overflow-hidden border border-gray-200">
    <PermitMap permits={permits} parcels={parcels} config={config} onPermitClick={() => {}} onParcelClick={() => {}} />
  </div>
);

// ===== REPORTS TAB =====
const ReportsTab = ({ stats }) => {
  const s = stats || {};
  const byType = s.by_type || s.permits?.by_type || [];
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-5">
        <SectionTitle icon="file-text">Permits by Type</SectionTitle>
        {byType.length === 0 ? <p className="text-sm text-gray-400">No data</p> : (
          <div className="space-y-3">
            {byType.map(t => {
              const max = Math.max(...byType.map(x => x.count));
              return (<div key={t.code}>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium">{t.name}</span><span className="text-gray-500">{t.count}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-sky-500 rounded-full" style={{ width: `${(t.count / max) * 100}%` }} /></div>
              </div>);
            })}
          </div>
        )}
      </Card>
      <Card className="p-5">
        <SectionTitle icon="bar-chart-3">Summary</SectionTitle>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Total Permits</span><span className="font-bold">{s.permits?.total ?? s.total ?? 0}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Total Valuation</span><span className="font-bold">{fmtMoney(s.permits?.total_valuation ?? s.total_valuation)}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Fees Collected</span><span className="font-bold">{fmtMoney(s.permits?.fees_collected ?? s.fees_collected)}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Fees Outstanding</span><span className="font-bold text-orange-600">{fmtMoney(s.permits?.fees_outstanding ?? s.fees_outstanding)}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Avg Processing Days</span><span className="font-bold">{s.permits?.avg_processing_days ?? s.avg_processing_days ?? '—'}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Active Licenses</span><span className="font-bold">{s.licenses?.active ?? 0}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Open Requests</span><span className="font-bold">{s.requests?.open ?? 0}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Upcoming Park Reservations</span><span className="font-bold">{s.parks?.upcoming ?? 0}</span></div>
        </div>
      </Card>
    </div>
  );
};

// ===== MAIN STAFF DASHBOARD =====
const StaffDashboard = ({ config, permits, parcels, stats, permitTypes, user, demoMode, onLogout, onSwitchToPublic, onRefresh }) => {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <DashboardTab stats={stats} demoMode={demoMode} />;
      case 'permits': return <PermitsTab permits={permits} demoMode={demoMode} />;
      case 'licenses': return <LicensesTab demoMode={demoMode} />;
      case 'parks': return <ParksTab demoMode={demoMode} />;
      case 'requests': return <RequestsTab demoMode={demoMode} />;
      case 'calendar': return <CalendarTab demoMode={demoMode} />;
      case 'map': return <MapTab permits={permits} parcels={parcels} config={config} />;
      case 'reports': return <ReportsTab stats={stats} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-slate-800 text-white flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sky-600 rounded-lg flex items-center justify-center"><Icon name="mountain" size={18} className="text-white" /></div>
            <div><p className="font-bold text-sm leading-tight">{config.cityName}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">Staff Portal</p></div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${tab === item.id ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
              <Icon name={item.icon} size={18} />{item.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-700 space-y-2">
          {user && <div className="text-xs"><p className="font-medium text-slate-200">{user.first_name} {user.last_name}</p><p className="text-slate-400">{user.title || user.role}</p></div>}
          {demoMode && <span className="inline-block text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full font-medium">DEMO MODE</span>}
          <div className="flex gap-2">
            <button onClick={onSwitchToPublic} className="text-xs text-slate-400 hover:text-white transition">Public View</button>
            <span className="text-slate-600">&middot;</span>
            <button onClick={onLogout} className="text-xs text-slate-400 hover:text-red-400 transition">Log Out</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg"><Icon name="menu" size={20} /></button>
            <h1 className="text-lg font-bold text-gray-900">{NAV_ITEMS.find(n => n.id === tab)?.label}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRefresh} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Refresh data"><Icon name="refresh-cw" size={16} /></button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          {renderTab()}
        </div>
      </main>
    </div>
  );
};
