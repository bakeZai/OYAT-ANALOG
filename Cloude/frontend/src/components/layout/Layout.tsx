// frontend/src/components/layout/Layout.tsx - ЦЕНТРАЛИЗОВАННОЕ УПРАВЛЕНИЕ

'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  // ✅ Принимаем files от dashboard компонента
  files?: Array<{ size?: number }>;
}

/**
 * Основной компонент-оболочка (Layout), который служит точкой пересечения
 * для Header, Sidebar и основного контента.
 */
const Layout: React.FC<LayoutProps> = ({ children, files = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // ✅ Мемоизируем вычисление storage stats
  const storageStats = useMemo(() => {
    if (!files.length) return undefined;

    const usedBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const totalBytes = 1 * 1024 * 1024 * 1024; // 1GB

    return {
      used: usedBytes,
      total: totalBytes
    };
  }, [files]);

  // ✅ Логирование только при изменении количества файлов
  useEffect(() => {
    if (files.length > 0) {
      console.log(`📊 Layout: Managing ${files.length} files`);
    }
  }, [files.length]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        onOpenSidebar={toggleSidebar} 
        storageStats={storageStats}
      />
      
      <Sidebar open={isSidebarOpen} onClose={toggleSidebar} />

      <div className="flex flex-1">
        <main className="flex-1 p-6 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;