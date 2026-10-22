/* ============================= ADMIN PORTAL ============================= */
const ADMIN_ROLES = [
  { key:'superadmin', label:'Super Admin', icon:'shield', sections:['overview','verification','glut','escrow','voicebot','fpo','residue','fraud','audit','data'], readOnly:[] },
  { key:'verification', label:'Verification Officer', icon:'check', sections:['verification','residue'], readOnly:[] },
  { key:'ops', label:'Regional Ops Manager', icon:'trend', sections:['glut'], readOnly:[] },
  { key:'logistics', label:'Logistics Coordinator', icon:'truck', sections:['glut','fpo'], readOnly:['glut'] },
  { key:'finance', label:'Finance and Payments', icon:'card', sections:['escrow','audit'], readOnly:['audit'] },
  { key:'support', label:'Customer Support', icon:'phone', sections:['verification','escrow','fpo','residue'], readOnly:['verification','escrow','fpo','residue'] },
  { key:'auditor', label:'Auditor', icon:'clipboard', sections:['audit','voicebot'], readOnly:['audit','voicebot'] },
];
function roleOf(key){ return ADMIN_ROLES.find(r=>r.key===key); }
function canView(adminRole, section){ const r = roleOf(adminRole); return !!r && r.sections.includes(section); }
function canEdit(adminRole, section){ const r = roleOf(adminRole); return !!r && r.sections.includes(section) && !r.readOnly.includes(section); }

function Panel({ title, badge, right, children, flush }){
  return (
    <section className="apanel">
      {(title||right) && <div className="apanel-head"><h3 className="display">{title}{badge}</h3>{right}</div>}
      <div className={flush?'':'apanel-body'}>{children}</div>
    </section>
  );
}
function DataTable({ cols, rows, empty }){
  return <div className="tbl-wrap"><table className="tbl"><thead><tr>{cols.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.length ? rows : <tr><td colSpan={cols.length} className="tbl-empty">{empty}</td></tr>}</tbody></table></div>;
}
const RO = <Badge tone="haldi" className="ml8">Read only</Badge>;
const Approve = ({ disabled, onClick })=> <Btn kind="green" size="sm" disabled={disabled} onClick={onClick}>Approve</Btn>;
const Reject = ({ disabled, onClick })=> <Btn kind="ghost" size="sm" disabled={disabled} onClick={onClick}>Reject</Btn>;

function StatCard({ icon, label, value, tone='nil', money, delay=0 }){
  return (
    <div className={'astat astat-'+tone}>
      <span className="astat-ic"><Icon name={icon} size={22}/></span>
      <b className="display">{typeof value==='number' ? <Num value={value} prefix={money?'₹':''} delay={delay} ms={1000}/> : value}</b>
      <small>{label}</small>
    </div>
  );
}
function AdminOverview(){
  const { state } = useApp();
  const activeListings = state.listings.filter(l=>l.remainingQty>0);
  const pendingKyc = state.farmers.filter(f=>kycState(f)==='pending').length + state.buyers.filter(b=>buyerState(b)==='pending').length;
  const pendingSoil = state.farmers.filter(f=>f.trust && !f.trust.reviewed).length;
  const escrowHeld = state.orders.filter(o=>o.status==='awaiting_second_approval').reduce((s,o)=>s+(o.ledger?o.ledger.buyerTotal:0),0);
  const settled = state.orders.filter(o=>o.status==='paid').reduce((s,o)=>s+orderTotal(o),0);
  const openFlags = state.fraudFlags.filter(f=>!f.dismissed).length;
  const st = {}; state.orders.forEach(o=>{ st[o.status]=(st[o.status]||0)+1; });
  const parts = [['matched','#2E7D3E'],['partial','#F5B324'],['picked_up','#2E8B57'],['delivered','#14532D'],['awaiting_second_approval','#D8432F'],['paid','#79D07E']].map(([k,c])=>({ k, value:st[k]||0, color:c })).filter(p=>p.value>0);
  const byCrop = CROPS.map(c=>({ label:c.name.en.slice(0,6), value: activeListings.filter(l=>l.cropId===c.id).reduce((s,l)=>s+l.remainingQty,0), color:c.tint })).map(x=>({ ...x, display:x.value+'' }));
  return (
    <div className="col gap16">
      <div className="astats">
        <StatCard icon="box" label="Active listings" value={activeListings.length} tone="green" delay={0}/>
        <StatCard icon="users" label="Farmers and buyers" value={state.farmers.length+' · '+state.buyers.length} tone="nil"/>
        <StatCard icon="clock" label="Pending KYC" value={pendingKyc} tone="haldi" delay={80}/>
        <StatCard icon="flask" label="Soil reports to review" value={pendingSoil} tone="haldi" delay={120}/>
        <StatCard icon="lock" label="Escrow awaiting approval" value={escrowHeld} money tone="anar" delay={160}/>
        <StatCard icon="coin" label="Volume settled" value={settled} money tone="green" delay={200}/>
        <StatCard icon="trend" label="Active glut alerts" value={state.gluts.filter(g=>g.active).length} tone="anar" delay={240}/>
        <StatCard icon="flag" label="Open fraud flags" value={openFlags} tone={openFlags?'anar':'green'} delay={280}/>
      </div>
      <div className="agrid2">
        <Panel title="Orders by status">
          {parts.length===0 ? <p className="muted">No orders yet. Place one from the Buyer or Shop app.</p> :
            <div className="row gap20 wrap"><Donut parts={parts}><b className="display" style={{fontSize:28}}>{state.orders.length}</b><small className="muted">orders</small></Donut>
              <div className="col gap6">{parts.map(p=><span key={p.k} className="row gap8 sm"><i className="dot" style={{background:p.color}}></i><span className="cap">{p.k.replace(/_/g,' ')}</span><b>{p.value}</b></span>)}</div></div>}
        </Panel>
        <Panel title="Kilograms on offer by crop"><BarChart items={byCrop} height={150}/></Panel>
      </div>
      <Panel title="Latest admin activity" flush>
        <DataTable cols={['When','Who','What','Detail']} empty="No admin actions logged yet." rows={state.auditLog.slice(0,5).map(a=><tr key={a.id}><td>{fmtTime(a.createdAt)}</td><td>{a.actor}</td><td><b>{a.action}</b></td><td className="sm">{a.detail}</td></tr>)}/>
      </Panel>
    </div>
  );
}

function DecisionBadge({ st }){ return st==='approved' ? <Badge tone="green" icon="check">Approved</Badge> : <Badge tone="anar" icon="x">Rejected</Badge>; }
function AdminVerification(){
  const { state, dispatch, session } = useApp();
  const editable = canEdit(session.adminRole,'verification'); const actor = roleOf(session.adminRole)?.label;
  const pf = state.farmers.filter(f=>kycState(f)==='pending'), pb = state.buyers.filter(b=>buyerState(b)==='pending');
  const ps = state.farmers.filter(f=>f.trust && !f.trust.reviewed);
  const decided = [
    ...state.farmers.filter(f=>kycState(f)!=='pending').map(f=>({ key:'f'+f.id, kind:'Farmer', name:f.name, sub:f.region, st:kycState(f), undo:()=>dispatch({type:'ADMIN_VERIFY_KYC',entityType:'farmer',id:f.id,approve:null,actor}) })),
    ...state.buyers.filter(b=>buyerState(b)!=='pending').map(b=>({ key:'b'+b.id, kind:'Buyer', name:b.businessName, sub:b.region, st:buyerState(b), undo:()=>dispatch({type:'ADMIN_VERIFY_KYC',entityType:'buyer',id:b.id,approve:null,actor}) })),
    ...state.farmers.filter(f=>f.trust && f.trust.reviewed).map(f=>({ key:'t'+f.id, kind:'Soil report', name:f.name, sub:'Score '+f.trust.score, st:f.trust.adminApproved===true?'approved':'rejected', undo:()=>dispatch({type:'ADMIN_REVIEW_TRUST',farmerId:f.id,approve:null,actor}) })),
  ];
  return (
    <div className="col gap16">
      <Panel title="Farmer and FPO identity checks" badge={!editable&&RO} flush>
        <DataTable cols={['Farmer','Region','Phone','']} empty="Nothing waiting for review." rows={pf.map(f=><tr key={f.id}><td><b>{f.name}</b></td><td>{f.region}</td><td>{f.phone}</td><td className="acts"><Approve disabled={!editable} onClick={()=>dispatch({type:'ADMIN_VERIFY_KYC',entityType:'farmer',id:f.id,approve:true,actor})}/><Reject disabled={!editable} onClick={()=>dispatch({type:'ADMIN_VERIFY_KYC',entityType:'farmer',id:f.id,approve:false,actor})}/></td></tr>)}/>
      </Panel>
      <Panel title="Buyer verification" flush>
        <DataTable cols={['Business','Type','Region','']} empty="Nothing waiting for review." rows={pb.map(b=><tr key={b.id}><td><b>{b.businessName}</b></td><td>{b.type}</td><td>{b.region}</td><td className="acts"><Approve disabled={!editable} onClick={()=>dispatch({type:'ADMIN_VERIFY_KYC',entityType:'buyer',id:b.id,approve:true,actor})}/><Reject disabled={!editable} onClick={()=>dispatch({type:'ADMIN_VERIFY_KYC',entityType:'buyer',id:b.id,approve:false,actor})}/></td></tr>)}/>
      </Panel>
      <Panel title="Soil and pesticide report review" flush>
        <DataTable cols={['Farmer','Score','Summary','']} empty="Nothing waiting for review." rows={ps.map(f=><tr key={f.id}><td><b>{f.name}</b></td><td><b>{f.trust.score}</b></td><td className="sm wrapcell">{f.trust.summary}</td><td className="acts"><Approve disabled={!editable} onClick={()=>dispatch({type:'ADMIN_REVIEW_TRUST',farmerId:f.id,approve:true,actor})}/><Reject disabled={!editable} onClick={()=>dispatch({type:'ADMIN_REVIEW_TRUST',farmerId:f.id,approve:false,actor})}/></td></tr>)}/>
      </Panel>
      <Panel title="Decisions" flush>
        <DataTable cols={['Type','Name','Detail','Decision','']} empty="No decisions recorded yet." rows={decided.map(d=><tr key={d.key}><td>{d.kind}</td><td><b>{d.name}</b></td><td className="muted">{d.sub}</td><td><DecisionBadge st={d.st}/></td><td className="acts">{editable && <Btn kind="ghost" size="sm" onClick={d.undo}>Reopen review</Btn>}</td></tr>)}/>
      </Panel>
    </div>
  );
}

function AdminGlutRoutes(){
  const { state, dispatch, session } = useApp();
  const editable = canEdit(session.adminRole,'glut'); const actor = roleOf(session.adminRole)?.label;
  const [region, setRegion] = useState(REGIONS[0]); const [cropId, setCropId] = useState(CROPS[0].id);
  const counts = {}; state.listings.filter(l=>l.remainingQty>0).forEach(l=>{ const k=l.region+'|'+l.cropId; counts[k]=(counts[k]||0)+1; });
  const rows = REGIONS.flatMap(r=>CROPS.map(c=>({r,c,n:counts[r+'|'+c.id]||0}))).filter(x=>x.n>0);
  return (
    <div className="col gap16">
      <Panel title="Regional supply monitor" badge={!editable&&RO} flush>
        <DataTable cols={['Region','Crop','Active listings','Status']} empty="No active listings." rows={rows.map(x=>{ const g = activeGlutFor(state,x.r,x.c.id); return <tr key={x.r+x.c.id}><td>{x.r}</td><td><span className="row gap8"><CropArt id={x.c.id} size={24}/>{x.c.name.en}</span></td><td>{x.n}</td><td>{g ? <Badge tone="anar" icon="alert">Glut active, {g.discountPct}% off</Badge> : x.n>=GLUT_LISTING_THRESHOLD ? <Badge tone="haldi">At risk</Badge> : <Badge tone="green">Normal</Badge>}</td></tr>; })}/>
      </Panel>
      {editable && <Panel title="Trigger a glut alert"><div className="row gap12 wrap end"><Field label="Region"><select className="input" value={region} onChange={e=>setRegion(e.target.value)}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></Field><Field label="Crop"><select className="input" value={cropId} onChange={e=>setCropId(e.target.value)}>{CROPS.map(c=><option key={c.id} value={c.id}>{c.name.en}</option>)}</select></Field><Btn kind="primary" icon="bolt" onClick={()=>dispatch({type:'TRIGGER_GLUT',region,cropId,actor})}>Trigger alert</Btn></div>
        {state.gluts.filter(g=>g.active).length>0 && <div className="row gap8 wrap" style={{marginTop:14}}>{state.gluts.filter(g=>g.active).map(g=><Badge key={g.id} tone="anar" icon="alert">{cropName(g.cropId,'en')} in {g.region}<button className="x-btn" onClick={()=>dispatch({type:'CANCEL_GLUT',glutId:g.id,actor})} aria-label="Cancel alert"><Icon name="x" size={12} stroke={3}/></button></Badge>)}</div>}
      </Panel>}
      <Panel title="Route oversight, today" flush>
        <DataTable cols={['#','Type','Stop','Region','Status']} empty="No route activity yet today." rows={state.todaysRoute.stops.map((s,i)=><tr key={s.id}><td>{i+1}</td><td>{s.kind==='pickup'?'Pickup':'Delivery'}</td><td>{s.label}</td><td>{s.region}</td><td>{s.status==='done'?<Badge tone="green" icon="check">Done</Badge>:<Badge tone="haldi">Pending</Badge>}</td></tr>)}/>
      </Panel>
    </div>
  );
}

function AdminEscrow(){
  const { state, dispatch, session } = useApp();
  const editable = canEdit(session.adminRole,'escrow'); const actor = roleOf(session.adminRole)?.label;
  const [confirmId, setConfirmId] = useState(null);
  const rel = state.orders.filter(o=>['delivered','awaiting_second_approval','paid'].includes(o.status)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return (
    <Panel title="Escrow ledger" badge={!editable&&RO} flush>
      <DataTable cols={['Order','Buyer','Amount','Status','Hours to pay','']} empty="No delivered orders yet." rows={rel.map(o=><tr key={o.id}><td className="mono">{o.id.slice(-6)}</td><td>{o.buyerLabel}</td><td><b>{o.ledger?fmtMoney(o.ledger.buyerTotal):'-'}</b></td><td><StatusPill status={o.status}/></td><td>{o.paidAt&&o.deliveredAt?((new Date(o.paidAt)-new Date(o.deliveredAt))/36e5).toFixed(1):'-'}</td><td className="acts">{o.status==='awaiting_second_approval'&&editable&&<Btn kind="primary" size="sm" icon="lock" onClick={()=>setConfirmId(o.id)}>Release funds</Btn>}</td></tr>)}/>
      <Sheet open={!!confirmId} onClose={()=>setConfirmId(null)} title="Two-key approval">
        <div className="col gap12"><p>This order is above {fmtMoney(ESCROW_APPROVAL_THRESHOLD)}. Releasing the money needs a second admin's sign-off.</p><Btn kind="primary" size="lg" block icon="check" onClick={()=>{ dispatch({type:'ADMIN_RELEASE_ESCROW',orderId:confirmId,actor}); setConfirmId(null); }}>Simulate second approval and release</Btn></div>
      </Sheet>
    </Panel>
  );
}

function AdminVoiceBot(){
  const { state } = useApp(); const log = state.voiceCallLog;
  const byLang = {}; log.forEach(c=>{ byLang[c.lang]=(byLang[c.lang]||0)+1; });
  return (
    <div className="col gap16">
      <div className="astats three"><StatCard icon="phone" label="Total calls" value={log.length} tone="nil"/><StatCard icon="check" label="Resolved" value={log.length} tone="green"/><StatCard icon="globe" label="Languages used" value={Object.keys(byLang).length} tone="haldi"/></div>
      <Panel title="Language breakdown"><div className="col gap12">{LANGUAGES.map(l=><div key={l.code} className="row gap12 sm"><span style={{width:72}} data-lang={l.code}>{l.label}</span><div className="meter grow"><i style={{width:(log.length?(byLang[l.code]||0)/log.length*100:0)+'%'}}></i></div><b style={{width:24,textAlign:'right'}}>{byLang[l.code]||0}</b></div>)}</div></Panel>
      <Panel title="Call log" flush><DataTable cols={['Time','Farmer','Language','Intent']} empty='No calls yet. Use "Call for prices" in the Farmer app.' rows={log.slice().reverse().map(c=>{ const f = state.farmers.find(x=>x.id===c.farmerId); return <tr key={c.id}><td>{fmtTime(c.createdAt)}</td><td>{f?f.name:'-'}</td><td>{(LANGUAGES.find(l=>l.code===c.lang)||{}).label}</td><td className="cap">{c.intent}</td></tr>; })}/></Panel>
    </div>
  );
}

function AdminFPO(){
  const { state, dispatch, session } = useApp();
  const editable = canEdit(session.adminRole,'fpo'); const actor = roleOf(session.adminRole)?.label;
  const pooled = state.orders.filter(o=>o.pooled);
  return (
    <div className="col gap16">
      {pooled.length===0 && <Panel title="Virtual FPO pools" badge={!editable&&RO}><p className="muted">No pooled orders yet. They form automatically when one farm cannot fill a bulk order alone. Try ordering 600 kg of tomato as a buyer.</p></Panel>}
      {pooled.map(o=>(
        <Panel key={o.id} title={`${o.qtyMatched} kg ${cropName(o.cropId,'en')} to ${o.buyerLabel}`} right={<StatusPill status={o.status}/>}>
          <div className="row gap8 wrap">{o.allocations.map(a=>{ const f = state.farmers.find(x=>x.id===a.farmerId); return <span key={a.listingId} className="pool-chip"><Avatar name={f?f.name:'?'} tone="green" size={26}/>{f&&f.name}<b>{a.qty} kg</b></span>; })}</div>
          {editable && <div className="row gap8" style={{marginTop:14}}><Btn kind="soft" size="sm" icon="layers" onClick={()=>dispatch({type:'ADMIN_FPO_ACTION',action:'merge',orderId:o.id,actor})}>Merge</Btn><Btn kind="ghost" size="sm" onClick={()=>dispatch({type:'ADMIN_FPO_ACTION',action:'split',orderId:o.id,actor})}>Split</Btn></div>}
        </Panel>))}
    </div>
  );
}

function AdminResidue(){
  const { state, dispatch, session } = useApp();
  const editable = canEdit(session.adminRole,'residue'); const actor = roleOf(session.adminRole)?.label;
  const pending = state.industrialBuyers.filter(x=>indState(x)==='pending'); const decidedIb = state.industrialBuyers.filter(x=>indState(x)!=='pending');
  return (
    <div className="col gap16">
      <Panel title="Industrial buyer approval" badge={!editable&&RO} flush>
        <DataTable cols={['Business','Type','Region','']} empty="No pending industrial buyers." rows={pending.map(x=><tr key={x.id}><td><b>{x.businessName}</b></td><td>{x.type}</td><td>{x.region}</td><td className="acts"><Approve disabled={!editable} onClick={()=>dispatch({type:'ADMIN_APPROVE_INDUSTRIAL',id:x.id,approve:true,actor})}/><Reject disabled={!editable} onClick={()=>dispatch({type:'ADMIN_APPROVE_INDUSTRIAL',id:x.id,approve:false,actor})}/></td></tr>)}/>
      </Panel>
      <Panel title="Industrial buyer decisions" flush>
        <DataTable cols={['Business','Type','Decision','']} empty="No decisions recorded yet." rows={decidedIb.map(x=><tr key={x.id}><td><b>{x.businessName}</b></td><td>{x.type}</td><td><DecisionBadge st={indState(x)}/></td><td className="acts">{editable && <Btn kind="ghost" size="sm" onClick={()=>dispatch({type:'ADMIN_APPROVE_INDUSTRIAL',id:x.id,approve:null,actor})}>Reopen review</Btn>}</td></tr>)}/>
      </Panel>
      <Panel title="Residue listing feed" flush>
        <DataTable cols={['Farmer','Type','Quantity','Matched to']} empty="No residue listed yet." rows={state.residueListings.slice().reverse().map(r=>{ const f = state.farmers.find(x=>x.id===r.farmerId); const b = state.industrialBuyers.find(x=>x.id===r.matchedBuyerId); return <tr key={r.id}><td>{f&&f.name}</td><td>{(RESIDUE_TYPES.find(x=>x.id===r.typeId)||{}).label}</td><td>{r.qty} kg</td><td>{b?b.businessName:<Badge tone="haldi">Unmatched</Badge>}</td></tr>; })}/>
      </Panel>
    </div>
  );
}

function AdminFraud(){
  const { state, dispatch, session } = useApp(); const actor = roleOf(session.adminRole)?.label;
  const open = state.fraudFlags.filter(f=>!f.dismissed);
  return (
    <div className="col gap12">
      {open.map(f=><div key={f.id} className="apanel flag"><span className="astat-ic astat-anar"><Icon name="flag" size={22}/></span><div className="grow"><b className="display">{f.title}</b><p className="muted sm">{f.detail}</p></div><Btn kind="ghost" size="sm" onClick={()=>dispatch({type:'DISMISS_FRAUD_FLAG',id:f.id,actor})}>Dismiss</Btn></div>)}
      {open.length===0 && <Empty art={<Icon name="shield" size={48} stroke={1.4}/>} title="No open flags" body="Nothing unusual to review right now."/>}
    </div>
  );
}

function AdminAudit(){
  const { state } = useApp(); const led = state.orders.filter(o=>o.ledger);
  return (
    <div className="col gap16">
      <Panel title="Immutable audit trail" badge={RO} flush><DataTable cols={['Time','Actor','Action','Detail']} empty="No admin actions logged yet this session." rows={state.auditLog.map(a=><tr key={a.id}><td>{fmtTime(a.createdAt)}</td><td>{a.actor}</td><td><b>{a.action}</b></td><td className="sm">{a.detail}</td></tr>)}/></Panel>
      <Panel title="Price-split audit for every delivered order" flush><DataTable cols={['Order','Buyer total','Farmer','Delivery','Platform','Reconciles']} empty="No settled orders yet." rows={led.map(o=>{ const sum = o.ledger.farmerCut+o.ledger.logisticsCut+o.ledger.platformCut; const ok = Math.abs(sum-o.ledger.buyerTotal)<1; return <tr key={o.id}><td className="mono">{o.id.slice(-6)}</td><td>{fmtMoney(o.ledger.buyerTotal)}</td><td>{fmtMoney(o.ledger.farmerCut)}</td><td>{fmtMoney(o.ledger.logisticsCut)}</td><td>{fmtMoney(o.ledger.platformCut)}</td><td>{ok?<Badge tone="green" icon="check">Yes</Badge>:<Badge tone="anar" icon="x">No</Badge>}</td></tr>; })}/></Panel>
    </div>
  );
}


function parseCSV(text){
  const rows=[]; let cur=[], f='', q=false;
  for(let i=0;i<text.length;i++){ const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){ f+='"'; i++; } else q=false; } else f+=c; }
    else if(c==='"') q=true; else if(c===','){ cur.push(f); f=''; }
    else if(c==='\n'||c==='\r'){ if(c==='\r'&&text[i+1]==='\n') i++; cur.push(f); f=''; if(cur.some(x=>x.trim())) rows.push(cur); cur=[]; }
    else f+=c; }
  cur.push(f); if(cur.some(x=>x.trim())) rows.push(cur);
  const head=(rows.shift()||[]).map(h=>h.trim().toLowerCase());
  return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]||'').trim()])));
}
function AdminActivity(){
  const [logs, setLogs] = useState(null); const [users, setUsers] = useState([]); const [err, setErr] = useState('');
  const load = async ()=>{ const a = await authApi('/api/admin/logs?limit=60'); const u = await authApi('/api/admin/users'); if(a.ok) setLogs(a.logs); else setErr(a.error||'Could not load logs'); if(u.ok) setUsers(u.users); };
  useEffect(()=>{ load(); }, []);
  const toggle = async (x)=>{ await authApi('/api/admin/users/status', { id:x.id, status: x.status==='active'?'blocked':'active' }); load(); };
  return (<>
    <Panel title={'Registered users ('+users.length+')'}>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Name</th><th>Portal</th><th>Mobile</th><th>Status</th><th></th></tr></thead><tbody>{users.slice(0,50).map(x=><tr key={x.id}><td>{x.name}</td><td>{AUTH_ROLES[x.role]?AUTH_ROLES[x.role].title:x.role}</td><td>{x.mobile}</td><td>{x.status}</td><td>{x.role!=='admin' && <button className="link-btn" onClick={()=>toggle(x)}>{x.status==='active'?'Block':'Unblock'}</button>}</td></tr>)}</tbody></table></div>
    </Panel>
    <Panel title="Server activity log (MongoDB / Redis)">
      {err && <p className="sm" style={{color:'#B3261E'}}>{err}</p>}
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Time</th><th>Event</th><th>Portal</th><th>IP</th></tr></thead><tbody>{(logs||[]).map((l,i)=><tr key={i}><td>{new Date(l.ts).toLocaleString()}</td><td>{l.event}{l.level!=='info' ? ' ('+l.level+')' : ''}</td><td>{l.role||''}</td><td>{l.ip||''}</td></tr>)}</tbody></table></div>
      <button className="link-btn" onClick={load}>Refresh</button>
    </Panel></>);
}
function AdminData(){
  const { state, dispatch } = useApp();
  const [kind, setKind] = useState('farmers'); const [msg, setMsg] = useState('');
  const cols = { farmers:'name, phone, district, village, acres, lang', buyers:'name, type, district, contact, phone, window', drivers:'name, phone, vehicle, district' };
  const seedN = state.farmers.filter(f=>['f1','f2','f3','f4','f5'].includes(f.id)).length;
  async function onFile(e){ const f=e.target.files&&e.target.files[0]; e.target.value=''; if(!f) return; const rows=parseCSV(await f.text()); dispatch({ type:'IMPORT_ROWS', kind, rows }); setMsg(rows.length+' rows read from '+f.name); }
  return (
    <div className="col gap14">
      <AdminActivity/>
      <Panel title="Live data status">
        <div className="col gap8 sm">
          <div>Shared database: <b>{(window.KISAN_API!=null||location.protocol!=='file:') ? 'connected to server' : 'server at localhost:8787 (run npm start)'}</b></div>
          <div>Farmers <b>{state.farmers.length}</b> · Bulk buyers <b>{state.buyers.length+state.industrialBuyers.length}</b> · Delivery partners <b>{(state.drivers||[]).length}</b> · Listings <b>{state.listings.length}</b></div>
          <div>Mandi prices: <b>{Object.keys(LIVE.crops).length ? ('live from '+(LIVE.source||'a government source')+', '+Object.keys(LIVE.crops).length+' crops') : 'not live'}</b></div>
          {(LIVE.attempts||[]).map(a=><div key={a.source} className="muted">- {a.source}: {a.error}</div>)}
          <div><button className="link-btn" onClick={()=>{ fetch(API_BASE+'/api/mandi?refresh=1').then(()=>loadLivePrices()); }}>Refresh prices now</button></div>
        </div>
      </Panel>
      <Panel title="Import real records (CSV)">
        <p className="sm muted">Upload a CSV with a header row. Columns for {kind}: <b>{cols[kind]}</b></p>
        <div className="seg" style={{margin:'10px 0'}}>{['farmers','buyers','drivers'].map(k=><button key={k} className={cx(kind===k&&'on')} onClick={()=>setKind(k)}>{k==='drivers'?'Delivery partners':k==='buyers'?'Bulk buyers':'Farmers'}</button>)}</div>
        <label className="btn btn-primary" style={{cursor:'pointer'}}><Icon name="upload" size={16}/> Choose CSV<input type="file" accept=".csv,text/csv" hidden onChange={onFile}/></label>
        {msg && <p className="sm" style={{marginTop:8}}>{msg}</p>}
      </Panel>
      <Panel title="Mandi prices from a CSV (works without any API)">
        <p className="sm muted">Download the daily price report from agmarknet.gov.in or data.gov.in as CSV and upload it. Columns: state, district, market, commodity, variety, arrival_date, min_price, max_price, modal_price (Rs per quintal).</p>
        <label className="btn btn-primary" style={{cursor:'pointer',marginTop:8}}><Icon name="upload" size={16}/> Upload price CSV<input type="file" accept=".csv,text/csv" hidden onChange={async e=>{ const f=e.target.files&&e.target.files[0]; e.target.value=''; if(!f) return; const rows=parseCSV((await f.text()).replace(/^\uFEFF/,'')); const r=await fetch(API_BASE+'/api/mandi/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows})}).then(x=>x.json()).catch(()=>({ok:false,error:'server not reachable'})); setMsg(r.ok?('Prices loaded for '+r.crops+' crops'):('Could not use this file: '+r.error)); loadLivePrices(); }}/></label>
      </Panel>
      <Panel title="Starter records">
        <p className="sm muted">The starter dataset pre-populates marketplace workflows. Import verified records before operating the marketplace with real customers.</p>
        <Btn kind="ghost" icon="x" onClick={()=>{ if(confirm('Remove the built-in starter records?')) dispatch({ type:'CLEAR_SAMPLE' }); }}>Remove starter records</Btn>
      </Panel>
    </div>);
}

const ADMIN_NAV = [
  { key:'overview', label:'Overview', icon:'chart' }, { key:'verification', label:'Verification', icon:'shield' }, { key:'glut', label:'Glut and routes', icon:'trend' },
  { key:'escrow', label:'Escrow ledger', icon:'lock' }, { key:'voicebot', label:'Voice line', icon:'mic' }, { key:'fpo', label:'Virtual FPO pools', icon:'layers' },
  { key:'residue', label:'Residue desk', icon:'residue' }, { key:'fraud', label:'Fraud flags', icon:'flag' }, { key:'audit', label:'Audit log', icon:'clipboard' }, { key:'data', label:'Data management', icon:'upload' },
];
const ADMIN_SECTIONS = { data:AdminData, overview:AdminOverview, verification:AdminVerification, glut:AdminGlutRoutes, escrow:AdminEscrow, voicebot:AdminVoiceBot, fpo:AdminFPO, residue:AdminResidue, fraud:AdminFraud, audit:AdminAudit };

function AdminShell(){
  const { state, session, setSession } = useApp();
  const [navOpen, setNavOpen] = useState(false);
  const role = roleOf(session.adminRole);
  const nav = ADMIN_NAV.filter(n=>canView(session.adminRole, n.key));
  const screen = nav.find(n=>n.key===session.screen) ? session.screen : nav[0]?.key;
  const Section = ADMIN_SECTIONS[screen] || AdminOverview;
  const flags = state.fraudFlags.filter(f=>!f.dismissed).length;
  return (
    <div className="ashell">
      <div className="browserbar"><Icon name="lock" size={14}/><span>admin.kisansetu.in/{screen}</span><button className="menu-btn" onClick={()=>setNavOpen(o=>!o)} aria-label="Menu"><Icon name="menu" size={20}/></button></div>
      <div className="ashell-body">
        {navOpen && <div className="anav-back" onClick={()=>setNavOpen(false)}></div>}
        <aside className={cx('anav', navOpen&&'open')}>
          <div className="anav-brand"><Logo size={38}/><div><b className="display">Kisan Setu</b><small>Operations</small></div></div>
          <div className="anav-role"><small>Signed in as</small><b><Icon name={role?.icon||'user'} size={16}/>{role?.label}</b></div>
          <nav>{nav.map(n=><button key={n.key} className={cx('anav-item', screen===n.key&&'on')} onClick={()=>{ setSession({screen:n.key}); setNavOpen(false); }}><Icon name={n.icon} size={19}/>{n.label}{n.key==='fraud'&&flags>0 && <em>{flags}</em>}</button>)}</nav>
          <div className="grow"></div>
          <button className="anav-item" onClick={()=>doLogout(setSession,{ screen:'home' })}><Icon name="power" size={19}/>Log out</button>
        </aside>
        <main className="amain">
          <div className="amain-head"><h2 className="display" key={screen}>{nav.find(n=>n.key===screen)?.label}</h2><span className="muted sm">Every action here is written to the audit trail.</span></div>
          <div key={screen} className="astage"><Section/></div>
        </main>
      </div>
      <Toasts/>
    </div>
  );
}
function AdminApp(){
  const { session } = useApp();
  return (session.adminLoggedIn && session.token) ? <AdminShell/> : <><AuthScreen role="admin"/><Toasts/></>;
}
