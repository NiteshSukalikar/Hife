import Header from "@/components/header";
import useToast from "@/components/toast/useToast";
import {
  createHousehold,
  getActiveHousehold,
  joinHouseholdByInviteCode,
} from "@/services/households";
import { logError } from "@/utils/safeLogger";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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
  const [householdName, setHouseholdName] = useState("Hife Household");
  const [inviteCode, setInviteCode] = useState("");
  const [currentInviteCode, setCurrentInviteCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getActiveHousehold()
      .then((household) => {
        if (household) {
          setCurrentInviteCode(household.inviteCode);
        }
      })
      .catch((error) => {
        logError("Failed to load household", error);
      });
  }, []);

  const submit = async () => {
    if (saving) return;

    if (!displayName.trim()) {
      show("Add your display name", "error");
      return;
    }

    if (mode === "join" && !inviteCode.trim()) {
      show("Enter the household invite code", "error");
      return;
    }

    try {
      setSaving(true);
      const household =
        mode === "create"
          ? await createHousehold({
              displayName,
              roleLabel,
              name: householdName,
            })
          : await joinHouseholdByInviteCode({
              inviteCode,
              displayName,
              roleLabel: roleLabel || "Partner B",
            });

      setCurrentInviteCode(household.inviteCode);
      show(
        mode === "create" ? "Household created" : "Household joined",
        "success"
      );
      router.replace("/(tabs)");
    } catch (error) {
      logError("Household setup failed", error);
      show(
        error instanceof Error ? error.message : "Household setup failed",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setRoleLabel(nextMode === "create" ? "Partner A" : "Partner B");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.intro}>
          <Text style={styles.title}>Set up your household</Text>
          <Text style={styles.subtitle}>
            Hife keeps requests and discussions inside one shared household.
            Create a household, or join your partner with an invite code.
          </Text>
        </View>

        {currentInviteCode ? (
          <View style={styles.inviteCard}>
            <Text style={styles.inviteLabel}>Your invite code</Text>
            <Text style={styles.inviteCode}>{currentInviteCode}</Text>
            <Text style={styles.inviteHelp}>
              Share this with your partner so they can join the same household.
            </Text>
          </View>
        ) : null}

        <View style={styles.segmented}>
          <Pressable
            style={[styles.segment, mode === "create" && styles.segmentActive]}
            onPress={() => switchMode("create")}
          >
            <Text
              style={[
                styles.segmentText,
                mode === "create" && styles.segmentTextActive,
              ]}
            >
              Create
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
              Join
            </Text>
          </Pressable>
        </View>

        {mode === "create" ? (
          <>
            <Text style={styles.label}>Household name</Text>
            <TextInput
              style={styles.input}
              value={householdName}
              onChangeText={setHouseholdName}
              placeholder="Example: Sharma home"
              placeholderTextColor="#71717A"
              maxLength={40}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Invite code</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor="#71717A"
              autoCapitalize="characters"
              maxLength={12}
            />
          </>
        )}

        <Text style={styles.label}>Your display name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="What should your partner see?"
          placeholderTextColor="#71717A"
          maxLength={32}
        />

        <Text style={styles.label}>Role label</Text>
        <TextInput
          style={styles.input}
          value={roleLabel}
          onChangeText={setRoleLabel}
          placeholder="Partner A, Partner B, or a custom label"
          placeholderTextColor="#71717A"
          maxLength={32}
        />

        <Pressable
          style={[styles.primaryButton, saving && styles.disabledButton]}
          disabled={saving}
          onPress={submit}
        >
          <Text style={styles.primaryText}>
            {saving
              ? "Saving..."
              : mode === "create"
                ? "Create Household"
                : "Join Household"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#050505",
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  intro: {
    marginBottom: 18,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  inviteCard: {
    backgroundColor: "#101312",
    borderColor: "#39FF14",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 18,
    padding: 14,
  },
  inviteLabel: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  inviteCode: {
    color: "#39FF14",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 4,
  },
  inviteHelp: {
    color: "#B8FFB0",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  segmented: {
    backgroundColor: "#101312",
    borderColor: "#263026",
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
    backgroundColor: "#39FF14",
  },
  segmentText: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#050505",
  },
  label: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#101312",
    borderColor: "#263026",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F8FAFC",
    fontSize: 15,
    padding: 11,
  },
  codeInput: {
    fontWeight: "800",
    letterSpacing: 2,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#39FF14",
    borderRadius: 8,
    marginTop: 24,
    paddingVertical: 14,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryText: {
    color: "#050505",
    fontSize: 16,
    fontWeight: "800",
  },
});
