import { supabaseClient } from '../supabaseClient'
import {
	vistaFinaleBundle,
	classestiers,
	essentialsTier,
	individualtiers,
	proteinShakeTier
} from '../bundles'

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

	// Handle Vista Finale bundle specially
	if (bundleType === 'finale') {
		if (userData.wallet < vistaFinaleBundle.price) {
			return {
				error: 'Not enough credits to purchase the Vista Finale bundle.'
			}
		}

		// Calculate new balances
		const newWalletBalance = userData.wallet - vistaFinaleBundle.price
		const newPrivateTokens =
			userData.private_token + vistaFinaleBundle.tokens.private_token
		const newPublicTokens =
			userData.public_token + vistaFinaleBundle.tokens.public_token
		const newShakeTokens =
			userData.shake_token + vistaFinaleBundle.tokens.shake_token

		// Update user data
		const { error: updateError } = await supabase
			.from('users')
			.update({
				wallet: newWalletBalance,
				private_token: newPrivateTokens,
				public_token: newPublicTokens,
				shake_token: newShakeTokens
			})
			.eq('user_id', userId)

		if (updateError) {
			console.error('Error updating user data:', updateError.message)
			return { error: updateError.message }
		}

		// Record transactions
		const transactionRecords = [
			{
				user_id: userId,
				name: 'Purchased Vista Finale bundle',
				type: 'bundle purchase',
				amount: `-${vistaFinaleBundle.price} credits`
			},
			{
				user_id: userId,
				name: 'Received Private Training tokens',
				type: 'bundle purchase',
				amount: `+${vistaFinaleBundle.tokens.private_token} private tokens`
			},
			{
				user_id: userId,
				name: 'Received Class tokens',
				type: 'bundle purchase',
				amount: `+${vistaFinaleBundle.tokens.public_token} public tokens`
			},
			{
				user_id: userId,
				name: 'Received Shake tokens',
				type: 'bundle purchase',
				amount: `+${vistaFinaleBundle.tokens.shake_token} shake tokens`
			}
		]

		const { error: transactionError } = await supabase
			.from('transactions')
			.insert(transactionRecords)

		if (transactionError) {
			console.error('Error recording transactions:', transactionError.message)
		}

		return {
			data: {
				newWalletBalance,
				private_token: newPrivateTokens,
				public_token: newPublicTokens,
				shake_token: newShakeTokens
			},
			message: 'Vista Finale bundle purchased successfully.'
		}
	}

	// Handle other bundles
	let bundlePrice, tokenType, tokenAmount
	if (bundleType === 'classes') {
		const bundle = classestiers.find(tier => tier.name === bundleName)
		if (!bundle) {
			return { error: 'Invalid bundle name for classes.' }
		}
		bundlePrice = parseInt(bundle.priceMonthly)
		tokenType = 'public'
		tokenAmount = parseInt(bundle.description.split(' ')[0])
	} else if (bundleType === 'individual') {
		const bundle = individualtiers.find(tier => tier.name === bundleName)
		if (!bundle) {
			return { error: 'Invalid bundle name for individual training.' }
		}
		bundlePrice = parseInt(bundle.price.monthly)
		tokenAmount = parseInt(bundle.description.split(' ')[0])
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
		bundlePrice = parseInt(proteinShakeTier.priceMonthly)
		tokenType = 'shake'
		tokenAmount = parseInt(proteinShakeTier.description.split(' ')[0])
	} else {
		return { error: 'Invalid bundle type.' }
	}

	// Check if user has enough credits
	if (userData.wallet < bundlePrice) {
		return { error: 'Not enough credits to purchase the bundle.' }
	}

	// Update balances
	const newWalletBalance = userData.wallet - bundlePrice
	const newTokenBalance = userData[`${tokenType}_token`] + tokenAmount

	// Update user data
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

	// Record transactions
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
