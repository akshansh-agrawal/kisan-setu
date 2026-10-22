const { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext, useReducer, Fragment } = React;
const h = React.createElement;

/* ============================= I18N ============================= */
const LANGUAGES = [
  { code:'hi', label:'हिन्दी', englishLabel:'Hindi', speech:'hi-IN', idx:1 },
  { code:'en', label:'English', englishLabel:'English', speech:'en-IN', idx:0 },
  { code:'mr', label:'मराठी', englishLabel:'Marathi', speech:'mr-IN', idx:2 },
  { code:'pa', label:'ਪੰਜਾਬੀ', englishLabel:'Punjabi', speech:'pa-IN', idx:3 },
  { code:'as', label:'অসমীয়া', englishLabel:'Assamese', speech:'as-IN', idx:-1 },
  { code:'bn', label:'বাংলা', englishLabel:'Bengali', speech:'bn-IN', idx:-1 },
  { code:'brx', label:'बड़ो', englishLabel:'Bodo', speech:'hi-IN', idx:-1 },
  { code:'doi', label:'डोगरी', englishLabel:'Dogri', speech:'hi-IN', idx:-1 },
  { code:'gu', label:'ગુજરાતી', englishLabel:'Gujarati', speech:'gu-IN', idx:-1 },
  { code:'kn', label:'ಕನ್ನಡ', englishLabel:'Kannada', speech:'kn-IN', idx:-1 },
  { code:'ks', label:'کٲشُر', englishLabel:'Kashmiri', speech:'ur-IN', idx:-1, rtl:true },
  { code:'kok', label:'कोंकणी', englishLabel:'Konkani', speech:'mr-IN', idx:-1 },
  { code:'mai', label:'मैथिली', englishLabel:'Maithili', speech:'hi-IN', idx:-1 },
  { code:'ml', label:'മലയാളം', englishLabel:'Malayalam', speech:'ml-IN', idx:-1 },
  { code:'mni', label:'মৈতৈলোন্', englishLabel:'Manipuri (Meitei)', speech:'bn-IN', idx:-1 },
  { code:'ne', label:'नेपाली', englishLabel:'Nepali', speech:'ne-NP', idx:-1 },
  { code:'or', label:'ଓଡ଼ିଆ', englishLabel:'Odia', speech:'or-IN', idx:-1 },
  { code:'sa', label:'संस्कृतम्', englishLabel:'Sanskrit', speech:'hi-IN', idx:-1 },
  { code:'sat', label:'ᱥᱟᱱᱛᱟᱲᱤ', englishLabel:'Santali', speech:'hi-IN', idx:-1 },
  { code:'sd', label:'سنڌي', englishLabel:'Sindhi', speech:'ur-IN', idx:-1, rtl:true },
  { code:'ta', label:'தமிழ்', englishLabel:'Tamil', speech:'ta-IN', idx:-1 },
  { code:'te', label:'తెలుగు', englishLabel:'Telugu', speech:'te-IN', idx:-1 },
  { code:'ur', label:'اردو', englishLabel:'Urdu', speech:'ur-IN', idx:-1, rtl:true },
];
const LANG_IDX = { en:0, hi:1, mr:2, pa:3 };
const RTL_LANGS = ["ks","sd","ur"];
const LANG_NAME_FOR_AI = { en:'English', hi:'Hindi (Devanagari script)', mr:'Marathi (Devanagari script)', pa:'Punjabi (Gurmukhi script)', as:'Assamese', bn:'Bengali', brx:'Bodo (Devanagari script)', doi:'Dogri (Devanagari script)', gu:'Gujarati', kn:'Kannada', ks:'Kashmiri (Perso-Arabic script)', kok:'Konkani (Devanagari script)', mai:'Maithili (Devanagari script)', ml:'Malayalam', mni:'Manipuri (Meitei Mayek script)', ne:'Nepali', or:'Odia', sa:'Sanskrit (Devanagari script)', sat:'Santali (Ol Chiki script)', sd:'Sindhi (Perso-Arabic script)', ta:'Tamil', te:'Telugu', ur:'Urdu' };

// [en, hi, mr, pa]
const DICT = {
  addCrop:      ['Add crop','फसल जोड़ें','पीक जोडा','ਫ਼ਸਲ ਜੋੜੋ'],
  account:      ['Account','खाता','खाते','ਖਾਤਾ'],
  logoutLbl:    ['Log out','लॉग आउट','लॉग आउट','ਲਾਗ ਆਊਟ'],
  saveChanges:  ['Save changes','बदलाव सहेजें','बदल जतन करा','ਬਦਲਾਅ ਸੰਭਾਲੋ'],
  appName:      ['Kisan Setu','किसान सेतु','किसान सेतू','ਕਿਸਾਨ ਸੇਤੂ'],
  tagline:      ['From your field to their table','खेत से सीधे थाली तक','शेतातून थेट ताटात','ਖੇਤ ਤੋਂ ਸਿੱਧਾ ਥਾਲੀ ਤੱਕ'],
  home:         ['Home','होम','मुख्यपृष्ठ','ਘਰ'],
  sell:         ['Sell','बेचें','विक्री','ਵੇਚੋ'],
  doctor:       ['Crop Doctor','फसल डॉक्टर','पीक डॉक्टर','ਫ਼ਸਲ ਡਾਕਟਰ'],
  money:        ['Money','पैसे','पैसे','ਪੈਸੇ'],
  me:           ['Me','मेरा','माझे','ਮੇਰਾ'],
  payments:     ['Payments','भुगतान','पेमेंट','ਭੁਗਤਾਨ'],
  callPrices:   ['Call for prices','भाव जानने के लिए कॉल','भावासाठी कॉल','ਭਾਅ ਲਈ ਕਾਲ'],
  residue:      ['Crop residue','फसल अवशेष','पीक अवशेष','ਫ਼ਸਲ ਰਹਿੰਦ-ਖੂੰਹਦ'],
  sowingIntent: ["What I'll plant",'मैं क्या बोऊँगा','मी काय पेरणार','ਮੈਂ ਕੀ ਬੀਜਾਂਗਾ'],
  trustScore:   ['Trust score','भरोसा स्कोर','विश्वास गुण','ਭਰੋਸਾ ਸਕੋਰ'],
  goodMorning:  ['Good morning','सुप्रभात','शुभ प्रभात','ਸ਼ੁਭ ਸਵੇਰ'],
  goodAfternoon:['Good afternoon','नमस्ते','नमस्कार','ਸਤ ਸ੍ਰੀ ਅਕਾਲ'],
  goodEvening:  ['Good evening','शुभ संध्या','शुभ संध्याकाळ','ਸ਼ੁਭ ਸ਼ਾਮ'],
  marketSignal: ['Market price near you','आपके पास का बाज़ार भाव','तुमच्या जवळचा बाजारभाव','ਤੁਹਾਡੇ ਨੇੜੇ ਦਾ ਭਾਅ'],
  perKg:        ['per kg','प्रति किलो','प्रति किलो','ਪ੍ਰਤੀ ਕਿਲੋ'],
  whatToday:    ['What would you like to do?','आज क्या करना है?','आज काय करायचे आहे?','ਅੱਜ ਕੀ ਕਰਨਾ ਹੈ?'],
  sellSub:      ['List your harvest','अपनी फसल दर्ज करें','तुमचे पीक नोंदवा','ਆਪਣੀ ਫ਼ਸਲ ਦਰਜ ਕਰੋ'],
  priceSub:     ["Hear today's rates","आज के भाव सुनें",'आजचे भाव ऐका','ਅੱਜ ਦੇ ਭਾਅ ਸੁਣੋ'],
  paySub:       ['Track every rupee','हर रुपये का हिसाब','प्रत्येक रुपयाचा हिशोब','ਹਰ ਰੁਪਏ ਦਾ ਹਿਸਾਬ'],
  trustSub:     ['Show buyers your soil is safe','खरीदारों को मिट्टी की सुरक्षा दिखाएँ','खरेदीदारांना मातीची सुरक्षितता दाखवा','ਖਰੀਦਦਾਰਾਂ ਨੂੰ ਮਿੱਟੀ ਦੀ ਸੁਰੱਖਿਆ ਦਿਖਾਓ'],
  residueSub:   ['Sell stalks and husk, do not burn','पराली-भूसा बेचें, जलाएँ नहीं','कड्या-भुसा विका, जाळू नका','ਪਰਾਲੀ-ਤੂੜੀ ਵੇਚੋ, ਸਾੜੋ ਨਾ'],
  sowSub:       ['Avoid a price crash before it happens','दाम गिरने से पहले ही बचें','भाव पडण्याआधीच टाळा','ਭਾਅ ਡਿੱਗਣ ਤੋਂ ਪਹਿਲਾਂ ਬਚੋ'],
  doctorHeadline:['Is your crop healthy?','क्या आपकी फसल स्वस्थ है?','तुमचे पीक निरोगी आहे का?','ਕੀ ਤੁਹਾਡੀ ਫ਼ਸਲ ਤੰਦਰੁਸਤ ਹੈ?'],
  doctorPromo:  ['Photograph a leaf. Get the problem, the cure and care tips in seconds.','पत्ते की फ़ोटो लें। कुछ ही पल में बीमारी, इलाज और देखभाल पाएँ।','पानाचा फोटो घ्या. काही क्षणांत रोग, उपाय आणि काळजी मिळवा.','ਪੱਤੇ ਦੀ ਫ਼ੋਟੋ ਖਿੱਚੋ। ਕੁਝ ਪਲਾਂ ਵਿੱਚ ਬਿਮਾਰੀ, ਇਲਾਜ ਤੇ ਸੰਭਾਲ ਪਾਓ।'],
  scanNow:      ['Scan my crop','फसल जाँचें','पीक तपासा','ਫ਼ਸਲ ਜਾਂਚੋ'],
  isNew:        ['New','नया','नवीन','ਨਵਾਂ'],
  takePhoto:    ['Take a photo','फ़ोटो खींचें','फोटो काढा','ਫ਼ੋਟੋ ਖਿੱਚੋ'],
  fromGallery:  ['Choose from gallery','गैलरी से चुनें','गॅलरीतून निवडा','ਗੈਲਰੀ ਵਿੱਚੋਂ ਚੁਣੋ'],
  trySample:    ['No crop at hand? Review an example result','फसल पास नहीं? नमूना फ़ोटो आज़माएँ','पीक जवळ नाही? नमुना फोटो वापरा','ਫ਼ਸਲ ਕੋਲ ਨਹੀਂ? ਨਮੂਨਾ ਫ਼ੋਟੋ ਅਜ਼ਮਾਓ'],
  tipsTitle:    ['For a clear result','साफ़ नतीजे के लिए','अचूक निकालासाठी','ਸਹੀ ਨਤੀਜੇ ਲਈ'],
  tipLight:     ['Use daylight, not flash','दिन की रोशनी में लें, फ़्लैश नहीं','दिवसाच्या प्रकाशात घ्या, फ्लॅश नको','ਦਿਨ ਦੀ ਰੌਸ਼ਨੀ ਵਿੱਚ ਖਿੱਚੋ, ਫ਼ਲੈਸ਼ ਨਹੀਂ'],
  tipClose:     ['Fill the frame with one leaf or fruit','एक पत्ता या फल पूरे फ़्रेम में रखें','एक पान किंवा फळ पूर्ण फ्रेममध्ये घ्या','ਇੱਕ ਪੱਤਾ ਜਾਂ ਫਲ ਪੂਰੇ ਫ਼੍ਰੇਮ ਵਿੱਚ ਰੱਖੋ'],
  tipBoth:      ['Show a sick part and a healthy part','बीमार और स्वस्थ दोनों हिस्से दिखाएँ','आजारी आणि निरोगी दोन्ही भाग दाखवा','ਬਿਮਾਰ ਅਤੇ ਤੰਦਰੁਸਤ ਦੋਵੇਂ ਹਿੱਸੇ ਦਿਖਾਓ'],
  whichCrop:    ['Which crop? (optional)','कौन सी फसल? (वैकल्पिक)','कोणते पीक? (ऐच्छिक)','ਕਿਹੜੀ ਫ਼ਸਲ? (ਵਿਕਲਪਿਕ)'],
  autoDetect:   ['Auto-detect','खुद पहचानें','आपोआप ओळखा','ਆਪੇ ਪਛਾਣੋ'],
  analyzeBtn:   ['Check my crop','मेरी फसल जाँचें','माझे पीक तपासा','ਮੇਰੀ ਫ਼ਸਲ ਜਾਂਚੋ'],
  changePhoto:  ['Change photo','फ़ोटो बदलें','फोटो बदला','ਫ਼ੋਟੋ ਬਦਲੋ'],
  s1:           ['Reading leaf colour and shape','पत्ते का रंग और आकार देख रहे हैं','पानाचा रंग आणि आकार पाहत आहोत','ਪੱਤੇ ਦਾ ਰੰਗ ਤੇ ਆਕਾਰ ਵੇਖ ਰਹੇ ਹਾਂ'],
  s2:           ['Looking for spots, pests and damage','धब्बे, कीड़े और नुकसान खोज रहे हैं','ठिपके, कीड आणि नुकसान शोधत आहोत','ਧੱਬੇ, ਕੀੜੇ ਤੇ ਨੁਕਸਾਨ ਲੱਭ ਰਹੇ ਹਾਂ'],
  s3:           ['Matching with known crop problems','ज्ञात फसल रोगों से मिला रहे हैं','ज्ञात पीक समस्यांशी जुळवत आहोत','ਜਾਣੀਆਂ ਫ਼ਸਲੀ ਸਮੱਸਿਆਵਾਂ ਨਾਲ ਮਿਲਾ ਰਹੇ ਹਾਂ'],
  s4:           ['Writing your care plan','आपकी देखभाल योजना बना रहे हैं','तुमची काळजी योजना लिहित आहोत','ਤੁਹਾਡੀ ਸੰਭਾਲ ਯੋਜਨਾ ਬਣਾ ਰਹੇ ਹਾਂ'],
  cancel:       ['Cancel','रद्द करें','रद्द करा','ਰੱਦ ਕਰੋ'],
  healthScore:  ['Crop health','फसल की सेहत','पिकाचे आरोग्य','ਫ਼ਸਲ ਦੀ ਸਿਹਤ'],
  statusHealthy:['Healthy','स्वस्थ','निरोगी','ਤੰਦਰੁਸਤ'],
  statusWatch:  ['Needs attention','ध्यान दें','लक्ष द्या','ਧਿਆਨ ਦਿਓ'],
  statusUrgent: ['Act today','आज ही उपाय करें','आजच उपाय करा','ਅੱਜ ਹੀ ਇਲਾਜ ਕਰੋ'],
  confidence:   ['Confidence','भरोसा','खात्री','ਭਰੋਸਾ'],
  high:         ['High','ज़्यादा','जास्त','ਵੱਧ'],
  medium:       ['Medium','मध्यम','मध्यम','ਦਰਮਿਆਨਾ'],
  low:          ['Low','कम','कमी','ਘੱਟ'],
  spread:       ['Spread risk','फैलने का खतरा','पसरण्याचा धोका','ਫੈਲਣ ਦਾ ਖ਼ਤਰਾ'],
  whatISee:     ['What we see','हमें क्या दिखा','आम्हाला काय दिसले','ਸਾਨੂੰ ਕੀ ਦਿਸਿਆ'],
  doThis:       ['What to do','क्या करें','काय करावे','ਕੀ ਕਰੀਏ'],
  careGuide:    ['How to care for it','देखभाल कैसे करें','काळजी कशी घ्यावी','ਸੰਭਾਲ ਕਿਵੇਂ ਕਰੀਏ'],
  water:        ['Water','पानी','पाणी','ਪਾਣੀ'],
  sunSoil:      ['Sun and soil','धूप और मिट्टी','ऊन आणि माती','ਧੁੱਪ ਤੇ ਮਿੱਟੀ'],
  feed:         ['Feeding','खाद-पोषण','खत-पोषण','ਖਾਦ-ਖੁਰਾਕ'],
  airflow:      ['Air and spacing','हवा और दूरी','हवा आणि अंतर','ਹਵਾ ਤੇ ਫ਼ਾਸਲਾ'],
  preventNext:  ['Stop it coming back','दोबारा होने से रोकें','पुन्हा होण्यापासून रोखा','ਦੁਬਾਰਾ ਹੋਣ ਤੋਂ ਰੋਕੋ'],
  dontDo:       ['Avoid this','यह न करें','हे करू नका','ਇਹ ਨਾ ਕਰੋ'],
  listen:       ['Listen','सुनें','ऐका','ਸੁਣੋ'],
  stopListen:   ['Stop','रोकें','थांबवा','ਰੋਕੋ'],
  saved:        ['Saved to field diary','खेत डायरी में सहेजा','शेत डायरीत जतन केले','ਖੇਤ ਡਾਇਰੀ ਵਿੱਚ ਸੰਭਾਲਿਆ'],
  saveScan:     ['Save to field diary','खेत डायरी में सहेजें','शेत डायरीत जतन करा','ਖੇਤ ਡਾਇਰੀ ਵਿੱਚ ਸੰਭਾਲੋ'],
  shareWA:      ['Share on WhatsApp','व्हाट्सऐप पर भेजें','व्हॉट्सॲपवर पाठवा','ਵਟਸਐਪ ਤੇ ਭੇਜੋ'],
  askExpert:    ['Talk to a farm expert','कृषि विशेषज्ञ से बात करें','कृषी तज्ञांशी बोला','ਖੇਤੀ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰੋ'],
  expertSub:    ['Kisan Call Centre · free · 6 am to 10 pm','किसान कॉल सेंटर · निःशुल्क · सुबह 6 से रात 10','किसान कॉल सेंटर · मोफत · सकाळी ६ ते रात्री १०','ਕਿਸਾਨ ਕਾਲ ਸੈਂਟਰ · ਮੁਫ਼ਤ · ਸਵੇਰੇ 6 ਤੋਂ ਰਾਤ 10'],
  recheck:      ['Check again in {n} days','{n} दिन बाद फिर जाँचें','{n} दिवसांनी पुन्हा तपासा','{n} ਦਿਨ ਬਾਅਦ ਫਿਰ ਜਾਂਚੋ'],
  scanAnother:  ['Scan another','एक और जाँचें','आणखी तपासा','ਇੱਕ ਹੋਰ ਜਾਂਚੋ'],
  diary:        ['My field diary','मेरी खेत डायरी','माझी शेत डायरी','ਮੇਰੀ ਖੇਤ ਡਾਇਰੀ'],
  noScans:      ['Your scans will be kept here','आपकी जाँचें यहाँ रखी जाएँगी','तुमच्या तपासण्या इथे राहतील','ਤੁਹਾਡੀਆਂ ਜਾਂਚਾਂ ਇੱਥੇ ਰਹਿਣਗੀਆਂ'],
  notPlantT:    ["We can't see a crop here",'यहाँ फसल नहीं दिख रही','इथे पीक दिसत नाही','ਇੱਥੇ ਫ਼ਸਲ ਨਹੀਂ ਦਿਸ ਰਹੀ'],
  notPlantB:    ['Try a closer, brighter photo of a leaf, fruit or plant.','पत्ते, फल या पौधे की करीब से, रोशनी वाली फ़ोटो लें।','पान, फळ किंवा रोपाचा जवळून, उजेडातला फोटो घ्या.','ਪੱਤੇ, ਫਲ ਜਾਂ ਬੂਟੇ ਦੀ ਨੇੜਿਓਂ, ਚਾਨਣ ਵਾਲੀ ਫ਼ੋਟੋ ਖਿੱਚੋ।'],
  failT:        ["We couldn't check this photo",'यह फ़ोटो जाँच नहीं पाए','हा फोटो तपासता आला नाही','ਇਹ ਫ਼ੋਟੋ ਜਾਂਚ ਨਹੀਂ ਸਕੇ'],
  failB:        ['Check your network and try again, or open an example photo.','नेटवर्क देखें और फिर कोशिश करें, या नमूना फ़ोटो खोलें।','नेटवर्क तपासा आणि पुन्हा प्रयत्न करा, किंवा नमुना फोटो उघडा.','ਨੈੱਟਵਰਕ ਵੇਖੋ ਤੇ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ, ਜਾਂ ਨਮੂਨਾ ਫ਼ੋਟੋ ਖੋਲ੍ਹੋ।'],
  offlineT:     ['Live scanning is not switched on here','यहाँ लाइव जाँच चालू नहीं है','येथे थेट तपासणी चालू नाही','ਇੱਥੇ ਲਾਈਵ ਜਾਂਚ ਚਾਲੂ ਨਹੀਂ'],
  offlineB:     ['Open an example photo to see how Crop Doctor answers.','Crop Doctor का जवाब देखने के लिए नमूना फ़ोटो खोलें।','Crop Doctor चे उत्तर पाहण्यासाठी नमुना फोटो उघडा.','Crop Doctor ਦਾ ਜਵਾਬ ਵੇਖਣ ਲਈ ਨਮੂਨਾ ਫ਼ੋਟੋ ਖੋਲ੍ਹੋ।'],
  tryAgain:     ['Try again','फिर कोशिश करें','पुन्हा प्रयत्न करा','ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ'],
  sampleNote:   ['Example photo · sample answer','नमूना फ़ोटो · उदाहरण जवाब','नमुना फोटो · उदाहरण उत्तर','ਨਮੂਨਾ ਫ਼ੋਟੋ · ਉਦਾਹਰਨ ਜਵਾਬ'],
  aiNote:       ['AI advice. Confirm with your local KVK before you spray.','AI की सलाह। छिड़काव से पहले अपने KVK से पुष्टि करें।','AI चा सल्ला. फवारणीपूर्वी स्थानिक KVK कडून खात्री करा.','AI ਦੀ ਸਲਾਹ। ਛਿੜਕਾਅ ਤੋਂ ਪਹਿਲਾਂ ਆਪਣੇ KVK ਤੋਂ ਪੁਸ਼ਟੀ ਕਰੋ।'],
  optNote:      ['Anything else we should know? (optional)','कुछ और बताना है? (वैकल्पिक)','आणखी काही सांगायचे आहे? (ऐच्छिक)','ਹੋਰ ਕੁਝ ਦੱਸਣਾ ਹੈ? (ਵਿਕਲਪਿਕ)'],
  optNotePh:    ['e.g. spots appeared after the rain','जैसे: बारिश के बाद धब्बे आए','उदा. पावसानंतर ठिपके आले','ਜਿਵੇਂ: ਮੀਂਹ ਤੋਂ ਬਾਅਦ ਧੱਬੇ ਆਏ'],
  quantity:     ['Quantity (kg)','मात्रा (किलो)','प्रमाण (किलो)','ਮਾਤਰਾ (ਕਿਲੋ)'],
  yourPrice:    ['Your price per kg','आपका भाव प्रति किलो','तुमचा भाव प्रति किलो','ਤੁਹਾਡਾ ਭਾਅ ਪ੍ਰਤੀ ਕਿਲੋ'],
  harvestDate:  ['Expected harvest','कटाई कब तक','काढणी कधी','ਵਾਢੀ ਕਦੋਂ'],
  reviewList:   ['Review and list','जाँचें और दर्ज करें','तपासा आणि नोंदवा','ਜਾਂਚੋ ਤੇ ਦਰਜ ਕਰੋ'],
  listenConfirm:['Listen and confirm','सुनें और पुष्टि करें','ऐका आणि पुष्टी करा','ਸੁਣੋ ਅਤੇ ਪੁਸ਼ਟੀ ਕਰੋ'],
  yesConfirm:   ['Yes, confirm','हाँ, पक्का करें','होय, पक्के करा','ਹਾਂ, ਪੱਕਾ ਕਰੋ'],
  speakInstead: ['Speak instead','बोलकर बताएँ','बोलून सांगा','ਬੋਲ ਕੇ ਦੱਸੋ'],
  typeInstead:  ['Type instead','लिखकर बताएँ','लिहून सांगा','ਲਿਖ ਕੇ ਦੱਸੋ'],
  back:         ['Back','वापस','मागे','ਪਿੱਛੇ'],
  profile:      ['Profile','प्रोफ़ाइल','प्रोफाइल','ਪ੍ਰੋਫ਼ਾਈਲ'],
  language:     ['Language','भाषा','भाषा','ਭਾਸ਼ਾ'],
  listings:     ['Listings','लिस्टिंग','यादी','ਸੂਚੀਆਂ'],
  paidSales:    ['Paid sales','चुकाई गई बिक्री','मिळालेले पेमेंट','ਮਿਲੇ ਭੁਗਤਾਨ'],
  needAttention:['Need attention','ध्यान चाहिए','लक्ष हवे','ਧਿਆਨ ਚਾਹੀਦਾ'],
  voiceHint:    ['Speak a command, or choose one below.','जो करना है बोलें। इनमें से कोई आज़माएँ।','काय करायचे ते बोला. यापैकी एक वापरून पहा.','ਜੋ ਕਰਨਾ ਹੈ ਬੋਲੋ। ਇਹਨਾਂ ਵਿੱਚੋਂ ਕੋਈ ਅਜ਼ਮਾਓ।'],
  listening:    ['Listening…','सुन रहे हैं…','ऐकत आहे…','ਸੁਣ ਰਹੇ ਹਾਂ…'],
  todayTip:     ["Today's field tip",'आज की खेती-सलाह','आजचा शेती सल्ला','ਅੱਜ ਦੀ ਖੇਤੀ ਸਲਾਹ'],
  tipBody:      ['Rabi sowing starts next month. Test your soil and plan crops now, before seed prices rise.','रबी की बुवाई अगले महीने शुरू होगी। बीज महँगे होने से पहले मिट्टी जाँचें और फसल तय करें।','रब्बी पेरणी पुढच्या महिन्यात सुरू होईल. बियाणे महाग होण्याआधी माती तपासा आणि पीक ठरवा.','ਹਾੜ੍ਹੀ ਦੀ ਬਿਜਾਈ ਅਗਲੇ ਮਹੀਨੇ ਸ਼ੁਰੂ ਹੋਵੇਗੀ। ਬੀਜ ਮਹਿੰਗੇ ਹੋਣ ਤੋਂ ਪਹਿਲਾਂ ਮਿੱਟੀ ਜਾਂਚੋ ਤੇ ਫ਼ਸਲ ਤੈਅ ਕਰੋ।'],
};
function t(key, lang, vars){
  const row = DICT[key]; if(!row) return key;
  let s;
  if(LANG_IDX[lang]!==undefined) s = row[LANG_IDX[lang]];
  else { const p = EXT_PACK[lang]; const i = EXT_A_KEYS.indexOf(key); const v = p && i>=0 ? p[0][i] : null; s = (v && v!=='~') ? v : row[1]; }
  s = s || row[0] || key;
  if(vars) Object.keys(vars).forEach(k=>{ s = s.replace('{'+k+'}', vars[k]); });
  return s;
}
// Crop Doctor / guide strings (index into the B pack). Falls back: language -> Hindi -> English
function tb(i, lang){
  if(lang==='en') return EXT_EN_B[i];
  const p = EXT_PACK[lang]; const v = p && p[1] && p[1][i]; if(v && v!=='~') return v;
  const h = EXT_PACK.hi; const hv = h && h[1] && h[1][i]; if(hv && hv!=='~') return hv;
  return EXT_EN_B[i];
}
function speechLang(lang){ return (LANGUAGES.find(l=>l.code===lang)||LANGUAGES[1]).speech; }

/* ============================= CONSTANTS / SEED DATA ============================= */
const REGIONS = ['Chomu','Bassi','Phulera','Dudu','Sanganer', ...IN_STATES];

const CROPS = [
  { id:'tomato', unit:'kg', mandiShare:0.33, name:{en:'Tomato',hi:'टमाटर',mr:'टोमॅटो',pa:'ਟਮਾਟਰ'}, tint:'#E5483A', soft:'#FDE7E3' },
  { id:'onion',  unit:'kg', mandiShare:0.36, name:{en:'Onion',hi:'प्याज़',mr:'कांदा',pa:'ਪਿਆਜ਼'}, tint:'#B0508F', soft:'#F6E4F0' },
  { id:'potato', unit:'kg', mandiShare:0.37, name:{en:'Potato',hi:'आलू',mr:'बटाटा',pa:'ਆਲੂ'}, tint:'#B98A4E', soft:'#F5EAD8' },
  { id:'wheat',  unit:'kg', mandiShare:0.42, name:{en:'Wheat',hi:'गेहूं',mr:'गहू',pa:'ਕਣਕ'}, tint:'#D9A21B', soft:'#FFF1C9' },
  { id:'cauliflower', unit:'kg', mandiShare:0.35, name:{en:'Cauliflower',hi:'फूलगोभी',mr:'फ्लॉवर',pa:'ਫੁੱਲਗੋਭੀ'}, tint:'#5E9E4A', soft:'#E4F1DC' },
  { id:'bajra', unit:'kg', mandiShare:0.40, name:{en:'Pearl millet (Bajra)'}, tint:'#B58B3E', soft:'#F3E8D0' },
  { id:'mustard', unit:'kg', mandiShare:0.40, name:{en:'Mustard'}, tint:'#D9B91B', soft:'#FFF4BF' },
  { id:'cumin', unit:'kg', mandiShare:0.40, name:{en:'Cumin'}, tint:'#8A6A3B', soft:'#EFE4D3' },
  { id:'guar', unit:'kg', mandiShare:0.40, name:{en:'Guar'}, tint:'#4E9A4A', soft:'#E1F1DC' },
  { id:'groundnut', unit:'kg', mandiShare:0.40, name:{en:'Groundnut'}, tint:'#B9884A', soft:'#F4E7D3' },
  { id:'gram', unit:'kg', mandiShare:0.40, name:{en:'Chickpea (Gram)'}, tint:'#B8873B', soft:'#F4E6CF' },
  { id:'soybean', unit:'kg', mandiShare:0.40, name:{en:'Soybean'}, tint:'#8DA13A', soft:'#EBF1CF' },
  { id:'cotton', unit:'kg', mandiShare:0.40, name:{en:'Cotton'}, tint:'#6B8FB8', soft:'#E3ECF6' },
];
const CROP_ORDER = ['tomato','onion','potato','wheat','cauliflower','bajra','mustard','cumin','guar','groundnut','gram','soybean','cotton'];
function cropName(id, lang){ const c=CROPS.find(x=>x.id===id); if(!c) return id; if(c.name[lang]) return c.name[lang]; const i=CROP_ORDER.indexOf(id); return i>=0 ? tb(i,lang) : c.name.en; }
function cropOf(id){ return CROPS.find(x=>x.id===id) || CROPS[0]; }
