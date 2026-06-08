import { Feather } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CourseCard } from "@/components/CourseCard";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

const PAGE_SIZE = 10;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t, isRTL } = useLanguage();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchRef = useRef<TextInput>(null);

  // Debounce: wait 3 s after the user stops typing, then hit the API
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 3000);
    return () => clearTimeout(timer);
  }, [search]);

  // Restore keyboard focus after the debounced query fires
  useEffect(() => {
    if (debouncedSearch !== "") {
      const t = setTimeout(() => searchRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [debouncedSearch]);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    // Key includes debouncedSearch so any change resets to page 0
    queryKey: ["courses", "all", debouncedSearch],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      api.courses.listPaged(pageParam, PAGE_SIZE, undefined, debouncedSearch || undefined),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.courses.length, 0);
      if (lastPage.courses.length < PAGE_SIZE) return undefined;
      if (loaded >= lastPage.total) return undefined;
      return loaded;
    },
  });

  const courses = useMemo(
    () => data?.pages.flatMap((p) => p.courses) ?? [],
    [data]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
      {/* ── Header + Search ── */}
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
          {t.courses.title}
        </Text>

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
            ref={searchRef}
            style={[
              styles.searchInput,
              { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
            value={search}
            onChangeText={setSearch}
            placeholder={t.courses.search}
            placeholderTextColor={colors.mutedForeground}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Course list ── */}
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/course/[id]", params: { id: item.id } });
            }}
          />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerSpinner}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="book" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {debouncedSearch
                ? isRTL
                  ? `لا توجد نتائج لـ "${debouncedSearch}"`
                  : `No results for "${debouncedSearch}"`
                : t.courses.empty}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  list: {
    padding: 16,
  },
  footerSpinner: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  errorText: { fontSize: 15, textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
