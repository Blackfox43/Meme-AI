import React, { useState, useMemo } from "react";
import { Meme, HumorStyle } from "../types";
import { MemeCanvas } from "./MemeCanvas";
import { ShareModal } from "./ShareModal";

interface FeedTabProps {
  feed: Meme[];
  onLike: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onComment: (id: string, text: string) => void;
  onRemix: (meme: Meme) => void;
  onDelete?: (id: string) => void;
  currentUser?: string;
  isPro: boolean;
  onToast?: (message: string) => void;
}

const REACTION_EMOJIS = [
  { emoji: "🔥", label: "Fire" },
  { emoji: "😂", label: "LOL" },
  { emoji: "💀", label: "Dead" },
  { emoji: "💩", label: "Shitpost" },
  { emoji: "🧠", label: "Galaxy Brain" },
];

export const FeedTab: React.FC<FeedTabProps> = ({
  feed,
  onLike,
  onReact,
  onComment,
  onRemix,
  onDelete,
  currentUser = "MemePioneer",
  isPro,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string>("All");
  const [expandedCommentMemeId, setExpandedCommentMemeId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [sharingMeme, setSharingMeme] = useState<Meme | null>(null);

  // Helper to extract embedded hashtags from text
  const extractHashtags = (text?: string): string[] => {
    if (!text) return [];
    const matches = text.match(/#[a-zA-Z0-9_]+/g);
    return matches ? matches.map((m) => m.toLowerCase()) : [];
  };

  // Helper to get all normalized tags for a meme (explicit tags + text hashtags + style)
  const getMemeTags = (meme: Meme): string[] => {
    const explicit = (meme.tags || []).map((t) =>
      t.startsWith("#") ? t.toLowerCase() : `#${t.toLowerCase()}`
    );
    const fromTop = extractHashtags(meme.topText);
    const fromBottom = extractHashtags(meme.bottomText);
    const set = new Set([...explicit, ...fromTop, ...fromBottom]);
    if (set.size === 0 && meme.humorStyle) {
      set.add(`#${meme.humorStyle.toLowerCase()}`);
    }
    return Array.from(set);
  };

  // Real-time filtered feed
  const filteredFeed = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return feed.filter((meme) => {
      // 1. Humor style category filter
      const matchesStyle = selectedStyle === "All" || meme.humorStyle === selectedStyle;
      if (!matchesStyle) return false;

      // If no search term, match all within the selected style
      if (!query) return true;

      // 2. Caption content filter (topText & bottomText)
      const topLower = (meme.topText || "").toLowerCase();
      const bottomLower = (meme.bottomText || "").toLowerCase();
      const matchesCaption = topLower.includes(query) || bottomLower.includes(query);

      // 3. Creator name filter (supports searching with or without '@', e.g. "DevGod" or "@DevGod")
      const creatorRaw = (meme.creator || "").toLowerCase();
      const creatorClean = creatorRaw.replace(/^@/, "");
      const queryClean = query.replace(/^@/, "");
      const matchesCreator =
        creatorRaw.includes(query) ||
        creatorClean.includes(queryClean) ||
        creatorRaw.includes(queryClean);

      // 4. Hashtag filter (matches explicit tags and caption hashtags with or without '#')
      const tags = getMemeTags(meme);
      const queryTag = query.startsWith("#") ? query : `#${query}`;
      const queryTagRaw = query.replace(/^#/, "");
      const matchesHashtags = tags.some((t) => {
        const tagRaw = t.replace(/^#/, "");
        return t.includes(query) || t.includes(queryTag) || tagRaw.includes(queryTagRaw);
      });

      return matchesCaption || matchesCreator || matchesHashtags;
    });
  }, [feed, searchTerm, selectedStyle]);

  // Aggregated popular hashtags for instant quick filtering
  const popularHashtags = useMemo(() => {
    const tagCount: Record<string, number> = {};
    feed.forEach((m) => {
      getMemeTags(m).forEach((t) => {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });

    const discovered = Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]);
    // Seed defaults if feed has few tags
    const fallbackTags = ["#coding", "#relatable", "#ai", "#work", "#sarcastic", "#devlife"];
    const allPills = Array.from(new Set([...discovered, ...fallbackTags]));
    return allPills.slice(0, 8);
  }, [feed]);

  const handleSendComment = (memeId: string) => {
    const text = commentInputs[memeId]?.trim();
    if (!text) return;
    onComment(memeId, text);
    setCommentInputs((prev) => ({ ...prev, [memeId]: "" }));
    if (onToast) onToast("Comment added! 💬");
  };

  const handleShareMeme = (meme: Meme) => {
    setSharingMeme(meme);
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
      {/* Search and Filters Section */}
      <div id="feed-search-section" className="space-y-3">
        {/* Real-time Search Bar */}
        <div id="feed-search-bar" className="relative group">
          <input
            id="feed-search-input"
            type="text"
            placeholder="Search captions, @creators, or #hashtags in real-time..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl pl-11 pr-11 py-3 text-xs focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all text-white placeholder-slate-400 shadow-inner"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-xs group-focus-within:text-purple-300"></i>
          {searchTerm && (
            <button
              id="feed-search-clear-btn"
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center text-[10px] transition-all"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Hashtag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 shrink-0">
            <i className="fa-solid fa-hashtag text-[9px] text-purple-400"></i> Tags:
          </span>
          {popularHashtags.map((tag) => {
            const isTagActive = searchTerm.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                id={`feed-tag-filter-${tag.replace(/[^a-zA-Z0-9]/g, "")}`}
                onClick={() => setSearchTerm(isTagActive ? "" : tag)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border active:scale-95 ${
                  isTagActive
                    ? "bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-600/30 scale-105"
                    : "bg-slate-800/60 border-slate-700/50 text-purple-300 hover:border-purple-500/50 hover:bg-slate-800"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Filter Badges & Results Counter */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <div className="flex gap-1.5">
            {["All", ...Object.values(HumorStyle)].map((style) => (
              <button
                key={style}
                id={`feed-style-filter-${style.toLowerCase()}`}
                onClick={() => setSelectedStyle(style)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap border active:scale-95 ${
                  selectedStyle === style
                    ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                    : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600"
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          {(searchTerm || selectedStyle !== "All") && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-semibold text-slate-400">
                {filteredFeed.length} {filteredFeed.length === 1 ? "meme" : "memes"}
              </span>
              <button
                id="feed-search-reset-btn"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStyle("All");
                }}
                className="text-[10px] text-purple-400 hover:text-purple-300 underline font-semibold"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feed List */}
      <div id="feed-memes-container" className="space-y-6">
        {filteredFeed.length === 0 ? (
          <div
            id="feed-no-results-state"
            className="py-14 text-center text-slate-500 italic space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800/70 p-6"
          >
            <i className="fa-solid fa-filter-circle-xmark text-4xl text-slate-600 animate-pulse"></i>
            <p className="text-sm font-semibold text-slate-300">
              {searchTerm ? `No memes found matching "${searchTerm}"` : "No memes in this category yet."}
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Try searching for caption text, a creator name (e.g. @DevGod), or hashtags (e.g. #coding).
            </p>
            {(searchTerm || selectedStyle !== "All") && (
              <button
                id="feed-search-empty-clear-btn"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStyle("All");
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md mt-2"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          filteredFeed.map((meme, idx) => {
            const isMyMeme =
              meme.creator.toLowerCase() === currentUser.toLowerCase() || meme.creator === "You";
            const commentsList = meme.comments || [];
            const isCommentsExpanded = expandedCommentMemeId === meme.id;
            const memeTags = getMemeTags(meme);

            return (
              <div
                key={`${meme.id}-${idx}`}
                id={`feed-meme-card-${meme.id}`}
                className="bg-slate-800/40 rounded-3xl p-4 border border-slate-700/50 space-y-3.5 hover:border-purple-500/40 transition-all duration-300 shadow-xl"
              >
                {/* Creator Info Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setSearchTerm(`@${meme.creator}`)}
                      className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black shadow-md border border-purple-400/20 text-white hover:scale-105 transition-transform"
                      title={`Filter by @${meme.creator}`}
                    >
                      {meme.creator ? meme.creator[0].toUpperCase() : "?"}
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setSearchTerm(`@${meme.creator}`)}
                          className="font-extrabold text-xs text-slate-200 hover:text-purple-300 transition-colors text-left"
                        >
                          @{meme.creator}
                        </button>
                        {(meme.isProCreator || (isMyMeme && isPro)) && (
                          <span
                            className="text-[8px] bg-gradient-to-r from-amber-400/20 to-yellow-500/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-0.5 shadow-sm"
                            title="MemeAI Pro Creator"
                          >
                            <i className="fa-solid fa-crown text-[7px] text-amber-400"></i>
                            PRO
                          </span>
                        )}
                        {isMyMeme && (
                          <span className="text-[8px] bg-purple-900/80 text-purple-300 px-1.5 py-0.5 rounded font-bold uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-500">
                        {new Date(meme.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedStyle(meme.humorStyle)}
                      className="text-[9px] px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-full font-bold text-purple-400 uppercase tracking-wider transition-colors"
                      title={`Filter by ${meme.humorStyle}`}
                    >
                      {meme.humorStyle}
                    </button>
                    {isMyMeme && onDelete && (
                      <button
                        id={`feed-delete-meme-${meme.id}`}
                        onClick={() => {
                          if (confirm("Delete this meme?")) {
                            onDelete(meme.id);
                          }
                        }}
                        className="text-slate-500 hover:text-red-400 text-xs p-1 transition-colors"
                        title="Delete meme"
                      >
                        <i className="fa-solid fa-trash-can text-[11px]"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Canvas Preview */}
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                  <MemeCanvas {...meme} isPro={Boolean(meme.isProCreator || (isMyMeme && isPro))} />
                </div>

                {/* Interactive Hashtags Row */}
                {memeTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {memeTags.map((tag) => {
                      const isActive = searchTerm.toLowerCase() === tag.toLowerCase();
                      return (
                        <button
                          key={tag}
                          id={`feed-meme-${meme.id}-tag-${tag.replace(/[^a-zA-Z0-9]/g, "")}`}
                          onClick={() => setSearchTerm(isActive ? "" : tag)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all active:scale-95 border ${
                            isActive
                              ? "bg-purple-600 border-purple-400 text-white shadow-sm"
                              : "bg-purple-950/40 hover:bg-purple-900/60 border-purple-800/40 text-purple-300 hover:text-purple-100"
                          }`}
                          title={`Filter by ${tag}`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Interactive Emoji Reactions Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {REACTION_EMOJIS.map((r) => {
                    const count = meme.reactions?.[r.emoji] || 0;
                    return (
                      <button
                        key={r.emoji}
                        id={`feed-reaction-${meme.id}-${r.label.toLowerCase()}`}
                        onClick={() => onReact(meme.id, r.emoji)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all active:scale-90 ${
                          count > 0
                            ? "bg-slate-800 border-purple-500/60 text-purple-300 shadow-sm"
                            : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600"
                        }`}
                        title={r.label}
                      >
                        <span>{r.emoji}</span>
                        {count > 0 && <span className="text-[10px]">{count}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Primary Action Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-4">
                    {/* Likes */}
                    <button
                      id={`feed-like-btn-${meme.id}`}
                      onClick={() => onLike(meme.id)}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-pink-500 active:scale-90 transition-all font-bold text-xs"
                    >
                      <i className="fa-solid fa-heart text-pink-500"></i>
                      <span>{meme.likes}</span>
                    </button>

                    {/* Comments Toggle */}
                    <button
                      id={`feed-comments-toggle-${meme.id}`}
                      onClick={() =>
                        setExpandedCommentMemeId(isCommentsExpanded ? null : meme.id)
                      }
                      className={`flex items-center gap-1.5 font-bold text-xs transition-colors ${
                        isCommentsExpanded ? "text-purple-400" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <i className="fa-regular fa-comment"></i>
                      <span>{commentsList.length}</span>
                    </button>

                    {/* Share */}
                    <button
                      id={`feed-share-btn-${meme.id}`}
                      onClick={() => handleShareMeme(meme)}
                      className="flex items-center gap-1 text-slate-400 hover:text-blue-400 font-bold text-xs transition-colors"
                      title="Share Meme"
                    >
                      <i className="fa-solid fa-share-nodes"></i>
                    </button>
                  </div>

                  {/* Remix CTA */}
                  <button
                    id={`feed-remix-btn-${meme.id}`}
                    onClick={() => onRemix(meme)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 rounded-xl text-purple-300 hover:text-white font-black text-xs transition-all shadow-sm active:scale-95"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
                    <span>Remix</span>
                  </button>
                </div>

                {/* Expandable Comments Drawer */}
                {isCommentsExpanded && (
                  <div
                    id={`feed-comments-drawer-${meme.id}`}
                    className="pt-3 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-200"
                  >
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {commentsList.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic py-2 text-center">
                          No comments yet. Drop the first joke!
                        </p>
                      ) : (
                        commentsList.map((c) => (
                          <div
                            key={c.id}
                            className="bg-slate-900/70 border border-slate-800 rounded-xl p-2 text-left space-y-0.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-purple-300">
                                @{c.author}
                              </span>
                              <span className="text-[8px] text-slate-600">
                                {new Date(c.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 break-words">{c.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Inline Comment Input */}
                    <div className="flex gap-2">
                      <input
                        id={`feed-comment-input-${meme.id}`}
                        type="text"
                        placeholder="Add a funny comment..."
                        value={commentInputs[meme.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [meme.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendComment(meme.id);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        id={`feed-comment-post-btn-${meme.id}`}
                        onClick={() => handleSendComment(meme.id)}
                        disabled={!commentInputs[meme.id]?.trim()}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* One-Tap Social & Native Share Modal */}
      <ShareModal
        isOpen={Boolean(sharingMeme)}
        onClose={() => setSharingMeme(null)}
        meme={sharingMeme}
        onToast={onToast || (() => {})}
      />
    </div>
  );
};

