import { Picker } from "@react-native-picker/picker";
import StationCard from "../../components/StationCard";
import { useLocalSearchParams } from "expo-router";
import { Station } from "../../types/station";
import {
  addStationToRecent,
  loadFavorites,
  loadRecentStations,
  saveFavorites,
  saveRecentStations,
} from "../../lib/storage";

import * as Haptics from "expo-haptics";
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
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";



const COUNTRY_OPTIONS = [
  { label: "Lietuva", value: "LT" },
  { label: "Latvija", value: "LV" },
  { label: "Estija", value: "EE" },
  { label: "Lenkija", value: "PL" },
  { label: "Vokietija", value: "DE" },
  { label: "Jungtinė Karalystė", value: "GB" },
  { label: "Jungtinės Valstijos", value: "US" },
];

const RADIO_BROWSER_SERVERS = [
  "https://de1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://fr1.api.radio-browser.info",
];


async function fetchStationsByCountry(countryCode: string) {
  let lastError: any = null;

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
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [favorites, setFavorites] = useState<Station[]>([]);
  const [recentStations, setRecentStations] = useState<Station[]>([]);
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status?.playing ?? false;
  const isBuffering = status?.isBuffering ?? false;
  const [nowPlayingText, setNowPlayingText] = useState("Nėra duomenų");
  const [selectedCountry, setSelectedCountry] = useState("LT");

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
      } catch (err) {
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
      if (!params.playStationUuid || !params.playUrl || !params.playName)
        return;

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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      setError("Nepavyko išsaugoti mėgstamų stočių");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Radio stotys</Text>

      <TextInput
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Ieškoti stoties..."
        placeholderTextColor="#94a3b8"
        style={styles.searchInput}
      />

      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedCountry}
          onValueChange={(itemValue) => setSelectedCountry(itemValue)}
          style={styles.picker}
          dropdownIconColor="#ffffff"
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

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.infoText}>Kraunamos stotys...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.stationuuid}
          renderSectionHeader={({ section }) =>
            section.data.length > 0 ? (
              <Text style={styles.sectionTitle}>{section.title}</Text>
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
            <Text style={styles.emptyText}>Nieko nerasta</Text>
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {currentStation && (
        <View style={styles.playerBar}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerLabel}>
              {isBuffering
                ? "Kraunama..."
                : isPlaying
                  ? "Dabar groja"
                  : "Pasirinkta stotis"}
            </Text>
            <Text style={styles.playerTitle}>{currentStation.name}</Text>
            <Text style={styles.playerMeta}>{nowPlayingText}</Text>
            <Text style={styles.playerSubtitle}>{currentStation.country}</Text>
          </View>

          <View style={styles.playerActions}>
            <Pressable style={styles.secondaryButton} onPress={handleStop}>
              <Text style={styles.secondaryButtonText}>Stop</Text>
            </Pressable>

            <Pressable style={styles.playerButton} onPress={handleTogglePlay}>
              <Text style={styles.playerButtonText}>
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
  searchInput: {
    backgroundColor: "#1e293b",
    color: "#ffffff",
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
    color: "#94a3b8",
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
    color: "#cbd5e1",
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: "#f87171",
    fontSize: 16,
    textAlign: "center",
  },
  playerBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  playerInfo: {
    flex: 1,
    paddingRight: 12,
  },
  playerLabel: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 4,
  },
  playerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  playerSubtitle: {
    color: "#cbd5e1",
    fontSize: 14,
  },
  playerButton: {
    backgroundColor: "#38bdf8",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  playerButtonText: {
    color: "#082f49",
    fontSize: 15,
    fontWeight: "700",
  },

  sectionTitle: {
    color: "#cbd5e1",
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
    backgroundColor: "#1f2937",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "700",
  },
  playerMeta: {
    color: "#cbd5e1",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 2,
  },
  pickerWrapper: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  picker: {
    color: "#ffffff",
  },
});
