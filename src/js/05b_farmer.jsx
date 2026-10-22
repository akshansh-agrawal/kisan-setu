/* ============================= FARMER: SELL ============================= */
function PriceBand({ suggested, price }){
  const lo = suggested-2, hi = suggested+3, min = lo-5, max = hi+5;
  const p = (v)=> Math.max(0, Math.min(100, (v-min)/(max-min)*100));
  const p0 = +price || 0;
  const tone = p0>=lo && p0<=hi ? 'ok' : p0<lo ? 'low' : 'high';
  return (
    <div className="band">
      <div className="band-track"><i className="band-zone" style={{ left:p(lo)+'%', width:(p(hi)-p(lo))+'%' }}></i>{p0>0 && <i className={'band-pin '+tone} style={{ left:p(p0)+'%' }}></i>}</div>
      <div className="between sm"><span className="muted">₹{lo}</span><b className={'band-msg '+tone}>{p0<=0 ? 'Set your price' : tone==='ok' ? 'Inside the fair range' : tone==='low' ? 'Below what buyers pay nearby' : 'Above nearby prices, may sell slowly'}</b><span className="muted">₹{hi}</span></div>
    </div>
  );
}
function VoiceListFlow({ lang, onDone }){
  const [step, setStep] = useState(0); const [cropId, setCropId] = useState(null); const [qty, setQty] = useState(null);
  const sug = cropId ? PRICE_BOARD[cropId] : null;
  const q = [
    { hi:'आप क्या बेचना चाहते हैं?', en:'What are you selling?' },
    { hi:`कितने किलो ${cropId?cropName(cropId,'hi'):''}?`, en:'How many kilos?' },
    { hi:`सुझाया गया भाव ₹${sug} प्रति किलो है। ठीक है?`, en:`Suggested price is ₹${sug} per kilo. Is that okay?` },
  ][step];
  return (
    <div className="stagger">
      <div className="bot card">
        <div className="row gap10"><span className="wave"><i></i><i></i><i></i><i></i><i></i></span><b className="display">Voice helper</b></div>
        <div className="bubble" key={step}><p className="bubble-hi" data-lang="hi">{q.hi}</p><p className="bubble-en">{q.en}</p></div>
        <div className="dots">{[0,1,2].map(i=><i key={i} className={i<=step?'on':''}></i>)}</div>
      </div>
      {step===0 && <CropPicker value={cropId} onChange={id=>{ setCropId(id); setStep(1); }} lang={lang}/>}
      {step===1 && <div className="chip-grid">{[100,250,500,750,1000,1500].map(n=><button key={n} className="chip lg" onClick={()=>{ setQty(n); setStep(2); }}>{n} kg</button>)}</div>}
      {step===2 && <Btn kind="primary" size="lg" block icon="check" onClick={()=>onDone({ cropId, qty, price:sug })}>{t('yesConfirm',lang)}</Btn>}
    </div>
  );
}
function ReadinessCard({ farmer }){
  const kyc = kycState(farmer), tr = farmer.trust;
  const steps = [
    ['Identity check', kyc==='approved' ? 'done' : kyc==='rejected' ? 'bad' : 'wait', kyc==='approved'?'Verified':kyc==='rejected'?'Not approved. Contact support.':'In review'],
    ['Soil report uploaded', tr ? 'done' : 'todo', tr ? 'Received' : 'Upload it under Trust score'],
    ['Soil report approved', tr && tr.reviewed && tr.adminApproved===true ? 'done' : tr && tr.reviewed && tr.adminApproved===false ? 'bad' : 'wait', tr && tr.reviewed ? (tr.adminApproved ? 'Approved' : 'Rejected. Please retest.') : 'Waiting for review'],
  ];
  const ready = steps.every(x=>x[1]==='done');
  return (
    <section className={cx('card ready', ready?'ok':'pending')}>
      <div className="between"><b className="card-title" style={{margin:0}}>{ready ? 'Ready to sell' : 'Complete verification to go live'}</b><Badge tone={ready?'green':'haldi'} icon={ready?'check':'clock'}>{ready?'Live':'Pending'}</Badge></div>
      <ul className="steps-list">{steps.map(([l,st,note])=><li key={l} className={st}><span className="sl-ic"><Icon name={st==='done'?'check':st==='bad'?'x':'clock'} size={13} stroke={2.8}/></span><span className="grow"><b>{l}</b><small>{note}</small></span></li>)}</ul>
      {!ready && <p className="fine">Listings you add now are saved, but buyers only see them once all three steps are complete.</p>}
    </section>
  );
}
function MyListings({ farmerId, lang }){
  const { state, dispatch } = useApp();
  const mine = state.listings.filter(l=>l.farmerId===farmerId && l.remainingQty>0);
  if(!mine.length) return null;
  return (
    <div>
      <h2 className="sec-title display">Your active listings</h2>
      <div className="col gap10">{mine.map(l=>(
        <div key={l.id} className="card row gap12 pad"><ListingArt l={l} size={44}/><div className="grow minw0"><b>{cropName(l.cropId,lang)}</b><small className="muted block">{l.remainingQty} kg at ₹{l.price}/kg · {l.region}</small></div>
          <button className="icon-btn" aria-label="Remove listing" onClick={()=>dispatch({ type:'REMOVE_LISTING', id:l.id })}><Icon name="x" size={18}/></button></div>))}</div>
    </div>
  );
}
function FarmerSell(){
  const { state, session, setSession, dispatch } = useApp();
  const farmer = state.farmers.find(f=>f.id===session.farmerId);
  const lang = session.lang;
  const pre = session.prefillCrop && CROPS.some(c=>c.id===session.prefillCrop) ? session.prefillCrop : null;
  const [voiceMode, setVoiceMode] = useState(false);
  const [cropId, setCropId] = useState(pre);
  const [cropPhoto, setCropPhoto] = useState(null);
  const [qty, setQty] = useState('200');
  const [price, setPrice] = useState(pre ? String(PRICE_BOARD[pre]) : '');
  const [harvestDate, setHarvestDate] = useState('');
  const [cultivationCost, setCultivationCost] = useState('');
  const [confirming, setConfirming] = useState(false);
  const { speak, stop, speaking, supported } = useSpeech(lang);
  const sug = cropId ? PRICE_BOARD[cropId] : null;
  const payout = (+qty||0)*(+price||0);
  const suggestedCostPerKg = cropId ? (CROP_COST_PER_KG[cropId]||8) : 8;
  const costPerKg = +cultivationCost>0 ? +cultivationCost : suggestedCostPerKg;
  const estimatedProfit = Math.max(0, payout - ((+qty||0)*costPerKg));
  const sentence = cropId ? `${qty} kg ${cropName(cropId,lang)} · ₹${price}/kg` : '';
  function pick(id){ setCropId(id); setPrice(String(PRICE_BOARD[id])); }
  function submit(){
    dispatch({ type:'ADD_LISTING', farmerId:farmer.id, cropId, qty:+qty, price:+price, cultivationCostPerKg:+cultivationCost||null, harvestDate: harvestDate || 'Within 3 days', photo: cropPhoto });
    stop(); setConfirming(false); setSession({ screen:'home', prefillCrop:null });
  }
  return (
    <Screen>
      <AppTopBar title={t('addCrop',lang)} subtitle={farmer.region} onBack={()=>setSession({screen:'home'})}
        right={<button onClick={()=>setVoiceMode(v=>!v)} className="pill-btn"><Icon name={voiceMode?'menu':'mic'} size={16}/>{voiceMode ? t('typeInstead',lang) : t('speakInstead',lang)}</button>} />
      <div className="page">
        {!voiceMode && (
          <div className="stagger">
            <ReadinessCard farmer={farmer}/>
            <CropPicker value={cropId} onChange={pick} lang={lang}/>
            <section className="card form-card">
              <Field label="Crop photo (live camera or gallery)"><CropPhotoField value={cropPhoto} onChange={setCropPhoto}/></Field>
              <Field label={t('quantity',lang)}><Stepper value={qty} onChange={setQty} step={50} unit="kg" presets={[100,250,500,1000]}/></Field>
              <Field label={t('yourPrice',lang)}>
                <Stepper value={price} onChange={setPrice} step={1} max={999} unit="₹/kg"/>
                {sug && <PriceBand suggested={sug} price={price}/>}
              </Field>
              <Field label={t('harvestDate',lang)}><input className="input" type="date" value={harvestDate} onChange={e=>setHarvestDate(e.target.value)}/></Field>
              <Field label="Your cultivation cost (optional)"><Stepper value={cultivationCost || String(suggestedCostPerKg)} onChange={v=>setCultivationCost(v)} step={1} max={999} unit="₹/kg"/><small className="muted block">Used to estimate your net profit. Default is a planning estimate for this crop; enter your own cost for accuracy.</small></Field>
            </section>
            {payout>0 && <div className="payout"><div><span>Sale value</span><b className="display">₹<Num value={payout} ms={600}/></b></div><div><span>Estimated cultivation cost</span><b>₹{((+qty||0)*costPerKg).toLocaleString('en-IN')}</b></div><div><span>Estimated net profit</span><b className="display">₹{estimatedProfit.toLocaleString('en-IN')}</b></div></div>}
            <Btn kind="primary" size="lg" block iconRight="arrowR" disabled={!cropId||!(+qty)||!(+price)} onClick={()=>setConfirming(true)}>{t('reviewList',lang)}</Btn>
            <MyListings farmerId={farmer.id} lang={lang}/>
          </div>
        )}
        {voiceMode && <VoiceListFlow lang={lang} onDone={d=>{ setCropId(d.cropId); setQty(String(d.qty)); setPrice(String(d.price)); setConfirming(true); }}/>}
      </div>
      <Sheet open={confirming} onClose={()=>{ stop(); setConfirming(false); }} title={t('listenConfirm',lang)}>
        {cropId && <div className="confirm">
          <div className="confirm-art"><CropArt id={cropId} size={88}/></div>
          <p className="confirm-line display" data-lang={lang}>{sentence}</p>
          <div className="muted sm">Sale value <b>₹{payout.toLocaleString('en-IN')}</b> · cultivation cost <b>₹{((+qty||0)*costPerKg).toLocaleString('en-IN')}</b> · estimated profit <b>₹{estimatedProfit.toLocaleString('en-IN')}</b></div>
          {supported && <Btn kind="soft" icon={speaking?'stop':'volume'} onClick={()=> speaking ? stop() : speak(`${qty} ${lang==='en'?'kilo':'किलो'} ${cropName(cropId,lang)}, ${price} ${lang==='en'?'rupees per kilo':'रुपये प्रति किलो'}`)}>{speaking?t('stopListen',lang):t('listen',lang)}</Btn>}
          <div className="row gap10" style={{width:'100%'}}><Btn kind="ghost" block onClick={()=>{ stop(); setConfirming(false); }}>{t('cancel',lang)}</Btn><Btn kind="primary" block icon="check" onClick={submit}>{t('yesConfirm',lang)}</Btn></div>
        </div>}
      </Sheet>
    </Screen>
  );
}

/* ============================= FARMER: SOWING PLAN ============================= */
function FarmerSow(){
  const { state, session, setSession, dispatch } = useApp();
  const farmer = state.farmers.find(f=>f.id===session.farmerId);
  const lang = session.lang;
  const [cropId, setCropId] = useState(null); const [area, setArea] = useState('2'); const [submitted, setSubmitted] = useState(false);
  const breakdown = regionSowingBreakdown(state, farmer.region);
  const max = Math.max(GLUT_SOWING_THRESHOLD, ...breakdown.map(b=>b.count));
  const lowest = breakdown.slice().sort((a,b)=>a.count-b.count)[0];
  const hot = cropId && (state.regionSowingCounts[farmer.region]?.[cropId]||0) >= GLUT_SOWING_THRESHOLD;
  return (
    <Screen>
      <AppTopBar title={t('sowingIntent',lang)} subtitle={`Before you plant · ${farmer.region}`} onBack={()=>setSession({screen:'home'})}/>
      <div className="page stagger">
        {!submitted ? <>
          <p className="lead">Tell us what you plan to grow. If too many neighbours choose the same crop, we warn you before prices fall.</p>
          <CropPicker value={cropId} onChange={setCropId} lang={lang}/>
          <section className="card form-card"><Field label="Area (acres)"><Stepper value={area} onChange={setArea} step={1} min={1} unit="acres"/></Field></section>
          <Btn kind="primary" size="lg" block disabled={!cropId||!(+area)} onClick={()=>{ dispatch({ type:'SUBMIT_SOWING_INTENT', farmerId:farmer.id, cropId, area:+area }); setSubmitted(true); }}>Share my sowing plan</Btn>
        </> : <>
          <div className={cx('result-banner', hot?'bad':'good')}>
            <span className="rb-ic"><Icon name={hot?'alert':'check'} size={26} stroke={2.4}/></span>
            <div><b className="display">{hot ? 'Price-crash warning' : 'Plan recorded'}</b><p>{hot ? `Many farmers near you are planning ${cropName(cropId,'en')}. Consider ${lowest?cropName(lowest.cropId,'en'):'another crop'}, which fewer farmers are growing.` : `You are safely below the oversupply line for ${cropName(cropId,'en')}.`}</p></div>
          </div>
          <section className="card form-card">
            <b className="display">What {farmer.region} is planning</b>
            <div className="col gap12" style={{marginTop:12}}>
              {breakdown.map(b=>(
                <div key={b.cropId}>
                  <div className="between sm"><span className="row gap8"><ListingArt l={b} size={26}/>{cropName(b.cropId,lang)}</span><b>{b.count} farmer{b.count!==1?'s':''}</b></div>
                  <div className="meter"><i className={b.count>=GLUT_SOWING_THRESHOLD?'hot':''} style={{ width:(b.count/max*100)+'%' }}></i><em style={{ left:(GLUT_SOWING_THRESHOLD/max*100)+'%' }}></em></div>
                </div>
              ))}
            </div>
            <p className="fine">The line marks where we start warning farmers ({GLUT_SOWING_THRESHOLD} plans).</p>
          </section>
          <Btn kind="soft" block onClick={()=>setSession({screen:'home'})}>Back to home</Btn>
        </>}
      </div>
    </Screen>
  );
}

/* ============================= FARMER: TRUST SCORE ============================= */
function FarmerTrust(){
  const { state, session, setSession, dispatch } = useApp();
  const farmer = state.farmers.find(f=>f.id===session.farmerId);
  const lang = session.lang;
  const [analyzing, setAnalyzing] = useState(false); const [step, setStep] = useState(0);
  const fileRef = useRef(null);
  useEffect(()=>{ if(!analyzing) return; setStep(0); const id = setInterval(()=>setStep(s=>Math.min(2,s+1)), 750); return ()=>clearInterval(id); }, [analyzing]);
  function upload(){ setAnalyzing(true); setTimeout(()=>{ dispatch({ type:'UPLOAD_SOIL_REPORT', farmerId:farmer.id }); setAnalyzing(false); }, 2300); }
  const trust = farmer.trust;
  const col = trust ? ({safe:'var(--mehendi)',caution:'var(--haldi-deep)',high:'var(--anar)'}[trust.status]) : 'var(--muted)';
  return (
    <Screen>
      <AppTopBar title={t('trustScore',lang)} subtitle="Soil and pesticide report" onBack={()=>setSession({screen:'home'})}/>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={e=>{ if(e.target.files && e.target.files[0]) upload(); e.target.value=''; }}/>
      <div className="page stagger">
        {!trust && !analyzing && (
          <div className="card empty-card">
            <div className="lab-art"><Icon name="flask" size={44} stroke={1.5}/></div>
            <h3 className="display">Show buyers your soil is clean</h3>
            <p>Upload your lab report once. We read the residue values, compare them with government limits and give you a score buyers can trust.</p>
            <Btn kind="primary" size="lg" block icon="upload" onClick={()=>fileRef.current && fileRef.current.click()}>Upload report (photo or PDF)</Btn>
            <button className="link-btn" onClick={upload}>No report handy? View an example</button>
          </div>
        )}
        {analyzing && (
          <div className="card empty-card">
            <div className="lab-art busy"><Icon name="flask" size={44} stroke={1.5}/><div className="scan-beam"></div></div>
            <h3 className="display">Reading your report</h3>
            <div className="col gap8" style={{width:'100%'}}>{['Reading the values','Comparing with government limits','Working out your score'].map((s,i)=>(
              <div key={s} className={cx('scan-step', i<step&&'done', i===step&&'now')}><span className="scan-ic">{i<step?<Icon name="check" size={14} stroke={3}/>:i===step?<i className="spin"></i>:null}</span>{s}</div>))}</div>
          </div>
        )}
        {trust && !analyzing && <>
          <div className="card trust-hero">
            <Ring value={trust.score} size={132} stroke={12} color={col}><b className="display" style={{fontSize:38,color:col}}><Num value={trust.score} ms={1200}/></b><small>out of 100</small></Ring>
            <div className="grow"><TrustBadge trust={trust}/><p>{trust.summary}</p></div>
          </div>
          {!trust.reviewed && <div className="note haldi"><Icon name="clock" size={18}/>A Verification Officer is checking this. Buyers can see it once approved.</div>}
          {trust.reviewed && trust.adminApproved===false && <div className="note anar"><Icon name="alert" size={18}/>Rejected on review. Please retest and upload again.</div>}
          <section className="card form-card">
            <b className="display">Your values against the legal limit</b>
            <div className="col gap14" style={{marginTop:14}}>
              {PESTICIDE_LIMITS.map(p=>{ const v = trust.values[p.key]; const ratio = v/p.limit; const c = ratio>1?'var(--anar)':ratio>.8?'var(--haldi-deep)':'var(--mehendi)';
                return (<div key={p.key}>
                  <div className="between sm"><span>{p.label}</span><b style={{color:c}}>{v} of {p.limit} {p.unit}</b></div>
                  <div className="meter"><i style={{ width:Math.min(100,ratio/1.4*100)+'%', background:c }}></i><em style={{ left:(1/1.4*100)+'%' }}></em></div>
                </div>); })}
            </div>
            <p className="fine">The line is the government limit.</p>
          </section>
          <Btn kind="soft" block icon="upload" onClick={()=>fileRef.current && fileRef.current.click()}>Upload a newer report</Btn>
        </>}
      </div>
    </Screen>
  );
}

/* ============================= FARMER: RESIDUE ============================= */
function FarmerResidue(){
  const { state, session, setSession, dispatch } = useApp();
  const farmer = state.farmers.find(f=>f.id===session.farmerId);
  const lang = session.lang;
  const [typeId, setTypeId] = useState(null); const [qty, setQty] = useState('200');
  const mine = state.residueListings.filter(r=>r.farmerId===farmer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const sel = RESIDUE_TYPES.find(r=>r.id===typeId);
  return (
    <Screen>
      <AppTopBar title={t('residue',lang)} subtitle="Sell it, do not burn it" onBack={()=>setSession({screen:'home'})}/>
      <div className="page stagger">
        <div className="crop-grid cols-3">
          {RESIDUE_TYPES.map(r=>(
            <button key={r.id} className={cx('crop-tile', typeId===r.id&&'on')} onClick={()=>setTypeId(r.id)} style={{'--tint':'var(--anar)','--tint-soft':'var(--anar-soft)'}}>
              <CropArt id={r.id} size={48}/><span>{r.label}</span>{typeId===r.id && <i className="crop-check"><Icon name="check" size={12} stroke={3}/></i>}
            </button>))}
        </div>
        {sel && <div className="match-note"><Icon name="truck" size={18}/>Goes to a <b>{sel.matchLabel}</b></div>}
        <section className="card form-card"><Field label="Quantity (kg)"><Stepper value={qty} onChange={setQty} step={50} unit="kg" presets={[100,200,500,1000]}/></Field></section>
        <Btn kind="primary" size="lg" block disabled={!typeId||!(+qty)} onClick={()=>{ dispatch({ type:'LIST_RESIDUE', farmerId:farmer.id, typeId, qty:+qty }); setTypeId(null); }}>List my residue</Btn>
        {mine.length>0 && <div>
          <h2 className="sec-title display">Your residue listings</h2>
          <div className="col gap10">{mine.map(r=>{ const order = state.orders.find(o=>o.id===r.orderId); const buyer = state.industrialBuyers.find(ib=>ib.id===r.matchedBuyerId); const rt = RESIDUE_TYPES.find(x=>x.id===r.typeId);
            return <div key={r.id} className="card row gap12 pad"><CropArt id={r.typeId} size={44}/><div className="grow minw0"><b>{r.qty} kg {rt&&rt.label}</b><small className="muted block">{buyer ? buyer.businessName : 'Waiting for an approved buyer'}</small></div>{order && <StatusPill status={order.status}/>}</div>; })}</div>
        </div>}
      </div>
    </Screen>
  );
}

/* ============================= FARMER: PAYMENTS ============================= */
function FarmerOrders(){
  const { state, session, setSession } = useApp();
  const farmer = state.farmers.find(f=>f.id===session.farmerId);
  const lang = session.lang;
  const orders = farmerOrdersFor(state, farmer.id);
  const paidTotal = farmer.creditHistory.reduce((s,c)=>s+c.amount,0);
  const cl = creditLabel(farmer.creditHistory.length);
  return (
    <Screen>
      <AppTopBar title={t('payments',lang)} subtitle="Every rupee, every order"/>
      <div className="page stagger">
        <div className="money-hero">
          <div className="mh-glow"></div>
          <small data-lang={lang}>{t('paidSales',lang)}</small>
          <div className="mh-num display">₹<Num value={paidTotal} ms={1300}/></div>
          <div className="row gap8"><Badge tone="haldi" icon="star">Credit history: {cl.label}</Badge><span className="mh-sub">{farmer.creditHistory.length} paid orders</span></div>
        </div>
        {orders.length===0 && <Empty art={<CropArt id="tomato" size={64}/>} title="No orders yet" body="List your produce and a buyer match will appear here." action={<Btn kind="primary" onClick={()=>setSession({screen:'sell'})}>Sell something</Btn>}/>}
        <div className="col gap12">
          {orders.map(o=>{ const my = o.allocations.find(a=>a.farmerId===farmer.id); const art = o.isResidue ? o.cropId : o.cropId; const label = o.isResidue ? (RESIDUE_TYPES.find(r=>r.id===o.cropId)||{}).label : cropName(o.cropId,lang);
            return (
              <div key={o.id} className="card order">
                <div className="row gap12"><CropArt id={art} size={46}/><div className="grow minw0"><b className="display" data-lang={lang}>{my.qty} kg {label}</b><small className="muted block">To {o.buyerLabel}</small></div><StatusPill status={o.status}/></div>
                {o.pooled && <Badge tone="green" icon="layers">Pooled with {o.allocations.length-1} nearby farm{o.allocations.length>2?'s':''} (virtual FPO)</Badge>}
                <OrderProgress status={o.status}/>
                {o.ledger && <LedgerCard ledger={o.ledger}/>}
                {o.status==='awaiting_second_approval' && <div className="note haldi"><Icon name="lock" size={18}/>High-value order. Waiting for a second finance approval before release.</div>}
                {(o.status==='matched'||o.status==='partial') && <div className="muted sm">Waiting for a pickup slot on today's route.</div>}
              </div>);
          })}
        </div>
      </div>
    </Screen>
  );
}

/* ============================= FARMER: VOICE LINE ============================= */
function FarmerCall(){
  const { state, session, setSession, dispatch } = useApp();
  const farmer = state.farmers.find(f=>f.id===session.farmerId);
  const lang = session.lang;
  const [phase, setPhase] = useState('dialing'); const [seconds, setSeconds] = useState(0); const [answer, setAnswer] = useState(null);
  useEffect(()=>{ const tm = setTimeout(()=>setPhase('menu'), 1600); return ()=>clearTimeout(tm); }, []);
  useEffect(()=>{ if(phase==='ended') return; const iv = setInterval(()=>setSeconds(s=>s+1), 1000); return ()=>clearInterval(iv); }, [phase]);
  function pick(intent){
    let text = '';
    if(intent==='prices'){ text = `Today's ${farmer.region} prices: ` + CROPS.slice(0,4).map(c=>`${cropName(c.id,lang)} ₹${PRICE_BOARD[c.id]}/kg`).join(', '); }
    else if(intent==='payment'){ const pending = farmerOrdersFor(state, farmer.id).filter(o=>o.status!=='paid').length; text = pending>0 ? `You have ${pending} order${pending>1?'s':''} waiting. They are paid the same day delivery is confirmed.` : 'You have no pending payments. Every order is settled.'; }
    else text = `To share your sowing plan, open "${t('sowingIntent',lang)}" on the home screen and pick your crop.`;
    setAnswer(text); dispatch({ type:'LOG_VOICE_CALL', farmerId:farmer.id, lang, intent }); setPhase('answer');
  }
  const mm = String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  return (
    <Screen dark className="call">
      <div className="call-top">
        <div className={cx('call-orb', phase==='dialing'&&'ring')}><span></span><span></span><span></span><Logo size={56}/></div>
        <div className="call-status">{phase==='dialing'?'Calling…':phase==='ended'?'Call ended':'Connected'}</div>
        <h2 className="display">1800-KISAN-SETU</h2><div className="call-time">{mm}</div>
      </div>
      <div className="call-card">
        {phase==='dialing' && <p className="center">Connecting to the voice line…</p>}
        {phase==='menu' && <div className="stagger">
          <div className="row gap10"><span className="wave"><i></i><i></i><i></i><i></i><i></i></span><b>Speaking in {(LANGUAGES.find(l=>l.code===lang)||{}).label}</b></div>
          <p className="call-say" data-lang="hi">“नमस्ते! आज के भाव के लिए 1 दबाएँ, भुगतान के लिए 2, बुवाई की योजना के लिए 3।”</p>
          <button className="call-opt" onClick={()=>pick('prices')}><b>1</b>Today's prices</button>
          <button className="call-opt" onClick={()=>pick('payment')}><b>2</b>My payment status</button>
          <button className="call-opt" onClick={()=>pick('sowing')}><b>3</b>What I'm planting</button>
        </div>}
        {phase==='answer' && <div className="stagger"><div className="row gap10"><span className="wave"><i></i><i></i><i></i><i></i><i></i></span><b>Speaking</b></div><p className="call-say">{answer}</p><button className="btn btn-danger btn-block" onClick={()=>setPhase('ended')}><Icon name="phone" size={20}/><span className="btn-label">End call</span></button></div>}
        {phase==='ended' && <div className="stagger"><p className="center">Call logged for quality review.</p><Btn kind="primary" block onClick={()=>setSession({screen:'home'})}>Back to home</Btn></div>}
      </div>
    </Screen>
  );
}

/* ============================= FARMER APP ROOT ============================= */
function FarmerApp(){
  const { session, setSession } = useApp();
  if(!session.farmerId || (!session.token && !session.guest)) return <PhoneShell><AuthScreen role="farmer"/></PhoneShell>;
  const screen = session.screen || 'home'; const lang = session.lang;
  const tabs = [
    { key:'home', icon:'home', label:t('home',lang) },
    { key:'doctor', icon:'doctor', label:t('doctor',lang) },
    { key:'sell', icon:'plus', label:t('addCrop',lang), center:true },
    { key:'orders', icon:'wallet', label:t('payments',lang) },
    { key:'account', icon:'user', label:t('account',lang) },
  ];
  const screens = { home:FarmerHome, sell:FarmerSell, sow:FarmerSow, trust:FarmerTrust, residue:FarmerResidue, orders:FarmerOrders, call:FarmerCall, account:FarmerAccount, doctor:FarmerDoctor, guide:FarmerGuide };
  const S = screens[screen] || FarmerHome;
  const showTabs = ['home','sell','doctor','orders','account'].includes(screen);
  return (
    <PhoneShell>
      <S key={screen}/>
      {showTabs && <TabBar tabs={tabs} active={screen} onChange={k=>setSession({screen:k, prefillCrop:null})}/>}
    </PhoneShell>
  );
}
