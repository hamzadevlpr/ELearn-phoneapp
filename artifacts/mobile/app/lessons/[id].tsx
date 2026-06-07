import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
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
import { api, Lesson } from "@/lib/api";

const LESSON_TYPE = { Video: 0, Pdf: 1, Quiz: 2, Article: 3 } as const;

export default function LessonsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isRTL } = useLanguage();
  const { id, title, image } = useLocalSearchParams<{
    id: string;
    title?: string;
    image?: string;
  }>();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  const { data: lessons, isLoading, error, refetch } = useQuery({
    queryKey: ["lessons", id],
    queryFn: () => api.courses.lessons(id!),
    enabled: !!id,
  });

  const filtered = (lessons ?? []).filter((l) => {
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === null || l.type === activeFilter;
    return matchSearch && matchFilter;
  });

  const typeCounts = {
    [LESSON_TYPE.Video]: lessons?.filter((l) => l.type === LESSON_TYPE.Video).length ?? 0,
    [LESSON_TYPE.Pdf]: lessons?.filter((l) => l.type === LESSON_TYPE.Pdf).length ?? 0,
    [LESSON_TYPE.Quiz]: lessons?.filter((l) => l.type === LESSON_TYPE.Quiz).length ?? 0,
    [LESSON_TYPE.Article]: lessons?.filter((l) => l.type === LESSON_TYPE.Article).length ?? 0,
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
          {image ? (
            <Image source={{ uri: image }} style={styles.headerThumb} contentFit="cover" />
          ) : (
            <View style={[styles.headerThumb, { backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }]}>
              <Feather name="book-open" size={18} color={colors.primary} />
            </View>
          )}
          <Text
            style={[styles.headerText, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {title ?? (isRTL ? "دروس الكورس" : "Course Lessons")}
          </Text>
        </View>
      </View>

      {/* ── Search bar ── */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
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
            style={[styles.searchInput, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
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

      {/* ── Type filter chips ── */}
      {!isLoading && (lessons?.length ?? 0) > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filterRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
          style={[styles.filterScroll, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
        >
          <FilterChip
            label={isRTL ? "الكل" : "All"}
            icon="layers"
            count={lessons?.length ?? 0}
            active={activeFilter === null}
            color={colors.primary}
            onPress={() => setActiveFilter(null)}
            colors={colors}
          />
          {typeCounts[LESSON_TYPE.Video] > 0 && (
            <FilterChip
              label={isRTL ? "فيديو" : "Video"}
              icon="play-circle"
              count={typeCounts[LESSON_TYPE.Video]}
              active={activeFilter === LESSON_TYPE.Video}
              color="#6c63ff"
              onPress={() => setActiveFilter(activeFilter === LESSON_TYPE.Video ? null : LESSON_TYPE.Video)}
              colors={colors}
            />
          )}
          {typeCounts[LESSON_TYPE.Pdf] > 0 && (
            <FilterChip
              label="PDF"
              icon="file-text"
              count={typeCounts[LESSON_TYPE.Pdf]}
              active={activeFilter === LESSON_TYPE.Pdf}
              color="#e74c3c"
              onPress={() => setActiveFilter(activeFilter === LESSON_TYPE.Pdf ? null : LESSON_TYPE.Pdf)}
              colors={colors}
            />
          )}
          {typeCounts[LESSON_TYPE.Quiz] > 0 && (
            <FilterChip
              label={isRTL ? "اختبار" : "Quiz"}
              icon="help-circle"
              count={typeCounts[LESSON_TYPE.Quiz]}
              active={activeFilter === LESSON_TYPE.Quiz}
              color="#f39c12"
              onPress={() => setActiveFilter(activeFilter === LESSON_TYPE.Quiz ? null : LESSON_TYPE.Quiz)}
              colors={colors}
            />
          )}
          {typeCounts[LESSON_TYPE.Article] > 0 && (
            <FilterChip
              label={isRTL ? "مقال" : "Article"}
              icon="book-open"
              count={typeCounts[LESSON_TYPE.Article]}
              active={activeFilter === LESSON_TYPE.Article}
              color="#27ae60"
              onPress={() => setActiveFilter(activeFilter === LESSON_TYPE.Article ? null : LESSON_TYPE.Article)}
              colors={colors}
            />
          )}
        </ScrollView>
      )}

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
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((lesson, idx) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              idx={idx}
              colors={colors}
              isRTL={isRTL}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────
function FilterChip({
  label,
  icon,
  count,
  active,
  color,
  onPress,
  colors,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  count: number;
  active: boolean;
  color: string;
  onPress: () => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: active ? color : colors.background,
          borderColor: active ? color : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Feather name={icon} size={13} color={active ? "#fff" : color} />
      <Text style={[styles.chipText, { color: active ? "#fff" : color }]}>
        {label}
      </Text>
      <View style={[styles.chipBadge, { backgroundColor: active ? "rgba(255,255,255,0.25)" : color + "20" }]}>
        <Text style={[styles.chipBadgeText, { color: active ? "#fff" : color }]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Lesson row ───────────────────────────────────────────────────────────────
function LessonRow({
  lesson,
  idx,
  colors,
  isRTL,
}: {
  lesson: Lesson;
  idx: number;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  isRTL: boolean;
}) {
  const cfg = getTypeConfig(lesson.type, colors);

  function handlePress() {
    switch (lesson.type) {
      case LESSON_TYPE.Video:
        router.push({
          pathname: "/player/[id]",
          params: { id: lesson.id, videoUrl: lesson.videoUrl ?? "" },
        });
        break;
      case LESSON_TYPE.Pdf:
        if (lesson.videoUrl) Linking.openURL(lesson.videoUrl);
        break;
      case LESSON_TYPE.Quiz:
        if (lesson.examId)
          router.push({ pathname: "/exam/[id]", params: { id: lesson.examId } });
        break;
      case LESSON_TYPE.Article:
        if (lesson.videoUrl) Linking.openURL(lesson.videoUrl);
        break;
      default:
        if (lesson.videoUrl)
          router.push({
            pathname: "/player/[id]",
            params: { id: lesson.id, videoUrl: lesson.videoUrl },
          });
    }
  }

  return (
    <TouchableOpacity
      style={[
        styles.lessonRow,
        {
          backgroundColor: colors.card,
          borderColor: cfg.border,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Order number */}
      <View style={[styles.orderBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.orderText, { color: cfg.color }]}>{idx + 1}</Text>
      </View>

      {/* Type icon */}
      <View style={[styles.typeIcon, { backgroundColor: cfg.bg }]}>
        <Feather name={cfg.icon} size={17} color={cfg.color} />
      </View>

      {/* Info */}
      <View style={[styles.lessonInfo, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
        <Text
          style={[styles.lessonTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
          numberOfLines={2}
        >
          {lesson.title}
        </Text>
        <View style={[styles.lessonMeta, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <View style={[styles.typePill, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.typePillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {lesson.duration ? (
            <Text style={[styles.duration, { color: colors.mutedForeground }]}>
              {formatDuration(lesson.duration)}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Action arrow */}
      <Feather
        name={isRTL ? "chevron-left" : "chevron-right"}
        size={18}
        color={cfg.color}
        style={{ flexShrink: 0 }}
      />
    </TouchableOpacity>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTypeConfig(
  type: number | undefined,
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>,
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
  headerTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    flexShrink: 0,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },

  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
  },

  filterScroll: { borderBottomWidth: 1 },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  chipBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  chipBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  list: {
    padding: 16,
    gap: 10,
  },
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
  orderText: {
    fontSize: 12,
    fontWeight: "700",
  },
  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  lessonInfo: {
    flex: 1,
    gap: 6,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  lessonMeta: {
    alignItems: "center",
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  duration: {
    fontSize: 12,
  },

  errorText: { fontSize: 15, textAlign: "center" },
  emptyText: { fontSize: 15, textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
