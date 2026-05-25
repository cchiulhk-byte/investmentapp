import React, { useState, useEffect } from "react";
import { api } from "../api";

interface LessonMeta {
  id: string;
  title: string;
  category: string;
  reading_time: string;
  summary: string;
  completed: boolean;
  quiz_score: number;
}

interface LessonDetail extends LessonMeta {
  content: string;
  interactive_exercise: {
    type: string;
    instruction: string;
    placeholder: string;
    answer: string;
    explanation: string;
  };
  quiz: {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
  }[];
}

export const Academy: React.FC = () => {
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  
  // Interactive Exercise State
  const [exerciseInput, setExerciseInput] = useState<string>("");
  const [exerciseSuccess, setExerciseSuccess] = useState<boolean>(false);
  const [exerciseFeedback, setExerciseFeedback] = useState<string | null>(null);

  // Quiz Engine State
  const [quizMode, setQuizMode] = useState<boolean>(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizAnswersSubmitted, setQuizAnswersSubmitted] = useState<boolean>(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Fetch all lessons metadata
  const loadLessons = async () => {
    try {
      const list = await api.getLessons();
      setLessons(list);
    } catch (e) {
      console.error("Error loading courses list:", e);
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  // Fetch lesson full details on click
  const handleSelectLesson = async (id: string) => {
    try {
      const detail = await api.getLessonDetail(id);
      setLessonDetail(detail);
      setActiveLessonId(id);
      // Reset lesson interactive exercise/quiz states
      setExerciseInput("");
      setExerciseSuccess(false);
      setExerciseFeedback(null);
      setQuizMode(false);
      setCurrentQuestionIdx(0);
      setSelectedOption(null);
      setQuizAnswersSubmitted(false);
      setCorrectAnswersCount(0);
      setQuizFinished(false);
    } catch (e) {
      alert("Failed to load course detail: " + e);
    }
  };

  // Validate Interactive Exercise Input
  const handleValidateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonDetail) return;
    
    const ans = lessonDetail.interactive_exercise.answer.trim().toLowerCase();
    const input = exerciseInput.trim().toLowerCase();
    
    if (input === ans) {
      setExerciseSuccess(true);
      setExerciseFeedback(`[✓] ${lessonDetail.interactive_exercise.explanation}`);
    } else {
      setExerciseSuccess(false);
      setExerciseFeedback(`[-] Incorrect. Review the math in the reading above and try again!`);
    }
  };

  // Submit current quiz answer
  const handleSubmitQuizAnswer = () => {
    if (selectedOption === null || !lessonDetail) return;
    
    const q = lessonDetail.quiz[currentQuestionIdx];
    const isCorrect = selectedOption === q.correct_index;
    
    if (isCorrect) {
      setCorrectAnswersCount(correctAnswersCount + 1);
    }
    
    setQuizAnswersSubmitted(true);
  };

  // Proceed to next question or end quiz
  const handleNextQuestion = async () => {
    if (!lessonDetail) return;
    
    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < lessonDetail.quiz.length) {
      setCurrentQuestionIdx(nextIdx);
      setSelectedOption(null);
      setQuizAnswersSubmitted(false);
    } else {
      // Quiz completed! Save progress to server
      const finalScore = correctAnswersCount;
      const isPassed = finalScore >= 2; // Pass rate: 2/3 correct
      
      try {
        await api.submitQuizScore(lessonDetail.id, finalScore, isPassed);
        setQuizFinished(true);
        loadLessons(); // reload lists to update indicators
      } catch (err: any) {
        alert("Failed to save progress: " + err.message);
      }
    }
  };

  // Return badge name based on lesson id
  const getAccoladeBadge = (id: string) => {
    switch (id) {
      case "lesson_1": return "Market Arbitrageur";
      case "lesson_2": return "Risk Guardian";
      case "lesson_3": return "Crypto Nomad";
      case "lesson_4": return "Compounding Master";
      case "lesson_5": return "Index Strategist";
      case "lesson_6": return "Frontier Architect";
      case "lesson_7": return "Chart Whisperer";
      default: return "Apex Scholar";
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: "1100px", margin: "0 auto" }}>
      
      {/* CASE A: LIST VIEW SHELF */}
      {!activeLessonId && (
        <div>
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "8px", letterSpacing: "-0.02em" }}>Apex Investment Academy</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", marginBottom: "16px", lineHeight: "1.5" }}>
              Investments require both capital and operational knowledge. Work through our micro-courses and complete the quizzes to acquire real quantitative skills.
            </p>
            <div style={{ display: "flex", gap: "16px", fontSize: "0.8rem" }}>
              <span style={{ color: "var(--color-up)", fontWeight: "600" }}>
                {lessons.filter(l => l.completed).length}/{lessons.length} Completed
              </span>
              <span style={{ color: "var(--color-text-muted)" }}>|</span>
              <span style={{ color: "var(--color-text-muted)" }}>
                {lessons.filter(l => !l.completed).length} remaining
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "18px" }}>
            {lessons.map((l) => (
              <div
                key={l.id}
                onClick={() => handleSelectLesson(l.id)}
                className={`premium-card lesson-card ${l.completed ? "completed" : ""}`}
                style={{ display: "flex", flexDirection: "column", gap: "10px", justifyContent: "space-between" }}
              >
                <div>
                  <div className="flex-between" style={{ marginBottom: "8px" }}>
                    <span className="lesson-badge">{l.category}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>⏱ {l.reading_time}</span>
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "6px" }}>{l.title}</h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>{l.summary}</p>
                </div>

                <div className="flex-between" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", marginTop: "8px" }}>
                  {l.completed ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="lesson-badge complete" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>PASS PASSED</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-up)" }}>Quiz Score: {l.quiz_score}/3</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>Status: Not Started</span>
                  )}
                  <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--color-accent)", display: "flex", alignItems: "center", gap: "2px" }}>
                    Study Lesson →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CASE B: SINGLE LESSON READER OR QUIZ PORTAL */}
      {activeLessonId && lessonDetail && (
        <div className="premium-card" style={{ padding: "30px" }}>
          
          {/* Header navigation bar */}
          <div className="flex-between" style={{ marginBottom: "20px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px" }}>
            <button
              onClick={() => { setActiveLessonId(null); setLessonDetail(null); }}
              className="nav-item"
              style={{ border: "1px solid var(--border-subtle)", fontSize: "0.8rem", padding: "6px 12px" }}
            >
              ← Back to Academy Course Shelf
            </button>
            <span className="lesson-badge">{lessonDetail.category}</span>
          </div>

          {/* ACTIVE PORT: READING MODE */}
          {!quizMode && (
            <div className="fade-in">
              <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "6px" }}>{lessonDetail.title}</h2>
              <div style={{ display: "flex", gap: "12px", fontSize: "0.78rem", color: "var(--color-text-muted)", marginBottom: "20px" }}>
                <span>⏱ {lessonDetail.reading_time} reading</span>
                <span>•</span>
                <span>Badge award: <strong>{getAccoladeBadge(lessonDetail.id)}</strong></span>
              </div>

              {/* Course Markdown Content Renderer */}
              <div
                className="lesson-markdown-body"
                style={{ fontSize: "0.92rem", lineHeight: "1.6", color: "var(--color-text-primary)" }}
                dangerouslySetInnerHTML={{
                  __html: lessonDetail.content
                    .replace(/\n### (.*)/g, '<h3 style="font-size: 1.15rem; margin: 24px 0 10px 0; color: var(--color-accent); font-weight:700;">$1</h3>')
                    .replace(/\n\* \*\*(.*?)\*\*(.*)/g, '<li style="margin-left: 20px; margin-bottom: 8px;"><strong>$1</strong>$2</li>')
                    .replace(/\n\*(.*)/g, '<li style="margin-left: 20px; margin-bottom: 8px;">$1</li>')
                    .replace(/\n\n/g, '<p style="margin-bottom: 14px;"></p>')
                }}
              />

              {/* 3. INTERACTIVE LAB CHECKPOINT EXERCISE */}
              <div
                style={{
                  marginTop: "30px", padding: "20px", borderRadius: "var(--radius-lg)",
                  backgroundColor: "rgba(59, 130, 246, 0.03)", border: "1px solid var(--border-focus)",
                }}
              >
                <h4 style={{ color: "var(--color-accent)", fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                  💡 Quantitative Checkpoint
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.4" }}>
                  {lessonDetail.interactive_exercise.instruction}
                </p>

                <form onSubmit={handleValidateExercise} style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ flex: 1, height: "40px" }}
                    placeholder={lessonDetail.interactive_exercise.placeholder}
                    value={exerciseInput}
                    onChange={(e) => setExerciseInput(e.target.value)}
                    disabled={exerciseSuccess}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ height: "40px", padding: "0 20px" }}
                    disabled={exerciseSuccess}
                  >
                    Check Calculations
                  </button>
                </form>

                {exerciseFeedback && (
                  <div
                    style={{
                      marginTop: "12px", padding: "10px", borderRadius: "var(--radius-sm)", fontSize: "0.8rem",
                      border: "1px solid",
                      backgroundColor: exerciseSuccess ? "var(--color-up-bg)" : "var(--color-down-bg)",
                      borderColor: exerciseSuccess ? "var(--color-up)" : "var(--color-down)",
                      color: exerciseSuccess ? "var(--color-up)" : "var(--color-down)"
                    }}
                  >
                    {exerciseFeedback}
                  </div>
                )}
              </div>

              {/* Unlock Quiz Controls */}
              <div style={{ marginTop: "30px", borderTop: "1px solid var(--border-subtle)", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-success"
                  onClick={() => setQuizMode(true)}
                  disabled={!exerciseSuccess}
                  style={{
                    padding: "12px 28px", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  {exerciseSuccess ? "Unlock Lesson Quiz →" : "🔒 Complete Checkpoint to Unlock Quiz"}
                </button>
              </div>

            </div>
          )}

          {/* ACTIVE PORT: QUIZ ENGINE ACTIVE */}
          {quizMode && !quizFinished && (
            <div className="fade-in">
              <div className="flex-between" style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
                  Question {currentQuestionIdx + 1} of {lessonDetail.quiz.length}
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  {lessonDetail.quiz.map((_, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-block", width: "16px", height: "6px", borderRadius: "3px",
                        backgroundColor: idx === currentQuestionIdx ? "var(--color-accent)" : (idx < currentQuestionIdx ? "var(--color-up)" : "var(--border-subtle)")
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Question text */}
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "20px", lineHeight: "1.4" }}>
                {lessonDetail.quiz[currentQuestionIdx].question}
              </h3>

              {/* Options list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                {lessonDetail.quiz[currentQuestionIdx].options.map((opt, i) => {
                  const q = lessonDetail.quiz[currentQuestionIdx];
                  const isSelected = selectedOption === i;
                  
                  let borderStyle = "1px solid var(--border-subtle)";
                  let bgStyle = "rgba(255,255,255,0.01)";
                  let txtColor = "var(--color-text-primary)";
                  
                  if (isSelected) {
                    borderStyle = "1px solid var(--color-accent)";
                    bgStyle = "var(--color-accent-bg)";
                  }
                  
                  // Color indicators after submit
                  if (quizAnswersSubmitted) {
                    if (i === q.correct_index) {
                      borderStyle = "1px solid var(--color-up)";
                      bgStyle = "var(--color-up-bg)";
                      txtColor = "var(--color-up)";
                    } else if (isSelected && i !== q.correct_index) {
                      borderStyle = "1px solid var(--color-down)";
                      bgStyle = "var(--color-down-bg)";
                      txtColor = "var(--color-down)";
                    }
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={quizAnswersSubmitted}
                      onClick={() => setSelectedOption(i)}
                      style={{
                        padding: "12px 16px", borderRadius: "var(--radius-md)", border: borderStyle,
                        backgroundColor: bgStyle, color: txtColor, textAlign: "left", fontSize: "0.9rem",
                        cursor: quizAnswersSubmitted ? "not-allowed" : "pointer", fontWeight: "500", transition: "all 0.2s"
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanation box on submit */}
              {quizAnswersSubmitted && (
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)", padding: "16px", marginBottom: "24px"
                  }}
                >
                  <strong style={{ fontSize: "0.85rem", color: selectedOption === lessonDetail.quiz[currentQuestionIdx].correct_index ? "var(--color-up)" : "var(--color-down)", display: "block", marginBottom: "4px" }}>
                    {selectedOption === lessonDetail.quiz[currentQuestionIdx].correct_index ? "✓ Correct!" : "⚠️ Incorrect Response"}
                  </strong>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                    {lessonDetail.quiz[currentQuestionIdx].explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {!quizAnswersSubmitted ? (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={selectedOption === null}
                    onClick={handleSubmitQuizAnswer}
                    style={{ padding: "10px 24px" }}
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-success"
                    onClick={handleNextQuestion}
                    style={{ padding: "10px 24px" }}
                  >
                    {currentQuestionIdx + 1 === lessonDetail.quiz.length ? "Finish & Grade Quiz" : "Next Question →"}
                  </button>
                )}
              </div>

            </div>
          )}

          {/* ACTIVE PORT: QUIZ FINISHED PORTAL */}
          {quizFinished && (
            <div className="fade-in" style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  width: "72px", height: "72px", borderRadius: "50%", margin: "0 auto 16px auto",
                  backgroundColor: correctAnswersCount >= 2 ? "var(--color-up-bg)" : "var(--color-down-bg)",
                  border: `3px solid ${correctAnswersCount >= 2 ? "var(--color-up)" : "var(--color-down)"}`,
                  display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center",
                  fontSize: "1.6rem", fontWeight: "800"
                }}
              >
                🏆
              </div>

              <h2 style={{ fontSize: "1.4rem", fontWeight: "800", marginBottom: "8px" }}>
                {correctAnswersCount >= 2 ? "Course Completed!" : "Quiz Failed"}
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", maxWidth: "450px", margin: "0 auto 20px auto", lineHeight: "1.4" }}>
                {correctAnswersCount >= 2
                  ? `Congratulations! You scored ${correctAnswersCount}/3 on the quiz and passed this lesson. You have unlocked the achievement badge award!`
                  : `You scored ${correctAnswersCount}/3 on this quiz. A minimum score of 2/3 is required to pass. Study the material again to retake and unlock badges.`
                }
              </p>

              {correctAnswersCount >= 2 && (
                <div
                  style={{
                    maxWidth: "280px", margin: "0 auto 24px auto", padding: "14px", borderRadius: "var(--radius-lg)",
                    border: "1px dashed var(--color-warning)", backgroundColor: "var(--color-warning-bg)"
                  }}
                >
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-warning)", fontWeight: "700", display: "block" }}>
                    Achievement Unlocked
                  </span>
                  <strong style={{ fontSize: "1rem", color: "#fff", display: "block", marginTop: "4px" }}>
                    🏅 {getAccoladeBadge(lessonDetail.id)}
                  </strong>
                </div>
              )}

              <button
                type="button"
                className="btn-primary"
                onClick={() => { setActiveLessonId(null); setLessonDetail(null); }}
                style={{ padding: "10px 24px" }}
              >
                Return to Academy Curriculum
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
export default Academy;
