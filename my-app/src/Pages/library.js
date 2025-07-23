import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Library() {
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [allNovels, setAllNovels] = useState([]); // เปลี่ยนจากใช้ novelsData เป็น state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ดึง user จาก localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          setError('กรุณาเข้าสู่ระบบเพื่อดูรายการโปรด');
          setLoading(false);
          return;
        }

        console.log('Fetching data for user:', user);
        
        // ดึงข้อมูลแบบ parallel
        const [favoritesResponse, novelsResponse] = await Promise.all([
          axios.get(`http://localhost:4000/api/users/${user.user_id || user.id}/favorites`),
          axios.get(`http://localhost:4000/api/novels`) // ใช้ API แทน static data
        ]);
        
        console.log('Favorites response:', favoritesResponse.data);
        console.log('Novels response:', novelsResponse.data);
        
        // ตั้งค่าข้อมูลนิยายทั้งหมด
        setAllNovels(novelsResponse.data || []);
        
        // ตั้งค่ารายการโปรด
        if (favoritesResponse.data.success !== false) {
          setFavoriteBooks(favoritesResponse.data.favorites || []);
        } else {
          setFavoriteBooks([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        
        // ถ้า API ไม่สามารถเชื่อมต่อได้ ให้ fallback ไปใช้ static data
        if (err.message.includes('Network Error') || err.code === 'ERR_NETWORK') {
          console.log('API not available, falling back to static data');
          try {
            const novelsData = await import('../novelsData');
            setAllNovels(novelsData.default || []);
            setError('ไม่สามารถเชื่อมต่อ API ได้ - แสดงข้อมูลตัวอย่าง');
          } catch (fallbackErr) {
            console.error('Fallback also failed:', fallbackErr);
            setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
          }
        } else {
          setError('เกิดข้อผิดพลาดในการดึงรายการโปรด');
        }
        setFavoriteBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ฟังก์ชันสำหรับลบออกจากรายการโปรด
  const removeFromFavorites = async (novelId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;

      // เรียก API toggle favorites (จะเป็นการลบเพราะมีอยู่แล้ว)
      await axios.post(`http://localhost:4000/api/novels/${novelId}/favorites`, {
        userId: user.user_id || user.id
      });

      // อัพเดต state โดยลบ novel ที่ถูกลบออก - แก้ไขให้รองรับทั้ง string และ number
      setFavoriteBooks(prev => prev.filter(book => book.novel_id.toString() !== novelId.toString()));
      
      console.log(`Removed novel ${novelId} from favorites`);
    } catch (err) {
      console.error('Error removing from favorites:', err);
    }
  };

  // กรองนิยายที่อยู่ในรายการโปรด - ใช้ข้อมูลจาก API แทน static data
  const favoriteNovelObjects = allNovels.filter(novel =>
    favoriteBooks.find(fav => fav.novel_id.toString() === novel.id.toString())
  );

  console.log('favoriteBooks:', favoriteBooks);
  console.log('allNovels:', allNovels);
  console.log('favoriteNovelObjects:', favoriteNovelObjects);
  console.log('Type check - favoriteBooks[0]?.novel_id:', typeof favoriteBooks[0]?.novel_id);
  console.log('Type check - allNovels[0]?.id:', typeof allNovels[0]?.id);

  if (loading) {
    return (
      <div className="bg-gray-800 min-h-screen w-full flex flex-col items-center justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <div className="text-white text-xl">กำลังโหลดรายการโปรด...</div>
        <div className="text-gray-400 text-sm mt-2">กำลังดึงข้อมูลจาก Database API...</div>
      </div>
    );
  }

  if (error && allNovels.length === 0) {
    return (
      <div className="bg-gray-800 min-h-screen w-full flex flex-col items-center justify-center py-10">
        <div className="text-red-400 text-xl mb-4">{error}</div>
        {error.includes('เข้าสู่ระบบ') ? (
          <Link to="/login" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            เข้าสู่ระบบ
          </Link>
        ) : (
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 min-h-screen w-full flex flex-col items-center py-10">
      <div className="max-w-6xl w-full px-4">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          📚 ห้องสมุดของฉัน
        </h1>

        {favoriteBooks.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl mb-4">ยังไม่มีนิยายในรายการโปรด</h2>
            <p className="text-lg mb-6">ไปเลือกนิยายที่ชอบแล้วกด 🔖 เพื่อเพิ่มเข้ารายการโปรดกัน!</p>
            <Link 
              to="/" 
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              เลือกนิยายเลย
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <p className="text-gray-300 text-lg">
                มีนิยายในรายการโปรด {favoriteBooks.length} เรื่อง
              </p>
              <p className="text-gray-400 text-sm">
                พบนิยายที่ตรงกัน {favoriteNovelObjects.length} เรื่อง
              </p>
            </div>

            {/* card นิยาย responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {favoriteNovelObjects.map((novel, idx) => (
                <div key={novel.id} className="relative group">
                  <Link to={`/novel/${novel.id}`} className="block">
                    <div className="relative overflow-hidden rounded-xl shadow-lg">
                      <img
                        src={novel.coverUrl || novel.cover_image_url || novel.img}
                        alt={`นิยาย ${novel.title || novel.id}`}
                        className="object-cover w-full h-64 transition-transform duration-200 hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-book.jpg';
                        }}
                      />
                      
                      {/* Overlay for better hover effect */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-200"></div>
                      
                      {/* Title overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <h3 className="text-white font-semibold text-sm truncate">
                          {novel.title || `นิยาย ${novel.id}`}
                        </h3>
                        <p className="text-gray-300 text-xs truncate">
                          {novel.author || novel.author_name || 'ไม่ระบุผู้เขียน'}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* ปุ่มลบออกจากรายการโปรด */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFromFavorites(novel.id);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100 z-10"
                    title="ลบออกจากรายการโปรด"
                  >
                    ✕
                  </button>

                  {/* ป้ายกำกับโปรด */}
                  <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-semibold z-10">
                    ❤️ โปรด
                  </div>
                </div>
              ))}
            </div>

            {/* Debug info - แสดงเมื่อมี favorites แต่ไม่พบ novels */}
            {favoriteNovelObjects.length === 0 && favoriteBooks.length > 0 && (
              <div className="mt-8 p-4 bg-gray-700 rounded text-white text-sm">
                <h3 className="font-bold mb-2">⚠️ ไม่พบนิยายในรายการโปรด</h3>
                <p className="mb-2">มีข้อมูลในรายการโปรด {favoriteBooks.length} รายการ แต่ไม่พบนิยายที่ตรงกัน</p>
                <p className="text-xs text-gray-300 mb-2">
                  📊 สถานะ: ดึงข้อมูลจาก Database API ({allNovels.length} นิยายทั้งหมด)
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer">ดูข้อมูล Debug</summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Favorites IDs:</strong>
                      <pre className="text-xs mt-1 overflow-x-auto bg-gray-800 p-2 rounded">
                        {favoriteBooks.map(f => f.novel_id).join(', ')}
                      </pre>
                    </div>
                    <div>
                      <strong>Available Novel IDs (from API):</strong>
                      <pre className="text-xs mt-1 overflow-x-auto bg-gray-800 p-2 rounded">
                        {allNovels.map(n => n.id).join(', ')}
                      </pre>
                    </div>
                    <div>
                      <strong>Data types:</strong>
                      <pre className="text-xs mt-1 overflow-x-auto bg-gray-800 p-2 rounded">
                        Favorite: {typeof favoriteBooks[0]?.novel_id} | Novel: {typeof allNovels[0]?.id}
                      </pre>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
