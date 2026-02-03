
import React from 'react';
import { AppState, RoleType } from '../types';
import RecipeFeed from './RecipeFeed';

interface FinalPlanViewProps {
  state: AppState;
  onRemoveRecipe: (id: string) => void;
  onBack: () => void;
  onEnterDashboard: () => void;
  onLoadMore: () => Promise<void>;
}

const FinalPlanView: React.FC<FinalPlanViewProps> = ({ state, onRemoveRecipe, onBack, onEnterDashboard, onLoadMore }) => {
  const { familyMembers, cookingHabits, globalConstraints, analysisSummary, suggestedRecipes } = state;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 p-4 pt-8">
      
      {/* 1. Header Area - Clean & Centered */}
      <div className="text-center mb-6">
         <h1 className="text-2xl md:text-3xl font-bold text-[#2C2A26] tracking-tight mb-2">为您定制的家庭膳食方案</h1>
         <button 
            onClick={onBack} 
            className="text-[#8C867D] text-sm border-b border-[#8C867D]/30 pb-0.5 hover:text-[#2C2A26] hover:border-[#2C2A26] transition-colors"
         >
             返回修改偏好
         </button>
      </div>

      {/* 2. Main Insight Card - Magazine Style */}
      <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-xl shadow-[#2C2A26]/5 border border-[#E0DDD5] relative overflow-hidden">
         
         {/* Decorative Top Green Line */}
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-500" />
         
         {/* Member Needs Overview - Horizontal Cards (Moved up as Strategy section is removed) */}
         <div className="mb-10 mt-4">
             <div className="flex items-center gap-2 mb-4 px-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#D6D3CD]">
                   <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-bold text-[#8C867D]">成员需求概览</h3>
             </div>

             <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                {familyMembers.map(m => (
                   <div key={m.id} className="flex-shrink-0 w-64 bg-[#F9F8F6] p-4 rounded-2xl border border-[#F0EFE9] flex flex-col gap-3">
                      
                      {/* Card Header: Avatar + Role */}
                      <div className="flex items-center gap-3">
                          <div className={`
                              w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white shadow-sm
                              ${m.avatarColor}
                          `}>
                             {m.role === RoleType.OTHER && m.name ? m.name[0] : m.role[0]}
                          </div>
                          <span className="font-bold text-[#2C2A26] text-sm">{m.role === RoleType.SELF ? '自己' : m.role}</span>
                      </div>
                      
                      {/* Tags Grid - Only Dietary Goals */}
                      <div className="flex flex-wrap gap-2">
                         {/* Goals - Green Style */}
                         {m.goals.map(g => (
                             <span key={g} className="text-[10px] font-medium text-emerald-700 bg-white px-2 py-1 rounded-md border border-emerald-100">
                                 {g}
                             </span>
                         ))}
                         
                         {/* Fallback */}
                         {m.goals.length === 0 && (
                             <span className="text-[10px] text-[#8C867D] bg-white px-2 py-1 rounded-md border border-stone-100">
                                 均衡饮食
                             </span>
                         )}
                      </div>
                   </div>
                ))}
             </div>
         </div>

         {/* C. Kitchen Settings - Card Style */}
         <div>
            <div className="flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#D6D3CD]">
                   <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.922-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-bold text-[#8C867D]">厨房设定</h3>
             </div>

             <div className="bg-[#F9F8F6] rounded-2xl p-6 space-y-4">
                 {/* Skill Level */}
                 <div className="flex justify-between items-center border-b border-[#E0DDD5]/50 pb-3">
                     <span className="text-sm font-bold text-[#8C867D]">掌勺人段位</span>
                     <span className="font-bold text-[#2C2A26]">{cookingHabits.skillLevel}</span>
                 </div>
                 {/* Restrictions */}
                 <div className="flex justify-between items-center pt-1">
                     <span className="text-sm font-bold text-[#8C867D]">全家忌口</span>
                     <span className={`font-bold text-sm text-right ${globalConstraints.allergies.length > 0 ? 'text-[#2C2A26]' : 'text-[#8C867D]'}`}>
                         {globalConstraints.allergies.length > 0 ? globalConstraints.allergies.join('、') : '无'}
                     </span>
                 </div>
             </div>
         </div>
         
      </div>

      {/* 3. Recipe Feed Section */}
      <div className="px-1 mt-8">
          <RecipeFeed 
            recipes={suggestedRecipes} 
            isLoading={false} 
            onRemoveRecipe={onRemoveRecipe}
            hasEnoughInfo={true}
            viewMode="static"
            onLoadMore={onLoadMore}
          />
      </div>

       {/* 4. Bottom Action */}
       <div className="flex justify-center pt-8">
           <button 
             onClick={onEnterDashboard}
             className="bg-stone-900 text-white px-8 py-4 rounded-full font-bold text-base shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center gap-3"
           >
               进入家庭饮食的规划之旅
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
               </svg>
           </button>
       </div>
    </div>
  );
};

export default FinalPlanView;
