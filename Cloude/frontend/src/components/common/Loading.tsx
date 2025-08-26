// frontend/src/components/common/Loading/Loading.tsx

import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-gray-500">
      {/* Иконка загрузки (простой спиннер Tailwind) */}
      <div className="w-10 h-10 border-4 border-t-4 border-t-indigo-500 border-gray-200 rounded-full animate-spin mb-3"></div>
      <p>Загрузка...</p>
    </div>
  );
};

export default Loading;
