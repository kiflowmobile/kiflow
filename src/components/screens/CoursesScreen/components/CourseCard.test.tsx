// src/components/screens/CoursesScreen/components/CourseCard.test.tsx

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as useCourseProgress from '@/src/hooks/useCourseProgress';
import type { Course } from '@/src/constants/types/course';

// ======= МОКИ =======
const mockDeleteQuiz = jest.fn().mockResolvedValue(true);
const mockDeleteSummary = jest.fn().mockResolvedValue(true);
const mockDeleteChat = jest.fn().mockResolvedValue(true);
const mockDeleteRating = jest.fn().mockResolvedValue(true);
const mockClearUserLocalData = jest.fn().mockResolvedValue(true);
const mockResetCourseProgress = jest.fn().mockResolvedValue(true);

// Named export мок з __esModule
jest.mock('@/src/utils/asyncStorage', () => ({
  __esModule: true,                  // обов’язково для named exports
  clearUserLocalData: jest.fn(() => Promise.resolve(true)),
}));


jest.mock('@/src/services/quizService', () => ({
  __esModule: true,
  quizService: { deleteByCourse: jest.fn().mockResolvedValue(true) },
}));


jest.mock('@/src/services/course_summaries', () => ({
  __esModule: true,
  deleteUserCourseSummary: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/src/services/chat_history', () => ({
  __esModule: true,
  chatService: {
    deleteChatHistory: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('@/src/services/main_rating', () => ({
  __esModule: true,
  deleteUsersCourseReting: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/src/stores', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
  useUserProgressStore: () => ({
    resetCourseProgress: mockResetCourseProgress,
    fetchUserProgress: jest.fn(),
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve('true')),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock('@/src/hooks/useCourseProgress', () => ({
  useCourseProgress: jest.fn(() => ({
    courseProgress: 50,
    lastSlideId: 1,
    modules: [{ last_slide_id: 1, progress: 50 }],
  })),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

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

// ======= Імпорт компонента після моків =======
import CourseCard from './CourseCard';
import { clearUserLocalData } from '@/src/utils/asyncStorage';
import { deleteUsersCourseReting } from '@/src/services/main_rating';
import { deleteUserCourseSummary } from '@/src/services/course_summaries';
import { chatService } from '@/src/services/chat_history';
import { quizService } from '@/src/services/quizService';

// ======= MOCK COURSE =======
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows button if isDeveloper = true and courseProgress > 0', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');
    (useCourseProgress.useCourseProgress as jest.Mock).mockReturnValue({
      courseProgress: 50,
      lastSlideId: '1',
      modules: [{ module_id: 'module-1', last_slide_id: '1', progress: 50 }],
    });

    const { findByTestId } = render(<CourseCard course={mockCourse} />);
    const resetBtn = await findByTestId('reset-button');
    expect(resetBtn).toBeTruthy();
  });

  it('hides button if isDeveloper = true and courseProgress = 0', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');
    (useCourseProgress.useCourseProgress as jest.Mock).mockReturnValue({
      courseProgress: 50,
      lastSlideId: '1',
      modules: [{ module_id: 'module-1', last_slide_id: '1', progress: 0 }],
    });

    const { queryByTestId } = render(<CourseCard course={mockCourse} />);
    await waitFor(() => {
      expect(queryByTestId('reset-button')).toBeNull();
    });
  });

  it('hides button if isDeveloper = false and courseProgress = 0', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('false');
    (useCourseProgress.useCourseProgress as jest.Mock).mockReturnValue({
      courseProgress: 50,
      lastSlideId: '1',
      modules: [{ module_id: 'module-1', last_slide_id: '1', progress: 0 }],
    });

    const { queryByTestId } = render(<CourseCard course={mockCourse} />);
    await waitFor(() => {
      expect(queryByTestId('reset-button')).toBeNull();
    });
  });

  it('calls all reset-related services on reset button press', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');
    (useCourseProgress.useCourseProgress as jest.Mock).mockReturnValue({
      courseProgress: 50,
      lastSlideId: '1',
      modules: [{ module_id: 'module-1', last_slide_id: '1', progress: 50 }],
    });

    const { findByTestId } = render(<CourseCard course={mockCourse} />);
    const resetBtn = await findByTestId('reset-button');

    await act(async () => {
      fireEvent.press(resetBtn);
    });

    await waitFor(() => {
      expect(clearUserLocalData).toHaveBeenCalledWith({ keepProgress: true });
      expect(quizService.deleteByCourse).toHaveBeenCalledWith('user-1', 'course-1');
      expect(mockResetCourseProgress).toHaveBeenCalledWith('course-1');
      expect(deleteUserCourseSummary).toHaveBeenCalledWith('user-1', 'course-1');
      expect(chatService.deleteChatHistory).toHaveBeenCalledWith('user-1', 'course-1');
      expect(deleteUsersCourseReting).toHaveBeenCalledWith('user-1', 'course-1');
    });
  });
});
