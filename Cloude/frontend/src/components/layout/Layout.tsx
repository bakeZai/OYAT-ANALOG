'use client';
import { useState } from 'react';
import Header from './Header'; // Импортируем Header
import Sidebar from './Sidebar'; // Импортируем Sidebar

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Основной компонент-оболочка (Layout), который служит точкой пересечения
 * для Header, Sidebar и основного контента. Он управляет состоянием сайдбара.
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Состояние для управления видимостью сайдбара.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Функция для открытия/закрытия сайдбара.
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Передаем функцию toggleSidebar в Header через пропс onOpenSidebar. */}
      <Header onOpenSidebar={toggleSidebar} />
      
      {/* Передаем текущее состояние и функцию-обработчик в Sidebar. */}
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
