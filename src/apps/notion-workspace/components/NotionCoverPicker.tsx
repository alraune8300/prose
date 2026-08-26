import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Trash2, Loader2, Image as ImageIcon, Link2, Upload, Trees, Check, AlertCircle, X, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';
import { ThemeColors } from '../../../theme';
import { getNotionI18n } from '../i18n';
import { Lang } from '../../../i18n';

interface Props {
  theme: ThemeColors;
  onSelect: (url: string | null) => void;
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
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
    category: 'impressionism',
    tags: ['van gogh', 'starry night', 'đêm đầy sao', 'bầu trời sao', 'sơn dầu', 'impressionism', 'post-impressionism', 'hà lan', 'moMA', 'cuộn xoáy'],
    source: 'curated'
  },
  {
    id: 'art-vg-almond-blossom',
    title: 'Almond Blossom (Hoa hạnh nhân nở)',
    subtitle: 'Vincent van Gogh (1890)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg/1280px-Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg',
    category: 'impressionism',
    tags: ['van gogh', 'almond blossom', 'hoa hạnh nhân', 'hoa', 'xanh ngọc', 'mùa xuân', 'sơn dầu', 'post-impressionism'],
    source: 'curated'
  },
  {
    id: 'art-vg-sunflowers',
    title: 'Sunflowers (Hoa hướng dương)',
    subtitle: 'Vincent van Gogh (1888)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Vincent_Willem_van_Gogh_127.jpg/1280px-Vincent_Willem_van_Gogh_127.jpg',
    category: 'impressionism',
    tags: ['van gogh', 'sunflowers', 'hoa hướng dương', 'vàng', 'yellow', 'sơn dầu', 'tĩnh vật', 'still life'],
    source: 'curated'
  },
  {
    id: 'art-vg-cafe-terrace',
    title: 'Café Terrace at Night (Quán cà phê đêm)',
    subtitle: 'Vincent van Gogh (1888)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Vincent_Willem_van_Gogh_015.jpg/1280px-Vincent_Willem_van_Gogh_015.jpg',
    category: 'impressionism',
    tags: ['van gogh', 'cafe terrace at night', 'quán cà phê', 'arles', 'đêm', 'vàng kim', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-vg-bedroom-arles',
    title: 'The Bedroom in Arles (Phòng ngủ tại Arles)',
    subtitle: 'Vincent van Gogh (1889)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Vincent_van_Gogh_-_De_slaapkamer_-_Google_Art_Project.jpg/1280px-Vincent_van_Gogh_-_De_slaapkamer_-_Google_Art_Project.jpg',
    category: 'impressionism',
    tags: ['van gogh', 'the bedroom', 'phòng ngủ', 'arles', 'sơn dầu', 'nội thất'],
    source: 'curated'
  },
  {
    id: 'art-monet-water-lilies',
    title: 'Water Lilies - Nymphéas (Hồ hoa súng)',
    subtitle: 'Claude Monet (1916)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg/1280px-Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg',
    category: 'impressionism',
    tags: ['monet', 'claude monet', 'water lilies', 'nympheas', 'hoa súng', 'ao hoa súng', 'giverny', 'ấn tượng', 'hồ nước'],
    source: 'curated'
  },
  {
    id: 'art-monet-impression-sunrise',
    title: 'Impression, Sunrise (Ấn tượng mặt trời mọc)',
    subtitle: 'Claude Monet (1872)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Monet_-_Impression%2C_Sunrise.jpg/1280px-Monet_-_Impression%2C_Sunrise.jpg',
    category: 'impressionism',
    tags: ['monet', 'claude monet', 'impression sunrise', 'ấn tượng mặt trời mọc', 'bình minh', 'hải cảng', 'le havre', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-monet-japanese-bridge',
    title: 'The Japanese Footbridge at Giverny (Cầu Nhật Bản)',
    subtitle: 'Claude Monet (1899)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Claude_Monet_-_The_Japanese_Footbridge_-_Google_Art_Project.jpg/1280px-Claude_Monet_-_The_Japanese_Footbridge_-_Google_Art_Project.jpg',
    category: 'impressionism',
    tags: ['monet', 'claude monet', 'japanese bridge', 'cầu nhật', 'giverny', 'vườn hoa', 'hoa súng', 'xanh lá'],
    source: 'curated'
  },
  {
    id: 'art-monet-parasol',
    title: 'Woman with a Parasol (Người phụ nữ với chiếc dù)',
    subtitle: 'Claude Monet (1875)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Claude_Monet_-_Woman_with_a_Parasol_-_Madame_Monet_and_Her_Son_-_Google_Art_Project.jpg/1280px-Claude_Monet_-_Woman_with_a_Parasol_-_Madame_Monet_and_Her_Son_-_Google_Art_Project.jpg',
    category: 'impressionism',
    tags: ['monet', 'woman with parasol', 'người phụ nữ với chiếc dù', 'đồng cỏ', 'gió', 'ánh sáng', 'nắng'],
    source: 'curated'
  },
  {
    id: 'art-renoir-boating-party',
    title: 'Luncheon of the Boating Party',
    subtitle: 'Pierre-Auguste Renoir (1881)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Pierre-Auguste_Renoir_-_Luncheon_of_the_Boating_Party_-_Google_Art_Project.jpg/1280px-Pierre-Auguste_Renoir_-_Luncheon_of_the_Boating_Party_-_Google_Art_Project.jpg',
    category: 'impressionism',
    tags: ['renoir', 'boating party', 'bữa trưa trên du thuyền', 'ấn tượng', 'pháp', 'paris', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-degas-dance-class',
    title: 'The Dance Class (Lớp học múa ba-lê)',
    subtitle: 'Edgar Degas (1874)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Edgar_Degas_-_The_Ballet_Class_-_Google_Art_Project.jpg/1280px-Edgar_Degas_-_The_Ballet_Class_-_Google_Art_Project.jpg',
    category: 'impressionism',
    tags: ['degas', 'edgar degas', 'dance class', 'ballet', 'ba lê', 'vũ công', 'opera paris', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-seurat-grande-jatte',
    title: 'A Sunday on La Grande Jatte (Chiều Chủ Nhật)',
    subtitle: 'Georges Seurat (1884–1886)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg/1280px-A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg',
    category: 'impressionism',
    tags: ['seurat', 'pointillism', 'điểm họa', 'la grande jatte', 'công viên', 'paris', 'sông seine'],
    source: 'curated'
  },

  // --- UKIYO-E & JAPANESE FINE ART ---
  {
    id: 'art-hokusai-great-wave',
    title: 'The Great Wave off Kanagawa (Sóng lừng ngoài khơi Kanagawa)',
    subtitle: 'Katsushika Hokusai (1831)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1280px-Tsunami_by_hokusai_19th_century.jpg',
    category: 'japanese',
    tags: ['hokusai', 'great wave', 'sóng lừng', 'kanagawa', 'núi phú sĩ', 'fuji', 'ukiyo-e', 'nhật bản', 'khắc gỗ'],
    source: 'curated'
  },
  {
    id: 'art-hokusai-red-fuji',
    title: 'Fine Wind, Clear Morning - Red Fuji (Phú Sĩ đỏ)',
    subtitle: 'Katsushika Hokusai (1830)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Red_Fuji_southern_wind_clear_morning.jpg/1280px-Red_Fuji_southern_wind_clear_morning.jpg',
    category: 'japanese',
    tags: ['hokusai', 'red fuji', 'phú sĩ đỏ', 'núi phú sĩ', 'bình minh', 'nhật bản', 'ukiyo-e', 'khắc gỗ'],
    source: 'curated'
  },
  {
    id: 'art-hiroshige-rain-ohashi',
    title: 'Sudden Shower over Shin-Ōhashi Bridge (Cơn mưa rào trên cầu)',
    subtitle: 'Utagawa Hiroshige (1857)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Hiroshige_Atake_sous_une_averse_soudaine.jpg/1280px-Hiroshige_Atake_sous_une_averse_soudaine.jpg',
    category: 'japanese',
    tags: ['hiroshige', 'mưa rào', 'cầu ohashi', 'edo', 'tokyo', 'mưa', 'nhật bản', 'ukiyo-e'],
    source: 'curated'
  },
  {
    id: 'art-hiroshige-plum-garden',
    title: 'Plum Estate at Kameido (Vườn mận Kameido)',
    subtitle: 'Utagawa Hiroshige (1857)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Hiroshige_-_The_Plum_Garden_at_Kameido_-_Google_Art_Project.jpg/1280px-Hiroshige_-_The_Plum_Garden_at_Kameido_-_Google_Art_Project.jpg',
    category: 'japanese',
    tags: ['hiroshige', 'plum garden', 'vườn hoa mận', 'hoa mai', 'hoa đào', 'nhật bản', 'ukiyo-e'],
    source: 'curated'
  },
  {
    id: 'art-hasui-zojoji-snow',
    title: 'Snow at Zojoji Temple (Tuyết phủ chùa Zojoji)',
    subtitle: 'Hasui Kawase (1953)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Hasui_Kawase_-_Snow_at_Z%C5%8Dj%C5%8D-ji_Temple_-_Google_Art_Project.jpg/1280px-Hasui_Kawase_-_Snow_at_Z%C5%8Dj%C5%8D-ji_Temple_-_Google_Art_Project.jpg',
    category: 'japanese',
    tags: ['hasui kawase', 'zojoji', 'chùa', 'tuyết', 'mùa đông', 'nhật bản', 'shin-hanga', 'khắc gỗ'],
    source: 'curated'
  },
  {
    id: 'art-hasui-lake-tazawa',
    title: 'Lake Tazawa in Twilight (Hoàng hôn trên hồ Tazawa)',
    subtitle: 'Hasui Kawase (1927)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Hasui_Kawase_-_Lake_Tazawa_-_Google_Art_Project.jpg/1280px-Hasui_Kawase_-_Lake_Tazawa_-_Google_Art_Project.jpg',
    category: 'japanese',
    tags: ['hasui kawase', 'lake tazawa', 'hồ nước', 'hoàng hôn', 'núi', 'nhật bản', 'shin-hanga'],
    source: 'curated'
  },

  // --- RENAISSANCE & CLASSICAL MASTERPIECES ---
  {
    id: 'art-davinci-mona-lisa',
    title: 'Mona Lisa (Nàng Mona Lisa)',
    subtitle: 'Leonardo da Vinci (1503)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/1280px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
    category: 'renaissance',
    tags: ['da vinci', 'leonardo da vinci', 'mona lisa', 'chân dung', 'phục hưng', 'louvre', 'paris', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-botticelli-birth-venus',
    title: 'The Birth of Venus (Sự ra đời của thần Vệ Nữ)',
    subtitle: 'Sandro Botticelli (1485)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg/1280px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg',
    category: 'renaissance',
    tags: ['botticelli', 'birth of venus', 'thần vệ nữ', 'phục hưng', 'florence', 'uffizi', 'thần thoại'],
    source: 'curated'
  },
  {
    id: 'art-botticelli-primavera',
    title: 'Primavera (Mùa xuân)',
    subtitle: 'Sandro Botticelli (1480)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Botticelli-primavera.jpg/1280px-Botticelli-primavera.jpg',
    category: 'renaissance',
    tags: ['botticelli', 'primavera', 'mùa xuân', 'vườn hoa', 'phục hưng', 'uffizi'],
    source: 'curated'
  },
  {
    id: 'art-michelangelo-creation-adam',
    title: 'The Creation of Adam (Sự sáng tạo Adam)',
    subtitle: 'Michelangelo (1512)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg/1280px-Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg',
    category: 'renaissance',
    tags: ['michelangelo', 'creation of adam', 'sáng tạo adam', 'sistine chapel', 'vatican', 'phục hưng'],
    source: 'curated'
  },

  // --- BAROQUE & MASTERS OF LIGHT ---
  {
    id: 'art-vermeer-pearl-earring',
    title: 'Girl with a Pearl Earring (Cô gái đeo hoa tai ngọc trai)',
    subtitle: 'Johannes Vermeer (1665)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/1280px-1665_Girl_with_a_Pearl_Earring.jpg',
    category: 'baroque',
    tags: ['vermeer', 'johannes vermeer', 'cô gái đeo hoa tai ngọc trai', 'chân dung', 'hà lan', 'baroque', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-vermeer-milkmaid',
    title: 'The Milkmaid (Người rót sữa)',
    subtitle: 'Johannes Vermeer (1658)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg/1280px-Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg',
    category: 'baroque',
    tags: ['vermeer', 'the milkmaid', 'người rót sữa', 'rijksmuseum', 'ánh sáng', 'baroque'],
    source: 'curated'
  },
  {
    id: 'art-rembrandt-night-watch',
    title: 'The Night Watch (Tuần tra đêm)',
    subtitle: 'Rembrandt van Rijn (1642)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/The_Night_Watch_-_HD.jpg/1280px-The_Night_Watch_-_HD.jpg',
    category: 'baroque',
    tags: ['rembrandt', 'the night watch', 'tuần tra đêm', 'baroque', 'hà lan', 'chiaroscuro', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-caravaggio-bacchus',
    title: 'Bacchus and Still Life',
    subtitle: 'Caravaggio (1596)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Caravaggio_-_Bacco_-_Google_Art_Project.jpg/1280px-Caravaggio_-_Bacco_-_Google_Art_Project.jpg',
    category: 'baroque',
    tags: ['caravaggio', 'bacchus', 'hoa quả', 'tĩnh vật', 'baroque', 'ý', 'chiaroscuro'],
    source: 'curated'
  },

  // --- ROMANTICISM & OIL LANDSCAPES ---
  {
    id: 'art-friedrich-wanderer',
    title: 'Wanderer above the Sea of Fog (Kẻ lãng du trên biển sương mù)',
    subtitle: 'Caspar David Friedrich (1818)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg/1280px-Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg',
    category: 'romanticism',
    tags: ['caspar david friedrich', 'wanderer', 'kẻ lãng du', 'sương mù', 'núi non', 'lãng mạn', 'romanticism', 'phong cảnh'],
    source: 'curated'
  },
  {
    id: 'art-turner-fighting-temeraire',
    title: 'The Fighting Temeraire (Chiến hạm Temeraire)',
    subtitle: 'J.M.W. Turner (1839)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/The_Fighting_Temeraire%2C_JMW_Turner%2C_National_Gallery.jpg/1280px-The_Fighting_Temeraire%2C_JMW_Turner%2C_National_Gallery.jpg',
    category: 'romanticism',
    tags: ['turner', 'jmw turner', 'fighting temeraire', 'hoàng hôn', 'tàu buồm', 'biển', 'lãng mạn', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-constable-haywain',
    title: 'The Hay Wain (Cỗ xe chở cỏ)',
    subtitle: 'John Constable (1821)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/The_Hay_Wain_-_John_Constable_%281821%29.jpg/1280px-The_Hay_Wain_-_John_Constable_%281821%29.jpg',
    category: 'romanticism',
    tags: ['constable', 'john constable', 'the hay wain', 'đồng quê', 'nước anh', 'phong cảnh', 'sông nước'],
    source: 'curated'
  },

  // --- MODERN & POST-IMPRESSIONISM ---
  {
    id: 'art-klimt-the-kiss',
    title: 'The Kiss - Der Kuss (Nụ hôn vàng kim)',
    subtitle: 'Gustav Klimt (1908)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg/1280px-The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg',
    category: 'modern',
    tags: ['klimt', 'gustav klimt', 'the kiss', 'nụ hôn', 'vàng kim', 'gold', 'art nouveau', 'vienna', 'áo'],
    source: 'curated'
  },
  {
    id: 'art-klimt-lady-fan',
    title: 'Lady with a Fan (Quý bà cầm quạt)',
    subtitle: 'Gustav Klimt (1918)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Gustav_Klimt_-_Dame_mit_F%C3%A4cher_%281917-18%29.jpg/1280px-Gustav_Klimt_-_Dame_mit_F%C3%A4cher_%281917-18%29.jpg',
    category: 'modern',
    tags: ['klimt', 'lady with a fan', 'quý bà cầm quạt', 'art nouveau', 'họa tiết hoa', 'chim phượng'],
    source: 'curated'
  },
  {
    id: 'art-cezanne-sainte-victoire',
    title: 'Mont Sainte-Victoire (Đỉnh núi Sainte-Victoire)',
    subtitle: 'Paul Cézanne (1904)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Paul_C%C3%A9zanne_-_Mont_Sainte-Victoire_-_Google_Art_Project.jpg/1280px-Paul_C%C3%A9zanne_-_Mont_Sainte-Victoire_-_Google_Art_Project.jpg',
    category: 'modern',
    tags: ['cezanne', 'paul cezanne', 'sainte victoire', 'núi', 'phong cảnh', 'hậu ấn tượng', 'sơn dầu'],
    source: 'curated'
  },
  {
    id: 'art-hopper-nighthawks',
    title: 'Nighthawks (Cú đêm trong thành phố)',
    subtitle: 'Edward Hopper (1942)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Nighthawks_by_Edward_Hopper_1942.jpg/1280px-Nighthawks_by_Edward_Hopper_1942.jpg',
    category: 'modern',
    tags: ['hopper', 'edward hopper', 'nighthawks', 'cú đêm', 'quán ăn', 'thành phố', 'đêm', 'hiện đại'],
    source: 'curated'
  }
];

// -------------------------------------------------------------
// CURATED NATURE & LANDSCAPES (VERIFIED HIGH-RES NATURAL WONDERS)
// -------------------------------------------------------------
const AUTHENTIC_NATURE: CoverItem[] = [
  {
    id: 'nat-swiss-alps-peaks',
    title: 'Swiss Alps Mountain Peaks',
    subtitle: 'Bernese Oberland, Switzerland',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85',
    category: 'mountains',
    tags: ['alps', 'núi tuyết', 'dãy alps', 'thụy sĩ', 'đỉnh núi', 'hùng vĩ', 'snow peaks', 'sky'],
    source: 'curated'
  },
  {
    id: 'nat-pacific-redwoods',
    title: 'Misty Redwood Forest Morning',
    subtitle: 'Redwood National Park, California',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85',
    category: 'mountains',
    tags: ['rừng thông', 'rừng nguyên sinh', 'sương mù', 'misty forest', 'redwoods', 'xanh mát', 'nature'],
    source: 'curated'
  },
  {
    id: 'nat-banff-lake-louise',
    title: 'Lake Louise & Rocky Mountains',
    subtitle: 'Banff National Park, Alberta, Canada',
    url: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1600&q=85',
    category: 'waterfalls',
    tags: ['hồ louise', 'lake louise', 'banff', 'núi đá', 'nước xanh ngọc', 'canada', 'phản chiếu'],
    source: 'curated'
  },
  {
    id: 'nat-norwegian-fjord',
    title: 'Norwegian Fjord Reflection',
    subtitle: 'Geirangerfjord, Norway',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=85',
    category: 'waterfalls',
    tags: ['vịnh hẹp', 'fjord', 'nauy', 'norway', 'mặt hồ', 'núi non', 'sương sớm', 'yên bình'],
    source: 'curated'
  },
  {
    id: 'nat-maldives-sunset',
    title: 'Golden Sunset Ocean Horizon',
    subtitle: 'Baa Atoll, Maldives',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
    category: 'oceans',
    tags: ['hoàng hôn biển', 'sunset', 'ocean', 'biển', 'sóng', 'vàng kim', 'bãi cát', 'bình minh'],
    source: 'curated'
  },
  {
    id: 'nat-tropical-lagoon',
    title: 'Turquoise Coral Reef Lagoon',
    subtitle: 'Bora Bora, French Polynesia',
    url: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1600&q=85',
    category: 'oceans',
    tags: ['biển nhiệt đới', 'nước trong xanh', 'san hô', 'đảo', 'dừa', 'tropical island', 'hè'],
    source: 'curated'
  },
  {
    id: 'nat-aurora-borealis',
    title: 'Northern Lights Aurora Borealis',
    subtitle: 'Tromsø, Arctic Circle, Norway',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=85',
    category: 'skies',
    tags: ['cực quang', 'aurora borealis', 'northern lights', 'bầu trời đêm', 'vũ trụ', 'xanh ngọc', 'bắc cực'],
    source: 'curated'
  },
  {
    id: 'nat-milky-way-desert',
    title: 'Milky Way Galaxy & Starry Sky',
    subtitle: 'Atacama Desert Observatory, Chile',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=85',
    category: 'skies',
    tags: ['dải ngân hà', 'milky way', 'ngôi sao', 'stars', 'night sky', 'vũ trụ', 'sa mạc'],
    source: 'curated'
  },
  {
    id: 'nat-sakura-fuji',
    title: 'Cherry Blossoms & Mount Fuji',
    subtitle: 'Lake Kawaguchiko, Japan',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1600&q=85',
    category: 'seasons',
    tags: ['hoa anh đào', 'sakura', 'núi phú sĩ', 'fuji', 'mùa xuân', 'nhật bản', 'hoa hồng'],
    source: 'curated'
  },
  {
    id: 'nat-provence-lavender',
    title: 'Purple Lavender Fields at Dusk',
    subtitle: 'Valensole Plateau, France',
    url: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=1600&q=85',
    category: 'seasons',
    tags: ['cánh đồng oải hương', 'lavender', 'tím', 'purple', 'pháp', 'hoàng hôn', 'mùa hè'],
    source: 'curated'
  },
  {
    id: 'nat-kyoto-autumn-maple',
    title: 'Kyoto Autumn Red Maples',
    subtitle: 'Tofukuji Temple, Kyoto, Japan',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=85',
    category: 'seasons',
    tags: ['mùa thu', 'autumn', 'lá đỏ', 'lá phong', 'kyoto', 'chùa', 'nhật bản', 'momiji'],
    source: 'curated'
  },
  {
    id: 'nat-arashiyama-bamboo',
    title: 'Zen Bamboo Forest Sanctuary',
    subtitle: 'Arashiyama, Kyoto, Japan',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=85',
    category: 'mountains',
    tags: ['rừng trúc', 'bamboo grove', 'arashiyama', 'kyoto', 'zen', 'tĩnh lặng', 'xanh ngọc'],
    source: 'curated'
  },
  {
    id: 'nat-skogafoss-waterfall',
    title: 'Skógafoss Glacial Waterfall & Rainbow',
    subtitle: 'South Coast, Iceland',
    url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=85',
    category: 'waterfalls',
    tags: ['thác nước', 'waterfall', 'iceland', 'băng đảo', 'cầu vồng', 'nước chảy', 'hùng vĩ'],
    source: 'curated'
  },
  {
    id: 'nat-sahara-gold-dunes',
    title: 'Golden Sunset over Desert Dunes',
    subtitle: 'Erg Chebbi, Sahara Desert, Morocco',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=85',
    category: 'mountains',
    tags: ['sa mạc', 'desert', 'cát vàng', 'dunes', 'sahara', 'hoàng hôn', 'ấm áp'],
    source: 'curated'
  },
  {
    id: 'nat-dolomites-peaks',
    title: 'Dolomites Alpine Pinnacle Glow',
    subtitle: 'Tre Cime di Lavaredo, Italy',
    url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=85',
    category: 'mountains',
    tags: ['dolomites', 'ý', 'italy', 'núi đá', 'hoàng hôn', 'đồng cỏ', 'alpine'],
    source: 'curated'
  }
];

// Helper: Normalize string for search (strip diacritics / accents)
function normalizeStr(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Helper: Translate Vietnamese search intents to English museum queries
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
    [/co gai deo hoa tai/g, 'girl with a pearl earring vermeer'],
    [/phong ngu arles/g, 'bedroom in arles van gogh']
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

export function NotionCoverPicker({ theme, onSelect, onClose, currentCover, lang = 'en' }: Props) {
  const [activeTab, setActiveTab] = useState<'art' | 'nature' | 'upload' | 'link'>('art');
  const [artCategory, setArtCategory] = useState<string>('all');
  const [natureCategory, setNatureCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineResults, setOnlineResults] = useState<CoverItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = getNotionI18n(lang);

  // Close popup when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
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
        // Query Art Institute of Chicago API (CC0 Public Domain Masterpieces)
        const articUrl = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(
          mappedTerm
        )}&query[term][is_public_domain]=true&fields=id,title,artist_title,date_display,image_id,thumbnail&limit=18`;

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

        // Fallback to Wikimedia Commons API if Artic returns 0 results
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
        // Nature tab online search via Wikimedia
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

  // Debounce search typing
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

  // Perform multi-keyword filtering on local collections
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

  // Computed Fine Art list
  const displayedArt = useMemo(() => {
    const localFiltered = filterItems(AUTHENTIC_FINE_ART, artCategory, searchQuery);
    if (searchQuery.trim() && onlineResults.length > 0) {
      // Merge local matching + online results without duplicate URLs
      const seen = new Set(localFiltered.map((i) => i.url));
      const filteredOnline = onlineResults.filter((i) => !seen.has(i.url));
      return [...localFiltered, ...filteredOnline];
    }
    return localFiltered;
  }, [artCategory, searchQuery, onlineResults]);

  // Computed Nature list
  const displayedNature = useMemo(() => {
    const localFiltered = filterItems(AUTHENTIC_NATURE, natureCategory, searchQuery);
    if (searchQuery.trim() && onlineResults.length > 0) {
      const seen = new Set(localFiltered.map((i) => i.url));
      const filteredOnline = onlineResults.filter((i) => !seen.has(i.url));
      return [...localFiltered, ...filteredOnline];
    }
    return localFiltered;
  }, [natureCategory, searchQuery, onlineResults]);

  // Handle local image file upload with downscaling & compression
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

  // SYSTEM THEME PRINCIPLES & COLOR MAPPINGS
  const surfaceBg = theme.surface || (theme.isDark ? '#0c0c0e' : '#ffffff');
  const panelBg = theme.panel || surfaceBg;
  const inputBg = theme.bg || (theme.isDark ? '#141417' : '#f8fafc');
  const borderColor = theme.border || (theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)');
  const borderFaintColor = theme.borderFaint || (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)');
  const textColor = theme.text || (theme.isDark ? '#f8fafc' : '#0f172a');
  const textMutedColor = theme.textMuted || (theme.isDark ? '#94a3b8' : '#64748b');
  const accentColor = theme.accent || '#3b82f6';
  const accentSoft = theme.accentSoft || theme.accentLight || 'rgba(59, 130, 246, 0.15)';
  const backdropBg = theme.isDark ? 'rgba(0, 0, 0, 0.72)' : 'rgba(15, 23, 42, 0.45)';

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
        {/* Navigation Tabs Header */}
        <div
          className="flex items-center justify-between px-4 pt-3 border-b gap-2"
          style={{ borderColor: borderFaintColor, backgroundColor: panelBg }}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => {
                setActiveTab('art');
                setSearchQuery('');
                setOnlineResults([]);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap"
              style={{
                borderColor: activeTab === 'art' ? accentColor : 'transparent',
                color: activeTab === 'art' ? accentColor : textMutedColor,
                opacity: activeTab === 'art' ? 1 : 0.75
              }}
            >
              <ImageIcon size={15} />
              <span>{lang === 'vi' ? 'Danh tác Nghệ thuật (Fine Art)' : 'Fine Art Masterpieces'}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('nature');
                setSearchQuery('');
                setOnlineResults([]);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap"
              style={{
                borderColor: activeTab === 'nature' ? accentColor : 'transparent',
                color: activeTab === 'nature' ? accentColor : textMutedColor,
                opacity: activeTab === 'nature' ? 1 : 0.75
              }}
            >
              <Trees size={15} />
              <span>{lang === 'vi' ? 'Thiên nhiên (Nature)' : 'Nature Landscapes'}</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap"
              style={{
                borderColor: activeTab === 'upload' ? accentColor : 'transparent',
                color: activeTab === 'upload' ? accentColor : textMutedColor,
                opacity: activeTab === 'upload' ? 1 : 0.75
              }}
            >
              <Upload size={15} />
              <span>{lang === 'vi' ? 'Tải lên' : 'Upload'}</span>
            </button>

            <button
              onClick={() => setActiveTab('link')}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap"
              style={{
                borderColor: activeTab === 'link' ? accentColor : 'transparent',
                color: activeTab === 'link' ? accentColor : textMutedColor,
                opacity: activeTab === 'link' ? 1 : 0.75
              }}
            >
              <Link2 size={15} />
              <span>{t.link || 'Link'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            style={{ color: textMutedColor }}
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 max-h-[500px] overflow-y-auto kgv-scroll flex flex-col gap-3.5">
          {/* TAB 1: FINE ART */}
          {activeTab === 'art' && (
            <div className="flex flex-col gap-3">
              {/* Search Bar & Instant Museum Query */}
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
                        ? 'Tìm danh họa, tên tranh (Van Gogh, Monet, Hokusai, Rembrandt, sơn dầu, hoa hướng dương...)'
                        : 'Search artist, painting or movement (Van Gogh, Monet, Hokusai, Rembrandt, oil, starry night...)'
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
                      title="Clear search"
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

                {/* Status or Quick Suggestion Pills */}
                {isSearchingOnline ? (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium"
                    style={{ backgroundColor: accentSoft, color: accentColor }}
                  >
                    <Loader2 size={13} className="animate-spin shrink-0" />
                    <span>{lang === 'vi' ? 'Đang tra cứu dữ liệu bảo tàng quốc tế (Art Institute of Chicago & Wikimedia)...' : 'Searching Art Institute of Chicago & Wikimedia collections...'}</span>
                  </div>
                ) : !searchQuery ? (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                    {(
                      [
                        { key: 'all', label: lang === 'vi' ? 'Tất cả' : 'All' },
                        { key: 'impressionism', label: lang === 'vi' ? 'Ấn tượng (Monet, Van Gogh)' : 'Impressionism' },
                        { key: 'japanese', label: lang === 'vi' ? 'Tranh Nhật Ukiyo-e (Hokusai)' : 'Japanese Ukiyo-e' },
                        { key: 'renaissance', label: lang === 'vi' ? 'Phục hưng (Da Vinci, Botticelli)' : 'Renaissance' },
                        { key: 'baroque', label: lang === 'vi' ? 'Baroque (Rembrandt, Vermeer)' : 'Baroque Masters' },
                        { key: 'romanticism', label: lang === 'vi' ? 'Lãng mạn (Friedrich, Turner)' : 'Romanticism' },
                        { key: 'modern', label: lang === 'vi' ? 'Hậu ấn tượng & Hiện đại (Klimt, Hopper)' : 'Modern Masters' }
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
                            borderColor: isSelected ? accentColor : borderFaintColor,
                            boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
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
                        ? `Tìm thấy ${displayedArt.length} tác phẩm nghệ thuật`
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
                      title={`${art.title} - ${art.subtitle}`}
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
                          (e.currentTarget as HTMLImageElement).src =
                            'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/640px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg';
                        }}
                      />

                      {/* Source Badge */}
                      {art.source === 'artic' && (
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                          Art Institute
                        </div>
                      )}

                      {/* Overlay Gradient with Title and Artist */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                        <span className="text-[11px] text-white font-semibold line-clamp-1 drop-shadow-md">
                          {art.title}
                        </span>
                        <span className="text-[10px] text-white/80 line-clamp-1 drop-shadow-xs">
                          {art.subtitle}
                        </span>
                      </div>

                      {/* Active Selection Checkmark */}
                      {isSelected && (
                        <div
                          className="absolute top-1.5 right-1.5 w-5 h-5 text-white rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Empty State */}
              {displayedArt.length === 0 && !isSearchingOnline && (
                <div
                  className="py-12 text-center flex flex-col items-center justify-center gap-2 text-xs opacity-75"
                  style={{ color: textMutedColor }}
                >
                  <AlertCircle size={24} className="opacity-50" />
                  <p className="font-semibold">
                    {lang === 'vi' ? 'Không tìm thấy tác phẩm với từ khóa này' : 'No artworks matching your search'}
                  </p>
                  <p className="text-[11px] max-w-sm opacity-70">
                    {lang === 'vi'
                      ? 'Thử nhập tên danh họa (Monet, Van Gogh, Klimt, Rembrandt, Da Vinci, Hokusai) hoặc thể loại (sơn dầu, phong cảnh, chân dung).'
                      : 'Try searching by artist name (Monet, Van Gogh, Klimt, Rembrandt, Da Vinci, Hokusai) or art genre.'}
                  </p>
                  <button
                    onClick={() => searchOnlineDatabase(searchQuery)}
                    className="mt-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Search size={12} />
                    <span>{lang === 'vi' ? 'Tìm trong cơ sở dữ liệu mở rộng' : 'Search extended museum catalog'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NATURE */}
          {activeTab === 'nature' && (
            <div className="flex flex-col gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" style={{ color: textMutedColor }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'vi'
                      ? 'Tìm phong cảnh (núi tuyết, rừng thông, biển, hồ, hoàng hôn, cực quang, hoa anh đào...)'
                      : 'Search nature (mountains, forest, ocean, lake, sunset, aurora, cherry blossoms...)'
                  }
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border outline-none transition-all focus:ring-2"
                  style={{
                    backgroundColor: inputBg,
                    borderColor: borderColor,
                    color: textColor
                  }}
                />
              </div>

              {/* Sub-Category Pills */}
              {!searchQuery && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                  {(
                    [
                      { key: 'all', label: lang === 'vi' ? 'Tất cả' : 'All' },
                      { key: 'mountains', label: lang === 'vi' ? 'Núi & Rừng' : 'Mountains & Forests' },
                      { key: 'oceans', label: lang === 'vi' ? 'Biển & Hoàng hôn' : 'Oceans & Sunsets' },
                      { key: 'skies', label: lang === 'vi' ? 'Bầu trời & Sao' : 'Skies & Stars' },
                      { key: 'seasons', label: lang === 'vi' ? 'Bốn mùa & Hoa' : 'Seasons & Flora' },
                      { key: 'waterfalls', label: lang === 'vi' ? 'Thác nước & Vịnh' : 'Waterfalls & Fjords' }
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
                          borderColor: isSelected ? accentColor : borderFaintColor,
                          boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Nature Grid */}
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
                      title={`${item.title} - ${item.subtitle}`}
                      className="cursor-pointer group relative aspect-video rounded-xl overflow-hidden border transition-all hover:scale-[1.02] hover:shadow-lg"
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
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                        <span className="text-[11px] text-white font-semibold line-clamp-1 drop-shadow-md">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-white/80 line-clamp-1 drop-shadow-xs">
                          {item.subtitle}
                        </span>
                      </div>
                      {isSelected && (
                        <div
                          className="absolute top-1.5 right-1.5 w-5 h-5 text-white rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {displayedNature.length === 0 && (
                <div
                  className="py-12 text-center flex flex-col items-center justify-center gap-1 text-xs opacity-70"
                  style={{ color: textMutedColor }}
                >
                  <AlertCircle size={22} className="opacity-50 mb-1" />
                  <p>{lang === 'vi' ? 'Không tìm thấy phong cảnh thiên nhiên phù hợp' : 'No nature covers matching your search'}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="flex flex-col gap-3 py-1">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer transition-all group"
                style={{
                  borderColor: borderColor,
                  backgroundColor: inputBg
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={32} style={{ color: accentColor }} />
                    <span className="text-xs font-semibold" style={{ color: textMutedColor }}>
                      {lang === 'vi' ? 'Đang nén và xử lý ảnh...' : 'Processing and compressing image...'}
                    </span>
                  </>
                ) : (
                  <>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs"
                      style={{
                        backgroundColor: accentSoft,
                        color: accentColor
                      }}
                    >
                      <Upload size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: textColor }}>
                        {lang === 'vi' ? 'Chọn ảnh từ thiết bị của bạn' : 'Choose image from your computer'}
                      </p>
                      <p className="text-[11px] mt-1 opacity-65" style={{ color: textMutedColor }}>
                        {lang === 'vi' ? 'Kéo thả hoặc nhấp để duyệt file (PNG, JPG, WebP)' : 'Drag & drop or click to browse (PNG, JPG, WebP)'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LINK */}
          {activeTab === 'link' && (
            <div className="flex flex-col gap-3 py-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold opacity-80" style={{ color: textMutedColor }}>
                  {t.pasteImageLink || 'Paste direct image URL'}
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... hoặc link ảnh bất kỳ"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none transition-all focus:ring-2"
                  style={{
                    backgroundColor: inputBg,
                    borderColor: borderColor,
                    color: textColor
                  }}
                />
              </div>

              {linkUrl && (
                <div
                  className="aspect-video w-full rounded-xl overflow-hidden border relative shadow-xs"
                  style={{ borderColor: borderFaintColor }}
                >
                  <img
                    src={linkUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <button
                onClick={() => {
                  if (linkUrl.trim()) {
                    onSelect(linkUrl.trim());
                    onClose();
                  }
                }}
                disabled={!linkUrl.trim()}
                className="w-full py-2.5 text-xs font-semibold rounded-xl text-white disabled:opacity-50 transition-all cursor-pointer shadow-xs hover:brightness-105 active:scale-98"
                style={{ backgroundColor: accentColor }}
              >
                {t.submit || 'Apply Cover'}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Footer */}
        <div
          className="px-4 py-3 border-t flex items-center justify-between"
          style={{
            borderColor: borderFaintColor,
            backgroundColor: inputBg
          }}
        >
          <div className="flex items-center gap-1 text-[11px] opacity-60" style={{ color: textMutedColor }}>
            <span>🏛️</span>
            <span>{lang === 'vi' ? 'Cơ sở dữ liệu Nghệ thuật Công cộng' : 'Open Access Public Domain Art'}</span>
          </div>

          <div className="flex items-center gap-2">
            {currentCover && (
              <button
                onClick={() => {
                  onSelect(null);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{t.removeCover || 'Remove cover'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
