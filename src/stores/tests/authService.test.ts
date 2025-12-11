import { useAuthStore } from "../authStore";

const mockSyncProgressToDB = jest.fn().mockResolvedValue(true);
const mockSyncProgressFromDB = jest.fn().mockResolvedValue(true);
jest.mock('../userProgressStore', () => ({
  useUserProgressStore: {
    getState: () => ({
      syncProgressFromDBToLocalStorage: mockSyncProgressFromDB,
      syncProgressToDB: mockSyncProgressToDB, 
    }),
  },
}));

const mockSyncQuizFromDB = jest.fn().mockResolvedValue(true);
const mockSyncQuizToDB = jest.fn().mockResolvedValue(true);
jest.mock('../quizStore', () => ({
  useQuizStore: {
    getState: () => ({
      syncQuizToDB: mockSyncQuizToDB,
      syncQuizFromDBToLocalStorage: mockSyncQuizFromDB,
    }),
  },
}));

const mockSyncChatFromDB = jest.fn().mockResolvedValue(true);
const mockSyncChatToDB = jest.fn().mockResolvedValue(true);
jest.mock('../chatStore', () => ({
  useChatStore: {
    getState: () => ({
      syncChatFromLocalStorageToDB: mockSyncChatToDB,
      syncChatFromDBToLocalStorage: mockSyncChatFromDB,

    }),
  },
}));


const mockSupabaseSignOut = jest.fn().mockResolvedValue({ error: null });
jest.mock('@/src/config/supabaseClient', () => {
  const mockSignOut = jest.fn().mockResolvedValue({ error: null });
  const mockGetSession = jest.fn().mockResolvedValue({
    data: { session: { user: { id: 'user-1' } } },
    error: null,
  });
  const mockOnAuthStateChange = jest.fn().mockReturnValue({ data: null, error: null });

  const mockSignIn = jest.fn().mockResolvedValue({
    data: {
      session: { user: { id: 'user-1', email: 'test@test.com' } },
      user: { id: 'user-1', email: 'test@test.com' },
    },
    error: null,
  });

  return {
    supabase: {
      auth: {
        signOut: mockSignOut,
        getSession: mockGetSession,
        onAuthStateChange: mockOnAuthStateChange,
        signInWithPassword: mockSignIn,
      },
    },
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve(null)),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve(null)),
}));


describe('AuthStore signOut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sync data to DB and clear local storage on signOut', async () => {
    const { signOut, user, isGuest } = useAuthStore.getState();
    useAuthStore.setState({ user: { id: 'user-1' } } as any);

    await signOut();

    expect(mockSyncProgressToDB).toHaveBeenCalled();
    expect(mockSyncQuizToDB).toHaveBeenCalled();
    expect(mockSyncChatToDB).toHaveBeenCalled();
    // expect(mockClearLocal).toHaveBeenCalled();
    // expect(mockSupabaseSignOut).toHaveBeenCalled();

    // Перевірка, що користувач очищений
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isGuest).toBe(true);
  });
  it('should not sync data to DB and clear local storage on signIn', async () => {
    const { signIn } = useAuthStore.getState();

    await signIn('test@test.com', 'password123');

    const state = useAuthStore.getState();
    expect(state.user).toEqual({ id: 'user-1', email: 'test@test.com' });
    expect(mockSyncProgressFromDB).toHaveBeenCalled();
    expect(mockSyncQuizFromDB).toHaveBeenCalled();
    expect(mockSyncChatFromDB).toHaveBeenCalled();

  })
});