import React, { useState } from 'react';
import { Recipe, FamilyMember, RoleType, GoalType } from '../types';

interface HomeDashboardProps {
  recipes?: Recipe[];
  onRemoveRecipe?: (id: string) => void;
  familyMembers?: FamilyMember[];
  onUpdateMember?: (id: string, updates: Partial<FamilyMember>) => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ 
  recipes = [], 
  onRemoveRecipe = (_id: string) => {},
  familyMembers = [],
  onUpdateMember = (_id: string, _updates: Partial<FamilyMember>) => {}
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);

  const toggleDrawer = () => setIsDrawerOpen(prev => !prev);
  const closeBubble = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowBubble(false);
  };
  
  // Helper to map goals/tastes to the tag style in Screenshot 3
  const getMemberTags = (m: FamilyMember) => {
      const tags = [];
      if (m.goals.includes(GoalType.ACNE)) tags.push('抗炎');
      if (m.tastes.includes('清淡')) tags.push('清淡');
      if (m.goals.includes(GoalType.BLOOD_SUGAR)) tags.push('低GI');
      if (m.goals.includes(GoalType.ANTI_FATIGUE)) tags.push('维B丰富');
      if (m.goals.includes(GoalType.IRON_ANEMIA)) tags.push('铁质');
      if (m.goals.includes(GoalType.WORK_RECOVERY)) tags.push('能量');
      // Fallbacks if empty
      if (tags.length === 0) tags.push('营养均衡', '家常');
      return tags.slice(0, 6);
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans relative overflow-x-hidden">
      
      {/* --- HEADER --- */}
      <div className="px-6 pt-6 pb-2 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-sm z-30">
          <button onClick={() => toggleDrawer()} className="relative p-2 -ml-2">
              <div className="space-y-1.5">
                  <span className="block w-6 h-0.5 bg-stone-800 rounded-full"></span>
                  <span className="block w-6 h-0.5 bg-stone-800 rounded-full"></span>
                  <span className="block w-4 h-0.5 bg-stone-800 rounded-full"></span>
              </div>
              {/* Red Dot Notification */}
              <span className="absolute top-1.5 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 border border-stone-200">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
             </svg>
          </div>
      </div>

      {/* --- NOTIFICATION BUBBLE (Screenshot 2) --- */}
      {showBubble && (
          <div className="absolute top-16 left-4 z-20 animate-in fade-in slide-in-from-top-2 duration-500">
              {/* Triangle Pointer */}
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-stone-800 ml-3"></div>
              {/* Bubble Body */}
              <div 
                className="bg-stone-800 text-white rounded-xl p-4 shadow-xl w-64 cursor-pointer"
                onClick={() => toggleDrawer()}
              >
                  <div className="flex items-start gap-3">
                      <div className="text-2xl pt-1">📚</div>
                      <div className="flex-1">
                          <h3 className="text-sm font-bold text-emerald-400 mb-1">家庭菜谱库已建成!</h3>
                          <p className="text-[10px] text-stone-300 leading-relaxed mb-3">
                              刚才为您检索拓展的全量菜谱都在这里，随时点击左上角图标查看。
                          </p>
                          <div className="flex justify-end">
                              <button 
                                onClick={closeBubble}
                                className="text-[10px] text-stone-400 hover:text-white underline decoration-stone-600 underline-offset-2"
                              >
                                  我知道了
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- MAIN TITLE --- */}
      <div className="px-6 mt-4 mb-8">
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight leading-tight">
              今天特别想<br/>吃点什么？
          </h2>
      </div>

      {/* --- DASHBOARD GRID (Screenshot 2) --- */}
      <div className="px-4 pb-20">
          <div className="grid grid-cols-2 gap-3 h-[460px]">
              
              {/* Card 1: One Day Express */}
              <div className="bg-[#FFF9F5] rounded-[24px] p-5 flex flex-col relative overflow-hidden group">
                  <div className="relative z-10">
                      <h3 className="font-bold text-lg text-stone-900">一日极速</h3>
                      <p className="text-xs text-stone-400 mt-1">15分钟开启美味</p>
                  </div>
                  <div className="absolute bottom-[-10px] left-[-10px] w-32 h-32 transition-transform group-hover:scale-105">
                      <div className="w-24 h-24 rounded-full bg-stone-200 overflow-hidden border-2 border-white shadow-lg relative z-10 top-4 left-4">
                           <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80')] bg-cover"></div>
                      </div>
                      <div className="w-20 h-20 rounded-full bg-stone-200 overflow-hidden border-2 border-white shadow-lg absolute bottom-2 right-[-20px] z-0">
                           <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=200&q=80')] bg-cover"></div>
                      </div>
                  </div>
              </div>

              {/* Card 2: Weekly Prep (Tall) */}
              <div className="bg-[#F0F7FF] rounded-[24px] p-5 flex flex-col row-span-2 relative overflow-hidden group">
                   <div className="relative z-10">
                      <h3 className="font-bold text-lg text-stone-900">一周备菜灵感</h3>
                      <p className="text-xs text-stone-400 mt-1">让本周充满秩序感</p>
                  </div>
                  
                  {/* Play Button */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-stone-900/10 rounded-full flex items-center justify-center backdrop-blur-sm z-20 group-hover:scale-110 transition-transform cursor-pointer">
                      <div className="w-0 h-0 border-l-[10px] border-l-stone-600 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                  </div>

                  {/* Circle Image Bottom Right */}
                  <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full border-[6px] border-white shadow-xl overflow-hidden">
                       <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=300&q=80')] bg-cover"></div>
                  </div>
                  {/* Decorative Dot */}
                  <div className="absolute bottom-32 left-8 w-3 h-3 bg-red-400 rounded-full"></div>
              </div>

              {/* Card 3: Festive */}
              <div className="bg-[#FFF0F0] rounded-[24px] p-5 flex flex-col relative overflow-hidden group">
                  <div className="relative z-10">
                      <h3 className="font-bold text-lg text-stone-900">龙年年味</h3>
                      <p className="text-xs text-stone-400 mt-1">一桌好饭定乾坤</p>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-24">
                       <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1563245372-f21720138c5e?auto=format&fit=crop&w=400&q=80')] bg-cover bg-bottom opacity-90"></div>
                       <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
              </div>

              {/* Card 4: Baby Food */}
              <div className="bg-[#F5F9F0] rounded-[24px] p-5 flex flex-col relative overflow-hidden col-span-2">
                   <div className="flex justify-between items-start relative z-10">
                      <div>
                          <h3 className="font-bold text-lg text-stone-900">宝宝辅食</h3>
                          <p className="text-xs text-stone-400 mt-1">营养均衡口口生香</p>
                      </div>
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded">专享计划已开启</span>
                  </div>
                  {/* Decorative Elements */}
                   <div className="absolute bottom-[-20px] right-[-10px] text-[80px] opacity-10 rotate-12">🥕</div>
              </div>
          </div>
      </div>

      {/* --- SIDEBAR DRAWER (Screenshot 3) --- */}
      {isDrawerOpen && (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-stone-900/40 backdrop-blur-[2px] z-40 animate-in fade-in duration-300"
                onClick={() => toggleDrawer()}
            />
            
            {/* Drawer Panel */}
            <div className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-50 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-stone-900">家庭菜谱库</h2>
                        <p className="text-xs text-stone-400 mt-1">共收录 {recipes.length} 道精选美食</p>
                    </div>
                    <button 
                        onClick={() => toggleDrawer()}
                        className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content Scrollable */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                    
                    {/* Section 1: Member Needs (Screenshot 3 Style) */}
                    <div className="px-6 py-6 border-b border-stone-50">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-3.5 bg-emerald-500 rounded-full"></div>
                            <h3 className="text-sm font-bold text-stone-900">家庭成员饮食诉求</h3>
                        </div>
                        
                        {/* Member Card */}
                        <div className="space-y-3">
                            {familyMembers.map(m => (
                                <div key={m.id} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-400 text-white flex items-center justify-center font-bold text-lg shadow-blue-100 shadow-lg">
                                            {m.role[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-stone-900 text-base">{m.role === RoleType.SELF ? '自己' : m.role}</span>
                                                <button className="text-stone-300">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {getMemberTags(m).map(tag => (
                                                    <span key={tag} className="bg-stone-50 text-stone-600 px-2 py-1 rounded text-xs border border-stone-100">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Family Common Denominator (Recipes) */}
                    <div className="px-6 py-6">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-stone-900"></span>
                            <h3 className="text-sm font-bold text-stone-900">探索收藏</h3>
                        </div>
                        <p className="text-[10px] text-stone-400 mb-5 pl-4">
                            基于AI对你的了解，为你自动收藏的灵感菜式
                        </p>

                        {/* Recipe Cards List */}
                        <div className="space-y-4">
                            {recipes.map(recipe => (
                                <div key={recipe.id} className="bg-white p-3 rounded-2xl border border-stone-100 flex gap-3 relative shadow-sm">
                                    {/* Icon/Image Placeholder */}
                                    <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-xl shrink-0 border border-stone-100 mt-1">
                                        {recipe.tags.includes('汤') ? '🥣' : '🥘'}
                                    </div>
                                    
                                    <div className="flex-1 pr-6">
                                        <h4 className="font-bold text-stone-900 text-sm mb-1">{recipe.title}</h4>
                                        <p className="text-[10px] text-stone-500 leading-relaxed mb-2 line-clamp-2">
                                            {recipe.matchReason}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {recipe.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="text-[10px] bg-stone-50 text-stone-400 px-1.5 py-0.5 rounded border border-stone-100">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Close/Remove Button */}
                                    <button 
                                        onClick={() => onRemoveRecipe(recipe.id)}
                                        className="absolute top-3 right-3 text-stone-300 hover:text-red-400 p-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Button (Fixed) */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
                    <button 
                        onClick={() => toggleDrawer()}
                        className="w-full bg-stone-900 text-white font-bold text-sm py-3.5 rounded-full shadow-lg active:scale-[0.98] transition-transform"
                    >
                        返回首页
                    </button>
                </div>

            </div>
        </>
      )}
    </div>
  );
};

export default HomeDashboard;