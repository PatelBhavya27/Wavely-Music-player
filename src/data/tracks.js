export const tracks = [
  {
    id: 1,
    title: "Believer",
    artist: "Imagine Dragons",
    album: "Evolve",
    src: "/songs/believer.mp3",
    cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=700&q=85",
    colors: ["#ff6b35", "#f72585"],
    duration: "3:24",
    genre: "Alternative"
  },
  {
    id: 2,
    title: "Faded",
    artist: "Alan Walker",
    album: "Different World",
    src: "/songs/faded.mp3",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=700&q=85",
    colors: ["#00c6ff", "#4263eb"],
    duration: "3:32",
    genre: "Electronic"
  }
];

// Default playlists
export const starterPlaylists = [
  {
    id: "mix",
    name: "My Mix",
    description: "Your personal mix",
    trackIds: [1, 2],
    cover: tracks[0].cover
  }
];