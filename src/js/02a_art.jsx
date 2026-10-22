/* ============================= ICONS ============================= */
const ICONS = {
  home:<><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></>,
  sell:<><path d="M4 9h16l-1.6 9.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8z"/><path d="M8 9l3-5M16 9l-3-5"/><path d="M10 13v3M14 13v3"/></>,
  doctor:<><path d="M4.5 18.5c0-7.5 4.6-12.4 13-13.5 0 8.2-4.6 13.2-12 13.2"/><path d="M4.5 18.5c2.6-3.6 5.4-6.4 9-8.2"/><path d="M17.5 15v5M15 17.5h5"/></>,
  wallet:<><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><path d="M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5z"/><circle cx="16" cy="13.5" r="1.2"/></>,
  user:<><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6"/></>,
  phone:<path d="M6.7 3.8 9 7.1 7.5 9.2c1.1 2.5 3 4.4 5.5 5.5l2.1-1.5 3.3 2.3-1.3 3.1c-.4.9-1.3 1.4-2.2 1.2C8.8 18.6 5.4 15.2 4.2 9.1c-.2-.9.3-1.8 1.2-2.2z"/>,
  mic:<><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/></>,
  bell:<><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></>,
  shield:<><path d="M12 3l7 3v5c0 4.6-2.9 8.1-7 10-4.1-1.9-7-5.4-7-10V6z"/><path d="m8.5 11.8 2.2 2.2 4.8-5"/></>,
  chart:<><path d="M4 18V9M9 18V6M14 18v-4M19 18V3"/><path d="M4 18h15"/></>,
  truck:<><path d="M2.5 6.5h11v10h-11z"/><path d="M13.5 10h4l3 3v3.5h-7"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/></>,
  pin:<><path d="M19 10.2c0 5.1-7 10.2-7 10.2S5 15.3 5 10.2a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2.2"/></>,
  route:<><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/></>,
  box:<><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/></>,
  check:<path d="m5 12.5 4.5 4.5L19 7.5"/>,
  x:<path d="M6 6l12 12M18 6 6 18"/>,
  arrowR:<path d="M5 12h14M13 6l6 6-6 6"/>,
  arrowL:<path d="M19 12H5M11 6l-6 6 6 6"/>,
  chevR:<path d="m9 6 6 6-6 6"/>,
  chevD:<path d="m6 9 6 6 6-6"/>,
  camera:<><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.4-2h5.2L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.6"/></>,
  image:<><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4.5 3.5 3L15 13l5 5"/></>,
  sparkle:<><path d="M12 3c.8 4.2 2.8 6.2 7 7-4.2.8-6.2 2.8-7 7-.8-4.2-2.8-6.2-7-7 4.2-.8 6.2-2.8 7-7z"/><path d="M19 3v3M17.5 4.5h3"/></>,
  drop:<path d="M12 3.5c3.6 4.2 6 7.3 6 10.5a6 6 0 0 1-12 0c0-3.2 2.4-6.3 6-10.5z"/>,
  sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/></>,
  sprout:<><path d="M12 21c0-4.7-1.8-8.1-6-10"/><path d="M12 21c0-5 1.6-8.7 6-11"/><path d="M7 12c-1.5-3.4-.5-6.7 2.1-8.5C11.5 6 12.4 8.4 12 11"/><path d="M17 12c1-3 .2-6-2.2-8.2-1.1 2.2-1.7 4.5-1.3 6.8"/></>,
  bug:<><ellipse cx="12" cy="13.5" rx="4.2" ry="5.5"/><path d="M12 8.5v10M9.5 5 12 6.5 14.5 5M7.8 12H4M16.2 12H20M8 16l-3 1.5M16 16l3 1.5M8.2 9 5.5 7.5M15.8 9l2.7-1.5"/></>,
  wind:<path d="M3 9h10a2.5 2.5 0 1 0-2.5-2.5M3 13h14a2.5 2.5 0 1 1-2.5 2.5M3 17h7"/>,
  alert:<><path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17.3v.2"/></>,
  volume:<><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></>,
  share:<><circle cx="6" cy="12" r="2.3"/><circle cx="18" cy="6" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="m8 11 8-4M8 13l8 4"/></>,
  history:<><path d="M4 12a8 8 0 1 0 2.6-5.9L4 8.5"/><path d="M4 4v4.5h4.5M12 8v4.5l3 1.8"/></>,
  star:<path d="m12 3.8 2.5 5.3 5.7.7-4.2 4 1.1 5.7L12 16.7 6.9 19.5 8 13.8l-4.2-4 5.7-.7z"/>,
  plus:<path d="M12 5v14M5 12h14"/>,
  minus:<path d="M5 12h14"/>,
  search:<><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
  globe:<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3C9.8 5.4 8.7 8.4 8.7 12S9.8 18.6 12 21"/></>,
  store:<><path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 12.5V20h13v-7.5M10 20v-4.5h4V20"/></>,
  cart:<><path d="M3 4h2.5l2 11h10.5l2-8H7"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/></>,
  file:<><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h3"/><path d="M9 12h6M9 16h5"/></>,
  lock:<><rect x="5" y="10.5" width="14" height="9.5" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></>,
  users:<><circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M17.5 14.6c2 .3 3.3 1.8 3.7 4.4"/></>,
  activity:<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>,
  flag:<path d="M5 21V4M5 4.5h11l-2 4 2 4H5"/>,
  clipboard:<><rect x="5.5" y="4.5" width="13" height="16" rx="2"/><path d="M9 4.5h6V7H9zM9 12h6M9 16h4"/></>,
  card:<><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 9h18M7 14h4"/></>,
  layers:<><path d="m12 3.5 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></>,
  residue:<><path d="M12 20c-4.6 0-7-2.8-7-7 0-3.4 2.1-6.7 5.6-9.5.7 3.1 2.3 4.5 4 5.5 1.8 1.1 3.4 2.6 3.4 5C18 17.2 15.6 20 12 20z"/><path d="M10 16c.8-1.7 2.3-3 4.1-3.7"/></>,
  trend:<><path d="M3 17l6.5-6.5 4 4L21 7"/><path d="M15 7h6v6"/></>,
  clock:<><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
  calendar:<><rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></>,
  refresh:<><path d="M20 11a8 8 0 0 0-14.3-4.5L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.5L20 15.5M20 20v-4.5h-4.5"/></>,
  upload:<><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15"/></>,
  flask:<><path d="M9.5 3.5h5M10.5 3.5v6L5 19a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 19l-5.5-9.5v-6"/><path d="M7.5 15.5h9"/></>,
  leaf:<><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19c3-4 6-7 10-9"/></>,
  coin:<><circle cx="12" cy="12" r="8.5"/><path d="M9 8h6M9 11h6M9.5 8c4 0 4.5 3.5 0 4l4.5 4.5"/></>,
  bolt:<path d="M13 3 5 13.5h6L10.5 21 19 10h-6z"/>,
  message:<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-9l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/>,
  list:<><path d="M8 7h12M8 12h12M8 17h12"/><circle cx="4" cy="7" r=".8"/><circle cx="4" cy="12" r=".8"/><circle cx="4" cy="17" r=".8"/></>,
  eye:<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></>,
  map:<><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/></>,
  scan:<><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M4 12h16"/></>,
  book:<><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15.5H6.5A1.5 1.5 0 0 0 5 20z"/><path d="M5 20a1.5 1.5 0 0 0 1.5 1.5H19v-3M9 8h6M9 11.5h4"/></>,
  info:<><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.2"/></>,
  download:<><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4.5 19h15"/></>,
  power:<path d="M12 3.5v8M7.3 6.3a7.5 7.5 0 1 0 9.4 0"/>,
  menu:<path d="M4 7h16M4 12h16M4 17h16"/>,
  target:<><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/></>,
  heart:<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>,
  stop:<rect x="6" y="6" width="12" height="12" rx="2.5"/>,
  play:<path d="M8 5.5v13l11-6.5z"/>,
};
function Icon({ name, size=22, stroke=1.8, className, style }){
  return h('svg', { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:stroke,
    strokeLinecap:'round', strokeLinejoin:'round', 'aria-hidden':'true', className:'ic '+(className||''), style }, ICONS[name] || ICONS.arrowR);
}

/* ============================= LOGO ============================= */
function Logo({ size=40, tone='dark' }){
  const bg = tone==='light' ? '#FFFFFF' : '#14532D';
  const arch = tone==='light' ? '#14532D' : '#F5B324';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="logo-mark">
      <rect width="48" height="48" rx="15" fill={bg}/>
      <path d="M8 35h32" stroke={arch} strokeWidth="3" strokeLinecap="round"/>
      <path d="M11 35c0-9 5.6-15 13-15s13 6 13 15" stroke={arch} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M15 35v5M33 35v5M24 35v5" stroke={arch} strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M24 21v-9" stroke="#79D07E" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M24 15c-4.5.2-6.6-1.8-6.8-5.4 4.4-.2 6.6 1.8 6.8 5.4z" fill="#79D07E"/>
      <path d="M24 17.5c4.2 0 6.4-2 6.6-5.2-4.2-.1-6.4 1.9-6.6 5.2z" fill="#A5E6A0"/>
    </svg>
  );
}

/* ============================= CROP ART ============================= */
function CropArtSvg({ id, size=56, className }){
  const s = { width:size, height:size };
  const common = { viewBox:'0 0 64 64', style:s, className:'crop-art '+(className||''), 'aria-hidden':'true' };
  switch(id){
    case 'tomato': return (
      <svg {...common}>
        <defs><radialGradient id="gTom" cx="36%" cy="30%" r="78%"><stop offset="0" stopColor="#FF8C74"/><stop offset=".5" stopColor="#E5483A"/><stop offset="1" stopColor="#AE2A24"/></radialGradient></defs>
        <ellipse cx="32" cy="58.5" rx="17" ry="3" fill="rgba(20,26,63,.14)"/>
        <path d="M32 13c14.5 0 24 8.6 24 20.5S46.500 55 32 55 8 45.400 8 33.500 17.500 13 32 13z" fill="url(#gTom)"/>
        <path d="M19 24c2.800-4.200 6.800-6.200 11.500-6.500" stroke="#fff" strokeOpacity=".6" strokeWidth="3.200" fill="none" strokeLinecap="round"/>
        <path d="M32 14.500l-5 6-8.500-1.500 6 6L21 33l11-5.500L43 33l-3.500-8 6-6L37 20.500z" fill="#3FA046"/>
        <path d="M32 15V8c0-1.800 1.200-3 3-3.800" stroke="#2C7A36" strokeWidth="2.800" fill="none" strokeLinecap="round"/>
      </svg>);
    case 'onion': return (
      <svg {...common}>
        <defs><linearGradient id="gOn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F0B4D8"/><stop offset=".5" stopColor="#B85496"/><stop offset="1" stopColor="#7A2C66"/></linearGradient></defs>
        <ellipse cx="32" cy="59" rx="16" ry="2.800" fill="rgba(20,26,63,.14)"/>
        <path d="M32 9c1.800 6.500 3.200 9 8.500 12.500C49.500 27.500 54 34 54 42c0 9-8.500 15-22 15S10 51 10 42c0-8 4.500-14.500 13.500-20.500C28.800 18 30.200 15.500 32 9z" fill="url(#gOn)"/>
        <path d="M32 12c-9 8-13.500 19-11 43M32 12c9 8 13.500 19 11 43M32 14c-3.500 11-3.500 24 0 41" stroke="#fff" strokeOpacity=".32" strokeWidth="1.700" fill="none" strokeLinecap="round"/>
        <path d="M30 11c-1.500-5 0-8 2-9.500M34 11c1-4.500 3.500-6.500 6-7.500" stroke="#7DB35B" strokeWidth="2.600" fill="none" strokeLinecap="round"/>
        <path d="M26 57l-2.500 4M32 57.500v4M38 57l2.500 4" stroke="#CDAF90" strokeWidth="1.700" strokeLinecap="round"/>
      </svg>);
    case 'potato': return (
      <svg {...common}>
        <defs><linearGradient id="gPo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EBC98F"/><stop offset=".55" stopColor="#C99B60"/><stop offset="1" stopColor="#966A3B"/></linearGradient></defs>
        <ellipse cx="32" cy="57.500" rx="20" ry="3" fill="rgba(20,26,63,.14)"/>
        <path d="M11 29c3-10 16-15 28-12 10.500 2.700 15 12.500 12 22.500C48 49.500 37 56 25 54 13.500 52 7 39 11 29z" fill="url(#gPo)"/>
        <path d="M18 24c3-4.500 8-6.500 13-6.500" stroke="#fff" strokeOpacity=".5" strokeWidth="3" fill="none" strokeLinecap="round"/>
        {[[25,34],[38,28],[41,42],[29,46],[19,40]].map(([x,y],i)=><g key={i}><ellipse cx={x} cy={y} rx="2.200" ry="1.400" fill="#7C5430" transform={`rotate(${i*35} ${x} ${y})`}/><ellipse cx={x-.6} cy={y-.5} rx=".9" ry=".5" fill="#fff" fillOpacity=".3"/></g>)}
      </svg>);
    case 'wheat': return (
      <svg {...common}>
        <defs><linearGradient id="gWh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDD79"/><stop offset="1" stopColor="#D69A12"/></linearGradient></defs>
        {[[-16,20,.86],[0,32,1],[16,44,.86]].map(([rot,cx,sc],k)=>(
          <g key={k} transform={`rotate(${rot} ${cx} 60) translate(${cx*(1-sc)} ${60*(1-sc)}) scale(${sc})`}>
            <path d={`M${cx} 61V22`} stroke="#9A7A22" strokeWidth="2.200" strokeLinecap="round"/>
            {[0,1,2,3,4].map(i=>{ const y=14+i*7; return <g key={i}>
              <ellipse cx={cx-3.600} cy={y+4} rx="3.600" ry="6" fill="url(#gWh)" transform={`rotate(-26 ${cx-3.600} ${y+4})`}/>
              <ellipse cx={cx+3.600} cy={y+4} rx="3.600" ry="6" fill="url(#gWh)" transform={`rotate(26 ${cx+3.600} ${y+4})`}/>
            </g>; })}
            <ellipse cx={cx} cy="9" rx="3" ry="6" fill="url(#gWh)"/>
            <path d={`M${cx} 5V-2M${cx-4} 8 ${cx-9} 0M${cx+4} 8 ${cx+9} 0`} stroke="#B98B1E" strokeWidth="1.200" strokeLinecap="round"/>
          </g>))}
      </svg>);
    case 'cauliflower': return (
      <svg {...common}>
        <defs><radialGradient id="gCa" cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#FFFFF6"/><stop offset="1" stopColor="#EADFB8"/></radialGradient></defs>
        <ellipse cx="32" cy="59" rx="22" ry="3" fill="rgba(20,26,63,.14)"/>
        <path d="M5 38c0-15 11-24 27-24s27 9 27 24c0 9-9 17-27 17S5 47 5 38z" fill="#4C9A3E"/>
        <path d="M32 55V40M20 50c-5-4-8-9-8-14M44 50c5-4 8-9 8-14" stroke="#3B7E31" strokeWidth="1.600" fill="none" strokeLinecap="round"/>
        {[[32,30,13],[21,35,10],[43,35,10],[26,22,9],[38,22,9],[32,40,10]].map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} fill="url(#gCa)" stroke="#DDD1A4" strokeWidth=".8"/>)}
        {[[28,27,4],[36,26,3.500],[24,37,3.500],[40,38,3.500],[32,35,4]].map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} fill="#fff" fillOpacity=".55"/>)}
        <path d="M6 42c4 8 12 12 26 12-8-3-13-6-15-12z" fill="#5FB04C"/>
        <path d="M58 42c-4 8-12 12-26 12 8-3 13-6 15-12z" fill="#57A845"/>
      </svg>);
    case 'stalks': return (
      <svg {...common}>
        <ellipse cx="32" cy="59" rx="18" ry="2.800" fill="rgba(20,26,63,.14)"/>
        {[[16,-10],[24,-4],[32,0],[40,5],[48,11]].map(([x,r],i)=><g key={i} transform={`rotate(${r} ${x} 58)`}><rect x={x-2.300} y="6" width="4.600" height="52" rx="2.300" fill="#C9A24A"/>{[16,28,40].map(y=><rect key={y} x={x-2.900} y={y} width="5.800" height="2.400" rx="1" fill="#8B6B22"/>)}<rect x={x-2.300} y="6" width="1.600" height="52" rx=".8" fill="#fff" fillOpacity=".25"/></g>)}
        <rect x="14" y="36" width="36" height="6" rx="3" fill="#D8432F"/>
      </svg>);
    case 'straw': return (
      <svg {...common}>
        <ellipse cx="32" cy="58" rx="24" ry="3" fill="rgba(20,26,63,.14)"/>
        <rect x="6" y="18" width="52" height="38" rx="9" fill="#E9BF4E"/>
        <rect x="6" y="18" width="52" height="12" rx="9" fill="#F5D57A"/>
        {[14,22,30,38,46,54].map((x,i)=><path key={i} d={`M${x} 22V52`} stroke="#B98B1E" strokeWidth="1.100" strokeOpacity=".5"/>)}
        <rect x="6" y="28" width="52" height="3.400" fill="#8F6A14" fillOpacity=".7"/>
        <rect x="6" y="43" width="52" height="3.400" fill="#8F6A14" fillOpacity=".7"/>
        <path d="M14 18 10 10M24 18l-1-9M40 18l2-8M50 18l5-7" stroke="#E0B03E" strokeWidth="2.200" strokeLinecap="round"/>
      </svg>);
    case 'husk': return (
      <svg {...common}>
        <ellipse cx="32" cy="58" rx="24" ry="3" fill="rgba(20,26,63,.14)"/>
        <path d="M6 56C10 32 22 18 32 18s22 14 26 38z" fill="#C6934F"/>
        <path d="M6 56C10 40 18 30 32 30s22 10 26 26z" fill="#B27F3E"/>
        {[[22,36],[32,28],[42,36],[16,48],[28,44],[38,46],[48,50],[24,22],[38,24]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="3.600" ry="1.800" fill="#E6BE7E" transform={`rotate(${i*40-30} ${x} ${y})`}/>)}
      </svg>);
    default: return <svg {...common}><path d="M12 52c0-22 14-36 40-40 0 24-14 40-36 40" fill="#4FA24F"/><path d="M12 52c8-10 16-18 28-24" stroke="#fff" strokeOpacity=".5" strokeWidth="2.400" fill="none"/></svg>;
  }
}

/* ============================= MOTION HOOKS ============================= */
const REDUCED = typeof window!=='undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function useCountUp(target, ms=1000, delay=0){
  const [v, setV] = useState(REDUCED ? target : 0);
  useEffect(()=>{
    if(REDUCED){ setV(target); return; }
    let raf, start=null, timer;
    const step = (ts)=>{ if(start===null) start=ts; const p=Math.min(1,(ts-start)/ms); setV(target*(1-Math.pow(1-p,3))); if(p<1) raf=requestAnimationFrame(step); };
    timer = setTimeout(()=>{ raf=requestAnimationFrame(step); }, delay);
    return ()=>{ clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [target]);
  return v;
}
function Num({ value, prefix='', suffix='', decimals=0, ms=1000, delay=0 }){
  const v = useCountUp(+value||0, ms, delay);
  return <span className="num">{prefix}{decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-IN')}{suffix}</span>;
}
function useInView(once=true, threshold=0.25){
  const ref = useRef(null); const [seen, setSeen] = useState(false);
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    if(typeof IntersectionObserver==='undefined'){ setSeen(true); return; }
    const io = new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ setSeen(true); if(once) io.disconnect(); } else if(!once) setSeen(false); }); }, { threshold });
    io.observe(el); return ()=>io.disconnect();
  }, []);
  return [ref, seen];
}
function useMountFlag(delay=30){
  const [on, setOn] = useState(false);
  useEffect(()=>{ const id = setTimeout(()=>setOn(true), delay); return ()=>clearTimeout(id); }, []);
  return on;
}

/* ============================= VOICE (text to speech) ============================= */
const canSpeak = typeof window!=='undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance!=='undefined';
function useSpeech(lang){
  const [speaking, setSpeaking] = useState(false);
  useEffect(()=>()=>{ try{ if(canSpeak) window.speechSynthesis.cancel(); }catch(e){} }, []);
  const stop = useCallback(()=>{ try{ if(canSpeak) window.speechSynthesis.cancel(); }catch(e){} setSpeaking(false); }, []);
  const speak = useCallback((text)=>{
    if(!canSpeak || !text) return;
    try{
      window.speechSynthesis.cancel();
      const u = new window.SpeechSynthesisUtterance(text);
      const code = speechLang(lang); u.lang = code; u.rate = 0.92;
      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      const v = voices.find(x=>x.lang===code) || voices.find(x=>x.lang && x.lang.slice(0,2)===code.slice(0,2));
      if(v) u.voice = v;
      u.onend = ()=>setSpeaking(false); u.onerror = ()=>setSpeaking(false);
      setSpeaking(true); window.speechSynthesis.speak(u);
    }catch(e){ setSpeaking(false); }
  }, [lang]);
  return { speaking, speak, stop, supported: canSpeak };
}


/* ============================= REAL MEDIA SLOTS =============================
   Drop real photos/video into ./assets (see assets/README.md). `npm run build` inlines small files into index.html.
   Anything missing falls back to the built-in illustration, so the app never shows a broken image.            */
const assetState = {};
const REAL_PHOTO_FILES = {
  'assets/hero.jpg':'Woman harvesting wheat, Raisen district, Madhya Pradesh, India ggia version.jpg',
  'assets/login/dawn.jpg':'Woman harvesting wheat, Raisen district, Madhya Pradesh, India ggia version.jpg',
  'assets/login/peach.jpg':'Fresh vegetables being sold.jpg',
  'assets/login/dusk.jpg':'Tomatos ready for dispatch.jpg',
  'assets/roles/farmer.jpg':'Woman harvesting wheat, Raisen district, Madhya Pradesh, India ggia version.jpg',
  'assets/roles/buyer.jpg':'Fresh vegetables being sold.jpg',
  'assets/roles/consumer.jpg':'Nikhilmore vegetable basket bhimashankar.jpg',
  'assets/roles/logistics.jpg':'Delivery service.jpg',
  'assets/roles/admin.jpg':'India - Koyambedu Market - Faces 01 (3983959747).jpg',
  'assets/crops/tomato.jpg':'Tomatoes in India (2024) 2.jpg',
  'assets/crops/onion.jpg':'Onions.JPG',
  'assets/crops/potato.jpg':'So many potatoes (4822444589).jpg',
  'assets/crops/wheat.jpg':'Indian wheat farms.jpg',
  'assets/crops/cauliflower.jpg':'Cauliflower NP.jpg',
  'assets/crops/bajra.jpg':'Pearl millet.jpg',
  'assets/crops/mustard.jpg':'Mustard field.jpg',
  'assets/crops/cumin.jpg':'Cumin seeds.jpg',
  'assets/crops/guar.jpg':'Cyamopsis tetragonoloba.jpg',
  'assets/crops/groundnut.jpg':'Peanuts.jpg',
  'assets/crops/gram.jpg':'Chickpea.jpg',
  'assets/crops/soybean.jpg':'Soybean.USDA.jpg',
  'assets/crops/cotton.jpg':'CottonPlant.JPG',
  'assets/samples/tomato.jpg':'Early blight on tomato leaves (7871930010).jpg',
  'assets/samples/onion.jpg':'Zwiebel Blattfleckenkrankheit (Cladosporium allii-cepae) Anamorph - Noé López G.LLG-Bernburg.jpg',
  'assets/samples/cauliflower.jpg':'Cauliflower NP.jpg'
};
function remoteRealPhoto(path){
  const file = REAL_PHOTO_FILES[path];
  return file ? 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(file) : null;
}
function assetSrc(path){
  return (typeof window!=='undefined' && window.__ASSETS__ && window.__ASSETS__[path])
    || remoteRealPhoto(path)
    || path;
}
function hasAsset(path){ return !!((typeof window!=='undefined' && window.__ASSETS__ && window.__ASSETS__[path]) || remoteRealPhoto(path) || assetState[path]==='ok'); }
function Photo({ src, alt='', className, style, fallback=null }){
  const [bad, setBad] = useState(assetState[src]==='bad');
  if(bad) return fallback;
  return <img src={assetSrc(src)} alt={alt} className={className} style={style} loading="lazy" decoding="async" onLoad={()=>{ assetState[src]='ok'; }} onError={()=>{ assetState[src]='bad'; setBad(true); }}/>;
}
function CropArt({ id, size=56, className }){
  const svg = <CropArtSvg id={id} size={size} className={className}/>;
  return <Photo src={'assets/crops/'+id+'.jpg'} alt={id} className={'crop-photo '+(className||'')} style={{ width:size, height:size }} fallback={svg}/>;
}
