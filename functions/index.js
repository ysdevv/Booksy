import functions from "firebase-functions";
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors({ origin: true }));

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(204).send('');
  }
  next();
});


const MAX_BYTES = 35 * 1024 * 1024;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";

const RECS = {
  classics: [
    { title: "Pride and Prejudice", author: "Jane Austen" },
    { title: "Crime and Punishment", author: "Fyodor Dostoevsky" },
    { title: "Moby-Dick", author: "Herman Melville" },
  ],
  detective: [
    { title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle" },
    { title: "The Big Sleep", author: "Raymond Chandler" },
    { title: "Murder on the Orient Express", author: "Agatha Christie" },
  ],
  fantasy: [
    { title: "The Hobbit", author: "J.R.R. Tolkien" },
    { title: "A Wizard of Earthsea", author: "Ursula K. Le Guin" },
    { title: "The Name of the Wind", author: "Patrick Rothfuss" },
  ],
  psychology: [
    { title: "Thinking, Fast and Slow", author: "Daniel Kahneman" },
    { title: "Man’s Search for Meaning", author: "Viktor E. Frankl" },
    { title: "Atomic Habits", author: "James Clear" },
  ],
  philosophy: [
    { title: "Meditations", author: "Marcus Aurelius" },
    { title: "Thus Spoke Zarathustra", author: "Friedrich Nietzsche" },
    { title: "Republic", author: "Plato" },
  ],
  horror: [
    { title: "Dracula", author: "Bram Stoker" },
    { title: "The Haunting of Hill House", author: "Shirley Jackson" },
    { title: "Pet Sematary", author: "Stephen King" },
  ],
};

const coverCache = new Map();

function cacheKey(title, author) {
  return `${(title || "").trim().toLowerCase()}|${(author || "")
    .trim()
    .toLowerCase()}`;
}

function sanitize(str = "") {
  return str.replace(/\s+/g, " ").trim();
}

async function fetchGoogleCover({ title, author }) {
  const key = cacheKey(title, author);
  if (coverCache.has(key)) return coverCache.get(key);

  const q = encodeURIComponent(
    `intitle:${sanitize(title)} inauthor:${sanitize(author)}`
  );

  const url =
    `${GOOGLE_BOOKS_ENDPOINT}?q=${q}&maxResults=1&printType=books` +
    (GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : "");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BooksyApp (+https://example.com)" },
    });

    if (!res.ok) {
      coverCache.set(key, null);
      return null;
    }

    const json = await res.json();
    const item = json?.items?.[0];

    const img =
      item?.volumeInfo?.imageLinks?.thumbnail ||
      item?.volumeInfo?.imageLinks?.smallThumbnail ||
      null;

    const cover = img ? img.replace(/^http:\/\//i, "https://") : null;
    coverCache.set(key, cover);
    return cover;
  } catch {
    coverCache.set(key, null);
    return null;
  }
}

async function enrichBooksWithCovers(books) {
  return Promise.all(
    books.map(async (b) => ({
      title: b.title,
      author: b.author,
      cover: await fetchGoogleCover(b),
    }))
  );
}

function pickPreviewFromGenres(genresArray, enrichedMap, limit = 4) {
  const result = [];
  const buckets = genresArray
    .map((g) => enrichedMap[g] || [])
    .filter((arr) => arr.length);

  const allGenres = Object.keys(enrichedMap);
  let fallbackIndex = 0;
  let idx = 0;

  while (result.length < limit) {
    const bucket = buckets[idx % buckets.length];
    if (bucket && bucket.length > 0) {
      result.push(bucket.shift());
    } else if (fallbackIndex < allGenres.length) {
      const fb = enrichedMap[allGenres[fallbackIndex++]];
      if (fb && fb.length > 0) buckets.push([...fb]);
    } else {
      break;
    }
    idx++;
  }
  return result.slice(0, limit);
}

app.get("/api/books", async (req, res) => {
  try {
    const genreKeys = Object.keys(RECS);

    const enrichedEntries = await Promise.all(
      genreKeys.map(async (g) => [g, await enrichBooksWithCovers(RECS[g])])
    );

    const enriched = Object.fromEntries(enrichedEntries);

    const preferredParam = String(req.query.preferred || "").trim();
    const preferredGenres = preferredParam
      ? preferredParam.split(",").map((s) => s.trim().toLowerCase())
      : [];

    const validKeys = genreKeys.map((g) => g.toLowerCase());
    const selectedGenres = preferredGenres.filter((g) =>
      validKeys.includes(g)
    );

    const fallbackGenres = ["fantasy", "classics", "detective", "psychology"];

    const enrichedClone = Object.fromEntries(
      Object.entries(enriched).map(([k, arr]) => [k.toLowerCase(), [...arr]])
    );

    const preview = pickPreviewFromGenres(
      selectedGenres.length ? selectedGenres : fallbackGenres,
      enrichedClone,
      4
    );

    res.json({
      preview,
      genres: enriched,
    });
  } catch (err) {
    console.error("Error in /api/books:", err);
    res.status(500).json({ error: "Server error" });
  }
});


function classifyFiles(files) {
  const text = [];
  const epub = [];
  const pdf = [];

  for (const f of files) {
    const name = f.name.toLowerCase();
    if (
      name.endsWith(".txt") ||
      name.endsWith("_djvu.txt") ||
      name.endsWith("_hocr_searchtext.txt.gz")
    ) {
      text.push(f);
    } else if (name.endsWith(".epub")) {
      epub.push(f);
    } else if (name.endsWith(".pdf")) {
      pdf.push(f);
    }
  }
  return { text, epub, pdf };
}

async function tryFetchTextOrAlt(identifier, files) {
  const { text, epub, pdf } = classifyFiles(files);
  const hasAny = text.length + epub.length + pdf.length > 0;

  if (!hasAny) return { kind: "none" };

  // Try text
  for (const file of text) {
    const url = `https://archive.org/download/${identifier}/${encodeURIComponent(
      file.name
    )}`;

    const resp = await fetch(url, {
      headers: { "User-Agent": "BooksyApp (+https://example.com)" },
    });

    if (resp.ok && resp.headers.get("content-type")?.startsWith("text"))
      return { kind: "text", stream: resp.body, contentType: "text/plain" };
  }

  // Try EPUB/PDF
  for (const list of [epub, pdf]) {
    for (const file of list) {
      const url = `https://archive.org/download/${identifier}/${encodeURIComponent(
        file.name
      )}`;

      const head = await fetch(url, {
        method: "HEAD",
        headers: { "User-Agent": "BooksyApp (+https://example.com)" },
      });

      if (head.ok) {
        return {
          kind: "alt",
          type: file.name.endsWith(".epub") ? "epub" : "pdf",
          url,
        };
      }

      if (head.status === 401 || head.status === 403) {
        return {
          kind: "restricted",
          borrowUrl: `https://archive.org/details/${identifier}`,
        };
      }
    }
  }

  return { kind: "none" };
}

app.get("/api/ia/text", async (req, res) => {
  const { identifier, title, author } = req.query;

  try {
    let id = identifier;

    if (!id && (title || author)) {
      let queryParts = [];
      if (title) queryParts.push(`title:"${title}"`);
      if (author) queryParts.push(`creator:"${author}"`);
      queryParts.push("mediatype:texts");
      queryParts.push("language:eng");

      const query = encodeURIComponent(queryParts.join(" AND "));

      const searchUrl =
        `https://archive.org/advancedsearch.php?q=${query}` +
        `&fl[]=identifier&fl[]=downloads&fl[]=language&rows=20&page=1&output=json`;

      const searchResp = await fetch(searchUrl, {
        headers: { "User-Agent": "BooksyApp (+https://example.com)" },
      });

      if (!searchResp.ok)
        return res.status(502).json({ error: "Search failed" });

      const data = await searchResp.json();
      const docs = data.response?.docs || [];

      const sorted = docs
        .filter((d) => d.identifier && d.language?.includes("eng"))
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0));

      id = sorted[0]?.identifier || null;
    }

    if (!id)
      return res.status(404).json({ error: "No identifier found" });

    const metaUrl = `https://archive.org/metadata/${id}`;
    const metaResp = await fetch(metaUrl, {
      headers: { "User-Agent": "BooksyApp (+https://example.com)" },
    });

    if (metaResp.status === 403)
      return res.json({
        error: "restricted",
        borrowUrl: `https://archive.org/details/${id}`,
      });

    if (!metaResp.ok)
      return res.status(502).json({ error: "Metadata fetch failed" });

    const meta = await metaResp.json();
    const files = meta?.files || [];

    const result = await tryFetchTextOrAlt(id, files);

    if (result.kind === "text") {
      res.setHeader("Content-Type", result.contentType);
      return result.stream.pipe(res);
    }

    if (result.kind === "alt") return res.json(result);

    return res.json({ mode: "none" });
  } catch (err) {
    console.error("Error in /api/ia/text:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export const api = functions.https.onRequest(app);
