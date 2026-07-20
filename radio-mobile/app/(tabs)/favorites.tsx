import { useCallback, useState } from "react";
import { StyleSheet, Text, View, FlatList, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Station } from "../../types/station";
import StationCard from "../../components/StationCard";
import { loadFavorites, saveFavorites } from "../../lib/storage";
import * as Haptics from "expo-haptics";

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Station[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const data = await loadFavorites();
        setFavorites(data);
      };

      loadData();
    }, []),
  );

  const removeFavorite = async (station: Station) => {
    try {
      await Haptics.selectionAsync();

      const updatedFavorites = favorites.filter(
        (fav) => fav.stationuuid !== station.stationuuid,
      );

      setFavorites(updatedFavorites);
      await saveFavorites(updatedFavorites);
    } catch (err) {
      console.log("Nepavyko pašalinti iš favorites");
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mėgstamos stotys</Text>

      {favorites.length === 0 ? (
        <Text style={styles.text}>Kol kas favoritų nėra.</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.stationuuid}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <StationCard
              station={item}
              isFavorite={true}
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
              onFavoritePress={() => removeFavorite(item)}
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
});
