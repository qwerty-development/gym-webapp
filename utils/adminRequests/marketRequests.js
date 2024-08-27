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

export const addMarketItem = async (name, price, quantity, file, newItemClothe) => {
	const supabase = await supabaseClient()

	let imageUrl = null
	console.log(newItemClothe)
	if (file) {
		const fileExtension = file.name.split('.').pop()
		const fileName = `${Math.random()}.${fileExtension}`
		const { error: uploadError } = await supabase.storage
			.from('item_image')
			.upload(fileName, file)

		if (uploadError) {
			console.error('Error uploading file:', uploadError.message)
			return { error: uploadError.message }
		}

		imageUrl = `https://ofsmbbjjveacrikuuueh.supabase.co/storage/v1/object/public/item_image/${fileName}`
	}

	const { data, error } = await supabase
		.from('market')
		.insert([{ name, price, quantity, image: imageUrl, clothe:newItemClothe  }])

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
export const modifyMarketItem = async (id, name, price, quantity, file, editClothe) => {
	const supabase = await supabaseClient()

	let imageUrl = null
	if (file) {
		const fileExtension = file.name.split('.').pop()
		const fileName = `${Math.random()}.${fileExtension}`
		const { error: uploadError } = await supabase.storage
			.from('item_image')
			.upload(fileName, file)

		if (uploadError) {
			console.error('Error uploading file:', uploadError.message)
			return { error: uploadError.message }
		}

		imageUrl = `https://ofsmbbjjveacrikuuueh.supabase.co/storage/v1/object/public/item_image/${fileName}`
	}

	const updates = { name, price, quantity, clothe:editClothe }
	if (imageUrl) {
		updates.image = imageUrl
	}

	const { data, error } = await supabase
		.from('market')
		.update(updates)
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
