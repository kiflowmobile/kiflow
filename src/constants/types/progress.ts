interface ModuleProgress {
    module_id: string;
    progress: number;
    last_slide_id: string | null;
  }
  
  
export interface UserCourseSummary {
    course_id: string;
    progress: number;
    last_slide_id?: string | null; 
    modules: ModuleProgress[];
  }