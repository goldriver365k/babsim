/* ==========================================================================
   유학생 커뮤니티 다국어 문구 (js/community-translations.js)
   - js/translations.js와 같은 패턴({ko,zh,vi,en,mn,bn,my})을 그대로 따릅니다.
   - babsim.store에서 선택한 언어(js/app.js state.lang, localStorage
     "foodhall_lang")를 커뮤니티 화면에도 그대로 사용합니다.
   - 2026-09-10: 벵골어(bn)·미얀마어(my) 지원 추가.
   ========================================================================== */

/* 상단 커뮤니티 버튼(두 줄) */
var COMMUNITY_NAV = {
  line1: { ko: "유학생", zh: "留学生", vi: "Cộng đồng", en: "International", mn: "Олон улсын", bn: "আন্তর্জাতিক শিক্ষার্থী", my: "နိုင်ငံတကာကျောင်းသား" },
  line2: { ko: "커뮤니티", zh: "社区", vi: "Du học sinh", en: "Community", mn: "Оюутнууд", bn: "কমিউনিটি", my: "အသိုင်းအဝိုင်း" }
};

/* 커뮤니티 첫 화면(비회원도 보이는 부분) 제목/소개 — 2026-09-10
   "비회원 노출" 지시서. 상단 COMMUNITY_NAV(두 줄 버튼)와는 별개로,
   목록 화면 안에 큰 제목+짧은 소개를 둡니다. */
var COMMUNITY_HOME = {
  title: { ko: "유학생 커뮤니티", zh: "留学生社区", vi: "Cộng đồng du học sinh", en: "International Student Community", mn: "Олон улсын оюутнуудын нийгэмлэг", bn: "আন্তর্জাতিক শিক্ষার্থী কমিউনিটি", my: "နိုင်ငံတကာကျောင်းသားများ အသိုင်းအဝိုင်း" },
  tagline: { ko: "친구를 만나고, 물건을 나누고, 서로 도움을 주고받으세요.", zh: "结交朋友，分享物品，互相帮助。", vi: "Kết bạn, chia sẻ đồ dùng và giúp đỡ lẫn nhau.", en: "Meet friends, share items, and help each other.", mn: "Найзуудтай танилцаж, зүйл хуваалцаж, бие биедээ туслаарай.", bn: "বন্ধু তৈরি করুন, জিনিসপত্র শেয়ার করুন এবং একে অপরকে সাহায্য করুন।", my: "သူငယ်ချင်းတွေ့ဆုံပါ၊ ပစ္စည်းများဝေမျှပါ၊ အချင်းချင်းကူညီကြပါ။" }
};

/* 게시판 5개 카테고리 — "생활정보"는 2026-09-10에 "구인·구직"으로
   교체되었습니다. life는 예전 게시글 표시(관리자 이동 전까지)를 위해
   번역만 남겨두고 선택 목록(COMMUNITY_CATEGORY_ORDER)에서는 뺐습니다. */
var COMMUNITY_CATEGORIES = {
  friends: { ko: "친구 만들기", zh: "交朋友", vi: "Kết bạn", en: "Make Friends", mn: "Найзтай болох", bn: "বন্ধু তৈরি করুন", my: "သူငယ်ချင်းဖွဲ့ရန်" },
  market: { ko: "중고거래", zh: "二手交易", vi: "Chợ đồ cũ", en: "Marketplace", mn: "Хуучин барааны худалдаа", bn: "পুরোনো পণ্য কেনাবেচা", my: "တစ်ပတ်ရစ်ပစ္စည်း အရောင်းအဝယ်" },
  help: { ko: "도움 요청", zh: "求助", vi: "Yêu cầu trợ giúp", en: "Help Requests", mn: "Тусламж хүсэх", bn: "সাহায্যের অনুরোধ", my: "အကူအညီတောင်းရန်" },
  together: { ko: "같이 해요", zh: "一起参加", vi: "Cùng tham gia", en: "Let's Meet", mn: "Хамтдаа оролцох", bn: "একসঙ্গে করি", my: "အတူတူလုပ်ကြမယ်" },
  job: { ko: "구인·구직", zh: "招聘·求职", vi: "Tuyển dụng · Tìm việc", en: "Jobs", mn: "Ажил олголт · Ажил хайх", bn: "চাকরি ও চাকরিপ্রার্থী", my: "အလုပ်ခေါ်ယူခြင်းနှင့် အလုပ်ရှာဖွေခြင်း" },
  life: { ko: "생활정보", zh: "生活信息", vi: "Thông tin cuộc sống", en: "Life Information", mn: "Амьдралын мэдээлэл", bn: "জীবনযাত্রার তথ্য", my: "နေထိုင်မှုဆိုင်ရာအချက်အလက်" }
};
var COMMUNITY_CATEGORY_ORDER = ["friends", "market", "help", "together", "job"];

/* 로그인/회원가입/이메일 인증/비밀번호 찾기 */
var COMMUNITY_AUTH = {
  loginTitle: { ko: "로그인", zh: "登录", vi: "Đăng nhập", en: "Log In", mn: "Нэвтрэх", bn: "লগইন", my: "ဝင်ရောက်ရန်" },
  signupTitle: { ko: "회원가입", zh: "注册", vi: "Đăng ký", en: "Sign Up", mn: "Бүртгүүлэх", bn: "সদস্য নিবন্ধন", my: "အကောင့်ဖွင့်ရန်" },
  emailLabel: { ko: "이메일", zh: "邮箱", vi: "Email", en: "Email", mn: "И-мэйл", bn: "ইমেইল", my: "အီးမေးလ်" },
  passwordLabel: { ko: "비밀번호", zh: "密码", vi: "Mật khẩu", en: "Password", mn: "Нууц үг", bn: "পাসওয়ার্ড", my: "စကားဝှက်" },
  passwordConfirmLabel: { ko: "비밀번호 확인", zh: "确认密码", vi: "Xác nhận mật khẩu", en: "Confirm Password", mn: "Нууц үг баталгаажуулах", bn: "পাসওয়ার্ড নিশ্চিত করুন", my: "စကားဝှက်အတည်ပြုရန်" },
  nameLabel: { ko: "이름", zh: "姓名", vi: "Họ tên", en: "Name", mn: "Нэр", bn: "নাম", my: "အမည်" },
  nationalityLabel: { ko: "국적", zh: "国籍", vi: "Quốc tịch", en: "Nationality", mn: "Иргэншил", bn: "জাতীয়তা", my: "နိုင်ငံသား" },
  nationalitySearchPlaceholder: { ko: "국가 검색", zh: "搜索国家", vi: "Tìm quốc gia", en: "Search country", mn: "Улс хайх", bn: "দেশ অনুসন্ধান করুন", my: "နိုင်ငံရှာရန်" },
  langLabel: { ko: "사용할 언어", zh: "使用语言", vi: "Ngôn ngữ sử dụng", en: "Preferred Language", mn: "Ашиглах хэл", bn: "ব্যবহারের ভাষা", my: "အသုံးပြုမည့်ဘာသာစကား" },
  privacyAgree: { ko: "개인정보 수집에 동의합니다", zh: "同意收集个人信息", vi: "Tôi đồng ý thu thập thông tin cá nhân", en: "I agree to the collection of personal information", mn: "Хувийн мэдээлэл цуглуулахыг зөвшөөрч байна", bn: "ব্যক্তিগত তথ্য সংগ্রহে সম্মত", my: "ကိုယ်ရေးအချက်အလက်စုဆောင်းခြင်းကို သဘောတူပါသည်" },
  rulesAgree: { ko: "커뮤니티 이용규칙에 동의합니다", zh: "同意社区使用规则", vi: "Tôi đồng ý với quy tắc cộng đồng", en: "I agree to the community rules", mn: "Нийгэмлэгийн дүрэмтэй зөвшөөрч байна", bn: "কমিউনিটি ব্যবহারের নিয়মে সম্মত", my: "အသိုင်းအဝိုင်းအသုံးပြုစည်းမျဉ်းကို သဘောတူပါသည်" },
  viewText: { ko: "보기", zh: "查看", vi: "Xem", en: "View", mn: "Харах", bn: "দেখুন", my: "ကြည့်ရန်" },
  submitSignup: { ko: "가입하기", zh: "注册", vi: "Đăng ký", en: "Create Account", mn: "Бүртгүүлэх", bn: "নিবন্ধন করুন", my: "စာရင်းသွင်းရန်" },
  submitLogin: { ko: "로그인", zh: "登录", vi: "Đăng nhập", en: "Log In", mn: "Нэвтрэх", bn: "লগইন", my: "ဝင်ရောက်ရန်" },
  keepLoggedIn: { ko: "로그인 상태 유지", zh: "保持登录", vi: "Duy trì đăng nhập", en: "Keep me logged in", mn: "Нэвтэрсэн хэвээр байх", bn: "লগইন অবস্থায় থাকুন", my: "ဝင်ရောက်ထားသည့်အခြေအနေတွင်ထားရန်" },
  forgotPassword: { ko: "비밀번호 찾기", zh: "忘记密码", vi: "Quên mật khẩu", en: "Forgot Password", mn: "Нууц үг сэргээх", bn: "পাসওয়ার্ড ভুলে গেছেন", my: "စကားဝှက်မေ့နေပါသလား" },
  goSignup: { ko: "회원가입", zh: "去注册", vi: "Đăng ký", en: "Sign Up", mn: "Бүртгүүлэх", bn: "সদস্য নিবন্ধন", my: "အကောင့်ဖွင့်ရန်" },
  goLogin: { ko: "이미 계정이 있나요? 로그인", zh: "已有账号？登录", vi: "Đã có tài khoản? Đăng nhập", en: "Already have an account? Log in", mn: "Бүртгэлтэй юу? Нэвтрэх", bn: "ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন", my: "အကောင့်ရှိပြီးသားလား? ဝင်ရောက်ပါ" },
  resendVerification: { ko: "인증메일 다시 보내기", zh: "重新发送验证邮件", vi: "Gửi lại email xác nhận", en: "Resend verification email", mn: "Баталгаажуулах имэйлийг дахин илгээх", bn: "যাচাইকরণ ইমেইল আবার পাঠান", my: "အတည်ပြုအီးမေးလ်ကို ထပ်မံပေးပို့ရန်" },
  verifyNotice: { ko: "이메일 인증을 완료해 주세요.", zh: "请完成邮箱验证。", vi: "Vui lòng hoàn tất xác nhận email.", en: "Please verify your email.", mn: "И-мэйлээ баталгаажуулна уу.", bn: "অনুগ্রহ করে ইমেইল যাচাই সম্পন্ন করুন।", my: "အီးမေးလ်အတည်ပြုမှုကို ပြီးမြောက်အောင်ပြုလုပ်ပါ။" },
  logout: { ko: "로그아웃", zh: "登出", vi: "Đăng xuất", en: "Log Out", mn: "Гарах", bn: "লগআউট", my: "ထွက်ရန်" },
  resetSent: { ko: "비밀번호 재설정 메일을 보냈습니다.", zh: "已发送密码重置邮件。", vi: "Đã gửi email đặt lại mật khẩu.", en: "Password reset email sent.", mn: "Нууц үг сэргээх и-мэйл илгээгдлээ.", bn: "পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে।", my: "စကားဝှက်ပြန်လည်သတ်မှတ်ရန်အီးမေးလ်ကို ပေးပို့ပြီးပါပြီ။" },
  verificationSent: { ko: "인증메일을 다시 보냈습니다.", zh: "已重新发送验证邮件。", vi: "Đã gửi lại email xác nhận.", en: "Verification email resent.", mn: "Баталгаажуулах имэйлийг дахин илгээлээ.", bn: "যাচাইকরণ ইমেইল আবার পাঠানো হয়েছে।", my: "အတည်ပြုအီးမေးလ်ကို ထပ်မံပေးပို့ပြီးပါပြီ။" },
  loginRequiredTitle: { ko: "로그인이 필요합니다", zh: "需要登录", vi: "Cần đăng nhập", en: "Login Required", mn: "Нэвтрэх шаардлагатай", bn: "লগইন প্রয়োজন", my: "ဝင်ရောက်ရန်လိုအပ်ပါသည်" },
  loginRequiredDesc: { ko: "유학생 커뮤니티는 회원가입을 완료한 회원만 이용할 수 있습니다.", zh: "留学生社区仅限完成注册的会员使用。", vi: "Cộng đồng du học sinh chỉ dành cho thành viên đã đăng ký.", en: "The community is available only to registered members.", mn: "Олон улсын оюутнуудын нийгэмлэг нь бүртгэлтэй гишүүдэд л нээлттэй.", bn: "আন্তর্জাতিক শিক্ষার্থী কমিউনিটি শুধুমাত্র নিবন্ধিত সদস্যদের জন্য উপলব্ধ।", my: "နိုင်ငံတကာကျောင်းသားများ အသိုင်းအဝိုင်းကို စာရင်းသွင်းထားသောအဖွဲ့ဝင်များသာ အသုံးပြုနိုင်ပါသည်။" },
  suspendedNotice: { ko: "이용이 정지된 계정입니다.", zh: "该账号已被停用。", vi: "Tài khoản đã bị đình chỉ.", en: "This account has been suspended.", mn: "Энэ бүртгэл түдгэлзүүлэгдсэн байна.", bn: "এই অ্যাকাউন্টটি স্থগিত করা হয়েছে।", my: "ဤအကောင့်ကို ဆိုင်းငံ့ထားပါသည်။" },
  googleContinue: { ko: "Google로 계속하기", zh: "使用Google继续", vi: "Tiếp tục với Google", en: "Continue with Google", mn: "Google-ээр үргэлжлүүлэх", bn: "Google দিয়ে চালিয়ে যান", my: "Google ဖြင့်ဆက်လက်လုပ်ဆောင်ရန်" },
  orDivider: { ko: "또는", zh: "或", vi: "Hoặc", en: "or", mn: "эсвэл", bn: "অথবা", my: "သို့မဟုတ်" },
  completeProfileTitle: { ko: "추가 정보 입력", zh: "填写更多信息", vi: "Hoàn tất thông tin", en: "Complete Your Profile", mn: "Мэдээллээ бөглөнө үү", bn: "অতিরিক্ত তথ্য প্রদান করুন", my: "နောက်ထပ်အချက်အလက်ဖြည့်ရန်" },
  completeProfileDesc: { ko: "커뮤니티 이용을 위해 몇 가지 정보가 더 필요합니다.", zh: "使用社区还需要填写一些信息。", vi: "Cần thêm một vài thông tin để sử dụng cộng đồng.", en: "A few more details are needed to use the community.", mn: "Нийгэмлэгийг ашиглахын тулд зарим нэмэлт мэдээлэл шаардлагатай.", bn: "কমিউনিটি ব্যবহারের জন্য আরও কিছু তথ্য প্রয়োজন।", my: "အသိုင်းအဝိုင်းကို အသုံးပြုရန် နောက်ထပ်အချက်အလက်အနည်းငယ် လိုအပ်ပါသည်။" },
  // 비회원이 로그인 필요한 행동(상세보기/글쓰기/댓글/번역/연락/신고/내정보 등)을
  // 시도했을 때 뜨는 안내창 문구 — 2026-09-10 "회원가입 노출 방식 변경" 지시서.
  authGateDesc: { ko: "커뮤니티 활동을 하려면 회원가입이 필요합니다.", zh: "参与社区活动需要注册会员。", vi: "Bạn cần đăng ký để tham gia cộng đồng.", en: "Sign up to participate in the community.", mn: "Нийгэмлэгт оролцохын тулд бүртгүүлнэ үү.", bn: "কমিউনিটিতে অংশ নিতে নিবন্ধন করুন।", my: "အသိုင်းအဝိုင်းတွင် ပါဝင်ရန် အကောင့်ဖွင့်ပါ။" },
  authGateCancel: { ko: "취소", zh: "取消", vi: "Hủy", en: "Cancel", mn: "Цуцлах", bn: "বাতিল করুন", my: "ပယ်ဖျက်ရန်" }
};

/* 회원 메뉴/내 정보 */
var COMMUNITY_MY = {
  myPageTitle: { ko: "내 정보", zh: "我的信息", vi: "Thông tin của tôi", en: "My Info", mn: "Миний мэдээлэл", bn: "আমার তথ্য", my: "ကျွန်ုပ်၏အချက်အလက်" },
  myPosts: { ko: "내가 작성한 글", zh: "我写的帖子", vi: "Bài viết của tôi", en: "My Posts", mn: "Миний бичсэн зурвас", bn: "আমার লেখা পোস্ট", my: "ကျွန်ုပ်ရေးသားထားသောပို့စ်များ" },
  myComments: { ko: "내가 작성한 댓글", zh: "我写的评论", vi: "Bình luận của tôi", en: "My Comments", mn: "Миний сэтгэгдэл", bn: "আমার মন্তব্য", my: "ကျွန်ုပ်ရေးသားထားသောမှတ်ချက်များ" },
  savedPosts: { ko: "저장한 글", zh: "已保存的帖子", vi: "Bài đã lưu", en: "Saved Posts", mn: "Хадгалсан зурвас", bn: "সংরক্ষিত পোস্ট", my: "သိမ်းဆည်းထားသောပို့စ်များ" },
  editName: { ko: "이름 수정", zh: "修改姓名", vi: "Sửa họ tên", en: "Edit Name", mn: "Нэр засах", bn: "নাম সম্পাদনা", my: "အမည်ပြင်ဆင်ရန်" },
  editNationality: { ko: "국적 수정", zh: "修改国籍", vi: "Sửa quốc tịch", en: "Edit Nationality", mn: "Иргэншил засах", bn: "জাতীয়তা সম্পাদনা", my: "နိုင်ငံသားပြင်ဆင်ရန်" },
  editLang: { ko: "선택 언어 변경", zh: "更改语言", vi: "Đổi ngôn ngữ", en: "Change Language", mn: "Хэл солих", bn: "ভাষা পরিবর্তন", my: "ဘာသာစကားပြောင်းရန်" },
  editPassword: { ko: "비밀번호 변경", zh: "修改密码", vi: "Đổi mật khẩu", en: "Change Password", mn: "Нууц үг солих", bn: "পাসওয়ার্ড পরিবর্তন", my: "စကားဝှက်ပြောင်းရန်" },
  withdraw: { ko: "회원 탈퇴", zh: "注销账号", vi: "Xóa tài khoản", en: "Delete Account", mn: "Гишүүнчлэл цуцлах", bn: "সদস্যপদ বাতিল", my: "အသင်းဝင်ရပ်ဆိုင်းရန်" },
  withdrawConfirm: { ko: "정말 탈퇴하시겠습니까? 되돌릴 수 없습니다.", zh: "确定要注销吗？此操作无法撤销。", vi: "Bạn có chắc muốn xóa tài khoản? Không thể hoàn tác.", en: "Are you sure you want to delete your account? This cannot be undone.", mn: "Та гишүүнчлэлээ цуцлахдаа итгэлтэй байна уу? Буцаах боломжгүй.", bn: "আপনি কি সত্যিই সদস্যপদ বাতিল করতে চান? এটি ফিরিয়ে আনা যাবে না।", my: "သင်ဧကန်အသင်းဝင်ရပ်ဆိုင်းလိုပါသလား? ပြန်ပြင်၍မရပါ။" },
  save: { ko: "저장", zh: "保存", vi: "Lưu", en: "Save", mn: "Хадгалах", bn: "সংরক্ষণ", my: "သိမ်းဆည်းရန်" }
};

/* 게시글/댓글 작성, 상세, 목록, 검색 */
var COMMUNITY_POST = {
  writeTitle: { ko: "글쓰기", zh: "写帖子", vi: "Viết bài", en: "Write a Post", mn: "Зурвас бичих", bn: "পোস্ট লিখুন", my: "ပို့စ်ရေးရန်" },
  categoryLabel: { ko: "카테고리", zh: "分类", vi: "Danh mục", en: "Category", mn: "Ангилал", bn: "বিভাগ", my: "အမျိုးအစား" },
  titleLabel: { ko: "제목", zh: "标题", vi: "Tiêu đề", en: "Title", mn: "Гарчиг", bn: "শিরোনাম", my: "ခေါင်းစဉ်" },
  contentLabel: { ko: "본문", zh: "内容", vi: "Nội dung", en: "Content", mn: "Агуулга", bn: "বিষয়বস্তু", my: "အကြောင်းအရာ" },
  originalLangLabel: { ko: "원문 언어", zh: "原文语言", vi: "Ngôn ngữ gốc", en: "Original Language", mn: "Эх хэл", bn: "মূল ভাষা", my: "မူရင်းဘာသာစကား" },
  photoLabel: { ko: "사진 (최대 1장)", zh: "照片（最多1张）", vi: "Ảnh (tối đa 1 ảnh)", en: "Photo (up to 1)", mn: "Зураг (хамгийн ихдээ 1)", bn: "ছবি (সর্বোচ্চ ১টি)", my: "ဓာတ်ပုံ (အများဆုံး ၁ ပုံ)" },
  submitPost: { ko: "등록", zh: "发布", vi: "Đăng", en: "Post", mn: "Нийтлэх", bn: "পোস্ট করুন", my: "တင်ရန်" },
  editPost: { ko: "수정", zh: "编辑", vi: "Sửa", en: "Edit", mn: "Засах", bn: "সম্পাদনা", my: "ပြင်ဆင်ရန်" },
  deletePost: { ko: "삭제", zh: "删除", vi: "Xóa", en: "Delete", mn: "Устгах", bn: "মুছুন", my: "ဖျက်ရန်" },
  deleteConfirm: { ko: "정말 삭제하시겠습니까?", zh: "确定要删除吗？", vi: "Bạn có chắc muốn xóa?", en: "Are you sure you want to delete this?", mn: "Устгахдаа итгэлтэй байна уу?", bn: "আপনি কি সত্যিই মুছে ফেলতে চান?", my: "သင်ဧကန်ဖျက်လိုပါသလား?" },
  viewOriginal: { ko: "원문 보기", zh: "查看原文", vi: "Xem bản gốc", en: "View Original", mn: "Эх хувийг харах", bn: "মূল লেখা দেখুন", my: "မူရင်းစာကို ကြည့်ရန်" },
  viewTranslated: { ko: "선택 언어로 보기", zh: "查看翻译", vi: "Xem bản dịch", en: "View Translated", mn: "Орчуулгыг харах", bn: "নির্বাচিত ভাষায় দেখুন", my: "ရွေးချယ်ထားသောဘာသာစကားဖြင့်ကြည့်ရန်" },
  aiNotice: { ko: "AI로 번역된 내용입니다.", zh: "本内容由AI翻译。", vi: "Nội dung này được dịch bằng AI.", en: "This content was translated by AI.", mn: "Энэ агуулгыг AI орчуулсан.", bn: "এটি AI দ্বারা অনুবাদিত বিষয়বস্তু।", my: "ဤအကြောင်းအရာသည် AI ဖြင့်ဘာသာပြန်ထားခြင်းဖြစ်သည်။" },
  translateBtn: { ko: "선택한 언어로 번역하기", zh: "翻译成所选语言", vi: "Dịch sang ngôn ngữ đã chọn", en: "Translate to selected language", mn: "Сонгосон хэл рүү орчуулах", bn: "নির্বাচিত ভাষায় অনুবাদ করুন", my: "ရွေးချယ်ထားသောဘာသာသို့ ဘာသာပြန်ရန်" },
  translating: { ko: "번역 중입니다.", zh: "正在翻译中。", vi: "Đang dịch.", en: "Translating...", mn: "Орчуулж байна.", bn: "অনুবাদ করা হচ্ছে।", my: "ဘာသာပြန်နေပါသည်။" },
  quotaExceeded: { ko: "오늘의 번역 이용량을 초과했습니다. 원문으로 확인해 주세요.", zh: "今日翻译使用量已用完，请查看原文。", vi: "Đã vượt quá lượt dịch hôm nay. Vui lòng xem bản gốc.", en: "Today's translation quota has been used up. Please check the original text.", mn: "Өнөөдрийн орчуулгын хязгаарт хүрсэн байна. Эх хувиар нь харна уу.", bn: "আজকের অনুবাদের পরিমাণ শেষ হয়ে গেছে। মূল লেখা দেখুন।", my: "ယနေ့ ဘာသာပြန်အသုံးပြုနိုင်မှု ကျော်လွန်သွားပါပြီ။ မူရင်းစာဖြင့်ကြည့်ပါ။" },
  noPosts: { ko: "게시글이 없습니다.", zh: "暂无帖子。", vi: "Không có bài viết.", en: "No posts yet.", mn: "Зурвас алга байна.", bn: "কোনো পোস্ট নেই।", my: "ပို့စ်မရှိပါ။" },
  loading: { ko: "불러오는 중...", zh: "加载中...", vi: "Đang tải...", en: "Loading...", mn: "Ачааллаж байна...", bn: "লোড হচ্ছে...", my: "ဖွင့်နေပါသည်..." },
  searchPlaceholder: { ko: "제목·본문 검색", zh: "搜索标题·内容", vi: "Tìm tiêu đề, nội dung", en: "Search title/content", mn: "Гарчиг, агуулга хайх", bn: "শিরোনাম·বিষয়বস্তু খুঁজুন", my: "ခေါင်းစဉ်၊ အကြောင်းအရာရှာရန်" },
  sortLatest: { ko: "최신순", zh: "最新", vi: "Mới nhất", en: "Latest", mn: "Хамгийн сүүлийн", bn: "সাম্প্রতিক", my: "အသစ်ဆုံး" },
  sortComments: { ko: "댓글 많은 순", zh: "评论最多", vi: "Nhiều bình luận nhất", en: "Most Commented", mn: "Хамгийн олон сэтгэгдэлтэй", bn: "সর্বাধিক মন্তব্য", my: "မှတ်ချက်အများဆုံး" },
  loadMore: { ko: "더보기", zh: "查看更多", vi: "Xem thêm", en: "Load more", mn: "Дэлгэрэнгүй", bn: "আরও দেখুন", my: "ပိုမိုကြည့်ရန်" },
  detailBtn: { ko: "자세히 보기", zh: "查看详情", vi: "Xem chi tiết", en: "View Details", mn: "Дэлгэрэнгүй үзэх", bn: "বিস্তারিত দেখুন", my: "အသေးစိတ်ကြည့်ရန်" },
  commentCount: { ko: "댓글", zh: "评论", vi: "Bình luận", en: "Comments", mn: "Сэтгэгдэл", bn: "মন্তব্য", my: "မှတ်ချက်" },
  saveBtn: { ko: "저장", zh: "收藏", vi: "Lưu", en: "Save", mn: "Хадгалах", bn: "সংরক্ষণ", my: "သိမ်းဆည်းရန်" },
  unsaveBtn: { ko: "저장 취소", zh: "取消收藏", vi: "Bỏ lưu", en: "Unsave", mn: "Хадгалахыг цуцлах", bn: "সংরক্ষণ বাতিল", my: "သိမ်းဆည်းမှုပယ်ဖျက်ရန်" },
  kakaoWarn: { ko: "개인정보 공개와 오프라인 만남에 주의하세요.", zh: "请注意个人信息公开及线下见面的风险。", vi: "Hãy cẩn thận khi công khai thông tin cá nhân và gặp mặt ngoài đời.", en: "Be careful about sharing personal info and meeting offline.", mn: "Хувийн мэдээлэл ил гарах, гадуур уулзахаас болгоомжлоорой.", bn: "ব্যক্তিগত তথ্য প্রকাশ এবং অফলাইন সাক্ষাতে সতর্ক থাকুন।", my: "ကိုယ်ရေးအချက်အလက်ဖော်ပြခြင်းနှင့် အော့ဖ်လိုင်းတွေ့ဆုံခြင်းတွင် သတိထားပါ။" },
  kakaoBtn: { ko: "카카오톡 오픈채팅", zh: "KakaoTalk 开放聊天", vi: "KakaoTalk Open Chat", en: "KakaoTalk Open Chat", mn: "KakaoTalk нээлттэй чат", bn: "কাকাওটক ওপেন চ্যাট", my: "KakaoTalk Open Chat" }
};

/* 중고거래 */
var COMMUNITY_MARKET = {
  dealTypeSell: { ko: "판매", zh: "出售", vi: "Bán", en: "Sell", mn: "Зарах", bn: "বিক্রয়", my: "ရောင်းရန်" },
  dealTypeBuy: { ko: "구매", zh: "求购", vi: "Mua", en: "Buy", mn: "Худалдан авах", bn: "ক্রয়", my: "ဝယ်ရန်" },
  priceLabel: { ko: "가격", zh: "价格", vi: "Giá", en: "Price", mn: "Үнэ", bn: "মূল্য", my: "ဈေးနှုန်း" },
  freeShare: { ko: "무료 나눔", zh: "免费赠送", vi: "Tặng miễn phí", en: "Free Giveaway", mn: "Үнэгүй хуваалцах", bn: "ফ্রি বিতরণ", my: "အခမဲ့ ဝေမျှခြင်း" },
  locationLabel: { ko: "거래 희망 장소", zh: "交易地点", vi: "Địa điểm giao dịch", en: "Preferred Location", mn: "Худалдааны байршил", bn: "লেনদেনের স্থান", my: "ရောင်းဝယ်လိုသည့်နေရာ" },
  conditionLabel: { ko: "물품 상태", zh: "物品状态", vi: "Tình trạng đồ", en: "Item Condition", mn: "Барааны байдал", bn: "পণ্যের অবস্থা", my: "ပစ္စည်းအခြေအနေ" },
  statusLabel: { ko: "거래 상태", zh: "交易状态", vi: "Trạng thái giao dịch", en: "Deal Status", mn: "Худалдааны төлөв", bn: "লেনদেনের অবস্থা", my: "ရောင်းဝယ်မှုအခြေအနေ" },
  statusSelling: { ko: "판매 중", zh: "出售中", vi: "Đang bán", en: "Selling", mn: "Зарж байна", bn: "বিক্রয় চলছে", my: "ရောင်းနေဆဲ" },
  statusReserved: { ko: "예약 중", zh: "已预订", vi: "Đã đặt trước", en: "Reserved", mn: "Захиалагдсан", bn: "বুকিং হয়েছে", my: "ကြိုတင်မှာထားသည်" },
  statusDone: { ko: "거래 완료", zh: "交易完成", vi: "Đã giao dịch", en: "Sold", mn: "Худалдаа дууссан", bn: "লেনদেন সম্পন্ন", my: "ရောင်းပြီးပါပြီ" },
  statusFree: { ko: "무료 나눔", zh: "免费赠送", vi: "Tặng miễn phí", en: "Free", mn: "Үнэгүй", bn: "ফ্রি", my: "အခမဲ့" },
  hideDone: { ko: "거래 완료 게시물 숨기기", zh: "隐藏已完成交易", vi: "Ẩn bài đã giao dịch", en: "Hide completed deals", mn: "Дууссан худалдааг нуух", bn: "সম্পন্ন পোস্ট লুকান", my: "ပြီးစီးသောပို့စ်များဖျောက်ရန်" },
  extend: { ko: "30일 연장", zh: "延长30天", vi: "Gia hạn 30 ngày", en: "Extend 30 days", mn: "30 хоногоор сунгах", bn: "৩০ দিন বাড়ান", my: "၃၀ ရက်တိုးရန်" },
  safetyNotice: { ko: "학교 안의 공개된 장소에서 만나고 송금 전에 물건을 직접 확인하세요.", zh: "请在学校内的公开场所见面，转账前请务必确认物品。", vi: "Hãy gặp ở nơi công cộng trong trường và kiểm tra hàng trước khi chuyển khoản.", en: "Meet in a public place on campus and check the item before paying.", mn: "Сургуулийн нээлттэй газарт уулзаж, мөнгө шилжүүлэхийн өмнө барааг өөрөө шалгаарай.", bn: "স্কুলের ভেতরে প্রকাশ্য স্থানে দেখা করুন এবং টাকা পাঠানোর আগে পণ্য সরাসরি পরীক্ষা করুন।", my: "ကျောင်းအတွင်းရှိ လူသိရှင်ကြားနေရာတွင်တွေ့ဆုံပြီး ငွေလွှဲမပေးမီ ပစ္စည်းကိုကိုယ်တိုင်စစ်ဆေးပါ။" }
};

/* 도움 요청 */
var COMMUNITY_HELP = {
  statusLabel: { ko: "상태", zh: "状态", vi: "Trạng thái", en: "Status", mn: "Төлөв", bn: "অবস্থা", my: "အခြေအနေ" },
  statusNeeded: { ko: "도움 필요", zh: "需要帮助", vi: "Cần giúp đỡ", en: "Help Needed", mn: "Тусламж хэрэгтэй", bn: "সাহায্য প্রয়োজন", my: "အကူအညီလိုအပ်သည်" },
  statusInProgress: { ko: "해결 중", zh: "处理中", vi: "Đang xử lý", en: "In Progress", mn: "Шийдвэрлэж байна", bn: "সমাধান চলছে", my: "ဖြေရှင်းနေဆဲ" },
  statusResolved: { ko: "해결 완료", zh: "已解决", vi: "Đã giải quyết", en: "Resolved", mn: "Шийдэгдсэн", bn: "সমাধান হয়েছে", my: "ဖြေရှင်းပြီးပါပြီ" },
  typeLabel: { ko: "분류", zh: "分类", vi: "Phân loại", en: "Type", mn: "Төрөл", bn: "শ্রেণী", my: "အမျိုးအစား" },
  typeSchool: { ko: "학교생활", zh: "校园生活", vi: "Đời sống học đường", en: "School Life", mn: "Сургуулийн амьдрал", bn: "স্কুল জীবন", my: "ကျောင်းဘဝ" },
  typeKorean: { ko: "한국어", zh: "韩语", vi: "Tiếng Hàn", en: "Korean Language", mn: "Солонгос хэл", bn: "কোরিয়ান ভাষা", my: "ကိုရီးယားစာ" },
  typeHospital: { ko: "병원", zh: "医院", vi: "Bệnh viện", en: "Hospital", mn: "Эмнэлэг", bn: "হাসপাতাল", my: "ဆေးရုံ" },
  typeTransport: { ko: "교통", zh: "交通", vi: "Giao thông", en: "Transportation", mn: "Тээвэр", bn: "পরিবহন", my: "သယ်ယူပို့ဆောင်ရေး" },
  typeAdmin: { ko: "행정", zh: "行政", vi: "Hành chính", en: "Administration", mn: "Захиргаа", bn: "প্রশাসন", my: "အုပ်ချုပ်ရေး" },
  typeLost: { ko: "분실물", zh: "失物招领", vi: "Đồ thất lạc", en: "Lost & Found", mn: "Алдагдсан зүйл", bn: "হারানো জিনিস", my: "ပျောက်ဆုံးပစ္စည်း" },
  typeLife: { ko: "생활 도움", zh: "生活帮助", vi: "Hỗ trợ sinh hoạt", en: "Daily Help", mn: "Амьдралын тусламж", bn: "জীবনযাত্রার সাহায্য", my: "နေထိုင်မှုအကူအညီ" },
  typeEtc: { ko: "기타", zh: "其他", vi: "Khác", en: "Other", mn: "Бусад", bn: "অন্যান্য", my: "အခြား" },
  emergencyNotice: { ko: "긴급하거나 위험한 상황은 경찰, 학교 담당 부서 등 공식 기관에 연락하세요.", zh: "紧急或危险情况请联系警察或学校相关部门等官方机构。", vi: "Trường hợp khẩn cấp hoặc nguy hiểm, hãy liên hệ công an hoặc bộ phận phụ trách của trường.", en: "For urgent or dangerous situations, contact the police or your school's official office.", mn: "Яаралтай, аюултай тохиолдолд цагдаа, сургуулийн албан ёсны газарт хандана уу.", bn: "জরুরি বা বিপজ্জনক পরিস্থিতিতে পুলিশ, বিশ্ববিদ্যালয়ের সংশ্লিষ্ট বিভাগের মতো সরকারি প্রতিষ্ঠানে যোগাযোগ করুন।", my: "အရေးပေါ်သို့မဟုတ်အန္တရာယ်ရှိသောအခြေအနေများတွင် ရဲသို့မဟုတ်ကျောင်း၏တာဝန်ရှိဌာနကဲ့သို့သောတရားဝင်အဖွဲ့အစည်းသို့ ဆက်သွယ်ပါ။" }
};

/* 구인·구직 (2026-09-10, "생활정보" 카테고리를 대체) */
var COMMUNITY_JOB = {
  typeLabel: { ko: "구분", zh: "类型", vi: "Loại", en: "Type", mn: "Төрөл", bn: "ধরন", my: "အမျိုးအစား" },
  typeHiring: { ko: "구인", zh: "招聘", vi: "Tuyển dụng", en: "Hiring", mn: "Ажилтан авах", bn: "নিয়োগ", my: "အလုပ်ခေါ်ယူခြင်း" },
  typeSeeking: { ko: "구직", zh: "求职", vi: "Tìm việc", en: "Looking for Work", mn: "Ажил хайх", bn: "চাকরি খোঁজা", my: "အလုပ်ရှာဖွေခြင်း" },
  statusLabel: { ko: "상태", zh: "状态", vi: "Trạng thái", en: "Status", mn: "Төлөв", bn: "অবস্থা", my: "အခြေအနေ" },
  statusOpen: { ko: "모집 중", zh: "招聘中", vi: "Đang tuyển", en: "Open", mn: "Авч байна", bn: "নিয়োগ চলছে", my: "ခေါ်ယူနေဆဲ" },
  statusClosed: { ko: "모집 마감", zh: "招聘已结束", vi: "Đã ngừng tuyển", en: "Closed", mn: "Дууссан", bn: "নিয়োগ বন্ধ", my: "ခေါ်ယူမှုပိတ်ပြီ" },
  statusSeeking: { ko: "구직 중", zh: "求职中", vi: "Đang tìm việc", en: "Seeking", mn: "Ажил хайж байна", bn: "চাকরি খোঁজা হচ্ছে", my: "အလုပ်ရှာနေဆဲ" },
  statusDone: { ko: "구직 완료", zh: "已找到工作", vi: "Đã tìm được việc", en: "Found a job", mn: "Ажил олдсон", bn: "চাকরি পেয়েছেন", my: "အလုပ်ရရှိပြီ" },

  industryLabel: { ko: "업종", zh: "行业", vi: "Ngành nghề", en: "Industry", mn: "Салбар", bn: "শিল্প", my: "လုပ်ငန်းအမျိုးအစား" },
  workLocationLabel: { ko: "근무 장소", zh: "工作地点", vi: "Địa điểm làm việc", en: "Work Location", mn: "Ажлын байршил", bn: "কর্মস্থল", my: "အလုပ်ချိန်နေရာ" },
  jobDescriptionLabel: { ko: "업무 내용", zh: "工作内容", vi: "Nội dung công việc", en: "Job Description", mn: "Ажлын агуулга", bn: "কাজের বিবরণ", my: "အလုပ်ဖော်ပြချက်" },
  workDaysLabel: { ko: "근무 요일", zh: "工作日", vi: "Ngày làm việc", en: "Work Days", mn: "Ажиллах өдөр", bn: "কর্মদিবস", my: "အလုပ်လုပ်ရက်" },
  workHoursLabel: { ko: "근무시간", zh: "工作时间", vi: "Giờ làm việc", en: "Work Hours", mn: "Ажиллах цаг", bn: "কর্মঘণ্টা", my: "အလုပ်ချိန်" },
  salaryLabel: { ko: "급여", zh: "薪资", vi: "Lương", en: "Salary", mn: "Цалин", bn: "বেতন", my: "လစာ" },
  deadlineLabel: { ko: "모집 마감일", zh: "招聘截止日期", vi: "Hạn tuyển dụng", en: "Application Deadline", mn: "Өргөдлийн эцсийн хугацаа", bn: "আবেদনের শেষ তারিখ", my: "လျှောက်လွှာပိတ်ရက်" },
  contactMethodLabel: { ko: "연락방법", zh: "联系方式", vi: "Cách liên hệ", en: "Contact Method", mn: "Холбоо барих арга", bn: "যোগাযোগের পদ্ধতি", my: "ဆက်သွယ်ရန်နည်းလမ်း" },
  koreanLevelLabel: { ko: "한국어 능력", zh: "韩语水平", vi: "Trình độ tiếng Hàn", en: "Korean Level", mn: "Солонгос хэлний түвшин", bn: "কোরিয়ান ভাষার দক্ষতা", my: "ကိုရီးယားဘာသာအရည်အချင်း" },
  experienceLabel: { ko: "경력", zh: "工作经验", vi: "Kinh nghiệm", en: "Experience", mn: "Туршлага", bn: "অভিজ্ঞতা", my: "အတွေ့အကြုံ" },

  desiredIndustryLabel: { ko: "희망 업종", zh: "希望从事的行业", vi: "Ngành nghề mong muốn", en: "Desired Industry", mn: "Хүссэн салбар", bn: "কাঙ্ক্ষিত শিল্প", my: "လိုချင်သောလုပ်ငန်းအမျိုးအစား" },
  availableDaysLabel: { ko: "가능한 요일", zh: "可工作日", vi: "Ngày có thể làm", en: "Available Days", mn: "Ажиллах боломжтой өдөр", bn: "সম্ভাব্য দিন", my: "အလုပ်လုပ်နိုင်သောရက်" },
  availableHoursLabel: { ko: "가능한 시간", zh: "可工作时间", vi: "Giờ có thể làm", en: "Available Hours", mn: "Ажиллах боломжтой цаг", bn: "সম্ভাব্য সময়", my: "အလုပ်လုပ်နိုင်သောအချိန်" },
  desiredLocationLabel: { ko: "희망 근무지역", zh: "希望工作地区", vi: "Khu vực mong muốn làm việc", en: "Desired Work Area", mn: "Хүссэн ажлын байршил", bn: "কাঙ্ক্ষিত কর্মস্থল", my: "လိုချင်သောအလုပ်ဒေသ" },
  availableLanguagesLabel: { ko: "사용 가능한 언어", zh: "可使用的语言", vi: "Ngôn ngữ có thể sử dụng", en: "Languages Spoken", mn: "Ашиглаж чадах хэл", bn: "ব্যবহারযোগ্য ভাষা", my: "ပြောဆိုနိုင်သောဘာသာစကား" },

  extend: { ko: "30일 연장", zh: "延长30天", vi: "Gia hạn 30 ngày", en: "Extend 30 days", mn: "30 хоногоор сунгах", bn: "৩০ দিন বাড়ান", my: "၃၀ ရက်တိုးရန်" },
  safetyNotice: { ko: "근무 전 사업장과 근로조건을 직접 확인하세요. 취업을 대가로 돈이나 개인정보를 요구하는 게시글에 주의하세요.", zh: "上班前请亲自确认工作单位和劳动条件。请警惕以就业为由索要钱财或个人信息的帖子。", vi: "Hãy tự xác nhận nơi làm việc và điều kiện lao động trước khi bắt đầu. Cẩn thận với các bài đăng yêu cầu tiền hoặc thông tin cá nhân để đổi lấy việc làm.", en: "Check the workplace and working conditions yourself before starting. Be cautious of posts asking for money or personal information in exchange for a job.", mn: "Ажилдаа орохын өмнө ажлын байр, нөхцөлийг өөрөө шалгаарай. Ажилд оруулах нэрээр мөнгө, хувийн мэдээлэл шаардсан зурвасаас болгоомжлоорой.", bn: "কাজ শুরুর আগে প্রতিষ্ঠান ও কাজের শর্তাবলী নিজে যাচাই করুন। চাকরির বিনিময়ে অর্থ বা ব্যক্তিগত তথ্য চাওয়া পোস্ট সম্পর্কে সতর্ক থাকুন।", my: "အလုပ်မစတင်မီ လုပ်ငန်းခွင်နှင့် အလုပ်အခြေအနေများကို ကိုယ်တိုင်စစ်ဆေးပါ။ အလုပ်ရရှိရေးအတွက် ငွေ သို့မဟုတ် ကိုယ်ရေးအချက်အလက်တောင်းသောပို့စ်များကို သတိထားပါ။" },
  personalInfoWarning: { ko: "전화번호, 이메일, 계좌번호, 외국인등록번호, 여권번호, 상세주소 같은 개인정보가 포함된 것 같습니다. 다시 확인해 주세요.", zh: "内容中似乎包含电话号码、邮箱、账户、外国人登录证号、护照号、详细地址等个人信息，请再次确认。", vi: "Nội dung có vẻ chứa thông tin cá nhân như số điện thoại, email, số tài khoản, số đăng ký người nước ngoài, số hộ chiếu, địa chỉ chi tiết. Vui lòng kiểm tra lại.", en: "Your post seems to contain personal information such as a phone number, email, bank account, registration number, passport number, or detailed address. Please double-check.", mn: "Таны зурвас утасны дугаар, и-мэйл, дансны дугаар, гадаадын иргэний бүртгэлийн дугаар, паспортын дугаар, дэлгэрэнгүй хаяг зэрэг хувийн мэдээлэл агуулж байж болзошгүй байна. Дахин шалгана уу.", bn: "আপনার পোস্টে ফোন নম্বর, ইমেইল, অ্যাকাউন্ট নম্বর, বিদেশি নিবন্ধন নম্বর, পাসপোর্ট নম্বর বা বিস্তারিত ঠিকানার মতো ব্যক্তিগত তথ্য থাকতে পারে। অনুগ্রহ করে আবার যাচাই করুন।", my: "သင်၏ပို့စ်တွင် ဖုန်းနံပါတ်၊ အီးမေးလ်၊ အကောင့်နံပါတ်၊ နိုင်ငံခြားသားမှတ်ပုံတင်နံပါတ်၊ နိုင်ငံကူးလက်မှတ်နံပါတ် သို့မဟုတ် အသေးစိတ်လိပ်စာကဲ့သို့သော ကိုယ်ရေးအချက်အလက်ပါဝင်နေပုံရသည်။ ပြန်လည်စစ်ဆေးပါ။" },
  bannedContentError: { ko: "취업 관련 금지된 내용이 포함되어 있어 등록할 수 없습니다(금전 요구, 신분증·통장 양도, 외국인등록번호·여권 보관 요구 등).", zh: "内容包含被禁止的求职相关信息（如索要钱财、转让身份证/账户、要求保管外国人登录证或护照等），无法发布。", vi: "Không thể đăng vì nội dung chứa thông tin bị cấm liên quan đến việc làm (yêu cầu tiền, chuyển nhượng CMND/tài khoản, giữ số đăng ký người nước ngoài/hộ chiếu, v.v.).", en: "This cannot be posted because it contains prohibited job-related content (requests for money, ID/bank account transfer, holding registration cards or passports, etc.).", mn: "Мөнгө шаардах, иргэний үнэмлэх/дансаа шилжүүлэх, гадаадын иргэний бүртгэл/паспортоо хадгалуулах гэх мэт хориотой ажлын агуулга орсон тул нийтлэх боломжгүй.", bn: "চাকরি সম্পর্কিত নিষিদ্ধ বিষয়বস্তু (অর্থ দাবি, পরিচয়পত্র/অ্যাকাউন্ট হস্তান্তর, বিদেশি নিবন্ধন নম্বর/পাসপোর্ট জমা রাখার দাবি ইত্যাদি) থাকায় পোস্ট করা যাবে না।", my: "အလုပ်နှင့်ပတ်သက်သော တားမြစ်ထားသောအကြောင်းအရာ (ငွေတောင်းခံခြင်း၊ ID/အကောင့်လွှဲပြောင်းခြင်း၊ နိုင်ငံခြားသားမှတ်ပုံတင်/နိုင်ငံကူးလက်မှတ်ထိန်းသိမ်းရန်တောင်းဆိုခြင်း စသည်) ပါဝင်နေသဖြင့် တင်၍မရပါ။" },

  filterAll: { ko: "전체", zh: "全部", vi: "Tất cả", en: "All", mn: "Бүгд", bn: "সব", my: "အားလုံး" },
  openOnlyLabel: { ko: "모집 중만 보기", zh: "只看招聘中", vi: "Chỉ xem đang tuyển", en: "Show open only", mn: "Зөвхөн авч байгааг харах", bn: "শুধু নিয়োগ চলমান দেখুন", my: "ခေါ်ယူနေဆဲသာကြည့်ရန်" },
  industryFilterPlaceholder: { ko: "업종 검색", zh: "搜索行业", vi: "Tìm ngành nghề", en: "Search industry", mn: "Салбар хайх", bn: "শিল্প খুঁজুন", my: "လုပ်ငန်းအမျိုးအစားရှာရန်" },
  locationFilterPlaceholder: { ko: "근무지역 검색", zh: "搜索工作地区", vi: "Tìm khu vực làm việc", en: "Search location", mn: "Байршил хайх", bn: "কর্মস্থল খুঁজুন", my: "အလုပ်ဒေသရှာရန်" }
};

/* 댓글 */
var COMMUNITY_COMMENT = {
  writeLabel: { ko: "댓글 작성", zh: "写评论", vi: "Viết bình luận", en: "Write a Comment", mn: "Сэтгэгдэл бичих", bn: "মন্তব্য লিখুন", my: "မှတ်ချက်ရေးရန်" },
  submitComment: { ko: "등록", zh: "发布", vi: "Đăng", en: "Post", mn: "Нийтлэх", bn: "পোস্ট করুন", my: "တင်ရန်" },
  replyLabel: { ko: "답글", zh: "回复", vi: "Trả lời", en: "Reply", mn: "Хариулах", bn: "উত্তর", my: "ပြန်စာ" },
  editComment: { ko: "수정", zh: "编辑", vi: "Sửa", en: "Edit", mn: "Засах", bn: "সম্পাদনা", my: "ပြင်ဆင်ရန်" },
  deleteComment: { ko: "삭제", zh: "删除", vi: "Xóa", en: "Delete", mn: "Устгах", bn: "মুছুন", my: "ဖျက်ရန်" },
  viewOriginal: { ko: "원문 보기", zh: "查看原文", vi: "Xem bản gốc", en: "View Original", mn: "Эх хувийг харах", bn: "মূল লেখা দেখুন", my: "မူရင်းစာကို ကြည့်ရန်" },
  viewTranslated: { ko: "번역 보기", zh: "查看翻译", vi: "Xem bản dịch", en: "View Translation", mn: "Орчуулга харах", bn: "অনুবাদ দেখুন", my: "ဘာသာပြန်ကို ကြည့်ရန်" },
  translating: { ko: "번역 중...", zh: "翻译中...", vi: "Đang dịch...", en: "Translating...", mn: "Орчуулж байна...", bn: "অনুবাদ হচ্ছে...", my: "ဘာသာပြန်နေဆဲ..." },
  noComments: { ko: "댓글이 없습니다.", zh: "暂无评论。", vi: "Chưa có bình luận.", en: "No comments yet.", mn: "Сэтгэгдэл алга.", bn: "কোনো মন্তব্য নেই।", my: "မှတ်ချက်မရှိပါ။" }
};

/* 신고 */
var COMMUNITY_REPORT = {
  reportBtn: { ko: "신고하기", zh: "举报", vi: "Báo cáo", en: "Report", mn: "Мэдээлэх", bn: "রিপোর্ট করুন", my: "တိုင်ကြားရန်" },
  reportTitle: { ko: "신고 사유 선택", zh: "选择举报原因", vi: "Chọn lý do báo cáo", en: "Select Report Reason", mn: "Мэдээлэх шалтгаанаа сонгоно уу", bn: "রিপোর্টের কারণ নির্বাচন করুন", my: "တိုင်ကြားရသည့်အကြောင်းရင်းရွေးပါ" },
  reasonScam: { ko: "사기 의심", zh: "疑似诈骗", vi: "Nghi ngờ lừa đảo", en: "Suspected Scam", mn: "Залилан гэж сэжиглэгдэж байна", bn: "প্রতারণার সন্দেহ", my: "လိမ်လည်မှုဖြစ်နိုင်ချေ" },
  reasonAbuse: { ko: "욕설·괴롭힘", zh: "辱骂·骚扰", vi: "Lăng mạ/quấy rối", en: "Abuse/Harassment", mn: "Доромжлол/дарамт", bn: "গালিগালাজ/হয়রানি", my: "ကျိန်ဆဲခြင်း/နှောင့်ယှက်ခြင်း" },
  reasonPrivacy: { ko: "개인정보 노출", zh: "个人信息泄露", vi: "Lộ thông tin cá nhân", en: "Privacy Exposure", mn: "Хувийн мэдээлэл ил гарсан", bn: "ব্যক্তিগত তথ্য ফাঁস", my: "ကိုယ်ရေးအချက်အလက်ပေါက်ကြားခြင်း" },
  reasonIllegal: { ko: "불법 또는 위험 물품", zh: "非法或危险物品", vi: "Hàng hóa bất hợp pháp/nguy hiểm", en: "Illegal/Dangerous Item", mn: "Хууль бус эсвэл аюултай бараа", bn: "অবৈধ বা বিপজ্জনক পণ্য", my: "တရားမဝင် သို့မဟုတ် အန္တရာယ်ရှိသောပစ္စည်း" },
  reasonAd: { ko: "광고·도배", zh: "广告·刷屏", vi: "Quảng cáo/spam", en: "Ad/Spam", mn: "Сурталчилгаа/спам", bn: "বিজ্ঞাপন/স্প্যাম", my: "ကြော်ငြာ/စပမ်း" },
  reasonMeet: { ko: "부적절한 만남 요구", zh: "不当约见要求", vi: "Yêu cầu gặp mặt không phù hợp", en: "Inappropriate Meeting Request", mn: "Зохисгүй уулзалт хүсэлт", bn: "অনুপযুক্ত সাক্ষাতের অনুরোধ", my: "မသင့်လျော်သောတွေ့ဆုံမှုတောင်းဆိုခြင်း" },
  reasonEtc: { ko: "기타", zh: "其他", vi: "Khác", en: "Other", mn: "Бусад", bn: "অন্যান্য", my: "အခြား" },
  submitReport: { ko: "신고 제출", zh: "提交举报", vi: "Gửi báo cáo", en: "Submit Report", mn: "Мэдээллийг илгээх", bn: "রিপোর্ট জমা দিন", my: "တိုင်ကြားချက်တင်ရန်" },
  reportDone: { ko: "신고가 접수되었습니다.", zh: "举报已提交。", vi: "Đã gửi báo cáo.", en: "Report submitted.", mn: "Мэдээлэл хүлээн авагдлаа.", bn: "রিপোর্ট গ্রহণ করা হয়েছে।", my: "တိုင်ကြားချက်လက်ခံရရှိပါပြီ။" },
  alreadyReported: { ko: "이미 신고한 게시물입니다.", zh: "您已举报过该内容。", vi: "Bạn đã báo cáo nội dung này.", en: "You have already reported this.", mn: "Та энэ зурвасыг аль хэдийн мэдээлсэн байна.", bn: "আপনি ইতিমধ্যে এটি রিপোর্ট করেছেন।", my: "သင်ဤပို့စ်ကို တိုင်ကြားပြီးဖြစ်သည်။" },
  hiddenNotice: { ko: "신고가 누적되어 임시 숨김 처리되었습니다.", zh: "因举报累计已被临时隐藏。", vi: "Đã bị ẩn tạm thời do bị báo cáo nhiều lần.", en: "This has been temporarily hidden due to multiple reports.", mn: "Олон удаа мэдээлэгдсэний улмаас түр нуугдлаа.", bn: "একাধিক রিপোর্টের কারণে এটি সাময়িকভাবে লুকানো হয়েছে।", my: "တိုင်ကြားချက်များစုပုံလာသဖြင့် ယာယီဖျောက်ထားပါသည်။" }
};

/* 개인정보 동의 / 이용규칙 화면 */
var COMMUNITY_CONSENT = {
  privacyTitle: { ko: "개인정보처리방침", zh: "隐私政策", vi: "Chính sách bảo mật", en: "Privacy Policy", mn: "Хувийн мэдээллийн бодлого", bn: "গোপনীয়তা নীতি", my: "ကိုယ်ရေးအချက်အလက်မူဝါဒ" },
  rulesTitle: { ko: "커뮤니티 이용규칙", zh: "社区使用规则", vi: "Quy tắc cộng đồng", en: "Community Rules", mn: "Нийгэмлэгийн дүрэм", bn: "কমিউনিটি ব্যবহারের নিয়ম", my: "အသိုင်းအဝိုင်းအသုံးပြုစည်းမျဉ်း" },
  collectItems: { ko: "수집정보: 이름, 국적, 이메일, 선택 언어", zh: "收集信息：姓名、国籍、邮箱、使用语言", vi: "Thông tin thu thập: Họ tên, quốc tịch, email, ngôn ngữ sử dụng", en: "Collected: Name, Nationality, Email, Preferred Language", mn: "Цуглуулах мэдээлэл: Нэр, иргэншил, и-мэйл, ашиглах хэл", bn: "সংগৃহীত তথ্য: নাম, জাতীয়তা, ইমেইল, ব্যবহারের ভাষা", my: "စုဆောင်းသည့်အချက်အလက်: အမည်၊ နိုင်ငံသား၊ အီးမေးလ်၊ အသုံးပြုမည့်ဘာသာစကား" },
  purpose: { ko: "이용목적: 회원 확인, 커뮤니티 운영, 다국어 서비스 제공, 신고 처리, 부정 이용 방지", zh: "使用目的：会员确认、社区运营、多语言服务、举报处理、防止滥用", vi: "Mục đích: Xác thực thành viên, vận hành cộng đồng, dịch vụ đa ngôn ngữ, xử lý báo cáo, ngăn chặn lạm dụng", en: "Purpose: Member verification, community operation, multilingual service, report handling, abuse prevention", mn: "Зорилго: Гишүүнчлэл баталгаажуулах, нийгэмлэг ажиллуулах, олон хэлний үйлчилгээ, гомдол шийдвэрлэх, буруу ашиглалтаас сэргийлэх", bn: "ব্যবহারের উদ্দেশ্য: সদস্য যাচাই, কমিউনিটি পরিচালনা, বহুভাষিক সেবা প্রদান, রিপোর্ট প্রক্রিয়াকরণ, অপব্যবহার প্রতিরোধ", my: "အသုံးပြုရည်ရွယ်ချက်: အဖွဲ့ဝင်စစ်ဆေးခြင်း၊ အသိုင်းအဝိုင်းလည်ပတ်ခြင်း၊ ဘာသာစကားများစွာဝန်ဆောင်မှု၊ တိုင်ကြားချက်ဖြေရှင်းခြင်း၊ အလွဲသုံးစားမှုကာကွယ်ခြင်း" },
  retention: { ko: "보유기간: 회원 탈퇴 시까지(관계 법령상 보관 의무가 있는 경우 해당 기간)", zh: "保留期限：至注销为止（如法律要求保存的情况按相关期限）", vi: "Thời hạn lưu trữ: Đến khi xóa tài khoản (theo quy định pháp luật nếu có)", en: "Retention: Until account deletion (or as required by applicable law)", mn: "Хадгалах хугацаа: Гишүүнчлэл цуцлах хүртэл (хууль тогтоомжийн дагуу хадгалах шаардлагатай бол тухайн хугацаагаар)", bn: "সংরক্ষণকাল: সদস্যপদ বাতিল না হওয়া পর্যন্ত (সংশ্লিষ্ট আইন অনুযায়ী সংরক্ষণ বাধ্যতামূলক হলে সেই সময়কাল)", my: "ထိန်းသိမ်းမည့်ကာလ: အသင်းဝင်ရပ်ဆိုင်းသည်အထိ (သက်ဆိုင်ရာဥပဒေအရ ထိန်းသိမ်းရန်တာဝန်ရှိပါက ထိုကာလအထိ)" }
};

/* 공통 오류/완료 메시지 */
var COMMUNITY_MSG = {
  errRequired: { ko: "필수 항목을 모두 입력해 주세요.", zh: "请填写所有必填项。", vi: "Vui lòng điền đầy đủ thông tin bắt buộc.", en: "Please fill in all required fields.", mn: "Заавал бөглөх бүх талбарыг бөглөнө үү.", bn: "অনুগ্রহ করে সমস্ত আবশ্যক তথ্য পূরণ করুন।", my: "လိုအပ်သောအချက်အလက်အားလုံးဖြည့်ပါ။" },
  errPasswordMismatch: { ko: "비밀번호가 일치하지 않습니다.", zh: "两次输入的密码不一致。", vi: "Mật khẩu xác nhận không khớp.", en: "Passwords do not match.", mn: "Нууц үг таарахгүй байна.", bn: "পাসওয়ার্ড মিলছে না।", my: "စကားဝှက်များမတူညီပါ။" },
  errEmailInUse: { ko: "이미 사용 중인 이메일입니다.", zh: "该邮箱已被使用。", vi: "Email này đã được sử dụng.", en: "This email is already in use.", mn: "Энэ и-мэйл хаяг аль хэдийн ашиглагдаж байна.", bn: "এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হচ্ছে।", my: "ဤအီးမေးလ်ကို အသုံးပြုပြီးဖြစ်သည်။" },
  errLogin: { ko: "이메일 또는 비밀번호가 올바르지 않습니다.", zh: "邮箱或密码不正确。", vi: "Email hoặc mật khẩu không đúng.", en: "Incorrect email or password.", mn: "И-мэйл эсвэл нууц үг буруу байна.", bn: "ইমেইল বা পাসওয়ার্ড সঠিক নয়।", my: "အီးမေးလ် သို့မဟုတ် စကားဝှက်မှားနေသည်။" },
  errPhotoLimit: { ko: "사진은 1장만 첨부할 수 있습니다.", zh: "只能上传1张照片。", vi: "Chỉ có thể đính kèm 1 ảnh.", en: "You can attach only 1 photo.", mn: "Зөвхөн 1 зураг хавсаргах боломжтой.", bn: "শুধুমাত্র ১টি ছবি সংযুক্ত করা যাবে।", my: "ဓာတ်ပုံ ၁ ပုံသာ ပူးတွဲနိုင်ပါသည်။" },
  errPhotoTooLarge: { ko: "사진 용량이 너무 커서 압축 후에도 등록할 수 없습니다. 다른 사진을 선택해 주세요.", zh: "照片文件过大，压缩后仍无法上传，请选择其他照片。", vi: "Ảnh quá lớn, sau khi nén vẫn không thể đăng. Vui lòng chọn ảnh khác.", en: "This photo is too large to upload even after compression. Please choose a different photo.", mn: "Зургийн хэмжээ хэт том тул шахсны дараа ч оруулах боломжгүй байна. Өөр зураг сонгоно уу.", bn: "ছবির আকার অনেক বড় হওয়ায় কম্প্রেস করার পরও আপলোড করা যাচ্ছে না। অন্য ছবি বেছে নিন।", my: "ဓာတ်ပုံအရွယ်အစားကြီးလွန်းသောကြောင့် ချုံ့ပြီးနောက်တွင်ပင် တင်၍မရပါ။ တခြားဓာတ်ပုံရွေးချယ်ပါ။" },
  errGeneric: { ko: "오류가 발생했습니다. 다시 시도해 주세요.", zh: "发生错误，请重试。", vi: "Đã xảy ra lỗi. Vui lòng thử lại.", en: "Something went wrong. Please try again.", mn: "Алдаа гарлаа. Дахин оролдоно уу.", bn: "একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।", my: "အမှားတစ်ခုဖြစ်ပွားပါသည်။ ထပ်မံကြိုးစားပါ။" },
  doneSaved: { ko: "저장되었습니다.", zh: "已保存。", vi: "Đã lưu.", en: "Saved.", mn: "Хадгалагдлаа.", bn: "সংরক্ষিত হয়েছে।", my: "သိမ်းဆည်းပြီးပါပြီ။" },
  doneDeleted: { ko: "삭제되었습니다.", zh: "已删除。", vi: "Đã xóa.", en: "Deleted.", mn: "Устгагдлаа.", bn: "মুছে ফেলা হয়েছে।", my: "ဖျက်ပြီးပါပြီ။" }
};

/* 관리자 번역 상태 표시(관리자 페이지 번역관리 탭) */
var COMMUNITY_TRANSLATION_STATUS = {
  pending: { ko: "번역 전", zh: "待翻译", vi: "Chưa dịch", en: "Not translated", mn: "Орчуулаагүй", bn: "অনুবাদের আগে", my: "ဘာသာမပြန်ရသေးပါ" },
  inProgress: { ko: "번역 중", zh: "翻译中", vi: "Đang dịch", en: "Translating", mn: "Орчуулж байна", bn: "অনুবাদ হচ্ছে", my: "ဘာသာပြန်နေဆဲ" },
  done: { ko: "번역 완료", zh: "翻译完成", vi: "Đã dịch", en: "Translated", mn: "Орчуулсан", bn: "অনুবাদ সম্পন্ন", my: "ဘာသာပြန်ပြီးပါပြီ" },
  failed: { ko: "번역 실패", zh: "翻译失败", vi: "Dịch thất bại", en: "Translation failed", mn: "Орчуулга амжилтгүй", bn: "অনুবাদ ব্যর্থ", my: "ဘာသာပြန်ခြင်းမအောင်မြင်ပါ" },
  adminEdited: { ko: "관리자 수정", zh: "管理员已修改", vi: "Quản trị viên đã sửa", en: "Edited by admin", mn: "Админ засварласан", bn: "প্রশাসক সম্পাদিত", my: "စီမံခန့်ခွဲသူပြင်ဆင်ခဲ့သည်" }
};

/* 회원가입 국적 선택용 국가 목록(검색 가능한 <datalist>용, 영문 표기).
   국제학생 다수인 국가를 우선 배치하지 않고 알파벳순으로 정렬해
   특정 국가를 우대하지 않습니다. */
var COUNTRY_LIST = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina",
  "Armenia", "Australia", "Austria", "Azerbaijan", "Bahrain", "Bangladesh",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso",
  "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic",
  "Chad", "Chile", "China", "Colombia", "Comoros", "Congo",
  "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark",
  "Djibouti", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Estonia",
  "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Guatemala",
  "Guinea", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland",
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Macau", "Madagascar", "Malawi", "Malaysia",
  "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
  "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Sierra Leone",
  "Singapore", "Slovakia", "Slovenia", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
  "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
];
