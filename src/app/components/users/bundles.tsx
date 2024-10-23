'use client'

import { useEffect, useState } from 'react'
import {
	purchaseBundle,
	purchaseEssentialsBundle
} from '../../../../utils/userRequests'
import { useUser } from '@clerk/nextjs'
import { useWallet } from './WalletContext'
import { toast } from 'react-hot-toast'
import { supabaseClient } from '../../../../utils/supabaseClient'

const classestiers = [
	{
		name: 'BELIEVE',
		id: 'tier-freelancer',
		href: '#',
		priceMonthly: '25 Credits',
		description: '1 Token',
		features: [
			'5 products',
			'Up to 1,000 subscribers',
			'Basic analytics',
			'48-hour support response time'
		],
		mostPopular: false
	},
	{
		name: 'EXCEED',
		id: 'tier-enterprise',
		href: '#',
		priceMonthly: '150 Credits',
		description: '10  Tokens',
		features: [
			'Unlimited products',
			'Unlimited subscribers',
			'Advanced analytics',
			'1-hour, dedicated support response time',
			'Marketing automations'
		],
		mostPopular: true
	},
	{
		name: 'ACHIEVE',
		id: 'tier-startup',
		href: '#',
		priceMonthly: '100 Credits',
		description: '5 Tokens',
		features: [
			'25 products',
			'Up to 10,000 subscribers',
			'Advanced analytics',
			'24-hour support response time',
			'Marketing automations'
		],
		mostPopular: false
	}
]

const individualtiers = [
	{
		name: 'Workout of the day',
		id: 'tier-basic',
		href: '#',
		price: { monthly: '200', annually: '$12' },
		description: '10 Sessions',
		features: [
			'5 products',
			'Up to 1,000 subscribers',
			'Basic analytics',
			'48-hour support response time'
		]
	},
	{
		name: 'Private training',
		id: 'tier-essential',
		href: '#',
		price: { monthly: '350', annually: '$24' },
		description: '10 PT Sessions',
		features: [
			'25 products',
			'Up to 10,000 subscribers',
			'Advanced analytics',
			'24-hour support response time',
			'Marketing automations'
		]
	},
	{
		name: 'Semi-Private',
		id: 'tier-growth',
		href: '#',
		price: { monthly: '300', annually: '$48' },
		description: '10 SPT Sessions',
		features: [
			'Unlimited products',
			'Unlimited subscribers',
			'Advanced analytics',
			'1-hour, dedicated support response time',
			'Marketing automations',
			'Custom reporting tools'
		]
	}
]

const essentialsTier = {
	name: 'ESSENTIALS',
	id: 'tier-essentials',
	href: '#',
	priceMonthly: '30 Credits',
	description: 'Insurance, Parking, Coffee, Water',
	features: [
		'Monthly access to essential services',
		'Insurance coverage',
		'Parking access',
		'Complimentary coffee and water'
	],
	mostPopular: false
}

const proteinShakeTier = {
	name: 'PROTEIN SHAKE PACK',
	id: 'tier-protein',
	href: '#',
	priceMonthly: '40 Credits',
	description: '12 Premium Shakes',
	features: [
		'High-quality protein shakes',
		'Choice of flavors',
		'Pre or post workout',
		'Rich in nutrients and vitamins'
	],
	mostPopular: false
}

const allTiers = [...classestiers, essentialsTier]
function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ')
}

export default function Bundles() {
	const [essentialsTillDate, setEssentialsTillDate] = useState<any>(null)
	const [purchaseStatus, setPurchaseStatus] = useState<any>(null)
	const { refreshWalletBalance } = useWallet()
	const { isLoaded, isSignedIn, user } = useUser()

	useEffect(() => {
		const fetchEssentialsTillDate = async () => {
			if (user?.id) {
				const supabase = await supabaseClient()
				const { data, error } = await supabase
					.from('users')
					.select('essential_till')
					.eq('user_id', user.id)
					.single()

				if (!error && data) {
					setEssentialsTillDate(data.essential_till)
				}
			}
		}

		fetchEssentialsTillDate()
	}, [user])

	const handlePurchase = async (bundleType: any, bundleName: any) => {
		const userId = user?.id
		if (!userId) {
			toast.error('User not found. Please sign in.')
			return
		}

		try {
			let result
			if (bundleType === 'essentials') {
				result = await purchaseEssentialsBundle(userId)
				if (result.data) {
					setEssentialsTillDate(result.data.essential_till)
				}
			} else {
				result = await purchaseBundle({ userId, bundleType, bundleName })
			}

			if (result.error) {
				toast.error(`Error: ${result.error}`)
			} else {
				toast.success(result.message || 'Bundle purchase successful!')
				refreshWalletBalance()
			}
		} catch (error) {
			console.error('Purchase failed:', error)
			toast.error('Bundle purchase failed')
		}
	}

	return (
		<div className='mx-auto max-w-7xl px-6 lg:px-8'>
			{purchaseStatus && (
				<div className='mt-4 p-4 bg-green-100 text-green-700 rounded'>
					{purchaseStatus}
				</div>
			)}

			<h1 className='text-3xl text-green-500 font-bold'>
				Group Class Experience
			</h1>
			<div className='isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3'>
				{classestiers.map((tier, tierIdx) => (
					<div
						key={tier.id}
						className={classNames(
							tier.mostPopular
								? 'lg:z-10 lg:rounded-b-none bg-gray-700'
								: 'lg:mt-8',
							tierIdx === 0 ? 'lg:rounded-r-none' : '',
							tierIdx === classestiers.length - 1 ? 'lg:rounded-l-none' : '',
							'flex flex-col justify-between rounded-3xl bg-gray-200 p-8 ring-1 ring-gray-200 xl:p-10'
						)}>
						<div className='flex flex-col items-center  text-center'>
							<div className='flex flex-col items-center justify-center gap-y-4'>
								<h3
									id={tier.id}
									className={classNames(
										tier.mostPopular ? 'text-white' : 'text-gray-900',
										'text-4xl font-semibold leading-8'
									)}>
									{tier.name}
								</h3>
								{tier.mostPopular ? (
									<p className='rounded-full bg-green-500 px-2.5 py-1 text-xs font-semibold leading-5 text-white'>
										Most popular
									</p>
								) : null}
							</div>
							<p className='mt-6 flex items-baseline gap-x-1'>
								<span className='text-2xl  tracking-tight text-gray-900'>
									{tier.priceMonthly}
								</span>
								<span className='text-sm font-semibold leading-6 text-gray-600'></span>
							</p>
							<p className='mt-4 text-4xl font-semibold leading-6 text-black'>
								{tier.description}
							</p>
						</div>
						<div className='flex justify-center'>
							<button
								onClick={() => handlePurchase('classes', tier.name)}
								className={classNames(
									tier.mostPopular
										? 'bg-green-300 text-green-500 shadow-sm hover:bg-green-500'
										: 'text-white bg-green-500 ring-1 ring-inset ring-indigo-200 hover:ring-green-500',
									'mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500'
								)}>
								Buy plan
							</button>
						</div>
					</div>
				))}
			</div>

			<div className='mt-64'>
				<div className='mx-auto max-w-7xl px-6 lg:px-8'>
					<h1 className='text-3xl text-green-500 font-bold '>
						Personal Training Experience
					</h1>
					<div className='mt-20 flow-root'>
						<div className='isolate grid max-w-sm bg-gray-300 rounded-3xl grid-cols-1 divide-y divide-gray-100 sm:mx-auto lg:-mx-8 lg:mt-0 lg:max-w-none lg:grid-cols-3 lg:divide-x lg:divide-y-0 xl:-mx-4'>
							{individualtiers.map(tier => (
								<div
									key={tier.id}
									className='mx-6 mb-12 lg:px-8 lg:pt-0 xl:px-14 flex flex-col items-center text-center'>
									<h3
										id={tier.id}
										className='text-base mt-12 font-semibold leading-7 text-gray-900'>
										{tier.name}
									</h3>
									<p className='mt-2 text-black text-s'>{tier.description}</p>
									<p className='mt-6 flex items-baseline gap-x-1'>
										<span className='text-4xl font-bold tracking-tight text-gray-900'>
											{tier.price.monthly} credits
										</span>
										<span className='text-sm font-semibold leading-6 text-gray-600'></span>
									</p>
									<button
										onClick={() => handlePurchase('individual', tier.name)}
										className='mt-10 mb-3 block rounded-md bg-green-500 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-green-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500'>
										Buy plan
									</button>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className='mt-64 grid grid-cols-1 lg:grid-cols-2 gap-8'>
				<div>
					<h1 className='text-3xl text-green-500 font-bold mb-8'>
						Essentials Bundle
					</h1>
					{essentialsTillDate && (
						<p className='mt-2 text-sm text-gray-600'>
							Current Essentials access until:{' '}
							{new Date(essentialsTillDate).toLocaleDateString()}
						</p>
					)}
					<div className='flex flex-col justify-between rounded-3xl bg-gray-200 p-8 ring-1 ring-gray-200 xl:p-10 h-full'>
						<div className='flex flex-col items-center text-center'>
							<h3
								id={essentialsTier.id}
								className='text-4xl font-semibold leading-8 text-green-500'>
								{essentialsTier.name}
							</h3>
							<p className='mt-6 text-2xl tracking-tight text-gray-900'>
								{essentialsTier.priceMonthly}
							</p>
							<p className='mt-4 text-lg font-semibold leading-6 text-black'>
								{essentialsTier.description}
							</p>
							<ul className='mt-8 space-y-3'>
								{essentialsTier.features.map((feature, index) => (
									<li key={index} className='text-sm text-gray-700'>
										{feature}
									</li>
								))}
							</ul>
						</div>
						<div className='flex justify-center mt-8'>
							<button
								onClick={() =>
									handlePurchase('essentials', essentialsTier.name)
								}
								className='block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 bg-green-500 text-white hover:bg-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500'>
								Buy Essentials Bundle
							</button>
						</div>
					</div>
				</div>

				<div>
					<h1 className='text-3xl text-green-500 font-bold mb-8'>
						Protein Shake Bundle
					</h1>
					<div className='flex flex-col justify-between rounded-3xl bg-gray-200 p-8 ring-1 ring-gray-200 xl:p-10 h-full'>
						<div className='flex flex-col items-center text-center'>
							<h3
								id={proteinShakeTier.id}
								className='text-4xl font-semibold leading-8 text-green-500'>
								{proteinShakeTier.name}
							</h3>
							<p className='mt-6 text-2xl tracking-tight text-gray-900'>
								{proteinShakeTier.priceMonthly}
							</p>
							<p className='mt-4 text-lg font-semibold leading-6 text-black'>
								{proteinShakeTier.description}
							</p>
							<ul className='mt-8 space-y-3'>
								{proteinShakeTier.features.map((feature, index) => (
									<li key={index} className='text-sm text-gray-700'>
										{feature}
									</li>
								))}
							</ul>
						</div>
						<div className='flex justify-center mt-8'>
							<button
								onClick={() => handlePurchase('protein', proteinShakeTier.name)}
								className='block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 bg-green-500 text-white hover:bg-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500'>
								Buy Protein Bundle
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className='mb-16'></div>
		</div>
	)
}
