// WalletContext.tsx
'use client'
import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode
} from 'react'
import { getWalletBalance } from '../../../../utils/userRequests'
import { supabaseClient } from '../../../../utils/supabaseClient'
import { useAuth } from '@clerk/nextjs'

interface WalletContextType {
	walletBalance: number | null
	userTokens: any
	refreshWalletBalance: () => void
	refreshTokens: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider = ({ children }: { children: ReactNode }) => {
	const [walletBalance, setWalletBalance] = useState<number | null>(null)
	const [userTokens, setUserTokens] = useState<any>(null)
	const { userId, isSignedIn } = useAuth()

	const refreshWalletBalance = async () => {
		if (isSignedIn && userId) {
			try {
				const balance = await getWalletBalance({ userId })
				setWalletBalance(balance)
			} catch (error) {
				console.error('Error fetching wallet balance:', error)
				setWalletBalance(null)
			}
		} else {
			setWalletBalance(null)
		}
	}

	const refreshTokens = async () => {
		if (isSignedIn && userId) {
			try {
				const supabase = await supabaseClient()
				const { data, error } = await supabase
					.from('users')
					.select(
						'private_token, semiPrivate_token, public_token, workoutDay_token, shake_token'
					)
					.eq('user_id', userId)
					.single()

				if (error) throw error
				setUserTokens(data)
			} catch (error) {
				console.error('Error fetching user tokens:', error)
				setUserTokens(null)
			}
		} else {
			setUserTokens(null)
		}
	}

	useEffect(() => {
		refreshWalletBalance()
		refreshTokens()
	}, [isSignedIn, userId])

	return (
		<WalletContext.Provider
			value={{
				walletBalance,
				userTokens,
				refreshWalletBalance,
				refreshTokens
			}}>
			{children}
		</WalletContext.Provider>
	)
}

export const useWallet = () => {
	const context = useContext(WalletContext)
	if (!context) {
		throw new Error('useWallet must be used within a WalletProvider')
	}
	return context
}
