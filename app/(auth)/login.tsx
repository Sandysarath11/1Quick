// app/(auth)/login.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SESSION_KEY = "user_session";
const USER_DATA_KEY = "user_data";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await AsyncStorage.getItem(SESSION_KEY);
      if (session) {
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Session check error:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    
    try {
      if (email === "admin@gmail.com" && password === "123456") {
        const sessionId = Date.now().toString();
        const userData = {
          id: "1",
          email: email,
          name: "Admin User",
          loginTime: Date.now(),
        };
        
        await AsyncStorage.setItem(SESSION_KEY, sessionId);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        await AsyncStorage.setItem("loginTime", Date.now().toString());
        
        router.replace("/(tabs)");
      } else {
        Alert.alert("Error", "Invalid credentials. Use admin@gmail.com / 123456");
      }
    } catch (error) {
      Alert.alert("Error", "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Checking session...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <LinearGradient colors={["#a855f7", "#7c3aed"]} style={styles.logoCircle}>
            <Ionicons name="musical-note" size={50} color="#fff" />
          </LinearGradient>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Quick</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={secure}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Ionicons name={secure ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <LinearGradient colors={["#a855f7", "#7c3aed"]} style={styles.buttonGradient}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.demoText}>
            Demo: admin@gmail.com / 123456
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#94a3b8",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 40,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#ffffff",
  },
  button: {
    marginTop: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  demoText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 24,
    fontSize: 12,
  },
});