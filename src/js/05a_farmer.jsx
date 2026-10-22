/* ============================= FARMER APP: HELPERS ============================= */
function farmerOrdersFor(state, farmerId){
  return state.orders.filter(o=> o.allocations.some(a=>a.farmerId===farmerId)).sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
}
function regionSowingBreakdown(state, region){
  const obj = state.regionSowingCounts[region] || {};
  return CROPS.map(c=> ({ cropId:c.id, count: obj[c.id]||0 })).sort((a,b)=> b.count-a.count);
}
function creditLabel(count){
  if(count>=7) return { label:'Strong', tone:'green' };
  if(count>=3) return { label:'Good', tone:'green' };
  return { label:'Building', tone:'haldi' };
}
function greetKey(){ const hr = new Date().getHours(); return hr<12 ? 'goodMorning' : hr<17 ? 'goodAfternoon' : 'goodEvening'; }
function priceSeries(cropId){
  const base = PRICE_BOARD[cropId] || 15; const rnd = seededRandom('series_'+cropId);
  const out = []; let v = base*0.88;
  for(let i=0;i<9;i++){ v += (rnd()-0.36)*base*0.09; out.push(+v.toFixed(2)); }
  out[out.length-1] = base; return out;
}
function HorizonBanner({ height=170, tone='dawn' }){
  return (
    <div className={'horizon flat '+tone} style={{ height }}>
      <Photo src={'assets/login/'+tone+'.jpg'} alt="" className="hz-photo" fallback={null}/>
    </div>
  );
}

/* ============================= FARMER: LOGIN ============================= */
/* ============================= FARMER: VOICE SHEET ============================= */
function VoiceSheet({ open, onClose, lang, go }){
  const { session } = useApp();
  const cmds = [
    ['sell', t('sell',lang)+': 200 kg '+cropName('tomato',lang), 'sell'],
    ['call', t('callPrices',lang), 'chart'],
    ['orders', t('payments',lang), 'wallet'],
    ['doctor', t('scanNow',lang), 'doctor'],
  ];
  return (
    <Sheet open={open} onClose={onClose} title={t('listening',lang)}>
      <div className="voice">
        <SarvamCall userId={session.farmerId}>
          <div className="voice-orb"><span></span><span></span><Icon name="mic" size={34}/></div>
          <div className="wave big" aria-hidden="true">{Array.from({length:22}).map((_,i)=><i key={i} style={{animationDelay:(i*.07)+'s'}}></i>)}</div>
          <p className="voice-hint" data-lang={lang}>{t('voiceHint',lang)}</p>
        </SarvamCall>
        <div className="col gap8" style={{width:'100%'}}>
          {cmds.map(([k,label,ic])=>(
            <button key={k} className="voice-cmd" onClick={()=>{ onClose(); go(k); }}><span className="tile-ic sm"><Icon name={ic} size={18}/></span><span data-lang={lang}>“{label}”</span><Icon name="chevR" size={18}/></button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/* ============================= FARMER: HOME ============================= */
function FarmerHome(){
  const { state, session, setSession } = useApp();
  const farmer = state.farmers.find(f=>f.id===session.farmerId);
  const lang = session.lang;
  const myListings = state.listings.filter(l=>l.farmerId===farmer.id && l.remainingQty>0);
  const myOrders = farmerOrdersFor(state, farmer.id);
  const pendingPay = myOrders.filter(o=>o.status==='delivered' || o.status==='awaiting_second_approval').length;
  const paidCount = myOrders.filter(o=>o.status==='paid').length + (farmer.creditHistory||[]).length;
  const activeGlutForMe = state.gluts.find(g=> g.active && g.region===farmer.region && myListings.some(l=>l.cropId===g.cropId && !l.flashSale));
  const localSowing = regionSowingBreakdown(state, farmer.region).filter(x=>x.count>0)[0];
  const [crop, setCrop] = useState(myListings[0]?.cropId || 'tomato');
  const [voice, setVoice] = useState(false);
  const live = useLivePrices(); const price = PRICE_BOARD[crop] || 16;
  const series = useMemo(()=>priceSeries(crop), [crop]);
  const delta = Math.round((series[series.length-1]-series[0])/series[0]*100);
  const go = (k)=> setSession({ screen:k });
  const tiles = [
    ['sell','sell',t('sell',lang),t('sellSub',lang),'var(--haldi-deep)','var(--haldi-soft)'],
    ['call','phone',t('callPrices',lang),t('priceSub',lang),'var(--nil-3)','var(--nil-soft)'],
    ['orders','wallet',t('payments',lang),pendingPay? pendingPay+' · '+t('needAttention',lang) : t('paySub',lang),'var(--mehendi)','var(--mehendi-soft)'],
    ['trust','shield',t('trustScore',lang),farmer.trust? farmer.trust.score+'/100' : t('trustSub',lang),'#0F8A83','#DDF3F0'],
    ['residue','residue',t('residue',lang),t('residueSub',lang),'var(--anar)','var(--anar-soft)'],
    ['sow','sprout',t('sowingIntent',lang),t('sowSub',lang),'#7A4FB0','#EEE6F8'],
    ['guide','book','India crop and MSP guide','Government support prices by crop','#2F7D5B','#DDF1E7'],
  ];
  return (
    <Screen>
      <div className="home-hero">
        <div className="hh-glow"></div>
        <div className="row gap12 hh-top">
          <button className="avatar-btn" onClick={()=>setSession({screen:'account'})} aria-label={t('account',lang)}><Avatar name={farmer.name} tone="haldi" size={46} photo={farmer.photo}/></button>
          <div className="grow minw0"><small data-lang={lang}>{t(greetKey(),lang)} · {farmer.region}</small><div className="hh-name display" data-lang={lang}>{farmer.name}</div></div>
          <LangPicker value={lang} onChange={v=>setSession({lang:v})} dark/>
        </div>
        {kycState(farmer)==='pending' && <div className="hh-note"><Icon name="clock" size={16}/> Identity verification is in progress. Buyers see your listings once it is complete.</div>}
        {kycState(farmer)==='rejected' && <div className="hh-note bad"><Icon name="alert" size={16}/> Your identity check was not approved. Please contact Kisan Setu support to resubmit.</div>}
        <CropStories lang={lang}/>
      </div>

      <div className="page stagger" style={{paddingTop:16}}>
      <button className="doc-promo" onClick={()=>go('doctor')}>
          <div className="dp-art" aria-hidden="true"><div className="dp-leaf"><Icon name="leaf" size={46} stroke={1.5}/></div><i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i><div className="scan-beam"></div></div>
          <div className="grow"><span className="dp-new"><Icon name="sparkle" size={12} stroke={2.4}/>{t('isNew',lang)}</span><h3 className="display" data-lang={lang}>{t('doctorHeadline',lang)}</h3><p data-lang={lang}>{t('doctorPromo',lang)}</p><span className="dp-btn"><Icon name="camera" size={17}/><span data-lang={lang}>{t('scanNow',lang)}</span></span></div>
        </button>

        {activeGlutForMe && (
          <div className="alert-card">
            <span className="tile-ic" style={{'--c':'var(--anar)','--bg':'#fff'}}><Icon name="trend" size={22}/></span>
            <div className="grow"><b>Too much {cropName(activeGlutForMe.cropId,'en')} nearby</b><p>A flash sale can move your stock before it spoils. Buyers and shoppers in {farmer.region} are being told.</p><Btn kind="primary" size="sm" onClick={()=>go('sell')}>List a flash sale</Btn></div>
          </div>
        )}

        <div>
          <h2 className="sec-title display" data-lang={lang}>{t('whatToday',lang)}</h2>
          <div className="tiles">
            {tiles.map(([k,ic,label,sub,c,bg])=>(
              <button key={k} className="tile" onClick={()=>go(k)} style={{'--c':c,'--bg':bg}}>
                <span className="tile-ic"><Icon name={ic} size={24}/></span>
                <b className="display" data-lang={lang}>{label}</b><small data-lang={lang}>{sub}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="tip-card">
          <span className="tip-sun"><Icon name="sun" size={26}/></span>
          <div><b className="display" data-lang={lang}>{t('todayTip',lang)}</b><p data-lang={lang}>{t('tipBody',lang)}</p></div>
        </div>

        {localSowing && (
          <div className="card sow-card">
            <div className="between"><b className="display">{cropName(localSowing.cropId,'en')} is popular in {farmer.region}</b><ListingArt l={localSowing} size={34}/></div>
            <div className="meter"><i style={{ width: Math.min(100,localSowing.count/GLUT_SOWING_THRESHOLD*100)+'%' }}></i><em style={{left:'100%'}}></em></div>
            <div className="between sm muted"><span>{localSowing.count} farmers plan it</span><span>Price-crash warning at {GLUT_SOWING_THRESHOLD}</span></div>
          </div>
        )}

        <div className="stat-row">
          <div className="stat"><small data-lang={lang}>{t('listings',lang)}</small><b className="display"><Num value={myListings.length}/></b></div>
          <div className="stat"><small data-lang={lang}>{t('payments',lang)}</small><b className="display"><Num value={pendingPay}/></b></div>
          <div className="stat"><small data-lang={lang}>{t('paidSales',lang)}</small><b className="display"><Num value={paidCount}/></b></div>
        </div>
      </div>
      <button className="fab-mic" aria-label="Voice assistant" onClick={()=>setVoice(true)}><i></i><Icon name="mic" size={24}/></button>
      <VoiceSheet open={voice} onClose={()=>setVoice(false)} lang={lang} go={go}/>
    </Screen>
  );
}
