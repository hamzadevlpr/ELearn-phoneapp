import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { Teacher } from "@/lib/api";

interface Props {
  teacher: Teacher;
  onPress: () => void;
}

export function TeacherCard({ teacher, onPress }: Props) {
  const colors = useColors();
  const { t, isRTL } = useLanguage();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
        {teacher.image ? (
          <Image source={{ uri: teacher.image }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <Feather name="user" size={36} color={colors.primary} />
        )}
      </View>

      <View style={[styles.info, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
        <Text style={[styles.name, { color: colors.foreground }]}>{teacher.name}</Text>

        {teacher.subject ? (
          <Text style={[styles.subject, { color: colors.mutedForeground }]}>{teacher.subject}</Text>
        ) : null}

        <View style={styles.meta}>
          <Feather name="book-open" size={13} color={colors.primary} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {teacher.coursesCount ?? 0} {t.teachers.courses}
          </Text>
        </View>
      </View>

      <View style={[styles.arrow, { transform: [{ scaleX: isRTL ? -1 : 1 }] }]}>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  subject: {
    fontSize: 13,
    fontWeight: "500",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
  },
  arrow: {
    opacity: 0.6,
  },
});
