import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { api, type Teacher } from "@/lib/api";

export default function TeachersScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isRTL } = useLanguage();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: teachers = [], isLoading, error, refetch } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => api.teachers.list(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          {isRTL ? "تعذّر تحميل المعلمين" : "Failed to load teachers"}
        </Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={styles.retryText}>{isRTL ? "إعادة المحاولة" : "Retry"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {isRTL ? "المعلمون" : "Teachers"}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {isRTL
            ? `${teachers.length} معلم متاح`
            : `${teachers.length} teacher${teachers.length !== 1 ? "s" : ""} available`}
        </Text>
      </View>

      {/* ── Teacher list ── */}
      <FlatList
        data={teachers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        renderItem={({ item }) => (
          <TeacherCard
            teacher={item}
            isRTL={isRTL}
            colors={colors}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/courses/[teacherId]",
                params: { teacherId: item.id },
              });
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {isRTL ? "لا يوجد معلمون حالياً" : "No teachers available"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Teacher card ─────────────────────────────────────────────────────────────
function TeacherCard({
  teacher,
  isRTL,
  colors,
  onPress,
}: {
  teacher: Teacher;
  isRTL: boolean;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const initials = teacher.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Avatar */}
      {teacher.image ? (
        <Image
          source={{ uri: teacher.image }}
          style={styles.avatar}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
        </View>
      )}

      {/* Info */}
      <View style={[styles.info, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {teacher.name}
        </Text>
        {teacher.subject ? (
          <View style={[styles.subjectChip, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[styles.subjectText, { color: colors.primary }]}>
              {teacher.subject}
            </Text>
          </View>
        ) : null}
        {teacher.phone ? (
          <Text style={[styles.phone, { color: colors.mutedForeground }]} numberOfLines={1}>
            {teacher.phone}
          </Text>
        ) : null}
      </View>

      {/* Arrow */}
      <Feather
        name={isRTL ? "chevron-left" : "chevron-right"}
        size={20}
        color={colors.mutedForeground}
        style={styles.arrow}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 4,
  },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 14 },
  list: { padding: 16, gap: 12 },

  card: {
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    flexShrink: 0,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 20,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  subjectChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: "600",
  },
  phone: {
    fontSize: 13,
  },
  arrow: {
    flexShrink: 0,
  },

  emptyContainer: { paddingTop: 80, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center" },
  errorText: { fontSize: 15, textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
