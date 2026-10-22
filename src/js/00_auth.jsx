/* ============================= AUTH: login + registration for every portal ============================= */
const AUTH_ROLES = {
  farmer:    { title:'Farmer',           sub:'Sell your harvest, check crop health, get live prices', icon:'sprout' },
  buyer:     { title:'Bulk buyer',       sub:'Hotels, retailers and institutions: order direct from farmers', icon:'basket' },
  consumer:  { title:'Household',        sub:'Buy fresh produce straight from the farm', icon:'home' },
  logistics: { title:'Delivery partner', sub:'Pick up and deliver orders on your route', icon:'truck' },
  admin:     { title:'Operations',       sub:'Verification, escrow and monitoring (authorised staff only)', icon:'shield' },
};
const BUSINESS_TYPES = ['Hotel','Restaurant','Retailer','Institution','Processor','Wholesaler','Other'];
const VEHICLE_TYPES = ['Bike','Auto','Mini truck','Truck'];
function authToken(){ try{ return (JSON.parse(localStorage.getItem('kisan_setu_session_v3'))||{}).token || null; }catch(e){ return null; } }
function persistTokenNow(token){ try{ const s = JSON.parse(localStorage.getItem('kisan_setu_session_v3'))||{}; s.token = token; localStorage.setItem('kisan_setu_session_v3', JSON.stringify(s)); }catch(e){} }   // make the token readable by the sync code immediately
function authHeaders(extra){ const t = authToken(); return { 'Content-Type':'application/json', ...(t?{Authorization:'Bearer '+t}:{}), ...(extra||{}) }; }
async function authApi(path, body, method){
  try{
    const r = await fetch(API_BASE+path, { method: method || (body ? 'POST' : 'GET'), headers: authHeaders(), body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(()=>({})); return { status:r.status, ...j };
  }catch(e){ return { status:0, ok:false, error:'Cannot reach the server. Check your connection and try again.' }; }
}
const CLEAR_AUTH = { token:null, userId:null, guest:false, farmerId:null, buyerId:null, consumerName:null, driverIn:false, adminLoggedIn:false, adminRole:null };
async function doLogout(setSession, extra){ try{ if(window.KS_SYNC_FLUSH) await window.KS_SYNC_FLUSH(); }catch(e){}   // save pending changes before the token is cleared
  authApi('/api/auth/logout', {}); setSession({ ...CLEAR_AUTH, ...(extra||{}) }); }
function pwStrength(p){ let s=0; if(p.length>=8) s++; if(p.length>=12) s++; if(/[A-Z]/.test(p)&&/[a-z]/.test(p)) s++; if(/\d/.test(p)) s++; if(/[^A-Za-z0-9]/.test(p)) s++; return Math.min(4, s); }

function AField({ label, error, hint, children }){
  return <label className={cx('af', error&&'af-err')}><span className="af-l">{label}</span>{children}{error ? <span className="af-e" role="alert">{error}</span> : (hint ? <span className="af-h">{hint}</span> : null)}</label>;
}
function AInput({ name, value, onChange, ...rest }){ return <input className="input" name={name} value={value||''} onChange={e=>onChange(name, e.target.value)} {...rest}/>; }
function ASelect({ name, value, onChange, options, placeholder }){ return <select className="input" name={name} value={value||''} onChange={e=>onChange(name, e.target.value)}><option value="">{placeholder||'Select'}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>; }
function PasswordInput({ name, value, onChange, strength, autoComplete }){
  const [show, setShow] = useState(false);
  return (<div>
    <div className="pw-wrap"><input className="input" name={name} type={show?'text':'password'} value={value||''} onChange={e=>onChange(name, e.target.value)} autoComplete={autoComplete||'current-password'} maxLength={100}/><button type="button" className="pw-eye" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'}>{show?'Hide':'Show'}</button></div>
    {strength && value ? <div className="pw-meter" aria-hidden="true">{[0,1,2,3].map(i=><i key={i} className={pwStrength(value)>i?'on s'+pwStrength(value):''}></i>)}<small>{['Too weak','Weak','Fair','Good','Strong'][pwStrength(value)]}</small></div> : null}
  </div>);
}

function AuthScreen({ role }){
  const { session, setSession, dispatch } = useApp();
  const meta = AUTH_ROLES[role]; const isAdmin = role === 'admin';
  const [tab, setTab] = useState('login');                 // login | register | forgot
  const [method, setMethod] = useState('password');        // password | otp
  const [f, setF] = useState({ crops:[], acceptTerms:false, businessType:'', vehicleType:'' });
  const [errs, setErrs] = useState({}); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false); const [devOtp, setDevOtp] = useState(null); const [cool, setCool] = useState(0);
  const [adminStep, setAdminStep] = useState(false);
  useEffect(()=>{ if(cool<=0) return; const t=setTimeout(()=>setCool(cool-1),1000); return ()=>clearTimeout(t); }, [cool]);
  const set = (k,v)=>{ setF(p=>({ ...p, [k]:v })); setErrs(p=>({ ...p, [k]:undefined })); };
  const reset = (t)=>{ setTab(t); setErrs({}); setMsg(null); setOtpSent(false); setDevOtp(null); setAdminStep(false); setF(p=>({ ...p, otp:'', password:'', confirm:'', newPassword:'' })); };
  const mobileOk = /^[6-9]\d{9}$/.test(String(f.mobile||'').replace(/\D/g,'').replace(/^91(?=\d{10}$)/,''));

  function clientErrors(){
    const e={}; const need=(k,l,min=2)=>{ if(String(f[k]||'').trim().length<min) e[k]=l+' is required'; };
    if(!mobileOk) e.mobile='Enter a valid 10-digit mobile number';
    if(tab==='register'){
      need('name','Full name');
      if(!f.password||f.password.length<8||!/[A-Za-z]/.test(f.password)||!/\d/.test(f.password)) e.password='At least 8 characters with letters and numbers';
      if(f.password!==f.confirm) e.confirm='Passwords do not match';
      if(!f.acceptTerms) e.acceptTerms='Please accept the Terms and Privacy Policy';
      if(role==='farmer'){ need('state','State'); need('district','District'); if(!/^[1-9]\d{5}$/.test(f.pincode||'')) e.pincode='Enter a valid 6-digit PIN code'; }
      if(role==='buyer'){ need('businessName','Business name'); need('businessType','Business type'); need('contactName','Contact person'); need('designation','Designation'); need('address','Address',5); need('city','City'); need('state','State'); if(!/^[1-9]\d{5}$/.test(f.pincode||'')) e.pincode='Enter a valid 6-digit PIN code'; if(f.gstin&&!/^\d{2}[A-Za-z]{5}\d{4}[A-Za-z][1-9A-Za-z]Z[0-9A-Za-z]$/.test(f.gstin)) e.gstin='Enter a valid 15-character GSTIN'; if(f.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) e.email='Enter a valid email'; }
      if(role==='consumer'){ need('address','Address',5); need('city','City'); need('state','State'); if(!/^[1-9]\d{5}$/.test(f.pincode||'')) e.pincode='Enter a valid 6-digit PIN code'; }
      if(role==='logistics'){ need('vehicleType','Vehicle type'); if(!/^[A-Za-z]{2}\s?\d{1,2}\s?[A-Za-z]{0,3}\s?\d{4}$/.test(f.vehicleNumber||'')) e.vehicleNumber='Enter a valid vehicle number, e.g. DL 01 AB 1234'; if(String(f.licenseNumber||'').trim().length<8) e.licenseNumber='Enter your driving licence number'; need('city','City / operating area'); need('state','State'); }
    }
    if(tab==='forgot'&&otpSent){ if(!f.newPassword||f.newPassword.length<8||!/[A-Za-z]/.test(f.newPassword)||!/\d/.test(f.newPassword)) e.newPassword='At least 8 characters with letters and numbers'; }
    if(tab==='login'&&method==='password'&&!adminStep&&!f.password) e.password='Enter your password';
    return e;
  }
  const profilePayload = ()=>{ const keys = { farmer:['state','district','village','pincode','acres','crops'], buyer:['businessName','businessType','contactName','designation','email','gstin','address','city','state','pincode','deliveryWindow'], consumer:['address','city','state','pincode'], logistics:['vehicleType','vehicleNumber','licenseNumber','city','state'] }[role]||[]; const p={}; keys.forEach(k=>{ if(f[k]!==undefined) p[k]=f[k]; }); return p; };

  async function sendOtp(purpose){
    setMsg(null); const e=clientErrors(); if(e.mobile||(purpose==='register'&&Object.keys(e).length)){ setErrs(e); return false; }
    setBusy(true); const r = await authApi('/api/auth/otp/send', { mobile:f.mobile, role, purpose }); setBusy(false);
    if(r.ok){ setOtpSent(true); setCool(r.resendIn||30); setDevOtp(r.devOtp||null); setMsg({ ok:true, text:'OTP sent to +91 '+String(f.mobile).replace(/\D/g,'').slice(-10)+'. It is valid for 5 minutes.' }); return true; }
    if(r.field) setErrs(p=>({ ...p, [r.field]:r.error })); setMsg({ ok:false, text:r.error||'Could not send the OTP' }); if(r.resendIn) setCool(r.resendIn); return false;
  }
  async function done(r){
    const u = r.user; const pause = (ms)=>new Promise(res=>setTimeout(res,ms));
    persistTokenNow(r.token); setSession({ token:r.token, userId:u.id, guest:false });
    if(window.KS_SYNC_NOW) await window.KS_SYNC_NOW();          // load the shared dataset first so we never overwrite other users' data
    await pause(80); dispatch({ type:'ENSURE_PROFILE', user:u });
    await pause(80); if(window.KS_SYNC_FLUSH) await window.KS_SYNC_FLUSH();   // save the new profile to the server straight away
    const p = u.profile||{};
    const base = { role, token:r.token, userId:u.id, guest:false, lang:u.lang||session.lang||'en', screen: role==='logistics'?'route':(role==='admin'?'overview':'home') };
    if(role==='farmer') setSession({ ...base, farmerId:u.id });
    else if(role==='buyer') setSession({ ...base, buyerId:u.id });
    else if(role==='consumer') setSession({ ...base, consumerName:u.name, consumerRegion:p.city||p.state||'' });
    else if(role==='logistics') setSession({ ...base, driverIn:true, driverName:u.name, driverPhone:u.mobile, driverVehicle:p.vehicleNumber||'' });
    else setSession({ ...base, adminLoggedIn:true, adminRole:u.adminRole||'superadmin' });
  }
  async function submit(ev){
    ev.preventDefault(); setMsg(null); const e=clientErrors(); setErrs(e);
    if(tab==='login'&&method==='password'&&!adminStep){ if(e.mobile||e.password) return; setBusy(true); const r=await authApi('/api/auth/login',{ role, mobile:f.mobile, password:f.password }); setBusy(false);
      if(r.token) return done(r); if(r.ok&&isAdmin){ setAdminStep(true); setOtpSent(true); setCool(r.resendIn||30); setDevOtp(r.devOtp||null); setMsg({ ok:true, text:'Password accepted. Enter the OTP sent to your mobile.' }); return; }
      return setMsg({ ok:false, text:r.error||'Login failed' }); }
    if((tab==='login'&&(method==='otp'||adminStep))){ if(!otpSent){ return sendOtp('login'); } if(!/^\d{6}$/.test(f.otp||'')) return setErrs({ otp:'Enter the 6-digit OTP' });
      setBusy(true); const r=await authApi('/api/auth/login/otp',{ role, mobile:f.mobile, otp:f.otp }); setBusy(false); return r.token ? done(r) : setMsg({ ok:false, text:r.error||'Incorrect OTP' }); }
    if(tab==='register'){ if(Object.keys(e).length) return; if(!otpSent) return sendOtp('register'); if(!/^\d{6}$/.test(f.otp||'')) return setErrs({ otp:'Enter the 6-digit OTP' });
      setBusy(true); const r=await authApi('/api/auth/register',{ role, mobile:f.mobile, otp:f.otp, name:f.name, password:f.password, consent:true, lang:session.lang||'en', profile:profilePayload() }); setBusy(false);
      if(r.token) return done(r); if(r.errors) setErrs(r.errors); else if(r.field) setErrs({ [r.field]:r.error }); return setMsg({ ok:false, text:r.error||'Registration failed' }); }
    if(tab==='forgot'){ if(!otpSent) return sendOtp('reset'); if(e.newPassword) return; if(!/^\d{6}$/.test(f.otp||'')) return setErrs({ otp:'Enter the 6-digit OTP' });
      setBusy(true); const r=await authApi('/api/auth/password/reset',{ role, mobile:f.mobile, otp:f.otp, newPassword:f.newPassword }); setBusy(false);
      if(r.ok){ reset('login'); return setMsg({ ok:true, text:'Password changed. Please log in.' }); } if(r.errors) setErrs({ newPassword:r.errors.password }); return setMsg({ ok:false, text:r.error||'Could not reset the password' }); }
  }
  const stateOpts = IN_STATES;
  const mobileField = <AField label="Mobile number" error={errs.mobile} hint="10-digit Indian mobile number"><div className="mob-wrap"><span>+91</span><AInput name="mobile" value={f.mobile} onChange={set} inputMode="numeric" autoComplete="tel-national" maxLength={13} placeholder="98765 43210" disabled={otpSent&&tab!=='login'||adminStep}/></div></AField>;
  const otpField = otpSent ? <AField label="One-time password (OTP)" error={errs.otp}><AInput name="otp" value={f.otp} onChange={(k,v)=>set(k,v.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit OTP" className="input otp-in"/>{devOtp ? <small className="dev-otp">Development mode: your OTP is <b>{devOtp}</b></small> : null}<button type="button" className="link-btn" disabled={cool>0||busy} onClick={()=>sendOtp(tab==='register'?'register':tab==='forgot'?'reset':'login')}>{cool>0?('Resend OTP in '+cool+'s'):'Resend OTP'}</button></AField> : null;
  const cta = busy ? 'Please wait...' : tab==='register' ? (otpSent?'Verify OTP and create account':'Send OTP') : tab==='forgot' ? (otpSent?'Set new password':'Send OTP') : (method==='otp'||adminStep) ? (otpSent?'Verify OTP and log in':'Send OTP') : (isAdmin?'Continue':'Log in');

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="auth-back" onClick={()=>setSession({ role:null })} aria-label="Back to home">&larr; Back</button>
        <div className="auth-head"><Logo size={44}/><div><h1 className="display">{meta.title}</h1><p>{meta.sub}</p></div></div>
        {!isAdmin && tab!=='forgot' && <div className="auth-tabs" role="tablist"><button role="tab" aria-selected={tab==='login'} className={cx(tab==='login'&&'on')} onClick={()=>reset('login')}>Log in</button><button role="tab" aria-selected={tab==='register'} className={cx(tab==='register'&&'on')} onClick={()=>reset('register')}>Create account</button></div>}
        {tab==='forgot' && <h2 className="auth-h2">Reset your password</h2>}
        <form onSubmit={submit} noValidate className="auth-form">
          {tab==='login' && !isAdmin && !adminStep && <div className="seg" role="radiogroup"><button type="button" className={cx(method==='password'&&'on')} onClick={()=>{ setMethod('password'); setOtpSent(false); setErrs({}); setMsg(null); }}>Password</button><button type="button" className={cx(method==='otp'&&'on')} onClick={()=>{ setMethod('otp'); setOtpSent(false); setErrs({}); setMsg(null); }}>OTP</button></div>}
          {tab==='register' && <AField label="Full name" error={errs.name}><AInput name="name" value={f.name} onChange={set} autoComplete="name" maxLength={80}/></AField>}
          {mobileField}
          {tab==='register' && role==='farmer' && <>
            <div className="af-row"><AField label="State" error={errs.state}><ASelect name="state" value={f.state} onChange={set} options={stateOpts} placeholder="Select state"/></AField><AField label="District" error={errs.district}><AInput name="district" value={f.district} onChange={set} maxLength={60}/></AField></div>
            <div className="af-row"><AField label="Village / town (optional)"><AInput name="village" value={f.village} onChange={set} maxLength={80}/></AField><AField label="PIN code" error={errs.pincode}><AInput name="pincode" value={f.pincode} onChange={set} inputMode="numeric" maxLength={6}/></AField></div>
            <AField label="Land size in acres (optional)" error={errs.acres}><AInput name="acres" value={f.acres} onChange={set} inputMode="decimal" maxLength={7}/></AField>
            <AField label="Main crops (optional)"><div className="chip-row" style={{flexWrap:'wrap',overflow:'visible'}}>{CROPS.map(c=><button type="button" key={c.id} className={cx('chip', f.crops.includes(c.id)&&'on')} onClick={()=>set('crops', f.crops.includes(c.id)?f.crops.filter(x=>x!==c.id):[...f.crops,c.id])}>{cropName(c.id,'en')}</button>)}</div></AField></>}
          {tab==='register' && role==='buyer' && <>
            <AField label="Business name" error={errs.businessName}><AInput name="businessName" value={f.businessName} onChange={set} maxLength={100}/></AField>
            <div className="af-row"><AField label="Business type" error={errs.businessType}><ASelect name="businessType" value={f.businessType} onChange={set} options={BUSINESS_TYPES} placeholder="Select"/></AField><AField label="GSTIN (optional)" error={errs.gstin}><AInput name="gstin" value={f.gstin} onChange={(k,v)=>set(k,v.toUpperCase())} maxLength={15}/></AField></div>
            <div className="af-row"><AField label="Contact person" error={errs.contactName}><AInput name="contactName" value={f.contactName} onChange={set} maxLength={80}/></AField><AField label="Designation" error={errs.designation}><AInput name="designation" value={f.designation} onChange={set} maxLength={60}/></AField></div>
            <AField label="Business email (optional)" error={errs.email}><AInput name="email" type="email" value={f.email} onChange={set} autoComplete="email" maxLength={100}/></AField>
            <AField label="Address" error={errs.address}><AInput name="address" value={f.address} onChange={set} maxLength={200}/></AField>
            <div className="af-row"><AField label="City" error={errs.city}><AInput name="city" value={f.city} onChange={set} maxLength={60}/></AField><AField label="PIN code" error={errs.pincode}><AInput name="pincode" value={f.pincode} onChange={set} inputMode="numeric" maxLength={6}/></AField></div>
            <AField label="State" error={errs.state}><ASelect name="state" value={f.state} onChange={set} options={stateOpts} placeholder="Select state"/></AField></>}
          {tab==='register' && role==='consumer' && <>
            <AField label="Delivery address" error={errs.address}><AInput name="address" value={f.address} onChange={set} maxLength={200}/></AField>
            <div className="af-row"><AField label="City" error={errs.city}><AInput name="city" value={f.city} onChange={set} maxLength={60}/></AField><AField label="PIN code" error={errs.pincode}><AInput name="pincode" value={f.pincode} onChange={set} inputMode="numeric" maxLength={6}/></AField></div>
            <AField label="State" error={errs.state}><ASelect name="state" value={f.state} onChange={set} options={stateOpts} placeholder="Select state"/></AField></>}
          {tab==='register' && role==='logistics' && <>
            <div className="af-row"><AField label="Vehicle type" error={errs.vehicleType}><ASelect name="vehicleType" value={f.vehicleType} onChange={set} options={VEHICLE_TYPES} placeholder="Select"/></AField><AField label="Vehicle number" error={errs.vehicleNumber}><AInput name="vehicleNumber" value={f.vehicleNumber} onChange={(k,v)=>set(k,v.toUpperCase())} maxLength={15} placeholder="DL 01 AB 1234"/></AField></div>
            <AField label="Driving licence number" error={errs.licenseNumber}><AInput name="licenseNumber" value={f.licenseNumber} onChange={(k,v)=>set(k,v.toUpperCase())} maxLength={20}/></AField>
            <div className="af-row"><AField label="City / operating area" error={errs.city}><AInput name="city" value={f.city} onChange={set} maxLength={60}/></AField><AField label="State" error={errs.state}><ASelect name="state" value={f.state} onChange={set} options={stateOpts} placeholder="Select"/></AField></div></>}
          {((tab==='login'&&method==='password'&&!adminStep)||tab==='register') && <AField label={tab==='register'?'Create password':'Password'} error={errs.password} hint={tab==='register'?'At least 8 characters with letters and numbers':null}><PasswordInput name="password" value={f.password} onChange={set} strength={tab==='register'} autoComplete={tab==='register'?'new-password':'current-password'}/></AField>}
          {tab==='register' && <AField label="Confirm password" error={errs.confirm}><PasswordInput name="confirm" value={f.confirm} onChange={set} autoComplete="new-password"/></AField>}
          {tab==='forgot' && otpSent && <AField label="New password" error={errs.newPassword}><PasswordInput name="newPassword" value={f.newPassword} onChange={set} strength autoComplete="new-password"/></AField>}
          {otpField}
          {tab==='register' && <label className={cx('af-check', errs.acceptTerms&&'af-err')}><input type="checkbox" name="acceptTerms" checked={!!f.acceptTerms} onChange={e=>set('acceptTerms', e.target.checked)}/><span>I agree to the Terms of Use and Privacy Policy, and consent to Kisan Setu storing my details to run my account.</span></label>}
          {errs.acceptTerms && <span className="af-e" role="alert">{errs.acceptTerms}</span>}
          {msg && <div className={cx('auth-msg', msg.ok?'ok':'bad')} role="status">{msg.text}</div>}
          <button className="btn btn-primary btn-lg auth-cta" type="submit" disabled={busy}>{cta}</button>
        </form>
        <div className="auth-foot">
          {tab==='login' && <button className="link-btn" onClick={()=>reset('forgot')}>Forgot password?</button>}
          {tab==='forgot' && <button className="link-btn" onClick={()=>reset('login')}>Back to log in</button>}
          {tab==='login' && !isAdmin && <span>New here? <button className="link-btn" onClick={()=>reset('register')}>Create an account</button></span>}
          {tab==='register' && <span>Already registered? <button className="link-btn" onClick={()=>reset('login')}>Log in</button></span>}
        </div>
        <p className="auth-fine">Your mobile number is used only to sign you in and to coordinate orders.{isAdmin?' Operations accounts are created by the system administrator and always require a password and an OTP.':''}</p>
      </div>
    </div>
  );
}
