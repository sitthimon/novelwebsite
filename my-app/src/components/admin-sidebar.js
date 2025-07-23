import React, { useState } from 'react';
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

export default function AdminSidebar() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // ตัวอย่างฟังก์ชัน render แบบง่ายๆ (แก้ตามเนื้อหาจริง)
  const renderDashboard = () => <div>Dashboard Content</div>;
  const renderManageNovels = () => <div>Manage Novels Content</div>;
  const renderManageChapters = () => <div>Manage Chapters Content</div>;
  const renderManageUsers = () => <div>Manage Users Content</div>;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'novels', label: 'จัดการนิยาย', icon: Book },
    { id: 'chapters', label: 'จัดการตอนนิยาย', icon: BookOpen },
    { id: 'users', label: 'ดูผู้ใช้', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 px-4 bg-gray-900 text-white">
          <h1 className="text-xl font-bold">Novel Admin</h1>
        </div>
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'novels' && renderManageNovels()}
        {activeTab === 'chapters' && renderManageChapters()}
        {activeTab === 'users' && renderManageUsers()}
      </div>
    </div>
  );
}
