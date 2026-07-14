function StationItem({
  station,
  onSelect,
  isActive,
  isFavorite,
  onToggleFavorite,
}) {
  const handleFavoriteClick = (event) => {
    event.stopPropagation();
    onToggleFavorite(station.id);
  };

  return (
    <div
      className={`station-card ${isActive ? "active" : ""}`}
      onClick={() => onSelect(station)}
    >
      <div className="station-card__top">
        {station.favicon ? (
          <img
            className="station-card__logo"
            src={station.favicon}
            alt={`${station.name} logo`}
          />
        ) : (
          <div className="station-card__logo station-card__logo--placeholder">
            🎵
          </div>
        )}

        <div className="station-card__info">
          <div className="station-card__title-row">
            <strong>{station.name}</strong>
            {isActive && <span className="station-badge">Dabar</span>}
          </div>

          <p className="station-meta">
            {station.country} · {station.codec || "Unknown"} ·{" "}
            {station.bitrate || "?"} kbps
          </p>

          {station.tags && <p className="station-tags">{station.tags}</p>}
        </div>

        <button
          className={`favorite-btn ${isFavorite ? "active" : ""}`}
          onClick={handleFavoriteClick}
          aria-label={
            isFavorite ? "Pašalinti iš favoritų" : "Pridėti į favoritus"
          }
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>
    </div>
  );
}

export default StationItem;
