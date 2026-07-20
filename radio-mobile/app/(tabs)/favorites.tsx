import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import StationCard from "../../components/StationCard";
import { useAppTheme } from "../../context/ThemeContext";
import { loadFavorites, saveFavorites } from "../../lib/storage";
import { Station } from "../../types/station";

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [favorites, setFavorites] = useState<Station[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const storedFavorites = await loadFavorites();
      setFavorites(storedFavorites);
    };

    loadData();
  }, []);

  const removeFavorite = async (station: Station) => {
    const updatedFavorites = favorites.filter(
      (fav) => fav.stationuuid !== station.stationuuid,
    );

    setFavorites(updatedFavorites);
    await saveFavorites(updatedFavorites);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Mėgstamos stotys
      </Text>

      {favorites.length === 0 ? (
        <Text style={[styles.text, { color: colors.textMuted }]}>
          Kol kas favoritų nėra.
        </Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.stationuuid}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <StationCard
              station={item}
              colors={colors}
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
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
});
