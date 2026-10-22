/* ============================= CROP DOCTOR: ENGINE ============================= */
function fileToDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
function loadImg(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; }); }
async function prepareImage(file){
  const url = await fileToDataURL(file);
  const img = await loadImg(url);
  const draw = (max)=>{ const s = Math.min(1, max/Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.max(1,Math.round(img.width*s)); c.height = Math.max(1,Math.round(img.height*s)); c.getContext('2d').drawImage(img,0,0,c.width,c.height); return c; };
  const big = draw(1280);
  const blob = await new Promise(r=>big.toBlob(r,'image/jpeg',0.86));
  return { blob, preview: draw(900).toDataURL('image/jpeg',0.82), thumb: draw(360).toDataURL('image/jpeg',0.66) };
}

/* ============================= CROP DOCTOR: SMALL PARTS ============================= */
function Corners(){ return <><i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i></>; }
function PhotoFrame({ photo, scanning }){
  return (
    <div className={cx('pframe', scanning&&'scanning')}>
      {photo.sample && !photo.preview ? <SampleLeaf id={photo.sample}/> : <img src={photo.preview} alt="Your crop photo"/>}
      {scanning && <><div className="scan-grid"></div><div className="scan-beam"></div></>}
      <Corners/>
    </div>
  );
}
function ViewfinderArt(){
  return (
    <div className="vf">
      <svg viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="vfBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1B5A2C"/><stop offset="1" stopColor="#2E7D3E"/></linearGradient>
        </defs>
        <rect width="320" height="220" fill="url(#vfBg)"/>
        <g opacity=".14">{Array.from({length:8}).map((_,i)=><circle key={i} cx={(i*61)%320} cy={(i*47)%220} r={20+(i*9)%30} fill="#DFF7C0"/>)}</g>
        <g className="vf-leaf" fill="none" stroke="#DFF7C0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1">
          <path pathLength="1" d="M160 190C110 176 74 132 84 70 92 40 128 26 160 22 192 26 228 40 236 70 246 132 210 176 160 190Z"/>
          <path pathLength="1" d="M160 190V60M160 150 118 118M160 124 200 92M160 96 128 72M160 84 190 64" strokeWidth="2"/>
        </g>
      </svg>
      <Corners/><div className="scan-beam slow"></div>
      <div className="vf-hint"><Icon name="scan" size={16}/> Point at one leaf or fruit</div>
    </div>
  );
}
function Burst(){
  return <div className="burst" aria-hidden="true">{Array.from({length:16}).map((_,i)=><i key={i} style={{ '--a':(i*22.5)+'deg', '--d':(60+(i%4)*26)+'px', animationDelay:(i%5)*40+'ms' }}><Icon name="leaf" size={14+(i%3)*3}/></i>)}</div>;
}
function fmtDay(iso){ try{ return new Date(iso).toLocaleDateString('en-IN',{day:'numeric',month:'short'}); }catch(e){ return ''; } }
const STATUS_TONE = { healthy:'green', watch:'haldi', urgent:'anar' };

function DiagnosisView({ dx, photo, isSample, onAgain, onSell }){
  const L = dx.lang || 'en';
  const { speak, stop, speaking, supported } = useSpeech(L);
  const [copied, setCopied] = useState(false);
  const sc = { healthy:['var(--mehendi)','statusHealthy','check'], watch:['var(--haldi-deep)','statusWatch','eye'], urgent:['var(--anar)','statusUrgent','alert'] }[dx.status] || ['var(--muted)','statusWatch','eye'];
  const cropId = dx.cropId || dx.sampleId || null;
  const readout = [dx.crop, dx.condition, dx.summary, ...dx.actions.slice(0,3).map(a=>(a.when?a.when+'. ':'')+a.text)].filter(Boolean).join('. ');
  const waText = `Crop Doctor: ${dx.crop} - ${dx.condition}\n${t('healthScore',L)}: ${dx.score}/100\n\n${dx.summary}\n\n${dx.actions.slice(0,4).map((a,i)=>`${i+1}. ${a.when?a.when+': ':''}${a.text}`).join('\n')}\n\nKisan Setu`;
  const care = [['drop','water','care.water','var(--sky)','var(--sky-soft)'],['sun','sunSoil','care.sun','var(--haldi-deep)','var(--haldi-soft)'],['sprout','feed','care.feed','var(--mehendi)','var(--mehendi-soft)'],['wind','airflow','care.air','var(--nil-3)','var(--nil-soft)']];
  const careText = (k)=> k.split('.').reduce((o,p)=>o&&o[p], dx);
  return (
    <div className={cx('dx','dx-'+dx.status)}>
      <div className="dx-photo">
        {photo.sample && !photo.preview ? <SampleLeaf id={photo.sample}/> : <img src={photo.preview} alt="Your crop photo"/>}
        {isSample && !hasAsset('assets/samples/'+photo.sample+'.jpg') && (dx.hot||[]).map(([x,y],i)=><i key={i} className="hot" style={{ left:(x/320*100)+'%', top:(y/240*100)+'%', animationDelay:(i*.25)+'s' }}></i>)}
        <div className="dx-photo-grad"></div>
        <div className="dx-photo-cap">
          <span className="dx-chip">{cropId && <CropArt id={cropId} size={20}/>}{dx.crop}{dx.stage ? <em>{dx.stage}</em> : null}</span>
          <h2 className="display" data-lang={L}>{dx.condition}</h2>
        </div>
        {dx.status==='healthy' && <Burst/>}
      </div>

      <div className="dx-score card">
        <Ring value={dx.score} size={104} stroke={10} color={sc[0]} delay={350}>
          <div className="dx-score-n display" style={{color:sc[0]}}><Num value={dx.score} ms={1300} delay={350}/></div><div className="dx-score-s">/100</div>
        </Ring>
        <div className="dx-score-side">
          <div className="dx-status" style={{ background:sc[0] }}><Icon name={sc[2]} size={15} stroke={2.6}/>{t(sc[1],L)}</div>
          <div className="dx-facts">
            <div><span>{t('confidence',L)}</span><b>{t(dx.confidence,L)}</b></div>
            <div><span>{t('spread',L)}</span><b>{t(dx.spread,L)}</b></div>
          </div>
        </div>
      </div>

      <div className="dx-tools">
        {supported && <Btn kind={speaking?'danger':'nil'} icon={speaking?'stop':'volume'} onClick={()=> speaking ? stop() : speak(readout)}>{speaking ? t('stopListen',L) : t('listen',L)}</Btn>}
        <a className="btn btn-wa" href={'https://wa.me/?text='+encodeURIComponent(waText)} target="_blank" rel="noopener noreferrer"><Icon name="share" size={19}/><span className="btn-label">{t('shareWA',L)}</span></a>
      </div>

      <p className="dx-summary" data-lang={L}>{dx.summary}</p>

      {dx.signs.length>0 && (
        <section className="dx-sec">
          <h3 className="display"><Icon name="eye" size={20}/>{t('whatISee',L)}</h3>
          <ul className="dx-signs">{dx.signs.map((s,i)=><li key={i} data-lang={L} style={{'--i':i}}><i></i>{s}</li>)}</ul>
        </section>
      )}

      {dx.actions.length>0 && (
        <section className="dx-sec">
          <h3 className="display"><Icon name="clipboard" size={20}/>{t('doThis',L)}</h3>
          <ol className="dx-steps">{dx.actions.map((a,i)=>(
            <li key={i} style={{'--i':i}}><span className="dx-when" data-lang={L}>{a.when||('#'+(i+1))}</span><p data-lang={L}>{a.text}</p></li>
          ))}</ol>
        </section>
      )}

      <section className="dx-sec">
        <h3 className="display"><Icon name="heart" size={20}/>{t('careGuide',L)}</h3>
        <div className="care-grid">
          {care.map(([ic,lab,key,c,bg],i)=> careText(key) ? (
            <div key={lab} className="care-tile" style={{'--c':c,'--bg':bg,'--i':i}}>
              <span className="care-ic"><Icon name={ic} size={20}/></span><b>{t(lab,L)}</b><p data-lang={L}>{careText(key)}</p>
            </div>) : null)}
        </div>
      </section>

      {dx.prevention.length>0 && (
        <section className="dx-sec">
          <h3 className="display"><Icon name="shield" size={20}/>{t('preventNext',L)}</h3>
          <ul className="dx-prev">{dx.prevention.map((p,i)=><li key={i} data-lang={L}><Icon name="check" size={16} stroke={2.6}/>{p}</li>)}</ul>
        </section>
      )}

      {dx.avoid && <div className="dx-avoid"><Icon name="alert" size={22}/><div><b>{t('dontDo',L)}</b><p data-lang={L}>{dx.avoid}</p></div></div>}

      <div className="dx-recheck"><Icon name="calendar" size={20}/><span data-lang={L}>{t('recheck',L,{n:dx.recheck})}</span></div>

      <a className="expert" href="tel:18001801551">
        <span className="expert-ic"><Icon name="phone" size={22}/></span>
        <span className="grow"><b className="display">{t('askExpert',L)}</b><small>{t('expertSub',L)}</small></span>
        <span className="expert-num">1800-180-1551</span>
      </a>

      <p className="dx-note"><Icon name="info" size={14}/>{dx.offline ? tb(83,L) : tb(97,L)}</p>

      <div className="dx-foot">
        <Btn kind="soft" icon="camera" block onClick={onAgain}>{t('scanAnother',L)}</Btn>
        {dx.status==='healthy' && cropId && <Btn kind="primary" icon="sell" block onClick={onSell}>{t('sell',L)}</Btn>}
      </div>
    </div>
  );
}

/* ============================= CROP DOCTOR: SCREEN ============================= */
function FarmerDoctor(){
  const { state, session, setSession, dispatch } = useApp();
  const farmer = state.farmers.find(f=>f.id===session.farmerId);
  const lang = session.lang;
  const [phase, setPhase] = useState('idle');   // idle | ready | scanning | result | error
  const [photo, setPhoto] = useState(null);
  const [cropHint, setCropHint] = useState(null);
  const [note, setNote] = useState(''); const [syms, setSyms] = useState(()=>new Set());
  const toggleSym = (k)=> setSyms(p=>{ const n=new Set(p); n.has(k)?n.delete(k):n.add(k); return n; });
  const [dx, setDx] = useState(null);
  const [err, setErr] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const ctl = useRef(null); const timers = useRef([]);
  const camRef = useRef(null), galRef = useRef(null);
  const mine = state.scans.filter(s=>s.farmerId===farmer.id);

  useEffect(()=>()=>{ timers.current.forEach(clearTimeout); if(ctl.current) ctl.current.abort(); }, []);
  useEffect(()=>{ if(phase!=='scanning') return; setStepIdx(0); const id = setInterval(()=>setStepIdx(i=>Math.min(3,i+1)), 450); return ()=>clearInterval(id); }, [phase]);
  useEffect(()=>{ const el = document.querySelector('.app-frame .screen'); if(el) el.scrollTop = 0; }, [phase]);

  async function onFile(e){
    const f = e.target.files && e.target.files[0]; e.target.value='';
    if(!f) return;
    try{ const p = await prepareImage(f); setPhoto(p); setDx(null); setPhase('ready'); }
    catch(x){ setErr({ kind:'image' }); setPhase('error'); }
  }
  async function startSample(id){
    setPhoto({ sample:id }); setDx(null); setErr(null); setPhase('scanning');
    const c = new AbortController(); ctl.current = c;
    await new Promise(r=>timers.current.push(setTimeout(r, 1500)));
    if(c.signal.aborted) return;
    setDx(sampleDx(id, lang)); setPhase('result');
  }
  async function runAI(){
    setErr(null); setPhase('scanning');
    const c = new AbortController(); ctl.current = c;
    const minWait = new Promise(r=>timers.current.push(setTimeout(r, 1900)));
    try{
      const d = await diagnose({ blob:photo.blob, lang, region:farmer.region, cropHint, syms:[...syms], signal:c.signal });
      await minWait; if(c.signal.aborted) return;
      setDx(d);
      dispatch({ type:'SAVE_SCAN', scan:{ id:uid('scan'), farmerId:farmer.id, createdAt:nowISO(), thumb:photo.thumb, dx:d } });
      setPhase('result');
    }catch(e){
      await minWait; if(c.signal.aborted) return;
      if(e && e.code==='cancelled') return; setErr({ kind: e && e.code==='notplant' ? 'notplant' : (e && e.code==='image_rejected' ? 'image' : 'fail') }); setPhase('error');
    }
  }
  function cancelScan(){ timers.current.forEach(clearTimeout); timers.current=[]; if(ctl.current) ctl.current.abort(); setPhase(photo && photo.blob ? 'ready' : 'idle'); }
  function reset(){ setPhoto(null); setDx(null); setErr(null); setNote(''); setCropHint(null); setSyms(new Set()); setPhase('idle'); }
  function openScan(s){ setDx(s.dx); setPhoto({ preview:s.thumb, saved:true }); setPhase('result'); }
  const steps = ['s1','s2','s3','s4'];

  const fileInputs = (
    <>
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile}/>
      <input ref={galRef} type="file" accept="image/*" hidden onChange={onFile}/>
    </>
  );

  return (
    <Screen className="doc-screen">
      <AppTopBar tone="green" title={t('doctor',lang)} subtitle={phase==='result' ? null : t('doctorHeadline',lang)} onBack={()=> phase==='idle' ? setSession({screen:'home'}) : (phase==='scanning' ? cancelScan() : reset())}  />
      {fileInputs}
      <div className="page doc-page">

        {phase==='idle' && (
          <div className="stagger">
            <ViewfinderArt/>
            <div className="doc-cta">
              <Btn kind="primary" size="lg" icon="camera" block onClick={()=>camRef.current && camRef.current.click()}>{t('takePhoto',lang)}</Btn>
              <Btn kind="soft" size="lg" icon="image" block onClick={()=>galRef.current && galRef.current.click()}>{t('fromGallery',lang)}</Btn>
            </div>
            <section className="tips card">
              <h3 className="display">{t('tipsTitle',lang)}</h3>
              <div className="tip"><span><Icon name="sun" size={18}/></span><p data-lang={lang}>{t('tipLight',lang)}</p></div>
              <div className="tip"><span><Icon name="target" size={18}/></span><p data-lang={lang}>{t('tipClose',lang)}</p></div>
              <div className="tip"><span><Icon name="eye" size={18}/></span><p data-lang={lang}>{t('tipBoth',lang)}</p></div>
            </section>
            <section>
              <div className="sec-line" data-lang={lang}>{t('trySample',lang)}</div>
              <div className="samples">
                {SAMPLE_LIST.map(id=>(
                  <button key={id} className="sample-card" onClick={()=>startSample(id)}>
                    <div className="sample-thumb"><SampleLeaf id={id}/></div>
                    <span data-lang={lang}>{cropName(id,lang)}</span>
                    <Badge tone={STATUS_TONE[DEMO_META[id].status]}>{DEMO_META[id].score}</Badge>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <div className="sec-line"><Icon name="book" size={16}/> <span data-lang={lang}>{t('diary',lang)}</span></div>
              {mine.length===0 ? <div className="diary-empty" data-lang={lang}>{t('noScans',lang)}</div> : (
                <div className="diary">
                  {mine.slice(0,8).map(s=>(
                    <button key={s.id} className="diary-item" onClick={()=>openScan(s)}>
                      <img src={s.thumb} alt=""/>
                      <span className="grow minw0"><b className="display" data-lang={s.dx.lang}>{s.dx.crop}</b><small data-lang={s.dx.lang}>{s.dx.condition}</small></span>
                      <span className="diary-side"><Badge tone={STATUS_TONE[s.dx.status]}>{s.dx.score}</Badge><small>{fmtDay(s.createdAt)}</small></span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {phase==='ready' && photo && (
          <div className="stagger">
            <PhotoFrame photo={photo}/>
            <div className="row gap8" style={{justifyContent:'center'}}>
              <button className="link-btn" onClick={()=>galRef.current && galRef.current.click()}><Icon name="refresh" size={15}/> {t('changePhoto',lang)}</button>
            </div>
            <section className="card ready-card">
              <div className="label" data-lang={lang}>{t('whichCrop',lang)}</div>
              <div className="chip-row" style={{flexWrap:'wrap',overflow:'visible'}}>
                <button className={cx('chip', !cropHint&&'on')} onClick={()=>setCropHint(null)}><Icon name="sparkle" size={15}/><span data-lang={lang}>{t('autoDetect',lang)}</span></button>
                {CROPS.map(c=><button key={c.id} className={cx('chip chip-crop', cropHint===c.id&&'on')} onClick={()=>setCropHint(c.id)}><CropArt id={c.id} size={22}/><span data-lang={lang}>{cropName(c.id,lang)}</span></button>)}
              </div>
              {!cropHint && <div className="sm muted" style={{marginTop:6}} data-lang={lang}>{tb(82,lang)}</div>}
              <div className="label" style={{marginTop:14}} data-lang={lang}>{tb(81,lang)}</div>
              <div className="chip-row" style={{flexWrap:'wrap',overflow:'visible'}}>{SYMS.map((k,i)=><button key={k} className={cx('chip', syms.has(k)&&'on')} onClick={()=>toggleSym(k)} aria-pressed={syms.has(k)}><span data-lang={lang}>{tb(72+i,lang)}</span></button>)}</div>
            </section>
            <Btn kind="primary" size="lg" block icon="scan" onClick={runAI}>{t('analyzeBtn',lang)}</Btn>
          </div>
        )}

        {phase==='scanning' && photo && (
          <div className="stagger">
            <PhotoFrame photo={photo} scanning/>
            <section className="card scan-steps">
              {steps.map((k,i)=>(
                <div key={k} className={cx('scan-step', i<stepIdx&&'done', i===stepIdx&&'now')}>
                  <span className="scan-ic">{i<stepIdx ? <Icon name="check" size={14} stroke={3}/> : i===stepIdx ? <i className="spin"></i> : null}</span>
                  <span data-lang={lang}>{t(k,lang)}</span>
                </div>
              ))}
              <div className="scan-bar"><i></i></div>
            </section>
            <Btn kind="ghost" block onClick={cancelScan}>{t('cancel',lang)}</Btn>
          </div>
        )}

        {phase==='result' && dx && photo && (
          <DiagnosisView dx={dx} photo={photo} isSample={!!photo.sample && !!dx.demo} onAgain={reset}
            onSell={()=>setSession({screen:'sell', prefillCrop: dx.cropId || dx.sampleId})}/>
        )}

        {phase==='error' && (
          <div className="stagger">
            <div className="card err-card">
              <div className="err-art"><Icon name={err && err.kind==='notplant' ? 'leaf' : 'alert'} size={34}/></div>
              <h3 className="display" data-lang={lang}>{err && err.kind==='notplant' ? t('notPlantT',lang) : t('failT',lang)}</h3>
              <p data-lang={lang}>{err && err.kind==='notplant' ? t('notPlantB',lang) : t('failB',lang)}</p>
              <div className="col gap8" style={{width:'100%'}}>
                {err && err.kind==='fail' && photo && photo.blob && <Btn kind="primary" icon="refresh" block onClick={runAI}>{t('tryAgain',lang)}</Btn>}
                <Btn kind="soft" icon="camera" block onClick={reset}>{t('takePhoto',lang)}</Btn>
              </div>
            </div>
            <div className="sec-line" data-lang={lang}>{t('trySample',lang)}</div>
            <div className="samples">
              {SAMPLE_LIST.map(id=>(
                <button key={id} className="sample-card" onClick={()=>startSample(id)}>
                  <div className="sample-thumb"><SampleLeaf id={id}/></div><span data-lang={lang}>{cropName(id,lang)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Screen>
  );
}
