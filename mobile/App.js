import { useState } from "react";
import { Audio } from "expo-av";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";

const API = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function App() {
  const [query, setQuery] = useState("Fairuz");
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("admin@musiqi.world");
  const [password, setPassword] = useState("demo");
  const [message, setMessage] = useState("");

  async function search() {
    const response = await fetch(`${API}/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    setArtists(data.artists || []);
    setSongs(data.songs || []);
    setMessage(`${(data.artists || []).length} artists, ${(data.songs || []).length} songs`);
  }

  async function login() {
    const response = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.detail || "Sign in failed");
      return;
    }
    setToken(data.token);
    setMessage("Signed in to the shared catalogue.");
  }

  async function play(song) {
    if (!song.rights?.audio_url) {
      setMessage("No audio. This song is not licensed for playback.");
      return;
    }
    const sound = new Audio.Sound();
    await sound.loadAsync({ uri: song.rights.audio_url });
    await sound.playAsync();
  }

  async function favourite(song) {
    if (!token) {
      setMessage("Sign in before saving a favourite.");
      return;
    }
    const response = await fetch(`${API}/me/favourites/${encodeURIComponent(song.id)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessage(response.ok ? `Saved ${song.title}` : "The favourite was not saved.");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#14110e" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ color: "#e6c27a", fontSize: 28 }}>MUSIQI WORLD</Text>
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} placeholder="Search" placeholderTextColor="#8a7d6d" style={field} />
        <Pressable onPress={search} style={button}><Text style={{ color: "#14110e" }}>Search</Text></Pressable>
        <Text style={{ color: "#f6f0e6", marginVertical: 8 }}>{message}</Text>
        {artists.map((item) => (
          <View key={item.id} style={card}>
            <Text style={{ color: "#f6f0e6", fontSize: 18 }}>{item.name_ar || item.name_en}</Text>
            <Text style={{ color: "#c3b6a4" }}>{item.name_en} · {item.country}</Text>
          </View>
        ))}
        {songs.map((item) => (
          <View key={item.id} style={card}>
            <Text style={{ color: "#f6f0e6" }}>{item.title}</Text>
            <Text style={{ color: "#c3b6a4" }}>{item.rights.download ? "Licensed audio" : "No download"}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={() => play(item)} style={button}><Text>Play</Text></Pressable>
              <Pressable onPress={() => favourite(item)} style={button}><Text>Favourite</Text></Pressable>
            </View>
          </View>
        ))}
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" style={field} />
        <TextInput value={password} onChangeText={setPassword} secureTextEntry style={field} />
        <Pressable onPress={login} style={button}><Text style={{ color: "#14110e" }}>Sign in</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const field = { backgroundColor: "#221c17", color: "#f6f0e6", borderRadius: 12, padding: 12, marginTop: 8 };
const button = { backgroundColor: "#e6c27a", borderRadius: 12, padding: 10, marginTop: 8, alignSelf: "flex-start" };
const card = { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#3a322b" };
