import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import StationCard from "../../components/StationCard";
import { useAppTheme } from "../../context/ThemeContext";
import {
  addStationToRecent,
  loadFavorites,
  loadRecentStations,
  saveFavorites,
  saveRecentStations,
} from "../../lib/storage";
import { Station } from "../../types/station";

const COUNTRY_OPTIONS = [
  { label: "Lietuva", value: "LT" },
  { label: "Latvija", value: "LV" },
  { label: "Estija", value: "EE" },
  { label: "Lenkija", value: "PL" },
  { label: "Vokietija", value: "DE" },
  { label: "Jungtinė Karalystė", value: "GB" },
  { label: "Jungtinės Valstijos", value: "US" },
];

type ThemeMode = "system" | "light" | "dark";

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: "Sistema", value: "system" },
  { label: "Šviesi", value: "light" },
  { label: "Tamsi", value: "dark" },
];

const RADIO_BROWSER_SERVERS = [
  "https://de1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://fr1.api.radio-browser.info",
];

async function fetchStationsByCountry(countryCode: string) {
  let lastError: unknown = null;

  for (const server of RADIO_BROWSER_SERVERS) {
    try {
      const res = await fetch(
        `${server}/json/stations/bycountrycodeexact/${countryCode}?hidebroken=true&limit=30`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        throw new Error(`Serveris ${server} grąžino ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Nepavyko gauti stočių iš Radio Browser");
}

export default function HomeScreen() {
  const { colors, themeMode, setTheme } = useAppTheme();

  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [favorites, setFavorites] = useState<Station[]>([]);
  const [recentStations, setRecentStations] = useState<Station[]>([]);
  const [nowPlayingText, setNowPlayingText] = useState("Nėra duomenų");
  const [selectedCountry, setSelectedCountry] = useState("LT");

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status?.playing ?? false;
  const isBuffering = status?.isBuffering ?? false;

  const params = useLocalSearchParams<{
    playStationUuid?: string;
    playName?: string;
    playUrl?: string;
    playCountry?: string;
    playFavicon?: string;
    playTags?: string;
  }>();

  useEffect(() => {
    const setupAudio = async () => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: "doNotMix",
      });
    };

    setupAudio();
  }, []);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedFavorites = await loadFavorites();
        const storedRecent = await loadRecentStations();

        setFavorites(storedFavorites);
        setRecentStations(storedRecent);
      } catch {
        setError("Nepavyko užkrauti išsaugotų duomenų");
      }
    };

    loadStoredData();
  }, []);

  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchStationsByCountry(selectedCountry);

        const preparedStations = data
          .filter(
            (station: any) =>
              station.name && station.url_resolved && station.lastcheckok === 1,
          )
          .sort((a: any, b: any) => (b.clickcount || 0) - (a.clickcount || 0))
          .slice(0, 50)
          .map((station: any) => ({
            stationuuid: station.stationuuid,
            name: station.name.trim(),
            url_resolved: station.url_resolved,
            favicon: station.favicon || "",
            country: station.country || "",
            tags: station.tags || "",
          }));

        setStations(preparedStations);
      } catch (err: any) {
        setError(err.message || "Įvyko klaida kraunant stotis");
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, [selectedCountry]);

  const filteredStations = useMemo(() => {
    return stations.filter((station) =>
      station.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [stations, searchTerm]);

  const sections = [{ title: "Visos stotys", data: filteredStations }];

  const handleThemeChange = async (value: ThemeMode) => {
    await setTheme(value);
  };

  const handleSelectStation = async (station: Station) => {
    const sameStation = currentStation?.stationuuid === station.stationuuid;

    if (!sameStation) {
      setCurrentStation(station);
      setNowPlayingText("Nėra duomenų");
      player.replace({ uri: station.url_resolved });

      player.setActiveForLockScreen(true, {
        title: station.name,
        artist: station.country || "Radio station",
        albumTitle: "Radio",
        artworkUrl: station.favicon || undefined,
      });

      const updatedRecent = addStationToRecent(recentStations, station);
      setRecentStations(updatedRecent);
      await saveRecentStations(updatedRecent);
    } else {
      setCurrentStation(station);
    }
  };

  useEffect(() => {
    const autoPlayFromParams = async () => {
      if (!params.playStationUuid || !params.playUrl || !params.playName) {
        return;
      }

      const stationFromParams: Station = {
        stationuuid: String(params.playStationUuid),
        name: String(params.playName),
        url_resolved: String(params.playUrl),
        country: params.playCountry ? String(params.playCountry) : "",
        favicon: params.playFavicon ? String(params.playFavicon) : "",
        tags: params.playTags ? String(params.playTags) : "",
      };

      const sameStation =
        currentStation?.stationuuid === stationFromParams.stationuuid;

      if (!sameStation) {
        setCurrentStation(stationFromParams);
        setNowPlayingText("Nėra duomenų");
        player.replace({ uri: stationFromParams.url_resolved });

        player.setActiveForLockScreen(true, {
          title: stationFromParams.name,
          artist: stationFromParams.country || "Radio station",
          albumTitle: "Radio",
          artworkUrl: stationFromParams.favicon || undefined,
        });

        player.play();

        const updatedRecent = addStationToRecent(
          recentStations,
          stationFromParams,
        );
        setRecentStations(updatedRecent);
        await saveRecentStations(updatedRecent);
      } else if (!isPlaying) {
        player.play();
      }
    };

    autoPlayFromParams();
  }, [
    params.playStationUuid,
    params.playName,
    params.playUrl,
    params.playCountry,
    params.playFavicon,
    params.playTags,
  ]);

  const handleTogglePlay = async () => {
    if (!currentStation) return;

    try {
      await Haptics.selectionAsync();

      if (!isPlaying) {
        player.setActiveForLockScreen(true, {
          title: currentStation.name,
          artist: currentStation.country || "Radio station",
          albumTitle: "Radio",
          artworkUrl: currentStation.favicon || undefined,
        });

        player.play();
      } else {
        player.pause();
      }
    } catch {
      setError("Nepavyko paleisti audio srauto");
    }
  };

  const handleStop = async () => {
    try {
      setError("");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      player.pause();
      player.clearLockScreenControls();
      setCurrentStation(null);
      setNowPlayingText("Nėra duomenų");
    } catch {
      setError("Nepavyko sustabdyti grojimo");
    }
  };

  const toggleFavorite = async (station: Station) => {
    try {
      const exists = favorites.some(
        (fav) => fav.stationuuid === station.stationuuid,
      );

      let updatedFavorites: Station[];

      if (exists) {
        updatedFavorites = favorites.filter(
          (fav) => fav.stationuuid !== station.stationuuid,
        );
      } else {
        updatedFavorites = [...favorites, station];
      }

      setFavorites(updatedFavorites);
      await saveFavorites(updatedFavorites);
    } catch {
      setError("Nepavyko išsaugoti mėgstamų stočių");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Radio stotys</Text>

      <TextInput
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Ieškoti stoties..."
        placeholderTextColor={colors.textFaint}
        style={[
          styles.searchInput,
          {
            backgroundColor: colors.surface,
            color: colors.text,
          },
        ]}
      />

      <View style={[styles.pickerWrapper, { backgroundColor: colors.surface }]}>
        <Picker
          selectedValue={selectedCountry}
          onValueChange={(itemValue) => setSelectedCountry(itemValue)}
          style={[styles.picker, { color: colors.text }]}
          dropdownIconColor={colors.text}
        >
          {COUNTRY_OPTIONS.map((country) => (
            <Picker.Item
              key={country.value}
              label={country.label}
              value={country.value}
            />
          ))}
        </Picker>
      </View>

      <View style={[styles.pickerWrapper, { backgroundColor: colors.surface }]}>
        <Picker
          selectedValue={themeMode}
          onValueChange={(itemValue) =>
            handleThemeChange(itemValue as ThemeMode)
          }
          style={[styles.picker, { color: colors.text }]}
          dropdownIconColor={colors.text}
        >
          {THEME_OPTIONS.map((theme) => (
            <Picker.Item
              key={theme.value}
              label={theme.label}
              value={theme.value}
            />
          ))}
        </Picker>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Kraunamos stotys...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.stationuuid}
          renderSectionHeader={({ section }) =>
            section.data.length > 0 ? (
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                {section.title}
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            const isActive = currentStation?.stationuuid === item.stationuuid;
            const isFavorite = favorites.some(
              (fav) => fav.stationuuid === item.stationuuid,
            );

            return (
              <StationCard
                station={item}
                isActive={isActive}
                isFavorite={isFavorite}
                colors={colors}
                onPress={() => handleSelectStation(item)}
                onLongPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  toggleFavorite(item);
                }}
                onFavoritePress={() => toggleFavorite(item)}
              />
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textFaint }]}>
              Nieko nerasta
            </Text>
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {currentStation && (
        <View
          style={[
            styles.playerBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.playerInfo}>
            <Text style={[styles.playerLabel, { color: colors.textFaint }]}>
              {isBuffering
                ? "Kraunama..."
                : isPlaying
                  ? "Dabar groja"
                  : "Pasirinkta stotis"}
            </Text>
            <Text style={[styles.playerTitle, { color: colors.text }]}>
              {currentStation.name}
            </Text>
            <Text style={[styles.playerMeta, { color: colors.textMuted }]}>
              {nowPlayingText}
            </Text>
            <Text style={[styles.playerSubtitle, { color: colors.textMuted }]}>
              {currentStation.country}
            </Text>
          </View>

          <View style={styles.playerActions}>
            <Pressable
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.surface },
              ]}
              onPress={handleStop}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: colors.textMuted },
                ]}
              >
                Stop
              </Text>
            </Pressable>

            <Pressable
              style={[styles.playerButton, { backgroundColor: colors.accent }]}
              onPress={handleTogglePlay}
            >
              <Text
                style={[styles.playerButtonText, { color: colors.accentText }]}
              >
                {isBuffering ? "..." : isPlaying ? "Pause" : "Play"}
              </Text>
            </Pressable>
          </View>
        </View>
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
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 24,
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  infoText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  playerBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  playerInfo: {
    flex: 1,
    paddingRight: 12,
  },
  playerLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  playerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  playerSubtitle: {
    fontSize: 14,
  },
  playerButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  playerButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 8,
  },
  playerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  playerMeta: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 2,
  },
  pickerWrapper: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  picker: {
    color: "#ffffff",
  },
});
