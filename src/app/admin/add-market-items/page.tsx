'use client'
import { useState, useEffect } from 'react'
import {
  addMarketItem,
  modifyMarketItem,
  deleteMarketItem,
  fetchMarket
} from '../../../../utils/adminRequests'

import toast from 'react-hot-toast'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import { motion } from 'framer-motion'
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa'

interface MarketItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
  clothe: boolean
}

export default function MarketManagement() {
  const [items, setItems] = useState<MarketItem[]>([])
  const [newItemName, setNewItemName] = useState<string>('')
  const [newItemPrice, setNewItemPrice] = useState<string>('')
  const [newItemQuantity, setNewItemQuantity] = useState<string>('')
  const [newItemImage, setNewItemImage] = useState<File | null>(null)
  const [newItemClothe, setNewItemClothe] = useState<boolean>(false)
  const [editingItem, setEditingItem] = useState<number | null>(null)
  const [editName, setEditName] = useState<string>('')
  const [editPrice, setEditPrice] = useState<string>('')
  const [editQuantity, setEditQuantity] = useState<string>('')
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editClothe, setEditClothe] = useState<boolean>(false)
  const [buttonLoading, setButtonLoading] = useState(false)

  const fetchMarketItems = async () => {
    const data = await fetchMarket()
    setItems(data)
  }

  useEffect(() => {
    fetchMarketItems()
  }, [])

  const handleAddItem = async () => {
	console.log(newItemClothe)
    const price = parseFloat(newItemPrice)
    const quantity = parseInt(newItemQuantity)
    if (!newItemName || isNaN(price) || isNaN(quantity)) {
      toast.error('Please enter valid name, price, and quantity.')
      return
    }
    setButtonLoading(true)
    const { error, message } = await addMarketItem(
      newItemName,
      price,
      quantity,
      newItemImage,
      newItemClothe
    )
    if (error) {
      toast.error(error)
    } else {
      toast.success('Item added successfully!')
      setNewItemName('')
      setNewItemPrice('')
      setNewItemQuantity('')
      setNewItemImage(null)
      setNewItemClothe(false)
      fetchMarketItems()
    }
    setButtonLoading(false)
  }

  const handleDeleteItem = async (id: number) => {
    setButtonLoading(true)
    const { error, message } = await deleteMarketItem(id)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Item deleted successfully!')
      fetchMarketItems()
    }
    setButtonLoading(false)
  }

  const handleModifyItem = async (id: number) => {
    const price = parseFloat(editPrice)
    const quantity = parseInt(editQuantity)
    if (!editName || isNaN(price) || isNaN(quantity)) {
      toast.error('Please enter valid name, price, and quantity.')
      return
    }
    setButtonLoading(true)
    const { error, message } = await modifyMarketItem(
      id,
      editName,
      price,
      quantity,
      editImage,
      editClothe
    )
    if (error) {
      toast.error(error)
    } else {
      toast.success('Item modified successfully!')
      setEditingItem(null)
      setEditName('')
      setEditPrice('')
      setEditQuantity('')
      setEditImage(null)
      setEditClothe(false)
      fetchMarketItems()
    }
    setButtonLoading(false)
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEditing: boolean
  ) => {
    if (e.target.files && e.target.files[0]) {
      if (isEditing) {
        setEditImage(e.target.files[0])
      } else {
        setNewItemImage(e.target.files[0])
      }
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'>
      <AdminNavbarComponent />
      <div className='container mx-auto p-6'>
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='text-5xl font-bold mb-12 text-center text-green-400'>
          Market Management
        </motion.h1>

        <div className='grid grid-cols-1 md:grid-cols-1 gap-8'>
          <AddItemCard
            newItemName={newItemName}
            setNewItemName={setNewItemName}
            newItemPrice={newItemPrice}
            setNewItemPrice={setNewItemPrice}
            newItemQuantity={newItemQuantity}
            setNewItemQuantity={setNewItemQuantity}
            newItemClothe={newItemClothe}
            setNewItemClothe={setNewItemClothe}
            handleAddItem={handleAddItem}
            buttonLoading={buttonLoading}
            handleFileChange={handleFileChange}
          />
          <ItemsList
            items={items}
            editingItem={editingItem}
            setEditingItem={setEditingItem}
            editName={editName}
            setEditName={setEditName}
            editPrice={editPrice}
            setEditPrice={setEditPrice}
            editQuantity={editQuantity}
            setEditQuantity={setEditQuantity}
            editClothe={editClothe}
            setEditClothe={setEditClothe}
            handleModifyItem={handleModifyItem}
            handleDeleteItem={handleDeleteItem}
            buttonLoading={buttonLoading}
            handleFileChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  )
}

const AddItemCard = ({
  newItemName,
  setNewItemName,
  newItemPrice,
  setNewItemPrice,
  newItemQuantity,
  setNewItemQuantity,
  newItemClothe,
  setNewItemClothe,
  handleAddItem,
  buttonLoading,
  handleFileChange
}: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className='bg-gray-800 p-6 rounded-2xl hover:shadow-green-500 shadow-lg'>
      <h2 className='text-3xl font-bold mb-6 text-green-400'>Add New Item</h2>
      <div className='space-y-4'>
        <Input
          type='text'
          placeholder='Item Name'
          value={newItemName}
          onChange={(e: any) => setNewItemName(e.target.value)}
        />
        <Input
          type='number'
          placeholder='Item Price'
          value={newItemPrice}
          onChange={(e: any) => setNewItemPrice(e.target.value)}
        />
        <Input
          type='number'
          placeholder='Item Quantity'
          value={newItemQuantity}
          onChange={(e: any) => setNewItemQuantity(e.target.value)}
        />
        <Input type='file' onChange={(e: any) => handleFileChange(e, false)} />
        <div className='flex items-center space-x-2'>
          <input
            type='checkbox'
            checked={newItemClothe}
            onChange={(e) => setNewItemClothe(e.target.checked)}
            className='form-checkbox h-5 w-5 text-green-500'
          />
          <label>Is Clothing Item?</label>
        </div>
        <Button onClick={handleAddItem} disabled={buttonLoading}>
          <FaPlus className='inline mr-2' /> Add Item
        </Button>
      </div>
    </motion.div>
  )
}

const ItemsList = ({
  items,
  editingItem,
  setEditingItem,
  editName,
  setEditName,
  editPrice,
  setEditPrice,
  editQuantity,
  setEditQuantity,
  editClothe,
  setEditClothe,
  handleModifyItem,
  handleDeleteItem,
  buttonLoading,
  handleFileChange
}: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className='bg-gray-800 p-6 hover:shadow-green-400 rounded-2xl shadow-lg'>
      <h2 className='text-3xl font-bold mb-6 text-green-400'>Items List</h2>
      <div className='space-y-4'>
        {items.map((item: any) => (
          <ItemCard
            key={item.id}
            item={item}
            editingItem={editingItem}
            setEditingItem={setEditingItem}
            editName={editName}
            setEditName={setEditName}
            editPrice={editPrice}
            setEditPrice={setEditPrice}
            editQuantity={editQuantity}
            setEditQuantity={setEditQuantity}
            editClothe={editClothe}
            setEditClothe={setEditClothe}
            handleModifyItem={handleModifyItem}
            handleDeleteItem={handleDeleteItem}
            buttonLoading={buttonLoading}
            handleFileChange={handleFileChange}
          />
        ))}
      </div>
    </motion.div>
  )
}

const ItemCard = ({
  item,
  editingItem,
  setEditingItem,
  editName,
  setEditName,
  editPrice,
  setEditPrice,
  editQuantity,
  setEditQuantity,
  editClothe,
  setEditClothe,
  handleModifyItem,
  handleDeleteItem,
  buttonLoading,
  handleFileChange
}: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className='bg-gray-700 hover:bg-green-700 p-4 rounded-xl flex justify-between items-center'>
      {editingItem === item.id ? (
        <div className='w-full space-y-2'>
          <Input
            type='text'
            placeholder='Modify Name'
            value={editName}
            onChange={(e: any) => setEditName(e.target.value)}
          />
          <Input
            type='number'
            placeholder='Modify Price'
            value={editPrice}
            onChange={(e: any) => setEditPrice(e.target.value)}
          />
          <Input
            type='number'
            placeholder='Modify Quantity'
            value={editQuantity}
            onChange={(e: any) => setEditQuantity(e.target.value)}
          />
          <Input type='file' onChange={(e: any) => handleFileChange(e, true)} />
          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              checked={editClothe}
              onChange={(e) => setEditClothe(e.target.checked)}
              className='form-checkbox h-5 w-5 text-green-500'
            />
            <label>Is Clothing Item?</label>
          </div>
          <div className='flex space-x-2'>
            <Button
              onClick={() => handleModifyItem(item.id)}
              disabled={buttonLoading}
              color='green'>
              <FaSave className='inline mr-2' /> Save
            </Button>
            <Button
              onClick={() => setEditingItem(null)}
              disabled={buttonLoading}
              color='red'>
              <FaTimes className='inline mr-2' /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className='flex-grow'>
            <span className='font-semibold'>{item.name}</span> - {item.price} Credits
            <br />
            <span className='text-sm'>Quantity: {item.quantity}</span>
            <br />
            <span className='text-sm'>
              {item.clothe ? 'Clothing Item' : 'Non-Clothing Item'}
            </span>
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className='w-16 h-16 object-cover mt-2 rounded'
              />
            )}
          </div>
          <div className='flex space-x-2'>
            <button
              onClick={() => {
                setEditingItem(item.id)
                setEditName(item.name)
                setEditPrice(item.price.toString())
                setEditQuantity(item.quantity.toString())
                setEditClothe(item.clothe)
              }}
              className='text-2xl'
              disabled={buttonLoading}>
              <FaEdit className='text-yellow-700 hover:text-yellow-600 transition duration-300' />
            </button>
            <button
              onClick={() => handleDeleteItem(item.id)}
              className='text-2xl'
              disabled={buttonLoading}>
              <FaTrash className='text-red-700 hover:text-red-600 transition duration-300' />
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}

const Input = ({ type, placeholder, value, onChange }: any) => (
  <input
    type={type}
    className='w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300'
    placeholder={placeholder}
    value={value}
    onChange={onChange}
  />
)

const Button = ({ onClick, disabled, children, color = 'green' }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full p-3 bg-${color}-500 text-white rounded-lg hover:bg-${color}-600 focus:outline-none focus:ring-2 focus:ring-${color}-400 transition duration-300 ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`}>
    {children}
  </button>
)