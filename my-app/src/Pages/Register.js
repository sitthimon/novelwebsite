import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // ตรวจสอบว่ารหัสผ่านตรงกัน
        if (password !== confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    confirmPassword: confirmPassword
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Register สำเร็จ
                console.log('Registration successful:', data);
                
                // แสดงข้อความสำเร็จและไปหน้า login
                alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
                navigate('/login');
            } else {
                // Register ไม่สำเร็จ
                setError(data.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-800 flex items-center justify-center">     
            <form onSubmit={handleSubmit} className="bg-gray-700 p-6 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl text-white text-center font-bold mb-4">สมัครสมาชิก</h2>
                
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
                        minLength={3}
                    />
                    <p className="text-xs text-gray-400 mt-1">ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร</p>
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
                        minLength={6}
                    />
                    <p className="text-xs text-gray-400 mt-1">รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
                </div>
                
                <div className="mb-4">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">ยืนยันรหัสผ่าน</label>
                    <input 
                        type="password" 
                        id="confirmPassword" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                        required 
                        disabled={loading}
                        minLength={6}
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                </button>
                
                <div className="mt-4 text-center">
                    <span className="text-gray-300 text-sm">มีบัญชีแล้ว? </span>
                    <button 
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                    >
                        เข้าสู่ระบบ
                    </button>
                </div>
            </form>
        </div>
    );
}