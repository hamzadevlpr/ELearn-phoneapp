import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
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
import { api, Lesson } from "@/lib/api";

// ─── Lesson type enum ────────────────────────────────────────────────────────
const LESSON_TYPE = { Video: 0, Pdf: 1, Quiz: 2, Article: 3 } as const;

type Tab = "content" | "about";

export default function CourseDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t, isRTL } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("content");
  const [showCodeModal, setShowCodeModal] = useState(false);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => api.courses.get(id!),
    enabled: !!id,
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["lessons", id],
    queryFn: () => api.courses.lessons(id!),
    enabled: !!id,
  });

  async function handleCodeSubmit(code: string) {
    if (!id) return;
    await api.courses.enroll(id, code);
    await queryClient.invalidateQueries({ queryKey: ["course", id] });
    await queryClient.invalidateQueries({ queryKey: ["my-courses"] });
    setShowCodeModal(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  if (courseLoading || !course) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const videoCount = lessons?.filter((l) => l.type === LESSON_TYPE.Video).length ?? 0;
  const pdfCount = lessons?.filter((l) => l.type === LESSON_TYPE.Pdf).length ?? 0;
  const quizCount = lessons?.filter((l) => l.type === LESSON_TYPE.Quiz).length ?? 0;
  const articleCount = lessons?.filter((l) => l.type === LESSON_TYPE.Article).length ?? 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: "content", label: isRTL ? "المحتوى" : "Content" },
    { key: "about", label: isRTL ? "عن الكورس" : "About" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* ── Hero ── */}
        <View style={styles.heroContainer}>
          {course.image ? (
            <Image source={{ uri: course.image }} style={styles.hero} contentFit="cover" />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.secondary }]}>
              <Feather name="book-open" size={60} color={colors.primary} />
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.75)"]}
            style={styles.heroGradient}
          />
          <TouchableOpacity
            style={[styles.backBtn, { top: (Platform.OS === "web" ? 67 : insets.top) + 8 }]}
            onPress={() => router.back()}
          >
            <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Tab bar (sticky) ── */}
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {tabs.map((tb) => (
            <TouchableOpacity
              key={tb.key}
              style={[
                styles.tabItem,
                tab === tb.key && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 },
              ]}
              onPress={() => setTab(tb.key)}
            >
              <Text style={[styles.tabText, { color: tab === tb.key ? colors.primary : colors.mutedForeground }]}>
                {tb.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Course info ── */}
        <View style={[styles.infoSection, { flexDirection: isRTL ? "column" : "column" }]}>
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

          {/* Stats chips */}
          <View style={[styles.statsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {videoCount > 0 && (
              <StatChip icon="play-circle" value={videoCount} label={isRTL ? "فيديو" : "Videos"} color="#6c63ff" bg="#6c63ff20" />
            )}
            {pdfCount > 0 && (
              <StatChip icon="file-text" value={pdfCount} label="PDF" color="#e74c3c" bg="#e74c3c20" />
            )}
            {quizCount > 0 && (
              <StatChip icon="help-circle" value={quizCount} label={isRTL ? "اختبار" : "Quiz"} color="#f39c12" bg="#f39c1220" />
            )}
            {articleCount > 0 && (
              <StatChip icon="book-open" value={articleCount} label={isRTL ? "مقال" : "Article"} color="#27ae60" bg="#27ae6020" />
            )}
          </View>

          {/* Purchase badge */}
          <View style={[styles.purchaseBadge, {
            backgroundColor: course.isPurchased ? (colors.success + "20") : (colors.primary + "15"),
            alignSelf: isRTL ? "flex-end" : "flex-start",
          }]}>
            <Feather
              name={course.isPurchased ? "check-circle" : "lock"}
              size={14}
              color={course.isPurchased ? colors.success : colors.primary}
            />
            <Text style={[styles.purchaseBadgeText, { color: course.isPurchased ? colors.success : colors.primary }]}>
              {course.isPurchased
                ? (isRTL ? "تم الاشتراك" : "Enrolled")
                : course.price
                ? `${course.price} ج`
                : (isRTL ? "مجاني" : "Free")}
            </Text>
          </View>
        </View>

        {/* ── Content tab: lesson list ── */}
        {tab === "content" && (
          <View style={styles.contentSection}>
            {lessonsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
            ) : !lessons?.length ? (
              <View style={styles.emptyState}>
                <Feather name="inbox" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {isRTL ? "لا توجد دروس بعد" : "No lessons yet"}
                </Text>
              </View>
            ) : (
              lessons.map((lesson, idx) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  idx={idx}
                  isPurchased={!!course.isPurchased}
                  colors={colors}
                  isRTL={isRTL}
                />
              ))
            )}
          </View>
        )}

        {/* ── About tab ── */}
        {tab === "about" && (
          <View style={[styles.contentSection, { paddingBottom: insets.bottom + 120 }]}>
            <Text style={[styles.description, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {course.description || (isRTL ? "لا يوجد وصف للكورس" : "No description available.")}
            </Text>
          </View>
        )}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      {/* ── Bottom action bar (only for non-purchased) ── */}
      {!course.isPurchased && (
        <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowCodeModal(true)}
            activeOpacity={0.85}
          >
            <Feather name="key" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>
              {isRTL ? "أدخل كود الاشتراك" : "Enter Access Code"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <AccessCodeModal
        visible={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSubmit={handleCodeSubmit}
        courseName={course.title}
      />
    </View>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({
  icon,
  value,
  label,
  color,
  bg,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  value: number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.statChip, { backgroundColor: bg }]}>
      <Feather name={icon} size={12} color={color} />
      <Text style={[styles.statChipText, { color }]}>
        {value} {label}
      </Text>
    </View>
  );
}

// ─── Lesson row ───────────────────────────────────────────────────────────────
function LessonRow({
  lesson,
  idx,
  isPurchased,
  colors,
  isRTL,
}: {
  lesson: Lesson;
  idx: number;
  isPurchased: boolean;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  isRTL: boolean;
}) {
  const locked = !isPurchased;

  const typeConfig = getLessonTypeConfig(lesson.type, colors);

  function handlePress() {
    if (locked) return;

    switch (lesson.type) {
      case LESSON_TYPE.Video:
        router.push({
          pathname: "/player/[id]",
          params: { id: lesson.id, videoUrl: lesson.videoUrl ?? "" },
        });
        break;

      case LESSON_TYPE.Pdf:
        if (lesson.videoUrl) {
          Linking.openURL(lesson.videoUrl);
        }
        break;

      case LESSON_TYPE.Quiz:
        if (lesson.examId) {
          router.push({ pathname: "/exam/[id]", params: { id: lesson.examId } });
        }
        break;

      case LESSON_TYPE.Article:
        if (lesson.videoUrl) {
          Linking.openURL(lesson.videoUrl);
        }
        break;

      default:
        if (lesson.videoUrl) {
          router.push({
            pathname: "/player/[id]",
            params: { id: lesson.id, videoUrl: lesson.videoUrl },
          });
        }
    }
  }

  return (
    <TouchableOpacity
      style={[
        styles.lessonRow,
        {
          borderColor: locked ? colors.border : typeConfig.borderColor,
          backgroundColor: colors.card,
          flexDirection: isRTL ? "row-reverse" : "row",
          opacity: locked ? 0.6 : 1,
        },
      ]}
      onPress={handlePress}
      disabled={locked}
      activeOpacity={locked ? 1 : 0.8}
    >
      {/* Index / type icon */}
      <View style={[styles.lessonIcon, { backgroundColor: locked ? colors.muted : typeConfig.bg }]}>
        <Feather
          name={locked ? "lock" : typeConfig.icon}
          size={16}
          color={locked ? colors.mutedForeground : typeConfig.color}
        />
      </View>

      {/* Title + type badge */}
      <View style={[styles.lessonMeta, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
        <Text
          style={[styles.lessonTitle, { color: locked ? colors.mutedForeground : colors.foreground, textAlign: isRTL ? "right" : "left" }]}
          numberOfLines={2}
        >
          {lesson.title}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: locked ? colors.muted : typeConfig.bg }]}>
          <Text style={[styles.typeBadgeText, { color: locked ? colors.mutedForeground : typeConfig.color }]}>
            {typeConfig.label}
          </Text>
          {lesson.duration ? (
            <Text style={[styles.typeBadgeText, { color: locked ? colors.mutedForeground : typeConfig.color }]}>
              {" · "}{formatDuration(lesson.duration)}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Right chevron */}
      {!locked && (
        <Feather
          name={isRTL ? "chevron-left" : "chevron-right"}
          size={18}
          color={typeConfig.color}
          style={{ marginStart: 4 }}
        />
      )}
    </TouchableOpacity>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLessonTypeConfig(
  type: number | undefined,
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>,
) {
  switch (type) {
    case LESSON_TYPE.Video:
      return { icon: "play-circle" as const, color: "#6c63ff", bg: "#6c63ff20", borderColor: "#6c63ff40", label: "فيديو" };
    case LESSON_TYPE.Pdf:
      return { icon: "file-text" as const, color: "#e74c3c", bg: "#e74c3c20", borderColor: "#e74c3c40", label: "PDF" };
    case LESSON_TYPE.Quiz:
      return { icon: "help-circle" as const, color: "#f39c12", bg: "#f39c1220", borderColor: "#f39c1240", label: "اختبار" };
    case LESSON_TYPE.Article:
      return { icon: "book-open" as const, color: "#27ae60", bg: "#27ae6020", borderColor: "#27ae6040", label: "مقال" };
    default:
      return { icon: "play-circle" as const, color: colors.primary, bg: colors.primary + "20", borderColor: colors.primary + "40", label: "درس" };
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
    backgroundColor: "rgba(0,0,0,0.45)",
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
  statsRow: {
    flexWrap: "wrap",
    gap: 8,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  purchaseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  purchaseBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },

  contentSection: {
    padding: 16,
    gap: 10,
  },

  lessonRow: {
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  lessonIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  lessonMeta: {
    flex: 1,
    gap: 4,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  emptyState: {
    paddingTop: 48,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },

  description: {
    fontSize: 15,
    lineHeight: 26,
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
