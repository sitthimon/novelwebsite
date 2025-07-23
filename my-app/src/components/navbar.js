import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // ตรวจสอบสถานะ login เมื่อ component โหลด
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  const handleHamburgerClick = () => {
    if (isLoggedIn) {
      navigate('/profile'); // ไปหน้าโปรไฟล์ ถ้าล็อกอินแล้ว
    } else {
      navigate('/login'); // ไปหน้า login ถ้ายังไม่ได้ล็อกอิน
    }
  };

  return (
    <nav className="bg-gray-900">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="hidden sm:flex sm:items-center sm:justify-center sm:w-full">
              <div className="flex space-x-4 justify-center w-full">
                <a href="/" className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                  หน้าแรก
                </a>
                <a href="/library" className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                  คลังของฉัน
                </a>
              </div>
            </div>
          </div>

          {/* ปุ่ม Hamburger */}
          <div className="flex items-center space-x-3">
            {/* แสดงชื่อผู้ใช้เมื่อ login แล้ว */}
            {isLoggedIn && user && (
              <span className="text-sm text-gray-300">
               {user.username}
              </span>
            )}
            
            <div className="relative">
              <button
                type="button"
                onClick={handleHamburgerClick}
                className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                <span className="sr-only">Open user menu</span>
                <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
