
import React, { useState, useEffect } from 'react';
import { FamilyMember, GoalType } from '../types';

interface MemberNeedsPanelProps {
  members: FamilyMember[];
  onUpdateMember: (id: string, updates: Partial<FamilyMember>) => void;
}

const GOAL_KEYWORDS: Partial<Record<GoalType, string[]>> = {
  // --- Self / Partner ---
  [GoalType.WEIGHT_MUSCLE]: ['高蛋白', '低脂', '肌酸'],
  [GoalType.WORK_RECOVERY]: ['易消化', '高营养', '修复'],
  [GoalType.LOW_CARB]: ['低碳水', '血糖稳定', '粗粮'],
  [GoalType.COMPLEXION]: ['抗氧化', '维C', '胶原蛋白'],
  [GoalType.ANTI_FATIGUE]: ['维B丰富', '铁质', '能量'],
  [GoalType.ACNE]: ['抗炎', '清淡', '低GI'],
  [GoalType.SLEEP]: ['助眠', '镁元素', '舒缓'],
  [GoalType.ANTI_AGING]: ['抗氧化', '花青素', '深色蔬菜'],
  [GoalType.GUT]: ['益生元', '膳食纤维', '养胃'],
  [GoalType.LIVER]: ['护肝', '解毒', '绿叶菜'],
  [GoalType.THREE_HIGHS]: ['低钠', '低脂', '低糖'],

  // --- Special Period ---
  [GoalType.PREP_PREGNANCY]: ['叶酸', '优质蛋白', '铁'],
  [GoalType.PREGNANCY]: ['DHA', '钙', '全面营养'],
  [GoalType.POSTPARTUM]: ['温补', '易消化', '下奶'],
  [GoalType.LACTATION]: ['汤水', '蛋白质', '水分'],

  // --- Child ---
  [GoalType.SOLID_FOOD]: ['糊状', '无盐', '高铁米粉'],
  [GoalType.GROWTH]: ['钙质', '蛋白质', '全面'],
  [GoalType.DIGESTION]: ['益生菌', '易消化', '膳食纤维'],
  [GoalType.IRON_ANEMIA]: ['红肉', '动物肝脏', '维C'],
  [GoalType.BRAIN]: ['DHA', '卵磷脂', '深海鱼'],
  [GoalType.IMMUNITY]: ['维生素', '锌', '蛋白质'],
  [GoalType.HEIGHT]: ['钙', '维D', '牛奶'],
  [GoalType.PICKY]: ['色彩丰富', '趣味造型', '隐形蔬菜'],
  [GoalType.EYE]: ['叶黄素', '胡萝卜素', '蓝莓'],
  [GoalType.WEIGHT_CONTROL]: ['低油糖', '粗粮', '控零食'],

  // --- Elders ---
  [GoalType.BLOOD_SUGAR]: ['低GI', '高纤维', '杂粮'],
  [GoalType.BLOOD_LIPID]: ['低脂', '清淡', 'Omega-3'],
  [GoalType.BONE]: ['高钙', '维D', '豆制品'],
  [GoalType.NUTRITION]: ['高营养密度', '易吸收'],
  [GoalType.TEETH]: ['软烂', '易嚼', '流食'],
  [GoalType.NERVE]: ['维B', '谷物', '坚果'],
  [GoalType.HEART_BRAIN]: ['低钠', '低胆固醇', '海鱼'],
};

// Mock memory entries for keywords
const KEYWORD_MEMORIES: Record<string, string> = {
    '低钠': '喜欢稍咸的口味，同时又需调理高血压。',
    '低胆固醇': '关注血脂指标，需严格减少动物内脏与蛋黄摄入。',
    'Omega-3': '近期记忆力减退，希望通过饮食补充脑力与护心。',
    '江浙菜': '习惯了家乡口味，偏好鲜甜、清淡、红烧的做法。',
    '川湘菜': '无辣不欢，可以提升食欲，但希望能少油烹饪。',
    '高蛋白': '正在增肌期，需要每餐补充足量优质蛋白质。',
    '低脂': '严格控制热量摄入，优先选择瘦肉与海鲜。',
    '控卡': '需要制造热量缺口，晚餐尽量减少主食。',
    '易消化': '肠胃功能较弱，偏好软烂、温热的食物。',
    'DHA': '处于大脑发育关键期，每周至少吃两次深海鱼。',
    '钙质': '处于骨骼生长期，需要多食用奶制品与豆制品。',
    '抗氧化': '关注皮肤状态，希望能多吃深色蔬菜与水果。',
    '补水': '皮肤容易干燥，希望能多喝汤水。',
    '营养均衡': '没有特殊偏好，希望每餐蔬菜、肉类、主食搭配合理。',
    '免疫力': '换季容易感冒，希望多吃富含维生素的食物。',
};

const MemberNeedsPanel: React.FC<MemberNeedsPanelProps> = ({ members, onUpdateMember }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempNeeds, setTempNeeds] = useState('');
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

  const editingMember = members.find(m => m.id === editingId);

  const handleOpenEdit = (member: FamilyMember) => {
    setEditingId(member.id);
    setTempNeeds(member.customNeeds || '');
  };

  const handleSave = () => {
    if (editingId) {
      onUpdateMember(editingId, { customNeeds: tempNeeds });
      setEditingId(null);
      setActiveKeyword(null);
    }
  };

  const getKeywords = (member: FamilyMember) => {
    let keywords = new Set<string>();
    
    // 1. Goal Keywords
    member.goals.forEach(g => {
        const mapped = GOAL_KEYWORDS[g];
        if (mapped) mapped.forEach(k => keywords.add(k));
    });

    // 2. Taste Keywords
    member.tastes.slice(0, 3).forEach(t => keywords.add(t));
    
    // 3. Custom Needs
    if (member.customNeeds) keywords.add("✨特别定制");

    return Array.from(keywords).slice(0, 6); // Limit to top 6
  };
  
  // Set initial active keyword when modal opens
  useEffect(() => {
      if (editingMember) {
          const kws = getKeywords(editingMember);
          if (kws.length > 0) setActiveKeyword(kws[0]);
          else setActiveKeyword(null);
      }
  }, [editingMember]);

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-stone-900 mb-3 px-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-emerald-500 rounded-full"></span>
        家庭成员饮食诉求
      </h3>
      
      {/* Scrollable Card List */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
        {members.map(member => (
          <div 
            key={member.id}
            onClick={() => handleOpenEdit(member)}
            className="flex-shrink-0 w-64 bg-white p-4 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
          >
            <div className="flex items-start gap-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${member.avatarColor}`}>
                 {member.role[0]}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                     <h4 className="font-bold text-stone-800 text-sm">{member.role}</h4>
                     <button className="text-stone-300 hover:text-emerald-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3L10.58 12.42a4 4 0 0 1-1.343.834l-3.155 1.262a.5.5 0 0 1-.65-.65Z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                        </svg>
                     </button>
                  </div>
                  
                  {/* Keywords Grid */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                     {getKeywords(member).map(k => (
                        <span key={k} className="text-[10px] bg-stone-50 text-stone-600 px-1.5 py-0.5 rounded-md border border-stone-100 truncate max-w-full">
                           {k}
                        </span>
                     ))}
                     {getKeywords(member).length === 0 && (
                        <span className="text-[10px] text-stone-400 italic">暂无特定诉求</span>
                     )}
                  </div>
                  
                  {/* Custom Needs Preview */}
                  {member.customNeeds && (
                      <p className="mt-2 text-[10px] text-emerald-600 truncate bg-emerald-50/50 px-1.5 py-0.5 rounded">
                         "{member.customNeeds}"
                      </p>
                  )}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editingMember && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/20 backdrop-blur-[1px] animate-in fade-in duration-200">
           <div 
             className="bg-white w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
             onClick={(e) => e.stopPropagation()}
           >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md ${editingMember.avatarColor}`}>
                        {editingMember.role[0]}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-stone-900">{editingMember.role}的饮食档案</h3>
                        <p className="text-xs text-stone-400">已关联 {editingMember.goals.length} 个健康目标</p>
                    </div>
                 </div>
                 <button onClick={() => setEditingId(null)} className="p-2 bg-stone-50 rounded-full text-stone-400 hover:bg-stone-100">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                 </button>
              </div>

              {/* Keyword Summary & Memory Context */}
              <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-100 transition-all">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">当前关键词 (点击查看记忆)</span>
                  
                  {/* Interactive Tags */}
                  <div className="flex flex-wrap gap-2 mb-1">
                      {getKeywords(editingMember).map(k => (
                          <button 
                             key={k} 
                             onClick={() => setActiveKeyword(k)}
                             className={`text-xs font-medium px-2 py-1 rounded-lg border transition-all ${activeKeyword === k ? 'bg-stone-800 text-white border-stone-800 shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'}`}
                          >
                              {k}
                          </button>
                      ))}
                  </div>
                  
                  {/* Memory Context Display */}
                  {activeKeyword && (
                      <div className="mt-3 pt-3 border-t border-stone-200/50 animate-in fade-in slide-in-from-top-1">
                           <div className="flex items-start gap-2">
                               <span className="text-emerald-500 mt-0.5 shrink-0">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                                  </svg>
                               </span>
                               <p className="text-xs text-stone-600 leading-relaxed">
                                   <span className="font-bold text-stone-800 mr-1">{activeKeyword}</span>
                                   {KEYWORD_MEMORIES[activeKeyword] || '基于当前的健康目标自动生成的推荐关键词。'}
                               </p>
                           </div>
                      </div>
                  )}
              </div>

              {/* Natural Language Input */}
              <div className="mb-6">
                  <label className="block text-sm font-bold text-stone-800 mb-2 flex justify-between">
                     <span>补充详细需求</span>
                     <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">AI 语义识别中</span>
                  </label>
                  <textarea 
                     className="w-full h-24 bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all resize-none"
                     placeholder={`例如：${editingMember.role}最近在备孕，需要多补充铁质，少吃寒性食物...`}
                     value={tempNeeds}
                     onChange={(e) => setTempNeeds(e.target.value)}
                  />
                  <p className="text-[10px] text-stone-400 mt-2">您可以输入任何具体的饮食偏好或身体状况，AI 将自动调整推荐策略。</p>
              </div>

              {/* Save Button */}
              <button 
                 onClick={handleSave}
                 className="w-full bg-stone-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-black active:scale-95 transition-all"
              >
                 保存并更新推荐
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MemberNeedsPanel;
