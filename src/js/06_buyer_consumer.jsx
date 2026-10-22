/* ============================= BUYER APP ============================= */
function buyerOrdersFor(state, buyerId){ return state.orders.filter(o=> o.buyerId===buyerId).sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt)); }
function tomorrowStr(){ const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); }
function marketListingsFor(state, cropId){ return state.listings.filter(l=> l.cropId===cropId && l.remainingQty>0 && farmerMarketReady(state,l.farmerId)); }
const orderTotal = (o)=> o.ledger ? o.ledger.buyerTotal : o.qtyMatched*o.buyerPrice;

function BuyerHome(){
  const { state, session, setSession } = useApp();
  const buyer = state.buyers.find(b=>b.id===session.buyerId);
  const orders = buyerOrdersFor(state, buyer.id);
  const spend = orders.reduce((s,o)=> s + orderTotal(o), 0);
  const byMonth = {}; orders.forEach(o=>{ const m = new Date(o.createdAt).toLocaleString('en-IN',{month:'short'}); byMonth[m] = (byMonth[m]||0) + orderTotal(o); });
  const bars = Object.keys(byMonth).map(m=>({ label:m, value:byMonth[m], display:'₹'+Math.round(byMonth[m]/1000*10)/10+'k' }));
  const activeGlut = state.gluts.find(g=> g.active && g.region===buyer.region);
  const active = orders.filter(o=>o.status!=='paid').length;
  return (
    <Screen>
      <div className="home-hero nil">
        <div className="hh-glow"></div>
        <div className="row gap12 hh-top"><button className="avatar-btn" onClick={()=>setSession({screen:'account'})} aria-label="Account"><Avatar name={buyer.businessName} tone="haldi" size={46} photo={buyer.photo}/></button><div className="grow minw0"><small>{buyer.contact} · {buyer.role}</small><div className="hh-name display">{buyer.businessName}</div></div><StatusBadge st={buyerState(buyer)}/></div>
        <div className="hero-stats">
          <div><small>Total spend</small><b className="display">₹<Num value={spend} ms={1200}/></b></div>
          <div><small>Orders</small><b className="display"><Num value={orders.length}/></b></div>
          <div><small>On the way</small><b className="display"><Num value={active}/></b></div>
        </div>
      </div>
      <div className="page stagger" style={{paddingTop:16}}>
        {activeGlut && <div className="alert-card"><span className="tile-ic" style={{'--c':'var(--haldi-deep)','--bg':'#fff'}}><Icon name="bolt" size={22}/></span><div className="grow"><b>Flash deal in {activeGlut.region}</b><p>{cropName(activeGlut.cropId,'en')} is oversupplied, {activeGlut.discountPct}% off while it lasts.</p><Btn kind="primary" size="sm" onClick={()=>setSession({screen:'browse', prefillCrop:activeGlut.cropId})}>See deals</Btn></div></div>}
        <Btn kind="primary" size="lg" block icon="plus" onClick={()=>setSession({screen:'browse'})}>Place a new order</Btn>
        {bars.length>0 && <section className="card form-card"><div className="between"><b className="display">Spend by month</b><small className="muted">including pending</small></div><BarChart items={bars} height={120}/></section>}
        {(buyer.templates||[]).length>0 && <div><h2 className="sec-title display">Reorder in one tap</h2><div className="chip-row">{buyer.templates.map(tp=><button key={tp.id} className="reorder" onClick={()=>setSession({screen:'orders'})}><ListingArt l={tp} size={34}/><span><b>{tp.qty} kg</b><small>{cropName(tp.cropId,'en')} · {tp.cadence}</small></span></button>)}</div></div>}
        <button className="card link-row" onClick={()=>setSession({screen:'orders'})}><span className="tile-ic sm"><Icon name="clipboard" size={18}/></span><span className="grow"><b>Orders and recurring</b><small className="muted block">Track deliveries, download invoices</small></span><Icon name="chevR" size={18}/></button>
      </div>
    </Screen>
  );
}

function BuyerBrowse(){
  const { state, session, setSession, dispatch } = useApp();
  const buyer = state.buyers.find(b=>b.id===session.buyerId);
  const [cropId, setCropId] = useState(session.prefillCrop || null);
  const [qty, setQty] = useState('200'); const [date, setDate] = useState(tomorrowStr());
  const [sortBy, setSortBy] = useState('trust'); const [reviewing, setReviewing] = useState(false); const [saveTemplate, setSaveTemplate] = useState(false);
  const list = cropId ? marketListingsFor(state, cropId) : [];
  const sorted = list.slice().sort((a,b)=>{
    if(sortBy==='trust') return trustScoreOf(state,b.farmerId)-trustScoreOf(state,a.farmerId);
    if(sortBy==='price') return a.price-b.price;
    return (a.region===buyer.region?0:1)-(b.region===buyer.region?0:1);
  });
  const preview = (cropId && +qty>0) ? computeAllocations(state, { cropId, region:buyer.region, qty:+qty, maxFarmers:4 }) : null;
  const avg = preview && preview.qtyMatched ? preview.allocations.reduce((s,a)=>s+a.price*a.qty,0)/preview.qtyMatched : 0;
  const buyerPrice = avg/0.68, total = buyerPrice*(preview?preview.qtyMatched:0);
  function place(){
    dispatch({ type:'PLACE_ORDER', buyerId:buyer.id, cropId, qty:+qty, deliveryWindow: date+' · '+buyer.deliveryWindow });
    if(saveTemplate) dispatch({ type:'SAVE_RECURRING', buyerId:buyer.id, cropId, qty:+qty, deliveryWindow:buyer.deliveryWindow, cadence:'Weekly' });
    setSession({ screen:'orders', prefillCrop:null });
  }
  if(reviewing) return (
    <Screen>
      <AppTopBar title="Review order" onBack={()=>setReviewing(false)}/>
      <div className="page stagger">
        <div className="card order-sum"><CropArt id={cropId} size={64}/><div><b className="display" style={{fontSize:22}}>{qty} kg {cropName(cropId,'en')}</b><small className="muted block">{date} · {buyer.deliveryWindow}</small></div></div>
        {preview && <section className="card form-card">
          <div className="between"><b className="display">Matched supply</b>{preview.allocations.length>1 && <Badge tone="green" icon="layers">Virtual FPO of {preview.allocations.length}</Badge>}</div>
          {preview.qtyMatched < +qty && <div className="note anar" style={{marginTop:10}}><Icon name="alert" size={18}/>Only {preview.qtyMatched} of {qty} kg is available now. The order will be marked partial.</div>}
          <div className="pool">{preview.allocations.map(a=>{ const f = state.farmers.find(x=>x.id===a.farmerId); return <div key={a.listingId} className="pool-row"><Avatar name={f?f.name:'?'} tone="green" size={34}/><div className="grow minw0"><b>{f&&f.name}</b><small className="muted block">{a.region}</small></div><div className="right"><b>{a.qty} kg</b><small className="muted block">₹{a.price}/kg</small></div></div>; })}</div>
          <div className="pool-total"><span>You pay about</span><b className="display">₹<Num value={total} ms={700}/></b></div>
          <SplitBar farmerPct={68} logisticsPct={14} platformPct={18}/>
          <div className="between sm muted"><span>68% farmers</span><span>14% delivery</span><span>18% Kisan Setu</span></div>
        </section>}
        <label className="check-row"><input type="checkbox" checked={saveTemplate} onChange={e=>setSaveTemplate(e.target.checked)}/><span>Repeat this order every week</span></label>
        <Btn kind="primary" size="lg" block icon="check" onClick={place}>Confirm order</Btn>
      </div>
    </Screen>
  );
  return (
    <Screen>
      <AppTopBar title="Place an order" subtitle={buyer.region} onBack={()=>setSession({screen:'home'})}/>
      <div className="page stagger">
        <CropPicker value={cropId} onChange={setCropId}/>
        {cropId && <>
          <div className="seg">{[['trust','Trust'],['price','Price'],['distance','Nearest']].map(([k,l])=><button key={k} className={cx(sortBy===k&&'on')} onClick={()=>setSortBy(k)}>{l}</button>)}</div>
          <div className="col gap10">
            {sorted.length===0 && <Empty art={<CropArt id={cropId} size={60}/>} title="No verified supply yet" body="No verified farmer is listing this crop nearby right now."/>}
            {sorted.map(l=>{ const f = state.farmers.find(x=>x.id===l.farmerId); return (
              <div key={l.id} className="card sup">
                <Avatar name={f.name} tone="green" size={42}/>
                <div className="grow minw0"><b>{f.name}</b><small className="muted block">{l.region}{l.region===buyer.region?' · nearby':''} · {l.remainingQty} kg</small><TrustBadge trust={f.trust}/></div>
                <div className="right"><b className="display" style={{fontSize:20}}>₹{l.price}</b><small className="muted block">per kg</small>{l.flashSale && <Badge tone="haldi" icon="bolt">Flash</Badge>}</div>
              </div>); })}
          </div>
          <section className="card form-card">
            <Field label="Quantity needed"><Stepper value={qty} onChange={setQty} step={50} unit="kg" presets={[100,200,500,1000]}/></Field>
            <Field label="Delivery date (from tomorrow)"><input className="input" type="date" min={tomorrowStr()} value={date} onChange={e=>setDate(e.target.value)}/></Field>
          </section>
          <Btn kind="primary" size="lg" block iconRight="arrowR" disabled={!(+qty>0)} onClick={()=>setReviewing(true)}>Review order</Btn>
        </>}
      </div>
    </Screen>
  );
}

function BuyerOrders(){
  const { state, session, setSession, dispatch } = useApp();
  const buyer = state.buyers.find(b=>b.id===session.buyerId);
  const orders = buyerOrdersFor(state, buyer.id);
  const [tab, setTab] = useState('orders'); const [extraFor, setExtraFor] = useState(null); const [extraQty, setExtraQty] = useState('20'); const [rated, setRated] = useState({});
  const reorder = (tp)=>{ dispatch({ type:'PLACE_ORDER', buyerId:buyer.id, cropId:tp.cropId, qty:tp.qty, deliveryWindow: tomorrowStr()+' · '+tp.deliveryWindow }); setTab('orders'); };
  return (
    <Screen>
      <AppTopBar title="Orders" subtitle={buyer.businessName}/>
      <div className="page stagger">
        <div className="seg"><button className={cx(tab==='orders'&&'on')} onClick={()=>setTab('orders')}>History</button><button className={cx(tab==='templates'&&'on')} onClick={()=>setTab('templates')}>Recurring ({(buyer.templates||[]).length})</button></div>
        {tab==='orders' && <div className="col gap12">
          {orders.length===0 && <Empty art={<Icon name="clipboard" size={44} stroke={1.4}/>} title="No orders yet" body="Place your first order and follow it here." action={<Btn kind="primary" onClick={()=>setSession({screen:'browse'})}>Place an order</Btn>}/>}
          {orders.map(o=>(
            <div key={o.id} className="card order">
              <div className="row gap12"><ListingArt l={o} size={46}/><div className="grow minw0"><b className="display">{o.qtyMatched} kg {cropName(o.cropId,'en')}</b><small className="muted block">{o.deliveryWindow}</small></div><StatusPill status={o.status}/></div>
              {o.pooled && <Badge tone="green" icon="layers">Pooled from {o.allocations.length} farms</Badge>}
              <OrderProgress status={o.status}/>
              {o.ledger && <LedgerCard ledger={o.ledger}/>}
              {(o.status==='matched'||o.status==='partial') && (extraFor===o.id
                ? <div className="row gap8"><div style={{width:130}}><Stepper value={extraQty} onChange={setExtraQty} step={10} unit="kg"/></div><Btn kind="soft" block onClick={()=>{ dispatch({type:'REQUEST_EXTRA_STOCK', orderId:o.id, qty:+extraQty}); setExtraFor(null); }}>Add at +15%</Btn></div>
                : <button className="link-btn" onClick={()=>setExtraFor(o.id)}><Icon name="plus" size={15}/> Need more? Request extra stock</button>)}
              {o.extra.length>0 && <div className="muted sm">Extra requested: {o.extra.map(e=>e.qty+' kg').join(', ')}</div>}
              {o.status==='paid' && !o.isResidue && (rated[o.id]
                ? <div className="note green"><Icon name="star" size={18}/>Thanks for rating {rated[o.id]} stars. It feeds the farmer's trust score.</div>
                : <div className="row gap8"><span className="muted sm">Rate this delivery</span><div className="stars">{[1,2,3,4,5].map(n=><button key={n} className={n<=(rated[o.id]||0)?'on':''} onClick={()=>setRated(r=>({...r,[o.id]:n}))} aria-label={n+' stars'}><Icon name="star" size={24}/></button>)}</div></div>)}
              {o.status==='paid' && <button className="link-btn" onClick={()=>dispatch({type:'TOAST', msg:'Invoice #'+o.id.slice(-5).toUpperCase()+' saved for download.'})}><Icon name="download" size={15}/> Download invoice</button>}
            </div>))}
        </div>}
        {tab==='templates' && <div className="col gap10">
          {(buyer.templates||[]).length===0 && <Empty art={<Icon name="refresh" size={44} stroke={1.4}/>} title="No recurring orders" body="Tick 'Repeat this order every week' when you check out."/>}
          {(buyer.templates||[]).map(tp=><div key={tp.id} className="card row gap12 pad"><ListingArt l={tp} size={44}/><div className="grow"><b>{tp.qty} kg {cropName(tp.cropId,'en')}</b><small className="muted block">{tp.cadence} · {tp.deliveryWindow}</small></div><Btn kind="soft" size="sm" icon="refresh" onClick={()=>reorder(tp)}>Reorder</Btn></div>)}
        </div>}
      </div>
    </Screen>
  );
}

function BuyerApp(){
  const { session, setSession } = useApp();
  if(!session.buyerId || !session.token) return <PhoneShell><AuthScreen role="buyer"/></PhoneShell>;
  const screen = session.screen || 'home';
  const tabs = [{key:'home',icon:'chart',label:'Dashboard'},{key:'browse',icon:'search',label:'Order'},{key:'orders',icon:'clipboard',label:'Orders'},{key:'account',icon:'user',label:'Account'}];
  const screens = { home:BuyerHome, browse:BuyerBrowse, orders:BuyerOrders, account:BuyerAccount };
  const S = screens[screen] || BuyerHome;
  return <PhoneShell tone="nil"><S key={screen}/><TabBar tabs={tabs} active={screens[screen]?screen:'home'} onChange={k=>setSession({screen:k, prefillCrop:null})}/></PhoneShell>;
}

/* ============================= CONSUMER APP ============================= */
function ConsumerBrowse(){
  const { state, session, setSession, dispatch } = useApp();
  const region = session.consumerRegion;
  const [buying, setBuying] = useState(null); const [qty, setQty] = useState('5');
  const all = CROPS.map(c=>({ crop:c, listings: state.listings.filter(l=>l.cropId===c.id && l.remainingQty>0 && farmerMarketReady(state,l.farmerId)) })).filter(x=>x.listings.length>0);
  const activeGlut = state.gluts.find(g=>g.active && g.region===region);
  const youPay = (p)=> Math.round(p/0.68);
  const bc = buying ? all.find(x=>x.crop.id===buying) : null;
  const bestPrice = bc ? youPay(bc.listings.slice().sort((a,b)=>a.price-b.price)[0].price) : 0;
  return (
    <Screen>
      <div className="home-hero peach"><div className="row gap12 hh-top"><span className="lb-ic sm"><Icon name="pin" size={20}/></span><div className="grow"><small>Delivering to</small><div className="hh-name display">{region}</div></div><button className="avatar-btn" onClick={()=>setSession({screen:'account'})} aria-label="Account"><Avatar name={session.consumerName||'?'} tone="haldi" size={40} photo={session.consumerPhoto}/></button></div>
        <h2 className="display shop-title">Hello {session.consumerName}. What is fresh today?</h2></div>
      <div className="page stagger" style={{paddingTop:14}}>
        {activeGlut && <div className="alert-card"><span className="tile-ic" style={{'--c':'var(--haldi-deep)','--bg':'#fff'}}><Icon name="bolt" size={22}/></span><div><b>Flash sale near you</b><p>{cropName(activeGlut.cropId,'en')} is {activeGlut.discountPct}% off in {activeGlut.region}.</p></div></div>}
        <div className="shop-grid">
          {all.map(({crop,listings})=>{ const best = listings.slice().sort((a,b)=>a.price-b.price)[0]; const f = state.farmers.find(x=>x.id===best.farmerId);
            return (<div key={crop.id} className="card shop-card" style={{'--tint':crop.tint,'--tint-soft':crop.soft}}>
              <div className="shop-art"><CropArt id={crop.id} size={76}/>{best.flashSale && <span className="flash"><Icon name="bolt" size={12}/>Flash</span>}</div>
              <b className="display">{crop.name.en}</b>
              <small className="muted">by {f.name.split(' ')[0]} · {best.region}</small>
              <TrustBadge trust={f.trust}/>
              <div className="between"><span className="shop-price display">₹{youPay(best.price)}<small>/kg</small></span><button className="add-btn" onClick={()=>{ setBuying(crop.id); setQty('5'); }} aria-label={'Order '+crop.name.en}><Icon name="plus" size={20} stroke={2.6}/></button></div>
            </div>); })}
        </div>
        {all.length===0 && <Empty art={<CropArt id="tomato" size={64}/>} title="Nothing nearby yet" body="Farmers list fresh produce every day. Check back soon."/>}
      </div>
      <Sheet open={!!buying} onClose={()=>setBuying(null)} title={buying? 'Order '+cropName(buying,'en') : ''}>
        {buying && <div className="confirm">
          <div className="confirm-art"><CropArt id={buying} size={80}/></div>
          <Field label="Quantity (up to 25 kg)"><Stepper value={qty} onChange={v=>setQty(String(Math.min(25,+v||0)))} step={1} min={1} max={25} unit="kg" presets={[2,5,10,25]}/></Field>
          <div className="pool-total" style={{width:'100%'}}><span>You pay about</span><b className="display">₹{Math.round((+qty||0)*bestPrice)}</b></div>
          <p className="muted sm">Rides along the next delivery route to {region}.</p>
          <Btn kind="primary" size="lg" block icon="check" onClick={()=>{ dispatch({type:'CONSUMER_ORDER', cropId:buying, qty:+qty, region}); setBuying(null); }}>Confirm order</Btn>
        </div>}
      </Sheet>
    </Screen>
  );
}
function ConsumerOrders(){
  const { state, session } = useApp();
  const orders = state.orders.filter(o=>o.buyerKind==='consumer' && o.region===session.consumerRegion).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return (
    <Screen><AppTopBar title="My orders"/>
      <div className="page stagger col gap12">
        {orders.length===0 && <Empty art={<Icon name="box" size={44} stroke={1.4}/>} title="No orders yet" body="Orders you place show up here with live status."/>}
        {orders.map(o=><div key={o.id} className="card order"><div className="row gap12"><ListingArt l={o} size={46}/><div className="grow"><b className="display">{o.qtyMatched} kg {cropName(o.cropId,'en')}</b></div><StatusPill status={o.status}/></div><OrderProgress status={o.status}/></div>)}
      </div>
    </Screen>
  );
}
function ConsumerApp(){
  const { session, setSession } = useApp();
  if(!session.consumerName || !session.token) return <PhoneShell><AuthScreen role="consumer"/></PhoneShell>;
  const screen = session.screen || 'home';
  const tabs = [{key:'home',icon:'cart',label:'Shop'},{key:'orders',icon:'box',label:'Orders'},{key:'account',icon:'user',label:'Account'}];
  const screens = { home:ConsumerBrowse, orders:ConsumerOrders, account:ConsumerAccount };
  const S = screens[screen] || ConsumerBrowse;
  return <PhoneShell><S key={screen}/><TabBar tabs={tabs} active={screens[screen]?screen:'home'} onChange={k=>setSession({screen:k})}/></PhoneShell>;
}
