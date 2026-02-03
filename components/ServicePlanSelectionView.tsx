
import React, { useState } from 'react';
import { AnalysisScenario, Recipe, PainPoint } from '../types';

interface ServicePlanSelectionViewProps {
  scenarios: AnalysisScenario[];
  summaryText: string;
  serviceModeTitle?: string;
  serviceModeText?: string;
  painPoints?: PainPoint[]; // NEW: Structured data for the matrix
  onRemoveRecipe: (id: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const ServicePlanSelectionView: React.FC<ServicePlanSelectionViewProps> = (props) => {
  const {
      scenarios = [],
      summaryText = "",
      serviceModeTitle = "",
      serviceModeText = "",
      painPoints = [],
      onRemoveRecipe,
      onConfirm,
      isLoading
  } = props;
  
  const [refreshingScenarioId, setRefreshingScenarioId] = useState<string | null>(null);

  const handleRefreshScenario = (scenarioId: string) => {
      setRefreshingScenarioId(scenarioId);
      setTimeout(() => setRefreshingScenarioId(null), 1500);
  };

  const totalRecipes = (scenarios || []).reduce((acc, s) => acc + (s.recipes ? s.recipes.length : 0), 0);

  if (isLoading) {
      return (
        <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#2C2A26] flex items-center justify-center text-3xl shadow-xl animate-pulse mb-6">👨‍🍳</div>
            <h2 className="text-xl font-serif font-bold text-[#2C2A26] mb-2">AI 膳食规划师</h2>
            <p className="text-sm text-[#8C867D] font-medium">正在梳理家庭饮食痛点...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] pb-24">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-[#F9F8F6]/95 backdrop-blur-sm px-6 pt-6 pb-2 border-b border-[#E0DDD5]/50 transition-all">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-[#2C2A26] flex items-center justify-center text-xl shadow-md relative">
                    👨‍🍳
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#F9F8F6] flex items-center justify-center">
                         <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                 </div>
                 <div className="flex-1">
                     <h1 className="text-lg font-serif font-bold text-[#2C2A26] leading-none">你的私家饮食方案</h1>
                     <p className="text-[10px] text-[#8C867D] font-medium mt-0.5">根据你的档案定制</p>
                 </div>
             </div>
        </div>

        <div className="px-4 pt-4 space-y-8 max-w-lg mx-auto">
            
            {/* 1. Analysis Summary Card */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#E0DDD5] animate-in slide-in-from-bottom-4 duration-700 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2C2A26]"></div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📋</span>
                    <h3 className="text-sm font-bold text-[#2C2A26] tracking-wide">已识别家庭档案</h3>
                </div>
                <div className="text-base text-[#5C554B] font-serif font-medium leading-relaxed pl-1">
                    <span className="text-[#2C2A26] font-bold text-lg leading-none mr-2">“</span>
                    {summaryText}
                    <span className="text-[#2C2A26] font-bold text-lg leading-none ml-2">”</span>
                </div>
                <div className="mt-3 flex gap-2">
                    <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded">AI 智能提取</span>
                </div>
            </div>

            {/* 2. Service Mode Matrix Card (NEW DESIGN) */}
            {serviceModeTitle && (
                <div className="animate-in slide-in-from-bottom-6 duration-700 delay-100">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="w-1.5 h-4 bg-[#2C2A26] rounded-full"></span>
                        <h2 className="font-bold text-base text-[#2C2A26]">家庭服务策略</h2>
                    </div>
                    
                    <div className="bg-[#2C2A26] rounded-[24px] p-6 shadow-xl text-[#F9F8F6] relative overflow-hidden">
                        {/* Header */}
                        <div className="relative z-10 mb-6 border-b border-white/10 pb-4">
                            <h3 className="text-xl font-serif font-bold mb-2 text-emerald-300 tracking-tight leading-snug">
                                {serviceModeTitle}
                            </h3>
                            <p className="text-xs leading-relaxed text-stone-300/90 font-medium">
                                {serviceModeText}
                            </p>
                        </div>

                        {/* The Pain Point Matrix */}
                        <div className="relative z-10 space-y-5">
                            {painPoints.map((point, idx) => (
                                <div key={idx} className="flex gap-4 items-start group">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0 mt-0.5 border border-white/5">
                                        {point.icon || '🎯'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-sm font-bold text-white tracking-wide">{point.title}</span>
                                        </div>
                                        {/* Problem */}
                                        <div className="flex items-start gap-2 mb-2">
                                            <span className="text-[10px] text-stone-400 border border-stone-600 px-1 rounded shrink-0 mt-0.5">难点</span>
                                            <p className="text-xs text-stone-400 leading-snug font-medium">{point.pain}</p>
                                        </div>
                                        {/* Solution */}
                                        <div className="flex items-start gap-2">
                                            <span className="text-[10px] text-emerald-900 bg-emerald-400 px-1 rounded shrink-0 font-bold mt-0.5">策略</span>
                                            <p className="text-xs text-emerald-100/95 font-medium leading-snug">{point.solution}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Fallback if no structured pain points (Legacy support) */}
                        {painPoints.length === 0 && (
                             <div className="relative z-10 pt-2">
                                 <div className="flex items-start gap-3">
                                     <span className="text-2xl">💡</span>
                                     <p className="text-sm text-stone-300 leading-relaxed">
                                         根据您的家庭情况，我们将重点平衡口味差异，并确保营养摄入达标。
                                     </p>
                                 </div>
                             </div>
                        )}

                        {/* Background Decor */}
                        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    </div>
                </div>
            )}

            {/* 3. Scenarios List (Compact View) */}
            <div className="space-y-6">
                {scenarios.map((scenario, index) => (
                    <div 
                        key={scenario.id} 
                        className="animate-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
                        style={{ animationDelay: `${(index + 2) * 200}ms` }}
                    >
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <span className="w-1.5 h-4 bg-[#8C867D] rounded-full"></span>
                            <h2 className="font-bold text-base text-[#5C554B]">{scenario.title}</h2>
                        </div>

                        <div className="bg-[#EFECE5] rounded-[24px] p-5 shadow-sm border border-[#E0DDD5]">
                            <div className="bg-white/60 rounded-xl p-3 mb-4 border border-white/50 relative">
                                {scenario.trigger && (
                                    <div className="mb-2 pb-2 border-b border-[#D6D3CD]/30 flex items-start gap-2">
                                         <div className="w-3.5 h-3.5 rounded-full bg-[#2C2A26] flex items-center justify-center text-[8px] text-white shrink-0 mt-0.5">⏰</div>
                                         <div className="flex-1">
                                            <span className="text-[10px] font-bold text-[#2C2A26] mr-1">推荐时机</span>
                                            <span className="text-[10px] text-[#5C554B]">{scenario.trigger}</span>
                                         </div>
                                    </div>
                                )}
                                <p className="text-xs text-[#5C554B] leading-relaxed">
                                    <span className="font-bold text-[#2C2A26] mr-1">痛点解决:</span>
                                    {scenario.strategy}
                                </p>
                            </div>
                            
                            {/* Recipes List - Compact Mode */}
                            <div className="grid grid-cols-1 gap-2">
                                {scenario.recipes.map((recipe) => (
                                    <div key={recipe.id} className="bg-white rounded-xl p-2.5 flex items-center gap-3 border border-transparent hover:border-[#E0DDD5] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                        <div className="w-8 h-8 rounded-lg bg-[#F9F8F6] flex items-center justify-center text-sm shrink-0">
                                            {recipe.tags.includes('汤') ? '🥣' : recipe.tags.includes('辣') ? '🌶️' : '🥘'}
                                        </div>
                                        <div className="flex-1 min-w-0 flex items-center justify-between">
                                            <h3 className="font-bold text-[#2C2A26] text-sm truncate mr-2">{recipe.title}</h3>
                                            <div className="flex gap-1 shrink-0">
                                                 {recipe.tags.slice(0, 2).map(t => (
                                                    <span key={t} className="text-[9px] text-[#8C867D] bg-stone-50 px-1.5 py-0.5 rounded-md">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {scenario.recipes.length === 0 && (
                                    <div className="text-center py-4 px-4 bg-white/40 rounded-xl border border-dashed border-[#D6D3CD] flex flex-col items-center justify-center h-20">
                                        <p className="text-[10px] text-[#8C867D]">暂无推荐</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Floating Confirm Button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F9F8F6] via-[#F9F8F6]/95 to-transparent z-40">
            {totalRecipes > 0 ? (
                <button 
                    onClick={onConfirm}
                    className="w-full max-w-md mx-auto bg-[#2C2A26] text-white py-4 rounded-full font-bold text-base shadow-[0_10px_30px_-5px_rgba(44,42,38,0.4)] hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    确认并生成方案
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </button>
            ) : (
                <button onClick={() => window.location.reload()} className="w-full max-w-md mx-auto bg-white text-[#2C2A26] border-2 border-[#2C2A26] py-4 rounded-full font-bold text-base shadow-lg hover:bg-stone-50 transition-all flex items-center justify-center gap-2">
                    重新规划
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                </button>
            )}
        </div>
    </div>
  );
};

export default ServicePlanSelectionView;
