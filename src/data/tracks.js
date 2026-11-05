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
  },
  {
    id: 3,
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "÷ (Divide)",
    src: "/songs/shape_of_you.mp3",
    cover: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=700&q=85",
    colors: ["#ff9a44", "#fc6076"],
    duration: "3:53",
    genre: "Pop"
  },
  {
    id: 4,
    title: "Starboy",
    artist: "The Weeknd",
    album: "Starboy",
    src: "/songs/starboy.mp3",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&q=85",
    colors: ["#7b2ff7", "#f107a3"],
    duration: "3:50",
    genre: "R&B"
  }
];

export const starterPlaylists = [
  {
    id: "mix",
    name: "My Mix",
    description: "Your personal mix",
    trackIds: [1, 2, 3, 4],
    cover: tracks[0].cover
  }
];