import React, { useContext, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NovelContext } from '../NovelContext';
import novelsData from '../novelsData' // Fallback data
import axios from 'axios';

export default function Novel() {
  const { novelId } = useParams();
  // Fallback จาก novelsData (mock)
  const novels = useContext(NovelContext);
  const fallbackNovel = novels.find(n => n.id.toString() === novelId.toString());
  
  // States
  const [novel, setNovel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chapterStats, setChapterStats] = useState({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState(null);

  // ดึงข้อมูลรูปภาพจาก novelsCover.js (fallback)
  const novelCover = novelsData.find(n => n.id.toString() === novelId.toString());

  // ดึงข้อมูล user จาก localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // ฟังก์ชันดึงข้อมูลนิยายจาก API พร้อมตอน
  const fetchNovelFromAPI = async () => {
    try {
      console.log(`🔄 Fetching novels with chapters from API...`);
      const response = await fetch('http://localhost:4000/api/novels-with-chapters');
      
      if (response.ok) {
        const novels = await response.json();
        console.log(`✅ API returned ${novels.length} novels with chapters`);
        
        // หาข้อมูลนิยายที่ต้องการ
        const foundNovel = novels.find(n => n.id.toString() === novelId.toString());
        
        if (foundNovel) {
          console.log('✅ Found novel from API:', foundNovel.title, 'with', foundNovel.chapters?.length || 0, 'chapters');
          
          // ใช้ข้อมูลจาก API เป็นหลัก แต่เก็บรูปปกจาก fallback หาก API ไม่มี
          const novelWithFallbackCover = {
            ...foundNovel,
            coverUrl: foundNovel.coverUrl || novelCover?.coverUrl || novelCover?.img,
            isFromAPI: true
          };
          
          setNovel(novelWithFallbackCover);
          return novelWithFallbackCover;
        } else {
          console.warn(`⚠️ Novel ${novelId} not found in API, using fallback`);
        }
      } else {
        console.warn(`⚠️ API request failed: ${response.status}, using fallback`);
      }
    } catch (error) {
      console.error('❌ Error fetching novel from API:', error);
    }
    
    // ใช้ fallback data หาก API ล้มเหลว
    if (fallbackNovel) {
      console.log('📋 Using fallback data for novel:', fallbackNovel.title);
      setNovel({
        ...fallbackNovel,
        isFromAPI: false
      });
      return fallbackNovel;
    }
    
    return null;
  };

  // โหลดข้อมูลนิยายเมื่อ component mount
  useEffect(() => {
    const loadNovel = async () => {
      setLoading(true);
      const novelData = await fetchNovelFromAPI();
      
      if (!novelData) {
        console.error('❌ No novel data available');
      }
      
      setLoading(false);
    };
    
    loadNovel();
  }, [novelId]);

  // ฟังก์ชันดึงข้อมูล like และ view count - แก้ไขให้ส่ง userId
  const fetchChapterStats = async (chapterId) => {
    try {
      const userId = user?.user_id || user?.id;
      const url = `http://localhost:4000/api/novels/${novelId}/chapters/${chapterId}/like${userId ? `?userId=${userId}` : ''}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error fetching chapter stats:', error);
    }
    return { likeCount: 0, viewCount: 0, isLikedByUser: false };
  };

  // ฟังก์ชันเพิ่ม view count
  const addView = async (chapterId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/novels/${novelId}/chapters/${chapterId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updatedStats = await fetchChapterStats(chapterId);
        setChapterStats(prev => ({
          ...prev,
          [chapterId]: updatedStats
        }));
        console.log('View added successfully');
      }
    } catch (error) {
      console.error('Error adding view:', error);
    }
  };

  // ฟังก์ชันเพิ่ม like count (toggle like/unlike) - แก้ไขให้ส่ง userId
  const addLike = async (chapterId) => {
    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    try {
      // อัปเดต UI ทันทีเพื่อให้ผู้ใช้เห็นการเปลี่ยนแปลง
      const currentStats = chapterStats[chapterId] || { likeCount: 0, isLikedByUser: false };
      const newIsLiked = !currentStats.isLikedByUser;
      const newLikeCount = newIsLiked ? currentStats.likeCount + 1 : Math.max(0, currentStats.likeCount - 1);

      setChapterStats(prev => ({
        ...prev,
        [chapterId]: {
          ...currentStats,
          isLikedByUser: newIsLiked,
          likeCount: newLikeCount
        }
      }));

      const response = await fetch(`http://localhost:4000/api/novels/${novelId}/chapters/${chapterId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.user_id || user.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Like toggle result:', result);

        // อัปเดตด้วยข้อมูลจริงจาก server
        setChapterStats(prev => ({
          ...prev,
          [chapterId]: {
            ...prev[chapterId],
            likeCount: result.likeCount,
            isLikedByUser: result.isLiked
          }
        }));

        const actionMessage = result.action === 'liked' ? 'ไลค์แล้ว!' : 'ยกเลิกไลค์แล้ว!';
        console.log(actionMessage);
      } else {
        // ถ้า API ล้มเหลว ให้เปลี่ยนกลับ
        setChapterStats(prev => ({
          ...prev,
          [chapterId]: currentStats
        }));
        console.error('Failed to toggle like');
      }
    } catch (error) {
      // ถ้า API ล้มเหลว ให้เปลี่ยนกลับ
      const currentStats = chapterStats[chapterId] || { likeCount: 0, isLikedByUser: false };
      setChapterStats(prev => ({
        ...prev,
        [chapterId]: currentStats
      }));
      console.error('Error toggling like:', error);
    }
  };

  // ฟังก์ชันตรวจสอบสถานะ favorite
  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const response = await axios.get(`http://localhost:4000/api/users/${user.user_id || user.id}/favorites`);
      if (response.data.favorites) {
        const favoriteBooks = response.data.favorites || [];
        const isBookmarked = favoriteBooks.some(fav => fav.novel_id.toString() === novelId.toString());
        setIsFavorite(isBookmarked);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  // ฟังก์ชันเพิ่ม/ลบ bookmark - แก้ไขให้อัปเดต UI ทันที
  const toggleFavorite = async () => {
    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    try {
      // อัปเดต UI ทันทีเพื่อให้ผู้ใช้เห็นการเปลี่ยนแปลง
      const newFavoriteState = !isFavorite;
      setIsFavorite(newFavoriteState);

      const response = await axios.post(`http://localhost:4000/api/novels/${novelId}/favorites`, {
        userId: user.user_id || user.id
      });

      if (response.data.success !== false) {
        // อัปเดตสถานะตาม response จาก server
        setIsFavorite(response.data.isFavorited);
        const message = response.data.action === 'added' ? 'บันทึกเข้ารายการโปรดแล้ว' : 'ลบออกจากรายการโปรดแล้ว';
        console.log(message);
      } else {
        // ถ้า API ล้มเหลว ให้เปลี่ยนกลับ
        setIsFavorite(!newFavoriteState);
        console.error('Failed to update favorite status');
      }
    } catch (error) {
      // ถ้า API ล้มเหลว ให้เปลี่ยนกลับ
      setIsFavorite(!isFavorite);
      console.error('Error toggling favorite:', error);
    }
  };

  // โหลดข้อมูลสถิติของทุก chapter และตรวจสอบสถานะ favorite
  useEffect(() => {
    if (novel && novel.chapters && user) {
      const loadAllStats = async () => {
        const statsPromises = novel.chapters.map(async (chapter) => {
          const stats = await fetchChapterStats(chapter.id);
          return { chapterId: chapter.id, ...stats };
        });

        const allStats = await Promise.all(statsPromises);
        const statsMap = {};
        allStats.forEach(stat => {
          statsMap[stat.chapterId] = stat;
        });
        setChapterStats(statsMap);
      };

      loadAllStats();
      checkFavoriteStatus();
    }
  }, [novel, novelId, user]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-800 min-h-screen w-full flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">กำลังโหลดข้อมูลนิยาย...</p>
          <p className="text-sm text-gray-400 mt-2">รอสักครู่...</p>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="bg-gray-800 min-h-screen w-full flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold mb-2">ไม่พบข้อมูลนิยาย</h2>
          <p className="text-gray-400 mb-4">ไม่สามารถโหลดข้อมูลนิยาย ID: {novelId}</p>
          <Link 
            to="/" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 min-h-screen w-full flex flex-col items-center py-10">
      {/* การ์ดนิยายและข้อมูล */}
      <div className="max-w-4xl w-full px-4">
        <div className="flex gap-8 mb-8">
          {/* รูปปกนิยาย - ใช้ข้อมูลจาก API หรือ fallback */}
          <div className="flex-shrink-0">
            <img
              src={novel.coverUrl || novelCover?.coverUrl || 'https://via.placeholder.com/256x320?text=No+Cover'}
              alt={novel.title}
              className="object-cover rounded-xl shadow-lg w-64 h-80 transition-transform duration-200 hover:scale-105"
            />
          </div>

          {/* ข้อมูลนิยาย - ใช้ข้อมูลจาก API */}
          <div className="flex-1 text-white">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-4xl font-bold">{novel.title}</h1>

              {/* ปุ่ม Bookmark - SVG ribbon bookmark */}
              <button
                onClick={toggleFavorite}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                title={isFavorite ? 'ลบออกจากรายการโปรด' : 'บันทึกเข้ารายการโปรด'}
              >
                <svg
                  width="28"
                  height="36"
                  viewBox="0 0 24 30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-all duration-200"
                >
                  <path
                    d="M2 2C2 0.895 2.895 0 4 0H20C21.105 0 22 0.895 22 2V28L12 22L2 28V2Z"
                    fill={isFavorite ? '#FCD34D' : '#4B5563'}
                    stroke={isFavorite ? '#F59E0B' : '#6B7280'}
                    strokeWidth="1"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-lg text-gray-300 mb-2">
                <span className="font-semibold">ผู้เขียน:</span> {novel.author || 'ไม่ระบุ'}
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">เรื่องย่อ</h2>
              <p className="text-gray-300 leading-relaxed">
                {novel.description || 'ไม่มีเรื่องย่อ'}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>📚 {novel.chapters?.length || 0} ตอน</span>
              <span>👁️ {Object.values(chapterStats).reduce((total, stat) => total + (stat.viewCount || 0), 0)} views</span>
              <span>❤️ {Object.values(chapterStats).reduce((total, stat) => total + (stat.likeCount || 0), 0)} likes</span>
              {isFavorite && <span className="text-yellow-400">🔖 บันทึกแล้ว</span>}
            </div>
          </div>
        </div>

        {/* รายการตอน */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">
            ตอนทั้งหมด
 
          </h2>
          {novel.chapters && novel.chapters.length > 0 ? (
            <ul className="space-y-3">
              {novel.chapters.map((ch) => (
                <li key={ch.id}>
                  <div className="bg-white rounded-lg shadow hover:bg-gray-50 text-gray-900">
                    <Link
                      to={`/novel/${novel.id}/chapter/${ch.id}`}
                      onClick={() => addView(ch.id)}
                      className="block p-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <span className="text-lg font-medium">{ch.title}</span>
                          {novel.isFromAPI && (
                            <div className="flex items-center mt-1 space-x-2">
                              {ch.url && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  📄 Text
                                </span>
                              )}
                              {ch.audioUrl && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  🔊 Audio
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            👁️ {chapterStats[ch.id]?.viewCount || 0} views
                          </span>
                          <span className="flex items-center">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addLike(ch.id);
                              }}
                              className="flex items-center space-x-1 hover:scale-110 transition-transform duration-200"
                            >
                              <span
                                className={`text-lg ${chapterStats[ch.id]?.isLikedByUser
                                  ? 'text-red-500'
                                  : 'text-gray-400'
                                  }`}
                              >
                                {chapterStats[ch.id]?.isLikedByUser ? '❤️' : '🤍'}
                              </span>
                              <span>{chapterStats[ch.id]?.likeCount || 0} likes</span>
                            </button>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <div className="text-6xl mb-4">📖</div>
              <p>ยังไม่มีตอนใดๆ</p>
              <p className="text-sm">
                {novel.isFromAPI ? 'ยังไม่มีตอนในฐานข้อมูล' : 'เร็วๆ นี้'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
