/* ============================= LOGISTICS APP ============================= */
const LOG_LABEL = { Chomu:'Chomu, Jaipur', Bassi:'Bassi, Jaipur', Phulera:'Phulera, Jaipur', Dudu:'Dudu, Jaipur', Sanganer:'Sanganer, Jaipur' };
function logisticsLocation(stop){ const r = stop && MAP_PTS[stop.region] ? stop.region : 'Chomu'; return { ...MAP_PTS[r], label: LOG_LABEL[r], region:r }; }
function logisticsMapsUrl(stop){ const l = logisticsLocation(stop); return `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}&travelmode=driving`; }
function logisticsWhatsAppUrl(phone, message){
  const d = (phone||'').replace(/\D/g,'');
  const base = d.length>=10 ? `https://wa.me/${d.length===10?'91':''}${d}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(message)}`;
}
function contactFor(state, stop){
  const farmer = stop.farmerId ? state.farmers.find(f=>f.id===stop.farmerId) : null;
  const buyer = stop.buyerId ? [...state.buyers, ...state.industrialBuyers].find(b=>b.id===stop.buyerId) : null;
  const consumer = stop.buyerId ? (state.consumers||[]).find(c=>c.id===stop.buyerId) : null;
  return { name: (farmer&&farmer.name) || (buyer&&(buyer.contact||buyer.businessName)) || (consumer&&consumer.name) || 'Contact', phone: (farmer&&farmer.phone) || (buyer&&buyer.phone) || (consumer&&consumer.phone) || '' };
}

function catmull(pts){
  if(pts.length<2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for(let i=0;i<pts.length-1;i++){
    const p0 = pts[i-1]||pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2]||p2;
    const c1 = [p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6], c2 = [p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
function RouteMap({ stops, activeId, onSelect, height=300 }){
  const W = 400, H = 300;
  const seen = {};
  const pts = stops.map(s=>{ const l = logisticsLocation(s); const [x,y] = projMap(l, W, H); const n = seen[l.region]||0; seen[l.region] = n+1; return [x + n*9, y - n*9]; });
  const hub = projMap(JAIPUR, W, H);
  const doneIdx = stops.reduce((a,s,i)=> s.status==='done' ? i : a, -1);
  const nextIdx = stops.findIndex(s=>s.status!=='done');
  const truckAt = pts[Math.max(0, doneIdx)] || hub;
  const full = catmull(pts), doneD = doneIdx>=1 ? catmull(pts.slice(0, doneIdx+1)) : '';
  return (
    <div className="rmap" style={{height}}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Route map of today's pickups and deliveries">
        <defs><pattern id="rmDots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="var(--nil-3)" fillOpacity=".12"/></pattern></defs>
        <rect width={W} height={H} fill="var(--map-bg)"/><rect width={W} height={H} fill="url(#rmDots)"/>
        <path d="M-10 70C80 40 150 100 240 70S360 40 420 80V-10H-10Z" fill="var(--map-land)"/>
        <path d="M-10 250C90 210 170 270 260 232S370 210 420 240V310H-10Z" fill="var(--map-land)"/>
        <path d="M-10 168C70 150 130 196 210 170S340 150 420 178" stroke="var(--map-river)" strokeWidth="16" fill="none" strokeLinecap="round"/>
        {Object.entries(MAP_PTS).map(([k,p])=>{ const [x,y]=projMap(p,W,H); return <text key={k} x={x} y={y+30} textAnchor="middle" className="rmap-town">{k}</text>; })}
        <g><circle cx={hub[0]} cy={hub[1]} r="9" fill="#D8432F" stroke="#fff" strokeWidth="3"/><text x={hub[0]} y={hub[1]-14} textAnchor="middle" className="rmap-hub">Jaipur</text></g>
        {full && <path d={full} fill="none" stroke="var(--nil-3)" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 9"/>}
        {full && <path d={full} fill="none" stroke="var(--haldi)" strokeWidth="3" strokeLinecap="round" className="rmap-flow"/>}
        {doneD && <path d={doneD} fill="none" stroke="var(--mehendi)" strokeWidth="5" strokeLinecap="round"/>}
        {stops.map((s,i)=>{ const [x,y] = pts[i]; const done = s.status==='done', next = i===nextIdx, isDel = s.kind==='delivery';
          return (
            <g key={s.id} className={cx('rmap-stop', done&&'done', next&&'next', activeId===s.id&&'active')} onClick={()=>onSelect&&onSelect(s)} style={{cursor:onSelect?'pointer':'default'}}>
              {next && <circle cx={x} cy={y} r="18" className="rmap-pulse"/>}
              {isDel ? <rect x={x-11} y={y-11} width="22" height="22" rx="7" className="rmap-node"/> : <circle cx={x} cy={y} r="11" className="rmap-node"/>}
              <text x={x} y={y+4.500} textAnchor="middle" className="rmap-num">{done ? '✓' : i+1}</text>
            </g>);
        })}
        <g className="rmap-truck" style={{ transform:`translate(${truckAt[0]}px, ${truckAt[1]-26}px)` }}>
          <g transform="translate(-14 -9)"><rect width="18" height="12" rx="2.500" fill="#F5B324"/><path d="M18 3h6l4 4v5H18Z" fill="#14532D"/><circle cx="6" cy="13" r="3" fill="#17251C"/><circle cx="22" cy="13" r="3" fill="#17251C"/></g>
        </g>
      </svg>
    </div>
  );
}

function LogisticsShell({ tab, children }){
  const { setSession } = useApp();
  const tabs = [{key:'route',icon:'route',label:'Route'},{key:'map',icon:'map',label:'Map'},{key:'messages',icon:'message',label:'Messages'},{key:'account',icon:'user',label:'Account'}];
  return <PhoneShell tone="nil">{children}<TabBar tabs={tabs} active={tab} onChange={k=>setSession({screen:k, stopId:null})}/></PhoneShell>;
}

function LogisticsOverview(){
  const { state, session, setSession } = useApp();
  const stops = state.todaysRoute.stops;
  const done = stops.filter(s=>s.status==='done').length;
  const next = stops.find(s=>s.status==='pending');
  const progress = stops.length ? Math.round(done/stops.length*100) : 0;
  const nextIdx = stops.findIndex(s=>s.status!=='done');
  const open = (s)=>setSession({screen:'stop', stopId:s.id});
  return (
    <Screen>
      <div className="home-hero nil">
        <div className="hh-glow"></div>
        <div className="row gap12 hh-top">
          <span className="lb-ic sm"><Icon name="truck" size={22}/></span>
          <div className="grow"><small className="row gap6"><i className="live-dot"></i> Fleet connected</small><div className="hh-name display">Today's route</div></div>
          <button className="avatar-btn" aria-label="Account" onClick={()=>setSession({screen:'account'})}><Avatar name={session.driverName||'D'} tone="haldi" size={42} photo={session.driverPhoto}/></button>
        </div>
        <div className="route-hero">
          <Ring value={progress} size={92} stroke={9} color="#FFD25E" track="rgba(255,255,255,.18)"><b className="display" style={{fontSize:24}}><Num value={progress} suffix="%" ms={900}/></b></Ring>
          <div><b className="display" style={{fontSize:22}}>{done} of {stops.length} stops done</b><small className="block">{stops.length-done} remaining, ordered by our route planner</small></div>
        </div>
      </div>
      <div className="page stagger" style={{paddingTop:16}}>
        {next ? (
          <div className="card next-card">
            <div className="between"><span className="muted sm">Next up</span><Badge tone={next.kind==='delivery'?'nil':'haldi'} icon={next.kind==='delivery'?'store':'sprout'}>{next.kind==='delivery'?'Delivery':'Pickup'}</Badge></div>
            <b className="display next-title">{next.label}</b>
            <div className="row gap6 muted sm"><Icon name="pin" size={15}/>{logisticsLocation(next).label}</div>
            <div className="row gap8" style={{marginTop:12}}><Btn kind="primary" block onClick={()=>open(next)}>Open task</Btn><a className="btn btn-soft" href={logisticsMapsUrl(next)} target="_blank" rel="noopener noreferrer"><Icon name="arrowR" size={18}/><span className="btn-label">Navigate</span></a></div>
          </div>
        ) : stops.length ? (
          <div className="card empty-card"><div className="lab-art"><Icon name="check" size={44} stroke={2}/></div><h3 className="display">Route complete</h3><p>Every pickup and delivery is recorded. Payments are on their way to farmers.</p></div>
        ) : (
          <Empty art={<Icon name="truck" size={48} stroke={1.4}/>} title="No route yet" body="Stops appear here when a buyer places an order. Try the Buyer or Shop app."/>
        )}
        {stops.length>0 && <div className="card map-card" onClick={()=>setSession({screen:'map'})} role="button" tabIndex="0"><RouteMap stops={stops} activeId={next&&next.id} height={210}/><div className="map-foot"><b>Route map</b><span className="row gap6 muted sm">Open full map <Icon name="chevR" size={15}/></span></div></div>}
        {stops.length>0 && <section className="card form-card">
          <b className="display">All stops</b>
          <div className="stops">{stops.map((s,i)=>(
            <button key={s.id} className={cx('stop', s.status==='done'?'done':i===nextIdx?'next':'')} onClick={()=>open(s)} style={{'--i':i}}>
              <span className="stop-node">{s.status==='done'?<Icon name="check" size={15} stroke={3}/>:<b>{i+1}</b>}</span>
              <span className="grow minw0"><small className="muted">{s.kind==='delivery'?'Delivery':'Pickup'} · {logisticsLocation(s).region}</small><b className="block trunc">{s.label}</b></span>
              <Icon name="chevR" size={18}/>
            </button>))}</div>
        </section>}
      </div>
    </Screen>
  );
}

function LogisticsMap(){
  const { state, setSession } = useApp();
  const stops = state.todaysRoute.stops; const next = stops.find(s=>s.status==='pending');
  return (
    <Screen>
      <AppTopBar title="Route map" subtitle="Pickup and delivery points"/>
      <div className="page stagger">
        <div className="card map-card big"><RouteMap stops={stops} activeId={next&&next.id} height={330} onSelect={s=>setSession({screen:'stop', stopId:s.id})}/></div>
        <div className="legend"><span><i className="lg lg-pick"></i>Pickup</span><span><i className="lg lg-del"></i>Delivery</span><span><i className="lg lg-next"></i>Next</span><span><i className="lg lg-done"></i>Done</span></div>
        <div className="col gap10">{stops.map((s,i)=>(
          <div key={s.id} className="card row gap12 pad"><span className={cx('stop-node lg', s.status==='done'&&'done')}>{s.status==='done'?<Icon name="check" size={15} stroke={3}/>:<b>{i+1}</b>}</span><div className="grow minw0"><b className="trunc block">{s.label}</b><small className="muted">{logisticsLocation(s).label}</small></div><a className="btn btn-soft btn-sm" href={logisticsMapsUrl(s)} target="_blank" rel="noopener noreferrer">Navigate</a></div>))}
          {stops.length===0 && <Empty art={<Icon name="map" size={44} stroke={1.4}/>} title="Nothing to map yet" body="Stops will appear when orders are placed."/>}
        </div>
      </div>
    </Screen>
  );
}

function LogisticsStop(){
  const { state, session, setSession, dispatch } = useApp();
  const stops = state.todaysRoute.stops; const stop = stops.find(s=>s.id===session.stopId);
  if(!stop) return <Screen><AppTopBar title="Stop" onBack={()=>setSession({screen:'route',stopId:null})}/><Empty title="Stop not found" body="It may have been removed."/></Screen>;
  const order = state.orders.find(o=>o.id===stop.orderId);
  const { name, phone } = contactFor(state, stop); const loc = logisticsLocation(stop);
  const canDeliver = order ? stops.filter(s=>s.orderId===order.id && s.kind==='pickup').every(s=>s.status==='done') : false;
  const msg = `Hello ${name}, this is the Kisan Setu delivery partner. I am on the way for your ${stop.kind==='delivery'?'delivery':'pickup'}${order&&order.cropId?` of ${cropName(order.cropId,'en')}`:''}.`;
  const blocked = stop.status==='done' || (stop.kind==='delivery' && !canDeliver);
  return (
    <Screen>
      <AppTopBar title="Stop details" subtitle={stop.kind==='delivery'?'Delivery task':'Pickup task'} onBack={()=>setSession({screen:'route',stopId:null})}/>
      <div className="page stagger" style={{paddingBottom:96}}>
        <div className={cx('card stop-hero', stop.kind)}>
          <div className="between"><Badge tone={stop.kind==='delivery'?'nil':'haldi'} icon={stop.kind==='delivery'?'store':'sprout'}>{stop.kind==='delivery'?'Destination':'Collection point'}</Badge>{stop.status==='done' && <Badge tone="green" icon="check">Done</Badge>}</div>
          <b className="display" style={{fontSize:24,lineHeight:1.15}}>{stop.label}</b>
          <div className="row gap6 muted sm"><Icon name="pin" size={15}/>{loc.label}</div>
        </div>
        <div className="card map-card"><RouteMap stops={stops} activeId={stop.id} height={190}/></div>
        <div className="qa-row">
          <a className="qa" href={logisticsMapsUrl(stop)} target="_blank" rel="noopener noreferrer"><Icon name="arrowR" size={22}/>Directions</a>
          {phone ? <a className="qa" href={'tel:'+phone.replace(/\s/g,'')}><Icon name="phone" size={22}/>Call</a> : <span className="qa off"><Icon name="phone" size={22}/>Call</span>}
          <a className="qa" href={logisticsWhatsAppUrl(phone,msg)} target="_blank" rel="noopener noreferrer"><Icon name="message" size={22}/>WhatsApp</a>
        </div>
        <div className="card row gap12 pad"><Avatar name={name} tone="nil"/><div className="grow"><b>{name}</b><small className="muted block">{phone || 'Use WhatsApp to reach them'}</small></div></div>
        {stop.kind==='pickup' && <label className="card check-row pad"><input type="checkbox" checked={!!stop.extraStock} onChange={()=>dispatch({type:'TOGGLE_EXTRA_STOCK',stopId:stop.id})}/><span><b>Carry 25% extra</b><small className="muted block">Use spare space for nearby surplus demand.</small></span></label>}
        {stop.kind==='pickup' && stop.extraStock && <Btn kind="soft" block icon="bolt" onClick={()=>dispatch({type:'SELL_SURPLUS_NOW',stopId:stop.id})}>Sell surplus at the roadside</Btn>}
      </div>
      <div className="sticky-cta">
        <Btn kind="primary" size="lg" block icon={stop.status==='done'?'check':'check'} disabled={blocked} onClick={()=>dispatch({type:'MARK_STOP_DONE',stopId:stop.id})}>{stop.status==='done'?'Stop completed':stop.kind==='delivery'&&!canDeliver?'Finish the pickups first':stop.kind==='pickup'?'Confirm pickup':'Confirm delivery'}</Btn>
      </div>
    </Screen>
  );
}

function LogisticsMessages(){
  const { state } = useApp();
  const stops = state.todaysRoute.stops.filter(s=>s.status==='pending');
  return (
    <Screen>
      <AppTopBar title="Messages" subtitle="Tell contacts you are on the way"/>
      <div className="page stagger col gap10">
        {stops.map(s=>{ const { name, phone } = contactFor(state, s); const msg = `Hello ${name}, this is the Kisan Setu delivery partner. I am on the way for your ${s.kind==='delivery'?'delivery':'pickup'}.`;
          return <div key={s.id} className="card row gap12 pad"><Avatar name={name} tone="nil" size={40}/><div className="grow minw0"><b className="trunc block">{name}</b><small className="muted trunc block">{s.kind==='delivery'?'Delivery':'Pickup'} · {s.label}</small></div><a className="btn btn-wa btn-sm" href={logisticsWhatsAppUrl(phone,msg)} target="_blank" rel="noopener noreferrer"><Icon name="message" size={16}/><span className="btn-label">Send</span></a></div>; })}
        {stops.length===0 && <Empty art={<Icon name="message" size={44} stroke={1.4}/>} title="No active messages" body="Contacts appear here as route tasks are assigned."/>}
      </div>
    </Screen>
  );
}

function LogisticsApp(){
  const { session } = useApp();
  if(!session.driverIn || !session.token) return <PhoneShell><AuthScreen role="logistics"/></PhoneShell>;
  const screen = session.screen || 'route';
  if(screen==='account') return <LogisticsShell tab="account"><LogisticsAccount key="acc"/></LogisticsShell>;
  if(screen==='stop') return <PhoneShell tone="nil"><LogisticsStop key="stop"/></PhoneShell>;
  if(screen==='map') return <LogisticsShell tab="map"><LogisticsMap key="map"/></LogisticsShell>;
  if(screen==='messages') return <LogisticsShell tab="messages"><LogisticsMessages key="msg"/></LogisticsShell>;
  return <LogisticsShell tab="route"><LogisticsOverview key="route"/></LogisticsShell>;
}
