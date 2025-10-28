import { useEffect } from "react";
import { useUserProgressStore } from "../stores";
import { useQuizStore } from "../stores/quizStore";
import { useChatStore } from "../stores/chatStore";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";


export const useSaveProgressOnExit = () => {
  console.log('useSaveProgressOnExit')
  const syncProgressToDB = useUserProgressStore(state => state.syncProgressToDB);
  const syncQuizToDB = useQuizStore(state => state.syncQuizToDB);
  const syncChatFromLocalStorageToDB = useChatStore(state => state.syncChatFromLocalStorageToDB);

  useEffect(() => {
    const syncAll = async () => {
      try {
        await syncProgressToDB();
        await syncQuizToDB();
        await syncChatFromLocalStorageToDB();
        console.log("✅ All data synced successfully (app background or exit)");
      } catch (error) {
        console.log("❌ Error syncing data:", error);
      }
    };

    const subscription = AppState.addEventListener("change", (state) => {
       AsyncStorage.setItem('background', state);

      if (state === "background" || state === "inactive") {
        syncAll();
      }
    });

    return () => subscription.remove();
  }, [syncProgressToDB, syncQuizToDB, syncChatFromLocalStorageToDB]);
};