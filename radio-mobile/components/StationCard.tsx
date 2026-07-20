import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Station } from "../types/station";

type StationCardProps = {
  station: Station;
  isActive?: boolean;
  isFavorite?: boolean;
  onPress: () => void;
  onFavoritePress?: () => void;
  onLongPress?: () => void;
};

export default function StationCard({
  station,
  isActive = false,
  isFavorite = false,
  onPress,
  onFavoritePress,
  onLongPress,
}: StationCardProps) {
  const [imageError, setImageError] = useState(false);

  const showImage =
    !!station.favicon && station.favicon.startsWith("http") && !imageError;

  return (
    <Pressable
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.row}>
        <View style={styles.logoWrap}>
          {showImage ? (
            <Image
              source={{ uri: station.favicon }}
              style={styles.logo}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={styles.logoFallbackText}>
                {station.name?.charAt(0)?.toUpperCase() || "R"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.stationName}>
            {station.name}
          </Text>

          <Text numberOfLines={1} style={styles.stationMeta}>
            {station.country || "Unknown country"}
          </Text>

          {!!station.tags && (
            <Text numberOfLines={1} style={styles.stationTags}>
              {station.tags}
            </Text>
          )}
        </View>

        {onFavoritePress && (
          <Pressable style={styles.favoriteButton} onPress={onFavoritePress}>
            <Text style={styles.favoriteButtonText}>
              {isFavorite ? "★" : "☆"}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardActive: {
    borderColor: "#38bdf8",
    backgroundColor: "#172554",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoWrap: {
    marginRight: 12,
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#0f172a",
  },
  logoFallback: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  logoFallbackText: {
    color: "#38bdf8",
    fontSize: 22,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    paddingRight: 10,
  },
  stationName: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  stationMeta: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 2,
  },
  stationTags: {
    color: "#94a3b8",
    fontSize: 12,
  },
  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  favoriteButtonText: {
    color: "#fbbf24",
    fontSize: 22,
    fontWeight: "700",
  },
});
