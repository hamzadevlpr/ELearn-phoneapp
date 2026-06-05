import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void>;
  courseName: string;
}

export function AccessCodeModal({ visible, onClose, onSubmit, courseName }: Props) {
  const colors = useColors();
  const { t, isRTL } = useLanguage();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!code.trim()) return;
    setError("");
    setLoading(true);
    try {
      await onSubmit(code.trim());
      setCode("");
    } catch {
      setError(t.courseDetail.invalidCode);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setCode("");
    setError("");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={[styles.iconBg, { backgroundColor: colors.secondary }]}>
              <Feather name="lock" size={24} color={colors.primary} />
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            {t.courseDetail.enterCode}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
            {courseName}
          </Text>

          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              {t.courseDetail.codeLabel}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: error ? colors.destructive : colors.border,
                  color: colors.foreground,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
              value={code}
              onChangeText={(v) => {
                setCode(v);
                setError("");
              }}
              placeholder={t.courseDetail.codePlaceholder}
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { borderColor: colors.border }]}
              onPress={handleClose}
            >
              <Text style={[styles.btnText, { color: colors.mutedForeground }]}>
                {t.courseDetail.cancel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                  {t.courseDetail.confirm}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    letterSpacing: 2,
  },
  error: {
    fontSize: 13,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    borderWidth: 1.5,
  },
  confirmBtn: {},
  btnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
