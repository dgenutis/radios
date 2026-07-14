function PlayerBar({
  currentStation,
  isPlaying,
  onTogglePlay,
  onStop,
  playerError,
  nowPlaying,
}) {
  return (
    <div className="player-bar player-bar--bottom">
      {currentStation ? (
        <>
          <div className="player-bar__info">
            <p className="player-bar__label">Dabar groja radijas</p>
            <h2>{currentStation.name}</h2>
            <p className="player-bar__meta">
              {currentStation.country} · {currentStation.codec || "Unknown"} ·{" "}
              {currentStation.bitrate || "?"} kbps
            </p>

            <p className="player-bar__now-playing">
              <span>Dabar groja:</span> {nowPlaying}
            </p>

            {playerError && <p className="player-error">{playerError}</p>}
          </div>

          <div className="player-bar__actions">
            <button onClick={onTogglePlay}>
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button onClick={onStop}>Stop</button>
          </div>
        </>
      ) : (
        <div className="player-bar__empty">
          <p>Pasirink stotį iš sąrašo.</p>
        </div>
      )}
    </div>
  );
}

export default PlayerBar;
