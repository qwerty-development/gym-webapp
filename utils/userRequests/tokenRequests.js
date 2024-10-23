import { supabaseClient } from '../supabaseClient'
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

const proteinShakeTier = {
	name: 'PROTEIN SHAKE PACK',
	id: 'tier-protein',
	price: 40,
	description: '12 Shakes'
}

export const purchaseBundle = async ({ userId, bundleType, bundleName }) => {
	const supabase = await supabaseClient()

	// Fetch user's current data
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user data:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Determine the bundle details
	let bundlePrice, tokenType, tokenAmount
	if (bundleType === 'classes') {
		const bundle = classestiers.find(tier => tier.name === bundleName)
		if (!bundle) {
			return { error: 'Invalid bundle name for classes.' }
		}
		bundlePrice = parseInt(bundle.priceMonthly)
		tokenType = 'public'
		tokenAmount = parseInt(bundle.description.split(' ')[0]) // Extract number of classes
	} else if (bundleType === 'individual') {
		const bundle = individualtiers.find(tier => tier.name === bundleName)
		if (!bundle) {
			return { error: 'Invalid bundle name for individual training.' }
		}
		bundlePrice = parseInt(bundle.price.monthly)
		tokenAmount = parseInt(bundle.description.split(' ')[0]) // Extract number of classes
		switch (bundleName) {
			case 'Workout of the day':
				tokenType = 'workoutDay'
				break
			case 'Private training':
				tokenType = 'private'
				break
			case 'Semi-Private':
				tokenType = 'semiPrivate'
				break
			default:
				return { error: 'Invalid individual bundle type.' }
		}
	} else if (bundleType === 'protein') {
		bundlePrice = proteinShakeTier.price
		tokenType = 'shake'
		tokenAmount = parseInt(proteinShakeTier.description.split(' ')[0])
	} else {
		return { error: 'Invalid bundle type.' }
	}

	// Check if the user has enough credits
	if (userData.wallet < bundlePrice) {
		return { error: 'Not enough credits to purchase the bundle.' }
	}

	// Deduct credits and add tokens
	const newWalletBalance = userData.wallet - bundlePrice
	const newTokenBalance = userData[`${tokenType}_token`] + tokenAmount

	// Update user data with the new token balance
	const updateFields = {
		wallet: newWalletBalance,
		[`${tokenType}_token`]: newTokenBalance
	}

	const { error: updateError } = await supabase
		.from('users')
		.update(updateFields)
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user data:', updateError.message)
		return { error: updateError.message }
	}

	// Insert bundle purchase record
	const transactionRecords = [
		{
			user_id: userId,
			name: `Purchased ${bundleName} bundle`,
			type: 'bundle purchase',
			amount: `-${bundlePrice} credits`
		},
		{
			user_id: userId,
			name: `Received tokens for ${bundleName} bundle`,
			type: 'bundle purchase',
			amount: `+${tokenAmount} ${tokenType} token${tokenAmount > 1 ? 's' : ''}`
		}
	]

	const { error: transactionError } = await supabase
		.from('transactions')
		.insert(transactionRecords)

	if (transactionError) {
		console.error('Error recording transactions:', transactionError.message)
		// Note: We're not returning here to ensure the purchase is still considered successful
	}

	return {
		data: {
			newWalletBalance,
			[`${tokenType}_token`]: newTokenBalance
		},
		message: 'Bundle purchased successfully.'
	}
}

export const purchaseEssentialsBundle = async userId => {
	const supabase = supabaseClient()
	const bundlePrice = 30

	// Fetch user's current data
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user data:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Check if the user has enough credits
	if (userData.wallet < bundlePrice) {
		return { error: 'Not enough credits to purchase the Essentials bundle.' }
	}

	// Calculate new wallet balance
	const newWalletBalance = userData.wallet - bundlePrice

	// Calculate new essential_till date
	const currentDate = new Date()
	let newEssentialsTill

	if (
		userData.essential_till &&
		new Date(userData.essential_till) > currentDate
	) {
		// If essential_till is in the future, add one month to it
		newEssentialsTill = new Date(userData.essential_till)
		newEssentialsTill.setMonth(newEssentialsTill.getMonth() + 1)
	} else {
		// If essential_till is in the past or null, set it to one month from now
		newEssentialsTill = new Date(currentDate)
		newEssentialsTill.setMonth(newEssentialsTill.getMonth() + 1)
	}

	// Update user data
	const { error: updateError } = await supabase
		.from('users')
		.update({
			wallet: newWalletBalance,
			essential_till: newEssentialsTill.toISOString()
		})
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user data:', updateError.message)
		return { error: updateError.message }
	}

	// Insert bundle purchase record
	const { error: transactionError } = await supabase
		.from('transactions')
		.insert({
			user_id: userId,
			name: 'Purchased Essentials bundle',
			type: 'bundle purchase',
			amount: `-${bundlePrice} credits`
		})

	if (transactionError) {
		console.error('Error recording transaction:', transactionError.message)
		// Note: We're not returning here to ensure the purchase is still considered successful
	}

	return {
		data: {
			newWalletBalance,
			essential_till: newEssentialsTill.toISOString()
		},
		message: 'Essentials bundle purchased successfully.'
	}
}
