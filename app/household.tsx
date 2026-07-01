import Header from "@/components/header";
import useToast from "@/components/toast/useToast";
import {
  createHousehold,
  getActiveHousehold,
  joinHouseholdByInviteCode,
} from "@/services/households";
import { logError } from "@/utils/safeLogger";
import {
  buildInviteGuidance,
  normalizeInviteCode,
  validateHouseholdSetup,
} from "@/utils/onboardingSetup";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Mode = "create" | "join";

export default function HouseholdScreen() {
  const router = useRouter();
  const { show } = useToast();

  const [mode, setMode] = useState<Mode>("create");
  const [displayName, setDisplayName] = useState("");
  const [roleLabel, setRoleLabel] = useState("Partner A");
  const [householdName, setHouseholdName] = useState("Hife Room");
  const [inviteCode, setInviteCode] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [currentInviteCode, setCurrentInviteCode] = useState("");
  const [currentRoomPassword, setCurrentRoomPassword] = useState("");
  const monthlyBudgetInput = "";
  const categoryNamesInput = "Other";
  const [loadingHousehold, setLoadingHousehold] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadActiveHousehold = useCallback(() => {
    setLoadingHousehold(true);
    setSetupError(null);
    getActiveHousehold()
      .then((household) => {
        if (household) {
          setCurrentInviteCode(household.inviteCode);
        }
      })
      .catch((error) => {
        logError("Failed to load household", error);
        setSetupError(
          "We could not check your room yet. Your data is not changed. Try again when the connection settles."
        );
      })
      .finally(() => {
        setLoadingHousehold(false);
      });
  }, []);

  useEffect(() => {
    loadActiveHousehold();
  }, [loadActiveHousehold]);

  const submit = async () => {
    if (saving) return;

    const validation = validateHouseholdSetup({
      mode,
      displayName,
      roleLabel,
      householdName,
      inviteCode,
      roomPassword,
      monthlyBudgetInput,
      categoryNamesInput,
    });

    if (!validation.isValid) {
      show(validation.message, "error");
      setSetupError(validation.message);
      return;
    }

    try {
      setSaving(true);
      setSetupError(null);
      const household =
        mode === "create"
          ? await createHousehold({
              displayName,
              roleLabel,
              name: householdName,
              roomPassword,
            })
          : await joinHouseholdByInviteCode({
              inviteCode: normalizeInviteCode(inviteCode),
              roomPassword,
              displayName,
              roleLabel: roleLabel || "Partner B",
            });

      setCurrentInviteCode(household.inviteCode);
      setCurrentRoomPassword(mode === "create" ? roomPassword : "");

      show(
        mode === "create" ? "Room created" : "Room joined",
        "success"
      );
      if (mode === "join") {
        router.replace("/(tabs)");
      }
    } catch (error) {
      logError("Room setup failed", error);
      const message =
        mode === "join" &&
        error instanceof Error &&
        error.message.toLowerCase().includes("permission")
          ? "Invite code or room password is incorrect"
          : error instanceof Error
            ? error.message
            : "Room setup failed";

      setSetupError(message);
      show(
        message,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setRoleLabel(nextMode === "create" ? "Partner A" : "Partner B");
    setSetupError(null);
  };

  const inviteGuidance = buildInviteGuidance(
    currentInviteCode,
    !!currentRoomPassword
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>Shared purchase decisions</Text>
          <Text style={styles.title}>Set up your Hife room</Text>
          <Text style={styles.subtitle}>
            Hife helps a household decide what is safe to buy before money is
            spent. Start with a room, a simple role, and an optional first
            monthly budget.
          </Text>
        </View>

        <View style={styles.explainerGrid}>
          <View style={styles.explainerCard}>
            <Text style={styles.explainerTitle}>Decide together</Text>
            <Text style={styles.explainerText}>
              Requests, reasons, and decisions stay in one shared room.
            </Text>
          </View>
          <View style={styles.explainerCard}>
            <Text style={styles.explainerTitle}>Check the budget first</Text>
            <Text style={styles.explainerText}>
              A monthly budget helps Hife show safe-to-spend before approvals.
            </Text>
          </View>
        </View>

        {loadingHousehold ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Checking your room</Text>
            <Text style={styles.noticeText}>
              This should only take a moment. Returning users go straight back
              to their active room.
            </Text>
          </View>
        ) : null}

        {setupError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Setup needs another try</Text>
            <Text style={styles.errorText}>{setupError}</Text>
            <Pressable style={styles.retryButton} onPress={loadActiveHousehold}>
              <Text style={styles.retryText}>Retry check</Text>
            </Pressable>
          </View>
        ) : null}

        {currentInviteCode ? (
          <View style={styles.inviteCard}>
            <Text style={styles.inviteTitle}>{inviteGuidance.title}</Text>
            <Text style={styles.inviteLabel}>Your room invite code</Text>
            <Text style={styles.inviteCode}>{currentInviteCode}</Text>
            {currentRoomPassword ? (
              <>
                <Text style={styles.inviteLabel}>Room password</Text>
                <Text style={styles.invitePassword}>{currentRoomPassword}</Text>
              </>
            ) : null}
            <Text style={styles.inviteHelp}>
              {inviteGuidance.body}
            </Text>
            <Pressable
              style={styles.continueButton}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={styles.continueText}>Continue to room</Text>
            </Pressable>
          </View>
        ) : null}

        {!currentInviteCode ? (
          <>
            <View style={styles.segmented}>
              <Pressable
                style={[
                  styles.segment,
                  mode === "create" && styles.segmentActive,
                ]}
                onPress={() => switchMode("create")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    mode === "create" && styles.segmentTextActive,
                  ]}
                >
                  Create room
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segment, mode === "join" && styles.segmentActive]}
                onPress={() => switchMode("join")}
              >
                <Text
                  style={[
                    styles.segmentText,
                    mode === "join" && styles.segmentTextActive,
                  ]}
                >
                  Join room
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Room details</Text>
            {mode === "create" ? (
              <>
                <Text style={styles.label}>Room name</Text>
                <TextInput
                  style={styles.input}
                  value={householdName}
                  onChangeText={setHouseholdName}
                  placeholder="Example: Home, wedding, shared flat"
                  placeholderTextColor="#8F867A"
                  maxLength={40}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Invite code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(normalizeInviteCode(text))}
                  placeholder="ABC123"
                  placeholderTextColor="#8F867A"
                  autoCapitalize="characters"
                  maxLength={12}
                />
              </>
            )}

            <Text style={styles.label}>Room password</Text>
            <TextInput
              style={styles.input}
              value={roomPassword}
              onChangeText={setRoomPassword}
              placeholder={
                mode === "create"
                  ? "Create a password for this room"
                  : "Enter the room password"
              }
              placeholderTextColor="#8F867A"
              secureTextEntry
              maxLength={40}
            />
            <Text style={styles.helpText}>
              The invite code finds the room. The password is a simple shared
              check so only people you trust can join.
            </Text>

            <Text style={styles.sectionTitle}>Your profile</Text>
            <Text style={styles.label}>Your display name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="What should your partner see?"
              placeholderTextColor="#8F867A"
              maxLength={32}
            />

            <Text style={styles.label}>Role label</Text>
            <TextInput
              style={styles.input}
              value={roleLabel}
              onChangeText={setRoleLabel}
              placeholder="Partner, roommate, parent, or custom"
              placeholderTextColor="#8F867A"
              maxLength={32}
            />
            <Text style={styles.helpText}>
              You can use practical labels now and edit the wording later as the
              room grows.
            </Text>

            <Pressable
              style={[styles.primaryButton, saving && styles.disabledButton]}
              disabled={saving}
              onPress={submit}
            >
              <Text style={styles.primaryText}>
                {saving
                  ? "Saving..."
                  : mode === "create"
                    ? "Create room"
                    : "Join room"}
              </Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#FAF6EE",
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 120,
  },
  intro: {
    marginBottom: 18,
  },
  eyebrow: {
    color: "#A85C44",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    color: "#3A2E28",
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: "#8F867A",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  explainerGrid: {
    gap: 10,
    marginBottom: 18,
  },
  explainerCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  explainerTitle: {
    color: "#3A2E28",
    fontSize: 15,
    fontWeight: "900",
  },
  explainerText: {
    color: "#776E64",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  noticeCard: {
    backgroundColor: "#FFFDF8",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  noticeTitle: {
    color: "#3A2E28",
    fontSize: 14,
    fontWeight: "900",
  },
  noticeText: {
    color: "#776E64",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  errorCard: {
    backgroundColor: "#FFF4EF",
    borderColor: "#D89A82",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  errorTitle: {
    color: "#7A341E",
    fontSize: 14,
    fontWeight: "900",
  },
  errorText: {
    color: "#7A341E",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: "#A85C44",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  retryText: {
    color: "#A85C44",
    fontSize: 13,
    fontWeight: "900",
  },
  inviteCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#A85C44",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 18,
    padding: 14,
  },
  inviteTitle: {
    color: "#3A2E28",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
  inviteLabel: {
    color: "#8F867A",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  inviteCode: {
    color: "#A85C44",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 4,
  },
  invitePassword: {
    color: "#3A2E28",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 4,
  },
  inviteHelp: {
    color: "#7A8C6E",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: "#A85C44",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 46,
  },
  continueText: {
    color: "#FAF6EE",
    fontSize: 14,
    fontWeight: "900",
  },
  segmented: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 16,
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    paddingVertical: 10,
  },
  segmentActive: {
    backgroundColor: "#A85C44",
  },
  segmentText: {
    color: "#8F867A",
    fontSize: 14,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#FAF6EE",
  },
  label: {
    color: "#3A2E28",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 12,
  },
  sectionTitle: {
    color: "#6F7F6A",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 16,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    color: "#3A2E28",
    fontSize: 15,
    padding: 11,
  },
  helpText: {
    color: "#776E64",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  codeInput: {
    fontWeight: "800",
    letterSpacing: 2,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#A85C44",
    borderRadius: 8,
    marginTop: 24,
    paddingVertical: 14,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryText: {
    color: "#FAF6EE",
    fontSize: 16,
    fontWeight: "800",
  },
});
