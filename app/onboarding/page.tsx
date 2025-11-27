'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Check, Newspaper, ArrowRight, Loader2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Seçeneklerimiz
const INTERESTS = [
  { id: 'Spor', label: 'Spor', icon: '⚽️', desc: 'Futbol, Basketbol ve son skorlar' },
  { id: 'Ekonomi', label: 'Ekonomi', icon: '💰', desc: 'Piyasalar, dolar, altın ve borsa' },
  { id: 'Teknoloji', label: 'Teknoloji', icon: '💻', desc: 'Yapay zeka, telefonlar ve yazılım' },
  { id: 'Gündem', label: 'Gündem', icon: 'turkey', desc: 'Türkiye\'den son dakika haberleri' }, // icon string olarak güncellendi
  { id: 'Dünya', label: 'Dünya', icon: 'earth', desc: 'Dünya genelindeki gelişmeler' }, // icon string olarak güncellendi
];

export default function Onboarding() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.push('/login');
  };

  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(item => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleSave = async () => {
    if (selected.length === 0) return alert('Lütfen en az bir kategori seçin!');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      // 1. Profil tablosuna ilgi alanlarını kaydet
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          interests: selected,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // 2. Anasayfaya gönder
      router.push('/');
      
    } catch (error: any) {
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        
        <div className="text-center mb-10">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Newspaper className="text-red-600 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Neleri takip etmek istersin?</h1>
          <p className="text-gray-500">Sana özel akışını oluşturmak için ilgini çeken konuları seç.</p>
        </div>

        {/* Seçim Izgarası */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {INTERESTS.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleInterest(item.id)}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all group
                ${selected.includes(item.id) 
                  ? 'border-red-600 bg-red-50' 
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200'}
              `}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl mb-2 block">{item.icon === 'turkey' ? '🇹🇷' : item.icon === 'earth' ? '🌍' : item.icon}</span>
                {selected.includes(item.id) && (
                  <div className="bg-red-600 text-white p-1 rounded-full animate-in zoom-in">
                    <Check size={12} />
                  </div>
                )}
              </div>
              <h3 className={`font-bold ${selected.includes(item.id) ? 'text-red-900' : 'text-gray-900'}`}>
                {item.label}
              </h3>
              <p className={`text-sm mt-1 ${selected.includes(item.id) ? 'text-red-700' : 'text-gray-500'}`}>
                {item.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Alt Buton */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl transform active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" /> : <>Akışımı Oluştur <ArrowRight /></>}
        </button>

      </div>
    </div>
  );
}