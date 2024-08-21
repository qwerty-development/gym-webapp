'use client'
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import { RingLoader } from 'react-spinners';

type MessageType = {
  question: string;
  answer?: string;
  loading?: boolean;
  error?: string;
};

type UserDataType = {
  age: number;
  gender: string;
  height: number;
  weight: { value: number }[];
  waist_circumference: { value: number }[];
};

interface ChatBoxProps {
  userData: UserDataType;
}

const ChatBox: React.FC<ChatBoxProps> = ({ userData }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<MessageType[]>(() => {
    const savedMessages = localStorage.getItem('healthChatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('healthChatMessages', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value);
  };

  const debouncedSubmit = debounce(async (currentQuestion: string) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/ask-health', { question: currentQuestion, userData });
      const answer = response.data.answer;
      const clearChat = response.data.clearChat;
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.question === currentQuestion ? { ...msg, answer, loading: false, error: undefined } : msg
        )
      );
      if (clearChat) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching the answer:', error);
      let errorMessage = 'Error fetching the answer. Please try again later.';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          errorMessage = error.response.data.error || 'Too many requests. Please wait a moment before trying again.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      }
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.question === currentQuestion ? { ...msg, loading: false, error: errorMessage } : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }, 1000);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentQuestion = question;
    setMessages([...messages, { question: currentQuestion, loading: true }]);
    setQuestion('');
    debouncedSubmit(currentQuestion);
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem('healthChatMessages');
  };

  return (
    isVisible ? (
      <div className="chat-box bg-gray-700 p-4 rounded-lg shadow-lg text-white">
        <div className="header flex justify-between mb-2">
          <h3 className="text-xl font-bold">Vista</h3>
          <button className="text-red-500 hover:text-red-600" onClick={handleClearChat}>
            Clear Chat
          </button>
        </div>
        <div className="conversation mb-4 h-64 overflow-y-auto" ref={chatContainerRef}>
          {messages.map((msg, index) => (
            <div key={index} className="message-container mb-2">
              <div className="message user-message bg-gray-600 p-2 rounded-md">
                <p><strong>You:</strong> {msg.question}</p>
              </div>
              <div className="message ai-message bg-gray-800 p-2 rounded-md mt-2">
                {msg.loading ? (
                  <RingLoader color="#00BFFF" size={24} />
                ) : msg.error ? (
                  <p className="text-red-500"><strong>Error:</strong> {msg.error}</p>
                ) : (
                  <p><strong>Vista:</strong> {msg.answer}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleFormSubmit} className="input-container flex">
          <input
            type="text"
            value={question}
            onChange={handleQuestionChange}
            placeholder="Ask Vista about your health"
            className="flex-1 p-2 rounded-l-md bg-gray-600 text-white border-none outline-none"
            disabled={loading}
          />
          <button type="submit" className="chat-button bg-green-500 p-2 rounded-r-md text-white hover:bg-green-600" disabled={loading}>
            <FaPaperPlane />
          </button>
        </form>
      </div>
    ) : null
  );
};

export default ChatBox;