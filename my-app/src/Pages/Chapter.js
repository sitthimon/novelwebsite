import React, { useContext, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { NovelContext } from "../NovelContext";
import novelsData from '../novelsData';

// Base path for Azure blob storage text files
const AZURE_TEXT_BASE_URL = 'https://blueservice2004.blob.core.windows.net/longphrai/text/';

export default function Chapter() {
    const { novelId, chapterId } = useParams();
    const novels = useContext(NovelContext);
    const [novel, setNovel] = useState(null);
    const [chapter, setChapter] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [novelLoading, setNovelLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fallback data
    const fallbackNovel = novels.find(n => n.id.toString() === novelId.toString());

    // ฟังก์ชันดึงข้อมูลนิยายจาก API
    const fetchNovelFromAPI = async () => {
        try {
            console.log(`🔄 Fetching novel ${novelId} from API...`);
            const response = await fetch(`http://localhost:4000/api/novels/${novelId}`);
            
            if (response.ok) {
                const novelData = await response.json();
                console.log(`✅ API returned novel:`, novelData.title, 'with', novelData.chapters?.length || 0, 'chapters');
                
                // ใช้ข้อมูลจาก API เป็นหลัก
                const novelWithFallbackCover = {
                    ...novelData,
                    coverUrl: novelData.coverUrl || fallbackNovel?.coverUrl || fallbackNovel?.img,
                    isFromAPI: true
                };
                
                setNovel(novelWithFallbackCover);
                
                // หาตอนที่ต้องการ
                const foundChapter = novelData.chapters.find(ch => ch.id.toString() === chapterId.toString());
                if (foundChapter) {
                    setChapter(foundChapter);
                    console.log(`✅ Found chapter from API:`, foundChapter.title);
                } else {
                    console.warn(`⚠️ Chapter ${chapterId} not found in API data`);
                }
                
                return novelWithFallbackCover;
            } else if (response.status === 404) {
                console.warn(`⚠️ Novel ${novelId} not found in API, using fallback`);
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
            
            const fallbackChapter = fallbackNovel.chapters.find(ch => ch.id.toString() === chapterId.toString());
            if (fallbackChapter) {
                setChapter(fallbackChapter);
                console.log(`📋 Using fallback chapter:`, fallbackChapter.title);
            }
            
            return fallbackNovel;
        }
        
        return null;
    };

    // โหลดข้อมูลนิยายเมื่อ component mount
    useEffect(() => {
        const loadNovel = async () => {
            setNovelLoading(true);
            const novelData = await fetchNovelFromAPI();
            
            if (!novelData) {
                console.error('❌ No novel data available');
            }
            
            setNovelLoading(false);
        };
        
        loadNovel();
    }, [novelId, chapterId]);

    useEffect(() => {
        const loadChapterContent = async () => {
            if (!chapter) return;
            
            setLoading(true);
            setError(null);

            // Move textUrl declaration to function scope
            let textUrl = '';

            try {
                // สร้าง URL สำหรับไฟล์ text
                // ใช้ URL จาก database ก่อน หากไม่มีใช้ default pattern
                textUrl = chapter.url || `${AZURE_TEXT_BASE_URL}chapter${chapterId}.txt`;

                console.log('Loading chapter content from URL:', textUrl);
                console.log('Chapter data:', chapter);

                // ลองใช้ fetch ธรรมดาก่อน
                const response = await fetch(textUrl, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'text/plain, text/html, */*',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Accept-Language': 'th,en-US;q=0.9,en;q=0.8',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);

                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
                }

                // อ่านข้อมูลเป็น ArrayBuffer แล้วแปลงเป็น text
                const arrayBuffer = await response.arrayBuffer();
                const decoder = new TextDecoder('utf-8');
                const text = decoder.decode(arrayBuffer);

                console.log('Raw text response:', text.substring(0, 100) + '...');
                console.log('Text length:', text.length);

                if (!text || text.trim().length === 0) {
                    throw new Error('ไฟล์ว่างเปล่าหรือไม่มีเนื้อหา');
                }

                console.log('Text loaded successfully, length:', text.length);
                setFileContent(text);
                setLoading(false);

            } catch (err) {
                console.error('Error loading chapter:', err);

                // ลองใช้ no-cors mode
                try {
                    console.log('Trying no-cors mode...');
                    const noCorsResponse = await fetch(textUrl, {
                        method: 'GET',
                        mode: 'no-cors',
                        cache: 'no-cache'
                    });

                    if (noCorsResponse.type === 'opaque') {
                        console.log('No-cors response received but opaque');
                    }
                } catch (noCorsErr) {
                    console.error('No-cors also failed:', noCorsErr);
                }

                // ลองใช้ XMLHttpRequest
                try {
                    console.log('Trying XMLHttpRequest...');
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', textUrl, true);
                    xhr.responseType = 'text';
                    xhr.setRequestHeader('Accept', 'text/plain, */*');

                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                console.log('XMLHttpRequest successful');
                                setFileContent(xhr.responseText);
                                setLoading(false);
                                return;
                            } else {
                                console.error('XMLHttpRequest failed:', xhr.status);
                            }
                        }
                    };

                    xhr.onerror = function () {
                        console.error('XMLHttpRequest error');
                    };

                    xhr.send();

                    // รอ 3 วินาที ถ้าไม่ได้ผลก็ให้ error
                    setTimeout(() => {
                        if (loading) {
                            setError(`ไม่สามารถโหลดไฟล์ได้: ${err.message}`);
                            setFileContent(`⚠️ ไม่สามารถโหลดเนื้อหาได้: ${err.message}\n\nURL: ${textUrl}`);
                            setLoading(false);
                        }
                    }, 3000);

                    return; // ออกจากฟังก์ชัน เพื่อรอ XMLHttpRequest

                } catch (xhrErr) {
                    console.error('XMLHttpRequest failed:', xhrErr);
                }

                setError(err.message);
                setFileContent(`⚠️ ไม่สามารถโหลดเนื้อหาได้: ${err.message}\n\nURL: ${textUrl}`);
                setLoading(false);
            }
        };

        if (chapter) {
            loadChapterContent();
        }
    }, [chapter, chapterId]);

    // Loading state สำหรับโหลดข้อมูลนิยาย
    if (novelLoading) {
        return (
            <div className="text-white min-h-screen bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-lg">กำลังโหลดข้อมูลนิยาย...</p>
                    <p className="text-sm text-gray-400 mt-2">รอสักครู่...</p>
                </div>
            </div>
        );
    }

    if (!novel || !chapter) {
        return (
            <div className="text-white min-h-screen bg-gray-800 p-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="text-red-500 text-xl mb-4">⚠️ ไม่พบข้อมูลตอนนิยาย</div>
                    <p className="text-gray-400 mb-4">
                        {!novel && `ไม่พบนิยาย ID: ${novelId}`}
                        {novel && !chapter && `ไม่พบตอน ID: ${chapterId}`}
                    </p>
                    <Link to="/" className="text-indigo-400 hover:text-indigo-300">
                        กลับไปหน้าหลัก
                    </Link>
                </div>
            </div>
        );
    }

    const currentIndex = novel.chapters.findIndex(ch => ch.id.toString() === chapterId.toString());
    const prevChapter = currentIndex > 0 ? novel.chapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < novel.chapters.length - 1 ? novel.chapters[currentIndex + 1] : null;

    return (
        <div className="text-white min-h-screen bg-gray-800 p-6 shadow-md">
            <div className="max-w-3xl mx-auto">
                {/* Back Navigation */}
                <div className="mb-6">
                    <Link
                        to={`/novel/${novel.id}`}
                        className="text-indigo-400 hover:text-indigo-300 mb-4 inline-block"
                    >
                        &lt; กลับไปที่ {novel.title}
                    </Link>
                </div>

                {/* Top Navigation */}
                <div className="flex flex-wrap gap-2 mt-6 items-center justify-between w-full">
                    <div className="flex gap-2 items-center">
                        {prevChapter && (
                            <Link
                                to={`/novel/${novel.id}/chapter/${prevChapter.id}`}
                                className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700 whitespace-nowrap"
                            >
                                &lt; ตอนก่อนหน้า
                            </Link>
                        )}
                        {nextChapter && (
                            <Link
                                to={`/novel/${novel.id}/chapter/${nextChapter.id}`}
                                className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700 whitespace-nowrap"
                            >
                                ตอนถัดไป &gt;
                            </Link>
                        )}
                    </div>
                    <div className="flex items-center justify-end">
                        <select
                            className="px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={chapterId}
                            onChange={e => {
                                const selectedId = e.target.value;
                                window.location.href = `/novel/${novel.id}/chapter/${selectedId}`;
                            }}
                        >
                            {novel.chapters.map(ch => (
                                <option key={ch.id} value={ch.id}>
                                    {ch.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-gray-900 text-gray-100 p-6 rounded mb-4 min-h-[400px] mt-6">
                    {/* Audio Player */}
                    {chapter.audioUrl && (
                        <div className="p-4 mb-4 flex justify-center">
                            <div className="w-full max-w-md">
                                <div className="text-center mb-2 text-sm text-gray-400">
                                    🔊 เสียงประกอบ{novel.isFromAPI}
                                </div>
                                <audio
                                    controls
                                    loop
                                    autoPlay
                                    className="w-full"
                                    src={chapter.audioUrl}
                                    ref={el => {
                                        if (el) el.volume = 0.4;
                                    }}
                                >
                                    เบราว์เซอร์ของคุณไม่รองรับการเล่นเสียง
                                </audio>
                            </div>
                        </div>
                    )}

                    {/* Text Content */}
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                                <p className="text-gray-400">กำลังโหลดเนื้อหา...</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    จาก: {chapter.url || `${AZURE_TEXT_BASE_URL}chapter${chapterId}.txt`}
                                </p>
                                {novel.isFromAPI && (
                                    <p className="text-green-400 text-xs mt-1">✅ ใช้ URL จาก Database</p>
                                )}
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-400 p-8">
                            <div className="text-4xl mb-4">⚠️</div>
                            <p className="text-lg mb-4">เกิดข้อผิดพลาดในการโหลดเนื้อหา</p>
                            <p className="text-sm text-gray-400 mb-4">{error}</p>
                            <p className="text-xs text-gray-500 mb-4">
                                URL: {chapter.url || `${AZURE_TEXT_BASE_URL}chapter${chapterId}.txt`}
                            </p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700 mr-2"
                                >
                                    ลองใหม่อีกครั้ง
                                </button>
                                <button
                                    onClick={() => window.open(chapter.url || `${AZURE_TEXT_BASE_URL}chapter${chapterId}.txt`, '_blank')}
                                    className="px-4 py-2 bg-gray-600 rounded text-white hover:bg-gray-700"
                                >
                                    เปิดไฟล์ใน Tab ใหม่
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="whitespace-pre-line text-base leading-relaxed">
                            {fileContent}
                        </div>
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className="grid grid-cols-3 gap-4 mt-6 items-center">
                    <div className="justify-start flex">
                        {prevChapter && (
                            <Link
                                to={`/novel/${novel.id}/chapter/${prevChapter.id}`}
                                className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700"
                            >
                                &lt; ตอนก่อนหน้า
                            </Link>
                        )}
                    </div>
                    <div className="justify-center flex">
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="px-4 py-2 bg-gray-700 rounded text-white hover:bg-gray-800"
                        >
                            กลับไปบนสุด
                        </button>
                    </div>
                    <div className="justify-end flex">
                        {nextChapter && (
                            <Link
                                to={`/novel/${novel.id}/chapter/${nextChapter.id}`}
                                className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700"
                            >
                                ตอนถัดไป &gt;
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
