import React from 'react';

export const Decoration: React.FC = () => {
  return (
    <div className="decoration-container">
      <svg 
        width="400" 
        height="400" 
        viewBox="0 0 400 400" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect 
          x="50" 
          y="50" 
          width="300" 
          height="300" 
          stroke="#ffa722" 
          strokeWidth="2"
          fill="none"
        />
        <text
          x="200"
          y="200"
          fill="#ffa722"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="monospace"
          fontSize="16"
        >
          some svg graphic here
        </text>
      </svg>
    </div>
  );
}; 