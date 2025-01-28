import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import debounce from 'lodash.debounce'
import { FaPaperPlane, FaExpandAlt, FaCompressAlt } from 'react-icons/fa'
import { RingLoader } from 'react-spinners'

type MessageType = {
  question: string
  answer?: string
  loading?: boolean
  error?: string
}

type UserDataType = {
  age: number
  gender: string
  height: number
  weight: { value: number }[]
  waist_circumference: { value: number }[]
}

interface ChatBoxProps {
  userData: UserDataType
}

const ChatBox: React.FC<ChatBoxProps> = ({ userData }) => {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<MessageType[]>(() => {
    const savedMessages = localStorage.getItem('healthChatMessages')
    return savedMessages ? JSON.parse(savedMessages) : []
  })
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('healthChatMessages', JSON.stringify(messages))
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value)
  }

  const debouncedSubmit = debounce(async (currentQuestion: string) => {
    setLoading(true)
    try {
      const response = await axios.post('/api/ask-health', {
        question: currentQuestion,
        userData
      })
      const answer = response.data.answer
      const clearChat = response.data.clearChat
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.question === currentQuestion
            ? { ...msg, answer, loading: false, error: undefined }
            : msg
        )
      )
      if (clearChat) {
        setMessages([])
      }
    } catch (error) {
      console.error('Error fetching the answer:', error)
      let errorMessage = 'Error fetching the answer. Please try again later.'
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          errorMessage =
            error.response.data.error ||
            'Too many requests. Please wait a moment before trying again.'
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        }
      }
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.question === currentQuestion
            ? { ...msg, loading: false, error: errorMessage }
            : msg
        )
      )
    } finally {
      setLoading(false)
    }
  }, 1000)

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return
    const currentQuestion = question
    setMessages([...messages, { question: currentQuestion, loading: true }])
    setQuestion('')
    debouncedSubmit(currentQuestion)
  }

  const handleClearChat = () => {
    setMessages([])
    localStorage.removeItem('healthChatMessages')
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div 
      className={`
        fixed bottom-4 right-4 flex flex-col bg-gray-900 rounded-lg shadow-xl border border-gray-700 
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-3/4 h-3/4' : 'w-96 h-96'}
      `}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <h3 className="text-xl font-bold text-green-400 transform transition-transform duration-200 hover:scale-105">
          Talk to Vista, your personal assistant!
        </h3>
        <div className="flex space-x-4">
          <button
            onClick={handleClearChat}
            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors duration-200"
          >
            Clear Chat
          </button>
          <button
            onClick={toggleExpand}
            className="text-green-400 hover:text-green-300 transition-colors duration-200"
          >
            {isExpanded ? <FaCompressAlt /> : <FaExpandAlt />}
          </button>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scroll-smooth"
      >
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className="space-y-2 animate-fade-in"
          >
            <div className="flex flex-col max-w-3/4 ml-auto transform transition-all duration-200 hover:scale-102">
              <div className="bg-gray-700 text-white px-4 py-2 rounded-lg">
                <p className="text-sm">{msg.question}</p>
              </div>
            </div>

            <div className="flex flex-col max-w-3/4 transform transition-all duration-200 hover:scale-102">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-lg">
                {msg.loading ? (
                  <div className="flex justify-center">
                    <RingLoader color="#00BFFF" size={24} />
                  </div>
                ) : msg.error ? (
                  <p className="text-red-400 text-sm">{msg.error}</p>
                ) : (
                  <p className="text-sm">{msg.answer}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-gray-700">
        <form onSubmit={handleFormSubmit} className="flex space-x-2">
          <input
            type="text"
            value={question}
            onChange={handleQuestionChange}
            placeholder="Ask Vista about your health..."
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 
                     focus:outline-none focus:border-green-500 transition-all duration-200
                     transform hover:scale-101"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                     transform hover:scale-105 active:scale-95"
          >
            <FaPaperPlane className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatBox