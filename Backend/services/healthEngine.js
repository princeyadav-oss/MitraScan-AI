/**
 * Health & Suspicious Ingredient Detection Engine
 * Scans OCR text for harmful additives, artificial chemicals, high sugar/fat,
 * extracts nutrition values, and evaluates suitability for Calorie Deficit vs Calorie Intake.
 */

const SUSPICIOUS_INGREDIENT_RULES = [
  {
    key: 'palm_oil',
    name: 'Palm Oil / Hydrogenated Vegetable Fat',
    pattern: /\b(?:palm(?:\s*kernel)?\s*oil|palmolein|hydrogenated\s*(?:vegetable\s*)?(?:oil|fat)|vanaspati|partially\s*hydrogenated|trans\s*fat)\b/i,
    severity: 'danger',
    risk: 'High saturated and trans fats known to elevate LDL cholesterol, clog arteries, and increase cardiovascular disease risks.',
    recommendation: 'Avoid or limit intake. Look for snacks made with cold-pressed mustard oil, groundnut oil, or olive oil.'
  },
  {
    key: 'hfcs',
    name: 'High Fructose Corn Syrup / Invert Sugar Syrup',
    pattern: /\b(?:high\s*fructose(?:\s*corn\s*syrup)?|hfcs|invert\s*(?:sugar\s*)?syrup|liquid\s*glucose|maltodextrin|dextrose|corn\s*syrup)\b/i,
    severity: 'danger',
    risk: 'Rapidly spikes blood sugar, promotes visceral fat accumulation, and accelerates insulin resistance and fatty liver disease.',
    recommendation: 'Avoid high-glycemic syrups. Opt for snacks naturally sweetened with dates, fruit puree, or unrefined jaggery in moderation.'
  },
  {
    key: 'msg',
    name: 'Monosodium Glutamate (MSG / INS 621)',
    pattern: /\b(?:monosodium\s*glutamate|msg|ins\s*621|e\s*621|flavor\s*enhancer\s*(?:621|627|631)|disodium\s*inosinate|disodium\s*guanylate)\b/i,
    severity: 'warning',
    risk: 'Synthetic flavor enhancer that can trigger headaches, sweating, numbness, and excessive overeating by over-stimulating palate receptors.',
    recommendation: 'Inspect portion size carefully. Choose snacks seasoned with natural herbs, rock salt, and whole spices.'
  },
  {
    key: 'artificial_sweeteners',
    name: 'Artificial Sweeteners (Aspartame / Acesulfame-K / Sucralose)',
    pattern: /\b(?:aspartame|acesulfame(?:\s*k|\s*potassium)?|sucralose|saccharin|e\s*950|e\s*951|e\s*954|e\s*955|ins\s*(?:950|951|954|955))\b/i,
    severity: 'warning',
    risk: 'Non-nutritive sweeteners linked to gut microbiome disruptions, altered glucose tolerance, and intense cravings for sweetness.',
    recommendation: 'Check whether the product is marketed as "Sugar Free" with hidden synthetic chemical sweeteners.'
  },
  {
    key: 'harmful_colors',
    name: 'Synthetic Food Colors (Tartrazine / Sunset Yellow / Allura Red / E171)',
    pattern: /\b(?:tartrazine|sunset\s*yellow|allura\s*red|carmoisine|brilliant\s*blue|titanium\s*dioxide|ins\s*(?:102|110|122|129|133|171)|e\s*(?:102|110|122|129|133|171)|artificial\s*colou?r)\b/i,
    severity: 'danger',
    risk: 'Petroleum-derived synthetic colorants banned or restricted in several countries due to hyperactivity risks in children and potential cellular toxicity.',
    recommendation: 'Prefer naturally colored foods using turmeric (curcumin), beetroot juice, chlorophyll, or paprika.'
  },
  {
    key: 'chemical_preservatives',
    name: 'Chemical Preservatives (Sodium Benzoate / BHA / BHT / Potassium Bromate)',
    pattern: /\b(?:sodium\s*benzoate|potassium\s*bromate|potassium\s*sorbate|bha|bht|butylated\s*hydroxyanisole|butylated\s*hydroxytoluene|ins\s*(?:211|202|223|320|321|924a)|e\s*(?:211|202|223|320|321|924a)|sodium\s*(?:nitrite|nitrate))\b/i,
    severity: 'danger',
    risk: 'Preservatives that can form carcinogenic compounds (like benzene when combined with Vitamin C) or provoke allergic airway reactions.',
    recommendation: 'Look for fresh or naturally preserved options (using salt, vinegar, or nitrogen flush packaging).'
  },
  {
    key: 'excess_sodium',
    name: 'Excessive Added Sodium / Salt',
    pattern: /\b(?:sodium\s*[:=]?\s*(?:[6-9]\d{2}|\d{4,})\s*mg|salt\s*[:=]?\s*(?:[2-9]|\d{2,})\s*g)\b/i,
    severity: 'warning',
    risk: 'High sodium content causes fluid retention, vascular stiffness, and increases blood pressure.',
    recommendation: 'Target snacks with less than 200mg sodium per serving.'
  }
];

// Common snack category estimates when nutrition table is unparsed or partially visible
const COMMON_SNACK_PROFILES = [
  {
    matches: [/biscuit|cookie|wafer|cream\s*biscuit/i],
    category: 'Biscuits & Cookies',
    estimatedCaloriesPer100g: 470,
    proteinPer100g: 6,
    carbsPer100g: 68,
    fatPer100g: 20,
    sugarPer100g: 28,
    servingSizeG: 30,
    deficitRating: 'poor',
    alternatives: ['Roasted Makhana (Foxnuts) with rock salt', 'Oatmeal walnut energy bites', 'Baked Ragi crispies']
  },
  {
    matches: [/potato\s*chip|nacho|crisp|lays|bingo|kurkure|namkeen|bhujia|sev/i],
    category: 'Chips & Fried Namkeen',
    estimatedCaloriesPer100g: 540,
    proteinPer100g: 5,
    carbsPer100g: 52,
    fatPer100g: 34,
    sugarPer100g: 3,
    servingSizeG: 30,
    deficitRating: 'poor',
    alternatives: ['Air-popped spicy popcorn (no butter)', 'Roasted salted chana (Bengal gram)', 'Sprouted moong chaat with lemon']
  },
  {
    matches: [/noodle|ramen|pasta|maggi/i],
    category: 'Instant Noodles / Pasta',
    estimatedCaloriesPer100g: 430,
    proteinPer100g: 8,
    carbsPer100g: 62,
    fatPer100g: 17,
    sugarPer100g: 2,
    servingSizeG: 70,
    deficitRating: 'poor',
    alternatives: ['Zucchini / vegetable noodles stir-fry', 'Millet vermicelli with sauteed veggies', 'Boiled egg white chaat']
  },
  {
    matches: [/chocolate|candy|sweet|mithai|caramel/i],
    category: 'Chocolates & Confectionery',
    estimatedCaloriesPer100g: 530,
    proteinPer100g: 7,
    carbsPer100g: 58,
    fatPer100g: 30,
    sugarPer100g: 50,
    servingSizeG: 25,
    deficitRating: 'poor',
    alternatives: ['Dark chocolate (>75% cocoa) - 1 small square', 'Dates stuffed with roasted almonds', 'Greek yogurt with cinnamon']
  },
  {
    matches: [/juice|soda|cola|beverage|energy\s*drink/i],
    category: 'Packaged Beverage / Soda',
    estimatedCaloriesPer100g: 45, // per 100ml
    proteinPer100g: 0,
    carbsPer100g: 11,
    fatPer100g: 0,
    sugarPer100g: 10.5,
    servingSizeG: 200,
    deficitRating: 'poor',
    alternatives: ['Chilled tender coconut water', 'Iced mint lemon water', 'Sparkling water with lime wedge', 'Unsweetened green tea']
  }
];

const HEALTHY_DEFICIT_ALTERNATIVES = [
  { name: 'Roasted Makhana (Foxnuts)', calories: 95, unit: '30g cup', benefit: 'Low calorie density, rich in magnesium, crunchy satisfying texture' },
  { name: 'Sprouted Moong Chaat', calories: 110, unit: '1 bowl', benefit: 'High protein & fiber, keeps you full for hours, zero saturated fat' },
  { name: 'Roasted Chana (Bengal Gram)', calories: 125, unit: '35g handful', benefit: 'Complex slow-digesting carbs with 7g plant protein' },
  { name: 'Air-Popped Spiced Popcorn', calories: 85, unit: '2 cups', benefit: 'High volume snack that curbs appetite during calorie deficit' },
  { name: 'Greek Yogurt with Blueberries', calories: 120, unit: '150g cup', benefit: '15g lean protein to prevent muscle loss during fat cut' },
  { name: 'Baked Ragi (Finger Millet) Crisps', calories: 105, unit: '25g serving', benefit: 'High calcium, low glycemic index, zero refined flour' }
];

/**
 * Extracts numeric nutrition declarations from OCR text.
 */
function extractNutrition(text, productName = '') {
  const clean = text.toLowerCase();

  // Calories / Energy
  const energyMatch = clean.match(/(?:energy|calories?|caloric\s*value|kcal)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:kcal|cal)?/i)
    || clean.match(/(\d+(?:\.\d+)?)\s*(?:kcal|calories)\b/i);

  // Protein
  const proteinMatch = clean.match(/protein\s*[:=]?\s*(\d+(?:\.\d+)?)\s*g/i)
    || clean.match(/(\d+(?:\.\d+)?)\s*g\s*protein/i);

  // Carbohydrates
  const carbsMatch = clean.match(/(?:carbohydrate|carbs?)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*g/i);

  // Sugars
  const sugarMatch = clean.match(/(?:total\s*sugars?|added\s*sugars?|sugar)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*g/i);

  // Fat
  const fatMatch = clean.match(/(?:total\s*fat|fat)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*g/i);

  // Sodium
  const sodiumMatch = clean.match(/sodium\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:mg|g)/i);

  // Serving size or package net quantity
  const servingMatch = clean.match(/(?:serving\s*size|per\s*pack|net\s*quantity|net\s*wt)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:g|ml)/i);

  let profile = COMMON_SNACK_PROFILES.find((p) => p.matches.some((r) => r.test(productName) || r.test(clean)));

  const parsedCalories = energyMatch ? parseFloat(energyMatch[1]) : null;
  const parsedProtein = proteinMatch ? parseFloat(proteinMatch[1]) : null;
  const parsedCarbs = carbsMatch ? parseFloat(carbsMatch[1]) : null;
  const parsedSugar = sugarMatch ? parseFloat(sugarMatch[1]) : null;
  const parsedFat = fatMatch ? parseFloat(fatMatch[1]) : null;
  let parsedSodium = null;
  if (sodiumMatch) {
    parsedSodium = parseFloat(sodiumMatch[1]);
    if (/g$/i.test(sodiumMatch[0]) && !/mg$/i.test(sodiumMatch[0])) {
      parsedSodium *= 1000; // convert g to mg
    }
  }

  const servingSize = servingMatch ? parseFloat(servingMatch[1]) : (profile?.servingSizeG || 30);

  // Compute final values (using parsed when available, or profile estimation)
  const isEstimated = parsedCalories === null;
  const caloriesPer100 = parsedCalories ?? (profile ? profile.estimatedCaloriesPer100g : 420);
  const servingCalories = Math.round((caloriesPer100 * servingSize) / 100);

  const protein = parsedProtein ?? (profile ? Math.round((profile.proteinPer100g * servingSize) / 100) : 4);
  const carbs = parsedCarbs ?? (profile ? Math.round((profile.carbsPer100g * servingSize) / 100) : 22);
  const sugar = parsedSugar ?? (profile ? Math.round((profile.sugarPer100g * servingSize) / 100) : 8);
  const fat = parsedFat ?? (profile ? Math.round((profile.fatPer100g * servingSize) / 100) : 10);
  const sodium = parsedSodium ?? (profile ? 180 : 150);

  return {
    calories: servingCalories,
    caloriesPer100g: Math.round(caloriesPer100),
    servingSize,
    servingUnit: 'g',
    protein,
    carbs,
    sugar,
    fat,
    sodium,
    isEstimated,
    category: profile ? profile.category : 'Packaged Snack'
  };
}

/**
 * Scans text for suspicious and harmful ingredients.
 */
function scanSuspiciousIngredients(text) {
  const detected = [];

  for (const rule of SUSPICIOUS_INGREDIENT_RULES) {
    const match = text.match(rule.pattern);
    if (match) {
      detected.push({
        key: rule.key,
        name: rule.name,
        matchedText: match[0],
        severity: rule.severity,
        risk: rule.risk,
        recommendation: rule.recommendation
      });
    }
  }

  const hasDanger = detected.some((item) => item.severity === 'danger');
  const hasWarning = detected.some((item) => item.severity === 'warning');

  let alertLevel = 'safe';
  if (hasDanger) alertLevel = 'danger';
  else if (hasWarning) alertLevel = 'warning';

  return {
    hasSuspiciousIngredients: detected.length > 0,
    hasDanger,
    alertLevel,
    count: detected.length,
    list: detected
  };
}

/**
 * Evaluates the snack for Calorie Deficit vs Intake and provides tailored suggestions.
 */
function evaluateCalorieSuitability(nutrition, suspiciousAnalysis) {
  const { calories, sugar, fat, protein, carbs, servingSize } = nutrition;

  // Calorie Deficit Analysis (<160 kcal/serving is ideal for deficit snacks)
  const isDeficitFriendly = calories <= 160 && sugar <= 6 && !suspiciousAnalysis.hasDanger;
  let deficitVerdict = '';
  let deficitBadge = '';

  if (calories <= 130 && sugar <= 4) {
    deficitVerdict = `Excellent choice for a calorie deficit (${calories} kcal/serving). High satiety with minimal sugar impact.`;
    deficitBadge = 'Ideal for Deficit';
  } else if (calories <= 180 && sugar <= 8) {
    deficitVerdict = `Moderate for a calorie deficit (${calories} kcal/serving). Portion control is essential; limit to 1 serving.`;
    deficitBadge = 'Moderate Deficit Fit';
  } else {
    deficitVerdict = `High calorie density (${calories} kcal for just ${servingSize}g). A single serving consumes a large chunk of your deficit budget with high sugar/fat.`;
    deficitBadge = 'Not Recommended for Deficit';
  }

  // Calorie Intake / Surplus Analysis
  let surplusVerdict = '';
  if (protein >= 8 && !suspiciousAnalysis.hasDanger) {
    surplusVerdict = `Good for muscle gain & healthy calorie intake (${calories} kcal, ${protein}g protein). Supplies quality mass-building fuel.`;
  } else if (calories >= 250 && sugar > 15) {
    surplusVerdict = `High calorie intake, but primarily from empty sugars and saturated fats. Opt for clean nutrient-dense surplus foods instead.`;
  } else {
    surplusVerdict = `Provides ${calories} kcal. Pair with a protein source (milk, whey, nuts) to balance macro intake.`;
  }

  return {
    isDeficitFriendly,
    deficitBadge,
    deficitVerdict,
    surplusVerdict,
    macroRatio: {
      proteinPct: Math.round((protein * 4 / Math.max(calories, 1)) * 100),
      carbsPct: Math.round((carbs * 4 / Math.max(calories, 1)) * 100),
      fatPct: Math.round((fat * 9 / Math.max(calories, 1)) * 100)
    },
    suggestedDeficitAlternatives: HEALTHY_DEFICIT_ALTERNATIVES
  };
}

/**
 * Main Health & Nutrition Analysis function called by compliance engine.
 */
function analyzeHealthAndNutrition(ocrText, productName = '') {
  const nutrition = extractNutrition(ocrText, productName);
  const suspicious = scanSuspiciousIngredients(ocrText);
  const dietary = evaluateCalorieSuitability(nutrition, suspicious);

  let healthScore = 100;
  // Deduct points for harmful ingredients
  for (const item of suspicious.list) {
    if (item.severity === 'danger') healthScore -= 25;
    else if (item.severity === 'warning') healthScore -= 12;
  }
  // Deduct for excessive sugar
  if (nutrition.sugar > 15) healthScore -= 15;
  else if (nutrition.sugar > 10) healthScore -= 8;
  // Deduct for high sodium
  if (nutrition.sodium > 400) healthScore -= 10;

  healthScore = Math.max(10, Math.min(100, healthScore));

  return {
    nutrition,
    suspiciousIngredients: suspicious,
    dietary,
    healthScore,
    healthStatus: healthScore >= 80 ? 'Healthy' : healthScore >= 55 ? 'Moderate' : 'Caution / High Risk',
    shouldBeep: suspicious.hasSuspiciousIngredients || healthScore < 50
  };
}

module.exports = {
  analyzeHealthAndNutrition,
  scanSuspiciousIngredients,
  extractNutrition,
  evaluateCalorieSuitability,
  HEALTHY_DEFICIT_ALTERNATIVES
};
