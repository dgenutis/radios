import Constants from "expo-constants";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

type Props = {
  backgroundColor?: string;
  primaryTextColor?: string;
  secondaryTextColor?: string;
};

export type AppLoaderHandle = {
  fadeOut: () => Promise<void>;
};

const AppLoader = forwardRef<AppLoaderHandle, Props>(
  (
    {
      backgroundColor = "#05060a",
      primaryTextColor = "#ffffff",
      secondaryTextColor = "#98a2b3",
    },
    ref,
  ) => {
    const version =
      Constants.expoConfig?.version || Constants.nativeAppVersion || "1.0.0";

    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslateY = useRef(new Animated.Value(18)).current;
    const contentScale = useRef(new Animated.Value(0.96)).current;
    const haloScale = useRef(new Animated.Value(0.9)).current;
    const haloOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloOpacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start();
    }, [
      overlayOpacity,
      haloOpacity,
      haloScale,
      contentOpacity,
      contentTranslateY,
      contentScale,
    ]);

    useImperativeHandle(ref, () => ({
      fadeOut: () =>
        new Promise((resolve) => {
          Animated.parallel([
            Animated.timing(contentOpacity, {
              toValue: 0,
              duration: 320,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(contentTranslateY, {
              toValue: -14,
              duration: 320,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(contentScale, {
              toValue: 0.985,
              duration: 320,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(haloOpacity, {
              toValue: 0,
              duration: 260,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 260,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]).start(() => resolve());
        }),
    }));

    return (
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor,
            opacity: overlayOpacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.halo,
            {
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
        />
        <View style={styles.noiseOverlay} />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [
                { translateY: contentTranslateY },
                { scale: contentScale },
              ],
            },
          ]}
        >
          <View style={styles.topRow}>
            <View style={styles.dot} />
            <Text style={[styles.author, { color: secondaryTextColor }]}>
              dgenutis
            </Text>
          </View>

          <Text style={[styles.title, { color: primaryTextColor }]}>
            RADIO MOBILE
          </Text>

          <View style={styles.versionPill}>
            <Text style={[styles.version, { color: secondaryTextColor }]}>
              v{version}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    );
  },
);

export default AppLoader;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  halo: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(90, 140, 255, 0.12)",
    shadowColor: "#6ea8ff",
    shadowOpacity: 0.35,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.015)",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: "#7dd3fc",
  },
  author: {
    fontSize: 13,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 5,
    textAlign: "center",
  },
  versionPill: {
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  version: {
    fontSize: 12,
    letterSpacing: 1.6,
    fontWeight: "600",
  },
});
