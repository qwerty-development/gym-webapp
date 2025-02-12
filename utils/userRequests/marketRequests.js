import { supabaseClient } from '../supabaseClient'

export const fetchMarket = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('market')
		.select('*')
		.gt('quantity', 0)
		.order('id')
	if (error) {
		console.error('Error fetching market:', error.message)
		return []
	}
	return data
}

export const handlePurchase = async (userId, cart, totalPrice) => {
	const supabase = await supabaseClient()

	// Fetch user data including shake tokens and punches
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('wallet, shake_token, punches')
		.eq('user_id', userId)
		.single()

	if (userError) {
		console.error('Error fetching user data:', userError.message)
		return { success: false, error: 'Error fetching user data' }
	}

	// Calculate total price after accounting for shake tokens (for protein items)
	let adjustedTotalPrice = totalPrice
	let shakeTokensToUse = 0
	const proteinItems = cart.filter(
		item =>
			item.name.toLowerCase().includes('protein shake') ||
			item.name.toLowerCase().includes('protein pudding')
	)

	// Total number of protein items (each counts for one punch)
	const totalProteinItems = proteinItems.reduce(
		(sum, item) => sum + item.quantity,
		0
	)

	// Calculate shake token usage
	if (proteinItems.length > 0 && userData.shake_token > 0) {
		let remainingShakeTokens = userData.shake_token
		for (const item of proteinItems) {
			if (remainingShakeTokens >= item.quantity) {
				adjustedTotalPrice -= item.price * item.quantity
				shakeTokensToUse += item.quantity
				remainingShakeTokens -= item.quantity
			} else if (remainingShakeTokens > 0) {
				adjustedTotalPrice -= item.price * remainingShakeTokens
				shakeTokensToUse += remainingShakeTokens
				remainingShakeTokens = 0
			}
		}
	}

	if (userData.wallet < adjustedTotalPrice) {
		return {
			success: false,
			error: 'You do not have enough credits to make this purchase.'
		}
	}

	// Check if all items have sufficient quantity and update each market item quantity
	const items = []
	for (const item of cart) {
		items.push(...Array(item.quantity).fill(item.id))
		const { data: currentItem, error: fetchError } = await supabase
			.from('market')
			.select('quantity')
			.eq('id', item.id)
			.single()

		if (fetchError) {
			console.error(
				`Error fetching current quantity for item ${item.id}:`,
				fetchError.message
			)
			continue
		}

		const newQuantity = Math.max(0, currentItem.quantity - item.quantity)
		const { error: quantityError } = await supabase
			.from('market')
			.update({ quantity: newQuantity })
			.eq('id', item.id)

		if (quantityError) {
			console.error(
				`Error updating quantity for item ${item.id}:`,
				quantityError.message
			)
		}
	}

	// Record market transaction in the separate market_transactions table (unchanged)
	const { error: marketTransactionError } = await supabase
		.from('market_transactions')
		.insert({
			user_id: userId,
			items: items,
			date: new Date(),
			claimed: false,
			price: adjustedTotalPrice
		})

	if (marketTransactionError) {
		return { success: false, error: 'Error recording market transaction' }
	}

	// Calculate punch card rewards
	const newPunchCount = userData.punches + totalProteinItems
	const completedCards = Math.floor(newPunchCount / 10)
	const previousCards = Math.floor(userData.punches / 10)
	const newTokensToAward = (completedCards - previousCards) * 2
	const finalPunchCount = newPunchCount % 10

	// Update user's wallet, shake tokens, and punches
	const { error: updateError } = await supabase
		.from('users')
		.update({
			wallet: userData.wallet - adjustedTotalPrice,
			shake_token: userData.shake_token - shakeTokensToUse + newTokensToAward,
			punches: finalPunchCount
		})
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user data:', updateError.message)
		return { success: false, error: 'Error updating user data' }
	}

	// Create transaction records to be logged in new_transactions:
	const transactionRecords = []

	if (adjustedTotalPrice > 0) {
		transactionRecords.push({
			user_id: userId,
			currency: 'credits',
			amount: -adjustedTotalPrice, // Deduction of credits
			type: 'market_purchase',
			description: `Market purchase: ${cart.length} item${
				cart.length > 1 ? 's' : ''
			}`
		})
	}

	if (shakeTokensToUse > 0) {
		transactionRecords.push({
			user_id: userId,
			currency: 'shake_token',
			amount: -shakeTokensToUse, // Consumed shake tokens
			type: 'shake_token_use',
			description: 'Used protein shake tokens'
		})
	}

	if (newTokensToAward > 0) {
		transactionRecords.push({
			user_id: userId,
			currency: 'shake_token',
			amount: newTokensToAward, // Awarded shake tokens
			type: 'shake_token_reward',
			description: 'Earned free shake tokens from punch card completion'
		})
	}

	if (transactionRecords.length > 0) {
		const { error: transactionError } = await supabase
			.from('new_transactions')
			.insert(transactionRecords)
		if (transactionError) {
			console.error('Error recording transactions:', transactionError.message)
		}
	}

	return {
		success: true,
		shakeTokensUsed: shakeTokensToUse,
		creditsUsed: adjustedTotalPrice,
		punchesAdded: totalProteinItems,
		tokensEarned: newTokensToAward,
		newPunchCount: finalPunchCount,
		message:
			newTokensToAward > 0
				? `Purchase successful! 🎉 You've completed your punch card and earned ${newTokensToAward} free shake tokens! Your new punch count is ${finalPunchCount}.`
				: `Purchase successful! You have ${finalPunchCount} punches on your card.`
	}
}

/**
 * payForItems – Adds selected market items to an individual session.
 *
 * Adjusts the user's wallet, shake tokens, and punches, updates the session additions,
 * decreases market item quantities, and records transactions:
 *   - A market purchase (credits deduction)
 *   - Shake token use (if applicable)
 *   - Punch card reward (if earned)
 */
export const payForItems = async ({
	userId,
	activityId,
	coachId,
	date,
	startTime,
	selectedItems
}) => {
	const supabase = await supabaseClient()

	// Fetch user's data including shake tokens and punches
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user data:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Calculate total price and identify items using tokens vs. credits
	let adjustedTotalPrice = 0
	let shakeTokensToUse = 0
	let itemsUsingTokens = []
	let itemsUsingCredits = []

	const proteinItems = selectedItems.filter(
		item =>
			item.name.toLowerCase().includes('protein shake') ||
			item.name.toLowerCase().includes('protein pudding')
	)

	// Total number of protein items (for punches)
	const totalProteinItems = proteinItems.length

	// Calculate shake token usage for protein items
	if (proteinItems.length > 0 && userData.shake_token > 0) {
		let remainingShakeTokens = userData.shake_token
		proteinItems.forEach(item => {
			if (remainingShakeTokens > 0) {
				itemsUsingTokens.push(item)
				shakeTokensToUse++
				remainingShakeTokens--
			} else {
				itemsUsingCredits.push(item)
				adjustedTotalPrice += item.price
			}
		})
	} else {
		itemsUsingCredits = proteinItems
		adjustedTotalPrice += proteinItems.reduce(
			(sum, item) => sum + item.price,
			0
		)
	}

	// Add non-protein items to the credits calculation
	const nonProteinItems = selectedItems.filter(
		item =>
			!item.name.toLowerCase().includes('protein shake') &&
			!item.name.toLowerCase().includes('protein pudding')
	)
	itemsUsingCredits = [...itemsUsingCredits, ...nonProteinItems]
	adjustedTotalPrice += nonProteinItems.reduce(
		(sum, item) => sum + item.price,
		0
	)

	if (adjustedTotalPrice > userData.wallet) {
		return { error: 'Not enough credits to pay for the items.' }
	}

	// Calculate punch card rewards
	const newPunchCount = userData.punches + totalProteinItems
	const completedCards = Math.floor(newPunchCount / 10)
	const previousCards = Math.floor(userData.punches / 10)
	const newTokensToAward = (completedCards - previousCards) * 2
	const finalPunchCount = newPunchCount % 10

	// Fetch time slot data
	const { data: timeSlotData, error: timeSlotError } = await supabase
		.from('time_slots')
		.select('*')
		.match({
			activity_id: activityId,
			coach_id: coachId,
			date: date,
			start_time: startTime
		})
		.single()

	if (timeSlotError || !timeSlotData) {
		return { error: timeSlotError?.message || 'Time slot not found.' }
	}

	// Update user's wallet, shake tokens, and punches
	const { error: updateError } = await supabase
		.from('users')
		.update({
			wallet: userData.wallet - adjustedTotalPrice,
			shake_token: userData.shake_token - shakeTokensToUse + newTokensToAward,
			punches: finalPunchCount
		})
		.eq('user_id', userId)

	if (updateError) {
		return { error: updateError.message }
	}

	// Update time slot additions
	const newAdditions = [
		...(timeSlotData.additions || []),
		...selectedItems.map(item => item.name)
	]
	const { error: additionsError } = await supabase
		.from('time_slots')
		.update({ additions: newAdditions })
		.eq('id', timeSlotData.id)

	if (additionsError) {
		return { error: additionsError.message }
	}

	// Update market item quantities for each selected item
	for (const item of selectedItems) {
		const { data, error: quantityError } = await supabase
			.from('market')
			.select('quantity')
			.eq('id', item.id)
			.single()

		if (quantityError) continue

		const newQuantity = Math.max(data.quantity - 1, 0)
		await supabase
			.from('market')
			.update({ quantity: newQuantity })
			.eq('id', item.id)
	}

	// Record transaction records using the new system
	const transactionRecords = []
	if (adjustedTotalPrice > 0) {
		transactionRecords.push({
			user_id: userId,
			currency: 'credits',
			amount: -adjustedTotalPrice,
			type: 'market_purchase',
			description: `Purchased items for individual session: ${itemsUsingCredits
				.map(item => item.name)
				.join(', ')}`
		})
	}
	if (shakeTokensToUse > 0) {
		transactionRecords.push({
			user_id: userId,
			currency: 'shake_token',
			amount: -shakeTokensToUse,
			type: 'shake_token_use',
			description: `Used shake tokens for: ${itemsUsingTokens
				.map(item => item.name)
				.join(', ')}`
		})
	}
	if (newTokensToAward > 0) {
		transactionRecords.push({
			user_id: userId,
			currency: 'shake_token',
			amount: newTokensToAward,
			type: 'shake_token_reward',
			description: 'Earned free shake tokens from punch card completion'
		})
	}

	if (transactionRecords.length > 0) {
		const { error: transactionError } = await supabase
			.from('new_transactions')
			.insert(transactionRecords)
		if (transactionError) {
			console.error('Error recording transactions:', transactionError.message)
		}
	}

	return {
		data: { ...timeSlotData, additions: newAdditions },
		message:
			newTokensToAward > 0
				? `Items added to time slot successfully! 🎉 You've completed your punch card and earned ${newTokensToAward} free shake tokens! Your new punch count is ${finalPunchCount}.`
				: `Items added to time slot successfully. You have ${finalPunchCount} punches on your card.`,
		shakeTokensUsed: shakeTokensToUse,
		creditsUsed: adjustedTotalPrice,
		punchesAdded: totalProteinItems,
		tokensEarned: newTokensToAward,
		newPunchCount: finalPunchCount
	}
}

/**
 * payForGroupItems – Adds selected market items to a group session.
 *
 * Updates the user's wallet, shake tokens, and punches; updates group session additions;
 * decreases market item quantities; and records group market transactions:
 *   - A market purchase (credits deduction)
 *   - Shake token use (if applicable)
 *   - Punch card reward (if earned)
 */
export const payForGroupItems = async ({
	userId,
	activityId,
	coachId,
	date,
	startTime,
	selectedItems
}) => {
	const supabase = await supabaseClient()

	// Fetch user's data including shake tokens and punches
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		return { error: userError?.message || 'User not found.' }
	}

	// Calculate total price and identify items using tokens/credits
	let adjustedTotalPrice = 0
	let shakeTokensToUse = 0
	let itemsUsingTokens = []
	let itemsUsingCredits = []

	const proteinItems = selectedItems.filter(
		item =>
			item.name.toLowerCase().includes('protein shake') ||
			item.name.toLowerCase().includes('protein pudding')
	)

	// Total protein items for punch rewards
	const totalProteinItems = proteinItems.length

	// Calculate shake token usage
	if (proteinItems.length > 0 && userData.shake_token > 0) {
		let remainingShakeTokens = userData.shake_token
		proteinItems.forEach(item => {
			if (remainingShakeTokens > 0) {
				itemsUsingTokens.push(item)
				shakeTokensToUse++
				remainingShakeTokens--
			} else {
				itemsUsingCredits.push(item)
				adjustedTotalPrice += item.price
			}
		})
	} else {
		itemsUsingCredits = proteinItems
		adjustedTotalPrice += proteinItems.reduce(
			(sum, item) => sum + item.price,
			0
		)
	}

	const nonProteinItems = selectedItems.filter(
		item =>
			!item.name.toLowerCase().includes('protein shake') &&
			!item.name.toLowerCase().includes('protein pudding')
	)
	itemsUsingCredits = [...itemsUsingCredits, ...nonProteinItems]
	adjustedTotalPrice += nonProteinItems.reduce(
		(sum, item) => sum + item.price,
		0
	)

	if (adjustedTotalPrice > userData.wallet) {
		return { error: 'Not enough credits to pay for the items.' }
	}

	// Calculate punch card rewards
	const newPunchCount = userData.punches + totalProteinItems
	const completedCards = Math.floor(newPunchCount / 10)
	const previousCards = Math.floor(userData.punches / 10)
	const newTokensToAward = (completedCards - previousCards) * 2
	const finalPunchCount = newPunchCount % 10

	// Fetch group time slot data
	const { data: timeSlotData, error: timeSlotError } = await supabase
		.from('group_time_slots')
		.select('*')
		.match({
			activity_id: activityId,
			coach_id: coachId,
			date: date,
			start_time: startTime
		})
		.single()

	if (timeSlotError || !timeSlotData) {
		return { error: timeSlotError?.message || 'Group time slot not found.' }
	}

	// Update user's wallet, shake tokens, and punches
	const { error: updateError } = await supabase
		.from('users')
		.update({
			wallet: userData.wallet - adjustedTotalPrice,
			shake_token: userData.shake_token - shakeTokensToUse + newTokensToAward,
			punches: finalPunchCount
		})
		.eq('user_id', userId)

	if (updateError) {
		return { error: updateError.message }
	}

	// Create new addition entry and update group time slot additions
	const newAddition = {
		user_id: userId,
		items: selectedItems.map(item => ({
			id: item.id,
			name: item.name,
			price: item.price,
			usedToken: itemsUsingTokens.some(tokenItem => tokenItem.id === item.id)
		}))
	}
	const newAdditions = [...(timeSlotData.additions || []), newAddition]
	const { error: additionsError } = await supabase
		.from('group_time_slots')
		.update({ additions: newAdditions })
		.eq('id', timeSlotData.id)

	if (additionsError) {
		return { error: additionsError.message }
	}

	// Update market item quantities for each selected item
	for (const item of selectedItems) {
		const { data, error: quantityError } = await supabase
			.from('market')
			.select('quantity')
			.eq('id', item.id)
			.single()
		if (quantityError) continue
		const newQuantity = Math.max(data.quantity - 1, 0)
		await supabase
			.from('market')
			.update({ quantity: newQuantity })
			.eq('id', item.id)
	}

	// Record transaction records for the group session purchase
	const transactionRecords = []
	if (adjustedTotalPrice > 0) {
		transactionRecords.push({
			user_id: userId,
			currency: 'credits',
			amount: -adjustedTotalPrice,
			type: 'market_purchase',
			description: `Purchased items for group session: ${itemsUsingCredits
				.map(item => item.name)
				.join(', ')}`
		})
	}
	if (shakeTokensToUse > 0) {
		transactionRecords.push({
			user_id: userId,
			currency: 'shake_token',
			amount: -shakeTokensToUse,
			type: 'shake_token_use',
			description: `Used shake tokens for: ${itemsUsingTokens
				.map(item => item.name)
				.join(', ')}`
		})
	}
	if (newTokensToAward > 0) {
		transactionRecords.push({
			user_id: userId,
			currency: 'shake_token',
			amount: newTokensToAward,
			type: 'shake_token_reward',
			description: 'Earned free shake tokens from punch card completion'
		})
	}

	if (transactionRecords.length > 0) {
		const { error: transactionError } = await supabase
			.from('new_transactions')
			.insert(transactionRecords)
		if (transactionError) {
			console.error('Error recording transactions:', transactionError.message)
		}
	}

	return {
		data: { ...timeSlotData, additions: newAdditions },
		message:
			newTokensToAward > 0
				? `Items added to group time slot successfully! 🎉 You've completed your punch card and earned ${newTokensToAward} free shake tokens! Your new punch count is ${finalPunchCount}.`
				: `Items added to group time slot successfully. You have ${finalPunchCount} punches on your card.`,
		shakeTokensUsed: shakeTokensToUse,
		creditsUsed: adjustedTotalPrice,
		punchesAdded: totalProteinItems,
		tokensEarned: newTokensToAward,
		newPunchCount: finalPunchCount
	}
}

export const fetchMarketItems = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('market')
		.select('id, name, price,quantity,image')
		.gt('quantity', 0)
		.eq('clothe', false)
		.order('id')

	if (error) {
		console.error('Error fetching market items:', error.message)
		return []
	}

	return data
}

export const fetchClothe = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('market')
		.select('id, name, price,quantity,image')
		.gt('quantity', 0)
		.eq('clothe', true)
		.order('id')

	if (error) {
		console.error('Error fetching market items:', error.message)
		return []
	}

	return data
}

export const fetchShopTransactions = async () => {
	const supabase = supabaseClient()
	const { data: transactions, error } = await supabase
		.from('market_transactions')
		.select('*')
		.eq('claimed', false)

	if (error) {
		console.error('Error fetching shop transactions:', error.message)
		return []
	}

	// Fetch user data for each transaction
	const userPromises = transactions.map(transaction =>
		supabase
			.from('users')
			.select('first_name, last_name')
			.eq('user_id', transaction.user_id)
			.single()
	)

	const userResults = await Promise.all(userPromises)

	// Fetch item data for each transaction
	const itemPromises = transactions.map(transaction => {
		const itemIds = transaction.items
		return supabase.from('market').select('id, name').in('id', itemIds)
	})

	const itemResults = await Promise.all(itemPromises)

	// Combine transactions with user and item data
	const enhancedTransactions = transactions.map((transaction, index) => {
		const user = userResults[index].data
		const items = itemResults[index].data

		// Count item quantities
		const itemCounts = transaction.items.reduce((acc, itemId) => {
			acc[itemId] = (acc[itemId] || 0) + 1
			return acc
		}, {})

		const itemDetails = items.map(item => ({
			name: item.name,
			quantity: itemCounts[item.id] || 0
		}))

		return {
			...transaction,
			user_name: `${user.first_name} ${user.last_name}`,
			item_details: itemDetails
		}
	})

	return enhancedTransactions
}

export const claimTransaction = async transactionId => {
	const supabase = supabaseClient()
	const { error } = await supabase
		.from('market_transactions')
		.update({ claimed: true })
		.eq('transaction_id', transactionId)

	if (error) {
		console.error('Error claiming transaction:', error.message)
		return false
	}

	return true
}
