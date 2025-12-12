jest.mock('@/src/config/supabaseClient', () => ({
    supabase: {
      auth: {
        signOut: jest.fn(),
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-1' } } },
          error: null,
        }),
        onAuthStateChange: jest.fn(),
        signInWithPassword: jest.fn(),
      },
    },
  }));


  jest.mock('@react-native-async-storage/async-storage', () => {
    return {
      __esModule: true,
      default: {
        getItem: jest.fn(() => Promise.resolve('true')),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
    };
  });
  
  jest.mock('@/src/hooks/useCourseProgress', () => ({
    useCourseProgress: () => ({
      courseProgress: 50,
      lastSlideId: 1,
      modules: [{ last_slide_id: 1, progress: 50 }],
    }),
  }));
  
  const mockClearUserLocalData = jest.fn().mockResolvedValue(true);
  jest.mock('@/src/utils/asyncStorage', () => ({
    clearUserLocalData: mockClearUserLocalData,
  }));
  
  const mockDeleteQuiz = jest.fn().mockResolvedValue(true);
  jest.mock('@/src/services/quizService', () => ({
    quizService: { deleteByCourse: mockDeleteQuiz },
  }));
  
  const mockDeleteSummary = jest.fn().mockResolvedValue(true);
  jest.mock('@/src/services/course_summaries', () => ({
    deleteUserCourseSummary: mockDeleteSummary,
  }));
  
  const mockDeleteChat = jest.fn().mockResolvedValue(true);
  jest.mock('@/src/services/chat_history', () => ({
    chatService: { deleteChatHistory: mockDeleteChat },
  }));
  
  const mockDeleteRating = jest.fn().mockResolvedValue(true);
  jest.mock('@/src/services/main_rating', () => ({
    deleteUsersCourseReting: mockDeleteRating,
  }));
  
  jest.mock('@/src/stores', () => ({
    useAuthStore: () => ({ user: { id: 'user-1' } }),
    useUserProgressStore: () => ({
      resetCourseProgress: jest.fn(),
      fetchUserProgress: jest.fn(),
    }),
  }));
  
  jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn() }),
  }));


// import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CourseCard from './CourseCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course } from '@/src/constants/types/course';
import * as useCourseProgress from '@/src/hooks/useCourseProgress';



// // ==== MOCK COURSE ====

const mockCourse: Course = {
    id: 'course-1',
    title: 'Test Course',
    description: 'Test Description',
    image: 'https://picsum.photos/800/600',
    modules: [{ id: 1 }],
    instructor: 'Test Instructor',
    is_public: true,
    code: 'TEST001',
    contact_email: 'test@example.com',
  };
  


describe('CourseCard - reset progress', () => {
 
    it('shows button if isDeveloper = true and courseProgress > 0', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');
        jest.spyOn(useCourseProgress, 'useCourseProgress').mockReturnValue({
          courseProgress: 50,
          lastSlideId  : '1',
          modules: [{module_id: 'module-1', last_slide_id: '1', progress: 50 }],
        });

        const { findByTestId } = render(<CourseCard course={mockCourse} />);
        const resetBtn = await findByTestId('reset-button');
        expect(resetBtn).toBeTruthy();
    });
    
    it('hides button if isDeveloper = true and courseProgress = 0', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');
        jest.spyOn(useCourseProgress, 'useCourseProgress').mockReturnValue({
          courseProgress: 50,
          lastSlideId  : '1',
          modules: [{module_id: 'module-1', last_slide_id: '1', progress: 0 }],
        });

        const { queryByTestId } = render(<CourseCard course={mockCourse} />);
        await waitFor(() => {
            expect(queryByTestId('reset-button')).toBeNull();
        });
    });
    
    it('hides button if isDeveloper = false and courseProgress = 0', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('false');
        jest.spyOn(useCourseProgress, 'useCourseProgress').mockReturnValue({
          courseProgress: 50,
          lastSlideId  : '1',
          modules: [{module_id: 'module-1', last_slide_id: '1', progress: 0 }],
        });

        const { queryByTestId } = render(<CourseCard course={mockCourse} />);
        await waitFor(() => {
            expect(queryByTestId('reset-button')).toBeNull();
        });
    });
    
    it('hides button if isDeveloper = false and courseProgress > 0', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('false');
        jest.spyOn(useCourseProgress, 'useCourseProgress').mockReturnValue({
          courseProgress: 50,
          lastSlideId  : '1',
          modules: [{module_id: 'module-1', last_slide_id: '1', progress: 50 }],
        });

        const { queryByTestId } = render(<CourseCard course={mockCourse} />);
        await waitFor(() => {
            expect(queryByTestId('reset-button')).toBeNull();
        });
    });

  it('should call all reset functions on reset button press', async () => {
//     const { getByTestId } = render(<CourseCard course={mockCourse} />);

//     const resetBtn = getByTestId('reset-button');

//     fireEvent.press(resetBtn);

//     await waitFor(() => {
//       expect(mockClearUserLocalData).toHaveBeenCalledWith({ keepProgress: true });
//       expect(mockDeleteQuiz).toHaveBeenCalledWith('user-1', 'course-1');
//       expect(mockDeleteSummary).toHaveBeenCalledWith('user-1', 'course-1');
//       expect(mockDeleteChat).toHaveBeenCalledWith('user-1', 'course-1');
//       expect(mockDeleteRating).toHaveBeenCalledWith('user-1', 'course-1');
//     });
  });
});
