// ============================================================
//  김투스 컴퍼니 설정 — 여기 한 파일만 고치면 됩니다
// ============================================================
//  회사 이름, 부서 이름, 직원 이름·성격·머리색까지 전부 여기 있어요.
//  다른 파일은 건드리지 않아도 됩니다.
//
//  ⚠️ 딱 2가지 규칙
//   1. 부서 id(research, brand, ...)는 절대 바꾸지 마세요. 시뮬레이션 엔진이
//      이 id로 움직입니다. 바꾸면 캐릭터가 길을 잃어요.
//      → 바꿔도 되는 건 name(부서 이름) · icon · short 입니다.
//   2. 부서는 12개를 유지하세요. 사무실 배치가 4열 3행 = 12칸 고정입니다.
//      안 쓰는 부서는 지우지 말고 이름만 바꿔서 쓰세요.
//
//  직원 수는 자유롭게 늘리고 줄여도 됩니다. 한 팀에 팀장(lead) 1명은 두세요.
// ============================================================

/** 회사 기본 정보 */
export const COMPANY = {
  /** 좌측 상단 헤더에 뜨는 회사 이름 */
  name: "KIMTOOS COMPANY",
  /** 헤더 로고 배지에 들어갈 글자 1개 (이모지도 됩니다) */
  logoLetter: "투",
  /** 화면 상단 큰 제목 (앞부분) */
  titlePrefix: "김투스",
  /** 화면 상단 큰 제목 (강조되는 뒷부분) */
  titleAccent: "컴퍼니",
  /** 브라우저 탭 제목 */
  pageTitle: "김투스 컴퍼니 — 김투고 대표의 1인 AI 사무실",
  /** 검색·공유될 때 뜨는 설명 */
  description: "디지털 상품·유튜브·스토어를 12개 AI 팀이 함께 굴리는 김투고 대표의 1인 사무실",
  /** 창 하단 파일명 느낌의 라벨 */
  windowLabel: "kimtoos_company.exe — 대표실",
  /** 일일 브리핑 제목에 들어갈 이름 */
  reportName: "김투스 컴퍼니",
} as const;

/** 대표(나) — 사무실 대표실에 앉아 있는 캐릭터 */
export const CEO_PROFILE = {
  name: "김투고",
  callsign: "투고 대표님",
  role: "대표 · 최종 결재",
  hair: "#42283a",
  shirt: "#ff8fc0",
  accent: "#fff3b0",
  skin: "#ffdcc4",
  thoughts: [
    "승인할까, 보류할까… 오늘 결재함부터 비우자.",
    "7일 해보고 반응 없으면 깔끔하게 접는다.",
    "돈 안 드는 방법부터 찾아보자.",
  ],
};

/**
 * 부서 12개.
 * id = 고정(엔진용) / name·short·icon = 자유롭게 변경
 * task = 오늘 하는 일 / report = 팀장 한줄보고
 */
export const DEPARTMENTS = [
  {
    id: "research",
    name: "블루오션 발굴팀",
    short: "blueocean.lab",
    icon: "🔎",
    task: "디지털노마드 사업 후보 찾기",
    report: "경쟁 적고 바로 팔 수 있는 아이템만 추려요.",
  },
  {
    id: "brand",
    name: "브랜드·인스타팀",
    short: "insta.room",
    icon: "📸",
    task: "홍보 인스타 계정 운영",
    report: "가계부 홍보 계정 톤과 피드를 맞춰요.",
  },
  {
    id: "strategy1",
    name: "콘텐츠 기획팀",
    short: "idea.studio",
    icon: "💡",
    task: "유튜브·쇼츠 아이디어 10개",
    report: "재테크 틈새 키워드로 TOP 3까지 좁혀요.",
  },
  {
    id: "qa",
    name: "품질 검수팀",
    short: "qa.check",
    icon: "🛡️",
    task: "상품·콘텐츠 퀄리티 점검",
    report: "밋밋하거나 근거 없는 건 되돌려보내요.",
  },
  {
    id: "strategy2",
    name: "대본·카피팀",
    short: "script.team",
    icon: "✍️",
    task: "승인된 안 대본·상세 카피",
    report: "대표가 승인한 안만 글로 옮겨요.",
  },
  {
    id: "reels",
    name: "영상 제작팀",
    short: "video.edit",
    icon: "🎬",
    task: "유튜브·쇼츠·Bunny 애니 제작",
    report: "원본은 보존하고 편집본만 새로 만들어요.",
  },
  {
    id: "carousel",
    name: "다꾸 디자인 스튜디오",
    short: "design.studio",
    icon: "🎀",
    task: "가계부 템플릿·스티커·썸네일",
    report: "가격값 하는 디자인으로 다듬어요.",
  },
  {
    id: "partner",
    name: "판매채널팀",
    short: "store.desk",
    icon: "🛍️",
    task: "크몽·포스타입·스토어 관리",
    report: "등록·심사·문의 답장 초안까지 챙겨요.",
  },
  {
    id: "finance",
    name: "재무·정산팀",
    short: "finance.xls",
    icon: "🧾",
    task: "채널별 매출·비용 정리",
    report: "무료로 갈 수 있는 건 무료로 돌려요.",
  },
  {
    id: "review",
    name: "7일 검증팀",
    short: "review.data",
    icon: "📈",
    task: "사업별 성과·계속/중단 판정",
    report: "7일 숫자로 계속할지 접을지 정리해요.",
  },
  {
    id: "ops",
    name: "AI 자동화팀",
    short: "automation.ops",
    icon: "⚙️",
    task: "Claude·Gemini 연동·자동화",
    report: "AI 둘이 손발 맞게 돌아가게 관리해요.",
  },
  {
    id: "secretary",
    name: "비서실",
    short: "secretary.hq",
    icon: "📋",
    task: "결재함 정리·최종 브리핑",
    report: "승인·보류·반려할 것만 남겨드려요.",
  },
] as const;

/**
 * 직원 명단.
 * dept = 위 부서 id / rank: "lead"(팀장) 또는 "member"(팀원)
 * colors = [머리색, 옷색, 포인트색]
 * thoughts = 자리를 비웠을 때 머리 위에 뜨는 혼잣말
 */
export type StaffEntry = {
  dept: string;
  rank: "lead" | "member";
  name: string;
  role: string;
  colors: [string, string, string];
  thoughts: string[];
  callsign?: string;
};

export const STAFF_LIST: StaffEntry[] = [
  // ① 블루오션 발굴팀
  { dept: "research", rank: "lead", name: "김서연", role: "사업 발굴 팀장", callsign: "김블루",
    colors: ["#6b3d34", "#fff3b0", "#ff8fc0"],
    thoughts: ["검색량은 있는데 파는 사람이 적은 곳을 찾자.", "초기 비용 0원으로 시작 가능한지부터.", "레드오션이면 바로 패스."] },
  { dept: "research", rank: "member", name: "오태윤", role: "시장 리서처",
    colors: ["#2f2a3d", "#c9b8ff", "#b8f0dd"],
    thoughts: ["크몽 상위 상품 리뷰부터 읽어본다.", "이거 한국에서도 팔리는 건가?"] },
  { dept: "research", rank: "member", name: "하은채", role: "트렌드 조사",
    colors: ["#8a4a3c", "#b8f0dd", "#ff8fc0"],
    thoughts: ["요즘 20~30대가 저장하는 게 뭐지?", "반짝 유행인지 꾸준한 수요인지 봐야 해."] },

  // ② 브랜드·인스타팀
  { dept: "brand", rank: "lead", name: "박보라", role: "브랜드 팀장", callsign: "박인스타",
    colors: ["#372b4a", "#c9b8ff", "#c9b8ff"],
    thoughts: ["개인 계정이랑 홍보 계정은 확실히 분리.", "피드 색감이 한눈에 '다꾸'로 보여야 해요."] },
  { dept: "brand", rank: "member", name: "신재원", role: "계정 운영",
    colors: ["#3c3a4f", "#ffe6f2", "#c9b8ff"],
    thoughts: ["올리는 시간 고정해두자.", "댓글 답장은 초안만, 발송은 대표님이."] },
  { dept: "brand", rank: "member", name: "임다혜", role: "브랜드 톤 관리",
    colors: ["#5a3450", "#fff3b0", "#ff8fc0"],
    thoughts: ["귀엽지만 싸 보이면 안 돼요.", "가계부·유튜브 톤이 서로 따로 놀지 않게."] },

  // ③ 콘텐츠 기획팀
  { dept: "strategy1", rank: "lead", name: "최아름", role: "기획 팀장", callsign: "최기획",
    colors: ["#c26e4b", "#ff8fc0", "#fff3b0"],
    thoughts: ["ISA·연금 틈새 키워드, 오늘도 10개.", "소재 없다는 말 안 나오게 미리 쌓아두자.", "쇼츠로 가계부까지 자연스럽게 연결."] },
  { dept: "strategy1", rank: "member", name: "정유진", role: "아이디어 발굴",
    colors: ["#7b4a2f", "#b8f0dd", "#ff8fc0"],
    thoughts: ["'노후 준비 몇 살부터?' 이거 되겠다.", "제목을 더 구체적인 숫자로."] },
  { dept: "strategy1", rank: "member", name: "배시현", role: "후킹 카피",
    colors: ["#2c2638", "#fff3b0", "#c9b8ff"],
    thoughts: ["첫 3초에 안 걸리면 다시 써요.", "썸네일 문구는 7글자 안으로."] },

  // ④ 품질 검수팀
  { dept: "qa", rank: "lead", name: "윤규아", role: "품질 검수 팀장", callsign: "윤검수",
    colors: ["#2d4b46", "#b8f0dd", "#b8f0dd"],
    thoughts: ["AI가 대충 만든 티 나면 반려예요.", "재테크 정보는 출처 없으면 못 나가요."] },
  { dept: "qa", rank: "member", name: "강태오", role: "상품 검수",
    colors: ["#463227", "#ffe6f2", "#b8f0dd"],
    thoughts: ["시트 수식 깨진 데 없는지 다시 확인.", "모바일에서도 보기 편한가?"] },
  { dept: "qa", rank: "member", name: "문세라", role: "톤·표현 검수",
    colors: ["#6c3a55", "#c9b8ff", "#fff3b0"],
    thoughts: ["수익 보장 같은 표현은 바로 빼요.", "과장 광고 문구 스캔 중."] },

  // ⑤ 대본·카피팀
  { dept: "strategy2", rank: "lead", name: "한도빈", role: "원고 팀장", callsign: "한대본",
    colors: ["#8b534a", "#fff3b0", "#ff8fc0"],
    thoughts: ["승인된 안만 원고로 씁니다.", "결론은 하나로 닫아야 해요."] },
  { dept: "strategy2", rank: "member", name: "조민서", role: "영상 대본",
    colors: ["#33304a", "#ff8fc0", "#b8f0dd"],
    thoughts: ["쇼츠는 30초 안에 끝내요.", "어려운 금융 용어는 쉬운 말로."] },
  { dept: "strategy2", rank: "member", name: "백가온", role: "상세페이지 카피",
    colors: ["#5d3a2c", "#b8f0dd", "#c9b8ff"],
    thoughts: ["시트 5개를 한 줄씩 매력 있게.", "구매 버튼 앞에서 망설일 이유를 없애자."] },

  // ⑥ 영상 제작팀
  { dept: "reels", rank: "lead", name: "송리원", role: "영상 제작 팀장", callsign: "송영상",
    colors: ["#2c2638", "#ff8fc0", "#ff8fc0"],
    thoughts: ["편집 어렵지 않게 템플릿부터 만들자.", "원본은 절대 안 건드려요."] },
  { dept: "reels", rank: "member", name: "권지호", role: "편집",
    colors: ["#4a3a2a", "#fff3b0", "#b8f0dd"],
    thoughts: ["컷 템포 늘어지면 이탈이에요.", "가계부 홍보 쇼츠 다음 편 준비 중."] },
  { dept: "reels", rank: "member", name: "유세아", role: "애니메이션·자막",
    colors: ["#7a3f58", "#c9b8ff", "#ff8fc0"],
    thoughts: ["Bunny 스카프는 꼭 하늘색으로.", "다음 친구는 Bobo 차례예요."] },

  // ⑦ 다꾸 디자인 스튜디오
  { dept: "carousel", rank: "lead", name: "이가림", role: "디자인 팀장", callsign: "이다꾸",
    colors: ["#d88d68", "#c9b8ff", "#c9b8ff"],
    thoughts: ["밋밋함 탈출! 고급스럽게 가자.", "원본 템플릿은 복제만, 수정 금지."] },
  { dept: "carousel", rank: "member", name: "남주하", role: "템플릿 디자인",
    colors: ["#3a2f4d", "#ffe6f2", "#ff8fc0"],
    thoughts: ["대시보드 첫 화면이 제일 중요해요.", "색은 세 가지 안에서만."] },
  { dept: "carousel", rank: "member", name: "표하늘", role: "스티커·썸네일",
    colors: ["#274a44", "#fff3b0", "#b8f0dd"],
    thoughts: ["스티커 100개, 다른 시트에도 붙게.", "썸네일 3안 먼저 뽑아볼게요."] },

  // ⑧ 판매채널팀
  { dept: "partner", rank: "lead", name: "정파랑", role: "판매채널 팀장", callsign: "정스토어",
    colors: ["#563a32", "#b8f0dd", "#b8f0dd"],
    thoughts: ["크몽 심사 결과 기다리는 중.", "채널마다 상세페이지 길이를 다르게."] },
  { dept: "partner", rank: "member", name: "구예성", role: "고객 문의",
    colors: ["#452d3f", "#c9b8ff", "#fff3b0"],
    thoughts: ["문의 답장은 초안까지만 준비할게요.", "포스타입에도 같은 상품 올릴 준비."] },

  // ⑨ 재무·정산팀
  { dept: "finance", rank: "lead", name: "오재민", role: "재무 팀장", callsign: "오재무",
    colors: ["#313b56", "#fff3b0", "#fff3b0"],
    thoughts: ["유료 툴은 꼭 필요한 것만.", "채널별 수수료부터 비교해요."] },
  { dept: "finance", rank: "member", name: "심우진", role: "정산 관리",
    colors: ["#4b3b2c", "#b8f0dd", "#c9b8ff"],
    thoughts: ["입금 대기 건 따로 표시해둡니다.", "결제는 자동으로 안 해요."] },

  // ⑩ 7일 검증팀
  { dept: "review", rank: "lead", name: "강성아", role: "검증 팀장", callsign: "강검증",
    colors: ["#9c5c72", "#ff8fc0", "#ff8fc0"],
    thoughts: ["7일 지났다. 계속할지 접을지 숫자로.", "감이 아니라 데이터로 판정해요."] },
  { dept: "review", rank: "member", name: "마지훈", role: "지표 수집",
    colors: ["#2e3a4a", "#ffe6f2", "#b8f0dd"],
    thoughts: ["조회수·저장·판매 건수 다시 모읍니다.", "연동되면 자동으로 모을 수 있어요."] },
  { dept: "review", rank: "member", name: "여름", role: "학습점 정리",
    colors: ["#6b4a2f", "#c9b8ff", "#fff3b0"],
    thoughts: ["반복할 것 1개, 멈출 것 1개.", "다음 사업 후보에 넘길 교훈 정리 중."] },

  // ⑪ AI 자동화팀
  { dept: "ops", rank: "lead", name: "안도현", role: "자동화 팀장", callsign: "안오토",
    colors: ["#3b3b49", "#b8f0dd", "#b8f0dd"],
    thoughts: ["Claude는 기획, Gemini는 이미지. 역할 분담 OK.", "실패하면 재시도하고 로그 남겨요."] },
  { dept: "ops", rank: "member", name: "천유나", role: "연동 모니터링",
    colors: ["#573049", "#fff3b0", "#ff8fc0"],
    thoughts: ["결재함 앱이랑 사무실 연결할 방법 찾는 중.", "연결 안 된 걸 성공이라고 안 써요."] },

  // ⑫ 비서실
  { dept: "secretary", rank: "lead", name: "김세리", role: "비서실장", callsign: "김비서",
    colors: ["#7a453c", "#c9b8ff", "#c9b8ff"],
    thoughts: ["대표님이 결재할 것만 추립니다.", "승인·보류·반려, 세 칸으로 정리."] },
  { dept: "secretary", rank: "member", name: "홍보람", role: "브리핑 정리",
    colors: ["#334a3a", "#ffe6f2", "#fff3b0"],
    thoughts: ["폰에서 한눈에 보이게 짧게 쓸게요.", "막힌 건 먼저 보고해요."] },
];

/**
 * 외부 연동을 아직 안 붙인 팀 → 화면에 "연동 대기"로 표시됩니다.
 * 연동을 다 붙였거나, 그냥 전부 초록불로 보고 싶으면 빈 객체 {}로 두세요.
 */
export const PENDING_INTEGRATIONS: Record<string, string> = {
  brand: "인스타 계정 연동",
  partner: "크몽·포스타입 연동",
  finance: "매출 현황 파일",
};

/**
 * 결과 보관함 링크 (Notion 등). 비워두면 화면에서 링크 버튼이 숨겨집니다.
 * 예: "https://www.notion.so/내페이지주소"
 */
export const STORAGE_LINK = "";
