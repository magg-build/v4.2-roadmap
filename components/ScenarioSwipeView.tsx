
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisScenario, Recipe } from '../types';

interface ScenarioSwipeViewProps {
  scenarios: AnalysisScenario[];
  onComplete: (filteredScenarios: AnalysisScenario[]) => void;
  isLoading: boolean;
  onSupplement?: (request: string) => void;
  isSupplementing?: boolean;
}

const ScenarioSwipeView: React.FC<ScenarioSwipeViewProps> = ({ 
    scenarios, 
    onComplete, 
    isLoading,
    onSupplement,
    isSupplementing = false
}) => {
  // Store IDs of recipes user explicitly wants to remove
  const [removedRecipeIds, setRemovedRecipeIds] = useState<Set<string>>(new Set());
  
  // Which scenario is currently expanded for review (null = overview)
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);

  // Supplement Input State
  const [supplementInput, setSupplementInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholders = [
      "还有什么特殊的口味要求？",
      "比如：最近孩子有点积食...",
      "比如：爷爷这周想吃点软烂的...",
      "比如：想加一道重口味的下饭菜...",
      "还有什么家庭成员的特殊忌口？"
  ];

  // Rotate placeholders
  useEffect(() => {
      const interval = setInterval(() => {
          setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
      }, 3000);
      return () => clearInterval(interval);
  }, []);

  const handleSupplementSubmit = () => {
      if (!supplementInput.trim() || !onSupplement) return;
      onSupplement(supplementInput);
      setSupplementInput('');
  };

  // --- ACTIONS ---

  const toggleRemoveRecipe = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setRemovedRecipeIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
              next.delete(id); // Undo remove (Keep)
          } else {
              next.add(id); // Remove
          }
          return next;
      });
  };

  const handleFinish = () => {
      // Filter out removed recipes
      const filteredScenarios = scenarios.map(s => ({
          ...s,
          recipes: s.recipes.filter(r => !removedRecipeIds.has(r.id))
      })).filter(s => s.recipes.length > 0); // Remove empty scenarios if any

      onComplete(filteredScenarios);
  };

  const activeScenario = scenarios.find(s => s.id === expandedScenarioId);

  // --- RENDERERS ---

  if (isLoading) {
      return (
        <div className="min-h-screen bg-[#1C1A17] flex flex-col items-center justify-center p-6 text-center text-white font-sans">
            <div className="w-20 h-20 rounded-full bg-stone-800 flex items-center justify-center text-4xl shadow-2xl animate-pulse mb-8 border border-stone-700">
                ⚡️
            </div>
            <h2 className="text-2xl font-serif font-bold mb-3">AI 正在构建家庭食谱...</h2>
            <div className="space-y-3 text-stone-400 text-sm font-medium">
                 <p className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-0 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    识别特殊人群需求
                 </p>
                 <p className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                    解决口味冲突
                 </p>
                 <p className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    生成专属合集
                 </p>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#1C1A17] text-[#F9F8F6] font-sans flex flex-col relative overflow-hidden">
        
        {/* --- MAIN OVERVIEW PAGE --- */}
        <div className="px-6 pt-12 pb-32 overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
                <div className="inline-flex items-center gap-2 bg-stone-800/50 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 mb-4 border border-stone-700">
                    <span>✨</span> 核心菜谱提取完成
                </div>
                <h1 className="text-3xl font-serif font-bold mb-3 leading-tight">
                    下面这些是最适合你的菜谱<br/>
                    <span className="text-stone-400">看看是否照顾到你的口味？</span>
                </h1>
                <p className="text-sm text-stone-400 leading-relaxed max-w-xs">
                    不喜欢也没关系，点进去删掉就好啦，留下的都是全家人的心头好。
                </p>
            </div>

            {/* Bubble List */}
            <div className="space-y-4">
                {scenarios.map((scenario, idx) => {
                    const activeCount = scenario.recipes.filter(r => !removedRecipeIds.has(r.id)).length;
                    
                    return (
                        <div 
                            key={scenario.id} 
                            onClick={() => setExpandedScenarioId(scenario.id)}
                            className="bg-stone-800 rounded-[24px] p-5 border border-stone-700 relative overflow-hidden group cursor-pointer hover:bg-stone-750 transition-colors animate-in slide-in-from-bottom-8 fill-mode-backwards"
                            style={{ animationDelay: `${idx * 150}ms` }}
                        >
                            {/* Visual Hint Arrow */}
                            <div className="absolute top-6 right-6 text-stone-600 group-hover:text-stone-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </div>

                            <div className="relative z-10 pr-2">
                                {/* Title */}
                                <h3 className="text-lg font-bold mb-3 text-white group-hover:text-emerald-300 transition-colors">
                                    {scenario.title}
                                </h3>
                                {/* Strategy Description with Vertical Bar */}
                                <div className="flex items-start gap-3 mb-5">
                                    <div className="w-1 h-8 bg-stone-600 rounded-full mt-0.5 shrink-0 group-hover:bg-emerald-500/50 transition-colors"></div>
                                    <p className="text-xs text-stone-400 leading-relaxed line-clamp-2">
                                        {scenario.strategy}
                                    </p>
                                </div>
                                
                                {/* Recipe Preview Chips (Fixed Height Row/Grid) */}
                                <div className="flex flex-wrap gap-2.5">
                                    {scenario.recipes.slice(0, 3).map(r => {
                                        const isRemoved = removedRecipeIds.has(r.id);
                                        return (
                                            <div 
                                                key={r.id} 
                                                className={`
                                                    px-3 py-2.5 rounded-xl border text-xs font-bold transition-all truncate max-w-[45%] text-center
                                                    ${isRemoved 
                                                        ? 'bg-stone-900/30 text-stone-600 border-stone-800 line-through decoration-stone-600' 
                                                        : 'bg-white/5 text-[#E0DDD5] border-white/10 hover:border-stone-500'
                                                    }
                                                `}
                                            >
                                                {r.title}
                                            </div>
                                        );
                                    })}
                                    {scenario.recipes.length > 3 && (
                                        <div className="px-2 py-2 text-xs font-bold text-stone-500 self-center">
                                            +{scenario.recipes.length - 3}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Count Status */}
                                <div className="mt-4 text-[10px] font-bold text-stone-500 text-right">
                                    保留 {activeCount} 道 / 共 {scenario.recipes.length} 道
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* --- Supplement Input Area --- */}
                {onSupplement && (
                    <div className="mt-8 mb-4 bg-stone-800/50 rounded-[20px] p-4 border border-stone-700/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-emerald-400 text-lg">✨</span>
                            <span className="text-xs font-bold text-stone-400">还有什么没考虑到的？</span>
                        </div>
                        <div className="relative group">
                            <input 
                                type="text" 
                                value={supplementInput}
                                onChange={(e) => setSupplementInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSupplementSubmit()}
                                placeholder={placeholders[placeholderIndex]}
                                className="w-full bg-stone-900/80 text-sm text-stone-200 rounded-xl px-4 py-3 pr-12 border border-stone-700 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none placeholder:text-stone-600 transition-all"
                                disabled={isSupplementing}
                            />
                            <button 
                                onClick={handleSupplementSubmit}
                                disabled={!supplementInput.trim() || isSupplementing}
                                className={`
                                    absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                    ${supplementInput.trim() && !isSupplementing
                                        ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg' 
                                        : 'bg-stone-800 text-stone-600'
                                    }
                                `}
                            >
                                {isSupplementing ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Global Action Button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1C1A17] via-[#1C1A17]/95 to-transparent z-20">
            <button 
                onClick={handleFinish}
                className="w-full bg-emerald-500 text-white py-4 rounded-full font-bold text-base shadow-xl hover:bg-emerald-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                确认方案，开启烹饪模式
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
            </button>
        </div>

        {/* --- DETAIL EXPANSION (Bottom Sheet / Overlay) --- */}
        {activeScenario && (
            <>
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                    onClick={() => setExpandedScenarioId(null)}
                />
                
                {/* Sheet */}
                <div className="fixed bottom-0 left-0 right-0 bg-[#2C2A26] rounded-t-[32px] z-50 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-white/10">
                    
                    {/* Sheet Header */}
                    <div className="px-6 pt-6 pb-4 border-b border-white/5 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">{activeScenario.title}</h2>
                            <p className="text-xs text-stone-400">点击右侧按钮移除不喜欢的菜品</p>
                        </div>
                        <button 
                            onClick={() => setExpandedScenarioId(null)}
                            className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Recipe List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-10">
                        {activeScenario.recipes.map(recipe => {
                            const isRemoved = removedRecipeIds.has(recipe.id);
                            return (
                                <div 
                                    key={recipe.id}
                                    className={`
                                        relative p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4
                                        ${isRemoved 
                                            ? 'bg-stone-900/30 border-stone-800 opacity-60' 
                                            : 'bg-stone-800 border-stone-700 hover:border-stone-600'
                                        }
                                    `}
                                >
                                    {/* Icon */}
                                    <div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center text-2xl shrink-0">
                                        {recipe.tags.includes('汤') ? '🥣' : recipe.tags.includes('辣') ? '🌶️' : '🥘'}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-sm mb-1 ${isRemoved ? 'text-stone-500 line-through' : 'text-stone-200'}`}>
                                            {recipe.title}
                                        </h3>
                                        <p className="text-[10px] text-stone-500 line-clamp-1">
                                            {recipe.matchReason}
                                        </p>
                                    </div>

                                    {/* Action: Toggle Remove */}
                                    <button
                                        onClick={(e) => toggleRemoveRecipe(recipe.id, e)}
                                        className={`
                                            w-10 h-10 rounded-full flex items-center justify-center border transition-all
                                            ${isRemoved
                                                ? 'bg-stone-800 border-stone-600 text-stone-500' // State: Removed (Click to restore)
                                                : 'bg-white/10 border-white/5 text-stone-300 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30' // State: Active (Click to remove)
                                            }
                                        `}
                                    >
                                        {isRemoved ? (
                                            <span className="text-xs font-bold">撤销</span>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sheet Footer */}
                    <div className="p-4 bg-[#2C2A26] border-t border-white/5">
                        <button 
                            onClick={() => setExpandedScenarioId(null)}
                            className="w-full bg-stone-100 text-stone-900 py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors"
                        >
                            完成筛选
                        </button>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default ScenarioSwipeView;
