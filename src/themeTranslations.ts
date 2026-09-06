/* eslint-disable @typescript-eslint/no-explicit-any */
import { Lang } from './types';

export interface ThemeSettingsTranslations {
  themePresets: string;
  editTheme: string;
  customizeWritingExperience: string;
  searchThemes: string;
  allThemes: string;
  presets: string;
  custom: string;
  createNew: string;
  advancedCustomTheme: string;
  customThemeBadge: string;
  revert: string;
  cancel: string;
  saveTheme: string;
  themeName: string;
  deleteTheme: string;
  confirmDeleteTheme: string;
  cannotDeleteActiveTheme: string;
  lightTheme: string;
  darkTheme: string;
  mainBackground: string;
  bgDesc: string;
  textColor: string;
  textDesc: string;
  subtextColor: string;
  subtextDesc: string;
  accentColor: string;
  accentDesc: string;
  borderColor: string;
  borderDesc: string;
}

const SETTINGS_I18N: Record<string, Record<Lang, string>> = {
  "themePresets": {
    "en": "Themes",
    "vi": "Chủ đề",
    "fr": "Thèmes",
    "de": "Themen",
    "it": "Temi",
    "es": "Temas",
    "ko": "테마",
    "zh": "主题",
    "ja": "テーマ"
  },
  "editTheme": {
    "en": "Edit Theme",
    "vi": "Chỉnh sửa chủ đề",
    "fr": "Modifier le thème",
    "de": "Thema bearbeiten",
    "it": "Modifica tema",
    "es": "Editar tema",
    "ko": "테마 편집",
    "zh": "编辑主题",
    "ja": "テーマを編集"
  },
  "customizeWritingExperience": {
    "en": "Customize your writing experience and color palette.",
    "vi": "Tùy biến không gian viết và bảng màu cá nhân.",
    "fr": "Personnalisez votre expérience d'écriture et votre palette de couleurs.",
    "de": "Passen Sie Ihr Schreiberlebnis und Ihre Farbpalette an.",
    "it": "Personalizza la tua esperienza di scrittura e la tavolozza dei colori.",
    "es": "Personaliza tu experiencia de escritura y tu paleta de colores.",
    "ko": "나만의 글쓰기 환경과 색상 팔레트를 설정하세요.",
    "zh": "定制您的专属写作体验与色彩搭配。",
    "ja": "執筆体験とカラーパレットを好みにカスタマイズ。"
  },
  "searchThemes": {
    "en": "Search themes...",
    "vi": "Tìm kiếm chủ đề...",
    "fr": "Rechercher des thèmes...",
    "de": "Themen durchsuchen...",
    "it": "Cerca temi...",
    "es": "Buscar temas...",
    "ko": "테마 검색...",
    "zh": "搜索主题...",
    "ja": "テーマを検索..."
  },
  "allThemes": {
    "en": "All Themes",
    "vi": "Tất cả chủ đề",
    "fr": "Tous les thèmes",
    "de": "Alle Themen",
    "it": "Tutti i temi",
    "es": "Todos los temas",
    "ko": "모든 테마",
    "zh": "所有主题",
    "ja": "すべてのテーマ"
  },
  "presets": {
    "en": "Presets",
    "vi": "Chủ đề mẫu",
    "fr": "Préréglages",
    "de": "Voreinstellungen",
    "it": "Predefiniti",
    "es": "Preajustes",
    "ko": "프리셋",
    "zh": "预设",
    "ja": "プリセット"
  },
  "custom": {
    "en": "Custom",
    "vi": "Tùy chỉnh",
    "fr": "Personnalisé",
    "de": "Benutzerdefiniert",
    "it": "Personalizzato",
    "es": "Personalizado",
    "ko": "사용자 정의",
    "zh": "自定义",
    "ja": "カスタム"
  },
  "createNew": {
    "en": "Create new",
    "vi": "Tạo mới",
    "fr": "Créer un nouveau",
    "de": "Neu erstellen",
    "it": "Crea nuovo",
    "es": "Crear nuevo",
    "ko": "새로 만들기",
    "zh": "新建主题",
    "ja": "新規作成"
  },
  "advancedCustomTheme": {
    "en": "Create new theme",
    "vi": "Tạo chủ đề mới",
    "fr": "Créer un nouveau thème",
    "de": "Neues Thema erstellen",
    "it": "Crea nuovo tema",
    "es": "Crear nuevo tema",
    "ko": "새 테마 만들기",
    "zh": "创建新主题",
    "ja": "新しいテーマを作成"
  },
  "customThemeBadge": {
    "en": "Custom Theme",
    "vi": "Chủ đề tùy chỉnh",
    "fr": "Thème personnalisé",
    "de": "Benutzerdefiniertes Thema",
    "it": "Tema personalizzato",
    "es": "Tema personalizado",
    "ko": "사용자 테마",
    "zh": "自定义主题",
    "ja": "カスタムテーマ"
  },
  "revert": {
    "en": "Revert",
    "vi": "Khôi phục",
    "fr": "Rétablir",
    "de": "Zurücksetzen",
    "it": "Ripristina",
    "es": "Revertir",
    "ko": "되돌리기",
    "zh": "恢复原样",
    "ja": "元に戻す"
  },
  "cancel": {
    "en": "Cancel",
    "vi": "Hủy",
    "fr": "Annuler",
    "de": "Abbrechen",
    "it": "Annulla",
    "es": "Cancelar",
    "ko": "취소",
    "zh": "取消",
    "ja": "キャンセル"
  },
  "saveTheme": {
    "en": "Save Theme",
    "vi": "Lưu chủ đề",
    "fr": "Enregistrer le thème",
    "de": "Thema speichern",
    "it": "Salva tema",
    "es": "Guardar tema",
    "ko": "테마 저장",
    "zh": "保存主题",
    "ja": "テーマを保存"
  },
  "themeName": {
    "en": "Theme name",
    "vi": "Tên chủ đề",
    "fr": "Nom du thème",
    "de": "Themenname",
    "it": "Nome del tema",
    "es": "Nombre del tema",
    "ko": "테마 이름",
    "zh": "主题名称",
    "ja": "テーマ名"
  },
  "deleteTheme": {
    "en": "Delete Theme",
    "vi": "Xóa chủ đề",
    "fr": "Supprimer le thème",
    "de": "Thema löschen",
    "it": "Elimina tema",
    "es": "Eliminar tema",
    "ko": "테마 삭제",
    "zh": "删除主题",
    "ja": "テーマを削除"
  },
  "confirmDeleteTheme": {
    "en": "Are you sure you want to delete this custom theme? This action cannot be undone.",
    "vi": "Bạn có chắc chắn muốn xóa chủ đề này không? Thao tác này không thể hoàn tác.",
    "fr": "Voulez-vous vraiment supprimer ce thème ? Cette action est irréversible.",
    "de": "Möchten Sie dieses Thema wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
    "it": "Sei sicuro di voler eliminare questo tema? L'azione è irreversibile.",
    "es": "¿Seguro que deseas eliminar este tema? Esta acción no se puede deshacer.",
    "ko": "이 사용자 테마를 삭제하시겠습니까? 되돌릴 수 없습니다.",
    "zh": "确定要删除此自定义主题吗？此操作无法撤销。",
    "ja": "このカスタムテーマを削除してもよろしいですか？元に戻せません。"
  },
  "cannotDeleteActiveTheme": {
    "en": "Please select another theme before deleting the active theme.",
    "vi": "Vui lòng chọn một chủ đề khác trước khi xóa chủ đề đang sử dụng.",
    "fr": "Veuillez sélectionner un autre thème avant de supprimer le thème actif.",
    "de": "Bitte wählen Sie ein anderes Thema, bevor Sie das aktive löschen.",
    "it": "Seleziona un altro tema prima di eliminare quello attivo.",
    "es": "Selecciona otro tema antes de eliminar el tema activo.",
    "ko": "사용 중인 테마를 삭제하려면 먼저 다른 테마를 선택하세요.",
    "zh": "请先切换至其他主题，再删除当前使用中的主题。",
    "ja": "使用中のテーマを削除する前に、別のテーマを選択してください。"
  },
  "lightTheme": {
    "en": "Light Theme",
    "vi": "Chủ đề Sáng",
    "fr": "Thème Clair",
    "de": "Helles Thema",
    "it": "Tema Chiaro",
    "es": "Tema Claro",
    "ko": "라이트 테마",
    "zh": "浅色主题",
    "ja": "ライトテーマ"
  },
  "darkTheme": {
    "en": "Dark Theme",
    "vi": "Chủ đề Tối",
    "fr": "Thème Sombre",
    "de": "Dunkles Thema",
    "it": "Tema Scuro",
    "es": "Tema Oscuro",
    "ko": "다크 테마",
    "zh": "深色主题",
    "ja": "ダークテーマ"
  },
  "mainBackground": {
    "en": "Theme Background & Surface",
    "vi": "Nền chủ đề & Khung viết",
    "fr": "Arrière-plan et surface d'écriture",
    "de": "Hintergrund & Schreibfläche",
    "it": "Sfondo e superficie di scrittura",
    "es": "Fondo y superficie de escritura",
    "ko": "테마 배경 및 작성 영역",
    "zh": "主题背景与书写界面",
    "ja": "テーマ背景と作成エリア"
  },
  "bgDesc": {
    "en": "Unified canvas and background color",
    "vi": "Màu nền và bề mặt giấy đồng nhất",
    "fr": "Couleur unifiée de la toile et de l'arrière-plan",
    "de": "Einheitliche Leinwand- und Hintergrundfarbe",
    "it": "Colore unificato per tela e sfondo",
    "es": "Color unificado de lienzo y fondo",
    "ko": "통합된 캔버스 및 배경 색상",
    "zh": "统一的画布与背景颜色",
    "ja": "統一されたキャンバスと背景色"
  },
  "textColor": {
    "en": "Text color",
    "vi": "Màu chữ chính",
    "fr": "Couleur du texte",
    "de": "Textfarbe",
    "it": "Colore del testo",
    "es": "Color del texto",
    "ko": "본문 글자 색상",
    "zh": "正文颜色",
    "ja": "テキスト色"
  },
  "textDesc": {
    "en": "Main text, headings & icons",
    "vi": "Văn bản chính, tiêu đề và biểu tượng",
    "fr": "Texte principal, titres et icônes",
    "de": "Haupttext, Überschriften & Icons",
    "it": "Testo principale, titoli e icone",
    "es": "Texto principal, títulos e iconos",
    "ko": "기본 텍스트, 제목 및 아이콘",
    "zh": "主文本、标题与图标",
    "ja": "メインテキスト、見出し、アイコン"
  },
  "subtextColor": {
    "en": "Subtext color",
    "vi": "Màu chữ phụ",
    "fr": "Couleur du texte secondaire",
    "de": "Sekundäre Textfarbe",
    "it": "Colore del testo secondario",
    "es": "Color de texto secundario",
    "ko": "보조 글자 색상",
    "zh": "副文本颜色",
    "ja": "サブテキスト色"
  },
  "subtextDesc": {
    "en": "Muted text & secondary icons",
    "vi": "Văn bản làm mờ và biểu tượng phụ",
    "fr": "Texte atténué et icônes secondaires",
    "de": "Gedämpfter Text & sekundäre Icons",
    "it": "Testo attenuato e icone secondarie",
    "es": "Texto atenuado e iconos secundarios",
    "ko": "흐린 텍스트 및 보조 아이콘",
    "zh": "弱化文本与辅助图标",
    "ja": "控えめなテキストと補助アイコン"
  },
  "accentColor": {
    "en": "Accent color",
    "vi": "Màu điểm nhấn",
    "fr": "Couleur d'accent",
    "de": "Akzentfarbe",
    "it": "Colore d'accento",
    "es": "Color de acento",
    "ko": "강조 색상",
    "zh": "强调色",
    "ja": "アクセントカラー"
  },
  "accentDesc": {
    "en": "Buttons & focus highlights",
    "vi": "Nút bấm và hiệu ứng tiêu điểm",
    "fr": "Boutons et surbrillance",
    "de": "Schaltflächen & Fokus-Hervorhebungen",
    "it": "Pulsanti ed evidenziazioni del focus",
    "es": "Botones y resaltados de enfoque",
    "ko": "버튼 및 포커스 강조",
    "zh": "按钮与焦点高亮",
    "ja": "ボタンとフォーカス強調"
  },
  "borderColor": {
    "en": "Border color",
    "vi": "Màu đường viền",
    "fr": "Couleur de la bordure",
    "de": "Rahmenfarbe",
    "it": "Colore del bordo",
    "es": "Color del borde",
    "ko": "테두리 색상",
    "zh": "边框颜色",
    "ja": "ボーダー色"
  },
  "borderDesc": {
    "en": "Menu & layout borders",
    "vi": "Đường viền thực đơn và bố cục",
    "fr": "Bordures du menu et de la mise en page",
    "de": "Menü- & Layoutrahmen",
    "it": "Bordi di menu e layout",
    "es": "Bordes de menú y diseño",
    "ko": "메뉴 및 레이아웃 테두리",
    "zh": "菜单与布局边框",
    "ja": "メニューとレイアウトの境界線"
  }
};

const CATEGORY_I18N: Record<string, Record<Lang, string>> = {
  "tet-trung-thu": {
    "en": "Mid-Autumn Festival",
    "vi": "Tết Trung Thu",
    "fr": "Fête de la Mi-Automne",
    "de": "Mittherbstfest",
    "it": "Festa di Metà Autunno",
    "es": "Festival de Medio Otoño",
    "ko": "추석 중추절",
    "zh": "中秋佳节",
    "ja": "中秋節・月見"
  },
  "tet-nguyen-dan": {
    "en": "Lunar New Year",
    "vi": "Tết Nguyên Đán",
    "fr": "Nouvel An Lunaire",
    "de": "Mondneujahr",
    "it": "Capodanno Lunare",
    "es": "Año Nuevo Lunar",
    "ko": "음력 설날",
    "zh": "新春岁首",
    "ja": "旧正月・春節"
  },
  "lotus-natural-greens": {
    "en": "Lotus & Natural Greens",
    "vi": "Sen & Sắc Xanh Tự Nhiên",
    "fr": "Lotus & Verts Naturels",
    "de": "Lotus & Natürliche Grüntöne",
    "it": "Loto & Verdi Naturali",
    "es": "Loto y Verdes Naturales",
    "ko": "연꽃 & 자연의 녹색",
    "zh": "莲花与自然绿",
    "ja": "蓮と自然の緑"
  },
  "cinematic-retro": {
    "en": "Cinematic & Retro",
    "vi": "Điện Ảnh & Hoài Niệm",
    "fr": "Cinématographique & Rétro",
    "de": "Filmisch & Retro",
    "it": "Cinematografico & Retrò",
    "es": "Cinematográfico y Retro",
    "ko": "시네마틱 & 레트로",
    "zh": "电影与复古美学",
    "ja": "シネマティック＆レトロ"
  },
  "architectural-heritage": {
    "en": "Architectural Heritage",
    "vi": "Kiến Trúc & Di Sản",
    "fr": "Architecture & Patrimoine",
    "de": "Architektur & Erbe",
    "it": "Architettura & Patrimonio",
    "es": "Arquitectura y Patrimonio",
    "ko": "건축 & 전통 유산",
    "zh": "建筑与文化砖瓦",
    "ja": "建築と歴史遺産"
  },
  "floral-gemstone-earth": {
    "en": "Floral, Gemstone & Earth",
    "vi": "Hoa, Đá Quý & Đất",
    "fr": "Fleurs, Gemmes & Terre",
    "de": "Blumen, Edelsteine & Erde",
    "it": "Fiori, Gemme e Terra",
    "es": "Flores, Gemas y Tierra",
    "ko": "꽃, 보석 & 대지",
    "zh": "花卉、宝石与大地",
    "ja": "花・宝石・大地の息吹"
  },
  "global-cultural": {
    "en": "Global Heritage",
    "vi": "Di Sản Toàn Cầu",
    "fr": "Patrimoine Mondial",
    "de": "Weltweites Erbe",
    "it": "Patrimonio Globale",
    "es": "Patrimonio Global",
    "ko": "세계 문화 유산",
    "zh": "全球传统文化",
    "ja": "世界の伝統文化"
  }
};

const BASE_THEMES_I18N: Record<string, Record<Lang, string>> = {
  "Aegean Terracotta": {
    "en": "Aegean Terracotta",
    "vi": "Đất Nung Aegean",
    "fr": "Terre Égée",
    "de": "Ägäis-Terrakotta",
    "it": "Terracotta Egea",
    "es": "Terracota Egea",
    "ko": "에게해 테라코타",
    "zh": "爱琴海陶土",
    "ja": "エーゲ海テラコッタ"
  },
  "Aizome": {
    "en": "Aizome Indigo",
    "vi": "Lam Chàm Aizome",
    "fr": "Indigo Aizome",
    "de": "Aizome-Indigo",
    "it": "Indigo Aizome",
    "es": "Índigo Aizome",
    "ko": "아이조메 인디고",
    "zh": "蓝染靛蓝",
    "ja": "藍染インディゴ"
  },
  "Amber Forest": {
    "en": "Amber Forest",
    "vi": "Rừng Hổ Phách",
    "fr": "Forêt d'Ambre",
    "de": "Bernsteinwald",
    "it": "Foresta d'Ambra",
    "es": "Bosque de Ámbar",
    "ko": "앰버 포레스트",
    "zh": "琥珀森林",
    "ja": "琥珀の森"
  },
  "Amethyst": {
    "en": "Amethyst",
    "vi": "Thạch Anh Tím",
    "fr": "Améthyste",
    "de": "Amethyst",
    "it": "Ametista",
    "es": "Amatista",
    "ko": "자수정",
    "zh": "紫水晶",
    "ja": "アメジスト"
  },
  "Ancient Ebony": {
    "en": "Ancient Ebony",
    "vi": "Gỗ Mun Cổ",
    "fr": "Ébène Ancien",
    "de": "Antikes Ebenholz",
    "it": "Ebano Antico",
    "es": "Ébano Antiguo",
    "ko": "고목 흑단",
    "zh": "古木乌木",
    "ja": "古代黒檀"
  },
  "Aquamarine Abyss": {
    "en": "Aquamarine Abyss",
    "vi": "Lam Ngọc Biển",
    "fr": "Abîme Aigue-marine",
    "de": "Aquamarin-Tiefsee",
    "it": "Abisso Acquamarina",
    "es": "Abismo Aguamarina",
    "ko": "아쿠아마린 심해",
    "zh": "海蓝宝深渊",
    "ja": "アクアマリン深海"
  },
  "Ash": {
    "en": "Ash Grey",
    "vi": "Tro Tàn",
    "fr": "Cendre Douce",
    "de": "Aschgrau",
    "it": "Grigio Cenere",
    "es": "Gris Ceniza",
    "ko": "애쉬 그레이",
    "zh": "灰烬素白",
    "ja": "灰白アッシュ"
  },
  "Autumn": {
    "en": "Autumn Warmth",
    "vi": "Sắc Thu Ấm",
    "fr": "Douceur d'Automne",
    "de": "Herbstwärme",
    "it": "Calore d'Autunno",
    "es": "Calidez Otoñal",
    "ko": "가을의 온기",
    "zh": "秋日暖意",
    "ja": "秋のぬくもり"
  },
  "Bamboo Mist": {
    "en": "Bamboo Mist",
    "vi": "Sương Rừng Trúc",
    "fr": "Brume de Bambou",
    "de": "Bambusnebel",
    "it": "Nebbia di Bambù",
    "es": "Niebla de Bambú",
    "ko": "대나무 안개",
    "zh": "竹林晨雾",
    "ja": "竹林の霧"
  },
  "Bordeaux Oak": {
    "en": "Bordeaux Oak",
    "vi": "Gỗ Sồi Bordeaux",
    "fr": "Chêne de Bordeaux",
    "de": "Bordeaux-Eiche",
    "it": "Rovere Bordeaux",
    "es": "Roble Burdeos",
    "ko": "보르도 오크",
    "zh": "波尔多橡木",
    "ja": "ボルドーオーク"
  },
  "Carbon": {
    "en": "Carbon Noir",
    "vi": "Than Carbon",
    "fr": "Carbone Noir",
    "de": "Karbonschwarz",
    "it": "Carbonio Nero",
    "es": "Carbono Negro",
    "ko": "카본 블랙",
    "zh": "碳素纯黑",
    "ja": "カーボンブラック"
  },
  "Cardamom Pod": {
    "en": "Cardamom Pod",
    "vi": "Thảo Quả Thanh",
    "fr": "Gousse de Cardamome",
    "de": "Kardamomkapsel",
    "it": "Baccello Cardamomo",
    "es": "Vaina Cardamomo",
    "ko": "카다멈 포드",
    "zh": "白豆蔻香",
    "ja": "カルダモン"
  },
  "Celadon Jade": {
    "en": "Celadon Jade",
    "vi": "Ngọc Bích Men",
    "fr": "Jade Céladon",
    "de": "Seladon-Jade",
    "it": "Giada Celadon",
    "es": "Jade Celadón",
    "ko": "청자 비취",
    "zh": "青瓷玉翠",
    "ja": "青磁翡翠"
  },
  "Celadon Rose": {
    "en": "Celadon Rose",
    "vi": "Hồng Men Ngọc",
    "fr": "Rose Céladon",
    "de": "Seladon-Rose",
    "it": "Rosa Celadon",
    "es": "Rosa Celadón",
    "ko": "청자 장미",
    "zh": "青瓷粉蔷",
    "ja": "青磁ローズ"
  },
  "Celadon Vermilion": {
    "en": "Celadon Vermilion",
    "vi": "Men Chu Sa",
    "fr": "Céladon Vermillon",
    "de": "Seladon-Zinnober",
    "it": "Celadon Vermiglio",
    "es": "Celadón Bermellón",
    "ko": "청자 주홍",
    "zh": "青瓷朱砂",
    "ja": "青磁朱色"
  },
  "Cha Chaan Teng": {
    "en": "Cha Chaan Teng",
    "vi": "Trà Hương Cảng",
    "fr": "Cha Chaan Teng",
    "de": "Cha Chaan Teng",
    "it": "Cha Chaan Teng",
    "es": "Cha Chaan Teng",
    "ko": "차찬텡 그린",
    "zh": "茶餐厅绿",
    "ja": "茶餐廳グリーン"
  },
  "Charcoal": {
    "en": "Charcoal Slate",
    "vi": "Than Đen Tĩnh",
    "fr": "Fusain Profond",
    "de": "Holzkohle",
    "it": "Carboncino",
    "es": "Carbón Vegetal",
    "ko": "차콜 슬레이트",
    "zh": "炭黑石板",
    "ja": "チャコール"
  },
  "Charcoal Moss": {
    "en": "Charcoal Moss",
    "vi": "Rêu Đá Than",
    "fr": "Mousse et Fusain",
    "de": "Holzkohle-Moos",
    "it": "Muschio e Carbone",
    "es": "Musgo de Carbón",
    "ko": "차콜 이끼",
    "zh": "炭黑苔藓",
    "ja": "墨炭苔"
  },
  "Cho Lon Tile": {
    "en": "Cho Lon Tile",
    "vi": "Gạch Chợ Lớn",
    "fr": "Carreau Cho Lon",
    "de": "Cho-Lon-Fliese",
    "it": "Piastrella Cho Lon",
    "es": "Azulejo Cho Lon",
    "ko": "쩌런 타일",
    "zh": "堤岸花砖",
    "ja": "チョロンタイル"
  },
  "Chow Mo-Wan Suit": {
    "en": "Chow Mo-Wan Suit",
    "vi": "Suit Chu Mộ",
    "fr": "Costume Chow Mo-Wan",
    "de": "Chow-Mo-Wan-Anzug",
    "it": "Abito Chow Mo-Wan",
    "es": "Traje Chow Mo-Wan",
    "ko": "주모운 수트",
    "zh": "周慕云西装",
    "ja": "モウワンスーツ"
  },
  "Christmas": {
    "en": "Christmas Pine",
    "vi": "Giáng Sinh Ấm",
    "fr": "Noël Chaleureux",
    "de": "Weihnachtstanne",
    "it": "Natale Caldo",
    "es": "Navidad Cálida",
    "ko": "크리스마스 파인",
    "zh": "暖冬圣诞",
    "ja": "クリスマスパイン"
  },
  "Chungking Jade": {
    "en": "Chungking Jade",
    "vi": "Ngọc Trùng Khánh",
    "fr": "Jade Chungking",
    "de": "Chungking-Jade",
    "it": "Giada Chungking",
    "es": "Jade Chungking",
    "ko": "중경 제이드",
    "zh": "重庆翡翠",
    "ja": "重慶翡翠"
  },
  "Cinema": {
    "en": "Cinema Classic",
    "vi": "Phim Cổ Điển",
    "fr": "Cinéma Classique",
    "de": "Kino-Klassik",
    "it": "Cinema Classico",
    "es": "Cine Clásico",
    "ko": "클래식 시네마",
    "zh": "经典影院",
    "ja": "クラシックシネマ"
  },
  "Corridor Crimson": {
    "en": "Corridor Crimson",
    "vi": "Hành Lang Đỏ",
    "fr": "Couloir Cramoisi",
    "de": "Korridor-Karmesin",
    "it": "Corridoio Cremisi",
    "es": "Pasillo Carmesí",
    "ko": "복도 크림슨",
    "zh": "深廊绯红",
    "ja": "回廊深紅"
  },
  "Courtyard Moss": {
    "en": "Courtyard Moss",
    "vi": "Rêu Sân Vườn",
    "fr": "Mousse de Cour",
    "de": "Hofmoos",
    "it": "Muschio di Cortile",
    "es": "Musgo de Patio",
    "ko": "마당 안개 이끼",
    "zh": "庭院青苔",
    "ja": "中庭の苔"
  },
  "Crimson Ruby": {
    "en": "Crimson Ruby",
    "vi": "Hồng Ngọc Đỏ",
    "fr": "Rubis Cramoisi",
    "de": "Karmesinrubin",
    "it": "Rubino Cremisi",
    "es": "Rubí Carmesí",
    "ko": "크림슨 루비",
    "zh": "绯红红宝",
    "ja": "紅玉クリムゾン"
  },
  "Cyan": {
    "en": "Cyan Aqua",
    "vi": "Xanh Lam Ngọc",
    "fr": "Cyan Lagon",
    "de": "Cyan-Türkis",
    "it": "Ciano Laguna",
    "es": "Cian Laguna",
    "ko": "사이언 아쿠아",
    "zh": "青碧水波",
    "ja": "シアンアクア"
  },
  "Dancheong Moss": {
    "en": "Dancheong Moss",
    "vi": "Rêu Đan Thanh",
    "fr": "Mousse Dancheong",
    "de": "Dancheong-Moos",
    "it": "Muschio Dancheong",
    "es": "Musgo Dancheong",
    "ko": "단청 이끼",
    "zh": "丹青苔痕",
    "ja": "丹青苔"
  },
  "Dark Sepia": {
    "en": "Dark Sepia",
    "vi": "Nâu Đen Cổ",
    "fr": "Sépia Foncé",
    "de": "Dunkelsepia",
    "it": "Seppia Scuro",
    "es": "Sepia Oscuro",
    "ko": "다크 세피아",
    "zh": "深褐古卷",
    "ja": "ダークセピア"
  },
  "Deep Forest Charcoal": {
    "en": "Deep Forest Charcoal",
    "vi": "Than Rừng Sâu",
    "fr": "Charbon Forêt Profonde",
    "de": "Tiefwald-Kohle",
    "it": "Carbone Foresta Cupa",
    "es": "Carbón Bosque Profundo",
    "ko": "깊은 숲 차콜",
    "zh": "幽林深炭",
    "ja": "深林チャコール"
  },
  "Deep Pine": {
    "en": "Deep Pine",
    "vi": "Rừng Thông Sâu",
    "fr": "Pin Profond",
    "de": "Tiefe Kiefer",
    "it": "Pino Profondo",
    "es": "Pino Profundo",
    "ko": "깊은 솔잎",
    "zh": "幽幽苍松",
    "ja": "深緑の松"
  },
  "Dusk": {
    "en": "Dusk Horizon",
    "vi": "Hoàng Hôn Tĩnh",
    "fr": "Crépuscule Paisible",
    "de": "Abenddämmerung",
    "it": "Crepuscolo Calmo",
    "es": "Crepúsculo Sereno",
    "ko": "저녁 노을",
    "zh": "黄昏晚霞",
    "ja": "夕暮れの地平線"
  },
  "Earth Ochre": {
    "en": "Earth Ochre",
    "vi": "Đất Thổ Hoàng",
    "fr": "Ocre Terrestre",
    "de": "Erdocker",
    "it": "Ocra Terrosa",
    "es": "Ocre Terroso",
    "ko": "황토 흙빛",
    "zh": "赭石大地",
    "ja": "黄土アース"
  },
  "Ebony Celadon": {
    "en": "Ebony Celadon",
    "vi": "Mun Men Ngọc",
    "fr": "Ébène et Céladon",
    "de": "Ebenholz-Seladon",
    "it": "Ebano e Celadon",
    "es": "Ébano y Celadón",
    "ko": "흑단 청자",
    "zh": "乌木青瓷",
    "ja": "黒檀青磁"
  },
  "Ember": {
    "en": "Ember Glow",
    "vi": "Tàn Tro Đỏ",
    "fr": "Lueur de Braise",
    "de": "Glutglut",
    "it": "Bagliore di Brace",
    "es": "Resplandor de Brasa",
    "ko": "타오르는 불씨",
    "zh": "余烬微光",
    "ja": "琥珀の残光"
  },
  "Emerald": {
    "en": "Emerald Gem",
    "vi": "Ngọc Lục Bảo",
    "fr": "Émeraude Pure",
    "de": "Smaragd",
    "it": "Smeraldo",
    "es": "Esmeralda",
    "ko": "에메랄드",
    "zh": "天然祖母绿",
    "ja": "エメラルド"
  },
  "Emerald Mosaic": {
    "en": "Emerald Mosaic",
    "vi": "Khảm Ngọc Lục",
    "fr": "Mosaïque Émeraude",
    "de": "Smaragd-Mosaik",
    "it": "Mosaico Smeraldo",
    "es": "Mosaico Esmeralda",
    "ko": "에메랄드 모자이크",
    "zh": "绿宝马赛克",
    "ja": "エメラルドモザイク"
  },
  "Encaustic Indigo": {
    "en": "Encaustic Indigo",
    "vi": "Gạch Bông Chàm",
    "fr": "Indigo Encaustique",
    "de": "Enkaustik-Indigo",
    "it": "Indigo Encausto",
    "es": "Índigo Encaústico",
    "ko": "인카우스틱 인디고",
    "zh": "靛蓝古砖",
    "ja": "エンコースティック藍"
  },
  "Eucalyptus Fog": {
    "en": "Eucalyptus Fog",
    "vi": "Sương Khuynh Diệp",
    "fr": "Brume d'Eucalyptus",
    "de": "Eukalyptusnebel",
    "it": "Nebbia Eucalipto",
    "es": "Niebla de Eucalipto",
    "ko": "유칼립투스 안개",
    "zh": "尤加利薄雾",
    "ja": "ユーカリの霧"
  },
  "Eucalyptus Pear": {
    "en": "Eucalyptus Pear",
    "vi": "Lê Khuynh Diệp",
    "fr": "Poire Eucalyptus",
    "de": "Eukalyptus-Birne",
    "it": "Pera Eucalipto",
    "es": "Pera Eucalipto",
    "ko": "유칼립투스 배",
    "zh": "桉木梨果",
    "ja": "ユーカリ洋梨"
  },
  "Forbidden City": {
    "en": "Forbidden City",
    "vi": "Tử Cấm Thành",
    "fr": "Cité Interdite",
    "de": "Verbotene Stadt",
    "it": "Città Proibita",
    "es": "Ciudad Prohibida",
    "ko": "자금성",
    "zh": "紫禁朱墙",
    "ja": "紫禁城"
  },
  "Forest": {
    "en": "Forest Deep",
    "vi": "Đại Ngàn Xanh",
    "fr": "Forêt Dense",
    "de": "Tiefer Wald",
    "it": "Foresta Fitta",
    "es": "Bosque Espeso",
    "ko": "울창한 숲",
    "zh": "幽邃密林",
    "ja": "深緑の森林"
  },
  "Forest Emerald": {
    "en": "Forest Emerald",
    "vi": "Lục Bảo Rừng",
    "fr": "Émeraude Sylvestre",
    "de": "Waldsmaragd",
    "it": "Smeraldo Silvestre",
    "es": "Esmeralda Silvestre",
    "ko": "포레스트 에메랄드",
    "zh": "林间祖母绿",
    "ja": "フォレストエメラルド"
  },
  "Foxed Paper": {
    "en": "Foxed Paper",
    "vi": "Giấy Cổ Điểm",
    "fr": "Papier Runi",
    "de": "Stockfleckiges Papier",
    "it": "Carta Brunita",
    "es": "Papel Afectado",
    "ko": "고서적 한지",
    "zh": "斑驳古纸",
    "ja": "古びた和紙"
  },
  "Fujifilm Classic Chrome": {
    "en": "Classic Chrome Film",
    "vi": "Phim Classic Chrome",
    "fr": "Film Classic Chrome",
    "de": "Classic Chrome Film",
    "it": "Pellicola Classic Chrome",
    "es": "Película Classic Chrome",
    "ko": "클래식 크롬 필름",
    "zh": "经典正片胶卷",
    "ja": "クラシッククローム"
  },
  "Fujifilm Pro 400H": {
    "en": "Pro 400H Film",
    "vi": "Phim Pro 400H",
    "fr": "Film Pro 400H",
    "de": "Pro 400H Film",
    "it": "Pellicola Pro 400H",
    "es": "Película Pro 400H",
    "ko": "프로 400H 필름",
    "zh": "专业400H胶片",
    "ja": "プロ400Hフィルム"
  },
  "Fujifilm Velvia 50": {
    "en": "Velvia 50 Film",
    "vi": "Phim Velvia 50",
    "fr": "Film Velvia 50",
    "de": "Velvia 50 Film",
    "it": "Pellicola Velvia 50",
    "es": "Película Velvia 50",
    "ko": "벨비아 50 필름",
    "zh": "富士50反转片",
    "ja": "ベルビア50フィルム"
  },
  "Garnet Wine": {
    "en": "Garnet Wine",
    "vi": "Rượu Vang Ngọc",
    "fr": "Grenat Vin",
    "de": "Granatwein",
    "it": "Vino Granato",
    "es": "Vino Granate",
    "ko": "가넷 와인",
    "zh": "石榴酒红",
    "ja": "ガーネットワイン"
  },
  "Green Papaya": {
    "en": "Green Papaya",
    "vi": "Đu Đủ Xanh",
    "fr": "Papaye Verte",
    "de": "Grüne Papaya",
    "it": "Papaya Verde",
    "es": "Papaya Verde",
    "ko": "그린 파파야",
    "zh": "青青木瓜",
    "ja": "青いパパイヤ"
  },
  "Hanoi Autumn": {
    "en": "Hanoi Autumn",
    "vi": "Thu Hà Nội",
    "fr": "Automne Hanoï",
    "de": "Hanoi-Herbst",
    "it": "Autunno Hanoi",
    "es": "Otoño Hanói",
    "ko": "하노이의 가을",
    "zh": "河内初秋",
    "ja": "ハノイの秋"
  },
  "Hanoi Nostalgia": {
    "en": "Hanoi Nostalgia",
    "vi": "Hà Nội Xưa",
    "fr": "Nostalgie Hanoï",
    "de": "Hanoi-Nostalgie",
    "it": "Nostalgia Hanoi",
    "es": "Nostalgia Hanói",
    "ko": "하노이 노스탤지어",
    "zh": "河内旧忆",
    "ja": "ハノイ哀愁"
  },
  "Hanoi Yellow Wall": {
    "en": "Hanoi Yellow Wall",
    "vi": "Tường Vàng Phố",
    "fr": "Mur Jaune Hanoï",
    "de": "Gelbe Wand Hanoi",
    "it": "Muro Giallo Hanoi",
    "es": "Muro Amarillo Hanói",
    "ko": "하노이 노란 벽",
    "zh": "河内黄墙",
    "ja": "ハノイ黄壁"
  },
  "Hanok Cheongja": {
    "en": "Hanok Cheongja",
    "vi": "Thanh Từ Hanok",
    "fr": "Hanok Cheongja",
    "de": "Hanok Cheongja",
    "it": "Hanok Cheongja",
    "es": "Hanok Cheongja",
    "ko": "한옥 청자",
    "zh": "韩屋青瓷",
    "ja": "韓屋青磁"
  },
  "Hue Imperial Purple": {
    "en": "Hue Imperial Purple",
    "vi": "Tím Xứ Huế",
    "fr": "Pourpre Impérial Hué",
    "de": "Hue-Kaiserpurpur",
    "it": "Porpora Imperiale Hue",
    "es": "Púrpura Imperial Hué",
    "ko": "후에 황실 퍼플",
    "zh": "顺化御紫",
    "ja": "フエ王室紫"
  },
  "Hue Perfume River": {
    "en": "Hue Perfume River",
    "vi": "Sông Hương Huế",
    "fr": "Rivière des Parfums",
    "de": "Parfüm-Fluss Hue",
    "it": "Fiume Profumi Hue",
    "es": "Río Perfume Hué",
    "ko": "후에 향강 물결",
    "zh": "顺化香江",
    "ja": "フエ香江"
  },
  "Hydrangea": {
    "en": "Hydrangea Bloom",
    "vi": "Cẩm Tú Cầu",
    "fr": "Hortensia en Fleur",
    "de": "Hortensienblüte",
    "it": "Ortensia in Fiore",
    "es": "Hortensia en Flor",
    "ko": "수국 블룸",
    "zh": "绣球绽放",
    "ja": "紫陽花ブルー"
  },
  "Indochine Emerald": {
    "en": "Indochine Emerald",
    "vi": "Ngọc Đông Dương",
    "fr": "Émeraude Indochine",
    "de": "Indochina-Smaragd",
    "it": "Smeraldo Indocina",
    "es": "Esmeralda Indochina",
    "ko": "인도차이나 에메랄드",
    "zh": "印度支那翠绿",
    "ja": "インドシナエメラルド"
  },
  "Indochine Villa": {
    "en": "Indochine Villa",
    "vi": "Villa Đông Dương",
    "fr": "Villa Indochine",
    "de": "Indochina-Villa",
    "it": "Villa Indocina",
    "es": "Villa Indochina",
    "ko": "인도차이나 빌라",
    "zh": "法属别墅",
    "ja": "インドシナヴィラ"
  },
  "Ivory": {
    "en": "Ivory Warmth",
    "vi": "Ngà Tinh Khôi",
    "fr": "Ivoire Délicat",
    "de": "Elfenbein",
    "it": "Avorio Delicato",
    "es": "Marfil Delicado",
    "ko": "아이보리 웜",
    "zh": "温润象牙",
    "ja": "アイボリー"
  },
  "Jadeite Imperial": {
    "en": "Jadeite Imperial",
    "vi": "Phỉ Thúy Quý",
    "fr": "Jadéite Impériale",
    "de": "Kaiserlicher Jadeit",
    "it": "Giada Imperiale",
    "es": "Jadeíta Imperial",
    "ko": "임페리얼 비취",
    "zh": "皇家翡翠",
    "ja": "皇帝翡翠"
  },
  "Jasmine": {
    "en": "Jasmine White",
    "vi": "Hoa Nhài Trắng",
    "fr": "Jasmin Blanc",
    "de": "Jasminblüte",
    "it": "Gelsomino Bianco",
    "es": "Jazmín Blanco",
    "ko": "자스민 화이트",
    "zh": "茉莉清香",
    "ja": "白ジャスミン"
  },
  "Kodak Ektar 100": {
    "en": "Ektar 100 Film",
    "vi": "Phim Ektar 100",
    "fr": "Film Ektar 100",
    "de": "Ektar 100 Film",
    "it": "Pellicola Ektar 100",
    "es": "Película Ektar 100",
    "ko": "엑타 100 필름",
    "zh": "柯达Ektar100",
    "ja": "エクター100"
  },
  "Kodak Gold 200": {
    "en": "Gold 200 Film",
    "vi": "Phim Gold 200",
    "fr": "Film Gold 200",
    "de": "Gold 200 Film",
    "it": "Pellicola Gold 200",
    "es": "Película Gold 200",
    "ko": "골드 200 필름",
    "zh": "柯达金200",
    "ja": "ゴールド200"
  },
  "Kodak Portra 400": {
    "en": "Portra 400 Film",
    "vi": "Phim Portra 400",
    "fr": "Film Portra 400",
    "de": "Portra 400 Film",
    "it": "Pellicola Portra 400",
    "es": "Película Portra 400",
    "ko": "포트라 400 필름",
    "zh": "柯达Portra400",
    "ja": "ポートラ400"
  },
  "Koke Moss": {
    "en": "Koke Moss Zen",
    "vi": "Rêu Thiền Koke",
    "fr": "Mousse Zen Koke",
    "de": "Koke-Moos Zen",
    "it": "Muschio Zen Koke",
    "es": "Musgo Zen Koke",
    "ko": "이끼 정원 코케",
    "zh": "苔寺禅苔",
    "ja": "苔庭Zen"
  },
  "Kowloon Harbour": {
    "en": "Kowloon Harbour",
    "vi": "Cảng Cửu Long",
    "fr": "Port de Kowloon",
    "de": "Kowloon-Hafen",
    "it": "Porto di Kowloon",
    "es": "Puerto de Kowloon",
    "ko": "구룡 항구",
    "zh": "九龙海港",
    "ja": "九龍ハーバー"
  },
  "Lacquer Gold": {
    "en": "Lacquer Gold",
    "vi": "Sơn Mài Vàng",
    "fr": "Laque Dorée",
    "de": "Lackgold",
    "it": "Lacca Dorata",
    "es": "Laca Dorada",
    "ko": "칠기 황금",
    "zh": "金漆漆艺",
    "ja": "金箔漆器"
  },
  "Latte": {
    "en": "Creamy Latte",
    "vi": "Cà Phê Latte",
    "fr": "Latte Onctueux",
    "de": "Cremiger Latte",
    "it": "Latte Cremoso",
    "es": "Café Latte",
    "ko": "크리미 라떼",
    "zh": "温润拿铁",
    "ja": "クリーミーラテ"
  },
  "Lavender": {
    "en": "Lavender Mist",
    "vi": "Oải Hương Tím",
    "fr": "Lavande Douce",
    "de": "Lavendel",
    "it": "Lavanda Gentile",
    "es": "Lavanda Suave",
    "ko": "라벤더 미스트",
    "zh": "薰衣草香",
    "ja": "ラベンダーミスト"
  },
  "Lotus": {
    "en": "Lotus Blossom",
    "vi": "Hoa Sen Tươi",
    "fr": "Fleur de Lotus",
    "de": "Lotusblüte",
    "it": "Fiore di Loto",
    "es": "Flor de Loto",
    "ko": "연꽃 블룸",
    "zh": "出水芙蓉",
    "ja": "蓮の花"
  },
  "Marigold": {
    "en": "Golden Marigold",
    "vi": "Cúc Vạn Thọ",
    "fr": "Souci Doré",
    "de": "Ringelblume",
    "it": "Calendula Dorata",
    "es": "Caléndula Dorada",
    "ko": "금잔화 마리골드",
    "zh": "金盏万寿",
    "ja": "マリーゴールド"
  },
  "Matcha": {
    "en": "Ceremonial Matcha",
    "vi": "Trà Xanh Matcha",
    "fr": "Thé Matcha",
    "de": "Matcha-Tee",
    "it": "Tè Matcha",
    "es": "Té Matcha",
    "ko": "말차 그린",
    "zh": "清雅抹茶",
    "ja": "宇治抹茶"
  },
  "Mediterranean Olive": {
    "en": "Mediterranean Olive",
    "vi": "Ô Liu Biển",
    "fr": "Olive Méditerranée",
    "de": "Mittelmeer-Olive",
    "it": "Oliva Mediterranea",
    "es": "Oliva Mediterránea",
    "ko": "지중해 올리브",
    "zh": "地中海橄榄",
    "ja": "地中海オリーブ"
  },
  "Midnight": {
    "en": "Midnight Silence",
    "vi": "Đêm Tĩnh Mịch",
    "fr": "Minuit Paisible",
    "de": "Mitternacht",
    "it": "Mezzanotte Calma",
    "es": "Medianoche Serena",
    "ko": "고요한 자정",
    "zh": "寂静午夜",
    "ja": "真夜中の静寂"
  },
  "Midnight Camellia": {
    "en": "Midnight Camellia",
    "vi": "Trà Mi Đêm",
    "fr": "Camélia de Minuit",
    "de": "Mitternachts-Kamelie",
    "it": "Camelia di Mezzanotte",
    "es": "Camelia de Medianoche",
    "ko": "미드나잇 카멜리아",
    "zh": "夜色山茶",
    "ja": "夜咲き椿"
  },
  "Midnight Gold": {
    "en": "Midnight Gold",
    "vi": "Vàng Đêm Trăng",
    "fr": "Or Minuit",
    "de": "Mitternachtsgold",
    "it": "Oro Mezzanotte",
    "es": "Oro Medianoche",
    "ko": "미드나잇 골드",
    "zh": "午夜碎金",
    "ja": "ミッドナイトゴールド"
  },
  "Mido Cafe Tile": {
    "en": "Mido Cafe Tile",
    "vi": "Gạch Quán Mido",
    "fr": "Carreau Café Mido",
    "de": "Mido-Café-Fliese",
    "it": "Piastrella Café Mido",
    "es": "Azulejo Café Mido",
    "ko": "미도 카페 타일",
    "zh": "美都咖啡砖",
    "ja": "美都カフェタイル"
  },
  "Mint": {
    "en": "Fresh Mint",
    "vi": "Bạc Hà Mát",
    "fr": "Menthe Fraîche",
    "de": "Frische Minze",
    "it": "Menta Fresca",
    "es": "Menta Fresca",
    "ko": "프레시 민트",
    "zh": "清爽薄荷",
    "ja": "フレッシュミント"
  },
  "Mood Velvet": {
    "en": "Mood Velvet",
    "vi": "Nhung Đỏ Mơ",
    "fr": "Velours Nostalgique",
    "de": "Nostalgie-Samt",
    "it": "Velluto Nostalgico",
    "es": "Terciopelo Nostálgico",
    "ko": "화양연화 벨벳",
    "zh": "花样年华丝绒",
    "ja": "追憶のベルベット"
  },
  "Moonlit Pine": {
    "en": "Moonlit Pine",
    "vi": "Thông Dưới Trăng",
    "fr": "Pin Sous Lune",
    "de": "Mondschein-Kiefer",
    "it": "Pino di Luna",
    "es": "Pino de Luna",
    "ko": "달빛 솔잎",
    "zh": "月下松影",
    "ja": "月光松"
  },
  "Moshi Persimmon": {
    "en": "Moshi Persimmon",
    "vi": "Hồng Sấy Moshi",
    "fr": "Kaki Moshi",
    "de": "Moshi-Kaki",
    "it": "Cachi Moshi",
    "es": "Caqui Moshi",
    "ko": "모시 감꽃",
    "zh": "柿红雅素",
    "ja": "柿渋モシ"
  },
  "Mustard Azulejo": {
    "en": "Mustard Azulejo",
    "vi": "Gạch Mù Tạt",
    "fr": "Azulejo Moutarde",
    "de": "Senf-Azulejo",
    "it": "Azulejo Senape",
    "es": "Azulejo Mostaza",
    "ko": "머스터드 아줄레주",
    "zh": "芥末花砖",
    "ja": "マスタードアズレージョ"
  },
  "Nature": {
    "en": "Nature Essence",
    "vi": "Thiên Nhiên Xanh",
    "fr": "Essence de Nature",
    "de": "Natur-Essenz",
    "it": "Essenza di Natura",
    "es": "Esencia Natural",
    "ko": "자연의 숨결",
    "zh": "自然原野",
    "ja": "自然の息吹"
  },
  "Night": {
    "en": "Night Veil",
    "vi": "Màn Đêm Dịu",
    "fr": "Voile de Nuit",
    "de": "Nachtschleier",
    "it": "Velo di Notte",
    "es": "Velo Nocturno",
    "ko": "밤의 베일",
    "zh": "静夜面纱",
    "ja": "夜のとばり"
  },
  "Night Ocean Abyss": {
    "en": "Night Ocean Abyss",
    "vi": "Biển Đêm Sâu",
    "fr": "Abîme Océan Nocturne",
    "de": "Nachtozean-Abgrund",
    "it": "Abisso Oceano Notturno",
    "es": "Abismo Océano Nocturno",
    "ko": "밤바다 심연",
    "zh": "夜海深渊",
    "ja": "夜の海洋深層"
  },
  "Normal": {
    "en": "Classic Slate",
    "vi": "Xám Cân Bằng",
    "fr": "Ardoise Classique",
    "de": "Klassischer Schiefer",
    "it": "Ardesia Classica",
    "es": "Pizarra Clásica",
    "ko": "클래식 슬레이트",
    "zh": "经典墨灰",
    "ja": "クラシックスレート"
  },
  "OLED": {
    "en": "Pure OLED Black",
    "vi": "Đen OLED",
    "fr": "Noir Pur OLED",
    "de": "Reines OLED-Schwarz",
    "it": "Nero Assoluto OLED",
    "es": "Negro Puro OLED",
    "ko": "트루 블랙 OLED",
    "zh": "极致纯黑OLED",
    "ja": "真黒OLED"
  },
  "Obsidian": {
    "en": "Obsidian Shimmer",
    "vi": "Đá Hắc Nguyệt",
    "fr": "Obsidienne Pure",
    "de": "Obsidian",
    "it": "Ossidiana",
    "es": "Obsidiana",
    "ko": "흑요석 흑단",
    "zh": "黑曜墨光",
    "ja": "黒曜石"
  },
  "Ocean": {
    "en": "Ocean Breeze",
    "vi": "Gió Biển Xanh",
    "fr": "Brise Marine",
    "de": "Meeresbrise",
    "it": "Brezza Marina",
    "es": "Brisa Marina",
    "ko": "오션 브리즈",
    "zh": "海蓝微风",
    "ja": "オーシャンブリーズ"
  },
  "Ocean Sapphire": {
    "en": "Ocean Sapphire",
    "vi": "Lam Ngọc Biển",
    "fr": "Saphir Océanique",
    "de": "Ozeansaphir",
    "it": "Zaffiro Oceanico",
    "es": "Zafiro Oceánico",
    "ko": "오션 사파이어",
    "zh": "海蓝宝石",
    "ja": "オーシャンサファイア"
  },
  "Olive Branch": {
    "en": "Olive Branch",
    "vi": "Nhành Ô Liu",
    "fr": "Branche d'Olivier",
    "de": "Olivenzweig",
    "it": "Ramo d'Ulivo",
    "es": "Rama de Olivo",
    "ko": "올리브 나뭇가지",
    "zh": "青橄榄枝",
    "ja": "オリーブの枝"
  },
  "Onyx": {
    "en": "Onyx Stone",
    "vi": "Mã Não Đen",
    "fr": "Pierre d'Onyx",
    "de": "Onyxstein",
    "it": "Pietra d'Onice",
    "es": "Piedra Ónix",
    "ko": "오닉스 스톤",
    "zh": "幽邃黑玛瑙",
    "ja": "ブラックオニキス"
  },
  "Orchid": {
    "en": "Wild Orchid",
    "vi": "Hoa Phong Lan",
    "fr": "Orchidée Sauvage",
    "de": "Wilde Orchidee",
    "it": "Orchidea Selvatica",
    "es": "Orquídea Silvestre",
    "ko": "야생 난초",
    "zh": "幽谷幽兰",
    "ja": "野生の蘭"
  },
  "Papyrus": {
    "en": "Ancient Papyrus",
    "vi": "Giấy Cói Cổ",
    "fr": "Papyrus Ancien",
    "de": "Antiker Papyrus",
    "it": "Papiro Antico",
    "es": "Papiro Antiguo",
    "ko": "고대 파피루스",
    "zh": "古埃及莎草",
    "ja": "古代パピルス"
  },
  "Parchment": {
    "en": "Aged Parchment",
    "vi": "Giấy Da Cổ",
    "fr": "Parchemin Ancien",
    "de": "Altes Pergament",
    "it": "Pergamena Antica",
    "es": "Pergamino Antiguo",
    "ko": "고서 양피지",
    "zh": "复古羊皮纸",
    "ja": "羊皮紙ペーパー"
  },
  "Pastel Pink": {
    "en": "Pastel Pink",
    "vi": "Hồng Phấn Nhẹ",
    "fr": "Rose Pastel",
    "de": "Pastellrosa",
    "it": "Rosa Pastello",
    "es": "Rosa Pastel",
    "ko": "파스텔 핑크",
    "zh": "柔粉轻霞",
    "ja": "パステルピンク"
  },
  "Peach": {
    "en": "Sweet Peach",
    "vi": "Đào Tiên Hồng",
    "fr": "Pêche Douce",
    "de": "Süßer Pfirsich",
    "it": "Pesca Dolce",
    "es": "Melocotón Dulce",
    "ko": "스위트 피치",
    "zh": "春日蜜桃",
    "ja": "スイートピーチ"
  },
  "Peridot Olive": {
    "en": "Peridot Olive",
    "vi": "Ngọc Ô Liu",
    "fr": "Péridot Olive",
    "de": "Peridot-Olive",
    "it": "Peridoto Oliva",
    "es": "Peridoto Oliva",
    "ko": "페리도트 올리브",
    "zh": "橄榄绿辉",
    "ja": "ペリドットオリーブ"
  },
  "Pistachio Cream": {
    "en": "Pistachio Cream",
    "vi": "Kem Dẻ Cười",
    "fr": "Crème de Pistache",
    "de": "Pistaziencreme",
    "it": "Crema al Pistacchio",
    "es": "Crema de Pistacho",
    "ko": "피스타치오 크림",
    "zh": "开心果奶绿",
    "ja": "ピスタチオクリーム"
  },
  "Poster Crimson": {
    "en": "Poster Crimson",
    "vi": "Đỏ Áp Phích",
    "fr": "Affiche Cramoisie",
    "de": "Poster-Karmesin",
    "it": "Manifesto Cremisi",
    "es": "Póster Carmesí",
    "ko": "포스터 크림슨",
    "zh": "海报丹红",
    "ja": "ポスタークリムゾン"
  },
  "Qipao Velvet": {
    "en": "Qipao Velvet",
    "vi": "Nhung Kỳ Bào",
    "fr": "Velours de Qipao",
    "de": "Qipao-Samt",
    "it": "Velluto Qipao",
    "es": "Terciopelo Qipao",
    "ko": "치파오 벨벳",
    "zh": "旗袍丝绒",
    "ja": "チャイナドレス絹"
  },
  "Retro Mint": {
    "en": "Retro Mint",
    "vi": "Bạc Hà Cổ",
    "fr": "Menthe Rétro",
    "de": "Retro-Minze",
    "it": "Menta Retrò",
    "es": "Menta Retro",
    "ko": "레트로 민트",
    "zh": "复古薄荷",
    "ja": "レトロミント"
  },
  "Rose": {
    "en": "Damask Rose",
    "vi": "Hoa Hồng Nhung",
    "fr": "Rose de Damas",
    "de": "Damaszener Rose",
    "it": "Rosa Damascena",
    "es": "Rosa Damascena",
    "ko": "다마스크 로즈",
    "zh": "绯红蔷薇",
    "ja": "ダマスクローズ"
  },
  "Rose Clay Tile": {
    "en": "Rose Clay Tile",
    "vi": "Gạch Sét Hồng",
    "fr": "Tuile d'Argile Rose",
    "de": "Rosa Tonfliese",
    "it": "Tegola Argilla Rosa",
    "es": "Teja Arcilla Rosa",
    "ko": "로즈 점토 타일",
    "zh": "粉陶泥瓦",
    "ja": "ローズクレイ瓦"
  },
  "Rosewood Teal": {
    "en": "Rosewood Teal",
    "vi": "Cẩm Lai Lam",
    "fr": "Palissandre et Sarcelle",
    "de": "Palisander-Blaugrün",
    "it": "Palissandro e Foglia",
    "es": "Palisandro y Cerceta",
    "ko": "로즈우드 틸",
    "zh": "酸枝青蓝",
    "ja": "紫檀ティール"
  },
  "Ruby": {
    "en": "Burma Ruby",
    "vi": "Hồng Ngọc Quý",
    "fr": "Rubis Précieux",
    "de": "Burma-Rubin",
    "it": "Rubino Prezioso",
    "es": "Rubí Precioso",
    "ko": "버마 루비",
    "zh": "鸽血红宝",
    "ja": "バーマルビー"
  },
  "Sage": {
    "en": "Sage Serenity",
    "vi": "Lá Xô Thơm",
    "fr": "Sauge Douce",
    "de": "Salbeigrün",
    "it": "Salvia Gentile",
    "es": "Salvia Serena",
    "ko": "세이지 그린",
    "zh": "静雅鼠尾草",
    "ja": "セージグリーン"
  },
  "Sage Apricot": {
    "en": "Sage Apricot",
    "vi": "Xô Thơm Mơ",
    "fr": "Sauge et Abricot",
    "de": "Salbei-Aprikose",
    "it": "Salvia e Albicocca",
    "es": "Salvia y Albaricoque",
    "ko": "세이지 살구꽃",
    "zh": "鼠尾杏花",
    "ja": "セージ杏の花"
  },
  "Sage Nordic": {
    "en": "Sage Nordic",
    "vi": "Xô Bắc Âu",
    "fr": "Sauge Nordique",
    "de": "Nordischer Salbei",
    "it": "Salvia Nordica",
    "es": "Salvia Nórdica",
    "ko": "노르딕 세이지",
    "zh": "北欧鼠尾草",
    "ja": "北欧セージ"
  },
  "Saigon Filter Coffee": {
    "en": "Saigon Filter Coffee",
    "vi": "Cà Phê Phin",
    "fr": "Café Phin Saïgon",
    "de": "Saigon-Filterkaffee",
    "it": "Caffè Filtro Saigon",
    "es": "Café Filtro Saigón",
    "ko": "사이공 핀 커피",
    "zh": "西贡滴漏咖啡",
    "ja": "サイゴン珈琲"
  },
  "Saigon Shutters": {
    "en": "Saigon Shutters",
    "vi": "Chớp Sài Gòn",
    "fr": "Volets de Saïgon",
    "de": "Saigon-Fensterläden",
    "it": "Persiane di Saigon",
    "es": "Persianas de Saigón",
    "ko": "사이공 덧문 그린",
    "zh": "西贡绿百叶",
    "ja": "サイゴン木窓"
  },
  "Sakura": {
    "en": "Sakura Blossom",
    "vi": "Hoa Anh Đào",
    "fr": "Fleur de Sakura",
    "de": "Kirschblüte",
    "it": "Fiore di Ciliegio",
    "es": "Flor de Cerezo",
    "ko": "사쿠라 블룸",
    "zh": "樱落如雪",
    "ja": "桜ブロッサム"
  },
  "Sapphire": {
    "en": "Royal Sapphire",
    "vi": "Lam Ngọc Quý",
    "fr": "Saphir Royal",
    "de": "Königs-Saphir",
    "it": "Zaffiro Reale",
    "es": "Zafiro Real",
    "ko": "로열 사파이어",
    "zh": "皇家蓝宝",
    "ja": "ロイヤルサファイア"
  },
  "Sea": {
    "en": "Deep Sea Ocean",
    "vi": "Đại Dương Sâu",
    "fr": "Océan Profond",
    "de": "Tiefe See",
    "it": "Oceano Profondo",
    "es": "Océano Profundo",
    "ko": "깊은 푸른 바다",
    "zh": "幽蓝深海",
    "ja": "紺碧の海"
  },
  "Sea Glass": {
    "en": "Sea Glass",
    "vi": "Thủy Tinh Biển",
    "fr": "Verre de Mer",
    "de": "Meerglas",
    "it": "Vetro di Mare",
    "es": "Vidrio Marino",
    "ko": "씨 글래스",
    "zh": "海玻璃晶",
    "ja": "シーグラス"
  },
  "Sencha Leaf": {
    "en": "Sencha Leaf",
    "vi": "Lá Trà Sencha",
    "fr": "Feuille de Sencha",
    "de": "Senchablatt",
    "it": "Foglia di Sencha",
    "es": "Hoja de Sencha",
    "ko": "센차 녹차잎",
    "zh": "煎茶青叶",
    "ja": "煎茶リーフ"
  },
  "Sepia": {
    "en": "Warm Sepia",
    "vi": "Nâu Cổ Sepia",
    "fr": "Sépia Chaleureux",
    "de": "Warmes Sepia",
    "it": "Seppia Caldo",
    "es": "Sepia Cálido",
    "ko": "웜 세피아",
    "zh": "暖调怀旧",
    "ja": "ウォームセピア"
  },
  "Sky": {
    "en": "Azure Sky",
    "vi": "Trời Xanh Trong",
    "fr": "Ciel Azur",
    "de": "Azurblauer Himmel",
    "it": "Cielo Azzurro",
    "es": "Cielo Azul",
    "ko": "맑은 푸른 하늘",
    "zh": "碧空如洗",
    "ja": "青空スカイ"
  },
  "Smoky Quartz": {
    "en": "Smoky Quartz",
    "vi": "Thạch Anh Khói",
    "fr": "Quartz Fumé",
    "de": "Rauchquarz",
    "it": "Quarzo Fumé",
    "es": "Cuarzo Ahumado",
    "ko": "스모키 쿼츠",
    "zh": "烟晶墨影",
    "ja": "スモーキークォーツ"
  },
  "Song Celadon": {
    "en": "Song Celadon",
    "vi": "Thanh Từ Tống",
    "fr": "Céladon des Song",
    "de": "Song-Seladon",
    "it": "Celadon dei Song",
    "es": "Celadón de Song",
    "ko": "송나라 청자",
    "zh": "宋代青瓷",
    "ja": "宋代青磁"
  },
  "Spinel Plum": {
    "en": "Spinel Plum",
    "vi": "Mận Chín Spinel",
    "fr": "Prune Spinelle",
    "de": "Spinell-Pflaume",
    "it": "Prugna Spinello",
    "es": "Ciruela Espinela",
    "ko": "스피넬 플럼",
    "zh": "尖晶紫李",
    "ja": "スピネルプラム"
  },
  "Spring Apricot": {
    "en": "Spring Apricot",
    "vi": "Mai Vàng Xuân",
    "fr": "Abricot du Printemps",
    "de": "Frühlings-Aprikose",
    "it": "Albicocca di Primavera",
    "es": "Albaricoque Primaveral",
    "ko": "봄날의 살구꽃",
    "zh": "早春杏花",
    "ja": "春の杏花"
  },
  "Sumi Washi": {
    "en": "Sumi Washi",
    "vi": "Giấy Mực Sumi",
    "fr": "Papier Sumi Washi",
    "de": "Sumi-Washi-Papier",
    "it": "Carta Sumi Washi",
    "es": "Papel Sumi Washi",
    "ko": "수미 화선지",
    "zh": "和纸墨印",
    "ja": "墨和紙"
  },
  "Tatami Reed": {
    "en": "Tatami Reed",
    "vi": "Chiếu Cói Tatami",
    "fr": "Roseau de Tatami",
    "de": "Tatami-Schilf",
    "it": "Giunco Tatami",
    "es": "Junco Tatami",
    "ko": "다다미 골풀",
    "zh": "塌塌米青席",
    "ja": "畳の藺草"
  },
  "Tea Cinnamon": {
    "en": "Tea Cinnamon",
    "vi": "Trà Quế Thơm",
    "fr": "Thé Cannelle",
    "de": "Zimttee",
    "it": "Tè alla Cannella",
    "es": "Té de Canela",
    "ko": "시나몬 홍차",
    "zh": "肉桂香茗",
    "ja": "シナモンティー"
  },
  "Teak Peach": {
    "en": "Teak Peach",
    "vi": "Gỗ Tếch Đào",
    "fr": "Teck et Pêche",
    "de": "Teakholz-Pfirsich",
    "it": "Teak e Pesca",
    "es": "Teca y Melocotón",
    "ko": "티크 복숭아꽃",
    "zh": "柚木桃花",
    "ja": "チーク桃の花"
  },
  "Teakwood Palm": {
    "en": "Teakwood Palm",
    "vi": "Gỗ Tếch Cọ",
    "fr": "Teck et Palmier",
    "de": "Teak und Palme",
    "it": "Teak e Palma",
    "es": "Teca y Palma",
    "ko": "티크 팜트리",
    "zh": "柚木棕榈",
    "ja": "チークパーム"
  },
  "Terracotta": {
    "en": "Rustic Terracotta",
    "vi": "Đất Nung Mộc",
    "fr": "Terre Cuite Rustique",
    "de": "Rustikale Terrakotta",
    "it": "Terracotta Rustica",
    "es": "Terracota Rústica",
    "ko": "러스틱 테라코타",
    "zh": "质朴陶红",
    "ja": "素焼きテラコッタ"
  },
  "Terracotta Majolica": {
    "en": "Terracotta Majolica",
    "vi": "Gốm Men Majolica",
    "fr": "Majolique Terre Cuite",
    "de": "Majolika-Terrakotta",
    "it": "Maiolica Terracotta",
    "es": "Mayólica Terracota",
    "ko": "마욜리카 테라코타",
    "zh": "马约利卡陶瓦",
    "ja": "マヨリカ陶器"
  },
  "Thai Green Tea": {
    "en": "Thai Green Tea",
    "vi": "Trà Xanh Thái",
    "fr": "Thé Vert Thaï",
    "de": "Thailändischer Grüntee",
    "it": "Tè Verde Thai",
    "es": "Té Verde Tailandés",
    "ko": "타이 그린티",
    "zh": "泰式绿奶茶",
    "ja": "タイグリーンティー"
  },
  "Thai Red Tea": {
    "en": "Thai Red Tea",
    "vi": "Trà Đỏ Thái",
    "fr": "Thé Rouge Thaï",
    "de": "Thailändischer Roter Tee",
    "it": "Tè Rosso Thai",
    "es": "Té Rojo Tailandés",
    "ko": "타이 밀크티",
    "zh": "泰式正宗红茶",
    "ja": "タイレッドティー"
  },
  "Tigers Eye": {
    "en": "Tigers Eye Gem",
    "vi": "Đá Mắt Hổ",
    "fr": "Œil de Tigre",
    "de": "Tigerauge",
    "it": "Occhio di Tigre",
    "es": "Ojo de Tigre",
    "ko": "호안석 타이거즈아이",
    "zh": "金黄虎眼石",
    "ja": "タイガーズアイ"
  },
  "Tobacco Amber": {
    "en": "Tobacco Amber",
    "vi": "Hổ Phách Khói",
    "fr": "Tabac et Ambre",
    "de": "Tabak-Bernstein",
    "it": "Tabacco e Ambra",
    "es": "Tabaco y Ámbar",
    "ko": "타바코 앰버",
    "zh": "琥珀烟草",
    "ja": "タバコアンバー"
  },
  "Topaz": {
    "en": "Imperial Topaz",
    "vi": "Hoàng Ngọc Topaz",
    "fr": "Topaze Impériale",
    "de": "Imperialer Topas",
    "it": "Topazio Imperiale",
    "es": "Topacio Imperial",
    "ko": "임페리얼 토파즈",
    "zh": "帝王托帕石",
    "ja": "インペリアルトパーズ"
  },
  "Twilight Amethyst": {
    "en": "Twilight Amethyst",
    "vi": "Thạch Anh Tím",
    "fr": "Améthyste Crépuscule",
    "de": "Dämmerungs-Amethyst",
    "it": "Ametista Crepuscolo",
    "es": "Amatista Crepúsculo",
    "ko": "황혼의 자수정",
    "zh": "薄暮紫晶",
    "ja": "黄昏アメジスト"
  },
  "Velvet Moss": {
    "en": "Velvet Moss",
    "vi": "Rêu Nhung Mềm",
    "fr": "Mousse Veloutée",
    "de": "Samtmoos",
    "it": "Muschio Vellutato",
    "es": "Musgo Aterciopelado",
    "ko": "벨벳 이끼",
    "zh": "丝绒青苔",
    "ja": "ベルベット苔"
  },
  "Vertical Sun": {
    "en": "Vertical Sun",
    "vi": "Tia Nắng Hạ",
    "fr": "Rayon de Soleil",
    "de": "Senkrechte Sonne",
    "it": "Raggio di Sole",
    "es": "Rayo de Sol",
    "ko": "수직의 햇살",
    "zh": "炎夏垂阳",
    "ja": "垂直の光柱"
  },
  "Vintage Kraft": {
    "en": "Vintage Kraft Paper",
    "vi": "Giấy Xi Măng",
    "fr": "Kraft Vintage",
    "de": "Vintage-Kraftpapier",
    "it": "Carta Kraft Vintage",
    "es": "Papel Kraft Vintage",
    "ko": "빈티지 크라프트지",
    "zh": "复古牛皮纸",
    "ja": "クラフトペーパー"
  },
  "Wasabi Mist": {
    "en": "Wasabi Mist",
    "vi": "Sương Xanh Wasabi",
    "fr": "Brume de Wasabi",
    "de": "Wasabinebel",
    "it": "Nebbia di Wasabi",
    "es": "Niebla de Wasabi",
    "ko": "와사비 미스트",
    "zh": "芥末绿霭",
    "ja": "わさびの靄"
  },
  "Willow Violet": {
    "en": "Willow Violet",
    "vi": "Liễu Rủ Tím",
    "fr": "Saule et Violette",
    "de": "Weiden-Violett",
    "it": "Salice e Viola",
    "es": "Sauce y Violeta",
    "ko": "버들 제비꽃",
    "zh": "烟柳紫萝",
    "ja": "柳紫ヴァイオレット"
  },
  "Winter Cypress": {
    "en": "Winter Cypress",
    "vi": "Trắc Mùa Đông",
    "fr": "Cyprès d'Hiver",
    "de": "Winterzypresse",
    "it": "Cipresso d'Inverno",
    "es": "Ciprés de Invierno",
    "ko": "겨울 편백나무",
    "zh": "冬日扁柏",
    "ja": "冬の糸杉"
  },
  "Yunnan Tea Mountains": {
    "en": "Yunnan Tea Mountains",
    "vi": "Chè Vân Nam",
    "fr": "Montagnes de Yunnan",
    "de": "Yunnan-Teeberge",
    "it": "Monti Tè Yunnan",
    "es": "Montes de Yunnan",
    "ko": "윈난 차밭",
    "zh": "云南茶山",
    "ja": "雲南の茶山"
  }
};

const SUFFIXES: Record<string, Record<Lang, string>> = {
  "Light": {
    "en": "Light",
    "vi": "Sáng",
    "fr": "Clair",
    "de": "Hell",
    "it": "Chiaro",
    "es": "Claro",
    "ko": "라이트",
    "zh": "浅色",
    "ja": "ライト"
  },
  "Dark": {
    "en": "Dark",
    "vi": "Tối",
    "fr": "Sombre",
    "de": "Dunkel",
    "it": "Scuro",
    "es": "Oscuro",
    "ko": "다크",
    "zh": "深色",
    "ja": "ダーク"
  },
  "OLED": {
    "en": "OLED",
    "vi": "OLED",
    "fr": "OLED",
    "de": "OLED",
    "it": "OLED",
    "es": "OLED",
    "ko": "OLED",
    "zh": "OLED",
    "ja": "OLED"
  }
};

export function getThemeSettingsI18n(lang: Lang): ThemeSettingsTranslations {
  const effectiveLang: Lang = lang || 'en';
  const result: any = {};
  for (const [key, map] of Object.entries(SETTINGS_I18N)) {
    result[key] = map[effectiveLang] || map['en'];
  }
  return result;
}

export function getThemeCategoryLabel(categoryId: string, lang: Lang, fallback?: string): string {
  const effectiveLang: Lang = lang || 'en';
  const cat = CATEGORY_I18N[categoryId];
  if (cat && cat[effectiveLang]) {
    return cat[effectiveLang];
  }
  return fallback || categoryId;
}

/**
 * Returns localized theme name in up to 4 words
 */
export function getThemeDisplayName(rawName: string, lang: Lang): string {
  if (!rawName) return '';
  const effectiveLang: Lang = lang || 'en';
  
  // Check if it has a variant suffix: Light, Dark, OLED
  const match = rawName.match(/^(.*?)\s+(Light|Dark|OLED)$/);
  if (match) {
    const base = match[1].trim();
    const suffix = match[2];
    
    const localizedBase = BASE_THEMES_I18N[base]?.[effectiveLang] || base;
    const localizedSuffix = SUFFIXES[suffix]?.[effectiveLang] || suffix;
    
    // For English, preserve rawName if clean
    if (effectiveLang === 'en') {
      return `${localizedBase} ${localizedSuffix}`;
    }
    
    return `${localizedBase} ${localizedSuffix}`;
  }
  
  // Single word / standalone themes (e.g. Sky, Ivory, Dusk, Sepia...)
  if (BASE_THEMES_I18N[rawName]?.[effectiveLang]) {
    return BASE_THEMES_I18N[rawName][effectiveLang];
  }

  return rawName;
}
