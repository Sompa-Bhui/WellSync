'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import { Card, Button, Input, Select } from '@/src/components/ui/primitives';
import { Apple, Search, Trash2, AlertTriangle, Layers } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

export default function NutritionPage() {
  const { activeProfile } = useAuth();
  
  // State
  type Meal = { id: string; mealType: string; foodName: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fats: number; fiber: number; sugar: number; sodium: number };
  type Food = { foodName: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fats: number; fiber: number; sugar: number; sodium: number };
  type Recipe = { name: string; diet: string; instructions: string; matchedIngredients: string[]; missingIngredients: string[]; calories: number; protein: number; carbs: number; fats: number; fiber: number; sugar: number; sodium: number };
  const [meals, setMeals] = useState<Meal[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);

  // Form State
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');
  const [mealType, setMealType] = useState('LUNCH');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Recipe Engine State
  const [recipeIngredients, setRecipeIngredients] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);

  const fetchMeals = useCallback(async () => {
    try {
      const res = await fetch(`/api/meals?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setMeals(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [date]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMeals();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMeals, activeProfile]);

  // Handle food search autocomplete
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/meals/search?q=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Check allergy dynamically in front-end
  const allergyWarning = React.useMemo(() => {
    if (!foodName || !activeProfile?.allergies) return '';
    const profileAllergies = activeProfile.allergies.split(',').map((s: string) => s.trim().toLowerCase());
    const matched = profileAllergies.find((allergy: string) => allergy && foodName.toLowerCase().includes(allergy));
    return matched ? `Warning: "${foodName}" matches configured allergy: "${matched}"` : '';
  }, [foodName, activeProfile]);

  const handleSelectFood = (food: Food) => {
    setFoodName(food.foodName);
    setQuantity(food.quantity.toString());
    setUnit(food.unit);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFats(food.fats.toString());
    setFiber(food.fiber.toString());
    setSugar(food.sugar.toString());
    setSodium(food.sodium.toString());
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName,
          quantity: parseFloat(quantity),
          unit,
          mealType,
          calories: parseFloat(calories || '0'),
          protein: parseFloat(protein || '0'),
          carbs: parseFloat(carbs || '0'),
          fats: parseFloat(fats || '0'),
          fiber: parseFloat(fiber || '0'),
          sugar: parseFloat(sugar || '0'),
          sodium: parseFloat(sodium || '0'),
          timestamp: new Date(`${date}T12:00:00Z`).toISOString(),
        }),
      });

      if (res.ok) {
        // Reset form
        setFoodName('');
        setQuantity('1');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFats('');
        setFiber('');
        setSugar('');
        setSodium('');
        fetchMeals();
      } else {
        alert('Failed to log food entry.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this food entry?')) return;
    try {
      const res = await fetch(`/api/meals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMeals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchRecipes = async () => {
    if (!recipeIngredients.trim()) return;
    setRecipesLoading(true);
    try {
      const res = await fetch(`/api/meals/recipes?ingredients=${encodeURIComponent(recipeIngredients)}`);
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecipesLoading(false);
    }
  };

  const handleLogRecipeDirect = async (recipe: Recipe) => {
    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName: recipe.name,
          quantity: 1,
          unit: 'serving',
          mealType: 'DINNER',
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fats: recipe.fats,
          fiber: recipe.fiber,
          sugar: recipe.sugar,
          sodium: recipe.sodium,
          timestamp: new Date(`${date}T19:30:00Z`).toISOString(),
        }),
      });

      if (res.ok) {
        fetchMeals();
        alert(`Successfully logged recipe "${recipe.name}" to dinner!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations
  const totals = meals.reduce(
    (acc, m) => {
      acc.calories += m.calories;
      acc.protein += m.protein;
      acc.carbs += m.carbs;
      acc.fats += m.fats;
      acc.fiber += m.fiber;
      acc.sugar += m.sugar;
      acc.sodium += m.sodium;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 }
  );

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pb-4 border-b border-border/40">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Nutrition Workspace</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient mt-1">Daily Food Log</h1>
          </div>
          <div className="flex items-center space-x-3 bg-card border border-border/80 rounded-lg p-1">
            <input
              type="date"
              className="bg-transparent border-none text-sm text-foreground focus:outline-none px-2 py-1"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Nutritional Snapshots */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Calories</span>
              <p className="text-2xl font-black text-foreground mt-1">{totals.calories.toFixed(0)} kcal</p>
            </div>
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden mt-4">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min((totals.calories / 1850) * 100, 100)}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1.5 block">Target: 1,850 kcal</span>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Protein Target</span>
              <p className="text-2xl font-black text-foreground mt-1">{totals.protein.toFixed(1)} g</p>
            </div>
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden mt-4">
              <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${Math.min((totals.protein / 90) * 100, 100)}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1.5 block">Target: 90 g</span>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Carbs & Fats</span>
              <div className="flex space-x-6 mt-1">
                <div>
                  <p className="text-xl font-bold text-foreground">{totals.carbs.toFixed(1)} g</p>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Carbs</span>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{totals.fats.toFixed(1)} g</p>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Fats</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Micros (Fiber & Sodium)</span>
              <div className="flex space-x-6 mt-1">
                <div>
                  <p className="text-xl font-bold text-foreground">{totals.fiber.toFixed(1)} g</p>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Fiber</span>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{totals.sodium.toFixed(0)} mg</p>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Sodium</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Core Layout split: Form vs Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: Log Food Form & Auto-complete */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <h3 className="text-base font-bold text-foreground pb-3 border-b border-border/40 mb-4 flex items-center">
                <Apple className="w-5 h-5 text-primary mr-2" />
                Log Food Intake
              </h3>

              {/* Autocomplete Search input */}
              <div className="relative mb-4">
                <div className="relative">
                  <Input
                    label="Search Foods database"
                    placeholder="Type to search (e.g. Oats, Roti)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute right-3 top-8 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-2xl z-50 py-1.5 max-h-48 overflow-y-auto">
                    {searchResults.map((food, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectFood(food)}
                        className="flex w-full items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-border/40 cursor-pointer"
                      >
                        <span className="font-semibold text-foreground">{food.foodName}</span>
                        <span className="text-muted-foreground">{food.calories} kcal ({food.quantity}{food.unit})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Allergy Warning Banner */}
              {allergyWarning && (
                <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-3.5 mb-4 flex items-start space-x-3.5 text-xs text-red-400 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{allergyWarning}</span>
                </div>
              )}

              {/* Logging Form */}
              <form onSubmit={handleLogMeal} className="space-y-4">
                <Input
                  label="Food Name"
                  placeholder="e.g. Mixed Fruit Salad"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                  <Input
                    label="Unit"
                    placeholder="serving, g, piece"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    required
                  />
                </div>

                <Select
                  label="Meal Type"
                  options={[
                    { value: 'BREAKFAST', label: 'Breakfast' },
                    { value: 'LUNCH', label: 'Lunch' },
                    { value: 'DINNER', label: 'Dinner' },
                    { value: 'SNACK', label: 'Snack' },
                    { value: 'CUSTOM', label: 'Custom' },
                  ]}
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                />

                <div className="border-t border-border/40 pt-4 mt-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Nutritional details (Optional)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <Input label="Calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="kcal" />
                    <Input label="Protein" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="g" />
                    <Input label="Carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="g" />
                    <Input label="Fats" type="number" value={fats} onChange={(e) => setFats(e.target.value)} placeholder="g" />
                    <Input label="Fiber" type="number" value={fiber} onChange={(e) => setFiber(e.target.value)} placeholder="g" />
                    <Input label="Sodium" type="number" value={sodium} onChange={(e) => setSodium(e.target.value)} placeholder="mg" />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-4" isLoading={formLoading}>
                  Log Food Entry
                </Button>
              </form>
            </Card>
          </div>

          {/* Center/Right Panel: Food logs lists & Recipe Engine */}
          <div className="lg:col-span-2 space-y-6">
            {/* Food Logs list */}
            <Card>
              <h3 className="text-base font-bold text-foreground pb-3 border-b border-border/40 mb-4">
                Logged Intake for {new Date(date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>

              <div className="space-y-3.5">
                {meals.length > 0 ? (
                  meals.map((meal) => (
                    <div key={meal.id} className="flex items-center justify-between p-3.5 rounded-lg bg-background border border-border/60">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-primary uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/10 border border-primary/25">
                          {meal.mealType}
                        </span>
                        <p className="text-sm font-bold text-foreground mt-2 truncate">{meal.foodName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          Amount: {meal.quantity} {meal.unit} · {meal.calories} kcal · P: {meal.protein}g / C: {meal.carbs}g / F: {meal.fats}g
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground italic">
                    No foods logged for this profile on this date
                  </div>
                )}
              </div>
            </Card>

            {/* Safe Recipe Matching Engine */}
            <Card>
              <div className="flex items-center space-x-2 pb-3 border-b border-border/40 mb-4">
                <Layers className="w-5 h-5 text-secondary" />
                <h3 className="text-base font-bold text-foreground">Safe Recipe Matchmaker</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Enter your available fridge ingredients separated by commas (e.g. <span className="font-mono text-foreground font-semibold">paneer, tomato, spinach</span>) to find matching recipes compatible with your allergies and dietary goals.
              </p>

              <div className="flex space-x-3 mb-6">
                <Input
                  placeholder="e.g. paneer, curd, tomato"
                  value={recipeIngredients}
                  onChange={(e) => setRecipeIngredients(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchRecipes()}
                />
                <Button variant="secondary" onClick={handleSearchRecipes} isLoading={recipesLoading} className="shrink-0">
                  Find Recipes
                </Button>
              </div>

              {recipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recipes.map((rec, idx) => (
                    <div key={idx} className="border border-border/60 bg-background rounded-lg p-4 flex flex-col justify-between h-56">
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-secondary uppercase tracking-widest px-1.5 py-0.5 bg-secondary/10 rounded">
                          {rec.diet}
                        </span>
                        <h4 className="text-sm font-bold text-foreground mt-1.5">{rec.name}</h4>
                        <p className="text-[10px] text-muted-foreground leading-relaxed italic line-clamp-2">{rec.instructions}</p>
                        
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {rec.matchedIngredients.map((mi: string) => (
                            <span key={mi} className="text-[9px] font-semibold bg-success/10 text-success border border-success/25 rounded px-1.5 py-0.5">
                              {mi}
                            </span>
                          ))}
                          {rec.missingIngredients.map((mi: string) => (
                            <span key={mi} className="text-[9px] bg-border text-muted-foreground rounded px-1.5 py-0.5">
                              + {mi}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-border/40 pt-3 mt-3 flex items-center justify-between">
                        <div className="text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground">{rec.calories}</span> kcal · P: <span className="font-semibold text-foreground">{rec.protein}g</span>
                        </div>
                        <Button size="sm" onClick={() => handleLogRecipeDirect(rec)} className="px-2.5 py-1 text-[10px]">
                          Quick Log (Dinner)
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                recipeIngredients && !recipesLoading && (
                  <div className="text-center py-6 text-xs text-muted-foreground italic">
                    No recipes found matching these ingredients. Try &ldquo;paneer, spinach, tomato&rdquo; or &ldquo;curd, apple, banana&rdquo;.
                  </div>
                )
              )}
            </Card>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
