import { supabaseClient } from '../supabaseClient'

export const fetchMarket = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase.from('market').select('*').order('id')
	if (error) {
		console.error('Error fetching market:', error.message)
		return []
	}
	return data
}

export const addMarketItem = async (name, price, quantity) => {
	const supabase = await supabaseClient()

	const { data, error } = await supabase
		.from('market')
		.insert([{ name, price, quantity }])

	if (error) {
		console.error('Error adding market item:', error.message)
		return { error: error.message }
	}

	return { data, message: 'Item added successfully' }
}

export const deleteMarketItem = async id => {
	const supabase = await supabaseClient()

	const { data, error } = await supabase.from('market').delete().eq('id', id)

	if (error) {
		console.error('Error deleting market item:', error.message)
		return { error: error.message }
	}

	return { data, message: 'Item deleted successfully' }
}
export const modifyMarketItem = async (id, name, price, quantity) => {
	const supabase = await supabaseClient()

	const { data, error } = await supabase
		.from('market')
		.update({ name, price, quantity })
		.eq('id', id)

	if (error) {
		console.error('Error modifying market item:', error.message)
		return { error: error.message }
	}

	return { data, message: 'Item modified successfully' }
}

export const updateMarketItemQuantity = async (id, quantity) => {
	const supabase = await supabaseClient()

	const { data, error } = await supabase
		.from('market')
		.update({ quantity })
		.eq('id', id)

	if (error) {
		console.error('Error updating market item quantity:', error.message)
		return { error: error.message }
	}

	return { data, message: 'Item quantity updated successfully' }
}
