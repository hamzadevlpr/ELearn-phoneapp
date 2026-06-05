import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { Course } from "@/lib/api";

interface Props {
  course: Course;
  onPress: () => void;
}

export function CourseCard({ course, onPress }: Props) {
  const colors = useColors();
  const { t } = useLanguage();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {course.image ? (
          <Image source={{ uri: course.image }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.secondary }]}>
            <Feather name="book-open" size={32} color={colors.primary} />
          </View>
        )}
        {course.isPurchased && (
          <View style={[styles.purchasedBadge, { backgroundColor: colors.success }]}>
            <Feather name="check" size={12} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.title, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {course.title}
        </Text>

        {course.teacherName ? (
          <Text style={[styles.teacher, { color: colors.mutedForeground }]} numberOfLines={1}>
            {course.teacherName}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.meta}>
            <Feather name="play-circle" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {course.lessonsCount ?? 0} {t.courses.lessons}
            </Text>
          </View>

          {course.isPurchased ? (
            <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{t.courses.enter}</Text>
            </View>
          ) : (
            <Text style={[styles.price, { color: colors.primary }]}>
              {course.price ? `${course.price} ج` : t.courses.free}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 14,
  },
  imageContainer: {
    height: 150,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  purchasedBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: 14,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  teacher: {
    fontSize: 13,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
  },
});
