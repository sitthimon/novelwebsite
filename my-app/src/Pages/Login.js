import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:4000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Login สำเร็จ
                console.log('Login successful:', data);
                
                // เก็บข้อมูล user ใน localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('isLoggedIn', 'true');
                
                // Redirect ไปหน้าหลัก
                navigate('/');
            } else {
                // Login ไม่สำเร็จ
                setError(data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-gray-800 flex items-center justify-center">     
            <form onSubmit={handleSubmit} className="bg-gray-700 p-6 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl text-white text-center font-bold mb-4">เข้าสู่ระบบ</h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                <div className="mb-4">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-300">ชื่อผู้ใช้</label>
                    <input 
                        type="text" 
                        id="username" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                        required 
                        disabled={loading}
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">รหัสผ่าน</label>
                    <input 
                        type="password" 
                        id="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                        required 
                        disabled={loading}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
                
                <div className="mt-4 text-center">
                    <span className="text-gray-300 text-sm">ยังไม่มีบัญชี? </span>
                    <button 
                        type="button"
                        onClick={() => navigate('/register')}
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                    >
                        สมัครสมาชิก
                    </button>
                </div>
            </form>
        </div>
    );
}
