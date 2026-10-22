/* Download the real, openly licensed photo pack used by Kisan Setu.
   Source: Wikimedia Commons. After downloading, run `npm run build`.
   If you don't download them, the app still loads the same real photos
   directly from Wikimedia when internet is available.
*/
const fs = require('fs'), path = require('path'), https = require('https');

const FILES = [
  ['hero.jpg', 'Woman harvesting wheat, Raisen district, Madhya Pradesh, India ggia version.jpg'],
  ['login/dawn.jpg', 'Woman harvesting wheat, Raisen district, Madhya Pradesh, India ggia version.jpg'],
  ['login/peach.jpg', 'Fresh vegetables being sold.jpg'],
  ['login/dusk.jpg', 'Tomatos ready for dispatch.jpg'],
  ['roles/farmer.jpg', 'Woman harvesting wheat, Raisen district, Madhya Pradesh, India ggia version.jpg'],
  ['roles/buyer.jpg', 'Fresh vegetables being sold.jpg'],
  ['roles/consumer.jpg', 'Nikhilmore vegetable basket bhimashankar.jpg'],
  ['roles/logistics.jpg', 'Delivery service.jpg'],
  ['roles/admin.jpg', 'India - Koyambedu Market - Faces 01 (3983959747).jpg'],
  ['crops/tomato.jpg', 'Tomatoes in India (2024) 2.jpg'],
  ['crops/onion.jpg', 'Onions.JPG'],
  ['crops/potato.jpg', 'So many potatoes (4822444589).jpg'],
  ['crops/wheat.jpg', 'Indian wheat farms.jpg'],
  ['crops/cauliflower.jpg', 'Cauliflower NP.jpg'],
  ['samples/tomato.jpg', 'Early blight on tomato leaves (7871930010).jpg'],
  ['samples/onion.jpg', 'Zwiebel Blattfleckenkrankheit (Cladosporium allii-cepae) Anamorph - Noé López G.LLG-Bernburg.jpg'],
  ['samples/cauliflower.jpg', 'Cauliflower NP.jpg']
];

const ATTRIBUTION = `
REAL PHOTO SOURCES / CREDITS
All photos are from Wikimedia Commons and retain their respective license terms.
- Woman harvesting wheat, Raisen district, Madhya Pradesh, India ggia version.jpg — Yann / Ggia, CC BY 3.0
- Fresh vegetables being sold.jpg — Billjones94, CC BY-SA 4.0
- Tomatos ready for dispatch.jpg — Phadke09, CC BY-SA 4.0
- Nikhilmore vegetable basket bhimashankar.jpg — Nikhilmore nimo, CC BY-SA 4.0
- Delivery service.jpg — runran, CC BY-SA 2.0
- India - Koyambedu Market - Faces 01 (3983959747).jpg — Wikimedia Commons, license as listed on source page
- Tomatoes in India (2024) 2.jpg — Gpkp, CC BY-SA 4.0
- Onions.JPG — Bhaskaranaidu, public domain
- So many potatoes (4822444589).jpg — Wikimedia Commons, license as listed on source page
- Indian wheat farms.jpg — Vinay Kanzariya, CC BY-SA 4.0
- Cauliflower NP.jpg — Krish Dulal, CC BY-SA 3.0
- Early blight on tomato leaves (7871930010).jpg — Dwight Sipler, CC BY 2.0
- Zwiebel Blattfleckenkrankheit (Cladosporium allii-cepae) Anamorph — Gutíerrez Noé López / Landesanstalt für Landwirtschaft und Gartenbau Sachsen-Anhalt, license as listed on source page
`;

function get(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, {headers:{'User-Agent':'KisanSetuAssetFetcher/2.0'}}, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        res.resume(); return resolve(get(new URL(res.headers.location,url).toString(), redirects-1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP '+res.statusCode)); }
      const chunks=[]; res.on('data',c=>chunks.push(c)); res.on('end',()=>resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

(async()=>{
  fs.mkdirSync('assets',{recursive:true});
  for(const [dest, commonsName] of FILES){
    try{
      const buf=await get('https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(commonsName));
      const full=path.join('assets',dest);
      fs.mkdirSync(path.dirname(full),{recursive:true});
      fs.writeFileSync(full,buf);
      console.log('✓',dest,Math.round(buf.length/1024)+' KB');
    }catch(e){ console.log('✗',dest,e.message); }
  }
  console.log(ATTRIBUTION);
})();
