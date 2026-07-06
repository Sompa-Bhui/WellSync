import { NextRequest, NextResponse } from 'next/server';

const MOCK_FOODS = [
  { foodName: 'Oats', quantity: 60, unit: 'g', calories: 230, protein: 8, carbs: 40, fats: 4, fiber: 6, sugar: 1, sodium: 5 },
  { foodName: 'Cow Milk', quantity: 200, unit: 'ml', calories: 120, protein: 7, carbs: 10, fats: 6, fiber: 0, sugar: 9, sodium: 90 },
  { foodName: 'Banana', quantity: 1, unit: 'medium', calories: 105, protein: 1.3, carbs: 27, fats: 0.3, fiber: 3, sugar: 14, sodium: 1 },
  { foodName: 'Almonds', quantity: 8, unit: 'pieces', calories: 56, protein: 2, carbs: 2, fats: 5, fiber: 1.2, sugar: 0.4, sodium: 0 },
  { foodName: 'Wheat Roti', quantity: 1, unit: 'piece', calories: 85, protein: 3, carbs: 18, fats: 0.5, fiber: 2.5, sugar: 0.2, sodium: 120 },
  { foodName: 'Yellow Dal Tadka', quantity: 150, unit: 'g', calories: 160, protein: 9, carbs: 24, fats: 3.5, fiber: 5, sugar: 1.2, sodium: 340 },
  { foodName: 'Paneer Sabzi', quantity: 150, unit: 'g', calories: 280, protein: 14, carbs: 8, fats: 22, fiber: 2, sugar: 2, sodium: 410 },
  { foodName: 'White Rice', quantity: 150, unit: 'g', calories: 195, protein: 4, carbs: 43, fats: 0.4, fiber: 0.6, sugar: 0.1, sodium: 2 },
  { foodName: 'Curd (Yogurt)', quantity: 100, unit: 'g', calories: 60, protein: 3.5, carbs: 4.7, fats: 3.2, fiber: 0, sugar: 4, fontColor: 40, sodium: 45 },
  { foodName: 'Peanut Butter', quantity: 1, unit: 'tbsp', calories: 95, protein: 3.6, carbs: 3, fats: 8, fiber: 1, sugar: 1, sodium: 70 },
  { foodName: 'Apple', quantity: 1, unit: 'medium', calories: 95, protein: 0.5, carbs: 25, fats: 0.3, fiber: 4.4, sugar: 19, sodium: 2 },
  { foodName: 'Idli', quantity: 2, unit: 'pieces', calories: 160, protein: 4, carbs: 34, fats: 0.5, fiber: 2, sugar: 0.5, sodium: 220 },
  { foodName: 'Masala Dosa', quantity: 1, unit: 'piece', calories: 350, protein: 7, carbs: 54, fats: 12, fiber: 3, sugar: 1.5, sodium: 580 },
  { foodName: 'Chicken breast grilled', quantity: 150, unit: 'g', calories: 245, protein: 46, carbs: 0, fats: 5.4, fiber: 0, sugar: 0, sodium: 110 }
];

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    
    if (!query) {
      return NextResponse.json(MOCK_FOODS.slice(0, 5));
    }

    const filtered = MOCK_FOODS.filter((f) =>
      f.foodName.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Search GET error:', error);
    return NextResponse.json({ error: 'Failed to search foods' }, { status: 500 });
  }
}
