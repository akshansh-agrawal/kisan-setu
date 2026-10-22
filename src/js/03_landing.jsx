/* ============================= LANDING ============================= */
// Rs per kg. Wheat/MSP crops use the notified MSP (Rs/quintal / 100) as the floor reference; others are indicative. Edit freely.
const PRICE_BOARD = { tomato:16, onion:13, potato:10, wheat:25.85, cauliflower:17, bajra:27.75, mustard:62, cumin:230, guar:52, groundnut:72.63, gram:58.75, soybean:53.28, cotton:77 };
const CROP_SUGGESTED_PRICE = PRICE_BOARD;

/* hero: the bridge at sunrise. Field on the left, Pink City on the right, produce goes one way, rupees the other. */
function HeroScene(){
  const stalks = useMemo(()=> Array.from({length:30}, (_,i)=>({ x: 6 + i*30 + (i%3)*4, h: 26 + (i*7)%18, d: (i*137)%1600 })), []);
  const rows = useMemo(()=> Array.from({length:9}, (_,i)=>i), []);
  return (
    <svg className="hero-scene" viewBox="0 0 900 500" preserveAspectRatio="xMidYMax slice" role="img" aria-label="A truck of vegetables crosses a bridge from a farm to the city at sunrise while rupee coins travel back to the farmer">
      <defs>
        <radialGradient id="hsGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFD873" stopOpacity=".85"/><stop offset=".45" stopColor="#FF9B62" stopOpacity=".35"/><stop offset="1" stopColor="#FF9B62" stopOpacity="0"/></radialGradient>
        <linearGradient id="hsSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF0B8"/><stop offset="1" stopColor="#F7B52A"/></linearGradient>
        <linearGradient id="hsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E77F7B" stopOpacity="0"/><stop offset=".45" stopColor="#F59A78" stopOpacity=".75"/><stop offset=".72" stopColor="#FFC17A"/><stop offset="1" stopColor="#FFDD95"/></linearGradient>
        <linearGradient id="hsWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F7A97A"/><stop offset=".35" stopColor="#8F6FB4"/><stop offset="1" stopColor="#2C3480"/></linearGradient>
        <linearGradient id="hsField" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8DB853"/><stop offset="1" stopColor="#2F7A3B"/></linearGradient>
        <linearGradient id="hsPink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E38B93"/><stop offset="1" stopColor="#B3506F"/></linearGradient>
        <linearGradient id="hsPink2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C2687F"/><stop offset="1" stopColor="#8B3E68"/></linearGradient>
        <radialGradient id="hsLamp" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFE9A6" stopOpacity="1"/><stop offset="1" stopColor="#FFC94D" stopOpacity="0"/></radialGradient>
      </defs>

      <rect x="0" y="0" width="900" height="500" fill="url(#hsSky)"/>
      <circle cx="450" cy="262" r="300" fill="url(#hsGlow)" className="hs-glow"/>

      <g className="hs-rays">
        {Array.from({length:18}).map((_,i)=><line key={i} x1="450" y1="132" x2="450" y2={i%2?92:72} stroke="#FFE6A0" strokeOpacity={i%2?.3:.5} strokeWidth={i%2?3:5} strokeLinecap="round" transform={`rotate(${i*20} 450 262)`}/>)}
      </g>
      <g className="hs-sun"><circle cx="450" cy="262" r="66" fill="url(#hsSun)"/><circle cx="450" cy="262" r="66" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2"/></g>

      <g className="hs-cloud hs-c1"><ellipse cx="150" cy="150" rx="70" ry="15" fill="#fff" fillOpacity=".55"/><ellipse cx="120" cy="140" rx="34" ry="14" fill="#fff" fillOpacity=".6"/><ellipse cx="180" cy="142" rx="28" ry="11" fill="#fff" fillOpacity=".6"/></g>
      <g className="hs-cloud hs-c2"><ellipse cx="640" cy="118" rx="60" ry="12" fill="#FFE1C4" fillOpacity=".6"/><ellipse cx="620" cy="110" rx="28" ry="11" fill="#FFE1C4" fillOpacity=".7"/></g>
      <g className="hs-cloud hs-c3"><ellipse cx="380" cy="200" rx="46" ry="9" fill="#fff" fillOpacity=".4"/></g>

      <path d="M0 330 C90 300 150 318 230 300 S380 285 450 305 S620 290 700 302 S840 296 900 312 V400 H0Z" fill="#6C58A6" fillOpacity=".55"/>
      <path d="M0 348 C70 326 160 338 250 326 S420 322 520 334 S760 322 900 340 V400 H0Z" fill="#4E4C9C" fillOpacity=".75"/>

      {/* Pink City */}
      <g className="hs-city">
        <path d="M640 384 V330 h14 v-10 h10 v10 h12 V300 l9 -12 9 12 V336 h14 V384Z" fill="url(#hsPink2)"/>
        <g>{/* Hawa-Mahal style tiers */}
          <path d="M716 384 V336 h64 v48Z" fill="url(#hsPink)"/><path d="M722 336 V314 h52 v22Z" fill="url(#hsPink)"/><path d="M728 314 V296 h40 v18Z" fill="url(#hsPink)"/><path d="M736 296 V282 h24 v14Z" fill="url(#hsPink)"/>
          <path d="M740 282 q8 -14 16 0Z" fill="#E9A0A6"/>
          {[724,736,748,760,770].map((x,i)=><path key={'a'+i} d={`M${x} 366 v-10 a3.5 3.500 0 0 1 7 0 v10Z`} fill="#3B2350" fillOpacity=".7"/>)}
          {[728,740,752,764].map((x,i)=><path key={'b'+i} d={`M${x} 346 v-8 a3 3 0 0 1 6 0 v8Z`} fill="#FFD36A" className="hs-win" style={{animationDelay:(i*.6)+'s'}}/>)}
          {[733,745,757].map((x,i)=><path key={'c'+i} d={`M${x} 326 v-7 a3 3 0 0 1 6 0 v7Z`} fill="#FFD36A" className="hs-win" style={{animationDelay:(i*.9)+'s'}}/>)}
          {[740,752].map((x,i)=><path key={'d'+i} d={`M${x} 308 v-6 a3 3 0 0 1 6 0 v6Z`} fill="#FFD36A" className="hs-win" style={{animationDelay:(i*.7)+'s'}}/>)}
        </g>
        <path d="M790 384 V326 h44 V384Z" fill="url(#hsPink2)"/><path d="M796 326 h32 q-16 -26 -32 0Z" fill="#D98A94"/><path d="M812 300 v-10" stroke="#F5B324" strokeWidth="2"/>
        {[798,808,818].map((x,i)=><rect key={i} x={x} y="336" width="5" height="12" rx="2.5" fill="#FFD36A" className="hs-win" style={{animationDelay:(i*.5)+'s'}}/>)}
        <path d="M840 384 V310 h26 V384Z" fill="url(#hsPink)"/><path d="M840 310 q13 -22 26 0Z" fill="#E9A0A6"/>
        {[352,366].map((y,i)=><rect key={i} x="848" y={y} width="10" height="7" rx="3" fill="#FFD36A" className="hs-win" style={{animationDelay:(i*.8)+'s'}}/>)}
      </g>

      {/* Farm bank */}
      <path d="M0 356 C60 338 130 350 210 352 S262 372 272 392 V432 H0Z" fill="url(#hsField)"/>
      <g stroke="#2A6B36" strokeOpacity=".55" strokeWidth="2" fill="none">
        {rows.map(i=><path key={i} d={`M${-20+i*32} 432 Q${40+i*20} 392 ${120+i*14} 358`}/>)}
      </g>
      <g className="hs-hut"><path d="M70 366 V340 h44 v26Z" fill="#F3E4C6"/><path d="M62 342 L92 318 L122 342Z" fill="#C9702E"/><rect x="86" y="348" width="12" height="18" rx="2" fill="#7B4A2A"/><rect x="72" y="346" width="8" height="8" fill="#8CCBEB"/></g>
      <g className="hs-tree" style={{transformOrigin:'188px 358px'}}><rect x="185" y="330" width="6" height="30" rx="2" fill="#6D4526"/><circle cx="188" cy="318" r="22" fill="#2F7A3B"/><circle cx="172" cy="326" r="14" fill="#3B8C46"/><circle cx="206" cy="326" r="14" fill="#37853F"/><circle cx="182" cy="308" r="9" fill="#57A657" fillOpacity=".7"/></g>

      {/* River */}
      <rect x="0" y="392" width="900" height="120" fill="url(#hsWater)"/>
      <g className="hs-shimmer" stroke="#FFE4A6" strokeLinecap="round" strokeWidth="3">
        {[[420,404,60],[400,418,100],[430,432,44],[380,446,140],[415,462,70],[440,480,30]].map(([x,y,w],i)=><line key={i} x1={x} y1={y} x2={x+w} y2={y} strokeOpacity={.7-i*.08} style={{animationDelay:(i*.35)+'s'}}/>)}
      </g>

      {/* Right bank */}
      <path d="M900 350 C840 344 740 352 660 360 S632 380 628 392 V432 H900Z" fill="#8B3E68"/>
      <path d="M900 372 C820 366 720 374 650 380 V432 H900Z" fill="#6B2F5C" fillOpacity=".85"/>

      {/* The bridge (setu) */}
      <path fillRule="evenodd" fill="#161B48" d="M236 376H664V436H236Z M254 436V414A56 30 0 0 1 366 414V436Z M394 436V414A56 30 0 0 1 506 414V436Z M534 436V414A56 30 0 0 1 646 414V436Z"/>
      <rect x="230" y="364" width="440" height="12" rx="3" fill="#1E6B3C"/>
      <path d="M236 352H664" stroke="#1E6B3C" strokeWidth="3"/>
      {Array.from({length:19}).map((_,i)=><line key={i} x1={244+i*23} y1="352" x2={244+i*23} y2="364" stroke="#1E6B3C" strokeWidth="2.400"/>)}
      {[254,344,434,524,614].map((x,i)=><g key={x}><line x1={x} y1="364" x2={x} y2="336" stroke="#1E6B3C" strokeWidth="3"/><circle cx={x} cy="333" r="14" fill="url(#hsLamp)" className="hs-lamp" style={{animationDelay:(i*.4)+'s'}}/><circle cx={x} cy="333" r="4" fill="#FFE9A6"/></g>)}

      {/* Rupees travelling home to the farmer */}
      {[0,3.4,6.8].map((d,i)=>(
        <g key={i} className="hs-coin" style={{animationDelay:d+'s'}}>
          <circle r="9" fill="#F5B324" stroke="#B97D00" strokeWidth="1.500"/><circle r="6.200" fill="none" stroke="#FFE08A" strokeWidth="1"/>
          <text y="3.800" textAnchor="middle" fontSize="10" fontWeight="800" fill="#7A4E00" fontFamily="'Baloo 2',sans-serif">₹</text>
        </g>
      ))}

      {/* The truck: produce going to the city */}
      <g className="hs-truck">
        <g transform="translate(0 -1)">
          <rect x="0" y="-24" width="46" height="24" rx="3" fill="#F5B324"/><rect x="0" y="-24" width="46" height="6" rx="3" fill="#FFCB52"/>
          <rect x="4" y="-32" width="10" height="8" rx="2" fill="#E5483A"/><rect x="16" y="-31" width="10" height="7" rx="2" fill="#B85496"/><rect x="28" y="-32" width="12" height="8" rx="2" fill="#6BB04F"/>
          <path d="M46 -22 h12 l7 9 v13 h-19Z" fill="#1E6B3C"/><path d="M50 -19 h7 l4 6 h-11Z" fill="#BFE3F5"/>
          <rect x="0" y="-3" width="66" height="4" rx="2" fill="#17251C"/>
          <g className="hs-wheel"><circle cx="12" cy="1" r="6" fill="#17251C"/><circle cx="12" cy="1" r="2.400" fill="#9AA3D6"/></g>
          <g className="hs-wheel"><circle cx="54" cy="1" r="6" fill="#17251C"/><circle cx="54" cy="1" r="2.400" fill="#9AA3D6"/></g>
          <circle cx="66" cy="-6" r="2.500" fill="#FFE9A6"/>
        </g>
      </g>

      {/* birds */}
      {[0,1,2].map(i=><path key={i} className="hs-bird" style={{animationDelay:(i*1.6)+'s', '--by':(i*14)+'px'}} d="M0 0 q6 -7 12 0 q6 -7 12 0" fill="none" stroke="#231B5A" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" transform={`translate(0 ${170+i*22})`}/>)}

      {/* foreground grass and wheat */}
      <path d="M0 500 V468 C120 452 240 476 380 462 S640 452 780 466 S870 458 900 462 V500Z" fill="#1E5A2C"/>
      <path d="M0 500 V486 C160 474 300 492 450 484 S740 474 900 486 V500Z" fill="#164A24"/>
      {stalks.map((s,i)=>(
        <g key={i} className="hs-stalk" style={{ transformOrigin:`${s.x}px 480px`, animationDelay:(-s.d/1000)+'s' }}>
          <path d={`M${s.x} 484 V${480-s.h}`} stroke="#6E9A3C" strokeWidth="2" strokeLinecap="round"/>
          <ellipse cx={s.x} cy={476-s.h} rx="3" ry="8" fill="#F1C54A"/><ellipse cx={s.x-3} cy={480-s.h} rx="2.400" ry="6" fill="#E7B537" transform={`rotate(-24 ${s.x-3} ${480-s.h})`}/><ellipse cx={s.x+3} cy={480-s.h} rx="2.400" ry="6" fill="#E7B537" transform={`rotate(24 ${s.x+3} ${480-s.h})`}/>
        </g>
      ))}
    </svg>
  );
}

function Greeter(){
  const words = [['नमस्ते','hi'],['Namaste','en'],['नमस्कार','mr'],['ਸਤ ਸ੍ਰੀ ਅਕਾਲ','pa']];
  const [i, setI] = useState(0);
  useEffect(()=>{ const id = setInterval(()=>setI(x=>(x+1)%words.length), 2400); return ()=>clearInterval(id); }, []);
  return <span className="greeter" key={i} data-lang={words[i][1]}>{words[i][0]}</span>;
}

function PriceTicker(){
  const items = CROPS.map((c,i)=>({ c, p:PRICE_BOARD[c.id], up: i%3!==1, d: 1+(i*2)%4 }));
  const row = (k)=>(
    <div className="ticker-row" aria-hidden={k>0} key={k}>
      {items.map(({c,p,up,d})=>(
        <span key={c.id} className="tick"><CropArt id={c.id} size={26}/><b>{c.name.en}</b><span className="tick-p">₹{p}/kg</span><span className={cx('tick-d', up?'up':'down')}>{up?'▲':'▼'} {d}%</span></span>
      ))}
    </div>
  );
  return (
    <div className="ticker" role="marquee" aria-label="Indicative prices per kilo, Jaipur region">
      <div className="ticker-track">{row(0)}{row(1)}{row(2)}</div>
    </div>
  );
}

function RoleDoor({ tone, photo, icon, tag, title, sub, chips, cta, onClick, wide }){
  return (
    <button className={cx('door','door-'+tone, wide&&'door-wide')} onClick={onClick}>
      <div className="door-art">
        <Photo src={photo} alt="" className="door-photo" fallback={<span className="door-fallback"><Icon name={icon} size={44} stroke={1.4}/></span>}/>
      </div>
      <div className="door-body">
        {tag && <span className="door-tag">{tag}</span>}
        <h3 className="display">{title}</h3>
        <p>{sub}</p>
        {chips && <div className="door-chips">{chips.map(c=><span key={c}>{c}</span>)}</div>}
        <span className="door-cta">{cta}<Icon name="arrowR" size={17} stroke={2}/></span>
      </div>
    </button>
  );
}

function TruckArt({ size=110 }){
  return (
    <svg width={size} height={size*0.62} viewBox="0 0 110 68" aria-hidden="true">
      <rect x="4" y="10" width="62" height="38" rx="6" fill="#14532D"/><rect x="4" y="10" width="62" height="9" rx="6" fill="#1E6B3C"/>
      <rect x="10" y="22" width="14" height="14" rx="3" fill="#E5483A"/><rect x="27" y="22" width="14" height="14" rx="3" fill="#B85496"/><rect x="44" y="22" width="14" height="14" rx="3" fill="#6BB04F"/>
      <path d="M66 20h20l14 16v18H66Z" fill="#F5B324"/><path d="M72 25h12l8 11H72Z" fill="#CFEAF7"/>
      <rect x="2" y="50" width="98" height="6" rx="3" fill="#17251C"/>
      <circle cx="26" cy="56" r="9" fill="#17251C"/><circle cx="26" cy="56" r="3.500" fill="#9AA3D6"/>
      <circle cx="82" cy="56" r="9" fill="#17251C"/><circle cx="82" cy="56" r="3.500" fill="#9AA3D6"/>
    </svg>
  );
}

function MiniPhoneDoctor(){
  return (
    <div className="mini-phone" aria-hidden="true">
      <div className="mini-screen">
        <div className="mini-photo">
          <SampleLeaf id="tomato" scanning/>
          <i className="mini-corner tl"></i><i className="mini-corner tr"></i><i className="mini-corner bl"></i><i className="mini-corner br"></i>
          <div className="mini-scan"></div>
        </div>
        <div className="mini-chip c1"><Icon name="bug" size={14}/> Early blight</div>
        <div className="mini-chip c2"><Icon name="drop" size={14}/> Water at the root</div>
        <div className="mini-chip c3"><Icon name="sparkle" size={14}/> Spray neem today</div>
        <div className="mini-score"><Ring value={58} size={64} stroke={7} color="#F5B324" track="rgba(255,255,255,.18)" delay={600}><b className="display">58</b></Ring><span>Needs attention</span></div>
      </div>
    </div>
  );
}

function RupeeSplit(){
  const [ref, seen] = useInView(true, .35);
  const [cid, setCid] = useState('tomato');
  const crop = cropOf(cid);
  const mandi = Math.round(crop.mandiShare*100);
  return (
    <section className="sec sec-split" ref={ref}>
      <div className="sec-head">
        <h2 className="display">Transparent pricing: 68% of each sale goes to the farmer.</h2>
        <p>Delivery partners receive 14% and Kisan Setu retains 18%. The split is itemised on every order in the farmer's own account.</p>
      </div>
      <div className="split-card">
        <div className="chip-row">{CROPS.map(c=><button key={c.id} className={cx('chip chip-crop', cid===c.id&&'on')} onClick={()=>setCid(c.id)}><CropArt id={c.id} size={22}/>{c.name.en}</button>)}</div>
        <div className="cmp">
          <div className="cmp-row">
            <div className="cmp-label"><b>Kisan Setu</b><span>direct to buyer</span></div>
            <div className="cmp-bar"><div className="cmp-fill ks" style={{ width: seen? '68%':'0%' }}></div><b className="cmp-val">₹{seen? <Num value={68} ms={1100}/> : 0}</b></div>
          </div>
          <div className="cmp-row">
            <div className="cmp-label"><b>Typical mandi chain</b><span>{crop.name.en}</span></div>
            <div className="cmp-bar"><div className="cmp-fill md" style={{ width: seen? mandi+'%':'0%' }}></div><b className="cmp-val">₹{mandi}</b></div>
          </div>
        </div>
        <div className="split-legend">
          <span><i style={{background:'var(--mehendi)'}}></i>Farmer ₹68</span><span><i style={{background:'var(--haldi)'}}></i>Delivery ₹14</span><span><i style={{background:'var(--nil-3)'}}></i>Kisan Setu ₹18</span>
        </div>
        <SplitBar farmerPct={seen?68:0} logisticsPct={seen?14:0} platformPct={seen?18:0}/>
        <p className="fine">Mandi share is an indicative estimate, not a market statistic.</p>
      </div>
    </section>
  );
}

function Journey(){
  const [ref, seen] = useInView(true, .2);
  const steps = [
    ['sell','Listing','The farmer records the crop by voice or text and receives a suggested price based on nearby demand.'],
    ['layers','Matching','When one farm cannot fill a bulk order, nearby verified farms are pooled into a virtual FPO.'],
    ['truck','Collection and delivery','A single optimised route collects from each farm and delivers to the buyer.'],
    ['coin','Settlement','Funds are released to farmers on the day of delivery. Orders above ₹5,000 require a second approval.'],
  ];
  return (
    <section className="sec sec-journey" ref={ref}>
      <div className="sec-head"><h2 className="display">How an order works</h2></div>
      <ol className={cx('journey', seen&&'in')}>
        {steps.map(([ic,t1,d],i)=>(
          <li key={t1} style={{ '--i':i }}><span className="j-node"><Icon name={ic} size={22}/></span><div><h4 className="display">{t1}</h4><p>{d}</p></div></li>
        ))}
      </ol>
    </section>
  );
}

function Bento(){
  return (
    <section className="sec sec-bento">
      <div className="sec-head"><h2 className="display">Platform capabilities</h2></div>
      <div className="bento">
        <div className="bt bt-doctor">
          <Icon name="doctor" size={30}/><h3 className="display">Crop Doctor</h3>
          <p>Diagnosis from a photograph, with a treatment and care plan that can be read or heard in the farmer's language.</p>
          <div className="bt-leaves" aria-hidden="true"><span></span><span></span><span></span></div>
        </div>
        <div className="bt bt-voice">
          <Icon name="mic" size={28}/><h3 className="display">Voice in 23 languages</h3>
          <p>Hindi, Marathi, Punjabi and English, by app or by phone line.</p>
          <div className="wave" aria-hidden="true">{Array.from({length:14}).map((_,i)=><i key={i} style={{animationDelay:(i*.09)+'s'}}></i>)}</div>
        </div>
        <div className="bt bt-trust">
          <Icon name="shield" size={28}/><h3 className="display">Trust score</h3>
          <p>A one-time soil and residue report becomes a verified score that buyers can rely on.</p>
          <div className="bt-score"><Ring value={92} size={76} stroke={9} color="var(--mehendi)" delay={400}><b className="display">92</b></Ring></div>
        </div>
        <div className="bt bt-glut">
          <Icon name="trend" size={28}/><h3 className="display">Oversupply alerts</h3>
          <p>Farmers are warned before sowing when too many neighbours plan the same crop.</p>
          <div className="bt-bars" aria-hidden="true">{[30,44,58,80,96].map((bh,i)=><i key={i} style={{height:bh+'%', animationDelay:(i*.12)+'s'}} className={i>2?'peak':''}></i>)}</div>
        </div>
        <div className="bt bt-residue">
          <Icon name="residue" size={28}/><h3 className="display">Residue marketplace</h3>
          <p>Stalks, straw and husk are matched to approved industrial buyers instead of being burnt.</p>
          <div className="bt-art"><CropArt id="straw" size={54}/><CropArt id="stalks" size={54}/><CropArt id="husk" size={54}/></div>
        </div>
        <div className="bt bt-escrow">
          <Icon name="lock" size={28}/><h3 className="display">Two-person payment approval</h3>
          <p>Settlements above ₹5,000 are released only after a second administrator approves.</p>
        </div>
      </div>
    </section>
  );
}

const MAP_PTS = {
  Chomu:{ lat:27.17, lng:75.72 }, Bassi:{ lat:26.835, lng:76.05 }, Phulera:{ lat:26.872, lng:75.242 }, Dudu:{ lat:26.733, lng:75.067 }, Sanganer:{ lat:26.817, lng:75.783 },
};
const JAIPUR = { lat:26.9124, lng:75.7873 };
function projMap(p, w, hgt){
  const minLng=74.95, maxLng=76.15, minLat=26.65, maxLat=27.25;
  return [ (p.lng-minLng)/(maxLng-minLng)*(w-80)+40, hgt-40-((p.lat-minLat)/(maxLat-minLat))*(hgt-80) ];
}
function PilotMap(){
  const W=560, H=400; const hub = projMap(JAIPUR, W, H);
  return (
    <section className="sec sec-map">
      <div className="sec-head"><h2 className="display">Pilot region: rural Jaipur</h2><p>Chomu, Bassi, Phulera, Dudu and Sanganer, supplying the Jaipur market.</p></div>
      <div className="map-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="pilot-map" role="img" aria-label="Map of the five pilot towns connected to Jaipur">
          <defs><radialGradient id="pmPulse"><stop offset="0" stopColor="#F5B324" stopOpacity=".7"/><stop offset="1" stopColor="#F5B324" stopOpacity="0"/></radialGradient></defs>
          <path d="M-10 90 C120 40 200 120 300 80 S480 30 580 90 V400 H-10Z" fill="var(--mehendi-soft)"/>
          <path d="M-10 250 C110 210 210 290 330 250 S500 220 580 270 V400 H-10Z" fill="var(--mehendi-soft)" opacity=".7"/>
          <path d="M-10 330 C140 300 240 350 360 320 S520 300 580 340" stroke="var(--nil-3)" strokeOpacity=".25" strokeWidth="14" fill="none" strokeLinecap="round"/>
          {Object.entries(MAP_PTS).map(([k,p],i)=>{ const [x,y]=projMap(p,W,H); return (
            <g key={k}>
              <path d={`M${x} ${y} Q${(x+hub[0])/2} ${Math.min(y,hub[1])-38} ${hub[0]} ${hub[1]}`} className="map-route" fill="none" stroke="var(--nil-3)" strokeWidth="2.400" strokeLinecap="round" style={{animationDelay:(i*.4)+'s'}}/>
              <circle cx={x} cy={y} r="22" fill="url(#pmPulse)" className="map-pulse" style={{animationDelay:(i*.5)+'s'}}/>
              <circle cx={x} cy={y} r="7" fill="var(--mehendi)" stroke="#fff" strokeWidth="3"/>
              <text x={x} y={y+26} textAnchor="middle" className="map-label">{k}</text>
            </g>); })}
          <g><circle cx={hub[0]} cy={hub[1]} r="12" fill="#D8432F" stroke="#fff" strokeWidth="3.500"/><text x={hub[0]} y={hub[1]-20} textAnchor="middle" className="map-label hub">Jaipur</text></g>
        </svg>
      </div>
    </section>
  );
}

function HeroBackdrop({ mode, setMode }){
  if(mode==='video') return <video className="hero-bg" autoPlay muted loop playsInline preload="auto" poster={hasAsset('assets/hero.jpg') ? assetSrc('assets/hero.jpg') : undefined} src={assetSrc('assets/hero.mp4')} onError={()=>setMode('photo')}/>;
  if(mode==='photo') return <Photo src="assets/hero.jpg" className="hero-bg" fallback={<FallbackFlag onMount={()=>setMode('scene')}/>}/>;
  return null;
}
function FallbackFlag({ onMount }){ useEffect(()=>{ onMount(); }, []); return null; }

function Landing(){
  const { setSession } = useApp();
  const [armed, setArmed] = useState(false);
  const [mode, setMode] = useState('scene');           // always show the animated bridge scene, regardless of internet connectivity
  const open = (role, extra)=> { window.scrollTo && window.scrollTo(0,0); setSession({ role, screen: role==='logistics'?'route':'home', ...(extra||{}) }); };
  const stars = useMemo(()=> Array.from({length:40}, (_,i)=>({ x:(i*53)%100, y:(i*29)%46, s:(i%3)+1, d:(i*0.37)%4 })), []);
  const tryDoctor = ()=> open('farmer', { farmerId:'f1', guest:true, lang:'en', screen:'doctor' });
  const go = (id)=> { const el = document.getElementById(id); if(el) el.scrollIntoView({ behavior:'smooth' }); };
  return (
    <div className="land">
      <header className={cx('hero', mode!=='scene' && 'hero-real')}>
        <HeroBackdrop mode={mode} setMode={setMode}/>
        {mode==='scene' && <div className="hero-stars" aria-hidden="true">{stars.map((s,i)=><i key={i} style={{left:s.x+'%',top:s.y+'%',width:s.s+1,height:s.s+1,animationDelay:s.d+'s'}}></i>)}</div>}
        {mode!=='scene' && <div className="hero-shade" aria-hidden="true"></div>}
        <nav className="land-nav">
          <div className="brand"><Logo size={38}/><div><b className="display">Kisan Setu</b><small data-lang="hi">किसान सेतु</small></div></div>
          <div className="nav-links"><a onClick={()=>go('doors')}>Workspaces</a><a onClick={()=>go('doctor')}>Crop Doctor</a><a onClick={()=>go('pricing')}>Pricing</a><a onClick={()=>go('pilot')}>Pilot region</a></div>
          <button className="nav-cta" onClick={()=>go('doors')}>Sign in</button>
        </nav>
        <div className="hero-copy">
          <span className="eyebrow light">India · 22 scheduled languages + English</span>
          <h1 className="hero-title display">A direct market for India's farmers.</h1>
          <p className="hero-sub">Kisan Setu connects verified farmers with hotels, retailers and households. Transparent pricing, same-day settlement and offline crop-doctor support in 23 languages.</p>
          <div className="hero-cta">
            <button className="btn btn-light btn-lg" onClick={()=>open('farmer')}><span className="btn-label">Open the farmer app</span><Icon name="arrowR" size={18}/></button>
            <button className="btn btn-glass btn-lg" onClick={tryDoctor}><Icon name="scan" size={19}/><span className="btn-label">Crop Doctor</span></button>
          </div>
          <dl className="hero-proof">
            <div><dt className="display"><Num value={68} suffix="%" ms={1400} delay={500}/></dt><dd>of each sale goes to the farmer</dd></div>
            <div><dt className="display">Same day</dt><dd>settlement after delivery</dd></div>
            <div><dt className="display"><Num value={33} ms={900} delay={600}/></dt><dd>India districts covered</dd></div>
          </dl>
        </div>
        {mode==='scene' && <HeroScene />}
      </header>
      {mode==='scene' && <div className="scallop" aria-hidden="true"></div>}
      <PriceTicker />

      <section className="sec sec-doors" id="doors">
        <div className="sec-head"><h2 className="display">Choose a workspace</h2><p>Five role-based applications share one live dataset. An order placed by a buyer appears immediately in the farmer's account, the delivery route and the operations desk.</p></div>
        <div className="doors">
          <RoleDoor tone="farmer" wide photo="assets/roles/farmer.jpg" icon="sprout" tag="Includes Crop Doctor" title="Farmers and FPOs" sub="List produce, follow prices, sell crop residue and check crop health from a photograph." chips={['Crop Doctor','Voice support','Trust score']} cta="Open farmer app" onClick={()=>open('farmer')}/>
          <RoleDoor tone="buyer" photo="assets/roles/buyer.jpg" icon="store" title="Bulk buyers" sub="Hotels, restaurants and retailers. Order from verified farms with a full price breakdown." cta="Open buyer app" onClick={()=>open('buyer')}/>
          <RoleDoor tone="consumer" photo="assets/roles/consumer.jpg" icon="cart" title="Households" sub="Fresh produce from nearby farms, from one kilogram." cta="Open shop" onClick={()=>open('consumer')}/>
          <RoleDoor tone="logistics" photo="assets/roles/logistics.jpg" icon="truck" title="Delivery partners" sub="Today's optimised route, stop by stop." cta="Open route" onClick={()=>open('logistics')}/>
          <RoleDoor tone="admin" photo="assets/roles/admin.jpg" icon="lock" title="Operations desk" sub="Verification, escrow, fraud review and audit, with role-based access." cta="Open portal" onClick={()=>open('admin')}/>
        </div>
      </section>

      <section className="sec sec-doctor" id="doctor">
        <div className="doctor-grid">
          <div className="doctor-copy">
            <span className="eyebrow">Crop Doctor</span>
            <h2 className="display">Diagnosis from a photograph.</h2>
            <p>Farmers photograph a leaf, fruit or plant and receive an assessment in their own language: the likely condition, how urgent it is, what to do and how to care for the crop.</p>
            <ul className="tick-list">
              <li><Icon name="check" size={16} stroke={2.6}/>Identifies disease, pest and nutrient problems</li>
              <li><Icon name="check" size={16} stroke={2.6}/>Low-cost measures first, listed in order of action</li>
              <li><Icon name="check" size={16} stroke={2.6}/>Reads the result aloud for farmers who prefer to listen</li>
              <li><Icon name="check" size={16} stroke={2.6}/>Keeps a field diary to track recovery over time</li>
            </ul>
            <button className="btn btn-nil btn-lg" onClick={tryDoctor}><Icon name="camera" size={19}/><span className="btn-label">Try Crop Doctor</span></button>
          </div>
          <MiniPhoneDoctor />
        </div>
      </section>

      <div id="pricing"><RupeeSplit /></div>
      <Journey />
      <Bento />
      <div id="pilot"><PilotMap /></div>

      <footer className="land-foot">
        <div className="foot-top"><Logo size={40} tone="light"/><div><b className="display">Kisan Setu</b><p>Farm to market, direct.</p></div></div>
        <p className="fine">Crop Doctor advice is informational and should be confirmed with the local Krishi Vigyan Kendra before any spraying.</p>
        <button className="link-btn" onClick={()=>{ if(!armed){ setArmed(true); setTimeout(()=>setArmed(false),4000); return; } try{ localStorage.removeItem('kisan_setu_state_v3'); localStorage.removeItem('kisan_setu_session_v3'); }catch(e){} window.location.reload(); }}>{armed ? 'Select again to clear all local data' : 'Reset local data'}</button>
      </footer>
    </div>
  );
}
