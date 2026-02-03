
import { FamilyMember, GlobalConstraints, CookingHabits, Recipe, AnalysisScenario, PainPoint } from "../types";

// --- API CONFIGURATION ---
// User provided API Key for Zhipu AI
const ZHIPU_API_KEY = "bc02e7c1c3064fd9824d5abb48ede339.qVEdxdim9rMns53B";
const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

// --- JWT GENERATION FOR ZHIPU (Using Web Crypto API) ---
// Zhipu requires a signed JWT as the Bearer token, not the raw API key.
// This function implements HS256 signing locally.
async function generateLocalToken(apiKey: string) {
  try {
    const [id, secret] = apiKey.split('.');
    const enc = new TextEncoder();
    
    // Header
    const header = { alg: 'HS256', sign_type: 'SIGN' };
    
    // Payload (Exp 1 hour)
    const payload = { 
      api_key: id, 
      timestamp: Date.now(), 
      exp: Date.now() + 3600 * 1000 
    };

    // Url Safe Base64 Helper
    const base64Url = (str: string) => btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const headerEnc = base64Url(JSON.stringify(header));
    const payloadEnc = base64Url(JSON.stringify(payload));
    
    // Sign
    const keyData = enc.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC', key, enc.encode(`${headerEnc}.${payloadEnc}`)
    );
    
    const signatureEnc = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return `${headerEnc}.${payloadEnc}.${signatureEnc}`;
  } catch (e) {
    console.error("JWT Generation Failed", e);
    return ""; // Fallback will handle this
  }
}

// --- MOCK FALLBACK DATA ---
const FALLBACK_RECIPES: Recipe[] = [
  { id: "f1", title: "西红柿炒鸡蛋", description: "国民家常菜，酸甜开胃", matchReason: "经典保底，老少皆宜", tags: ["家常", "快手", "酸甜"], timeMinutes: 10, calories: 150 },
  { id: "f2", title: "清蒸鲈鱼", description: "鲜嫩多汁，富含优质蛋白", matchReason: "营养健康，不仅刺少还很鲜美", tags: ["海鲜", "蒸菜", "高蛋白"], timeMinutes: 15, calories: 120 },
  { id: "f3", title: "菌菇豆腐汤", description: "清淡鲜美，暖胃舒适", matchReason: "肠胃友好，晚餐首选", tags: ["汤", "清淡", "低脂"], timeMinutes: 20, calories: 80 },
  { id: "f4", title: "小炒黄牛肉", description: "香辣下饭，补充能量", matchReason: "满足吃辣需求", tags: ["香辣", "高蛋白"], timeMinutes: 15, calories: 200 }
];

// --- HELPER: FALLBACK GENERATOR ---
const getFallbackData = () => {
    const fallbackScenarios: AnalysisScenario[] = [
        {
            id: "fallback-1",
            title: "全家共享的营养快手菜",
            strategy: "网络连接不稳定，为您推荐基础均衡菜式。",
            trigger: "日常晚餐",
            tags: ["家常", "营养"],
            recipes: FALLBACK_RECIPES
        }
    ];

    return {
        scenarios: fallbackScenarios,
        familySummaryText: "暂时无法连接智能服务，已加载基础数据。",
        serviceModeTitle: "基础家庭膳食方案",
        serviceModeText: "请检查网络连接。",
        painPoints: [
            { icon: "📡", title: "连接中断", pain: "无法获取云端分析", solution: "已为您切换至离线基础菜谱" }
        ],
        recipes: FALLBACK_RECIPES
    };
};

// --- HELPER: ROBUST JSON EXTRACTOR ---
const extractJSON = (text: string): any => {
    try {
        // 1. Try generic parsing
        return JSON.parse(text);
    } catch (e) {
        // 2. Try extracting from code blocks
        const codeBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
             try { return JSON.parse(codeBlockMatch[1]); } catch (e2) {}
        }
        // 3. Try finding first { and last }
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            try { return JSON.parse(text.substring(start, end + 1)); } catch (e3) {}
        }
        throw new Error("Could not extract JSON from response");
    }
}

// --- MAIN GENERATION FUNCTION ---
export const generateRecipes = async (
  members: FamilyMember[],
  constraints: GlobalConstraints,
  habits: CookingHabits,
  existingRecipeIds: string[] = [] 
): Promise<{
    scenarios: AnalysisScenario[], 
    familySummaryText: string,
    serviceModeTitle: string, 
    serviceModeText: string,
    painPoints: PainPoint[], 
    recipes: Recipe[] 
}> => {

  // Construct context strings
  const familyProfileStr = JSON.stringify(members.map(m => ({
      role: m.role,
      goals: m.goals,
      tastes: m.tastes,
      restrictions: m.restrictions,
      customNeeds: m.customNeeds
  })));
  const habitsStr = JSON.stringify(habits);
  const constraintsStr = JSON.stringify(constraints);

  // System Prompt designed for GLM-4 with STRICT CHINESE OUTPUT
  const systemInstruction = `
    You are a **Senior Family Dietary Consultant (资深家庭膳食规划师)**.
    Your goal is to design a **"Recipe Collection" (菜谱合集)** plan based on family needs.

    **CORE PHILOSOPHY: SPECIFIC COLLECTIONS, NOT ABSTRACT SCENARIOS**
    Instead of generic scenarios like "Dinner Scenario", you must generate **Specific Recipe Collections** targeted at specific members or conflicts.

    **NAMING CONVENTION (CRITICAL):**
    The title of the scenario MUST follow the format: **"[Target Member]'s [Specific Need] Collection"**.
    *   *Good:* "妈妈的下班减脂餐", "宝宝的补铁辅食", "爸爸的加班能量补给", "给爱吃辣的爷爷的补偿菜"

    **SERVICE STRATEGY TITLE GENERATION (IMPORTANT):**
    Generate a \`serviceModeTitle\` that summarizes the core **solution** to the family's specific **conflicts**.
    *   **CRITICAL RULE:** Do **NOT** use the word "模式" (Mode). Use "策略" (Strategy), "方案" (Plan), or "平衡" (Balance).
    *   *Good:* "全家减脂与宝宝营养的平衡策略"

    **PRIORITY LOGIC FOR COLLECTIONS (STRICT ORDER):**
    Generate 2-4 Collections based on this strict hierarchy:

    1.  **Collection 1: The "Family Favorites" (Common Denominator)**  <-- **MUST BE FIRST**
        -   The dishes everyone can eat and enjoy.
        -   Focus on: Home-cooked comfort food, Balanced nutrition, "Safe" choices for everyone.
        -   e.g. "全家爱吃的家常菜", "老少皆宜的营养快手菜", "全家共享的经典美味".

    2.  **Collection 2: The "Red Line" (Vulnerable Groups)**
        -   If Baby/Pregnant/Ill: Generate a collection specifically for them.
        -   e.g. "宝宝的手指食物与辅食"

    3.  **Collection 3: The "Conflict Solver" (Strong Goals/Taste Diff)**
        -   If Mom wants weight loss but Dad eats normal: "妈妈的低卡饱腹餐".
        -   If one person loves Spicy but others don't: "给爸爸的香辣解馋特供".

    **OUTPUT RULES:**
    1.  **Generate 2 to 4 Collections**.
    2.  **Recipe Count**: For each collection, generate **10 recipes** (Must be enough for selection).
    3.  **Strategy**: Explain *why* this collection exists in 1 sentence.

    **Output STRICTLY VALID JSON (NO MARKDOWN BLOCK):**
    {
      "serviceModeTitle": "String (e.g. '幼儿抗敏与全家控糖的平衡策略' - DO NOT use the word '模式')",
      "serviceModeText": "String (Short summary of the core conflict resolution)",
      "painPoints": [
        { "icon": "Emoji", "title": "String", "pain": "String", "solution": "String" }
      ],
      "familySummaryText": "String",
      "scenarios": [
        {
          "id": "String",
          "title": "String (e.g. '全家爱吃的家常菜')",
          "strategy": "String (e.g. 'High protein, low carb, quick to cook')",
          "tags": ["String (e.g. 'Low Carb')"],
          "recipes": [ { "id": "String", "title": "String", "description": "String", "matchReason": "String", "tags": ["String"], "timeMinutes": Number, "calories": Number } ]
        }
      ]
    }
  `;

  try {
      console.log("Calling Zhipu AI (GLM-4)...");
      
      const token = await generateLocalToken(ZHIPU_API_KEY);
      if (!token) throw new Error("Failed to generate JWT token");

      const response = await fetch(ZHIPU_API_URL, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}` // Use JWT, not raw key
          },
          body: JSON.stringify({
              model: "glm-4",
              messages: [
                  { role: "system", content: systemInstruction },
                  { role: "user", content: `Family Profile: ${familyProfileStr}, Cooking Habits: ${habitsStr}, Restrictions: ${constraintsStr}` }
              ],
              temperature: 0.7, 
              top_p: 0.9,
              max_tokens: 4096
          })
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Zhipu API Error: ${response.status} ${errorText}`);
      }

      const rawData = await response.json();
      const rawText = rawData.choices?.[0]?.message?.content || "{}";
      
      // Robust Parsing
      const data = extractJSON(rawText);

      // Validate structure
      if (!data.scenarios || !Array.isArray(data.scenarios)) {
          throw new Error("Invalid structure: missing scenarios");
      }

      // Flatten recipes
      const allRecipes: Recipe[] = [];
      data.scenarios.forEach((s: any) => {
          if (s.recipes && Array.isArray(s.recipes)) {
              s.recipes.forEach((r: any) => {
                  r.id = r.id || Math.random().toString(36).substr(2, 9);
                  r.group = s.title;
                  allRecipes.push(r);
              });
          } else {
              s.recipes = [];
          }
      });

      return {
          scenarios: data.scenarios,
          familySummaryText: data.familySummaryText || "已为您生成家庭方案",
          serviceModeTitle: data.serviceModeTitle || "家庭定制策略",
          serviceModeText: data.serviceModeText || "为您量身定制的膳食建议",
          painPoints: data.painPoints || [],
          recipes: allRecipes
      };

  } catch (error) {
      console.error("Generation Error:", error);
      return getFallbackData();
  }
};

// --- NEW FUNCTION: SUPPLEMENTARY GENERATION ---
export const generateSupplementaryScenarios = async (
    members: FamilyMember[],
    constraints: GlobalConstraints,
    supplementaryRequest: string
): Promise<AnalysisScenario[]> => {
     // Construct context strings
    const familyProfileStr = JSON.stringify(members.map(m => ({
        role: m.role,
        goals: m.goals,
        tastes: m.tastes,
        restrictions: m.restrictions
    })));

    const systemInstruction = `
        You are a smart diet planner. The user wants to ADD a specific recipe collection to their existing plan based on a NEW requirement.
        
        New Requirement: "${supplementaryRequest}"
        Family Context: ${familyProfileStr}
        
        Task: Generate exactly 1 (one) new "AnalysisScenario" (Recipe Collection) that specifically addresses this new requirement.
        
        Title Format: "[Target]'s [Adjective] Collection" (e.g., "爷爷的控糖特供", "给宝宝的特别加餐", "想吃的麻辣鲜香")
        Recipe Count: 8-10 recipes.
        
        Output JSON:
        {
            "scenarios": [
                {
                    "id": "supp-${Date.now()}",
                    "title": "String",
                    "strategy": "String (Why this collection fits the new request)",
                    "tags": ["String"],
                    "recipes": [ { "id": "String", "title": "String", "description": "String", "matchReason": "String", "tags": ["String"], "timeMinutes": Number, "calories": Number } ]
                }
            ]
        }
     `;

    try {
        const token = await generateLocalToken(ZHIPU_API_KEY);
        if (!token) throw new Error("Failed to generate JWT token");

        const response = await fetch(ZHIPU_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                model: "glm-4",
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: "Please generate the supplementary collection." }
                ],
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2048
            })
        });

        if (!response.ok) throw new Error("API Error");

        const rawData = await response.json();
        const data = extractJSON(rawData.choices?.[0]?.message?.content || "{}");

        // Process IDs
        if (data.scenarios && Array.isArray(data.scenarios)) {
             data.scenarios.forEach((s: any) => {
                 s.recipes.forEach((r: any) => {
                     r.id = r.id || Math.random().toString(36).substr(2, 9);
                     r.group = s.title;
                 });
             });
             return data.scenarios;
        }
        return [];
    } catch (e) {
        console.error("Supplementary Generation Failed", e);
        // Minimal fallback for supplement
        return [{
            id: `fallback-supp-${Date.now()}`,
            title: "补充推荐菜谱",
            strategy: "网络不稳定，为您推荐通用健康菜。",
            recipes: FALLBACK_RECIPES.map(r => ({...r, id: r.id + Math.random()})),
            tags: ["补充"]
        }];
    }
}

export const expandToWeeklyPlan = async (
  seedRecipes: Recipe[],
  constraints: GlobalConstraints
): Promise<Recipe[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return seedRecipes.map(r => ({
      ...r,
      id: r.id + "_exp",
      title: "延伸: " + r.title,
      matchReason: "基于您的口味延伸推荐",
      description: r.description || "",
      tags: r.tags || [],
      timeMinutes: r.timeMinutes || 30,
      calories: r.calories || 300
  }));
};
