
import React, { useState, TouchEvent, useEffect } from 'react';
import { FamilyMember, RoleType } from '../types';

interface TasteCardProps {
  member: FamilyMember;
  isEditing: boolean;
  onEditStart: () => void;
  onUpdateTastes: (tastes: string[]) => void;
  onUpdateRestrictions?: (restrictions: string[]) => void; 
  onConfirm: () => void;
  // Navigation Props
  isLast?: boolean;
  isFirst?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}

// --- DATA STRUCTURE: TAG RELATIONSHIP MAP ---
// Designed for "Home Cooking" scenarios with realistic associations.
const TAG_RELATION_MAP: Record<string, string[]> = {
    // --- 1. 核心菜系 (Cuisines) ---
    '川湘菜': ['麻婆豆腐', '宫保鸡丁', '回锅肉', '剁椒鱼头', '小炒黄牛肉', '农家小炒肉', '水煮肉片', '酸菜鱼'],
    '江浙菜': ['红烧肉', '糖醋排骨', '清蒸鱼', '红烧狮子头', '腌笃鲜', '西湖牛肉羹', '油焖笋'],
    '北方菜': ['猪肉炖粉条', '西红柿炒鸡蛋', '锅包肉', '京酱肉丝', '饺子', '地三鲜', '葱爆羊肉'],
    '粤菜': ['白切鸡', '清蒸鱼', '煲仔饭', '白灼菜心', '虾饺', '老火靓汤', '蚝油生菜'],

    // --- 2. 核心口味 (Flavors) ---
    '香辣': ['辣子鸡', '小炒肉', '毛血旺', '口水鸡', '超级下饭'],
    '重口味': ['肥肠', '臭鳜鱼', '螺蛳粉', '脑花', '榴莲', '特别的爱'],
    '清淡': ['蒸水蛋', '清炒时蔬', '白灼虾', '菌菇汤', '低油少盐', '上汤娃娃菜'],
    '酸甜': ['菠萝咕咾肉', '糖醋里脊', '松鼠桂鱼', '番茄炒蛋', '开胃'],
    '浓郁': ['红烧猪蹄', '咖喱牛腩', '黄焖鸡', '梅菜扣肉', '酱香'],
    '不辣': ['清蒸鱼', '白灼虾', '肉末蒸蛋', '西红柿炒鸡蛋', '菌菇汤'],

    // --- 3. 家庭场景/功能 (Home Scenarios) ---
    '快手': ['番茄炒蛋', '青椒肉丝', '手撕包菜', '洋葱炒蛋', '十分钟搞定', '盖浇饭'],
    '下饭': ['鱼香肉丝', '肉末茄子', '酸豆角肉末', '麻婆豆腐', '汤汁浓郁', '两碗米饭'],
    '低脂': ['凉拌鸡丝', '清蒸鱼', '白灼蔬菜', '荞麦面', '减脂餐', '鸡胸肉'],
    '酥脆': ['小酥肉', '炸鸡翅', '软炸里脊', '干炸丸子', '空气炸锅'],
    '肉食动物': ['红烧肉', '炸鸡翅', '牛排', '烤羊排', '大口吃肉'],
    '长身体': ['高钙', '高蛋白', 'DHA', '牛肉', '排骨汤'],
    '易消化': ['小米粥', '蒸蛋', '龙须面', '养胃', '软烂'],
    '滋补': ['老火靓汤', '乌鸡汤', '羊肉火锅', '海参', '温补'],

    // --- 4. 菜品 -> 关联食材/属性 (Dishes -> Ingredients/Attributes) ---
    '麻婆豆腐': ['嫩豆腐', '肉末', '麻辣味', '拌饭神器', '豆瓣酱'],
    '宫保鸡丁': ['鸡胸肉', '花生米', '大葱', '荔枝味', '经典川菜'],
    '回锅肉': ['五花肉', '蒜苗', '豆瓣酱', '干饭人', '肥而不腻'],
    '小炒黄牛肉': ['牛肉', '芹菜', '泡椒', '香菜', '鲜辣'],
    '剁椒鱼头': ['鱼头', '剁椒', '蒸菜', '面条伴侣'],
    '红烧肉': ['五花肉', '鹌鹑蛋', '浓油赤酱', '解馋', '慢炖'],
    '清蒸鱼': ['鲈鱼', '葱姜', '蒸菜', '高蛋白', '鲜美'],
    '西红柿炒鸡蛋': ['鸡蛋', '西红柿', '国民菜', '酸甜', '拌饭'],
    '猪肉炖粉条': ['五花肉', '粉条', '大白菜', '炖菜', '暖身'],
    '可乐鸡翅': ['鸡中翅', '甜口', '儿童最爱', '脱骨'],
    
    // --- 5. 食材 -> 关联菜品/属性 (Ingredients -> Dishes/Attributes) ---
    '嫩豆腐': ['皮蛋豆腐', '鲫鱼豆腐汤', '易消化', '凉拌'],
    '肉末': ['肉末茄子', '蚂蚁上树', '肉末蒸蛋', '百搭'],
    '鸡胸肉': ['宫保鸡丁', '凉拌鸡丝', '香煎鸡胸', '低脂', '高蛋白'],
    '五花肉': ['红烧肉', '回锅肉', '梅菜扣肉', '粉蒸肉'],
    '牛肉': ['土豆炖牛腩', '小炒黄牛肉', '黑椒牛柳', '高蛋白'],
    '鱼头': ['鱼头豆腐汤', '剁椒鱼头', '胶原蛋白'],
    '肥肠': ['干煸肥肠', '溜肥肠', '肥肠面', '重口味'],
    
    // --- 6. 属性 -> 更多关联 (Attributes -> More) ---
    '拌饭神器': ['两碗米饭', '汤汁浓郁', '碳水炸弹'],
    '高蛋白': ['虾仁', '牛肉', '鸡胸肉', '鸡蛋'],
    '麻辣味': ['水煮鱼', '麻辣香锅', '冒菜'],
};

const DIETARY_RESTRICTIONS = [
    '坚果', '鱼类', '乳制品', '鸡蛋', '小麦及麸质',
    '花生', '大豆及豆制品', '甲壳类动物', '海鲜',
    '羊肉', '牛肉', '猪肉', '鸡肉'
];

interface DisplayTag {
    id: string; // unique id
    label: string;
    source?: string; // which tag spawned this one
}

// Helper to determine initial tags based on Role
const getInitialTags = (role: RoleType): string[] => {
    // Child logic: Sweet/Sour, Crispy, Meat, Growth
    if (role === RoleType.CHILD) {
        return ['酸甜', '酥脆', '西红柿炒鸡蛋', '可乐鸡翅', '不辣', '肉食动物', '长身体', '快手'];
    }
    // Elder logic: Mild, Soft, Digestible
    if ([RoleType.DAD, RoleType.MOM, RoleType.GRANDPA, RoleType.GRANDMA, RoleType.INLAW_DAD, RoleType.INLAW_MOM].includes(role)) {
        return ['清淡', '易消化', '软烂', '滋补', '低油少盐', '北方菜', '江浙菜', '养生'];
    }
    // Partner/Self/Default: Diverse, Regional, Flavorful
    return [
        '川湘菜', '江浙菜', '北方菜', '粤菜', 
        '香辣', '清淡', '重口味', '下饭'
    ];
};

const TasteCard: React.FC<TasteCardProps> = ({
  member,
  onUpdateTastes,
  onUpdateRestrictions,
  isLast,
  isFirst,
  onNext,
  onPrev
}) => {
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;
  
  // Custom Input & Voice State
  const [customInput, setCustomInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // State for the Tag Cloud
  const [displayTags, setDisplayTags] = useState<DisplayTag[]>([]);

  // Initialize tags when member changes
  useEffect(() => {
      const initials = getInitialTags(member.role);
      // If member already has selections, ensure we show some context or just the defaults + selections?
      // Strategy: Always show defaults. If selections exist, they are highlighted.
      // We also want to add selected tags that are NOT in defaults to the view?
      // For simplicity, just reset to defaults + currently selected tags if they aren't there.
      
      const tags = initials.map(t => ({ id: `${member.id}-init-${t}`, label: t }));
      
      // Ensure existing selections are visible
      member.tastes.forEach(t => {
          if (!tags.some(dt => dt.label === t)) {
              tags.push({ id: `${member.id}-exist-${t}`, label: t });
          }
      });
      
      setDisplayTags(tags);
  }, [member.id, member.role]);

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }
  const onTouchMove = (e: TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX); }
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && onNext) onNext();
    if (distance < -minSwipeDistance && onPrev) onPrev();
  }

  const handleTagClick = (tagLabel: string, index: number) => {
    const isSelected = member.tastes.includes(tagLabel);
    let newTastes: string[];

    if (isSelected) {
        // Deselect logic
        newTastes = member.tastes.filter(t => t !== tagLabel);
    } else {
        // Select logic
        newTastes = [...member.tastes, tagLabel];
        
        // --- FISSION LOGIC ---
        const relations = TAG_RELATION_MAP[tagLabel];
        
        if (relations && relations.length > 0) {
            setDisplayTags(prevTags => {
                const newTags = [...prevTags];
                const existingLabels = new Set(newTags.map(t => t.label));
                
                // Filter out tags that are already visible
                const tagsToAdd = relations
                    .filter(r => !existingLabels.has(r))
                    .map(r => ({ id: `${tagLabel}-${r}-${Date.now()}`, label: r, source: tagLabel }));
                
                // Insert immediately after the clicked tag index
                if (tagsToAdd.length > 0) {
                    newTags.splice(index + 1, 0, ...tagsToAdd);
                }
                return newTags;
            });
        }
    }
    
    onUpdateTastes(newTastes);
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
        const val = customInput.trim();
        if (!member.tastes.includes(val)) {
            onUpdateTastes([...member.tastes, val]);
            // Also add to display tags if not present
            setDisplayTags(prev => {
                if (prev.some(t => t.label === val)) return prev;
                return [...prev, { id: `custom-${val}`, label: val }];
            });
        }
        setCustomInput('');
    }
  };

  const toggleVoice = () => {
      if (isListening) {
          setIsListening(false);
      } else {
          setIsListening(true);
          // Simulate voice input result
          setTimeout(() => {
             setIsListening(false);
             setCustomInput("爆炒腰花"); 
          }, 2000);
      }
  };

  const handleRestrictionToggle = (r: string) => {
      if (!onUpdateRestrictions) return;
      const current = member.restrictions || [];
      const updated = current.includes(r) 
          ? current.filter(item => item !== r) 
          : [...current, r];
      onUpdateRestrictions(updated);
  };

  return (
    <div 
        className="flex flex-col h-full min-h-[400px] justify-between"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
        <div className="space-y-6 pb-2">
            {/* Header with Arrows */}
            <div className="flex items-center justify-between px-1">
                 {/* Left Arrow */}
                 <button 
                    onClick={onPrev}
                    disabled={isFirst}
                    className={`p-2 -ml-2 rounded-full transition-colors ${!onPrev || isFirst ? 'opacity-0 pointer-events-none' : 'text-stone-300 hover:text-stone-800 hover:bg-stone-50'}`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                 </button>

                 <div className="flex items-center gap-4">
                     <div className={`
                        w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg 
                        ${member.role === '伴侣' ? 'bg-gradient-to-br from-emerald-400 to-cyan-500' : member.avatarColor}
                     `}>
                         {member.role === RoleType.OTHER && member.name ? member.name[0] : member.role[0]}
                     </div>
                     <div>
                         <h2 className="text-2xl font-bold text-stone-900 tracking-tight">口味偏好</h2>
                         <p className="text-sm text-stone-500 mt-1">{member.role} 平时更喜欢吃什么？</p>
                     </div>
                 </div>

                 {/* Right Arrow */}
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

            {/* TAG CLOUD CONTAINER - Reduced min-h to 240px */}
            <div className="bg-white rounded-[2rem] p-6 border border-stone-200/60 shadow-sm relative overflow-hidden min-h-[240px]">
                 {/* Decorative Top Line */}
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-200 via-emerald-100 to-stone-100"></div>
                 
                 <div className="flex flex-wrap gap-3 content-start">
                    {displayTags.map((tag, index) => {
                        const isSelected = member.tastes.includes(tag.label);
                        // Animation: If it's a new tag (implied by rendering), slide it in.
                        return (
                            <button
                                key={tag.id}
                                onClick={() => handleTagClick(tag.label, index)}
                                className={`
                                    px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border animate-in zoom-in-50 slide-in-from-left-2
                                    ${isSelected 
                                        ? 'bg-stone-900 text-white border-stone-900 shadow-md transform scale-105 z-10' 
                                        : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                                    }
                                `}
                            >
                                {tag.label}
                                {isSelected && TAG_RELATION_MAP[tag.label] && (
                                    <span className="ml-1.5 opacity-50 text-[10px]">▼</span>
                                )}
                            </button>
                        );
                    })}
                 </div>

                 {/* Custom Input Field (Consistent with MemberCard) */}
                 <div className="mt-6 relative">
                    <div className={`
                        flex items-center bg-stone-50 border transition-all rounded-full px-4 py-2.5 shadow-sm
                        ${isListening 
                            ? 'border-emerald-400 ring-2 ring-emerald-50 bg-white' 
                            : 'border-transparent focus-within:border-stone-800 focus-within:bg-white focus-within:ring-1 focus-within:ring-stone-200'
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
                            placeholder={isListening ? "" : "自定义 (如: 我特别爱吃宫保鸡丁)"}
                            className={`
                                flex-1 bg-transparent text-sm font-bold focus:outline-none placeholder:text-stone-400 text-stone-800 min-w-0
                                ${isListening ? 'animate-pulse text-emerald-600' : ''}
                            `}
                            disabled={isListening}
                        />

                        <div className="h-4 w-[1px] bg-stone-300 mx-2 flex-shrink-0"></div>

                        <button 
                            onClick={toggleVoice}
                            className={`
                                p-1.5 rounded-full transition-all active:scale-90 flex-shrink-0
                                ${isListening 
                                    ? 'bg-emerald-500 text-white shadow-md scale-110' 
                                    : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200'
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
                 
                 {member.tastes.length === 0 && (
                     <div className="absolute bottom-6 left-0 w-full text-center text-stone-300 text-xs pointer-events-none">
                         点击标签，探索更多美味灵感
                     </div>
                 )}
            </div>
            
            {/* ABSOLUTE TABOOS SECTION */}
            {onUpdateRestrictions && (
                <div className="pt-2 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 pl-1 flex items-center gap-2">
                         <span>⚠️ 绝对忌口</span>
                    </h3>
                    <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
                        <div className="flex flex-wrap gap-2">
                            {DIETARY_RESTRICTIONS.map(r => {
                                const isRestricted = (member.restrictions || []).includes(r);
                                return (
                                    <button
                                        key={r}
                                        onClick={() => handleRestrictionToggle(r)}
                                        className={`
                                            px-3 py-2 rounded-lg text-xs font-bold transition-all border
                                            ${isRestricted 
                                                ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' 
                                                : 'bg-stone-50 text-stone-500 border-stone-100 hover:border-stone-300'
                                            }
                                        `}
                                    >
                                        {r}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2">
                             提示：此处收集的忌口将应用于全家食谱生成。
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-end pt-6 border-t border-stone-100 mt-6">
            {onNext && (
                <button 
                    onClick={onNext}
                    className="bg-stone-900 text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center gap-2"
                >
                    {isLast ? '完成设置' : '下一位'}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </button>
            )}
        </div>
    </div>
  );
};

export default TasteCard;
