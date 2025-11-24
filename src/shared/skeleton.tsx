import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div 
      className={`bg-[var(--secondary)] rounded animate-pulse ${className}`}
      style={style}
    />
  );
};

export default Skeleton;