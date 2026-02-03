
export enum GoalType {
  // --- Self / Partner ---
  WEIGHT_MUSCLE = '减脂增肌',
  WORK_RECOVERY = '加班恢复',
  LOW_CARB = '低碳水',
  COMPLEXION = '提升气色',
  ANTI_FATIGUE = '抗疲劳',
  ACNE = '痘痘肌',
  SLEEP = '睡眠问题',
  ANTI_AGING = '抗氧抗衰',
  GUT = '肠胃问题',
  LIVER = '肝脏问题',
  THREE_HIGHS = '预防三高',
  
  // --- Special Period (Female Only) ---
  PREP_PREGNANCY = '备孕',
  PREGNANCY = '孕期',
  POSTPARTUM = '月子期',
  LACTATION = '哺乳期',

  // --- Child ---
  // 6m-2y
  SOLID_FOOD = '辅食', 
  // 2-3y
  GROWTH = '成长营养', 
  DIGESTION = '积食调理',
  IRON_ANEMIA = '补铁防贫',
  BRAIN = '大脑发育',
  IMMUNITY = '提升免疫力',
  // 3y+ adds:
  HEIGHT = '长高营养',
  PICKY = '改善挑食',
  EYE = '视力保护',
  WEIGHT_CONTROL = '预防肥胖',
  
  // --- Elders ---
  BLOOD_SUGAR = '控糖',
  BLOOD_LIPID = '降脂',
  BONE = '强健骨骼',
  NUTRITION = '营养补充',
  TEETH = '护齿易嚼',
  NERVE = '营养神经',
  HEART_BRAIN = '心脑血管'
}

export enum RoleType {
  SELF = '自己',
  PARTNER = '伴侣',
  DAD = '爸爸',
  MOM = '妈妈',
  CHILD = '宝宝/孩子',
  INLAW_DAD = '公公/岳父',
  INLAW_MOM = '婆婆/岳母',
  GRANDPA = '爷爷/外公',
  GRANDMA = '奶奶/外婆',
  OTHER = '其他成员'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female'
}

export enum ChildAgeGroup {
  BABY_0_6 = '0-6个月',
  TODDLER_6_24 = '6-24个月',
  TODDLER_2_3 = '2-3岁',
  PRESCHOOL_3_6 = '3-6岁',
  SCHOOL_6_12 = '6-12岁',
  TEEN_12_18 = '12-18岁'
}

export interface FamilyMember {
  id: string;
  role: RoleType;
  gender: Gender;
  ageGroup?: ChildAgeGroup;
  name?: string; // Optional custom name
  goals: GoalType[];
  tastes: string[]; // e.g. "Spicy", "Sweet", "Sichuan"
  restrictions?: string[]; // e.g. "Peanut", "Seafood"
  avatarColor: string; // Tailwind class
  customNeeds?: string; // Free text input
}

export interface GlobalConstraints {
  allergies: string[];
  dislikes: string[];
}

export interface CookingHabits {
  timeLimit: number; // minutes
  chefId?: string; // Member ID or 'nanny'
  skillLevel: '厨房小白' | '家常好手' | '专业大厨';
  tableFormat: '合餐制' | '分餐制';
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  matchReason: string;
  tags: string[];
  timeMinutes: number;
  calories: number;
  image?: string;
  group?: string; // For grouping in UI (Legacy)
  sourceRecipeId?: string; // If derived from another recipe
  _tempScore?: number; // Internal scoring
}

export interface StrategyItem {
    role: string;
    focus: string;
    suggestion: string;
}

// NEW: Scenario Structure for Service Plan
export interface AnalysisScenario {
    id: string;
    title: string; // e.g., "Scenario 1: Family Dinner"
    strategy: string; // The nutritionist advice text
    trigger?: string; // NEW: When to recommend this scenario
    recipes: Recipe[];
    tags: string[]; // Highlights (e.g., "High Protein")
}

// NEW: Structured Pain Points for Service Mode
export interface PainPoint {
    icon: string;       // e.g. "⚖️"
    title: string;      // e.g. "口味博弈"
    pain: string;       // e.g. "爸爸嗜辣 vs 宝宝清淡"
    solution: string;   // e.g. "采用蘸料分离法，主菜清淡，为爸爸特制红油蘸水"
}

export interface AppState {
  // Step Definition:
  // 0 = Goals (Family Profile)
  // 1 = Tastes
  // 2 = Kitchen Config
  // 3 = Scenario Swipe (Tinder View) -- NEW STEP
  // 4 = Service Plan Summary (The "Receipt" view)
  // 5 = Dashboard
  step: number;
  
  familyMembers: FamilyMember[];
  globalConstraints: GlobalConstraints;
  cookingHabits: CookingHabits;
  
  // Generated Data
  suggestedRecipes: Recipe[]; // Flat list (Legacy/Dashboard use)
  analysisScenarios?: AnalysisScenario[]; // NEW: Structured scenarios
  familySummaryText?: string; // NEW: Text summary of family needs
  
  // NEW: Service Mode
  serviceModeTitle?: string;
  serviceModeText?: string; 
  painPoints?: PainPoint[]; // NEW: Structured analysis

  isLoadingRecipes: boolean;
  hasEnoughInfo: boolean;
  
  isMobileMenuOpen: boolean;
  
  // Legacy Analysis (Optional)
  analysisSummary?: {
      goalBalance: string[];
      tasteProfile: string[];
      recommendationTag: string;
      familyStrategy?: string;
      memberStrategies?: StrategyItem[];
  };
}
