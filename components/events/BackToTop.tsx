import React from 'react';
import { ArrowUp } from 'lucide-react';

interface BackToTopProps {
  showBackToTop: boolean;
  scrollToTop: () => void;
  isCalendarOpen?: boolean;
}

const BackToTop: React.FC<BackToTopProps> = ({ 
  showBackToTop, 
  scrollToTop 
}) => {
  return (
    <div 
      className={`transition-all duration-300 ease-out ${
        showBackToTop 
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
          : 'opacity-0 translate-y-6 scale-90 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:bg-black hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center group cursor-pointer"
        aria-label="Back to top"
        title="Back to top"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
};

export default BackToTop;
