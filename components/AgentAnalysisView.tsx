
import React, { useEffect, useState, useRef } from 'react';
import { FamilyMember, RoleType, GoalType } from '../types';

interface AgentAnalysisViewProps {
  members: FamilyMember[];
  onComplete: () => void;
}

// Helper to determine example dishes based on tags/needs
const getExampleDishes = (tags: string[], exclude: string[] = []): string[] => {
    const pool = [
        { name: '清蒸鲈鱼', tags: ['清淡', '高蛋白', 'DHA', '成长'] },
        { name: '西红柿牛腩', tags: ['酸甜', '开胃', '高蛋白', '北方菜'] },
        { name: '虾仁蒸蛋', tags: ['易消化', '清淡', '老少皆宜'] },
        { name: '彩椒鸡丁', tags: ['低脂', '减脂', '色彩丰富'] },
        { name: '蒜蓉西兰花', tags: ['素菜', '清淡', '高纤维'] },
        { name: '玉米排骨汤', tags: ['滋补', '汤', '清淡'] },
        { name: '麻婆豆腐', tags: ['香辣', '下饭', '川湘菜'] },
        { name: '小炒黄牛肉', tags: ['香辣', '高蛋白'] }
    ];

    // Find matches
    const matches = pool.filter(dish => 
        !exclude.includes(dish.name) && 
        dish.tags.some(t => tags.includes(t))
    );
    
    // Return top 2 names, or fallbacks if no matches
    if (matches.length >= 1) return matches.slice(0, 2).map(d => d.name);
    return exclude.includes('西红柿牛腩') ? ['白灼菜心'] : ['西红柿牛腩'];
};

const AgentAnalysisView: React.FC<AgentAnalysisViewProps> = ({ members, onComplete }) => {
  const [step, setStep] = useState(0); // 0: Init, 1: Summary, 2: Scenario 1, 3: Scenario 2, 4: Retrieving
  
  // Logic to generate the content dynamically
  const content = React.useMemo(() => {
      // 1. Analyze Data
      const goals = members.flatMap(m => m.goals);
      const tastes = members.flatMap(m => m.tastes);
      const roles = members.map(m => m.role);
      
      const hasChild = roles.includes(RoleType.CHILD);
      const hasSpicy = tastes.includes('香辣') || tastes.includes('川湘菜');
      const hasMild = tastes.includes('清淡');
      const needsMuscle = goals.includes(GoalType.WEIGHT_MUSCLE);
      
      // --- PART 1: SUMMARY ---
      let summaryText = `收到全家 ${members.length} 口人的饮食档案。\n`;
      members.forEach(m => {
          const goalShort = m.goals.length > 0 ? m.goals[0] : '日常营养';
          summaryText += `• ${m.role === RoleType.SELF ? '您' : m.role}：关注${goalShort}`;
          if (m.tastes.length > 0) summaryText += `，偏好${m.tastes[0]}`;
          summaryText += '。\n';
      });

      // --- PART 2: SCENARIOS ---
      const scenarios = [];

      // Scenario A: The Common Denominator (Family Dinner)
      let scenarioATitle = "场景一：全家共享的营养正餐";
      let strategyA = "";
      let tagsA: string[] = ['家常', '营养均衡'];

      if (hasSpicy && hasMild) {
          strategyA = "采用「一锅出」或「蒸煮」为主的烹饪方式，保留食材原味，满足清淡口味成员；另备蘸料或一道风味小炒满足重口味需求。";
          tagsA = ['清淡', '蒸菜', '鲜美'];
      } else if (needsMuscle) {
          strategyA = "全家主菜优选低脂高蛋白食材（牛/鱼/虾），减少隐形油脂，既满足增肌需求，也不给家人增加代谢负担。";
          tagsA = ['高蛋白', '低脂', '牛肉', '鱼'];
      } else {
          strategyA = "注重荤素搭配与色彩呈现，在常见的家常菜中强化蛋白质与膳食纤维的配比。";
          tagsA = ['家常', '色彩丰富'];
      }
      const examplesA = getExampleDishes(tagsA);

      scenarios.push({
          title: scenarioATitle,
          strategy: strategyA,
          examples: examplesA
      });

      // Scenario B: Special Needs (Child or Specific Goal)
      let scenarioBTitle = "";
      let strategyB = "";
      let tagsB: string[] = [];

      const child = members.find(m => m.role === RoleType.CHILD);
      if (child) {
          scenarioBTitle = `场景二：${child.ageGroup?.includes('2-3') ? '幼儿' : '孩子'}的营养加餐/特供`;
          strategyB = `针对${child.goals[0] || '成长'}需求，将${child.tastes[0] || '喜欢'}的口味融入高营养密度食材。对于不爱吃的蔬菜，采用「隐形处理」法。`;
          tagsB = ['儿童', '高蛋白', '易消化', '酸甜'];
      } else if (goals.includes(GoalType.WEIGHT_MUSCLE)) {
          scenarioBTitle = "场景二：减脂期的控卡调整";
          strategyB = "在主食上做区分，为您准备粗粮代替精米白面；肉类烹饪避免勾芡糖醋。";
          tagsB = ['减脂', '低碳', '粗粮'];
      } else if (hasSpicy) {
          scenarioBTitle = "场景二：重口味的灵魂安抚";
          strategyB = "虽然全家主打健康，但必须安排一道「下饭神菜」，释放压力，满足味蕾。";
          tagsB = ['香辣', '下饭', '川湘菜'];
      } else {
          scenarioBTitle = "场景二：时令与汤水滋补";
          strategyB = "根据当前季节，安排一道润燥或温补的汤品，调理全家肠胃。";
          tagsB = ['汤', '滋补'];
      }
      const examplesB = getExampleDishes(tagsB, examplesA);

      if (scenarioBTitle) {
          scenarios.push({
              title: scenarioBTitle,
              strategy: strategyB,
              examples: examplesB
          });
      }

      return { summaryText, scenarios };
  }, [members]);


  // Sequencing Logic
  useEffect(() => {
      // Step 0 -> 1 (Summary) immediately
      const t1 = setTimeout(() => setStep(1), 500);
      
      // Step 1 -> 2 (Scenario 1)
      const t2 = setTimeout(() => setStep(2), 2500);

      // Step 2 -> 3 (Scenario 2)
      const t3 = setTimeout(() => setStep(3), 5500);

      // Step 3 -> 4 (Retrieving) -> Complete
      const t4 = setTimeout(() => {
          setStep(4);
          setTimeout(onComplete, 1500);
      }, 9000);

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);


  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Ambient Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-stone-200/40 via-[#F9F8F6] to-[#F9F8F6]"></div>

        <div className="relative z-10 w-full max-w-md space-y-6">
            
            {/* Header: Agent Identity */}
            <div className="flex items-center gap-4 mb-2 animate-in slide-in-from-top-4 duration-700">
                <div className="w-14 h-14 rounded-full bg-[#2C2A26] flex items-center justify-center text-2xl shadow-xl relative ring-4 ring-[#EFECE5]">
                    👨‍🍳
                    {step < 4 && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#F9F8F6] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-serif font-bold text-stone-900 leading-tight">AI 膳食规划师</h2>
                    <p className="text-xs text-stone-500 font-medium tracking-wide">
                        {step === 4 ? '正在检索全网菜谱...' : '正在为您定制家庭方案...'}
                    </p>
                </div>
            </div>

            {/* CARD 1: SUMMARY (Chat Bubble Style) */}
            {step >= 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-stone-200 shadow-sm relative">
                        <div className="absolute top-0 left-0 -mt-2 -ml-2 w-4 h-4 bg-white border-t border-l border-stone-200 transform -rotate-45"></div>
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">已识别家庭档案</h3>
                        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line font-medium">
                            {content.summaryText}
                        </p>
                    </div>
                </div>
            )}

            {/* CARD 2: SCENARIO A */}
            {step >= 2 && content.scenarios[0] && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-[#EFECE5] p-5 rounded-2xl border border-[#E0DDD5] shadow-md">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-1.5 h-4 bg-stone-800 rounded-full"></span>
                            <h3 className="font-bold text-stone-900 text-sm">{content.scenarios[0].title}</h3>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="bg-white/60 p-3 rounded-xl">
                                <span className="text-xs font-bold text-stone-500 block mb-1">服务策略</span>
                                <p className="text-xs text-stone-800 leading-relaxed">
                                    {content.scenarios[0].strategy}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                    示例: {content.scenarios[0].examples.join('、')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CARD 3: SCENARIO B */}
            {step >= 3 && content.scenarios[1] && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-stone-50 rounded-bl-[40px] -mr-8 -mt-8"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1.5 h-4 bg-stone-400 rounded-full"></span>
                                <h3 className="font-bold text-stone-900 text-sm">{content.scenarios[1].title}</h3>
                            </div>
                            
                            <div className="space-y-3">
                                <p className="text-xs text-stone-600 leading-relaxed border-l-2 border-stone-200 pl-3">
                                    {content.scenarios[1].strategy}
                                </p>
                                
                                <div className="flex items-center gap-2 text-xs pt-1">
                                    <span className="text-stone-400">推荐:</span>
                                    {content.scenarios[1].examples.map(ex => (
                                        <span key={ex} className="font-bold text-stone-700 bg-stone-50 px-2 py-1 rounded border border-stone-100">
                                            {ex}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Indicator for Final Step */}
            {step === 4 && (
                <div className="flex items-center justify-center gap-2 text-stone-400 text-xs font-bold animate-pulse pt-4">
                    <svg className="animate-spin h-3 w-3 text-stone-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    正在生成初选清单...
                </div>
            )}

        </div>
    </div>
  );
};

export default AgentAnalysisView;
