import { Feather } from "@expo/vector-icons";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  uri: string;
  watermarkText: string;
  onClose?: () => void;
}

const WATERMARK_POSITIONS = [
  { top: "15%", left: "10%" },
  { top: "15%", right: "10%" },
  { top: "45%", left: "20%" },
  { top: "45%", right: "20%" },
  { top: "75%", left: "10%" },
  { top: "75%", right: "10%" },
] as const;

export function SecuredVideoPlayer({ uri, watermarkText, onClose }: Props) {
  const colors = useColors();
  const videoRef = useRef<Video>(null);
  const [posIdx, setPosIdx] = useState(0);
  const opacity = useRef(new Animated.Value(0.35)).current;
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 400, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        setPosIdx((i) => (i + 1) % WATERMARK_POSITIONS.length);
      }, 400);
    }, 7000);
    return () => clearInterval(interval);
  }, [opacity]);

  function handleStatus(status: AVPlaybackStatus) {
    if (status.isLoaded) setIsReady(true);
    if (!status.isLoaded && status.error) setError(true);
  }

  const wPos = WATERMARK_POSITIONS[posIdx];

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: "#000" }]}>
        <Feather name="alert-circle" size={40} color={colors.destructive} />
        <Text style={styles.errorText}>Failed to load video</Text>
        {onClose && (
          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{
          uri,
          headers: {
            Referer: "https://localhost",
          },
        }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        shouldPlay
        onPlaybackStatusUpdate={handleStatus}
      />

      {!isReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}

      <Animated.View
        style={[
          styles.watermark,
          { opacity },
          wPos as Record<string, unknown>,
        ]}
      >
        <Text style={styles.watermarkText}>{watermarkText}</Text>
      </Animated.View>

      {onClose && Platform.OS !== "web" && (
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  watermark: {
    position: "absolute",
    zIndex: 10,
  } as ReturnType<typeof StyleSheet.flatten>,
  watermarkText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
  },
  closeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  closeBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  backBtn: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
});
