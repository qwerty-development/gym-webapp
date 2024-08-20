// app/users/health-profile/components/HealthInsights.tsx
import React from 'react'
import { motion } from 'framer-motion'

interface HealthInsightsProps {
	userData: any
}

const HealthInsights: React.FC<HealthInsightsProps> = ({ userData }) => {
	const getBMICategory = (bmi: number) => {
		if (bmi < 18.5) return 'Underweight'
		if (bmi < 25) return 'Normal weight'
		if (bmi < 30) return 'Overweight'
		return 'Obese'
	}

	const getWHRRisk = (whr: number, gender: string) => {
		if (gender === 'male') {
			if (whr <= 0.5) return 'Low'
			if (whr <= 0.57) return 'Moderate'
			return 'High'
		} else if (gender === 'female') {
			if (whr <= 0.49) return 'Low'
			if (whr <= 0.54) return 'Moderate'
			return 'High'
		}
		return 'Unknown'
	}

	const getRecommendations = (
		bmiCategory: string,
		whrRisk: string,
		activityLevel: string
	) => {
		const recommendations = []

		if (bmiCategory === 'Underweight') {
			recommendations.push(
				'Consider increasing your calorie intake with nutrient-dense foods.'
			)
			recommendations.push(
				'Consult with a nutritionist for a personalized meal plan.'
			)
		} else if (bmiCategory === 'Overweight' || bmiCategory === 'Obese') {
			recommendations.push(
				'Focus on creating a calorie deficit through diet and exercise.'
			)
			recommendations.push(
				'Incorporate more fruits, vegetables, and whole grains into your diet.'
			)
		}

		if (whrRisk === 'Moderate' || whrRisk === 'High') {
			recommendations.push(
				'Try to reduce your waist circumference through targeted exercises and diet.'
			)
			recommendations.push(
				'Consider incorporating more cardiovascular exercises into your routine.'
			)
		}

		if (activityLevel === 'sedentary' || activityLevel === 'lightly_active') {
			recommendations.push('Try to increase your daily physical activity.')
			recommendations.push(
				'Aim for at least 150 minutes of moderate-intensity exercise per week.'
			)
		}

		return recommendations
	}

	const latestWeight =
		userData.weight && userData.weight.length > 0
			? userData.weight[userData.weight.length - 1].value
			: null

	const latestWaist =
		userData.waist_circumference && userData.waist_circumference.length > 0
			? userData.waist_circumference[userData.waist_circumference.length - 1]
					.value
			: null

	const bmi =
		latestWeight && userData.height
			? (latestWeight / Math.pow(userData.height / 100, 2)).toFixed(2)
			: 'N/A'

	const whr =
		latestWaist && userData.height
			? (latestWaist / userData.height).toFixed(2)
			: 'N/A'

	const bmiCategory =
		bmi !== 'N/A' ? getBMICategory(parseFloat(bmi)) : 'Unknown'
	const whrRisk =
		whr !== 'N/A' && userData.gender
			? getWHRRisk(parseFloat(whr), userData.gender)
			: 'Unknown'
	const recommendations = getRecommendations(
		bmiCategory,
		whrRisk,
		userData.activity_level
	)

	return (
		<div className='bg-gray-800 rounded-lg shadow-lg p-6 text-white'>
			<h3 className='text-2xl font-bold mb-6 text-green-400'>
				Health Insights
			</h3>
			<div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8'>
				<motion.div
					className='bg-gray-700 rounded-lg p-4'
					whileHover={{ scale: 1.05 }}
					transition={{ type: 'spring', stiffness: 300 }}>
					<h4 className='text-lg font-semibold mb-2'>BMI Category</h4>
					<p className='text-2xl font-bold text-green-400'>{bmiCategory}</p>
				</motion.div>
				<motion.div
					className='bg-gray-700 rounded-lg p-4'
					whileHover={{ scale: 1.05 }}
					transition={{ type: 'spring', stiffness: 300 }}>
					<h4 className='text-lg font-semibold mb-2'>
						Waist-to-Height Ratio Risk
					</h4>
					<p className='text-2xl font-bold text-green-400'>{whrRisk}</p>
				</motion.div>
			</div>
			<div className='mb-8'>
				<h4 className='text-xl font-semibold mb-4'>Recommendations</h4>
				<ul className='space-y-4'>
					{recommendations.map((recommendation, index) => (
						<motion.li
							key={index}
							initial={{ opacity: 0, x: -50 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: index * 0.1 }}
							className='bg-gray-700 rounded-lg p-4 flex items-start'>
							<svg
								className='w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-1'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
								xmlns='http://www.w3.org/2000/svg'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
								/>
							</svg>
							<span>{recommendation}</span>
						</motion.li>
					))}
				</ul>
			</div>
		</div>
	)
}

export default HealthInsights
