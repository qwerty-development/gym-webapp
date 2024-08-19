import React from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const SessionsChart = ({ privateCount, groupCount }: any) => {
	const data = {
		labels: ['Private Sessions', 'Group Sessions'],
		datasets: [
			{
				data: [privateCount, groupCount],
				backgroundColor: ['#3B82F6', '#8B5CF6'],
				hoverBackgroundColor: ['#2563EB', '#7C3AED']
			}
		]
	}

	const options = {
		responsive: true,
		maintainAspectRatio: false
	}

	return (
		<div className='h-64'>
			<Pie data={data} options={options} />
		</div>
	)
}

export default SessionsChart
