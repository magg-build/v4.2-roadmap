
import React, { useMemo, useState, useEffect } from 'react';
import { Recipe, StrategyItem } from '../types';

interface RecipeFeedProps {
  recipes: Recipe[];
  isLoading: boolean;
  onRemoveRecipe: (id: string) => void;
  analysisSummary?: {
      goalBalance: string[];
      tasteProfile: string[];
      familyStrategy?: string;
      memberStrategies?: StrategyItem[];
  };
  hasEnoughInfo: boolean;
  viewMode?: 'feed' | 'static' | 'fission' | 'grid';
  searchStatus?: 'idle' | 'searching' | 'done';
  onLoadMore?: () => Promise<void> | void; 
}

const RecipeFeed: React.FC<RecipeFeedProps> = ({ 
    recipes, 
    isLoading, 
    onRemoveRecipe, 
    analysisSummary,
    hasEnoughInfo,
    viewMode = 'feed',
    searchStatus,
    onLoadMore
}) => {
  
  // Fission Animation State
  const [visibleCount, setVisibleCount] = useState(recipes.length);
  // Track removed count for positive reinforcement
  const [removedCount, setRemovedCount] = useState(0);
  
  // Local loading state for extension
  const [isExtending, setIsExtending] = useState(false);

  const handleRemove = (id: string) => {
      setRemovedCount(prev => prev + 1);
      onRemoveRecipe(id);
  }

  const handleLoadMore = async () => {
      if (!onLoadMore) return;
      setIsExtending(true);
      await onLoadMore();
      setIsExtending(false);
  };

  useEffect(() => {
      if (viewMode === 'fission') {
          setVisibleCount(3); // Start with a few
          const interval = setInterval(() => {
              setVisibleCount(prev => {
                  if (prev < recipes.length) return prev + 1;
                  clearInterval(interval);
                  return prev;
              });
          }, 600); // Add one every 600ms for dramatic effect
          return () => clearInterval(interval);
      } else {
          setVisibleCount(recipes.length);
      }
  }, [viewMode, recipes.length]);

  const displayRecipes = viewMode === 'fission' ? recipes.slice(0, visibleCount) : recipes;

  const groupedRecipes = useMemo(() => {
    // For GRID mode, we might want to flatten or keep groups?
    // Let's flatten for grid to look cleaner, or keep groups if they are meaningful.
    // The prompt implies a single list for selection. Let's flatten if grid.
    if (viewMode === 'grid') {
        return [{ id: 'ALL', title: null, items: displayRecipes }];
    }

    const groups: Record<string, Recipe[]> = {};
    displayRecipes.forEach(r => {
        const key = r.group?.includes('全家公约数') ? 'FAMILY_MAIN' : (r.group || 'FAMILY_MAIN');
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
    });
    
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (a === 'FAMILY_MAIN') return -1;
        if (b === 'FAMILY_MAIN') return 1;
        return groups[b].length - groups[a].length;
    });
    return sortedKeys.map(key => ({ 
        id: key,
        title: key === 'FAMILY_MAIN' ? null : key, // REMOVED TITLE FOR FAMILY MAIN
        items: groups[key] 
    }));
  }, [displayRecipes, viewMode]);

  // FIX: Do not return null when searching. Show empty state only if truly empty and NOT searching.
  if (!hasEnoughInfo && viewMode === 'feed' && searchStatus !== 'searching') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
        <span className="text-3xl opacity-20 mb-2">🍽️</span>
        <p className="text-[#8C867D] text-xs">暂无数据</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col pb-24 relative min-h-[300px] transition-all duration-500`}>
      
      {/* Loading Overlay for Search (Filters) */}
      {searchStatus === 'searching' && viewMode !== 'fission' && (
          <div className="absolute inset-0 z-10 bg-[#F9F8F6]/80 backdrop-blur-[1px] flex items-start justify-center pt-24 animate-in fade-in duration-300">
               {/* No spinner here, relying on the Top Card status to tell the story, keeping UI clean */}
          </div>
      )}

      {/* --- SECTION 1: STICKY MAGAZINE HEADER (Minimal, Text-Only) --- */}
      {/* Only show in standard feed mode */}
      {viewMode !== 'grid' && hasEnoughInfo && displayRecipes.length > 0 && viewMode !== 'fission' && (
          <div className="sticky top-0 z-20 -mx-4 px-6 py-4 bg-[#F9F8F6]/95 backdrop-blur-md transition-all border-b border-[#E0DDD5]/30">
              <div className="flex justify-between items-end">
                  <div className="flex-1 pr-4">
                      <p className="font-serif text-lg text-[#2C2A26] leading-relaxed mb-1">
                          下面是精心为你筛选的菜谱，<br/>如果不喜欢，请大胆去掉。
                      </p>
                      <p className="text-xs text-[#8C867D] font-medium mt-1">
                          你选的越多我越了解你哦
                      </p>
                  </div>
                  <div className="flex flex-col items-center pb-1">
                       <span className="font-serif text-4xl font-bold text-[#D6D3CD] leading-none">{recipes.length}</span>
                  </div>
              </div>
          </div>
      )}

      {/* --- SECTION 2: AI SUMMARY & HEADER (NEW BLOCK) --- */}
      {/* Only show in standard feed mode */}
      {viewMode === 'feed' && hasEnoughInfo && (
          <div className="mb-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
               <h3 className="text-xl font-bold text-stone-800 mb-4 px-1 flex items-center gap-2 font-serif">
                   家庭美食灵感池
               </h3>
               
               {/* AI Strategy Summary Card */}
               {analysisSummary?.memberStrategies && (
                   <div className="bg-[#EFECE5]/60 rounded-2xl p-4 border border-[#E0DDD5]">
                       <div className="flex items-center gap-2 mb-3">
                           <div className="w-5 h-5 bg-[#2C2A26] rounded-full flex items-center justify-center text-white text-xs">
                               AI
                           </div>
                           <span className="text-xs font-bold text-[#5C554B]">阶段性膳食策略</span>
                       </div>
                       
                       <div className="space-y-2">
                           {analysisSummary.memberStrategies.map((strategy, idx) => (
                               <div key={idx} className="flex items-start gap-2 text-xs">
                                   <span className="font-bold text-stone-800 shrink-0 min-w-[36px] bg-white/50 px-1 rounded text-center">
                                       {strategy.role === '自己' ? '您' : strategy.role}
                                   </span>
                                   <div className="text-[#8C867D] leading-relaxed">
                                       目标 <span className="text-stone-600 font-medium border-b border-[#D6D3CD] border-dotted">{strategy.focus}</span>，
                                       建议 <span className="text-emerald-700 font-medium">{strategy.suggestion}</span>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
          </div>
      )}

      {/* Header for Fission Mode (Bottom Search Status) */}
      {viewMode === 'fission' && (
          <div className="mb-6 px-1 text-center py-4">
              <div className="inline-flex items-center gap-2 bg-[#2C2A26] text-white px-4 py-1.5 rounded-full text-xs font-bold mb-2 shadow-lg animate-pulse">
                   <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   正在延展菜谱可能性...
              </div>
          </div>
      )}

      {/* --- GRID VIEW MODE --- */}
      {viewMode === 'grid' && (
         <div className="grid grid-cols-2 gap-3 pt-4">
            {displayRecipes.map((recipe, idx) => (
               <div 
                 key={recipe.id}
                 className="bg-white rounded-[20px] p-3 shadow-sm relative group animate-in zoom-in-50 duration-500 fill-mode-backwards"
                 style={{ animationDelay: `${idx * 50}ms` }}
               >
                  {/* Delete Button */}
                  <button 
                      onClick={() => handleRemove(recipe.id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all z-10 shadow-sm"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                  </button>

                  {/* Cover Area (Placeholder) */}
                  <div className="aspect-[4/3] bg-[#F9F8F6] rounded-xl mb-3 flex items-center justify-center">
                      <span className="text-4xl">{recipe.tags.includes('汤') ? '🥣' : recipe.tags.includes('辣') ? '🌶️' : '🥘'}</span>
                  </div>

                  {/* Title & Tags */}
                  <div className="space-y-2">
                      <h3 className="font-bold text-stone-800 text-sm truncate leading-tight">{recipe.title}</h3>
                      <div className="flex flex-wrap gap-1.5 h-6 overflow-hidden">
                          {recipe.tags.slice(0, 2).map(t => (
                              <span key={t} className="text-[10px] bg-[#F9F8F6] text-[#8C867D] px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                  {t}
                              </span>
                          ))}
                      </div>
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* --- LIST VIEW MODE (Default) --- */}
      {viewMode !== 'grid' && (
        <div className="space-y-6 pt-2">
            {groupedRecipes.map((group) => (
              <div key={group.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                  {/* Only render header if title exists */}
                  {group.title && (
                      <h4 className="text-xs font-bold text-[#8C867D] uppercase tracking-widest mb-3 pl-1 flex items-center justify-between font-serif">
                          {group.title}
                          {viewMode === 'fission' && group.items.length > 0 && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded animate-in zoom-in">
                                  +{group.items.length} 
                              </span>
                          )}
                      </h4>
                  )}
                  <div className="space-y-3">
                      {group.items.map((recipe, idx) => (
                          <div 
                              key={recipe.id} 
                              className={`
                                  relative bg-white p-4 rounded-[20px] flex gap-4 items-start group transition-all
                                  ${viewMode === 'fission' && idx >= visibleCount - 1 ? 'animate-in zoom-in-95 ring-2 ring-emerald-50 duration-500' : 'hover:shadow-md shadow-[0_4px_16px_rgba(0,0,0,0.03)]'}
                              `}
                          >
                            {/* Icon Box - Cleaner Look */}
                            <div className="w-12 h-12 rounded-2xl bg-[#F9F8F6] flex items-center justify-center text-xl shrink-0 self-start">
                                {recipe.tags.includes('汤') ? '🥣' : recipe.tags.includes('辣') ? '🌶️' : '🥘'}
                            </div>

                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-[#2C2A26] text-sm truncate pr-2">{recipe.title}</h3>
                                    <button 
                                      onClick={() => handleRemove(recipe.id)}
                                      className="text-[#D6D3CD] hover:text-red-400 transition-colors -mt-2 -mr-2 p-2 rounded-full hover:bg-red-50"
                                      aria-label="Remove recipe"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-xs text-[#8C867D] line-clamp-2 mb-2 leading-relaxed">{recipe.matchReason}</p>
                                <div className="flex gap-1.5 flex-wrap">
                                    {recipe.tags.slice(0, 3).map(t => (
                                        <span key={t} className="text-[10px] bg-[#F9F8F6] text-[#8C867D] px-2 py-1 rounded-lg whitespace-nowrap">
                                            {t}
                                        </span>
                                    ))}
                                      <span className="text-[10px] text-[#D6D3CD] self-center ml-auto hidden group-hover:inline-block animate-in fade-in">不感兴趣?</span>
                                </div>
                            </div>
                          </div>
                      ))}
                  </div>
              </div>
            ))}
        </div>
      )}

      {/* FOOTER EXTENSION AREA */}
      {onLoadMore && viewMode !== 'fission' && hasEnoughInfo && (
          <div className="mt-8 mb-4 flex justify-center">
              <button 
                  onClick={handleLoadMore}
                  disabled={isExtending}
                  className={`
                      px-6 py-3 rounded-full text-xs font-bold border transition-all flex items-center gap-2
                      ${isExtending 
                          ? 'bg-stone-50 text-stone-400 border-stone-200 cursor-wait' 
                          : 'bg-white text-emerald-600 border-emerald-100 shadow-sm hover:shadow-md hover:bg-emerald-50'
                      }
                  `}
              >
                  {isExtending ? (
                      <>
                        <svg className="animate-spin h-3 w-3 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        正在检索更多可能...
                      </>
                  ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                        基于如上偏好, 找更多菜谱
                      </>
                  )}
              </button>
          </div>
      )}
    </div>
  );
};

export default RecipeFeed;
