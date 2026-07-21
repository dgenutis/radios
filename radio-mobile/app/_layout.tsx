import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import "react-native-reanimated";

import AppLoader, { AppLoaderHandle } from "../components/AppLoader";
import {
  ThemeProvider as AppThemeProvider,
  useAppTheme,
} from "../context/ThemeContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { activeTheme } = useAppTheme();
  const [isAppReady, setIsAppReady] = useState(false);
  const loaderRef = useRef<AppLoaderHandle>(null);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await loaderRef.current?.fadeOut();
      } finally {
        setIsAppReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, []);

  if (!isAppReady) {
    return (
      <AppLoader
        ref={loaderRef}
        backgroundColor={activeTheme === "dark" ? "#05060a" : "#f4f6fb"}
        primaryTextColor={activeTheme === "dark" ? "#ffffff" : "#101218"}
        secondaryTextColor={activeTheme === "dark" ? "#9aa0aa" : "#5f6673"}
      />
    );
  }

  return (
    <NavigationThemeProvider
      value={activeTheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>

      <StatusBar style={activeTheme === "dark" ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigator />
    </AppThemeProvider>
  );
}
