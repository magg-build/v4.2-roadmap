
import React from 'react';
import { AppState } from '../types';
import RecipeFeed from './RecipeFeed';

interface RecipeSelectionViewProps {
  state: AppState;
  onRemoveRecipe: (id: string) => void;
  onConfirm: () => void;
  onLoadMore?: () => Promise<void>;
}

const RecipeSelectionView: React.FC<RecipeSelectionViewProps> = ({ state, onRemoveRecipe, onConfirm, onLoadMore }) => {
  return (
    <div className="max-w-4xl mx-auto pb-24 p-4 pt-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Header */}
        <div className="mb-6 px-2">
            <h1 className="text-xl font-serif font-bold text-[#2C2A26] mb-2 leading-snug">
                了解了你那么多，我找到了最适合你的菜谱，看看是否符合你的口味
            </h1>
            <p className="text-sm text-[#8C867D] leading-relaxed font-medium">
                删掉不爱吃的菜，会让我更了解你哦
            </p>
        </div>

        {/* Grid Feed */}
        <RecipeFeed 
            recipes={state.suggestedRecipes}
            isLoading={state.isLoadingRecipes}
            onRemoveRecipe={onRemoveRecipe}
            hasEnoughInfo={true}
            viewMode="grid" 
            onLoadMore={onLoadMore}
        />

        {/* Bottom Floating Action */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F9F8F6] via-[#F9F8F6]/95 to-transparent z-30">
            <button 
                onClick={onConfirm}
                className="w-full max-w-sm mx-auto bg-[#2C2A26] text-white py-4 rounded-full font-bold text-base shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                确认并生成方案
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
            </button>
        </div>
    </div>
  );
};

export default RecipeSelectionView;
