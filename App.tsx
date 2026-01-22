
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { HumorStyle, MemeLayout, Meme, UserSettings, FeedItem, Ad } from './types';
import { MOCK_FEED, MOCK_ADS } from './constants';
import { MemeCanvas } from './components/MemeCanvas';
import { SponsoredPost } from './components/SponsoredPost';
import { geminiService } from './services/geminiService';

declare global {
  interface Window {
    html2canvas: any;
  }
}

const AI_PROMPT_SUGGESTIONS = [
  "A cyberpunk cat hacking a neon mainframe",
  "A tiny hamster holding a giant pizza slice",
  "Medieval knight struggling with a self-checkout",
  "Gold retriever as a professional chef",
  "Robots having a picnic on Mars"
];

const DEFAULT_SETTINGS: UserSettings = {
  handle: 'MemeCreator_42',
  isPro: false,
  hasOnboarded: false,
  theme: 'dark',
  blockedCreators: []
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'create' | 'leaders' | 'profile' | 'settings'>('feed');
  const [feed, setFeed] = useState<Meme[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  
  // Editor State
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [topText, setTopText] = useState('Top Text');
  const [bottomText, setBottomText] = useState('Bottom Text');
  const [humorStyle, setHumorStyle] = useState<HumorStyle>(HumorStyle.Relatable);
  const [layout, setLayout] = useState<MemeLayout>(MemeLayout.TopBottom);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Memoized current interstitial ad
  const currentAd = useMemo(() => MOCK_ADS[Math.floor(Math.random() * MOCK_ADS.length)], [isGenerating, isGeneratingImage]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const memeRef = useRef<HTMLDivElement>(null);

  // Stats for the Profile
  const userMemes = useMemo(() => 
    feed.filter(m => m.creator === settings.handle), 
    [feed, settings.handle]
  );
  
  const totalImpact = useMemo(() => 
    userMemes.reduce((acc, m) => acc + m.likes, 0), 
    [userMemes]
  );

  // Filter out content from blocked creators and interleave ads
  const processedFeed = useMemo(() => {
    const visibleMemes = feed.filter(m => !settings.blockedCreators.includes(m.creator));
    
    if (settings.isPro) return visibleMemes;
    
    const items: FeedItem[] = [];
    visibleMemes.forEach((meme, index) => {
      items.push(meme);
      if ((index + 1) % 2 === 0) {
        const adIndex = (Math.floor(index / 2)) % MOCK_ADS.length;
        items.push(MOCK_ADS[adIndex]);
      }
    });
    return items;
  }, [feed, settings.isPro, settings.blockedCreators]);

  useEffect(() => {
    const savedFeed = localStorage.getItem('memeai_feed_v5');
    const savedSettings = localStorage.getItem('memeai_settings_v5');
    if (savedFeed) setFeed(JSON.parse(savedFeed));
    else setFeed(MOCK_FEED);
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    localStorage.setItem('memeai_feed_v5', JSON.stringify(feed));
    localStorage.setItem('memeai_settings_v5', JSON.stringify(settings));
  }, [feed, settings]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditorImage(event.target?.result as string);
        setActiveTab('create');
        generateCaptions(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAIBaseImage = async () => {
    if (!aiImagePrompt.trim()) return;
    setIsGeneratingImage(true);
    try {
      const img = await geminiService.generateBaseImage(aiImagePrompt);
      if (img) {
        setEditorImage(img);
        await generateCaptions(img);
      }
    } catch (err) {
      alert("AI Studio is busy.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateCaptions = async (forcedImage?: string) => {
    const targetImage = forcedImage || editorImage;
    if (!targetImage) return;
    setIsGenerating(true);
    try {
      const result = await geminiService.generateMemeCaption(targetImage, humorStyle, userPrompt);
      setTopText(result.topText);
      setBottomText(result.bottomText);
    } catch (err) {
      setTopText("AI Engine Error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!memeRef.current || !window.html2canvas) return;
    setIsDownloading(true);
    try {
      const canvas = await window.html2canvas(memeRef.current, { useCORS: true, scale: 2 });
      const link = document.createElement('a');
      link.download = `MemeAI_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      alert('Error rendering image.');
    } finally {
      setIsDownloading(false);
    }
  };

  const publishMeme = () => {
    if (!editorImage) return;
    const newMeme: Meme = {
      id: Date.now().toString(),
      imageUrl: editorImage,
      topText,
      bottomText,
      humorStyle,
      layout,
      likes: 0,
      creator: settings.handle,
      timestamp: Date.now(),
      isProMeme: settings.isPro,
      type: 'meme'
    };
    setFeed([newMeme, ...feed]);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      setActiveTab('feed');
      setEditorImage(null);
    }, 1500);
  };

  const blockCreator = (creator: string) => {
    if (creator === settings.handle) return;
    setSettings(s => ({ ...s, blockedCreators: [...s.blockedCreators, creator] }));
    setActiveMenu(null);
    alert(`User @${creator} blocked. They won't appear in your feed anymore.`);
  };

  const reportPost = (memeId: string) => {
    alert("Post reported to moderation. We'll review it within 24 hours.");
    setActiveMenu(null);
  };

  const isAnyAiTaskRunning = isGenerating || isGeneratingImage;

  return (
    <Layout activeTab={activeTab as any} setActiveTab={setActiveTab as any} isPro={settings.isPro}>
      {/* AI Processing Overlay */}
      {isAnyAiTaskRunning && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-2xl px-8 text-center animate-in fade-in">
          <div className="relative mb-10">
            <div className="w-44 h-44 rounded-full bg-gradient-to-tr from-purple-500 via-blue-500 to-pink-500 magic-ring opacity-30"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-wand-magic-sparkles text-5xl text-white animate-pulse"></i>
            </div>
          </div>
          <h3 className="text-xl font-black italic tracking-tight uppercase mb-2">Engines Firing</h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Crafting viral potential...</p>
          {!settings.isPro && (
            <div className="mt-12 w-full max-w-sm p-6 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-4">Sponsored Message</span>
              <div className="flex items-center gap-4 text-left">
                <img src={currentAd.imageUrl} className="w-14 h-14 rounded-xl object-cover" alt="ad" />
                <div>
                  <h4 className="text-xs font-black uppercase text-white">{currentAd.title}</h4>
                  <p className="text-[9px] text-slate-400 mt-1">{currentAd.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-indigo-600/90 backdrop-blur-3xl animate-in zoom-in">
           <div className="text-center">
             <i className="fa-solid fa-crown text-9xl text-white animate-bounce mb-4 block"></i>
             <h2 className="text-5xl font-black italic tracking-tighter uppercase">VIRAL HIT!</h2>
           </div>
        </div>
      )}

      {/* Onboarding */}
      {!settings.hasOnboarded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl">
          <div className="bg-slate-900 border border-slate-800 rounded-[4rem] p-12 text-center shadow-2xl max-w-sm">
             <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-purple-500 to-pink-500 mx-auto flex items-center justify-center text-5xl mb-8">⚡</div>
             <h2 className="text-4xl font-black italic uppercase mb-4 leading-tight">MemeAI</h2>
             <p className="text-slate-400 text-sm mb-10">Instant AI memes for the digital age.</p>
             <button onClick={() => setSettings(s => ({ ...s, hasOnboarded: true }))} className="w-full bg-white text-slate-950 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs">LAUNCH STUDIO</button>
          </div>
        </div>
      )}

      {/* Feed */}
      {activeTab === 'feed' && (
        <div className="p-4 space-y-10 pb-32">
          <div className="flex items-center justify-between pt-safe px-2">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">LIVE SIGNAL</h2>
            <div className="bg-white/10 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">GLOBAL</div>
          </div>
          
          {processedFeed.map((item, idx) => {
            if (item.type === 'ad') return <SponsoredPost key={`ad-${item.id}-${idx}`} ad={item as Ad} onUpgrade={() => setActiveTab('settings')} />;
            
            const meme = item as Meme;
            return (
              <div key={meme.id} className="bg-slate-800/30 rounded-[3rem] p-6 border border-slate-700/20 space-y-5 backdrop-blur-md relative">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[1rem] bg-slate-700 flex items-center justify-center font-black">{meme.creator[0].toUpperCase()}</div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-black text-sm block">@{meme.creator}</span>
                        {meme.isProMeme && <i className="fa-solid fa-circle-check text-blue-400 text-[10px]"></i>}
                      </div>
                      <span className="text-[8px] text-slate-500 uppercase font-black">{new Date(meme.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  {/* UGC Options Menu */}
                  <div className="relative">
                    <button onClick={() => setActiveMenu(activeMenu === meme.id ? null : meme.id)} className="w-10 h-10 text-slate-600 hover:text-white"><i className="fa-solid fa-ellipsis-v"></i></button>
                    {activeMenu === meme.id && (
                      <div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <button onClick={() => reportPost(meme.id)} className="w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-orange-400 hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-flag text-xs"></i> Report Post</button>
                        <button onClick={() => blockCreator(meme.creator)} className="w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-slate-800 flex items-center gap-3 border-t border-slate-800"><i className="fa-solid fa-user-slash text-xs"></i> Block User</button>
                      </div>
                    )}
                  </div>
                </div>
                
                <MemeCanvas imageUrl={meme.imageUrl} topText={meme.topText} bottomText={meme.bottomText} layout={meme.layout} isPro={meme.isProMeme} />
                
                <div className="flex items-center justify-between px-2">
                  <div className="flex gap-8">
                    <button onClick={() => setFeed(f => f.map(m => m.id === meme.id ? {...m, likes: m.likes + 1} : m))} className="flex flex-col items-center gap-1 text-slate-400 active:scale-125 transition-transform"><i className="fa-solid fa-heart text-2xl"></i><span className="text-[9px] font-black">{meme.likes}</span></button>
                    <button onClick={() => { setEditorImage(meme.imageUrl); setActiveTab('create'); }} className="flex flex-col items-center gap-1 text-slate-400"><i className="fa-solid fa-wand-sparkles text-2xl"></i><span className="text-[9px] font-black uppercase">Remix</span></button>
                  </div>
                  <button className="w-12 h-12 bg-slate-700/30 rounded-xl flex items-center justify-center text-slate-400"><i className="fa-solid fa-share-nodes text-lg"></i></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creator Tab */}
      {activeTab === 'create' && (
        <div className="p-4 space-y-8 pt-safe pb-32">
          {!editorImage ? (
            <div className="space-y-8">
              <h2 className="text-5xl font-black italic uppercase leading-none px-2">THE LAB</h2>
              <div className="bg-slate-800/40 rounded-[3rem] p-8 space-y-6 border border-slate-700/50">
                <textarea value={aiImagePrompt} onChange={(e) => setAiImagePrompt(e.target.value)} placeholder="A space explorer holding a cat..." className="w-full bg-slate-900 rounded-[2rem] p-6 text-sm min-h-[140px] resize-none border border-slate-800 focus:outline-none" />
                <button onClick={generateAIBaseImage} className="w-full bg-indigo-600 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl">GENERATE BASE</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-800/20 border-2 border-dashed border-slate-700/50 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all">
                  <i className="fa-solid fa-upload text-2xl text-indigo-400"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </button>
                <button onClick={() => cameraInputRef.current?.click()} className="aspect-square bg-slate-800/20 border-2 border-dashed border-slate-700/50 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all">
                  <i className="fa-solid fa-camera text-2xl text-pink-400"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Camera</span>
                  <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center px-2">
                <button onClick={() => setEditorImage(null)} className="w-12 h-12 bg-slate-800 rounded-xl"><i className="fa-solid fa-xmark"></i></button>
                <button onClick={publishMeme} className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest">PUBLISH</button>
              </div>
              <div ref={memeRef} className="rounded-[3rem] overflow-hidden shadow-2xl"><MemeCanvas imageUrl={editorImage} topText={topText} bottomText={bottomText} layout={layout} isPro={settings.isPro} /></div>
              <div className="bg-slate-800/60 p-6 rounded-[3rem] space-y-6">
                <input value={topText} onChange={(e) => setTopText(e.target.value)} placeholder="Top Text" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 font-black uppercase text-center focus:outline-none" />
                <input value={bottomText} onChange={(e) => setBottomText(e.target.value)} placeholder="Bottom Text" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 font-black uppercase text-center focus:outline-none" />
                <div className="flex justify-around pt-4">
                  {Object.values(MemeLayout).map(l => (
                    <button key={l} onClick={() => setLayout(l)} className={`w-12 h-12 rounded-xl flex items-center justify-center ${layout === l ? 'bg-white text-black' : 'bg-slate-900 text-slate-500'}`}><i className="fa-solid fa-th-large text-lg"></i></button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaders View */}
      {activeTab === 'leaders' && (
        <div className="p-6 space-y-10 pt-safe pb-32">
          <h2 className="text-4xl font-black italic uppercase">THE ELITE</h2>
          <div className="space-y-4">
            {[...feed].sort((a,b) => b.likes - a.likes).slice(0, 5).map((m, i) => (
              <div key={m.id} className="flex items-center justify-between p-6 bg-slate-800/20 rounded-[2.5rem] border border-slate-700/10">
                <div className="flex items-center gap-5">
                  <span className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-black">{i+1}</span>
                  <span className="font-black italic text-lg">@{m.creator}</span>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl">{m.likes}</p>
                  <p className="text-[8px] font-black uppercase text-slate-600">IMPACT</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile */}
      {activeTab === 'profile' && (
        <div className="p-6 space-y-12 pt-safe pb-32">
          <div className="flex flex-col items-center gap-6">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-purple-600 to-pink-500 p-1"><div className="w-full h-full rounded-[2.3rem] bg-slate-900 flex items-center justify-center text-4xl">🥷</div></div>
            <h2 className="text-3xl font-black italic uppercase">@{settings.handle}</h2>
            <div className="flex gap-3">
              <div className="bg-slate-800 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{userMemes.length} POSTS</div>
              <div className="bg-slate-800 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{totalImpact} IMPACT</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {userMemes.map(m => (
              <div key={m.id} className="aspect-square bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-700"><img src={m.imageUrl} className="w-full h-full object-cover" alt="meme" /></div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      {activeTab === 'settings' && (
        <div className="p-8 space-y-12 pt-safe pb-32">
          <h2 className="text-4xl font-black italic uppercase">SYSTEM</h2>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">Identifier</label>
              <input value={settings.handle} onChange={(e) => setSettings(s => ({ ...s, handle: e.target.value }))} className="w-full bg-slate-800 rounded-[1.5rem] px-6 py-5 font-black text-white focus:outline-none" />
            </div>

            <div className="bg-blue-900/20 p-8 rounded-[3rem] border border-blue-500/20 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black uppercase italic">Studio Pro</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Zero Ads • HD Gen • Support the Lab</p>
              </div>
              <button onClick={() => setSettings(s => ({ ...s, isPro: !s.isPro }))} className={`w-16 h-10 rounded-full p-1 transition-all ${settings.isPro ? 'bg-blue-500' : 'bg-slate-700'}`}><div className={`w-8 h-8 rounded-full bg-white transition-all ${settings.isPro ? 'translate-x-6' : 'translate-x-0'}`}></div></button>
            </div>

            {/* Legal & Safety Compliance Section */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
               <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-4">Legal & Safety</h3>
               <div className="grid grid-cols-1 gap-2">
                 <button className="w-full text-left px-6 py-4 bg-slate-800/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between items-center">Community Guidelines <i className="fa-solid fa-chevron-right text-[8px]"></i></button>
                 <button className="w-full text-left px-6 py-4 bg-slate-800/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between items-center">Privacy Policy <i className="fa-solid fa-chevron-right text-[8px]"></i></button>
                 <button className="w-full text-left px-6 py-4 bg-slate-800/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between items-center">Terms of Service <i className="fa-solid fa-chevron-right text-[8px]"></i></button>
               </div>
               <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                  <p className="text-[8px] text-slate-500 font-bold uppercase leading-relaxed">By using MemeAI, you agree to our terms. Users found posting prohibited content will be permanently banned. Reports are reviewed by human moderators.</p>
               </div>
            </div>

            <button onClick={() => { if(confirm('Reset all data?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-5 rounded-[2rem] bg-red-600/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20">Wipe Studio Data</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
