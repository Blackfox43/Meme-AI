
import React from 'react';
import { MemeLayout } from '../types';

interface MemeCanvasProps {
  imageUrl: string;
  topText: string;
  bottomText: string;
  layout: MemeLayout;
  isPro?: boolean;
}

export const MemeCanvas: React.FC<MemeCanvasProps> = ({
  imageUrl,
  topText,
  bottomText,
  layout,
  isPro = false
}) => {
  const renderMedia = () => {
    return (
      <img 
        src={imageUrl} 
        alt="meme" 
        className="w-full h-auto block min-h-[200px] object-contain bg-black" 
        crossOrigin="anonymous"
      />
    );
  };

  const renderLayout = () => {
    switch (layout) {
      case MemeLayout.Modern:
        return (
          <div className="flex flex-col bg-white overflow-hidden rounded-2xl shadow-2xl border-[12px] border-white">
            <div className="p-5 text-black text-center font-bold text-lg md:text-xl leading-snug tracking-tight">
              {topText || "Thinking of a clever caption..."}
            </div>
            <div className="relative">
              {renderMedia()}
              {bottomText && (
                <div className="absolute bottom-4 left-0 right-0 px-4 text-center pointer-events-none">
                  <h2 className="meme-font text-white text-2xl md:text-3xl uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    {bottomText}
                  </h2>
                </div>
              )}
            </div>
          </div>
        );

      case MemeLayout.Drake:
        return (
          <div className="grid grid-cols-2 gap-0.5 bg-black rounded-2xl overflow-hidden border-2 border-slate-800 aspect-square">
            <div className="grid grid-rows-2 h-full">
              <div className="bg-orange-400 flex items-center justify-center p-2 text-6xl border-b border-black">😒</div>
              <div className="bg-orange-400 flex items-center justify-center p-2 text-6xl">😊</div>
            </div>
            <div className="grid grid-rows-2 h-full">
              <div className="bg-white flex items-center justify-center p-4 text-black font-extrabold text-xs md:text-sm uppercase leading-tight border-b border-black text-center">
                {topText || "Me when coding"}
              </div>
              <div className="bg-white flex items-center justify-center p-4 text-black font-extrabold text-xs md:text-sm uppercase leading-tight text-center">
                {bottomText || "Me when meme-ing"}
              </div>
            </div>
          </div>
        );

      case MemeLayout.Split:
        return (
          <div className="grid grid-rows-2 gap-0.5 bg-black rounded-2xl overflow-hidden border-2 border-slate-800">
             <div className="relative overflow-hidden aspect-[16/9]">
               {renderMedia()}
               <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/40">
                 <h2 className="meme-font text-white text-2xl md:text-4xl uppercase text-center">{topText}</h2>
               </div>
             </div>
             <div className="relative overflow-hidden aspect-[16/9]">
               {renderMedia()}
               <div className="absolute inset-0 flex items-center justify-center p-6 bg-gradient-to-t from-black/60 to-transparent">
                 <h2 className="meme-font text-white text-2xl md:text-4xl uppercase text-center">{bottomText}</h2>
               </div>
             </div>
          </div>
        );

      case MemeLayout.TopBottom:
      default:
        return (
          <div className="relative group overflow-hidden rounded-2xl bg-slate-900 border-2 border-slate-800">
            {renderMedia()}
            <div className="absolute top-6 left-0 right-0 px-6 text-center pointer-events-none">
              <h2 className="meme-font text-white text-3xl md:text-5xl uppercase leading-none filter drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">
                {topText}
              </h2>
            </div>
            <div className="absolute bottom-6 left-0 right-0 px-6 text-center pointer-events-none">
              <h2 className="meme-font text-white text-3xl md:text-5xl uppercase leading-none filter drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">
                {bottomText}
              </h2>
            </div>
            {!isPro && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[8px] font-black text-white/50 tracking-widest uppercase">
                MemeAI
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto transform transition-all">
      {renderLayout()}
    </div>
  );
};
