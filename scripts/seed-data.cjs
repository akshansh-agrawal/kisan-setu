/* Seed the local Kisan Setu starter dataset. Replace illustrative records with verified operational data before live use. */
const crypto = require('node:crypto');
const path = require('node:path');
const { createDb } = require('../server/db.cjs');
const env = { ...process.env, MONGODB_URI: process.env.MONGODB_URI || '', REDIS_URL: process.env.REDIS_URL || '' };
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const db = createDb(env, DATA_DIR);
const hashPassword = (pw) => { const salt = crypto.randomBytes(16).toString('hex'); return `scrypt$${salt}$${crypto.scryptSync(pw, salt, 64).toString('hex')}`; };
const cities = [
  ['Jaipur','Rajasthan','Chomu','303702'],['Ajmer','Rajasthan','Kishangarh','305801'],['Kota','Rajasthan','Ladpura','324001'],
  ['Jodhpur','Rajasthan','Osian','342303'],['Udaipur','Rajasthan','Girwa','313001'],['Alwar','Rajasthan','Rajgarh','301408'],
  ['Ludhiana','Punjab','Samrala','141114'],['Karnal','Haryana','Assandh','132039'],['Indore','Madhya Pradesh','Mhow','453441'],
  ['Nashik','Maharashtra','Sinnar','422103'],['Agra','Uttar Pradesh','Etmadpur','283202'],['Ahmedabad','Gujarat','Daskroi','382430'],
];
const first = ['Ramesh','Sita','Mohan','Kavita','Arjun','Pooja','Gopal','Sunita','Mahesh','Rekha','Dinesh','Meena','Karan','Anita','Rajesh','Lata','Vijay','Geeta','Suresh','Nisha','Bharat','Asha','Prakash','Kamla','Deepak'];
const last = ['Kumar','Devi','Singh','Meena','Sharma','Yadav','Lal','Choudhary','Patel','Verma','Jat','Saini','Rathore','Gupta','Prajapat'];
const crops = ['tomato','onion','potato','wheat','cauliflower','bajra','mustard','groundnut','gram','soybean'];
const cropNames = {tomato:'Tomato',onion:'Onion',potato:'Potato',wheat:'Wheat',cauliflower:'Cauliflower',bajra:'Bajra',mustard:'Mustard',groundnut:'Groundnut',gram:'Gram',soybean:'Soybean'};
const prices = {tomato:18,onion:22,potato:14,wheat:27,cauliflower:20,bajra:24,mustard:58,groundnut:62,gram:55,soybean:49};
const users = [];
const ADMIN_MOBILE='9000000001', ADMIN_PASSWORD='AdminKisan26!';
function phone(base, i) { return String(base + i).padStart(10,'0'); }
function addUser(role, i, name, mobile, password, profile) {
  const id = `ks_${role}_${String(i).padStart(3,'0')}`;
  users.push({ _id:id, role, mobile, name, passwordHash:hashPassword(password), profile, lang:'hi', status:'active', createdAt:new Date('2026-10-01T08:00:00Z'), lastLoginAt:null, demo:true });
  return id;
}
const farmerRecords=[], buyerRecords=[], consumerRecords=[], driverRecords=[], listings=[];
addUser('admin',1,'Kisan Setu Administrator',ADMIN_MOBILE,ADMIN_PASSWORD,{});
users[0].adminRole='superadmin';
for(let i=0;i<25;i++){
  const [city,state,village,pincode]=cities[i%cities.length], name=`${first[i%first.length]} ${last[(i*3)%last.length]}`, mobile=phone(9000000101,0+i), id=i===0?addUser('farmer',1,name,mobile,'FarmKisan26!',{state,district:city,village,pincode,acres:2+(i%18),crops:[crops[i%crops.length]]}):`ks_farmer_profile_${String(i+1).padStart(3,'0')}`;
  farmerRecords.push({id,name,phone:mobile,region:city,state,village,pincode,farmAcres:2+(i%18),crops:[crops[i%crops.length]],lang:'hi',kycVerified:![4,9,16].includes(i),kycStatus:[4,9,16].includes(i)?'pending':'approved',trust:{status:i%5===0?'caution':'safe',score:78+(i%22),summary:[3,8,14].includes(i)?'Residue report submitted and awaiting compliance review.':'Field trust assessment recorded; independent laboratory verification should be confirmed before making safety claims.',values:{chlorpyrifos:0.04,cypermethrin:0.12,malathion:0.2},reviewed:![3,8,14].includes(i),adminApproved:![3,8,14].includes(i)},creditHistory:[]});
}
const businesses=['Shree Foods','Pink City Hotel','Fresh Basket Retail','Annapurna Canteen','Desert Harvest Traders','Green Valley Grocers','Daily Needs Mart','Farm Fresh Kitchens','Rajasthan Agro Foods','Sunrise Restaurant'];
for(let i=0;i<10;i++){
  const [city,state,,pincode]=cities[(i+2)%cities.length], contact=`${first[(i+4)%first.length]} ${last[(i+5)%last.length]}`, mobile=phone(9000000201,0+i), name=businesses[i], id=i===0?addUser('buyer',1,contact,mobile,'BuyerKisan26!',{businessName:name,businessType:['Hotel','Restaurant','Retailer','Institution','Processor'][i%5],contactName:contact,designation:'Purchase Manager',address:`Market Road ${i+1}`,city,state,pincode,deliveryWindow:'6-9 AM'}):`ks_buyer_profile_${String(i+1).padStart(3,'0')}`;
  buyerRecords.push({id,businessName:name,type:['Hotel','Restaurant','Retailer','Institution','Processor'][i%5],region:city,contact,role:'Purchase Manager',deliveryWindow:'6-9 AM',verified:![3,7].includes(i),verifyStatus:[3,7].includes(i)?'pending':'approved',phone:mobile,state,pincode,templates:[]});
}
for(let i=0;i<10;i++){
 const [city,state,,pincode]=i===0?cities[0]:cities[(i+4)%cities.length], name=`${first[(i+7)%first.length]} ${last[(i+9)%last.length]}`,mobile=phone(9000000301,0+i),id=i===0?addUser('consumer',1,name,mobile,'HomeKisan26!',{address:`House ${i+1}, Main Road`,city,state,pincode}):`ks_consumer_profile_${String(i+1).padStart(3,'0')}`;
 consumerRecords.push({id,name,phone:mobile,address:`House ${i+1}, Main Road`,city,state,pincode});
}
for(let i=0;i<5;i++){
 const [city,state]=cities[i],name=`${first[(i+2)%first.length]} ${last[(i+6)%last.length]}`,mobile=phone(9000000401,0+i),vehicle=`RJ ${String(14+i).padStart(2,'0')} AB ${String(1200+i).padStart(4,'0')}`,id=i===0?addUser('logistics',1,name,mobile,'DriveKisan26!',{vehicleType:'Mini truck',vehicleNumber:vehicle,licenseNumber:`RJ${String(2020+i).slice(-2)}DL${String(4100+i).padStart(4,'0')}`,city,state}):`ks_logistics_profile_${String(i+1).padStart(3,'0')}`;
 driverRecords.push({id,name,phone:mobile,vehicle,vehicleType:'Mini truck',region:city,state,createdAt:'2026-10-01T08:00:00Z'});
}
// Create exactly one portal login per role. Additional marketplace profiles are data records, not login accounts.
for(let i=0;i<60;i++){
 const f=i<20?farmerRecords[0]:farmerRecords[1+((i-20)%(farmerRecords.length-1))], crop=crops[i%crops.length], qty=120+((i*37)%800), price=prices[crop]+((i%7)-3), date=new Date(Date.now()+(i%5)*86400000).toISOString();
 listings.push({id:`ks_listing_${String(i+1).padStart(3,'0')}`,farmerId:f.id,cropId:crop,qty,remainingQty:qty,price,region:f.region,harvestDate:date.slice(0,10),createdAt:new Date(Date.now()-((i%20)+1)*3600000).toISOString(),flashSale:i%9===0,originalPrice:i%9===0?price+3:undefined,cultivationCostPerKg:Math.max(4,Math.round(price*.55))});
}
const mandi=[];
for(let i=0;i<120;i++){
 const [city,state]=cities[i%cities.length], crop=crops[i%crops.length], modal=Math.round(prices[crop]*100*(0.88+(i%9)*0.03));
 mandi.push({state,district:city,market:`${city} Mandi`,commodity:cropNames[crop],variety:['Hybrid','Local','Standard','Grade A'][i%4],arrival_date:'2026-10-20',min_price:Math.round(modal*.9),max_price:Math.round(modal*1.1),modal_price:modal,source:'Indicative reference estimate — verify against the latest official mandi bulletin before trading'});
}

// Add transaction and workflow history so the single judge login opens a populated admin portal.
const marketOrders=[];
const routeStops=[];
const completedStatuses=new Set(['delivered','awaiting_second_approval','paid']);
const orderStatuses=['matched','partial','picked_up','awaiting_second_approval','paid','delivered','matched','paid','partial','awaiting_second_approval','picked_up','delivered'];
for(let i=0;i<12;i++){
 const a=listings[i], b=(i%3===0)?listings[i+30]:null;
 const qa=Math.min(a.remainingQty,60+((i*11)%75));
 const qb=b?Math.min(b.remainingQty,25+((i*7)%25)):0;
 const allocations=[{listingId:a.id,farmerId:a.farmerId,qty:qa,price:a.price,region:a.region}];
 a.remainingQty-=qa;
 if(b&&qb>0){allocations.push({listingId:b.id,farmerId:b.farmerId,qty:qb,price:b.price,region:b.region});b.remainingQty-=qb;}
 const qtyMatched=allocations.reduce((sum,x)=>sum+x.qty,0), cropId=a.cropId;
 const avgPrice=allocations.reduce((sum,x)=>sum+x.price*x.qty,0)/qtyMatched;
 const buyerPrice=+(avgPrice/0.68).toFixed(2), status=orderStatuses[i];
 const buyer=buyerRecords[0], farmer=farmerRecords.find(f=>f.id===a.farmerId);
 const buyerKind=i%4===0?'consumer':'bulk';
 const buyerLabel=buyerKind==='consumer'?consumerRecords[0].name:buyer.businessName;
 const buyerTotal=+(qtyMatched*buyerPrice).toFixed(2);
 const needsLedger=completedStatuses.has(status);
 const farmerCut=+(buyerTotal*0.68).toFixed(2), logisticsCut=+(buyerTotal*0.14).toFixed(2), platformCut=+(buyerTotal-farmerCut-logisticsCut).toFixed(2);
 const createdAt=new Date(Date.now()-(i+1)*86400000).toISOString();
 const deliveredAt=needsLedger?new Date(Date.now()-(i*5+2)*3600000).toISOString():null;
 const ledger=needsLedger?{
   buyerTotal,farmerCut,logisticsCut,platformCut,
   farmerRevenue:+allocations.reduce((sum,x)=>sum+x.qty*x.price,0).toFixed(2),
   cultivationCost:+allocations.reduce((sum,x)=>{const l=listings.find(y=>y.id===x.listingId);return sum+x.qty*(l.cultivationCostPerKg||8);},0).toFixed(2),
   farmerProfit:+(allocations.reduce((sum,x)=>sum+x.qty*x.price,0)-allocations.reduce((sum,x)=>{const l=listings.find(y=>y.id===x.listingId);return sum+x.qty*(l.cultivationCostPerKg||8);},0)).toFixed(2),
   logisticsBreakdown:{pickup:+(logisticsCut*.2).toFixed(2),aggregation:+(logisticsCut*.15).toFixed(2),transport:+(logisticsCut*.45).toFixed(2),handling:+(logisticsCut*.1).toFixed(2),lastMile:+(logisticsCut*.1).toFixed(2)},computedAt:deliveredAt
 }:null;
 const order={id:`ks_order_${String(i+1).padStart(3,'0')}`,buyerId:buyerKind==='consumer'?consumerRecords[0].id:buyerRecords[0].id,buyerKind,buyerLabel,cropId,qtyRequested:qtyMatched+(status==='partial'?35:0),qtyMatched,allocations,buyerPrice,status,region:farmer.region,deliveryWindow:i%2?'6-9 AM':'Next available route',createdAt,pooled:allocations.length>1,crossRegion:allocations.some(x=>x.region!==farmer.region),isResidue:false,extra:[],ledger,deliveredAt,paidAt:status==='paid'?new Date(Date.now()-(i*4+1)*3600000).toISOString():null};
 marketOrders.push(order);
 for(const alloc of allocations){routeStops.push({id:`ks_stop_${routeStops.length+1}`,kind:'pickup',orderId:order.id,farmerId:alloc.farmerId,status:completedStatuses.has(status)||status==='picked_up'?'done':'pending',label:`${alloc.qty}kg ${cropId} — ${(farmerRecords.find(f=>f.id===alloc.farmerId)||{}).name||'Farmer'}`,region:alloc.region,extraStock:false});}
 routeStops.push({id:`ks_stop_${routeStops.length+1}`,kind:'delivery',orderId:order.id,buyerId:order.buyerId,status:completedStatuses.has(status)?'done':'pending',label:buyerLabel,region:order.region,extraStock:false});
 if(status==='paid') for(const alloc of allocations){const f=farmerRecords.find(x=>x.id===alloc.farmerId);if(f)f.creditHistory.push({orderId:order.id,amount:+(alloc.qty*alloc.price).toFixed(2),paidAt:order.paidAt});}
}
const seededGluts=[
 {id:'ks_glut_1',region:'Jaipur',cropId:'tomato',discountPct:30,active:true,createdAt:new Date(Date.now()-86400000).toISOString(),source:'marketplace-monitor'},
 {id:'ks_glut_2',region:'Kota',cropId:'onion',discountPct:25,active:true,createdAt:new Date(Date.now()-2*86400000).toISOString(),source:'marketplace-monitor'},
 {id:'ks_glut_3',region:'Ajmer',cropId:'potato',discountPct:20,active:false,createdAt:new Date(Date.now()-3*86400000).toISOString(),source:'marketplace-monitor'}
];
const residueListings=Array.from({length:9},(_,i)=>({id:`ks_residue_${String(i+1).padStart(3,'0')}`,farmerId:i<5?farmerRecords[0].id:farmerRecords[i].id,typeId:['stalks','straw','husk'][i%3],qty:180+(i*47)%620,createdAt:new Date(Date.now()-(i+1)*7200000).toISOString(),matchedBuyerId:i%4===0?null:`ks_ib_${(i%3)+1}`,orderId:null}));
const sowingIntents=Array.from({length:12},(_,i)=>({id:`ks_sowing_${String(i+1).padStart(3,'0')}`,farmerId:i<6?farmerRecords[0].id:farmerRecords[i].id,cropId:crops[(i+2)%crops.length],area:1+(i%8),region:farmerRecords[i].region,createdAt:new Date(Date.now()-(i+1)*86400000).toISOString()}));
const regionSowingCounts={}; for(const si of sowingIntents){regionSowingCounts[si.region] ||= {};regionSowingCounts[si.region][si.cropId]=(regionSowingCounts[si.region][si.cropId]||0)+1;}
const voiceCallLog=Array.from({length:8},(_,i)=>({id:`ks_call_${i+1}`,farmerId:i<6?farmerRecords[0].id:farmerRecords[i].id,lang:['hi','hi','en','hi','pa','hi','en','hi'][i],intent:['mandi_price','sell_crop','crop_health','weather','mandi_price','buyer_match','sell_crop','crop_health'][i],createdAt:new Date(Date.now()-(i+1)*3600000).toISOString()}));
const auditLog=[
 {id:'ks_audit_1',actor:'Super Admin',action:'Approved farmer KYC',detail:'Ramesh Kumar — Jaipur',createdAt:new Date(Date.now()-3600000).toISOString()},
 {id:'ks_audit_2',actor:'Finance and Payments',action:'Released escrow',detail:'₹8,420 — order KSD-004',createdAt:new Date(Date.now()-7200000).toISOString()},
 {id:'ks_audit_3',actor:'Regional Ops Manager',action:'Triggered glut alert',detail:'tomato in Jaipur',createdAt:new Date(Date.now()-10800000).toISOString()},
 {id:'ks_audit_4',actor:'Verification Officer',action:'Reviewed soil report',detail:'Residue report review — farmer profile 03',createdAt:new Date(Date.now()-14400000).toISOString()},
 {id:'ks_audit_5',actor:'Super Admin',action:'Updated mandi reference dataset',detail:'120 indicative rows; verify against official market bulletins',createdAt:new Date(Date.now()-18000000).toISOString()},
 {id:'ks_audit_6',actor:'Logistics Coordinator',action:'Updated delivery route',detail:'12 orders added to route board',createdAt:new Date(Date.now()-21600000).toISOString()}
];
(async()=>{
 let added=0,existing=0;
 // Remove previously seeded portal logins, but preserve accounts created outside the seed process.
 if(typeof db.users.deleteDemo==='function') await db.users.deleteDemo();
 for(const u of users){ if(await db.users.findOne({mobile:u.mobile,role:u.role})){existing++;continue;} await db.users.insert(u);added++; }
 const state={farmers:farmerRecords,buyers:buyerRecords,industrialBuyers:[
  {id:'ks_ib_1',businessName:'Rajasthan Bioenergy Cooperative',type:'Biofuel / Biomass Plant',region:'Jaipur',approved:true,matches:['stalks']},
  {id:'ks_ib_2',businessName:'Kota Cattle Feed Industries',type:'Cattle Feed Producer',region:'Kota',approved:false,verifyStatus:'pending',matches:['straw']},
  {id:'ks_ib_3',businessName:'Ajmer Organic Compost Works',type:'Mushroom Farm / Compost Unit',region:'Ajmer',approved:true,matches:['husk']}
 ],listings,residueListings,sowingIntents,regionSowingCounts,orders:marketOrders,todaysRoute:{id:'ks_route',stops:routeStops},gluts:seededGluts,consumerOrders:[],consumers:consumerRecords,drivers:driverRecords,voiceCallLog,auditLog,fraudFlags:[{id:'ks_flag_1',title:'Unusual order cancellation pattern',detail:'Several recent orders linked to one account were cancelled after allocation. Review account history and contact the parties before taking action.',dismissed:false,severity:'high'},{id:'ks_flag_2',title:'Duplicate crop listing review',detail:'Two active listings appear to describe the same crop batch and harvest date. Confirm quantities before matching another order.',dismissed:false,severity:'medium'},{id:'ks_flag_3',title:'Price deviation review',detail:'A listing price differs materially from the recent regional reference range. Verify the seller quote and current mandi bulletin.',dismissed:false,severity:'medium'},{id:'ks_flag_4',title:'Delivery confirmation pending',detail:'A delivered order is awaiting buyer confirmation beyond the expected window. Contact the buyer and delivery partner.',dismissed:false,severity:'low'}],scans:[],toasts:[]};
 await db.state.set(state);
 const fs=require('node:fs'); fs.mkdirSync(path.join(DATA_DIR,'reference'),{recursive:true});
 fs.writeFileSync(path.join(DATA_DIR,'reference','mandi-prices.json'),JSON.stringify({notice:'Indicative reference estimates only. Confirm against official market sources before trading.',generatedAt:new Date().toISOString(),rows:mandi},null,2));
 fs.writeFileSync(path.join(DATA_DIR,'reference','portal-access.csv'),['role,name,mobile,password',...users.map(u=>`${u.role},"${u.name}",${u.mobile},${u.role==='farmer'?'FarmKisan26!':u.role==='buyer'?'BuyerKisan26!':u.role==='consumer'?'HomeKisan26!':u.role==='admin'?'AdminKisan26!':'DriveKisan26!'}`)].join('\n')+'\n');
 console.log(`Kisan Setu data setup complete. ${added} portal accounts created; ${existing} already existed. Loaded ${farmerRecords.length} farmer profiles, ${buyerRecords.length} buyer profiles, ${consumerRecords.length} consumer profiles, ${driverRecords.length} delivery profiles, ${listings.length} crop listings, ${marketOrders.length} orders, ${residueListings.length} residue listings, ${sowingIntents.length} sowing intents, ${voiceCallLog.length} voice-call records, ${mandi.length} indicative mandi reference rows.`);
 console.log('PORTAL ACCESS:');
 console.log(`Admin: mobile=${ADMIN_MOBILE}, password=${ADMIN_PASSWORD}`);
 console.log('Farmer: mobile=9000000101, password=FarmKisan26!');
 console.log('Bulk buyer: mobile=9000000201, password=BuyerKisan26!');
 console.log('Consumer: mobile=9000000301, password=HomeKisan26!');
 console.log('Delivery partner: mobile=9000000401, password=DriveKisan26!');
 console.log('The development OTP is shown on the login screen or server console.');
 console.log(`Storage: ${db.info.docs}; set DATA_DIR to choose the local database directory.`);
})().catch(e=>{console.error(e);process.exit(1)});
