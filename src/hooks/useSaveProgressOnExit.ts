import { useCallback, useEffect } from "react";
import { useUserProgressStore } from "../stores";
import { useQuizStore } from "../stores/quizStore";
import { useChatStore } from "../stores/chatStore";
import { useFocusEffect, useNavigation } from "expo-router";

export const useSaveProgressOnLeave = () => {
  console.log('useSaveProgressOnLeave')
  const syncProgressToDB = useUserProgressStore(state => state.syncProgressToDB);
  const syncQuizToDB = useQuizStore(state => state.syncQuizToDB);
  const syncChatFromLocalStorageToDB = useChatStore(state => state.syncChatFromLocalStorageToDB);

  useFocusEffect(
    useCallback(() => {
      return () => {
        syncProgressToDB();
        syncQuizToDB();
        syncChatFromLocalStorageToDB();
      };
    }, [])
  );
};