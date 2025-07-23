import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, Eye, Heart, Edit, Trash2, FileText, Volume2, Link, RefreshCw } from 'lucide-react';
import novels from "../novelsData"; 

export default function AdminChapter() {
    const navigate = useNavigate();
    const { novelId } = useParams();
    const [chapterTitle, setChapterTitle] = useState("");
    const [textFileUrl, setTextFileUrl] = useState("");
    const [audioFileUrl, setAudioFileUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [chapters, setChapters] = useState([]);
    const [novel, setNovel] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    
    // States สำหรับการแก้ไขตอน
    const [editingChapter, setEditingChapter] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editTextFileUrl, setEditTextFileUrl] = useState("");
    const [editAudioFileUrl, setEditAudioFileUrl] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    // ฟังก์ชันดึงข้อมูลสถิติจาก API
    const fetchChapterStats = async (chapterId) => {
        try {
            const response = await fetch(`http://localhost:4000/api/novels/${novelId}/chapters/${chapterId}/like`);
            
            if (response.ok) {
                const data = await response.json();
                return {
                    views: data.viewCount || 0,
                    likes: data.likeCount || 0
                };
            } else {
                console.warn(`Failed to fetch stats for chapter ${chapterId}:`, response.status);
                return { views: 0, likes: 0 };
            }
        } catch (error) {
            console.error(`Error fetching stats for chapter ${chapterId}:`, error);
            return { views: 0, likes: 0 };
        }
    };

    // ฟังก์ชันดึงข้อมูลนิยายจาก API
    const fetchNovelFromAPI = async () => {
        try {
            console.log(`🔄 Fetching novel ${novelId} from API...`);
            const response = await fetch(`http://localhost:4000/api/novels/${novelId}`);
            
            if (response.ok) {
                const novelData = await response.json();
                console.log(`✅ API returned novel:`, novelData.title, 'with', novelData.chapters?.length || 0, 'chapters');
                return novelData;
            } else if (response.status === 404) {
                console.warn(`⚠️ Novel ${novelId} not found in API`);
                return null;
            } else {
                console.warn(`⚠️ API request failed: ${response.status}`);
                return null;
            }
        } catch (error) {
            console.error('❌ Error fetching novel from API:', error);
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                setApiError('API Server ไม่ได้เปิดอยู่ - กรุณาเปิด Backend Server ที่ port 4000');
            } else {
                setApiError(`API Error: ${error.message}`);
            }
            
            return null;
        }
    };

    // โหลดข้อมูลนิยายและตอนต่างๆ
    const loadNovelAndChapters = async () => {
        if (!novelId) return;
        
        setStatsLoading(true);
        setApiError(null);
        
        // ลองดึงจาก API ก่อน
        const apiNovel = await fetchNovelFromAPI();
        
        if (apiNovel) {
            console.log('✅ Using API data for novel:', apiNovel.title);
            setNovel({
                ...apiNovel,
                isFromAPI: true
            });
            
            // ดึงสถิติของแต่ละตอน
            const chaptersWithStats = await Promise.all(
                apiNovel.chapters.map(async (chapter) => {
                    const stats = await fetchChapterStats(chapter.id);
                    return {
                        ...chapter,
                        views: stats.views,
                        likes: stats.likes,
                        hasText: !!chapter.url,
                        hasAudio: !!chapter.audioUrl,
                        isFromAPI: true
                    };
                })
            );
            
            setChapters(chaptersWithStats);
            
        } else {
            // Fallback ไปใช้ข้อมูล mock
            console.log('📋 Using fallback data for novel');
            const foundNovel = novels.find(n => n.id === novelId);
            
            if (foundNovel) {
                setNovel({
                    ...foundNovel,
                    isFromAPI: false
                });
                
                // แปลงข้อมูล chapters ให้มี properties เพิ่มเติม (ใช้ mock data)
                const chaptersWithStats = foundNovel.chapters ? foundNovel.chapters.map((chapter, index) => ({
                    ...chapter,
                    views: 500 + (index * 150), // Mock views
                    likes: 20 + (index * 8), // Mock likes
                    hasText: !!chapter.url,
                    hasAudio: !!chapter.audioUrl,
                    isFromAPI: false
                })) : [];
                
                setChapters(chaptersWithStats);
                setApiError('API ไม่พร้อมใช้งาน - ใช้ข้อมูล Mock');
            } else {
                console.warn(`Novel with ID ${novelId} not found`);
                setNovel(null);
                setChapters([]);
                setApiError('ไม่พบข้อมูลนิยาย');
            }
        }
        
        setStatsLoading(false);
    };

    useEffect(() => {
        loadNovelAndChapters();
    }, [novelId]);

    // ฟังก์ชันบันทึกตอนใหม่ผ่าน API
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!chapterTitle.trim()) {
            alert("กรุณากรอกชื่อตอน");
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                novel_id: parseInt(novelId),
                title: chapterTitle.trim(),
                txt_file_url: textFileUrl.trim() || null,
                audio_file_url: audioFileUrl.trim() || null
            };

            console.log('📤 Sending chapter data:', requestData);

            const response = await fetch('http://localhost:4000/api/admin/chapters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            console.log('📥 API Response:', result);

            if (response.ok) {
                alert(`✅ ${result.message}`);
                
                // ล้างฟอร์ม
                setChapterTitle("");
                setTextFileUrl("");
                setAudioFileUrl("");
                
                // รีโหลดรายการตอน
                await loadNovelAndChapters();
                
            } else {
                throw new Error(result.error || 'เกิดข้อผิดพลาด');
            }
            
        } catch (error) {
            console.error("❌ Error creating chapter:", error);
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                alert("❌ ไม่สามารถเชื่อมต่อ API Server ได้\nกรุณาตรวจสอบว่า Backend Server เปิดอยู่ที่ port 4000");
            } else {
                alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteChapter = async (chapterId) => {
        if (!window.confirm("คุณแน่ใจว่าต้องการลบตอนนี้?")) return;
        
        try {
            console.log('📤 Deleting chapter:', chapterId);
            
            const response = await fetch(`http://localhost:4000/api/admin/chapters/${chapterId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            console.log('📥 Delete API Response:', result);

            if (response.ok) {
                alert(`✅ ${result.message}`);
                
                // รีโหลดรายการตอนหลังจากลบสำเร็จ
                await loadNovelAndChapters();
                
            } else if (response.status === 404) {
                alert("❌ ไม่พบตอนที่ต้องการลบ");
            } else {
                throw new Error(result.error || 'เกิดข้อผิดพลาดในการลบตอน');
            }
            
        } catch (error) {
            console.error("❌ Error deleting chapter:", error);
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                alert("❌ ไม่สามารถเชื่อมต่อ API Server ได้\nกรุณาตรวจสอบว่า Backend Server เปิดอยู่ที่ port 4000");
            } else {
                alert(`❌ เกิดข้อผิดพลาดในการลบตอน: ${error.message}`);
            }
        }
    };

    // ฟังก์ชันทดสอบ URL
    const testUrl = async (url, type) => {
        if (!url.trim()) {
            alert('กรุณาใส่ URL ก่อน');
            return;
        }

        try {
            const response = await fetch(url.trim(), { method: 'HEAD', mode: 'no-cors' });
            alert(`✅ URL ${type} สามารถเข้าถึงได้`);
        } catch (error) {
            alert(`⚠️ ไม่สามารถทดสอบ URL ${type} ได้\nกรุณาตรวจสอบ URL อีกครั้ง`);
        }
    };

    // ฟังก์ชันเริ่มการแก้ไขตอน
    const handleEditChapter = (chapter) => {
        setEditingChapter(chapter);
        setEditTitle(chapter.title || "");
        setEditTextFileUrl(chapter.url || "");
        setEditAudioFileUrl(chapter.audioUrl || "");
    };

    // ฟังก์ชันยกเลิกการแก้ไข
    const handleCancelEdit = () => {
        setEditingChapter(null);
        setEditTitle("");
        setEditTextFileUrl("");
        setEditAudioFileUrl("");
    };

    // ฟังก์ชันบันทึกการแก้ไขตอน
    const handleUpdateChapter = async () => {
        if (!editTitle.trim()) {
            alert("กรุณากรอกชื่อตอน");
            return;
        }

        setEditLoading(true);
        
        try {
            const requestData = {
                title: editTitle.trim(),
                txt_file_url: editTextFileUrl.trim() || null,
                audio_file_url: editAudioFileUrl.trim() || null
            };

            console.log('📤 Updating chapter:', editingChapter.id, requestData);

            // ใช้ chapter_id จริงสำหรับ API หรือ id สำหรับ mock data
            const apiChapterId = editingChapter.chapterId || editingChapter.id;

            const response = await fetch(`http://localhost:4000/api/admin/chapters/${apiChapterId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            console.log('📥 Update API Response:', result);

            if (response.ok) {
                alert(`✅ ${result.message}`);
                
                // ปิด modal การแก้ไข
                handleCancelEdit();
                
                // รีโหลดรายการตอน
                await loadNovelAndChapters();
                
            } else if (response.status === 404) {
                alert(`❌ ไม่พบตอนที่ต้องการแก้ไข (ID: ${apiChapterId})`);
                await loadNovelAndChapters();
            } else {
                throw new Error(result.error || 'เกิดข้อผิดพลาดในการแก้ไขตอน');
            }
            
        } catch (error) {
            console.error("❌ Error updating chapter:", error);
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                alert("❌ ไม่สามารถเชื่อมต่อ API Server ได้\nกรุณาตรวจสอบว่า Backend Server เปิดอยู่ที่ port 4000");
            } else {
                alert(`❌ เกิดข้อผิดพลาดในการแก้ไขตอน: ${error.message}`);
            }
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header with Back Button */}
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        กลับหน้าแอดมิน
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">จัดการตอนนิยาย</h1>
                                {novel ? (
                                    <div>
                                        <p className="text-gray-600">นิยาย: {novel.title}</p>
                                        {/* แสดงสถานะข้อมูล */}
                                        <div className="flex items-center mt-1 space-x-2">
                                            {novel.isFromAPI ? (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                    ✅ ข้อมูลจาก Database
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                    ⚠️ ข้อมูล Mock
                                                </span>
                                            )}
                                            {statsLoading && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    🔄 กำลังโหลดสถิติ...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-red-600">ไม่พบข้อมูลนิยาย ID: {novelId}</p>
                                )}
                                
                                {/* แสดง Error หากมี */}
                                {apiError && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                        {apiError}
                                    </div>
                                )}
                            </div>
                            
                            <button
                                onClick={loadNovelAndChapters}
                                disabled={statsLoading}
                                className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 mr-1 ${statsLoading ? 'animate-spin' : ''}`} />
                                รีเฟรช
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add Chapter Form - แสดงเฉพาะเมื่อพบข้อมูลนิยาย */}
                {novel && (
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 className="text-lg font-semibold mb-4 flex items-center">
                            <Plus className="w-5 h-5 mr-2" />
                            เพิ่มตอนใหม่ให้ "{novel.title}"
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ชื่อตอน *
                                </label>
                                <input
                                    type="text"
                                    value={chapterTitle}
                                    onChange={(e) => setChapterTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="เช่น ตอนที่ 1: จุดเริ่มต้น"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="w-4 h-4 inline mr-1" />
                                    ลิงค์ไฟล์ข้อความ (.txt) - ไม่บังคับ
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="url"
                                        value={textFileUrl}
                                        onChange={(e) => setTextFileUrl(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://example.com/chapter1.txt"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => testUrl(textFileUrl, 'ข้อความ')}
                                        className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
                                    >
                                        <Link className="w-4 h-4" />
                                    </button>
                                </div>
                                {textFileUrl && (
                                    <p className="text-sm text-green-600 mt-1">
                                        ✓ URL: {textFileUrl.substring(0, 50)}{textFileUrl.length > 50 ? '...' : ''}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Volume2 className="w-4 h-4 inline mr-1" />
                                    ลิงค์ไฟล์เสียง (.mp3, .wav) - ไม่บังคับ
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="url"
                                        value={audioFileUrl}
                                        onChange={(e) => setAudioFileUrl(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://example.com/chapter1.mp3"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => testUrl(audioFileUrl, 'เสียง')}
                                        className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
                                    >
                                        <Link className="w-4 h-4" />
                                    </button>
                                </div>
                                {audioFileUrl && (
                                    <p className="text-sm text-green-600 mt-1">
                                        ✓ URL: {audioFileUrl.substring(0, 50)}{audioFileUrl.length > 50 ? '...' : ''}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setChapterTitle("");
                                        setTextFileUrl("");
                                        setAudioFileUrl("");
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    ล้างฟอร์ม
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !novel.isFromAPI}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            บันทึกตอน
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            {!novel.isFromAPI && (
                                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-yellow-800 text-sm">
                                        ⚠️ ไม่สามารถเพิ่มตอนได้เนื่องจากใช้ข้อมูล Mock - กรุณาเปิด API Server
                                    </p>
                                </div>
                            )}
                        </form>
                    </div>
                )}

                {/* รายการตอนทั้งหมด */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    รายการตอนทั้งหมด
                                    {novel && <span className="text-blue-600"> - {novel.title}</span>}
                                </h2>
                                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                    <span>มีทั้งหมด {chapters.length} ตอน</span>
                                    <span>รวม {chapters.reduce((sum, ch) => sum + ch.views, 0).toLocaleString()} ครั้งดู</span>
                                    <span>รวม {chapters.reduce((sum, ch) => sum + ch.likes, 0).toLocaleString()} ไลค์</span>
                                </div>
                            </div>
                            {statsLoading && (
                                <div className="flex items-center text-sm text-gray-500">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                                    กำลังโหลดสถิติ...
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                        {chapters.length > 0 ? (
                            chapters.map((chapter) => (
                                <div key={chapter.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-2">
                                                <h3 className="text-lg font-medium text-gray-900 mr-3">
                                                    {chapter.title}
                                                </h3>
                                                {chapter.isFromAPI && (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                        จาก DB
                                                    </span>
                                                )}
                                                {!chapter.isFromAPI && (
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                        Mock
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    {chapter.views.toLocaleString()} ดู
                                                    {chapter.isFromAPI && (
                                                        <span className="ml-1 text-green-600">✅</span>
                                                    )}
                                                </span>
                                                <span className="flex items-center">
                                                    <Heart className="w-4 h-4 mr-1" />
                                                    {chapter.likes.toLocaleString()} ไลค์
                                                    {chapter.isFromAPI && (
                                                        <span className="ml-1 text-green-600">✅</span>
                                                    )}
                                                </span>
                                                <span className="flex items-center">
                                                    <FileText className="w-4 h-4 mr-1 text-blue-500" />
                                                    {chapter.hasText ? "มีข้อความ" : "ไม่มีข้อความ"}
                                                </span>
                                                <span className="flex items-center">
                                                    <Volume2 className={`w-4 h-4 mr-1 ${chapter.hasAudio ? 'text-green-500' : 'text-gray-400'}`} />
                                                    {chapter.hasAudio ? "มีเสียง" : "ไม่มีเสียง"}
                                                </span>
                                                {chapter.url && (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                        มี URL
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <button 
                                                onClick={() => handleEditChapter(chapter)}
                                                disabled={!chapter.isFromAPI}
                                                className={`p-2 transition-colors ${chapter.isFromAPI 
                                                    ? 'text-gray-400 hover:text-blue-600' 
                                                    : 'text-gray-300 cursor-not-allowed'
                                                }`}
                                                title={chapter.isFromAPI ? "แก้ไขตอน" : "ไม่สามารถแก้ไข Mock Data ได้"}
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteChapter(chapter.chapterId || chapter.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                title="ลบตอน"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>
                                    {novel ? "ยังไม่มีตอนใดๆ" : "ไม่พบข้อมูลนิยาย"}
                                </p>
                                <p className="text-sm">
                                    {novel ? "เพิ่มตอนแรกของคุณได้เลย!" : "กรุณาตรวจสอบ ID ของนิยาย"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal แก้ไขตอน */}
            {editingChapter && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Edit className="w-5 h-5 mr-2" />
                            แก้ไขตอน: {editingChapter.title}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ชื่อตอน *
                                </label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="เช่น ตอนที่ 1: จุดเริ่มต้น"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="w-4 h-4 inline mr-1" />
                                    ลิงค์ไฟล์ข้อความ (.txt) - ไม่บังคับ
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="url"
                                        value={editTextFileUrl}
                                        onChange={(e) => setEditTextFileUrl(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://example.com/chapter1.txt"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => testUrl(editTextFileUrl, 'ข้อความ')}
                                        className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
                                    >
                                        <Link className="w-4 h-4" />
                                    </button>
                                </div>
                                {editTextFileUrl && (
                                    <p className="text-sm text-green-600 mt-1">
                                        ✓ URL: {editTextFileUrl.substring(0, 50)}{editTextFileUrl.length > 50 ? '...' : ''}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Volume2 className="w-4 h-4 inline mr-1" />
                                    ลิงค์ไฟล์เสียง (.mp3, .wav) - ไม่บังคับ
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="url"
                                        value={editAudioFileUrl}
                                        onChange={(e) => setEditAudioFileUrl(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://example.com/chapter1.mp3"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => testUrl(editAudioFileUrl, 'เสียง')}
                                        className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
                                    >
                                        <Link className="w-4 h-4" />
                                    </button>
                                </div>
                                {editAudioFileUrl && (
                                    <p className="text-sm text-green-600 mt-1">
                                        ✓ URL: {editAudioFileUrl.substring(0, 50)}{editAudioFileUrl.length > 50 ? '...' : ''}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                            <button
                                onClick={handleCancelEdit}
                                disabled={editLoading}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleUpdateChapter}
                                disabled={editLoading || !editTitle.trim()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                                {editLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        บันทึกการแก้ไข
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}