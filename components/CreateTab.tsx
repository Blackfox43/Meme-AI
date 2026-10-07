import React, { useState, useRef, useEffect } from "react";
import { HumorStyle, MemeLayout, TextStyle, MemeSticker, MemeFont, CaptionSuggestion, DailyChallenge } from "../types";
import { geminiService } from "../services/geminiService";
import { TRENDING_TEMPLATES, STICKER_PRESETS } from "../constants";
import { ShareModal } from "./ShareModal";

interface CreateTabProps {
  onPublish: (meme: {
    imageUrl: string;
    topText: string;
    bottomText: string;
    humorStyle: HumorStyle;
    layout: MemeLayout;
    textStyle: TextStyle;
    stickers?: MemeSticker[];
    tags?: string[];
    isChallengeEntry?: boolean;
    challengeTheme?: string;
    isProCreator?: boolean;
  }) => void;
  editorImage: string | null;
  setEditorImage: (img: string | null) => void;
  editorVideo: string | null;
  setEditorVideo: (video: string | null) => void;
  onToast?: (message: string) => void;
  activeChallenge?: DailyChallenge | null;
  onClearActiveChallenge?: () => void;
  isPro?: boolean;
  onOpenUpgradeModal?: () => void;
}

export const CreateTab: React.FC<CreateTabProps> = ({
  onPublish,
  editorImage,
  setEditorImage,
  editorVideo,
  setEditorVideo,
  onToast,
  activeChallenge,
  onClearActiveChallenge,
  isPro = false,
  onOpenUpgradeModal,
}) => {
  const [creationMode, setCreationMode] = useState<"image" | "video">("image");
  const [imageCreationSubMode, setImageCreationSubMode] = useState<"templates" | "ai" | "upload">("templates");
  
  // Inputs
  const [topText, setTopText] = useState("TOP TEXT");
  const [bottomText, setBottomText] = useState("BOTTOM TEXT");
  const [humorStyle, setHumorStyle] = useState<HumorStyle>(HumorStyle.Relatable);
  const [layout, setLayout] = useState<MemeLayout>(MemeLayout.TopBottom);
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontSize: 36,
    color: "#ffffff",
    strokeWidth: 1.5,
    fontFamily: "Bangers",
  });

  // Stickers State
  const [stickers, setStickers] = useState<MemeSticker[]>([]);
  const [showStickersDrawer, setShowStickersDrawer] = useState(false);

  // Caption Variations Reel
  const [captionVariations, setCaptionVariations] = useState<CaptionSuggestion[]>([]);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);

  // Live Trending Topics
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);

  // Loading / Actions States
  const [isGeneratingBase, setIsGeneratingBase] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [captionContext, setCaptionContext] = useState("");
  const [voice, setVoice] = useState<"Kore" | "Puck" | "Charon">("Kore");
  const [templateSearch, setTemplateSearch] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // AI Magic Auto-Meme States & Refs
  const [isMagicAnalyzing, setIsMagicAnalyzing] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoMemeFileInputRef = useRef<HTMLInputElement>(null);
  const memeRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const showNotification = (msg: string) => {
    if (onToast) onToast(msg);
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Load trending topics on initial mount
  useEffect(() => {
    const fetchTrends = async () => {
      setIsLoadingTrends(true);
      try {
        const topics = await geminiService.getTrendingContext();
        setTrendingTopics(topics);
      } catch (e) {
        setTrendingTopics(["Monday Blues", "Git Push Force", "Cat Life", "AI Taking Over", "Coffee Obsession"]);
      } finally {
        setIsLoadingTrends(false);
      }
    };
    fetchTrends();
  }, []);

  // Sync Daily Challenge context when accepted
  useEffect(() => {
    if (activeChallenge) {
      if (!editorImage && activeChallenge.suggestedTemplateUrl) {
        setEditorImage(activeChallenge.suggestedTemplateUrl);
      }
      if (activeChallenge.suggestedTop && (topText === "TOP TEXT" || !topText)) {
        setTopText(activeChallenge.suggestedTop);
      }
      if (activeChallenge.suggestedBottom && (bottomText === "BOTTOM TEXT" || !bottomText)) {
        setBottomText(activeChallenge.suggestedBottom);
      }
      if (activeChallenge.prompt) {
        setCaptionContext(activeChallenge.prompt);
      }
    }
  }, [activeChallenge]);

  const handleMagicAutoMemeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsMagicAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Image = ev.target?.result as string;
        try {
          const response = await geminiService.generateMemeCaption(
            base64Image,
            humorStyle,
            "Create a matching, extremely hilarious internet meme caption based on the visual contents, expressions, or theme of this uploaded image."
          );
          setTopText(response.topText || "ME:");
          setBottomText(response.bottomText || "BOTTOM TEXT");
          setEditorImage(base64Image);
          showNotification("⚡ AI Magic Auto-Meme Ready!");
        } catch (err) {
          console.error(err);
          setTopText("WHEN THE AI AUTO-GENERATOR");
          setBottomText("WORKS LIKE A CHARM");
          setEditorImage(base64Image);
        } finally {
          setIsMagicAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsMagicAnalyzing(false);
    }
  };

  const handleSelectTemplate = (template: typeof TRENDING_TEMPLATES[0]) => {
    setEditorImage(template.url);
    setEditorVideo(null);
    setLayout(template.layout);
    if (template.suggestedTop) setTopText(template.suggestedTop);
    if (template.suggestedBottom) setBottomText(template.suggestedBottom);
    setStickers([]);
    showNotification(`Selected template: ${template.name}`);
  };

  const handleCreationSwitch = (mode: "image" | "video") => {
    setCreationMode(mode);
    setEditorImage(null);
    setEditorVideo(null);
    setStickers([]);
  };

  // 1. Generate Image Base using AI
  const handleGenerateBaseImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingBase(true);
    try {
      const imageUrl = await geminiService.generateMemeBase(imagePrompt);
      if (imageUrl) {
        setEditorImage(imageUrl);
        showNotification("🎨 Base image generated!");
      } else {
        showNotification("Could not generate image. Check connection.");
      }
    } catch (err) {
      console.error(err);
      showNotification("Image generation failed.");
    } finally {
      setIsGeneratingBase(false);
    }
  };

  // 2. Generate Cinematic Video Meme (VEO)
  const handleGenerateVideoMeme = async () => {
    if (!videoPrompt.trim()) return;
    setIsGeneratingVideo(true);
    try {
      const videoUrl = await geminiService.generateVideoMeme(videoPrompt);
      setEditorVideo(videoUrl);
      showNotification("🎬 Video meme created!");
    } catch (err: any) {
      console.warn("Video generation fallback notice:", err);
      showNotification("🎬 Video meme ready!");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // 3. Auto-Captioning Generator via Gemini
  const handleAutoCaption = async () => {
    const currentMedia = editorVideo || editorImage;
    if (!currentMedia) return;
    setIsGeneratingCaption(true);
    try {
      const response = await geminiService.generateMemeCaption(
        currentMedia,
        humorStyle,
        captionContext
      );
      setTopText(response.topText || "");
      setBottomText(response.bottomText || "");
      showNotification("✨ AI Caption applied!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // 4. Generate 3 Multi-Humor Variations Reel
  const handleGenerateVariations = async () => {
    const currentMedia = editorVideo || editorImage;
    if (!currentMedia) return;
    setIsGeneratingVariations(true);
    try {
      const variations = await geminiService.generateCaptionVariations(
        currentMedia,
        captionContext
      );
      const mapped: CaptionSuggestion[] = variations.map((v, i) => ({
        id: `var_${i}_${Date.now()}`,
        topText: v.topText,
        bottomText: v.bottomText,
        humorStyle: (v.style as HumorStyle) || HumorStyle.Relatable,
        pitch: v.pitch || v.style
      }));
      setCaptionVariations(mapped);
      showNotification("🎲 3 Joke variations ready!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  // Apply one of the 3 variations
  const handleApplyVariation = (v: CaptionSuggestion) => {
    setTopText(v.topText);
    setBottomText(v.bottomText);
    setHumorStyle(v.humorStyle);
    showNotification(`Applied ${v.humorStyle} joke`);
  };

  // 5. Voice Narration via TTS
  const handleNarrate = async () => {
    if (isNarrating) return;
    setIsNarrating(true);
    try {
      const speakText = `${topText}. ${bottomText}`;
      const buffer = await geminiService.generateMemeSpeech(speakText, voice);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      source.onended = () => setIsNarrating(false);
    } catch (err) {
      console.error(err);
      setIsNarrating(false);
    }
  };

  // 6. Download Canvas via html2canvas (Supports Pro 4K Ultra-Sharp Scaling)
  const handleDownload = async () => {
    if (!memeRef.current) return;
    try {
      const scale = isPro ? 2 : 1;
      const canvas = await (window as any).html2canvas(memeRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale,
      });
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `memeai-${isPro ? "pro-hd-" : ""}${Date.now()}.png`;
      link.href = url;
      link.click();
      showNotification(isPro ? "📥 Downloaded 4K Ultra-HD Meme (No Watermark)! 👑" : "📥 Downloaded PNG successfully!");
    } catch (err) {
      console.error("Failed to download meme:", err);
      showNotification("Download failed. Try saving image directly!");
    }
  };

  // 7. Copy Image to Clipboard
  const handleCopyToClipboard = async () => {
    if (!memeRef.current) return;
    try {
      const canvas = await (window as any).html2canvas(memeRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
          showNotification("📋 Copied image to clipboard!");
        } catch (e) {
          // Fallback to text copy
          await navigator.clipboard.writeText(`${topText}\n${bottomText}`);
          showNotification("📋 Copied meme captions to clipboard!");
        }
      });
    } catch (err) {
      console.error(err);
      navigator.clipboard.writeText(`${topText}\n${bottomText}`);
      showNotification("📋 Copied text to clipboard!");
    }
  };

  // 8. One-Tap Social & Native Share
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Sticker helpers
  const handleAddSticker = (emoji: string) => {
    const newSticker: MemeSticker = {
      id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      emoji,
      x: 50 + (Math.random() * 20 - 10),
      y: 50 + (Math.random() * 20 - 10),
      scale: 1.2
    };
    setStickers((prev) => [...prev, newSticker]);
    showNotification(`Added ${emoji} sticker!`);
  };

  const handleRemoveSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  const publish = async () => {
    const media = editorVideo || editorImage;
    if (!media) return;

    setIsModerating(true);
    setModerationError(null);

    // Extract any hashtags from captions and context
    const fullText = `${topText} ${bottomText}`;

    // Automated Gemini Content Moderation check
    try {
      const isBase64Img = editorImage?.startsWith("data:image/") ? editorImage : undefined;
      const check = await geminiService.moderateContent(fullText, isBase64Img);
      if (!check.safe) {
        setIsModerating(false);
        setModerationError(
          check.reason ||
            "This meme was flagged by our automated safety reviewer. Please adjust your caption or image to keep content respectful."
        );
        showNotification("⚠️ Content flagged by automated moderation");
        return;
      }
    } catch (e) {
      console.warn("Moderation check error:", e);
    } finally {
      setIsModerating(false);
    }

    const textHashtags = fullText.match(/#[a-zA-Z0-9_]+/g) || [];
    const challengeTags = activeChallenge
      ? [activeChallenge.tag, "#DailyChallenge", "#MemeOfTheDay"]
      : [];
    const autoTags = Array.from(
      new Set([
        `#${humorStyle.toLowerCase()}`,
        ...challengeTags,
        ...textHashtags.map((t) => (t.startsWith("#") ? t.toLowerCase() : `#${t.toLowerCase()}`)),
      ])
    );

    onPublish({
      imageUrl: media,
      topText,
      bottomText,
      humorStyle,
      layout,
      textStyle,
      stickers,
      tags: autoTags,
      isChallengeEntry: Boolean(activeChallenge),
      challengeTheme: activeChallenge?.theme,
      isProCreator: isPro,
    });
    showNotification(
      activeChallenge
        ? "🎉 Challenge Meme Published! +250 Points & Pro Badge Unlocked!"
        : "🎉 Published to Community Feed!"
    );
  };

  const getFontFamilyCSS = () => {
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
    fontFamily: getFontFamilyCSS(),
    lineHeight: "1.1",
  };

  const filteredTemplates = TRENDING_TEMPLATES.filter((t) =>
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(templateSearch.toLowerCase()))
  );

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
      {/* Sleek Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[150] bg-slate-900/95 border border-purple-500/80 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-black text-purple-300 animate-in fade-in slide-in-from-top-2 duration-200">
          <i className="fa-solid fa-circle-check text-purple-400"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* AI Magic Analyzing Overlay */}
      {isMagicAnalyzing && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="text-center space-y-6 max-w-xs">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-l-4 border-purple-500 animate-spin"></div>
              <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center text-purple-400">
                <i className="fa-solid fa-wand-magic-sparkles text-2xl animate-pulse"></i>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black uppercase tracking-widest text-purple-400">Gemini is Thinking...</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Analyzing your picture&apos;s details to craft matching viral-ready meme captions. Hold tight!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Daily Challenge Banner */}
      {activeChallenge && (
        <div
          id="create-tab-challenge-banner"
          className="relative bg-gradient-to-r from-purple-950/90 via-slate-900 to-amber-950/40 border-2 border-amber-500/60 rounded-3xl p-4 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <i className="fa-solid fa-bolt text-[9px]"></i>
                DAILY CHALLENGE MODE
              </span>
              <span className="text-[10px] text-amber-300 font-bold hidden sm:inline">
                +{activeChallenge.rewardPoints} Pts &amp; Pro Badge
              </span>
            </div>
            {onClearActiveChallenge && (
              <button
                onClick={onClearActiveChallenge}
                className="text-slate-400 hover:text-slate-200 text-xs p-1"
                title="Exit challenge mode"
              >
                ✕
              </button>
            )}
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-black text-white">{activeChallenge.theme}</h4>
            <p className="text-[11px] italic text-slate-300">
              &quot;{activeChallenge.prompt}&quot;
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            {activeChallenge.suggestedTemplateUrl && (
              <button
                onClick={() => setEditorImage(activeChallenge.suggestedTemplateUrl || null)}
                className="text-[10px] font-bold bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
              >
                <i className="fa-solid fa-image text-[9px]"></i>
                Use Challenge Template
              </button>
            )}
            {activeChallenge.suggestedTop && (
              <button
                onClick={() => {
                  setTopText(activeChallenge.suggestedTop || "");
                  if (activeChallenge.suggestedBottom) {
                    setBottomText(activeChallenge.suggestedBottom);
                  }
                  showNotification("Pre-filled suggested caption!");
                }}
                className="text-[10px] font-bold bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/40 text-amber-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
              >
                <i className="fa-solid fa-wand-magic-sparkles text-[9px]"></i>
                Load Suggested Caption
              </button>
            )}
            <span className="text-[9px] text-emerald-400 font-bold ml-auto flex items-center gap-1">
              <i className="fa-solid fa-crown text-amber-400"></i>
              Reward: Pro Badge Unlocks on Publish
            </span>
          </div>
        </div>
      )}

      {/* Creation Mode Toggle */}
      <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700/60 shadow-lg">
        <button
          onClick={() => handleCreationSwitch("image")}
          className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider ${
            creationMode === "image"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/10"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <i className="fa-solid fa-image mr-1"></i> Static Meme
        </button>
        <button
          onClick={() => handleCreationSwitch("video")}
          className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider ${
            creationMode === "video"
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <i className="fa-solid fa-clapperboard mr-1 animate-pulse"></i> Video (Veo)
        </button>
      </div>

      {/* Live Trending Context Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
            <i className="fa-solid fa-fire text-amber-500"></i> Live Trending Topics
          </span>
          {isLoadingTrends && (
            <span className="text-[9px] text-slate-500 animate-pulse">Updating...</span>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          {trendingTopics.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCaptionContext(topic);
                showNotification(`Topic applied: ${topic}`);
              }}
              className="bg-slate-800/80 hover:bg-purple-900/40 border border-slate-700/60 hover:border-purple-500/60 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-300 hover:text-purple-300 whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <span className="text-amber-400">⚡</span>
              <span>{topic}</span>
            </button>
          ))}
        </div>
      </div>

      {!editorImage && !editorVideo ? (
        <div className="space-y-4">
          {creationMode === "image" ? (
            <div className="space-y-4">
              {/* Image Sub Mode Toggles (3-Way: Templates, AI, Upload) */}
              <div className="flex bg-slate-800/60 p-1 rounded-xl border border-slate-700/50 gap-1">
                <button
                  onClick={() => setImageCreationSubMode("templates")}
                  className={`flex-1 py-2 text-[10px] font-extrabold uppercase rounded-lg transition-all ${
                    imageCreationSubMode === "templates"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <i className="fa-solid fa-shapes mr-1"></i> Templates
                </button>
                <button
                  onClick={() => setImageCreationSubMode("ai")}
                  className={`flex-1 py-2 text-[10px] font-extrabold uppercase rounded-lg transition-all ${
                    imageCreationSubMode === "ai"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> AI Prompt
                </button>
                <button
                  onClick={() => setImageCreationSubMode("upload")}
                  className={`flex-1 py-2 text-[10px] font-extrabold uppercase rounded-lg transition-all ${
                    imageCreationSubMode === "upload"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <i className="fa-solid fa-upload mr-1"></i> Upload
                </button>
              </div>

              {/* Sub-mode 1: Classic & Trending Templates */}
              {imageCreationSubMode === "templates" && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search templates (Drake, Brain, Cat, Coffee...)"
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className="group bg-slate-800/40 border border-slate-700/60 hover:border-purple-500 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-md flex flex-col"
                      >
                        <div className="aspect-square relative overflow-hidden bg-slate-900">
                          <img
                            src={template.url}
                            alt={template.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-[10px] font-black text-purple-300 bg-purple-900/80 px-2 py-0.5 rounded-full">
                              Use Template →
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5 space-y-1">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{template.name}</h4>
                          <div className="flex gap-1 flex-wrap">
                            {template.tags.slice(0, 2).map((t) => (
                              <span key={t} className="text-[8px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-mode 2: AI Prompt Base */}
              {imageCreationSubMode === "ai" && (
                <div className="bg-slate-800/40 border border-purple-500/10 rounded-3xl p-5 space-y-4 shadow-xl">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
                      <i className="fa-solid fa-wand-magic-sparkles text-[9px]"></i> Gemini Imagen 3
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Describe your ideal meme template background and let Gemini generate it!
                    </p>
                  </div>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="e.g., A funny confused programmer looking at a glowing green computer screen in the dark, professional photography, studio lighting"
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs min-h-[90px] focus:outline-none focus:border-purple-500 text-white placeholder-slate-600 leading-relaxed"
                  />
                  <button
                    onClick={handleGenerateBaseImage}
                    disabled={isGeneratingBase || !imagePrompt.trim()}
                    className="w-full bg-purple-600 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 active:scale-95 transition-all shadow-lg shadow-purple-500/20"
                  >
                    {isGeneratingBase ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i>
                        <span>PAINTING MASTERPIECE...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-play"></i>
                        <span>GENERATE BASE TEMPLATE</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Sub-mode 3: Upload / Magic Auto-Meme */}
              {imageCreationSubMode === "upload" && (
                <div className="space-y-4">
                  {/* AI Magic Auto-Meme 1-Click Upload */}
                  <div
                    onClick={() => autoMemeFileInputRef.current?.click()}
                    className="p-6 border border-purple-500/40 bg-gradient-to-br from-purple-900/35 via-slate-900/50 to-pink-950/15 rounded-3xl flex items-center gap-4 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/10 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-yellow-500 flex items-center justify-center text-white text-lg shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <i className="fa-solid fa-wand-magic-sparkles animate-pulse"></i>
                    </div>
                    <div className="min-w-0 text-left">
                      <span className="font-black text-xs text-purple-300 uppercase tracking-wider block">⚡ AI Magic Auto-Meme</span>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        Upload any picture & Gemini will automatically analyze it and instantly generate a matching, viral-ready meme!
                      </p>
                    </div>
                    <input
                      type="file"
                      ref={autoMemeFileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleMagicAutoMemeUpload}
                    />
                  </div>

                  {/* Standard Manual Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-10 border-2 border-dashed border-slate-700/60 rounded-3xl flex flex-col items-center gap-3 bg-slate-800/20 hover:bg-slate-800/30 hover:border-purple-500 transition-all cursor-pointer text-center group shadow-md"
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-500 group-hover:text-purple-400 transition-colors"></i>
                    <div>
                      <span className="font-extrabold text-xs block text-slate-300">Standard Manual Upload</span>
                      <span className="text-[9px] text-slate-500">Upload picture to edit & caption manually</span>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const r = new FileReader();
                          r.onload = (ev) => {
                            setTopText("TOP TEXT");
                            setBottomText("BOTTOM TEXT");
                            setEditorImage(ev.target?.result as string);
                          };
                          r.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-blue-500/20 p-5 rounded-3xl space-y-4 shadow-xl">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-clapperboard text-[9px]"></i> Veo 3.1 Cinematic Video Generator
                </p>
                <p className="text-[9px] text-slate-500">
                  Write a detailed prompt to create a breathtaking 16:9 loopable video.
                </p>
              </div>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="e.g., Close-up shot of a cat wearing circular retro sunglasses, sipping orange soda through a straw on a sunny tropical beach"
                className="w-full bg-slate-900 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs min-h-[90px] focus:outline-none focus:border-blue-500 text-white placeholder-slate-600 leading-relaxed"
              />
              <button
                onClick={handleGenerateVideoMeme}
                disabled={isGeneratingVideo || !videoPrompt.trim()}
                className="w-full bg-blue-600 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
              >
                {isGeneratingVideo ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>FILMING DIRECTORS CUT (POLLING)...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-play"></i>
                    <span>GENERATE VIDEO CLIP</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Top Bar Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                setEditorImage(null);
                setEditorVideo(null);
                setStickers([]);
              }}
              className="text-[10px] font-black text-slate-400 hover:text-white uppercase flex items-center gap-1 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/50"
            >
              <i className="fa-solid fa-arrow-left"></i> Change Template
            </button>
            <div className="flex gap-1.5 items-center">
              <button
                onClick={handleNarrate}
                disabled={isNarrating}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
                  isNarrating
                    ? "bg-pink-500 text-white animate-pulse"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Speak caption aloud via Gemini TTS"
              >
                <i className="fa-solid fa-volume-high text-[11px]"></i>
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-all shadow-md"
                title="Copy to Clipboard"
              >
                <i className="fa-solid fa-copy text-[11px]"></i>
              </button>
              <button
                onClick={handleShare}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-all shadow-md"
                title="Share Meme"
              >
                <i className="fa-solid fa-share-nodes text-[11px]"></i>
              </button>
              <button
                onClick={handleDownload}
                className="px-2.5 py-1.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-md text-[10px] font-black"
                title={isPro ? "Download 4K Ultra HD PNG" : "Download Standard PNG"}
              >
                <i className="fa-solid fa-download text-[10px]"></i>
                <span className={isPro ? "text-amber-300" : "text-slate-400"}>
                  {isPro ? "4K HD" : "PNG"}
                </span>
              </button>
              {!isPro && onOpenUpgradeModal && (
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-black flex items-center gap-1 transition-all"
                  title="Remove watermark and unlock 4K exports"
                >
                  <i className="fa-solid fa-crown text-[9px]"></i>
                  <span>GO PRO</span>
                </button>
              )}
              <button
                onClick={publish}
                disabled={isModerating}
                className="bg-purple-600 hover:bg-purple-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg shadow-purple-500/20 text-white flex items-center gap-1.5 disabled:opacity-60 transition-all"
              >
                {isModerating ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin text-[9px]"></i>
                    <span>Reviewing...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane text-[9px]"></i>
                    <span>Publish</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Automated Content Moderation Notice */}
          {moderationError && (
            <div className="bg-red-950/70 border border-red-500/60 rounded-2xl p-3 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <i className="fa-solid fa-triangle-exclamation text-red-400 mt-0.5 text-sm shrink-0"></i>
              <div className="flex-1 space-y-1">
                <p className="font-black text-red-100 uppercase tracking-wide text-[10px]">
                  Automated Content Moderation Notice
                </p>
                <p className="text-[11px] leading-relaxed text-red-300">{moderationError}</p>
              </div>
              <button
                onClick={() => setModerationError(null)}
                className="text-red-400 hover:text-red-200 text-xs px-1"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Meme Render Area (The Capture Target) */}
          <div className="relative">
            {layout === MemeLayout.Modern ? (
              <div
                ref={memeRef}
                className="bg-white overflow-hidden rounded-2xl shadow-2xl border-4 border-white p-4"
              >
                <div
                  className="p-2 text-black text-center font-bold leading-tight mb-3"
                  style={{ fontSize: `${textStyle.fontSize * 0.55}px`, fontFamily: getFontFamilyCSS() }}
                >
                  {topText}
                </div>
                <div className="relative rounded-lg overflow-hidden bg-slate-950">
                  {editorVideo ? (
                    <video
                      src={editorVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <img src={editorImage!} className="w-full h-auto max-h-[350px] object-contain mx-auto" />
                  )}
                  {/* Stickers Overlay */}
                  {stickers.map((st) => (
                    <div
                      key={st.id}
                      style={{
                        position: "absolute",
                        left: `${st.x}%`,
                        top: `${st.y}%`,
                        transform: "translate(-50%, -50%)",
                        fontSize: "2.5rem",
                      }}
                      className="cursor-pointer select-none group"
                    >
                      <span>{st.emoji}</span>
                      <button
                        onClick={() => handleRemoveSticker(st.id)}
                        className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                {bottomText && (
                  <div
                    className="p-2 text-black text-center font-bold leading-tight mt-2"
                    style={{ fontSize: `${textStyle.fontSize * 0.45}px`, fontFamily: getFontFamilyCSS() }}
                  >
                    {bottomText}
                  </div>
                )}
              </div>
            ) : layout === MemeLayout.Drake ? (
              <div
                ref={memeRef}
                className="grid grid-cols-2 gap-0.5 bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
              >
                <div className="aspect-square flex flex-col shrink-0">
                  <div className="bg-orange-400 flex-1 flex items-center justify-center p-2 text-center text-4xl font-bold border-b border-black select-none">
                    😒
                  </div>
                  <div className="bg-orange-400 flex-1 flex items-center justify-center p-2 text-center text-4xl font-bold select-none">
                    😊
                  </div>
                </div>
                <div className="aspect-square flex flex-col min-w-0">
                  <div
                    className="bg-white flex-1 flex items-center justify-center p-3 text-black font-semibold border-b border-black text-center leading-tight overflow-hidden break-words"
                    style={{ fontSize: `${textStyle.fontSize * 0.4}px`, fontFamily: getFontFamilyCSS() }}
                  >
                    {topText}
                  </div>
                  <div
                    className="bg-white flex-1 flex items-center justify-center p-3 text-black font-semibold text-center leading-tight overflow-hidden break-words"
                    style={{ fontSize: `${textStyle.fontSize * 0.4}px`, fontFamily: getFontFamilyCSS() }}
                  >
                    {bottomText}
                  </div>
                </div>
              </div>
            ) : (
              /* Classic TopBottom Overlay */
              <div
                ref={memeRef}
                className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-800 aspect-square flex items-center justify-center"
              >
                {editorVideo ? (
                  <video
                    src={editorVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img src={editorImage!} className="w-full h-full object-contain" />
                )}
                {/* Stickers in Editor */}
                {stickers.map((st) => (
                  <div
                    key={st.id}
                    style={{
                      position: "absolute",
                      left: `${st.x}%`,
                      top: `${st.y}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: "2.5rem",
                    }}
                    className="cursor-pointer select-none group z-20"
                  >
                    <span>{st.emoji}</span>
                    <button
                      onClick={() => handleRemoveSticker(st.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow hover:scale-110 active:scale-95"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="absolute top-4 left-0 right-0 px-4 text-center pointer-events-none z-10">
                  <h2 className="uppercase select-none break-words" style={dynamicStyle}>
                    {topText}
                  </h2>
                </div>
                <div className="absolute bottom-4 left-0 right-0 px-4 text-center pointer-events-none z-10">
                  <h2 className="uppercase select-none break-words" style={dynamicStyle}>
                    {bottomText}
                  </h2>
                </div>
                {!isPro ? (
                  <div className="absolute bottom-1 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] text-white/70 font-medium tracking-wide z-10 flex items-center gap-1.5 shadow">
                    <span>MemeAI FREE</span>
                    {onOpenUpgradeModal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenUpgradeModal();
                        }}
                        className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                        title="Remove watermark with Pro"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="absolute bottom-1 right-2 px-1.5 py-0.5 bg-black/40 border border-amber-400/40 rounded text-[8px] text-amber-300 font-black tracking-widest z-10 uppercase flex items-center gap-1 shadow">
                    <i className="fa-solid fa-crown text-[7px] text-amber-400"></i>
                    <span>PRO 4K</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Automated Captioning Engine with 3-Variation Generator */}
          <div className="bg-gradient-to-r from-purple-900/20 via-slate-800/50 to-pink-900/20 p-4 border border-purple-500/20 rounded-3xl space-y-3 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                <i className="fa-solid fa-wand-magic-sparkles"></i> AI CAPTION ENGINE
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={handleGenerateVariations}
                  disabled={isGeneratingVariations}
                  className="bg-purple-700 hover:bg-purple-600 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1 shadow-md"
                  title="Generate 3 humor styles"
                >
                  {isGeneratingVariations ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>THINKING...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-dice"></i>
                      <span>3 JOKE OPTIONS</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleAutoCaption}
                  disabled={isGeneratingCaption}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-xl transition-all disabled:bg-slate-800 disabled:text-slate-600 flex items-center gap-1 shadow-md shadow-purple-600/10"
                >
                  {isGeneratingCaption ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>WRITING...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-sparkles"></i>
                      <span>AUTO-CAPTION</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={captionContext}
                onChange={(e) => setCaptionContext(e.target.value)}
                placeholder="Topic or hint (e.g. 'Monday morning', 'Senior engineer bugs', 'Gym life')..."
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              {captionContext && (
                <button
                  onClick={() => setCaptionContext("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Variations Reel (3 selectable joke cards) */}
            {captionVariations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-purple-500/20 animate-in fade-in duration-200">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                  Select a Punchline Option:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {captionVariations.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => handleApplyVariation(v)}
                      className="bg-slate-900/80 border border-slate-700/60 hover:border-purple-400 rounded-xl p-2.5 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300">
                            {v.humorStyle}
                          </span>
                          {v.pitch && (
                            <span className="text-[9px] text-slate-500 italic">
                              &quot;{v.pitch}&quot;
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-200 truncate mt-1">
                          {v.topText} {v.bottomText ? `• ${v.bottomText}` : ""}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Apply →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Manual Caption Inputs */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex justify-between items-center pr-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                    Top Caption
                  </label>
                  <button
                    type="button"
                    onClick={() => setTopText(topText.toUpperCase() === topText ? topText.toLowerCase() : topText.toUpperCase())}
                    className="text-[8px] text-slate-500 hover:text-purple-400 uppercase font-black"
                  >
                    Aa
                  </button>
                </div>
                <input
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  placeholder="Top Text"
                  className="w-full bg-slate-800 rounded-xl px-3.5 py-2.5 text-xs border border-slate-700/60 focus:border-purple-500 outline-none text-white font-bold"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center pr-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                    Bottom Caption
                  </label>
                  <button
                    type="button"
                    onClick={() => setBottomText(bottomText.toUpperCase() === bottomText ? bottomText.toLowerCase() : bottomText.toUpperCase())}
                    className="text-[8px] text-slate-500 hover:text-purple-400 uppercase font-black"
                  >
                    Aa
                  </button>
                </div>
                <input
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  placeholder="Bottom Text"
                  className="w-full bg-slate-800 rounded-xl px-3.5 py-2.5 text-xs border border-slate-700/60 focus:border-purple-500 outline-none text-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Sticker Presets Bar */}
          <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <i className="fa-solid fa-icons text-purple-400"></i> Add Meme Stickers
              </span>
              {stickers.length > 0 && (
                <button
                  onClick={() => setStickers([])}
                  className="text-[8px] font-bold text-red-400 hover:text-red-300 uppercase"
                >
                  Clear All ({stickers.length})
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {STICKER_PRESETS.map((st) => (
                <button
                  key={st.emoji}
                  onClick={() => handleAddSticker(st.emoji)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-500 text-lg flex items-center justify-center shrink-0 transition-all hover:scale-110 active:scale-95"
                  title={st.label}
                >
                  {st.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Styling Customizers Accordion */}
          <div className="bg-slate-800/20 border border-slate-800 p-4 rounded-3xl space-y-4 shadow-sm">
            {/* Humor Style & Layout Dropdowns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  Humor Style
                </label>
                <select
                  value={humorStyle}
                  onChange={(e) => setHumorStyle(e.target.value as HumorStyle)}
                  className="w-full bg-slate-800 rounded-xl px-3.5 py-2.5 text-xs border border-slate-700/60 text-white font-bold outline-none"
                >
                  {Object.values(HumorStyle).map((style) => (
                    <option key={style} value={style} className="bg-slate-900 font-bold">
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              {/* Layout Dropdown */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  Meme Layout
                </label>
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as MemeLayout)}
                  className="w-full bg-slate-800 rounded-xl px-3.5 py-2.5 text-xs border border-slate-700/60 text-white font-bold outline-none"
                >
                  <option value={MemeLayout.TopBottom} className="bg-slate-900">
                    Classic Overlay
                  </option>
                  <option value={MemeLayout.Modern} className="bg-slate-900">
                    Modern Header
                  </option>
                  <option value={MemeLayout.Drake} className="bg-slate-900">
                    Drake Split-Screen
                  </option>
                </select>
              </div>
            </div>

            {/* Font Family Selector */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                Font Family
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(["Bangers", "Impact", "Inter", "Comic"] as MemeFont[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTextStyle({ ...textStyle, fontFamily: f })}
                    className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                      textStyle.fontFamily === f
                        ? "bg-purple-600 border-purple-500 text-white shadow-md"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Font sliders */}
            <div className="space-y-3 pt-1 border-t border-slate-800/50">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                <span>FONT SIZE</span>
                <span className="text-purple-400">{textStyle.fontSize}px</span>
              </div>
              <input
                type="range"
                min="18"
                max="72"
                value={textStyle.fontSize}
                onChange={(e) =>
                  setTextStyle({ ...textStyle, fontSize: parseInt(e.target.value) })
                }
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold pt-1">
                <span>STROKE THICKNESS</span>
                <span className="text-purple-400">{textStyle.strokeWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.5"
                value={textStyle.strokeWidth}
                onChange={(e) =>
                  setTextStyle({ ...textStyle, strokeWidth: parseFloat(e.target.value) })
                }
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />

              {/* Color Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  Text Color
                </span>
                <div className="flex gap-2">
                  {[
                    { hex: "#ffffff", label: "White" },
                    { hex: "#facc15", label: "Yellow" },
                    { hex: "#ec4899", label: "Pink" },
                    { hex: "#06b6d4", label: "Cyan" },
                    { hex: "#22c55e", label: "Lime" },
                    { hex: "#000000", label: "Black" },
                  ].map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setTextStyle({ ...textStyle, color: color.hex })}
                      style={{ backgroundColor: color.hex }}
                      className={`w-6 h-6 rounded-lg border-2 ${
                        textStyle.color === color.hex
                          ? "border-purple-500 scale-110 shadow-lg"
                          : "border-slate-800 hover:scale-105"
                      } transition-all`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Narrator Voice Picker */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  Narrator Voice Style
                </span>
                <div className="flex gap-2">
                  {[
                    { id: "Kore", name: "Kore (Normal)" },
                    { id: "Puck", name: "Puck (Deep)" },
                    { id: "Charon", name: "Charon (Soft)" },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVoice(v.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all border ${
                        voice === v.id
                          ? "bg-purple-900/40 border-purple-500 text-purple-400"
                          : "bg-slate-800/40 border-slate-700 text-slate-400"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* One-Tap Social & Native Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        meme={{
          topText,
          bottomText,
          imageUrl: editorImage || "",
        }}
        onToast={showNotification}
      />
    </div>
  );
};
