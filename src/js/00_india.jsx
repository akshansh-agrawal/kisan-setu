const API_BASE = (typeof window!=='undefined' && window.KISAN_API!=null) ? window.KISAN_API : (location.protocol==='file:' ? 'http://localhost:8787' : '');
/* ---- live government mandi prices (server -> data.gov.in Agmarknet, India) ---- */
const LIVE = { crops:{}, fetchedAt:null, started:false, listeners:new Set() };
async function loadLivePrices(){
  try{
    const r = await fetch(API_BASE+'/api/mandi'); const j = await r.json();
    LIVE.attempts = (j && j.attempts) || []; LIVE.reason = j && j.reason;
    if(j && j.ok && j.crops){
      LIVE.crops = j.crops; LIVE.fetchedAt = j.fetchedAt; LIVE.source = j.source; LIVE.official = !!j.official; LIVE.attempts = j.attempts || [];
      Object.keys(j.crops).forEach(id=>{ PRICE_BOARD[id] = +(j.crops[id].modal/100).toFixed(2); });   // Rs/quintal -> Rs/kg
      LIVE.listeners.forEach(f=>f());
    }
  }catch(e){}
}
function useLivePrices(){
  const [, bump] = useState(0);
  useEffect(()=>{ const f=()=>bump(x=>x+1); LIVE.listeners.add(f);
    if(!LIVE.started){ LIVE.started=true; loadLivePrices(); setInterval(loadLivePrices, 30*60*1000); }
    return ()=>{ LIVE.listeners.delete(f); }; }, []);
  return LIVE;
}
/* ============================= INDIA REFERENCE DATA =============================
   Government reference values (MSP notified by Govt. of India: Kharif 2025-26, Rabi/RMS 2026-27).
   Mandi prices are NOT hard-coded as "live": check Agmarknet / e-NAM. See README "Updating data". */
const IN_STATES = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"];   // 28 states + UTs (regions for sign-up)
// season: k = Kharif, r = Rabi. msp in Rs per quintal (null = no MSP). Government of India notified rates; re-check each season.
const IN_CROPS = [
  { id:'bajra', season:'k', msp:2775 }, { id:'groundnut', season:'k', msp:7263 }, { id:'soybean', season:'k', msp:5328 }, { id:'cotton', season:'k', msp:7710 }, { id:'guar', season:'k', msp:null },
  { id:'wheat', season:'r', msp:2585 }, { id:'mustard', season:'r', msp:6200 }, { id:'gram', season:'r', msp:5875 }, { id:'cumin', season:'r', msp:null },
];
function FarmerGuide(){
  const { session, setSession } = useApp(); const lang = session.lang;
  const [season, setSeason] = useState('all'); const live = useLivePrices();
  const rows = IN_CROPS.filter(c=> season==='all' || c.season===season);
  return (
    <Screen>
      <AppTopBar tone="green" title="India crop and MSP guide" subtitle="Government support prices by crop" onBack={()=>setSession({screen:'home'})}/>
      <div className="page">
        <div className="chip-row" style={{marginBottom:12}}>
          {[['all','★'],['k',tb(89,lang)],['r',tb(90,lang)]].map(([k,l])=><button key={k} className={cx('chip', season===k&&'on')} onClick={()=>setSeason(k)}><span data-lang={lang}>{k==='all'?'All':l}</span></button>)}
        </div>
        <div className="col gap10">
          {rows.map(c=>{ const cr = cropOf(c.id); return (
            <div key={c.id} className="card" style={{padding:14}}>
              <div className="row gap12" style={{alignItems:'center'}}>
                <CropArt id={c.id} size={44}/>
                <div className="grow minw0"><b className="display" data-lang={lang}>{cropName(c.id,lang)}</b><div className="sm muted" data-lang={lang}>{c.season==='k'?tb(89,lang):tb(90,lang)}</div></div>
                <div style={{textAlign:'right'}}><b className="display" style={{fontSize:18}}>{c.msp ? '₹'+c.msp.toLocaleString('en-IN') : '—'}</b><div className="sm muted" data-lang={lang}>{c.msp ? tb(88,lang) : tb(93,lang)}</div></div>
              </div>
              {live.crops[c.id] && <div className="live-line"><i></i>{(LIVE.source||'Live').replace(/ via .*/,'')} · {live.crops[c.id].date} · <b>₹{live.crops[c.id].modal.toLocaleString('en-IN')}/q</b> · {live.crops[c.id].n} mandis (₹{live.crops[c.id].min.toLocaleString('en-IN')}–{live.crops[c.id].max.toLocaleString('en-IN')})</div>}
            </div>); })}
        </div>
        <p className="dx-note" style={{marginTop:14}}><Icon name="info" size={14}/><span data-lang={lang}>{tb(92,lang)}</span></p>
      </div>
    </Screen>
  );
}

/* ---- Riya: voice assistant (Sarvam Samvaad widget), merged into the in-app voice screen ---- */
let _pubCfg = null;
async function getPublicConfig(){ if(_pubCfg) return _pubCfg; try{ _pubCfg = await (await fetch(API_BASE+'/api/config')).json(); }catch(e){ _pubCfg = {}; } return _pubCfg; }
function loadScriptOnce(src){ return new Promise((ok,no)=>{ if(document.querySelector('script[src="'+src+'"]')) return ok(); const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=no; document.head.appendChild(s); }); }
function SarvamCall({ userId, children }){
  const [st, setSt] = useState('loading'); const [cfg, setCfg] = useState(null);
  useEffect(()=>{ let dead=false; (async()=>{
    const c = await getPublicConfig(); if(dead) return;
    if(!c.sarvam){ setSt('off'); return; }
    try{ await loadScriptOnce('https://unpkg.com/sarvam-convai-embed'); if(dead) return; setCfg(c.sarvam); setSt('ready'); }catch(e){ if(!dead) setSt('off'); }
  })(); return ()=>{ dead=true; }; }, []);
  if(st==='ready') return (
    <div className="sarvam-box">
      <div className="sm muted" style={{marginBottom:8}}><b>Riya</b>, your voice assistant: tap Talk to Riya and speak in your language</div>
      {React.createElement('sarvam-widget', { 'api-key':cfg.apiKey, 'app-id':cfg.appId, 'org-id':cfg.orgId, 'workspace-id':cfg.workspaceId, 'user-id':userId||'guest', 'button-text':'Talk to Riya', 'interaction-type':'call', 'background-color':'#ffffff', 'foreground-color':'#17251C', 'accent-color':'#166534' })}
    </div>);
  return (<div style={{width:'100%'}}><div className="riya-tag"><b>Riya</b> · voice assistant</div>{children}</div>);   // not configured / offline -> classic shortcut voice UI
}

/* ---- real crop photos for every crop: Wikipedia page images (CORS-enabled API), cached 7 days on the device ---- */
const WIKI_TITLE = { tomato:'Tomato', onion:'Onion', potato:'Potato', wheat:'Wheat', cauliflower:'Cauliflower', bajra:'Pearl millet', mustard:'Mustard plant', cumin:'Cumin', guar:'Guar', groundnut:'Peanut', gram:'Chickpea', soybean:'Soybean', cotton:'Cotton' };
const CROP_PHOTO = { urls:{}, started:false, listeners:new Set() };
function useCropPhotos(){
  const [, bump] = useState(0);
  useEffect(()=>{
    const f=()=>bump(x=>x+1); CROP_PHOTO.listeners.add(f);
    if(!CROP_PHOTO.started){
      CROP_PHOTO.started = true;
      const cache = loadJSON('kisan_crop_photo_urls_v2', null);
      if(cache && Date.now()-cache.t < 7*864e5) CROP_PHOTO.urls = cache.urls;
      const missing = Object.keys(WIKI_TITLE).filter(id=>!CROP_PHOTO.urls[id]);
      missing.forEach(async id=>{
        try{
          const u = 'https://en.wikipedia.org/w/api.php?action=query&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=900&format=json&origin=*&titles='+encodeURIComponent(WIKI_TITLE[id]);
          const j = await (await fetch(u)).json(); const pg = Object.values((j.query&&j.query.pages)||{})[0];
          if(pg && pg.thumbnail && pg.thumbnail.source){ CROP_PHOTO.urls[id] = pg.thumbnail.source; saveJSON('kisan_crop_photo_urls_v2',{ t:Date.now(), urls:CROP_PHOTO.urls }); CROP_PHOTO.listeners.forEach(fn=>fn()); }
        }catch(e){}
      });
    }
    return ()=>{ CROP_PHOTO.listeners.delete(f); };
  }, []);
  return CROP_PHOTO.urls;
}
function CropPhotoBg({ id, className, fallback }){
  const urls = useCropPhotos(); const [bad, setBad] = useState(false);
  useEffect(()=>setBad(false), [id, urls[id]]);
  if(urls[id] && !bad) return <img key={urls[id]} src={urls[id]} alt="" className={className} onError={()=>setBad(true)}/>;
  return <Photo src={'assets/crops/'+id+'.jpg'} alt="" className={className} fallback={fallback}/>;   // local file (if you add one) -> illustration
}

/* ---- WhatsApp-status style crop stories: real crop photo as full background, auto-advance, tap left/right ---- */
function CropStories({ lang }){
  const live = useLivePrices(); const list = CROPS; const MS = 4000; const urls = useCropPhotos();
  const [i, setI] = useState(0); const [tick, setTick] = useState(0);
  useEffect(()=>{ const t = setTimeout(()=>{ setI(x=>(x+1)%list.length); setTick(k=>k+1); }, MS); return ()=>clearTimeout(t); }, [i, tick]);
  useEffect(()=>{ const n = list[(i+1)%list.length]; if(urls[n.id]){ const im = new Image(); im.src = urls[n.id]; } }, [i, urls]);
  const go = (d)=>{ setI(x=>(x+d+list.length)%list.length); setTick(k=>k+1); };
  const c = list[i]; const price = PRICE_BOARD[c.id]; const lv = live.crops[c.id];
  const fb = <div className="st-fb" style={{background:c.soft||'#E6F3EA'}}><CropArt id={c.id} size={150}/></div>;
  return (
    <section className="stories" aria-label="Crop prices">
      <CropPhotoBg key={c.id} id={c.id} className="st-bg" fallback={fb}/>
      <div className="st-shade"></div>
      <div className="st-bars">{list.map((x,k)=><span key={x.id} className={cx('st-bar', k<i&&'done', k===i&&'run')}><i style={k===i?{animationDuration:MS+'ms'}:undefined} key={k===i?tick:k}></i></span>)}</div>
      <div className="st-info">
        <div className="st-src">{lv ? ((LIVE.source||'Mandi').replace(/ \(.*|\ via .*/,'')+' · '+lv.date+(LIVE.official?' · ✓ Govt. verified':'')) : 'Today'}</div>
        <b className="st-name" data-lang={lang}>{cropName(c.id,lang)}</b>
        <div className="st-price">{price ? '₹'+price : '--'}<small>/kg</small></div>
      </div>
      <button className="st-tap st-prev" aria-label="Previous" onClick={()=>go(-1)}></button>
      <button className="st-tap st-next" aria-label="Next" onClick={()=>go(1)}></button>
    </section>);
}
async function shrinkImage(file, max=520){ const img=await loadImg(await fileToDataURL(file)); const k=Math.min(1,max/Math.max(img.width,img.height)); const cv=document.createElement('canvas'); cv.width=Math.round(img.width*k); cv.height=Math.round(img.height*k); cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height); return cv.toDataURL('image/jpeg',.82); }
function ListingArt({ l, size }){ return l && l.photo ? <img src={l.photo} alt="" style={{width:size,height:size,objectFit:'cover',borderRadius:12}}/> : <CropArt id={l.cropId} size={size}/>; }
function CropPhotoField({ value, onChange }){
  const cam = useRef(null), gal = useRef(null);
  async function pick(e){ const f=e.target.files&&e.target.files[0]; e.target.value=''; if(f){ try{ onChange(await shrinkImage(f)); }catch(err){} } }
  return (
    <div className="cpf">
      {value ? <div className="cpf-prev"><img src={value} alt=""/><button className="cpf-x" onClick={()=>onChange(null)} aria-label="Remove photo">×</button></div> : null}
      <div className="row gap8">
        <Btn kind="primary" icon="camera" onClick={()=>cam.current&&cam.current.click()}>Take live photo</Btn>
        <Btn kind="ghost" icon="upload" onClick={()=>gal.current&&gal.current.click()}>Upload photo</Btn>
      </div>
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={pick}/>
      <input ref={gal} type="file" accept="image/*" hidden onChange={pick}/>
    </div>);
}

/* ---- Auto-translate: any visible English text not covered by the language packs is translated via /api/translate (Gemini), cached ---- */
const AT = { lang:'en', obs:null, nodes:new Map(), attrs:new Map(), pending:new Set(), failed:new Set(), cache:{}, timer:null, busy:false };
const AT_SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|CODE|PRE|INPUT|SELECT|OPTION)$/;
function atEligible(txt){ const t=txt.trim(); return t.length>=2 && /[A-Za-z]{2,}/.test(t) && !/^(https?:|www\.|[\w.+-]+@[\w-]+\.)/.test(t); }
function atScan(){
  const root = document.getElementById('root'); if(!root || AT.lang==='en') return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode:(n)=>{ const p=n.parentElement; if(!p||AT_SKIP.test(p.tagName)||p.closest('[data-lang],[translate="no"],.notranslate')) return NodeFilter.FILTER_REJECT; return atEligible(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT; } });
  const found=[]; let n; while((n=w.nextNode())) found.push(n);
  found.forEach(n=>{ const full=n.nodeValue, key=full.trim(); const rec=AT.nodes.get(n); if(rec && rec.tr===full) return;
    const tr=AT.cache[key]; if(tr){ const lead=full.match(/^\s*/)[0], trail=full.match(/\s*$/)[0]; const val=lead+tr+trail; AT.nodes.set(n,{en:full,tr:val}); n.nodeValue=val; }
    else if(!AT.failed.has(key)) AT.pending.add(key); });
  root.querySelectorAll('[placeholder]').forEach(el=>{ const ph=el.getAttribute('placeholder'); const rec=AT.attrs.get(el); if(rec&&rec.tr===ph) return; if(!atEligible(ph)) return; const tr=AT.cache[ph.trim()]; if(tr){ AT.attrs.set(el,{en:ph,tr}); el.setAttribute('placeholder',tr); } else if(!AT.failed.has(ph.trim())) AT.pending.add(ph.trim()); });
  atFlush();
}
async function atFlush(){
  if(AT.busy || !AT.pending.size) return; AT.busy=true; const lang=AT.lang;
  const batch=[...AT.pending].slice(0,60); batch.forEach(t=>AT.pending.delete(t));
  try{
    const r=await fetch(API_BASE+'/api/translate',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ lang, texts:batch }) }); const j=await r.json();
    if(lang===AT.lang){ batch.forEach(t=>{ if(j.map&&j.map[t]) AT.cache[t]=j.map[t]; else AT.failed.add(t); }); saveJSON('kisan_tr_'+lang, AT.cache); }
  }catch(e){ batch.forEach(t=>AT.failed.add(t)); }
  AT.busy=false; if(lang===AT.lang){ atScan(); }
}
function autoTranslate(lang){
  document.documentElement.lang = lang; document.documentElement.dir = (typeof RTL_LANGS!=='undefined' && RTL_LANGS.includes(lang)) ? 'rtl' : 'ltr';
  // restore English first when switching
  AT.nodes.forEach((rec,n)=>{ if(n.isConnected && n.nodeValue===rec.tr) n.nodeValue=rec.en; }); AT.nodes.clear();
  AT.attrs.forEach((rec,el)=>{ if(el.isConnected) el.setAttribute('placeholder',rec.en); }); AT.attrs.clear();
  AT.lang=lang; AT.pending.clear(); AT.failed.clear(); AT.cache = lang==='en' ? {} : loadJSON('kisan_tr_'+lang,{});
  if(!AT.obs){ AT.obs=new MutationObserver(()=>{ clearTimeout(AT.timer); AT.timer=setTimeout(atScan,160); }); const r=document.getElementById('root'); if(r) AT.obs.observe(r,{ childList:true, subtree:true, characterData:true }); }
  if(lang!=='en') setTimeout(atScan,60);
}
