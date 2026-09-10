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
  stepsTitle: { ko: "이용방법", en: "How to Order", zh: "使用方法", vi: "Cách sử dụng", mn: "Хэрхэн ашиглах", bn: "ব্যবহারের পদ্ধতি", my: "အသုံးပြုနည်း" }
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
  }
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
