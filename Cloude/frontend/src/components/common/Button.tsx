// frontend/src/components/common/Button/Button.tsx

import React from 'react';

// Определяем пропсы для компонента кнопки
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  className = '',
  disabled = false,
}) => {
  // Базовые стили Tailwind для кнопки
  const baseStyles = 'px-4 py-2 font-semibold rounded-lg shadow-md transition-colors duration-200';

  // Стили в зависимости от варианта
  const variantStyles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant];

  // Стили для отключенного состояния
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${disabledStyles} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
