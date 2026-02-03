
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, FamilyMember, RoleType, GlobalConstraints, CookingHabits, Recipe, Gender, ChildAgeGroup, PainPoint } from './types';
import MemberCard from './components/MemberCard';
import TasteCard from './components/TasteCard';
// import RecipeFeed from './components/RecipeFeed'; 
import ServicePlanSelectionView from './components/ServicePlanSelectionView'; 
import ScenarioSwipeView from './components/ScenarioSwipeView'; // NEW
import HomeDashboard from './components/HomeDashboard';
import { generateRecipes, generateSupplementaryScenarios, expandToWeeklyPlan } from './services/geminiService';

// Initial state: Only Self and Partner
const INITIAL_MEMBERS: FamilyMember[] = [
  { id: '1', role: RoleType.SELF, gender: Gender.FEMALE, goals: [], tastes: [], restrictions: [], avatarColor: 'bg-[#C8B6A6]' }, // Muted Earthy Pink
  { id: '2', role: RoleType.PARTNER, gender: Gender.MALE, goals: [], tastes: [], restrictions: [], avatarColor: 'bg-[#A4B5B8]' }, // Muted Blue Grey
];

const Backdrop = ({ children, onClose }: { children?: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2A26]/20 backdrop-blur-[2px] animate-in fade-in duration-200 p-4">
         <div className="absolute inset-0" onClick={onClose} />
         {children}
    </div>
);

export default function App() {
  // --- STATE ---
  const [state, setState] = useState<AppState>({
    // 0=Goals, 1=Tastes, 2=Kitchen, 3=Swipe(Tinder), 4=Summary(Selection), 5=Dashboard
    step: 0, 
    familyMembers: INITIAL_MEMBERS,
    globalConstraints: { allergies: [], dislikes: [] },
    cookingHabits: { timeLimit: 60, skillLevel: '厨房小白', tableFormat: '合餐制' }, 
    suggestedRecipes: [],
    analysisScenarios: [], 
    familySummaryText: '', 
    serviceModeTitle: '', 
    serviceModeText: '', 
    painPoints: [], 
    isLoadingRecipes: false,
    hasEnoughInfo: false, 
    isMobileMenuOpen: false,
    analysisSummary: undefined
  });

  // UI State
  const [isWelcomePhase, setIsWelcomePhase] = useState(true); // Controls the Landing Screen
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [isKitchenModalOpen, setIsKitchenModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  
  // Track if kitchen is configured for Step 3 button logic
  const [hasConfiguredKitchen, setHasConfiguredKitchen] = useState(false);
  
  // New State for Supplement
  const [isSupplementing, setIsSupplementing] = useState(false);
  
  // --- HELPERS ---
  const getFamilySummaryText = () => {
    const members = state.familyMembers;
    const roles = members.map(m => m.role);
    const hasChild = roles.some(r => r === RoleType.CHILD);
    const hasElder = roles.some(r => [RoleType.DAD, RoleType.MOM, RoleType.GRANDPA, RoleType.GRANDMA, RoleType.INLAW_DAD, RoleType.INLAW_MOM].includes(r));
    
    if (members.length === 1) return "一个人的生活，也要把日子过得热气腾腾。";
    if (hasChild && hasElder) return `三代同堂，为您平衡全家 ${members.length} 口人的营养需求。`;
    if (hasChild) return "守护宝贝茁壮成长，也不委屈大人的味蕾。";
    if (hasElder) return "关注长辈身体指标，用一日三餐温暖家人。";
    if (members.length === 2 && roles.includes(RoleType.PARTNER)) return "二人三餐四季，探索美味与健康的完美平衡。";
    
    return `为 ${members.length} 位家人量身定制，每一餐都是心意。`;
  };

  const handleDeleteMember = (id: string) => {
    if (state.familyMembers.length <= 1) return;
    setState(prev => ({
        ...prev,
        familyMembers: prev.familyMembers.filter(m => m.id !== id)
    }));
  };
  
  const getDisplayRole = (m: FamilyMember) => {
      if (m.role === RoleType.PARTNER) {
          return m.gender === Gender.MALE ? '老公/男友' : '老婆/女友';
      }
      if (m.role === RoleType.CHILD) {
          return m.gender === Gender.MALE ? '儿子' : '女儿';
      }
      if (m.role === RoleType.OTHER) {
          return m.name || '其他';
      }
      return m.role;
  }

  const isRoleGenderLocked = (role: RoleType) => {
      return [RoleType.DAD, RoleType.MOM, RoleType.GRANDPA, RoleType.GRANDMA, RoleType.INLAW_DAD, RoleType.INLAW_MOM].includes(role);
  };

  const getDefaultGenderForRole = (role: RoleType) => {
       if ([RoleType.DAD, RoleType.INLAW_DAD, RoleType.GRANDPA, RoleType.PARTNER].includes(role)) {
          return Gender.MALE;
       }
       if (role === RoleType.CHILD) return Gender.MALE;
       return Gender.FEMALE;
  };

  // --- ACTIONS ---

  const loadMoreRecipes = useCallback(async (isCorrection = false) => {
    setState(prev => ({ ...prev, isLoadingRecipes: !isCorrection, hasEnoughInfo: true }));
    try {
      const existingIds = state.suggestedRecipes.map(r => r.id);
      
      const result = await generateRecipes(
          state.familyMembers, 
          state.globalConstraints, 
          state.cookingHabits,
          isCorrection ? [] : existingIds 
      );
      
      setState(prev => ({ 
          ...prev, 
          suggestedRecipes: result.recipes, // Keep flat list for dashboard/final view compat
          analysisScenarios: result.scenarios, // NEW: For Step 3
          familySummaryText: result.familySummaryText, // NEW
          serviceModeTitle: result.serviceModeTitle, // NEW
          serviceModeText: result.serviceModeText, // NEW
          painPoints: result.painPoints, // NEW
          isLoadingRecipes: false 
      }));
    } catch (e) {
      console.error(e);
      setState(prev => ({ ...prev, isLoadingRecipes: false }));
    }
  }, [state.familyMembers, state.globalConstraints, state.cookingHabits, state.suggestedRecipes]);

  // NEW: Handle supplementary requests from Step 3
  const handleSupplementRequirements = async (request: string) => {
      if (!request.trim()) return;
      setIsSupplementing(true);
      try {
          const newScenarios = await generateSupplementaryScenarios(
              state.familyMembers,
              state.globalConstraints,
              request
          );
          
          if (newScenarios.length > 0) {
              setState(prev => ({
                  ...prev,
                  analysisScenarios: [...(prev.analysisScenarios || []), ...newScenarios],
                  suggestedRecipes: [...prev.suggestedRecipes, ...newScenarios.flatMap(s => s.recipes)]
              }));
          }
      } catch (e) {
          console.error("Supplement failed", e);
      } finally {
          setIsSupplementing(false);
      }
  };

  const handleRemoveRecipe = (id: string) => {
      // Remove from both flat list and scenarios
      setState(prev => {
          const newFlat = prev.suggestedRecipes.filter(r => r.id !== id);
          const newScenarios = prev.analysisScenarios?.map(s => ({
              ...s,
              recipes: s.recipes.filter(r => r.id !== id)
          })) || [];
          
          return {
              ...prev,
              suggestedRecipes: newFlat,
              analysisScenarios: newScenarios
          };
      });
  };

  // --- TRANSITION LOGIC ---

  const handleStepConfirm = () => {
      if (state.step === 0) {
          setState(prev => ({ ...prev, step: 1 }));
      } else if (state.step === 1) {
          // Move to kitchen
          setState(prev => ({ ...prev, step: 2 }));
      }
  };

  const handleKitchenConfirm = async () => {
      setIsKitchenModalOpen(false);
      
      const allRestrictions = new Set<string>();
      state.familyMembers.forEach(m => m.restrictions?.forEach(r => allRestrictions.add(r)));
      updateConstraints({ allergies: Array.from(allRestrictions) });
      
      // Start background loading
      loadMoreRecipes(); 
      
      setHasConfiguredKitchen(true);
      // MOVE TO STEP 3: TINDER SWIPE SCENARIO VIEW
      setState(prev => ({ ...prev, step: 3 }));
  };

  // Called when Swipe View finishes
  const handleSwipeComplete = (filteredScenarios: any[]) => {
      // Update state with filtered list
      const allFilteredRecipes = filteredScenarios.flatMap(s => s.recipes);
      setState(prev => ({
          ...prev,
          analysisScenarios: filteredScenarios,
          suggestedRecipes: allFilteredRecipes,
          step: 4 // Move to Summary View
      }));
  };

  // --- NEW STEP NAVIGATION LOGIC ---
  const handleStepBack = () => {
      if (state.step > 0) {
          setState(prev => ({ ...prev, step: prev.step - 1 }));
      } else {
          setIsWelcomePhase(true);
      }
  };

  const handleStepSkip = () => {
      if (state.step < 2) {
          setState(prev => ({ ...prev, step: prev.step + 1 }));
      } else if (state.step === 2) {
          handleKitchenConfirm();
      }
  };

  // --- HANDLERS ---

  const handleAddMember = (role: RoleType) => {
      let defaultGender = getDefaultGenderForRole(role);
      let defaultColor = 'bg-[#E0DDD5]';
      let defaultAgeGroup = undefined;

      if (role === RoleType.CHILD) {
          defaultGender = Gender.MALE; 
          defaultAgeGroup = ChildAgeGroup.SCHOOL_6_12;
          defaultColor = 'bg-[#D8E2DC]'; // Sage Green Light
      }

      const newMember: FamilyMember = {
          id: Date.now().toString(),
          role,
          gender: defaultGender,
          ageGroup: defaultAgeGroup,
          goals: [],
          tastes: [],
          restrictions: [],
          avatarColor: defaultColor
      };
      
      setState(prev => ({ ...prev, familyMembers: [...prev.familyMembers, newMember] }));
      setIsAddMemberModalOpen(false);
      
      if (!isWelcomePhase || !isRoleGenderLocked(role)) {
          setEditingMemberId(newMember.id);
      }
  };

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
      setState(prev => ({
          ...prev,
          familyMembers: prev.familyMembers.map(m => m.id === id ? { ...m, ...updates } : m),
      }));
  };

  const updateConstraints = (updates: Partial<GlobalConstraints>) => {
      setState(prev => ({ ...prev, globalConstraints: { ...prev.globalConstraints, ...updates } }));
  }

  const openMemberModal = (memberId: string) => {
      setEditingMemberId(memberId);
      if (isWelcomePhase) {
          setIsWelcomePhase(false);
      }
  };

  const handleWelcomeCardClick = (id: string) => {
      setEditingMemberId(id);
  };

  const handleStartCustomization = () => {
      setIsWelcomePhase(false);
      setEditingMemberId(state.familyMembers[0].id);
  };
  
  const handleModalClose = () => {
      setEditingMemberId(null);
      setIsKitchenModalOpen(false);
      setIsAddMemberModalOpen(false);
  };

  const navigateMember = (direction: 'next' | 'prev') => {
      const currentIndex = state.familyMembers.findIndex(m => m.id === editingMemberId);
      if (currentIndex === -1) return;

      if (direction === 'next') {
          if (currentIndex < state.familyMembers.length - 1) {
              setEditingMemberId(state.familyMembers[currentIndex + 1].id);
          } else {
              handleModalClose();
          }
      } else {
          if (currentIndex > 0) {
              setEditingMemberId(state.familyMembers[currentIndex - 1].id);
          }
      }
  };

  const isMemberDone = (m: FamilyMember) => {
      if (state.step === 0) return m.goals.length > 0;
      if (state.step === 1) return m.tastes.length > 0;
      return true;
  }
  
  const areAllMembersDone = () => {
      return state.familyMembers.every(isMemberDone);
  }

  // --- MAIN APP RENDERERS ---

  // 1. TOP AREA - MORANDI MAGAZINE STYLE
  const renderTopArea = () => {
      // Don't render top nav in immersive steps
      if (state.step >= 3) return null;

      const getStepInfo = () => {
          switch(state.step) {
              case 0: return { title: "家庭饮食档案" };
              case 1: return { title: "全家口味偏好" };
              case 2: return { title: "厨房配置" };
              default: return { title: "家庭饮食规划" };
          }
      }
      const { title } = getStepInfo();

      const allDone = areAllMembersDone();
      const nextMemberToFill = state.familyMembers.find(m => !isMemberDone(m));
      let buttonText = "";
      
      if (state.step === 2) {
          buttonText = hasConfiguredKitchen ? "✨ 生成膳食策略" : "配置厨房";
      } else if (allDone) {
          buttonText = state.step === 0 ? "下一步：口味偏好" : "下一步：厨房设定";
      } else {
          const filledCount = state.familyMembers.filter(isMemberDone).length;
          if (filledCount > 0) {
              buttonText = state.step === 0 ? "确认关注点，下一步" : "确认口味，下一步";
          } else {
              const targetName = nextMemberToFill ? nextMemberToFill.role : "成员";
              const actionName = state.step === 0 ? "关注点" : "口味";
              buttonText = `填写 ${targetName} 的${actionName}`;
          }
      }

      const handleMainButtonClick = () => {
          if (state.step === 2) {
              if (hasConfiguredKitchen) {
                  handleKitchenConfirm();
              } else {
                  setIsKitchenModalOpen(true);
              }
              return;
          }

          const filledCount = state.familyMembers.filter(isMemberDone).length;

          if (filledCount === 0 && state.familyMembers.length > 0) {
               const firstIncomplete = state.familyMembers[0];
               openMemberModal(firstIncomplete.id);
          } else {
              handleStepConfirm();
          }
      };

      return (
          <div className="pt-4 pb-2 px-3 animate-in slide-in-from-top-4 duration-500">
              <div className={`
                  bg-[#EFECE5] rounded-[32px] px-6 py-6 mx-auto relative overflow-hidden text-[#2C2A26] max-w-[360px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]
                  transition-all duration-500
              `}>
                  
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-bl-[100px] pointer-events-none"></div>

                  <>
                      <div className="flex justify-between items-center mb-1 relative z-10">
                          <div className="flex items-center gap-1 text-[#8C867D]">
                              <button 
                                  onClick={handleStepBack}
                                  className="p-1 -ml-1 hover:text-[#2C2A26] transition-colors"
                                  aria-label="返回"
                              >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                    </svg>
                              </button>
                              <span className="text-[10px] font-bold tracking-widest uppercase">
                                  步骤 {state.step + 1}
                              </span>
                          </div>
                          <button 
                              onClick={handleStepSkip}
                              className="text-[10px] font-bold text-[#8C867D] hover:text-[#2C2A26] transition-colors px-2 py-1"
                          >
                              跳过
                          </button>
                      </div>

                      <div className="mb-6 relative z-10">
                          <h2 className="text-xl font-bold font-serif tracking-tight text-[#2C2A26] leading-none">{title}</h2>
                      </div>
                      
                      {state.step < 2 ? (
                          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 mb-6">
                              {state.familyMembers.map((m, idx) => {
                                  const done = isMemberDone(m);
                                  return (
                                      <button 
                                        key={m.id}
                                        onClick={() => openMemberModal(m.id)}
                                        className="group flex flex-col items-center gap-2 flex-shrink-0"
                                      >
                                          <div className={`
                                              w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 relative
                                              ${idx % 2 === 0 ? 'rotate-2' : '-rotate-1'}
                                              ${done 
                                                  ? 'bg-[#2C2A26] text-[#F9F8F6] shadow-md scale-100' 
                                                  : 'bg-[#D6D3CD] text-[#F9F8F6] hover:bg-[#A8A49E]'
                                              }
                                          `}>
                                              {m.role === RoleType.OTHER && m.name ? m.name[0] : m.role[0]}
                                              {done && (
                                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#F9F8F6] rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-[#2C2A26] rounded-full"></div>
                                                </div>
                                              )}
                                          </div>
                                          <span className={`text-[10px] font-bold tracking-wide ${done ? 'text-[#2C2A26]' : 'text-[#8C867D]'}`}>
                                              {getDisplayRole(m)}
                                          </span>
                                      </button>
                                  )
                              })}
                          </div>
                      ) : (
                          <div 
                              className="bg-white/40 rounded-2xl p-4 flex items-center gap-4 border border-white/20 cursor-pointer hover:bg-white/60 transition-all mb-6"
                              onClick={() => setIsKitchenModalOpen(true)}
                          >
                              <div className="w-10 h-10 rounded-full bg-[#2C2A26] text-white flex items-center justify-center text-lg shrink-0">
                                  🍳
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                  <span className="block text-xs font-bold text-[#2C2A26] mb-0.5 uppercase tracking-wide">配置</span>
                                  <span className="block text-sm font-serif text-[#5C554B] truncate">
                                      {hasConfiguredKitchen 
                                          ? (() => {
                                              const chefId = state.cookingHabits.chefId;
                                              const chefName = chefId === 'nanny' ? '金牌保姆' : (state.familyMembers.find(m => m.id === chefId) ? getDisplayRole(state.familyMembers.find(m => m.id === chefId)!) : '大厨');
                                              return `${chefName}掌勺 · ${state.cookingHabits.skillLevel}`;
                                            })()
                                          : '设置掌勺人与厨艺段位'
                                      }
                                  </span>
                              </div>
                          </div>
                      )}

                      <div>
                          <button 
                              onClick={handleMainButtonClick}
                              className="w-full h-11 bg-[#2C2A26] text-[#F9F8F6] rounded-xl font-bold text-xs shadow-lg hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                              {buttonText}
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                              </svg>
                          </button>
                      </div>
                  </>
              </div>
          </div>
      );
  };

  // 2. MODAL LAYER
  const renderModals = () => {
      // Kitchen Modal
      if (isKitchenModalOpen) {
           const adultMembers = state.familyMembers.filter(m => m.role !== RoleType.CHILD);
           const nannyId = 'nanny';
           const selectedChefId = state.cookingHabits.chefId || adultMembers[0]?.id;

           return (
             <Backdrop onClose={handleModalClose}>
                 <div className="bg-[#F9F8F6] w-full max-w-[340px] rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 max-h-[85vh] overflow-y-auto no-scrollbar">
                      <button onClick={handleModalClose} className="absolute top-4 right-4 w-8 h-8 bg-[#EFECE5] rounded-full flex items-center justify-center text-[#8C867D] hover:bg-[#E0DDD5]">✕</button>
                      <h3 className="text-lg font-serif font-bold text-[#2C2A26] mb-6 text-center mt-2">厨房配置</h3>
                      <div className="space-y-6 mb-8">
                            <div className="bg-white p-4 rounded-xl border border-stone-200">
                                <label className="text-sm font-bold text-[#5C554B] mb-3 block">谁来掌勺</label>
                                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                                    {adultMembers.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setState(prev => ({ ...prev, cookingHabits: { ...prev.cookingHabits, chefId: m.id } }))}
                                            className={`flex flex-col items-center gap-2 flex-shrink-0 transition-opacity ${selectedChefId === m.id ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
                                        >
                                             <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-offset-2 ${selectedChefId === m.id ? 'ring-stone-900' : 'ring-transparent'} ${m.avatarColor}`}>
                                                 {m.role === RoleType.OTHER && m.name ? m.name[0] : m.role[0]}
                                             </div>
                                             <span className="text-[10px] font-bold text-stone-600 truncate max-w-[60px]">{getDisplayRole(m)}</span>
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setState(prev => ({ ...prev, cookingHabits: { ...prev.cookingHabits, chefId: nannyId } }))}
                                        className={`flex flex-col items-center gap-2 flex-shrink-0 transition-opacity ${selectedChefId === nannyId ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
                                    >
                                         <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-stone-800 shadow-sm ring-2 ring-offset-2 bg-yellow-400 ${selectedChefId === nannyId ? 'ring-stone-900' : 'ring-transparent'}`}>
                                             👩‍🍳
                                         </div>
                                         <span className="text-[10px] font-bold text-stone-600">金牌保姆</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-xl border border-stone-200">
                                <label className="text-sm font-bold text-[#5C554B] mb-3 block">厨艺段位</label>
                                <div className="flex gap-2">
                                    {['厨房小白', '家常好手', '专业大厨'].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setState(prev => ({ ...prev, cookingHabits: { ...prev.cookingHabits, skillLevel: level as any } }))}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${state.cookingHabits.skillLevel === level
                                                ? 'bg-[#2C2A26] text-white border-[#2C2A26] shadow-md' 
                                                : 'bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100'}`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                      </div>
                      <button onClick={handleKitchenConfirm} className="w-full bg-[#2C2A26] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-black active:scale-[0.98] transition-all">
                          分析我家膳食策略
                      </button>
                 </div>
             </Backdrop>
          )
      }

      // Add Member Modal
      if (isAddMemberModalOpen) {
          const roles = [RoleType.SELF, RoleType.PARTNER, RoleType.DAD, RoleType.MOM, RoleType.CHILD, RoleType.INLAW_DAD, RoleType.INLAW_MOM, RoleType.OTHER];
          return (
              <Backdrop onClose={() => setIsAddMemberModalOpen(false)}>
                  <div className="bg-[#F9F8F6] w-full max-w-[340px] rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95">
                      <button onClick={() => setIsAddMemberModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-[#EFECE5] rounded-full flex items-center justify-center text-[#8C867D] hover:bg-[#E0DDD5]">✕</button>
                      <h3 className="text-lg font-serif font-bold text-[#2C2A26] mb-4 text-center mt-4">选择角色类型</h3>
                      <div className="grid grid-cols-4 gap-3">
                          {roles.map(role => (
                              <button
                                key={role}
                                onClick={() => handleAddMember(role)}
                                className="bg-[#EFECE5] hover:bg-[#E0DDD5] hover:scale-105 active:scale-95 py-4 rounded-xl text-[#5C554B] font-bold text-xs transition-all flex flex-col items-center gap-2 shadow-sm"
                              >
                                  <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-sm font-bold text-stone-600">
                                      {role[0]}
                                  </div>
                                  {role}
                              </button>
                          ))}
                      </div>
                  </div>
              </Backdrop>
          )
      }

      // Edit Member Modal
      const currentIndex = state.familyMembers.findIndex(m => m.id === editingMemberId);
      const currentMember = state.familyMembers[currentIndex];
      
      if (!currentMember) return null;

      // Welcome Phase Role Selection Modal (for initial setup)
      if (isWelcomePhase) {
          const roles = [RoleType.SELF, RoleType.PARTNER, RoleType.DAD, RoleType.MOM, RoleType.CHILD, RoleType.INLAW_DAD, RoleType.INLAW_MOM, RoleType.OTHER];
          const displayRole = getDisplayRole(currentMember);
          
          return (
              <Backdrop onClose={handleModalClose}>
                  <div className="bg-white w-full max-w-[340px] rounded-[32px] p-6 pt-12 shadow-xl relative animate-in zoom-in-95">
                      <button onClick={handleModalClose} className="absolute top-4 right-4 w-8 h-8 bg-[#EFECE5] rounded-full flex items-center justify-center text-[#8C867D] hover:bg-[#E0DDD5]">✕</button>
                      <div className="flex items-center gap-4 mb-8 mt-2">
                           <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ${currentMember.role === RoleType.PARTNER && currentMember.gender === Gender.FEMALE ? 'bg-[#FF7D99]' : ''} ${currentMember.role === RoleType.PARTNER && currentMember.gender === Gender.MALE ? 'bg-[#3B82F6]' : ''} ${currentMember.role !== RoleType.PARTNER ? currentMember.avatarColor : ''}`}>
                              {currentMember.role === RoleType.OTHER && currentMember.name ? currentMember.name.charAt(0) : currentMember.role[0]}
                           </div>
                           <div className="flex-1 min-w-0">
                               {currentMember.role === RoleType.OTHER ? (
                                    <div className="flex flex-col">
                                        <input
                                            type="text"
                                            value={currentMember.name || ''}
                                            placeholder="输入称呼 (如: 爷爷)"
                                            onChange={(e) => updateMember(currentMember.id, { name: e.target.value })}
                                            className="text-2xl font-bold text-stone-900 leading-none mb-1.5 border-b-2 border-stone-100 focus:border-stone-800 outline-none w-full bg-transparent placeholder:text-stone-300 placeholder:font-normal py-1 transition-colors"
                                            autoFocus
                                        />
                                        <p className="text-xs text-stone-400 font-medium">请自定义该成员称呼</p>
                                    </div>
                               ) : (
                                    <>
                                        <h2 className="text-2xl font-bold text-stone-900 leading-none mb-1.5">{displayRole}</h2>
                                        <p className="text-xs text-stone-400 font-medium">请完善该成员的基础信息</p>
                                    </>
                               )}
                           </div>
                      </div>
                      
                      {/* ... existing gender/age selection logic ... */}
                      {!isRoleGenderLocked(currentMember.role) && (
                           <div className="mb-6">
                              <div className="flex gap-3">
                                 {[Gender.MALE, Gender.FEMALE].map(g => (
                                     <button 
                                        key={g}
                                        onClick={() => updateMember(currentMember.id, { gender: g })} 
                                        className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm ${currentMember.gender === g ? 'bg-stone-900 text-white scale-[1.02]' : 'bg-stone-50 text-stone-500 border border-stone-100 hover:bg-stone-100'}`}
                                     >
                                        <span className="text-lg">{g === Gender.MALE ? '👨' : '👩'}</span>
                                        {g === Gender.MALE ? '我是男生' : '我是女生'}
                                     </button>
                                 ))}
                              </div>
                           </div>
                      )}

                      {currentMember.role === RoleType.CHILD && (
                           <div className="mb-8">
                               <label className="text-[10px] font-bold text-stone-400 mb-3 block uppercase tracking-wider pl-1">年龄阶段</label>
                               <div className="grid grid-cols-2 gap-2">
                                   {Object.values(ChildAgeGroup).map(age => (
                                       <button
                                           key={age}
                                           onClick={() => updateMember(currentMember.id, { ageGroup: age })}
                                           className={`py-3 px-2 rounded-xl text-[10px] font-bold transition-all truncate border ${currentMember.ageGroup === age ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100'}`}
                                       >
                                           {age}
                                       </button>
                                   ))}
                               </div>
                           </div>
                      )}

                      <button onClick={handleModalClose} className="w-full bg-stone-900 text-white py-4 rounded-full font-bold text-lg mt-6 shadow-xl hover:bg-black active:scale-[0.98] transition-transform">确认</button>
                  </div>
              </Backdrop>
          );
      }
      
      return (
          <Backdrop onClose={handleModalClose}>
               <div className="bg-[#F9F8F6] w-full max-w-[340px] rounded-[2rem] shadow-2xl relative flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 border border-[#E0DDD5]">
                   <button onClick={handleModalClose} className="absolute top-4 right-4 w-8 h-8 bg-[#EFECE5] rounded-full flex items-center justify-center text-[#8C867D] hover:bg-[#E0DDD5] z-20">✕</button>
                   <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-16">
                      {state.step === 0 ? (
                          <MemberCard 
                              member={currentMember}
                              isEditing={true}
                              onEditStart={() => {}}
                              onToggleGoal={(g) => {
                                  const exists = currentMember.goals.includes(g);
                                  const newGoals = exists ? currentMember.goals.filter(x => x !== g) : [...currentMember.goals, g];
                                  updateMember(currentMember.id, { goals: newGoals });
                              }}
                              onUpdateMember={(u) => updateMember(currentMember.id, u)}
                              onConfirm={handleModalClose}
                              viewMode="modal"
                              onNext={() => navigateMember('next')}
                              onPrev={() => navigateMember('prev')}
                              isLast={currentIndex === state.familyMembers.length - 1}
                              isFirst={currentIndex === 0}
                          />
                      ) : (
                          <TasteCard 
                              member={currentMember}
                              isEditing={true}
                              onEditStart={() => {}}
                              onUpdateTastes={(t) => updateMember(currentMember.id, { tastes: t })}
                              onUpdateRestrictions={(r) => updateMember(currentMember.id, { restrictions: r })}
                              onConfirm={handleModalClose}
                              onNext={() => navigateMember('next')}
                              onPrev={() => navigateMember('prev')}
                              isLast={currentIndex === state.familyMembers.length - 1}
                              isFirst={currentIndex === 0}
                          />
                      )}
                   </div>
               </div>
          </Backdrop>
      );
  };

  // --- WELCOME SCREEN RENDERER (The New Step 0) ---
  if (isWelcomePhase) {
      return (
          <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-6 relative overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#EFECE5] rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-[#E0DDD5] rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>

              <div className="relative z-10 w-full max-w-[360px] space-y-8">
                  <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="inline-flex items-center gap-1.5 bg-[#2C2A26] text-[#F9F8F6] px-3 py-1 rounded-full text-[10px] font-bold tracking-wide mb-2 shadow-sm">
                          <span>✨</span> AI 膳食管家
                      </div>
                      <h1 className="text-3xl font-serif text-[#2C2A26] leading-tight">不仅仅是菜谱<br/><span className="text-[#8C867D]">更是对家人的关爱</span></h1>
                      <p className="text-sm text-[#8C867D] leading-relaxed px-2 font-medium">为您智能过滤掉不合适的选择，只留下全家都爱吃的美味。</p>
                  </div>

                  <div className="bg-[#EFECE5] rounded-[32px] p-8 shadow-[0_20px_40px_-15px_rgba(44,42,38,0.05)] relative animate-in zoom-in-95 duration-700 delay-200">
                      <div className="mb-8 text-center">
                          <h2 className="text-lg font-bold text-[#2C2A26] mb-1">建立家庭档案</h2>
                          <div className="h-0.5 w-8 bg-[#2C2A26]/10 mx-auto mt-2 mb-3"></div>
                          <p className="text-xs text-[#8C867D] animate-in fade-in duration-500 min-h-[1.5em] font-medium">{getFamilySummaryText()}</p>
                      </div>

                      <div className="flex flex-wrap justify-center gap-4 mb-8 px-1">
                          {state.familyMembers.map((m) => (
                              <div 
                                  key={m.id} 
                                  onClick={() => handleWelcomeCardClick(m.id)}
                                  className="relative group flex flex-col items-center cursor-pointer"
                              >
                                  <div className={`w-16 h-16 rounded-[14px] flex items-center justify-center text-xl font-bold text-white shadow-sm transition-all relative ${m.role === RoleType.SELF ? 'bg-[#5C554B]' : 'bg-[#9D9A96]'} border-2 border-transparent group-hover:border-[#CFCBC4]`}>
                                      {m.role === RoleType.OTHER && m.name ? m.name[0] : m.role[0]}
                                      {state.familyMembers.length > 1 && (
                                           <button 
                                              onClick={(e) => { e.stopPropagation(); handleDeleteMember(m.id); }}
                                              className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-stone-200 rounded-full text-stone-400 flex items-center justify-center hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all shadow-sm z-10"
                                           >
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                                           </button>
                                      )}
                                  </div>
                                  <span className="text-xs font-bold mt-2 text-[#8C867D]">{getDisplayRole(m)}</span>
                              </div>
                          ))}
                          <div className="flex flex-col items-center">
                              <button onClick={() => setIsAddMemberModalOpen(true)} className="w-16 h-16 rounded-[14px] border-2 border-dashed border-[#CFCBC4] flex items-center justify-center text-[#CFCBC4] bg-[#F5F4F1] hover:bg-white hover:border-[#8C867D] hover:text-[#8C867D] transition-all group">
                                  <span className="text-2xl font-light group-hover:scale-110 transition-transform">+</span>
                              </button>
                              <span className="text-xs font-bold text-[#CFCBC4] mt-2">添加</span>
                          </div>
                      </div>

                      <button onClick={handleStartCustomization} className="w-full h-12 bg-[#2C2A26] text-[#F9F8F6] rounded-full font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group">
                          开始定制
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                      </button>
                  </div>
              </div>
               {isAddMemberModalOpen && renderModals()}
               {editingMemberId && renderModals()}
          </div>
      );
  }

  // --- VIEW ROUTING ---
  
  // Step 3: Tinder Swipe (NEW)
  if (state.step === 3) {
      return (
          <ScenarioSwipeView
              scenarios={state.analysisScenarios || []}
              isLoading={state.isLoadingRecipes}
              onComplete={handleSwipeComplete}
              onSupplement={handleSupplementRequirements}
              isSupplementing={isSupplementing}
          />
      );
  }
  
  // Step 4: Service Plan Selection (The Receipt)
  if (state.step === 4) {
      return (
          <ServicePlanSelectionView 
              scenarios={state.analysisScenarios || []}
              summaryText={state.familySummaryText || ''}
              serviceModeTitle={state.serviceModeTitle} 
              serviceModeText={state.serviceModeText} 
              painPoints={state.painPoints || []} 
              onRemoveRecipe={handleRemoveRecipe}
              onConfirm={() => setState(p => ({...p, step: 5}))} // To Dashboard
              isLoading={false} // Loading handled by SwipeView
          />
      );
  }
  
  // Step 5: Dashboard
  if (state.step === 5) {
      return (
        <HomeDashboard 
            recipes={state.suggestedRecipes} 
            familyMembers={state.familyMembers} 
            onRemoveRecipe={handleRemoveRecipe}
            onUpdateMember={(id, updates) => updateMember(id, updates)}
        />
      );
  }
  
  // Default: Input Steps (0, 1, 2)
  return (
    <div className="min-h-screen font-sans text-[#2C2A26] flex flex-col">
        {/* TOP AREA */}
        {renderTopArea()}

        {/* Placeholder for Input Steps Content */}
        <div className="flex-1">
        </div>

        {/* MODAL LAYER */}
        {renderModals()}
    </div>
  );
}
