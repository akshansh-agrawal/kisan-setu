/* ============================= CROP DOCTOR: SAMPLE PHOTOS ============================= */
const Spot = ({ x, y, r=8 }) => (
  <g>
    <circle cx={x} cy={y} r={r*1.7} fill="#E6D24B" fillOpacity=".55"/>
    <circle cx={x} cy={y} r={r} fill="#6E4120"/>
    <circle cx={x} cy={y} r={r*.62} fill="none" stroke="#3B2210" strokeWidth="1.4"/>
    <circle cx={x} cy={y} r={r*.26} fill="#3B2210"/>
  </g>
);
function Bokeh({ seed=1, tint='#DDF5B0' }){
  const pts = Array.from({length:9}, (_,i)=>({ x:(i*67*seed)%320, y:(i*41*seed)%240, r:14+((i*13)%26) }));
  return <g>{pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={p.r} fill={tint} fillOpacity={.06+((i%3)*.03)}/>)}</g>;
}

function SampleLeaf({ id }){
  return <Photo src={'assets/samples/'+id+'.jpg'} alt="" className="sample-leaf real" fallback={<SampleLeafArt id={id}/>}/>;
}
function SampleLeafArt({ id }){
  const common = { viewBox:'0 0 320 240', preserveAspectRatio:'xMidYMid slice', className:'sample-leaf', role:'img' };
  if(id==='tomato') return (
    <svg {...common} aria-label="Illustration of a tomato leaf with brown ringed spots">
      <defs>
        <linearGradient id="tlBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2C3A20"/><stop offset="1" stopColor="#5E6E3A"/></linearGradient>
        <linearGradient id="tlLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#86C752"/><stop offset="1" stopColor="#3C8530"/></linearGradient>
        <g id="tlf">
          <path d="M0 0C6-13 24-20 40-16 48-14 58-6 62 0 58 6 48 14 40 16 24 20 6 13 0 0Z" fill="url(#tlLeaf)" stroke="#2D6A22" strokeWidth=".8"/>
          <path d="M0 0H58" stroke="#C8EA9C" strokeOpacity=".75" strokeWidth="1.6"/>
          <path d="M14 0 22-8M14 0 22 8M28 0 37-9M28 0 37 9M42 0 50-6M42 0 50 6" stroke="#C8EA9C" strokeOpacity=".5" strokeWidth="1"/>
        </g>
      </defs>
      <rect width="320" height="240" fill="url(#tlBg)"/>
      <Bokeh seed={3}/>
      <path d="M150 250C148 180 156 110 176 60" stroke="#4E7A2C" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <use href="#tlf" transform="translate(176 62) rotate(-78) scale(1.4)"/>
      <use href="#tlf" transform="translate(170 85) rotate(-160) scale(1.4)"/>
      <use href="#tlf" transform="translate(170 85) rotate(-20) scale(1.4)"/>
      <use href="#tlf" transform="translate(162 130) rotate(-172) scale(1.55)"/>
      <use href="#tlf" transform="translate(162 130) rotate(-8) scale(1.55)"/>
      <use href="#tlf" transform="translate(154 180) rotate(172) scale(1.4)"/>
      <use href="#tlf" transform="translate(154 180) rotate(8) scale(1.4)"/>
      <path d="M232 100 q10-6 16 0 t-2 14" stroke="#F2E27A" strokeOpacity=".35" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <Spot x={215} y={69} r={8}/><Spot x={133} y={72} r={7}/><Spot x={200} y={125} r={9}/><Spot x={233} y={120} r={5.500}/>
      <Spot x={110} y={123} r={8}/><Spot x={197} y={186} r={7}/><Spot x={124} y={184} r={6}/><Spot x={185} y={22} r={5}/>
    </svg>
  );
  if(id==='onion') return (
    <svg {...common} aria-label="Illustration of onion leaves with purple blotches">
      <defs>
        <linearGradient id="olBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7A8A4A"/><stop offset=".65" stopColor="#4B5A2C"/><stop offset="1" stopColor="#5A4230"/></linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#olBg)"/>
      <Bokeh seed={5} tint="#F3F6C8"/>
      {[['M120 250C112 170 100 100 84 14'],['M152 250C150 160 156 90 172 8'],['M186 250C192 170 212 110 244 34'],['M98 250C74 196 44 156 20 100']].map(([d],i)=>(
        <g key={i} fill="none" strokeLinecap="round">
          <path d={d} stroke="#3F7A2B" strokeWidth="30"/><path d={d} stroke="#63A03E" strokeWidth="24"/><path d={d} stroke="#94CC66" strokeWidth="7" transform="translate(-5 0)" strokeOpacity=".7"/>
        </g>
      ))}
      {[[108,190,-7,1],[101,140,-8,1.2],[93,92,-10,.9],[152,176,-1,1.1],[157,118,-3,1.3],[166,64,-8,.8],[199,178,26,1],[221,122,30,1.2],[236,80,32,.8],[44,140,50,1]].map(([x,y,r,s],i)=>(
        <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
          <ellipse rx="10" ry="24" fill="#D9CB4E" fillOpacity=".55"/><ellipse rx="6.500" ry="17" fill="#6B2E63"/><ellipse rx="3.500" ry="10" fill="#3F1739"/>
        </g>
      ))}
    </svg>
  );
  const florets = [];
  for(let i=0;i<30;i++){ const a = i*2.399, rr = Math.sqrt((i+.5)/30)*58; florets.push([160+Math.cos(a)*rr, 112+Math.sin(a)*rr*.86, 12+((i*7)%7)]); }
  return (
    <svg {...common} aria-label="Illustration of a healthy cauliflower">
      <defs>
        <linearGradient id="clBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6F7C44"/><stop offset="1" stopColor="#4A3A2A"/></linearGradient>
        <linearGradient id="clLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6DBA55"/><stop offset="1" stopColor="#2E7A34"/></linearGradient>
        <radialGradient id="clCurd" cx="38%" cy="30%" r="80%"><stop offset="0" stopColor="#FFFFF5"/><stop offset="1" stopColor="#EAE0B6"/></radialGradient>
      </defs>
      <rect width="320" height="240" fill="url(#clBg)"/>
      <Bokeh seed={2} tint="#E9F5C4"/>
      {[-160,-110,-55,10,65,120,180].map((a,i)=>(
        <g key={i} transform={`translate(160 176) rotate(${a}) scale(${.95+((i%3)*.08)})`}>
          <path d="M0 0C30-48 120-54 152 0 120 54 30 48 0 0Z" fill="url(#clLeaf)" stroke="#2A6B2F" strokeWidth="1"/>
          <path d="M0 0H140M30 0 60-22M30 0 60 22M70 0 100-20M70 0 100 20" stroke="#CFEDB0" strokeOpacity=".6" strokeWidth="1.600" fill="none"/>
        </g>
      ))}
      <ellipse cx="160" cy="150" rx="74" ry="62" fill="#4E9A40" fillOpacity=".55"/>
      {florets.map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} fill="url(#clCurd)" stroke="#DACE9E" strokeWidth=".9"/>)}
      {florets.filter((_,i)=>i%3===0).map(([x,y,r],i)=><circle key={i} cx={x-r*.3} cy={y-r*.3} r={r*.32} fill="#fff" fillOpacity=".55"/>)}
      {[[84,70],[240,92],[70,150],[250,168],[118,206]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="3" ry="4" fill="#fff" fillOpacity=".55"/>)}
    </svg>
  );
}

/* ============================= CROP DOCTOR: DEMO DIAGNOSES =============================
   Used for the sample photos and whenever live scanning is unavailable.
   Live scans by the AI return this exact shape in the farmer's own language.          */
const DEMO_META = {
  tomato:      { status:'watch',   score:58, confidence:'high', spread:'medium', recheck:7, kind:'fungal', hot:[[215,69],[133,72],[200,125],[233,120],[110,123],[197,186],[124,184]] },
  onion:       { status:'urgent',  score:46, confidence:'high', spread:'high',   recheck:5, kind:'fungal', hot:[[108,190],[101,140],[152,176],[157,118],[199,178],[221,122]] },
  cauliflower: { status:'healthy', score:93, confidence:'high', spread:'low',    recheck:10, kind:'healthy', hot:[] },
};
const SAMPLE_LIST = ['tomato','onion','cauliflower'];
