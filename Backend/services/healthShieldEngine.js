/**
 * Personalized Health Shield Engine
 * Evaluates scanned product for medical conditions & allergies:
 * - Diabetic (Type 2 / Insulin Resistance)
 * - Hypertension (High Blood Pressure / Low Sodium)
 * - Gluten-Free (Celiac Disease / Gluten Sensitivity)
 * - Nut & Peanut Allergies
 * - Child-Safe (<5 yrs) & Pregnancy
 */

const CONDITION_RULES = {
  diabetic: {
    id: 'diabetic',
    label: 'Diabetic / Insulin Resistance',
    icon: '🩸',
    check: (text, nutrition) => {
      const highGIMatch = text.match(/\b(?:maltodextrin|liquid\s*glucose|invert\s*(?:sugar\s*)?syrup|dextrose|corn\s*syrup|high\s*fructose)\b/i);
      const isHighSugar = nutrition.sugar > 7;
      if (highGIMatch || isHighSugar) {
        return {
          triggered: true,
          severity: 'danger',
          badge: 'High Blood Sugar Risk',
          hazard: highGIMatch
            ? `Contains "${highGIMatch[0]}" (GI > 100). Causes rapid glucose spikes even in products labelled "sugar-free".`
            : `Contains ${nutrition.sugar}g sugar per serving, exceeding safe diabetic snacking limits.`,
          recommendation: 'Avoid this snack. Choose whole foods with low glycemic index (e.g. roasted makhana, sprouted legumes, chia pudding).'
        };
      }
      return { triggered: false };
    }
  },

  hypertension: {
    id: 'hypertension',
    label: 'Hypertension (High BP / Low Sodium)',
    icon: '🫀',
    check: (text, nutrition) => {
      const isHighSodium = nutrition.sodium > 220;
      const hasExcessSalt = /\b(?:salt\s*[:=]?\s*[1-9]\d*|monosodium\s*glutamate|msg|sodium\s*benzoate)\b/i.test(text);
      if (isHighSodium || hasExcessSalt) {
        return {
          triggered: true,
          severity: 'danger',
          badge: 'Elevated Sodium / BP Risk',
          hazard: `Sodium content is ${nutrition.sodium}mg per serving. High sodium accelerates fluid retention and spikes arterial pressure.`,
          recommendation: 'Target heart-safe snacks with <140mg sodium per serving. Avoid processed crisps and instant noodles.'
        };
      }
      return { triggered: false };
    }
  },

  gluten: {
    id: 'gluten',
    label: 'Gluten-Free (Celiac Safety)',
    icon: '🌾',
    check: (text) => {
      const glutenMatch = text.match(/\b(?:refined\s*wheat\s*flour|maida|wheat\s*flour|barley\s*malt|malt\s*extract|rye|gluten)\b/i);
      if (glutenMatch) {
        return {
          triggered: true,
          severity: 'danger',
          badge: 'Gluten Detected',
          hazard: `Contains gluten-bearing grains: "${glutenMatch[0]}". Unsafe for Celiac disease or gluten intolerance.`,
          recommendation: 'Switch to certified gluten-free alternatives made from ragi (finger millet), jowar, bajra, or rice flour.'
        };
      }
      return { triggered: false };
    }
  },

  nutAllergy: {
    id: 'nutAllergy',
    label: 'Nut & Peanut Allergy',
    icon: '🥜',
    check: (text) => {
      const nutMatch = text.match(/\b(?:peanuts?|groundnut|almonds?|cashews?|walnuts?|hazelnuts?|pistachios?|tree\s*nuts?|may\s*contain\s*(?:traces\s*of\s*)?nuts?)\b/i);
      if (nutMatch) {
        return {
          triggered: true,
          severity: 'danger',
          badge: 'Severe Allergen Warning',
          hazard: `Contains or processed with "${nutMatch[0]}". Triggers severe allergic reactions / anaphylaxis in sensitive individuals.`,
          recommendation: 'Do NOT consume if you or anyone in your household has a nut allergy.'
        };
      }
      return { triggered: false };
    }
  },

  childSafe: {
    id: 'childSafe',
    label: 'Child-Safe (<5 yrs) / Pregnancy',
    icon: '👶',
    check: (text, nutrition) => {
      const chemicalMatch = text.match(/\b(?:aspartame|acesulfame|sucralose|saccharin|caffeine|tartrazine|sunset\s*yellow|allura\s*red|titanium\s*dioxide|ins\s*(?:102|110|129|171|950|951|955))\b/i);
      if (chemicalMatch || nutrition.sugar > 14) {
        return {
          triggered: true,
          severity: 'danger',
          badge: 'Not Recommended for Young Children',
          hazard: chemicalMatch
            ? `Contains chemical additives "${chemicalMatch[0]}" restricted or discouraged for young children and pregnant women.`
            : `Excessive concentrated sugar (${nutrition.sugar}g per serving). Promotes hyperactivity, early insulin resistance, and dental caries.`,
          recommendation: 'Opt for unadulterated whole fruits, homemade roasted snacks, or plain yogurt.'
        };
      }
      return { triggered: false };
    }
  }
};

/**
 * Checks all conditions against the scanned product
 */
function analyzeHealthShield(ocrText, nutrition = {}) {
  const cleanText = ocrText.toLowerCase();
  const conditionResults = {};

  for (const [conditionKey, rule] of Object.entries(CONDITION_RULES)) {
    const result = rule.check(cleanText, nutrition);
    conditionResults[conditionKey] = {
      id: rule.id,
      label: rule.label,
      icon: rule.icon,
      ...result
    };
  }

  const triggeredList = Object.values(conditionResults).filter((r) => r.triggered);

  return {
    conditionResults,
    triggeredList,
    hasAnyRisk: triggeredList.length > 0,
    totalRisks: triggeredList.length
  };
}

module.exports = { analyzeHealthShield, CONDITION_RULES };
