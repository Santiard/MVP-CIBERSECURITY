// Placeholder React TypeScript component
import React from 'react';

export const Button: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <button className="px-4 py-2 bg-blue-600 text-white rounded">{children}</button>;
};

export default Button;
