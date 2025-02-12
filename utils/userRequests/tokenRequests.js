import { supabaseClient } from '../supabaseClient'
import {
	vistaFinaleBundle,
	classestiers,
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

		// Insert transactions into new_transactions table
		const transactionRecords = [
			{
				user_id: userId,
				currency: 'credits',
				amount: -vistaFinaleBundle.price,
				type: 'bundle_vista',
				description: 'Purchased Vista Finale bundle'
			},
			{
				user_id: userId,
				currency: 'private_token',
				amount: vistaFinaleBundle.tokens.private_token,
				type: 'bundle_vista',
				description: 'Received Private Training tokens from Vista Finale bundle'
			},
			{
				user_id: userId,
				currency: 'public_token',
				amount: vistaFinaleBundle.tokens.public_token,
				type: 'bundle_vista',
				description: 'Received Class tokens from Vista Finale bundle'
			},
			{
				user_id: userId,
				currency: 'shake_token',
				amount: vistaFinaleBundle.tokens.shake_token,
				type: 'bundle_vista',
				description: 'Received Shake tokens from Vista Finale bundle'
			}
		]

		const { error: transactionError } = await supabase
			.from('new_transactions')
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

	// Handle other bundles: classes, individual, protein
	let bundlePrice, tokenType, tokenAmount, transactionType
	if (bundleType === 'classes') {
		const bundle = classestiers.find(tier => tier.name === bundleName)
		if (!bundle) {
			return { error: 'Invalid bundle name for classes.' }
		}
		bundlePrice = parseInt(bundle.priceMonthly)
		tokenType = 'public' // maps to public_token
		tokenAmount = parseInt(bundle.description.split(' ')[0])
		transactionType = 'bundle_class'
	} else if (bundleType === 'individual') {
		const bundle = individualtiers.find(tier => tier.name === bundleName)
		if (!bundle) {
			return { error: 'Invalid bundle name for individual training.' }
		}
		bundlePrice = parseInt(bundle.price.monthly)
		tokenAmount = parseInt(bundle.description.split(' ')[0])
		switch (bundleName) {
			case 'Workout of the day':
				// Map workoutDay to private token for this example
				tokenType = 'private'
				transactionType = 'bundle_workout'
				break
			case 'Private training':
				tokenType = 'private'
				transactionType = 'bundle_private'
				break
			case 'Semi-Private':
				tokenType = 'semiPrivate'
				transactionType = 'bundle_semi'
				break
			default:
				return { error: 'Invalid individual bundle type.' }
		}
	} else if (bundleType === 'protein') {
		bundlePrice = parseInt(proteinShakeTier.priceMonthly)
		tokenType = 'shake'
		tokenAmount = parseInt(proteinShakeTier.description.split(' ')[0])
		transactionType = 'bundle_shake'
	} else {
		return { error: 'Invalid bundle type.' }
	}

	if (userData.wallet < bundlePrice) {
		return { error: 'Not enough credits to purchase the bundle.' }
	}

	const newWalletBalance = userData.wallet - bundlePrice
	const tokenColumn = `${tokenType}_token`
	const newTokenBalance = userData[tokenColumn] + tokenAmount

	// Update user data with new wallet and token balances
	const { error: updateError } = await supabase
		.from('users')
		.update({
			wallet: newWalletBalance,
			[tokenColumn]: newTokenBalance
		})
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user data:', updateError.message)
		return { error: updateError.message }
	}

	// Insert transactions for non-finale bundle purchase
	const transactionRecords = [
		{
			user_id: userId,
			currency: 'credits',
			amount: -bundlePrice,
			type: transactionType,
			description: `Purchased ${bundleName} bundle`
		},
		{
			user_id: userId,
			currency:
				tokenType === 'public'
					? 'public_token'
					: tokenType === 'private'
					? 'private_token'
					: tokenType === 'semiPrivate'
					? 'semi_private_token'
					: tokenType === 'shake'
					? 'shake_token'
					: null,
			amount: tokenAmount,
			type: transactionType,
			description: `Received tokens for ${bundleName} bundle`
		}
	]

	const { error: transactionError } = await supabase
		.from('new_transactions')
		.insert(transactionRecords)

	if (transactionError) {
		console.error('Error recording transactions:', transactionError.message)
	}

	return {
		data: {
			newWalletBalance,
			[tokenColumn]: newTokenBalance
		},
		message: 'Bundle purchased successfully.'
	}
}

export const purchaseEssentialsBundle = async userId => {
	const supabase = await supabaseClient()
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

	if (userData.wallet < bundlePrice) {
		return { error: 'Not enough credits to purchase the Essentials bundle.' }
	}

	const newWalletBalance = userData.wallet - bundlePrice

	// Calculate new essential_till date
	const currentDate = new Date()
	let newEssentialsTill
	if (
		userData.essential_till &&
		new Date(userData.essential_till) > currentDate
	) {
		newEssentialsTill = new Date(userData.essential_till)
		newEssentialsTill.setMonth(newEssentialsTill.getMonth() + 1)
	} else {
		newEssentialsTill = new Date(currentDate)
		newEssentialsTill.setMonth(newEssentialsTill.getMonth() + 1)
	}

	// Update user data with new wallet balance and essential_till date
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

	// Insert transaction for Essentials bundle purchase
	const { error: transactionError } = await supabase
		.from('new_transactions')
		.insert({
			user_id: userId,
			currency: 'credits',
			amount: -bundlePrice,
			type: 'bundle_essential',
			description: 'Purchased Essentials bundle'
		})

	if (transactionError) {
		console.error('Error recording transaction:', transactionError.message)
	}

	return {
		data: {
			newWalletBalance,
			essential_till: newEssentialsTill.toISOString()
		},
		message: 'Essentials bundle purchased successfully.'
	}
}
