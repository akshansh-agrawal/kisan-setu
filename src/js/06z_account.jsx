/* ============================= ACCOUNT (profile editing + log out) ============================= */
async function imageToAvatar(file){
  const url = await fileToDataURL(file); const img = await loadImg(url);
  const side = Math.min(img.width, img.height), sx = (img.width-side)/2, sy = (img.height-side)/2;
  const c = document.createElement('canvas'); c.width = c.height = 200;
  c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, 200, 200);
  return c.toDataURL('image/jpeg', 0.82);
}
function PhotoPicker({ name, photo, onChange, tone='nil', size=76 }){
  const ref = useRef(null);
  return (
    <div className="ph-pick" style={{ width:size, height:size }}>
      <Avatar name={name} tone={tone} size={size} photo={photo}/>
      <button type="button" className="ph-edit" onClick={()=>ref.current && ref.current.click()} aria-label="Change profile photo"><Icon name="camera" size={14}/></button>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async e=>{ const f = e.target.files && e.target.files[0]; e.target.value=''; if(!f) return; try{ onChange(await imageToAvatar(f)); }catch(x){} }}/>
    </div>
  );
}

/* fields: [{ key, label, type:'text'|'tel'|'email'|'select', options:[], required }] */
function AccountScreen({ title, name, subtitle, photo, onPhoto, tone, badges, fields, values, onSave, statusRows, extra, extraLabel, extraIcon, onLogout, lang }){
  const [draft, setDraft] = useState(values);
  const [open, setOpen] = useState(null);           // null | 'profile' | 'more'
  const [saved, setSaved] = useState(false);
  useEffect(()=>{ setDraft(values); }, [JSON.stringify(values)]);
  const dirty = fields.some(f=> (draft[f.key]||'') !== (values[f.key]||''));
  const missing = fields.some(f=> f.required && !String(draft[f.key]||'').trim());
  const L = lang || 'en';
  const Row = ({ icon, label, hint, k }) => (
    <button className={cx('set-row', open===k&&'open')} onClick={()=>setOpen(open===k?null:k)}>
      <span className="set-ic"><Icon name={icon} size={20}/></span>
      <span className="grow minw0"><b data-lang={L}>{label}</b>{hint ? <small data-lang={L}>{hint}</small> : null}</span>
      <Icon name={open===k?'chevD':'chevR'} size={18}/>
    </button>);
  return (
    <Screen>
      <AppTopBar title={title}/>
      <div className="page stagger">
        <section className="acct-hero">
          <PhotoPicker name={name} photo={photo} onChange={onPhoto} tone={tone} size={84}/>
          <b className="acct-name">{name}</b>
          <div className="muted sm">{subtitle}</div>
          {badges && <div className="row gap6 wrap" style={{marginTop:8,justifyContent:'center'}}>{badges}</div>}
        </section>

        <section className="set-list">
          <Row k="profile" icon="user" label={tb(95,L)} hint={fields.slice(0,2).map(f=>values[f.key]).filter(Boolean).join('  ')}/>
          {open==='profile' && (
            <div className="set-panel">
              <div className="fgrid">
                {fields.map(f=>(
                  <Field key={f.key} label={f.label + (f.required?' *':'')}>
                    {f.type==='select'
                      ? <select className="input" value={draft[f.key]||''} onChange={e=>{ setSaved(false); setDraft({ ...draft, [f.key]:e.target.value }); }}>{f.options.map(o=><option key={o}>{o}</option>)}</select>
                      : <input className="input" type={f.type||'text'} inputMode={f.type==='tel'?'tel':undefined} value={draft[f.key]||''} placeholder={f.placeholder||''} onChange={e=>{ setSaved(false); setDraft({ ...draft, [f.key]:e.target.value }); }}/>}
                  </Field>))}
              </div>
              <div className="row gap10">
                <Btn kind="primary" disabled={!dirty||missing} onClick={()=>{ onSave(draft); setSaved(true); }}>{t('saveChanges',L)}</Btn>
                {dirty && <Btn kind="ghost" onClick={()=>setDraft(values)}>{t('cancel',L)}</Btn>}
                {saved && !dirty && <span className="saved-note"><Icon name="check" size={15} stroke={2.6}/></span>}
              </div>
            </div>)}
          {extra && <Row k="more" icon={extraIcon||'globe'} label={extraLabel||t('language',L)} hint={extraLabel?null:(LANGUAGES.find(l=>l.code===L)||{}).label}/>}
          {extra && open==='more' && <div className="set-panel">{extra}</div>}
          <a className="set-row" href="tel:18001801551"><span className="set-ic"><Icon name="phone" size={20}/></span><span className="grow minw0"><b data-lang={L}>{tb(96,L)}</b><small>1800-180-1551</small></span><Icon name="chevR" size={18}/></a>
        </section>

        {statusRows && <div className="set-status">{statusRows.map(([l,ic,node])=><span key={l} className="set-chip"><Icon name={ic} size={14}/>{l}{' '}{node}</span>)}</div>}

        <button className="logout-btn" onClick={onLogout}><Icon name="power" size={18}/>{t('logoutLbl',L)}</button>
      </div>
    </Screen>
  );
}

function StatusBadge({ st }){
  return st==='approved' ? <Badge tone="green" icon="check">Verified</Badge> : st==='rejected' ? <Badge tone="anar" icon="x">Not approved</Badge> : <Badge tone="haldi" icon="clock">In review</Badge>;
}

/* ---- Farmer ---- */
function FarmerAccount(){
  const { state, session, setSession, dispatch } = useApp();
  const f = state.farmers.find(x=>x.id===session.farmerId); const lang = session.lang;
  const vals = { name:f.name, phone:f.phone, region:f.region, farmAcres:f.farmAcres||'', address:f.address||'' };
  return <AccountScreen title={t('account',lang)} lang={lang} tone="green" name={f.name} photo={f.photo} subtitle={`${f.region} · ${f.phone}`}
    badges={<StatusBadge st={kycState(f)}/>}
    onPhoto={ph=>dispatch({ type:'UPDATE_FARMER', id:f.id, patch:{ photo:ph }, silent:true })}
    fields={[{key:'name',label:'Full name',required:true},{key:'phone',label:'Mobile number',type:'tel',required:true},{key:'region',label:'Village or region',type:'select',options:REGIONS},{key:'farmAcres',label:'Farm size (acres)',placeholder:'e.g. 4'},{key:'address',label:'Address',placeholder:'Village, post, district'}]}
    values={vals} onSave={patch=>dispatch({ type:'UPDATE_FARMER', id:f.id, patch })}
    statusRows={[['Identity check','shield',<StatusBadge st={kycState(f)}/>],['Soil report','flask',<TrustBadge trust={f.trust}/>],['Field diary scans','book',<b>{state.scans.filter(s=>s.farmerId===f.id).length}</b>]]}
    extra={<div><LangGrid value={lang} onChange={v=>{ setSession({lang:v}); dispatch({ type:'UPDATE_FARMER', id:f.id, patch:{ lang:v }, silent:true }); }}/></div>}
    onLogout={()=>doLogout(setSession,{ screen:'home', prefillCrop:null })}/>;
}

/* ---- Buyer ---- */
function BuyerAccount(){
  const { state, session, setSession, dispatch } = useApp();
  const b = state.buyers.find(x=>x.id===session.buyerId);
  const vals = { businessName:b.businessName, type:b.type, region:b.region, contact:b.contact, role:b.role, phone:b.phone||'', email:b.email||'', deliveryWindow:b.deliveryWindow };
  return <AccountScreen title="Account" tone="nil" name={b.businessName} photo={b.photo} subtitle={`${b.type} · ${b.region}`} badges={<StatusBadge st={buyerState(b)}/>}
    onPhoto={ph=>dispatch({ type:'UPDATE_BUYER', id:b.id, patch:{ photo:ph } })}
    fields={[{key:'businessName',label:'Business name',required:true},{key:'type',label:'Business type',type:'select',options:['Hotel','Restaurant','Retailer','Caterer']},{key:'region',label:'Delivery region',type:'select',options:REGIONS},{key:'contact',label:'Contact person',required:true},{key:'role',label:'Role',type:'select',options:['Purchasing Manager','Head Chef','Owner']},{key:'phone',label:'Phone',type:'tel'},{key:'email',label:'Work email',type:'email'},{key:'deliveryWindow',label:'Delivery window',type:'select',options:['5:30–7:30 AM','6:00–8:00 AM','7:00–9:00 AM']}]}
    values={vals} onSave={patch=>dispatch({ type:'UPDATE_BUYER', id:b.id, patch })}
    statusRows={[['Business verification','shield',<StatusBadge st={buyerState(b)}/>]]}
    extra={<section className="card form-card"><h3 className="card-title">Signed in as</h3><div className="seg"><button className={cx(session.buyerActiveUser!=='chef'&&'on')} onClick={()=>setSession({buyerActiveUser:'manager'})}>Purchasing Manager</button><button className={cx(session.buyerActiveUser==='chef'&&'on')} onClick={()=>setSession({buyerActiveUser:'chef'})}>Head Chef</button></div><p className="fine">Both logins share the same orders and history.</p></section>}
    onLogout={()=>doLogout(setSession,{ screen:'home', prefillCrop:null })}/>;
}

/* ---- Consumer ---- */
function ConsumerAccount(){
  const { session, setSession } = useApp();
  const vals = { name:session.consumerName||'', phone:session.consumerPhone||'', region:session.consumerRegion||REGIONS[0], address:session.consumerAddress||'' };
  return <AccountScreen title="Account" tone="haldi" name={session.consumerName||'Customer'} photo={session.consumerPhoto} subtitle={`Delivering to ${session.consumerRegion}`}
    onPhoto={ph=>setSession({ consumerPhoto:ph })}
    fields={[{key:'name',label:'Full name',required:true},{key:'phone',label:'Mobile number',type:'tel'},{key:'region',label:'Delivery area',type:'select',options:REGIONS},{key:'address',label:'Delivery address',placeholder:'House, street, landmark'}]}
    values={vals} onSave={p=>setSession({ consumerName:p.name, consumerPhone:p.phone, consumerRegion:p.region, consumerAddress:p.address })}
    onLogout={()=>doLogout(setSession,{ screen:'home' })}/>;
}

/* ---- Delivery partner ---- */
function LogisticsAccount(){
  const { session, setSession } = useApp();
  const vals = { name:session.driverName||'', phone:session.driverPhone||'', vehicle:session.driverVehicle||'', base:session.driverBase||REGIONS[0] };
  return <AccountScreen title="Account" tone="nil" name={session.driverName||'Driver'} photo={session.driverPhoto} subtitle={session.driverVehicle||'Delivery partner'}
    onPhoto={ph=>setSession({ driverPhoto:ph })}
    fields={[{key:'name',label:'Full name',required:true},{key:'phone',label:'Mobile number',type:'tel',required:true},{key:'vehicle',label:'Vehicle number'},{key:'base',label:'Base region',type:'select',options:REGIONS}]}
    values={vals} onSave={p=>setSession({ driverName:p.name, driverPhone:p.phone, driverVehicle:p.vehicle, driverBase:p.base })}
    onLogout={()=>doLogout(setSession,{ screen:'route', stopId:null })}/>;
}
