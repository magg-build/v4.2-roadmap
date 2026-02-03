import React, { useEffect, useState } from 'react';
import { Recipe } from '../types';

interface PlanGenerationScreenProps {
  seedRecipes: Recipe[];
  onComplete: () => void;
}

const PlanGenerationScreen: React.FC<PlanGenerationScreenProps> = ({ seedRecipes, onComplete }) => {
  const [phase, setPhase] = useState<0 | 1 | 2>(0); // 0: Seeds, 1: Fission, 2: Finalize
  const [visibleExtensions, setVisibleExtensions] = useState<string[]>([]);

  // Orchestrate the animation sequence
  useEffect(() => {
    // Phase 0 -> 1: After 1.5s
    const t1 = setTimeout(() => {
        setPhase(1);
    }, 1500);

    // Phase 1 Animations: Pop in "extensions" text
    const t2 = setTimeout(() => setVisibleExtensions(prev => [...prev, 'ext1']), 2000);
    const t3 = setTimeout(() => setVisibleExtensions(prev => [...prev, 'ext2']), 2800);

    // Phase 1 -> 2: After 4s
    const t4 = setTimeout(() => {
        setPhase(2);
    }, 4500);

    // Phase 2 -> Complete
    const t5 = setTimeout(() => {
        onComplete();
    }, 5500);

    return () => {
        clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5);
    };
  }, [onComplete]);

  // Pick sample data for visualization based on real seeds
  const seed1 = seedRecipes[0] || { title: '西红柿牛腩', tags: ['酸甜'] };
  const seed2 = seedRecipes[1] || { title: '清蒸鲈鱼', tags: ['清淡'] };

  return (
    <div className="min-h-screen bg-stone-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Background Ambient Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-stone-900 to-stone-900 z-0"></div>
        
        <div className="relative z-10 max-w-md w-full text-center">
            
            {/* CENTRAL ICON */}
            <div className="mb-12 flex justify-center">
                 <div className={`
                    w-20 h-20 rounded-full flex items-center justify-center border-4 
                    transition-all duration-700
                    ${phase === 0 ? 'border-emerald-500/30 bg-emerald-500/10 scale-100' : ''}
                    ${phase === 1 ? 'border-emerald-400 bg-emerald-500 animate-pulse scale-110 shadow-[0_0_50px_rgba(16,185,129,0.5)]' : ''}
                    ${phase === 2 ? 'border-white bg-white text-stone-900 scale-100' : ''}
                 `}>
                    {phase < 2 ? (
                        <span className="text-3xl animate-bounce">🌱</span>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                    )}
                 </div>
            </div>

            {/* TEXT STATUS */}
            <div className="h-16 mb-8">
                 {phase === 0 && (
                     <h2 className="text-2xl font-bold animate-in fade-in slide-in-from-bottom-4">
                         锁定您的口味偏好...
                     </h2>
                 )}
                 {phase === 1 && (
                     <h2 className="text-2xl font-bold animate-in fade-in slide-in-from-bottom-4 text-emerald-300">
                         正在裂变家庭食谱库...
                     </h2>
                 )}
                 {phase === 2 && (
                     <h2 className="text-2xl font-bold animate-in fade-in zoom-in duration-300">
                         规划完成！
                     </h2>
                 )}
            </div>

            {/* VISUALIZATION AREA */}
            <div className="relative h-64 w-full">
                
                {/* SEED LAYER */}
                <div className={`
                    absolute top-0 left-1/2 -translate-x-1/2 flex gap-4 transition-all duration-700
                    ${phase === 0 ? 'opacity-100 translate-y-0' : 'opacity-40 -translate-y-8 blur-sm'}
                `}>
                    {seedRecipes.slice(0, 3).map((r, i) => (
                         <div key={r.id} className="bg-stone-800 p-3 rounded-xl border border-stone-700 text-xs w-24 text-center shadow-lg">
                             <div className="w-6 h-6 rounded-full bg-stone-700 mx-auto mb-2 flex items-center justify-center">✨</div>
                             <div className="truncate">{r.title}</div>
                         </div>
                    ))}
                </div>

                {/* FISSION LINES */}
                {phase >= 1 && (
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-64 h-24">
                        {/* Lines SVG */}
                        <svg className="w-full h-full visible">
                             <path d="M128,0 C128,40 30,40 30,80" fill="none" stroke="#34D399" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_1s_linear_infinite]" />
                             <path d="M128,0 C128,40 226,40 226,80" fill="none" stroke="#34D399" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_1.5s_linear_infinite]" />
                        </svg>
                    </div>
                )}

                {/* EXTENSION LAYER */}
                <div className="absolute top-24 w-full">
                    {visibleExtensions.includes('ext1') && (
                        <div className="absolute left-4 bg-stone-800/90 p-3 rounded-xl border border-emerald-500/50 text-left w-40 shadow-xl animate-in slide-in-from-top-4 fade-in duration-500">
                             <div className="text-[10px] text-emerald-400 mb-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                因为您选了 {seed1.title.slice(0,4)}
                             </div>
                             <div className="font-bold text-sm">延伸出 3 道相关菜</div>
                        </div>
                    )}

                     {visibleExtensions.includes('ext2') && (
                        <div className="absolute right-4 bg-stone-800/90 p-3 rounded-xl border border-emerald-500/50 text-left w-40 shadow-xl animate-in slide-in-from-top-4 fade-in duration-500" style={{top: '40px'}}>
                             <div className="text-[10px] text-emerald-400 mb-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                偏好 {seed2.tags[0]} 口味
                             </div>
                             <div className="font-bold text-sm">匹配 5 道周中晚餐</div>
                        </div>
                    )}
                </div>

            </div>
            
            {/* Progress Bar */}
            <div className="mt-8 bg-stone-800 h-1.5 w-64 mx-auto rounded-full overflow-hidden">
                <div 
                    className="h-full bg-emerald-500 transition-all duration-[5000ms] ease-linear"
                    style={{ width: phase > 0 ? '100%' : '5%' }}
                />
            </div>
             <p className="text-stone-500 text-xs mt-3">AI 正在根据您的“种子菜单”构建全周食谱...</p>

        </div>
    </div>
  );
};

export default PlanGenerationScreen;