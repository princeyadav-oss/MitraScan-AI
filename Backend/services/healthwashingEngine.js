/**
 * Healthwashing & Deception Detection Engine (The Truth Meter)
 * Cross-examines front-of-pack marketing claims against back-of-pack ingredient reality.
 */

const CLAIM_RULES = [
  {
    id: 'zero_sugar',
    claimName: 'Zero Sugar / No Sugar Added',
    patterns: [/zero\s+(?:added\s+)?sugar/i, /no\s+added\s+sugar/i, /sugar\s*free/i, /0%?\s+sugar/i],
    detectContradiction: (text, nutrition) => {
      const hasArtificialSweeteners = /sucralose|aspartame|acesulfame|saccharin|maltitol|sorbitol|erythritol|isomalt/i.test(text);
      const hasInvertSyrups = /maltodextrin|invert\s+syrup|glucose\s+syrup|corn\s+syrup|dextrose|malt\s+extract/i.test(text);
      const reportedSugar = nutrition.sugar || 0;
      if (reportedSugar > 5) return { severity: 'deceptive', reason: `Product reports ${reportedSugar}g sugar per serving despite claiming "Zero Sugar".` };
      if (hasInvertSyrups && hasArtificialSweeteners) return { severity: 'deceptive', reason: 'Contains both high-glycemic maltodextrin/invert syrups and intense artificial sweeteners (e.g., sucralose/aspartame).' };
      if (hasInvertSyrups) return { severity: 'deceptive', reason: 'Replaced regular sugar with Maltodextrin or Invert Sugar Syrup (spikes blood sugar faster than table sugar).' };
      if (hasArtificialSweeteners) return { severity: 'mild', reason: 'Zero sugar claim is achieved using synthetic intense sweeteners rather than natural sweetness.' };
      return null;
    },
    getReality: (text, nutrition) => `Hidden sweeteners or maltodextrin detected (${nutrition.sugar || 0}g reported sugar). Blood glucose impact remains significant.`
  },
  {
    id: 'oats_wholegrain',
    claimName: 'Rich in Oats / 100% Whole Wheat',
    patterns: [/rich\s+in\s+oats/i, /oats\s+(?:rich|digestive|cookie|biscuit)/i, /100%?\s+whole\s*(?:wheat|grain)/i, /multigrain\s+power/i, /digestive/i],
    detectContradiction: (text) => {
      const hasMaidaFirst = /refined\s+wheat\s+flour|maida/i.test(text);
      const lowOatsPercentage = /oats?\s*(?:\([^\)]*\))?\s*(?:[1-9]|1[0-4])%/i.test(text);
      if (hasMaidaFirst && lowOatsPercentage) return { severity: 'deceptive', reason: 'Front packaging promotes Oats/Whole Wheat, but Refined Flour (Maida) is the primary ingredient, and Oats is below 15%.' };
      if (hasMaidaFirst) return { severity: 'deceptive', reason: 'Refined Wheat Flour (Maida) is the predominant base ingredient instead of whole grain.' };
      return null;
    },
    getReality: () => 'Refined Wheat Flour (Maida) dominates the formulation. Oats/grains represent only a minor marketing fraction.'
  },
  {
    id: 'real_fruit',
    claimName: 'Real Fruit / Made with Real Juice',
    patterns: [/real\s+fruit/i, /made\s+with\s+real\s+(?:fruit|juice)/i, /100%?\s+fruit\s+goodness/i],
    detectContradiction: (text) => {
      const lowFruitPercent = /(?:fruit|juice)\s*(?:content|concentrate)?\s*[:\-]??\s*([0-9]|1[0-9])%/i.test(text);
      const hasArtificialFlavors = /nature\s+identical\s+flavor|synthetic\s+flavor|artificial\s+flavor/i.test(text);
      if (lowFruitPercent || hasArtificialFlavors) return { severity: 'deceptive', reason: 'Product uses synthetic fruit flavoring or reconstituted fruit concentrate with minimal real fruit solids.' };
      return null;
    },
    getReality: () => 'Contains mostly water, liquid sugar, and nature-identical flavoring with under 15% actual fruit juice.'
  },
  {
    id: 'natural_no_preservatives',
    claimName: '100% Natural / No Artificial Preservatives',
    patterns: [/100%?\s+natural/i, /all\s+natural/i, /no\s+(?:added\s+)?preservatives/i, /zero\s+preservatives/i],
    detectContradiction: (text) => {
      const hasSyntheticAdditives = /ins\s*(?:211|223|202|320|321|319)|sodium\s+benzoate|potassium\s+sorbate|bha|bht|tbhq/i.test(text);
      const hasArtificialColors = /tartrazine|sunset\s+yellow|allura\s+red|brilliant\s+blue|ins\s*(?:102|110|129|133)/i.test(text);
      if (hasSyntheticAdditives && hasArtificialColors) return { severity: 'deceptive', reason: 'Contains both synthetic chemical preservatives (INS 211/202/BHA) and synthetic azo dyes (INS 102/110).' };
      if (hasSyntheticAdditives) return { severity: 'deceptive', reason: 'Found synthetic chemical preservatives (Sodium Benzoate / Potassium Sorbate / BHA).' };
      if (hasArtificialColors) return { severity: 'deceptive', reason: 'Contains synthetic petroleum-derived food colorants.' };
      return null;
    },
    getReality: () => 'Contains industrial class-II chemical preservatives and artificial food colorings.'
  },
  {
    id: 'high_protein',
    claimName: 'High Protein / Protein Power',
    patterns: [/high\s+protein/i, /protein\s+(?:rich|power|plus)/i, /source\s+of\s+protein/i],
    detectContradiction: (text, nutrition) => {
      const protein = nutrition.protein || 0;
      const sugar = nutrition.sugar || 0;
      if (protein < 6) return { severity: 'deceptive', reason: `Claims high protein, but contains only ${protein}g protein per 100g.` };
      if (sugar > protein * 2) return { severity: 'deceptive', reason: `Sugar content (${sugar}g) is more than double the protein content (${protein}g).` };
      return null;
    },
    getReality: (text, nutrition) => `Protein is only ${nutrition.protein || 0}g, outweighed by ${nutrition.sugar || 0}g sugars and high carbohydrates.`
  },
  {
    id: 'diet_light',
    claimName: 'Diet / Slim / Light / Guilt-Free',
    patterns: [/\bdiet\b/i, /\blight\b/i, /\blite\b/i, /slim/i, /guilt[\s\-]free/i, /fit\b/i],
    detectContradiction: (text, nutrition) => {
      const calories = nutrition.caloriesPer100g || nutrition.calories || 0;
      const fat = nutrition.fat || 0;
      if (calories > 380 || fat > 18) {
        return { severity: 'deceptive', reason: `Marketed as "Diet / Fit", but energy density is very high: ${calories} kcal and ${fat}g fat per 100g.` };
      }
      return null;
    },
    getReality: (text, nutrition) => `High energy density (${nutrition.calories || 0} kcal, ${nutrition.fat || 0}g fat). Calling this a "diet" food is deceptive healthwashing.`
  },
  {
    id: 'heart_healthy',
    claimName: 'Heart Healthy / Cholesterol Free',
    patterns: [/heart\s+healthy/i, /zero\s+cholesterol/i, /cholesterol\s+free/i, /good\s+for\s+heart/i],
    detectContradiction: (text) => {
      const hasPalmOil = /palm\s*(?:oil|olein|fat)|hydrogenated\s*vegetable\s*oil|trans\s*fat/i.test(text);
      if (hasPalmOil) return { severity: 'deceptive', reason: 'Formulated with Saturated Palm Oil or Hydrogenated Fats, which increase LDL cholesterol and arterial plaque risk.' };
      return null;
    },
    getReality: () => 'Contains high saturated palm oil, which directly contradicts cardiovascular wellness.'
  }
];

/**
 * Evaluates text for Healthwashing & Marketing Deception
 */
function analyzeHealthwashing(ocrText = '', productName = '', nutrition = {}) {
  const combinedText = `${productName} ${ocrText}`;
  const claimsExposed = [];
  let totalDeceptionPoints = 0;

  for (const rule of CLAIM_RULES) {
    const hasClaim = rule.patterns.some((pattern) => pattern.test(combinedText));
    if (hasClaim) {
      const contradiction = rule.detectContradiction(combinedText, nutrition);
      if (contradiction) {
        const points = contradiction.severity === 'deceptive' ? 30 : 15;
        totalDeceptionPoints += points;
        claimsExposed.push({
          id: rule.id,
          claim: rule.claimName,
          reality: contradiction.reason || rule.getReality(combinedText, nutrition),
          severity: contradiction.severity,
          impact: contradiction.severity === 'deceptive' ? 'High Deception' : 'Mild Exaggeration'
        });
      } else {
        // Claim verified honest
        claimsExposed.push({
          id: rule.id,
          claim: rule.claimName,
          reality: 'Verified: Ingredients and nutritional table reasonably substantiate this front-of-pack claim.',
          severity: 'verified',
          impact: 'Verified Honest'
        });
      }
    }
  }

  // Calculate scores (0 to 100)
  const deceptionScore = Math.min(100, Math.max(0, claimsExposed.length === 0 ? 0 : totalDeceptionPoints));
  const truthScore = Math.max(0, 100 - deceptionScore);

  let deceptionRating = 'Honest & Transparent';
  let badgeColor = 'green';
  let consumerAdvisory = '';

  if (deceptionScore >= 50) {
    deceptionRating = 'High Deception / Severe Healthwashing';
    badgeColor = 'red';
    consumerAdvisory = 'ALERT: The front-of-pack marketing heavily misleads consumers. Key beneficial claims are contradicted by cheap filler ingredients, saturated fats, or hidden sugars.';
  } else if (deceptionScore >= 20) {
    deceptionRating = 'Mild Healthwashing / Exaggerated Claims';
    badgeColor = 'amber';
    consumerAdvisory = 'CAUTION: Front-of-pack claims exaggerate benefits. Check back-of-pack ingredient percentages before purchasing.';
  } else if (claimsExposed.length > 0) {
    deceptionRating = 'Honest & Transparent Formulation';
    badgeColor = 'green';
    consumerAdvisory = 'PASSED: No severe healthwashing detected. Ingredients reasonably match the stated identity of the product.';
  } else {
    deceptionRating = 'Standard Commodity Label';
    badgeColor = 'green';
    consumerAdvisory = 'No aggressive health claims detected on label. Review standard metrology and nutrition.';
  }

  return {
    deceptionScore,
    truthScore,
    deceptionRating,
    badgeColor,
    totalClaimsScanned: claimsExposed.length,
    claimsExposed,
    consumerAdvisory
  };
}

module.exports = { analyzeHealthwashing };
