import React from 'react';

export const PaintingCardSkeleton: React.FC = () => {
  return (
    <div className="art-card animate-pulse">
      <div className="aspect-[4/3] bg-atelier-ink/10" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-atelier-ink/10 rounded w-3/4" />
        <div className="h-3 bg-atelier-ink/10 rounded w-1/2" />
        <div className="h-12 bg-atelier-ink/5 rounded w-full mt-2" />
        <div className="pt-4 flex items-center justify-between">
          <div className="h-6 bg-atelier-ink/10 rounded w-20" />
          <div className="h-8 bg-atelier-ink/10 rounded-full w-24" />
        </div>
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => {
  return (
    <tr className="animate-pulse border-b border-atelier-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-4 bg-atelier-ink/10 rounded w-full" />
        </td>
      ))}
    </tr>
  );
};
