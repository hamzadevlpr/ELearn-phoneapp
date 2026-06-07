import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SecuredVideoPlayer } from "@/components/SecuredVideoPlayer";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function PlayerScreen() {
  const { id, videoUrl } = useLocalSearchParams<{ id: string; videoUrl?: string }>();
  const colors = useColors();
  const { t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let screenCapture: { allowScreenCapture: () => void } | null = null;
    (async () => {
      try {
        const sc = await import("expo-screen-capture");
        await sc.preventScreenCaptureAsync();
        screenCapture = sc;
      } catch {
        // Screen capture protection not available on this platform
      }
    })();
    return () => {
      if (screenCapture) screenCapture.allowScreenCapture();
    };
  }, []);

  if (!videoUrl) {
    return (
      <View style={[styles.center, { backgroundColor: "#000" }]}>
        <Feather name="alert-circle" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>{t.player.error}</Text>
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  const watermark = user?.phone ?? user?.name ?? "student";

  return (
    <View style={styles.container}>
      <SecuredVideoPlayer
        uri={videoUrl}
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
    paddingHorizontal: 32,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
