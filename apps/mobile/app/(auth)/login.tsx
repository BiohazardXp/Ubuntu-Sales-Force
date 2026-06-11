import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { Colors, Spacing, Radius, FontSize } from "../../src/constants/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your username and password.");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      Alert.alert(
        "Login failed",
        Array.isArray(msg) ? msg[0] : (msg ?? "Invalid username or password."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <View style={s.logoBox}>
            <Text style={s.logoText}>U</Text>
          </View>
          <Text style={s.appName}>Ubuntu Sales</Text>
          <Text style={s.tagline}>Field sales intelligence platform</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Welcome back</Text>
          <Text style={s.cardSub}>Sign in to your account</Text>

          <Text style={s.label}>Username</Text>
          <TextInput
            style={s.input}
            placeholder="Enter your username"
            placeholderTextColor={Colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={[s.label, { marginTop: Spacing.md }]}>Password</Text>
          <View style={s.passwordRow}>
            <TextInput
              style={[s.input, s.passwordInput]}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowPass((p) => !p)}
            >
              <Text style={{ fontSize: 16 }}>{showPass ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textInverse} size="small" />
            ) : (
              <Text style={s.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>
          Having trouble? Contact your system administrator.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  scroll: { flexGrow: 1, justifyContent: "center", padding: Spacing.lg },
  header: { alignItems: "center", marginBottom: Spacing.xl },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  logoText: { fontSize: 28, fontWeight: "700", color: Colors.textInverse },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },
  tagline: { fontSize: FontSize.sm, color: "#64748b" },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: "#f8fafc",
  },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  passwordInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  eyeBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 0,
    borderTopRightRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  btnDisabled: { backgroundColor: "#93c5fd" },
  btnText: {
    color: Colors.textInverse,
    fontSize: FontSize.base,
    fontWeight: "700",
  },
  footer: { textAlign: "center", fontSize: FontSize.xs, color: "#475569" },
});
