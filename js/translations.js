/* ==========================================================================
   공통 UI 문구 번역 (매장명, 버튼, 안내문, 오류문)
   ========================================================================== */

const UI_TEXT = {
  siteTitle: {
    ko: "모인관(인제대학교)",
    en: "Moin-gwan (Inje University)",
    zh: "摩茵馆(仁济大学)",
    vi: "Moin-gwan (Đại học Inje)",
    mn: "Моин-гван (Inje их сургууль)",
    bn: "মোইন-গোয়ান (ইনজে বিশ্ববিদ্যালয়)",
    my: "မိုအင်ဂွမ် (အင်ဂျေတက္ကသိုလ်)"
  },
  // LEGO 홈 디자인의 헤더 태그라인(장식용 3단어 — 기존 siteTitle을
  // 대체하지 않고 그 아래 보조 문구로만 추가).
  siteTagline: {
    ko: "먹고 · 놀고 · 연결하기",
    en: "EAT · PLAY · CONNECT",
    zh: "吃饭 · 玩耍 · 连接",
    vi: "Ăn · Chơi · Kết nối",
    mn: "Идэх · Тоглох · Холбогдох",
    bn: "খাও · খেলো · সংযুক্ত হও",
    my: "စားပါ · ကစားပါ · ချိတ်ဆက်ပါ"
  },
  storeNames: {
    bapsim: {
      brand: "밥심",
      floor: { ko: "1층", en: "1st Floor", zh: "1楼", vi: "Tầng 1", mn: "1-р давхар", bn: "১ম তলা", my: "ပထမထပ်" },
      pronunciation: { en: "Bap-sim", zh: "巴普心", vi: "Báp-sim", mn: "Бап-сим", bn: "বাপ-সিম", my: "ဘတ်ပ်-ဆင်မ်" }
    },
    mangwon: {
      brand: "만권화밥",
      floor: { ko: "1층", en: "1st Floor", zh: "1楼", vi: "Tầng 1", mn: "1-р давхар", bn: "১ম তলা", my: "ပထမထပ်" },
      pronunciation: { en: "Man-gwon-hwa-bap", zh: "曼关花巴普", vi: "Man-guôn-hoa-báp", mn: "Ман-гвон-хва-бап", bn: "মান-গোয়ান-হোয়া-বাপ", my: "မန်-ဂွမ်-ဟွာ-ဘတ်ပ်" }
    },
    hururuk: {
      brand: "후루룩찹찹",
      floor: { ko: "2층", en: "2nd Floor", zh: "2楼", vi: "Tầng 2", mn: "2-р давхар", bn: "২য় তলা", my: "ဒုတိယထပ်" },
      pronunciation: { en: "Hu-ru-ruk-chap-chap", zh: "呼噜噜恰普恰普", vi: "Hu-ru-rúc-cháp-cháp", mn: "Ху-ру-рук-чап-чап", bn: "হু-রু-রুক-চাপ-চাপ", my: "ဟူ-ရူ-ရွတ်-ချပ်-ချပ်" }
    }
  },
  storeHeading: {
    bapsim: { ko: "밥심1층", en: "밥심 1F", zh: "밥심 1楼", vi: "밥심, tầng 1", mn: "밥심, 1-р давхар", bn: "밥심, ১ম তলা", my: "밥심, ပထမထပ်" },
    mangwon: { ko: "만권화밥1층", en: "만권화밥 1F", zh: "만권화밥 1楼", vi: "만권화밥, tầng 1", mn: "만권화밥, 1-р давхар", bn: "만권화밥, ১ম তলা", my: "만권화밥, ပထမထပ်" },
    hururuk: { ko: "후루룩찹찹 2층", en: "후루룩찹찹 2F", zh: "후루룩찹찹 2楼", vi: "후루룩찹찹, tầng 2", mn: "후루룩찹찹, 2-р давхар", bn: "후루룩찹찹, ২য় তলা", my: "후루룩찹찹, ဒုတိယထပ်" }
  },
  langLabel: { ko: "언어 선택", en: "Language", zh: "语言", vi: "Ngôn ngữ", mn: "Хэл сонгох", bn: "ভাষা নির্বাচন", my: "ဘာသာစကားရွေးချယ်ရန်" },
  langNames: {
    ko: "한국어", en: "English", zh: "中文", vi: "Tiếng Việt", mn: "Монгол", bn: "বাংলা", my: "မြန်မာ"
  },
  prevButton: { ko: "이전", en: "Previous", zh: "上一页", vi: "Trước", mn: "Өмнөх", bn: "পূর্ববর্তী", my: "နောက်သို့" },
  nextButton: { ko: "다음", en: "Next", zh: "下一页", vi: "Tiếp theo", mn: "Дараах", bn: "পরবর্তী", my: "ရှေ့သို့" },
  soldOut: { ko: "품절", en: "SOLD OUT", zh: "已售罄", vi: "Hết hàng", mn: "Дууссан", bn: "শেষ হয়ে গেছে", my: "ကုန်သွားပါပြီ" },
  closeButton: { ko: "닫기", en: "Close", zh: "关闭", vi: "Đóng", mn: "Хаах", bn: "বন্ধ করুন", my: "ပိတ်ရန်" },
  imagePending: { ko: "이미지 준비 중", en: "Image coming soon", zh: "图片准备中", vi: "Hình ảnh đang chuẩn bị", mn: "Зураг бэлтгэж байна", bn: "ছবি প্রস্তুত করা হচ্ছে", my: "ပုံပြင်ဆင်နေပါသည်" },
  priceTBD: { ko: "가격 확인 필요", en: "Price to be confirmed", zh: "价格待确认", vi: "Giá đang xác nhận", mn: "Үнийг баталгаажуулах шаардлагатай", bn: "মূল্য নিশ্চিত করা প্রয়োজন", my: "ဈေးနှုန်းအတည်ပြုရန်လိုအပ်သည်" },
  won: { ko: "원", en: "won", zh: "韩元", vi: "won", mn: " вон", bn: " ওন", my: " ဝမ်" },
  loadError: {
    ko: "메뉴를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    en: "There was a problem loading the menu. Please try again shortly.",
    zh: "加载菜单时出现问题，请稍后重试。",
    vi: "Đã xảy ra sự cố khi tải menu. Vui lòng thử lại sau.",
    mn: "Цэсийг ачаалахад алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.",
    bn: "মেনু লোড করার সময় সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    my: "မီနူးဖွင့်ရာတွင် ပြဿနာရှိပါသည်။ အနည်းငယ်စောင့်ပြီး ထပ်မံကြိုးစားပါ။"
  },
  infoTitle: { ko: "이용 안내", en: "Information", zh: "使用指南", vi: "Thông tin", mn: "Мэдээлэл", bn: "তথ্য", my: "အချက်အလက်" },
  stepsTitle: { ko: "이용방법", en: "How to Order", zh: "使用方法", vi: "Cách sử dụng", mn: "Хэрхэн ашиглах", bn: "ব্যবহারের পদ্ধতি", my: "အသုံးပြုနည်း" },

  /* ---------------- 모바일 UI 개선 4단계: 홈 화면 ---------------- */
  homeHeroTagline: {
    ko: "다양한 사람들이 함께하는 캠퍼스",
    en: "A campus where diverse people come together",
    zh: "汇聚多元人群的校园",
    vi: "Ngôi trường nơi mọi người cùng hòa nhập",
    mn: "Олон төрлийн хүмүүс хамтдаа байдаг кампус",
    bn: "বিভিন্ন মানুষ একসাথে থাকা ক্যাম্পাস",
    my: "မတူညီသောလူများ အတူတကွနေထိုင်ကြသော ကျောင်းဝင်း"
  },
  homeServicesTitle: { ko: "핵심 서비스", en: "Core Services", zh: "核心服务", vi: "Dịch vụ chính", mn: "Үндсэн үйлчилгээ", bn: "মূল পরিষেবা", my: "အဓိကဝန်ဆောင်မှုများ" },
  homeCommunityLatestTitle: { ko: "커뮤니티 최신 글", en: "Latest Community Posts", zh: "社区最新帖子", vi: "Bài viết cộng đồng mới nhất", mn: "Нийгэмлэгийн сүүлийн үеийн нийтлэл", bn: "কমিউনিটির সাম্প্রতিক পোস্ট", my: "အသိုင်းအဝိုင်း နောက်ဆုံးပို့စ်များ" },
  // 홈 MZ LEGO 보드(리뉴얼 1단계) EVENT 블록의 제목 문구 — 새 이벤트
  // CMS 없이 기존 팝업(js/site-popup.js)을 다시 열어 보여주는 진입점입니다.
  homeEventLabel: { ko: "새로운 소식", en: "Latest News", zh: "最新消息", vi: "Tin tức mới", mn: "Сүүлийн үеийн мэдээ", bn: "সর্বশেষ খবর", my: "နောက်ဆုံးရသတင်း" },
  // 홈 메인 히어로 영역(EVENT/NOTICE/SURVEY 미리보기)의 CTA 버튼 문구 —
  // 팝업 종류와 무관하게 쓰는 범용 라벨(새 필드 없이 기존 sitePopups
  // title/linkUrl만 재사용).
  homeHeroCta: { ko: "자세히 보기", en: "View details", zh: "查看详情", vi: "Xem chi tiết", mn: "Дэлгэрэнгүй үзэх", bn: "বিস্তারিত দেখুন", my: "အသေးစိတ်ကြည့်ရန်" },
  // 홈 히어로의 신메뉴 홍보 — "고추장버터 화산불백"은 브랜드/고유 메뉴명
  // 취급이라 언어와 무관하게 항상 한국어 원문 그대로 표시합니다(번역
  // 대상 아님 — js/app.js의 HERO_MENU_PROMO.titleSub/titleMain에 고정
  // 문자열로 둡니다). eyebrow와 메뉴 설명 한 줄만 7개 언어로 표시.
  homeHeroMenuLabel: { ko: "신메뉴", en: "NEW MENU", zh: "新菜品", vi: "Món mới", mn: "Шинэ хоол", bn: "নতুন মেনু", my: "မီနူးအသစ်" },
  // 외국인 학생에게 메뉴 의미를 설명하는 한 줄(메뉴명 자체가 아님).
  homeHeroMenuDesc: {
    ko: "매콤한 고추장 버터 돼지불백",
    en: "Gochujang Butter Volcano Pork",
    zh: "韩式辣酱黄油火山烤猪肉",
    vi: "Thịt heo núi lửa bơ Gochujang",
    mn: "Гочүжан цөцгийн тостой галт уулын гахайн мах",
    bn: "গোচুজাং বাটার ভলকানো পর্ক",
    my: "Gochujang Butter Volcano Pork"
  },
  // 세부페이지 디자인 통일(비용 최소화) — 헤더의 "← HOME" 링크 라벨.
  detailHomeLink: { ko: "홈", en: "HOME", zh: "首页", vi: "Trang chủ", mn: "Нүүр", bn: "হোম", my: "ပင်မစာမျက်နှာ" },
  homeCommunityLatestEmpty: { ko: "아직 등록된 글이 없습니다.", en: "No posts yet.", zh: "还没有帖子。", vi: "Chưa có bài viết nào.", mn: "Одоогоор нийтлэл алга.", bn: "এখনও কোনো পোস্ট নেই।", my: "ပို့စ်မရှိသေးပါ။" },
  // 홈 화면 프리미엄 에디토리얼 리디자인 — 메인 카피(사진 없이 타이포그래피
  // 중심). 줄바꿈은 \n으로 표시하고 렌더링 시 <br>로 바꿉니다.
  homeHeadline: {
    ko: "오늘,\n인제대에서\n무엇을 찾으세요?",
    en: "What are you\nlooking for at\nInje today?",
    zh: "今天，\n在仁济大学\n您在找什么？",
    vi: "Hôm nay,\nbạn đang tìm gì\ntại Inje?",
    mn: "Өнөөдөр\nInje-д юу\nхайж байна?",
    bn: "আজ, ইনজেতে\nআপনি কী\nখুঁজছেন?",
    my: "ဒီနေ့ Inje\nတက္ကသိုလ်မှာ\nဘာရှာနေပါသလဲ?"
  },
  // 각 카드 하단의 짧은 한 줄 설명(작은 영문 카테고리는 번역하지 않고
  // 고정 표기 — 카드 마크업에 직접 적음). 브랜드명 카드(밥심/후루룩찹찹/
  // 만권화밥)는 기존 정책대로 부제 없이 "메뉴 보기"만 공용으로 씁니다.
  homeCardSubtitle: {
    breakfast: { ko: "오늘의 메뉴 확인하기", en: "See today's menu", zh: "查看今日菜单", vi: "Xem thực đơn hôm nay", mn: "Өнөөдрийн цэсийг харах", bn: "আজকের মেনু দেখুন", my: "ယနေ့မီနူးကြည့်ရန်" },
    menuView: { ko: "메뉴 보기", en: "View menu", zh: "查看菜单", vi: "Xem thực đơn", mn: "Цэс харах", bn: "মেনু দেখুন", my: "မီနူးကြည့်ရန်" },
    koreanFood: { ko: "한국요리", en: "Korean Cuisine", zh: "韩国料理", vi: "Ẩm thực Hàn Quốc", mn: "Солонгос хоол", bn: "কোরিয়ান খাবার", my: "ကိုရီးယားအစားအစာ" },
    buffetStyle: { ko: "뷔페 스타일", en: "Buffet style", zh: "自助餐式", vi: "Kiểu buffet", mn: "Буфет маягийн", bn: "বুফে স্টাইল", my: "ဗူဖေးပုံစံ" },
    // "방 구하기" 보조문구 — 외국인 유학생이 서비스 목적을 바로 이해하도록
    // 각 언어권 대학생이 실제로 쓰는 표현으로 다듬음(단순 직역 아님).
    housing: { ko: "원룸 · 자취방 문의", en: "Room & Studio Inquiry", zh: "单间 · 租房咨询", vi: "Tư vấn phòng trọ", mn: "Өрөөний талаар лавлах", bn: "রুম সম্পর্কে জিজ্ঞাসা", my: "အခန်းအကြောင်း စုံစမ်းရန်" },
    hometown: { ko: "게시판 바로가기", en: "Go to the board", zh: "前往板块", vi: "Đến bảng tin", mn: "Хэсэг рүү очих", bn: "বোর্ডে যান", my: "ဘုတ်သို့သွားရန်" },
    campusLife: { ko: "이야기 나누기", en: "Share your story", zh: "分享故事", vi: "Chia sẻ câu chuyện", mn: "Түүхээ хуваалцах", bn: "গল্প শেয়ার করুন", my: "ဇာတ်လမ်းမျှဝေရန်" },
    friends: { ko: "함께 이야기해요", en: "Let's talk together", zh: "一起聊聊吧", vi: "Cùng trò chuyện nhé", mn: "Хамтдаа ярилцъя", bn: "একসাথে কথা বলি", my: "အတူတကွစကားပြောကြရအောင်" },
    feedback: { ko: "의견 남기기", en: "Leave feedback", zh: "留下意见", vi: "Để lại ý kiến", mn: "Санал үлдээх", bn: "মতামত দিন", my: "အကြံပြုချက်ပေးရန်" },
    // "주말에 가볼 만한 곳" HOME 카드 보조문구(2026-09 지시서) — 커뮤니티
    // together 카테고리와 같은 목적지를 가리키므로 지역명만 짧게 표기.
    weekend: { ko: "김해 · 부산 둘러보기", en: "Explore Gimhae & Busan", zh: "游览金海 · 釜山", vi: "Khám phá Gimhae · Busan", mn: "Гимхэ · Бусан хотыг үзэх", bn: "গিমহে · বুসান ঘুরে দেখুন", my: "ဂျင်ဟေး · ပူဆန် ကို လေ့လာလည်ပတ်ပါ" }
  },
  bottomNavHome: { ko: "홈", en: "Home", zh: "首页", vi: "Trang chủ", mn: "Нүүр", bn: "হোম", my: "ပင်မစာမျက်နှာ" },
  /* 모바일 UI 개선 8단계: 하단 내비게이션 5개(홈/검색/글쓰기/알림/MY) —
     글쓰기는 기존 COMMUNITY_POST.writeTitle을 그대로 재사용합니다. */
  bottomNavSearch: { ko: "검색", en: "Search", zh: "搜索", vi: "Tìm kiếm", mn: "Хайх", bn: "অনুসন্ধান", my: "ရှာဖွေရန်" },
  bottomNavNotify: { ko: "알림", en: "Alerts", zh: "通知", vi: "Thông báo", mn: "Мэдэгдэл", bn: "বিজ্ঞপ্তি", my: "အကြောင်းကြားချက်" },
  bottomNavNotifyComingSoon: {
    ko: "알림 기능은 준비 중입니다.",
    en: "Notifications are coming soon.",
    zh: "通知功能正在准备中。",
    vi: "Tính năng thông báo đang được chuẩn bị.",
    mn: "Мэдэгдэл функц бэлтгэгдэж байна.",
    bn: "বিজ্ঞপ্তি বৈশিষ্ট্যটি প্রস্তুত করা হচ্ছে।",
    my: "အကြောင်းကြားချက်လုပ်ဆောင်ချက်ကို ပြင်ဆင်နေပါသည်။"
  }
};

/* ==========================================================================
   천원의 아침밥 — 오늘의 메뉴 평가 문구 (학생용, 선택된 언어를 그대로 사용)
   ========================================================================== */

const BREAKFAST_RATING_TEXT = {
  title: {
    ko: "오늘 아침밥 어떠셨나요?",
    en: "How was today’s breakfast?",
    zh: "今天的早餐怎么样？",
    vi: "Bữa sáng hôm nay thế nào?",
    mn: "Өнөөдрийн өглөөний хоол ямар байсан бэ?",
    bn: "আজকের সকালের খাবার কেমন ছিল?",
    my: "ယနေ့ နံနက်စာ ဘယ်လိုနေလဲ?"
  },
  score5: { ko: "아주 좋아요", en: "Loved it", zh: "非常好", vi: "Rất thích", mn: "Маш их таалагдсан", bn: "খুব ভালো লেগেছে", my: "အရမ်းကြိုက်တယ်" },
  score4: { ko: "좋아요", en: "Good", zh: "好", vi: "Thích", mn: "Таалагдсан", bn: "ভালো লেগেছে", my: "ကြိုက်တယ်" },
  score3: { ko: "보통이에요", en: "Okay", zh: "一般", vi: "Bình thường", mn: "Дунд зэрэг", bn: "মোটামুটি", my: "ရိုးရိုး" },
  score2: { ko: "아쉬워요", en: "Not great", zh: "有点遗憾", vi: "Chưa hài lòng", mn: "Дутагдалтай", bn: "কিছুটা খারাপ", my: "သိပ်မကောင်းဘူး" },
  score1: { ko: "별로예요", en: "Not good", zh: "不满意", vi: "Không thích", mn: "Таалагдаагүй", bn: "ভালো লাগেনি", my: "မကြိုက်ဘူး" },
  thanks: { ko: "감사합니다!", en: "Thank you!", zh: "谢谢！", vi: "Cảm ơn bạn!", mn: "Баярлалаа!", bn: "ধন্যবাদ!", my: "ကျေးဇူးတင်ပါတယ်!" },
  completed: {
    ko: "오늘 평가를 완료했습니다.",
    en: "You’ve already rated today’s breakfast.",
    zh: "您今天已完成评价。",
    vi: "Bạn đã đánh giá hôm nay rồi.",
    mn: "Та өнөөдөр үнэлгээгээ өгсөн байна.",
    bn: "আপনি আজকের মূল্যায়ন সম্পন্ন করেছেন।",
    my: "သင်ယနေ့အကဲဖြတ်ပြီးပါပြီ။"
  },
  error: {
    ko: "저장에 실패했습니다. 다시 시도해주세요.",
    en: "Failed to save. Please try again.",
    zh: "保存失败，请重试。",
    vi: "Lưu không thành công. Vui lòng thử lại.",
    mn: "Хадгалахад алдаа гарлаа. Дахин оролдоно уу.",
    bn: "সংরক্ষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
    my: "သိမ်းဆည်းမှုမအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။"
  },
  /* 평가 UI 수정 단계: 팝업 X 닫기 버튼의 접근성 라벨(aria-label) */
  close: { ko: "닫기", en: "Close", zh: "关闭", vi: "Đóng", mn: "Хаах", bn: "বন্ধ করুন", my: "ပိတ်ရန်" }
};

/* ==========================================================================
   한국어 학습 사이트(hellokorean.site) 연결 카드 문구
   - 홈 화면 언어 선택에 따라 자동으로 바뀝니다(js/app.js의 renderHelloKorean).
   - 주소 표시는 5개 언어 모두 동일하게 "hellokorean.site"만 씁니다.
   ========================================================================== */
const HELLOKOREAN_INFO = {
  url: "https://hellokorean.site/?utm_source=babsim.store&utm_medium=website&utm_campaign=korean_learning",
  urlDisplay: "hellokorean.site",
  title: {
    ko: "무료 한국어 공부",
    zh: "免费学习韩语",
    vi: "Học tiếng Hàn miễn phí",
    en: "Learn Korean for Free",
    mn: "Солонгос хэл үнэгүй сурах",
    bn: "বিনামূল্যে কোরিয়ান ভাষা শিখুন",
    my: "ကိုရီးယားစာကို အခမဲ့သင်ယူပါ"
  },
  desc: {
    ko: "한국어를 쉽고 재미있게 배워보세요",
    zh: "轻松有趣地学习韩语",
    vi: "Học tiếng Hàn dễ dàng và thú vị",
    en: "Learn Korean easily and enjoyably",
    mn: "Солонгос хэлийг хялбар, сонирхолтой сураарай",
    bn: "সহজে ও আনন্দের সাথে কোরিয়ান ভাষা শিখুন",
    my: "ကိုရီးယားစာကို လွယ်ကူပျော်ရွှင်စွာ သင်ယူပါ"
  },
  button: {
    ko: "무료로 시작하기",
    zh: "免费开始",
    vi: "Bắt đầu miễn phí",
    en: "Start for Free",
    mn: "Үнэгүй эхлэх",
    bn: "বিনামূল্যে শুরু করুন",
    my: "အခမဲ့စတင်ရန်"
  }
};

/* ==========================================================================
   「나의 고향 이야기」 참여 이벤트 홈 팝업 문구 (js/hometown-popup.js)
   - 밥심커뮤니티 「나의 고향 소개」 글쓰기 참여를 유도하는 첫 방문 팝업.
   ========================================================================== */
const HOMETOWN_POPUP = {
  title: {
    ko: "여러분의 고향 이야기를 들려주세요!",
    en: "Tell us about your hometown!",
    zh: "给我们讲讲你的家乡故事吧！",
    vi: "Hãy kể cho chúng tôi nghe về quê hương của bạn!",
    mn: "Төрсөн нутгийнхаа тухай ярьж өгөөч!",
    bn: "আপনার নিজ শহরের গল্প আমাদের বলুন!",
    my: "မင်းရဲ့ ဇာတိမြို့အကြောင်း ပြောပြပါ!"
  },
  body1: {
    ko: "고향의 음식, 명소, 문화, 축제 등 친구들에게 소개하고 싶은 이야기를 밥심커뮤니티 「나의 고향소개」에 올려주세요.",
    en: "Share stories about your hometown's food, landmarks, culture, festivals, and more with friends — post them in Babsim Community's 「My Hometown」 section.",
    zh: "把家乡的美食、名胜、文化、节日等想要介绍给朋友的故事，发布到饭心社区的《我的家乡介绍》吧。",
    vi: "Hãy chia sẻ những câu chuyện về ẩm thực, danh lam thắng cảnh, văn hóa, lễ hội... của quê hương bạn mà bạn muốn giới thiệu cho bạn bè, tại mục 「Giới thiệu quê hương tôi」 của Cộng đồng Babsim.",
    mn: "Төрсөн нутгийнхаа хоол, үзмэр газар, соёл, баяр наадам зэргийг найзууддаа танилцуулахыг хүсвэл Babsim Community-ийн 「Төрсөн нутгийн танилцуулга」 хэсэгт нийтэлнэ үү.",
    bn: "নিজ শহরের খাবার, দর্শনীয় স্থান, সংস্কৃতি, উৎসব ইত্যাদি বন্ধুদের কাছে পরিচয় করিয়ে দিতে চাইলে Babsim Community-র 「আমার নিজ শহরের পরিচিতি」-তে পোস্ট করুন।",
    my: "ဇာတိမြို့ရဲ့ အစားအစာ၊ ကျော်ကြားတဲ့နေရာများ၊ ယဉ်ကျေးမှု၊ ပွဲတော်များကို သူငယ်ချင်းတွေကို မိတ်ဆက်ချင်ရင် Babsim Community ရဲ့ 「ကျွန်ုပ်၏ဇာတိမြို့ မိတ်ဆက်」မှာ တင်ပါ။"
  },
  body2: {
    ko: "한국어가 아니어도 괜찮아요! 본인의 언어로 작성해도 됩니다.",
    en: "It's okay if it's not in Korean! You can write in your own language.",
    zh: "不是韩语也没关系！你可以用自己的语言写。",
    vi: "Không viết bằng tiếng Hàn cũng không sao! Bạn có thể viết bằng ngôn ngữ của mình.",
    mn: "Солонгос хэлээр биш байсан ч зүгээр! Өөрийн хэлээр бичиж болно.",
    bn: "কোরিয়ান ভাষায় না হলেও চলবে! নিজের ভাষায় লিখলেও হবে।",
    my: "ကိုရီးယားလိုမဟုတ်လည်း ရပါတယ်! ကိုယ့်ဘာသာစကားနဲ့ ရေးလို့ရပါတယ်။"
  },
  reward: {
    ko: "게시글을 작성해 주신 분께 천원의 아침밥 1,000원 무료쿠폰을 드립니다.",
    en: "Everyone who writes a post gets a free 1,000 won breakfast coupon.",
    zh: "发布帖子的朋友将获得价值1000韩元的早餐免费券。",
    vi: "Những bạn đăng bài sẽ nhận được phiếu ưu đãi miễn phí 1.000 won cho bữa sáng.",
    mn: "Нийтлэл бичсэн хүн бүрт 1,000 воны өглөөний хоолны үнэгүй купон өгнө.",
    bn: "যারা পোস্ট লিখবেন তাদের ১,০০০ ওনের সকালের নাশতার ফ্রি কুপন দেওয়া হবে।",
    my: "ပို့စ်တင်သူတိုင်းကို ဝမ် ၁,၀၀၀ တန်ဖိုးရှိ နံနက်စာအခမဲ့ကူပွန် ပေးပါမည်။"
  },
  button: {
    ko: "메뉴 확인",
    en: "See Menu",
    zh: "查看菜单",
    vi: "Xem thực đơn",
    mn: "Цэс харах",
    bn: "মেনু দেখুন",
    my: "မီနူးကြည့်ရန်"
  },
  dismissToday: {
    ko: "오늘 하루 보지 않기",
    en: "Don't show again today",
    zh: "今日不再显示",
    vi: "Không hiển thị lại hôm nay",
    mn: "Өнөөдөр дахин бүү харуул",
    bn: "আজকের জন্য আর দেখাবেন না",
    my: "ယနေ့အတွက် ထပ်မပြပါနှင့်"
  },
  closeAriaLabel: {
    ko: "닫기", en: "Close", zh: "关闭", vi: "Đóng", mn: "Хаах", bn: "বন্ধ করুন", my: "ပိတ်ရန်"
  },
  // 신메뉴(새우완탕쌀국수) 팝업 홍보문구 — 지시서 7번대로 메뉴명(고유명사)과
  // 가격(5,500원)은 모든 언어에서 원문 그대로 고정하고, 이 짧은 설명
  // 한 줄만 언어별로 자연스럽게 번역합니다.
  newMenuTagline: {
    ko: "가성비 한 그릇", en: "Great value in every bowl", zh: "高性价比的一碗",
    vi: "Một tô đầy giá trị", mn: "Хямд бөгөөд амттай", bn: "সাশ্রয়ী মূল্যের একটি বাটি",
    my: "တန်ဖိုးရှိတဲ့ အုန်းတစ်ခွက်"
  },
  // "10월 5일 2층 후루룩찹찹 영업" 공지(2026-10-04 지시) — 브랜드명
  // "후루룩찹찹"은 다른 매장명과 같은 관례로 모든 언어에서 원문(한국어)
  // 그대로 고정하고, 날짜·층수·영업 안내만 언어별로 자연스럽게 번역합니다.
  noticeTitle: {
    ko: "10월 5일, 후루룩찹찹 2층 영업합니다",
    en: "Open Oct 5 — 후루룩찹찹, 2nd Floor",
    zh: "10月5日，후루룩찹찹 2楼营业",
    vi: "Mở cửa ngày 5/10 — 후루룩찹찹, Tầng 2",
    mn: "10 сарын 5-нд 후루룩찹찹, 2-р давхар ажиллана",
    bn: "১০ই অক্টোবর, 후루룩찹찹 ২য় তলা খোলা থাকবে",
    my: "အောက်တိုဘာ ၅ရက်၊ 후루룩찹찹 ဒုတိယထပ် ဖွင့်ပါမည်"
  }
};

/* ==========================================================================
   방 구하기 (js/room-finder.js)
   - 작업지시서 범위대로 4개 언어(한국어·English·Tiếng Việt·中文)만 지원.
   - langButton은 언어 선택 화면의 버튼 4개 라벨(항상 그 언어 그대로 표시,
     선택된 언어에 따라 바뀌지 않음)이라 이 객체가 아니라 js/room-finder.js
     안에 고정 목록으로 둡니다.
   - 입력항목은 정확히 3개(이름/전화번호/입주예정일)만 사용합니다(희망
     지역/예산/보증금/월세 문구는 삭제).
   ========================================================================== */
const ROOM_FINDER = {
  langStepTitle: { ko: "방 구하기", en: "Find a Room", vi: "Tìm phòng", zh: "找房", mn: "Өрөө хайх", bn: "বাসা খোঁজা", my: "အခန်းရှာခြင်း" },
  langStepDesc: {
    ko: "언어를 선택해주세요", en: "Please select a language",
    vi: "Vui lòng chọn ngôn ngữ", zh: "请选择语言",
    mn: "Хэлээ сонгоно уу", bn: "ভাষা নির্বাচন করুন", my: "ဘာသာစကား ရွေးချယ်ပါ"
  },
  // title은 홈 화면 카드 제목(#homeLegoRoomTitle)에도 쓰입니다. 외국인
  // 유학생이 바로 이해하는 생활 표현으로 7개 언어를 다듬었습니다.
  title: { ko: "방 구하기", en: "Find a Room", vi: "Tìm phòng trọ", zh: "找房子", mn: "Өрөө хайх", bn: "বাসা খুঁজুন", my: "အခန်းရှာရန်" },
  // 2026-09 "관리자 저장" 지시서 — 입력항목을 8개(지역/입주희망일/입주인원/
  // 보증금/월세/이름/전화번호/국적)로 확정. field_name/field_phone/
  // field_moveInDate는 기존 키를 그대로 재사용(값만 mn/bn/my 보강).
  field_name: { ko: "이름", en: "Name", vi: "Họ và tên", zh: "姓名", mn: "Нэр", bn: "নাম", my: "အမည်" },
  field_phone: { ko: "전화번호", en: "Phone Number", vi: "Số điện thoại", zh: "电话号码", mn: "Утасны дугаар", bn: "ফোন নম্বর", my: "ဖုန်းနံပါတ်" },
  field_moveInDate: { ko: "입주 희망일", en: "Preferred Move-in Date", vi: "Ngày dự kiến chuyển vào", zh: "预计入住日期", mn: "Орох хүсэлт гаргасан огноо", bn: "প্রবেশের প্রত্যাশিত তারিখ", my: "အခန်းဝင်ရန် မျှော်မှန်းရက်" },
  field_region: { ko: "희망 지역", en: "Preferred Area", vi: "Khu vực mong muốn", zh: "意向地区", mn: "Хүссэн бүс нутаг", bn: "পছন্দের এলাকা", my: "နှစ်သက်သောဒေသ" },
  field_occupants: { ko: "입주 인원", en: "Number of Occupants", vi: "Số người ở", zh: "入住人数", mn: "Оршин суух хүний тоо", bn: "বসবাসকারীর সংখ্যা", my: "နေထိုင်မည့်လူဦးရေ" },
  field_deposit: { ko: "희망 보증금 (만원)", en: "Desired Deposit (10,000 KRW)", vi: "Tiền đặt cọc mong muốn (vạn KRW)", zh: "意向押金（万韩元）", mn: "Хүссэн барьцаа (10,000 вон)", bn: "পছন্দের জামানত (১০,০০০ ওন)", my: "လိုချင်သောအာမခံငွေ (၁၀,၀၀၀ ဝမ်)" },
  field_rent: { ko: "희망 월세 (만원/월)", en: "Desired Monthly Rent (10,000 KRW/mo)", vi: "Tiền thuê hàng tháng mong muốn (vạn KRW/tháng)", zh: "意向月租（万韩元/月）", mn: "Хүссэн сарын түрээс (10,000 вон/сар)", bn: "পছন্দের মাসিক ভাড়া (১০,০০০ ওন/মাস)", my: "လိုချင်သောလစဉ်အိမ်ငှားခ (၁၀,၀၀၀ ဝမ်/လ)" },
  // 희망 지역 선택지 — 내부 저장값(injeUniv/gimhae/busan/etc)과 화면
  // 표시문구를 분리(비용 최소화 지시서 16번).
  regionOptions: {
    injeUniv: { ko: "인제대학교 근처", en: "Near Inje University", vi: "Gần Đại học Inje", zh: "仁济大学附近", mn: "Инже их сургуулийн ойролцоо", bn: "ইনজে বিশ্ববিদ্যালয়ের কাছাকাছি", my: "အင်ဂျီတက္ကသိုလ်အနီး" },
    gimhae: { ko: "김해", en: "Gimhae", vi: "Gimhae", zh: "金海", mn: "Гимхэ", bn: "গিমহে", my: "ဂျင်ဟေး" },
    busan: { ko: "부산", en: "Busan", vi: "Busan", zh: "釜山", mn: "Бусан", bn: "বুসান", my: "ပူဆန်" },
    etc: { ko: "기타", en: "Other", vi: "Khác", zh: "其他", mn: "Бусад", bn: "অন্যান্য", my: "အခြား" }
  },
  // 입주 인원 선택지 — 저장값은 "1"/"2"(문자열)만 씁니다.
  occupantOptions: {
    "1": { ko: "1명", en: "1 person", vi: "1 người", zh: "1人", mn: "1 хүн", bn: "১ জন", my: "၁ ဦး" },
    "2": { ko: "2명", en: "2 people", vi: "2 người", zh: "2人", mn: "2 хүн", bn: "২ জন", my: "၂ ဦး" }
  },
  submitButton: { ko: "이 조건으로 방 문의하기 →", en: "Send Inquiry with These Details →", vi: "Gửi yêu cầu theo điều kiện này →", zh: "以此条件提交咨询 →", mn: "Энэ нөхцлөөр асуулт илгээх →", bn: "এই শর্তে অনুসন্ধান পাঠান →", my: "ဤအခြေအနေဖြင့် စုံစမ်းမေးမြန်းပါ →" },
  privacy: {
    ko: "입력한 문의 내용은 상담을 위해 관리자에게 전달됩니다.",
    en: "Your inquiry information will be sent to the administrator for consultation.",
    vi: "Thông tin yêu cầu của bạn sẽ được gửi đến quản trị viên để tư vấn.",
    zh: "您填写的咨询内容将发送给管理员以便咨询。",
    mn: "Оруулсан лавлагааны мэдээллийг зөвлөгөө өгөхийн тулд админд илгээнэ.",
    bn: "আপনার প্রদত্ত অনুসন্ধানের তথ্য পরামর্শের জন্য প্রশাসকের কাছে পাঠানো হবে।",
    my: "သင်ထည့်သွင်းသော မေးမြန်းချက်အချက်အလက်များကို အကြံဉာဏ်ပေးရန်အတွက် စီမံခန့်ခွဲသူထံ ပေးပို့ပါမည်။"
  },
  // 8개 항목 전부 필수(비용 최소화 지시서) — 문구도 "모든 항목"으로 갱신.
  requiredError: {
    ko: "모든 항목을 입력해주세요.",
    en: "Please fill in all fields.",
    vi: "Vui lòng điền đầy đủ tất cả các mục.",
    zh: "请填写所有项目。",
    mn: "Бүх талбарыг бөглөнө үү.",
    bn: "সব ঘর পূরণ করুন।",
    my: "အကွက်အားလုံးကို ဖြည့်ပါ။"
  },
  saveError: {
    ko: "문의 접수에 실패했습니다. 다시 시도해 주세요.",
    en: "Failed to save your inquiry. Please try again shortly.",
    vi: "Không thể lưu yêu cầu. Vui lòng thử lại sau.",
    zh: "咨询保存失败，请稍后重试。",
    mn: "Асуултыг хадгалж чадсангүй. Түр хүлээгээд дахин оролдоно уу.",
    bn: "অনুসন্ধান সংরক্ষণ ব্যর্থ হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    my: "မေးမြန်းချက်ကို သိမ်းဆည်းရန် မအောင်မြင်ပါ။ ခဏနေ ထပ်ကြိုးစားပါ။"
  },
  // 저장(Firestore) 성공을 확인한 뒤에만 보여주는 접수 완료 메시지
  // (2026-09 "관리자 저장" 지시서 9번 — 무조건 완료 표시 금지).
  submitSuccess: {
    ko: "방 구하기 문의가 접수되었습니다.",
    en: "Your room inquiry has been submitted.",
    vi: "Yêu cầu tìm phòng của bạn đã được gửi.",
    zh: "您的租房咨询已提交。",
    mn: "Таны өрөө хайх хүсэлт хүлээн авагдлаа.",
    bn: "আপনার রুম অনুসন্ধান জমা দেওয়া হয়েছে।",
    my: "သင့်အခန်းရှာဖွေမှု မေးမြန်းချက်ကို လက်ခံရရှိပါပြီ။"
  },
  phoneNotReady: {
    ko: "문자 문의를 준비 중입니다.",
    en: "SMS inquiries are being prepared.",
    vi: "Chức năng nhắn tin đang được chuẩn bị.",
    zh: "短信咨询功能正在准备中。",
    mn: "Мессежээр лавлах бэлтгэгдэж байна.",
    bn: "এসএমএস অনুসন্ধান প্রস্তুত করা হচ্ছে।",
    my: "SMS မေးမြန်းမှုကို ပြင်ဆင်နေပါသည်။"
  },
  closeAriaLabel: { ko: "닫기", en: "Close", vi: "Đóng", zh: "关闭", mn: "Хаах", bn: "বন্ধ করুন", my: "ပိတ်ရန်" }
};

/* ==========================================================================
   PWA 업데이트 알림 / 바탕화면 추가 안내 문구 (js/pwa.js)
   ========================================================================== */
const PWA_UPDATE_INFO = {
  message: {
    ko: "새로운 메뉴 정보가 있습니다",
    zh: "有新的菜单信息",
    vi: "Có thông tin thực đơn mới",
    en: "New menu information is available",
    mn: "Шинэ цэсийн мэдээлэл гарлаа",
    bn: "নতুন মেনু তথ্য পাওয়া গেছে",
    my: "မီနူးအချက်အလက်အသစ်ရှိပါသည်"
  },
  button: {
    ko: "지금 업데이트",
    zh: "立即更新",
    vi: "Cập nhật ngay",
    en: "Update now",
    mn: "Одоо шинэчлэх",
    bn: "এখনই আপডেট করুন",
    my: "ယခုပင်အပ်ဒိတ်လုပ်ရန်"
  },
  done: {
    ko: "업데이트가 완료되었습니다",
    zh: "更新已完成",
    vi: "Đã cập nhật xong",
    en: "Update complete",
    mn: "Шинэчлэлт дууслаа",
    bn: "আপডেট সম্পন্ন হয়েছে",
    my: "အပ်ဒိတ်ပြီးစီးပါပြီ"
  }
};

const PWA_INSTALL_INFO = {
  title: {
    ko: "밥심 메뉴를 바탕화면에 추가하세요",
    zh: "将饭心菜单添加到主屏幕",
    vi: "Thêm thực đơn Babsim vào màn hình chính",
    en: "Add Babsim Menu to your Home Screen",
    mn: "Babsim цэсийг нүүр дэлгэцэд нэмэх",
    bn: "Babsim মেনু হোম স্ক্রিনে যোগ করুন",
    my: "Babsim မီနူးကို ပင်မစခရင်တွင်ထည့်ပါ"
  },
  desc: {
    ko: "다음 방문부터 메뉴를 더 빠르게 확인할 수 있습니다",
    zh: "下次可以更快地查看菜单",
    vi: "Xem thực đơn nhanh hơn vào lần sau",
    en: "Check the menu faster next time",
    mn: "Дараагийн удаа цэсийг хурдан үзээрэй",
    bn: "পরবর্তী বার থেকে দ্রুত মেনু দেখতে পারবেন",
    my: "နောက်တစ်ကြိမ်တွင် မီနူးကို ပိုမြန်စွာကြည့်ရှုနိုင်ပါသည်"
  },
  button: {
    ko: "바탕화면에 추가",
    zh: "添加到主屏幕",
    vi: "Thêm vào màn hình chính",
    en: "Add to Home Screen",
    mn: "Нүүр дэлгэцэд нэмэх",
    bn: "হোম স্ক্রিনে যোগ করুন",
    my: "ပင်မစခရင်တွင်ထည့်ရန်"
  },
  later: {
    ko: "나중에",
    zh: "稍后",
    vi: "Để sau",
    en: "Later",
    mn: "Дараа",
    bn: "পরে",
    my: "နောက်မှ"
  },
  // 아이폰/아이패드는 자동 설치창이 없어 Safari 공유 메뉴로 직접 안내합니다.
  iosSteps: {
    ko: ["Safari의 공유 버튼을 누르세요", "‘홈 화면에 추가’를 선택하세요", "오른쪽 위 ‘추가’를 누르세요"],
    zh: ["点击 Safari 浏览器的分享按钮", "选择“添加到主屏幕”", "点击右上角的“添加”"],
    vi: ["Nhấn nút Chia sẻ trên Safari", "Chọn “Thêm vào màn hình chính”", "Nhấn “Thêm” ở góc trên bên phải"],
    en: ["Tap the Share button in Safari", "Select “Add to Home Screen”", "Tap “Add” in the top-right corner"],
    mn: ["Safari-н Хуваалцах товчийг дарна уу", "“Нүүр дэлгэцэд нэмэх”-ийг сонгоно уу", "Баруун дээд буланд байх “Нэмэх”-ийг дарна уу"],
    bn: ["Safari-এর শেয়ার বাটনে চাপুন", "“হোম স্ক্রিনে যোগ করুন” নির্বাচন করুন", "উপরের ডানদিকে “যোগ করুন”-এ চাপুন"],
    my: ["Safari ၏ မျှဝေရန်ခလုတ်ကို နှိပ်ပါ", "“ပင်မစခရင်တွင်ထည့်ရန်” ကိုရွေးပါ", "ညာဘက်အပေါ်ရှိ “ထည့်ရန်” ကိုနှိပ်ပါ"]
  }
};

/* ==========================================================================
   1,000원의 아침밥 — 주말·공휴일 운영 설문조사 (js/weekend-survey.js)
   - 문항이 5개뿐이라 외부 번역 API 없이 5개 언어(ko/en/zh/vi/bn) 문구를
     여기 직접 저장합니다(2026-09 비용 최소화 지시서 8/41번). 질문 2는
     지시서에 명시된 번역을 그대로 사용했습니다(41번).
   - 시간 표기(07:30/08:00)는 모든 언어에서 숫자를 그대로 씁니다(13번).
   ========================================================================== */
const WEEKEND_SURVEY = {
  introDesc: {
    ko: "설문조사에 참여해주세요", en: "Please participate in our survey",
    zh: "请参加问卷调查", vi: "Vui lòng tham gia khảo sát", bn: "অনুগ্রহ করে জরিপে অংশ নিন"
  },
  progress: {
    ko: "질문 {n} / {total}", en: "Question {n} / {total}", zh: "问题 {n} / {total}",
    vi: "Câu hỏi {n} / {total}", bn: "প্রশ্ন {n} / {total}"
  },
  nextButton: { ko: "다음", en: "Next", zh: "下一步", vi: "Tiếp theo", bn: "পরবর্তী" },
  prevButton: { ko: "이전", en: "Previous", zh: "上一步", vi: "Trước", bn: "পূর্ববর্তী" },
  completeButton: { ko: "완료", en: "Submit", zh: "完成", vi: "Hoàn thành", bn: "সম্পন্ন করুন" },
  okButton: { ko: "확인", en: "OK", zh: "确定", vi: "Xác nhận", bn: "ঠিক আছে" },
  selectRequired: {
    ko: "선택해주세요.", en: "Please select an option.", zh: "请选择。",
    vi: "Vui lòng chọn.", bn: "অনুগ্রহ করে নির্বাচন করুন।"
  },
  saveError: {
    ko: "저장에 실패했습니다. 다시 시도해주세요.", en: "Failed to save. Please try again.",
    zh: "保存失败，请重试。", vi: "Lưu thất bại. Vui lòng thử lại.", bn: "সংরক্ষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"
  },
  alreadyDoneTitle: {
    ko: "설문에 이미 참여하셨습니다.", en: "You have already participated in this survey.",
    zh: "您已经参加过此问卷调查。", vi: "Bạn đã tham gia khảo sát này rồi.",
    bn: "আপনি ইতিমধ্যে এই জরিপে অংশ নিয়েছেন।"
  },
  alreadyDoneDesc: {
    ko: "소중한 의견 감사합니다.", en: "Thank you for your valuable feedback.",
    zh: "感谢您的宝贵意见。", vi: "Cảm ơn ý kiến quý báu của bạn.", bn: "আপনার মূল্যবান মতামতের জন্য ধন্যবাদ।"
  },
  notStartedTitle: {
    ko: "설문이 아직 시작되지 않았습니다.", en: "The survey hasn't started yet.",
    zh: "问卷调查尚未开始。", vi: "Khảo sát chưa bắt đầu.", bn: "জরিপটি এখনও শুরু হয়নি।"
  },
  notStartedDesc: {
    ko: "9월 28일 오전 7시부터 참여하실 수 있습니다.", en: "You can participate starting 7:00 AM on September 28.",
    zh: "您可以从9月28日上午7点开始参加。", vi: "Bạn có thể tham gia từ 7:00 sáng ngày 28 tháng 9.",
    bn: "আপনি ২৮ সেপ্টেম্বর সকাল ৭টা থেকে অংশ নিতে পারবেন।"
  },

  // 홈 메인 히어로에서 화산불백과 번갈아 표시되는 슬라이드 문구
  // (2026-09 "화산불백/설문 자동전환" 지시서). eyebrow는 다른 홈 카드
  // eyebrow(WEEKEND/HOUSING 등)와 같이 언어와 무관하게 "SURVEY" 고정.
  heroTitleSub: {
    ko: "1,000원의 아침밥", en: "1,000 Won Breakfast", zh: "1,000韩元早餐",
    vi: "Bữa sáng 1.000 won", bn: "১,০০০ ওনের সকালের নাশতা"
  },
  heroTitleMain: { ko: "설문조사", en: "Survey", zh: "问卷调查", vi: "Khảo sát", bn: "জরিপ" },
  heroDesc: {
    ko: "주말·공휴일 운영, 의견을 들려주세요", en: "Weekend & holiday hours — tell us what you think",
    zh: "周末及公休日运营，欢迎提出您的意见", vi: "Vận hành cuối tuần và ngày lễ, hãy cho chúng tôi biết ý kiến của bạn",
    bn: "সপ্তাহান্ত ও ছুটির দিনের পরিচালনা, আপনার মতামত জানান"
  },
  heroCta: { ko: "설문 참여하기", en: "Take the survey", zh: "参加问卷调查", vi: "Tham gia khảo sát", bn: "জরিপে অংশ নিন" },

  q1_title: {
    ko: "귀하는 어디에 해당합니까?", en: "Which of the following applies to you?",
    zh: "您属于以下哪种情况？", vi: "Bạn thuộc nhóm nào sau đây?", bn: "আপনি নিচের কোনটির সাথে সম্পর্কিত?"
  },
  q1_opt_korean: { ko: "한국인 학생", en: "Korean student", zh: "韩国学生", vi: "Sinh viên Hàn Quốc", bn: "কোরিয়ান শিক্ষার্থী" },
  q1_opt_international: { ko: "유학생", en: "International student", zh: "留学生", vi: "Du học sinh", bn: "আন্তর্জাতিক শিক্ষার্থী" },

  // 지시서 12번 — 기숙사 생활/자취/통학의 의미가 정확히 전달되도록 지시서에
  // 명시된 번역을 그대로 사용(기계번역 아님).
  q2_title: {
    ko: "현재 생활 형태는 무엇입니까?", en: "What is your current living arrangement?",
    zh: "您目前的居住方式是什么？", vi: "Hiện tại bạn đang sinh hoạt theo hình thức nào?",
    bn: "আপনি বর্তমানে কীভাবে থাকেন?"
  },
  q2_opt_dorm: {
    ko: "기숙사 생활", en: "Living in a dormitory", zh: "住学校宿舍",
    vi: "Sống trong ký túc xá", bn: "বিশ্ববিদ্যালয়ের ছাত্রাবাসে থাকি"
  },
  q2_opt_offcampus: {
    ko: "자취", en: "Living off-campus on my own", zh: "在校外自己租房居住",
    vi: "Thuê nhà và sống bên ngoài trường", bn: "ক্যাম্পাসের বাইরে ভাড়া বাসায় থাকি"
  },
  q2_opt_commute: {
    ko: "통학", en: "Commuting from home", zh: "从家里通学",
    vi: "Đi học từ nhà", bn: "বাড়ি থেকে যাতায়াত করি"
  },

  q3_title: {
    ko: "주말 및 공휴일에 원하는 아침밥 운영시간은 언제입니까?",
    en: "What time would you like weekend/holiday breakfast service to run?",
    zh: "您希望周末及公休日的早餐供应时间是几点？",
    vi: "Bạn muốn giờ phục vụ bữa sáng vào cuối tuần và ngày lễ là khi nào?",
    bn: "সপ্তাহান্ত ও ছুটির দিনে আপনি নাশতা পরিষেবার সময় কখন চান?"
  },
  q3_opt_0730: {
    ko: "오전 7:30 ~ 오전 9:30", en: "7:30 AM ~ 9:30 AM", zh: "上午7:30～上午9:30",
    vi: "7:30 ~ 9:30 sáng", bn: "সকাল 7:30 ~ সকাল 9:30"
  },
  q3_opt_0800: {
    ko: "오전 8:00 ~ 오전 10:00", en: "8:00 AM ~ 10:00 AM", zh: "上午8:00～上午10:00",
    vi: "8:00 ~ 10:00 sáng", bn: "সকাল 8:00 ~ সকাল 10:00"
  },

  q4_title: {
    ko: "주말 및 공휴일 아침 메뉴는 어떤 구성을 선호합니까?",
    en: "What menu style would you prefer for weekend/holiday breakfast?",
    zh: "您希望周末及公休日的早餐是什么样的？",
    vi: "Bạn muốn thực đơn bữa sáng cuối tuần và ngày lễ như thế nào?",
    bn: "সপ্তাহান্ত ও ছুটির দিনের নাশতার মেনু কেমন হলে ভালো হয়?"
  },
  q4_opt_simple: {
    ko: "간편식 (빵 · 우유 · 콘플레이크 · 라면 · 쌀국수 등)",
    en: "Simple meal (bread, milk, cornflakes, ramen, pho, etc.)",
    zh: "简便餐（面包·牛奶·玉米片·拉面·越南河粉等）",
    vi: "Bữa ăn đơn giản (bánh mì · sữa · ngũ cốc · mì ramen · phở, v.v.)",
    bn: "সহজ খাবার (রুটি · দুধ · কর্নফ্লেক্স · রামেন · ফো নুডলস ইত্যাদি)"
  },
  q4_opt_simple_korean: {
    ko: "간편식 + 한식", en: "Simple meal + Korean food", zh: "简便餐 + 韩式餐",
    vi: "Bữa ăn đơn giản + món Hàn", bn: "সহজ খাবার + কোরিয়ান খাবার"
  },
  q4_opt_other: { ko: "기타 의견", en: "Other opinion", zh: "其他意见", vi: "Ý kiến khác", bn: "অন্যান্য মতামত" },
  q4_otherPlaceholder: {
    ko: "원하는 메뉴나 의견을 입력해주세요.", en: "Please enter the menu or opinion you'd like.",
    zh: "请输入您希望的菜单或意见。", vi: "Vui lòng nhập thực đơn hoặc ý kiến mong muốn.",
    bn: "আপনার পছন্দের মেনু বা মতামত লিখুন।"
  },

  q5_title: {
    ko: "주말 및 공휴일에 1,000원의 아침밥을 운영한다면 당신은 이용하시겠습니까?",
    en: "If weekend/holiday 1,000 won breakfast service is offered, would you use it?",
    zh: "如果周末及公休日提供1,000韩元早餐，您会使用吗？",
    vi: "Nếu bữa sáng 1.000 won được vận hành vào cuối tuần và ngày lễ, bạn có sử dụng không?",
    bn: "সপ্তাহান্ত ও ছুটির দিনে ১,০০০ ওনের নাশতা চালু হলে আপনি কি ব্যবহার করবেন?"
  },
  q5_opt_often: { ko: "자주 이용하겠습니다", en: "I would use it often", zh: "会经常使用", vi: "Tôi sẽ sử dụng thường xuyên", bn: "আমি প্রায়ই ব্যবহার করব" },
  q5_opt_sometimes: { ko: "가끔 이용하겠습니다", en: "I would use it sometimes", zh: "偶尔会使用", vi: "Tôi sẽ thỉnh thoảng sử dụng", bn: "মাঝে মাঝে ব্যবহার করব" },
  q5_opt_unsure: { ko: "잘 모르겠습니다", en: "Not sure", zh: "不太确定", vi: "Tôi chưa chắc chắn", bn: "নিশ্চিত না" },
  q5_opt_no: { ko: "이용하지 않을 것 같습니다", en: "I probably wouldn't use it", zh: "应该不会使用", vi: "Có lẽ tôi sẽ không sử dụng", bn: "সম্ভবত ব্যবহার করব না" },

  suggestionTitle: { ko: "건의사항", en: "Suggestions", zh: "建议事项", vi: "Góp ý", bn: "মতামত" },
  suggestionDesc: {
    ko: "주말 및 공휴일 영업에 대한 의견이나 건의사항을 자유롭게 작성해주세요.",
    en: "Feel free to share any opinions or suggestions about weekend/holiday operation.",
    zh: "请自由填写您对周末及公休日运营的意见或建议。",
    vi: "Vui lòng tự do chia sẻ ý kiến hoặc góp ý về việc vận hành vào cuối tuần và ngày lễ.",
    bn: "সপ্তাহান্ত ও ছুটির দিনের পরিচালনা সম্পর্কে আপনার মতামত বা পরামর্শ স্বাধীনভাবে লিখুন।"
  },
  suggestionPlaceholder: {
    ko: "건의사항을 입력해주세요(선택).", en: "Enter your suggestion (optional).",
    zh: "请输入建议事项（可选）。", vi: "Nhập góp ý của bạn (không bắt buộc).", bn: "আপনার মতামত লিখুন (ঐচ্ছিক)।"
  }
};
