import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // ตรวจสอบว่าล็อกอินหรือไม่
        const loggedIn = localStorage.getItem('isLoggedIn');
        const userData = localStorage.getItem('user');

        if (loggedIn !== 'true' || !userData) {
            // ถ้ายังไม่ล็อกอินให้ไปหน้า login
            navigate('/login');
            return;
        }

        setUser(JSON.parse(userData));
    }, [navigate]);

    const handleLogout = () => {
        // ลบข้อมูล login จาก localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');

        // Redirect ไปหน้าหลัก
        navigate('/');

        // Refresh หน้าเว็บเพื่อ update navbar
        window.location.reload();
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-800 flex items-center justify-center">
                <div className="text-white">กำลังโหลด...</div>
            </div>
        );
    }
    {
        user.role === 'admin' && (
            <button
                onClick={() => navigate('/admin')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
            >
                ไปหน้าแอดมิน
            </button>
        )
    }

    return (
        <div className="min-h-screen bg-gray-800 text-white">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gray-600 rounded-full p-4">
                            <svg
                                className="h-16 w-16 text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{user.username}</h1>
                            <p className="text-gray-300">สมาชิกตั้งแต่: {new Date(user.created_at || Date.now()).toLocaleDateString('th-TH')}</p>
                        </div>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">ข้อมูลส่วนตัว</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                            <span className="text-gray-300">ชื่อผู้ใช้:</span>
                            <span>{user.username}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                            <span className="text-gray-300">ID ผู้ใช้:</span>
                            <span>{user.id || user.user_id}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                            <span className="text-gray-300">สถานะ:</span>
                            <span className="text-green-400">ออนไลน์</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">การกระทำ</h2>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
                        >
                            กลับไปหน้าหลัก
                        </button>
                        {/* Actions Admin*/}
                 
                                {user.role === 'admin' && (
                                    <button
                                        onClick={() => navigate('/admin')}
                                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
                                    >
                                        ไปหน้าแอดมิน
                                    </button>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
                                >
                                    ออกจากระบบ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
           
    );
}
