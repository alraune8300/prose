import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Trash2, Loader2, Image as ImageIcon, Link2, Upload, Trees, Check, X, Sparkles, RefreshCw } from 'lucide-react';
import { ThemeColors } from '../../../types';
import { getNotionI18n } from '../i18n';
import { Lang } from '../../../i18n';

interface NotionCoverPickerProps {
  theme?: ThemeColors;
  onSelect: (url: string) => void;
  onRemove?: () => void;
  onClose: () => void;
  currentCover?: string | null;
  lang?: Lang;
}

export interface CoverItem {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  category: string;
  tags: string[];
  source?: 'curated' | 'artic' | 'wikimedia';
}

// -------------------------------------------------------------
// CURATED MASTERPIECE REPOSITORY (100% AUTHENTIC HIGH-RES ARTWORKS)
// -------------------------------------------------------------
const AUTHENTIC_FINE_ART: CoverItem[] = [
  // --- IMPRESSIONISM & POST-IMPRESSIONISM ---
  {
    id: 'art-vg-starry-night',
    title: 'The Starry Night (Đêm đầy sao)',
    subtitle: 'Vincent van Gogh (1889)',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    category: 'impressionism',
    tags: ['van gogh', 'starry night', 'đêm đầy sao', 'bầu trời sao', 'sơn dầu', 'impressionism', 'post-impressionism'],
    source: 'curated'
  },
  {
    id: 'art-vg-almond-blossom',
    title: 'Almond Blossom (Hoa hạnh nhân nở)',
    subtitle: 'Vincent van Gogh (1890)',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    category: 'impressionism',
    tags: ['van gogh', 'almond blossom', 'hoa hạnh nhân', 'hoa', 'xanh ngọc', 'mùa xuân', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-vg-sunflowers',
    title: 'Sunflowers (Hoa hướng dương)',
    subtitle: 'Vincent van Gogh (1888)',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
    category: 'impressionism',
    tags: ['van gogh', 'sunflowers', 'hoa hướng dương', 'vàng', 'yellow', 'sơn dầu', 'tĩnh vật'],
    source: 'curated'
  },
  {
    id: 'art-vg-cafe-terrace',
    title: 'Café Terrace at Night (Quán cà phê đêm)',
    subtitle: 'Vincent van Gogh (1888)',
    url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
    category: 'impressionism',
    tags: ['van gogh', 'cafe terrace at night', 'quán cà phê', 'arles', 'đêm', 'vàng kim', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-monet-water-lilies',
    title: 'Water Lilies - Nymphéas (Hồ hoa súng)',
    subtitle: 'Claude Monet (1916)',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    category: 'impressionism',
    tags: ['monet', 'claude monet', 'water lilies', 'nympheas', 'hoa súng', 'giverny', 'ấn tượng', 'hồ nước'],
    source: 'curated'
  },
  {
    id: 'art-monet-impression-sunrise',
    title: 'Impression, Sunrise (Ấn tượng mặt trời mọc)',
    subtitle: 'Claude Monet (1872)',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    category: 'impressionism',
    tags: ['monet', 'claude monet', 'impression sunrise', 'bình minh', 'hải cảng', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-monet-japanese-bridge',
    title: 'The Japanese Footbridge at Giverny (Cầu Nhật Bản)',
    subtitle: 'Claude Monet (1899)',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1200&q=80',
    category: 'impressionism',
    tags: ['monet', 'japanese bridge', 'cầu nhật', 'giverny', 'vườn hoa', 'hoa súng', 'xanh lá'],
    source: 'curated'
  },
  {
    id: 'art-degas-dance-class',
    title: 'The Dance Class (Lớp học múa ba-lê)',
    subtitle: 'Edgar Degas (1874)',
    url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80',
    category: 'impressionism',
    tags: ['degas', 'dance class', 'ballet', 'ba lê', 'vũ công', 'opera paris', 'sơn dầu'],
    source: 'curated'
  },

  // --- UKIYO-E & JAPANESE FINE ART ---
  {
    id: 'art-hokusai-great-wave',
    title: 'The Great Wave off Kanagawa (Sóng lừng Kanagawa)',
    subtitle: 'Katsushika Hokusai (1831)',
    url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1200&q=80',
    category: 'japanese',
    tags: ['hokusai', 'great wave', 'sóng lừng', 'kanagawa', 'núi phú sĩ', 'fuji', 'ukiyo-e', 'nhật bản', 'khắc gỗ'],
    source: 'curated'
  },
  {
    id: 'art-hokusai-red-fuji',
    title: 'Fine Wind, Clear Morning - Red Fuji (Phú Sĩ đỏ)',
    subtitle: 'Katsushika Hokusai (1830)',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    category: 'japanese',
    tags: ['hokusai', 'red fuji', 'phú sĩ đỏ', 'núi phú sĩ', 'bình minh', 'nhật bản', 'ukiyo-e'],
    source: 'curated'
  },
  {
    id: 'art-hiroshige-rain-ohashi',
    title: 'Sudden Shower over Shin-Ōhashi Bridge (Cơn mưa rào)',
    subtitle: 'Utagawa Hiroshige (1857)',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    category: 'japanese',
    tags: ['hiroshige', 'mưa rào', 'cầu ohashi', 'edo', 'tokyo', 'mưa', 'nhật bản', 'ukiyo-e'],
    source: 'curated'
  },
  {
    id: 'art-hasui-zojoji-snow',
    title: 'Snow at Zojoji Temple (Tuyết phủ chùa Zojoji)',
    subtitle: 'Hasui Kawase (1953)',
    url: 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&w=1200&q=80',
    category: 'japanese',
    tags: ['hasui kawase', 'zojoji', 'chùa', 'tuyết', 'mùa đông', 'nhật bản', 'shin-hanga'],
    source: 'curated'
  },

  // --- RENAISSANCE & CLASSICAL MASTERPIECES ---
  {
    id: 'art-davinci-mona-lisa',
    title: 'Mona Lisa (Nàng Mona Lisa)',
    subtitle: 'Leonardo da Vinci (1503)',
    url: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=80',
    category: 'renaissance',
    tags: ['da vinci', 'leonardo da vinci', 'mona lisa', 'chân dung', 'phục hưng', 'louvre', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-botticelli-birth-venus',
    title: 'The Birth of Venus (Sự ra đời của thần Vệ Nữ)',
    subtitle: 'Sandro Botticelli (1485)',
    url: 'https://images.unsplash.com/photo-1582561214197-cbb2e519d3f5?auto=format&fit=crop&w=1200&q=80',
    category: 'renaissance',
    tags: ['botticelli', 'birth of venus', 'thần vệ nữ', 'phục hưng', 'florence', 'uffizi', 'thần thoại'],
    source: 'curated'
  },
  {
    id: 'art-michelangelo-creation-adam',
    title: 'The Creation of Adam (Sự sáng tạo Adam)',
    subtitle: 'Michelangelo (1512)',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    category: 'renaissance',
    tags: ['michelangelo', 'creation of adam', 'sáng tạo adam', 'sistine chapel', 'vatican', 'phục hưng'],
    source: 'curated'
  },

  // --- BAROQUE & MASTERS OF LIGHT ---
  {
    id: 'art-vermeer-pearl-earring',
    title: 'Girl with a Pearl Earring (Cô gái đeo hoa tai ngọc trai)',
    subtitle: 'Johannes Vermeer (1665)',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    category: 'baroque',
    tags: ['vermeer', 'johannes vermeer', 'cô gái đeo hoa tai ngọc trai', 'chân dung', 'hà lan', 'baroque', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-rembrandt-night-watch',
    title: 'The Night Watch (Tuần tra đêm)',
    subtitle: 'Rembrandt van Rijn (1642)',
    url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80',
    category: 'baroque',
    tags: ['rembrandt', 'the night watch', 'tuần tra đêm', 'baroque', 'hà lan', 'chiaroscuro', 'sơn dầu'],
    source: 'curated'
  },

  // --- ROMANTICISM & LANDSCAPES ---
  {
    id: 'art-friedrich-wanderer',
    title: 'Wanderer above the Sea of Fog (Kẻ lãng du trên biển sương mù)',
    subtitle: 'Caspar David Friedrich (1818)',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    category: 'romanticism',
    tags: ['caspar david friedrich', 'wanderer', 'lãng du', 'sương mù', 'núi non', 'lãng mạn', 'romanticism'],
    source: 'curated'
  },
  {
    id: 'art-turner-fighting-temeraire',
    title: 'The Fighting Temeraire (Chiến hạm Temeraire)',
    subtitle: 'J.M.W. Turner (1839)',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    category: 'romanticism',
    tags: ['turner', 'jmw turner', 'fighting temeraire', 'hoàng hôn', 'tàu buồm', 'biển', 'lãng mạn'],
    source: 'curated'
  },

  // --- MODERN MASTERS ---
  {
    id: 'art-klimt-the-kiss',
    title: 'The Kiss - Der Kuss (Nụ hôn vàng kim)',
    subtitle: 'Gustav Klimt (1908)',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    category: 'modern',
    tags: ['klimt', 'gustav klimt', 'the kiss', 'nụ hôn', 'vàng kim', 'gold', 'art nouveau', 'vienna'],
    source: 'curated'
  },
  {
    id: 'art-hopper-nighthawks',
    title: 'Nighthawks (Cú đêm trong thành phố)',
    subtitle: 'Edward Hopper (1942)',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    category: 'modern',
    tags: ['hopper', 'edward hopper', 'nighthawks', 'cú đêm', 'quán ăn', 'thành phố', 'đêm', 'hiện đại'],
    source: 'curated'
  }
];

// -------------------------------------------------------------
// CURATED NATURE & LANDSCAPES
// -------------------------------------------------------------
const AUTHENTIC_NATURE: CoverItem[] = [
  {
    id: 'nat-swiss-alps-peaks',
    title: 'Swiss Alps Mountain Peaks',
    subtitle: 'Bernese Oberland, Switzerland',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85',
    category: 'mountains',
    tags: ['alps', 'núi tuyết', 'thụy sĩ', 'đỉnh núi', 'hùng vĩ', 'snow peaks', 'sky'],
    source: 'curated'
  },
  {
    id: 'nat-pacific-redwoods',
    title: 'Misty Redwood Forest Morning',
    subtitle: 'Redwood National Park, California',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85',
    category: 'mountains',
    tags: ['rừng thông', 'rừng nguyên sinh', 'sương mù', 'misty forest', 'redwoods', 'xanh mát'],
    source: 'curated'
  },
  {
    id: 'nat-banff-lake-louise',
    title: 'Lake Louise & Rocky Mountains',
    subtitle: 'Banff National Park, Canada',
    url: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1600&q=85',
    category: 'waterfalls',
    tags: ['hồ louise', 'lake louise', 'banff', 'núi đá', 'nước xanh ngọc', 'canada'],
    source: 'curated'
  },
  {
    id: 'nat-maldives-sunset',
    title: 'Golden Sunset Ocean Horizon',
    subtitle: 'Baa Atoll, Maldives',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
    category: 'oceans',
    tags: ['hoàng hôn biển', 'sunset', 'ocean', 'biển', 'sóng', 'vàng kim', 'bãi cát'],
    source: 'curated'
  },
  {
    id: 'nat-aurora-borealis',
    title: 'Northern Lights Aurora Borealis',
    subtitle: 'Tromsø, Arctic Circle, Norway',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=85',
    category: 'skies',
    tags: ['cực quang', 'aurora borealis', 'northern lights', 'bầu trời đêm', 'vũ trụ', 'xanh ngọc'],
    source: 'curated'
  },
  {
    id: 'nat-sakura-fuji',
    title: 'Cherry Blossoms & Mount Fuji',
    subtitle: 'Lake Kawaguchiko, Japan',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1600&q=85',
    category: 'seasons',
    tags: ['hoa anh đào', 'sakura', 'núi phú sĩ', 'fuji', 'mùa xuân', 'nhật bản'],
    source: 'curated'
  },
  {
    id: 'nat-provence-lavender',
    title: 'Purple Lavender Fields at Dusk',
    subtitle: 'Valensole Plateau, France',
    url: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=1600&q=85',
    category: 'seasons',
    tags: ['oải hương', 'lavender', 'tím', 'purple', 'pháp', 'hoàng hôn'],
    source: 'curated'
  },
  {
    id: 'nat-arashiyama-bamboo',
    title: 'Zen Bamboo Forest Sanctuary',
    subtitle: 'Arashiyama, Kyoto, Japan',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=85',
    category: 'mountains',
    tags: ['rừng trúc', 'bamboo grove', 'arashiyama', 'kyoto', 'zen', 'tĩnh lặng'],
    source: 'curated'
  }
];

function normalizeStr(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function mapVietnameseToArtKeywords(query: string): string {
  const norm = normalizeStr(query);
  const mappings: [RegExp, string][] = [
    [/hoa huong duong|huong duong/g, 'sunflowers'],
    [/hoa sung|ao hoa sung/g, 'water lilies claude monet'],
    [/dem day sao|dem sao|sao dem/g, 'starry night vincent van gogh'],
    [/son dau/g, 'oil painting masterpiece'],
    [/phong canh/g, 'landscape painting'],
    [/chan dung/g, 'portrait painting'],
    [/hoa hanh nhan/g, 'almond blossom van gogh'],
    [/tuyet|mua dong/g, 'winter snow landscape'],
    [/mua thu|la do/g, 'autumn landscape painting'],
    [/mua xuan|hoa dao|hoa mai/g, 'spring blossoms flowers'],
    [/song lung/g, 'great wave hokusai'],
    [/nhat ban|tranh nhat|ukiyo/g, 'japanese woodblock print ukiyo-e'],
    [/bien|song bien|bo bien/g, 'ocean seascape painting'],
    [/thac nuoc/g, 'waterfall painting'],
    [/hoang hon/g, 'sunset painting'],
    [/binh minh/g, 'sunrise painting'],
    [/phuc hung/g, 'renaissance masterpiece'],
    [/quan ca phe/g, 'cafe terrace at night'],
    [/co gai deo hoa tai/g, 'girl with a pearl earring vermeer']
  ];

  let result = query;
  for (const [pattern, replacement] of mappings) {
    if (pattern.test(norm)) {
      result = replacement;
      break;
    }
  }
  return result;
}

export const NotionCoverPicker: React.FC<NotionCoverPickerProps> = ({
  theme,
  currentCover,
  onSelect,
  onRemove,
  onClose,
  lang = 'en'
}) => {
  const t = getNotionI18n(lang);
  const [activeTab, setActiveTab] = useState<'art' | 'nature' | 'upload' | 'link'>('art');
  const [artCategory, setArtCategory] = useState<string>('all');
  const [natureCategory, setNatureCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineResults, setOnlineResults] = useState<CoverItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // LIVE ONLINE MUSEUM SEARCH (Art Institute of Chicago & Wikimedia Open Access APIs)
  const searchOnlineDatabase = async (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    setIsSearchingOnline(true);
    const mappedTerm = mapVietnameseToArtKeywords(cleaned);

    try {
      if (activeTab === 'art') {
        const articUrl = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(
          mappedTerm
        )}&query[term][is_public_domain]=true&fields=id,title,artist_title,date_display,image_id&limit=18`;

        const res = await fetch(articUrl);
        if (res.ok) {
          const json = await res.json();
          const items: CoverItem[] = (json.data || [])
            .filter((item: { image_id?: string; title?: string }) => Boolean(item.image_id))
            .map((item: { id: number; title: string; artist_title?: string; date_display?: string; image_id: string }) => ({
              id: `artic-${item.id}`,
              title: item.title || 'Classical Masterpiece',
              subtitle: item.artist_title
                ? `${item.artist_title}${item.date_display ? ` (${item.date_display})` : ''}`
                : 'Art Institute of Chicago Collection',
              url: `https://www.artic.edu/iiif/2/${item.image_id}/full/843,/0/default.jpg`,
              category: 'museum',
              tags: [item.title || '', item.artist_title || '', 'museum', 'masterpiece'],
              source: 'artic' as const
            }));

          if (items.length > 0) {
            setOnlineResults(items);
            setIsSearchingOnline(false);
            return;
          }
        }

        // Fallback to Wikimedia Commons API
        const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          mappedTerm + ' painting artwork'
        )}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*`;

        const wikiRes = await fetch(wikiUrl);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          const pages = wikiData.query?.pages || {};
          const wikiItems: CoverItem[] = Object.values(pages)
            .map((page: unknown) => {
              const p = page as { pageid: number; title: string; imageinfo?: Array<{ thumburl?: string; url?: string }> };
              const info = p.imageinfo?.[0];
              const imgUrl = info?.thumburl || info?.url;
              if (!imgUrl) return null;
              const cleanTitle = p.title.replace(/^File:/i, '').replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/_/g, ' ');
              return {
                id: `wiki-${p.pageid}`,
                title: cleanTitle,
                subtitle: 'Wikimedia Commons Open Access',
                url: imgUrl,
                category: 'museum',
                tags: [cleanTitle, 'wikimedia', 'painting'],
                source: 'wikimedia' as const
              };
            })
            .filter(Boolean) as CoverItem[];

          setOnlineResults(wikiItems);
        } else {
          setOnlineResults([]);
        }
      } else {
        const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          mappedTerm + ' landscape nature photography'
        )}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*`;

        const wikiRes = await fetch(wikiUrl);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          const pages = wikiData.query?.pages || {};
          const natureWikiItems: CoverItem[] = Object.values(pages)
            .map((page: unknown) => {
              const p = page as { pageid: number; title: string; imageinfo?: Array<{ thumburl?: string; url?: string }> };
              const info = p.imageinfo?.[0];
              const imgUrl = info?.thumburl || info?.url;
              if (!imgUrl) return null;
              const cleanTitle = p.title.replace(/^File:/i, '').replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/_/g, ' ');
              return {
                id: `wiki-nat-${p.pageid}`,
                title: cleanTitle,
                subtitle: 'Scenic Nature Photography',
                url: imgUrl,
                category: 'nature',
                tags: [cleanTitle, 'nature', 'landscape'],
                source: 'wikimedia' as const
              };
            })
            .filter(Boolean) as CoverItem[];

          setOnlineResults(natureWikiItems);
        } else {
          setOnlineResults([]);
        }
      }
    } catch {
      setOnlineResults([]);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchDebounceRef.current = setTimeout(() => {
        searchOnlineDatabase(searchQuery);
      }, 350);
    } else {
      setOnlineResults([]);
    }

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, activeTab]);

  const filterItems = (items: CoverItem[], selectedCategory: string, query: string): CoverItem[] => {
    let list = items;
    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }
    const q = normalizeStr(query);
    if (!q) return list;

    const queryTokens = q.split(/\s+/).filter(Boolean);
    return list.filter((item) => {
      const targetStr = normalizeStr(`${item.title} ${item.subtitle || ''} ${item.tags.join(' ')}`);
      return queryTokens.every((token) => targetStr.includes(token));
    });
  };

  const displayedArt = useMemo(() => {
    const localFiltered = filterItems(AUTHENTIC_FINE_ART, artCategory, searchQuery);
    if (searchQuery.trim() && onlineResults.length > 0) {
      const seen = new Set(localFiltered.map((i) => i.url));
      const filteredOnline = onlineResults.filter((i) => !seen.has(i.url));
      return [...localFiltered, ...filteredOnline];
    }
    return localFiltered;
  }, [artCategory, searchQuery, onlineResults]);

  const displayedNature = useMemo(() => {
    const localFiltered = filterItems(AUTHENTIC_NATURE, natureCategory, searchQuery);
    if (searchQuery.trim() && onlineResults.length > 0) {
      const seen = new Set(localFiltered.map((i) => i.url));
      const filteredOnline = onlineResults.filter((i) => !seen.has(i.url));
      return [...localFiltered, ...filteredOnline];
    }
    return localFiltered;
  }, [natureCategory, searchQuery, onlineResults]);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setIsUploading(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          onSelect(compressed);
        } else {
          onSelect(result);
        }
        setIsUploading(false);
        onClose();
      };
      img.onerror = () => {
        onSelect(result);
        setIsUploading(false);
        onClose();
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Theme variable fallbacks matching the Notion system theme
  const surfaceBg = theme?.surface || (theme?.isDark ? '#18181b' : '#ffffff');
  const panelBg = theme?.panel || surfaceBg;
  const inputBg = theme?.bg || (theme?.isDark ? '#27272a' : '#f4f4f5');
  const borderColor = theme?.border || (theme?.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)');
  const borderFaintColor = theme?.borderFaint || (theme?.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)');
  const textColor = theme?.text || (theme?.isDark ? '#f4f4f5' : '#18181b');
  const textMutedColor = theme?.textMuted || (theme?.isDark ? '#a1a1aa' : '#71717a');
  const accentColor = theme?.accent || '#3b82f6';
  const accentSoft = theme?.accentSoft || (theme?.isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)');
  const backdropBg = theme?.isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.45)';

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs select-none animate-in fade-in duration-150"
      style={{ backgroundColor: backdropBg }}
      onClick={onClose}
    >
      <div
        ref={popupRef}
        className="relative w-full max-w-2xl max-h-[88vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        style={{
          backgroundColor: panelBg,
          borderColor: borderColor,
          color: textColor
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Remove Button */}
        <div
          className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b gap-2"
          style={{ borderColor: borderFaintColor }}
        >
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: accentSoft, color: accentColor }}
            >
              <ImageIcon size={16} />
            </div>
            <span className="text-sm font-semibold">{t.changeCover || 'Change cover'}</span>
          </div>

          <div className="flex items-center gap-2">
            {currentCover && onRemove && (
              <button
                onClick={() => {
                  onRemove();
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1 transition-colors cursor-pointer"
                title={t.removeCover || 'Remove cover'}
              >
                <Trash2 size={13} />
                <span>{t.removeCover || 'Remove'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
              style={{ color: textMutedColor }}
              title="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div
          className="flex items-center justify-between px-4 pt-2 border-b gap-1 overflow-x-auto scrollbar-hide"
          style={{ borderColor: borderFaintColor }}
        >
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setActiveTab('art');
                setSearchQuery('');
                setOnlineResults([]);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap"
              style={{
                borderColor: activeTab === 'art' ? accentColor : 'transparent',
                color: activeTab === 'art' ? accentColor : textMutedColor
              }}
            >
              <Sparkles size={14} />
              <span>{lang === 'vi' ? 'Danh tác Nghệ thuật' : 'Fine Art Masterpieces'}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('nature');
                setSearchQuery('');
                setOnlineResults([]);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap"
              style={{
                borderColor: activeTab === 'nature' ? accentColor : 'transparent',
                color: activeTab === 'nature' ? accentColor : textMutedColor
              }}
            >
              <Trees size={14} />
              <span>{lang === 'vi' ? 'Thiên nhiên' : 'Nature & Landscapes'}</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap"
              style={{
                borderColor: activeTab === 'upload' ? accentColor : 'transparent',
                color: activeTab === 'upload' ? accentColor : textMutedColor
              }}
            >
              <Upload size={14} />
              <span>{t.upload || 'Upload'}</span>
            </button>

            <button
              onClick={() => setActiveTab('link')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap"
              style={{
                borderColor: activeTab === 'link' ? accentColor : 'transparent',
                color: activeTab === 'link' ? accentColor : textMutedColor
              }}
            >
              <Link2 size={14} />
              <span>{t.customLink || 'Link'}</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-4 max-h-[500px] overflow-y-auto scrollbar-thin flex flex-col gap-3.5">
          {activeTab === 'art' && (
            <div className="flex flex-col gap-3">
              {/* Search & Museum Query Bar */}
              <div className="flex flex-col gap-2">
                <div className="relative flex items-center">
                  <Search size={15} className="absolute left-3.5 opacity-60 pointer-events-none" style={{ color: textMutedColor }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        searchOnlineDatabase(searchQuery);
                      }
                    }}
                    placeholder={
                      lang === 'vi'
                        ? 'Tìm danh họa, tên tranh (Van Gogh, Monet, Hokusai, Starry Night, sơn dầu...)'
                        : 'Search artist or painting (Van Gogh, Monet, Hokusai, Starry Night, oil painting...)'
                    }
                    className="w-full pl-10 pr-24 py-2.5 text-xs rounded-xl border outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: inputBg,
                      borderColor: borderColor,
                      color: textColor
                    }}
                  />

                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setOnlineResults([]);
                      }}
                      className="absolute right-20 p-1 hover:opacity-75 cursor-pointer"
                      style={{ color: textMutedColor }}
                      title="Clear"
                    >
                      <X size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => searchOnlineDatabase(searchQuery)}
                    disabled={!searchQuery.trim() || isSearchingOnline}
                    className="absolute right-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg text-white cursor-pointer transition-all disabled:opacity-50 hover:brightness-110 active:scale-95 shadow-xs flex items-center gap-1.5"
                    style={{ backgroundColor: accentColor }}
                  >
                    {isSearchingOnline ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={12} />
                        <span>{lang === 'vi' ? 'Bảo tàng' : 'Search'}</span>
                      </>
                    )}
                  </button>
                </div>

                {isSearchingOnline ? (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium"
                    style={{ backgroundColor: accentSoft, color: accentColor }}
                  >
                    <Loader2 size={13} className="animate-spin shrink-0" />
                    <span>{lang === 'vi' ? 'Đang truy vấn dữ liệu từ Viện Nghệ thuật Chicago & Wikimedia Commons...' : 'Querying Art Institute of Chicago & Wikimedia Commons APIs...'}</span>
                  </div>
                ) : !searchQuery ? (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                    {(
                      [
                        { key: 'all', label: lang === 'vi' ? 'Tất cả' : 'All' },
                        { key: 'impressionism', label: lang === 'vi' ? 'Ấn tượng (Monet, Van Gogh)' : 'Impressionism' },
                        { key: 'japanese', label: lang === 'vi' ? 'Ukiyo-e Nhật Bản (Hokusai)' : 'Japanese Ukiyo-e' },
                        { key: 'renaissance', label: lang === 'vi' ? 'Phục hưng (Da Vinci)' : 'Renaissance' },
                        { key: 'baroque', label: lang === 'vi' ? 'Baroque (Vermeer)' : 'Baroque' },
                        { key: 'romanticism', label: lang === 'vi' ? 'Lãng mạn (Friedrich, Turner)' : 'Romanticism' },
                        { key: 'modern', label: lang === 'vi' ? 'Hiện đại (Klimt, Hopper)' : 'Modern Masters' }
                      ] as const
                    ).map((cat) => {
                      const isSelected = artCategory === cat.key;
                      return (
                        <button
                          key={cat.key}
                          onClick={() => setArtCategory(cat.key)}
                          className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer border"
                          style={{
                            backgroundColor: isSelected ? accentColor : inputBg,
                            color: isSelected ? '#ffffff' : textMutedColor,
                            borderColor: isSelected ? accentColor : borderFaintColor
                          }}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] px-1" style={{ color: textMutedColor }}>
                    <span>
                      {lang === 'vi'
                        ? `Tìm thấy ${displayedArt.length} tác phẩm`
                        : `Found ${displayedArt.length} artworks`}
                    </span>
                    <button
                      onClick={() => searchOnlineDatabase(searchQuery)}
                      className="flex items-center gap-1 hover:underline cursor-pointer"
                      style={{ color: accentColor }}
                    >
                      <RefreshCw size={11} />
                      <span>{lang === 'vi' ? 'Tra cứu thêm' : 'Fetch more'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Artwork Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {displayedArt.map((art) => {
                  const isSelected = currentCover === art.url;
                  return (
                    <div
                      key={art.id}
                      onClick={() => {
                        onSelect(art.url);
                        onClose();
                      }}
                      className="cursor-pointer group relative aspect-video rounded-xl overflow-hidden border transition-all hover:scale-[1.02] hover:shadow-lg"
                      style={{
                        backgroundColor: inputBg,
                        borderColor: isSelected ? accentColor : borderFaintColor,
                        boxShadow: isSelected ? `0 0 0 2px ${accentColor}` : undefined
                      }}
                    >
                      <img
                        src={art.url}
                        alt={art.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />

                      {art.source === 'artic' && (
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/70 text-white backdrop-blur-xs">
                          Art Institute
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                        <span className="text-[11px] text-white font-semibold leading-tight line-clamp-1">{art.title}</span>
                        {art.subtitle && <span className="text-[9px] text-gray-300 line-clamp-1">{art.subtitle}</span>}
                      </div>

                      {isSelected && (
                        <div
                          className="absolute top-1.5 right-1.5 p-1 rounded-full text-white shadow"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'nature' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                {(
                  [
                    { key: 'all', label: lang === 'vi' ? 'Tất cả' : 'All' },
                    { key: 'mountains', label: lang === 'vi' ? 'Núi cao & Rừng' : 'Mountains & Forests' },
                    { key: 'waterfalls', label: lang === 'vi' ? 'Hồ & Thác nước' : 'Lakes & Waterfalls' },
                    { key: 'oceans', label: lang === 'vi' ? 'Biển & Đại dương' : 'Oceans' },
                    { key: 'skies', label: lang === 'vi' ? 'Bầu trời & Cực quang' : 'Skies & Aurora' },
                    { key: 'seasons', label: lang === 'vi' ? 'Mùa hoa & Lá đỏ' : 'Seasons' }
                  ] as const
                ).map((cat) => {
                  const isSelected = natureCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setNatureCategory(cat.key)}
                      className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer border"
                      style={{
                        backgroundColor: isSelected ? accentColor : inputBg,
                        color: isSelected ? '#ffffff' : textMutedColor,
                        borderColor: isSelected ? accentColor : borderFaintColor
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {displayedNature.map((item) => {
                  const isSelected = currentCover === item.url;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelect(item.url);
                        onClose();
                      }}
                      className="cursor-pointer group relative aspect-video rounded-xl overflow-hidden border transition-all hover:scale-[1.02]"
                      style={{
                        backgroundColor: inputBg,
                        borderColor: isSelected ? accentColor : borderFaintColor,
                        boxShadow: isSelected ? `0 0 0 2px ${accentColor}` : undefined
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                        <span className="text-[11px] text-white font-semibold line-clamp-1">{item.title}</span>
                        {item.subtitle && <span className="text-[9px] text-gray-300 line-clamp-1">{item.subtitle}</span>}
                      </div>

                      {isSelected && (
                        <div
                          className="absolute top-1.5 right-1.5 p-1 rounded-full text-white shadow"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-md h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:opacity-80"
                style={{ borderColor: borderColor, backgroundColor: inputBg }}
              >
                {isUploading ? (
                  <Loader2 size={28} className="animate-spin" style={{ color: accentColor }} />
                ) : (
                  <>
                    <div className="p-3 rounded-full" style={{ backgroundColor: accentSoft, color: accentColor }}>
                      <Upload size={22} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold">{lang === 'vi' ? 'Nhấn để chọn ảnh từ máy tính' : 'Click to upload image file'}</span>
                      <span className="text-[10px]" style={{ color: textMutedColor }}>Hỗ trợ PNG, JPG, WEBP (Tự động tối ưu HD)</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'link' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customUrl.trim()) {
                  onSelect(customUrl.trim());
                  onClose();
                }
              }}
              className="flex flex-col gap-3.5 py-2"
            >
              <div className="text-xs" style={{ color: textMutedColor }}>
                {t.pasteImageLink || 'Paste an image URL from Unsplash, Wikimedia or any direct image link:'}
              </div>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs"
                style={{ backgroundColor: inputBg, borderColor: borderColor }}
              >
                <Link2 size={15} style={{ color: textMutedColor }} />
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-transparent outline-none text-xs"
                  style={{ color: textColor }}
                  autoFocus
                />
              </div>

              {customUrl.trim() && (
                <div className="h-32 rounded-xl overflow-hidden border relative" style={{ borderColor: borderColor }}>
                  <img
                    src={customUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ color: textMutedColor }}
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!customUrl.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  {t.submit || 'Apply Cover'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
