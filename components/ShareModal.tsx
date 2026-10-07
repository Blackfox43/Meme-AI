import React, { useState } from "react";
import { Meme } from "../types";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  meme: Partial<Meme> | null;
  onToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  meme,
  onToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  if (!isOpen || !meme) return null;

  const captionText = [meme.topText, meme.bottomText].filter(Boolean).join(" • ");
  const shareText = `"${captionText || "Check out this meme!"}" - Made with MemeAI 🚀`;
  const shareUrl = window.location.origin;

  // 1. Native Device Share (Web Share API)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "MemeAI Meme",
          text: shareText,
          url: shareUrl,
        });
        onToast("Shared successfully! 🚀");
        onClose();
      } catch (err) {
        // User canceled share
      }
    } else {
      handleCopyLink();
    }
  };

  // 2. Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      onToast("Link copied to clipboard! 📋");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      onToast("Could not copy link.");
    }
  };

  // 3. Copy Caption
  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(captionText);
      setCopiedCaption(true);
      onToast("Caption copied! 📝");
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {
      onToast("Could not copy caption.");
    }
  };

  // 4. One-tap Social Intents
  const handleShareTwitter = () => {
    const tweetText = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank", "noopener,noreferrer");
  };

  const handleShareWhatsApp = () => {
    const waText = encodeURIComponent(`${shareText} ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${waText}`, "_blank", "noopener,noreferrer");
  };

  const handleShareTelegram = () => {
    const tgText = encodeURIComponent(shareText);
    const tgUrl = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${tgUrl}&text=${tgText}`, "_blank", "noopener,noreferrer");
  };

  const handleShareReddit = () => {
    const redditTitle = encodeURIComponent(captionText || "MemeAI Creation");
    const redditUrl = encodeURIComponent(shareUrl);
    window.open(`https://reddit.com/submit?url=${redditUrl}&title=${redditTitle}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-5 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white text-sm shadow-md">
              <i className="fa-solid fa-share-nodes"></i>
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white uppercase">Share Meme</h3>
              <p className="text-[10px] text-slate-400">Blast this viral content across social channels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Meme Preview Snippet */}
        <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800/80 flex items-center gap-3">
          {meme.imageUrl ? (
            <img
              src={meme.imageUrl}
              alt="Meme preview"
              referrerPolicy="no-referrer"
              className="w-12 h-12 object-cover rounded-xl border border-slate-700/60 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-purple-400 shrink-0">
              <i className="fa-regular fa-image text-lg"></i>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-white truncate">{meme.topText || "Viral Meme"}</p>
            {meme.bottomText && (
              <p className="text-[11px] text-slate-400 truncate">{meme.bottomText}</p>
            )}
            {meme.creator && (
              <p className="text-[9px] text-purple-400 font-bold tracking-wide">by @{meme.creator}</p>
            )}
          </div>
        </div>

        {/* Primary Native Share Button if supported */}
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
          <button
            onClick={handleNativeShare}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
          >
            <i className="fa-solid fa-arrow-up-from-bracket text-xs"></i>
            <span>Share via System Sheet</span>
          </button>
        )}

        {/* One-Tap Social Channel Badges */}
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
            POST DIRECTLY TO SOCIALS
          </p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={handleShareTwitter}
              className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group active:scale-95"
              title="Post on X (Twitter)"
            >
              <i className="fa-brands fa-x-twitter text-base text-slate-200 group-hover:text-white"></i>
              <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-200">X / Tweet</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group active:scale-95"
              title="Share to WhatsApp"
            >
              <i className="fa-brands fa-whatsapp text-base text-emerald-400 group-hover:text-emerald-300"></i>
              <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-200">WhatsApp</span>
            </button>

            <button
              onClick={handleShareTelegram}
              className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group active:scale-95"
              title="Share to Telegram"
            >
              <i className="fa-brands fa-telegram text-base text-sky-400 group-hover:text-sky-300"></i>
              <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-200">Telegram</span>
            </button>

            <button
              onClick={handleShareReddit}
              className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group active:scale-95"
              title="Submit to Reddit"
            >
              <i className="fa-brands fa-reddit-alien text-base text-orange-500 group-hover:text-orange-400"></i>
              <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-200">Reddit</span>
            </button>
          </div>
        </div>

        {/* Copy Tools */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className={`py-2.5 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                copiedLink
                  ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                  : "bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300"
              }`}
            >
              <i className={`fa-solid ${copiedLink ? "fa-check text-emerald-400" : "fa-link"}`}></i>
              <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
            </button>

            <button
              onClick={handleCopyCaption}
              className={`py-2.5 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                copiedCaption
                  ? "bg-purple-950/60 border-purple-500 text-purple-300"
                  : "bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300"
              }`}
            >
              <i className={`fa-solid ${copiedCaption ? "fa-check text-purple-400" : "fa-quote-left"}`}></i>
              <span>{copiedCaption ? "Text Copied!" : "Copy Caption"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
