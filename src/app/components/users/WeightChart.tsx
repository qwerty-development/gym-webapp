// app/users/health-profile/components/WeightChart.tsx
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

interface WeightChartProps {
	weightData: { date: string; value: number }[]
}

const WeightChart: React.FC<WeightChartProps> = ({ weightData }) => {
	const sortedData = [...weightData].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
	)

	const data = {
		labels: sortedData.map(entry => new Date(entry.date).toLocaleDateString()),
		datasets: [
			{
				label: 'Weight',
				data: sortedData.map(entry => entry.value),
				borderColor: 'rgb(75, 192, 192)',
				tension: 0.1
			}
		]
	}

	const options = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top' as const
			},
			title: {
				display: true,
				text: 'Weight Over Time'
			}
		},
		scales: {
			x: {
				title: {
					display: true,
					text: 'Date'
				}
			},
			y: {
				title: {
					display: true,
					text: 'Weight (kg)'
				},
				min: Math.min(...sortedData.map(entry => entry.value)) - 5,
				max: Math.max(...sortedData.map(entry => entry.value)) + 5
			}
		}
	}

	return (
		<div className='bg-white p-4 rounded-lg shadow'>
			<Line data={data} options={options} />
		</div>
	)
}

export default WeightChart
