/* ==========================================================================
   유학생 커뮤니티 다국어 문구 (js/community-translations.js)
   - js/translations.js와 같은 패턴({ko,zh,vi,en,mn})을 그대로 따릅니다.
   - babsim.store에서 선택한 언어(js/app.js state.lang, localStorage
     "foodhall_lang")를 커뮤니티 화면에도 그대로 사용합니다.
   ========================================================================== */

/* 상단 커뮤니티 버튼(두 줄) */
var COMMUNITY_NAV = {
  line1: { ko: "유학생", zh: "留学生", vi: "Cộng đồng", en: "International", mn: "Олон улсын" },
  line2: { ko: "커뮤니티", zh: "社区", vi: "Du học sinh", en: "Community", mn: "Оюутнууд" }
};

/* 게시판 5개 카테고리 */
var COMMUNITY_CATEGORIES = {
  friends: { ko: "친구 만들기", zh: "交朋友", vi: "Kết bạn", en: "Make Friends", mn: "Найзтай болох" },
  market: { ko: "중고거래", zh: "二手交易", vi: "Chợ đồ cũ", en: "Marketplace", mn: "Хуучин барааны худалдаа" },
  help: { ko: "도움 요청", zh: "求助", vi: "Yêu cầu trợ giúp", en: "Help Requests", mn: "Тусламж хүсэх" },
  together: { ko: "같이 해요", zh: "一起参加", vi: "Cùng tham gia", en: "Let's Meet", mn: "Хамтдаа оролцох" },
  life: { ko: "생활정보", zh: "生活信息", vi: "Thông tin cuộc sống", en: "Life Information", mn: "Амьдралын мэдээлэл" }
};
var COMMUNITY_CATEGORY_ORDER = ["friends", "market", "help", "together", "life"];

/* 로그인/회원가입/이메일 인증/비밀번호 찾기 */
var COMMUNITY_AUTH = {
  loginTitle: { ko: "로그인", zh: "登录", vi: "Đăng nhập", en: "Log In", mn: "Нэвтрэх" },
  signupTitle: { ko: "회원가입", zh: "注册", vi: "Đăng ký", en: "Sign Up", mn: "Бүртгүүлэх" },
  emailLabel: { ko: "이메일", zh: "邮箱", vi: "Email", en: "Email", mn: "И-мэйл" },
  passwordLabel: { ko: "비밀번호", zh: "密码", vi: "Mật khẩu", en: "Password", mn: "Нууц үг" },
  passwordConfirmLabel: { ko: "비밀번호 확인", zh: "确认密码", vi: "Xác nhận mật khẩu", en: "Confirm Password", mn: "Нууц үг баталгаажуулах" },
  nameLabel: { ko: "이름", zh: "姓名", vi: "Họ tên", en: "Name", mn: "Нэр" },
  nationalityLabel: { ko: "국적", zh: "国籍", vi: "Quốc tịch", en: "Nationality", mn: "Иргэншил" },
  nationalitySearchPlaceholder: { ko: "국가 검색", zh: "搜索国家", vi: "Tìm quốc gia", en: "Search country", mn: "Улс хайх" },
  langLabel: { ko: "사용할 언어", zh: "使用语言", vi: "Ngôn ngữ sử dụng", en: "Preferred Language", mn: "Ашиглах хэл" },
  privacyAgree: { ko: "개인정보 수집에 동의합니다", zh: "同意收集个人信息", vi: "Tôi đồng ý thu thập thông tin cá nhân", en: "I agree to the collection of personal information", mn: "Хувийн мэдээлэл цуглуулахыг зөвшөөрч байна" },
  rulesAgree: { ko: "커뮤니티 이용규칙에 동의합니다", zh: "同意社区使用规则", vi: "Tôi đồng ý với quy tắc cộng đồng", en: "I agree to the community rules", mn: "Нийгэмлэгийн дүрэмтэй зөвшөөрч байна" },
  viewText: { ko: "보기", zh: "查看", vi: "Xem", en: "View", mn: "Харах" },
  submitSignup: { ko: "가입하기", zh: "注册", vi: "Đăng ký", en: "Create Account", mn: "Бүртгүүлэх" },
  submitLogin: { ko: "로그인", zh: "登录", vi: "Đăng nhập", en: "Log In", mn: "Нэвтрэх" },
  keepLoggedIn: { ko: "로그인 상태 유지", zh: "保持登录", vi: "Duy trì đăng nhập", en: "Keep me logged in", mn: "Нэвтэрсэн хэвээр байх" },
  forgotPassword: { ko: "비밀번호 찾기", zh: "忘记密码", vi: "Quên mật khẩu", en: "Forgot Password", mn: "Нууц үг сэргээх" },
  goSignup: { ko: "회원가입", zh: "去注册", vi: "Đăng ký", en: "Sign Up", mn: "Бүртгүүлэх" },
  goLogin: { ko: "이미 계정이 있나요? 로그인", zh: "已有账号？登录", vi: "Đã có tài khoản? Đăng nhập", en: "Already have an account? Log in", mn: "Бүртгэлтэй юу? Нэвтрэх" },
  resendVerification: { ko: "인증메일 다시 보내기", zh: "重新发送验证邮件", vi: "Gửi lại email xác nhận", en: "Resend verification email", mn: "Баталгаажуулах имэйлийг дахин илгээх" },
  verifyNotice: { ko: "이메일 인증을 완료해 주세요.", zh: "请完成邮箱验证。", vi: "Vui lòng hoàn tất xác nhận email.", en: "Please verify your email.", mn: "И-мэйлээ баталгаажуулна уу." },
  logout: { ko: "로그아웃", zh: "登出", vi: "Đăng xuất", en: "Log Out", mn: "Гарах" },
  resetSent: { ko: "비밀번호 재설정 메일을 보냈습니다.", zh: "已发送密码重置邮件。", vi: "Đã gửi email đặt lại mật khẩu.", en: "Password reset email sent.", mn: "Нууц үг сэргээх и-мэйл илгээгдлээ." },
  verificationSent: { ko: "인증메일을 다시 보냈습니다.", zh: "已重新发送验证邮件。", vi: "Đã gửi lại email xác nhận.", en: "Verification email resent.", mn: "Баталгаажуулах имэйлийг дахин илгээлээ." },
  loginRequiredTitle: { ko: "로그인이 필요합니다", zh: "需要登录", vi: "Cần đăng nhập", en: "Login Required", mn: "Нэвтрэх шаардлагатай" },
  loginRequiredDesc: { ko: "유학생 커뮤니티는 회원가입과 이메일 인증을 완료한 회원만 이용할 수 있습니다.", zh: "留学生社区仅限完成注册及邮箱验证的会员使用。", vi: "Cộng đồng du học sinh chỉ dành cho thành viên đã đăng ký và xác nhận email.", en: "The community is available only to members who have signed up and verified their email.", mn: "Олон улсын оюутнуудын нийгэмлэг нь бүртгэл болон и-мэйл баталгаажуулалтыг дуусгасан гишүүдэд л нээлттэй." },
  suspendedNotice: { ko: "이용이 정지된 계정입니다.", zh: "该账号已被停用。", vi: "Tài khoản đã bị đình chỉ.", en: "This account has been suspended.", mn: "Энэ бүртгэл түдгэлзүүлэгдсэн байна." }
};

/* 회원 메뉴/내 정보 */
var COMMUNITY_MY = {
  myPageTitle: { ko: "내 정보", zh: "我的信息", vi: "Thông tin của tôi", en: "My Info", mn: "Миний мэдээлэл" },
  myPosts: { ko: "내가 작성한 글", zh: "我写的帖子", vi: "Bài viết của tôi", en: "My Posts", mn: "Миний бичсэн зурвас" },
  myComments: { ko: "내가 작성한 댓글", zh: "我写的评论", vi: "Bình luận của tôi", en: "My Comments", mn: "Миний сэтгэгдэл" },
  savedPosts: { ko: "저장한 글", zh: "已保存的帖子", vi: "Bài đã lưu", en: "Saved Posts", mn: "Хадгалсан зурвас" },
  editName: { ko: "이름 수정", zh: "修改姓名", vi: "Sửa họ tên", en: "Edit Name", mn: "Нэр засах" },
  editNationality: { ko: "국적 수정", zh: "修改国籍", vi: "Sửa quốc tịch", en: "Edit Nationality", mn: "Иргэншил засах" },
  editLang: { ko: "선택 언어 변경", zh: "更改语言", vi: "Đổi ngôn ngữ", en: "Change Language", mn: "Хэл солих" },
  editPassword: { ko: "비밀번호 변경", zh: "修改密码", vi: "Đổi mật khẩu", en: "Change Password", mn: "Нууц үг солих" },
  withdraw: { ko: "회원 탈퇴", zh: "注销账号", vi: "Xóa tài khoản", en: "Delete Account", mn: "Гишүүнчлэл цуцлах" },
  withdrawConfirm: { ko: "정말 탈퇴하시겠습니까? 되돌릴 수 없습니다.", zh: "确定要注销吗？此操作无法撤销。", vi: "Bạn có chắc muốn xóa tài khoản? Không thể hoàn tác.", en: "Are you sure you want to delete your account? This cannot be undone.", mn: "Та гишүүнчлэлээ цуцлахдаа итгэлтэй байна уу? Буцаах боломжгүй." },
  save: { ko: "저장", zh: "保存", vi: "Lưu", en: "Save", mn: "Хадгалах" }
};

/* 게시글/댓글 작성, 상세, 목록, 검색 */
var COMMUNITY_POST = {
  writeTitle: { ko: "글쓰기", zh: "写帖子", vi: "Viết bài", en: "Write a Post", mn: "Зурвас бичих" },
  categoryLabel: { ko: "카테고리", zh: "分类", vi: "Danh mục", en: "Category", mn: "Ангилал" },
  titleLabel: { ko: "제목", zh: "标题", vi: "Tiêu đề", en: "Title", mn: "Гарчиг" },
  contentLabel: { ko: "본문", zh: "内容", vi: "Nội dung", en: "Content", mn: "Агуулга" },
  originalLangLabel: { ko: "원문 언어", zh: "原文语言", vi: "Ngôn ngữ gốc", en: "Original Language", mn: "Эх хэл" },
  photoLabel: { ko: "사진 (최대 3장)", zh: "照片（最多3张）", vi: "Ảnh (tối đa 3 ảnh)", en: "Photos (up to 3)", mn: "Зураг (хамгийн ихдээ 3)" },
  submitPost: { ko: "등록", zh: "发布", vi: "Đăng", en: "Post", mn: "Нийтлэх" },
  editPost: { ko: "수정", zh: "编辑", vi: "Sửa", en: "Edit", mn: "Засах" },
  deletePost: { ko: "삭제", zh: "删除", vi: "Xóa", en: "Delete", mn: "Устгах" },
  deleteConfirm: { ko: "정말 삭제하시겠습니까?", zh: "确定要删除吗？", vi: "Bạn có chắc muốn xóa?", en: "Are you sure you want to delete this?", mn: "Устгахдаа итгэлтэй байна уу?" },
  viewOriginal: { ko: "원문 보기", zh: "查看原文", vi: "Xem bản gốc", en: "View Original", mn: "Эх хувийг харах" },
  viewTranslated: { ko: "선택 언어로 보기", zh: "查看翻译", vi: "Xem bản dịch", en: "View Translated", mn: "Орчуулгыг харах" },
  aiNotice: { ko: "AI로 번역된 내용입니다.", zh: "本内容由AI翻译。", vi: "Nội dung này được dịch bằng AI.", en: "This content was translated by AI.", mn: "Энэ агуулгыг AI орчуулсан." },
  noPosts: { ko: "게시글이 없습니다.", zh: "暂无帖子。", vi: "Không có bài viết.", en: "No posts yet.", mn: "Зурвас алга байна." },
  loading: { ko: "불러오는 중...", zh: "加载中...", vi: "Đang tải...", en: "Loading...", mn: "Ачааллаж байна..." },
  searchPlaceholder: { ko: "제목·본문 검색", zh: "搜索标题·内容", vi: "Tìm tiêu đề, nội dung", en: "Search title/content", mn: "Гарчиг, агуулга хайх" },
  sortLatest: { ko: "최신순", zh: "最新", vi: "Mới nhất", en: "Latest", mn: "Хамгийн сүүлийн" },
  sortComments: { ko: "댓글 많은 순", zh: "评论最多", vi: "Nhiều bình luận nhất", en: "Most Commented", mn: "Хамгийн олон сэтгэгдэлтэй" },
  commentCount: { ko: "댓글", zh: "评论", vi: "Bình luận", en: "Comments", mn: "Сэтгэгдэл" },
  saveBtn: { ko: "저장", zh: "收藏", vi: "Lưu", en: "Save", mn: "Хадгалах" },
  unsaveBtn: { ko: "저장 취소", zh: "取消收藏", vi: "Bỏ lưu", en: "Unsave", mn: "Хадгалахыг цуцлах" },
  kakaoWarn: { ko: "개인정보 공개와 오프라인 만남에 주의하세요.", zh: "请注意个人信息公开及线下见面的风险。", vi: "Hãy cẩn thận khi công khai thông tin cá nhân và gặp mặt ngoài đời.", en: "Be careful about sharing personal info and meeting offline.", mn: "Хувийн мэдээлэл ил гарах, гадуур уулзахаас болгоомжлоорой." },
  kakaoBtn: { ko: "카카오톡 오픈채팅", zh: "KakaoTalk 开放聊天", vi: "KakaoTalk Open Chat", en: "KakaoTalk Open Chat", mn: "KakaoTalk нээлттэй чат" }
};

/* 중고거래 */
var COMMUNITY_MARKET = {
  dealTypeSell: { ko: "판매", zh: "出售", vi: "Bán", en: "Sell", mn: "Зарах" },
  dealTypeBuy: { ko: "구매", zh: "求购", vi: "Mua", en: "Buy", mn: "Худалдан авах" },
  priceLabel: { ko: "가격", zh: "价格", vi: "Giá", en: "Price", mn: "Үнэ" },
  freeShare: { ko: "무료 나눔", zh: "免费赠送", vi: "Tặng miễn phí", en: "Free Giveaway", mn: "Үнэгүй хуваалцах" },
  locationLabel: { ko: "거래 희망 장소", zh: "交易地点", vi: "Địa điểm giao dịch", en: "Preferred Location", mn: "Худалдааны байршил" },
  conditionLabel: { ko: "물품 상태", zh: "物品状态", vi: "Tình trạng đồ", en: "Item Condition", mn: "Барааны байдал" },
  statusLabel: { ko: "거래 상태", zh: "交易状态", vi: "Trạng thái giao dịch", en: "Deal Status", mn: "Худалдааны төлөв" },
  statusSelling: { ko: "판매 중", zh: "出售中", vi: "Đang bán", en: "Selling", mn: "Зарж байна" },
  statusReserved: { ko: "예약 중", zh: "已预订", vi: "Đã đặt trước", en: "Reserved", mn: "Захиалагдсан" },
  statusDone: { ko: "거래 완료", zh: "交易完成", vi: "Đã giao dịch", en: "Sold", mn: "Худалдаа дууссан" },
  statusFree: { ko: "무료 나눔", zh: "免费赠送", vi: "Tặng miễn phí", en: "Free", mn: "Үнэгүй" },
  hideDone: { ko: "거래 완료 게시물 숨기기", zh: "隐藏已完成交易", vi: "Ẩn bài đã giao dịch", en: "Hide completed deals", mn: "Дууссан худалдааг нуух" },
  extend: { ko: "30일 연장", zh: "延长30天", vi: "Gia hạn 30 ngày", en: "Extend 30 days", mn: "30 хоногоор сунгах" },
  safetyNotice: { ko: "학교 안의 공개된 장소에서 만나고 송금 전에 물건을 직접 확인하세요.", zh: "请在学校内的公开场所见面，转账前请务必确认物品。", vi: "Hãy gặp ở nơi công cộng trong trường và kiểm tra hàng trước khi chuyển khoản.", en: "Meet in a public place on campus and check the item before paying.", mn: "Сургуулийн нээлттэй газарт уулзаж, мөнгө шилжүүлэхийн өмнө барааг өөрөө шалгаарай." }
};

/* 도움 요청 */
var COMMUNITY_HELP = {
  statusLabel: { ko: "상태", zh: "状态", vi: "Trạng thái", en: "Status", mn: "Төлөв" },
  statusNeeded: { ko: "도움 필요", zh: "需要帮助", vi: "Cần giúp đỡ", en: "Help Needed", mn: "Тусламж хэрэгтэй" },
  statusInProgress: { ko: "해결 중", zh: "处理中", vi: "Đang xử lý", en: "In Progress", mn: "Шийдвэрлэж байна" },
  statusResolved: { ko: "해결 완료", zh: "已解决", vi: "Đã giải quyết", en: "Resolved", mn: "Шийдэгдсэн" },
  typeLabel: { ko: "분류", zh: "分类", vi: "Phân loại", en: "Type", mn: "Төрөл" },
  typeSchool: { ko: "학교생활", zh: "校园生活", vi: "Đời sống học đường", en: "School Life", mn: "Сургуулийн амьдрал" },
  typeKorean: { ko: "한국어", zh: "韩语", vi: "Tiếng Hàn", en: "Korean Language", mn: "Солонгос хэл" },
  typeHospital: { ko: "병원", zh: "医院", vi: "Bệnh viện", en: "Hospital", mn: "Эмнэлэг" },
  typeTransport: { ko: "교통", zh: "交通", vi: "Giao thông", en: "Transportation", mn: "Тээвэр" },
  typeAdmin: { ko: "행정", zh: "行政", vi: "Hành chính", en: "Administration", mn: "Захиргаа" },
  typeLost: { ko: "분실물", zh: "失物招领", vi: "Đồ thất lạc", en: "Lost & Found", mn: "Алдагдсан зүйл" },
  typeLife: { ko: "생활 도움", zh: "生活帮助", vi: "Hỗ trợ sinh hoạt", en: "Daily Help", mn: "Амьдралын тусламж" },
  typeEtc: { ko: "기타", zh: "其他", vi: "Khác", en: "Other", mn: "Бусад" },
  emergencyNotice: { ko: "긴급하거나 위험한 상황은 경찰, 학교 담당 부서 등 공식 기관에 연락하세요.", zh: "紧急或危险情况请联系警察或学校相关部门等官方机构。", vi: "Trường hợp khẩn cấp hoặc nguy hiểm, hãy liên hệ công an hoặc bộ phận phụ trách của trường.", en: "For urgent or dangerous situations, contact the police or your school's official office.", mn: "Яаралтай, аюултай тохиолдолд цагдаа, сургуулийн албан ёсны газарт хандана уу." }
};

/* 댓글 */
var COMMUNITY_COMMENT = {
  writeLabel: { ko: "댓글 작성", zh: "写评论", vi: "Viết bình luận", en: "Write a Comment", mn: "Сэтгэгдэл бичих" },
  submitComment: { ko: "등록", zh: "发布", vi: "Đăng", en: "Post", mn: "Нийтлэх" },
  replyLabel: { ko: "답글", zh: "回复", vi: "Trả lời", en: "Reply", mn: "Хариулах" },
  editComment: { ko: "수정", zh: "编辑", vi: "Sửa", en: "Edit", mn: "Засах" },
  deleteComment: { ko: "삭제", zh: "删除", vi: "Xóa", en: "Delete", mn: "Устгах" },
  viewOriginal: { ko: "원문 보기", zh: "查看原文", vi: "Xem bản gốc", en: "View Original", mn: "Эх хувийг харах" },
  viewTranslated: { ko: "번역 보기", zh: "查看翻译", vi: "Xem bản dịch", en: "View Translation", mn: "Орчуулга харах" },
  translating: { ko: "번역 중...", zh: "翻译中...", vi: "Đang dịch...", en: "Translating...", mn: "Орчуулж байна..." },
  noComments: { ko: "댓글이 없습니다.", zh: "暂无评论。", vi: "Chưa có bình luận.", en: "No comments yet.", mn: "Сэтгэгдэл алга." }
};

/* 신고 */
var COMMUNITY_REPORT = {
  reportBtn: { ko: "신고하기", zh: "举报", vi: "Báo cáo", en: "Report", mn: "Мэдээлэх" },
  reportTitle: { ko: "신고 사유 선택", zh: "选择举报原因", vi: "Chọn lý do báo cáo", en: "Select Report Reason", mn: "Мэдээлэх шалтгаанаа сонгоно уу" },
  reasonScam: { ko: "사기 의심", zh: "疑似诈骗", vi: "Nghi ngờ lừa đảo", en: "Suspected Scam", mn: "Залилан гэж сэжиглэгдэж байна" },
  reasonAbuse: { ko: "욕설·괴롭힘", zh: "辱骂·骚扰", vi: "Lăng mạ/quấy rối", en: "Abuse/Harassment", mn: "Доромжлол/дарамт" },
  reasonPrivacy: { ko: "개인정보 노출", zh: "个人信息泄露", vi: "Lộ thông tin cá nhân", en: "Privacy Exposure", mn: "Хувийн мэдээлэл ил гарсан" },
  reasonIllegal: { ko: "불법 또는 위험 물품", zh: "非法或危险物品", vi: "Hàng hóa bất hợp pháp/nguy hiểm", en: "Illegal/Dangerous Item", mn: "Хууль бус эсвэл аюултай бараа" },
  reasonAd: { ko: "광고·도배", zh: "广告·刷屏", vi: "Quảng cáo/spam", en: "Ad/Spam", mn: "Сурталчилгаа/спам" },
  reasonMeet: { ko: "부적절한 만남 요구", zh: "不当约见要求", vi: "Yêu cầu gặp mặt không phù hợp", en: "Inappropriate Meeting Request", mn: "Зохисгүй уулзалт хүсэлт" },
  reasonEtc: { ko: "기타", zh: "其他", vi: "Khác", en: "Other", mn: "Бусад" },
  submitReport: { ko: "신고 제출", zh: "提交举报", vi: "Gửi báo cáo", en: "Submit Report", mn: "Мэдээллийг илгээх" },
  reportDone: { ko: "신고가 접수되었습니다.", zh: "举报已提交。", vi: "Đã gửi báo cáo.", en: "Report submitted.", mn: "Мэдээлэл хүлээн авагдлаа." },
  alreadyReported: { ko: "이미 신고한 게시물입니다.", zh: "您已举报过该内容。", vi: "Bạn đã báo cáo nội dung này.", en: "You have already reported this.", mn: "Та энэ зурвасыг аль хэдийн мэдээлсэн байна." },
  hiddenNotice: { ko: "신고가 누적되어 임시 숨김 처리되었습니다.", zh: "因举报累计已被临时隐藏。", vi: "Đã bị ẩn tạm thời do bị báo cáo nhiều lần.", en: "This has been temporarily hidden due to multiple reports.", mn: "Олон удаа мэдээлэгдсэний улмаас түр нуугдлаа." }
};

/* 개인정보 동의 / 이용규칙 화면 */
var COMMUNITY_CONSENT = {
  privacyTitle: { ko: "개인정보처리방침", zh: "隐私政策", vi: "Chính sách bảo mật", en: "Privacy Policy", mn: "Хувийн мэдээллийн бодлого" },
  rulesTitle: { ko: "커뮤니티 이용규칙", zh: "社区使用规则", vi: "Quy tắc cộng đồng", en: "Community Rules", mn: "Нийгэмлэгийн дүрэм" },
  collectItems: { ko: "수집정보: 이름, 국적, 이메일, 선택 언어", zh: "收集信息：姓名、国籍、邮箱、使用语言", vi: "Thông tin thu thập: Họ tên, quốc tịch, email, ngôn ngữ sử dụng", en: "Collected: Name, Nationality, Email, Preferred Language", mn: "Цуглуулах мэдээлэл: Нэр, иргэншил, и-мэйл, ашиглах хэл" },
  purpose: { ko: "이용목적: 회원 확인, 커뮤니티 운영, 다국어 서비스 제공, 신고 처리, 부정 이용 방지", zh: "使用目的：会员确认、社区运营、多语言服务、举报处理、防止滥用", vi: "Mục đích: Xác thực thành viên, vận hành cộng đồng, dịch vụ đa ngôn ngữ, xử lý báo cáo, ngăn chặn lạm dụng", en: "Purpose: Member verification, community operation, multilingual service, report handling, abuse prevention", mn: "Зорилго: Гишүүнчлэл баталгаажуулах, нийгэмлэг ажиллуулах, олон хэлний үйлчилгээ, гомдол шийдвэрлэх, буруу ашиглалтаас сэргийлэх" },
  retention: { ko: "보유기간: 회원 탈퇴 시까지(관계 법령상 보관 의무가 있는 경우 해당 기간)", zh: "保留期限：至注销为止（如法律要求保存的情况按相关期限）", vi: "Thời hạn lưu trữ: Đến khi xóa tài khoản (theo quy định pháp luật nếu có)", en: "Retention: Until account deletion (or as required by applicable law)", mn: "Хадгалах хугацаа: Гишүүнчлэл цуцлах хүртэл (хууль тогтоомжийн дагуу хадгалах шаардлагатай бол тухайн хугацаагаар)" }
};

/* 공통 오류/완료 메시지 */
var COMMUNITY_MSG = {
  errRequired: { ko: "필수 항목을 모두 입력해 주세요.", zh: "请填写所有必填项。", vi: "Vui lòng điền đầy đủ thông tin bắt buộc.", en: "Please fill in all required fields.", mn: "Заавал бөглөх бүх талбарыг бөглөнө үү." },
  errPasswordMismatch: { ko: "비밀번호가 일치하지 않습니다.", zh: "两次输入的密码不一致。", vi: "Mật khẩu xác nhận không khớp.", en: "Passwords do not match.", mn: "Нууц үг таарахгүй байна." },
  errEmailInUse: { ko: "이미 사용 중인 이메일입니다.", zh: "该邮箱已被使用。", vi: "Email này đã được sử dụng.", en: "This email is already in use.", mn: "Энэ и-мэйл хаяг аль хэдийн ашиглагдаж байна." },
  errLogin: { ko: "이메일 또는 비밀번호가 올바르지 않습니다.", zh: "邮箱或密码不正确。", vi: "Email hoặc mật khẩu không đúng.", en: "Incorrect email or password.", mn: "И-мэйл эсвэл нууц үг буруу байна." },
  errPhotoLimit: { ko: "사진은 최대 3장까지 첨부할 수 있습니다.", zh: "最多只能上传3张照片。", vi: "Chỉ có thể đính kèm tối đa 3 ảnh.", en: "You can attach up to 3 photos.", mn: "Хамгийн ихдээ 3 зураг хавсаргах боломжтой." },
  errGeneric: { ko: "오류가 발생했습니다. 다시 시도해 주세요.", zh: "发生错误，请重试。", vi: "Đã xảy ra lỗi. Vui lòng thử lại.", en: "Something went wrong. Please try again.", mn: "Алдаа гарлаа. Дахин оролдоно уу." },
  doneSaved: { ko: "저장되었습니다.", zh: "已保存。", vi: "Đã lưu.", en: "Saved.", mn: "Хадгалагдлаа." },
  doneDeleted: { ko: "삭제되었습니다.", zh: "已删除。", vi: "Đã xóa.", en: "Deleted.", mn: "Устгагдлаа." }
};

/* 관리자 번역 상태 표시(관리자 페이지 번역관리 탭) */
var COMMUNITY_TRANSLATION_STATUS = {
  pending: { ko: "번역 전", zh: "待翻译", vi: "Chưa dịch", en: "Not translated", mn: "Орчуулаагүй" },
  inProgress: { ko: "번역 중", zh: "翻译中", vi: "Đang dịch", en: "Translating", mn: "Орчуулж байна" },
  done: { ko: "번역 완료", zh: "翻译完成", vi: "Đã dịch", en: "Translated", mn: "Орчуулсан" },
  failed: { ko: "번역 실패", zh: "翻译失败", vi: "Dịch thất bại", en: "Translation failed", mn: "Орчуулга амжилтгүй" },
  adminEdited: { ko: "관리자 수정", zh: "管理员已修改", vi: "Quản trị viên đã sửa", en: "Edited by admin", mn: "Админ засварласан" }
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
