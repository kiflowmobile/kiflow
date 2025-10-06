export interface Criteria {
    module_id: string;
    id: string;
    course_id: string;
    name: string;
    key: string;
    description: string;
    average_score?: number; // додаємо опційне поле

  }