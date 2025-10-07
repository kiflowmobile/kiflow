import { useEffect } from "react";
import { useUserProgressStore } from "../stores";

export const useSaveProgressOnExit = () => {
    const syncProgressToDB = useUserProgressStore(state => state.syncProgressToDB);
  
    useEffect(() => {
      return () => {
        syncProgressToDB();
      };
    }, []);
  };
  