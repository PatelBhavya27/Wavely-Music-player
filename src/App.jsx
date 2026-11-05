import { useEffect, useMemo, useRef, useState } from "react";
import {
  MdHome, MdLibraryMusic, MdFavorite, MdHistory, MdAdd,
  MdSearch, MdSettings, MdPerson, MdLogout, MdPlayArrow,
  MdPause, MdHeadphones, MdDelete, MdQueueMusic, MdAccessTime,
  MdClose
} from "react-icons/md";

import { tracks, starterPlaylists } from "./data/tracks";
import useLocalStorage from "./hooks/useLocalStorage";
import Controls from "./components/Controls";
import TrackList from "./components/TrackList";
import Visualizer from "./components/Visualizer";
import "./App.css";

export default function App() {
  // Audio references and player states
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);

  const [currentId, setCurrentId] = useState(tracks[0]?.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off");

  // Persistent application data
  const [favorites, setFavorites] = useLocalStorage("wavely-favorites", []);
  const [recent, setRecent] = useLocalStorage("wavely-recent", []);
  const [playlists, setPlaylists] = useLocalStorage("wavely-playlists", starterPlaylists);
  const [listeningSeconds, setListeningSeconds] = useLocalStorage("wavely-listening-time", 0);
  const [user, setUser] = useLocalStorage("wavely-user", null);
  const [accounts, setAccounts] = useLocalStorage("wavely-accounts", []);

  // Application interface states
  const [page, setPage] = useState("home");
  const [search, setSearch] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  // Login and registration states
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [privateSession, setPrivateSession] = useState(false);

  const currentTrack = tracks.find(track => track.id === currentId) || tracks[0];

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Play or pause the selected track
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(error => {
        console.log("Audio playback error:", error);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentId]);

  // Handle audio progress and track completion
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () => setDuration(audio.duration || 0);

    const handleEnded = () => {
      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNext();
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  });

  // Calculate listening time
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setListeningSeconds(previous => previous + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, setListeningSeconds]);

  // Initialize Web Audio API visualizer
  const initializeAudio = () => {
    const audio = audioRef.current;
    if (!audio || audioContextRef.current) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = new AudioContext();
    const source = context.createMediaElementSource(audio);
    const analyser = context.createAnalyser();

    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(context.destination);

    audioContextRef.current = context;
    sourceRef.current = source;
    window.wavelyAnalyser = analyser;
  };

  // Play selected song and update history
  const playTrack = id => {
    initializeAudio();

    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }

    setCurrentId(id);
    setIsPlaying(true);
    setCurrentTime(0);

    if (!privateSession) {
      setRecent(previous => [
        id,
        ...previous.filter(trackId => trackId !== id)
      ].slice(0, 10));
    }
  };

  // Toggle music playback
  const togglePlay = () => {
    if (!currentTrack) return;

    if (!isPlaying) {
      initializeAudio();
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
    }

    setIsPlaying(!isPlaying);
  };

  // Play next song
  const playNext = () => {
    if (!tracks.length) return;

    let nextTrack;

    if (shuffle) {
      const available = tracks.filter(track => track.id !== currentId);
      nextTrack = available[Math.floor(Math.random() * available.length)];
    } else {
      const index = tracks.findIndex(track => track.id === currentId);

      if (index === tracks.length - 1) {
        nextTrack = repeat === "all" ? tracks[0] : null;
      } else {
        nextTrack = tracks[index + 1];
      }
    }

    if (nextTrack) playTrack(nextTrack.id);
    else setIsPlaying(false);
  };

  // Play previous song
  const playPrevious = () => {
    if (!tracks.length) return;

    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const index = tracks.findIndex(track => track.id === currentId);
    const previousIndex = index === 0 ? tracks.length - 1 : index - 1;

    playTrack(tracks[previousIndex].id);
  };

  // Add or remove favorite songs
  const toggleFavorite = id => {
    setFavorites(previous =>
      previous.includes(id)
        ? previous.filter(trackId => trackId !== id)
        : [...previous, id]
    );
  };

  // Create a new playlist
  const createPlaylist = () => {
    if (!playlistName.trim()) return;

    const newPlaylist = {
      id: Date.now().toString(),
      name: playlistName.trim(),
      description: "Created by you",
      trackIds: [],
      cover: tracks[0]?.cover
    };

    setPlaylists(previous => [...previous, newPlaylist]);
    setSelectedPlaylist(newPlaylist);
    setPlaylistName("");
    setShowCreatePlaylist(false);
    setPage("playlist");
  };

  // Delete a playlist
  const deletePlaylist = id => {
    setPlaylists(previous => previous.filter(playlist => playlist.id !== id));
    setSelectedPlaylist(null);
    setPage("library");
  };

  // Add current song to selected playlist
  const addToPlaylist = playlistId => {
    const updated = playlists.map(playlist =>
      playlist.id === playlistId
        ? {
            ...playlist,
            trackIds: playlist.trackIds.includes(currentId)
              ? playlist.trackIds
              : [...playlist.trackIds, currentId]
          }
        : playlist
    );

    setPlaylists(updated);

    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(updated.find(playlist => playlist.id === playlistId));
    }

    setShowAddToPlaylist(false);
  };

  // Search songs
  const filteredTracks = useMemo(() =>
    tracks.filter(track =>
      `${track.title} ${track.artist} ${track.album}`
        .toLowerCase()
        .includes(search.toLowerCase())
    ), [search]
  );

  // Login and registration
  const handleAuth = event => {
    event.preventDefault();
    setAuthError("");

    if (!authEmail || !authPassword) {
      setAuthError("Please enter your email and password.");
      return;
    }

    if (authMode === "register") {
      if (!authName.trim()) {
        setAuthError("Please enter your name.");
        return;
      }

      if (accounts.some(account => account.email === authEmail)) {
        setAuthError("An account with this email already exists.");
        return;
      }

      const newAccount = {
        name: authName,
        email: authEmail,
        password: authPassword
      };

      setAccounts(previous => [...previous, newAccount]);
      setUser({ name: authName, email: authEmail });
    } else {
      const account = accounts.find(item =>
        item.email === authEmail && item.password === authPassword
      );

      if (!account) {
        setAuthError("Invalid email or password.");
        return;
      }

      setUser({ name: account.name, email: account.email });
    }

    setAuthEmail("");
    setAuthPassword("");
    setAuthName("");
  };

  // Logout
  const logout = () => {
    setUser(null);
    setIsPlaying(false);
    setPage("home");
  };

  // Format listening time
  const formatListeningTime = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
  };

  // Prepare song collections
  const favoriteTracks = tracks.filter(track => favorites.includes(track.id));

  const recentTracks = recent
    .map(id => tracks.find(track => track.id === id))
    .filter(Boolean);

  const playlistTracks = selectedPlaylist
    ? tracks.filter(track => selectedPlaylist.trackIds.includes(track.id))
    : [];

  // Reusable song list
  const renderTrackList = list => (
    <TrackList
      tracks={list}
      currentId={currentId}
      isPlaying={isPlaying}
      favorites={favorites}
      onSelect={playTrack}
      onToggleFav={toggleFavorite}
    />
  );

  // Login and registration screen
  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-background" />

        <div className="auth-card">
          <div className="brand-logo">
            <span className="brand-icon"><MdHeadphones /></span>
            <span>Wavely</span>
          </div>

          <h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1>

          <p className="auth-subtitle">
            {authMode === "login"
              ? "Sign in and continue your music journey."
              : "Join Wavely and make music personal."}
          </p>

          <form onSubmit={handleAuth}>
            {authMode === "register" && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
              />
            </div>

            {authError && <p className="auth-error">{authError}</p>}

            <button className="auth-submit" type="submit">
              {authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setAuthError("");
            }}>
              {authMode === "login" ? "Sign Up" : "Login"}
            </button>
          </p>

          <p className="auth-note">
            Demo authentication only. Do not use a real password.
          </p>
        </div>
      </div>
    );
  }

  // Main application layout
  return (
    <div className="app-layout">
      <audio ref={audioRef} src={currentTrack?.src} preload="metadata" />

      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="brand-logo">
          <span className="brand-icon"><MdHeadphones /></span>
          <span>Wavely</span>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-heading">MENU</p>

          <button className={`nav-item ${page === "home" ? "active" : ""}`}
            onClick={() => setPage("home")}>
            <MdHome /> Home
          </button>

          <button className={`nav-item ${page === "search" ? "active" : ""}`}
            onClick={() => setPage("search")}>
            <MdSearch /> Search
          </button>

          <button className={`nav-item ${page === "library" ? "active" : ""}`}
            onClick={() => setPage("library")}>
            <MdLibraryMusic /> Your Library
          </button>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-heading">YOUR MUSIC</p>

          <button className={`nav-item ${page === "favorites" ? "active" : ""}`}
            onClick={() => setPage("favorites")}>
            <MdFavorite /> Favorites
          </button>

          <button className={`nav-item ${page === "recent" ? "active" : ""}`}
            onClick={() => setPage("recent")}>
            <MdHistory /> Recently Played
          </button>
        </div>

        <div className="sidebar-section playlist-sidebar">
          <div className="sidebar-heading-row">
            <p className="sidebar-heading">PLAYLISTS</p>
            <button className="small-add-button"
              onClick={() => setShowCreatePlaylist(true)}>
              <MdAdd />
            </button>
          </div>

          {playlists.map(playlist => (
            <button key={playlist.id}
              className={`nav-item playlist-nav ${
                selectedPlaylist?.id === playlist.id && page === "playlist"
                  ? "active" : ""
              }`}
              onClick={() => {
                setSelectedPlaylist(playlist);
                setPage("playlist");
              }}>
              <MdQueueMusic />
              <span>{playlist.name}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button className={`nav-item ${page === "settings" ? "active" : ""}`}
            onClick={() => setPage("settings")}>
            <MdSettings /> Settings
          </button>

          <button className={`nav-item ${page === "profile" ? "active" : ""}`}
            onClick={() => setPage("profile")}>
            <MdPerson /> Profile
          </button>

          <button className="nav-item logout-button" onClick={logout}>
            <MdLogout /> Logout
          </button>
        </div>
      </aside>

      {/* Main content and topbar */}
      <main className="main-content">
        <header className="topbar">
          <div className="search-box">
            <MdSearch />
            <input
              type="text"
              placeholder="Search songs, artists, albums..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage("search");
              }}
            />

            {search && (
              <button onClick={() => setSearch("")}>
                <MdClose />
              </button>
            )}
          </div>

          <button className="profile-button" onClick={() => setPage("profile")}>
            <span className="profile-avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span>{user.name}</span>
          </button>
        </header>

        {/* Home page */}
        {page === "home" && (
          <section className="page-content">
            <div className="welcome-section">
              <p className="eyebrow">YOUR MUSIC SPACE</p>
              <h1>Good music, <span>good vibes.</span></h1>
              <p>Discover your favorite tracks and enjoy every moment.</p>
            </div>

            <div className="featured-card">
              <div className="featured-info">
                <span className="featured-label">FEATURED TRACK</span>
                <h2>{currentTrack?.title}</h2>
                <p>{currentTrack?.artist}</p>
                <button className="featured-play" onClick={togglePlay}>
                  {isPlaying ? <MdPause /> : <MdPlayArrow />}
                  {isPlaying ? "Pause" : "Listen Now"}
                </button>
              </div>

              <img className="featured-cover"
                src={currentTrack?.cover} alt={currentTrack?.title} />
            </div>

            <div className="section-heading"><h2>Quick Access</h2></div>

            <div className="quick-grid">
              <button className="quick-card" onClick={() => setPage("favorites")}>
                <MdFavorite /><span>Favorites</span>
                <strong>{favorites.length} songs</strong>
              </button>

              <button className="quick-card" onClick={() => setPage("recent")}>
                <MdHistory /><span>Recently Played</span>
                <strong>{recent.length} songs</strong>
              </button>

              <button className="quick-card" onClick={() => setPage("library")}>
                <MdLibraryMusic /><span>Music Library</span>
                <strong>{tracks.length} songs</strong>
              </button>
            </div>

            <div className="section-heading">
              <h2>Made For You</h2>
              <button onClick={() => setPage("library")}>View All</button>
            </div>
            {renderTrackList(tracks)}

            <div className="section-heading">
              <h2>Recently Played</h2>
              <button onClick={() => setPage("recent")}>View All</button>
            </div>
            {renderTrackList(recentTracks)}
          </section>
        )}

        {/* Search page */}
        {page === "search" && (
          <section className="page-content">
            <p className="eyebrow">DISCOVER MUSIC</p>
            <h1>Search</h1>

            <div className="large-search-box">
              <MdSearch />
              <input
                type="text"
                placeholder="What do you want to listen to?"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="section-heading">
              <h2>{search ? `Results for "${search}"` : "All Songs"}</h2>
            </div>
            {renderTrackList(filteredTracks)}
          </section>
        )}

        {/* Music library page */}
        {page === "library" && (
          <section className="page-content">
            <div className="page-title-row">
              <div>
                <p className="eyebrow">YOUR COLLECTION</p>
                <h1>Your Library</h1>
              </div>

              <button className="primary-button"
                onClick={() => setShowCreatePlaylist(true)}>
                <MdAdd /> Create Playlist
              </button>
            </div>

            <div className="playlist-grid">
              {playlists.map(playlist => (
                <button className="playlist-card" key={playlist.id}
                  onClick={() => {
                    setSelectedPlaylist(playlist);
                    setPage("playlist");
                  }}>
                  <img src={playlist.cover} alt="" />
                  <strong>{playlist.name}</strong>
                  <span>{playlist.trackIds.length} songs</span>
                </button>
              ))}
            </div>

            <div className="section-heading"><h2>All Songs</h2></div>
            {renderTrackList(tracks)}
          </section>
        )}

        {/* Favorites page */}
        {page === "favorites" && (
          <section className="page-content">
            <p className="eyebrow">YOUR COLLECTION</p>
            <h1>Liked Songs</h1>
            <p className="page-description">All your favorite music in one place.</p>
            {renderTrackList(favoriteTracks)}
          </section>
        )}

        {/* Recently played page */}
        {page === "recent" && (
          <section className="page-content">
            <p className="eyebrow">YOUR LISTENING HISTORY</p>
            <h1>Recently Played</h1>
            <p className="page-description">Pick up where you left off.</p>
            {renderTrackList(recentTracks)}
          </section>
        )}

        {/* Playlist page */}
        {page === "playlist" && selectedPlaylist && (
          <section className="page-content">
            <div className="playlist-banner">
              <img src={selectedPlaylist.cover} alt="" />
              <div>
                <p className="eyebrow">PLAYLIST</p>
                <h1>{selectedPlaylist.name}</h1>
                <p>{selectedPlaylist.description}</p>
                <span>{playlistTracks.length} songs</span>
              </div>
            </div>

            <div className="section-heading">
              <h2>Songs in this playlist</h2>
              <button className="delete-playlist-button"
                onClick={() => deletePlaylist(selectedPlaylist.id)}>
                <MdDelete /> Delete Playlist
              </button>
            </div>

            {renderTrackList(playlistTracks)}

            <div className="section-heading"><h2>Add Songs</h2></div>

            {renderTrackList(
              tracks.filter(track => !selectedPlaylist.trackIds.includes(track.id))
            )}

            {tracks.filter(track => !selectedPlaylist.trackIds.includes(track.id))
              .map(track => (
                <button key={`add-${track.id}`} className="add-song-button"
                  onClick={() => {
                    const updated = playlists.map(playlist =>
                      playlist.id === selectedPlaylist.id
                        ? { ...playlist, trackIds: [...playlist.trackIds, track.id] }
                        : playlist
                    );

                    setPlaylists(updated);
                    setSelectedPlaylist(
                      updated.find(playlist => playlist.id === selectedPlaylist.id)
                    );
                  }}>
                  <MdAdd /> Add {track.title}
                </button>
              ))}
          </section>
        )}

        {/* Profile and listening statistics */}
        {page === "profile" && (
          <section className="page-content">
            <p className="eyebrow">YOUR ACCOUNT</p>
            <h1>My Profile</h1>

            <div className="profile-card">
              <div className="large-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <span>Wavely Member</span>
              </div>
            </div>

            <div className="section-heading"><h2>Your Listening Activity</h2></div>

            <div className="stats-grid">
              <div className="stat-card">
                <MdAccessTime /><span>Total Listening Time</span>
                <strong>{formatListeningTime(listeningSeconds)}</strong>
              </div>

              <div className="stat-card">
                <MdFavorite /><span>Favorite Songs</span>
                <strong>{favorites.length}</strong>
              </div>

              <div className="stat-card">
                <MdHistory /><span>Recently Played</span>
                <strong>{recent.length}</strong>
              </div>

              <div className="stat-card">
                <MdQueueMusic /><span>Your Playlists</span>
                <strong>{playlists.length}</strong>
              </div>
            </div>
          </section>
        )}

        {/* Application settings */}
        {page === "settings" && (
          <section className="page-content">
            <p className="eyebrow">PREFERENCES</p>
            <h1>Settings</h1>

            <div className="settings-card">
              <div className="setting-row">
                <div>
                  <strong>Notifications</strong>
                  <p>Enable application notifications.</p>
                </div>
                <input type="checkbox" checked={notifications}
                  onChange={e => setNotifications(e.target.checked)} />
              </div>

              <div className="setting-row">
                <div>
                  <strong>Private Listening Session</strong>
                  <p>Do not add songs to your listening history.</p>
                </div>
                <input type="checkbox" checked={privateSession}
                  onChange={e => setPrivateSession(e.target.checked)} />
              </div>

              <div className="setting-row">
                <div>
                  <strong>Account Email</strong>
                  <p>{user.email}</p>
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Application</strong>
                  <p>Wavely Music Player · Version 2.0</p>
                </div>
              </div>

              <button className="logout-action" onClick={logout}>
                <MdLogout /> Log Out
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Bottom music player */}
      <footer className="music-player">
        <div className="now-playing">
          <img src={currentTrack?.cover} alt="" />
          <div>
            <strong>{currentTrack?.title}</strong>
            <span>{currentTrack?.artist}</span>
          </div>

          <button className={`like-button ${
            favorites.includes(currentId) ? "liked" : ""
          }`} onClick={() => toggleFavorite(currentId)}>
            <MdFavorite />
          </button>
        </div>

        <div className="player-center">
          <Controls
            isPlaying={isPlaying}
            onToggle={togglePlay}
            onNext={playNext}
            onPrev={playPrevious}
            shuffle={shuffle}
            onShuffle={() => setShuffle(!shuffle)}
            repeat={repeat}
            onRepeat={() => setRepeat(
              repeat === "off" ? "all" : repeat === "all" ? "one" : "off"
            )}
            currentTime={currentTime}
            duration={duration}
            onSeek={time => {
              if (audioRef.current) audioRef.current.currentTime = time;
            }}
            volume={volume}
            onVolume={setVolume}
          />
        </div>

        <div className="player-visualizer">
          <Visualizer audioRef={audioRef} isPlaying={isPlaying} />
        </div>

        <button className="add-current-button"
          onClick={() => setShowAddToPlaylist(true)}
          title="Add current song to playlist">
          <MdAdd />
        </button>
      </footer>

      {/* Create playlist modal */}
      {showCreatePlaylist && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button className="modal-close"
              onClick={() => setShowCreatePlaylist(false)}>
              <MdClose />
            </button>

            <h2>Create Playlist</h2>
            <p>Give your new playlist a name.</p>

            <input
              type="text"
              placeholder="My Awesome Playlist"
              value={playlistName}
              onChange={e => setPlaylistName(e.target.value)}
            />

            <button className="primary-button modal-submit"
              onClick={createPlaylist}>
              Create Playlist
            </button>
          </div>
        </div>
      )}

      {/* Add song to playlist modal */}
      {showAddToPlaylist && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button className="modal-close"
              onClick={() => setShowAddToPlaylist(false)}>
              <MdClose />
            </button>

            <h2>Add to Playlist</h2>
            <p>Select a playlist for {currentTrack?.title}.</p>

            {playlists.map(playlist => (
              <button key={playlist.id}
                className="modal-playlist-option"
                onClick={() => addToPlaylist(playlist.id)}>
                <MdQueueMusic /> {playlist.name}
              </button>
            ))}

            {playlists.length === 0 && <p>Create a playlist first.</p>}
          </div>
        </div>
      )}
    </div>
  );
}