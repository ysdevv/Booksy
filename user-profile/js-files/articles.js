import { db, auth } from "./firebase.js";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {smallerNavBar, normalNavBar} from './main.js';
import { markArticleRead } from "./achievements.js";
export { renderArticlesList, initDiscover, escapeHtml, getCachedAllArticles };
const mainDisplay = document.querySelector('.main-display')
const container = document.querySelector('.content');
const booksSection = document.querySelector('.books');
const articlesSection = document.querySelector('.articles');
const seeAllBooksBtn = document.getElementById('seeAll');

async function toggleSaveArticle(article, saveBtn, saveIcon) {
  const user = auth.currentUser;
  if (!user) return alert("You need to be logged in.");
  
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const saved = data.savedArticles || [];

  const exists = saved.some(
    (a) => a.title === article.title && a.link === article.link
  );

  const entry = {
    title: article.title,
    author: article.author,
    link: article.link,
    cover: article.cover || null,
    description: escapeHtml(truncate(stripHtml(article.description || ""), 220)) || "",
    duration: article.duration || "",
  };

  if (exists) {
    await updateDoc(userRef, {
      savedArticles: arrayRemove(entry),
    });
    saveBtn.querySelector('p').textContent = "Save";
    saveIcon.style.fill = "none";
  } else {
    await updateDoc(userRef, {
      savedArticles: arrayUnion(entry),
    });
    saveBtn.querySelector('p').textContent = "Saved";
    saveIcon.style.fill = "white";
  }
}
export function renderSavedArticles(articles, userData) {
  const container = document.getElementById("saved");
  if (!container) return;

  container.innerHTML = `
    <h2>Saved Articles</h2>
    <div class="saved-list"></div>
  `;

  const list = container.querySelector(".saved-list");

  if (!articles.length) {
    list.innerHTML = `<p style="opacity:.7; margin:0px">No saved articles yet.</p>`;
    return;
  }

  articles.forEach(article => {
    list.style.marginLeft = '0px';
    const title = escapeHtml(article.title);
    const author = escapeHtml(article.author || "Unknown");
    const description = escapeHtml(truncate(stripHtml(article.description || ""), 150));
    const cover = article.cover || "/images/user-profile/test.png";

    const card = document.createElement("div");
    card.className = "article";
    card.innerHTML = `
      <div class="articleMain">
        <h2 class="articleTitle">${title}</h2>
        <p class="author">by ${author}</p>
        <p class="articleDescription">${description}</p>
      </div>
      <svg class='unsaveArticle' viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
              style="fill:white; stroke:#ffffff; stroke-width:2;">
              <path d="M5 6.2C5 5.07989 5 4.51984 5.21799 4.09202C5.40973 3.71569 5.71569 3.40973 6.09202 3.21799C6.51984 3 7.07989 3 8.2 3H15.8C16.9201 3 17.4802 3 17.908 3.21799C18.2843 3.40973 18.5903 3.71569 18.782 4.09202C19 4.51984 19 5.07989 19 6.2V21L12 16L5 21V6.2Z"/>
      </svg>
      <img class="articleCover" src="${cover}" alt="">
    `;
    list.appendChild(card);

    const saveBtn = card.querySelector(".saveArticle");
    const saveIcon = card.querySelector(".unsaveArticle");
    saveIcon.addEventListener("click", async () => {
      await toggleSaveArticle(article, saveBtn, saveIcon);
      card.remove();
      if (!list.children.length) {
        list.innerHTML = `<p style="opacity:.7;">No saved articles yet.</p>`;
      }
    });

    card.addEventListener("click", () => {
      smallerNavBar();
      mainDisplay.scrollTo({ top: 0, behavior: "smooth" });
      mainDisplay.style.gap = '0px';
      articleReader.style.opacity = '1';
      container.style.opacity = '0';
      articleReader.innerHTML = `
        <svg id='closeArticle' fill="white" width='25px' viewBox="0 0 32 32">
          <path d="M0 21.984q0.032-0.8 0.608-1.376l4-4..."></path>
        </svg>
        <h2>${article.title}</h2>
        <p>by ${article.author}</p>
        ${article.content || "<p>No content available.</p>"}
      `;
      setTimeout(() => {
        container.style.display = 'none';
      }, 150);

      // close handler
      document.getElementById("closeArticle").addEventListener("click", () => {
        normalNavBar();
        mainDisplay.style.gap = '47px';
        articleReader.style.opacity = "0";
        container.style.opacity = '1';
        setTimeout(() => {
          container.style.display = 'block';
          articleReader.innerHTML = '';
        }, 350);
      });
    });
  });
}

const AUTHOR_USERNAMES = [
  "danshiner",
  "mentalgarden",
  "harshppatel7",
  "klywrites",
  "kevinnokiawriting",
  "moulshree",
  "guiltandindustry",
  "stevenchayes",
  "ConversationUS"
];

let discoverInitialized = false;
let allLoadedOnce = false;
const CACHE_KEY_ALL = "booksy_all_articles_cache_v2";
const CACHE_TTL_MS = 15 * 60 * 1000;

function pickRandomArticle(articles) {
  return articles[Math.floor(Math.random() * articles.length)];
}

async function getOrAssignDailyArticle(userData, allArticles) {
  const today = new Date().toISOString().slice(0, 10); 
  if (userData.dailyArticle && userData.dailyArticle.date === today) {
    return userData.dailyArticle.article;
  }
  const chosen = pickRandomArticle(allArticles);
  const user = getAuth().currentUser;
  if (user) {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      dailyArticle: {
        date: today,
        article: chosen
      }
    });

  }
  console.log(chosen)
  return chosen;
}
function getCachedAllArticles(){
  try {
    const raw = sessionStorage.getItem(CACHE_KEY_ALL);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.ts > CACHE_TTL_MS) return null;
    return obj.items || null;
  } catch {
    return null;
  }
}
function setCachedAllArticles(items) {
  try {
    sessionStorage.setItem(CACHE_KEY_ALL,JSON.stringify({ ts: Date.now(), items }));
  } catch {}
}
async function fetchMediumAuthor(username) {
  const rssUrl = `https://medium.com/feed/@${username}`;
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`rss2json fetch failed for ${username}`);
  const json = await res.json();
  if (json.status !== "ok") throw new Error(`rss2json returned non-ok for ${username}`);
  return json.items.map(normalizeFeedItem);
}
function normalizeFeedItem(item) {
  const coverFromImg =
    item.thumbnail ||
    (item.content &&
      (item.content.match(/<img[^>]+src="([^">]+)"/)?.[1] || null));

  const pub = item.pubDate || item.pub_date || item.isoDate;

  const categories = item.categories || [];
  const fullContent = item.content || item.content_encoded || item.description || "";

  return {
    title: item.title || "Untitled",
    author: item.author || item.creator || "Unknown",
    description: item.description || item.contentSnippet || "",
    content: fullContent, 
    link: item.link,
    cover: coverFromImg || "",
    pubDate: pub ? new Date(pub).getTime() : Date.now(),
    duration: estimateReadTime(fullContent),
    categories
  };
}
function estimateReadTime(html) {
  const text = stripHtml(html);
  const words = text ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 225));
  return `${minutes} min read`;
}
function stripHtml(html) {
  return (html || "").replace(/<[^>]*>/g, " ");
}
function truncate(text, n) {
  return text.length > n ? text.slice(0, n - 1) + "…" : text;
}
function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, (s) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
  );
}
function showArticlesLoading() {
  const container = document.querySelector(".readsForYou");
  if (!container) return;
  container.innerHTML = `<div style="opacity:.8;">Loading articles…</div>`;
}
async function renderAllArticles(userData) {
  //showArticlesLoading();
 
  const cached = getCachedAllArticles();
  if (cached && cached.length) {
    renderArticlesList(cached, userData);
  }

  const results = await Promise.all(
    AUTHOR_USERNAMES.map((username) => fetchMediumAuthor(username).catch(() => []))
  );

  const merged = results.flat();
  const englishOnly = merged.filter((it) => /[a-zA-Z]/.test(it.title || ""));

  const seen = new Set();
  const deduped = englishOnly.filter((a) => {
    const key = (a.link || "").replace(/\?.*$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => b.pubDate - a.pubDate);

  setCachedAllArticles(deduped);
  let daily = userData.dailyArticle?.date === new Date().toISOString().slice(0, 10)
    ? userData.dailyArticle.article
    : await getOrAssignDailyArticle(userData, deduped);
  renderArticlesList(deduped, userData);
}
async function renderFilteredArticles(category, userData) {
  showArticlesLoading();
  try {
    const results = await Promise.all(
      AUTHOR_USERNAMES.map((username) => fetchMediumAuthor(username).catch(() => []))
    );

    let items = results.flat();
    const categoryNavEl = Array.from(document.querySelectorAll("#topics p"))
      .find(p => p.textContent.trim().toLowerCase() === category.toLowerCase());

    const navClasses = categoryNavEl ? Array.from(categoryNavEl.classList).map(c => c.toLowerCase()) : [category.toLowerCase()];

    // Filter articles whose categories match any of the nav classes
    items = items.filter(it =>
      it.categories.some(cat => navClasses.includes(cat.toLowerCase()))
    );

    items.sort((a, b) => b.pubDate - a.pubDate);

    renderArticlesList(items, userData);
  } catch (err) {
    console.error(`Failed to fetch for category ${category}`, err);
    const container = document.querySelector(".readsForYou");
    if (container) container.innerHTML = `<p>Could not load ${category} articles.</p>`;
  }
}
function setCategoryChosen(labelToChoose = "All") {
  const categories = document.querySelector("#topics");
  if (!categories) return;
  const pills = categories.querySelectorAll("p");
  pills.forEach((p) => p.removeAttribute("id"));
  const pill = Array.from(pills).find(
    (p) => p.textContent.trim().toLowerCase() === labelToChoose.toLowerCase()
  );
  if (pill) pill.setAttribute("id", "chosen");
}

function initDiscover(userData) {
  if (discoverInitialized) return;
  discoverInitialized = true;

  const categoriesNav = document.querySelector("#topics");
  if (categoriesNav) {
    categoriesNav.addEventListener("click", (e) => {
      if (!(e.target instanceof HTMLElement) || e.target.tagName.toLowerCase() !== "p") return;
      const label = e.target.textContent.trim();
      categoriesNav.querySelectorAll("p").forEach((p) => p.removeAttribute("id"));
      e.target.setAttribute("id", "chosen");

      if (label.toLowerCase() === "all") {
        renderAllArticles(userData);
      } else {
        renderFilteredArticles(label, userData);
      }
    });
  }

  setCategoryChosen("All");
  if (!allLoadedOnce) {
    allLoadedOnce = true;
    renderAllArticles(userData);
  }
}
const articleReader = document.querySelector('.articleReader');
function renderArticlesList(items, userData) {
  const feed = document.querySelector(".readsForYou");
  if (!feed) return;

  feed.innerHTML = "";
  if (!items || !items.length) {
    feed.innerHTML = `<p style="opacity:.8;">No articles could be loaded right now. Try again in a bit.</p>`;
    return;
  }

  items.forEach((article) => {
    feed.innerHTML += createArticleHTML(article, userData);
  });

  const readBtns = document.querySelectorAll(".readsForYou .readArticle");
  readBtns.forEach((btn, index) => {
    const article = items[index]; 
    btn.addEventListener("click", () => {
      if(window.innerWidth>=768)smallerNavBar();
      mainDisplay.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      console.log(mainDisplay)
      mainDisplay.style.gap = '0px';
      articleReader.style.opacity = '1';
      container.style.opacity='0';
      articleReader.innerHTML = `
        <svg id='closeArticle' fill="white" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>return</title> <path d="M0 21.984q0.032-0.8 0.608-1.376l4-4q0.448-0.48 1.056-0.576t1.12 0.128 0.864 0.736 0.352 1.12v1.984h18.016q0.8 0 1.408-0.576t0.576-1.408v-8q0-0.832-0.576-1.408t-1.408-0.608h-16q-0.736 0-1.248-0.416t-0.64-0.992 0-1.152 0.64-1.024 1.248-0.416h16q2.464 0 4.224 1.76t1.76 4.256v8q0 2.496-1.76 4.224t-4.224 1.76h-18.016v2.016q0 0.64-0.352 1.152t-0.896 0.704-1.12 0.096-1.024-0.544l-4-4q-0.64-0.608-0.608-1.44z"></path> </g></svg>
        <div>
          <h2>${article.title}</h2>
          <div class='intro' style='display:flex;'>
            <h3>by ${article.author}</h3>
            <div class='intro-div'>
              <p>${article.duration}</p>
              <div class='saveArticle' style='display:flex; gap:8px;'><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5 6.2C5 5.07989 5 4.51984 5.21799 4.09202C5.40973 3.71569 5.71569 3.40973 6.09202 3.21799C6.51984 3 7.07989 3 8.2 3H15.8C16.9201 3 17.4802 3 17.908 3.21799C18.2843 3.40973 18.5903 3.71569 18.782 4.09202C19 4.51984 19 5.07989 19 6.2V21L12 16L5 21V6.2Z" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"></path> </g></svg><p>Save</p></div>
            </div>
         </div>
        </div>
        <hr>
        <div>
        ${article.content}
        </div>
        
      `;
      articleReader.style.display = 'block';
      setTimeout(() => {
        articleReader.style.opacity = '1';
      }, 250);
      const btn = document.createElement('button');
      btn.innerHTML = 'Mark as read'
      btn.id = 'markArticleRead';
      articleReader.appendChild(btn)
      setTimeout(() => {

        container.style.display='none';
      }, 150);
      const closeArticle = document.getElementById('closeArticle');
      closeArticle.addEventListener('click', ()=>{
        if(window.innerWidth>=768)normalNavBar('focusMode');
        if(document.querySelector('.discover').id==='active') document.querySelector('.bg').style.filter ='brightness(0.7) blur(32px)';
        mainDisplay.style.gap = '30px';
        articleReader.style.opacity = '0';
        setTimeout(() => {
          container.style.display = 'block';
          articleReader.innerHTML = '';
          articleReader.style.display = 'none';
          setTimeout(() => {
          container.style.opacity = '1';
          
        }, 180);
        }, 500);
      })
      const markBtn = articleReader.querySelector("#markArticleRead");
      if (markBtn) {
        markBtn.addEventListener("click", async () => {
          const userRef = doc(db, "users", auth.currentUser.uid);
          await markArticleRead(userRef);
          markBtn.outerHTML = `<p id='articleRead'>Read✅</p>`;
        });
      }

    });
  });
  const saveBtns = document.querySelectorAll(".readsForYou .saveArticle");
  saveBtns.forEach((btn, index) => {
    const article = items[index];
    const svg = btn.querySelector("svg");
    const label = btn.querySelector("p");

    btn.addEventListener("click", () => {
    toggleSaveArticle(article, btn, svg);
  });

  });
}
function createArticleHTML(article, userData) {
  const title = escapeHtml(article.title);
  const author = escapeHtml(article.author);
  let description;
  const width = window.innerWidth;
  if(width<=768) {
    description = escapeHtml(truncate(stripHtml(article.description || ""), 100));
  } else {
    description = escapeHtml(truncate(stripHtml(article.description || ""), 220));
  }
  const cover = article.cover || "/images/user-profile/test.png";
  const link = article.link || "#";

  const inSaved = (userData?.savedArticles || []).some(
    (a) => a.title === article.title && a.link === article.link
  );
  return `
    <div class="article">
      <div class="articleMain">
        <div class="articleTop">
          <p class="author">by ${author}</p>
          <span>|</span>
          <p class="duration">${article.duration || "~5-8 min read"}</p>
        </div>
        <h2 class="articleTitle">${title}</h2>
        <p class="articleDescription">${description}</p>
        <div class="articleActions">
          <div class="readArticle"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3 6.1519V19.3095C3.99197 18.8639 5.40415 18.4 7 18.4C8.58915 18.4 9.9999 18.8602 11 19.3094V6.1519C10.7827 6.02653 10.4894 5.8706 10.1366 5.71427C9.31147 5.34869 8.20352 5 7 5C5.26385 5 3.74016 5.72499 3 6.1519ZM13 6.1519V19.3578C13.9977 18.9353 15.41 18.5 17 18.5C18.596 18.5 20.0095 18.9383 21 19.3578V6.1519C20.2598 5.72499 18.7362 5 17 5C15.7965 5 14.6885 5.34869 13.8634 5.71427C13.5106 5.8706 13.2173 6.02653 13 6.1519ZM12 4.41985C11.7302 4.26422 11.3734 4.07477 10.9468 3.88572C9.96631 3.45131 8.57426 3 7 3C4.69187 3 2.76233 3.97065 1.92377 4.46427C1.30779 4.82687 1 5.47706 1 6.11223V20.0239C1 20.6482 1.36945 21.1206 1.79531 21.3588C2.21653 21.5943 2.78587 21.6568 3.30241 21.3855C4.12462 20.9535 5.48348 20.4 7 20.4C8.90549 20.4 10.5523 21.273 11.1848 21.6619C11.6757 21.9637 12.2968 21.9725 12.7959 21.6853C13.4311 21.32 15.0831 20.5 17 20.5C18.5413 20.5 19.9168 21.0305 20.7371 21.4366C21.6885 21.9075 23 21.2807 23 20.0593V6.11223C23 5.47706 22.6922 4.82687 22.0762 4.46427C21.2377 3.97065 19.3081 3 17 3C15.4257 3 14.0337 3.45131 13.0532 3.88572C12.6266 4.07477 12.2698 4.26422 12 4.41985Z" fill="black"></path> </g></svg><p>Read</p></div>
          <div class="saveArticle">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
              style="fill:${inSaved ? 'white' : 'none'}; stroke:#ffffff; stroke-width:2;">
              <path d="M5 6.2C5 5.07989 5 4.51984 5.21799 4.09202C5.40973 3.71569 5.71569 3.40973 6.09202 3.21799C6.51984 3 7.07989 3 8.2 3H15.8C16.9201 3 17.4802 3 17.908 3.21799C18.2843 3.40973 18.5903 3.71569 18.782 4.09202C19 4.51984 19 5.07989 19 6.2V21L12 16L5 21V6.2Z"/>
            </svg>
            <p>${inSaved ? 'Saved' : 'Save'}</p>
          </div>
        </div>
      </div>
       <img class="articleCover" src="${cover}" alt="">
    </div>
  `;
}
