import React from 'react';
import { cn } from '../../lib/utils';

export function StatCard({ title, value, subtitle, className, ...props }) {
  return (
    <div 
      className={cn(
        "group flex flex-col border-4 border-[#8b2ba6] bg-[#2a1d3f]/80 backdrop-blur-sm p-4 shadow-[4px_4px_0_#5a1a9e] transition-all duration-200 hover:-translate-y-2 hover:shadow-[6px_6px_0_#c87ae8] hover:border-[#c87ae8]",
        className
      )}
      {...props}
    >
      <h3 className="mb-2 font-pixel text-[10px] uppercase text-[#a99fd6] group-hover:text-[#fffaf0] transition-colors">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="font-pixel text-xl sm:text-2xl text-[#fffaf0] group-hover:animate-pop">{value}</span>
        {subtitle && <span className="font-pixel text-[8px] text-[#7b72b3] group-hover:text-[#a99fd6] transition-colors">{subtitle}</span>}
      </div>
    </div>
  );
}
