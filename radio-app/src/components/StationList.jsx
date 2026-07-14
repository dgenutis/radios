import StationItem from "./StationItem";

function StationList({
  stations,
  onSelect,
  currentStation,
  favorites,
  onToggleFavorite,
}) {
  if (stations.length === 0) {
    return <p>Nerasta stočių.</p>;
  }

  return (
    <div>
      {stations.map((station) => (
        <StationItem
          key={station.id}
          station={station}
          onSelect={onSelect}
          isActive={currentStation?.id === station.id}
          isFavorite={favorites.includes(station.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

export default StationList;
