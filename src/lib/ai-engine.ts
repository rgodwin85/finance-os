export interface ConsumableItemEstimate {
  id: string;
  name: string;
  brand?: string;
  packDescription: string;
  packQuantity: number;
  estimatedPackPrice: number;
  estimatedDaysSupply: number;
  monthlyCost: number;
  suggestedCategory: string;
  reasoning: string;
}

export interface VehicleEstimate {
  year?: number;
  make?: string;
  model?: string;
  mpg: number;
  commuteMilesDaily?: number;
  monthlyMiles: number;
  gasPricePerGallon: number;
  monthlyFuelCost: number;
  monthlyMaintenanceQuota: number;
  suggestedFuelCategory: string;
  suggestedMaintenanceFund: string;
  annualMaintenanceTarget: number;
  reasoning: string;
}

export interface AICopilotAnalysisResult {
  consumables: ConsumableItemEstimate[];
  vehicle?: VehicleEstimate;
  summary: string;
  rawInput: string;
  providerUsed: string;
}

export interface AIProviderConfig {
  provider: "builtin" | "groq" | "gemini" | "ollama";
  apiKey?: string;
  model?: string;
}

// Built-in heuristic catalog for staple consumables
interface StapleRule {
  keywords: string[];
  defaultBrand?: string;
  unitPriceEstimate: number;
  daysPerUnit: number;
  category: string;
}

const STAPLE_CATALOG: StapleRule[] = [
  {
    keywords: ["toothpaste", "burt's bees", "colgate", "crest", "charcoal"],
    defaultBrand: "Burt's Bees / Crest",
    unitPriceEstimate: 5.5,
    daysPerUnit: 45, // 1 tube lasts ~45 days for 1 person
    category: "Personal Care & Haircuts",
  },
  {
    keywords: ["deodorant", "every man jack", "dove", "old spice", "native", "antiperspirant"],
    defaultBrand: "Every Man Jack / Old Spice",
    unitPriceEstimate: 7.5,
    daysPerUnit: 60, // 1 stick lasts ~60 days
    category: "Personal Care & Haircuts",
  },
  {
    keywords: ["bar soap", "dial soap", "dial", "soap bar", "irish spring", "dove bar"],
    defaultBrand: "Dial / Dove",
    unitPriceEstimate: 1.1, // per bar
    daysPerUnit: 14, // 1 bar lasts ~14 days
    category: "Personal Care & Haircuts",
  },
  {
    keywords: ["body wash", "shower gel"],
    defaultBrand: "Method / Dove",
    unitPriceEstimate: 8.0,
    daysPerUnit: 45,
    category: "Personal Care & Haircuts",
  },
  {
    keywords: ["shampoo", "conditioner"],
    defaultBrand: "Pantene / Head & Shoulders",
    unitPriceEstimate: 9.0,
    daysPerUnit: 60,
    category: "Personal Care & Haircuts",
  },
  {
    keywords: ["paper towels", "bounty", "brawny"],
    defaultBrand: "Bounty",
    unitPriceEstimate: 2.5, // per roll
    daysPerUnit: 7, // 1 roll lasts ~7 days
    category: "Household Supplies",
  },
  {
    keywords: ["toilet paper", "charmin", "cottonelle"],
    defaultBrand: "Charmin",
    unitPriceEstimate: 1.25, // per roll
    daysPerUnit: 5,
    category: "Household Supplies",
  },
  {
    keywords: ["laundry detergent", "tide", "tide pods", "gain", "persil"],
    defaultBrand: "Tide",
    unitPriceEstimate: 22.0, // large jug / pod container
    daysPerUnit: 75,
    category: "Household Supplies",
  },
  {
    keywords: ["dish soap", "dawn", "palmolive"],
    defaultBrand: "Dawn Platinum",
    unitPriceEstimate: 4.5,
    daysPerUnit: 45,
    category: "Household Supplies",
  },
  {
    keywords: ["coffee", "folgers", "starbucks", "nespresso", "k-cup", "espresso"],
    defaultBrand: "Coffee / Beans",
    unitPriceEstimate: 14.0, // bag or box
    daysPerUnit: 25,
    category: "Groceries & Supermarket",
  },
];

// Common vehicle models and their approximate EPA combined MPG
const VEHICLE_MPG_LOOKUP: Record<string, number> = {
  civic: 33,
  accord: 32,
  crv: 30,
  "cr-v": 30,
  corolla: 34,
  camry: 32,
  rav4: 30,
  prius: 54,
  f150: 20,
  "f-150": 20,
  silverado: 19,
  ram: 19,
  altima: 31,
  rogue: 30,
  elantra: 34,
  sonata: 31,
  tucson: 28,
  outback: 29,
  forester: 29,
  "model 3": 130, // MPGe
  "model y": 122,
  tahoe: 17,
  suburban: 17,
  explorer: 22,
  wrangler: 20,
  cherokee: 24,
  cx5: 28,
  "cx-5": 28,
};

/**
 * Built-in Offline Intelligent Parser & Estimator
 * Parses natural language, extracts consumables with multi-pack multipliers and vehicle models.
 */
export function analyzeWithBuiltInEngine(inputText: string): AICopilotAnalysisResult {
  const text = inputText.toLowerCase();
  const consumables: ConsumableItemEstimate[] = [];

  // Helper to extract pack count from surrounding text (e.g. "two pack", "2-pack", "two 8-packs", "8 pack")
  const extractPackInfo = (
    phrase: string
  ): { packCount: number; packMultiplier: number; description: string } => {
    let packMultiplier = 1;
    let packCount = 1;

    // Check for "two 8-packs" or "2 8-packs"
    const dualPackMatch = phrase.match(/(?:two|2)\s+(?:eight|8)[\s-]packs?/i);
    if (dualPackMatch) {
      return { packCount: 8, packMultiplier: 2, description: "Two 8-Packs (16 items)" };
    }

    // Check for phrases like "two pack", "2-pack", "3-pack", "4-pack", "8-pack", "12-pack"
    const packMatch = phrase.match(/(\d+|one|two|three|four|five|six|eight|twelve)[\s-]packs?/i);
    if (packMatch) {
      const valStr = packMatch[1].toLowerCase();
      let n = parseInt(valStr, 10);
      if (isNaN(n)) {
        if (valStr === "two") n = 2;
        else if (valStr === "three") n = 3;
        else if (valStr === "four") n = 4;
        else if (valStr === "five") n = 5;
        else if (valStr === "six") n = 6;
        else if (valStr === "eight") n = 8;
        else if (valStr === "twelve") n = 12;
        else n = 1;
      }
      packCount = n;
      return { packCount, packMultiplier: 1, description: `${packCount}-Pack` };
    }

    return { packCount: 1, packMultiplier: 1, description: "Standard Single Pack" };
  };

  // Match against catalog rules
  for (const rule of STAPLE_CATALOG) {
    const matchedKeyword = rule.keywords.find((kw) => text.includes(kw));
    if (matchedKeyword) {
      // Find context around this keyword in text
      const idx = text.indexOf(matchedKeyword);
      const surrounding = text.substring(Math.max(0, idx - 25), Math.min(text.length, idx + 50));
      const packInfo = extractPackInfo(surrounding);

      const totalUnits = packInfo.packCount * packInfo.packMultiplier;
      const packPrice = Math.round(totalUnits * rule.unitPriceEstimate * 100) / 100;
      const daysSupply = totalUnits * rule.daysPerUnit;
      const monthlyCost = Math.round((packPrice / daysSupply) * 30.4 * 100) / 100;

      // Extract a nice title
      let displayName = matchedKeyword
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      if (text.includes("burt's bees") && matchedKeyword === "toothpaste") {
        displayName = "Burt's Bees Charcoal Toothpaste";
      } else if (text.includes("every man jack") && matchedKeyword === "deodorant") {
        displayName = "Every Man Jack Deodorant";
      } else if (text.includes("dial") && (matchedKeyword === "bar soap" || matchedKeyword === "soap bar" || matchedKeyword === "dial soap")) {
        displayName = "Dial Antibacterial Bar Soap";
      }

      // Avoid duplicates
      if (!consumables.some((c) => c.name === displayName)) {
        consumables.push({
          id: `item-${consumables.length + 1}`,
          name: displayName,
          packDescription: packInfo.description,
          packQuantity: totalUnits,
          estimatedPackPrice: packPrice,
          estimatedDaysSupply: daysSupply,
          monthlyCost: Math.max(1, monthlyCost),
          suggestedCategory: rule.category,
          reasoning: `${totalUnits} units lasts approx ${daysSupply} days (~${(daysSupply / 30.4).toFixed(1)} mo) based on daily usage rate.`,
        });
      }
    }
  }

  // Check for Vehicle / Commute
  let vehicle: VehicleEstimate | undefined = undefined;
  const hasVehicleKeywords =
    text.includes("car") ||
    text.includes("vehicle") ||
    text.includes("truck") ||
    text.includes("honda") ||
    text.includes("toyota") ||
    text.includes("ford") ||
    text.includes("chevy") ||
    text.includes("tesla") ||
    text.includes("gas") ||
    text.includes("miles") ||
    text.includes("commute");

  if (hasVehicleKeywords) {
    // Detect Year (e.g. 2015 - 2026)
    const yearMatch = text.match(/\b(201[0-9]|202[0-6])\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : 2020;

    // Detect Model & MPG
    let mpg = 28; // Default average
    let detectedModel = "Vehicle";
    let detectedMake = "";

    for (const [modelKey, modelMpg] of Object.entries(VEHICLE_MPG_LOOKUP)) {
      if (text.includes(modelKey)) {
        mpg = modelMpg;
        detectedModel = modelKey.toUpperCase();
        if (["civic", "accord", "crv", "cr-v"].includes(modelKey)) detectedMake = "Honda";
        else if (["corolla", "camry", "rav4", "prius"].includes(modelKey)) detectedMake = "Toyota";
        else if (["f150", "f-150", "explorer"].includes(modelKey)) detectedMake = "Ford";
        else if (["silverado", "tahoe", "suburban"].includes(modelKey)) detectedMake = "Chevrolet";
        else if (["model 3", "model y"].includes(modelKey)) detectedMake = "Tesla";
        else if (["altima", "rogue"].includes(modelKey)) detectedMake = "Nissan";
        else if (["elantra", "sonata", "tucson"].includes(modelKey)) detectedMake = "Hyundai";
        break;
      }
    }

    if (!detectedMake) {
      if (text.includes("honda")) detectedMake = "Honda";
      else if (text.includes("toyota")) detectedMake = "Toyota";
      else if (text.includes("ford")) detectedMake = "Ford";
      else if (text.includes("chevy") || text.includes("chevrolet")) detectedMake = "Chevrolet";
      else if (text.includes("tesla")) detectedMake = "Tesla";
    }

    // Detect Miles / Commute
    let dailyMiles = 25;
    let monthlyMiles = 850;
    const milesMatch = text.match(/(\d+)\s*(?:miles|mi)(?:\s*(?:a|per)\s*(?:day|daily|commute))?/i);
    if (milesMatch) {
      const m = parseInt(milesMatch[1], 10);
      if (m > 0 && m < 150) {
        dailyMiles = m;
        monthlyMiles = Math.round(dailyMiles * 22 * 1.3); // 22 work days + weekend buffer
      } else if (m >= 150) {
        monthlyMiles = m;
        dailyMiles = Math.round(m / 30);
      }
    }

    // Detect Gas Price (e.g. "$3.45" or "3.45/gal" or "3.50")
    let gasPrice = 3.45;
    const gasMatch = text.match(/\$?\s*(\d+\.\d{2})\s*(?:\/|\s*per|\s*a)?\s*(?:gal|gallon)?/i);
    if (gasMatch) {
      const gp = parseFloat(gasMatch[1]);
      if (gp > 1.5 && gp < 9.0) {
        gasPrice = gp;
      }
    }

    // Monthly Fuel = (monthlyMiles / mpg) * gasPrice
    const monthlyFuelCost = Math.round((monthlyMiles / mpg) * gasPrice);
    // Routine Maintenance Sinking Fund = ~$0.07 per mile (tires, synthetic oil, brakes, filters)
    const monthlyMaintenanceQuota = Math.round(monthlyMiles * 0.07);
    const annualMaintenanceTarget = monthlyMaintenanceQuota * 12;

    vehicle = {
      year,
      make: detectedMake || "Auto",
      model: detectedModel,
      mpg,
      commuteMilesDaily: dailyMiles,
      monthlyMiles,
      gasPricePerGallon: gasPrice,
      monthlyFuelCost,
      monthlyMaintenanceQuota,
      suggestedFuelCategory: "Gasoline & Transit",
      suggestedMaintenanceFund: "Auto Maintenance & Tires",
      annualMaintenanceTarget,
      reasoning: `Based on ~${monthlyMiles} miles/mo at ${mpg} MPG with gas at $${gasPrice.toFixed(2)}/gal. Maintenance quota estimated at $0.07/mile for routine oil, tires, and brake wear.`,
    };
  }

  // Compose Summary
  let summary = "";
  if (consumables.length > 0 && vehicle) {
    const totalConsumableMonthly = consumables.reduce((sum, c) => sum + c.monthlyCost, 0);
    summary = `Parsed ${consumables.length} consumable items (+$${totalConsumableMonthly.toFixed(2)}/mo) and estimated ${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model} operating costs ($${vehicle.monthlyFuelCost}/mo fuel, $${vehicle.monthlyMaintenanceQuota}/mo maintenance).`;
  } else if (consumables.length > 0) {
    const totalConsumableMonthly = consumables.reduce((sum, c) => sum + c.monthlyCost, 0);
    summary = `Parsed ${consumables.length} consumable items with a total prorated consumption cost of $${totalConsumableMonthly.toFixed(2)}/month.`;
  } else if (vehicle) {
    summary = `Estimated ${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model} fuel at $${vehicle.monthlyFuelCost}/mo and routine maintenance sinking quota at $${vehicle.monthlyMaintenanceQuota}/mo.`;
  } else {
    summary = "Could not detect specific staples or vehicles from your input. Try specifying items like 'Burt's bees toothpaste 2-pack' or '2018 Honda Civic 25 miles a day'.";
  }

  return {
    consumables,
    vehicle,
    summary,
    rawInput: inputText,
    providerUsed: "Built-in Knowledge Engine (Offline)",
  };
}

/**
 * Cloud LLM Caller (Groq / Gemini / Ollama)
 * If an API key or local endpoint is configured, queries the LLM with structured output.
 */
export async function callLLMProvider(
  inputText: string,
  config: AIProviderConfig
): Promise<AICopilotAnalysisResult> {
  // If provider is builtin or key missing, fallback cleanly
  if (config.provider === "builtin" || (!config.apiKey && config.provider !== "ollama")) {
    return analyzeWithBuiltInEngine(inputText);
  }

  const prompt = `You are the Finance OS AI Copilot. The user spoke or typed the following about their routine purchases or vehicle commute:
"${inputText}"

Analyze the input and return a JSON object with this EXACT structure:
{
  "consumables": [
    {
      "id": "1",
      "name": "Item name with brand",
      "brand": "Brand",
      "packDescription": "e.g. 2-pack or Two 8-packs",
      "packQuantity": 2,
      "estimatedPackPrice": 11.50,
      "estimatedDaysSupply": 90,
      "monthlyCost": 3.88,
      "suggestedCategory": "Personal Care & Haircuts" or "Household Supplies" or "Groceries & Supermarket",
      "reasoning": "Brief explanation of lifespan and unit math"
    }
  ],
  "vehicle": {
    "year": 2018,
    "make": "Honda",
    "model": "Civic",
    "mpg": 33,
    "commuteMilesDaily": 25,
    "monthlyMiles": 850,
    "gasPricePerGallon": 3.45,
    "monthlyFuelCost": 88,
    "monthlyMaintenanceQuota": 60,
    "suggestedFuelCategory": "Gasoline & Transit",
    "suggestedMaintenanceFund": "Auto Maintenance & Tires",
    "annualMaintenanceTarget": 720,
    "reasoning": "Brief math explanation"
  },
  "summary": "Summary of parsed items and monthly budget impact."
}

If no vehicle is mentioned, omit the "vehicle" key. If no consumables are mentioned, return "consumables": []. Return valid JSON only, no markdown.`;

  try {
    if (config.provider === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model || "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (!res.ok) throw new Error(`Groq returned ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return {
        consumables: parsed.consumables || [],
        vehicle: parsed.vehicle,
        summary: parsed.summary || "AI analysis completed.",
        rawInput: inputText,
        providerUsed: `Groq (${config.model || "llama-3.3-70b"})`,
      };
    }

    if (config.provider === "gemini") {
      const modelName = config.model || "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (!res.ok) throw new Error(`Gemini returned ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(textResponse);
      return {
        consumables: parsed.consumables || [],
        vehicle: parsed.vehicle,
        summary: parsed.summary || "Gemini AI analysis completed.",
        rawInput: inputText,
        providerUsed: `Google Gemini (${modelName})`,
      };
    }

    if (config.provider === "ollama") {
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.model || "llama3.1",
          prompt: `${prompt}\nRespond with pure JSON only.`,
          format: "json",
          stream: false,
        }),
      });

      if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
      const data = await res.json();
      const parsed = JSON.parse(data.response);
      return {
        consumables: parsed.consumables || [],
        vehicle: parsed.vehicle,
        summary: parsed.summary || "Ollama local analysis completed.",
        rawInput: inputText,
        providerUsed: "Ollama (Local)",
      };
    }
  } catch (err) {
    console.warn("External LLM call failed, falling back to built-in knowledge engine:", err);
  }

  // Fallback to built-in engine if remote call failed or error occurred
  const fallback = analyzeWithBuiltInEngine(inputText);
  fallback.providerUsed = "Built-in Knowledge Engine (Fallback)";
  return fallback;
}
