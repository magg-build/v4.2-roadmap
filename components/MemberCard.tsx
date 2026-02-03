
import React, { useState, useEffect } from 'react';
import { FamilyMember, GoalType, RoleType, Gender, ChildAgeGroup } from '../types';

interface MemberCardProps {
  member: FamilyMember;
  isEditing: boolean;
  onEditStart: () => void;
  onToggleGoal: (goal: GoalType) => void;
  onUpdateMember: (updates: Partial<FamilyMember>) => void;
  onConfirm: () => void;
  onDelete?: () => void;
  
  // Navigation Props
  isLast?: boolean;
  isFirst?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  
  // viewMode
  viewMode?: 'default' | 'modal';
}

// --- Goal Definitions ---

const SELF_PARTNER_GOALS = [
  GoalType.WEIGHT_MUSCLE, GoalType.WORK_RECOVERY, GoalType.LOW_CARB, 
  GoalType.COMPLEXION, GoalType.ANTI_FATIGUE, GoalType.ACNE, 
  GoalType.SLEEP, GoalType.ANTI_AGING, GoalType.GUT, 
  GoalType.LIVER, GoalType.THREE_HIGHS
];

const SPECIAL_PERIOD_GOALS = [
  GoalType.PREP_PREGNANCY, GoalType.PREGNANCY, 
  GoalType.POSTPARTUM, GoalType.LACTATION
];

const ELDER_GOALS = [
  GoalType.GUT, GoalType.BLOOD_SUGAR, GoalType.BLOOD_LIPID, 
  GoalType.BONE, GoalType.NUTRITION, GoalType.TEETH, 
  GoalType.NERVE, GoalType.HEART_BRAIN
];

// Map age groups to their specific goal lists
const CHILD_GOAL_MAP: Record<ChildAgeGroup, GoalType[]> = {
    [ChildAgeGroup.BABY_0_6]: [], // No goals for nursing
    [ChildAgeGroup.TODDLER_6_24]: [GoalType.SOLID_FOOD],
    [ChildAgeGroup.TODDLER_2_3]: [
      GoalType.GROWTH, GoalType.DIGESTION, GoalType.IRON_ANEMIA, 
      GoalType.BRAIN, GoalType.IMMUNITY
    ],
    [ChildAgeGroup.PRESCHOOL_3_6]: [
      GoalType.HEIGHT, GoalType.PICKY, GoalType.EYE, 
      GoalType.DIGESTION, GoalType.IRON_ANEMIA, GoalType.BRAIN, 
      GoalType.IMMUNITY, GoalType.WEIGHT_CONTROL
    ],
    [ChildAgeGroup.SCHOOL_6_12]: [
      GoalType.HEIGHT, GoalType.PICKY, GoalType.EYE, 
      GoalType.DIGESTION, GoalType.IRON_ANEMIA, GoalType.BRAIN, 
      GoalType.IMMUNITY, GoalType.WEIGHT_CONTROL
    ],
    [ChildAgeGroup.TEEN_12_18]: [
      GoalType.HEIGHT, GoalType.PICKY, GoalType.EYE, 
      GoalType.DIGESTION, GoalType.IRON_ANEMIA, GoalType.BRAIN, 
      GoalType.IMMUNITY, GoalType.WEIGHT_CONTROL
    ]
};

// --- Conversational Feedback Dictionary ---
const AI_FEEDBACK_MAP: Partial<Record<GoalType, string>> = {
    [GoalType.WEIGHT_MUSCLE]: "收到，为你规划高蛋白低脂的食谱。",
    [GoalType.WORK_RECOVERY]: "明白，会多选一些恢复体力的食材。",
    [GoalType.LOW_CARB]: "好的，晚餐会严格控制主食摄入。",
    [GoalType.COMPLEXION]: "没问题，富含维C和抗氧化的食材安排上！",
    [GoalType.ANTI_FATIGUE]: "看起来比较累？我会加点补充能量的食材。",
    [GoalType.ACNE]: "收到，我们会避开高糖油腻，吃得清爽些。",
    [GoalType.SLEEP]: "好的，晚餐会安排一些助眠的食材。",
    [GoalType.ANTI_AGING]: "明白，紫色和深色蔬菜会是重点。",
    [GoalType.GUT]: "收到，我会选膳食纤维丰富且温和的菜式。",
    [GoalType.LIVER]: "好的，多吃点绿叶菜，给身体减负。",
    [GoalType.THREE_HIGHS]: "明白，低盐低脂低糖是关键。",
    [GoalType.PREP_PREGNANCY]: "收到，为你补充叶酸和优质蛋白。",
    [GoalType.PREGNANCY]: "明白，孕期营养均衡最重要。",
    [GoalType.POSTPARTUM]: "好的，温补气血，助力恢复。",
    [GoalType.LACTATION]: "收到，多喝汤水，保证奶水充足。",
    
    [GoalType.SOLID_FOOD]: "明白，从细腻到颗粒，科学过渡。",
    [GoalType.GROWTH]: "明白，长身体的关键期，营养密度一定要高。",
    [GoalType.DIGESTION]: "好的，让肚子舒服点。",
    [GoalType.IRON_ANEMIA]: "收到，红肉和肝脏会巧妙搭配进去。",
    [GoalType.BRAIN]: "好的，核桃、深海鱼等补脑食材安排上。",
    [GoalType.IMMUNITY]: "收到，构筑健康防线。",
    [GoalType.HEIGHT]: "明白，钙质和维生素D是关键。",
    [GoalType.PICKY]: "放心，我会把不爱吃的菜藏得很好吃！",
    [GoalType.EYE]: "收到，胡萝卜和蓝莓会经常出现哦。",
    [GoalType.WEIGHT_CONTROL]: "收到，科学控制体重，不让身体虚胖。",
    
    [GoalType.BLOOD_SUGAR]: "收到，严格筛选低GI食材。",
    [GoalType.BLOOD_LIPID]: "明白，清淡饮食，减少油脂。",
    [GoalType.BONE]: "好的，多补充钙质，强健骨骼。",
    [GoalType.NUTRITION]: "收到，全面补充营养，增强体质。",
    [GoalType.TEETH]: "明白，食物会做得软烂一些。",
    [GoalType.NERVE]: "好的，补充B族维生素，营养神经。",
    [GoalType.HEART_BRAIN]: "收到，保护心脑血管健康。",
};

const MemberCard: React.FC<MemberCardProps> = ({ 
  member, 
  onToggleGoal,
  viewMode = 'default',
  onNext,
  onPrev,
  isLast,
  isFirst
}) => {
  
  // --- Feedback State ---
  const [aiMessage, setAiMessage] = useState<string>('');
  const [showSpecialPeriod, setShowSpecialPeriod] = useState(false);
  
  // --- Custom Input State ---
  const [customInput, setCustomInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Clear message when switching members
  useEffect(() => {
      setAiMessage('');
      setShowSpecialPeriod(false);
      setCustomInput('');
  }, [member.id]);

  const handleGoalToggle = (goal: GoalType) => {
      const isSelecting = !member.goals.includes(goal);
      onToggleGoal(goal);

      if (isSelecting) {
          setAiMessage(''); 
          setTimeout(() => {
              const msg = AI_FEEDBACK_MAP[goal] || "好的，已记录这个需求。";
              setAiMessage(msg);
          }, 100);
      } else {
         setAiMessage('');
      }
  };

  const handleCustomSubmit = () => {
    const val = customInput.trim();
    if (!val) return;
    
    onToggleGoal(val as GoalType);
    setCustomInput('');
    setAiMessage(`明白，已添加"${val}"关注点`);
  };

  const toggleVoice = () => {
      if (isListening) {
          setIsListening(false);
      } else {
          setIsListening(true);
          setAiMessage("正在聆听...");
          // Simulate voice input result
          setTimeout(() => {
             setIsListening(false);
             setCustomInput("易过敏");
             setAiMessage("已识别语音输入");
          }, 2000);
      }
  };

  const getDisplayRole = () => {
      if (member.name) return member.name;
      if (member.role === RoleType.PARTNER) {
          return member.gender === Gender.MALE ? '老公/男友' : '老婆/女友';
      }
      if (member.role === RoleType.CHILD) {
          return member.gender === Gender.MALE ? '儿子' : '女儿';
      }
      return member.role;
  };

  // --- Logic to determine which goal groups to show ---
  const isFemale = member.gender === Gender.FEMALE;
  
  // 1. Self / Partner Group
  const isSelfOrPartner = [RoleType.SELF, RoleType.PARTNER].includes(member.role);
  
  // 2. Child Group
  const isChild = member.role === RoleType.CHILD;
  
  // 3. Elder Group (Dad, Mom, In-laws, Grandparents)
  const isElder = [
      RoleType.DAD, RoleType.MOM, 
      RoleType.INLAW_DAD, RoleType.INLAW_MOM, 
      RoleType.GRANDPA, RoleType.GRANDMA
  ].includes(member.role);

  // Determine goals to display
  let availableGoals: GoalType[] = [];
  
  if (isSelfOrPartner) {
      availableGoals = SELF_PARTNER_GOALS;
  } else if (isElder) {
      availableGoals = ELDER_GOALS;
  } else if (isChild && member.ageGroup) {
      availableGoals = CHILD_GOAL_MAP[member.ageGroup] || [];
  } else if (member.role === RoleType.OTHER) {
      availableGoals = [...SELF_PARTNER_GOALS, ...ELDER_GOALS]; // Fallback mix
  }

  // Determine if special period is active (Female Self/Partner)
  const canHaveSpecialPeriod = isFemale && isSelfOrPartner;

  // Render logic
  return (
    <div className="flex flex-col h-full min-h-[400px] justify-between">
      
      {/* 1. Header Area with Arrow Navigation */}
      <div>
         <div className="flex items-center justify-between mb-6 px-1">
             {/* Left Arrow (Prev) */}
             <button 
                onClick={onPrev}
                disabled={isFirst}
                className={`p-2 -ml-2 rounded-full transition-colors ${!onPrev || isFirst ? 'opacity-0 pointer-events-none' : 'text-stone-300 hover:text-stone-800 hover:bg-stone-50'}`}
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
             </button>

             {/* Center Content */}
             <div className="flex items-center gap-4">
                 <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg 
                    ${member.role === RoleType.PARTNER && member.gender === Gender.FEMALE ? 'bg-[#FF7D99]' : ''}
                    ${member.role === RoleType.PARTNER && member.gender === Gender.MALE ? 'bg-[#3B82F6]' : ''}
                    ${member.role !== RoleType.PARTNER ? member.avatarColor : ''}
                 `}>
                     {member.role === RoleType.OTHER && member.name ? member.name.charAt(0) : member.role[0]}
                 </div>
                 <div>
                     <h2 className="text-2xl font-bold text-stone-900 tracking-tight">{getDisplayRole()}</h2>
                     <p className="text-sm text-stone-500 mt-1">
                        {member.goals.length === 0 ? "请选择该成员的饮食关注点" : `已选择 ${member.goals.length} 个关注点`}
                     </p>
                 </div>
             </div>

             {/* Right Arrow (Next - Switching) */}
             <button 
                onClick={onNext}
                disabled={isLast}
                className={`p-2 -mr-2 rounded-full transition-colors ${!onNext || isLast ? 'opacity-0 pointer-events-none' : 'text-stone-300 hover:text-stone-800 hover:bg-stone-50'}`}
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
             </button>
         </div>

         {/* 2. Chat Bubble (AI Feedback) */}
         <div className="h-10 mb-2">
            {aiMessage && (
                <div className="inline-block bg-[#2C2A26] text-white text-xs px-3 py-2 rounded-tr-xl rounded-bl-xl rounded-br-xl animate-in fade-in slide-in-from-left-2 duration-300 shadow-sm">
                   {aiMessage}
                </div>
            )}
         </div>

         {/* 3. Goal Selection Area */}
         <div className="space-y-6">
             
             {/* Special Logic for Babies (0-6m) */}
             {isChild && member.ageGroup === ChildAgeGroup.BABY_0_6 && (
                 <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-center">
                     <p className="text-sm text-stone-500 font-bold mb-1">👶 哺乳期宝宝</p>
                     <p className="text-xs text-stone-400">目前阶段无需额外饮食规划，专注于母乳或配方奶即可。</p>
                 </div>
             )}

             {/* MAIN GOALS GRID */}
             {availableGoals.length > 0 && (
                <div>
                     <div className="flex flex-wrap gap-3">
                        {availableGoals.map(goal => {
                            const isSelected = member.goals.includes(goal);
                            return (
                                <button
                                    key={goal}
                                    onClick={() => handleGoalToggle(goal)}
                                    className={`
                                        px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border relative overflow-hidden
                                        ${isSelected 
                                            ? 'bg-[#2C2A26] text-[#F9F8F6] border-[#2C2A26] shadow-md scale-105' 
                                            : 'bg-white text-[#5C554B] border-[#E0DDD5] hover:border-[#CFCBC4] hover:bg-stone-50'
                                        }
                                    `}
                                >
                                    {goal}
                                </button>
                            );
                        })}
                     </div>
                </div>
             )}

             {/* Custom Input Field (Voice & Text) */}
             <div className="relative">
                <div className={`
                    flex items-center bg-white border transition-all rounded-full px-4 py-2.5 shadow-sm
                    ${isListening 
                        ? 'border-emerald-400 ring-2 ring-emerald-50' 
                        : 'border-stone-200 focus-within:border-stone-800 focus-within:ring-1 focus-within:ring-stone-200'
                    }
                `}>
                    <span className="text-stone-400 mr-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                    </span>
                    
                    <input 
                        type="text" 
                        value={isListening ? '正在聆听您的需求...' : customInput}
                        onChange={(e) => !isListening && setCustomInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                        placeholder={isListening ? "" : "自定义关注点 (如: 痛风/少盐)"}
                        className={`
                            flex-1 bg-transparent text-xs font-bold focus:outline-none placeholder:text-stone-400 text-stone-800 min-w-0
                            ${isListening ? 'animate-pulse text-emerald-600' : ''}
                        `}
                        disabled={isListening}
                    />

                    <div className="h-4 w-[1px] bg-stone-200 mx-2 flex-shrink-0"></div>

                    <button 
                        onClick={toggleVoice}
                        className={`
                            p-1.5 rounded-full transition-all active:scale-90 flex-shrink-0
                            ${isListening 
                                ? 'bg-emerald-500 text-white shadow-md scale-110' 
                                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                            }
                        `}
                    >
                        {isListening ? (
                             <span className="flex gap-0.5 h-3 items-center justify-center w-3">
                                <span className="w-0.5 h-2 bg-white animate-[bounce_1s_infinite] rounded-full"></span>
                                <span className="w-0.5 h-3 bg-white animate-[bounce_1s_infinite_0.1s] rounded-full"></span>
                                <span className="w-0.5 h-2 bg-white animate-[bounce_1s_infinite_0.2s] rounded-full"></span>
                             </span>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                                <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.964V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.536c2.96-.379 5.25-2.904 5.25-5.964v-.357a.75.75 0 00-1.5 0V10c0 2.21-1.79 4-4 4s-4-1.79-4-4v-.357z" />
                            </svg>
                        )}
                    </button>
                </div>
           </div>

             {/* SPECIAL PERIOD (Expandable for Female Adults) */}
             {canHaveSpecialPeriod && (
                 <div className="pt-2">
                     <button 
                        onClick={() => setShowSpecialPeriod(!showSpecialPeriod)}
                        className={`
                            w-full flex items-center justify-between p-3 rounded-xl border transition-all
                            ${showSpecialPeriod ? 'bg-pink-50 border-pink-200' : 'bg-white border-dashed border-stone-300'}
                        `}
                     >
                         <span className={`text-sm font-bold ${showSpecialPeriod ? 'text-pink-800' : 'text-stone-400'}`}>
                            🌸 特殊时期 (备孕/孕产)
                         </span>
                         <span className={`transform transition-transform ${showSpecialPeriod ? 'rotate-180 text-pink-500' : 'text-stone-300'}`}>▼</span>
                     </button>
                     
                     {showSpecialPeriod && (
                         <div className="grid grid-cols-2 gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
                             {SPECIAL_PERIOD_GOALS.map(goal => {
                                 const isSelected = member.goals.includes(goal);
                                 return (
                                     <button
                                         key={goal}
                                         onClick={() => handleGoalToggle(goal)}
                                         className={`
                                             py-2.5 rounded-lg text-xs font-bold transition-all border
                                             ${isSelected 
                                                 ? 'bg-pink-500 text-white border-pink-500 shadow-md' 
                                                 : 'bg-white text-stone-500 border-pink-100 hover:bg-pink-50'
                                             }
                                         `}
                                     >
                                         {goal}
                                     </button>
                                 )
                             })}
                         </div>
                     )}
                 </div>
             )}
         </div>
      </div>

      {/* 4. Footer Navigation - Single Button */}
      <div className="flex justify-end pt-6 border-t border-stone-100 mt-6">
          {onNext && (
              <button 
                  onClick={onNext}
                  className="bg-stone-900 text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center gap-2"
              >
                  {isLast ? '完成关注点' : '下一位'}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
              </button>
          )}
      </div>

    </div>
  );
};

export default MemberCard;
