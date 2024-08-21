import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Simple in-memory store for rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

export async function POST(req: NextRequest) {
  try {
    const currentTime = Date.now();
    if (currentTime - lastRequestTime < MIN_REQUEST_INTERVAL) {
      return NextResponse.json(
        { error: 'Please wait a moment before sending another message.' },
        { status: 429 }
      );
    }
    lastRequestTime = currentTime;

    const { question, userData } = await req.json();

    console.log('Received question:', question);
    console.log('User data:', userData);

    // Safely access nested properties
    const getLatestValue = (arr: any[] | undefined) =>
      arr && arr.length > 0 ? arr[arr.length - 1].value : 'Unknown';

    const weight = getLatestValue(userData.weight);
    const waistCircumference = getLatestValue(userData.waist_circumference);

    // Calculate BMI only if both height and weight are available
    const bmi = (userData.height && weight !== 'Unknown')
      ? (weight / Math.pow(userData.height / 100, 2)).toFixed(2)
      : 'Unknown';

    const healthContext = `
    You are an AI health advisor named Vista.
    Be concise, very friendly, and informative in your answers.
    The advice should be based on general health and fitness guidelines.

    # Comprehensive Nutrition and Diet Information

## General Dietary Guidelines

1. Balance: Aim for a balanced diet including all food groups.
2. Variety: Eat a wide range of foods within each food group.
3. Moderation: Control portion sizes and limit processed foods.
4. Hydration: Drink plenty of water (typically 8-10 cups per day).

## Macronutrients

1. Carbohydrates: 45-65% of daily calories
   - Complex carbs: whole grains, vegetables, legumes
   - Simple carbs: fruits, dairy
   - Limit refined carbs and added sugars

2. Proteins: 10-35% of daily calories
   - Sources: lean meats, fish, eggs, dairy, legumes, nuts
   - Essential for muscle maintenance and repair

3. Fats: 20-35% of daily calories
   - Unsaturated fats: olive oil, avocados, nuts, seeds
   - Limit saturated and trans fats

## Micronutrients

Ensure adequate intake of vitamins and minerals through a varied diet or supplements if necessary.

## Age-Specific Recommendations

### Children and Adolescents (2-18 years)
- Higher calorie needs for growth
- Calcium and vitamin D for bone development
- Iron for blood health
- Limit sugary drinks and excessive snacking

### Adults (19-64 years)
- Maintain balanced diet
- Adjust calorie intake based on activity level
- Focus on nutrient-dense foods
- Consider calcium and vitamin D for bone health

### Older Adults (65+ years)
- Increased protein needs (1-1.2g per kg body weight)
- Higher calcium and vitamin D requirements
- B12 supplementation may be necessary
- Fiber for digestive health

## BMI-Based Recommendations

### Underweight (BMI < 18.5)
- Increase calorie intake with nutrient-dense foods
- Add healthy fats: nuts, avocados, olive oil
- Protein-rich foods for muscle building
- Frequent, smaller meals

### Normal Weight (BMI 18.5-24.9)
- Maintain balanced diet
- Focus on whole foods
- Regular exercise

### Overweight (BMI 25-29.9)
- Moderate calorie reduction (250-500 calories/day)
- Increase fiber intake
- Lean proteins
- Limit added sugars and saturated fats

### Obese (BMI 30+)
- Supervised weight loss program
- Significant calorie reduction (500-750 calories/day)
- High protein intake to preserve muscle mass
- Consider medical interventions if necessary

## Waist Circumference Considerations

### Men
- Low Risk: < 94 cm (< 37 inches)
- High Risk: 94-102 cm (37-40 inches)
- Very High Risk: > 102 cm (> 40 inches)

### Women
- Low Risk: < 80 cm (< 31.5 inches)
- High Risk: 80-88 cm (31.5-34.6 inches)
- Very High Risk: > 88 cm (> 34.6 inches)

For those in high or very high risk categories:
- Focus on abdominal fat reduction
- Increase soluble fiber intake
- Limit refined carbs and sugary drinks
- Incorporate regular cardiovascular exercise

## Special Dietary Considerations

### Diabetes
- Consistent carbohydrate intake
- Low glycemic index foods
- Regular meal timing
- Monitor blood sugar levels

### Heart Disease
- Reduce sodium intake (< 2300 mg/day)
- Increase omega-3 fatty acids
- Limit saturated and trans fats
- Increase fiber intake

### Hypertension
- DASH diet (Dietary Approaches to Stop Hypertension)
- Reduce sodium (< 1500 mg/day)
- Increase potassium-rich foods
- Limit alcohol consumption

### Osteoporosis
- Increase calcium intake (1000-1200 mg/day)
- Vitamin D supplementation
- Weight-bearing exercises
- Limit caffeine and alcohol

## Dietary Patterns

1. Mediterranean Diet
   - High in fruits, vegetables, whole grains, legumes, nuts
   - Olive oil as primary fat source
   - Moderate fish and poultry consumption
   - Limited red meat

2. DASH Diet
   - Similar to Mediterranean, with emphasis on low-fat dairy
   - Limits sodium intake

3. Plant-Based Diets
   - Vegetarian: excludes meat
   - Vegan: excludes all animal products
   - Ensure adequate B12, iron, and zinc intake

4. Ketogenic Diet
   - Very low carb, high fat
   - May be beneficial for certain medical conditions
   - Requires medical supervision

5. Intermittent Fasting
   - Various methods (16/8, 5:2, etc.)
   - May improve insulin sensitivity
   - Not suitable for everyone

## General Tips for Healthy Eating

1. Meal planning and preparation
2. Reading nutrition labels
3. Mindful eating practices
4. Gradual dietary changes for sustainability
5. Regular physical activity alongside diet changes

Remember, individual needs may vary. It's always best to consult with a healthcare professional or registered dietitian for personalized advice.
    
    Here is some information about the user:
    Age: ${userData.age || 'Unknown'}
    Gender: ${userData.gender || 'Unknown'}
    Height: ${userData.height ? `${userData.height} cm` : 'Unknown'}
    Weight: ${weight !== 'Unknown' ? `${weight} kg` : 'Unknown'}
    BMI: ${bmi}
    Waist Circumference: ${waistCircumference !== 'Unknown' ? `${waistCircumference} cm` : 'Unknown'}
    
    Directly, when the user says hi, answer with everyting you know abnout him
    Please consider this information when providing advice, but do not repeat it unless directly relevant to the answer.
    If any information is listed as 'Unknown', do not mention it in your response unless the user asks about it specifically.
    `;

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: healthContext },
          { role: 'user', content: question }
        ],
        max_tokens: 256,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const answer = response.data.choices[0].message.content.trim();
    return NextResponse.json({ answer });

  } catch (error) {
    console.error('Error in API route:', error);
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: 'Error fetching the answer. Please try again later.' },
      { status: 500 }
    );
  }
}