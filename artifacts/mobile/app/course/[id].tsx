import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccessCodeModal } from "@/components/AccessCodeModal";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { api, Lesson, Exam } from "@/lib/api";

type Tab = "lessons" | "exams" | "about";

export default function CourseDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t, isRTL } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("lessons");
  const [showCodeModal, setShowCodeModal] = useState(false);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => api.courses.get(id!),
    enabled: !!id,
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["lessons", id],
    queryFn: () => api.courses.lessons(id!),
    enabled: !!id && tab === "lessons",
  });

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ["exams", id],
    queryFn: () => api.courses.exams(id!),
    enabled: !!id && tab === "exams",
  });

  async function handleCodeSubmit(code: string) {
    if (!id) return;
    await api.courses.redeem(id, code);
    await queryClient.invalidateQueries({ queryKey: ["course", id] });
    await queryClient.invalidateQueries({ queryKey: ["my-courses"] });
    setShowCodeModal(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleEnter() {
    if (course?.isPurchased) {
      setTab("lessons");
    } else {
      setShowCodeModal(true);
    }
  }

  if (courseLoading || !course) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "lessons", label: t.courseDetail.lessons },
    { key: "exams", label: t.courseDetail.exams },
    { key: "about", label: t.courseDetail.about },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        <View style={styles.heroContainer}>
          {course.image ? (
            <Image source={{ uri: course.image }} style={styles.hero} contentFit="cover" />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.secondary }]}>
              <Feather name="book-open" size={60} color={colors.primary} />
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.heroGradient}
          />
          <TouchableOpacity
            style={[styles.backBtn, { top: (Platform.OS === "web" ? 67 : insets.top) + 8 }]}
            onPress={() => router.back()}
          >
            <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {tabs.map((tb) => (
            <TouchableOpacity
              key={tb.key}
              style={[styles.tabItem, tab === tb.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setTab(tb.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tab === tb.key ? colors.primary : colors.mutedForeground },
                ]}
              >
                {tb.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.courseTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
            {course.title}
          </Text>
          {course.teacherName ? (
            <View style={[styles.teacherRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Feather name="user" size={14} color={colors.mutedForeground} />
              <Text style={[styles.teacherName, { color: colors.mutedForeground }]}>
                {course.teacherName}
              </Text>
            </View>
          ) : null}

          <View style={[styles.metaRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.metaChip, { backgroundColor: colors.secondary }]}>
              <Feather name="play-circle" size={13} color={colors.primary} />
              <Text style={[styles.metaChipText, { color: colors.primary }]}>
                {course.lessonsCount ?? 0} {t.courses.lessons}
              </Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: course.isPurchased ? (colors.success + "20") : (colors.primary + "15") }]}>
              {course.isPurchased ? (
                <Feather name="check-circle" size={13} color={colors.success} />
              ) : (
                <Feather name="lock" size={13} color={colors.primary} />
              )}
              <Text style={[styles.metaChipText, { color: course.isPurchased ? colors.success : colors.primary }]}>
                {course.isPurchased ? t.courses.enter : (course.price ? `${course.price} ج` : t.courses.free)}
              </Text>
            </View>
          </View>
        </View>

        {tab === "lessons" && (
          <View style={styles.contentSection}>
            {lessonsLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (lessons?.length ?? 0) === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {t.courseDetail.noLessons}
                </Text>
              </View>
            ) : (
              lessons?.map((lesson: Lesson, idx: number) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  idx={idx}
                  isPurchased={!!course.isPurchased}
                  courseId={id!}
                  colors={colors}
                  t={t}
                  isRTL={isRTL}
                />
              ))
            )}
          </View>
        )}

        {tab === "exams" && (
          <View style={styles.contentSection}>
            {examsLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (exams?.length ?? 0) === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {t.courseDetail.noExams}
                </Text>
              </View>
            ) : (
              exams?.map((exam: Exam) => (
                <ExamRow
                  key={exam.id}
                  exam={exam}
                  isPurchased={!!course.isPurchased}
                  colors={colors}
                  t={t}
                  isRTL={isRTL}
                />
              ))
            )}
          </View>
        )}

        {tab === "about" && (
          <View style={[styles.contentSection, { paddingBottom: insets.bottom + 120 }]}>
            <Text style={[styles.description, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {course.description ?? ""}
            </Text>
          </View>
        )}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      <View
        style={[
          styles.actionBar,
          { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={handleEnter}
          activeOpacity={0.85}
        >
          <Feather name={course.isPurchased ? "play" : "key"} size={18} color="#fff" />
          <Text style={styles.actionBtnText}>
            {course.isPurchased ? t.courses.enter : t.courses.buy}
          </Text>
        </TouchableOpacity>
      </View>

      <AccessCodeModal
        visible={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSubmit={handleCodeSubmit}
        courseName={course.title}
      />
    </View>
  );
}

function LessonRow({
  lesson,
  idx,
  isPurchased,
  courseId,
  colors,
  t,
  isRTL,
}: {
  lesson: Lesson;
  idx: number;
  isPurchased: boolean;
  courseId: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  t: ReturnType<typeof import("@/context/LanguageContext").useLanguage>["t"];
  isRTL: boolean;
}) {
  const locked = !isPurchased && lesson.isLocked !== false;

  function handlePress() {
    if (!locked) {
      router.push({ pathname: "/player/[id]", params: { id: lesson.id } });
    }
  }

  return (
    <TouchableOpacity
      style={[
        styles.lessonRow,
        { borderColor: colors.border, backgroundColor: colors.card, flexDirection: isRTL ? "row-reverse" : "row" },
      ]}
      onPress={handlePress}
      disabled={locked}
      activeOpacity={locked ? 1 : 0.85}
    >
      <View style={[styles.lessonNum, { backgroundColor: locked ? colors.muted : (colors.primary + "20") }]}>
        <Text style={[styles.lessonNumText, { color: locked ? colors.mutedForeground : colors.primary }]}>
          {idx + 1}
        </Text>
      </View>
      <Text
        style={[styles.lessonTitle, { color: locked ? colors.mutedForeground : colors.foreground, flex: 1, textAlign: isRTL ? "right" : "left" }]}
        numberOfLines={2}
      >
        {lesson.title}
      </Text>
      <Feather
        name={locked ? "lock" : "play-circle"}
        size={18}
        color={locked ? colors.mutedForeground : colors.primary}
      />
    </TouchableOpacity>
  );
}

function ExamRow({
  exam,
  isPurchased,
  colors,
  t,
  isRTL,
}: {
  exam: Exam;
  isPurchased: boolean;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  t: ReturnType<typeof import("@/context/LanguageContext").useLanguage>["t"];
  isRTL: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.lessonRow,
        { borderColor: colors.border, backgroundColor: colors.card, flexDirection: isRTL ? "row-reverse" : "row" },
      ]}
      onPress={() => {
        if (isPurchased) {
          router.push({ pathname: "/exam/[id]", params: { id: exam.id } });
        }
      }}
      disabled={!isPurchased}
      activeOpacity={isPurchased ? 0.85 : 1}
    >
      <View style={[styles.lessonNum, { backgroundColor: exam.isCompleted ? (colors.success + "20") : (colors.primary + "20") }]}>
        <Feather name="file-text" size={16} color={exam.isCompleted ? colors.success : colors.primary} />
      </View>
      <Text
        style={[styles.lessonTitle, { color: isPurchased ? colors.foreground : colors.mutedForeground, flex: 1, textAlign: isRTL ? "right" : "left" }]}
        numberOfLines={2}
      >
        {exam.title}
      </Text>
      {exam.isCompleted && exam.score !== undefined ? (
        <View style={[styles.scoreBadge, { backgroundColor: colors.success + "20" }]}>
          <Text style={[styles.scoreText, { color: colors.success }]}>{exam.score}%</Text>
        </View>
      ) : (
        <Feather name={isPurchased ? "chevron-right" : "lock"} size={18} color={colors.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroContainer: { height: 240, position: "relative" },
  hero: { width: "100%", height: "100%" },
  heroPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoSection: {
    padding: 20,
    gap: 10,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28,
  },
  teacherRow: {
    alignItems: "center",
    gap: 6,
  },
  teacherName: {
    fontSize: 14,
  },
  metaRow: {
    gap: 8,
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  metaChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  contentSection: {
    padding: 16,
    gap: 10,
  },
  lessonRow: {
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  lessonNum: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonNumText: {
    fontSize: 14,
    fontWeight: "700",
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 14,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
