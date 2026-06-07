import { Feather } from "@expo/vector-icons";
import {
  Video,
  ResizeMode,
  AVPlaybackStatus,
  VideoFullscreenUpdate,
  VideoFullscreenUpdateEvent,
} from "expo-av";
import * as ScreenCapture from "expo-screen-capture";
import * as ScreenOrientation from "expo-screen-orientation";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface QualityOption {
  label: string;
  uri: string;
}

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

const VIDEO_HEADERS = { Referer: "https://localhost" };

async function parseM3U8Qualities(masterUri: string): Promise<QualityOption[]> {
  try {
    const res = await fetch(masterUri, { headers: VIDEO_HEADERS });
    const text = await res.text();
    if (!text.includes("#EXT-X-STREAM-INF")) {
      return [{ label: "Auto", uri: masterUri }];
    }
    const options: QualityOption[] = [{ label: "Auto", uri: masterUri }];
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXT-X-STREAM-INF")) {
        const resMatch = lines[i].match(/RESOLUTION=\d+x(\d+)/);
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && !nextLine.startsWith("#")) {
          const height = resMatch ? resMatch[1] : null;
          const qualityUri = nextLine.startsWith("http")
            ? nextLine
            : new URL(nextLine, masterUri).href;
          const label = height ? `${height}p` : `Quality ${options.length}`;
          if (!options.find((o) => o.label === label)) {
            options.push({ label, uri: qualityUri });
          }
        }
      }
    }
    return options;
  } catch {
    return [{ label: "Auto", uri: masterUri }];
  }
}

export function SecuredVideoPlayer({ uri, watermarkText, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  const [posIdx, setPosIdx] = useState(0);
  const opacity = useRef(new Animated.Value(0.35)).current;
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(false);

  const [qualities, setQualities] = useState<QualityOption[]>([]);
  const [activeQuality, setActiveQuality] = useState<QualityOption>({ label: "Auto", uri });
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // ── Screen capture / recording prevention ────────────────────────────────
  useEffect(() => {
    if (Platform.OS === "web") return;
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  // ── Watermark rotation ────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 400, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setPosIdx((i) => (i + 1) % WATERMARK_POSITIONS.length), 400);
    }, 7000);
    return () => clearInterval(interval);
  }, [opacity]);

  // ── Reset orientation on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (Platform.OS !== "web") {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      }
    };
  }, []);

  // ── Parse M3U8 quality levels ─────────────────────────────────────────────
  useEffect(() => {
    const initial: QualityOption = { label: "Auto", uri };
    setActiveQuality(initial);
    setQualities([]);
    if (!uri.includes(".m3u8")) return;
    parseM3U8Qualities(uri).then((opts) => {
      setQualities(opts);
    });
  }, [uri]);

  function handleStatus(status: AVPlaybackStatus) {
    if (status.isLoaded) setIsReady(true);
    if (!status.isLoaded && status.error) setError(true);
  }

  async function handleFullscreenUpdate(event: VideoFullscreenUpdateEvent) {
    if (Platform.OS === "web") return;
    if (
      event.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_PRESENT ||
      event.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_WILL_PRESENT
    ) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else if (
      event.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_DISMISS ||
      event.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_WILL_DISMISS
    ) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }

  function selectQuality(q: QualityOption) {
    setActiveQuality(q);
    setShowQualityMenu(false);
    setIsReady(false);
  }

  const wPos = WATERMARK_POSITIONS[posIdx];

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: "#000" }]}>
        <Feather name="alert-circle" size={40} color={colors.destructive} />
        <Text style={styles.errorText}>Failed to load video</Text>
        {onClose && (
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Video
        ref={videoRef}
        source={{ uri: activeQuality.uri, headers: VIDEO_HEADERS }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        shouldPlay
        onPlaybackStatusUpdate={handleStatus}
        onFullscreenUpdate={handleFullscreenUpdate}
      />

      {/* Loading overlay */}
      {!isReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}

      {/* Watermark */}
      <Animated.View
        style={[styles.watermark, { opacity }, wPos as Record<string, unknown>]}
        pointerEvents="none"
      >
        <Text style={styles.watermarkText}>{watermarkText}</Text>
      </Animated.View>

      {/* Back button */}
      {onClose && Platform.OS !== "web" && (
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={onClose}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Quality button — only shown for HLS with parsed options */}
      {qualities.length > 1 && (
        <TouchableOpacity
          style={[styles.qualityBtn, { top: insets.top + 8 }]}
          onPress={() => setShowQualityMenu((v) => !v)}
          activeOpacity={0.85}
        >
          <Feather name="sliders" size={14} color="#fff" />
          <Text style={styles.qualityBtnText}>{activeQuality.label}</Text>
        </TouchableOpacity>
      )}

      {/* Quality menu overlay */}
      {showQualityMenu && (
        <TouchableWithoutFeedback onPress={() => setShowQualityMenu(false)}>
          <View style={styles.qualityOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.qualityMenu}>
                <Text style={styles.qualityMenuTitle}>Video Quality</Text>
                {qualities.map((q) => (
                  <TouchableOpacity
                    key={q.label}
                    style={[
                      styles.qualityOption,
                      activeQuality.label === q.label && styles.qualityOptionActive,
                    ]}
                    onPress={() => selectQuality(q)}
                  >
                    <Text
                      style={[
                        styles.qualityOptionText,
                        activeQuality.label === q.label && styles.qualityOptionTextActive,
                      ]}
                    >
                      {q.label}
                    </Text>
                    {activeQuality.label === q.label && (
                      <Feather name="check" size={16} color="#6c63ff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },

  // Quality button
  qualityBtn: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    zIndex: 20,
  },
  qualityBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  // Quality menu
  qualityOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    justifyContent: "flex-end",
  },
  qualityMenu: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    gap: 4,
  },
  qualityMenuTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  qualityOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  qualityOptionActive: {
    backgroundColor: "rgba(108,99,255,0.15)",
  },
  qualityOptionText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "500",
  },
  qualityOptionTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
});
