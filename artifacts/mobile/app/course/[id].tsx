import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { api, type CourseTopic } from "@/lib/api";

export default function CourseDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isRTL } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showCodeModal, setShowCodeModal] = useState(false);

  const { data: course, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["course", id],
    queryFn: () => api.courses.get(id!),
    enabled: !!id,
    retry: 1,
  });

  const { data: suggested = [] } = useQuery({
    queryKey: ["suggested", course?.materialStudy],
    queryFn: () => api.courses.suggested(course!.materialStudy!),
    enabled: !!course?.materialStudy,
    staleTime: 5 * 60 * 1000,
  });

  async function handleCodeSubmit(code: string) {
    if (!id) return;
    await api.courses.enroll(id, code);
    await queryClient.invalidateQueries({ queryKey: ["course", id] });
    await queryClient.invalidateQueries({ queryKey: ["my-courses"] });
    setShowCodeModal(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function goToLessons() {
    router.push({
      pathname: "/lessons/[id]",
      params: {
        id: id!,
        title: course?.title ?? "",
        image: course?.image ?? "",
      },
    });
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !course) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.backBtnStatic} onPress={() => router.back()}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Feather name="wifi-off" size={48} color={colors.mutedForeground} />
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>
          {isRTL ? "تعذّر تحميل الكورس" : "Failed to load course"}
        </Text>
        <Text style={[styles.errorMsg, { color: colors.mutedForeground }]}>
          {(error as Error)?.message ?? (isRTL ? "تحقق من الاتصال وحاول مجدداً" : "Check your connection and try again")}
        </Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={styles.retryBtnText}>{isRTL ? "إعادة المحاولة" : "Retry"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero: intro video (animated webp) or thumbnail ── */}
        <View style={styles.heroContainer}>
          {course.introVideoUrl ? (
            <>
              <Image
                source={{ uri: course.introVideoUrl, headers: { Referer: "https://localhost" } }}
                style={styles.hero}
                contentFit="cover"
                autoplay
              />
              {/* "Intro" badge */}
              <View style={styles.introBadge}>
                <Feather name="play-circle" size={13} color="#fff" />
                <Text style={styles.introBadgeText}>
                  {isRTL ? "مقدمة الكورس" : "Course Preview"}
                </Text>
              </View>
            </>
          ) : course.image ? (
            <Image source={{ uri: course.image }} style={styles.hero} contentFit="cover" />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.secondary }]}>
              <Feather name="book-open" size={64} color={colors.primary} />
            </View>
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.70)"]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: (Platform.OS === "web" ? 67 : insets.top) + 8 }]}
            onPress={() => router.back()}
          >
            <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color="#fff" />
          </TouchableOpacity>

          {/* Title overlay on hero */}
          <View style={[styles.heroBottom, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
            {course.isPurchased && (
              <View style={styles.enrolledBadge}>
                <Feather name="check-circle" size={12} color="#fff" />
                <Text style={styles.enrolledBadgeText}>{isRTL ? "مشترك" : "Enrolled"}</Text>
              </View>
            )}
            <Text style={[styles.heroTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {course.title}
            </Text>
            {course.teacherName ? (
              <View style={[styles.teacherRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Feather name="user" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.teacherName}>{course.teacherName}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Quick stats ── */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StatItem
            icon="play-circle"
            value={course.lessonsCount ?? 0}
            label={isRTL ? "درس" : "Lessons"}
            color="#6c63ff"
          />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatItem
            icon="help-circle"
            value={course.examsCount ?? 0}
            label={isRTL ? "اختبار" : "Quizzes"}
            color="#f39c12"
          />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatItem
            icon="tag"
            value={course.codePriceName ?? (course.price ? `${course.price} ج` : (isRTL ? "مجاني" : "Free"))}
            label={isRTL ? "السعر" : "Price"}
            color={colors.primary}
            isText
          />
        </View>

        {/* ── Info section ── */}
        <View style={styles.section}>
          {/* Grade / subject chips */}
          {(course.grade || course.subject) && (
            <View style={[styles.chipRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              {course.grade && (
                <View style={[styles.infoChip, { backgroundColor: colors.secondary }]}>
                  <Feather name="award" size={12} color={colors.primary} />
                  <Text style={[styles.infoChipText, { color: colors.primary }]}>{course.grade}</Text>
                </View>
              )}
              {course.subject && (
                <View style={[styles.infoChip, { backgroundColor: colors.secondary }]}>
                  <Feather name="book" size={12} color={colors.primary} />
                  <Text style={[styles.infoChipText, { color: colors.primary }]}>{course.subject}</Text>
                </View>
              )}
            </View>
          )}

          {/* About */}
          <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
            {isRTL ? "عن الكورس" : "About"}
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
            {course.description || (isRTL ? "لا يوجد وصف متاح لهذا الكورس." : "No description available for this course.")}
          </Text>
        </View>

        {/* ── What you'll learn ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
            {isRTL ? "ما ستتعلمه" : "What's included"}
          </Text>
          <View style={styles.featureList}>
            {[
              { icon: "play-circle" as const, color: "#6c63ff", text: isRTL ? `${course.lessonsCount ?? 0} فيديو تعليمي` : `${course.lessonsCount ?? 0} video lessons` },
              { icon: "help-circle" as const, color: "#f39c12", text: isRTL ? `${course.examsCount ?? 0} اختبار تفاعلي` : `${course.examsCount ?? 0} interactive quizzes` }
            ].map((f, i) => (
              <View key={i} style={[styles.featureRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[styles.featureIcon, { backgroundColor: f.color + "20" }]}>
                  <Feather name={f.icon} size={15} color={f.color} />
                </View>
                <Text style={[styles.featureText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                  {f.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Course content (topics from API) ── */}
        {course.topics && course.topics.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "محتوى الكورس" : "Course Content"}
            </Text>
            <View style={[styles.topicsContainer, { borderColor: colors.border }]}>
              {course.topics.map((topic: CourseTopic, index: number) => {
                const isVideo = topic.courseLessonType === 0;
                const isPdf = topic.courseLessonType === 1;
                const isQuiz = topic.courseLessonType === 2;
                const isArticle = topic.courseLessonType === 3;
                const iconName = isVideo ? "play-circle" : isPdf ? "file-text" : isQuiz ? "help-circle" : "book-open";
                const iconColor = isVideo ? "#6c63ff" : isPdf ? "#e74c3c" : isQuiz ? "#f39c12" : "#27ae60";
                const mins = (topic.totalHours ?? 0) * 60 + (topic.totalMinutes ?? 0);
                const isLast = index === course.topics.length - 1;
                return (
                  <View
                    key={topic.id}
                    style={[
                      styles.topicRow,
                      { flexDirection: isRTL ? "row-reverse" : "row", borderBottomWidth: isLast ? 0 : 1, borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={[styles.topicIcon, { backgroundColor: iconColor + "18" }]}>
                      <Feather name={iconName as any} size={16} color={iconColor} />
                    </View>
                    <View style={[styles.topicInfo, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                      <Text style={[styles.topicTitle, { color: colors.foreground }]} numberOfLines={2}>
                        {topic.title}
                      </Text>
                      <Text style={[styles.topicMeta, { color: colors.mutedForeground }]}>
                        {topic.courseLessonTypeName}
                        {mins > 0 ? ` · ${mins} ${isRTL ? "دقيقة" : "min"}` : ""}
                      </Text>
                    </View>
                    {topic.isNotShowUntilExamPass && (
                      <Feather name="lock" size={14} color={colors.mutedForeground} style={{ marginStart: isRTL ? 0 : "auto", marginEnd: isRTL ? "auto" : 0 }} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Recommendations ── */}
        {suggested.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {isRTL ? "كورسات مشابهة" : "Recommendations"}
            </Text>
            <View style={{ gap: 12 }}>
              {suggested.filter((s) => s.id !== id).slice(0, 3).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.recCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/course/[id]", params: { id: item.id } })}
                  activeOpacity={0.82}
                >
                  {/* Thumbnail */}
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.recThumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.recThumb, styles.recThumbPlaceholder, { backgroundColor: colors.primary + "22" }]}>
                      <Feather name="book-open" size={22} color={colors.primary} />
                    </View>
                  )}

                  {/* Info */}
                  <View style={[styles.recInfo, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                    <Text
                      style={[styles.recTitle, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    {item.teacherName ? (
                      <Text style={[styles.recTeacher, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {item.teacherName}
                      </Text>
                    ) : null}
                    {item.grade ? (
                      <View style={[styles.recChip, { backgroundColor: colors.primary + "18" }]}>
                        <Text style={[styles.recChipText, { color: colors.primary }]}>{item.grade}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Price + arrow */}
                  <View style={styles.recRight}>
                    {item.codePriceName ? (
                      <Text style={[styles.recPrice, { color: colors.primary }]}>
                        {item.codePriceName}
                      </Text>
                    ) : null}
                    <Feather
                      name={isRTL ? "chevron-left" : "chevron-right"}
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: insets.bottom + 110 }} />
      </ScrollView>

      {/* ── Bottom action bar ── */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 },
        ]}
      >
        {course.isPurchased ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#27ae60" }]}
            onPress={goToLessons}
            activeOpacity={0.85}
          >
            <Feather name={isRTL ? "play" : "play"} size={18} color="#fff" />
            <Text style={styles.actionBtnText}>
              {isRTL ? "ابدأ التعلم" : "Start Learning"}
            </Text>
          </TouchableOpacity>
        ) : (
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
        )}
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

// ─── Stat item ────────────────────────────────────────────────────────────────
function StatItem({
  icon,
  value,
  label,
  color,
  isText,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  value: number | string;
  label: string;
  color: string;
  isText?: boolean;
}) {
  return (
    <View style={styles.statItem}>
      <Feather name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>
        {isText ? value : String(value)}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  heroContainer: { height: 280, position: "relative", overflow: "hidden" },
  introBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  introBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  hero: { width: "100%", height: "100%" },
  heroPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
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
  heroBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 6,
  },
  enrolledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#27ae60",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  enrolledBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 30,
  },
  teacherRow: {
    alignItems: "center",
    gap: 6,
  },
  teacherName: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },

  statsCard: {
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
  },
  statDivider: {
    width: 1,
    height: 40,
  },

  section: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  description: {
    fontSize: 15,
    lineHeight: 26,
  },

  chipRow: {
    flexWrap: "wrap",
    gap: 8,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  infoChipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  featureList: {
    gap: 12,
  },
  featureRow: {
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
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

  backBtnStatic: {
    position: "absolute",
    top: 16,
    left: 16,
    padding: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMsg: {
    fontSize: 14,
    textAlign: "center",
    marginHorizontal: 32,
    lineHeight: 22,
    marginBottom: 24,
  },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  topicsContainer: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  topicRow: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  topicIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  topicInfo: {
    flex: 1,
    gap: 3,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  topicMeta: {
    fontSize: 12,
  },

  recCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    padding: 10,
  },
  recThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    flexShrink: 0,
  },
  recThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  recInfo: {
    flex: 1,
    gap: 4,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  recTeacher: {
    fontSize: 12,
  },
  recChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  recRight: {
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  recPrice: {
    fontSize: 13,
    fontWeight: "700",
  },
});
