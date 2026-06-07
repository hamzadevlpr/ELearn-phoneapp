import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
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
import { TeacherCard } from "@/components/TeacherCard";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t, isRTL } = useLanguage();

  const { data: teachers, isLoading, error, refetch } = useQuery({
    queryKey: ["teachers"],
    queryFn: api.teachers.list,
  });

  useEffect(() => {
    if (teachers && teachers.length === 0) {
      router.replace({ pathname: "/courses/[teacherId]", params: { teacherId: "" } });
    }
  }, [teachers]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (isLoading || (teachers && teachers.length === 0)) {
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
          {t.common.error}
        </Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={styles.retryText}>{t.common.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
          {t.teachers.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
          {t.teachers.subtitle}
        </Text>
      </View>

      <FlatList
        data={teachers ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        renderItem={({ item }) => (
          <TeacherCard
            teacher={item}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/courses/[teacherId]", params: { teacherId: item.id } });
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {t.teachers.empty}
            </Text>
          </View>
        }
        scrollEnabled={!!teachers && teachers.length > 0}
      />
    </View>
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
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
