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
  const [householdName, setHouseholdName] = useState("Hife Room");
  const [inviteCode, setInviteCode] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [currentInviteCode, setCurrentInviteCode] = useState("");
  const [currentRoomPassword, setCurrentRoomPassword] = useState("");
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
      show("Enter the room invite code", "error");
      return;
    }

    if (roomPassword.trim().length < 4) {
      show("Room password must be at least 4 characters", "error");
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
              roomPassword,
            })
          : await joinHouseholdByInviteCode({
              inviteCode,
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
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.intro}>
          <Text style={styles.title}>Set up your room</Text>
          <Text style={styles.subtitle}>
            Hife keeps requests, budgets, and discussions inside one shared
            room. Create a room, or join with an invite code and password.
          </Text>
        </View>

        {currentInviteCode ? (
          <View style={styles.inviteCard}>
            <Text style={styles.inviteLabel}>Your room invite code</Text>
            <Text style={styles.inviteCode}>{currentInviteCode}</Text>
            {currentRoomPassword ? (
              <>
                <Text style={styles.inviteLabel}>Room password</Text>
                <Text style={styles.invitePassword}>{currentRoomPassword}</Text>
              </>
            ) : null}
            <Text style={styles.inviteHelp}>
              Share the invite code and room password with trusted people only.
            </Text>
            <Pressable
              style={styles.continueButton}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={styles.continueText}>Continue to room</Text>
            </Pressable>
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
            <Text style={styles.label}>Room name</Text>
            <TextInput
              style={styles.input}
              value={householdName}
              onChangeText={setHouseholdName}
              placeholder="Example: Family, event, office"
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
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
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
          placeholder="Partner A, Partner B, or a custom label"
          placeholderTextColor="#8F867A"
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
                ? "Create Room"
                : "Join Room"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#FAF6EE",
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
  inviteCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#A85C44",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 18,
    padding: 14,
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
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DECE",
    borderRadius: 8,
    borderWidth: 1,
    color: "#3A2E28",
    fontSize: 15,
    padding: 11,
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
