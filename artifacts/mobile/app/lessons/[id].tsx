import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import {
  api,
  type EducationalQuiz,
  type Lesson,
  type QuizQuestion,
  type StudentExam,
} from "@/lib/api";

const LESSON_TYPE = { Video: 0, Pdf: 1, Quiz: 2, Article: 3 } as const;

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function LessonsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isRTL } = useLanguage();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();

  const [search, setSearch] = useState("");
  const [activeQuizLesson, setActiveQuizLesson] = useState<Lesson | null>(null);

  const {
    data: lessons,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lessons", id],
    queryFn: () => api.courses.lessons(id!),
    enabled: !!id,
  });

  const filtered = useMemo(
    () =>
      (lessons ?? []).filter((l) =>
        !search || l.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [lessons, search],
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleDoneQuiz = useCallback(() => {
    setActiveQuizLesson(null);
    refetch();
  }, [refetch]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather
            name={isRTL ? "arrow-right" : "arrow-left"}
            size={22}
            color={colors.foreground}
          />
        </TouchableOpacity>
        <View style={[styles.headerTitle, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
          <Text style={[styles.headerText, { color: colors.foreground }]} numberOfLines={1}>
            {title ?? (isRTL ? "دروس الكورس" : "Course Lessons")}
          </Text>
        </View>
      </View>

      {/* ── Search ── */}
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.searchRow,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[
              styles.searchInput,
              { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
            value={search}
            onChangeText={setSearch}
            placeholder={isRTL ? "ابحث عن درس..." : "Search lessons..."}
            placeholderTextColor={colors.mutedForeground}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={40} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            {isRTL ? "حدث خطأ في تحميل الدروس" : "Failed to load lessons"}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryBtnText}>{isRTL ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Feather name="inbox" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {isRTL ? "لا توجد دروس" : "No lessons found"}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.map((lesson, idx) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              idx={idx}
              colors={colors}
              isRTL={isRTL}
              onQuizOpen={() => setActiveQuizLesson(lesson)}
            />
          ))}
        </ScrollView>
      )}

      {/* ── Inline Quiz Modal ── */}
      {activeQuizLesson?.quiz && (
        <QuizModal
          quiz={activeQuizLesson.quiz}
          existingResult={activeQuizLesson.studentExam ?? null}
          isRTL={isRTL}
          colors={colors}
          insets={insets}
          onDone={handleDoneQuiz}
        />
      )}
    </View>
  );
}

// ─── Lesson Row ───────────────────────────────────────────────────────────────
function LessonRow({
  lesson,
  idx,
  colors,
  isRTL,
  onQuizOpen,
}: {
  lesson: Lesson;
  idx: number;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
  onQuizOpen: () => void;
}) {
  const isLocked = !!lesson.isNotShowUntilExamPass;
  const isQuiz = lesson.type === LESSON_TYPE.Quiz;
  const hasResult = !!lesson.studentExam;
  const cfg = getTypeConfig(lesson.type, colors);

  function handlePress() {
    if (isLocked) return;

    if (isQuiz) {
      onQuizOpen();
      return;
    }

    switch (lesson.type) {
      case LESSON_TYPE.Video:
        router.push({
          pathname: "/player/[id]",
          params: { id: lesson.id, videoUrl: lesson.fileUrl ?? lesson.videoUrl ?? "" },
        });
        break;
      case LESSON_TYPE.Pdf:
      case LESSON_TYPE.Article:
        if (lesson.fileUrl ?? lesson.videoUrl)
          Linking.openURL((lesson.fileUrl ?? lesson.videoUrl)!);
        break;
      default:
        if (lesson.fileUrl ?? lesson.videoUrl)
          router.push({
            pathname: "/player/[id]",
            params: { id: lesson.id, videoUrl: lesson.fileUrl ?? lesson.videoUrl ?? "" },
          });
    }
  }

  return (
    <TouchableOpacity
      style={[
        styles.lessonRow,
        {
          backgroundColor: isLocked ? colors.card + "88" : colors.card,
          borderColor: isLocked ? colors.border : cfg.border,
          flexDirection: isRTL ? "row-reverse" : "row",
          opacity: isLocked ? 0.6 : 1,
        },
      ]}
      onPress={handlePress}
      activeOpacity={isLocked ? 1 : 0.8}
    >
      {/* Order badge */}
      <View style={[styles.orderBadge, { backgroundColor: isLocked ? colors.border : cfg.bg }]}>
        {isLocked ? (
          <Feather name="lock" size={13} color={colors.mutedForeground} />
        ) : (
          <Text style={[styles.orderText, { color: cfg.color }]}>{idx + 1}</Text>
        )}
      </View>

      {/* Type icon */}
      <View style={[styles.typeIcon, { backgroundColor: isLocked ? colors.border : cfg.bg }]}>
        <Feather
          name={isLocked ? "lock" : cfg.icon}
          size={17}
          color={isLocked ? colors.mutedForeground : cfg.color}
        />
      </View>

      {/* Info */}
      <View style={[styles.lessonInfo, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
        <Text
          style={[
            styles.lessonTitle,
            {
              color: isLocked ? colors.mutedForeground : colors.foreground,
              textAlign: isRTL ? "right" : "left",
            },
          ]}
          numberOfLines={2}
        >
          {lesson.title}
        </Text>

        <View style={[styles.lessonMeta, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          {isLocked ? (
            <View style={[styles.typePill, { backgroundColor: colors.border }]}>
              <Text style={[styles.typePillText, { color: colors.mutedForeground }]}>
                {isRTL ? "مقفل" : "Locked"}
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.typePill, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.typePillText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              {lesson.duration ? (
                <Text style={[styles.duration, { color: colors.mutedForeground }]}>
                  {formatDuration(lesson.duration)}
                </Text>
              ) : null}
              {isQuiz && hasResult && lesson.studentExam && (
                <ScoreBadge exam={lesson.studentExam} />
              )}
            </>
          )}
        </View>

        {isLocked && (
          <Text style={[styles.lockedHint, { color: colors.mutedForeground }]}>
            {isRTL ? "أكمل الاختبار لإلغاء القفل" : "Complete the quiz to unlock"}
          </Text>
        )}
      </View>

      {/* Right action */}
      {!isLocked && (
        <Feather
          name={isQuiz ? (hasResult ? "award" : "play-circle") : isRTL ? "chevron-left" : "chevron-right"}
          size={18}
          color={cfg.color}
          style={{ flexShrink: 0 }}
        />
      )}
    </TouchableOpacity>
  );
}

// ─── Score Badge (inline result chip) ────────────────────────────────────────
function ScoreBadge({ exam }: { exam: StudentExam }) {
  const pct = Math.round(exam.degreePercent);
  const passed = pct >= 50;
  const bg = passed ? "#27ae6020" : "#e74c3c20";
  const color = passed ? "#27ae60" : "#e74c3c";
  return (
    <View style={[styles.scoreBadge, { backgroundColor: bg }]}>
      <Feather name={passed ? "check-circle" : "x-circle"} size={11} color={color} />
      <Text style={[styles.scoreBadgeText, { color }]}>{pct}%</Text>
    </View>
  );
}

// ─── Quiz Modal ───────────────────────────────────────────────────────────────
type QuizPhase = "result" | "taking";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function QuizModal({
  quiz,
  existingResult,
  isRTL,
  colors,
  insets,
  onDone,
}: {
  quiz: EducationalQuiz;
  existingResult: StudentExam | null;
  isRTL: boolean;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>;
  onDone: () => void;
}) {
  const hasTimer = quiz.maxTimeInMinutes > 0;
  const initialPhase: QuizPhase = existingResult ? "result" : "taking";

  const [phase, setPhase] = useState<QuizPhase>(initialPhase);
  const [selectedKeys, setSelectedKeys] = useState<Record<string, number[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [localResult, setLocalResult] = useState<{
    correct: number;
    total: number;
    pct: number;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState(
    hasTimer ? quiz.maxTimeInMinutes * 60 : 0,
  );

  // Track start time for the API submission
  const startTimeRef = useRef(new Date());
  // Guard against double-submission (timer + manual)
  const submittingRef = useRef(false);
  // Always-fresh ref to submit so the interval can call it without stale closure
  const submitRef = useRef<() => void>(() => {});

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasTimer || phase !== "taking") return;

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          // Auto-submit after state settles
          setTimeout(() => submitRef.current(), 50);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [phase, hasTimer]);

  const allAnswered = quiz.questions.every(
    (q) => (selectedKeys[q.id]?.length ?? 0) > 0,
  );

  function toggleKey(questionId: string, key: number, isMulti: boolean) {
    setSelectedKeys((prev) => {
      const current = prev[questionId] ?? [];
      if (isMulti) {
        return {
          ...prev,
          [questionId]: current.includes(key)
            ? current.filter((k) => k !== key)
            : [...current, key],
        };
      }
      return { ...prev, [questionId]: [key] };
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (submittingRef.current || phase === "result") return;
    submittingRef.current = true;
    setSubmitting(true);

    const endTime = new Date();

    // Evaluate score locally
    const correct = quiz.questions.filter((q) => {
      const sel = [...(selectedKeys[q.id] ?? [])].sort((a, b) => a - b);
      const ans = [...q.answers].sort((a, b) => a - b);
      return sel.length > 0 && sel.length === ans.length && sel.every((v, i) => v === ans[i]);
    }).length;
    const total = quiz.questions.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    setLocalResult({ correct, total, pct });

    // Submit to backend (best-effort)
    try {
      await api.quizzes.submit({
        quizId: quiz.id,
        startTime: startTimeRef.current,
        endTime,
        degree: correct,
        totalDegree: total,
      });
    } catch {
      // local result still displayed
    }

    submittingRef.current = false;
    setSubmitting(false);
    setPhase("result");
  }

  // Keep ref in sync every render
  submitRef.current = handleSubmit;

  const displayResult = localResult
    ? localResult
    : existingResult
    ? {
        correct: existingResult.degree,
        total: existingResult.totalDegree,
        pct: Math.round(existingResult.degreePercent),
      }
    : null;

  const timerColor =
    timeLeft <= 60 ? "#e74c3c" : timeLeft <= 120 ? "#f39c12" : colors.primary;

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* ── Modal Header ── */}
        <View
          style={[
            styles.modalHeader,
            {
              paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 8,
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <TouchableOpacity style={styles.backBtn} onPress={onDone}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <View style={[styles.headerTitle, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
            <Text style={[styles.headerText, { color: colors.foreground }]} numberOfLines={1}>
              {quiz.title}
            </Text>
            <Text style={[styles.quizMeta, { color: colors.mutedForeground }]}>
              {quiz.questions.length} {isRTL ? "سؤال" : "questions"}
            </Text>
          </View>

          {/* Countdown timer badge */}
          {hasTimer && phase === "taking" && (
            <View style={[styles.timerBadge, { backgroundColor: timerColor + "18", borderColor: timerColor + "40" }]}>
              <Feather name="clock" size={13} color={timerColor} />
              <Text style={[styles.timerText, { color: timerColor }]}>
                {formatTime(timeLeft)}
              </Text>
            </View>
          )}
        </View>

        {phase === "taking" ? (
          <>
            <ScrollView
              contentContainerStyle={[
                styles.quizList,
                { paddingBottom: insets.bottom + 100 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {quiz.questions.map((q, qi) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={qi}
                  selected={selectedKeys[q.id] ?? []}
                  isRTL={isRTL}
                  colors={colors}
                  onToggle={(key) =>
                    toggleKey(q.id, key, q.questionType === "multi-select")
                  }
                />
              ))}
            </ScrollView>

            <View
              style={[
                styles.submitBar,
                {
                  paddingBottom: insets.bottom + 16,
                  backgroundColor: colors.card,
                  borderTopColor: colors.border,
                },
              ]}
            >
              {!allAnswered && (
                <Text style={[styles.submitHint, { color: colors.mutedForeground }]}>
                  {isRTL ? "يمكنك التسليم في أي وقت" : "You can submit at any time"}
                </Text>
              )}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isRTL ? "تسليم الاختبار" : "Submit Quiz"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.resultContainer,
              { paddingBottom: insets.bottom + 40 },
            ]}
          >
            {displayResult && (
              <ResultView
                result={displayResult}
                existingExam={existingResult}
                isRTL={isRTL}
                colors={colors}
                onClose={onDone}
                onRetake={() => {
                  setSelectedKeys({});
                  setLocalResult(null);
                  submittingRef.current = false;
                  startTimeRef.current = new Date();
                  setTimeLeft(hasTimer ? quiz.maxTimeInMinutes * 60 : 0);
                  setPhase("taking");
                }}
                showRetake={!existingResult}
              />
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────
function QuestionCard({
  question,
  index,
  selected,
  isRTL,
  colors,
  onToggle,
}: {
  question: QuizQuestion;
  index: number;
  selected: number[];
  isRTL: boolean;
  colors: ReturnType<typeof useColors>;
  onToggle: (key: number) => void;
}) {
  const isMulti = question.questionType === "multi-select";

  return (
    <View
      style={[
        styles.questionCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Question header */}
      <View style={[styles.questionHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={[styles.questionBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.questionBadgeText, { color: colors.primary }]}>
            {index + 1}
          </Text>
        </View>
        {isMulti && (
          <View style={[styles.multiChip, { backgroundColor: "#6c63ff20" }]}>
            <Text style={[styles.multiChipText, { color: "#6c63ff" }]}>
              {isRTL ? "اختيار متعدد" : "Multi-select"}
            </Text>
          </View>
        )}
      </View>

      {/* Question text */}
      <Text
        style={[
          styles.questionTitle,
          {
            color: colors.foreground,
            textAlign: isRTL ? "right" : "left",
          },
        ]}
      >
        {question.title}
      </Text>

      {/* Question image */}
      {question.img && (
        <Image
          source={{ uri: question.img }}
          style={styles.questionImg}
          contentFit="contain"
        />
      )}

      {/* Choices */}
      <View style={{ gap: 8 }}>
        {question.choices.map((choice) => {
          const isSelected = selected.includes(choice.key);
          return (
            <Pressable
              key={choice.key}
              style={[
                styles.choiceBtn,
                {
                  backgroundColor: isSelected ? colors.primary + "18" : colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
              ]}
              onPress={() => onToggle(choice.key)}
            >
              <View
                style={[
                  styles.choiceCircle,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : "transparent",
                  },
                  isMulti && styles.choiceSquare,
                ]}
              >
                {isSelected && <Feather name="check" size={11} color="#fff" />}
              </View>
              <Text
                style={[
                  styles.choiceText,
                  {
                    color: isSelected ? colors.primary : colors.foreground,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {choice.value}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Hint */}
      {question.hint && (
        <View style={[styles.hintRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Feather name="info" size={13} color={colors.mutedForeground} />
          <Text
            style={[
              styles.hintText,
              { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {question.hint}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Result View ──────────────────────────────────────────────────────────────
function ResultView({
  result,
  existingExam,
  isRTL,
  colors,
  onClose,
  onRetake,
  showRetake,
}: {
  result: { correct: number; total: number; pct: number };
  existingExam: StudentExam | null;
  isRTL: boolean;
  colors: ReturnType<typeof useColors>;
  onClose: () => void;
  onRetake: () => void;
  showRetake: boolean;
}) {
  const passed = result.pct >= 50;
  const ringColor = passed ? "#27ae60" : "#e74c3c";

  return (
    <View style={styles.resultInner}>
      {/* Score ring */}
      <View style={[styles.scoreRing, { borderColor: ringColor + "40" }]}>
        <View style={[styles.scoreRingInner, { backgroundColor: ringColor + "15" }]}>
          <Feather name={passed ? "award" : "x-circle"} size={36} color={ringColor} />
          <Text style={[styles.scorePct, { color: ringColor }]}>{result.pct}%</Text>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>
            {passed ? (isRTL ? "ناجح ✓" : "Passed ✓") : isRTL ? "راسب ✗" : "Failed ✗"}
          </Text>
        </View>
      </View>

      {/* Detailed stats */}
      <View style={[styles.statsRow, { borderColor: colors.border }]}>
        <StatItem
          icon="check-circle"
          color="#27ae60"
          label={isRTL ? "صحيح" : "Correct"}
          value={`${result.correct}`}
          colors={colors}
        />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem
          icon="x-circle"
          color="#e74c3c"
          label={isRTL ? "خطأ" : "Wrong"}
          value={`${result.total - result.correct}`}
          colors={colors}
        />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem
          icon="layers"
          color={colors.primary}
          label={isRTL ? "الكل" : "Total"}
          value={`${result.total}`}
          colors={colors}
        />
      </View>

      {existingExam && (
        <View
          style={[styles.examInfoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.examInfoTitle, { color: colors.foreground }]}>
            {existingExam.quizTitle}
          </Text>
          <Text style={[styles.examInfoSub, { color: colors.mutedForeground }]}>
            {isRTL ? "الدرجة" : "Score"}: {existingExam.degree} / {existingExam.totalDegree}
          </Text>
        </View>
      )}

      <View style={{ gap: 12, width: "100%" }}>
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>{isRTL ? "إغلاق وتحديث الدروس" : "Close & Refresh"}</Text>
        </TouchableOpacity>
        {showRetake && (
          <TouchableOpacity
            style={[styles.retakeBtn, { borderColor: colors.border }]}
            onPress={onRetake}
            activeOpacity={0.85}
          >
            <Text style={[styles.retakeBtnText, { color: colors.foreground }]}>
              {isRTL ? "إعادة الاختبار" : "Retake Quiz"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function StatItem({
  icon,
  color,
  label,
  value,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.statItem}>
      <Feather name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTypeConfig(
  type: number | undefined,
  colors: ReturnType<typeof useColors>,
) {
  switch (type) {
    case LESSON_TYPE.Video:
      return { icon: "play-circle" as const, color: "#6c63ff", bg: "#6c63ff15", border: "#6c63ff30", label: "فيديو" };
    case LESSON_TYPE.Pdf:
      return { icon: "file-text" as const, color: "#e74c3c", bg: "#e74c3c15", border: "#e74c3c30", label: "PDF" };
    case LESSON_TYPE.Quiz:
      return { icon: "help-circle" as const, color: "#f39c12", bg: "#f39c1215", border: "#f39c1230", label: "اختبار" };
    case LESSON_TYPE.Article:
      return { icon: "book-open" as const, color: "#27ae60", bg: "#27ae6015", border: "#27ae6030", label: "مقال" };
    default:
      return { icon: "play-circle" as const, color: colors.primary, bg: colors.primary + "15", border: colors.primary + "30", label: "درس" };
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}د`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}س ${m}د` : `${h}س`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },

  header: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: { flex: 1 },
  headerText: { fontSize: 16, fontWeight: "700", flex: 1 },
  quizMeta: { fontSize: 12, marginTop: 2 },

  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 14, height: "100%" },

  list: { padding: 16 },

  lessonRow: {
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  orderText: { fontSize: 12, fontWeight: "700" },
  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  lessonInfo: { flex: 1, gap: 6 },
  lessonTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  lessonMeta: { alignItems: "center", gap: 8 },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typePillText: { fontSize: 11, fontWeight: "700" },
  duration: { fontSize: 12 },
  lockedHint: { fontSize: 11, marginTop: 2 },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scoreBadgeText: { fontSize: 11, fontWeight: "700" },

  errorText: { fontSize: 15, textAlign: "center" },
  emptyText: { fontSize: 15, textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // ── Quiz Modal ──
  modalContainer: { flex: 1 },
  modalHeader: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },

  quizList: { padding: 16, gap: 12 },

  questionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  questionHeader: { alignItems: "center", gap: 8 },
  questionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  questionBadgeText: { fontSize: 13, fontWeight: "700" },
  multiChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  multiChipText: { fontSize: 11, fontWeight: "600" },
  questionTitle: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  questionImg: { width: "100%", height: 160, borderRadius: 10 },

  choiceBtn: {
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  choiceCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  choiceSquare: { borderRadius: 5 },
  choiceText: { flex: 1, fontSize: 14, lineHeight: 20 },

  hintRow: { alignItems: "center", gap: 6, marginTop: 4 },
  hintText: { flex: 1, fontSize: 12, lineHeight: 18 },

  submitBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
    alignItems: "center",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
  },
  timerText: { fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] },
  submitHint: { fontSize: 12, textAlign: "center" },
  submitBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // ── Result ──
  resultContainer: { padding: 24, alignItems: "center" },
  resultInner: { width: "100%", alignItems: "center", gap: 24 },
  scoreRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  scoreRingInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  scorePct: { fontSize: 36, fontWeight: "800", lineHeight: 42 },
  scoreLabel: { fontSize: 14, fontWeight: "600" },

  statsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
  },
  statItem: { flex: 1, alignItems: "center", padding: 16, gap: 4 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 12 },
  statDivider: { width: 1 },

  examInfoCard: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  examInfoTitle: { fontSize: 15, fontWeight: "700" },
  examInfoSub: { fontSize: 13 },

  doneBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  retakeBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
  },
  retakeBtnText: { fontSize: 16, fontWeight: "600" },
});
