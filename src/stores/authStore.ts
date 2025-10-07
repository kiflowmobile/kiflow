import { supabase } from '@/src/config/supabaseClient';
import { upsertUserProfile } from '@/src/services/users';
import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { useUserProgressStore } from './userProgressStore';
// import { devtools } from 'zustand/middleware';

interface AuthState {
  // Стан
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean | null;
  error: string | null;
  
  // Дії
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
  getUserRole: () => Promise<string | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Внутрішні дії
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  // devtools(
    (set, get) => ({
      // Початковий стан
      user: null,
      session: null,
      isLoading: true,
      isGuest: null,
      error: null,

      // Дії
      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          const isGuest = !data.session || !data.session.user || data.session.user.is_anonymous;
          set({ 
            user: data.user, 
            session: data.session, 
            isGuest,
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Sign in failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, firstName?: string, lastName?: string) => {
        set({ isLoading: true, error: null });
      
        try {
          // 1️⃣ Реєстрація користувача
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: firstName && lastName ? `${firstName} ${lastName}` : null,
                first_name: firstName || null,
                last_name: lastName || null,
                role: 'user',
              },
            },
          });
      
          if (error) throw error;
      
          if (!data.user) throw new Error('User not created');
      
          // 2️⃣ Створюємо профіль
          await upsertUserProfile(data.user.id, {
            email: data.user.email || email,
            full_name: firstName && lastName ? `${firstName} ${lastName}` : null,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
          });
      
          // 3️⃣ Отримуємо всі курси
          // const { data: courses, error: coursesError } = await supabase
          //   .from('courses')
          //   .select('id');
      
          // if (coursesError) throw coursesError;
      
          // 4️⃣ Отримуємо всі модулі
          // const { data: modules, error: modulesError } = await supabase
          //   .from('modules')
          //   .select('id, course_id');
      
          // if (modulesError) throw modulesError;
      
          // 5️⃣ Формуємо записи для user_course_summaries
          // const progressRows = (courses || []).map(course => ({
          //   user_id: data.user!.id,
          //   course_id: course.id,
          //   progress: 0,
          //   last_slide_id: null,
          //   modules: (modules || [])
          //     .filter(m => m.course_id === course.id)
          //     .map(m => ({ module_id: m.id, progress: 0, last_slide_id: null })),
          // }));
      
          // 6️⃣ Вставляємо прогрес у БД
          // if (progressRows.length > 0) {
          //   const { error: insertError } = await supabase
          //     .from('user_course_summaries')
          //     .upsert(progressRows, { onConflict: 'user_id,course_id' }); // <-- рядок, не масив
      
          //   if (insertError) throw insertError;
          // }
      
          // 7️⃣ Встановлюємо стан
          const isGuest = !data.session || !data.session.user || data.session.user.is_anonymous;
          set({
            user: data.user,
            session: data.session,
            isGuest,
            isLoading: false,
          });
      
        } catch (error: any) {
          set({
            error: error.message || 'Sign up failed',
            isLoading: false,
          });
          throw error;
        }
      },
      
      
      
      

      signOut: async () => {
        set({ isLoading: true, error: null });
        try {
          // Спочатку перевіряємо, чи є активна сесія
          // const { data: sessionData } = await supabase.auth.getSession();



          // Якщо сесії не існує, повертаємо успіх без спроби виходу
          // if (!sessionData?.session) {
          //   set({ 
          //     user: null, 
          //     session: null, 
          //     isGuest: true, 
          //     isLoading: false 
          //   });
          //   return;
          // }
          await useUserProgressStore.getState().syncProgressToDB();



          // Продовжуємо з signOut, якщо у нас є сесія
          // const { error } = await supabase.auth.signOut();
          // if (error) throw error;
          
          // set({ 
          //   user: null, 
          //   session: null, 
          //   isGuest: true, 
          //   isLoading: false 
          // });
        } catch (error: any) {
          console.error('Error during signOut:', error);
          set({ 
            error: error.message || 'Sign out failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          // Очищаємо будь-яку існуючу сесію
          await supabase.auth.signOut();

          // Запускаємо OAuth потік
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
          });

          if (error) throw error;

          // Чекаємо трохи, щоб упевнитися, що у нас є сесія
          const checkSession = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            return sessionData?.session;
          };

          // Повторюємо кілька разів, щоб отримати сесію
          let session = null;
          let attempts = 0;
          const maxAttempts = 5;

          while (!session && attempts < maxAttempts) {
            session = await checkSession();
            if (!session) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              attempts++;
            }
          }

          const isGuest = !session || !session.user || session.user.is_anonymous;
          set({ 
            user: session?.user || null, 
            session, 
            isGuest,
            isLoading: false 
          });
        } catch (error: any) {
          console.error('Error signing in with Google:', error);
          set({ 
            error: error.message || 'Google sign in failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      checkSession: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          const isGuest = !data.session || !data.session.user || data.session.user.is_anonymous;
          
          set({ 
            user: data.session?.user || null, 
            session: data.session, 
            isGuest,
            isLoading: false 
          });
        } catch (error: any) {
          console.error('❌ AuthStore: Error getting session:', error);
          set({ 
            user: null, 
            session: null, 
            isGuest: true, 
            isLoading: false,
            error: error.message || 'Session check failed'
          });
        }
      },

      getUserRole: async () => {
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user) return null;
          return user.user_metadata?.role || 'user';
        } catch (error) {
          console.error('Error getting user role:', error);
          return null;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          // Отримуємо поточного користувача
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user || !user.email) {
            throw new Error('Користувач не автентифікований');
          }

          // Перевіряємо поточний пароль через повторний вхід
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
          });

          if (signInError) {
            throw new Error('Неправильний поточний пароль');
          }

          // Оновлюємо пароль
          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
          });

          if (updateError) throw updateError;

          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Не вдалося змінити пароль', 
            isLoading: false 
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      // Внутрішні дії
      setUser: (user: User | null) => set({ user }),
      setSession: (session: Session | null) => set({ session }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
    })
    // ,{
    //   name: 'auth-store',
    // }
  // )
);

// Ініціалізуємо слухача стану автентифікації
supabase.auth.onAuthStateChange((event, session) => {
  const { setUser, setSession, setLoading } = useAuthStore.getState();
  
  if (session && session.user && !session.user.is_anonymous) {
    setUser(session.user);
    setSession(session);
    useAuthStore.setState({ isGuest: false });
  } else {
    setUser(null);
    setSession(null);
    useAuthStore.setState({ isGuest: true });
  }
  
  setLoading(false);
});
