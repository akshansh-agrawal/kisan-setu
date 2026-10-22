/* ============================= CROP DOCTOR: OFFLINE ENGINE =============================
   No network, no API. Photo colour analysis (canvas) + farmer-ticked symptoms are scored
   against a India crop-disease knowledge base. All text comes from the language packs. */
const SYMS = ['spots','yellow','powder','rust','wilt','curl','holes','mould','soaked'];   // tb(72+i)
const DIS = {
  wheat_rust:  { crop:'wheat',     n:13, s:25, sev:'urgent', kind:'fungal',   spread:'high',   rc:5, sym:{rust:4,yellow:1,powder:.5},          act:[[42,68],[40,68],[50,70],[49,68]], prev:[53,55,51], care:'F', avoid:[65,66] },
  mustard_alt: { crop:'mustard',   n:14, s:26, sev:'watch',  kind:'fungal',   spread:'medium', rc:7, sym:{spots:3,yellow:1,wilt:.5},           act:[[41,68],[40,68],[48,69],[50,70]], prev:[52,53,56,51], care:'F', avoid:[65,66] },
  mustard_wr:  { crop:'mustard',   n:15, s:27, sev:'watch',  kind:'fungal',   spread:'high',   rc:5, sym:{powder:3,mould:2,curl:1,yellow:1},   act:[[43,68],[40,68],[50,70]],         prev:[52,53,51], care:'F', avoid:[65,66] },
  bajra_dm:    { crop:'bajra',     n:16, s:28, sev:'urgent', kind:'fungal',   spread:'high',   rc:5, sym:{yellow:3,mould:2,curl:1,powder:1},   act:[[40,68],[43,69],[49,69]],         prev:[52,53,55], care:'F', avoid:[66,67] },
  cumin_blight:{ crop:'cumin',     n:17, s:29, sev:'urgent', kind:'fungal',   spread:'high',   rc:4, sym:{spots:3,wilt:2,soaked:1,yellow:1},   act:[[41,68],[40,68],[50,70],[49,68]], prev:[52,53,51,55], care:'F', avoid:[65,66] },
  cumin_pm:    { crop:'cumin',     n:18, s:30, sev:'watch',  kind:'fungal',   spread:'medium', rc:7, sym:{powder:4,yellow:1},                  act:[[44,68],[40,69],[50,70]],         prev:[55,54,53], care:'F', avoid:[65,66] },
  guar_bb:     { crop:'guar',      n:19, s:31, sev:'watch',  kind:'bacterial',spread:'medium', rc:7, sym:{soaked:3,spots:2,wilt:1,yellow:1},   act:[[45,68],[40,68],[50,70]],         prev:[52,53,51], care:'F', avoid:[65,66] },
  gnut_tikka:  { crop:'groundnut', n:20, s:32, sev:'watch',  kind:'fungal',   spread:'medium', rc:7, sym:{spots:4,yellow:2},                   act:[[46,68],[40,69],[50,70]],         prev:[53,51,56], care:'F', avoid:[65,66] },
  cotton_clcv: { crop:'cotton',    n:21, s:33, sev:'urgent', kind:'virus',    spread:'high',   rc:5, sym:{curl:4,yellow:1,holes:.5},           act:[[47,68],[40,68],[49,68],[50,70]], prev:[53,54,55], care:'G', avoid:[66] },
  tomato_eb:   { crop:'tomato',    n:22, s:34, sev:'watch',  kind:'fungal',   spread:'medium', rc:7, sym:{spots:4,yellow:2},                   act:[[40,68],[48,68],[41,69],[50,70]], prev:[51,52,56], care:'F', avoid:[65,66] },
  onion_pb:    { crop:'onion',     n:23, s:35, sev:'urgent', kind:'fungal',   spread:'high',   rc:5, sym:{spots:3,yellow:1,wilt:1},            act:[[41,68],[48,68],[50,70]],         prev:[51,52,53], care:'F', avoid:[65,66] },
  potato_lb:   { crop:'potato',    n:24, s:36, sev:'urgent', kind:'fungal',   spread:'high',   rc:4, sym:{soaked:3,spots:2,mould:2,wilt:1},    act:[[43,68],[40,68],[49,68]],         prev:[52,53,51], care:'F', avoid:[65,66] },
};
function mkDx(id, lang, o){
  o = o || {};
  const cropId = o.cropId || (DIS[id] && DIS[id].crop) || null;
  const base = { isPlant:true, lang, crop: cropId ? cropName(cropId,lang) : '', cropId, stage:'', hot:o.hot||[], offline:true, diseaseId:id, demo:!!o.demo };
  if(id==='healthy'){
    return { ...base, status:'healthy', score:o.score||93, confidence:o.conf||'medium', condition:t('statusHealthy',lang), kind:'healthy', summary:tb(37,lang),
      signs:[], actions:[{when:tb(70,lang), text:tb(50,lang)}], prevention:[tb(54,lang),tb(55,lang)], avoid:'',
      care:{ water:tb(61,lang), sun:tb(62,lang), feed:tb(63,lang), air:tb(64,lang) }, spread:'low', recheck:10, expert:false };
  }
  if(id==='unknown'){
    return { ...base, status:'watch', score:o.score||68, confidence:'low', condition:tb(38,lang), kind:'unknown', summary:tb(39,lang),
      signs:(o.syms||[]).map(k=>tb(72+SYMS.indexOf(k),lang)), actions:[{when:tb(68,lang),text:tb(49,lang)},{when:tb(69,lang),text:tb(48,lang)},{when:tb(70,lang),text:tb(50,lang)}],
      prevention:[tb(54,lang),tb(53,lang)], avoid:tb(66,lang),
      care:{ water:tb(61,lang), sun:tb(62,lang), feed:tb(63,lang), air:tb(64,lang) }, spread:'medium', recheck:3, expert:true };
  }
  const d = DIS[id]; const off = d.care==='G' ? 61 : 57;
  const keys = Object.keys(d.sym); const hit = (o.syms||[]).filter(k=>keys.includes(k));
  const signs = (hit.length ? hit : keys.slice(0,2)).map(k=>tb(72+SYMS.indexOf(k),lang));
  const score = Math.max(25, Math.min(80, (d.sev==='urgent'?46:62) - Math.round((o.damage||0)*40)));
  return { ...base, status:d.sev, score:o.score||score, confidence:o.conf||'medium', condition:tb(d.n,lang), kind:d.kind, summary:tb(d.s,lang), signs,
    actions:d.act.map(([a,w])=>({ when:tb(w,lang), text:tb(a,lang) })), prevention:d.prev.map(i=>tb(i,lang)), avoid:d.avoid.map(i=>tb(i,lang)).join(' '),
    care:{ water:tb(off,lang), sun:tb(off+1,lang), feed:tb(off+2,lang), air:tb(off+3,lang) }, spread:d.spread, recheck:d.rc, expert: d.sev==='urgent' };
}
async function photoFeatures(blob){
  const url = URL.createObjectURL(blob);
  try{
    const img = await loadImg(url);
    const s = 120/Math.max(img.width,img.height); const w=Math.max(8,Math.round(img.width*s)), h=Math.max(8,Math.round(img.height*s));
    const c = document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); x.drawImage(img,0,0,w,h);
    const d = x.getImageData(0,0,w,h).data; const N=w*h;
    let green=0,yellow=0,orange=0,brown=0,white=0;
    for(let i=0;i<d.length;i+=4){
      const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255, mx=Math.max(r,g,b), mn=Math.min(r,g,b), v=mx, sat= mx? (mx-mn)/mx : 0;
      let hu=0; if(mx!==mn){ const df=mx-mn; hu = mx===r ? ((g-b)/df)%6 : mx===g ? (b-r)/df+2 : (r-g)/df+4; hu*=60; if(hu<0) hu+=360; }
      if(sat<.13 && v>.78) white++;
      else if(hu>=62 && hu<=170 && sat>.2 && v>.2) green++;
      else if(hu>=38 && hu<62 && sat>.35 && v>.45) yellow++;
      else if(hu>=12 && hu<38 && sat>.6 && v>.55) orange++;
      else if((hu<45 || hu>340) && ((sat>.25 && v<.55) || v<.18)) brown++;
    }
    const plant = green+yellow+orange+brown;
    return { plantFrac: plant/N, green:green/Math.max(1,plant), yellow:yellow/Math.max(1,plant), orange:orange/Math.max(1,plant), brown:brown/Math.max(1,plant), white:white/Math.max(1,plant+white) };
  } finally { URL.revokeObjectURL(url); }
}
async function analyzeLocal({ blob, cropHint, syms, lang }){
  const f = await photoFeatures(blob);
  if(f.plantFrac < .12) throw { code:'notplant' };
  const user = new Set(syms||[]); const inf = new Set();
  if(f.yellow>.18) inf.add('yellow'); if(f.brown>.08) inf.add('spots'); if(f.orange>.04) inf.add('rust'); if(f.white>.12 && f.green>.2) inf.add('powder');
  const damage = Math.min(1, f.yellow*.6 + f.brown + f.orange);
  const all = new Set([...user, ...inf]);
  const pool = Object.keys(DIS).filter(id=> !cropHint || DIS[id].crop===cropHint);
  let ranked = pool.map(id=>{ let sc=0; all.forEach(k=>{ const w = user.has(k)?1:.5; sc += w*(DIS[id].sym[k]!==undefined ? DIS[id].sym[k] : -.4); }); if(!cropHint) sc-=.5; return {id,sc}; }).sort((a,b)=>b.sc-a.sc);
  const best = ranked[0], second = ranked[1];
  const list = [...all];
  if(!user.size && damage<.06) return mkDx('healthy', lang, { cropId:cropHint, score: Math.round(97-damage*100), conf: damage<.03?'high':'medium' });
  if(!best || best.sc<2) return mkDx('unknown', lang, { cropId:cropHint, syms:list });
  const margin = best.sc-(second?second.sc:0);
  let conf = best.sc>=5 && margin>=2 ? 'high' : best.sc>=3 ? 'medium' : 'low';
  if(!cropHint && conf==='high') conf='medium';
  if(conf==='low') return mkDx('unknown', lang, { cropId:cropHint, syms:list });
  return mkDx(best.id, lang, { syms:list, damage, conf });
}
function sampleDx(id, lang){
  const hot = (DEMO_META[id]||{}).hot || [];
  if(id==='cauliflower') return mkDx('healthy', lang, { cropId:'cauliflower', demo:true, score:93, conf:'high' });
  return mkDx(id==='onion' ? 'onion_pb' : 'tomato_eb', lang, { demo:true, hot, syms:['spots','yellow'], conf:'high' });
}

/* ---- Gemini (via /api/doctor on the server; key never reaches the browser) ---- */
async function askBackend({ blob, lang, region, cropHint, note, signal }){
  const image = await fileToDataURL(blob);
  const tc = new AbortController(); const to = setTimeout(()=>tc.abort(), 90000);
  const onAbort = ()=>tc.abort(); if(signal) signal.addEventListener('abort', onAbort);
  let res;
  try{
    res = await fetch(API_BASE+'/api/doctor', { method:'POST', headers:{'Content-Type':'application/json'}, signal:tc.signal,
      body: JSON.stringify({ image, lang, region, crop:cropHint||'', note:note||'' }) });
  }catch(e){
    if(signal && signal.aborted) throw { code:'cancelled' };
    throw { code: tc.signal.aborted ? 'timeout' : 'unreachable' };
  }finally{ clearTimeout(to); if(signal) signal.removeEventListener('abort', onAbort); }
  const body = await res.json().catch(()=>null);
  if(!res.ok || !body || !body.result){
    const e = body && body.error;
    if(e==='no_key') throw { code:'unavailable' };
    if(e==='image_rejected' || e==='too_large') throw { code:'image_rejected' };
    if(e==='rate_limited') throw { code:'rate_limited' };
    if(!body) throw { code:'unreachable' };
    throw { code:'upstream' };
  }
  return body.result;
}
function normalizeDx(raw, lang){
  const r = raw || {};
  const strs = (a)=> Array.isArray(a) ? a.map(x=>String(x||'').trim()).filter(Boolean).slice(0,6) : [];
  const score = Math.max(0, Math.min(100, Math.round(+r.health_score || 0)));
  const status = ['healthy','watch','urgent'].includes(r.status) ? r.status : (score>=85?'healthy':score>=55?'watch':'urgent');
  const care = r.care || {};
  const actions = (Array.isArray(r.actions)?r.actions:[]).map(a=> typeof a==='string' ? {when:'',text:a} : {when:String((a&&a.when)||''), text:String((a&&a.text)||'')}).filter(a=>a.text).slice(0,6);
  return {
    isPlant: r.is_plant !== false, lang,
    crop: String(r.crop||''), cropId: CROPS.some(c=>c.id===r.crop_id) ? r.crop_id : null, stage: String(r.stage||''),
    status, score, confidence: ['high','medium','low'].includes(r.confidence)?r.confidence:'medium',
    condition: String(r.condition||''), kind: String(r.kind||'unknown'), summary: String(r.summary||''),
    signs: strs(r.signs), actions, prevention: strs(r.prevention), avoid: String(r.avoid||''),
    care: { water:String(care.water||''), sun:String(care.sun_soil||care.sun||''), feed:String(care.feed||''), air:String(care.airflow||care.air||'') },
    spread: ['low','medium','high'].includes(r.spread)?r.spread:'medium', recheck: Math.max(1, Math.min(30, Math.round(+r.recheck_days||7))),
    expert: !!r.expert_needed || status==='urgent', hot:[],
  };
}
// Gemini first. If the server/key/network is unavailable, fall back to the on-device checker so the farmer is never stuck.
async function diagnose({ blob, lang, region, cropHint, syms, signal }){
  try{
    const d = normalizeDx(await askBackend({ blob, lang, region, cropHint, note:'', signal }), lang);
    if(d.isPlant===false) throw { code:'notplant' };
    if(!d.condition && !d.summary) throw { code:'upstream' };
    return d;
  }catch(e){
    if(e && (e.code==='cancelled' || e.code==='notplant' || e.code==='image_rejected')) throw e;
    const d = await analyzeLocal({ blob, cropHint, syms, lang }); d.offline = true; return d;
  }
}
