// ==========================================================================
// PUBLIC PORTAL — citizen-facing components
// ==========================================================================
const AUTOSAVE_KEY = 'tforks_permit_draft';

// ---------- Citizen Request Modal ----------
const CitizenRequestModal = ({ onClose, onCreated }) => {
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState(null);
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ category_id: '', address: '', description: '', reporter_name: '', reporter_phone: '', reporter_email: '' });
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { api.getRequestCategories().then(r => setCategories(r.categories || r)).catch(() => {}); }, []);

  const handlePhoto = (files) => {
    const f = files[0]; if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast('File must be under 10 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => setPhoto({ filename: f.name, file_data: reader.result, file_size: f.size });
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const payload = { ...form, category_id: parseInt(form.category_id) || undefined };
      if (photo) payload.photo = photo;
      await api.createRequest(payload);
      toast('Issue reported! We will follow up soon.');
      onCreated?.(); onClose();
    } catch (err) { toast(err.message, 'error'); }
    setSubmitting(false);
  };

  const inp = "w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none";
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-5 border-b bg-orange-600 rounded-t-xl text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center"><Icon name="alert-triangle" size={20} className="text-white" /></div>
            <div><h3 className="font-bold text-lg">Report an Issue</h3><p className="text-orange-200 text-xs">Three Forks, MT</p></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition"><Icon name="x" size={18} className="text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select value={form.category_id} onChange={e => u('category_id', e.target.value)} required className={inp} style={{fontSize:'16px'}}>
              <option value="">Select a category...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address *</label>
            <input type="text" value={form.address} onChange={e => u('address', e.target.value)} placeholder="e.g. 206 Main St or near Headwaters Park" required className={inp} style={{fontSize:'16px'}} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => u('description', e.target.value)} placeholder="Describe the issue in detail..." rows={3} required className={inp} style={{fontSize:'16px'}} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input type="text" value={form.reporter_name} onChange={e => u('reporter_name', e.target.value)} className={inp} style={{fontSize:'16px'}} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.reporter_phone} onChange={e => u('reporter_phone', e.target.value)} className={inp} style={{fontSize:'16px'}} /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.reporter_email} onChange={e => u('reporter_email', e.target.value)} className={inp} style={{fontSize:'16px'}} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
            <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { handlePhoto(e.target.files); e.target.value = ''; }} />
              {photo ? <div className="flex items-center gap-2 justify-center"><Icon name="image" size={16} className="text-orange-500" /><span className="text-sm text-gray-700 truncate">{photo.filename}</span><button type="button" onClick={e => { e.stopPropagation(); setPhoto(null); }} className="text-gray-400 hover:text-red-500"><Icon name="x" size={14} /></button></div>
                : <p className="text-sm text-gray-500">Click to attach a photo</p>}
            </div>
          </div>
        </form>
        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !form.category_id || !form.address || !form.description}
            className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-40 text-sm font-medium flex items-center gap-1" style={{touchAction:'manipulation'}}>
            {submitting ? 'Submitting...' : 'Submit Report'} <Icon name="send" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Park Reservation Modal ----------
const ParkReservationModal = ({ onClose, onCreated }) => {
  const [facilities, setFacilities] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const [form, setForm] = useState({ facility_id: '', event_date: '', start_time: '10:00', end_time: '14:00', event_name: '', contact_name: '', contact_phone: '', contact_email: '', attendee_count: '' });
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { api.getFacilities().then(r => setFacilities(r.facilities || r)).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const payload = { ...form, facility_id: parseInt(form.facility_id) || undefined, attendee_count: parseInt(form.attendee_count) || undefined };
      await api.createReservation(payload);
      toast('Reservation submitted! We will confirm shortly.');
      onCreated?.(); onClose();
    } catch (err) { toast(err.message, 'error'); }
    setSubmitting(false);
  };

  const inp = "w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none";
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-5 border-b bg-emerald-600 rounded-t-xl text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center"><Icon name="trees" size={20} className="text-white" /></div>
            <div><h3 className="font-bold text-lg">Reserve a Park Facility</h3><p className="text-emerald-200 text-xs">Three Forks, MT</p></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition"><Icon name="x" size={18} className="text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facility *</label>
            <select value={form.facility_id} onChange={e => u('facility_id', e.target.value)} required className={inp} style={{fontSize:'16px'}}>
              <option value="">Select a facility...</option>
              {facilities.map(f => <option key={f.id} value={f.id}>{f.name}{f.location ? ` — ${f.location}` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
              <input type="date" value={form.event_date} onChange={e => u('event_date', e.target.value)} required className={inp} style={{fontSize:'16px'}} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Start *</label>
              <input type="time" value={form.start_time} onChange={e => u('start_time', e.target.value)} required className={inp} style={{fontSize:'16px'}} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">End *</label>
              <input type="time" value={form.end_time} onChange={e => u('end_time', e.target.value)} required className={inp} style={{fontSize:'16px'}} /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
            <input type="text" value={form.event_name} onChange={e => u('event_name', e.target.value)} placeholder="e.g. Birthday Party, Family Reunion" required className={inp} style={{fontSize:'16px'}} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
              <input type="text" value={form.contact_name} onChange={e => u('contact_name', e.target.value)} required className={inp} style={{fontSize:'16px'}} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" value={form.contact_phone} onChange={e => u('contact_phone', e.target.value)} required className={inp} style={{fontSize:'16px'}} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.contact_email} onChange={e => u('contact_email', e.target.value)} className={inp} style={{fontSize:'16px'}} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
              <input type="number" value={form.attendee_count} onChange={e => u('attendee_count', e.target.value)} placeholder="25" className={inp} style={{fontSize:'16px'}} /></div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 text-xs text-emerald-800">
            <p className="font-semibold mb-1">Reservation Guidelines</p>
            <ul className="list-disc ml-4 space-y-0.5">
              <li>Reservations confirmed by staff within 2 business days</li>
              <li>Groups over 50 may require a special event permit</li>
              <li>Please clean up after your event and bag all trash</li>
            </ul>
          </div>
        </form>
        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !form.facility_id || !form.event_date || !form.event_name || !form.contact_name || !form.contact_phone}
            className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 text-sm font-medium flex items-center gap-1" style={{touchAction:'manipulation'}}>
            {submitting ? 'Submitting...' : 'Request Reservation'} <Icon name="send" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- New Permit Application (single scrollable form with auto-save) ----------
const NewPermitModal = ({ permitTypes, onClose, onCreated, demoMode, initialType }) => {
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTypeList, setShowTypeList] = useState(!initialType);
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);
  const saveTimer = useRef(null);
  const toast = useToast();
  const types = permitTypes.length > 0 ? permitTypes : DEFAULT_PERMIT_TYPES;

  const handleFiles = (fileList) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'];
    Array.from(fileList).forEach(file => {
      if (!allowed.includes(file.type)) { toast(`${file.name}: Only PDF, PNG, JPG, TIFF allowed`, 'error'); return; }
      if (file.size > 10 * 1024 * 1024) { toast(`${file.name}: Max 10 MB`, 'error'); return; }
      const reader = new FileReader();
      reader.onload = () => setAttachments(prev => [...prev, {
        filename: file.name,
        doc_type: file.name.toLowerCase().includes('site') ? 'site_plan' : file.name.toLowerCase().includes('floor') ? 'floor_plan' : file.name.toLowerCase().includes('elevation') ? 'elevation' : 'other',
        file_size: file.size, file_data: reader.result,
      }]);
      reader.readAsDataURL(file);
    });
  };
  const removeAttachment = (idx) => setAttachments(prev => prev.filter((_, i) => i !== idx));

  // Load saved draft from localStorage
  const loadDraft = () => {
    try { const d = JSON.parse(localStorage.getItem(AUTOSAVE_KEY)); return d || null; } catch { return null; }
  };
  const defaultForm = {
    permit_type_code: initialType || 'ZP-R',
    address: '', parcel_id: '', lot: '', block: '', subdivision: '',
    zoning_district: '', flood_zone: '', land_area: '',
    applicant_name: '', applicant_phone: '', applicant_email: '', applicant_address: '',
    owner_name: '', owner_phone: '', owner_email: '', owner_address: '', owner_city: '', owner_state: 'MT', owner_zip: '',
    builder_name: '', builder_phone: '', builder_email: '', builder_license: '',
    builder_address: '', builder_city: '', builder_state: 'MT', builder_zip: '',
    description: '', valuation: '', square_footage: '', construction_start: '', work_type: '',
    project_name: '', developer_name: '', developer_phone: '',
    variance_regulation: '', variance_hardship: '', variance_public_interest: '',
    floodplain_permit_num: '', elevation_cert: '', foundation_type: '',
    building_height_residential: '', building_height_commercial: '', building_height_accessory: '',
    connection_type: '', structure_type: '', connect_date: '', line_size: '', line_length: '', sewer_grade: '', contractor_insurance: '',
    after_the_fact: false, corner_pins: '',
  };
  const draft = loadDraft();
  const [form, setForm] = useState(draft ? { ...defaultForm, ...draft } : defaultForm);
  const [hasDraft] = useState(!!draft);

  // Auto-save to localStorage on every change (debounced 800ms)
  const update = (f, v) => setForm(p => {
    const next = { ...p, [f]: v };
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(next)); setSaved(true); setTimeout(() => setSaved(false), 2000); } catch {}
    }, 800);
    return next;
  });
  const clearDraft = () => { try { localStorage.removeItem(AUTOSAVE_KEY); } catch {} };

  const selectedType = types.find(t => t.code === form.permit_type_code) || types[0];
  const isZoning = form.permit_type_code.startsWith('ZP');
  const isCUP = form.permit_type_code === 'CUP';
  const isVariance = form.permit_type_code === 'VAR';
  const isFloodplain = form.permit_type_code === 'FP';
  const isWSC = form.permit_type_code === 'WSC';
  const inp = "w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none";
  const section = "border-t pt-5 mt-6";
  const F = (label, field, props = {}) => (<div className={props.cls}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {props.type === 'select' ? <select value={form[field]} onChange={e => update(field, e.target.value)} className={inp} style={props.big ? {fontSize:'16px'} : {}}>{props.opts}</select>
    : props.type === 'textarea' ? <textarea value={form[field]} onChange={e => update(field, e.target.value)} placeholder={props.ph} rows={props.rows||3} className={inp} style={props.big ? {fontSize:'16px'} : {}} />
    : <input type={props.t||'text'} value={form[field]} onChange={e => update(field, e.target.value)} placeholder={props.ph} className={`${inp} ${props.mono?'font-mono':''}`} style={props.big ? {fontSize:'16px'} : {}} />}</div>);
  const sectionHead = (icon, title, desc) => (<div className="flex items-center gap-3 mb-4"><div className="w-9 h-9 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0"><Icon name={icon} size={18} className="text-sky-700" /></div><div><h4 className="font-semibold text-gray-900">{title}</h4>{desc && <p className="text-xs text-gray-500">{desc}</p>}</div></div>);

  const canSubmit = !!form.address && !!form.applicant_name && !!form.description && agreed;

  const handleSubmit = async () => {
    if (demoMode) { toast('Demo mode — application not saved', 'warning'); onClose(); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, valuation: parseFloat(form.valuation) || 0, square_footage: parseInt(form.square_footage) || null };
      if (attachments.length > 0) payload.files = attachments;
      const result = await api.createPermit(payload);
      clearDraft();
      toast(`Application submitted! Permit #${result.permit_number} — Fee: $${result.fees}${result.documents ? ` — ${result.documents} file(s) attached` : ''}`);
      onCreated(); onClose();
    } catch (err) { toast(err.message, 'error'); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white sm:rounded-xl shadow-2xl w-full sm:max-w-2xl sm:mx-4 h-full sm:h-auto sm:max-h-[92vh] flex flex-col">
        <div className="p-5 border-b hero-gradient rounded-t-xl text-white flex items-center justify-between relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 80" preserveAspectRatio="none" style={{opacity:0.06}}><path d="M0,60 L100,50 L200,35 L300,45 L400,25 L500,40 L600,20 L700,35 L800,15 L800,80 L0,80 Z" fill="white"/></svg>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur"><Icon name="file-text" size={20} className="text-white" /></div>
            <div><h3 className="font-bold text-lg">Online Permit Application</h3><p className="text-sky-300 text-xs mt-0.5">Town of Three Forks, MT &mdash; Title 11 Zoning Code</p></div>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            {saved && <span className="text-xs text-sky-200 flex items-center gap-1"><Icon name="check" size={12} /> Saved</span>}
            <button onClick={() => { clearDraft(); onClose(); }} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition"><Icon name="x" size={18} className="text-white" /></button>
          </div>
        </div>
        {hasDraft && <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-sm text-emerald-700"><Icon name="save" size={14} /> Draft restored from your last visit. <button onClick={() => { clearDraft(); setForm(defaultForm); }} className="text-emerald-600 underline text-xs ml-auto">Clear draft</button></div>}
        <div className="flex-1 overflow-auto p-5 space-y-0">
          {/* 1. Permit Type — collapsed once selected */}
          {showTypeList ? (<>
            {sectionHead('clipboard-list', 'Select Application Type', 'Choose the type of permit you need.')}
            <div className="grid gap-2 mb-2">
              {types.map(t => (
                <label key={t.code} onClick={() => { update('permit_type_code', t.code); setShowTypeList(false); }} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${form.permit_type_code === t.code ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-500' : 'border-gray-200 hover:border-sky-300'}`}>
                  <input type="radio" name="ptype" checked={form.permit_type_code === t.code} readOnly className="accent-sky-600" />
                  <div className="flex-1"><div className="font-medium text-sm text-gray-900">{t.name}</div>{t.description && <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>}</div>
                  <span className="text-sm font-semibold text-sky-700">${t.base_fee}</span>
                </label>
              ))}
            </div>
          </>) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-50 border border-sky-200 mb-2">
              <div className="w-9 h-9 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0"><Icon name="file-text" size={18} className="text-sky-700" /></div>
              <div className="flex-1 min-w-0"><div className="font-semibold text-gray-900">{selectedType?.name}</div><div className="text-xs text-gray-500">{selectedType?.description || `Filing fee: $${selectedType?.base_fee}`}</div></div>
              <button onClick={() => setShowTypeList(true)} className="px-3 py-1.5 bg-white border border-sky-300 text-sky-700 rounded-lg text-xs font-medium hover:bg-sky-50 transition flex items-center gap-1"><Icon name="repeat" size={12} /> Switch Form</button>
            </div>
          )}

          {/* 2. Subject Property */}
          <div className={section}>
            {sectionHead('map-pin', 'Subject Property', 'Property address and legal description where work will occur.')}
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Site Address *</label><input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="e.g. 121 E Jefferson St" className={inp} style={{fontSize:'16px'}} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Parcel ID</label><input type="text" value={form.parcel_id} onChange={e => update('parcel_id', e.target.value)} placeholder="06-0450-XX-X-XX-XX-0000" className={`${inp} font-mono`} style={{fontSize:'16px'}} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Lot(s)</label><input type="text" value={form.lot} onChange={e => update('lot', e.target.value)} className={inp} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Block</label><input type="text" value={form.block} onChange={e => update('block', e.target.value)} className={inp} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Subdivision</label><input type="text" value={form.subdivision} onChange={e => update('subdivision', e.target.value)} className={inp} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Zoning</label><select value={form.zoning_district} onChange={e => update('zoning_district', e.target.value)} className={inp}><option value="">Select...</option>{Object.keys(ZONING_COLORS).map(z => <option key={z} value={z}>{z}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Land Area</label><input type="text" value={form.land_area} onChange={e => update('land_area', e.target.value)} placeholder="Sq ft or acres" className={inp} /></div>
              </div>
              {isFloodplain && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-800 mb-2">Floodplain Information</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-blue-700 mb-1">FEMA Flood Zone</label><select value={form.flood_zone} onChange={e => update('flood_zone', e.target.value)} className={inp}><option value="">Select...</option><option value="AE">AE - Detailed Study</option><option value="A">A - Approximate Study</option><option value="X">X - Outside Floodplain</option></select></div>
                    <div><label className="block text-xs font-medium text-blue-700 mb-1">Foundation Type</label><select value={form.foundation_type} onChange={e => update('foundation_type', e.target.value)} className={inp}><option value="">Select...</option><option value="Slab on Grade">Slab on Grade</option><option value="Crawl Space">Crawl Space</option><option value="Stem Walls">Stem Walls</option><option value="Other">Other</option></select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div><label className="block text-xs font-medium text-blue-700 mb-1">Floodplain Permit #</label><input type="text" value={form.floodplain_permit_num} onChange={e => update('floodplain_permit_num', e.target.value)} className={inp} /></div>
                    <div><label className="block text-xs font-medium text-blue-700 mb-1">Elevation Certificate</label><input type="text" value={form.elevation_cert} onChange={e => update('elevation_cert', e.target.value)} placeholder="If needed" className={inp} /></div>
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.after_the_fact} onChange={e => update('after_the_fact', e.target.checked)} className="accent-sky-600" /><span className="text-gray-700">This is an after-the-fact permit application</span></label>
            </div>
          </div>

          {/* 3. Applicant Information */}
          <div className={section}>
            {sectionHead('user', 'Applicant Information', 'The person responsible for this permit request.')}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">{F('Applicant Name *','applicant_name',{ph:'Full name',big:1})}{F('Phone *','applicant_phone',{t:'tel',ph:'(406) 555-0123',big:1})}</div>
              {F('Email','applicant_email',{t:'email',ph:'applicant@email.com',big:1})}
              {isCUP && F('Mailing Address','applicant_address',{ph:'Street, City, State, Zip'})}
            </div>
          </div>

          {/* 4. Property Owner */}
          <div className={section}>
            {sectionHead('home', 'Property Owner', 'If different from applicant. Leave blank if you are the owner.')}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">{F('Owner Name','owner_name')}{F('Owner Phone','owner_phone',{t:'tel'})}</div>
              {F('Owner Email','owner_email',{t:'email'})}
              {F('Owner Mailing Address','owner_address')}
              <div className="grid grid-cols-3 gap-3">{F('City','owner_city')}{F('State','owner_state')}{F('Zip','owner_zip')}</div>
            </div>
          </div>

          {/* 5. Builder/Contractor (zoning permits only) */}
          {isZoning && (
            <div className={section}>
              {sectionHead('hard-hat', 'Builder / Contractor')}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">{F('Builder Name','builder_name')}{F('Builder Phone','builder_phone',{t:'tel'})}</div>
                <div className="grid grid-cols-2 gap-3">{F('Builder Email','builder_email',{t:'email'})}{F('TF Business License #','builder_license')}</div>
                {F('Builder Mailing Address','builder_address')}
                <div className="grid grid-cols-3 gap-3">{F('City','builder_city')}{F('State','builder_state')}{F('Zip','builder_zip')}</div>
              </div>
            </div>
          )}

          {/* 5b. Water/Sewer Connection Details */}
          {isWSC && (
            <div className={section}>
              {sectionHead('droplet', 'Water / Sewer Connection Details', 'Minimum 48 hours notice (M-F) before physical connection. $250 fee each.')}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Connection Type *</label><select value={form.connection_type} onChange={e => update('connection_type', e.target.value)} className={inp}><option value="">Select...</option><option value="Water">Water</option><option value="Sewer">Sewer</option><option value="Both">Water & Sewer</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Type of Structure</label><select value={form.structure_type} onChange={e => update('structure_type', e.target.value)} className={inp}><option value="">Select...</option><option value="Residential">Residential</option><option value="Commercial">Commercial</option><option value="Industrial">Industrial</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Approx. Connect Date</label><input type="date" value={form.connect_date} onChange={e => update('connect_date', e.target.value)} className={inp} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Line Size</label><input type="text" value={form.line_size} onChange={e => update('line_size', e.target.value)} className={inp} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Length of Line</label><input type="text" value={form.line_length} onChange={e => update('line_length', e.target.value)} className={inp} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Sewer Grade & Size</label><input type="text" value={form.sewer_grade} onChange={e => update('sewer_grade', e.target.value)} className={inp} /></div>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.contractor_insurance === 'Y'} onChange={e => update('contractor_insurance', e.target.checked ? 'Y' : 'N')} className="accent-sky-600" /><span className="text-gray-700">Contractor has proof of insurance/bond on file</span></label>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-xs text-amber-800">
                  <p className="font-semibold">Water/Sewer Requirements:</p>
                  <ul className="mt-1 list-disc ml-4 space-y-0.5"><li>Work on City property MUST be done by a State licensed/bonded contractor</li><li>All sewer joints inspected by City prior to backfill (City Ord. 9-5-9)</li><li>All connections to mains done by City Personnel</li></ul>
                </div>
              </div>
            </div>
          )}

          {/* 6. Project Details */}
          <div className={section}>
            {sectionHead('hammer', 'Project Details', isZoning ? 'Describe the proposed structure and use. Reference Three Forks Zoning Code Title 11.' : isCUP ? 'Describe the conditional use per Title 11, Chapter 12.' : isVariance ? 'Explain your variance request and hardship.' : isFloodplain ? 'Describe proposed work in the floodplain.' : 'Provide details about the proposed work.')}
            <div className="space-y-3">
              {isCUP && F('Project Name','project_name')}
              {F(isVariance ? 'Explain Variance Request *' : isCUP ? 'Conditional Use Description *' : 'Describe Proposed Structure and Use *', 'description', {type:'textarea',rows:4,ph:isVariance?'Which zoning regulations does the variance apply to...':isCUP?'Describe the conditional use...':'Describe the proposed work...',big:1})}
              {isVariance && (<>
                {F('Zoning Regulations Variance Applies To *','variance_regulation',{type:'textarea',ph:'Which zoning regulations does this variance apply to...'})}
                {F('Describe the Hardship *','variance_hardship',{type:'textarea',ph:'Describe the hardship imposed by the zoning regulations...'})}
                {F('How Does This Serve the Public Interest? *','variance_public_interest',{type:'textarea',ph:'Describe how this variance will serve the public interest...'})}
              </>)}
              <div className="grid grid-cols-2 gap-3">{F('Estimated Value ($)','valuation',{t:'number',ph:'0'})}{F('Square Footage','square_footage',{t:'number',ph:'Total sq ft'})}</div>
              {isZoning && (<><div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Construction Start</label><input type="date" value={form.construction_start} onChange={e => update('construction_start', e.target.value)} className={inp} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Corner Pins</label><input type="text" value={form.corner_pins} onChange={e => update('corner_pins', e.target.value)} placeholder="How many marked?" className={inp} /></div>
              </div>
              <p className="text-xs font-medium text-gray-500 mt-2">Height of Building(s) at Tallest Point:</p>
              <div className="grid grid-cols-3 gap-3">{F('Residential','building_height_residential',{ph:'Max 36 ft'})}{F('Commercial','building_height_commercial')}{F('Accessory','building_height_accessory',{ph:'Max 20 ft'})}</div></>)}
              {isCUP && (<div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Developer/Architect</label><input type="text" value={form.developer_name} onChange={e => update('developer_name', e.target.value)} className={inp} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Developer Phone</label><input type="tel" value={form.developer_phone} onChange={e => update('developer_phone', e.target.value)} className={inp} /></div>
              </div>)}
            </div>
          </div>

          {/* 7. Attachments */}
          <div className={section}>
            {sectionHead('upload', 'Attach Documents', 'Site plans, floor plans, elevations — PDF, PNG, JPG, TIFF (max 10 MB each).')}
            <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${dragOver ? 'border-sky-500 bg-sky-50' : 'border-gray-300 hover:border-sky-400 hover:bg-gray-50'}`}
              onClick={() => fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif" className="hidden" onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
              <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-2"><Icon name="cloud-upload" size={24} className="text-sky-600" /></div>
              <p className="text-sm font-medium text-gray-700">Drag &amp; drop files here, or click to browse</p>
            </div>
            {attachments.length > 0 && <div className="mt-3 space-y-2">{attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border">
                <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center flex-shrink-0"><Icon name={att.filename.endsWith('.pdf') ? 'file-text' : 'image'} size={14} className="text-red-500" /></div>
                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{att.filename}</div><div className="text-[10px] text-gray-400">{(att.file_size / 1024 / 1024).toFixed(1)} MB <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded text-[9px] font-medium ml-1">{att.doc_type.replace('_', ' ')}</span></div></div>
                <button onClick={e => { e.stopPropagation(); removeAttachment(i); }} className="text-gray-400 hover:text-red-500 p-1"><Icon name="x" size={14} /></button>
              </div>
            ))}</div>}
          </div>

          {/* 8. Affidavit & Submit */}
          <div className={section}>
            {sectionHead('shield-check', 'Affidavit & Submission')}
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-4">
              <h5 className="font-bold text-sm text-sky-900 mb-2">AFFIDAVIT OF OWNER</h5>
              <p className="text-xs text-sky-800 leading-relaxed">I hereby certify under penalty of perjury and the laws of the State of Montana that the information submitted herein is full, true, complete, and accurate to the best of my knowledge. Should any information be incorrect, I understand any approval may be rescinded. The signing of this application signifies approval for representatives of the City of Three Forks to be present on the property for routine monitoring and inspection. All work shall be done in accordance with the approved plans and in compliance with the City of Three Forks Zoning Ordinance, Title 11.</p>
              <label className="flex items-start gap-2 mt-3 cursor-pointer"><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="accent-sky-600 mt-0.5" /><span className="text-sm font-medium text-sky-900">I agree to the above affidavit and certify all information is accurate</span></label>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-xs text-amber-800">
              <p className="font-semibold">Important Reminders:</p>
              <ul className="mt-1 space-y-0.5 list-disc ml-4">
                <li>Permit expires one year from issue date</li>
                <li>Construction must commence within 6 months</li>
                <li>Notify Zoning Inspector before pouring concrete</li>
                <li>Filing fee of ${selectedType?.base_fee} is due upon submission to City Hall</li>
                {isCUP && <li>Complete packages due by noon on the last Friday of the month</li>}
                {isCUP && <li>Two public hearings are required; you must attend both</li>}
              </ul>
            </div>
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400"><Icon name="save" size={12} /> Your progress is saved automatically</div>
          <div className="flex items-center gap-2">
            <button onClick={() => { clearDraft(); onClose(); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || !canSubmit} className="px-5 py-2.5 bg-sky-700 text-white rounded-lg hover:bg-sky-800 disabled:opacity-40 text-sm font-semibold flex items-center gap-2 shadow-sm" style={{touchAction:'manipulation'}}>{submitting ? 'Submitting...' : 'Submit Application'} <Icon name="send" size={14} /></button>
          </div>
        </div>
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
    if (map.current || !config.mapboxToken) return;
    mapboxgl.accessToken = config.mapboxToken;
    map.current = new mapboxgl.Map({ container: mapContainer.current, style: 'mapbox://styles/mapbox/light-v11', center: config.mapCenter, zoom: config.mapZoom });
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
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
  }, [config.mapboxToken]);

  useEffect(() => { if (loaded && map.current?.getSource('construction')) map.current.getSource('construction').setData(geoJSON); }, [loaded, geoJSON]);

  const activeCount = permits.filter(p => p.status === 'approved' && p.coords).length;
  const completedCount = permits.filter(p => p.status === 'completed' && p.coords).length;

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
        {/* Legend */}
        <div className="absolute bottom-6 left-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 text-xs border z-10">
          <p className="font-bold text-gray-800 mb-2 text-[11px] uppercase tracking-wider">Construction Status</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-white shadow" style={{backgroundColor:CONSTRUCTION_COLORS.approved}} /><span className="text-gray-700 font-medium">Active Construction</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-white shadow" style={{backgroundColor:CONSTRUCTION_COLORS.completed}} /><span className="text-gray-700 font-medium">Completed</span></div>
          </div>
        </div>
        {/* Project detail card */}
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
        {/* Stats bar */}
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

// ---------- Public Portal ----------
const PublicPortal = ({ config, permits, parcels, permitTypes, demoMode, onStaffLogin, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [showNewPermit, setShowNewPermit] = useState(false);
  const [newPermitType, setNewPermitType] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showParkModal, setShowParkModal] = useState(false);
  const [showConstructionMap, setShowConstructionMap] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const toast = useToast();

  if (showConstructionMap) {
    return <ConstructionMap config={config} permits={permits} parcels={parcels} onBack={() => setShowConstructionMap(false)} />;
  }

  const openPermitForm = (typeCode) => { setNewPermitType(typeCode || null); setShowNewPermit(true); };

  const filteredPermits = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return permits.filter(p => p.address.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.applicant.toLowerCase().includes(q));
  }, [permits, searchQuery]);

  const stats = useMemo(() => ({
    total: permits.length,
    active: permits.filter(p => p.status === 'pending' || p.status === 'under_review' || p.status === 'approved').length,
    approved: permits.filter(p => p.status === 'approved').length,
  }), [permits]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center hero-gradient shadow-md">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19"/></svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight tracking-tight">Town of {config.cityName}</h1>
              <p className="text-[11px] text-sky-700 font-medium leading-tight tracking-wide uppercase">Development &amp; Permitting</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowConstructionMap(true)} className="hidden md:flex text-gray-500 hover:text-amber-700 px-3 py-2 rounded-lg text-sm items-center gap-1.5 transition hover:bg-amber-50 font-medium" style={{touchAction:'manipulation'}}><Icon name="hard-hat" size={15} /> Construction Map</button>
            <button onClick={() => setShowRequestModal(true)} className="hidden md:flex text-gray-500 hover:text-orange-600 px-3 py-2 rounded-lg text-sm items-center gap-1.5 transition hover:bg-orange-50" style={{touchAction:'manipulation'}}><Icon name="alert-triangle" size={15} /> Report Issue</button>
            <button onClick={() => openPermitForm(null)} className="bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-sm" style={{touchAction:'manipulation'}}><Icon name="file-plus" size={16} /> <span className="hidden sm:inline">Apply for a Permit</span><span className="sm:hidden">Apply</span></button>
            <button onClick={onStaffLogin} className="text-gray-400 hover:text-gray-600 px-2.5 py-2 rounded-lg text-sm flex items-center gap-1 transition"><Icon name="lock" size={14} /></button>
          </div>
        </div>
      </header>

      {/* Hero Map */}
      <div className="relative" style={{ height: 'min(55vh, 420px)', minHeight: '280px' }}>
        <PermitMap permits={permits} parcels={parcels} selectedPermit={selectedPermit} onPermitClick={p => setSelectedPermit(p)} config={config} className="h-full" />
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-full max-w-lg px-3 z-10">
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search address, permit #, or name…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl text-gray-900 shadow-xl border border-white/50 focus:ring-2 focus:ring-sky-500 outline-none bg-white/95 backdrop-blur-md" style={{fontSize:'16px'}} />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center"><Icon name="x" size={16} /></button>}
          </div>
          {filteredPermits.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg mt-1.5 max-h-60 overflow-auto border">
              {filteredPermits.map(permit => (
                <div key={permit.id} onClick={() => { setSelectedPermit(permit); setSearchQuery(''); }} className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b last:border-0">
                  <div className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="font-semibold text-sm text-gray-900">{permit.id}</span><StatusBadge status={permit.status} /></div><div className="text-xs text-gray-500 mt-0.5 truncate">{permit.address}</div></div><Icon name="chevron-right" size={16} className="text-gray-400 flex-shrink-0" /></div>
                </div>
              ))}
            </div>
          )}
          {searchQuery && filteredPermits.length === 0 && <div className="bg-white rounded-xl shadow-lg mt-1.5 p-3 text-center border"><p className="text-sm text-gray-500">No results for "{searchQuery}"</p></div>}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-4 border border-white/50 pointer-events-auto overflow-x-auto max-w-full" style={{scrollbarWidth:'none'}}>
            {[{ v: stats.total, l: 'Permits', c: 'text-gray-900' }, { v: stats.active, l: 'Active', c: 'text-sky-600' }, { v: stats.approved, l: 'Approved', c: 'text-emerald-600' }].map((s, i) => (
              <React.Fragment key={i}>{i > 0 && <div className="w-px h-7 bg-gray-200 flex-shrink-0" />}<div className="text-center flex-shrink-0"><div className={`text-xl font-extrabold leading-tight ${s.c}`}>{s.v}</div><div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{s.l}</div></div></React.Fragment>
            ))}
            <div className="w-px h-7 bg-gray-200 flex-shrink-0" />
            <div className="text-center flex-shrink-0"><div className="text-xl font-extrabold text-gray-900 leading-tight">${(permits.reduce((s,p) => s + (p.valuation||0), 0)/1000000).toFixed(1)}M</div><div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Investment</div></div>
          </div>
        </div>
      </div>

      {/* Selected permit detail */}
      {selectedPermit && (
        <div className="bg-white border-b shadow-lg slide-up">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: (STATUS_CONFIG[selectedPermit.status] || STATUS_CONFIG.pending).color + '18' }}><Icon name="file-text" size={18} className="text-sky-700" /></div>
                <div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="text-base font-extrabold text-gray-900">{selectedPermit.id}</span><StatusBadge status={selectedPermit.status} /></div><span className="text-xs text-gray-500 truncate block">{selectedPermit.type}</span></div>
              </div>
              <button onClick={() => setSelectedPermit(null)} className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0 transition"><Icon name="x" size={20} /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-3 overflow-x-auto" style={{scrollbarWidth:'none'}}>
              <div className="flex items-center justify-between relative min-w-[260px]">
                <div className="absolute top-4 left-6 right-6 h-1 bg-gray-200 rounded" />
                <div className="absolute top-4 left-6 h-1 bg-sky-500 rounded transition-all" style={{ width: selectedPermit.status === 'pending' ? '0%' : selectedPermit.status === 'under_review' ? '33%' : '75%', maxWidth: 'calc(100% - 48px)' }} />
                {[{ label: 'Submitted', icon: 'send', done: true }, { label: 'In Review', icon: 'eye', done: selectedPermit.status !== 'pending' }, { label: 'Decision', icon: selectedPermit.status === 'denied' ? 'x-circle' : 'check-circle', done: selectedPermit.status === 'approved' || selectedPermit.status === 'denied' }, { label: selectedPermit.status === 'denied' ? 'Denied' : 'Approved', icon: selectedPermit.status === 'denied' ? 'alert-triangle' : 'award', done: selectedPermit.status === 'approved' || selectedPermit.status === 'denied' }].map((s, i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center gap-1 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition ${s.done ? selectedPermit.status === 'denied' && i >= 2 ? 'bg-red-100 border-red-400 text-red-600' : 'bg-sky-100 border-sky-500 text-sky-700' : 'bg-white border-gray-300 text-gray-400'}`}><Icon name={s.icon} size={13} /></div>
                    <span className={`text-[10px] font-semibold text-center leading-tight ${s.done ? 'text-gray-700' : 'text-gray-400'}`}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">Address</span><span className="text-sm font-semibold text-gray-900 leading-snug">{selectedPermit.address}</span></div>
              <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">Applicant</span><span className="text-sm font-semibold text-gray-900">{selectedPermit.applicant}</span></div>
              <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">Submitted</span><span className="text-sm font-semibold text-gray-900">{selectedPermit.submitted}</span></div>
              {selectedPermit.valuation > 0 && <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">Project Value</span><span className="text-sm font-semibold text-gray-900">${selectedPermit.valuation?.toLocaleString()}</span></div>}
            </div>
            <div className="mb-3"><span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Description</span><p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">{selectedPermit.description}</p></div>
            <div className="space-y-2">
              {selectedPermit.conditions && <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200"><div className="flex items-center gap-1.5 mb-1"><Icon name="check-circle" size={13} className="text-emerald-600" /><span className="text-[10px] text-emerald-700 uppercase font-semibold">Conditions of Approval</span></div><p className="text-sm text-emerald-800">{selectedPermit.conditions}</p></div>}
              {selectedPermit.denial_reason && <div className="bg-red-50 rounded-lg p-3 border border-red-200"><div className="flex items-center gap-1.5 mb-1"><Icon name="x-circle" size={13} className="text-red-600" /><span className="text-[10px] text-red-700 uppercase font-semibold">Reason for Denial</span></div><p className="text-sm text-red-800">{selectedPermit.denial_reason}</p></div>}
              <div className="bg-sky-50 rounded-lg p-3 border border-sky-100 flex items-start gap-2"><Icon name="phone" size={14} className="text-sky-600 flex-shrink-0 mt-0.5" /><p className="text-xs text-sky-800">Questions? Call <a href="tel:4062853431" className="font-semibold underline">(406) 285-3431</a> or visit City Hall, 206 Main St, Mon-Fri 8am-5pm.</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-6 w-full">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { title: 'Apply for a Permit', desc: 'Submit a zoning, CUP, floodplain, or variance application online.', icon: 'file-plus', color: 'sky', action: () => openPermitForm(null), cta: 'Start Application' },
            { title: 'Check Application Status', desc: 'Look up the status of your permit, license, reservation, or request.', icon: 'search', color: 'emerald', action: () => setShowLookup(true), cta: 'Track Application' },
            { title: 'Report an Issue', desc: 'Report a code violation, pothole, water issue, or other concern.', icon: 'alert-triangle', color: 'orange', action: () => setShowRequestModal(true), cta: 'File Report' },
            { title: 'Reserve a Park', desc: 'Book a pavilion, field, or facility for your event or gathering.', icon: 'trees', color: 'violet', action: () => setShowParkModal(true), cta: 'Reserve Now' },
          ].map((card, i) => (
            <div key={i} onClick={card.action} className={`fade-up bg-white rounded-2xl border shadow-sm p-6 hover:shadow-lg hover:border-${card.color}-300 hover:-translate-y-0.5 transition-all cursor-pointer group`} style={{touchAction:'manipulation'}}>
              <div className={`bg-gradient-to-br from-${card.color}-100 to-${card.color}-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`} style={{width:'52px',height:'52px'}}>
                <Icon name={card.icon} size={26} className={`text-${card.color}-700`} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
              <div className={`mt-3 text-${card.color}-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all`}>{card.cta} <Icon name="arrow-right" size={14} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* How Permitting Works */}
      <div className="max-w-5xl mx-auto px-4 pb-6 w-full">
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl border border-sky-100 p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-1">How Permitting Works</h3>
          <p className="text-sm text-gray-500 mb-5">Three Forks follows a straightforward process for all development permits.</p>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Submit Application', desc: 'Fill out the form online or bring a paper copy to City Hall with your site plan.', color: 'sky' },
              { step: '2', title: 'Staff Review', desc: 'The Zoning Official reviews your application for compliance with Title 11.', color: 'blue' },
              { step: '3', title: 'Decision', desc: 'Most permits are decided within 30 days. CUPs require two public hearings.', color: 'emerald' },
              { step: '4', title: 'Build', desc: 'Once approved, begin work within 6 months. Call before pouring concrete.', color: 'amber' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-white">
                <div className={`w-8 h-8 rounded-lg bg-${s.color}-100 flex items-center justify-center mb-3`}><span className={`text-sm font-extrabold text-${s.color}-700`}>{s.step}</span></div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{s.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forms & Applications */}
      <div className="max-w-5xl mx-auto px-4 pb-6 w-full">
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2"><Icon name="folder-open" size={18} className="text-sky-600" /><h3 className="font-bold text-gray-900">Forms &amp; Applications</h3></div>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Apply online or download PDF</span>
          </div>
          <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0">
            {[
              { name: 'Zoning Permit Application', file: 'Zoning_Permit_2024.pdf', icon: 'file-text', typeCode: 'ZP-R', online: true },
              { name: 'Conditional Use Permit', file: 'Conditional_Use_Permit_2023.pdf', icon: 'file-text', typeCode: 'CUP', online: true },
              { name: 'Floodplain Permit', file: 'flood_permit_Three_Forks.pdf', icon: 'droplets', typeCode: 'FP', online: true },
              { name: 'Variance Application', file: 'Variance_Application_and_Criteria.pdf', icon: 'ruler', typeCode: 'VAR', online: true },
              { name: 'Water/Sewer Connection', file: 'New_Water_or_Sewer_Connection_Form_with_Contractor_info.pdf', icon: 'droplet', typeCode: 'WSC', online: true },
              { name: 'Fee Schedule', file: 'Fee_Schedule_Exhibit_for_Res.__465-2026_1.pdf', icon: 'dollar-sign', online: false },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-sky-50/50 transition group">
                <div className={`w-9 h-9 ${f.online ? 'bg-sky-50 group-hover:bg-sky-100' : 'bg-red-50 group-hover:bg-red-100'} rounded-lg flex items-center justify-center flex-shrink-0 transition`}><Icon name={f.icon} size={18} className={f.online ? 'text-sky-600' : 'text-red-500'} /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>{f.online ? <p className="text-xs text-sky-600">Fill out online</p> : <p className="text-xs text-gray-400">PDF download</p>}</div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {f.online && <button onClick={() => openPermitForm(f.typeCode)} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-700 transition" style={{touchAction:'manipulation'}}><Icon name="pen-line" size={13} /> Apply Online</button>}
                  <a href={`/forms/${f.file}`} target="_blank" rel="noopener" className="flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:text-gray-600 text-xs rounded-lg hover:bg-gray-100 transition" title="Download PDF"><Icon name="download" size={14} /> PDF</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Permit Activity */}
      <div className="max-w-5xl mx-auto px-4 pb-8 w-full">
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2"><Icon name="activity" size={18} className="text-sky-600" /><h3 className="font-bold text-gray-900">Recent Permit Activity</h3></div>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{permits.length} permits</span>
          </div>
          <div className="divide-y">
            {permits.slice(0, 8).map(permit => (
              <div key={permit.id} onClick={() => { setSelectedPermit(permit); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="px-4 py-3.5 hover:bg-sky-50/50 cursor-pointer transition flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (STATUS_CONFIG[permit.status] || STATUS_CONFIG.pending).color + '18' }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: (STATUS_CONFIG[permit.status] || STATUS_CONFIG.pending).color }} />
                  </div>
                  <div><div className="flex items-center gap-2"><span className="font-semibold text-sm text-gray-900">{permit.id}</span><StatusBadge status={permit.status} /></div><div className="text-xs text-gray-500 mt-0.5">{permit.address} &bull; {permit.type}</div></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block"><div className="text-xs font-medium text-gray-600">{permit.applicant}</div><div className="text-[11px] text-gray-400">{permit.submitted}</div></div>
                  <Icon name="chevron-right" size={16} className="text-gray-300 group-hover:text-sky-500 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-sky-950 text-sky-300 mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg hero-gradient flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg></div>
                <div><p className="text-white font-bold leading-tight">Town of Three Forks</p><p className="text-[11px] text-sky-500 leading-tight">Est. 1908</p></div>
              </div>
              <p className="text-sm text-sky-400 mt-2">Headwaters of the Missouri</p>
              <p className="text-xs text-sky-500 mt-0.5">Gallatin County, Montana 59752</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Contact</p>
              <div className="space-y-2 text-sm"><p>206 Main Street</p><p>Three Forks, MT 59752</p><p className="text-sky-200">(406) 285-3431</p></div>
            </div>
            <div>
              <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Permitting Staff</p>
              <div className="space-y-2 text-sm"><div><p className="text-sky-200">Kelly Smith</p><p className="text-xs text-sky-500">Zoning Official</p></div><div><p className="text-sky-200">Crystal Turner</p><p className="text-xs text-sky-500">City Clerk</p></div></div>
            </div>
            <div>
              <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Office Hours</p>
              <div className="space-y-1.5 text-sm"><p>Monday &ndash; Friday</p><p className="text-sky-200 font-medium">8:00 AM &ndash; 5:00 PM</p><p className="text-xs text-sky-500 mt-2">Closed weekends &amp; holidays</p></div>
              <a href="https://threeforksmap.itogeospatial.com" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 mt-4 text-xs text-sky-400 hover:text-sky-200 transition"><Icon name="globe" size={12} /> Three Forks City Map</a>
            </div>
          </div>
        </div>
        <div className="border-t border-sky-900">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <p className="text-xs text-sky-600">Powered by <a href="https://itogeospatial.com" className="text-sky-400 hover:text-sky-300 font-medium transition">Ito Geospatial</a></p>
            <p className="text-xs text-sky-700">&copy; {new Date().getFullYear()} Town of Three Forks</p>
          </div>
        </div>
      </footer>

      {showNewPermit && <NewPermitModal permitTypes={permitTypes} demoMode={demoMode} initialType={newPermitType} onClose={() => { setShowNewPermit(false); setNewPermitType(null); }} onCreated={onRefresh} />}
      {showRequestModal && <CitizenRequestModal onClose={() => setShowRequestModal(false)} onCreated={onRefresh} />}
      {showParkModal && <ParkReservationModal onClose={() => setShowParkModal(false)} onCreated={onRefresh} />}
      {showLookup && <ApplicationLookupModal onClose={() => setShowLookup(false)} />}
    </div>
  );
};

// ---------- Application Status Lookup Modal ----------
const ApplicationLookupModal = ({ onClose }) => {
  const [trackingNum, setTrackingNum] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleLookup = async (e) => {
    e.preventDefault(); setError(''); setResult(null); setLoading(true);
    try {
      const data = await api.lookupApplication(trackingNum, email);
      setResult(data);
    } catch (err) { setError(err.message || 'Application not found'); }
    setLoading(false);
  };

  const typeLabels = { permit: 'Permit', license: 'Business License', reservation: 'Park Reservation', request: 'Citizen Request' };
  const typeIcons = { permit: 'file-text', license: 'badge', reservation: 'trees', request: 'message-circle' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center"><Icon name="search" size={22} className="text-emerald-700" /></div>
            <div><h2 className="text-lg font-bold text-gray-900">Check Application Status</h2><p className="text-sm text-gray-500">Enter your tracking number</p></div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400"><Icon name="x" size={20} /></button>
        </div>

        {!result ? (
          <form onSubmit={handleLookup} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number *</label>
              <input type="text" value={trackingNum} onChange={e => setTrackingNum(e.target.value.toUpperCase())} placeholder="e.g. ZP-R-2026-001, BL-2026-001, PR-2026-001" className="w-full border rounded-lg px-3 py-3 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-lg tracking-wide" style={{fontSize:'16px'}} required />
              <p className="text-xs text-gray-400 mt-1.5">This was provided when you submitted your application</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional verification)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email used on your application" className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" style={{fontSize:'16px'}} />
              <p className="text-xs text-gray-400 mt-1">Providing your email confirms you are the applicant</p>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2"><Icon name="alert-circle" size={16} className="text-red-500 flex-shrink-0" /><p className="text-sm text-red-700">{error}</p></div>}
            <button type="submit" disabled={loading || !trackingNum.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2">
              {loading ? <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Looking up...</> : <><Icon name="search" size={16} /> Look Up Status</>}
            </button>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 font-medium mb-1.5">Tracking Number Prefixes:</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
                <span>ZP / FP / CUP / VAR — Permits</span>
                <span>BL — Business Licenses</span>
                <span>PR — Park Reservations</span>
                <span>CR — Citizen Requests</span>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            {/* Result header */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center"><Icon name={typeIcons[result.type] || 'file'} size={24} className="text-sky-600" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><span className="font-bold text-gray-900 font-mono">{result.permit_number || result.license_number || result.reservation_number || result.request_number}</span><StatusBadge status={result.status} /></div>
                <p className="text-sm text-gray-500">{typeLabels[result.type] || result.type}{result.type_name ? ` — ${result.type_name}` : ''}{result.category_name ? ` — ${result.category_name}` : ''}</p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {result.address && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Address</div><div className="text-sm font-medium">{result.address}</div></div>}
              {result.applicant_name && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Applicant</div><div className="text-sm font-medium">{result.applicant_name}</div></div>}
              {result.business_name && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Business</div><div className="text-sm font-medium">{result.business_name}</div></div>}
              {result.owner_name && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Owner</div><div className="text-sm font-medium">{result.owner_name}</div></div>}
              {result.facility_name && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Facility</div><div className="text-sm font-medium">{result.facility_name}{result.park_name ? ` — ${result.park_name}` : ''}</div></div>}
              {result.event_name && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Event</div><div className="text-sm font-medium">{result.event_name}</div></div>}
              {result.event_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Event Date</div><div className="text-sm font-medium">{result.event_date}{result.start_time ? ` at ${result.start_time}` : ''}</div></div>}
              {result.contact_name && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Contact</div><div className="text-sm font-medium">{result.contact_name}</div></div>}
              {result.reporter_name && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Reported By</div><div className="text-sm font-medium">{result.reporter_name}</div></div>}
              {(result.submitted_at || result.created_at) && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Submitted</div><div className="text-sm font-medium">{(result.submitted_at || result.created_at).split('T')[0]}</div></div>}
              {result.decision_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Decision Date</div><div className="text-sm font-medium">{result.decision_date}</div></div>}
              {result.issued_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Issued</div><div className="text-sm font-medium">{result.issued_date}</div></div>}
              {result.expiration_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Expires</div><div className="text-sm font-medium">{result.expiration_date}</div></div>}
              {result.resolved_at && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Resolved</div><div className="text-sm font-medium">{result.resolved_at.split('T')[0]}</div></div>}
              {(result.fees_calculated || result.annual_fee || result.total_fee) != null && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Fees</div><div className="text-sm font-medium">${(result.fees_calculated || result.annual_fee || result.total_fee || 0).toLocaleString()} {result.fees_paid > 0 ? `($${result.fees_paid} paid)` : ''}</div></div>}
            </div>

            {/* Conditions / Resolution */}
            {result.conditions && <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200"><div className="flex items-center gap-1.5 mb-1"><Icon name="check-circle" size={13} className="text-emerald-600" /><span className="text-[10px] text-emerald-700 uppercase font-semibold">Conditions of Approval</span></div><p className="text-sm text-emerald-800">{result.conditions}</p></div>}
            {result.denial_reason && <div className="bg-red-50 rounded-lg p-3 border border-red-200"><div className="flex items-center gap-1.5 mb-1"><Icon name="x-circle" size={13} className="text-red-600" /><span className="text-[10px] text-red-700 uppercase font-semibold">Reason for Denial</span></div><p className="text-sm text-red-800">{result.denial_reason}</p></div>}
            {result.resolution && <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200"><div className="flex items-center gap-1.5 mb-1"><Icon name="check-circle" size={13} className="text-emerald-600" /><span className="text-[10px] text-emerald-700 uppercase font-semibold">Resolution</span></div><p className="text-sm text-emerald-800">{result.resolution}</p></div>}
            {result.description && result.type === 'request' && <div className="bg-gray-50 rounded-lg p-3"><div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Description</div><p className="text-sm text-gray-700">{result.description}</p></div>}

            {/* Activity timeline */}
            {result.timeline?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Icon name="clock" size={14} /> Activity Timeline</h4>
                <div className="space-y-0 relative pl-4 border-l-2 border-gray-200">
                  {result.timeline.map((t, i) => (
                    <div key={i} className="pb-3 relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-white border-2 border-sky-400" />
                      <p className="text-sm font-medium text-gray-800">{t.action}</p>
                      <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact info + search again */}
            <div className="bg-sky-50 rounded-lg p-3 border border-sky-100 flex items-start gap-2"><Icon name="phone" size={14} className="text-sky-600 flex-shrink-0 mt-0.5" /><p className="text-xs text-sky-800">Questions? Call <a href="tel:4062853431" className="font-semibold underline">(406) 285-3431</a> or visit City Hall, 206 Main St, Mon-Fri 8am-5pm.</p></div>
            <button onClick={() => { setResult(null); setError(''); setTrackingNum(''); setEmail(''); }} className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"><Icon name="arrow-left" size={14} /> Look Up Another Application</button>
          </div>
        )}
      </div>
    </div>
  );
};
