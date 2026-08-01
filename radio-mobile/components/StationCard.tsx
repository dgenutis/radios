import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Station } from "../types/station";

type StationCardColors = {
  background: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentText: string;
  danger: string;
};

type StationCardProps = {
  station: Station;
  colors: StationCardColors;
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
  colors,
  onPress,
  onFavoritePress,
  onLongPress,
}: StationCardProps) {
  const [imageError, setImageError] = useState(false);

  const showImage =
    !!station.favicon && station.favicon.startsWith("http") && !imageError;

  const cardBackgroundColor = isActive ? colors.surface : colors.card;
  const cardBorderColor = isActive ? colors.accent : colors.border;
  const favoriteBackgroundColor = isFavorite ? colors.accent : colors.surface;
  const favoriteTextColor = isFavorite ? colors.accentText : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${station.name}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: cardBorderColor,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.logoWrap}>
          {showImage ? (
            <Image
              source={{ uri: station.favicon }}
              style={[
                styles.logo,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View
              style={[
                styles.logoFallback,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.logoFallbackText, { color: colors.accent }]}>
                {station.name?.charAt(0)?.toUpperCase() || "R"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text
            numberOfLines={1}
            style={[styles.stationName, { color: colors.text }]}
          >
            {station.name}
          </Text>

          <Text
            numberOfLines={1}
            style={[styles.stationMeta, { color: colors.textMuted }]}
          >
            {station.country || "Unknown country"}
          </Text>

          {!!station.tags && (
            <Text
              numberOfLines={1}
              style={[styles.stationTags, { color: colors.textFaint }]}
            >
              {station.tags}
            </Text>
          )}
        </View>

        {onFavoritePress && (
          <Pressable
            onPress={onFavoritePress}
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite
                ? `Remove ${station.name} from favorites`
                : `Add ${station.name} to favorites`
            }
            accessibilityState={{ selected: isFavorite }}
            style={({ pressed }) => [
              styles.favoriteButton,
              {
                backgroundColor: favoriteBackgroundColor,
                borderColor: isFavorite ? colors.accent : colors.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text
              style={[styles.favoriteButtonText, { color: favoriteTextColor }]}
            >
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
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
    borderWidth: 1,
  },
  logoFallback: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  logoFallbackText: {
    fontSize: 22,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    paddingRight: 10,
  },
  stationName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  stationMeta: {
    fontSize: 14,
    marginBottom: 2,
  },
  stationTags: {
    fontSize: 12,
  },
  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    borderWidth: 1,
  },
  favoriteButtonText: {
    fontSize: 22,
    fontWeight: "700",
  },
});
