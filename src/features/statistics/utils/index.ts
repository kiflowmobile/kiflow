export const computeCourseAvgNum = (courseAverage: number | null | undefined): number => {
  return courseAverage ?? 0;
};

export const computeCombinedAvg = (
  courseAvgNum: number,
  quizAvg: number | null | undefined,
): number | null => {
  if (quizAvg == null || !courseAvgNum) return null;
  return parseFloat(((quizAvg + courseAvgNum) / 2).toFixed(1));
};

export const formatBubbleScore = (
  isLoading: boolean,
  courseAvgNum: number,
  quizAvg: number | null | undefined,
): string => {
  if (isLoading) return '...';
  const combined = computeCombinedAvg(courseAvgNum, quizAvg);
  if (combined != null) return `${combined}`;
  if (courseAvgNum) return courseAvgNum.toFixed(1);
  if (quizAvg != null) return `${quizAvg}`;
  return '0.0';
};

export default { computeCourseAvgNum, computeCombinedAvg, formatBubbleScore };
