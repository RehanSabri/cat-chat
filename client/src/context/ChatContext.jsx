import { createContext, useContext, useReducer, useCallback } from 'react';

const ChatContext = createContext(null);

const initialState = {
  chatStatus: 'idle', // 'idle' | 'connecting' | 'chatting' | 'disconnected'
  messages: [],
  roomId: null,
  mode: 'text',
  interests: [],
  isReportModalOpen: false,
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, chatStatus: action.payload };
    case 'SET_ROOM':
      return { ...state, roomId: action.payload };
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_INTERESTS':
      return { ...state, interests: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'TOGGLE_REPORT_MODAL':
      return { ...state, isReportModalOpen: !state.isReportModalOpen };
    case 'CLOSE_REPORT_MODAL':
      return { ...state, isReportModalOpen: false };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const setStatus = useCallback((status) => {
    dispatch({ type: 'SET_STATUS', payload: status });
  }, []);

  const setRoom = useCallback((roomId) => {
    dispatch({ type: 'SET_ROOM', payload: roomId });
  }, []);

  const setMode = useCallback((mode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const setInterests = useCallback((interests) => {
    dispatch({ type: 'SET_INTERESTS', payload: interests });
  }, []);

  const addMessage = useCallback((message) => {
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: Date.now() + Math.random(),
        timestamp: new Date(),
        ...message,
      },
    });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  const toggleReportModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_REPORT_MODAL' });
  }, []);

  const closeReportModal = useCallback(() => {
    dispatch({ type: 'CLOSE_REPORT_MODAL' });
  }, []);

  const resetChat = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = {
    ...state,
    setStatus,
    setRoom,
    setMode,
    setInterests,
    addMessage,
    clearMessages,
    toggleReportModal,
    closeReportModal,
    resetChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
