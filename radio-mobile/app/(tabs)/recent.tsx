import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import StationCard from "../../components/StationCard";
import { useAppTheme } from "../../context/ThemeContext";
import { clearRecentStations, loadRecentStations } from "../../lib/storage";
import { Station } from "../../types/station";

export default function RecentScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [recentStations, setRecentStations] = useState<Station[]>([]);

  const loadData = useCallback(async () => {
    const storedRecent = await loadRecentStations();
    setRecentStations(storedRecent);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleClearRecent = async () => {
    await clearRecentStations();
    setRecentStations([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>
          Recently played
        </Text>

        {recentStations.length > 0 && (
          <Pressable
            onPress={handleClearRecent}
            style={[
              styles.clearButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.clearButtonText, { color: colors.textMuted }]}>
              Clear recent
            </Text>
          </Pressable>
        )}
      </View>

      {recentStations.length === 0 ? (
        <Text style={[styles.text, { color: colors.textMuted }]}>
          No recently played stations yet.
        </Text>
      ) : (
        <FlatList
          data={recentStations}
          keyExtractor={(item) => item.stationuuid}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <StationCard
              station={item}
              colors={colors}
              onPress={() =>
                router.push({
                  pathname: "/",
                  params: {
                    playStationUuid: item.stationuuid,
                    playName: item.name,
                    playUrl: item.url_resolved,
                    playCountry: item.country ?? "",
                    playFavicon: item.favicon ?? "",
                    playTags: item.tags ?? "",
                  },
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    flex: 1,
  },
  text: {
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  clearButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
