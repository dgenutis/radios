import { useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import StationList from "./components/StationList";
import PlayerBar from "./components/PlayerBar";
import "./index.css";

function App() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
 const [favorites, setFavorites] = useState(() => {
   try {
     const saved = localStorage.getItem("radio-app-favorites");
     return saved ? JSON.parse(saved) : [];
   } catch {
     return [];
   }
 });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  const [selectedTag, setSelectedTag] = useState("all");
  const [playerError, setPlayerError] = useState("");
  const [nowPlaying, setNowPlaying] = useState("Kol kas informacija negaunama");



useEffect(() => {
  if (!currentStation) {
    setNowPlaying("Pasirink stotį");
    return;
  }

  setNowPlaying("Informacija apie dainą dar nerodoma");
}, [currentStation]);

  useEffect(() => {
    try {
      localStorage.setItem("radio-app-favorites", JSON.stringify(favorites));
    } catch (error) {
      console.error("Nepavyko išsaugoti favoritų:", error);
    }
  }, [favorites]);

  useEffect(() => {
    if (!currentStation) return;

    try {
      localStorage.setItem("radio-app-last-station-id", currentStation.id);
    } catch (error) {
      console.error("Nepavyko išsaugoti paskutinės stoties:", error);
    }
  }, [currentStation]);

  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "https://de1.api.radio-browser.info/json/stations/bycountry/Lithuania",
        );

        if (!response.ok) {
          throw new Error("Nepavyko gauti stočių iš API");
        }

        const data = await response.json();

       const normalizedStations = data
         .filter((station) => {
           return (
             station.name && station.url_resolved && station.lastcheckok === 1
           );
         })
         .map((station) => ({
           id: station.stationuuid,
           name: station.name.trim(),
           streamUrl: station.url_resolved,
           homepage: station.homepage || "",
           favicon: station.favicon || "",
           country: station.country || "",
           tags: station.tags || "",
           codec: station.codec || "",
           bitrate: station.bitrate || 0,
           clickcount: station.clickcount || 0,
           votes: station.votes || 0,
           lastcheckok: station.lastcheckok,
         }))
         .sort((a, b) => {
           if (b.clickcount !== a.clickcount) {
             return b.clickcount - a.clickcount;
           }
           return a.name.localeCompare(b.name);
         });
        setStations(normalizedStations);
      } catch (err) {
        setError(err.message || "Įvyko klaida");
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, []);

useEffect(() => {
  if (!("mediaSession" in navigator) || !currentStation) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: currentStation.name,
    artist: currentStation.country || "Radio station",
    album: "Radio App",
    artwork: currentStation.favicon
      ? [{ src: currentStation.favicon, sizes: "512x512", type: "image/png" }]
      : [],
  });

  navigator.mediaSession.setActionHandler("play", () => {
    handleTogglePlay();
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  });
}, [currentStation, isPlaying]);
  
  useEffect(() => {
    if (!stations.length) return;

    try {
      const lastStationId = localStorage.getItem("radio-app-last-station-id");
      if (!lastStationId) return;

      const matchedStation = stations.find(
        (station) => station.id === lastStationId,
      );
      if (matchedStation) {
        setCurrentStation(matchedStation);
      }
    } catch (error) {
      console.error("Nepavyko atkurti paskutinės stoties:", error);
    }
  }, [stations]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handleError = () => {
      setPlayerError("Stoties nepavyko paleisti arba srautas nepasiekiamas.");
      setIsPlaying(false);
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("error", handleError);
    };
  }, []);

const availableTags = useMemo(() => {
  const tagsSet = new Set();

  stations.forEach((station) => {
    if (!station.tags) return;

    station.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => tagsSet.add(tag));
  });

  return ["all", ...Array.from(tagsSet).sort((a, b) => a.localeCompare(b))];
}, [stations]);

const toggleFavorite = (stationId) => {
  setFavorites((prev) => {
    if (prev.includes(stationId)) {
      return prev.filter((id) => id !== stationId);
    }

    return [...prev, stationId];
  });
};


const filteredStations = useMemo(() => {
  let result = stations.filter((station) =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (showFavoritesOnly) {
    result = result.filter((station) => favorites.includes(station.id));
  }

  if (selectedTag !== "all") {
    result = result.filter((station) =>
      station.tags
        ?.split(",")
        .map((tag) => tag.trim().toLowerCase())
        .includes(selectedTag.toLowerCase()),
    );
  }

  result = [...result].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }

    if (sortBy === "bitrate") {
      return (b.bitrate || 0) - (a.bitrate || 0);
    }

    if (sortBy === "votes") {
      return (b.votes || 0) - (a.votes || 0);
    }

    return (b.clickcount || 0) - (a.clickcount || 0);
  });

  return result;
}, [stations, searchTerm, showFavoritesOnly, favorites, sortBy, selectedTag]);



const handleSelectStation = (station) => {
  const isSameStation = currentStation?.id === station.id;

  setPlayerError("");

  if (!isSameStation) {
    setCurrentStation(station);
    setIsPlaying(true);
    return;
  }

  setIsPlaying((prev) => !prev);
};

const handleTogglePlay = async () => {
  if (!currentStation || !audioRef.current) return;

  setPlayerError("");

  if (isPlaying) {
    audioRef.current.pause();
    setIsPlaying(false);
    return;
  }

  try {
    await audioRef.current.play();
    setIsPlaying(true);
  } catch (error) {
    console.error("Nepavyko paleisti audio:", error);
    setPlayerError("Nepavyko paleisti stoties.");
    setIsPlaying(false);
  }
};

const handleStop = () => {
  if (!audioRef.current) return;

  audioRef.current.pause();
  audioRef.current.currentTime = 0;
  setIsPlaying(false);
  setPlayerError("");
};

  useEffect(() => {
    if (!audioRef.current || !currentStation) return;

    const audio = audioRef.current;
    setPlayerError("");

    if (audio.src !== currentStation.streamUrl) {
      audio.src = currentStation.streamUrl;
      audio.load();
    }

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error("Autoplay/play klaida:", error);
        setPlayerError("Naršyklė neleido paleisti arba srautas neveikia.");
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [currentStation, isPlaying]);

  return (
    <main className="app-shell app-shell--with-player">
      <div className="app-top">
        <Header />
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

        <div className="toolbar">
          <label className="toolbar__checkbox">
            <input
              type="checkbox"
              checked={showFavoritesOnly}
              onChange={(e) => setShowFavoritesOnly(e.target.checked)}
            />
            Tik favoritai
          </label>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="popular">Pagal populiarumą</option>
            <option value="votes">Pagal balsus</option>
            <option value="bitrate">Pagal bitrate</option>
            <option value="name">Pagal pavadinimą</option>
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag === "all" ? "Visi tag'ai" : tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="stations-panel">
        {loading && <p>Kraunamos stotys...</p>}
        {error && <p>Klaida: {error}</p>}

        {!loading && !error && (
          <StationList
            stations={filteredStations}
            onSelect={handleSelectStation}
            currentStation={currentStation}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </section>

      <div className="bottom-player">
        <PlayerBar
          currentStation={currentStation}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onStop={handleStop}
          playerError={playerError}
          nowPlaying={nowPlaying}
        />
      </div>

      <audio ref={audioRef} preload="none" />
    </main>
  );
}

export default App;
