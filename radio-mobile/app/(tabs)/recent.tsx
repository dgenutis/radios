import { useCallback, useState } from "react";
import { StyleSheet, Text, View, FlatList, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { clearRecentStations, loadRecentStations } from "../../lib/storage";
import { Station } from "../../types/station";
import StationCard from "../../components/StationCard";
export default function RecentScreen() {
  const [recentStations, setRecentStations] = useState<Station[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const data = await loadRecentStations();
        setRecentStations(data);
      };

      loadData();
    }, []),
  );


  const handleClearRecent = async () => {
    try {
      await Haptics.selectionAsync();
      await clearRecentStations();
      setRecentStations([]);
    } catch (err) {
      console.log("Nepavyko išvalyti recent stočių");
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Neseniai klausytos</Text>
      {recentStations.length > 0 && (
        <Pressable style={styles.clearButton} onPress={handleClearRecent}>
          <Text style={styles.clearButtonText}>Clear Recent</Text>
        </Pressable>
      )}

      {recentStations.length === 0 ? (
        <Text style={styles.text}>Kol kas recent stočių nėra.</Text>
      ) : (
        <FlatList
          data={recentStations}
          keyExtractor={(item) => item.stationuuid}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <StationCard
              station={item}
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
    backgroundColor: "#0f172a",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  text: {
    color: "#94a3b8",
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  stationName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  stationCountry: {
    color: "#94a3b8",
    fontSize: 14,
  },
  clearButton: {
    alignSelf: "flex-start",
    backgroundColor: "#1f2937",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  clearButtonText: {
    color: "#fca5a5",
    fontSize: 14,
    fontWeight: "700",
  },
});
