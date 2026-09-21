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
  homeCommunityLatestEmpty: { ko: "아직 등록된 글이 없습니다.", en: "No posts yet.", zh: "还没有帖子。", vi: "Chưa có bài viết nào.", mn: "Одоогоор нийтлэл алга.", bn: "এখনও কোনো পোস্ট নেই।", my: "ပို့စ်မရှိသေးပါ။" },
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
   방 구하기 문의 (js/room-inquiry.js)
   - 홈 화면 카드 문구는 사이트 언어(7개) 전부를 그대로 따라가지만,
     문의 화면 자체(언어 선택/입력 폼)는 지시서대로 4개 언어(한국어/
     English/Tiếng Việt/中文)만 지원합니다 — 새 번역 API 호출 없음,
     전부 고정 문구.
   ========================================================================== */
const ROOM_SEARCH_CARD = {
  title: {
    ko: "방 구하기", en: "Find a Room", zh: "找房", vi: "Tìm phòng",
    mn: "Байр хайх", bn: "রুম খুঁজুন", my: "အခန်းရှာရန်"
  },
  subtitle: "한국어 · English · Tiếng Việt · 中文"
};

const ROOM_INQUIRY_TEXT = {
  langNames: { ko: "한국어", en: "English", vi: "Tiếng Việt", zh: "中文" },
  pickLangTitle: {
    ko: "언어를 선택하세요", en: "Choose a language",
    vi: "Chọn ngôn ngữ", zh: "请选择语言"
  },
  formTitle: {
    ko: "방 구하기 문의", en: "Room Inquiry",
    vi: "Yêu cầu tìm phòng", zh: "找房咨询"
  },
  fieldName: { ko: "이름", en: "Name", vi: "Họ tên", zh: "姓名" },
  fieldPhone: { ko: "전화번호", en: "Phone Number", vi: "Số điện thoại", zh: "电话号码" },
  fieldMoveIn: {
    ko: "입주 희망일", en: "Desired Move-in Date",
    vi: "Ngày mong muốn chuyển vào", zh: "入住希望日期"
  },
  fieldArea: { ko: "희망 지역", en: "Preferred Area", vi: "Khu vực mong muốn", zh: "希望地区" },
  fieldBudget: { ko: "희망 예산", en: "Budget", vi: "Ngân sách mong muốn", zh: "希望预算" },
  fieldDeposit: { ko: "보증금", en: "Deposit", vi: "Tiền đặt cọc", zh: "押金" },
  fieldRent: { ko: "월세", en: "Monthly Rent", vi: "Tiền thuê hàng tháng", zh: "月租" },
  submitButton: {
    ko: "문자로 문의하기", en: "Send Inquiry by SMS",
    vi: "Gửi yêu cầu qua SMS", zh: "通过短信咨询"
  },
  storageNotice: {
    ko: "입력한 문의 내용은 상담을 위해 관리자에게 전달됩니다.",
    en: "The information you entered will be sent to the administrator for consultation.",
    vi: "Nội dung bạn đã nhập sẽ được gửi đến quản trị viên để tư vấn.",
    zh: "您填写的咨询内容将发送给管理员以便咨询处理。"
  },
  errRequired: {
    ko: "모든 항목을 입력해주세요.", en: "Please fill in all fields.",
    vi: "Vui lòng nhập đầy đủ thông tin.", zh: "请填写所有项目。"
  },
  errGeneric: {
    ko: "문의 접수에 실패했습니다. 다시 시도해주세요.",
    en: "Failed to submit your inquiry. Please try again.",
    vi: "Gửi yêu cầu không thành công. Vui lòng thử lại.",
    zh: "提交失败，请重试。"
  },
  doneTitle: {
    ko: "접수되었습니다", en: "Inquiry Received",
    vi: "Đã tiếp nhận", zh: "已受理"
  },
  doneMessage: {
    ko: "문자 앱이 열립니다. 문자를 보내지 않아도 문의는 이미 접수되었습니다.",
    en: "Your messaging app will open. Your inquiry has already been received even if you don't send the text.",
    vi: "Ứng dụng nhắn tin sẽ mở ra. Yêu cầu của bạn đã được tiếp nhận dù bạn không gửi tin nhắn.",
    zh: "短信应用即将打开。即使您不发送短信，咨询也已受理。"
  },
  closeButton: { ko: "닫기", en: "Close", vi: "Đóng", zh: "关闭" }
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
  }
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
