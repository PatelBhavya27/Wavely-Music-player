import {
  MdFavorite,
  MdFavoriteBorder,
  MdPlayArrow
} from "react-icons/md";

export default function TrackList({
  tracks,
  currentId,
  isPlaying,
  favorites,
  onSelect,
  onToggleFav
}) {

  if (!tracks.length) {
    return (
      <div className="empty-state">
        No tracks here yet. Add some music to get started.
      </div>
    );
  }

  return (
    <div className="track-table">

      {tracks.map((track, index) => {

        const active = track.id === currentId;

        const liked = favorites.includes(track.id);

        return (
          <div
            className={`track-row ${
              active ? "is-current" : ""
            }`}
            key={track.id}
          >

            {/* Track Number / Playing Indicator */}
            <button
              className="track-index"
              onClick={() => onSelect(track.id)}
              title="Play song"
            >

              {active && isPlaying ? (
                <span className="playing-bars">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                <>
                  <span className="index-number">
                    {index + 1}
                  </span>

                  <MdPlayArrow className="index-play" />
                </>
              )}

            </button>

            {/* Album Artwork */}
            <img
              className="track-cover"
              src={track.cover}
              alt={`${track.title} cover`}
            />

            {/* Song Information */}
            <button
              className="track-main"
              onClick={() => onSelect(track.id)}
            >
              <strong>{track.title}</strong>

              <span>{track.artist}</span>
            </button>

            {/* Album Name */}
            <span className="track-album">
              {track.album}
            </span>

            {/* Duration */}
            <span className="track-duration">
              {track.duration}
            </span>

            {/* Favorite Button */}
            <button
              className={`like-button ${
                liked ? "liked" : ""
              }`}
              onClick={() => onToggleFav(track.id)}
              aria-label="Toggle favorite"
              title="Add to favorites"
            >
              {liked ? (
                <MdFavorite />
              ) : (
                <MdFavoriteBorder />
              )}
            </button>

          </div>
        );
      })}

    </div>
  );
}