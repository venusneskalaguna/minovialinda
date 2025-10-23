// Pequeña interacción: al pulsar el botón se crean corazones fugaces
document.addEventListener("DOMContentLoaded", () => {
  // Corazones
  const btn = document.getElementById("heartBtn");
  // Click con ratón
  btn?.addEventListener("click", (e) => {
    createHeart(e.clientX, e.clientY);
  });
  // Soporte teclado: Enter y Space crean el corazón en el centro del botón
  btn?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      const rect = (e.currentTarget).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      createHeart(centerX, centerY);
    }
  });

  // Música: lista de canciones + artistas (persistencia en localStorage)
  const MUSIC_KEY = "mi_novia_musica_favorita_v1";
  const form = document.getElementById("musicForm");
  const songInput = document.getElementById("songInput");
  const artistInput = document.getElementById("artistInput");
  const linkInput = document.getElementById("linkInput");
  const listEl = document.getElementById("musicList");

  // --- Persistencia de metadata en localStorage ---
  const META_KEY = "mi_novia_metadata_v1";
  const META_TTL = 1000 * 60 * 60 * 24 * 7; // 7 días en ms

  // Cargar cache desde localStorage (devuelve Map<link, { value: object, ts: number }>)
  function loadMetaCacheFromStorage() {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return new Map();
      const obj = JSON.parse(raw);
      const map = new Map();
      for (const k of Object.keys(obj)) {
        map.set(k, obj[k]);
      }
      return map;
    } catch (e) {
      console.warn("No se pudo leer metaCache from localStorage", e);
      return new Map();
    }
  }

  // Guardar cache en localStorage (acepta Map)
  function saveMetaCacheToStorage(map) {
    try {
      const obj = {};
      for (const [k, v] of map.entries()) {
        obj[k] = v;
      }
      localStorage.setItem(META_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn("No se pudo guardar metaCache en localStorage", e);
    }
  }

  // Inicializar metaCache desde storage
  const metaCache = loadMetaCacheFromStorage();

  // Helper para obtener entrada válida del cache (respeta TTL)
  function getCachedMeta(link) {
    if (!metaCache || !metaCache.has(link)) return null;
    try {
      const entry = metaCache.get(link);
      if (!entry || !entry.ts) return null;
      if (Date.now() - entry.ts > META_TTL) {
        metaCache.delete(link);
        saveMetaCacheToStorage(metaCache);
        return null;
      }
      return entry.value;
    } catch (e) {
      return null;
    }
  }

  // Helper para setear y persistir
  function setCachedMeta(link, value) {
    try {
      metaCache.set(link, { value, ts: Date.now() });
      saveMetaCacheToStorage(metaCache);
    } catch (e) {
      console.warn("No se pudo setCachedMeta", e);
    }
  }
  // --- fin persistencia metadata ---

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

  // Render initial list (async)
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
    // llamar a render (no bloqueante)
    renderSongs();
  }

  function removeSong(index){
    songs.splice(index,1);
    saveSongs();
    renderSongs();
  }

  // renderSongs ahora puede hacer peticiones, por eso es async
  async function renderSongs(){
    listEl.innerHTML = "";
    if (songs.length === 0) {
      const empty = document.createElement("li");
      empty.className = "card";
      empty.style.padding = "10px";
      empty.textContent = "Aún no hay canciones añadidas. Añade la primera :)";
      listEl.appendChild(empty);
      return;
    }

    // Recorremos en orden y pedimos metadata en background (cacheada)
    for (let i = 0; i < songs.length; i++) {
      const it = songs[i];

      const li = document.createElement("li");
      li.className = "music-item";

      const row = document.createElement("div");
      row.className = "music-row";

      const meta = document.createElement("div");
      meta.className = "music-meta";

      // MINI-METADATA: mini-portada si está disponible
      let metadata = null;
      try {
        metadata = await fetchMetadata(it.link);
      } catch(e){
        // no fatal
        metadata = null;
      }

      if (metadata && metadata.thumbnail_url) {
        const thumb = document.createElement("img");
        thumb.className = "music-thumb";
        thumb.src = metadata.thumbnail_url;
        thumb.alt = metadata.title ? `${metadata.title} - portada` : `Portada`;
        thumb.loading = "lazy";
        meta.appendChild(thumb);
      }

      const texts = document.createElement("div");
      texts.style.display = "flex";
      texts.style.flexDirection = "column";

      const s = document.createElement("div");
      s.className = "song";
      // Preferir título proveniente de metadata si es más descriptivo
      s.textContent = metadata && metadata.title ? metadata.title : it.song;

      const a = document.createElement("div");
      a.className = "artist";
      a.textContent = metadata && metadata.author_name ? metadata.author_name : it.artist;

      // Si metadata contiene info extra (album/duration) mostrar en pequeño
      const extra = document.createElement("div");
      extra.className = "music-extra";
      extra.style.fontSize = "0.8rem";
      extra.style.color = "var(--muted)";
      let extras = [];
      if (metadata && metadata.provider_name) {
        extras.push(metadata.provider_name);
      }
      // duration / album no suelen estar en oEmbed; si no existe mostramos guion
      if (metadata && metadata.duration) {
        extras.push(formatDuration(metadata.duration));
      }
      if (extras.length > 0) {
        extra.textContent = extras.join(" • ");
      } else {
        extra.textContent = ""; // vacío por defecto
      }

      texts.appendChild(s);
      texts.appendChild(a);
      if (extra.textContent) texts.appendChild(extra);

      meta.appendChild(texts);

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

      row.appendChild(meta);
      row.appendChild(actions);

      li.appendChild(row);

      listEl.appendChild(li);
    }
  }

  // Helper para formatear duración si llega en segundos
  function formatDuration(sec){
    if (!sec && sec !== 0) return "";
    const s = Math.round(sec);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
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

  // Trae metadata básica usando endpoints oEmbed públicos (Spotify / YouTube)
  // Retorna objeto con campos estándar: { thumbnail_url, title, author_name, provider_name, duration? }
  async function fetchMetadata(link){
    if (!link) return null;
    // comprobar cache persistente primero
    const cached = getCachedMeta(link);
    if (cached) return cached;

    // detectar provider y construir URL para oEmbed
    try {
      let urlToUse = link.trim();
      // soportar spotify: URIs convirtiéndolos a URL open.spotify.com
      if (urlToUse.startsWith("spotify:")) {
        const parts = urlToUse.split(":");
        if (parts.length >= 3) {
          const type = parts[1];
          const id = parts[2];
          urlToUse = `https://open.spotify.com/${type}/${id}`;
        }
      }

      // Para spotify web links, el endpoint oEmbed es: https://open.spotify.com/oembed?url={url}
      if (urlToUse.includes("spotify.com")) {
        const oembed = `https://open.spotify.com/oembed?url=${encodeURIComponent(urlToUse)}`;
        const res = await fetch(oembed);
        if (!res.ok) throw new Error("no oembed spotify");
        const json = await res.json();
        // json tiene thumbnail_url, author_name, title, html...
        setCachedMeta(link, json);
        return json;
      }

      // Para YouTube usar youtube oEmbed
      if (urlToUse.includes("youtube.com") || urlToUse.includes("youtu.be")) {
        // youtube oembed: https://www.youtube.com/oembed?url={url}&format=json
        const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(urlToUse)}&format=json`;
        const res = await fetch(oembed);
        if (!res.ok) throw new Error("no oembed youtube");
        const json = await res.json();
        // json tiene thumbnail_url, author_name, title, provider_name...
        setCachedMeta(link, json);
        return json;
      }

      // Fallback: intentar noembed.com (soporta varios sitios)
      try {
        const noembed = `https://noembed.com/embed?url=${encodeURIComponent(urlToUse)}`;
        const r2 = await fetch(noembed);
        if (r2.ok) {
          const j2 = await r2.json();
          if (!j2.error) {
            setCachedMeta(link, j2);
            return j2;
          }
        }
      } catch(e){
        // ignore
      }

      return null;
    } catch (e) {
      // Cualquier fallo -> null (no fatal)
      // console.warn("Metadata fetch failed for", link, e);
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