import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import novelsData from '../novelsData';
import {
  BarChart3,
  Book,
  BookOpen,
  Users,
  Plus,
  Edit,
  Trash2,
  Upload,
  Eye,
  Heart,
  Bookmark,
  Volume2,
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Settings,
  Download,
  PlayCircle,
  PauseCircle
} from 'lucide-react';

// Mock users data (will still be used as fallback)
const mockUsers = [
  {
    id: 1,
    name: "สมชาย ใจดี",
    email: "somchai@example.com",
    booksRead: 3,
    totalLikes: 15,
    totalBookmarks: 8,
    joinDate: "2024-01-15"
  },
  {
    id: 2,
    name: "สุดา รักการอ่าน",
    email: "suda@example.com",
    booksRead: 5,
    totalLikes: 25,
    totalBookmarks: 12,
    joinDate: "2024-02-20"
  },
  {
    id: 3,
    name: "กิตติ์ นักอ่าน",
    email: "kit@example.com",
    booksRead: 2,
    totalLikes: 8,
    totalBookmarks: 5,
    joinDate: "2024-03-10"
  }
];

const NovelAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // หรือ 'manageUsers' ถ้าต้องการเปิดหน้านั้นเป็นค่าเริ่มต้น
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNovel, setSelectedNovel] = useState(null);
  const [showAddNovelModal, setShowAddNovelModal] = useState(false);
  const [searchUser, setSearchUser] = React.useState('');

  // เพิ่ม state สำหรับ edit novel modal
  const [showEditNovelModal, setShowEditNovelModal] = useState(false);
  const [editingNovel, setEditingNovel] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // เพิ่ม state สำหรับ edit user modal
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserLoading, setEditUserLoading] = useState(false);

  // Form states for adding novel
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [authorName, setAuthorName] = useState("");

  // Form states สำหรับ editing novel
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCoverImageUrl, setEditCoverImageUrl] = useState("");
  const [editAuthorName, setEditAuthorName] = useState("");

  // Form states สำหรับ editing user
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('');

  const [stats, setStats] = useState({
    totalNovels: 0,
    totalViews: 0,
    totalLikes: 0,
    totalUsers: 0,
  });
  const [users, setUsers] = useState([]);
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filteredUsers = users.filter(user => {
  const username = (user.username || user.name || '').toLowerCase();
  return username.includes(searchUser.toLowerCase());
});


  // ฟังก์ชันดึงข้อมูลนิยายพร้อมตอนจาก API
  const fetchNovelsWithChapters = async () => {
    try {
      console.log('🔄 Fetching novels with chapters from API...');
      const response = await fetch('http://localhost:4000/api/novels-with-chapters');

      if (response.ok) {
        const novelsData = await response.json();
        console.log(`✅ API returned ${novelsData.length} novels with chapters:`, novelsData);

        return novelsData;
      } else {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error fetching novels from API:', error);
      throw error;
    }
  };

  // ฟังก์ชันดึงข้อมูลสถิติจาก API
  const fetchStats = async () => {
    try {
      console.log('🔄 Fetching stats from API...');
      const response = await fetch('http://localhost:4000/api/novels/stat', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const statsData = await response.json();
        console.log('✅ Stats data received:', statsData);
        return statsData;
      } else {
        throw new Error(`Stats API Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      throw error;
    }
  };

  // ฟังก์ชันดึงข้อมูล like-view summary
  const fetchLikeViewSummary = async () => {
    try {
      console.log('🔄 Fetching like-view summary...');
      const response = await fetch('http://localhost:4000/api/novels/like-view-summary', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const summaryData = await response.json();
        console.log('✅ Like-view summary data received:', summaryData);
        return summaryData;
      } else {
        console.warn(`Like-view summary API returned ${response.status}`);
        return [];
      }
    } catch (error) {
      console.warn('Failed to fetch like-view summary:', error.message);
      return [];
    }
  };

  // ฟังก์ชันดึงข้อมูลผู้ใช้
  const fetchUsers = async () => {
    try {
      console.log('🔄 Fetching users from API...');
      const response = await fetch('http://localhost:4000/api/getusers', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const usersData = await response.json();
        console.log('✅ Users data received:', usersData);
        return usersData || [];
      } else {
        console.warn(`Users API returned ${response.status}, using fallback data`);
        return mockUsers;
      }
    } catch (error) {
      console.warn('Failed to fetch users, using mock data:', error.message);
      return mockUsers;
    }
  };

  // ฟังก์ชันเพิ่มนิยายใหม่
  const handleAddNovel = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/admin/novels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description,
          cover_image_url: coverImageUrl,
          author_name: authorName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error:", data);
        alert(`ไม่สามารถเพิ่มนิยายได้: ${data.error || 'Unknown error'}`);
      } else {
        alert("เพิ่มนิยายสำเร็จ!");

        // รีเซ็ตฟอร์ม
        setTitle("");
        setDescription("");
        setCoverImageUrl("");
        setAuthorName("");
        setShowAddNovelModal(false);

        // รีเฟรชข้อมูล
        await loadAllData();
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("เกิดข้อผิดพลาดขณะเชื่อมต่อเซิร์ฟเวอร์");
    }
  };
  const handleDeleteUser = async (userId, username) => {
    // ยืนยันการลบ
    const isConfirmed = window.confirm(
      `คุณต้องการลบผู้ใช้ "${username}" หรือไม่?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้`
    );

    if (!isConfirmed) return;

    try {
      console.log(`🗑️ Deleting user ID: ${userId}`);

      const response = await fetch(`http://localhost:4000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ User deleted successfully:', result);

        // อัปเดต state โดยลบผู้ใช้ออกจาก list
        setUsers(prevUsers => prevUsers.filter(user =>
          (user.user_id || user.id) !== parseInt(userId)
        ));

        alert(`ลบผู้ใช้ "${username}" เรียบร้อยแล้ว`);

        // อัปเดตสถิติ
        setStats(prevStats => ({
          ...prevStats,
          totalUsers: prevStats.totalUsers - 1
        }));

      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };
  // ฟังก์ชันลบนิยาย
  const handleDeleteNovel = async (novelId, novelTitle) => {
    if (!window.confirm(`คุณแน่ใจว่าต้องการลบนิยาย "${novelTitle}"?\n\n⚠️ การลบจะไม่สามารถย้อนกลับได้ และจะลบตอนทั้งหมดของนิยายนี้ด้วย`)) {
      return;
    }

    try {
      console.log('📤 Deleting novel:', { id: novelId, title: novelTitle });

      const response = await fetch(`http://localhost:4000/api/admin/novels/${novelId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('📥 Delete Novel API Response:', result);

      if (response.ok) {
        alert(`✅ ${result.message}`);

        // รีโหลดข้อมูลหลังจากลบสำเร็จ
        await loadAllData();

      } else if (response.status === 404) {
        alert("❌ ไม่พบนิยายที่ต้องการลบ");
        // รีโหลดข้อมูลเพื่อให้แสดงสถานะล่าสุด
        await loadAllData();
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการลบนิยาย');
      }

    } catch (error) {
      console.error("❌ Error deleting novel:", error);

      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert("❌ ไม่สามารถเชื่อมต่อ API Server ได้\nกรุณาตรวจสอบว่า Backend Server เปิดอยู่ที่ port 4000");
      } else {
        alert(`❌ เกิดข้อผิดพลาดในการลบนิยาย: ${error.message}`);
      }
    }
  };

  // ฟังก์ชันเริ่มแก้ไขนิยาย
  const handleEditNovel = (novel) => {
    setEditingNovel(novel);
    setEditTitle(novel.title || "");
    setEditDescription(novel.description || "");
    setEditCoverImageUrl(novel.coverUrl || "");
    setEditAuthorName(novel.author || "");
    setShowEditNovelModal(true);
  };

  // ฟังก์ชันยกเลิกการแก้ไข
  const handleCancelEditNovel = () => {
    setShowEditNovelModal(false);
    setEditingNovel(null);
    setEditTitle("");
    setEditDescription("");
    setEditCoverImageUrl("");
    setEditAuthorName("");
  };

  // ฟังก์ชันบันทึกการแก้ไขนิยาย
  const handleUpdateNovel = async () => {
    if (!editTitle.trim() || !editAuthorName.trim()) {
      alert("กรุณากรอกชื่อนิยายและชื่อผู้เขียน");
      return;
    }

    setEditLoading(true);

    try {
      const requestData = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        cover_image_url: editCoverImageUrl.trim() || null,
        author_name: editAuthorName.trim()
      };

      console.log('📤 Updating novel:', editingNovel.id, requestData);

      const response = await fetch(`http://localhost:4000/api/admin/novels/${editingNovel.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      console.log('📥 Update Novel API Response:', result);

      if (response.ok) {
        alert(`✅ ${result.message}`);

        // ปิด modal และรีเซ็ตฟอร์ม
        handleCancelEditNovel();

        // รีโหลดข้อมูล
        await loadAllData();

      } else if (response.status === 404) {
        alert("❌ ไม่พบนิยายที่ต้องการแก้ไข");
        await loadAllData();
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการแก้ไขนิยาย');
      }

    } catch (error) {
      console.error("❌ Error updating novel:", error);

      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert("❌ ไม่สามารถเชื่อมต่อ API Server ได้\nกรุณาตรวจสอบว่า Backend Server เปิดอยู่ที่ port 4000");
      } else {
        alert(`❌ เกิดข้อผิดพลาดในการแก้ไขนิยาย: ${error.message}`);
      }
    } finally {
      setEditLoading(false);
    }
  };

  // ฟังก์ชันเริ่มแก้ไขผู้ใช้
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditUsername(user.username || user.name || '');
    setEditPassword(''); // เว้นว่างเพื่อความปลอดภัย
    setEditRole(user.role || 'user');
    setShowEditUserModal(true);
  };

  // ฟังก์ชันยกเลิกการแก้ไขผู้ใช้
  const handleCancelEditUser = () => {
    setShowEditUserModal(false);
    setEditingUser(null);
    setEditUsername('');
    setEditPassword('');
    setEditRole('');
  };

  // ฟังก์ชันบันทึกการแก้ไขผู้ใช้
  const handleUpdateUser = async () => {
    if (!editUsername.trim() || !editPassword.trim() || !editRole.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setEditUserLoading(true);

    try {
      const requestData = {
        username: editUsername.trim(),
        password: editPassword.trim(),
        role: editRole
      };

      console.log('📤 Updating user:', editingUser.user_id || editingUser.id, requestData);

      const response = await fetch(`http://localhost:4000/api/admin/users/${editingUser.user_id || editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      console.log('📥 Update User API Response:', result);

      if (response.ok) {
        alert(`✅ ${result.message}`);

        // ปิด modal และรีเซ็ตฟอร์ม
        handleCancelEditUser();

        // รีโหลดข้อมูล
        await loadAllData();

      } else if (response.status === 404) {
        alert("❌ ไม่พบผู้ใช้ที่ต้องการแก้ไข");
        await loadAllData();
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้');
      }

    } catch (error) {
      console.error("❌ Error updating user:", error);

      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert("❌ ไม่สามารถเชื่อมต่อ API Server ได้\nกรุณาตรวจสอบว่า Backend Server เปิดอยู่ที่ port 4000");
      } else {
        alert(`❌ เกิดข้อผิดพลาดในการแก้ไขผู้ใช้: ${error.message}`);
      }
    } finally {
      setEditUserLoading(false);
    }
  };

  // ฟังก์ชันโหลดข้อมูลทั้งหมด
  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading all data from APIs...');

      // ดึงข้อมูลแบบ parallel
      const [
        novelsData,
        statsData,
        likeViewSummaryData,
        usersData
      ] = await Promise.all([
        fetchNovelsWithChapters(),
        fetchStats(),
        fetchLikeViewSummary(),
        fetchUsers()
      ]);

      // ประมวลผลข้อมูล like-view summary
      let novelViewLikeData = {};
      if (Array.isArray(likeViewSummaryData) && likeViewSummaryData.length > 0) {
        novelViewLikeData = likeViewSummaryData.reduce((acc, novel) => {
          const novelIdString = String(novel.novel_id);
          acc[novelIdString] = {
            views: novel.total_views || 0,
            likes: novel.total_likes || 0
          };
          return acc;
        }, {});
        console.log('📊 Novel view/like data mapped:', novelViewLikeData);
      }

      // รวมข้อมูลนิยายกับสถิติ view/like
      const novelsWithStats = novelsData.map(novel => {
        const novelIdString = String(novel.id);
        const apiStats = novelViewLikeData[novelIdString] || {};

        return {
          ...novel,
          views: apiStats.views || 0,
          likes: apiStats.likes || 0,
          chaptersCount: novel.chapters ? novel.chapters.length : 0,
          hasApiData: true,
          status: (novel.chapters && novel.chapters.length >= 5) ? 'กำลังเขียน' : 'จบแล้ว'
        };
      });

      // อัปเดต state
      setNovels(novelsWithStats);
      setUsers(usersData);

      // คำนวณสถิติรวม
      const totalViews = likeViewSummaryData.reduce((sum, novel) => sum + (novel.total_views || 0), 0);
      const totalLikes = likeViewSummaryData.reduce((sum, novel) => sum + (novel.total_likes || 0), 0);

      setStats({
        totalNovels: statsData.totalNovels || novelsWithStats.length,
        totalViews: totalViews || statsData.totalViews || 0,
        totalLikes: totalLikes || statsData.totalLikes || 0,
        totalUsers: statsData.totalUsers || usersData.length || 0,
      });

      console.log('✅ All data loaded successfully');

    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError(err.message);

      // ใช้ fallback data
      setNovels([]);
      setUsers(mockUsers);
      setStats({
        totalNovels: 0,
        totalViews: 0,
        totalLikes: 0,
        totalUsers: mockUsers.length,
      });
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <div className="flex space-x-2">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลจาก Database...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="text-yellow-400 mr-3">⚠️</div>
            <div>
              <p className="text-yellow-700 font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
              <p className="text-yellow-600 text-sm">{error}</p>
              <p className="text-blue-600 text-sm">💡 ตรวจสอบว่า Backend Server เปิดอยู่ที่ port 4000</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">นิยายทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalNovels} เรื่อง</p>
              <p className="text-xs text-green-600">จาก Database API</p>
            </div>
            <Book className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ยอดวิวรวม</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.totalViews.toLocaleString()}
              </p>
              <p className="text-xs text-green-600">จาก Database API</p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ไลค์รวม</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.totalLikes.toLocaleString()}
              </p>
              <p className="text-xs text-green-600">จาก Database API</p>
            </div>
            <Heart className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">นิยายล่าสุด</h2>
            <div className="text-sm text-gray-500">
              <span className="text-green-600">✅ ข้อมูลจาก Database API</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {novels
              .sort((a, b) => (b.chaptersCount || 0) - (a.chaptersCount || 0))
              .map(novel => (
                <div key={novel.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img
                      src={novel.coverUrl || '/placeholder-cover.jpg'}
                      alt={novel.title}
                      className="w-12 h-16 object-cover rounded"
                      onError={(e) => {
                        e.target.src = '/placeholder-cover.jpg';
                      }}
                    />
                    <div>
                      <h3 className="font-medium">{novel.title}</h3>
                      <p className="text-sm text-gray-600">
                        {novel.chaptersCount || 0} ตอน • <span className="text-green-600">จาก Database</span>
                      </p>
                      <p className="text-xs text-gray-500">โดย {novel.author || 'ไม่ระบุผู้เขียน'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span>{(novel.views || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>{(novel.likes || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}

            {novels.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <Book className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>ยังไม่มีนิยายในระบบ</p>
                <p className="text-sm">เพิ่มนิยายใหม่เพื่อเริ่มต้น</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderManageNovels = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">จัดการนิยาย</h1>
        <button
          onClick={() => setShowAddNovelModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          เพิ่มนิยายใหม่
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหานิยาย..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading State for Novels Grid */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดรายการนิยาย...</p>
        </div>
      )}

      {/* Novels Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {novels
            .filter(novel =>
              novel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (novel.author && novel.author.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .map((novel) => (
              <div
                key={`manage-novel-${novel.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden relative group flex flex-col h-full border border-gray-100"
              >
                {/* Action Buttons - ปรับตำแหน่งและขนาด */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditNovel(novel);
                    }}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg hover:scale-110"
                    title={`แก้ไขนิยาย "${novel.title}"`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteNovel(novel.id, novel.title);
                    }}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg hover:scale-110"
                    title={`ลบนิยาย "${novel.title}"`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Link to={`/admin/novels/${novel.id}`} className="flex flex-col h-full">
                  {/* รูปปก - ปรับให้มี aspect ratio ที่ดี */}
                  <div className="relative overflow-hidden">
                    <img
                      src={novel.coverUrl || '/placeholder-cover.jpg'}
                      alt={novel.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = '/placeholder-cover.jpg';
                      }}
                    />
                    {/* Gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* API Badge */}
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-sm">
                      DB
                    </div>
                  </div>

                  {/* Content Area - ปรับ spacing และ typography */}
                  <div className="p-4 flex flex-col flex-1 space-y-3">
                    {/* Header Section */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                        {novel.title}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        โดย {novel.author || 'ไม่ระบุผู้เขียน'}
                      </p>
                    </div>

                    {/* Stats Section */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {novel.chaptersCount || 0} ตอน
                      </span>
                      <div className="flex space-x-3">
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Eye className="w-4 h-4" />
                          <span className="font-medium">{(novel.views || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-red-600">
                          <Heart className="w-4 h-4" />
                          <span className="font-medium">{(novel.likes || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded text-center">
                      ✓ ข้อมูลจาก Database API
                    </div>

                    {/* Spacer for flex */}
                    <div className="flex-1"></div>

                    {/* Bottom Action Bar - ปรับให้สวยงามขึ้น */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 pt-3 mt-auto border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 flex items-center">
                          <BookOpen className="w-3 h-3 mr-1" />
                          จัดการตอน
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditNovel(novel);
                            }}
                            className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full hover:bg-blue-200 cursor-pointer transition-colors font-medium flex items-center space-x-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteNovel(novel.id, novel.title);
                            }}
                            className="text-xs bg-red-100 text-red-800 px-3 py-1.5 rounded-full hover:bg-red-200 cursor-pointer transition-colors font-medium flex items-center space-x-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && novels.length === 0 && (
        <div className="text-center py-12">
          <Book className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีนิยายในระบบ</h3>
          <p className="text-gray-500 mb-6">เริ่มต้นสร้างนิยายเรื่องแรกของคุณ</p>
          <button
            onClick={() => setShowAddNovelModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            เพิ่มนิยายใหม่
          </button>
        </div>
      )}

      {/* Add Novel Modal */}
      {showAddNovelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">เพิ่มนิยายใหม่</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อนิยาย</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="กรอกชื่อนิยาย"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">คำอธิบาย</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="กรอกคำอธิบายนิยาย"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL รูปปก</label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้เขียน</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="กรอกชื่อผู้เขียน"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddNovelModal(false);
                  setTitle("");
                  setDescription("");
                  setCoverImageUrl("");
                  setAuthorName("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddNovel}
                disabled={!title || !authorName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Novel Modal */}
      {showEditNovelModal && editingNovel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Edit className="w-5 h-5 mr-2" />
              แก้ไขนิยาย: {editingNovel.title}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อนิยาย *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="กรอกชื่อนิยาย"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">คำอธิบาย</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="กรอกคำอธิบายนิยาย"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL รูปปก</label>
                <input
                  type="url"
                  value={editCoverImageUrl}
                  onChange={(e) => setEditCoverImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้เขียน *</label>
                <input
                  type="text"
                  value={editAuthorName}
                  onChange={(e) => setEditAuthorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="กรอกชื่อผู้เขียน"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEditNovel}
                disabled={editLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdateNovel}
                disabled={editLoading || !editTitle.trim() || !editAuthorName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {editLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
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
  const renderManageUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
        <div className="flex space-x-2">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลผู้ใช้จาก API...</p>
        </div>
      )}

      {/* API Status */}
      {!loading && (
        <div className={`rounded-lg p-4 mb-4 ${users.length > 0 && !users[0].name ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center">
            <div className={`mr-3 ${users.length > 0 && !users[0].name ? 'text-green-400' : 'text-yellow-400'}`}>
              {users.length > 0 && !users[0].name ? '✅' : '⚠️'}
            </div>
            <div>
              <p className={`font-medium ${users.length > 0 && !users[0].name ? 'text-green-700' : 'text-yellow-700'}`}>
                {users.length > 0 && !users[0].name ? 'เชื่อมต่อ API สำเร็จ' : 'ใช้ข้อมูล Mock'}
              </p>
              <p className={`text-sm ${users.length > 0 && !users[0].name ? 'text-green-600' : 'text-yellow-600'}`}>
                {users.length > 0 && !users[0].name
                  ? `แสดงข้อมูลจาก /api/getusers (${users.length} รายการ)`
                  : 'API ไม่สามารถเชื่อมต่อได้ แสดงข้อมูลตัวอย่าง'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user, index) => (
              <tr key={`user-${user.id || user.user_id}-${index}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.user_id || user.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {(user.username || user.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.username || user.name || 'ไม่ระบุชื่อ'}
                      </div>
                      {user.email && (
                        <div className="text-sm text-gray-500">{user.email}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                    ? 'bg-red-100 text-red-800'
                    : user.role === 'moderator'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                    }`}>
                    {user.role || 'reader'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : (user.joinDate || 'ไม่ทราบ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-blue-600 hover:text-blue-900"
                    title="แก้ไขผู้ใช้"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteUser(
                      user.user_id || user.id,
                      user.username || user.name
                    )}
                    className="text-red-600 hover:text-red-900"
                    title={`ลบผู้ใช้ "${user.username || user.name}"`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {/* Edit User Modal */}
                  {showEditUserModal && editingUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Edit className="w-5 h-5 mr-2" />
                          แก้ไขผู้ใช้: {editingUser.username || editingUser.name}
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                            <input
                              type="text"
                              value={editUsername}
                              onChange={(e) => setEditUsername(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="กรอก Username"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                            <input
                              type="password"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="กรอกรหัสผ่านใหม่"
                            />
                            <p className="text-xs text-gray-500 mt-1">กรอกรหัสผ่านใหม่เพื่อเปลี่ยนแปลง</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">-- เลือก Role --</option>
                              <option value="reader">Reader</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                          <button
                            onClick={handleCancelEditUser}
                            disabled={editUserLoading}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={handleUpdateUser}
                            disabled={editUserLoading || !editUsername.trim() || !editPassword.trim() || !editRole.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            {editUserLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                กำลังบันทึก...
                              </>
                            ) : (
                              <>
                                <Edit className="w-4 h-4 mr-2" />
                                บันทึกการแก้ไข
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบข้อมูลผู้ใช้</h3>
            <p className="mt-1 text-sm text-gray-500">ไม่สามารถโหลดข้อมูลจาก API ได้</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'dashboard'
              ? 'bg-white shadow-md text-gray-900'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            แดชบอร์ด
          </button>
          <button
            onClick={() => setActiveTab('manageNovels')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'manageNovels'
              ? 'bg-white shadow-md text-gray-900'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            จัดการนิยาย
          </button>
          <button
            onClick={() => setActiveTab('manageUsers')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'manageUsers'
              ? 'bg-white shadow-md text-gray-900'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            จัดการผู้ใช้
          </button>
        </div>
      </div>


      {/* Active Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'manageNovels' && renderManageNovels()}
      {activeTab === 'manageUsers' && renderManageUsers()}


      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        &copy; 2024 Novel Admin Dashboard. All rights reserved.
      </div>
    </div>
  );
};

export default NovelAdminDashboard;