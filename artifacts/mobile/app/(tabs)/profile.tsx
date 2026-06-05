import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import APP_CONFIG from "@/constants/config";
import { router } from "expo-router";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function handleLogout() {
    if (Platform.OS === "web") {
      await logout();
      router.replace("/login");
      return;
    }
    Alert.alert("", t.profile.logoutConfirm, [
      { text: t.profile.no, style: "cancel" },
      {
        text: t.profile.yes,
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  function Row({
    icon,
    label,
    value,
    children,
  }: {
    icon: string;
    label: string;
    value?: string;
    children?: React.ReactNode;
  }) {
    return (
      <View
        style={[
          styles.row,
          { borderBottomColor: colors.border, flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <View style={[styles.rowLeft, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <View style={[styles.rowIconBg, { backgroundColor: colors.secondary }]}>
            <Feather name={icon as never} size={17} color={colors.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        </View>
        {children ?? (
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
        )}
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
          {t.profile.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: colors.primary + "40" }]}>
            <View style={[styles.avatarInner, { backgroundColor: colors.secondary }]}>
              {user?.image ? (
                <Image source={{ uri: user.image }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Feather name="user" size={44} color={colors.primary} />
              )}
            </View>
          </View>
          <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name}</Text>
          <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>{user?.phone}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row icon="user" label={t.profile.name} value={user?.name} />
          <Row icon="phone" label={t.profile.phone} value={user?.phone} />
          {user?.grade ? <Row icon="layers" label={t.profile.grade} value={user.grade} /> : null}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row icon="globe" label={t.profile.language}>
            <View style={styles.langToggle}>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  language === "ar" && { backgroundColor: colors.primary },
                ]}
                onPress={() => setLanguage("ar")}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    { color: language === "ar" ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  ع
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  language === "en" && { backgroundColor: colors.primary },
                ]}
                onPress={() => setLanguage("en")}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    { color: language === "en" ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  EN
                </Text>
              </TouchableOpacity>
            </View>
          </Row>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row icon="info" label={t.profile.version} value={`v1.0.0 • ${APP_CONFIG.TENANT_ID}`} />
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>{t.profile.logout}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 88, height: 88 },
  userName: {
    fontSize: 20,
    fontWeight: "700",
  },
  userPhone: {
    fontSize: 14,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowLeft: {
    alignItems: "center",
    gap: 12,
  },
  rowIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  rowValue: {
    fontSize: 14,
  },
  langToggle: {
    flexDirection: "row",
    gap: 4,
  },
  langBtn: {
    width: 40,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
