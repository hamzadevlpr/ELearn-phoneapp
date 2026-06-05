import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SecuredVideoPlayer } from "@/components/SecuredVideoPlayer";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => api.lessons.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    let screenCapture: { allowScreenCapture: () => void } | null = null;
    (async () => {
      try {
        const sc = await import("expo-screen-capture");
        await sc.preventScreenCaptureAsync();
        screenCapture = sc;
      } catch {
        // Graceful fallback — screen capture protection not available
      }
    })();
    return () => {
      if (screenCapture) {
        screenCapture.allowScreenCapture();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: "#000" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !lesson?.videoUrl) {
    return (
      <View style={[styles.center, { backgroundColor: "#000" }]}>
        <Text style={styles.errorText}>{t.player.error}</Text>
      </View>
    );
  }

  const watermark = user?.phone ?? user?.name ?? "student";

  return (
    <View style={styles.container}>
      <SecuredVideoPlayer
        uri={lesson.videoUrl}
        watermarkText={watermark}
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});
