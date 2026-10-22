/* ============================= PRIMITIVES ============================= */
const cx = (...a)=> a.filter(Boolean).join(' ');

function Btn({ kind='primary', size, block, icon, iconRight, children, className, ...rest }){
  return (
    <button className={cx('btn','btn-'+kind, size&&'btn-'+size, block&&'btn-block', className)} {...rest}>
      {icon && <Icon name={icon} size={size==='sm'?16:20}/>}
      {children!=null && <span className="btn-label">{children}</span>}
      {iconRight && <Icon name={iconRight} size={size==='sm'?15:18}/>}
    </button>
  );
}
function Badge({ tone='soft', icon, children, className }){
  return <span className={cx('badge','badge-'+tone, className)}>{icon && <Icon name={icon} size={13} stroke={2.2}/>}{children}</span>;
}
function Avatar({ name='?', tone='nil', size=44, photo }){
  return <div className={'avatar avatar-'+tone} style={{ width:size, height:size, fontSize:size*0.42 }}>{photo ? <img src={photo} alt="" className="avatar-img"/> : (name||'?').trim()[0]}</div>;
}
function Field({ label, hint, children }){
  return <div className="field"><label className="label">{label}</label>{children}{hint && <div className="hint">{hint}</div>}</div>;
}
function Stepper({ value, onChange, step=10, min=0, max=99999, unit, presets }){
  const n = +value || 0;
  const set = (v)=> onChange(String(Math.max(min, Math.min(max, v))));
  return (
    <div>
      <div className="stepper">
        <button type="button" className="step-btn" onClick={()=>set(n-step)} aria-label="Less"><Icon name="minus" size={22} stroke={2.4}/></button>
        <div className="step-mid"><input inputMode="numeric" value={value} onChange={e=>onChange(e.target.value.replace(/[^\d.]/g,''))} placeholder="0" aria-label="Amount"/>{unit && <span className="step-unit">{unit}</span>}</div>
        <button type="button" className="step-btn" onClick={()=>set(n+step)} aria-label="More"><Icon name="plus" size={22} stroke={2.4}/></button>
      </div>
      {presets && <div className="chip-row" style={{marginTop:10}}>{presets.map(p=><button key={p} type="button" className={cx('chip', n===p&&'on')} onClick={()=>set(p)}>{p}{unit?' '+unit:''}</button>)}</div>}
    </div>
  );
}
function Sheet({ open, onClose, title, children }){
  useEffect(()=>{
    if(!open) return;
    const k = (e)=>{ if(e.key==='Escape') onClose && onClose(); };
    window.addEventListener('keydown', k); return ()=>window.removeEventListener('keydown', k);
  }, [open]);
  if(!open) return null;
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}>
        <div className="sheet-grab"></div>
        {title && <div className="sheet-head"><h3 className="display">{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={20}/></button></div>}
        {children}
      </div>
    </div>
  );
}
function Empty({ art, title, body, action }){
  return (
    <div className="empty">
      <div className="empty-art">{art || <CropArt id="sprout" size={64}/>}</div>
      <div className="empty-title display">{title}</div>
      {body && <div className="empty-body">{body}</div>}
      {action}
    </div>
  );
}
function Toasts(){
  const { state, dispatch } = useApp();
  useEffect(()=>{
    if(state.toasts.length===0) return;
    const timers = state.toasts.map(tt=> setTimeout(()=> dispatch({type:'REMOVE_TOAST', id:tt.id}), 3600));
    return ()=> timers.forEach(clearTimeout);
  }, [state.toasts]);
  return (
    <div className="toast-wrap" aria-live="polite">
      {state.toasts.slice(-2).map(tt=>(
        <div key={tt.id} className="toast"><span className="toast-ic"><Icon name="check" size={16} stroke={2.6}/></span><span>{tt.msg}</span></div>
      ))}
    </div>
  );
}
function SplitBar({ farmerPct, logisticsPct, platformPct }){
  const on = useMountFlag(120);
  return (
    <div className="split-bar">
      <div className="split-seg" style={{ width:(on?farmerPct:0)+'%', background:'var(--mehendi)' }}></div>
      <div className="split-seg" style={{ width:(on?logisticsPct:0)+'%', background:'var(--haldi)', transitionDelay:'.12s' }}></div>
      <div className="split-seg" style={{ width:(on?platformPct:0)+'%', background:'var(--nil-3)', transitionDelay:'.24s' }}></div>
    </div>
  );
}
function LedgerCard({ ledger }){
  if(!ledger) return null;
  const fp = Math.round(ledger.farmerCut/ledger.buyerTotal*100);
  const lp = Math.round(ledger.logisticsCut/ledger.buyerTotal*100);
  const pp = 100-fp-lp;
  const rows = [['var(--mehendi)','Farmer',fp,ledger.farmerCut],['var(--haldi)','Delivery',lp,ledger.logisticsCut],['var(--nil-3)','Kisan Setu',pp,ledger.platformCut]];
  return (
    <div className="ledger">
      <div className="between"><b className="display">Where the money went</b><span className="muted sm">Total {fmtMoney(ledger.buyerTotal)}</span></div>
      <SplitBar farmerPct={fp} logisticsPct={lp} platformPct={pp} />
      {rows.map(([c,l,p,v])=>(
        <div key={l} className="between ledger-row"><span className="row gap8"><i className="dot" style={{background:c}}></i>{l} <span className="muted">{p}%</span></span><b>{fmtMoney(v)}</b></div>
      ))}
      {ledger.logisticsBreakdown && <div className="card pad" style={{marginTop:12,background:'var(--paper)'}}><div className="between"><b>Logistics expense breakdown</b><span className="muted sm">Inside delivery cost</span></div>
        {[['Farm pickup',ledger.logisticsBreakdown.pickup],['Aggregation / sorting',ledger.logisticsBreakdown.aggregation],['Inter-city / route transport',ledger.logisticsBreakdown.transport],['Loading & handling',ledger.logisticsBreakdown.handling],['Last-mile delivery',ledger.logisticsBreakdown.lastMile]].map(([label,value])=><div key={label} className="between ledger-row"><span>{label}</span><b>{fmtMoney(value)}</b></div>)}
      </div>}
      {ledger.farmerProfit!==undefined && <div className="card pad" style={{marginTop:12}}><div className="between"><span>Farmer sale value</span><b>{fmtMoney(ledger.farmerRevenue)}</b></div><div className="between ledger-row"><span>Estimated cultivation cost</span><b>{fmtMoney(ledger.cultivationCost)}</b></div><div className="between ledger-row"><span><b>Estimated net profit</b></span><b>{fmtMoney(ledger.farmerProfit)}</b></div><small className="muted block">Profit uses the farmer-entered cultivation cost when provided; otherwise it uses a crop-level planning estimate.</small></div>}
    </div>
  );
}
function TrustBadge({ trust }){
  if(!trust) return <Badge tone="haldi" icon="clock">Report needed</Badge>;
  if(!trust.reviewed || trust.adminApproved===null || trust.adminApproved===undefined) return <Badge tone="haldi" icon="clock">In review</Badge>;
  if(trust.adminApproved===false || trust.status==='high') return <Badge tone="anar" icon="alert">Needs retest</Badge>;
  if(trust.status==='caution') return <Badge tone="haldi" icon="shield">Trust {trust.score} · Watch</Badge>;
  return <Badge tone="green" icon="shield">Trust {trust.score} · Safe</Badge>;
}
function StatusPill({ status }){
  const map = {
    matched:['Matched','green','check'], partial:['Partly matched','haldi','layers'], picked_up:['Picked up','nil','box'],
    delivered:['Delivered','nil','truck'], awaiting_second_approval:['Awaiting approval','haldi','lock'], paid:['Paid','green','coin'],
  };
  const m = map[status] || [status,'soft','info'];
  return <Badge tone={m[1]} icon={m[2]}>{m[0]}</Badge>;
}

/* order progress: a small bridge of four stops */
const ORDER_STEPS = ['matched','picked_up','delivered','paid'];
function stepIndex(status){
  if(status==='partial') return 0;
  if(status==='awaiting_second_approval') return 2.5;
  const i = ORDER_STEPS.indexOf(status); return i<0?0:i;
}
function OrderProgress({ status }){
  const idx = stepIndex(status);
  const on = useMountFlag(150);
  const steps = [['Matched','check'],['Picked up','box'],['Delivered','truck'],['Paid','coin']];
  return (
    <div className="oprog">
      <div className="oprog-track"><div className="oprog-fill" style={{ width: on ? (Math.min(idx,3)/3*100)+'%' : '0%' }}></div></div>
      {steps.map(([l,ic],i)=>(
        <div key={l} className={cx('oprog-step', idx>=i&&'done', Math.floor(idx)===i && idx<3 && 'now')} style={{ left:(i/3*100)+'%' }}>
          <span className="oprog-node"><Icon name={ic} size={14} stroke={2.4}/></span>
          <span className="oprog-label">{l}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================= CHARTS ============================= */
function Ring({ value=0, size=120, stroke=11, color='var(--mehendi)', track='var(--line)', children, delay=200 }){
  const on = useMountFlag(delay);
  const r = (size-stroke)/2, c = 2*Math.PI*r;
  return (
    <div className="ring" style={{ width:size, height:size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={on ? c*(1-Math.max(0,Math.min(100,value))/100) : c} style={{ transition:'stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)' }}/>
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  );
}
function Sparkline({ data, width=260, height=64, color='#fff', fill='rgba(255,255,255,.14)', dot=true }){
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v,i)=>[ (i/(data.length-1))*(width-8)+4, height-6-((v-min)/(max-min||1))*(height-16) ]);
  const d = pts.map((p,i)=> (i? 'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const smooth = pts.reduce((acc,p,i,a)=>{ if(i===0) return 'M'+p[0]+' '+p[1]; const q=a[i-1]; const mx=(q[0]+p[0])/2; return acc+` C${mx} ${q[1]}, ${mx} ${p[1]}, ${p[0]} ${p[1]}`; }, '');
  const last = pts[pts.length-1];
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{overflow:'visible'}}>
      <path d={smooth+` L${width-4} ${height} L4 ${height}Z`} fill={fill} className="spark-area"/>
      <path d={smooth} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" className="spark-line" pathLength="1"/>
      {dot && <circle cx={last[0]} cy={last[1]} r="5" fill={color} className="spark-dot"/>}
    </svg>
  );
}
function BarChart({ items, height=110, color='var(--nil-2)' }){
  const on = useMountFlag(150);
  const max = Math.max(1, ...items.map(i=>i.value));
  return (
    <div className="bars" style={{ height }}>
      {items.map((it,i)=>(
        <div key={it.label} className="bar-col">
          <div className="bar-val">{it.display}</div>
          <div className="bar-track"><div className="bar" style={{ height: on ? (it.value/max*100)+'%' : '0%', background: it.color||color, transitionDelay:(i*70)+'ms' }}></div></div>
          <div className="bar-label">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
function Donut({ parts, size=132, stroke=18, children }){
  const on = useMountFlag(150);
  const total = parts.reduce((s,p)=>s+p.value,0) || 1;
  const r = (size-stroke)/2, c = 2*Math.PI*r;
  let acc = 0;
  return (
    <div className="ring" style={{ width:size, height:size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke}/>
        {parts.map((p,i)=>{ const len = p.value/total*c; const off = acc; acc += len;
          return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={p.color} strokeWidth={stroke}
            strokeDasharray={`${on?Math.max(0,len-3):0} ${c}`} strokeDashoffset={-off} strokeLinecap="butt" style={{ transition:'stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1) '+(i*.15)+'s' }}/>; })}
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  );
}

/* ============================= PHONE SHELL ============================= */
function StatusClock(){
  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const id = setInterval(()=>setNow(new Date()), 20000); return ()=>clearInterval(id); }, []);
  return <span>{now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>;
}
function PhoneShell({ children, tone }){
  return (
    <div className="stage">
      <div className={cx('app-frame', tone&&'tone-'+tone)}>
        <div className="statusbar" aria-hidden="true"><StatusClock/><span className="notch"></span><span className="sb-icons"><i className="sb-sig"></i><i className="sb-wifi"></i><i className="sb-bat"></i></span></div>
        {children}
        <Toasts />
      </div>
    </div>
  );
}
function Screen({ children, className, dark }){
  return <div className={cx('screen', dark&&'screen-dark', className)}>{children}</div>;
}
function AppTopBar({ title, subtitle, onBack, right, tone }){
  return (
    <header className={cx('topbar', tone&&'topbar-'+tone)}>
      {onBack && <button onClick={onBack} className="icon-btn" aria-label="Back"><Icon name="arrowL" size={22}/></button>}
      <div className="grow minw0"><div className="topbar-title display">{title}</div>{subtitle && <div className="topbar-sub">{subtitle}</div>}</div>
      {right}
    </header>
  );
}
function TabBar({ tabs, active, onChange }){
  return (
    <nav className="tabbar" role="tablist">
      {tabs.map(tb=> tb.center ? (
        <button key={tb.key} role="tab" aria-selected={active===tb.key} className={cx('tab tab-center', active===tb.key&&'on')} onClick={()=>onChange(tb.key)}>
          <span className="fab"><Icon name={tb.icon} size={26} stroke={2}/></span><span className="tab-label">{tb.label}</span>
        </button>
      ) : (
        <button key={tb.key} role="tab" aria-selected={active===tb.key} className={cx('tab', active===tb.key&&'on')} onClick={()=>onChange(tb.key)}>
          <span className="pill"><Icon name={tb.icon} size={22} stroke={active===tb.key?2.1:1.8}/></span><span className="tab-label">{tb.label}</span>
        </button>
      ))}
    </nav>
  );
}
function LangPicker({ value, onChange, dark }){
  const [open, setOpen] = useState(false);
  const cur = LANGUAGES.find(l=>l.code===value) || LANGUAGES[0];
  return (
    <div className="lang">
      <button onClick={()=>setOpen(o=>!o)} className={cx('lang-btn', dark&&'dark')} data-lang={value} aria-haspopup="listbox" aria-expanded={open}>
        <Icon name="globe" size={16}/><span>{cur.label}</span><Icon name="chevD" size={14}/>
      </button>
      {open && <div className="lang-back" onClick={()=>setOpen(false)}></div>}
      {open && (
        <div className="lang-pop" role="listbox">
          {LANGUAGES.map(l=>(
            <button key={l.code} role="option" aria-selected={l.code===value} data-lang={l.code} onClick={()=>{ onChange(l.code); setOpen(false); }} className={cx('lang-item', l.code===value&&'on')}>
              <span>{l.label}</span><small>{l.englishLabel}</small>{l.code===value && <Icon name="check" size={16} stroke={2.4}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function LangGrid({ value, onChange }){
  return (
    <div className="lang-grid">
      {LANGUAGES.map(l=>(
        <button key={l.code} data-lang={l.code} onClick={()=>onChange(l.code)} className={cx('lang-tile', value===l.code&&'on')}>
          <span className="lang-tile-name">{l.label}</span><small>{l.englishLabel}</small>
        </button>
      ))}
    </div>
  );
}
function CropPicker({ value, onChange, lang='en', cols=3 }){
  return (
    <div className={'crop-grid cols-'+cols}>
      {CROPS.map(c=>(
        <button key={c.id} type="button" onClick={()=>onChange(c.id)} className={cx('crop-tile', value===c.id&&'on')} style={{ '--tint':c.tint, '--tint-soft':c.soft }}>
          <CropArt id={c.id} size={44}/>
          <span data-lang={lang}>{cropName(c.id,lang)}</span>
          {value===c.id && <i className="crop-check"><Icon name="check" size={12} stroke={3}/></i>}
        </button>
      ))}
    </div>
  );
}
