import {
  MdPlayArrow,
  MdPause,
  MdSkipNext,
  MdSkipPrevious,
  MdShuffle,
  MdRepeat,
  MdRepeatOne,
  MdVolumeUp,
  MdVolumeOff
} from "react-icons/md";

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";

  const mins = Math.floor(seconds / 60);

  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${mins}:${secs}`;
};

export default function Controls({
  isPlaying,
  onToggle,
  onNext,
  onPrev,
  shuffle,
  onShuffle,
  repeat,
  onRepeat,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolume
}) {
  return (
    <div className="player-controls">

      {/* Music Progress Bar */}
      <div className="timeline">

        <span>{formatTime(currentTime)}</span>

        <input
          aria-label="Track progress"
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) =>
            onSeek(Number(e.target.value))
          }
          style={{
            "--range-progress": `${
              duration
                ? (currentTime / duration) * 100
                : 0
            }%`
          }}
        />

        <span>{formatTime(duration)}</span>

      </div>

      {/* Main Player Buttons */}
      <div className="control-row">

        <button
          className={`icon-button ${
            shuffle ? "selected" : ""
          }`}
          onClick={onShuffle}
          title="Shuffle"
        >
          <MdShuffle />
        </button>

        <button
          className="icon-button"
          onClick={onPrev}
          title="Previous"
        >
          <MdSkipPrevious />
        </button>

        <button
          className="main-play"
          onClick={onToggle}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <MdPause />
          ) : (
            <MdPlayArrow />
          )}
        </button>

        <button
          className="icon-button"
          onClick={onNext}
          title="Next"
        >
          <MdSkipNext />
        </button>

        <button
          className={`icon-button ${
            repeat !== "off" ? "selected" : ""
          }`}
          onClick={onRepeat}
          title={`Repeat: ${repeat}`}
        >
          {repeat === "one" ? (
            <MdRepeatOne />
          ) : (
            <MdRepeat />
          )}
        </button>

      </div>

      {/* Volume Control */}
      <div className="volume-row">

        <MdVolumeOff />

        <input
          aria-label="Volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) =>
            onVolume(Number(e.target.value))
          }
          style={{
            "--range-progress": `${volume * 100}%`
          }}
        />

        <MdVolumeUp />

      </div>

    </div>
  );
}