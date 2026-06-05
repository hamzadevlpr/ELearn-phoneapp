import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { api, ExamResult } from "@/lib/api";

export default function ExamScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t, isRTL } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);

  const { data: exam, isLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => api.exams.get(id!),
    enabled: !!id,
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function handleSubmit() {
    if (!exam || !id) return;
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex,
      }));
      const res = await api.exams.submit(id, payload);
      setResult(res);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || !exam) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    const passed = result.passed;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t.exam.result}</Text>
        </View>

        <ScrollView contentContainerStyle={[styles.resultScroll, { paddingBottom: insets.bottom + 40 }]}>
          <View style={[styles.resultCard, { backgroundColor: passed ? (colors.success + "15") : (colors.destructive + "15"), borderColor: passed ? (colors.success + "40") : (colors.destructive + "40") }]}>
            <View style={[styles.scoreCircle, { borderColor: passed ? colors.success : colors.destructive }]}>
              <Text style={[styles.scorePct, { color: passed ? colors.success : colors.destructive }]}>
                {pct}%
              </Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>{t.exam.score}</Text>
            </View>
            <Text style={[styles.resultStatus, { color: passed ? colors.success : colors.destructive }]}>
              {passed ? t.exam.passed : t.exam.failed}
            </Text>
          </View>

          <View style={[styles.statsRow]}>
            <View style={[styles.statChip, { backgroundColor: colors.success + "15", borderColor: colors.success + "30" }]}>
              <Feather name="check-circle" size={18} color={colors.success} />
              <Text style={[styles.statNum, { color: colors.success }]}>{result.correctCount}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t.exam.correct}</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}>
              <Feather name="x-circle" size={18} color={colors.destructive} />
              <Text style={[styles.statNum, { color: colors.destructive }]}>{result.wrongCount}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t.exam.wrong}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.backBtn2, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtn2Text}>{t.exam.backToCourse}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const questions = exam.questions ?? [];
  const currentQ = questions[currentIdx];
  const totalQ = questions.length;
  const progress = totalQ > 0 ? (currentIdx + 1) / totalQ : 0;

  if (totalQ === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{exam.title}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t.exam.empty}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {exam.title}
        </Text>
        <Text style={[styles.counter, { color: colors.mutedForeground }]}>
          {currentIdx + 1}/{totalQ}
        </Text>
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` as `${number}%` }]} />
      </View>

      <ScrollView contentContainerStyle={[styles.examScroll, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={[styles.questionText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
          {t.exam.question} {currentIdx + 1}: {currentQ?.text}
        </Text>

        <View style={styles.options}>
          {(currentQ?.options ?? []).map((opt, optIdx) => {
            const selected = answers[currentQ.id] === optIdx;
            return (
              <TouchableOpacity
                key={optIdx}
                style={[
                  styles.option,
                  {
                    backgroundColor: selected ? (colors.primary + "15") : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    flexDirection: isRTL ? "row-reverse" : "row",
                  },
                ]}
                onPress={async () => {
                  setAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }));
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.optionBullet,
                    {
                      backgroundColor: selected ? colors.primary : colors.background,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {selected && <Feather name="check" size={12} color="#fff" />}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    { color: selected ? colors.primary : colors.foreground, textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={[
          styles.navBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 12,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.navBtn, { borderColor: colors.border, opacity: currentIdx === 0 ? 0.4 : 1 }]}
          onPress={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={18} color={colors.foreground} />
          <Text style={[styles.navBtnText, { color: colors.foreground }]}>{t.exam.previous}</Text>
        </TouchableOpacity>

        {currentIdx < totalQ - 1 ? (
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnPrimary, { backgroundColor: colors.primary }]}
            onPress={() => setCurrentIdx((i) => Math.min(totalQ - 1, i + 1))}
          >
            <Text style={styles.navBtnPrimaryText}>{t.exam.next}</Text>
            <Feather name={isRTL ? "arrow-left" : "arrow-right"} size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnPrimary, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="check" size={18} color="#fff" />
                <Text style={styles.navBtnPrimaryText}>{t.exam.submit}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  counter: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBar: {
    height: 4,
    width: "100%",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  examScroll: {
    padding: 20,
    gap: 20,
  },
  questionText: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 26,
  },
  options: {
    gap: 10,
  },
  option: {
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  navBtnPrimary: {
    borderWidth: 0,
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  navBtnPrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  resultScroll: {
    padding: 20,
    gap: 20,
    alignItems: "center",
  },
  resultCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  scorePct: {
    fontSize: 32,
    fontWeight: "800",
  },
  scoreLabel: {
    fontSize: 12,
  },
  resultStatus: {
    fontSize: 22,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  statChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  statNum: {
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  backBtn2: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  backBtn2Text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: { fontSize: 15 },
});
