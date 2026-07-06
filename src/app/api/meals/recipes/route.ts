import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';

const RECIPES_DB = [
  {
    name: 'Spinach Paneer Bowl',
    ingredients: ['paneer', 'spinach', 'tomato'],
    diet: 'VEGETARIAN',
    calories: 320,
    protein: 18,
    carbs: 12,
    fats: 22,
    fiber: 4,
    sugar: 3,
    sodium: 290,
    instructions: 'Sauté paneer cubes with diced tomatoes, then toss with fresh baby spinach until wilted. Season with salt and cumin.'
  },
  {
    name: 'Tomato Curd Rice',
    ingredients: ['rice', 'curd', 'tomato'],
    diet: 'VEGETARIAN',
    calories: 380,
    protein: 9,
    carbs: 65,
    fats: 8,
    fiber: 2,
    sugar: 4,
    sodium: 180,
    instructions: 'Mix boiled white rice with chilled curd. Stir in fresh diced tomatoes and garnish with toasted mustard seeds.'
  },
  {
    name: 'Peanut Oats Porridge',
    ingredients: ['oats', 'milk', 'peanuts'],
    diet: 'VEGETARIAN',
    calories: 410,
    protein: 16,
    carbs: 48,
    fats: 15,
    fiber: 7,
    sugar: 10,
    sodium: 110,
    instructions: 'Cook oats in cow milk, then stir in natural peanut butter. Garnish with a sprinkle of crushed peanuts.'
  },
  {
    name: 'Fruit Yogurt Salad',
    ingredients: ['curd', 'apple', 'banana'],
    diet: 'VEGETARIAN',
    calories: 220,
    protein: 6,
    carbs: 42,
    fats: 3.5,
    fiber: 5,
    sugar: 28,
    sodium: 50,
    instructions: 'Chop fresh apples and bananas. Whisk curd until smooth and gently fold in the chopped fruits.'
  }
];

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeProfile = await getActiveProfile(user.id);
    const url = new URL(req.url);
    const ingredientsQuery = url.searchParams.get('ingredients') || '';
    
    if (!ingredientsQuery) {
      return NextResponse.json([]);
    }

    const userIngredients = ingredientsQuery
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    // Active Profile Exclusions
    const activeAllergies = activeProfile.allergies
      ? activeProfile.allergies.split(',').map((s) => s.trim().toLowerCase())
      : [];
    const activeDiet = activeProfile.dietaryPreference || 'OMNIVORE';

    const results = [];

    for (const recipe of RECIPES_DB) {
      // 1. Dietary Preference Check
      if (activeDiet === 'VEGAN' && recipe.diet !== 'VEGAN') continue;
      if (activeDiet === 'VEGETARIAN' && recipe.diet !== 'VEGETARIAN' && recipe.diet !== 'VEGAN') continue;

      // 2. Allergy Check (Critical Safety)
      let containsAllergen = false;
      let matchedAllergen = '';
      
      for (const allergen of activeAllergies) {
        if (!allergen) continue;
        
        // Check if allergen name is contained in the recipe ingredients list or recipe name
        const matchInIngredients = recipe.ingredients.some((ing) => ing.includes(allergen));
        const matchInName = recipe.name.toLowerCase().includes(allergen);
        
        if (matchInIngredients || matchInName) {
          containsAllergen = true;
          matchedAllergen = allergen;
          break;
        }
      }

      // If it contains a critical allergen, we skip offering it or flag it as EXCLUDED
      if (containsAllergen) {
        // Excluded from results for clinical safety
        continue;
      }

      // 3. Match count
      const matchedIngredients = recipe.ingredients.filter((ing) =>
        userIngredients.some((userIng) => ing.includes(userIng) || userIng.includes(ing))
      );

      if (matchedIngredients.length > 0) {
        results.push({
          ...recipe,
          matchCount: matchedIngredients.length,
          matchedIngredients,
          missingIngredients: recipe.ingredients.filter((ing) => !matchedIngredients.includes(ing))
        });
      }
    }

    // Sort by most matched ingredients
    results.sort((a, b) => b.matchCount - a.matchCount);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Recipe GET error:', error);
    return NextResponse.json({ error: 'Failed to generate recipes' }, { status: 500 });
  }
}
