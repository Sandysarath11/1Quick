// app/context/ThemeContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: {
    background: string;
    backgroundGradient: [string, string, string]; // Fixed: Tuple of 3 strings
    card: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    textPrimary: string;
    icon: string;
    accent: string;
    statCard: [string, string]; // Fixed: Tuple of 2 strings
  };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
      } else {
        setTheme("light");
      }
    } catch (error) {
      console.log("Error loading theme:", error);
      setTheme("light");
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem("theme", newTheme);
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  };

  const isDarkMode = theme === "dark";

  const colors = {
    background: isDarkMode ? "#0f172a" : "#f8fafc",
    backgroundGradient: isDarkMode 
      ? ["#0f172a", "#1e1b4b", "#2d1b69"] as [string, string, string]
      : ["#f8fafc", "#f1f5f9", "#e2e8f0"] as [string, string, string],
    card: isDarkMode 
      ? "rgba(30, 27, 75, 0.6)"
      : "rgba(255, 255, 255, 0.8)",
    cardBorder: isDarkMode 
      ? "rgba(168, 85, 247, 0.2)"
      : "rgba(168, 85, 247, 0.15)",
    text: isDarkMode ? "#ffffff" : "#1f2937",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    textPrimary: isDarkMode ? "#f1f5f9" : "#0f172a",
    icon: isDarkMode ? "#f1f5f9" : "#475569",
    accent: "#a855f7",
    statCard: isDarkMode
      ? (["#7c3aed", "#a855f7"] as [string, string])
      : (["#8b5cf6", "#c084fc"] as [string, string]),
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;