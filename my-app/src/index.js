import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/navbar.js';
import Home from './Pages/Home.js';
import NovelPage from './Pages/Novel.js';
import ChapterPage from './Pages/Chapter.js';
import Footer from './components/Footer.js';
import { NovelContext } from "./NovelContext";
import novels from './novelsData.js'; 
import Login from './Pages/Login.js'; 
import Register from './Pages/Register.js'; 
import Library from './Pages/library.js';
import Profile from './Pages/Profile.js'; 
import NovelAdminDashboard from './Pages/novelAdmin.js'; 
import AdminChapter from './Pages/admin-chapter.js';
import AdminUsers from './Pages/admin-users.js'; 

const user = JSON.parse(localStorage.getItem("user")); // ดึง user จาก localStorage

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <NovelContext.Provider value={novels}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/novel/:novelId" element={<NovelPage />} />
          <Route path="/novel/:novelId/chapter/:chapterId" element={<><ChapterPage /><Footer /></>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />

          {/* ป้องกันเฉพาะ admin เท่านั้นเข้า /admin */}
          <Route
            path="/admin"
            element={
              user?.role === "admin" ? (
                <NovelAdminDashboard />
              ) : (
                <Navigate to="/login" replace /> // หรือเปลี่ยนเป็นหน้าอื่นก็ได้ เช่น หน้า home "/"
              )
            }
          />

          <Route
            path="/admin/novels/:novelId"
            element={
              user?.role === "admin" ? <AdminChapter /> : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin-users"
            element={
              user?.role === "admin" ? <AdminUsers /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </BrowserRouter>
    </NovelContext.Provider>
  </React.StrictMode>
);
