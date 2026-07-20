import AsyncStorage from "@react-native-async-storage/async-storage";
import { Station } from "../types/station";

const FAVORITES_KEY = "favorite_stations";
const RECENT_KEY = "recent_stations";
const THEME_KEY = "theme_mode";

export async function saveThemeMode(theme: "system" | "light" | "dark") {
  await AsyncStorage.setItem(THEME_KEY, theme);
}

export async function loadThemeMode(): Promise<"system" | "light" | "dark"> {
  const data = await AsyncStorage.getItem(THEME_KEY);

  if (data === "light" || data === "dark" || data === "system") {
    return data;
  }

  return "system";
}



export async function saveFavorites(stations: Station[]) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(stations));
}

export async function loadFavorites(): Promise<Station[]> {
  const data = await AsyncStorage.getItem(FAVORITES_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveRecentStations(stations: Station[]) {
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(stations));
}

export async function loadRecentStations(): Promise<Station[]> {
  const data = await AsyncStorage.getItem(RECENT_KEY);
  return data ? JSON.parse(data) : [];
}

export async function clearRecentStations() {
  await AsyncStorage.removeItem(RECENT_KEY);
}

export function addStationToRecent(
  currentRecent: Station[],
  station: Station,
): Station[] {
  const filtered = currentRecent.filter(
    (item) => item.stationuuid !== station.stationuuid,
  );

  return [station, ...filtered].slice(0, 10);
}

