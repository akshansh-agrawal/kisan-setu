const RESIDUE_TYPES = [
  { id:'stalks', label:'Stalks', matchLabel:'Biofuel / Biomass Plant', icon:'🌿' },
  { id:'straw',  label:'Straw',  matchLabel:'Cattle Feed Producer', icon:'🌾' },
  { id:'husk',   label:'Husk',   matchLabel:'Mushroom Farm / Compost Unit', icon:'🍂' },
];

const PESTICIDE_LIMITS = [
  { key:'chlorpyrifos', label:'Chlorpyrifos', limit:0.2, unit:'mg/kg' },
  { key:'cypermethrin', label:'Cypermethrin', limit:0.5, unit:'mg/kg' },
  { key:'malathion',    label:'Malathion',    limit:1.0, unit:'mg/kg' },
];

const GLUT_SOWING_THRESHOLD = 5;   // farmers planning same crop in a region before early warning
const GLUT_LISTING_THRESHOLD = 4;  // active listings of same crop in a region before glut alert
const ESCROW_APPROVAL_THRESHOLD = 5000; // rupees; above this needs 4-eyes approval
// Planning-level cultivation cost estimates used only when a farmer does not enter their own cost.
const CROP_COST_PER_KG = { tomato:9, onion:7, potato:6, wheat:15, cauliflower:10 };
function estimateCultivationCost(cropId, qty){ return +(CROP_COST_PER_KG[cropId]||8) * (+qty||0); }
function buildLogisticsBreakdown(logisticsCut){
  const total=+logisticsCut||0;
  return { pickup:+(total*.20).toFixed(2), aggregation:+(total*.15).toFixed(2), transport:+(total*.45).toFixed(2), handling:+(total*.10).toFixed(2), lastMile:+(total*.10).toFixed(2) };
}

function uid(prefix){ return prefix + '_' + Math.random().toString(36).slice(2,9); }
function nowISO(){ return new Date().toISOString(); }
function fmtTime(iso){ try{ return new Date(iso).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }catch(e){ return ''; } }
function fmtMoney(n){ return '₹' + Math.round(n).toLocaleString('en-IN'); }
function hoursSince(iso){ return (Date.now() - new Date(iso).getTime())/36e5; }
// deterministic pseudo-random from a string seed, so values are stable per farmer+crop
function seededRandom(seed){
  let h = 0; for(let i=0;i<seed.length;i++){ h = (h*31 + seed.charCodeAt(i)) >>> 0; }
  return function(){ h = (h*1664525 + 1013904223) >>> 0; return (h % 10000)/10000; };
}
/* ============================= STARTER ENTITIES ============================= */
const SEED_FARMERS = [
  { id:'f1', name:'Ramu', phone:'98290 11223', region:'Chomu', lang:'hi', kycVerified:true,
    trust:{ status:'safe', score:92, summary:'Residue levels well within government limits. Safe for direct sale.', values:{chlorpyrifos:0.06, cypermethrin:0.11, malathion:0.22}, uploadedAt:'2026-08-02T10:00:00Z', reviewed:true, adminApproved:true },
    creditHistory:[ {orderId:'seed1', amount:2360, paidAt:'2026-09-10T09:00:00Z'} ], },
  { id:'f2', name:'Sunita Devi', phone:'94141 55678', region:'Bassi', lang:'hi', kycVerified:true,
    trust:{ status:'caution', score:68, summary:'Cypermethrin close to the limit. Recommend reviewing spray schedule.', values:{chlorpyrifos:0.09, cypermethrin:0.44, malathion:0.31}, uploadedAt:'2026-08-10T10:00:00Z', reviewed:true, adminApproved:true },
    creditHistory:[], },
  { id:'f3', name:'Bhairon Lal Jat', phone:'99290 88332', region:'Phulera', lang:'mr', kycVerified:false,
    trust:null, creditHistory:[], },
  { id:'f4', name:'Kamla Meena', phone:'97831 22109', region:'Chomu', lang:'pa', kycVerified:true,
    trust:{ status:'safe', score:95, summary:'All tested residues negligible. Strong trust profile.', values:{chlorpyrifos:0.03, cypermethrin:0.08, malathion:0.10}, uploadedAt:'2026-07-28T10:00:00Z', reviewed:true, adminApproved:true },
    creditHistory:[ {orderId:'seed2', amount:1180, paidAt:'2026-09-12T09:00:00Z'}, {orderId:'seed3', amount:980, paidAt:'2026-09-15T09:00:00Z'} ], },
  { id:'f5', name:'Devi Lal Saini', phone:'96690 77441', region:'Dudu', lang:'hi', kycVerified:true,
    trust:{ status:'safe', score:88, summary:'Within safe limits across all tested residues.', values:{chlorpyrifos:0.07, cypermethrin:0.15, malathion:0.28}, uploadedAt:'2026-08-14T10:00:00Z', reviewed:true, adminApproved:true },
    creditHistory:[], },
];

const SEED_BUYERS = [
  { id:'b1', businessName:'Hotel Rajputana Heritage', type:'Hotel', region:'Sanganer', contact:'Anita Rathore', role:'Purchasing Manager', deliveryWindow:'6:00–8:00 AM', verified:true },
  { id:'b2', businessName:'Spice Route Restaurant', type:'Restaurant', region:'Chomu', contact:'Vikram Shekhawat', role:'Head Chef', deliveryWindow:'7:00–9:00 AM', verified:true },
  { id:'b3', businessName:'FreshMart Retail', type:'Retailer', region:'Bassi', contact:'Preeti Agarwal', role:'Category Manager', deliveryWindow:'5:30–7:30 AM', verified:true },
];

const SEED_INDUSTRIAL_BUYERS = [
  { id:'ib1', businessName:'India BioEnergy Co-op', type:'Biofuel / Biomass Plant', region:'Chomu', approved:true, matches:['stalks'] },
  { id:'ib2', businessName:'Shekhawati Cattle Feed Mill', type:'Cattle Feed Producer', region:'Bassi', approved:true, matches:['straw'] },
  { id:'ib3', businessName:'Pink City Mushroom Farms', type:'Mushroom Farm / Compost Unit', region:'Phulera', approved:true, matches:['husk'] },
  { id:'ib4', businessName:'GreenCycle Compost Works', type:'Mushroom Farm / Compost Unit', region:'Dudu', approved:false, matches:['husk'] },
];

function makeInitialState(){
  return {
    farmers: SEED_FARMERS,
    buyers: SEED_BUYERS,
    industrialBuyers: SEED_INDUSTRIAL_BUYERS,
    listings: [
      { id:'lst_seed1', farmerId:'f1', cropId:'tomato', qty:400, remainingQty:400, price:14, region:'Chomu', harvestDate:'2026-09-20', createdAt:'2026-09-17T06:00:00Z', flashSale:false },
      { id:'lst_seed2', farmerId:'f4', cropId:'onion', qty:300, remainingQty:300, price:11, region:'Chomu', harvestDate:'2026-09-19', createdAt:'2026-09-16T06:00:00Z', flashSale:false },
      { id:'lst_seed3', farmerId:'f5', cropId:'potato', qty:250, remainingQty:250, price:9, region:'Dudu', harvestDate:'2026-09-21', createdAt:'2026-09-17T07:00:00Z', flashSale:false },
      { id:'lst_seed4', farmerId:'f2', cropId:'cauliflower', qty:150, remainingQty:150, price:15, region:'Bassi', harvestDate:'2026-09-22', createdAt:'2026-09-17T07:30:00Z', flashSale:false },
    ],        // {id, farmerId, cropId, qty, remainingQty, price, region, harvestDate, createdAt, flashSale, kycVerifiedAtListing}
    residueListings: [], // {id, farmerId, typeId, qty, createdAt, matchedBuyerId, orderId}
    sowingIntents: [],   // {id, farmerId, cropId, area, region, createdAt}
    regionSowingCounts: {}, // { [region]: { [cropId]: count } }
    orders: [],           // see createOrder shape
    todaysRoute: { id:'route_today', stops: [] }, // stops: {id, kind:'pickup'|'delivery', orderId, farmerId?, buyerId?, status, label, region, extraStock}
    gluts: [],             // {id, region, cropId, discountPct, active, createdAt, source}
    consumerOrders: [],    // lightweight consumer purchases
    voiceCallLog: [],      // {id, farmerId, lang, intent, createdAt}
    auditLog: [],          // {id, actor, action, detail, createdAt}
    fraudFlags: [
      { id:'ff1', title:'Repeated cancellations', detail:'Farmer account "Mohan Lal" (unverified) cancelled 3 listings within 1 hour on 12 Sep.', dismissed:false, severity:'medium' },
    ],
    scans: [],             // crop-doctor field diary: {id, farmerId, createdAt, thumb, sample, result}
    toasts: [],
  };
}
/* ============================= HELPERS ============================= */
function mkToast(msg){ return { id: uid('toast'), msg, createdAt: Date.now() }; }
function mkAudit(actor, action, detail){ return { id: uid('aud'), actor, action, detail, createdAt: nowISO() }; }
function trustScoreOf(state, farmerId){ const f = state.farmers.find(x=>x.id===farmerId); return f && f.trust ? f.trust.score : 0; }
function kycState(f){ return f.kycStatus || (f.kycVerified ? 'approved' : 'pending'); }
function buyerState(b){ return b.verifyStatus || (b.verified ? 'approved' : 'pending'); }
function indState(x){ return x.decision || (x.approved ? 'approved' : 'pending'); }
function decisionOf(approve){ return approve===true ? 'approved' : approve===false ? 'rejected' : 'pending'; }
function farmerMarketReady(state, farmerId){
  const f = state.farmers.find(x=>x.id===farmerId);
  if(!f) return false;
  return !!f.kycVerified && !!f.trust && !!f.trust.reviewed && f.trust.adminApproved===true && f.trust.status!=='high';
}
function activeGlutFor(state, region, cropId){ return state.gluts.find(g=> g.active && g.region===region && g.cropId===cropId) || null; }

function computeAllocations(state, { cropId, region, qty, maxFarmers }){
  let candidates = state.listings.filter(l => l.cropId===cropId && l.remainingQty>0 && farmerMarketReady(state, l.farmerId));
  candidates = candidates.slice().sort((a,b)=>{
    const aSame = a.region===region ? 0 : 1, bSame = b.region===region ? 0 : 1;
    if(aSame!==bSame) return aSame-bSame;
    const bt = trustScoreOf(state,b.farmerId) - trustScoreOf(state,a.farmerId);
    if(bt!==0) return bt;
    return a.price-b.price;
  });
  let remaining = qty, allocations = [];
  const cap = maxFarmers || 4;
  for(const l of candidates){
    if(remaining<=0 || allocations.length>=cap) break;
    const take = Math.min(remaining, l.remainingQty);
    if(take<=0) continue;
    allocations.push({ listingId:l.id, farmerId:l.farmerId, qty:take, price:l.price, region:l.region });
    remaining -= take;
  }
  return { allocations, qtyMatched: qty-remaining };
}

function matchAndCreateOrder(state, { cropId, qty, region, deliveryWindow, buyerId, buyerKind, buyerLabel, maxFarmers }){
  const { allocations, qtyMatched } = computeAllocations(state, { cropId, region, qty, maxFarmers });
  if(qtyMatched<=0){
    return { state: { ...state, toasts:[...state.toasts, mkToast('No verified listings available for that crop nearby yet.')] } };
  }
  const listings = state.listings.map(l=>{
    const a = allocations.find(x=>x.listingId===l.id);
    return a ? { ...l, remainingQty: l.remainingQty - a.qty } : l;
  });
  const avgFarmerPrice = allocations.reduce((s,a)=>s+a.price*a.qty,0) / qtyMatched;
  const buyerPrice = +(avgFarmerPrice/0.68).toFixed(2);
  const crossRegion = allocations.some(a=> a.region !== region);
  const orderId = uid('ord');
  const order = {
    id: orderId, buyerId: buyerId||null, buyerKind, buyerLabel,
    cropId, qtyRequested: qty, qtyMatched, allocations, buyerPrice,
    status: qtyMatched<qty ? 'partial' : 'matched',
    region, deliveryWindow, createdAt: nowISO(),
    pooled: allocations.length>1, crossRegion, isResidue:false,
    extra: [], ledger:null, deliveredAt:null, paidAt:null,
  };
  let stops = [ ...state.todaysRoute.stops ];
  allocations.forEach(a=>{
    const farmer = state.farmers.find(f=>f.id===a.farmerId);
    stops.push({ id: uid('stop'), kind:'pickup', orderId, farmerId:a.farmerId, status:'pending',
      label: `${a.qty}${'kg'} ${cropId} — ${farmer?farmer.name:''}`, region: farmer?farmer.region:region, extraStock:false });
  });
  stops.push({ id: uid('stop'), kind:'delivery', orderId, buyerId: buyerId||null, status:'pending',
    label: buyerLabel, region, extraStock:false });
  const msg = qtyMatched<qty
    ? `Order partially matched: ${qtyMatched}/${qty}kg found. Pooled ${allocations.length} farmer(s) — more supply needed for the rest.`
    : `Order matched${allocations.length>1?` — pooled ${allocations.length} farmers into a Virtual FPO`:''}.`;
  return { state: { ...state, listings, orders:[...state.orders, order], todaysRoute:{...state.todaysRoute, stops}, toasts:[...state.toasts, mkToast(msg)] }, order };
}

/* ============================= REDUCER ============================= */
function reducer(state, action){
  switch(action.type){

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t=>t.id!==action.id) };

    case 'REPLACE_STATE':
      return { ...makeInitialState(), ...action.state, toasts: state.toasts };

    case 'ENSURE_PROFILE': {        // create the person's record in the shared dataset the first time they sign in
      const u = action.user, p = u.profile || {};
      if(u.role==='farmer'){ if(state.farmers.some(f=>f.id===u.id)) return state;
        return { ...state, farmers:[...state.farmers, { id:u.id, name:u.name, phone:u.mobile, region:p.district||p.state||'', state:p.state||'', village:p.village||'', pincode:p.pincode||'', farmAcres:p.acres||'', crops:p.crops||[], lang:u.lang||'en', kycVerified:false, trust:null, creditHistory:[] }] }; }
      if(u.role==='buyer'){ if(state.buyers.some(b=>b.id===u.id)) return state;
        return { ...state, buyers:[...state.buyers, { id:u.id, businessName:p.businessName, type:p.businessType, region:p.city||p.state||'', contact:p.contactName, role:p.designation, deliveryWindow:p.deliveryWindow||'6-9 AM', email:p.email||'', gstin:p.gstin||'', address:p.address||'', pincode:p.pincode||'', state:p.state||'', phone:u.mobile, verified:false, templates:[] }] }; }
      if(u.role==='consumer'){ const cs = state.consumers||[]; if(cs.some(c=>c.id===u.id)) return state;
        return { ...state, consumers:[...cs, { id:u.id, name:u.name, phone:u.mobile, address:p.address, city:p.city, state:p.state, pincode:p.pincode }] }; }
      if(u.role==='logistics'){ const ds = state.drivers||[]; if(ds.some(d=>d.id===u.id)) return state;
        return { ...state, drivers:[...ds, { id:u.id, name:u.name, phone:u.mobile, vehicle:p.vehicleNumber, vehicleType:p.vehicleType, license:p.licenseNumber, region:p.city, state:p.state, createdAt:nowISO() }] }; }
      return state;
    }

    case 'REGISTER_DRIVER': {
      const drivers = state.drivers || [];
      if(drivers.some(d=>d.phone===action.phone)) return state;
      return { ...state, drivers:[...drivers, { id: uid('drv'), name:action.name, phone:action.phone, vehicle:action.vehicle||'', region:action.region||'', createdAt: nowISO() }] };
    }

    case 'CLEAR_SAMPLE': {      // removes the built-in starter records (anything present in a pristine seed)
      const seed = makeInitialState(); const out = { ...state };
      ['farmers','buyers','industrialBuyers','listings','fraudFlags','orders','scans','residueListings','sowingIntents'].forEach(k=>{
        if(Array.isArray(state[k])){ const ids = new Set((seed[k]||[]).map(x=>x.id)); out[k] = state[k].filter(x=>!ids.has(x.id)); } });
      out.todaysRoute = { ...state.todaysRoute, stops: (state.todaysRoute.stops||[]).filter(st=>!/^stop_seed/.test(st.id||'')) };
      return { ...out, toasts:[...state.toasts, mkToast('Starter records removed. Imported records remain.')] };
    }

    case 'IMPORT_ROWS': {       // rows come from a CSV the admin uploads: real farmers / buyers / drivers
      const rows = action.rows || []; let n = 0;
      if(action.kind==='farmers'){
        const have = new Set(state.farmers.map(f=>String(f.phone).replace(/\D/g,'')));
        const add = rows.filter(r=>r.name && r.phone && !have.has(String(r.phone).replace(/\D/g,''))).map(r=>({ id:uid('f'), name:r.name, phone:r.phone, region:r.district||r.region||'', lang:r.lang||'hi', farmAcres:r.acres||'', address:r.village||'', kycVerified:false, trust:null, creditHistory:[], imported:true }));
        n = add.length; return { ...state, farmers:[...state.farmers, ...add], toasts:[...state.toasts, mkToast(n+' farmers imported.')] };
      }
      if(action.kind==='buyers'){
        const add = rows.filter(r=>r.name).map(r=>({ id:uid('b'), businessName:r.name, type:r.type||'Retailer', region:r.district||r.region||'', contact:r.contact||'', phone:r.phone||'', role:'Purchasing Manager', deliveryWindow:r.window||'6-9 AM', verified:false, templates:[], imported:true }));
        n = add.length; return { ...state, buyers:[...state.buyers, ...add], toasts:[...state.toasts, mkToast(n+' bulk buyers imported.')] };
      }
      const have = new Set((state.drivers||[]).map(d=>String(d.phone).replace(/\D/g,'')));
      const add = rows.filter(r=>r.name && r.phone && !have.has(String(r.phone).replace(/\D/g,''))).map(r=>({ id:uid('drv'), name:r.name, phone:r.phone, vehicle:r.vehicle||'', region:r.district||r.region||'', createdAt:nowISO(), imported:true }));
      n = add.length; return { ...state, drivers:[...(state.drivers||[]), ...add], toasts:[...state.toasts, mkToast(n+' delivery partners imported.')] };
    }

    case 'RESET_DEMO':
      return makeInitialState();

    case 'REGISTER_FARMER': {
      const f = { id: action.id || uid('f'), name: action.name, phone: action.phone, region: action.region, lang: action.lang,
        kycVerified:false, trust:null, creditHistory:[] };
      return { ...state, farmers:[...state.farmers, f], toasts:[...state.toasts, mkToast('Registration received. Verification is in progress.')] };
    }

    case 'REGISTER_BUYER': {
      const b = { id: action.id || uid('b'), businessName: action.businessName, type: action.bizType, region: action.region,
        contact: action.contact, role: action.role, deliveryWindow: action.deliveryWindow, verified:false, templates:[] };
      return { ...state, buyers:[...state.buyers, b], toasts:[...state.toasts, mkToast('Business profile submitted for verification.')] };
    }

    case 'ADD_LISTING': {
      const { farmerId, cropId, qty, price, harvestDate, cultivationCostPerKg, photo } = action;
      const farmer = state.farmers.find(f=>f.id===farmerId);
      const costPerKg = +cultivationCostPerKg>0 ? +cultivationCostPerKg : (CROP_COST_PER_KG[cropId]||8);
      const listing = { id: uid('lst'), farmerId, cropId, qty, remainingQty:qty, price, cultivationCostPerKg:costPerKg, estimatedCost: !cultivationCostPerKg, region:farmer.region, harvestDate, createdAt: nowISO(), flashSale:false, photo: photo||null };
      let listings = [...state.listings, listing];
      const activeCount = listings.filter(l=> l.cropId===cropId && l.region===farmer.region && l.remainingQty>0).length;
      let gluts = state.gluts, toasts = [...state.toasts, mkToast('Listing published to matching buyers.')];
      if(activeCount >= GLUT_LISTING_THRESHOLD && !gluts.find(g=>g.active && g.region===farmer.region && g.cropId===cropId)){
        gluts = [...gluts, { id: uid('glut'), region:farmer.region, cropId, discountPct:30, active:true, createdAt: nowISO(), source:'auto' }];
        toasts = [...toasts, mkToast(`Glut risk: ${activeCount} active ${cropId} listings in ${farmer.region}. Flash-sale unlocked for that crop.`)];
      }
      return { ...state, listings, gluts, toasts };
    }

    case 'SUBMIT_SOWING_INTENT': {
      const { farmerId, cropId, area } = action;
      const farmer = state.farmers.find(f=>f.id===farmerId);
      const region = farmer.region;
      const regionSowingCounts = { ...state.regionSowingCounts, [region]: { ...(state.regionSowingCounts[region]||{}) } };
      regionSowingCounts[region][cropId] = (regionSowingCounts[region][cropId]||0) + 1;
      const intent = { id: uid('si'), farmerId, cropId, area, region, createdAt: nowISO() };
      const count = regionSowingCounts[region][cropId];
      const msg = count >= GLUT_SOWING_THRESHOLD
        ? `Early warning: ${count} farmers in ${region} are already planning ${cropId}. Consider an alternative this season.`
        : 'Sowing plan recorded. You\u2019ll be warned early if too many nearby farmers pick the same crop.';
      return { ...state, sowingIntents:[...state.sowingIntents, intent], regionSowingCounts, toasts:[...state.toasts, mkToast(msg)] };
    }

    case 'UPLOAD_SOIL_REPORT': {
      const { farmerId } = action;
      const rnd = seededRandom(farmerId + '_soil_' + Date.now());
      const values = {};
      PESTICIDE_LIMITS.forEach(p=>{ values[p.key] = +(rnd()*p.limit*1.35).toFixed(3); });
      const overLimit = PESTICIDE_LIMITS.some(p=> values[p.key] > p.limit);
      const nearLimit = !overLimit && PESTICIDE_LIMITS.some(p=> values[p.key] > p.limit*0.8);
      const status = overLimit ? 'high' : nearLimit ? 'caution' : 'safe';
      const score = overLimit ? 40+Math.floor(rnd()*15) : nearLimit ? 60+Math.floor(rnd()*15) : 85+Math.floor(rnd()*13);
      const summaryMap = {
        safe: 'All tested residues are well within government limits. Safe for direct sale.',
        caution: 'One or more residues are close to the government limit. Recommend reviewing spray schedule.',
        high: 'Residue levels exceed government limits. Verification review required before buyers can see this.',
      };
      const trust = { status, score, summary: summaryMap[status], values, uploadedAt: nowISO(), reviewed:false, adminApproved:null };
      const farmers = state.farmers.map(f=> f.id===farmerId ? { ...f, trust } : f);
      return { ...state, farmers, toasts:[...state.toasts, mkToast('Soil report analyzed. Trust score ready — pending verification review.')] };
    }

    case 'PLACE_ORDER': {
      const { buyerId, cropId, qty, deliveryWindow } = action;
      const buyer = state.buyers.find(b=>b.id===buyerId);
      const res = matchAndCreateOrder(state, { cropId, qty, region: buyer.region, deliveryWindow, buyerId, buyerKind:'bulk', buyerLabel: buyer.businessName, maxFarmers:4 });
      return res.state;
    }

    case 'CONSUMER_ORDER': {
      const { cropId, qty, region } = action;
      const res = matchAndCreateOrder(state, { cropId, qty, region, deliveryWindow:'Next available route', buyerId:null, buyerKind:'consumer', buyerLabel:`Consumer pickup point — ${region}`, maxFarmers:2 });
      return res.state;
    }

    case 'REQUEST_EXTRA_STOCK': {
      const { orderId, qty } = action;
      const orders = state.orders.map(o=> o.id===orderId ? { ...o, extra:[...o.extra, { qty, premiumPct:15, requestedAt: nowISO() }] } : o);
      return { ...state, orders, toasts:[...state.toasts, mkToast(`Requested ${qty}kg extra at a 15% premium — added to today's route.`)] };
    }

    case 'SAVE_RECURRING': {
      const { buyerId, cropId, qty, deliveryWindow, cadence } = action;
      const buyers = state.buyers.map(b=> b.id===buyerId ? { ...b, templates:[...(b.templates||[]), { id: uid('tpl'), cropId, qty, deliveryWindow, cadence }] } : b);
      return { ...state, buyers, toasts:[...state.toasts, mkToast('Saved as a recurring order template.')] };
    }

    case 'MARK_STOP_DONE': {
      const { stopId } = action;
      const stop = state.todaysRoute.stops.find(s=>s.id===stopId);
      if(!stop) return state;
      let stops = state.todaysRoute.stops.map(s=> s.id===stopId ? { ...s, status:'done', doneAt: nowISO() } : s);
      let orders = state.orders, farmers = state.farmers, toasts = state.toasts;
      const order = state.orders.find(o=>o.id===stop.orderId);
      if(order){
        if(stop.kind==='pickup'){
          const orderPickups = stops.filter(s=> s.orderId===order.id && s.kind==='pickup');
          const allDone = orderPickups.every(s=> s.status==='done');
          orders = orders.map(o=> o.id===order.id ? { ...o, status: allDone ? 'picked_up' : o.status } : o);
          toasts = [...toasts, mkToast('Pickup confirmed.')];
        } else if(stop.kind==='delivery'){
          const buyerTotal = order.qtyMatched * order.buyerPrice;
          const farmerCut = +(buyerTotal*0.68).toFixed(2), logisticsCut = +(buyerTotal*0.14).toFixed(2), platformCut = +(buyerTotal*0.18).toFixed(2);
          const farmerRevenue = order.allocations.reduce((sum,a)=>sum + a.qty*a.price, 0);
          const cultivationCost = order.allocations.reduce((sum,a)=>{ const l=state.listings.find(x=>x.id===a.listingId); return sum + a.qty*(l?.cultivationCostPerKg || CROP_COST_PER_KG[order.cropId] || 8); },0);
          const logisticsBreakdown = buildLogisticsBreakdown(logisticsCut);
          const ledger = { buyerTotal, farmerCut, logisticsCut, platformCut, farmerRevenue:+farmerRevenue.toFixed(2), cultivationCost:+cultivationCost.toFixed(2), farmerProfit:+(farmerRevenue-cultivationCost).toFixed(2), logisticsBreakdown, computedAt: nowISO() };
          const needsApproval = buyerTotal > ESCROW_APPROVAL_THRESHOLD;
          orders = orders.map(o=> o.id===order.id ? { ...o, status: needsApproval ? 'awaiting_second_approval' : 'paid', ledger, deliveredAt: nowISO(), paidAt: needsApproval ? null : nowISO() } : o);
          if(!needsApproval){
            farmers = farmers.map(f=>{
              const alloc = order.allocations.find(a=>a.farmerId===f.id);
              if(!alloc) return f;
              const amt = +(alloc.qty*alloc.price).toFixed(2);
              return { ...f, creditHistory:[...f.creditHistory, { orderId: order.id, amount:amt, paidAt: nowISO() }] };
            });
          }
          toasts = [...toasts, mkToast(needsApproval ? 'Delivered — high-value order held in escrow, awaiting finance sign-off.' : 'Delivered — escrow released to farmer(s) same day.')];
        }
      }
      return { ...state, todaysRoute:{ ...state.todaysRoute, stops }, orders, farmers, toasts };
    }

    case 'TOGGLE_EXTRA_STOCK': {
      const stops = state.todaysRoute.stops.map(s=> s.id===action.stopId ? { ...s, extraStock: !s.extraStock } : s);
      return { ...state, todaysRoute:{ ...state.todaysRoute, stops } };
    }

    case 'SELL_SURPLUS_NOW': {
      const stop = state.todaysRoute.stops.find(s=>s.id===action.stopId);
      if(!stop) return state;
      const order = state.orders.find(o=>o.id===stop.orderId);
      const cropId = order ? order.cropId : 'tomato';
      const farmer = state.farmers.find(f=>f.id===stop.farmerId);
      const qty = 10, price = 20, buyerTotal = qty*price;
      const microOrder = { id: uid('ord'), buyerId:null, buyerKind:'walkin', buyerLabel:'Roadside premium sale', cropId,
        qtyRequested:qty, qtyMatched:qty, allocations:[{farmerId: stop.farmerId, qty, price:+(price*0.68).toFixed(2)}],
        buyerPrice:price, status:'paid', region: stop.region, deliveryWindow:'On-route', createdAt: nowISO(),
        deliveredAt: nowISO(), paidAt: nowISO(), pooled:false, crossRegion:false, isResidue:false, extra:[],
        ledger:{ buyerTotal, farmerCut:+(buyerTotal*0.68).toFixed(2), logisticsCut:+(buyerTotal*0.14).toFixed(2), platformCut:+(buyerTotal*0.18).toFixed(2), computedAt: nowISO() } };
      const farmers = state.farmers.map(f=> f.id===stop.farmerId ? { ...f, creditHistory:[...f.creditHistory, { orderId: microOrder.id, amount:+(buyerTotal*0.68).toFixed(2), paidAt: nowISO() }] } : f);
      return { ...state, orders:[...state.orders, microOrder], farmers, toasts:[...state.toasts, mkToast(`Sold ${qty}kg surplus roadside at a premium. ${fmtMoney(buyerTotal*0.68)} credited to ${farmer?farmer.name:'farmer'} instantly.`)] };
    }

    case 'LIST_RESIDUE': {
      const { farmerId, typeId, qty } = action;
      const farmer = state.farmers.find(f=>f.id===farmerId);
      const rtype = RESIDUE_TYPES.find(r=>r.id===typeId);
      const priceMap = { stalks:3, straw:4, husk:2 };
      const price = priceMap[typeId] || 3;
      let matched = state.industrialBuyers.find(ib=> ib.approved && ib.matches.includes(typeId) && ib.region===farmer.region)
        || state.industrialBuyers.find(ib=> ib.approved && ib.matches.includes(typeId));
      const residueListing = { id: uid('rl'), farmerId, typeId, qty, createdAt: nowISO(), matchedBuyerId: matched? matched.id : null, orderId: null };
      let toasts = [...state.toasts];
      let orders = state.orders, stops = [...state.todaysRoute.stops];
      if(matched){
        const buyerTotal = qty*price/0.68;
        const orderId = uid('ord');
        residueListing.orderId = orderId;
        const order = { id: orderId, buyerId: matched.id, buyerKind:'industrial', buyerLabel: matched.businessName, cropId: typeId,
          qtyRequested: qty, qtyMatched: qty, allocations:[{farmerId, qty, price, region: farmer.region}], buyerPrice:+(price/0.68).toFixed(2),
          status:'matched', region: farmer.region, deliveryWindow:'Next collection run', createdAt: nowISO(), pooled:false, crossRegion: matched.region!==farmer.region,
          isResidue:true, residueType:typeId, extra:[], ledger:null, deliveredAt:null, paidAt:null };
        orders = [...orders, order];
        stops.push({ id: uid('stop'), kind:'pickup', orderId, farmerId, status:'pending', label:`${qty}kg ${rtype?rtype.label:typeId} — ${farmer.name}`, region: farmer.region, extraStock:false, isResidue:true });
        stops.push({ id: uid('stop'), kind:'delivery', orderId, buyerId: matched.id, status:'pending', label: matched.businessName, region: matched.region, extraStock:false, isResidue:true });
        toasts.push(mkToast(`Residue auto-matched to ${matched.businessName} (${matched.type}). Added to today's route.`));
      } else {
        toasts.push(mkToast('No approved industrial buyer for this residue type yet — listing saved, will match once one is approved.'));
      }
      return { ...state, residueListings:[...state.residueListings, residueListing], orders, todaysRoute:{...state.todaysRoute, stops}, toasts };
    }

    case 'OPT_IN_FLASH': {
      const listing = state.listings.find(l=>l.id===action.listingId);
      if(!listing) return state;
      const glut = activeGlutFor(state, listing.region, listing.cropId);
      const discounted = glut ? +(listing.price*(1-glut.discountPct/100)).toFixed(2) : listing.price;
      const listings = state.listings.map(l=> l.id===action.listingId ? { ...l, flashSale:true, originalPrice:l.price, price:discounted } : l);
      return { ...state, listings, toasts:[...state.toasts, mkToast('Flash-sale price is live. Nearby buyers and consumers notified.')] };
    }

    case 'TRIGGER_GLUT': {
      const { region, cropId } = action;
      if(state.gluts.find(g=>g.active && g.region===region && g.cropId===cropId)){
        return { ...state, toasts:[...state.toasts, mkToast('A glut alert is already active for this region and crop.')] };
      }
      const glut = { id: uid('glut'), region, cropId, discountPct:30, active:true, createdAt: nowISO(), source:'admin' };
      return { ...state, gluts:[...state.gluts, glut], auditLog:[mkAudit(action.actor||'Regional Ops Manager','Triggered glut alert', `${cropId} in ${region}`), ...state.auditLog], toasts:[...state.toasts, mkToast('Glut alert triggered and pushed to buyers & consumers in the region.')] };
    }

    case 'CANCEL_GLUT': {
      const glut = state.gluts.find(g=>g.id===action.glutId);
      const gluts = state.gluts.map(g=> g.id===action.glutId ? { ...g, active:false } : g);
      return { ...state, gluts, auditLog:[mkAudit(action.actor||'Regional Ops Manager','Cancelled glut alert', glut?`${glut.cropId} in ${glut.region}`:''), ...state.auditLog], toasts:[...state.toasts, mkToast('Glut alert cancelled.')] };
    }

    case 'ADMIN_VERIFY_KYC': {
      const { entityType, id, approve, actor } = action;
      const st = decisionOf(approve);
      let farmers = state.farmers, buyers = state.buyers, label = '';
      if(entityType==='farmer'){ farmers = state.farmers.map(f=> f.id===id ? { ...f, kycVerified: st==='approved', kycStatus: st } : f); label = state.farmers.find(f=>f.id===id)?.name; }
      else { buyers = state.buyers.map(b=> b.id===id ? { ...b, verified: st==='approved', verifyStatus: st } : b); label = state.buyers.find(b=>b.id===id)?.businessName; }
      const verb = st==='approved' ? 'Approved KYC' : st==='rejected' ? 'Rejected KYC' : 'Reopened KYC review';
      return { ...state, farmers, buyers, auditLog:[mkAudit(actor||'Verification Officer', verb, label), ...state.auditLog], toasts:[...state.toasts, mkToast(`${label}: ${verb.toLowerCase()}.`)] };
    }

    case 'ADMIN_REVIEW_TRUST': {
      const { farmerId, approve, actor } = action;
      const farmer = state.farmers.find(f=>f.id===farmerId);
      const farmers = state.farmers.map(f=> f.id===farmerId && f.trust ? { ...f, trust:{ ...f.trust, reviewed: approve!==null, adminApproved: approve } } : f);
      return { ...state, farmers, auditLog:[mkAudit(actor||'Verification Officer', approve===null?'Reopened soil report':approve?'Approved soil report':'Rejected soil report', farmer?farmer.name:''), ...state.auditLog], toasts:[...state.toasts, mkToast(`Soil report ${approve===null?'reopened':approve?'approved':'rejected'} for ${farmer?farmer.name:'farmer'}.`)] };
    }

    case 'ADMIN_RELEASE_ESCROW': {
      const { orderId, actor } = action;
      const order = state.orders.find(o=>o.id===orderId);
      if(!order) return state;
      const orders = state.orders.map(o=> o.id===orderId ? { ...o, status:'paid', paidAt: nowISO() } : o);
      const farmers = state.farmers.map(f=>{
        const alloc = order.allocations.find(a=>a.farmerId===f.id);
        if(!alloc) return f;
        const amt = +(alloc.qty*alloc.price).toFixed(2);
        return { ...f, creditHistory:[...f.creditHistory, { orderId: order.id, amount:amt, paidAt: nowISO() }] };
      });
      return { ...state, orders, farmers, auditLog:[mkAudit(actor||'Finance Admin','Released escrow (four-eyes approved)', `${fmtMoney(order.ledger?order.ledger.buyerTotal:0)} — order ${orderId}`), ...state.auditLog], toasts:[...state.toasts, mkToast('Escrow released after second approval.')] };
    }

    case 'ADMIN_APPROVE_INDUSTRIAL': {
      const { id, approve, actor } = action;
      const ib = state.industrialBuyers.find(x=>x.id===id);
      const industrialBuyers = state.industrialBuyers.map(x=> x.id===id ? { ...x, approved: approve===true, decision: decisionOf(approve) } : x);
      return { ...state, industrialBuyers, auditLog:[mkAudit(actor||'Verification Officer', approve===null?'Reopened industrial buyer':approve?'Approved industrial buyer':'Rejected industrial buyer', ib?ib.businessName:''), ...state.auditLog], toasts:[...state.toasts, mkToast(`${ib?ib.businessName:''} ${approve===null?'reopened':approve?'approved':'rejected'}.`)] };
    }

    case 'ADMIN_FPO_ACTION': {
      const { action:act, orderId, actor } = action;
      return { ...state, auditLog:[mkAudit(actor||'Super Admin', act==='merge'?'Merged Virtual FPO pool':'Split Virtual FPO pool', `Order ${orderId}`), ...state.auditLog], toasts:[...state.toasts, mkToast(`Pool ${act==='merge'?'merged':'split'} successfully.`)] };
    }

    case 'DISMISS_FRAUD_FLAG': {
      const flags = state.fraudFlags.map(f=> f.id===action.id ? { ...f, dismissed:true } : f);
      return { ...state, fraudFlags: flags, auditLog:[mkAudit(action.actor||'Support Agent','Dismissed fraud flag', action.id), ...state.auditLog] };
    }

    case 'LOG_VOICE_CALL': {
      const { farmerId, lang, intent } = action;
      return { ...state, voiceCallLog:[...state.voiceCallLog, { id: uid('call'), farmerId, lang, intent, createdAt: nowISO() }] };
    }

    case 'UPDATE_FARMER':
      return { ...state, farmers: state.farmers.map(f=> f.id===action.id ? { ...f, ...action.patch } : f), toasts:[...state.toasts, mkToast(action.silent?'':'Profile updated.')].filter(t=>t.msg) };
    case 'UPDATE_BUYER':
      return { ...state, buyers: state.buyers.map(b=> b.id===action.id ? { ...b, ...action.patch } : b), toasts:[...state.toasts, mkToast('Profile updated.')] };
    case 'REMOVE_LISTING':
      return { ...state, listings: state.listings.filter(l=>l.id!==action.id), toasts:[...state.toasts, mkToast('Listing removed.')] };

    case 'TOAST':
      return { ...state, toasts:[...state.toasts, mkToast(action.msg)] };

    case 'SAVE_SCAN': {
      const scans = [action.scan, ...state.scans.filter(x=>x.id!==action.scan.id)].slice(0, 40);
      return { ...state, scans, toasts:[...state.toasts, mkToast('Saved to your field diary.')] };
    }

    case 'DELETE_SCAN':
      return { ...state, scans: state.scans.filter(x=>x.id!==action.id) };

    default:
      return state;
  }
}
/* ============================= PERSISTENCE ============================= */
function loadJSON(key, fallback){
  try{ const raw = localStorage.getItem(key); if(!raw) return fallback; return JSON.parse(raw); }catch(e){ return fallback; }
}
function saveJSON(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){} }

function usePersistentAppState(){
  const [state, dispatch] = useReducer(reducer, undefined, ()=>{
    const saved = loadJSON('kisan_setu_state_v3', null);
    if(saved){ const fresh = makeInitialState(); return { ...fresh, ...saved, toasts: [] }; }
    return makeInitialState();
  });
  const sync = useRef({ rev:0, skip:false, timer:null, ready:false, dirty:false });
  const headers = ()=>{ const h=authHeaders(); if(window.KISAN_WRITE_TOKEN) h['x-write-token']=window.KISAN_WRITE_TOKEN; return h; };
  const push = (st)=>{ const { toasts, ...rest } = st;
    return fetch(API_BASE+'/api/state',{ method:'PUT', headers:headers(), body:JSON.stringify({ state:rest }) })
      .then(r=>{ if(r.status===401){ window.dispatchEvent(new Event('ks-unauth')); return {}; } return r.json(); }).then(j=>{ if(j && j.rev){ sync.current.rev=j.rev; sync.current.dirty=false; } }).catch(()=>{}); };
  // 1) first load + 2) poll for other users' changes (every 6s)
  useEffect(()=>{
    let stop=false;
    async function pull(first){
      try{
        if(!authToken()) return; const r = await fetch(API_BASE+'/api/state'+(sync.current.rev?('?rev='+sync.current.rev):''), { headers:authHeaders() }); if(r.status===401){ window.dispatchEvent(new Event('ks-unauth')); return; } const j = await r.json();
        if(stop) return;
        if(j.empty){ if(first){ sync.current.ready=true; push(stateRef.current); } return; }
        if(j.state && j.rev!==sync.current.rev && !sync.current.dirty){ sync.current.rev=j.rev; sync.current.skip=true; dispatch({ type:'REPLACE_STATE', state:j.state }); }
        sync.current.ready=true;
      }catch(e){}
    }
    pull(true); const iv = setInterval(()=>pull(false), 6000);
    window.KS_SYNC_FLUSH = ()=>{ clearTimeout(sync.current.timer); return (sync.current.ready && authToken()) ? push(stateRef.current) : Promise.resolve(); };
    window.KS_SYNC_NOW = ()=>{ sync.current.rev = 0; sync.current.dirty = false; return pull(true); };
    return ()=>{ stop=true; clearInterval(iv); };
  }, []);
  const stateRef = useRef(state); stateRef.current = state;
  useEffect(()=>{
    const { toasts, ...rest } = state;
    saveJSON('kisan_setu_state_v3', rest);
    if(sync.current.skip){ sync.current.skip=false; return; }
    if(!sync.current.ready || !authToken()) return;
    sync.current.dirty=true; clearTimeout(sync.current.timer);
    sync.current.timer = setTimeout(()=>push(stateRef.current), 700);
  }, [state]);
  return [state, dispatch];
}

const DEFAULT_SESSION = { role:null, farmerId:null, buyerId:null, lang:'en', screen:'home', adminRole:null, adminLoggedIn:false, buyerActiveUser:'manager' };
function usePersistentSession(){
  const [session, setSessionRaw] = useState(()=> loadJSON('kisan_setu_session_v3', DEFAULT_SESSION));
  useEffect(()=>{ saveJSON('kisan_setu_session_v3', session); }, [session]);
  const setSession = (patch)=> setSessionRaw(s=> ({ ...s, ...(typeof patch==='function'? patch(s) : patch) }));
  return [session, setSession];
}

const AppCtx = createContext(null);
function useApp(){ return useContext(AppCtx); }
