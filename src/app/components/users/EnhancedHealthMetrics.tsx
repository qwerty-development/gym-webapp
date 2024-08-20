// app/users/health-profile/components/EnhancedHealthMetrics.tsx
import React from 'react'
import { Line } from 'react-chartjs-2'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
} from 'chart.js'

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
)

interface EnhancedHealthMetricsProps {
	userData: any
}

const EnhancedHealthMetrics: React.FC<EnhancedHealthMetricsProps> = ({
	userData
}) => {
	const calculateBMI = (weight: number, height: number) => {
		const heightInMeters = height / 100
		return (weight / (heightInMeters * heightInMeters)).toFixed(2)
	}

	const calculateWHR = (waist: number, height: number) => {
		return (waist / height).toFixed(2)
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
			? calculateBMI(latestWeight, userData.height)
			: 'N/A'

	const whr =
		latestWaist && userData.height
			? calculateWHR(latestWaist, userData.height)
			: 'N/A'

	const bmiData = {
		labels: userData.weight.map((w: any) =>
			new Date(w.date).toLocaleDateString()
		),
		datasets: [
			{
				label: 'BMI',
				data: userData.weight.map((w: any) =>
					calculateBMI(w.value, userData.height)
				),
				borderColor: 'rgb(75, 192, 192)',
				tension: 0.1
			}
		]
	}

	const weightAndWaistData = {
		labels: userData.weight.map((w: any) =>
			new Date(w.date).toLocaleDateString()
		),
		datasets: [
			{
				label: 'Weight (kg)',
				data: userData.weight.map((w: any) => w.value),
				borderColor: 'rgb(75, 192, 192)',
				tension: 0.1,
				yAxisID: 'y'
			},
			{
				label: 'Waist Circumference (cm)',
				data: userData.waist_circumference.map((w: any) => w.value),
				borderColor: 'rgb(255, 99, 132)',
				tension: 0.1,
				yAxisID: 'y1'
			}
		]
	}

	const chartOptions = {
		responsive: true,
		interaction: {
			mode: 'index' as const,
			intersect: false
		},
		scales: {
			y: {
				type: 'linear' as const,
				display: true,
				position: 'left' as const
			},
			y1: {
				type: 'linear' as const,
				display: true,
				position: 'right' as const,
				grid: {
					drawOnChartArea: false
				}
			}
		}
	}

	return (
		<div className='bg-gray-800 rounded-lg shadow-lg p-6 text-white'>
			<h3 className='text-2xl font-bold mb-6 text-green-400'>Health Metrics</h3>
			<div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8'>
				<div className='bg-gray-700 rounded-lg p-4'>
					<h4 className='text-lg font-semibold mb-2'>BMI</h4>
					<p className='text-3xl font-bold text-green-400'>{bmi}</p>
				</div>
				<div className='bg-gray-700 rounded-lg p-4'>
					<h4 className='text-lg font-semibold mb-2'>Waist-to-Height Ratio</h4>
					<p className='text-3xl font-bold text-green-400'>{whr}</p>
				</div>
				<div className='bg-gray-700 rounded-lg p-4'>
					<h4 className='text-lg font-semibold mb-2'>Activity Level</h4>
					<p className='text-xl font-semibold text-green-400'>
						{userData.activity_level
							? userData.activity_level
									.replace(/_/g, ' ')
									.replace(/\b\w/g, (l: string) => l.toUpperCase())
							: 'Not specified'}
					</p>
				</div>
				<div className='bg-gray-700 rounded-lg p-4'>
					<h4 className='text-lg font-semibold mb-2'>Gender</h4>
					<p className='text-xl font-semibold text-green-400'>
						{userData.gender || 'Not specified'}
					</p>
				</div>
			</div>
			<div className='mb-8'>
				<h4 className='text-xl font-semibold mb-4'>BMI Trend</h4>
				<div className='bg-gray-700 rounded-lg p-4'>
					<Line data={bmiData} options={{ responsive: true }} />
				</div>
			</div>
			<div>
				<h4 className='text-xl font-semibold mb-4'>
					Weight and Waist Circumference Trend
				</h4>
				<div className='bg-gray-700 rounded-lg p-4'>
					<Line data={weightAndWaistData} options={chartOptions} />
				</div>
			</div>
		</div>
	)
}

export default EnhancedHealthMetrics
