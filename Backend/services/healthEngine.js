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
    matches: [/biscuit|cookie|wafer|cream\s*biscuit|bourbon|parle|oreo|rusk|marie|hide\s*(?:and|&)\s*seek|good\s*day|monaco|krackjack|digestive|cracker|shortbread|bakery\s*toast/i],
    category: 'Biscuits & Cookies',
    estimatedCaloriesPer100g: 470,
    proteinPer100g: 6,
    carbsPer100g: 68,
    fatPer100g: 20,
    sugarPer100g: 28,
    servingSizeG: 30,
    deficitRating: 'poor'
  },
  {
    matches: [/potato\s*chip|nacho|crisp|lays|bingo|kurkure|namkeen|bhujia|sev|chivda|mixture|puffs|cheetos|doritos|pringles|aloo\s*bhujia|fried\s*snack|gathiya|murukku|chips/i],
    category: 'Chips & Fried Namkeen',
    estimatedCaloriesPer100g: 540,
    proteinPer100g: 5,
    carbsPer100g: 52,
    fatPer100g: 34,
    sugarPer100g: 3,
    servingSizeG: 30,
    deficitRating: 'poor'
  },
  {
    matches: [/noodle|ramen|pasta|maggi|yippee|top\s*ramen|chowmein|macaroni|spaghetti|wai\s*wai|knorr\s*soup|instant\s*noodle|cup\s*noodles/i],
    category: 'Instant Noodles & Pasta',
    estimatedCaloriesPer100g: 430,
    proteinPer100g: 8,
    carbsPer100g: 62,
    fatPer100g: 17,
    sugarPer100g: 2,
    servingSizeG: 70,
    deficitRating: 'poor'
  },
  {
    matches: [/chocolate|candy|sweet|mithai|caramel|toffee|dairy\s*milk|kitkat|kit\s*kat|5\s*star|five\s*star|snickers|lollipop|gummy|fudge|choc|gems|bar\s*one|perk|munch|cadbury|milkybar|dark\s*chocolate/i],
    category: 'Chocolates & Confectionery',
    estimatedCaloriesPer100g: 530,
    proteinPer100g: 7,
    carbsPer100g: 58,
    fatPer100g: 30,
    sugarPer100g: 50,
    servingSizeG: 25,
    deficitRating: 'poor'
  },
  {
    matches: [/juice|soda|cola|beverage|energy\s*drink|pepsi|coca\s*cola|coke|fanta|sprite|red\s*bull|sting|maaza|frooti|real\s*fruit|tropicana|thums\s*up|mountain\s*dew|limca|monster|cold\s*drink|soft\s*drink/i],
    category: 'Packaged Beverages & Soda',
    estimatedCaloriesPer100g: 45, // per 100ml
    proteinPer100g: 0,
    carbsPer100g: 11,
    fatPer100g: 0,
    sugarPer100g: 10.5,
    servingSizeG: 200,
    deficitRating: 'poor'
  },
  {
    matches: [/cake|pastry|muffin|croissant|brownie|donut|doughnut|bun|bread|cupcake|swiss\s*roll|plum\s*cake|pie|tart/i],
    category: 'Bakery & Cakes',
    estimatedCaloriesPer100g: 380,
    proteinPer100g: 5,
    carbsPer100g: 55,
    fatPer100g: 16,
    sugarPer100g: 26,
    servingSizeG: 50,
    deficitRating: 'poor'
  },
  {
    matches: [/cereal|cornflakes|chocos|muesli|granola|rolled\s*oats|breakfast\s*cereal|energy\s*bar|protein\s*bar|cereal\s*bar|nutrition\s*bar/i],
    category: 'Breakfast Cereals & Bars',
    estimatedCaloriesPer100g: 390,
    proteinPer100g: 7,
    carbsPer100g: 72,
    fatPer100g: 8,
    sugarPer100g: 22,
    servingSizeG: 40,
    deficitRating: 'moderate'
  },
  {
    matches: [/ice\s*cream|kulfi|gelato|popsicle|frozen\s*dessert|sundae|cornetto|chocobar|cassata|cone|sorbet/i],
    category: 'Ice Creams & Frozen Desserts',
    estimatedCaloriesPer100g: 220,
    proteinPer100g: 4,
    carbsPer100g: 26,
    fatPer100g: 11,
    sugarPer100g: 24,
    servingSizeG: 75,
    deficitRating: 'poor'
  },
  {
    matches: [/cheese|mayo|mayonnaise|nutella|peanut\s*butter|butter|spread|cheese\s*slice|jam|marmalade/i],
    category: 'Cheeses, Butters & Spreads',
    estimatedCaloriesPer100g: 520,
    proteinPer100g: 9,
    carbsPer100g: 15,
    fatPer100g: 45,
    sugarPer100g: 10,
    servingSizeG: 20,
    deficitRating: 'poor'
  }
];

// Rich, Category-Tailored Healthier Deficit Alternatives (<140 kcal, nutrient-dense craving swaps)
const CATEGORY_DEFICIT_ALTERNATIVES = {
  'Biscuits & Cookies': [
    {
      name: 'Roasted Makhana (Foxnuts)',
      calories: 95,
      unit: '30g bowl',
      protein: 3,
      carbs: 19,
      fat: 0.5,
      icon: '🌰',
      benefit: 'Crispy teatime crunch with 60% fewer calories than cream biscuits and zero trans fats.'
    },
    {
      name: 'Baked Ragi & Oats Thins',
      calories: 90,
      unit: '25g (4 thins)',
      protein: 3,
      carbs: 16,
      fat: 1.5,
      icon: '🍘',
      benefit: 'High fiber finger millet avoids insulin spikes and uses zero hydrogenated palm oil.'
    },
    {
      name: 'Oatmeal Cinnamon Crunch Bites',
      calories: 105,
      unit: '25g serving',
      protein: 3,
      carbs: 18,
      fat: 2,
      icon: '🍪',
      benefit: 'Satisfies sweet cookie cravings with whole rolled oats and zero refined white flour (maida).'
    },
    {
      name: 'Roasted Flax & Chia Seed Crackers',
      calories: 110,
      unit: '3 crackers',
      protein: 4,
      carbs: 9,
      fat: 6,
      icon: '🌾',
      benefit: 'Packed with heart-healthy Omega-3s and fiber that expands to keep you full for hours.'
    }
  ],
  'Chips & Fried Namkeen': [
    {
      name: 'Air-Popped Spiced Popcorn',
      calories: 85,
      unit: '2 full cups (25g)',
      protein: 3,
      carbs: 16,
      fat: 1,
      icon: '🍿',
      benefit: 'Huge volume crunch that tricks your appetite during calorie deficits with 75% less fat than potato chips.'
    },
    {
      name: 'Roasted Spiced Chana (Bengal Gram)',
      calories: 120,
      unit: '35g handful',
      protein: 7,
      carbs: 19,
      fat: 2,
      icon: '🧆',
      benefit: 'Crisp savory namkeen swap delivering 7g natural plant protein to preserve lean muscle.'
    },
    {
      name: 'Sprouted Moong Chaat with Lemon',
      calories: 105,
      unit: '1 medium bowl (120g)',
      protein: 8,
      carbs: 17,
      fat: 0.5,
      icon: '🥗',
      benefit: 'Tangy Indian street-chaat flavors with high live enzymes, dietary fiber, and almost zero saturated fat.'
    },
    {
      name: 'Vacuum-Baked Beet & Carrot Crisps',
      calories: 95,
      unit: '30g bag',
      protein: 2,
      carbs: 18,
      fat: 1.5,
      icon: '🍠',
      benefit: 'Real root vegetable chips baked at low temp with 70% lower oil absorption than regular chips.'
    }
  ],
  'Instant Noodles & Pasta': [
    {
      name: 'Zucchini Zoodles / Herb Veggie Stir-Fry',
      calories: 75,
      unit: '1 full bowl (200g)',
      protein: 3,
      carbs: 8,
      fat: 3,
      icon: '🥒',
      benefit: 'Delivers the slurpy noodle texture with 85% fewer calories and no deep-fried noodle cakes or MSG.'
    },
    {
      name: 'Millet Vermicelli with Sautéed Veggies',
      calories: 130,
      unit: '1 bowl (120g cooked)',
      protein: 4,
      carbs: 26,
      fat: 1.5,
      icon: '🍜',
      benefit: 'Slow-burning foxtail millet vermicelli loaded with carrots and peas, keeping hunger away.'
    },
    {
      name: 'Shirataki Konjac Noodles in Ginger Broth',
      calories: 45,
      unit: '1 large soup bowl',
      protein: 1,
      carbs: 3,
      fat: 0.5,
      icon: '🍲',
      benefit: 'Near-zero calorie glucomannan noodles in a warm, fragrant ginger-garlic broth.'
    },
    {
      name: 'Boiled Egg White Chaat with Mint Chutney',
      calories: 90,
      unit: '3 egg whites diced',
      protein: 11,
      carbs: 2,
      fat: 0.5,
      icon: '🥚',
      benefit: 'Pure high-protein savory snack that satisfies savory noodle cravings while fueling fat loss.'
    }
  ],
  'Chocolates & Confectionery': [
    {
      name: 'Single Origin Dark Chocolate (85%+)',
      calories: 110,
      unit: '20g (2 squares)',
      protein: 2,
      carbs: 7,
      fat: 9,
      icon: '🍫',
      benefit: 'Rich cocoa flavonoids satisfy intense chocolate cravings with 80% less sugar than milk chocolate.'
    },
    {
      name: 'Medjool Date stuffed with Roasted Almond',
      calories: 80,
      unit: '1 filled date',
      protein: 2,
      carbs: 17,
      fat: 1.5,
      icon: '🍯',
      benefit: 'Natural caramel sweetness loaded with potassium and fiber without refined sucrose or artificial flavor.'
    },
    {
      name: 'Greek Yogurt with Cocoa & Fresh Berries',
      calories: 115,
      unit: '130g cup',
      protein: 12,
      carbs: 11,
      fat: 1,
      icon: '🍓',
      benefit: 'Velvety chocolate dessert swap providing 12g lean protein to protect your metabolic rate.'
    },
    {
      name: 'Frozen Dark Cocoa Banana Slices',
      calories: 95,
      unit: '4 slices dipped in raw cacao',
      protein: 1.5,
      carbs: 18,
      fat: 2,
      icon: '🍌',
      benefit: 'Creamy frozen mouthfeel that quashes sweet cravings with natural whole-fruit sweetness.'
    }
  ],
  'Packaged Beverages & Soda': [
    {
      name: 'Chilled Tender Coconut Water',
      calories: 45,
      unit: '1 fresh glass (240ml)',
      protein: 1.5,
      carbs: 9,
      fat: 0.2,
      icon: '🥥',
      benefit: 'Natural isotonic hydration with potassium and magnesium, zero high fructose corn syrup or phosphoric acid.'
    },
    {
      name: 'Sparkling Mint & Lime Fresca',
      calories: 15,
      unit: '300ml tall glass',
      protein: 0.5,
      carbs: 3,
      fat: 0,
      icon: '🍋',
      benefit: 'Crisp bubbly carbonation and tart citrus burst that satisfies soda cravings with zero sugar.'
    },
    {
      name: 'Spiced Indian Buttermilk (Chaas)',
      calories: 55,
      unit: '200ml glass',
      protein: 3,
      carbs: 4,
      fat: 2,
      icon: '🥛',
      benefit: 'Cooling probiotic drink with roasted cumin and mint, aids digestion without any sugary syrups.'
    },
    {
      name: 'Iced Hibiscus or Green Tea with Lemon',
      calories: 8,
      unit: '300ml glass',
      protein: 0,
      carbs: 2,
      fat: 0,
      icon: '🍵',
      benefit: 'Loaded with EGCG antioxidants to support fat oxidation while consuming under 10 calories.'
    }
  ],
  'Bakery & Cakes': [
    {
      name: 'Microwave Banana & Oat Mug Cake',
      calories: 125,
      unit: '1 individual mug',
      protein: 5,
      carbs: 22,
      fat: 2,
      icon: '🧁',
      benefit: 'Fluffy warm cake texture made from ground oats and ripe banana with zero refined flour or butter.'
    },
    {
      name: 'Steamed Ragi / Multi-Grain Idli with Podi',
      calories: 110,
      unit: '2 mini idlis',
      protein: 4,
      carbs: 22,
      fat: 1,
      icon: '🥟',
      benefit: 'Fermented, oil-free steamed cake rich in complex carbs, calcium and gut-friendly probiotics.'
    },
    {
      name: 'Toasted Sourdough with Light Hummus',
      calories: 135,
      unit: '1 slice + 2 tbsp hummus',
      protein: 5,
      carbs: 20,
      fat: 3.5,
      icon: '🍞',
      benefit: 'Naturally fermented bread with lower glycemic impact paired with high-fiber chickpea spread.'
    },
    {
      name: 'Warm Baked Apple Slices with Cinnamon',
      calories: 80,
      unit: '1 sliced apple',
      protein: 0.5,
      carbs: 20,
      fat: 0.3,
      icon: '🍎',
      benefit: 'Warm, gooey apple-pie comfort with soluble pectin fiber and natural blood-sugar regulating cinnamon.'
    }
  ],
  'Breakfast Cereals & Bars': [
    {
      name: 'Rolled Oats Porridge with Cinnamon',
      calories: 130,
      unit: '1 warm bowl (35g oats)',
      protein: 5,
      carbs: 24,
      fat: 2.5,
      icon: '🥣',
      benefit: 'Beta-glucan soluble fiber stabilizes insulin and eliminates mid-morning sugar slumps.'
    },
    {
      name: 'Puffed Rice (Murmura) Veggie Bhel',
      calories: 90,
      unit: '1.5 cups',
      protein: 2,
      carbs: 18,
      fat: 1,
      icon: '🥗',
      benefit: 'Ultra-light, high-volume crunchy bowl tossed with fresh cucumbers, tomatoes and lemon juice.'
    },
    {
      name: 'Chia Seed Pudding with Almond Milk',
      calories: 120,
      unit: '1 small jar',
      protein: 4,
      carbs: 10,
      fat: 7,
      icon: '🍮',
      benefit: 'Hydrating gel fiber slows digestion and provides sustained physical energy throughout the day.'
    }
  ],
  'Ice Creams & Frozen Desserts': [
    {
      name: 'Frozen Greek Yogurt Berry Swirl',
      calories: 95,
      unit: '1 cup (120g)',
      protein: 9,
      carbs: 12,
      fat: 1,
      icon: '🍦',
      benefit: 'Creamy cold indulgence with 9g protein and live active cultures instead of heavy cream.'
    },
    {
      name: 'Homemade Banana Nice-Cream with Cocoa',
      calories: 105,
      unit: '1 bowl',
      protein: 2,
      carbs: 24,
      fat: 0.5,
      icon: '🍌',
      benefit: '100% real fruit blended smooth; mimics soft-serve ice cream with zero dairy fat or cane sugar.'
    },
    {
      name: 'Fresh Watermelon-Mint Popsicle',
      calories: 40,
      unit: '1 popsicle',
      protein: 0.5,
      carbs: 9,
      fat: 0,
      icon: '🍉',
      benefit: 'Pure cold watermelon hydration with zero artificial colors, corn syrup, or stabilizers.'
    }
  ],
  'Cheeses, Butters & Spreads': [
    {
      name: 'Whipped Paneer / Cottage Cheese Spread',
      calories: 75,
      unit: '40g (2 tbsp)',
      protein: 8,
      carbs: 2,
      fat: 4,
      icon: '🧀',
      benefit: 'High casein protein spread with 60% less saturated fat and calories than commercial mayonnaise.'
    },
    {
      name: 'Fresh Guacamole on Cucumber Slices',
      calories: 95,
      unit: '50g dip with cucumber rounds',
      protein: 1.5,
      carbs: 5,
      fat: 8,
      icon: '🥑',
      benefit: 'Heart-healthy monounsaturated fats and crisp crunchy hydration instead of processed cheese.'
    },
    {
      name: 'Roasted Garlic & White Bean Spread',
      calories: 85,
      unit: '3 tbsp spread',
      protein: 4,
      carbs: 13,
      fat: 1,
      icon: '🧄',
      benefit: 'Savory rich taste with prebiotic dietary fiber and zero butterfat.'
    }
  ],
  'Packaged Snack': [
    {
      name: 'Roasted Makhana (Foxnuts)',
      calories: 95,
      unit: '30g bowl',
      protein: 3,
      carbs: 19,
      fat: 0.5,
      icon: '🌰',
      benefit: 'Low calorie density, rich in magnesium, crunchy satisfying texture for mid-day cravings.'
    },
    {
      name: 'Sprouted Moong Chaat with Lemon',
      calories: 105,
      unit: '1 bowl (120g)',
      protein: 8,
      carbs: 17,
      fat: 0.5,
      icon: '🥗',
      benefit: 'High protein & fiber, keeps you full for hours, zero saturated fat or palm oil.'
    },
    {
      name: 'Roasted Spiced Chana (Bengal Gram)',
      calories: 120,
      unit: '35g handful',
      protein: 7,
      carbs: 19,
      fat: 2,
      icon: '🧆',
      benefit: 'Complex slow-digesting carbs with 7g plant protein to sustain energy without crashes.'
    },
    {
      name: 'Air-Popped Spiced Popcorn',
      calories: 85,
      unit: '2 cups (25g)',
      protein: 3,
      carbs: 16,
      fat: 1,
      icon: '🍿',
      benefit: 'High volume, high fiber snack that curbs hunger during calorie deficits.'
    }
  ]
};

// Default fallback list for backwards compatibility
const HEALTHY_DEFICIT_ALTERNATIVES = CATEGORY_DEFICIT_ALTERNATIVES['Packaged Snack'];

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

  // Select category-specific deficit alternatives
  const category = nutrition.category || 'Packaged Snack';
  const categoryAlternatives = CATEGORY_DEFICIT_ALTERNATIVES[category] || CATEGORY_DEFICIT_ALTERNATIVES['Packaged Snack'];

  return {
    isDeficitFriendly,
    deficitBadge,
    deficitVerdict,
    surplusVerdict,
    category,
    macroRatio: {
      proteinPct: Math.round((protein * 4 / Math.max(calories, 1)) * 100),
      carbsPct: Math.round((carbs * 4 / Math.max(calories, 1)) * 100),
      fatPct: Math.round((fat * 9 / Math.max(calories, 1)) * 100)
    },
    suggestedDeficitAlternatives: categoryAlternatives
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
  CATEGORY_DEFICIT_ALTERNATIVES,
  HEALTHY_DEFICIT_ALTERNATIVES
};
