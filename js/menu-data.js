/* ==========================================================================
   메뉴 데이터
   - 이 파일만 수정하면 가격/품절/메뉴명이 바로 반영됩니다.
   - price: 숫자만 입력 (화면에는 자동으로 쉼표+원이 붙습니다)
   - soldOut: true 로 바꾸면 품절 표시가 나타납니다.
   - needsReview: true 인 항목은 원본 사진과 이름/가격이 다르게 보이거나
     확인이 필요한 항목입니다. 확인 후 false 로 바꿔주세요.
   - image: null 인 항목은 원본 사진에서 음식 이미지를 추출할 수 없었던
     항목입니다. "이미지 준비 중"으로 표시됩니다.
   ========================================================================== */

const MENU_DATA = [

  /* ------------------------- 밥심 1층 ------------------------- */
  {
    id: "bapsim-breakfast-1000",
    store: "bapsim", group: 1, order: 1,
    image: null,
    name: { ko: "천원의아침밥", en: "Breakfast for 1,000 Won", zh: "1000韩元早餐", vi: "Bữa sáng 1.000 Won", mn: "1,000 воны өглөөний хоол", bn: "১,০০০ ওনের সকালের খাবার", my: "ဝမ် ၁,၀၀၀ နံနက်စာ" },
    price: 1000, soldOut: false, needsReview: false
  },
  {
    id: "bapsim-breakfast-buffet",
    store: "bapsim", group: 1, order: 2,
    image: "/images/bapsim/breakfast-buffet-icon.jpg",
    name: { ko: "아침뷔페", en: "Breakfast Buffet", zh: "早餐自助", vi: "Buffet sáng", mn: "Өглөөний буфет", bn: "সকালের বুফে", my: "မနက်စာ ဗူဖေး" },
    price: 5000, soldOut: false, needsReview: false
  },
  {
    id: "bapsim-lunch-buffet",
    store: "bapsim", group: 1, order: 3,
    image: "/images/bapsim/lunch-buffet-icon.jpg",
    name: { ko: "점심뷔페", en: "Lunch Buffet", zh: "午餐自助", vi: "Buffet trưa", mn: "Өдрийн хоолны буфет", bn: "দুপুরের বুফে", my: "နေ့လယ်စာ ဗူဖေး" },
    price: 7000, soldOut: false, needsReview: false
  },
  {
    id: "bapsim-lunch-buffet-ramen",
    store: "bapsim", group: 1, order: 4,
    image: "/images/bapsim/korean-buffet-instant-ramen.png",
    name: { ko: "한식뷔페 즉석라면", en: "Korean Buffet + Instant Ramen", zh: "韩式自助餐＋方便面", vi: "Buffet Hàn Quốc + Mì ăn liền", mn: "Солонгос хоолны буфет + Бэлэн рамен", bn: "কোরিয়ান বুফে + ইনস্ট্যান্ট রামেন", my: "ကိုရီးယားဗူဖေး + ရာမန်" },
    price: 8000, soldOut: false, needsReview: false
  },
  {
    id: "bapsim-self-ramen",
    store: "bapsim", group: 1, order: 5,
    image: "/images/bapsim/self-ramen.jpg",
    name: { ko: "셀프라면", en: "Self-Serve Ramen", zh: "自助拉面", vi: "Mì tự phục vụ", mn: "Өөрөө хийх рамен", bn: "সেলফ-সার্ভ রামেন", my: "ကိုယ်တိုင်ချက် ရာမန်" },
    price: 3000, soldOut: false, needsReview: false
  },
  {
    id: "bapsim-fried-eggs",
    store: "bapsim", group: 1, order: 6,
    image: "/images/bapsim/fried-eggs.jpg",
    name: { ko: "계란후라이 2개", en: "2 Fried Eggs", zh: "煎蛋2个", vi: "2 quả trứng ốp la", mn: "2 ширхэг шарсан өндөг", bn: "২টি ডিম ভাজা", my: "ကြက်ဥကြော် ၂ လုံး" },
    price: 1000, soldOut: false, needsReview: false
  },
  {
    id: "bapsim-pork-bulbaek",
    store: "bapsim", group: 1, order: 7,
    image: null,
    name: { ko: "돼지불백 한접시 200g", en: "Pork Bulgogi Plate 200g", zh: "烤猪肉一份200g", vi: "Thịt heo nướng 200g", mn: "Амталж шарсан гахайн мах 200г таваг", bn: "শুয়োরের বুলগোগি ২০০ গ্রাম", my: "ဝက်သား ဘူဂိုဂီ ၂၀၀ ဂရမ်" },
    price: null, soldOut: true, needsReview: true
    // 원본 키오스크 사진과 정확한 가격 확인 필요 (가격이 취소선으로 가려져 있음)
  },
  {
    id: "bapsim-cola",
    store: "bapsim", group: 1, order: 8,
    image: "/images/bapsim/cola.jpg",
    name: { ko: "콜라(355ml)밥심", en: "Coke (355ml)", zh: "可乐(355ml)", vi: "Coca-Cola (355ml)", mn: "Кола (355мл)", bn: "কোকা-কোলা (৩৫৫ মিলি)", my: "ကိုကာကိုလာ (၃၅၅ မီလီလီတာ)" },
    price: 1500, soldOut: false, needsReview: false
  },
  {
    id: "bapsim-zero-cola",
    store: "bapsim", group: 1, order: 9,
    image: "/images/bapsim/zero-cola.jpg",
    name: { ko: "제로콜라(355ml)밥심", en: "Coke Zero (355ml)", zh: "零度可乐(355ml)", vi: "Coca-Cola Zero (355ml)", mn: "Зеро кола (355мл)", bn: "জিরো কোকা-কোলা (৩৫৫ মিলি)", my: "ကိုကာကိုလာ ဇီးရို (၃၅၅ မီလီလီတာ)" },
    price: 1500, soldOut: false, needsReview: false
  },
  {
    id: "bapsim-fanta-pine",
    store: "bapsim", group: 1, order: 10,
    image: "/images/bapsim/fanta-pine.jpg",
    name: { ko: "환타파인(355ml)밥심", en: "Fanta Pineapple (355ml)", zh: "芬达菠萝(355ml)", vi: "Fanta Dứa (355ml)", mn: "Фанта ананас (355мл)", bn: "ফ্যান্টা পাইনঅ্যাপল (৩৫৫ মিলি)", my: "ဖန်တာ နာနတ်သီး (၃၅၅ မီလီလီတာ)" },
    price: 1500, soldOut: false, needsReview: false
  },
  {
    id: "bapsim-sprite",
    store: "bapsim", group: 1, order: 11,
    image: "/images/bapsim/sprite.jpg",
    name: { ko: "스프라이트(355ml)밥심", en: "Sprite (355ml)", zh: "雪碧(355ml)", vi: "Sprite (355ml)", mn: "Спрайт (355мл)", bn: "স্প্রাইট (৩৫৫ মিলি)", my: "စပရိုက် (၃၅၅ မီလီလီတာ)" },
    price: 1500, soldOut: false, needsReview: false
  },

  /* ------------------------- 만권화밥 1층 - 화면1 ------------------------- */
  {
    id: "mangwon-mul-naengmyeon",
    store: "mangwon", group: 1, order: 1,
    image: "/images/mangwon/mul-naengmyeon.jpg",
    name: { ko: "물냉면", en: "Mul Naengmyeon (Cold Noodle Soup)", zh: "水冷面", vi: "Mì lạnh nước", mn: "Хүйтэн шөлтэй гоймон", bn: "মুল নেংম্যিওন (ঠান্ডা নুডলস স্যুপ)", my: "မူလ်နန်မျွန် (အေးအေးခေါက်ဆွဲဟင်း)" },
    price: 5000, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-mul-naengmyeon-bulgogi",
    store: "mangwon", group: 1, order: 2,
    image: "/images/mangwon/mul-naengmyeon-bulgogi.jpg",
    name: { ko: "물냉면 + 돼지불고기", en: "Mul Naengmyeon + Pork Bulgogi", zh: "水冷面+烤猪肉", vi: "Mì lạnh nước + Thịt heo nướng", mn: "Хүйтэн шөлтэй гоймон + Амталж шарсан гахайн мах", bn: "মুল নেংম্যিওন + পর্ক বুলগোগি", my: "မူလ်နန်မျွန် + ဝက်သားဘူဂိုဂီ" },
    price: 8500, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-bibim-naengmyeon",
    store: "mangwon", group: 1, order: 3,
    image: "/images/mangwon/bibim-naengmyeon.jpg",
    name: { ko: "비빔냉면", en: "Bibim Naengmyeon (Spicy Cold Noodles)", zh: "拌冷面", vi: "Mì lạnh trộn cay", mn: "Халуун ногоотой хүйтэн гоймон", bn: "বিবিম নেংম্যিওন (ঝাল ঠান্ডা নুডলস)", my: "ဗီဘင်နန်မျွန် (စပ်သောအေးအေးခေါက်ဆွဲ)" },
    price: 5000, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-bibim-naengmyeon-bulgogi",
    store: "mangwon", group: 1, order: 4,
    image: "/images/mangwon/bibim-naengmyeon-bulgogi.jpg",
    name: { ko: "비빔냉면 + 돼지불고기", en: "Bibim Naengmyeon + Pork Bulgogi", zh: "拌冷面+烤猪肉", vi: "Mì lạnh trộn cay + Thịt heo nướng", mn: "Халуун ногоотой хүйтэн гоймон + Амталж шарсан гахайн мах", bn: "বিবিম নেংম্যিওন + পর্ক বুলগোগি", my: "ဗီဘင်နန်မျွန် + ဝက်သားဘူဂိုဂီ" },
    price: 8500, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-seafood-sundubu",
    store: "mangwon", group: 1, order: 5,
    image: "/images/mangwon/seafood-sundubu.jpg",
    name: { ko: "해물순두부(공기밥포함)", en: "Seafood Sundubu (Rice Included)", zh: "海鲜豆腐汤(含米饭)", vi: "Canh đậu phụ hải sản (kèm cơm)", mn: "Далайн бүтээгдэхүүнтэй зөөлөн дүпүний шөл (будаатай)", bn: "সিফুড সুনদুবু (ভাতসহ)", my: "ပင်လယ်စာ ဆွန်ဒူဘူ (ထမင်းပါ)" },
    price: 6000, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-usamgyeop-sundubu",
    store: "mangwon", group: 1, order: 6,
    image: "/images/mangwon/usamgyeop-sundubu.jpg",
    name: { ko: "우삼겹순두부", en: "Beef Belly Sundubu", zh: "牛五花豆腐汤", vi: "Canh đậu phụ ba chỉ bò", mn: "Үхрийн цээжний махтай зөөлөн дүпүний шөл", bn: "বিফ বেলি সুনদুবু", my: "နွားသားရင်ညွှန့် ဆွန်ဒူဘူ" },
    price: 7000, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-jikhwa-beef-deopbap",
    store: "mangwon", group: 1, order: 7,
    image: "/images/mangwon/jikhwa-beef-deopbap.jpg",
    name: { ko: "직화소고기덮밥", en: "Grilled Beef Rice Bowl", zh: "炭烤牛肉盖饭", vi: "Cơm bò nướng", mn: "Гал дээр шарсан үхрийн махтай будаа", bn: "গ্রিলড বিফ রাইস বোল", my: "မီးကင်နွားသား ထမင်းခွက်" },
    price: 7000, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-dwaeji-bulbaek",
    store: "mangwon", group: 1, order: 8,
    image: "/images/mangwon/dwaeji-bulbaek.jpg",
    name: { ko: "돼지불백", en: "Pork Bulgogi", zh: "烤猪肉", vi: "Thịt heo nướng", mn: "Амталж шарсан гахайн мах", bn: "পর্ক বুলগোগি", my: "ဝက်သားဘူဂိုဂီ" },
    price: 6500, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-bulhyang-jikhwa-beef-kimchi-deopbap",
    store: "mangwon", group: 1, order: 9,
    image: "/images/mangwon/bulhyang-jikhwa-beef-kimchi-deopbap.jpg",
    name: { ko: "불향직화소고기김치덮밥", en: "Smoky Grilled Beef Kimchi Rice Bowl", zh: "炭火牛肉泡菜盖饭", vi: "Cơm bò nướng kimchi", mn: "Утаат гал дээр шарсан үхэр, кимчитэй будаа", bn: "স্মোকি গ্রিলড বিফ কিমচি রাইস বোল", my: "မီးခိုးရနံ့နွားသားကင်နှင့်ကင်မချီ ထမင်းခွက်" },
    price: 7400, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-bulhyang-jikhwa-pork-kimchi-deopbap",
    store: "mangwon", group: 1, order: 10,
    image: "/images/mangwon/bulhyang-jikhwa-pork-kimchi-deopbap.jpg",
    name: { ko: "불향직화돼지김치덮밥", en: "Smoky Grilled Pork Kimchi Rice Bowl", zh: "炭火猪肉泡菜盖饭", vi: "Cơm heo nướng kimchi", mn: "Утаат гал дээр шарсан гахай, кимчитэй будаа", bn: "স্মোকি গ্রিলড পর্ক কিমচি রাইস বোল", my: "မီးခိုးရနံ့ဝက်သားကင်နှင့်ကင်မချီ ထမင်းခွက်" },
    price: 6900, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-dwaeji-kimchi-jjigae",
    store: "mangwon", group: 1, order: 11,
    image: "/images/mangwon/dwaeji-kimchi-jjigae.jpg",
    name: { ko: "돼지김치찌개(공기밥포함)", en: "Pork Kimchi Stew (Rice Included)", zh: "猪肉泡菜汤(含米饭)", vi: "Canh kimchi thịt heo (kèm cơm)", mn: "Гахайн кимчийн шөл (будаатай)", bn: "পর্ক কিমচি স্ট্যু (ভাতসহ)", my: "ဝက်သားကင်မချီဟင်း (ထမင်းပါ)" },
    price: 6500, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-spam-dwaeji-kimchi-jjigae",
    store: "mangwon", group: 1, order: 12,
    image: "/images/mangwon/spam-dwaeji-kimchi-jjigae.jpg",
    name: { ko: "스팸돼지김치찌개(공기밥포함)", en: "Spam & Pork Kimchi Stew (Rice Included)", zh: "午餐肉猪肉泡菜汤(含米饭)", vi: "Canh kimchi thịt heo & Spam (kèm cơm)", mn: "Спам, гахайн кимчийн шөл (будаатай)", bn: "স্প্যাম ও পর্ক কিমচি স্ট্যু (ভাতসহ)", my: "စပမ်နှင့်ဝက်သားကင်မချီဟင်း (ထမင်းပါ)" },
    price: 6900, soldOut: false, needsReview: false
  },

  /* ------------------------- 만권화밥 1층 - 화면2 ------------------------- */
  {
    id: "mangwon-spam-sundubu",
    store: "mangwon", group: 2, order: 1,
    image: "/images/mangwon/spam-sundubu.jpg",
    name: { ko: "스팸순두부(공기밥포함)", en: "Spam Sundubu (Rice Included)", zh: "午餐肉豆腐汤(含米饭)", vi: "Canh đậu phụ Spam (kèm cơm)", mn: "Спамтай зөөлөн дүпүний шөл (будаатай)", bn: "স্প্যাম সুনদুবু (ভাতসহ)", my: "စပမ် ဆွန်ဒူဘူ (ထမင်းပါ)" },
    price: 6900, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-jikhwa-beef-jjigae-set",
    store: "mangwon", group: 2, order: 2,
    image: "/images/mangwon/jikhwa-beef-jjigae-set.jpg",
    name: { ko: "직화소고기 + 찌개", en: "Grilled Beef + Stew Set", zh: "炭烤牛肉+汤套餐", vi: "Bò nướng + Canh", mn: "Гал дээр шарсан үхрийн мах + шөл", bn: "গ্রিলড বিফ + স্ট্যু সেট", my: "မီးကင်နွားသား + ဟင်း အစုံ" },
    price: 9900, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-dwaeji-bulbaek-jjigae-set",
    store: "mangwon", group: 2, order: 3,
    image: "/images/mangwon/dwaeji-bulbaek-jjigae-set.jpg",
    name: { ko: "돼지불백 + 찌개", en: "Pork Bulgogi + Stew Set", zh: "烤猪肉+汤套餐", vi: "Thịt heo nướng + Canh", mn: "Амталж шарсан гахайн мах + шөл", bn: "পর্ক বুলগোগি + স্ট্যু সেট", my: "ဝက်သားဘူဂိုဂီ + ဟင်း အစုံ" },
    price: 9500, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-garlic-soy-chicken-deopbap",
    store: "mangwon", group: 2, order: 4,
    image: "/images/mangwon/garlic-soy-chicken-deopbap.jpg",
    name: { ko: "갈릭소이치킨덮밥", en: "Garlic Soy Chicken Rice Bowl", zh: "蒜香酱油鸡肉盖饭", vi: "Cơm gà sốt tỏi tương", mn: "Сармис-соевын соустай тахианы будаа", bn: "গার্লিক সয়া চিকেন রাইস বোল", my: "ကြက်သွန်ဖြူ၊ ပဲငံပြာရည်ကြက်သား ထမင်းခွက်" },
    price: 5900, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-bulhyang-gochujang-chicken-deopbap",
    store: "mangwon", group: 2, order: 5,
    image: "/images/mangwon/bulhyang-gochujang-chicken-deopbap.jpg",
    name: { ko: "불향고추장치킨덮밥", en: "Smoky Gochujang Chicken Rice Bowl", zh: "炭火辣椒酱鸡肉盖饭", vi: "Cơm gà sốt ớt cay", mn: "Утаат гочужан соустай тахианы будаа", bn: "স্মোকি গোচুজাং চিকেন রাইস বোল", my: "မီးခိုးရနံ့ ဂိုချူဂျန်ကြက်သား ထမင်းခွက်" },
    price: 5900, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-garlic-soy-chicken-deopbap-jjigae-set",
    store: "mangwon", group: 2, order: 6,
    image: "/images/mangwon/garlic-soy-chicken-deopbap-jjigae-set.jpg",
    name: { ko: "갈릭소이치킨덮밥 + 찌개", en: "Garlic Soy Chicken Rice Bowl + Stew", zh: "蒜香酱油鸡肉盖饭+汤", vi: "Cơm gà sốt tỏi tương + Canh", mn: "Сармис-соевын соустай тахианы будаа + шөл", bn: "গার্লিক সয়া চিকেন রাইস বোল + স্ট্যু", my: "ကြက်သွန်ဖြူ၊ ပဲငံပြာရည်ကြက်သား ထမင်းခွက် + ဟင်း" },
    price: 9500, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-bulhyang-gochujang-chicken-deopbap-jjigae-set",
    store: "mangwon", group: 2, order: 7,
    image: "/images/mangwon/bulhyang-gochujang-chicken-deopbap-jjigae-set.jpg",
    name: { ko: "불향고추장치킨덮밥 + 찌개", en: "Smoky Gochujang Chicken Rice Bowl + Stew", zh: "炭火辣椒酱鸡肉盖饭+汤", vi: "Cơm gà sốt ớt cay + Canh", mn: "Утаат гочужан соустай тахианы будаа + шөл", bn: "স্মোকি গোচুজাং চিকেন রাইস বোল + স্ট্যু", my: "မီးခိုးရနံ့ ဂိုချူဂျန်ကြက်သား ထမင်းခွက် + ဟင်း" },
    price: 9500, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-flying-fish-roe-bap",
    store: "mangwon", group: 2, order: 8,
    image: "/images/mangwon/flying-fish-roe-bap.jpg",
    name: { ko: "날아라날치알밥", en: "Flying Fish Roe Rice Bowl", zh: "飞鱼子拌饭", vi: "Cơm trứng cá bay", mn: "Нисдэг загасны өндөгтэй будаа", bn: "ফ্লাইং ফিশ রো রাইস বোল", my: "ပျံသန်းငါးဥ ထမင်းခွက်" },
    price: 7000, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-spam-flying-fish-roe-bap",
    store: "mangwon", group: 2, order: 9,
    image: "/images/mangwon/spam-flying-fish-roe-bap.jpg",
    name: { ko: "스팸날치알밥", en: "Spam & Flying Fish Roe Rice Bowl", zh: "午餐肉飞鱼子拌饭", vi: "Cơm trứng cá bay & Spam", mn: "Спамтай нисдэг загасны өндөгний будаа", bn: "স্প্যাম ও ফ্লাইং ফিশ রো রাইস বোল", my: "စပမ်နှင့်ပျံသန်းငါးဥ ထမင်းခွက်" },
    price: 7000, soldOut: false, needsReview: true
    // 원본 키오스크 사진과 정확한 메뉴명 확인 필요 (사진에는 "스팸펄알밥"으로 보임, 지시서 기준 "스팸날치알밥" 사용)
  },
  {
    id: "mangwon-dukkeobi-yukgaejang",
    store: "mangwon", group: 2, order: 10,
    image: "/images/mangwon/dukkeobi-yukgaejang.jpg",
    name: { ko: "두꺼비육개장", en: "Dukkeobi Yukgaejang (Spicy Beef Soup)", zh: "杜鸡比牛肉辣汤", vi: "Canh cay Yukgaejang Dukkeobi", mn: "Дуккэби югэжан (халуун үхрийн шөл)", bn: "দুক্কেওবি ইয়ুকগেজাং (ঝাল বিফ স্যুপ)", my: "ဒွတ်ကိုဘီ ယွတ်ကဲဂျန် (စပ်သောနွားသားဟင်း)" },
    price: 5000, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-dukkeobi-udon-yukgaejang",
    store: "mangwon", group: 2, order: 11,
    image: "/images/mangwon/dukkeobi-udon-yukgaejang.jpg",
    name: { ko: "두꺼비우동육개장", en: "Dukkeobi Udon Yukgaejang", zh: "杜鸡比乌冬辣汤", vi: "Canh cay Yukgaejang Udon Dukkeobi", mn: "Дуккэби удон югэжан", bn: "দুক্কেওবি উদোন ইয়ুকগেজাং", my: "ဒွတ်ကိုဘီ အူဒွန် ယွတ်ကဲဂျန်" },
    price: 5500, soldOut: false, needsReview: false
  },
  {
    id: "mangwon-jikhwa-samgyeop-deopbap",
    store: "mangwon", group: 2, order: 12,
    image: "/images/mangwon/jikhwa-samgyeop-deopbap.jpg",
    name: { ko: "직화삼겹덮밥", en: "Grilled Pork Belly Rice Bowl", zh: "炭烤五花肉盖饭", vi: "Cơm ba chỉ nướng", mn: "Гал дээр шарсан цээжний махтай будаа", bn: "গ্রিলড পর্ক বেলি রাইস বোল", my: "မီးကင်ဝက်သားရင်ညွှန့် ထမင်းခွက်" },
    price: 7500, soldOut: false, needsReview: false
  },

  /* ------------------------- 후루룩찹찹 2층 - 화면1 ------------------------- */
  {
    id: "hururuk-usamgyeop-malatang-samgak-kimbap-set",
    store: "hururuk", group: 1, order: 1,
    image: "/images/hururuk/usamgyeop-malatang-samgak-kimbap-set.jpg",
    name: { ko: "우삼겹마라탕삼각김밥세트", en: "Beef Belly Malatang + Triangle Kimbap Set", zh: "牛五花麻辣烫+三角紫菜包饭套餐", vi: "Malatang ba chỉ bò + Cơm nắm tam giác", mn: "Үхрийн цээжний махтай малатан + гурвалжин будаа боовны иж бүрдэл", bn: "বিফ বেলি মালাথাং + ত্রিভুজ কিম্বাপ সেট", my: "နွားသားရင်ညွှန့်မာလာသန် + တြိဂံကင်းဘတ်ပ် အစုံ" },
    price: 11900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-usamgyeop-bomb-riceNoodle-samgak-kimbap-set",
    store: "hururuk", group: 1, order: 2,
    image: "/images/hururuk/usamgyeop-bomb-riceNoodle-samgak-kimbap-set.jpg",
    name: { ko: "우삼겹폭탄쌀국수 삼각김밥세트", en: "Beef Belly Loaded Pho + Triangle Kimbap Set", zh: "牛五花爆量米粉+三角紫菜包饭套餐", vi: "Phở đầy đặn ba chỉ bò + Cơm nắm tam giác", mn: "Үхрийн цээжний махтай ихэссэн будааны гоймон + гурвалжин будаа боовны иж бүрдэл", bn: "বিফ বেলি ভরপুর ফো + ত্রিভুজ কিম্বাপ সেট", my: "နွားသားရင်ညွှန့်ဖြည့်ဖို့ + တြိဂံကင်းဘတ်ပ် အစုံ" },
    price: 11900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-bulhyang-usamgyeop-ragu-pasta-samgak-kimbap-set",
    store: "hururuk", group: 1, order: 3,
    image: "/images/hururuk/bulhyang-usamgyeop-ragu-pasta-samgak-kimbap-set.jpg",
    name: { ko: "불향우삼겹 라구파스타 삼각김밥세트", en: "Smoky Beef Belly Ragu Pasta + Triangle Kimbap Set", zh: "炭火牛五花肉酱意面+三角紫菜包饭套餐", vi: "Mì Ý sốt ragu ba chỉ bò + Cơm nắm tam giác", mn: "Утаат үхрийн цээжний махтай рагу паста + гурвалжин будаа боовны иж бүрдэл", bn: "স্মোকি বিফ বেলি রাগু পাস্তা + ত্রিভুজ কিম্বাপ সেট", my: "မီးခိုးရနံ့နွားသားရင်ညွှန့်ရာဂုပါစတာ + တြိဂံကင်းဘတ်ပ် အစုံ" },
    price: 12500, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-usamgyeop-malatang",
    store: "hururuk", group: 1, order: 4,
    image: "/images/hururuk/usamgyeop-malatang.jpg",
    name: { ko: "우삼겹마라탕", en: "Beef Belly Malatang", zh: "牛五花麻辣烫", vi: "Malatang ba chỉ bò", mn: "Үхрийн цээжний махтай малатан", bn: "বিফ বেলি মালাথাং", my: "နွားသားရင်ညွှန့်မာလာသန်" },
    price: 8900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-usamgyeop-bomb-rice-noodle",
    store: "hururuk", group: 1, order: 5,
    image: "/images/hururuk/usamgyeop-bomb-rice-noodle.jpg",
    name: { ko: "우삼겹 폭탄쌀국수", en: "Beef Belly Loaded Pho", zh: "牛五花爆量米粉", vi: "Phở đầy đặn ba chỉ bò", mn: "Үхрийн цээжний махтай ихэссэн будааны гоймон", bn: "বিফ বেলি ভরপুর ফো", my: "နွားသားရင်ညွှန့်ဖြည့်ဖို့" },
    price: 8900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-bulhyang-usamgyeop-ragu-deopbap",
    store: "hururuk", group: 1, order: 6,
    image: "/images/hururuk/bulhyang-usamgyeop-ragu-deopbap.jpg",
    name: { ko: "불향우삼겹 라구덮밥", en: "Smoky Beef Belly Ragu Rice Bowl", zh: "炭火牛五花肉酱盖饭", vi: "Cơm sốt ragu ba chỉ bò", mn: "Утаат үхрийн цээжний махтай рагу будаа", bn: "স্মোকি বিফ বেলি রাগু রাইস বোল", my: "မီးခိုးရနံ့နွားသားရင်ညွှန့်ရာဂု ထမင်းခွက်" },
    price: 9500, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-pork-malatang",
    store: "hururuk", group: 1, order: 7,
    image: "/images/hururuk/pork-malatang.jpg",
    name: { ko: "돼지고기마라탕", en: "Pork Malatang", zh: "猪肉麻辣烫", vi: "Malatang thịt heo", mn: "Гахайн махтай малатан", bn: "পর্ক মালাথাং", my: "ဝက်သားမာလာသန်" },
    price: 7900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-king-chicken-rice-noodles",
    store: "hururuk", group: 1, order: 8,
    image: "/images/hururuk/king-chicken-rice-noodles.jpg",
    name: { ko: "왕다리쌀국수", en: "Chicken Leg Pho", zh: "大鸡腿米粉", vi: "Phở đùi gà lớn", mn: "Том тахианы хөлтэй будааны гоймон", bn: "বড় চিকেন লেগ ফো", my: "ကြီးမားသောကြက်ခြေထောက်ဖို့" },
    price: 7500, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-duthum-chashu-rice-noodle",
    store: "hururuk", group: 1, order: 9,
    image: "/images/hururuk/duthum-chashu-rice-noodle.jpg",
    name: { ko: "두툼차슈쌀국수", en: "Thick-Cut Chashu Pho", zh: "厚切叉烧米粉", vi: "Phở xá xíu dày", mn: "Зузаан чашүтэй будааны гоймон", bn: "পুরু চাশু ফো", my: "ထူသောချာရှူးဖို့" },
    price: 8500, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-bulhyang-ganjang-usamgyeop-bokkeummyeon",
    store: "hururuk", group: 1, order: 10,
    image: "/images/hururuk/bulhyang-ganjang-usamgyeop-bokkeummyeon.jpg",
    name: { ko: "불향간장우삼겹볶음면", en: "Smoky Soy Beef Belly Stir-Fried Noodles", zh: "炭火酱油牛五花炒面", vi: "Mì xào ba chỉ bò sốt tương", mn: "Утаат соёвын соустай үхрийн цээжний хуурсан гоймон", bn: "স্মোকি সয়া বিফ বেলি স্টার-ফ্রাই নুডলস", my: "မီးခိုးရနံ့စွယ်ဆော့စ်နွားသားရင်ညွှန့်ကြော်ခေါက်ဆွဲ" },
    price: 8900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-hwakkeun-gochujang-usamgyeop-bokkeummyeon",
    store: "hururuk", group: 1, order: 11,
    image: "/images/hururuk/hwakkeun-gochujang-usamgyeop-bokkeummyeon.jpg",
    name: { ko: "화끈고추장우삼겹볶음면", en: "Fiery Gochujang Beef Belly Stir-Fried Noodles", zh: "香辣辣椒酱牛五花炒面", vi: "Mì xào ba chỉ bò sốt ớt cay", mn: "Халуун гочужан соустай үхрийн цээжний хуурсан гоймон", bn: "ঝাল গোচুজাং বিফ বেলি স্টার-ফ্রাই নুডলস", my: "စပ်သောဂိုချူဂျန်နွားသားရင်ညွှန့်ကြော်ခေါက်ဆွဲ" },
    price: 8900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-meat-ragu-spaghetti",
    store: "hururuk", group: 1, order: 12,
    image: "/images/hururuk/meat-ragu-spaghetti.jpg",
    name: { ko: "고기듬뿍 라구스파게티", en: "Meat-Loaded Ragu Spaghetti", zh: "肉酱意大利面(加量)", vi: "Spaghetti sốt ragu nhiều thịt", mn: "Мах ихтэй рагу соустай спагетти", bn: "প্রচুর মাংসসহ রাগু স্প্যাগেটি", my: "အသားအပြည့်ရာဂုစပါဂက်တီ" },
    price: 7900, soldOut: false, needsReview: false
  },

  /* ------------------------- 후루룩찹찹 2층 - 화면2 ------------------------- */
  {
    id: "hururuk-meat-ragu-deopbap",
    store: "hururuk", group: 2, order: 1,
    image: "/images/hururuk/meat-ragu-deopbap.jpg",
    name: { ko: "고기듬뿍 라구덮밥", en: "Meat-Loaded Ragu Rice Bowl", zh: "肉酱盖饭(加量)", vi: "Cơm sốt ragu nhiều thịt", mn: "Мах ихтэй рагу соустай будаа", bn: "প্রচুর মাংসসহ রাগু রাইস বোল", my: "အသားအပြည့်ရာဂု ထမင်းခွက်" },
    price: 7900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-sausage-ragu-deopbap",
    store: "hururuk", group: 2, order: 2,
    image: "/images/hururuk/sausage-ragu-deopbap.jpg",
    name: { ko: "통소세지 라구덮밥", en: "Whole Sausage Ragu Rice Bowl", zh: "整根香肠肉酱盖饭", vi: "Cơm sốt ragu xúc xích nguyên cây", mn: "Бүтэн хиамтай рагу соустай будаа", bn: "গোটা সসেজ রাগু রাইস বোল", my: "ဝက်အူချောင်းတစ်ချောင်းလုံးရာဂု ထမင်းခွက်" },
    price: 8900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-bulhyang-usamgyeop-ragu-spaghetti",
    store: "hururuk", group: 2, order: 3,
    image: "/images/hururuk/bulhyang-usamgyeop-ragu-spaghetti.jpg",
    name: { ko: "불향우삼겹 라구스파게티", en: "Smoky Beef Belly Ragu Spaghetti", zh: "炭火牛五花肉酱意面", vi: "Spaghetti sốt ragu ba chỉ bò", mn: "Утаат үхрийн цээжний махтай рагу соустай спагетти", bn: "স্মোকি বিফ বেলি রাগু স্প্যাগেটি", my: "မီးခိုးရနံ့နွားသားရင်ညွှန့်ရာဂုစပါဂက်တီ" },
    price: 9500, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-sausage-ragu-spaghetti",
    store: "hururuk", group: 2, order: 4,
    image: "/images/hururuk/sausage-ragu-spaghetti.jpg",
    name: { ko: "통소세지 라구스파게티", en: "Whole Sausage Ragu Spaghetti", zh: "整根香肠肉酱意面", vi: "Spaghetti sốt ragu xúc xích nguyên cây", mn: "Бүтэн хиамтай рагу соустай спагетти", bn: "গোটা সসেজ রাগু স্প্যাগেটি", my: "ဝက်အူချောင်းတစ်ချောင်းလုံးရာဂုစပါဂက်တီ" },
    price: 8900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-duthum-chashu-ragu-spaghetti",
    store: "hururuk", group: 2, order: 5,
    image: "/images/hururuk/duthum-chashu-ragu-spaghetti.jpg",
    name: { ko: "두툼차슈 라구스파게티", en: "Thick-Cut Chashu Ragu Spaghetti", zh: "厚切叉烧肉酱意面", vi: "Spaghetti sốt ragu xá xíu dày", mn: "Зузаан чашүтэй рагу соустай спагетти", bn: "পুরু চাশু রাগু স্প্যাগেটি", my: "ထူသောချာရှူးရာဂုစပါဂက်တီ" },
    price: 9500, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-clam-chowder-spaghetti",
    store: "hururuk", group: 2, order: 6,
    image: "/images/hururuk/clam-chowder-spaghetti.jpg",
    name: { ko: "클램차우더 스파게티", en: "Clam Chowder Spaghetti", zh: "蛤蜊浓汤意面", vi: "Spaghetti sốt súp nghêu", mn: "Хясаа шөлтэй спагетти", bn: "ক্ল্যাম চাউডার স্প্যাগেটি", my: "ခရုမြောက်ချောင်ဒါစပါဂက်တီ" },
    price: 7900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-eolkeun-usamgyeop-haejang-pasta",
    store: "hururuk", group: 2, order: 7,
    image: "/images/hururuk/eolkeun-usamgyeop-haejang-pasta.jpg",
    name: { ko: "얼큰우삼겹 해장파스타", en: "Spicy Beef Belly Hangover Pasta", zh: "辣味牛五花解酒意面", vi: "Mì Ý cay giải rượu ba chỉ bò", mn: "Халуун ногоотой үхрийн цээжний мах, сэргээх паста", bn: "ঝাল বিফ বেলি হ্যাংওভার পাস্তা", my: "စပ်သောနွားသားရင်ညွှန့် အရက်ပြေဆေးပါစတာ" },
    price: 8500, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-bulhyang-usamgyeop-kimchi-cream-pasta",
    store: "hururuk", group: 2, order: 8,
    image: "/images/hururuk/bulhyang-usamgyeop-kimchi-cream-pasta.jpg",
    name: { ko: "불향우삼겹 김치크림파스타", en: "Smoky Beef Belly Kimchi Cream Pasta", zh: "炭火牛五花泡菜奶油意面", vi: "Mì Ý kem kimchi ba chỉ bò", mn: "Утаат үхрийн цээжний мах, кимчи-крем паста", bn: "স্মোকি বিফ বেলি কিমচি ক্রিম পাস্তা", my: "မီးခိုးရနံ့နွားသားရင်ညွှန့်ကင်မချီကရင်မ်ပါစတာ" },
    price: 9500, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-bulhyang-kimchi-bulgogi-deopbap",
    store: "hururuk", group: 2, order: 9,
    image: "/images/hururuk/bulhyang-kimchi-bulgogi-deopbap.jpg",
    name: { ko: "불향김치소불고기덮밥", en: "Smoky Kimchi Bulgogi Rice Bowl", zh: "炭火泡菜烤牛肉盖饭", vi: "Cơm bulgogi kimchi", mn: "Утаат кимчи, шарсан үхрийн махтай будаа", bn: "স্মোকি কিমচি বুলগোগি রাইস বোল", my: "မီးခိုးရနံ့ကင်မချီဘူဂိုဂီ ထမင်းခွက်" },
    price: 7900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-garlic-pork-deopbap",
    store: "hururuk", group: 2, order: 10,
    image: "/images/hururuk/garlic-pork-deopbap.jpg",
    name: { ko: "갈릭포크덮밥", en: "Garlic Pork Rice Bowl", zh: "蒜香猪肉盖饭", vi: "Cơm thịt heo sốt tỏi", mn: "Сармистай гахайн махны будаа", bn: "গার্লিক পর্ক রাইস বোল", my: "ကြက်သွန်ဖြူဝက်သား ထမင်းခွက်" },
    price: 6900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-duthum-chashu-deopbap",
    store: "hururuk", group: 2, order: 11,
    image: "/images/hururuk/duthum-chashu-deopbap.jpg",
    name: { ko: "두툼차슈덮밥", en: "Thick-Cut Chashu Rice Bowl", zh: "厚切叉烧盖饭", vi: "Cơm xá xíu dày", mn: "Зузаан чашүтэй будаа", bn: "পুরু চাশু রাইস বোল", my: "ထူသောချာရှူး ထမင်းခွက်" },
    price: 7900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-tomato-pork-curry",
    store: "hururuk", group: 2, order: 12,
    image: "/images/hururuk/tomato-pork-curry.jpg",
    name: { ko: "토마토포크커리", en: "Tomato Pork Curry", zh: "番茄猪肉咖喱", vi: "Cà ri thịt heo sốt cà chua", mn: "Улаан лоолийтэй гахайн махны карри", bn: "টমেটো পর্ক কারি", my: "ခရမ်းချဉ်သီးဝက်သားကရီ" },
    price: 7900, soldOut: false, needsReview: false
  },

  /* ------------------------- 후루룩찹찹 2층 - 화면3 ------------------------- */
  {
    id: "hururuk-italian-crispy-pork-cheese-deopbap",
    store: "hururuk", group: 3, order: 1,
    image: "/images/hururuk/italian-crispy-pork-cheese-deopbap.jpg",
    name: { ko: "이태리 바삭포크치즈덮밥", en: "Italian Crispy Pork & Cheese Rice Bowl", zh: "意式脆皮猪肉芝士盖饭", vi: "Cơm heo giòn phô mai kiểu Ý", mn: "Итали маягийн хурц, бяслагтай гахайн махны будаа", bn: "ইতালিয়ান ক্রিসপি পর্ক চিজ রাইস বোল", my: "အီတလီပုံစံကြွပ်သောဝက်သားနှင့်ချိစ် ထမင်းခွက်" },
    price: 8500, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-usamgyeop-ramen-rice",
    store: "hururuk", group: 3, order: 2,
    image: null,
    name: { ko: "우삼겹라면 + 공기밥", en: "Beef Belly Ramen + Rice", zh: "牛五花拉面+米饭", vi: "Mì ramen ba chỉ bò + Cơm", mn: "Үхрийн цээжний махтай рамен + будаа", bn: "বিফ বেলি রামেন + ভাত", my: "နွားသားရင်ညွှန့်ရာမန် + ထမင်း" },
    price: 6900, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-cola",
    store: "hururuk", group: 3, order: 3,
    image: "/images/hururuk/cola.jpg",
    name: { ko: "콜라 355ml", en: "Coke (355ml)", zh: "可乐(355ml)", vi: "Coca-Cola (355ml)", mn: "Кола 355мл", bn: "কোকা-কোলা (৩৫৫ মিলি)", my: "ကိုကာကိုလာ (၃၅၅ မီလီလီတာ)" },
    price: 1500, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-zero-cola",
    store: "hururuk", group: 3, order: 4,
    image: "/images/hururuk/zero-cola.jpg",
    name: { ko: "제로콜라 355ml", en: "Coke Zero (355ml)", zh: "零度可乐(355ml)", vi: "Coca-Cola Zero (355ml)", mn: "Зеро кола 355мл", bn: "জিরো কোকা-কোলা (৩৫৫ মিলি)", my: "ကိုကာကိုလာ ဇီးရို (၃၅၅ မီလီလီတာ)" },
    price: 1500, soldOut: false, needsReview: false
  },
  {
    id: "hururuk-fanta",
    store: "hururuk", group: 3, order: 5,
    image: "/images/hururuk/fanta.jpg",
    name: { ko: "환타", en: "Fanta", zh: "芬达", vi: "Fanta", mn: "Фанта", bn: "ফ্যান্টা", my: "ဖန်တာ" },
    price: 1500, soldOut: false, needsReview: false
  }
];

/* 천원의 아침밥 안내 (밥심 화면 상단 고정 안내칸 + 상세 모달 공용 데이터) */
const BREAKFAST_INFO = {
  title: { ko: "천원의 아침밥", en: "1,000 Won Breakfast", zh: "1,000韩元早餐", vi: "Bữa sáng 1.000 won", mn: "1,000 воны өглөөний хоол", bn: "১,০০০ ওনের সকালের খাবার", my: "ဝမ် ၁,၀၀၀ နံနက်စာ" },
  tabLabel: { ko: "일반 메뉴", en: "Menu", zh: "普通菜单", vi: "Thực đơn thường", mn: "Ерөнхий цэс", bn: "সাধারণ মেনু", my: "ယေဘုယျမီနူး" },
  todayMenuTitle: { ko: "오늘의 아침 메뉴", en: "Today\u2019s Breakfast Menu", zh: "今日早餐菜单", vi: "Thực đơn bữa sáng hôm nay", mn: "Өнөөдрийн өглөөний цэс", bn: "আজকের সকালের খাবারের মেনু", my: "ယနေ့ နံနက်စာမီနူး" },
  tomorrowMenuTitle: { ko: "내일의 아침 메뉴", en: "Tomorrow\u2019s Breakfast Menu", zh: "明日早餐菜单", vi: "Thực đơn bữa sáng ngày mai", mn: "Маргаашийн өглөөний цэс", bn: "আগামীকালের সকালের খাবারের মেনু", my: "မနက်ဖြန် နံနက်စာမီနူး" },
  todayClosedMessage: {
    ko: "오늘은 천원의 아침밥을 운영하지 않습니다.",
    en: "The 1,000 Won Breakfast is not available today.",
    zh: "今天不提供1,000韩元早餐。",
    vi: "Hôm nay không phục vụ bữa sáng 1.000 won.",
    mn: "Өнөөдөр 1,000 воны өглөөний хоол үйлчлэхгүй.",
    bn: "আজ ১,০০০ ওনের সকালের খাবার পরিবেশন করা হবে না।",
    my: "ယနေ့ ဝမ် ၁,၀၀၀ နံနက်စာ မရရှိနိုင်ပါ။"
  },
  tomorrowClosedMessage: {
    ko: "내일은 천원의 아침밥을 운영하지 않습니다.",
    en: "The 1,000 Won Breakfast is not available tomorrow.",
    zh: "明天不提供1,000韩元早餐。",
    vi: "Ngày mai không phục vụ bữa sáng 1.000 won.",
    mn: "Маргааш 1,000 воны өглөөний хоол үйлчлэхгүй.",
    bn: "আগামীকাল ১,০০০ ওনের সকালের খাবার পরিবেশন করা হবে না।",
    my: "မနက်ဖြန် ဝမ် ၁,၀၀၀ နံနက်စာ မရရှိနိုင်ပါ။"
  },
  /* 운영일이지만 아직 메뉴가 등록되지 않았을 때 (휴무 문구와는 다름) */
  menuPreparingMessage: {
    ko: "메뉴를 준비 중입니다.",
    en: "The menu is being prepared.",
    zh: "菜单准备中。",
    vi: "Thực đơn đang được chuẩn bị.",
    mn: "Цэсийг бэлтгэж байна.",
    bn: "মেনু প্রস্তুত করা হচ্ছে।",
    my: "မီနူးကို ပြင်ဆင်နေပါသည်။"
  },
  mealFieldLabels: {
    rice: { ko: "밥", en: "Rice", zh: "米饭", vi: "Cơm", mn: "Будаа", bn: "ভাত", my: "ထမင်း" },
    soup: { ko: "국", en: "Soup", zh: "汤", vi: "Canh", mn: "Шөл", bn: "স্যুপ", my: "ဟင်းရည်" },
    main: { ko: "주메뉴", en: "Main", zh: "主菜", vi: "Món chính", mn: "Гол хоол", bn: "প্রধান খাবার", my: "အဓိကဟင်းလျာ" },
    side1: { ko: "반찬1", en: "Side 1", zh: "小菜1", vi: "Món phụ 1", mn: "Дагалдах хоол 1", bn: "সাইড ডিশ ১", my: "ဘေးထွက်ဟင်း ၁" },
    side2: { ko: "반찬2", en: "Side 2", zh: "小菜2", vi: "Món phụ 2", mn: "Дагалдах хоол 2", bn: "সাইড ডিশ ২", my: "ဘေးထွက်ဟင်း ၂" },
    kimchi: { ko: "김치", en: "Kimchi", zh: "泡菜", vi: "Kim chi", mn: "Кимчи", bn: "কিমচি", my: "ကင်မချီ" },
    regular: { ko: "일반식", en: "Regular Meal", zh: "普通餐", vi: "Suất thường", mn: "Энгийн хоол", bn: "নিয়মিত খাবার", my: "ပုံမှန်အစားအစာ" },
    simple: { ko: "간편식", en: "Simple Meal", zh: "简餐", vi: "Suất đơn giản", mn: "Хялбар хоол", bn: "সহজ খাবার", my: "လွယ်ကူသောအစားအစာ" }
  },
  tagline: {
    ko: "단돈 1,000원으로 든든한 아침을 시작하세요.",
    en: "Start your day with a filling breakfast for only \u20A91,000.",
    zh: "只需1,000韩元，即可享用一份丰盛的早餐。",
    vi: "Bắt đầu ngày mới với bữa sáng đầy đủ chỉ với 1.000 won.",
    mn: "Ердөө 1,000 воноор цатгалан өглөөгөө эхлүүлээрэй.",
    bn: "মাত্র ১,০০০ ওনে ভরপেট সকালের নাস্তা শুরু করুন।",
    my: "ဝမ် ၁,၀၀၀ တည်းဖြင့် ဝစွာနံနက်စာစားပြီး တစ်နေ့တာကိုစတင်ပါ။"
  },
  fieldLabels: {
    location: { ko: "장소", en: "Location", zh: "地点", vi: "Địa điểm", mn: "Байршил", bn: "স্থান", my: "တည်နေရာ" },
    hours: { ko: "운영시간", en: "Hours", zh: "时间", vi: "Thời gian", mn: "Ажиллах цаг", bn: "সময়সূচী", my: "ဖွင့်ချိန်" },
    price: { ko: "이용요금", en: "Price", zh: "价格", vi: "Giá", mn: "Үнэ", bn: "মূল্য", my: "ဈေးနှုန်း" },
    eligibility: { ko: "이용대상", en: "Eligibility", zh: "适用对象", vi: "Đối tượng sử dụng", mn: "Хэрэглэгч", bn: "যোগ্যতা", my: "အရည်အချင်း" },
    steps: { ko: "이용방법", en: "How to Use", zh: "使用方法", vi: "Cách sử dụng", mn: "Хэрхэн ашиглах", bn: "ব্যবহারের পদ্ধতি", my: "အသုံးပြုနည်း" }
  },
  location: { ko: "밥심, 1층", en: "밥심, 1st Floor", zh: "밥심, 1楼", vi: "밥심, tầng 1", mn: "밥심, 1-р давхар", bn: "밥심, ১ম তলা", my: "밥심, ပထမထပ်" },
  hours: { ko: "오전 7:30~9:30", en: "7:30 AM\u20139:30 AM", zh: "上午7:30\u20139:30", vi: "7:30\u20139:30", mn: "Өглөө 7:30~9:30", bn: "সকাল ৭:৩০~৯:৩০", my: "မနက် ၇:၃၀~၉:၃၀" },
  price: { ko: "1,000원", en: "\u20A91,000", zh: "1,000韩元", vi: "1.000 won", mn: "1,000 вон", bn: "১,০০০ ওন", my: "၁,၀၀၀ ဝမ်" },
  eligibility: {
    ko: ["인제대학교 학생", "외국인 유학생", "인제글로벌어학원\n(INJE GLOBAL LANGUAGE INSTITUTE)"],
    en: ["Inje University students", "International students", "INJE GLOBAL LANGUAGE INSTITUTE students"],
    zh: ["仁济大学学生", "外国留学生", "INJE GLOBAL LANGUAGE INSTITUTE 学生"],
    vi: ["Sinh viên Đại học Inje", "Du học sinh quốc tế", "Học viên INJE GLOBAL LANGUAGE INSTITUTE"],
    mn: ["Inje их сургуулийн оюутан", "Гадаад оюутан", "Inje глобал хэлний сургууль\n(INJE GLOBAL LANGUAGE INSTITUTE)"],
    bn: ["ইনজে বিশ্ববিদ্যালয়ের শিক্ষার্থী", "বিদেশী আন্তর্জাতিক শিক্ষার্থী", "ইনজে গ্লোবাল ল্যাঙ্গুয়েজ ইনস্টিটিউট\n(INJE GLOBAL LANGUAGE INSTITUTE)"],
    my: ["အင်ဂျေတက္ကသိုလ်ကျောင်းသား", "နိုင်ငံခြားနိုင်ငံတကာကျောင်းသား", "အင်ဂျေ ဂလိုဘယ်ဘာသာစကားသင်တန်းကျောင်း\n(INJE GLOBAL LANGUAGE INSTITUTE)"]
  },
  steps: {
    ko: ["헤이영 앱에서 QR 인증", "1,000원 식권 구매", "밥 또는 빵 라인 중 한 곳 선택"],
    en: ["Verify the QR code using the HeyYoung app.", "Purchase a \u20A91,000 meal ticket.", "Choose either the rice line or the bread line."],
    zh: ["使用HeyYoung应用程序进行二维码认证。", "购买1,000韩元餐券。", "米饭餐线和面包餐线中选择一种。"],
    vi: ["Xác thực mã QR bằng ứng dụng HeyYoung.", "Mua phiếu ăn giá 1.000 won.", "Chọn một trong hai quầy: cơm hoặc bánh mì."],
    mn: ["HeyYoung апп-аар QR код баталгаажуулах", "1,000 воны хоолны тасалбар худалдаж авах", "Будаа эсвэл талхны эгнээнээс сонгох"],
    bn: ["HeyYoung অ্যাপে QR কোড যাচাই করুন", "১,০০০ ওনের খাবার টিকিট কিনুন", "ভাত অথবা রুটি লাইনের যেকোনো একটি বেছে নিন"],
    my: ["HeyYoung အက်ပ်တွင် QR ကုဒ် စစ်ဆေးပါ", "ဝမ် ၁,၀၀၀ အစားအစာလက်မှတ် ဝယ်ယူပါ", "ထမင်း သို့မဟုတ် ပေါင်မုန့် တန်းတစ်ခုကို ရွေးချယ်ပါ"]
  },
  notes: {
    ko: ["준비된 수량 소진 시 조기 종료될 수 있습니다.", "밥과 빵은 중복 이용할 수 없습니다."],
    en: ["Available while supplies last.", "You may use only one line: rice or bread."],
    zh: ["数量有限，售完即止。", "米饭和面包不可重复领取。"],
    vi: ["Có thể kết thúc sớm khi hết suất.", "Không được sử dụng đồng thời cả hai quầy."],
    mn: ["Бэлтгэсэн хэмжээ дуусвал эрт зогсож болно.", "Будаа, талхыг давхар ашиглах боломжгүй."],
    bn: ["প্রস্তুতকৃত পরিমাণ শেষ হলে আগেই বন্ধ হতে পারে।", "ভাত ও রুটি একসাথে ব্যবহার করা যাবে না।"],
    my: ["ပြင်ဆင်ထားသောပမာဏကုန်ပါက စောစီးစွာ ရပ်နားနိုင်ပါသည်။", "ထမင်းနှင့်ပေါင်မုန့်ကို တစ်ပြိုင်နက် အသုံးပြု၍မရပါ။"]
  }
};

/* 무료 콜라 쿠폰 (만권화밥 · 후루룩찹찹 전용 배너 + 상세창 + 직원 제시 화면) */
const COLA_COUPON = {
  eligibleStores: ["mangwon", "hururuk"],
  banner: {
    title: { ko: "무료 콜라 쿠폰", en: "Free Coke Coupon", zh: "免费可乐券", vi: "Phiếu Coca-Cola miễn phí", mn: "ҮНЭГҮЙ КОЛАНЫ КУПОН", bn: "ফ্রি কোকা-কোলা কুপন", my: "အခမဲ့ ကိုကာကိုလာ ကူပွန်" },
    subtitle: {
      ko: "음식 주문하고 콜라 1캔 무료로 받으세요!",
      en: "Order food and get 1 can of Coke free!",
      zh: "点餐即可免费获得1罐可乐！",
      vi: "Gọi món và nhận miễn phí 1 lon Coca-Cola!",
      mn: "Хоол захиалаад 1 лааз кола үнэгүй аваарай!",
      bn: "খাবার অর্ডার করুন এবং ১ ক্যান কোকা-কোলা ফ্রি পান!",
      my: "အစားအစာမှာပြီး ကိုကာကိုလာ ၁ ဘူး အခမဲ့ ရယူလိုက်ပါ!"
    },
    button: { ko: "쿠폰 보기", en: "View Coupon", zh: "查看优惠券", vi: "Xem phiếu", mn: "Купон харах", bn: "কুপন দেখুন", my: "ကူပွန်ကြည့်ရန်" }
  },
  detail: {
    title: { ko: "무료 콜라 쿠폰", en: "Free Coke Coupon", zh: "免费可乐券", vi: "Phiếu Coca-Cola miễn phí", mn: "ҮНЭГҮЙ КОЛАНЫ КУПОН", bn: "ফ্রি কোকা-কোলা কুপন", my: "အခမဲ့ ကိုကာကိုလာ ကူပွန်" },
    subtitle: {
      ko: "음식 구매 시 콜라 1캔 무료!",
      en: "Get 1 can of Coke free with any food purchase!",
      zh: "购买餐点即可免费获得1罐可乐！",
      vi: "Mua món ăn được tặng miễn phí 1 lon Coca-Cola!",
      mn: "Хоол худалдаж авахад 1 лааз кола үнэгүй!",
      bn: "খাবার কিনলেই ১ ক্যান কোকা-কোলা ফ্রি!",
      my: "အစားအစာဝယ်ယူပါက ကိုကာကိုလာ ၁ ဘူး အခမဲ့!"
    },
    storesLabel: { ko: "사용 가능 매장", en: "Available Stores", zh: "可用门店", vi: "Cửa hàng áp dụng", mn: "Ашиглах газар", bn: "ব্যবহারযোগ্য দোকান", my: "အသုံးပြုနိုင်သောဆိုင်များ" },
    stores: [
      { brand: "만권화밥", floor: { ko: "1층", en: "1F", zh: "1楼", vi: "tầng 1", mn: "1-р давхар", bn: "১ম তলা", my: "ပထမထပ်" } },
      { brand: "후루룩찹찹", floor: { ko: "2층", en: "2F", zh: "2楼", vi: "tầng 2", mn: "2-р давхар", bn: "২য় তলা", my: "ဒုတိယထပ်" } }
    ],
    conditionLabel: { ko: "사용 조건", en: "Conditions", zh: "使用条件", vi: "Điều kiện sử dụng", mn: "Ашиглах нөхцөл", bn: "ব্যবহারের শর্ত", my: "အသုံးပြုရန်စည်းကမ်းချက်" },
    conditions: {
      ko: ["음식 1개 구매 시 1인 1매", "콜라 1캔 무료 제공"],
      en: ["1 coupon per person with 1 food item purchased", "1 free can of Coke provided"],
      zh: ["购买1份餐点，每人限用1张", "赠送可乐1罐"],
      vi: ["Mỗi người 1 phiếu khi mua 1 món ăn", "Tặng 1 lon Coca-Cola miễn phí"],
      mn: ["Хоол худалдаж авах үед нэг хүн нэг купон ашиглана.", "1 лааз кола үнэгүй өгнө."],
      bn: ["১টি খাবার কিনলে প্রতিজনে ১টি কুপন", "১ ক্যান কোকা-কোলা ফ্রি প্রদান করা হয়"],
      my: ["အစားအစာ ၁ ခု ဝယ်ယူပါက တစ်ဦးလျှင် ၁ စောင်", "ကိုကာကိုလာ ၁ ဘူး အခမဲ့ ပေးအပ်ပါသည်"]
    },
    countLabel: { ko: "사용 횟수", en: "Usage Limit", zh: "使用次数", vi: "Số lần sử dụng", mn: "Ашиглах тоо", bn: "ব্যবহারের সংখ্যা", my: "အသုံးပြုနိုင်သောအကြိမ်" },
    count: { ko: "횟수 제한 없음", en: "No limit", zh: "次数不限", vi: "Không giới hạn", mn: "Ашиглах давтамжийн хязгааргүй", bn: "সীমাহীন ব্যবহার", my: "ကန့်သတ်ချက်မရှိ" },
    howToLabel: { ko: "사용방법", en: "How to Use", zh: "使用方法", vi: "Cách sử dụng", mn: "Хэрхэн ашиглах", bn: "ব্যবহারের পদ্ধতি", my: "အသုံးပြုနည်း" },
    howTo: {
      ko: "음식을 제공받을 때 직원에게 이 쿠폰을 보여주세요.",
      en: "Show this coupon to staff when you receive your food.",
      zh: "领取餐点时向工作人员出示此优惠券。",
      vi: "Xuất trình phiếu này cho nhân viên khi nhận món ăn.",
      mn: "Хоолоо авахдаа купоноо үзүүлнэ үү.",
      bn: "খাবার গ্রহণের সময় কর্মীকে এই কুপনটি দেখান।",
      my: "အစားအစာလက်ခံရရှိချိန်တွင် ဝန်ထမ်းအား ဤကူပွန်ကို ပြသပါ။"
    },
    captureLabel: { ko: "캡처 화면", en: "Screenshot", zh: "截图", vi: "Ảnh chụp màn hình", mn: "Дэлгэцийн зураг", bn: "স্ক্রিনশট", my: "မျက်နှာပြင်ဓာတ်ပုံ" },
    capture: {
      ko: "캡처한 쿠폰 화면도 사용할 수 있습니다.",
      en: "A screenshot of this coupon can also be used.",
      zh: "截图保存的优惠券画面同样可以使用。",
      vi: "Có thể sử dụng ảnh chụp màn hình của phiếu này.",
      mn: "Дэлгэцийн зураг ашиглаж болно.",
      bn: "স্ক্রিনশট নেওয়া কুপনও ব্যবহার করা যাবে।",
      my: "ဖမ်းယူထားသော ကူပွန်ပုံကိုလည်း အသုံးပြုနိုင်ပါသည်။"
    },
    periodLabel: { ko: "사용기간", en: "Valid Until", zh: "使用期限", vi: "Thời hạn sử dụng", mn: "Хугацаа", bn: "ব্যবহারের মেয়াদ", my: "သက်တမ်း" },
    period: {
      ko: "2026년 9월 30일까지",
      en: "Until September 30, 2026",
      zh: "至2026年9月30日",
      vi: "Đến hết ngày 30/9/2026",
      mn: "2026 оны 9-р сарын 30 хүртэл",
      bn: "২০২৬ সালের ৩০ সেপ্টেম্বর পর্যন্ত",
      my: "၂၀၂၆ ခုနှစ် စက်တင်ဘာလ ၃၀ ရက်အထိ"
    },
    notes: {
      ko: ["음식 구매 고객에게만 제공됩니다.", "음식 1개 구매 시 콜라 1캔을 제공합니다.", "매장 사정에 따라 제공 음료가 변경되거나 조기 종료될 수 있습니다."],
      en: ["Available only to customers who purchase food.", "1 can of Coke is provided per 1 food item purchased.", "The provided drink may change or the offer may end early depending on store circumstances."],
      zh: ["仅限购买餐点的顾客使用。", "购买1份餐点可获得可乐1罐。", "根据门店情况，提供的饮品可能变更或提前结束。"],
      vi: ["Chỉ áp dụng cho khách hàng mua món ăn.", "Mua 1 món ăn được tặng 1 lon Coca-Cola.", "Loại nước uống cung cấp có thể thay đổi hoặc chương trình có thể kết thúc sớm tùy tình hình cửa hàng."],
      mn: ["Зөвхөн хоол худалдаж авсан үйлчлүүлэгчид олгоно.", "1 хоол авахад 1 лааз кола өгнө.", "Дэлгүүрийн нөхцөл байдлаас шалтгаалан ундаа солигдох эсвэл эрт дуусч болно."],
      bn: ["শুধুমাত্র খাবার ক্রয়কারী গ্রাহকদের জন্য প্রযোজ্য।", "১টি খাবার কিনলে ১ ক্যান কোকা-কোলা দেওয়া হয়।", "দোকানের পরিস্থিতি অনুযায়ী প্রদত্ত পানীয় পরিবর্তন হতে পারে বা আগেই শেষ হতে পারে।"],
      my: ["အစားအစာဝယ်ယူသောဖောက်သည်များအတွက်သာ ရရှိနိုင်ပါသည်။", "အစားအစာ ၁ ခု ဝယ်ယူပါက ကိုကာကိုလာ ၁ ဘူး ပေးအပ်ပါသည်။", "ဆိုင်၏အခြေအနေပေါ်မူတည်၍ ပေးအပ်သောဖျော်ရည် ပြောင်းလဲနိုင်သည် သို့မဟုတ် စောစီးစွာရပ်နားနိုင်ပါသည်။"]
    },
    showButton: { ko: "직원에게 보여주기", en: "Show to Staff", zh: "出示给工作人员", vi: "Xuất trình cho nhân viên", mn: "Ажилтанд үзүүлэх", bn: "কর্মীকে দেখান", my: "ဝန်ထမ်းအားပြရန်" },
    closeButton: { ko: "닫기", en: "Close", zh: "关闭", vi: "Đóng", mn: "Хаах", bn: "বন্ধ করুন", my: "ပိတ်ရန်" }
  },
  staffShow: {
    title: { ko: "무료 콜라 1캔", en: "1 Free Coke", zh: "免费可乐1罐", vi: "1 lon Coca-Cola miễn phí", mn: "1 лааз үнэгүй кола", bn: "১ ক্যান ফ্রি কোকা-কোলা", my: "အခမဲ့ကိုကာကိုလာ ၁ ဘူး" },
    subtitle: {
      ko: "음식 수령 시 직원에게 보여주세요.",
      en: "Show this to staff when you receive your food.",
      zh: "领取餐点时请出示给工作人员。",
      vi: "Vui lòng xuất trình cho nhân viên khi nhận món ăn.",
      mn: "Хоолоо авахдаа ажилтанд үзүүлнэ үү.",
      bn: "খাবার নেওয়ার সময় কর্মীকে দেখান।",
      my: "အစားအစာလက်ခံသည့်အခါ ဝန်ထမ်းအားပြပါ။"
    },
    storesLabel: { ko: "사용 가능 매장", en: "Available Stores", zh: "可用门店", vi: "Cửa hàng áp dụng", mn: "Ашиглах газар", bn: "ব্যবহারযোগ্য দোকান", my: "အသုံးပြုနိုင်သောဆိုင်များ" },
    storesValue: "만권화밥 · 후루룩찹찹",
    period: { ko: "2026. 9. 30.까지", en: "Until 2026. 9. 30.", zh: "至2026.9.30.", vi: "Đến 30.9.2026", mn: "2026.9.30 хүртэл", bn: "২০২৬. ৯. ৩০. পর্যন্ত", my: "၂၀၂၆.၉.၃၀ အထိ" }
  }
};

/* 사장님께 말해요 (하단 안내칸 + 모바일 고정 버튼, 카카오톡 오픈채팅 연결) */
const OWNER_CHAT = {
  url: "https://open.kakao.com/o/sxJlUwMi",
  title: { ko: "사장님께 말해요", en: "Talk to the Owner", zh: "告诉店主", vi: "Nhắn với chủ quán", mn: "Эзэнд нь хэлэх", bn: "মালিকের সাথে কথা বলুন", my: "ပိုင်ရှင်ကိုပြောပါ" },
  desc: {
    ko: ["메뉴 제안, 칭찬, 불편사항을 편하게 알려주세요.", "작성한 내용은 홈페이지에 공개되거나 저장되지 않습니다."],
    en: ["Share your menu suggestions, compliments, or concerns with us.", "Your message will not be posted or stored on this website."],
    zh: ["欢迎通过KakaoTalk告诉我们您的菜单建议、意见或遇到的问题。", "您的留言不会在本网站公开或保存。"],
    vi: ["Hãy chia sẻ đề xuất món ăn, lời khen hoặc điều bất tiện với chúng tôi.", "Nội dung của bạn sẽ không được đăng hoặc lưu trên trang web này."],
    mn: ["Цэсийн санал, магтаал, эсвэл тав тухгүй зүйлээ чөлөөтэй мэдэгдээрэй.", "Таны бичсэн зүйл вэбсайтад нийтлэгдэхгүй, хадгалагдахгүй."],
    bn: ["মেনুর পরামর্শ, প্রশংসা বা অসুবিধা নির্দ্বিধায় জানান।", "আপনার লেখা বিষয়বস্তু ওয়েবসাইটে প্রকাশ বা সংরক্ষণ করা হয় না।"],
    my: ["မီနူးအကြံပြုချက်၊ ချီးမွမ်းစကား၊ မကျေနပ်ချက်များကို လွတ်လပ်စွာ ပြောပြပါ။", "သင်ရေးသားသောအကြောင်းအရာသည် ဝဘ်ဆိုက်တွင် ထုတ်ဖော်ခြင်း သို့မဟုတ် သိမ်းဆည်းခြင်း မပြုပါ။"]
  },
  button: { ko: "카카오톡으로 말하기", en: "Chat on KakaoTalk", zh: "通过KakaoTalk联系", vi: "Trò chuyện qua KakaoTalk", mn: "KakaoTalk-аар холбогдох", bn: "কাকাওটক-এ কথা বলুন", my: "KakaoTalk ဖြင့်ပြောရန်" }
};
