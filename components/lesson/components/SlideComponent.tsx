import { Lesson, Module, Slide } from "@/lib/types";
import React, { useEffect } from "react";
import { useLessonNavigation } from "../context/LessonNavigationContext";
import { CaseStudySlide } from "../slides/CaseStudySlide";
import { CoverSlide } from "../slides/CoverSlide";
import { QuizSlide } from "../slides/QuizSlide";
import { TextSlide } from "../slides/TextSlide";
import { VideoSlide } from "../slides/VideoSlide";

export interface SlideComponentProps {
  slide: Slide;
  module: Module;
  lesson: Lesson;
  onNext: () => void;
  onClose?: () => void;
  isActive?: boolean;
}

export function SlideComponent({ slide, onNext, module, lesson, onClose, isActive }: SlideComponentProps) {
  const { setAllowNext } = useLessonNavigation();

  useEffect(() => {
    if (isActive && slide.type !== "quiz" && slide.type !== "case_study") {
      setAllowNext(true);
    }
  }, [isActive, slide.type, setAllowNext]);

  switch (slide.type) {
    case "cover":
      return <CoverSlide slide={slide} module={module} lesson={lesson} onNext={onNext} onClose={onClose} />;
    case "content":
      return <TextSlide slide={slide} />;
    case "video":
      return <VideoSlide slide={slide as any} isActive={isActive} onNext={onNext} />;
    case "quiz":
      return <QuizSlide slide={slide} onNext={onNext} isActive={isActive} />;
    case "case_study":
      return <CaseStudySlide slide={slide} onNext={onNext} isActive={isActive} />;
    default:
      return null;
  }
}
