'use client';

import { useEffect, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import { ExternalLink, Calendar, Newspaper, Loader2, RefreshCw, LogOut, User as UserIcon, LogIn, Sparkles, SlidersHorizontal, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 1. Supabase Bağlantısı
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Kategoriler
const CATEGORIES = ['Sana Özel', 'Tümü', 'Spor', 'Ekonomi', 'Teknoloji', 'Gündem', 'Dünya'];

// Kaynaklar Listesi (Bot dosyasındaki ile aynı olmalı)
const SOURCES = ['Tümü', 'TRT Haber', 'Ensonhaber', 'NTV', 'Habertürk', 'DonanımHaber', 'CNN Türk', 'BBC Türkçe', 'Sözcü', 'Sondakika'];

interface NewsItem {
  id: number;
  title: string;
  link: string;
  image_url: string | null;
  category: string;
  source: string;
  created_at: string;
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedSource, setSelectedSource] = useState('Tümü'); 
  const [user, setUser] = useState<User | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  
  // YENİ: Modal Durumu
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNewsLink, setSelectedNewsLink] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;
    
    const init = async () => {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('interests')
          .eq('id', session.user.id)
          .single();
        
        if (profile && profile.interests && profile.interests.length > 0) {
          setInterests(profile.interests);
          setSelectedCategory('Sana Özel'); 
        }
      }

      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error) setNews(data || []);
      setLoading(false);
    };

    init();
  }, []);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setInterests([]);
    setSelectedCategory('Tümü');
    setSelectedSource('Tümü'); 
    router.refresh();
  };

  // YENİ: Habere Tıklama Fonksiyonu
  const handleNewsClick = (link: string) => {
    setSelectedNewsLink(link);
    setModalOpen(true);
  };


  // --- FİLTRELEME MANTIĞI ---
  const filteredNews = news.filter(item => {
    // 1. Kategori Kontrolü
    let categoryMatch = false;
    if (selectedCategory === 'Tümü') categoryMatch = true;
    else if (selectedCategory === 'Sana Özel') categoryMatch = interests.includes(item.category);
    else categoryMatch = item.category === selectedCategory;

    // 2. Kaynak Kontrolü
    let sourceMatch = false;
    if (selectedSource === 'Tümü') sourceMatch = true;
    else sourceMatch = item.source === selectedSource;

    return categoryMatch && sourceMatch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      
      {/* --- HEADER (Değişmedi) --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-red-600 text-white p-1.5 rounded-lg"><Newspaper size={20} /></div>
              <h1 className="text-xl font-bold tracking-tight hidden md:block">Haber<span className="text-red-600">Boom</span></h1>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
               <Link href="/api/fetch-news" target="_blank" className="hidden md:flex text-xs font-medium text-gray-400 hover:text-red-600 items-center gap-1">
                <RefreshCw size={12} /> Bot
              </Link>
              <div className="h-4 w-px bg-gray-200 hidden md:block"></div>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link href="/onboarding" title="İlgi Alanlarını Düzenle" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                    <SlidersHorizontal size={18} />
                  </Link>
                  <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                    <UserIcon size={14} className="text-gray-500" />
                    <span className="text-xs font-medium text-gray-700 max-w-[100px] truncate">{user.email}</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><LogOut size={18} /></button>
                </div>
              ) : (
                <Link href="/login" className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"><LogIn size={16} /> Giriş Yap</Link>
              )}
            </div>
          </div>

          {/* --- FİLTRELER ALANI (Değişmedi) --- */}
          <div className="flex flex-col gap-3 pb-1">
            
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat) => {
                if (cat === 'Sana Özel' && interests.length === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`
                      px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2
                      ${selectedCategory === cat 
                        ? 'bg-red-600 text-white shadow-md transform scale-105' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                    `}
                  >
                    {cat === 'Sana Özel' && <Sparkles size={14} />}
                    {cat}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pt-1 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Filter size={10} /> Kaynak:
              </span>
              {SOURCES.map((src) => (
                <button
                  key={src}
                  onClick={() => setSelectedSource(src)}
                  className={`
                    px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all border
                    ${selectedSource === src 
                      ? 'bg-gray-800 text-white border-gray-800' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}
                  `}
                >
                  {src}
                </button>
              ))}
            </div>

          </div>
        </div>
      </header>

      {/* --- HABER AKIŞI --- */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20 text-red-600"><Loader2 size={40} className="animate-spin" /></div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500">Bu kategoride haber bulunamadı.</p>
            {selectedCategory === 'Sana Özel' && (
              <Link href="/onboarding" className="text-red-600 font-bold hover:underline mt-2 block">İlgi alanlarını düzenle</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item) => (
              <article 
                key={item.id} 
                // BURASI DEĞİŞTİ: Artık <a> değil, tıklanabilir bir kutu
                onClick={() => handleNewsClick(item.link)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full group cursor-pointer"
                role="button"
              >
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Newspaper size={48} /></div>
                  )}
                  <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full font-bold">{item.source}</span>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3 font-medium">
                    <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">{item.category}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(item.created_at)}</span>
                  </div>
                  <h2 className="text-lg font-bold leading-tight mb-3 text-gray-900 flex-grow group-hover:text-red-600 transition-colors line-clamp-3">{item.title}</h2>
                  {/* Dışarıya gitmek isteyenler için harici link butonu */}
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()} // Modal açılmasını engeller
                    className="mt-auto w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-900 hover:text-white text-gray-700 font-medium py-2.5 rounded-lg transition-all border border-gray-200 text-sm"
                  >
                    Harici Kaynağa Git <ExternalLink size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* --- YENİ: HABER GÖSTERİM MODALI --- */}
      {modalOpen && selectedNewsLink && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-8 z-50 animate-in fade-in duration-300">
          <div className="w-full h-full md:w-5/6 md:h-5/6 bg-white rounded-none md:rounded-xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Başlık Çubuğu */}
            <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-600 truncate max-w-[80%]">
                Kaynak: {selectedNewsLink}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* iFrame İçerik Alanı */}
            <iframe
              src={selectedNewsLink}
              title="Haber İçeriği"
              className="w-full flex-grow border-0"
              style={{ minHeight: '100px' }}
            />
          </div>
        </div>
      )}
    </main>
  );
}