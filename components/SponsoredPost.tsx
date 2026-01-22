
import React from 'react';
import { Ad } from '../types';

interface SponsoredPostProps {
  ad: Ad;
  onUpgrade?: () => void;
}

export const SponsoredPost: React.FC<SponsoredPostProps> = ({ ad, onUpgrade }) => {
  return (
    <div className="bg-slate-800/40 rounded-[3.5rem] p-6 border border-blue-500/20 space-y-4 backdrop-blur-md shadow-2xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700"></div>

      <div className="flex items-center justify-between px-2 mb-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/10">
            <i className="fa-solid fa-rectangle-ad"></i>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 leading-none">Sponsored</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">External Partner</span>
          </div>
        </div>
        <button 
          onClick={onUpgrade}
          className="text-[9px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700/50 active:scale-95"
        >
          Hide Ads
        </button>
      </div>

      <div className="rounded-[2.5rem] overflow-hidden relative aspect-[16/9] bg-slate-900 border border-slate-700/50 shadow-inner">
        <img 
          src={ad.imageUrl} 
          alt={ad.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
      </div>

      <div className="px-2 space-y-2 relative z-10">
        <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white group-hover:text-blue-400 transition-colors">{ad.title}</h3>
        <p className="text-[12px] text-slate-400 font-medium leading-relaxed">{ad.description}</p>
      </div>

      <div className="pt-2 px-2 relative z-10">
        <a 
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl text-center text-[11px] font-black uppercase tracking-[0.4em] transition-all active:scale-95 shadow-xl shadow-blue-600/20 text-white"
        >
          {ad.ctaText}
        </a>
      </div>
    </div>
  );
};
