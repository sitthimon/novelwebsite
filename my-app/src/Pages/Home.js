import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import novelsData from '../novelsData'; // Fallback data

export default function Home() {
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ฟังก์ชันดึงข้อมูลนิยายจาก API พร้อมตอน
  const fetchNovels = async () => {
    try {
      console.log('🔄 Fetching novels with chapters from API...');
      const response = await fetch('http://localhost:4000/api/novels-with-chapters');
      
      if (response.ok) {
        const apiNovels = await response.json();
        console.log(`✅ API returned ${apiNovels.length} novels with chapters:`, apiNovels);
        
        // รวมข้อมูลจาก API กับ fallback data
        const mergedNovels = apiNovels.map(apiNovel => {
          const fallbackNovel = novelsData.find(n => n.id.toString() === apiNovel.id.toString());
          return {
            ...apiNovel,
            img: apiNovel.coverUrl || fallbackNovel?.coverUrl || fallbackNovel?.img,
            chapters: apiNovel.chapters || [],
            title: apiNovel.title,
            author: apiNovel.author,
            description: apiNovel.description,
            isFromAPI: true
          };
        });
        
        // เพิ่มนิยายจาก fallback ที่ไม่มีใน API
        const fallbackOnlyNovels = novelsData.filter(fallbackNovel => 
          !apiNovels.some(apiNovel => apiNovel.id.toString() === fallbackNovel.id.toString())
        ).map(novel => ({
          ...novel,
          isFromFallback: true
        }));
        
        const allNovels = [...mergedNovels, ...fallbackOnlyNovels];
        setNovels(allNovels);
        setError(null);
        
      } else {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error fetching novels from API:', error);
      setError(error.message);
      setNovels(novelsData.map(novel => ({ ...novel, isFromFallback: true })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNovels();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-xl font-medium">กำลังโหลดนิยาย...</p>
          <p className="text-gray-400 mt-2">รอสักครู่...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              📚 Novel Collection
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              ค้นพบและเพลิดเพลินไปกับนิยายจากคอลเล็กชันของเรา
            </p>
          </div>

        </div>
      </div>

      {/* Novels Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {novels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {novels.map((novel, idx) => (
              <Link 
                key={`${novel.id}-${idx}`} 
                to={`/novel/${novel.id}`} 
                className="group block"
              >
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-2">
                  {/* Image Container */}
                  <div className="relative overflow-hidden">
                    <img
                      src={novel.img || novel.coverUrl || 'https://via.placeholder.com/300x400?text=No+Cover'}
                      alt={`นิยาย ${novel.title || novel.id}`}
                      className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x400/374151/9CA3AF?text=📚+No+Cover';
                      }}
                    />
                
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {novel.title || `นิยาย ${novel.id}`}
                    </h3>
                    
                    {/* Author */}
                    {novel.author && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-1">
                        โดย {novel.author}
                      </p>
                    )}
                    
                    {/* Description */}
                    {novel.description && (
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {novel.description}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1 text-blue-400">
                          <span>📚</span>
                          <span>{novel.chapters?.length || 0} ตอน</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <span className="hover:text-gray-300 transition-colors">
                          อ่านเลย →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-20">
            <div className="text-8xl mb-6">📚</div>
            <h2 className="text-2xl font-bold text-white mb-4">ไม่พบข้อมูลนิยาย</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง
            </p>
            <button 
              onClick={fetchNovels}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors duration-200 shadow-lg hover:shadow-blue-500/25"
            >
              🔄 รีเฟรชข้อมูล
            </button>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {!loading && novels.length > 0 && (
        <div className="border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap justify-center items-center space-x-8 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <span>📖</span>
                <span>{novels.length} นิยาย</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📚</span>
                <span>{novels.reduce((total, novel) => total + (novel.chapters?.length || 0), 0)} ตอน</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}