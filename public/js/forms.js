// ==========================================================================
// FORMS & APPLICATIONS — all Three Forks municipal forms catalog + renderer
// ==========================================================================
const TF_URL = 'https://threeforksmontana.us/documents/650';
const FORM_CATALOG = [
  { category: 'Zoning', icon: 'landmark', forms: [
    { code: 'ZP-R', name: 'Zoning Permit — Residential', fee: 200, permit: true },
    { code: 'ZP-C', name: 'Zoning Permit — Commercial', fee: 200, permit: true },
    { code: 'ZP-A', name: 'Zoning Permit — Accessory', fee: 250, permit: true },
    { code: 'CUP', name: 'Conditional Use Permit', fee: 500, permit: true },
    { code: 'VAR', name: 'Variance Application', fee: 500, permit: true },
    { code: 'ZCA', name: 'Zone Change / Amend Zoning Code', fee: 350, permit: true, pdf: `${TF_URL}/Zone_Change_Amendment_Application.pdf` },
  ]},
  { category: 'Floodplain', icon: 'waves', forms: [
    { code: 'FP', name: 'Flood Permit', fee: 500, permit: true, pdf: `${TF_URL}/flood_permit_Three_Forks.pdf` },
    { code: 'FPV', name: 'Floodplain Variance Application', fee: 350, permit: true, pdf: `${TF_URL}/Floodplain_Variance_Application.pdf` },
  ]},
  { category: 'Water & Sewer', icon: 'droplet', forms: [
    { code: 'WSC', name: 'New Water/Sewer Connection', fee: 250, permit: true },
    { code: 'WSS', name: 'New Water/Sewer Signup', fee: 0, online: true, pdf: `${TF_URL}/Sign_Up___Sewer_Determination.pdf`,
      fields: [['Account Holder Name *','name'],['Service Address *','service_address'],['Mailing Address','mailing_address'],['Phone *','phone','tel'],['Email','email','email'],['Move-In Date','move_in_date','date'],['Previous Tenant Name','prev_tenant'],['Sewer Determination','sewer_determination','select',['','Septic','City Sewer']]] },
    { code: 'UTL', name: 'Owner/Designee Utility Agreement', fee: 0, online: true, pdf: `${TF_URL}/Owner-Designee_Agreement_vs_2.pdf`,
      fields: [['Property Owner Name *','owner_name'],['Owner Phone *','owner_phone','tel'],['Owner Address *','owner_address'],['Designee Name *','designee_name'],['Designee Phone *','designee_phone','tel'],['Designee Address *','designee_address'],['Designee Email','designee_email','email'],['Account Number','account_number'],['Service Address *','service_address'],['Effective Date','effective_date','date']] },
    { code: 'ACH', name: 'ACH Sign Up / Email Billing', fee: 0, online: true, pdf: `${TF_URL}/ACH_or_Email.pdf`,
      fields: [['Account Holder Name *','name'],['Service Address *','service_address'],['Account Number *','account_number'],['Bank Name','bank_name'],['Routing Number','routing_number'],['Account Number (Bank)','bank_account'],['Account Type','account_type','select',['','Checking','Savings']],['Email for E-Billing','email','email'],['Phone *','phone','tel']] },
    { code: 'SNO', name: 'Snowbird Service Request', fee: 0, online: true, pdf: `${TF_URL}/Request_for_Snowbird_Service.pdf`,
      fields: [['Account Holder Name *','name'],['Service Address *','service_address'],['Account Number','account_number'],['Phone *','phone','tel'],['Email','email','email'],['Departure Date *','departure_date','date'],['Expected Return Date *','return_date','date'],['Forwarding Address','forwarding_address'],['Emergency Contact Name','emergency_name'],['Emergency Contact Phone','emergency_phone','tel']] },
    { code: 'CRB', name: 'Request to Turn Off Water @ Curbstop', fee: 0, online: true, pdf: `${TF_URL}/Request_for_Water_Turnoff.pdf`,
      fields: [['Property Owner Name *','owner_name'],['Service Address *','service_address'],['Phone *','phone','tel'],['Email','email','email'],['Reason for Turnoff *','reason','textarea'],['Requested Date *','requested_date','date'],['Expected Turn-On Date','turnon_date','date']] },
  ]},
  { category: 'General', icon: 'file-text', forms: [
    { code: 'DOG', name: 'Additional Dog Permit', fee: 0, online: true, pdf: `${TF_URL}/Additional_Dog_Permit_Application.pdf`,
      fields: [['Owner Name *','owner_name'],['Address *','address'],['Phone *','phone','tel'],['Email','email','email'],['Dog Name *','dog_name'],['Breed *','breed'],['Color/Markings','color'],['Sex','sex','select',['','Male','Female','Neutered Male','Spayed Female']],['Age','age'],['Weight (lbs)','weight'],['Rabies Tag #','rabies_tag'],['Vaccination Date','vaccination_date','date'],['Veterinarian Name','vet_name'],['Veterinarian Phone','vet_phone','tel']] },
    { code: 'CHK', name: 'Chicken Permit Application', fee: 0, online: true, pdf: `${TF_URL}/Chicken_Permit_Application_1.pdf`,
      fields: [['Applicant Name *','applicant_name'],['Address *','address'],['Phone *','phone','tel'],['Email','email','email'],['Number of Chickens Requested *','num_chickens','number'],['Coop Location Description *','coop_location','textarea'],['Coop Dimensions','coop_dimensions'],['Run/Enclosure Dimensions','run_dimensions'],['Distance from Property Lines','distance_property_line'],['Distance from Nearest Dwelling','distance_dwelling'],['Neighbor Notification','neighbor_notification','select',['','Yes - All Notified','In Progress']]] },
    { code: 'BRD', name: 'Board / Committee Application', fee: 0, online: true, pdf: `${TF_URL}/Board_application.pdf`,
      fields: [['Full Name *','name'],['Address *','address'],['Phone *','phone','tel'],['Email *','email','email'],['Occupation','occupation'],['Board/Committee Interested In *','board_name','select',['','City Council','Planning Board','Board of Adjustment','Zoning Commission','Park Board','Library Board','Other']],['If Other, Specify','board_other'],['Qualifications & Experience *','qualifications','textarea'],['Why Are You Interested? *','interest_reason','textarea'],['Are You a City Resident? *','is_resident','select',['','Yes','No']]] },
    { code: 'TRF', name: 'Traffic / Sign Request', fee: 0, online: true, pdf: `${TF_URL}/Traffic_Sign_Requests.pdf`,
      fields: [['Requestor Name *','name'],['Address *','address'],['Phone *','phone','tel'],['Email','email','email'],['Location of Request *','location'],['Type of Request *','request_type','select',['','New Sign','Sign Removal','Sign Relocation','Speed Limit Change','Crosswalk','Stop Sign','Other']],['If Other, Specify','type_other'],['Description / Reason *','description','textarea'],['Urgency','urgency','select',['','Routine','Safety Concern','Emergency']]] },
    { code: 'SEC', name: 'Security Check Request', fee: 0, online: true, pdf: `${TF_URL}/Security_Check_Request.pdf`,
      fields: [['Homeowner Name *','owner_name'],['Address to Check *','address'],['Phone *','phone','tel'],['Email','email','email'],['Departure Date *','departure_date','date'],['Return Date *','return_date','date'],['Emergency Contact Name *','emergency_name'],['Emergency Contact Phone *','emergency_phone','tel'],['Vehicle(s) Left at Home','vehicles'],['Lights on Timers?','lights_timers','select',['','Yes','No']],['Newspapers/Mail Stopped?','mail_stopped','select',['','Yes','No']],['Pets on Property?','pets'],['Alarm System?','alarm','select',['','Yes','No']],['Special Instructions','instructions','textarea']] },
    { code: 'PRR', name: 'Public Records Request', fee: 0, online: true, pdf: `${TF_URL}/Request_for_Public_Records_Policy_V3.pdf`,
      fields: [['Applicant Name *','name'],['Mailing Address','address'],['Phone','phone','tel'],['Email','email','email'],['Cell Phone','cell'],['Description of Records Requested *','description','textarea'],['Preferred Delivery Method','delivery','select',['','Inspect in Person','Paper Copies','Electronic/Email']]] },
    { code: 'EMP', name: 'Employment Application', fee: 0, online: true, pdf: `${TF_URL}/Employment_Application.pdf`,
      fields: [['Full Name (Last, First, M.I.) *','name'],['Date Available','date_available','date'],['Physical Address *','address'],['Apartment/Unit #','apt'],['Mailing Address (if different)','mailing_address'],['City *','city'],['State *','state'],['ZIP Code *','zip'],['Phone *','phone','tel'],['Email *','email','email'],['Position Applying For *','position'],['Authorized to Work in US? *','work_auth','select',['','Yes','No']],['Previously Worked for City?','prev_city_employee','select',['','Yes','No']],['If Yes, When?','prev_city_when'],
        ['High School Name','hs_name'],['High School Address','hs_address'],['HS Graduate?','hs_grad','select',['','Yes','No']],['HS Diploma/Degree','hs_degree'],
        ['College Name','college_name'],['College Address','college_address'],['College Graduate?','college_grad','select',['','Yes','No']],['College Degree','college_degree'],
        ['Reference 1 — Name','ref1_name'],['Reference 1 — Relationship','ref1_relation'],['Reference 1 — Phone','ref1_phone','tel'],
        ['Reference 2 — Name','ref2_name'],['Reference 2 — Relationship','ref2_relation'],['Reference 2 — Phone','ref2_phone','tel'],
        ['Reference 3 — Name','ref3_name'],['Reference 3 — Relationship','ref3_relation'],['Reference 3 — Phone','ref3_phone','tel'],
        ['Previous Employer 1 — Company','emp1_company'],['Employer 1 — Job Title','emp1_title'],['Employer 1 — Phone','emp1_phone','tel'],['Employer 1 — Dates','emp1_dates'],['Employer 1 — Reason for Leaving','emp1_reason'],
        ['Previous Employer 2 — Company','emp2_company'],['Employer 2 — Job Title','emp2_title'],['Employer 2 — Phone','emp2_phone','tel'],['Employer 2 — Dates','emp2_dates'],['Employer 2 — Reason for Leaving','emp2_reason'],
        ['Ever Terminated or Suspended? Describe','termination_history','textarea']] },
  ]},
  { category: 'Subdivision', icon: 'grid-3x3', forms: [
    { code: 'PPL', name: 'Preliminary Plat Application', fee: 500, permit: true, pdf: `${TF_URL}/Preliminary_Plat_Application.pdf` },
    { code: 'FPL', name: 'Final Plat Application', fee: 300, permit: true, pdf: `${TF_URL}/Final_Plat_Application.pdf` },
    { code: 'SUB', name: 'Exemption from Subdivision Review', fee: 500, permit: true, pdf: `${TF_URL}/Exemption_from_Subdivision_Review_Application.pdf` },
    { code: 'SIA', name: 'Subdivision Improvements Agreement', fee: 0, pdfOnly: true, pdf: `${TF_URL}/Subdivision_Improvements_Agreement_or_Guaranty.pdf` },
  ]},
  { category: 'Annexation & Vacation', icon: 'map', forms: [
    { code: 'ANX', name: 'Annexation Application', fee: 500, permit: true, pdf: `${TF_URL}/Annexation_Application.pdf` },
    { code: 'VAC', name: 'Petition to Vacate / Abandon', fee: 250, permit: true, pdf: `${TF_URL}/Petition_to_Abandon_form_v1.pdf` },
  ]},
  { category: 'Reference Documents', icon: 'book-open', forms: [
    { code: 'FEE', name: 'Fee Schedule', pdfOnly: true, pdf: `${TF_URL}/Fee_Schedule_Exhibit_for_Res.__465-2026_1.pdf` },
    { code: 'ICE', name: 'Ice Rink Use Policy', pdfOnly: true, pdf: `${TF_URL}/Ice_Rink_Use_Policy_FINAL.pdf` },
    { code: 'SDS', name: 'Standards for Design & Construction', pdfOnly: true, pdf: `${TF_URL}/ThreeForksDsnStds_20230411__version_2___1_.pdf` },
    { code: 'SRG', name: 'Subdivision Regulations', pdfOnly: true, pdf: `${TF_URL}/City_of_Three_Forks_Subdivision_Regs_OCR.pdf` },
    { code: 'FFC', name: 'FEMA Floodproofing Certificate', pdfOnly: true, pdf: `${TF_URL}/FEMA_Form_FF-206-FY-22-153_floodproofing_nonresidential.pdf` },
    { code: 'GRP', name: 'Growth Policy (Envision Three Forks)', pdfOnly: true, pdf: `${TF_URL}/FINAL_ADOPTED_220913_EnvisionThreeForks_AdoptedDocument_LowRes__1_.pdf` },
  ]},
];

// Flatten for lookup
const ALL_FORMS = FORM_CATALOG.flatMap(c => c.forms.map(f => ({ ...f, category: c.category, categoryIcon: c.icon })));
const findForm = (code) => ALL_FORMS.find(f => f.code === code);

// ---------- Generic Form Modal (for non-permit online forms) ----------
const GenericFormModal = ({ formDef, onClose }) => {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const initVals = {};
  (formDef.fields || []).forEach(f => { initVals[f[1]] = ''; });
  const [form, setForm] = useState(initVals);
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inp = "w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none";

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.submitForm({ form_type: formDef.code, form_name: formDef.name, data: form });
      setSubmitted(true);
    } catch (err) { toast(err.message || 'Submission failed', 'error'); }
    setSubmitting(false);
  };

  if (submitted) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Icon name="check-circle" size={32} className="text-emerald-600" /></div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Submitted Successfully!</h3>
        <p className="text-gray-500 text-sm mb-1">Your {formDef.name} has been received.</p>
        <p className="text-gray-400 text-xs mb-6">City staff will review and follow up if needed.</p>
        <button onClick={onClose} className="px-6 py-2.5 bg-sky-700 text-white rounded-lg hover:bg-sky-800 text-sm font-semibold">Close</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="p-5 border-b hero-gradient rounded-t-xl text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center"><Icon name={formDef.categoryIcon || 'file-text'} size={20} className="text-white" /></div>
            <div><h3 className="font-bold text-lg">{formDef.name}</h3><p className="text-sky-300 text-xs">Town of Three Forks, MT</p></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><Icon name="x" size={18} className="text-white" /></button>
        </div>
        {formDef.pdf && <div className="px-5 py-2 bg-sky-50 border-b flex items-center gap-2 text-xs">
          <Icon name="download" size={12} className="text-sky-600" />
          <span className="text-sky-700">Need the paper form?</span>
          <a href={formDef.pdf} target="_blank" rel="noopener noreferrer" className="text-sky-600 underline font-medium">Download PDF</a>
        </div>}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-3">
          {(formDef.fields || []).map(([label, key, type, opts]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              {type === 'select' ? (
                <select value={form[key]} onChange={e => u(key, e.target.value)} className={inp} style={{fontSize:'16px'}}>
                  {(opts || []).map(o => <option key={o} value={o}>{o || 'Select...'}</option>)}
                </select>
              ) : type === 'textarea' ? (
                <textarea value={form[key]} onChange={e => u(key, e.target.value)} rows={3} className={inp} style={{fontSize:'16px'}} />
              ) : (
                <input type={type || 'text'} value={form[key]} onChange={e => u(key, e.target.value)} className={inp} style={{fontSize:'16px'}} />
              )}
            </div>
          ))}
        </form>
        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 disabled:opacity-40 text-sm font-semibold flex items-center gap-2" style={{touchAction:'manipulation'}}>
            {submitting ? 'Submitting...' : 'Submit'} <Icon name="send" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Permit-type form fields for Subdivision, Annexation, Zone Change ----------
const EXTRA_PERMIT_FIELDS = {
  ZCA: (F, form) => (<>
    <div className="space-y-3">
      {F('Applicant Name *','applicant_name',{big:1})}
      <div className="grid grid-cols-2 gap-3">{F('Phone *','applicant_phone',{t:'tel',big:1})}{F('Email','applicant_email',{t:'email',big:1})}</div>
      {F('Applicant Mailing Address','applicant_address')}
      {F('Legal Description of Property *','description',{type:'textarea',rows:3,ph:'Section, Township, Range, Lot/Block/Subdivision'})}
      <div className="grid grid-cols-2 gap-3">{F('Current Zoning','zoning_district')}{F('Proposed Zoning *','proposed_zoning')}</div>
      {F('Reason for Zone Change *','zone_change_reason',{type:'textarea',rows:4,ph:'Explain why the zone change is requested and how it serves the public interest...'})}
      {F('Proposed Use of Property *','proposed_use',{type:'textarea',ph:'Describe the proposed use after rezoning...'})}
    </div>
  </>),
  FPV: (F, form) => (<>
    <div className="space-y-3">
      {F('Applicant Name *','applicant_name',{big:1})}
      <div className="grid grid-cols-2 gap-3">{F('Phone *','applicant_phone',{t:'tel',big:1})}{F('Email','applicant_email',{t:'email',big:1})}</div>
      {F('Property Address *','address',{big:1})}
      {F('Legal Description','description',{type:'textarea',rows:2})}
      <div className="grid grid-cols-2 gap-3">{F('FEMA Flood Zone','flood_zone',{type:'select',opts:<><option value="">Select...</option><option value="AE">AE</option><option value="A">A</option><option value="X">X</option></>})}{F('Base Flood Elevation','base_flood_elevation')}</div>
      {F('Description of Proposed Development *','proposed_development',{type:'textarea',rows:4,ph:'Describe proposed development in the floodplain...'})}
      {F('Why Is a Variance Necessary? *','variance_reason',{type:'textarea',rows:4,ph:'Describe the hardship or exceptional conditions...'})}
      {F('Elevation Certificate Attached?','elevation_cert')}
    </div>
  </>),
  PPL: (F, form) => (<>
    <div className="space-y-3">
      {F('Name of Proposed Subdivision *','project_name',{big:1})}
      {F('Location (City/County) *','address',{big:1})}
      {F('Legal Description *','description',{type:'textarea',rows:2,ph:'1/4 of Section __, Township __, Range __'})}
      {F('Applicant/Subdivider Name *','applicant_name',{big:1})}
      <div className="grid grid-cols-2 gap-3">{F('Phone *','applicant_phone',{t:'tel'})}{F('Email','applicant_email',{t:'email'})}</div>
      {F('Applicant Address','applicant_address')}
      <p className="text-xs font-semibold text-gray-600 mt-2">Property Owner (if different)</p>
      <div className="grid grid-cols-2 gap-3">{F('Owner Name','owner_name')}{F('Owner Phone','owner_phone',{t:'tel'})}</div>
      <p className="text-xs font-semibold text-gray-600 mt-2">Subdivision Details</p>
      <div className="grid grid-cols-3 gap-3">{F('Number of Lots','num_lots',{t:'number'})}{F('Total Acreage','land_area')}{F('Min Lot Size','min_lot_size')}</div>
      <div className="grid grid-cols-2 gap-3">
        {F('Water Supply Type','water_supply_type',{type:'select',opts:<><option value="">Select...</option><option value="public">Public System</option><option value="well">Individual Well</option><option value="spring">Surface Water/Spring</option><option value="extension">Extension of Public Main</option></>})}
        {F('Wastewater Type','wastewater_type',{type:'select',opts:<><option value="">Select...</option><option value="public">Public Sewer</option><option value="septic">Individual Septic</option><option value="extension">Extension of Public Main</option></>})}
      </div>
      {F('Proposed Uses','proposed_use',{type:'textarea',ph:'Residential single-family, multi-family, commercial, etc.'})}
      {F('Current Land Use','current_land_use')}
      <div className="grid grid-cols-2 gap-3">{F('Depth to Groundwater','groundwater_depth')}{F('Depth to Bedrock','bedrock_depth')}</div>
    </div>
  </>),
  FPL: (F, form) => (<>
    <div className="space-y-3">
      {F('Name of Subdivision *','project_name',{big:1})}
      {F('Location / Legal Description *','description',{type:'textarea',rows:2,ph:'1/4 Section __, Township __, Range __'})}
      {F('Subdivider Name *','applicant_name',{big:1})}
      <div className="grid grid-cols-2 gap-3">{F('Phone *','applicant_phone',{t:'tel'})}{F('Address','applicant_address')}</div>
      <div className="grid grid-cols-3 gap-3">{F('Gross Area (acres)','land_area')}{F('Number of Lots','num_lots',{t:'number'})}{F('Existing Zoning','zoning_district')}</div>
      {F('Date Preliminary Plat Approved','preliminary_plat_date',{t:'date'})}
      {F('All Improvements Installed?','improvements_installed',{type:'select',opts:<><option value="">Select...</option><option value="Yes">Yes</option><option value="No">No - Agreement Attached</option></>})}
      {F('Materials Submitted','materials_submitted',{type:'textarea',ph:'List all materials submitted with this application...'})}
    </div>
  </>),
  SUB: (F, form) => (<>
    <div className="space-y-3">
      {F('Applicant Name *','applicant_name',{big:1})}
      <div className="grid grid-cols-2 gap-3">{F('Phone *','applicant_phone',{t:'tel'})}{F('Email *','applicant_email',{t:'email'})}</div>
      {F('Mailing Address','applicant_address')}
      {F('Occupation','occupation')}
      <p className="text-xs font-semibold text-gray-600 mt-2">Subject Property</p>
      {F('Legal Description *','description',{type:'textarea',rows:2,ph:'Lot(s) __, Block __, Subdivision __'})}
      {F('Physical Address *','address',{big:1})}
      {F('Zoning Designation','zoning_district')}
      {F('How/When Was Parcel Created?','parcel_history',{type:'textarea'})}
      {F('Type of Exemption *','exemption_type',{type:'select',opts:<><option value="">Select...</option><option value="family">Gift/Sale to Immediate Family</option><option value="boundary">Relocation of Common Boundary</option><option value="aggregation">Lot Aggregation</option><option value="agricultural">Agricultural Exemption</option><option value="mortgage">Security for Construction (Mortgage Survey)</option><option value="other">Other</option></>})}
      {F('Reason/Justification *','exemption_reason',{type:'textarea',rows:4})}
      {F('Intentions for Use of Each Parcel','intended_use',{type:'textarea'})}
    </div>
  </>),
  ANX: (F, form) => (<>
    <div className="space-y-3">
      {F('Property Owner Name *','applicant_name',{big:1})}
      <div className="grid grid-cols-2 gap-3">{F('Phone *','applicant_phone',{t:'tel'})}{F('Email','applicant_email',{t:'email'})}</div>
      {F('Mailing Address','applicant_address')}
      <p className="text-xs font-semibold text-gray-600 mt-2">Property to be Annexed</p>
      {F('Legal Description *','description',{type:'textarea',rows:3,ph:'Lot(s), Block, Subdivision, or Certificate of Survey'})}
      {F('Property Address','address',{big:1})}
      <div className="grid grid-cols-2 gap-3">{F('Current Zoning','zoning_district')}{F('Intended Zoning *','proposed_zoning')}</div>
      {F('Intended Use of Property *','proposed_use',{type:'textarea'})}
      {F('Is Property Contiguous to City Limits? *','contiguous',{type:'select',opts:<><option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option></>})}
      {F('Will Annexation Include Road ROWs?','include_rows',{type:'select',opts:<><option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option></>})}
      {F('Existing Structures on Property?','existing_structures',{type:'select',opts:<><option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option></>})}
    </div>
  </>),
  VAC: (F, form) => (<>
    <div className="space-y-3">
      {F('Petitioner Name *','applicant_name',{big:1})}
      <div className="grid grid-cols-2 gap-3">{F('Phone *','applicant_phone',{t:'tel'})}{F('Address *','applicant_address')}</div>
      {F('Street/Alley to be Abandoned *','description',{type:'textarea',rows:3,ph:'Describe the street, alley, or portion thereof to be abandoned...'})}
      {F('General Route Description','address',{type:'textarea',rows:2})}
      {F('Abutting Property Owners *','abutting_owners',{type:'textarea',rows:3,ph:'Names and addresses of all abutting property owners'})}
      {F('Do All Abutting Owners Consent?','all_consent',{type:'select',opts:<><option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option></>})}
      {F('Necessity & Advantage of Abandonment *','abandonment_reason',{type:'textarea',rows:4})}
      {F('Does Street/Alley Provide Access to Public Lands/Waters?','public_access',{type:'select',opts:<><option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option></>})}
      {F('Utilities in Street/Alley?','utilities_present',{type:'textarea',ph:'List any utilities present'})}
    </div>
  </>),
};

// ---------- Forms Directory Page ----------
const FormsDirectory = ({ config, onBack, onOpenForm, onOpenPermit }) => {
  const [search, setSearch] = useState('');
  const [expandedCat, setExpandedCat] = useState(null);
  const q = search.toLowerCase();
  const filtered = q ? FORM_CATALOG.map(c => ({ ...c, forms: c.forms.filter(f => f.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)) })).filter(c => c.forms.length > 0) : FORM_CATALOG;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sky-700 hover:text-sky-800 text-sm font-medium"><Icon name="arrow-left" size={16} /> Back</button>
            <div className="h-5 w-px bg-gray-200" />
            <h1 className="text-lg font-bold text-gray-900">Forms & Applications</h1>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="relative"><Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search forms..." className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none" style={{fontSize:'16px'}} />
          </div>
        </div>
        <div className="space-y-4">
          {filtered.map(cat => (
            <div key={cat.category} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <button onClick={() => setExpandedCat(expandedCat === cat.category ? null : cat.category)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-sky-100 rounded-lg flex items-center justify-center"><Icon name={cat.icon} size={18} className="text-sky-700" /></div>
                  <div><div className="font-semibold text-gray-900">{cat.category}</div><div className="text-xs text-gray-500">{cat.forms.length} form{cat.forms.length !== 1 ? 's' : ''}</div></div>
                </div>
                <Icon name={expandedCat === cat.category ? 'chevron-up' : 'chevron-down'} size={18} className="text-gray-400" />
              </button>
              {(expandedCat === cat.category || q) && (
                <div className="border-t divide-y">
                  {cat.forms.map(f => (
                    <div key={f.code} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">{f.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          {f.fee > 0 && <span className="text-sky-700 font-medium">${f.fee} fee</span>}
                          {f.online && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-semibold">Online</span>}
                          {f.permit && <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded text-[10px] font-semibold">Permit</span>}
                          {f.pdfOnly && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold">PDF Only</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {f.pdf && <a href={f.pdf} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 border rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-1" onClick={e => e.stopPropagation()}><Icon name="download" size={12} /> PDF</a>}
                        {f.online && !f.permit && <button onClick={() => onOpenForm(f)} className="px-3 py-1.5 bg-sky-700 text-white rounded-lg text-xs font-medium hover:bg-sky-800 flex items-center gap-1"><Icon name="edit" size={12} /> Fill Online</button>}
                        {f.permit && <button onClick={() => onOpenPermit(f.code)} className="px-3 py-1.5 bg-sky-700 text-white rounded-lg text-xs font-medium hover:bg-sky-800 flex items-center gap-1"><Icon name="file-plus" size={12} /> Apply</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Questions? Contact City Hall at (406) 285-3431</p>
          <p className="mt-1">115 Main Street, Three Forks, MT 59752</p>
        </div>
      </div>
    </div>
  );
};
