import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase istemcisi oluşturma
const supabase = createClient(supabaseUrl, supabaseKey);

// RSS Parser ayarları (Gelişmiş alanları okumak için customFields ekledik)
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
  },
  customFields: {
    item: [
      ['media:content', 'media:content'], // BBC ve CNN görselleri burada olabilir
      ['content:encoded', 'contentEncoded'], // Detaylı içerik
      ['description', 'description'] // Özet (Bazen resim buradadır)
    ]
  }
});

// Kaynak Listesi (GÜNCELLENDİ: CNN Türk Geri Eklendi + Diğerleri)
const SOURCES = [
  // TRT Haber (Çok Stabil)
  { category: 'Spor', url: 'https://www.trthaber.com/spor_articles.rss', source: 'TRT Haber' },
  { category: 'Ekonomi', url: 'https://www.trthaber.com/ekonomi_articles.rss', source: 'TRT Haber' },
  { category: 'Teknoloji', url: 'https://www.trthaber.com/bilim_teknoloji_articles.rss', source: 'TRT Haber' },
  { category: 'Gündem', url: 'https://www.trthaber.com/manset_articles.rss', source: 'TRT Haber' },
  { category: 'Dünya', url: 'https://www.trthaber.com/dunya_articles.rss', source: 'TRT Haber' },
  
  // CNN Türk (Geri Eklendi)
  { category: 'Spor', url: 'https://www.cnnturk.com/feed/66/rss', source: 'CNN Türk' },
  { category: 'Ekonomi', url: 'https://www.cnnturk.com/feed/71/rss', source: 'CNN Türk' },
  { category: 'Teknoloji', url: 'https://www.cnnturk.com/feed/58/rss', source: 'CNN Türk' },
  
  // Ensonhaber (Çok Stabil)
  { category: 'Spor', url: 'https://www.ensonhaber.com/rss/spor.xml', source: 'Ensonhaber' },
  { category: 'Ekonomi', url: 'https://www.ensonhaber.com/rss/ekonomi.xml', source: 'Ensonhaber' },
  { category: 'Gündem', url: 'https://www.ensonhaber.com/rss/manset.xml', source: 'Ensonhaber' },
  
  // NTV (Genelde Stabil)
  { category: 'Gündem', url: 'https://www.ntv.com.tr/gundem.rss', source: 'NTV' },
  { category: 'Teknoloji', url: 'https://www.ntv.com.tr/teknoloji.rss', source: 'NTV' },
  { category: 'Dünya', url: 'https://www.ntv.com.tr/dunya.rss', source: 'NTV' },
  { category: 'Ekonomi', url: 'https://www.ntv.com.tr/ekonomi.rss', source: 'NTV' },

  // Habertürk
  { category: 'Ekonomi', url: 'https://www.haberturk.com/rss/ekonomi.xml', source: 'Habertürk' },
  { category: 'Gündem', url: 'https://www.haberturk.com/rss/manset.xml', source: 'Habertürk' },

  // DonanımHaber (Teknoloji için en iyisi)
  { category: 'Teknoloji', url: 'https://www.donanimhaber.com/rss/tum/', source: 'DonanımHaber' }
];

export async function GET() {
  try {
    let totalAdded = 0;
    
    // Tüm kaynakları gez
    for (const source of SOURCES) {
      try {
        const feed: any = await parser.parseURL(source.url);
        
        for (const item of feed.items) {
          // Gelişmiş Görsel Bulma Mantığı
          // 1. Standart enclosure
          // 2. Media content (BBC/CNN tarzı)
          // 3. İçerik veya Açıklama içindeki <img src="..."> etiketi
          const imageUrl = item.enclosure?.url || 
                           item['media:content']?.$?.url ||
                           item['media:content']?.url ||
                           item.content?.match(/src="([^"]+)"/)?.[1] || 
                           item.contentEncoded?.match(/src="([^"]+)"/)?.[1] ||
                           item.description?.match(/src="([^"]+)"/)?.[1] ||
                           null;

          if (item.title && item.link) {
            const { error } = await supabase.from('news').upsert(
              {
                title: item.title,
                link: item.link,
                image_url: imageUrl,
                category: source.category,
                source: source.source,
                created_at: new Date(item.pubDate || Date.now()).toISOString(),
              },
              { onConflict: 'link' }
            );
            if (!error) totalAdded++;
          }
        }
      } catch (err) {
        console.log(`${source.source} (${source.category}) çekilemedi, hata oluştu veya erişim engellendi.`);
      }
    }

    return NextResponse.json({ success: true, message: `${totalAdded} haber başarıyla eklendi.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}