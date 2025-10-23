// Pequeña interacción: al pulsar el botón se crean corazones fugaces
document.addEventListener("DOMContentLoaded", () => {
  // Corazones
  const btn = document.getElementById("heartBtn");
  btn?.addEventListener("click", (e) => {
    createHeart(e.clientX, e.clientY);
  });

  // Música: lista de canciones + artistas (persistencia en localStorage)
  const MUSIC_KEY = "mi_novia_musica_favorita_v1";
  const form = document.getElementById("musicForm");
  const songInput = document.getElementById("songInput");
  const artistInput = document.getElementById("artistInput");
  const linkInput = document.getElementById("linkInput");
  const listEl = document.getElementById("musicList");

  // Canciones iniciales (nuevas + previas). Serán añadidas si no existen ya (se evita duplicado).
  const initialSongs = [
    {
      song: "30th",
      artist: "Billie Eilish",
      link: "https://open.spotify.com/intl-es/track/5SHpuW2qjkQtFRpE6P9Nks?si=533aa191cf3f4296"
    },
    {
      song: "Sudores fríos",
      artist: "Natos y Waor",
      link: "https://open.spotify.com/intl-es/track/4OuiDQdjh3I7aswGHyT0rC?si=1967a0b7b23046a3"
    },
    {
      song: "Roar Christmas Kids",
      artist: "Roar Christmas Kids",
      link: "https://open.spotify.com/intl-es/track/7KV7xwHTJbzbwGQEHLIzR8?si=8aa09b1dfdfe4883"
    },

    // Nuevas canciones que pediste añadir:
    {
      song: "Me flipa",
      artist: "Grecas",
      link: "https://open.spotify.com/intl-es/track/1ZTEc4KIj5Usofip2AmNsZ?si=6d25975244fb41e7"
    },
    {
      song: "Hasta cuando",
      artist: "Fernando Costa",
      link: "https://open.spotify.com/intl-es/track/4SAy4v0GtZaRxSCvvzTJaO?si=009976210bc548cf"
    },
    {
      song: "Lejos",
      artist: "Delaossa",
      link: "https://open.spotify.com/intl-es/track/35hYk23wFUOsHoQfljbz80?si=f836446e7a214172"
    },
    {
      song: "Querer Querernos",
      artist: "Cancerbero",
      link: "https://open.spotify.com/intl-es/track/6d3q0F9VNtdxQUTVlRcet6?si=21fca8b4b7b0438d"
    },
    {
      song: "Cinderella",
      artist: "Cryl camer",
      link: "https://open.spotify.com/intl-es/track/0j6iqz5bcxLXHCFPXtBEk5?si=6c9d381f80c04067"
    },
    {
      song: "Llorando en la limo",
      artist: "C. Tangana",
      link: "https://open.spotify.com/intl-es/track/4U0Cx2oGeiUQQCmCByQDxE?si=6cc29d44bab546d1"
    },
    {
      song: "Colegas",
      artist: "Babi",
      link: "https://open.spotify.com/intl-es/track/3NUoEQ2W7pjFSOy08nXQed?si=eadb84da0b764a2f"
    }
  ];

  let songs = loadSongs();

  // If there are no saved songs, seed with initialSongs.
  if (!songs || songs.length === 0) {
    songs = initialSongs.slice();
    saveSongs();
  } else {
    // Merge initialSongs into existing songs avoiding duplicates (compare by parsed externalUrl when possible,
    // otherwise by song+artist lowercase).
    mergeInitialsInto(songs, initialSongs);
    saveSongs();
  }

  renderSongs();

  form?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const song = songInput.value.trim();
    const artist = artistInput.value.trim();
    const link = linkInput.value.trim();
    if (!song || !artist) return;
    addSong({ song, artist, link });
    songInput.value = "";
    artistInput.value = "";
    linkInput.value = "";
    songInput.focus();
  });

  function loadSongs(){
    try{
      const raw = localStorage.getItem(MUSIC_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      console.error("Error parsing songs from storage", e);
      return [];
    }
  }

  function saveSongs(){
    localStorage.setItem(MUSIC_KEY, JSON.stringify(songs));
  }

  function addSong(item){
    songs.push(item);
    saveSongs();
    renderSongs();
  }

  function removeSong(index){
    songs.splice(index,1);
    saveSongs();
    renderSongs();
  }

  function renderSongs(){
    listEl.innerHTML = "";
    if (songs.length === 0) {
      const empty = document.createElement("li");
      empty.className = "card";
      empty.style.padding = "10px";
      empty.textContent = "Aún no hay canciones añadidas. Añade la primera :)";
      listEl.appendChild(empty);
      return;
    }

    songs.forEach((it, i) => {
      const li = document.createElement("li");
      li.className = "music-item";

      const row = document.createElement("div");
      row.className = "music-row";

      const meta = document.createElement("div");
      meta.className = "music-meta";

      const s = document.createElement("div");
      s.className = "song";
      s.textContent = it.song;

      const a = document.createElement("div");
      a.className = "artist";
      a.textContent = it.artist;

      meta.appendChild(s);
      meta.appendChild(a);

      const actions = document.createElement("div");
      actions.className = "music-actions";

      // If there is a link, parse it to see if it's embeddable (spotify/youtube)
      const parsed = toEmbed(it.link);

      // Play button (if embeddable)
      if (parsed && parsed.embedUrl) {
        const play = document.createElement("button");
        play.className = "play-btn";
        play.title = "Reproducir en la página";
        play.textContent = "▶︎";
        play.addEventListener("click", () => toggleEmbed(li, parsed));
        actions.appendChild(play);
      }

      // Open external button (if external URL available)
      if (parsed && parsed.externalUrl) {
        const open = document.createElement("a");
        open.className = "open-btn";
        open.title = "Abrir en " + (parsed.provider === "spotify" ? "Spotify" : parsed.provider === "youtube" ? "YouTube" : "enlace externo");
        open.href = parsed.externalUrl;
        open.target = "_blank";
        open.rel = "noopener noreferrer";
        open.textContent = "⧉";
        actions.appendChild(open);
      }

      // NOTE: Botón de eliminar eliminado por petición del usuario.
      // Si más adelante quieres restaurarlo, podemos añadirlo de nuevo aquí.

      row.appendChild(meta);
      row.appendChild(actions);

      li.appendChild(row);

      listEl.appendChild(li);
    });
  }

  // Merge helper: tries to detect duplicates by externalUrl when possible, otherwise by song+artist.
  function mergeInitialsInto(existingArray, initials){
    for (const item of initials){
      let shouldAdd = true;
      const parsedInit = toEmbed(item.link);
      for (const ex of existingArray){
        const parsedEx = toEmbed(ex.link);
        if (parsedInit && parsedEx && parsedInit.externalUrl && parsedEx.externalUrl) {
          if (normalizeUrl(parsedInit.externalUrl) === normalizeUrl(parsedEx.externalUrl)) {
            shouldAdd = false;
            break;
          }
        } else {
          // fallback compare by song + artist
          if ((ex.song || "").toLowerCase() === (item.song || "").toLowerCase()
              && (ex.artist || "").toLowerCase() === (item.artist || "").toLowerCase()) {
            shouldAdd = false;
            break;
          }
        }
      }
      if (shouldAdd) existingArray.push(item);
    }
  }

  function normalizeUrl(u){
    try {
      const url = new URL(u);
      // remove query and hash for comparison
      url.search = "";
      url.hash = "";
      return url.toString();
    } catch(e){
      return u;
    }
  }

  // Convert user link (Spotify or YouTube) into embed + external url
  // Returns { provider: "spotify"|"youtube"|null, embedUrl, externalUrl, height } or null
  function toEmbed(link){
    if (!link) return null;
    const trimmed = link.trim();

    // Spotify URI: spotify:track:ID or spotify:playlist:ID
    if (trimmed.startsWith("spotify:")) {
      const parts = trimmed.split(":");
      if (parts.length >= 3) {
        const type = parts[1];
        const id = parts[2];
        const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
        const externalUrl = `https://open.spotify.com/${type}/${id}`;
        const height = (type === "track") ? 80 : 380;
        return { provider: "spotify", embedUrl, externalUrl, height };
      }
      return null;
    }

    // Try parse as URL
    try {
      const u = new URL(trimmed);
      // Spotify web links (manejar posibles prefijos de idioma en el path)
      if (u.hostname.includes("spotify.com")) {
        // ejemplo de pathname: /intl-es/track/ID  o /track/ID
        const segs = u.pathname.split("/").filter(Boolean); // e.g. ["intl-es","track","ID"]
        // buscar segmento conocido (track, album, playlist, artist, show, episode)
        const types = ["track","album","playlist","artist","show","episode"];
        let idx = -1;
        for (let j = 0; j < segs.length; j++) {
          if (types.includes(segs[j].toLowerCase())) {
            idx = j;
            break;
          }
        }
        if (idx !== -1 && segs.length > idx + 1) {
          const type = segs[idx].toLowerCase();
          const id = segs[idx + 1];
          const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
          const externalUrl = `https://open.spotify.com/${type}/${id}`;
          const height = (type === "track") ? 80 : 380;
          return { provider: "spotify", embedUrl, externalUrl, height };
        }
        return null;
      }

      // YouTube links and youtu.be short links
      if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
        // youtu.be short link: pathname = /ID
        if (u.hostname.includes("youtu.be")) {
          const vid = u.pathname.split("/").filter(Boolean)[0];
          if (!vid) return null;
          const embedUrl = `https://www.youtube.com/embed/${vid}`;
          const externalUrl = `https://www.youtube.com/watch?v=${vid}`;
          const height = 315;
          return { provider: "youtube", embedUrl, externalUrl, height };
        }

        // youtube.com
        const params = u.searchParams;
        // playlist ?list=ID (sin v)
        if (params.has("list") && !params.has("v")) {
          const listId = params.get("list");
          const embedUrl = `https://www.youtube.com/embed?listType=playlist&list=${listId}`;
          const externalUrl = `https://www.youtube.com/playlist?list=${listId}`;
          const height = 315;
          return { provider: "youtube", embedUrl, externalUrl, height };
        }

        // video link (watch?v=ID)
        if (params.has("v")) {
          const vid = params.get("v");
          const embedUrl = `https://www.youtube.com/embed/${vid}`;
          const externalUrl = `https://www.youtube.com/watch?v=${vid}`;
          const height = 315;
          return { provider: "youtube", embedUrl, externalUrl, height };
        }

        // fallback: maybe path like /embed/ID
        const segs = u.pathname.split("/").filter(Boolean);
        if (segs.length >= 2 && segs[0] === "embed") {
          const vid = segs[1];
          const embedUrl = `https://www.youtube.com/embed/${vid}`;
          const externalUrl = `https://www.youtube.com/watch?v=${vid}`;
          const height = 315;
          return { provider: "youtube", embedUrl, externalUrl, height };
        }
      }

      return null;
    } catch (e) {
      // Not a valid URL; try to see if it's a raw YouTube id
      // If it's 11 chars possibly a YouTube id
      if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
        const embedUrl = `https://www.youtube.com/embed/${trimmed}`;
        const externalUrl = `https://www.youtube.com/watch?v=${trimmed}`;
        return { provider: "youtube", embedUrl, externalUrl, height: 315 };
      }
      return null;
    }
  }

  // Toggle embed iframe inside given li element. Only one embed will be open at a time.
  function toggleEmbed(li, parsed){
    // Close any existing embeds in the list except in this item
    document.querySelectorAll("#musicList .music-embed").forEach(el => {
      if (!li.contains(el)) el.remove();
    });

    const existing = li.querySelector(".music-embed");
    if (existing) {
      existing.remove();
      return;
    }

    if (!parsed || !parsed.embedUrl) {
      alert("No se ha podido convertir el enlace a un reproductor embebido. Asegúrate de pegar un enlace de Spotify o YouTube válido o un URI (spotify:...).");
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "music-embed";

    const iframe = document.createElement("iframe");
    iframe.src = parsed.embedUrl;
    iframe.width = "100%";
    iframe.height = String(parsed.height || 315);
    iframe.frameBorder = "0";
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    iframe.loading = "lazy";

    wrap.appendChild(iframe);
    li.appendChild(wrap);

    // Scroll into view a bit so user sees the player (especially on mobile)
    setTimeout(() => {
      wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
  }
});

function createHeart(x, y){
  const heart = document.createElement("div");
  heart.textContent = "💖";
  heart.style.position = "fixed";
  heart.style.left = (x - 10) + "px";
  heart.style.top = (y - 10) + "px";
  heart.style.fontSize = "20px";
  heart.style.pointerEvents = "none";
  heart.style.transition = "transform 900ms ease, opacity 900ms ease";
  document.body.appendChild(heart);

  requestAnimationFrame(() => {
    heart.style.transform = "translateY(-80px) scale(1.6)";
    heart.style.opacity = "0";
  });

  setTimeout(() => heart.remove(), 1000);
}