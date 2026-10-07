
import React from 'react';
import { MemeLayout, TextStyle, MemeSticker } from '../types';

interface MemeCanvasProps {
  imageUrl: string;
  topText: string;
  bottomText: string;
  layout: MemeLayout;
  isPro?: boolean;
  textStyle?: TextStyle;
  stickers?: MemeSticker[];
  onRemoveSticker?: (id: string) => void;
  interactiveStickers?: boolean;
}

export const MemeCanvas: React.FC<MemeCanvasProps> = ({
  imageUrl,
  topText,
  bottomText,
  layout,
  isPro = false,
  textStyle = { fontSize: 48, color: '#ffffff', strokeWidth: 1.5, fontFamily: 'Bangers' },
  stickers = [],
  onRemoveSticker,
  interactiveStickers = false
}) => {
  const getFontFamily = () => {
    switch (textStyle.fontFamily) {
      case 'Impact':
        return 'Impact, "Arial Black", sans-serif';
      case 'Comic':
        return '"Comic Sans MS", "Comic Sans", cursive';
      case 'Inter':
        return 'Inter, system-ui, sans-serif';
      case 'Bangers':
      default:
        return "'Bangers', cursive";
    }
  };

  const dynamicStyle: React.CSSProperties = {
    fontSize: `${textStyle.fontSize}px`,
    color: textStyle.color,
    WebkitTextStroke: `${textStyle.strokeWidth}px black`,
    textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
    fontFamily: getFontFamily(),
    lineHeight: '1.1',
    wordBreak: 'break-word'
  };

  const isVideo = imageUrl?.startsWith('blob:') || imageUrl?.includes('.mp4') || imageUrl?.includes('video');

  const renderMedia = (className: string) => {
    if (isVideo) {
      return (
        <video
          src={imageUrl}
          autoPlay
          loop
          muted
          playsInline
          className={className}
        />
      );
    }
    return (
      <img
        src={imageUrl}
        alt="meme"
        className={className}
        crossOrigin="anonymous"
      />
    );
  };

  const renderStickers = () => {
    if (!stickers || stickers.length === 0) return null;
    return (
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {stickers.map((st) => (
          <div
            key={st.id}
            style={{
              position: 'absolute',
              left: `${st.x}%`,
              top: `${st.y}%`,
              transform: `translate(-50%, -50%) scale(${st.scale || 1})`,
              fontSize: '2.5rem',
              lineHeight: 1
            }}
            className="select-none filter drop-shadow-lg"
          >
            <span className="pointer-events-auto cursor-pointer relative group inline-block">
              {st.emoji}
              {interactiveStickers && onRemoveSticker && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSticker(st.id);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md hover:scale-110 active:scale-95"
                  title="Remove sticker"
                >
                  ✕
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderLayout = () => {
    switch (layout) {
      case MemeLayout.Modern:
        return (
          <div className="relative flex flex-col bg-white overflow-hidden rounded-2xl shadow-2xl border-2 border-slate-200">
            {topText && (
              <div
                className="p-4 text-black text-center font-extrabold leading-snug tracking-tight bg-white select-none"
                style={{
                  fontSize: `${Math.max(16, textStyle.fontSize * 0.45)}px`,
                  fontFamily: textStyle.fontFamily === 'Bangers' ? 'Inter, sans-serif' : getFontFamily()
                }}
              >
                {topText}
              </div>
            )}
            <div className="relative overflow-hidden bg-slate-950">
              {renderMedia("w-full h-auto object-cover max-h-[460px] block")}
              {renderStickers()}
              {bottomText && (
                <div className="absolute bottom-3 left-0 right-0 px-4 text-center pointer-events-none z-10">
                  <h2 className="uppercase" style={dynamicStyle}>
                    {bottomText}
                  </h2>
                </div>
              )}
            </div>
            {!isPro && (
              <div className="bg-slate-100 px-3 py-1 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-200">
                Created with MemeAI
              </div>
            )}
          </div>
        );

      case MemeLayout.Drake:
        return (
          <div className="relative grid grid-cols-2 gap-0.5 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
            <div className="flex flex-col border-r border-slate-800">
              <div className="bg-gradient-to-b from-amber-500 to-amber-600 flex-1 min-h-[120px] flex items-center justify-center p-3 text-center text-4xl font-bold border-b border-slate-900 select-none">
                😒
              </div>
              <div className="bg-gradient-to-b from-emerald-500 to-emerald-600 flex-1 min-h-[120px] flex items-center justify-center p-3 text-center text-4xl font-bold select-none">
                😊
              </div>
            </div>
            <div className="flex flex-col bg-white text-slate-900">
              <div
                className="bg-white flex-1 min-h-[120px] flex items-center justify-center p-4 font-bold border-b border-slate-200 text-center leading-snug"
                style={{ fontSize: `${Math.max(14, textStyle.fontSize * 0.35)}px`, fontFamily: getFontFamily() }}
              >
                {topText || "OPTION A"}
              </div>
              <div
                className="bg-white flex-1 min-h-[120px] flex items-center justify-center p-4 font-bold text-center leading-snug"
                style={{ fontSize: `${Math.max(14, textStyle.fontSize * 0.35)}px`, fontFamily: getFontFamily() }}
              >
                {bottomText || "OPTION B"}
              </div>
            </div>
            {renderStickers()}
          </div>
        );

      case MemeLayout.TopBottom:
      default:
        return (
          <div className="relative group overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl">
            {renderMedia("w-full h-auto max-h-[500px] object-cover block mx-auto")}
            {renderStickers()}
            {topText && (
              <div className="absolute top-3 left-0 right-0 px-4 text-center pointer-events-none z-10">
                <h2 className="uppercase tracking-wide" style={dynamicStyle}>
                  {topText}
                </h2>
              </div>
            )}
            {bottomText && (
              <div className="absolute bottom-3 left-0 right-0 px-4 text-center pointer-events-none z-10">
                <h2 className="uppercase tracking-wide" style={dynamicStyle}>
                  {bottomText}
                </h2>
              </div>
            )}
            {!isPro && (
              <div className="absolute bottom-1 right-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] text-white/70 font-semibold tracking-wider z-10">
                MemeAI FREE
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto transform transition-all duration-200">
      {renderLayout()}
    </div>
  );
};
