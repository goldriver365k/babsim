/* ==========================================================================
   공통 UI 문구 번역 (매장명, 버튼, 안내문, 오류문)
   ========================================================================== */

const UI_TEXT = {
  siteTitle: {
    ko: "모인관(인제대학교)",
    en: "Moin-gwan (Inje University)",
    zh: "摩茵馆(仁济大学)",
    vi: "Moin-gwan (Đại học Inje)",
    mn: "Моин-гван (Inje их сургууль)"
  },
  storeNames: {
    bapsim: {
      brand: "밥심",
      floor: { ko: "1층", en: "1st Floor", zh: "1楼", vi: "Tầng 1", mn: "1-р давхар" },
      pronunciation: { en: "Bap-sim", zh: "巴普心", vi: "Báp-sim", mn: "Бап-сим" }
    },
    mangwon: {
      brand: "만권화밥",
      floor: { ko: "1층", en: "1st Floor", zh: "1楼", vi: "Tầng 1", mn: "1-р давхар" },
      pronunciation: { en: "Man-gwon-hwa-bap", zh: "曼关花巴普", vi: "Man-guôn-hoa-báp", mn: "Ман-гвон-хва-бап" }
    },
    hururuk: {
      brand: "후루룩찹찹",
      floor: { ko: "2층", en: "2nd Floor", zh: "2楼", vi: "Tầng 2", mn: "2-р давхар" },
      pronunciation: { en: "Hu-ru-ruk-chap-chap", zh: "呼噜噜恰普恰普", vi: "Hu-ru-rúc-cháp-cháp", mn: "Ху-ру-рук-чап-чап" }
    }
  },
  storeHeading: {
    bapsim: { ko: "밥심1층", en: "밥심 1F", zh: "밥심 1楼", vi: "밥심, tầng 1", mn: "밥심, 1-р давхар" },
    mangwon: { ko: "만권화밥1층", en: "만권화밥 1F", zh: "만권화밥 1楼", vi: "만권화밥, tầng 1", mn: "만권화밥, 1-р давхар" },
    hururuk: { ko: "후루룩찹찹 2층", en: "후루룩찹찹 2F", zh: "후루룩찹찹 2楼", vi: "후루룩찹찹, tầng 2", mn: "후루룩찹찹, 2-р давхар" }
  },
  langLabel: { ko: "언어 선택", en: "Language", zh: "语言", vi: "Ngôn ngữ", mn: "Хэл сонгох" },
  langNames: {
    ko: "한국어", en: "English", zh: "中文", vi: "Tiếng Việt", mn: "Монгол"
  },
  prevButton: { ko: "이전", en: "Previous", zh: "上一页", vi: "Trước", mn: "Өмнөх" },
  nextButton: { ko: "다음", en: "Next", zh: "下一页", vi: "Tiếp theo", mn: "Дараах" },
  soldOut: { ko: "품절", en: "SOLD OUT", zh: "已售罄", vi: "Hết hàng", mn: "Дууссан" },
  closeButton: { ko: "닫기", en: "Close", zh: "关闭", vi: "Đóng", mn: "Хаах" },
  imagePending: { ko: "이미지 준비 중", en: "Image coming soon", zh: "图片准备中", vi: "Hình ảnh đang chuẩn bị", mn: "Зураг бэлтгэж байна" },
  priceTBD: { ko: "가격 확인 필요", en: "Price to be confirmed", zh: "价格待确认", vi: "Giá đang xác nhận", mn: "Үнийг баталгаажуулах шаардлагатай" },
  won: { ko: "원", en: "won", zh: "韩元", vi: "won", mn: " вон" },
  loadError: {
    ko: "메뉴를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    en: "There was a problem loading the menu. Please try again shortly.",
    zh: "加载菜单时出现问题，请稍后重试。",
    vi: "Đã xảy ra sự cố khi tải menu. Vui lòng thử lại sau.",
    mn: "Цэсийг ачаалахад алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу."
  },
  infoTitle: { ko: "이용 안내", en: "Information", zh: "使用指南", vi: "Thông tin", mn: "Мэдээлэл" },
  stepsTitle: { ko: "이용방법", en: "How to Order", zh: "使用方法", vi: "Cách sử dụng", mn: "Хэрхэн ашиглах" }
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
    mn: "Өнөөдрийн өглөөний хоол ямар байсан бэ?"
  },
  score5: { ko: "아주 좋아요", en: "Loved it", zh: "非常好", vi: "Rất thích", mn: "Маш их таалагдсан" },
  score4: { ko: "좋아요", en: "Good", zh: "好", vi: "Thích", mn: "Таалагдсан" },
  score3: { ko: "보통이에요", en: "Okay", zh: "一般", vi: "Bình thường", mn: "Дунд зэрэг" },
  score2: { ko: "아쉬워요", en: "Not great", zh: "有点遗憾", vi: "Chưa hài lòng", mn: "Дутагдалтай" },
  score1: { ko: "별로예요", en: "Not good", zh: "不满意", vi: "Không thích", mn: "Таалагдаагүй" },
  thanks: { ko: "감사합니다!", en: "Thank you!", zh: "谢谢！", vi: "Cảm ơn bạn!", mn: "Баярлалаа!" },
  completed: {
    ko: "오늘 평가를 완료했습니다.",
    en: "You’ve already rated today’s breakfast.",
    zh: "您今天已完成评价。",
    vi: "Bạn đã đánh giá hôm nay rồi.",
    mn: "Та өнөөдөр үнэлгээгээ өгсөн байна."
  },
  error: {
    ko: "저장에 실패했습니다. 다시 시도해주세요.",
    en: "Failed to save. Please try again.",
    zh: "保存失败，请重试。",
    vi: "Lưu không thành công. Vui lòng thử lại.",
    mn: "Хадгалахад алдаа гарлаа. Дахин оролдоно уу."
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
    mn: "Солонгос хэл үнэгүй сурах"
  },
  desc: {
    ko: "한국어를 쉽고 재미있게 배워보세요",
    zh: "轻松有趣地学习韩语",
    vi: "Học tiếng Hàn dễ dàng và thú vị",
    en: "Learn Korean easily and enjoyably",
    mn: "Солонгос хэлийг хялбар, сонирхолтой сураарай"
  },
  button: {
    ko: "무료로 시작하기",
    zh: "免费开始",
    vi: "Bắt đầu miễn phí",
    en: "Start for Free",
    mn: "Үнэгүй эхлэх"
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
    mn: "Шинэ цэсийн мэдээлэл гарлаа"
  },
  button: {
    ko: "지금 업데이트",
    zh: "立即更新",
    vi: "Cập nhật ngay",
    en: "Update now",
    mn: "Одоо шинэчлэх"
  },
  done: {
    ko: "업데이트가 완료되었습니다",
    zh: "更新已完成",
    vi: "Đã cập nhật xong",
    en: "Update complete",
    mn: "Шинэчлэлт дууслаа"
  }
};

const PWA_INSTALL_INFO = {
  title: {
    ko: "밥심 메뉴를 바탕화면에 추가하세요",
    zh: "将饭心菜单添加到主屏幕",
    vi: "Thêm thực đơn Babsim vào màn hình chính",
    en: "Add Babsim Menu to your Home Screen",
    mn: "Babsim цэсийг нүүр дэлгэцэд нэмэх"
  },
  desc: {
    ko: "다음 방문부터 메뉴를 더 빠르게 확인할 수 있습니다",
    zh: "下次可以更快地查看菜单",
    vi: "Xem thực đơn nhanh hơn vào lần sau",
    en: "Check the menu faster next time",
    mn: "Дараагийн удаа цэсийг хурдан үзээрэй"
  },
  button: {
    ko: "바탕화면에 추가",
    zh: "添加到主屏幕",
    vi: "Thêm vào màn hình chính",
    en: "Add to Home Screen",
    mn: "Нүүр дэлгэцэд нэмэх"
  },
  later: {
    ko: "나중에",
    zh: "稍后",
    vi: "Để sau",
    en: "Later",
    mn: "Дараа"
  },
  // 아이폰/아이패드는 자동 설치창이 없어 Safari 공유 메뉴로 직접 안내합니다.
  iosSteps: {
    ko: ["Safari의 공유 버튼을 누르세요", "‘홈 화면에 추가’를 선택하세요", "오른쪽 위 ‘추가’를 누르세요"],
    zh: ["点击 Safari 浏览器的分享按钮", "选择“添加到主屏幕”", "点击右上角的“添加”"],
    vi: ["Nhấn nút Chia sẻ trên Safari", "Chọn “Thêm vào màn hình chính”", "Nhấn “Thêm” ở góc trên bên phải"],
    en: ["Tap the Share button in Safari", "Select “Add to Home Screen”", "Tap “Add” in the top-right corner"],
    mn: ["Safari-н Хуваалцах товчийг дарна уу", "“Нүүр дэлгэцэд нэмэх”-ийг сонгоно уу", "Баруун дээд буланд байх “Нэмэх”-ийг дарна уу"]
  }
};
