'use client'
import React, { useState } from 'react'
import { Line, Bar, Pie } from 'react-chartjs-2'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend
} from 'chart.js'

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend
)

interface MagicalTransactionChartProps {
	chartData: any
	barData: any
	pieData: any
	loading: boolean
}

const MagicalTransactionChart: React.FC<MagicalTransactionChartProps> = ({
	chartData,
	barData,
	pieData,
	loading
}) => {
	const [activeTab, setActiveTab] = useState<'line' | 'bar' | 'pie'>('line')

	if (loading) {
		return (
			<div className='flex justify-center items-center h-64'>
				<div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500'></div>
			</div>
		)
	}

	return (
		<div className='bg-gray-800 rounded-xl p-6 shadow-lg mb-8'>
			<h2 className='text-2xl font-semibold mb-4'>
				Transaction Visualizations
			</h2>
			<div className='flex space-x-4 mb-4'>
				<button
					onClick={() => setActiveTab('line')}
					className={`px-4 py-2 rounded-md ${
						activeTab === 'line' ? 'bg-green-600' : 'bg-gray-700'
					} text-white`}>
					Daily Trend
				</button>
				<button
					onClick={() => setActiveTab('bar')}
					className={`px-4 py-2 rounded-md ${
						activeTab === 'bar' ? 'bg-green-600' : 'bg-gray-700'
					} text-white`}>
					Avg by Currency
				</button>
				<button
					onClick={() => setActiveTab('pie')}
					className={`px-4 py-2 rounded-md ${
						activeTab === 'pie' ? 'bg-green-600' : 'bg-gray-700'
					} text-white`}>
					Type Breakdown
				</button>
			</div>
			<div>
				{activeTab === 'line' && chartData ? (
					<Line
						data={chartData}
						options={{
							responsive: true,
							plugins: {
								legend: { position: 'top' },
								title: { display: true, text: 'Daily Transaction Trend' }
							},
							scales: {
								x: { title: { display: true, text: 'Date' } },
								y: { title: { display: true, text: 'Amount' } }
							}
						}}
					/>
				) : activeTab === 'bar' && barData ? (
					<Bar
						data={barData}
						options={{
							responsive: true,
							plugins: {
								legend: { position: 'top' },
								title: { display: true, text: 'Average Amount per Currency' }
							},
							scales: {
								x: { title: { display: true, text: 'Currency' } },
								y: { title: { display: true, text: 'Avg Amount' } }
							}
						}}
					/>
				) : activeTab === 'pie' && pieData ? (
					<Pie
						data={pieData}
						options={{
							responsive: true,
							plugins: {
								legend: { position: 'bottom' },
								title: { display: true, text: 'Transaction Type Breakdown' }
							}
						}}
					/>
				) : (
					<p>No chart data available.</p>
				)}
			</div>
		</div>
	)
}

export default MagicalTransactionChart
