import { auth, db, initAccountSettings, renderDashboard } from "./firebase.js";

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { initBooks, loadBookIntoReader, calculateGlobalProgress, renderBooks, renderOfflineBooks, loadImportedBookIntoReader, addBookToLibrary, updateReadingProgress, renderWishlist, renderLibBooks } from "./books.js";
import { initDiscover, getCachedAllArticles, renderSavedArticles } from "./articles.js";
import { initTimer, beginTimer, togglePause, updateAssignedBookUI, initScheduler, setupNewSessionModal,attachMenuActions,attachAssignBook, attachEditSession, monitorSessions, initThemePicker, renderQuoteSelections, renderFocusSessions } from "./focus-mode.js";
import { resetDailyIfNeeded, resetWeeklyIfNeeded, renderWeeklyAchievements, renderDailyAchievements, renderMilestones, markArticleRead, renderStreakIcons, checkAllDailyComplete } from "./achievements.js";
import { doc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
export {smallerNavBar, normalNavBar}

function openImportedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ImportedBooksDB", 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("books")) {
        db.createObjectStore("books", { keyPath: "id" });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getImportedBook(id) {
  const db = await openImportedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("books", "readonly");
    const req = tx.objectStore("books").get(id);
    req.onsuccess = (e) => resolve(e.target.result?.buffer || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

//GENERAL VARIABLES

const body = document.querySelector('body');
const welcomeLogo = document.querySelector('.welcome-logo');
export const mainDisplay = document.querySelector('.main-display');
export const content = document.querySelector('.content');
const bg = document.querySelector('.bg')
const dashboard = document.getElementById('dashboard');
const discover = document.getElementById('discover');
const library = document.getElementById('library');
const focusMode = document.getElementById('focusMode');
const settings = document.getElementById('settings');
const aboutBookSection = document.querySelector('.aboutBookSection');
const articleReader = document.querySelector('.articleReader');

export const LEVELS = [
  { xp: 0, title: "Novice Reader" },
  { xp: 100, title: "Page Turner" },
  { xp: 250, title: "Book Enthusiast" },
  { xp: 500, title: "Knowledge Seeker" },
  { xp: 900, title: "Story Explorer" },
  { xp: 1400, title: "Word Collector" },
  { xp: 2000, title: "Insight Hunter" },
  { xp: 2800, title: "Literary Adventurer" },
  { xp: 3800, title: "Wisdom Chaser" },
  { xp: 5000, title: "Book Scholar" },
  { xp: 6500, title: "Lore Keeper" },
  { xp: 8500, title: "Sage of Stories" },
  { xp: 11000, title: "Book Master" },
  { xp: 14000, title: "Literary Guardian" },
  { xp: 18000, title: "Grand Archivist" },
  { xp: 23000, title: "Knowledge Sage" },
  { xp: 29000, title: "Eternal Reader" },
  { xp: 36000, title: "Story Weaver" },
  { xp: 44000, title: "Tome Keeper" },
  { xp: 53000, title: "Master of Lore" }
];

export let thisUser;

export async function checkLevelUp(userRef, userData) {
  const xp = userData.progress?.xp || 0;
  let currentLevel = userData.progress?.level || 1;

  let newLevel = currentLevel;
  let newTitle = userData.progress?.title || LEVELS[0].title;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) {
      newLevel = i + 1;
      newTitle = LEVELS[i].title;
      break;
    }
  }

  if (newLevel > currentLevel) {
    await updateDoc(userRef, {
      "progress.level": newLevel,
      "progress.title": newTitle,
      "progress.xp":0
    });

    showLevelUpPopup(newLevel, newTitle);
  }
}

function showLevelUpPopup(level, title) {
  const popup = document.createElement("div");
  popup.className = "levelUpPopup";
  popup.innerHTML = `
    <div class="levelUpContent">
      <h2>🎉 Level Up!</h2>
      <p>You reached <strong>Level ${level}</strong></p>
      <h3>${title}</h3>
    </div>
  `;
  document.body.appendChild(popup);

  setTimeout(() => {
    
    bg.style.filter = 'brightness(0.74) blur(15px)';
    mainDisplay.style.filter = 'blur(15px)';
    popup.style.display = 'flex';
    setTimeout(() => {
      popup.style.opacity='1';
    },150);
  }, 100);


  setTimeout(() => {
    popup.classList.remove("show");
    bg.style.filter = 'brightness(0.74) ';
    mainDisplay.style.filter = 'blur(0px)'
    mainDisplay.style.removeProperty('filter');
   
    setTimeout(() => popup.remove(), 400);
  }, 3000);
}
const logOutBtn = document.getElementById("logOut");

if (logOutBtn) {
  logOutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      sessionStorage.clear();
      window.location.href = "/index.html";
    } catch (err) {
      console.error("Logout failed:", err);
      showToast("Failed to log out. Please try again.");
    }
  });
}

//NAV VARIABLES

const navBar = document.querySelector('.nav-bar');
const preNav = document.querySelector('.pre-nav');
const nav = document.querySelectorAll('.nav');
const miniNav = document.querySelector('.mini-nav');
const links = document.querySelector('.links');
const editBtn= document.querySelector('.edit');
const smallerNavSection = document.querySelector('.smallerNav');
const navBarContent = document.querySelector('.navContent');
const navs  = document.querySelector('.navs');
const achievementsBtn = document.querySelector('.achievements')
const settingsLink = document.querySelector('.settings');

//DASHBOARD VARIABLES
const topStats = document.querySelector('.dashboard-top-stats');
const middleStats = document.querySelector('.dashboard-middle-stats');
const bottomStats = document.querySelector('.dashboard-bottom-stats');

//DISCOVER VARIABLES

const booksTopSection = document.querySelector('.exploreBooksTop')
const allBooksSection = document.querySelector('.allBooksSection');
const booksPreviewSection = document.querySelector('.booksPreview');
const articlesMainSection = document.querySelector('.readsForYou');
const articlesTopSection = document.querySelector('.readsTopSection');
const articlesTopics = document.querySelector('#topics');

// SEARCH VARIABLES 
const container = document.querySelector(".searchResults");
const resultsList = document.querySelector(".resultsList");
const resultsSummary = document.querySelector('.resultsSummary');
const returnBtn = document.querySelector(".return");

//LIBRARY VARIABLES
const librarySection = document.getElementById("library");
const h2 = librarySection.querySelector("h2");
const noLib = librarySection.querySelector(".noLibrary");
const showLib = librarySection.querySelector(".showLibrary");
const addBook = librarySection.querySelector('.addBook');
const closeAddSection = librarySection.querySelectorAll('.closeAddSection');
const addBookSection = librarySection.querySelector('.addBookSection');
const addMain = librarySection.querySelector('.addMain');
const offlineOption = librarySection.querySelector('.offline');
const addOfflineSection = librarySection.querySelector('.addOfflineSection');
const closeOfflineSection = librarySection.querySelector('.closeOfflineSection')

//FOCUS MODE VARIABLES
let hasStartedOnce = false; 
const focusMain = document.querySelector('.focus-main');
const focus = document.querySelector('.focus')
const startBtn = document.querySelector('.start');
const popup = document.querySelector('.popupMessage');
const noPopup = document.getElementById('noPopup');
const closePopup = document.getElementById('closePopup');
const editFocusBtn = document.querySelector('.editSectionBtn');
const editFocus = document.querySelector('.edit-focus-mode');
const closeEditFocus = editFocus.querySelector('span');
const showStars = document.querySelector('.showStars svg');
const showStarsDiv = document.querySelector('.showStars')

export let width = window.innerWidth;

if(width>=1250 && width<1336){
    welcomeLogo.style.fontSize = '55px';
} else if(width>=1336 && width<1440){
    welcomeLogo.style.fontSize = '58px';
    welcomeLogo.style.left = '155%';
} else if(width>=1440 && width<1900) {
    welcomeLogo.style.fontSize = '65px';
    welcomeLogo.style.left = '150%';
} else if(width>=1900){
    welcomeLogo.style.left='150%';
    welcomeLogo.style.top = '39vh';
    welcomeLogo.style.fontSize = '90px';
}

function applyDashboardTier(width, relCase) {

  document.querySelectorAll('[data-tier-style="true"]').forEach(el => {
    el.removeAttribute('style');
    el.removeAttribute('data-tier-style');
  });

  let tier = null;
  if(relCase ==='small'){
    if (width >= 1900) tier = '1900';
    else if (width >= 1600) tier = '1900';
    else if (width >= 1440) tier = '1600';
    else if (width >= 1250) tier = '1336';
    else return;
  } else {
    tier = 'reset';
  }

  const dashboard = document.querySelector('#dashboard');
  const userInfo = document.querySelector('.user-info');
  const topStats = document.querySelector('.dashboard-top-stats');
  const topStatsTitle = document.querySelectorAll('.dashboard-top-stats h3');
  const streakDays = document.querySelector('.streak-days');
  const day = streakDays ? streakDays.querySelectorAll('.day') : [];
  const dayImg = streakDays ? streakDays.querySelectorAll('img') : [];
  const statIcon = document.querySelectorAll('.stat-icon');
  const statInfo = document.querySelector('.stat-info');
  const statInfoP = document.querySelectorAll('.stat-info p');
  const readingProgressCard = document.querySelector('.reading-progress-card');
  const growthCard = document.querySelector('.growth-card');
  const xpCount = document.querySelector('.xp-count');
  const progressRing = document.querySelector('.progress-ring');
  const ringBg = document.querySelector('.progress-ring__background');
  const currentBookCard = document.querySelector('.current-book-card');
  const dailyArticleCard = document.querySelector('.daily-article-card');
 
  switch (tier) {
    case '1900':

      dashboard.style.width = '88%';
      userInfo.style.fontSize = '45px';
      userInfo.style.width = '120%';
      userInfo.style.marginTop = '38px';
      userInfo.style.marginBottom = '48px';
      topStats.style.paddingTop = '33px';
      topStats.style.marginBottom = '25px';
      topStats.style.paddingBottom = '62px';
      topStatsTitle.forEach(h3 => { h3.style.fontSize = '2.05rem'; h3.style.transform = 'translateY(-7px)'; });
      day.forEach(d => d.style.fontSize = '1.72rem');
      dayImg.forEach(img => img.style.width = '2.25rem');
      statInfoP.forEach(p => { p.style.fontSize = '1.22rem'; p.style.width = '150px'; p.style.marginTop = '7px'; });
      statIcon.forEach(icon => { icon.style.fontSize = '2.8rem'; icon.style.transform = 'translateY(-6px)'; });
      if (streakDays) streakDays.style.marginBottom = '20px';
      document.querySelectorAll('.dashboard-middle-stats').forEach(el => el.style.gap = '37px');
      if (readingProgressCard) { readingProgressCard.style.height = '18rem'; readingProgressCard.style.width = '39rem'; readingProgressCard.style.gap = '10px'; }
      if (growthCard) {
        growthCard.style.padding = '2rem 2.8rem 0rem 2.4rem';
        growthCard.style.width = '380px';
        growthCard.style.height = '380px';
        const h4 = growthCard.querySelector('h4');
        const h3 = growthCard.querySelector('h3');
        const sub = growthCard.querySelector('.growth-sub');
        const level = growthCard.querySelector('.growth-level');
        if (h4) { h4.style.fontSize = '43.4px'; h4.style.fontWeight = '600'; }
        if (h3) h3.style.fontSize = '46px';
        if (sub) { sub.style.marginTop = '15px'; sub.style.fontSize = '24px'; }
        if (level) level.style.transform = 'translateY(108px)';
      }
      if (xpCount) xpCount.style.fontSize = '22px';
      document.querySelectorAll('h5').forEach(h5 => { h5.style.fontSize = '16px'; h5.style.fontWeight = '700'; h5.style.paddingTop = '8px'; h5.style.marginBottom = '26px'; });
      if (progressRing) { progressRing.style.marginLeft = '20px'; progressRing.style.width = '13.25rem'; progressRing.style.height = '13.25rem'; }
      if (ringBg) { ringBg.style.cx = '98'; ringBg.style.cy = '100'; ringBg.style.r = '90'; ringBg.style.strokeWidth = '20px'; }
      document.querySelectorAll('.card-title').forEach(el => { el.style.fontSize = '40px'; el.style.marginBottom = '27px'; });
      document.querySelectorAll('.goal-info').forEach(el => el.style.fontSize = '42px');
      const circleText = document.querySelector('.circle-text');
      if (circleText) { circleText.style.fontSize = '41.5px'; circleText.style.top = '53%'; circleText.style.left = '53%'; }
      document.querySelectorAll('.inside-card span').forEach(el => { el.style.top = '31.5%'; el.style.left = '37.5%'; el.style.fontSize = '64px'; });
      document.querySelectorAll('.inside-card p').forEach(el => el.style.fontSize = '22px');
      document.querySelectorAll('.dashboard-bottom-stats').forEach(el => { el.style.marginTop = '155px'; el.style.gap = '20px'; });
      if (currentBookCard) {
        currentBookCard.style.width = '35.5rem';
        currentBookCard.style.height = '19rem';
        currentBookCard.style.gap = '27px';
        currentBookCard.style.padding = '0.85rem 2.2rem 0.7rem 1.9rem';
        const h4 = currentBookCard.querySelector('h4');
        const author = currentBookCard.querySelector('.book-author');
        const img = currentBookCard.querySelector('.current-book img');
        const pagesProgress = currentBookCard.querySelector('.pages-progress');
        const readBook = currentBookCard.querySelector('.readBook');
        if (h4) { h4.style.fontSize = '36px'; h4.style.fontWeight = '600'; }
        if (author) { author.style.fontSize = '25px'; author.style.marginTop = '12px'; }
        if (img) { img.style.width = '14rem'; img.style.height = '15.5rem'; img.style.borderRadius = '14px'; }
        if (pagesProgress) pagesProgress.style.fontSize = '23.5px';
        if (readBook) { readBook.style.height = '63px'; readBook.style.fontSize = '22px'; }
      }
      if (dailyArticleCard) { dailyArticleCard.style.width = '400px'; dailyArticleCard.style.height = '220px'; dailyArticleCard.style.padding = '10px 35px 10px'; dailyArticleCard.style.transform = 'translateY(79px) translateX(20px)'; }
      const articleCover = document.querySelector('.daily-article .articleCover');
      if (articleCover) { articleCover.style.top = '50px'; articleCover.style.width = '190px'; articleCover.style.height = '158px'; }
      const mainA = document.querySelector('.mainArticle');
      if (mainA) { mainA.style.gap = '0px'; mainA.style.justifyContent = 'space-around'; mainA.style.height = '80%'; }
      document.querySelectorAll('.daily-article h2').forEach(el => el.style.fontSize = '26px');
      document.querySelectorAll('.daily-article p').forEach(el => el.style.fontSize = '18px');
      document.querySelectorAll('.daily-article .readArticle').forEach(el => { el.style.width = '23px'; el.style.height = '23px'; el.style.padding = '14px'; });
      document.querySelectorAll('.daily-article .readArticle p').forEach(el => el.style.fontSize = '19.5px');
      document.querySelectorAll('.daily-article svg').forEach(el => el.style.height = '44px');
      break;

    case '1600':
      dashboard.style.width = '88%';
      userInfo.style.fontSize = '38px';
      userInfo.style.width = '120%';
      userInfo.style.marginTop = '35px';
      userInfo.style.marginBottom = '48px';
      topStats.style.marginBottom = '25px';
      topStats.style.paddingBottom = '55px';
      topStatsTitle.forEach(h3 => { h3.style.fontSize = '1.85rem'; });
      day.forEach(d => d.style.fontSize = '1.5rem');
      dayImg.forEach(img => img.style.width = '2rem');
      statInfoP.forEach(p => { p.style.fontSize = '1.1rem'; p.style.width = '120px'; p.style.marginTop = '3px'; });
      statIcon.forEach(icon => { icon.style.fontSize = '2.2rem'; });
      if (streakDays) streakDays.style.marginBottom = '10px';
      document.querySelectorAll('.dashboard-middle-stats').forEach(el => el.style.gap = '23px');
      if (readingProgressCard) { readingProgressCard.style.height = '15rem'; readingProgressCard.style.width = '33rem'; readingProgressCard.style.gap = '24px'; }
      if (growthCard) {
        growthCard.style.paddingTop = '1.6rem';
        growthCard.style.width = '330px';
        growthCard.style.height = '300px';
        const h4 = growthCard.querySelector('h4');
        const h3 = growthCard.querySelector('h3');
        const sub = growthCard.querySelector('.growth-sub');
        const level = growthCard.querySelector('.growth-level');
         const img = currentBookCard.querySelector('.current-book img');
         const author = currentBookCard.querySelector('.book-author');
        const pagesProgress = currentBookCard.querySelector('.pages-progress');
        const readBook = currentBookCard.querySelector('.readBook');
        if (h4) { h4.style.fontSize = '36px'; h4.style.fontWeight = '600'; }
        if (author) { author.style.fontSize = '25px'; author.style.marginTop = '12px'; }
        if (img) { img.style.width = '14rem'; img.style.height = '15.5rem'; img.style.borderRadius = '14px'; }
        if (pagesProgress) pagesProgress.style.fontSize = '23.5px';
        if (readBook) { readBook.style.height = '63px'; readBook.style.fontSize = '22px'; }
        if (h4) { h4.style.fontSize = '36.4px'; h4.style.fontWeight = '600'; }
        if (h3) h3.style.fontSize = '37px';
        if (sub) { sub.style.marginTop = '15px'; sub.style.fontSize = '19.4px'; }
        if (level) level.style.transform = 'translateY(73px)';
      }
      if (xpCount) xpCount.style.fontSize = '19px';
      document.querySelectorAll('h5').forEach(h5 => { h5.style.fontSize = '16px'; });
      if (progressRing) { progressRing.style.width = '11.25rem'; progressRing.style.height = '11.25rem'; }
      if (ringBg) { ringBg.style.cx = '93'; ringBg.style.cy = '85'; ringBg.style.r = '73'; }

      break;

    case '1440':
      dashboard.style.width = '85%';
      userInfo.style.fontSize = '34px';
      userInfo.style.width = '110%';
      userInfo.style.marginTop = '30px';
      userInfo.style.marginBottom = '45px';
      topStats.style.marginBottom = '20px';
      topStatsTitle.forEach(h3 => { h3.style.fontSize = '1.6rem'; });
      day.forEach(d => d.style.fontSize = '1.3rem');
      dayImg.forEach(img => img.style.width = '1.8rem');
      statInfoP.forEach(p => { p.style.fontSize = '1rem'; p.style.width = '100px'; });
      statIcon.forEach(icon => { icon.style.fontSize = '2rem'; });
      if (streakDays) streakDays.style.marginBottom = '8px';
      break;

    case '1336':
  dashboard.style.width = '87%';

  if (userInfo) {
    userInfo.style.paddingTop = '15px';
    userInfo.style.fontSize = '31px';
    userInfo.style.fontWeight = '500';
  }

  if (topStats) {
    topStats.style.marginBottom = '30px';
    topStats.style.width = '90%';
  }

  topStatsTitle.forEach(h3 => {
    h3.style.fontSize = '1.6rem';
    h3.style.marginBottom = '14px';
  });

  day.forEach(d => d.style.fontSize = '1.3rem');
  dayImg.forEach(img => img.style.width = '1.8rem');

  statIcon.forEach(icon => icon.style.fontSize = '2.2rem');
  if (statInfo) {
    const h3 = statInfo.querySelectorAll('h3');
    h3.forEach(h3=>{
      h3.style.fontSize = '1.67rem';
    })
  }
  statInfoP.forEach(p => {
    p.style.fontSize = '0.9rem';
    p.style.marginTop = '0.2rem';
    p.style.width = '100px';
  });

  if (readingProgressCard) {
    readingProgressCard.style.height = '14rem';
    readingProgressCard.style.width = '29rem';
    readingProgressCard.style.gap = '13px';
  }

  if (growthCard) {
    growthCard.style.height = '270px';
    growthCard.style.width = '300px';
    const h4 = growthCard.querySelector('h4');
    const h3 = growthCard.querySelector('h3');
    const sub = growthCard.querySelector('.growth-sub');
    const level = growthCard.querySelector('.growth-level');
    if (h4) { h4.style.fontSize = '33px'; h4.style.fontWeight = '600'; }
    if (sub) { sub.style.marginTop = '15px'; sub.style.fontSize = '18px'; }
    if (level) level.style.transform = 'translateY(73px)';
    if (h3) h3.style.fontSize = '35px';
  }

  if (xpCount) xpCount.style.fontSize = '17px';

  document.querySelectorAll('h5').forEach(h5 => {
    h5.style.fontSize = '16px';
    h5.style.fontWeight = '700';
    h5.style.paddingTop = '8px';
    h5.style.marginBottom = '26px';
  });

  if (progressRing) {
    progressRing.style.width = '11.25rem';
    progressRing.style.height = '11.25rem';
  }
  if (ringBg) {
    ringBg.style.cx = '93';
    ringBg.style.cy = '85';
    ringBg.style.r = '73';
  }

  document.querySelectorAll('.card-title').forEach(el => el.style.fontSize = '30px');
  document.querySelectorAll('.goal-info').forEach(el => el.style.fontSize = '33px');
  document.querySelectorAll('.circle-text').forEach(el => el.style.fontSize = '35px');
  document.querySelectorAll('.inside-card span').forEach(el => {
    el.style.top = '33%';
    el.style.left = '42%';
  });
  document.querySelectorAll('.inside-card p').forEach(el => el.style.fontSize = '17px');

  document.querySelector('.dashboard-bottom-stats').style.marginTop = '80px';

  if (currentBookCard) {
    currentBookCard.style.width = '25rem';
    currentBookCard.style.height = '14rem';
    currentBookCard.style.gap = '25px';
    const h4 = currentBookCard.querySelector('h4');
    const author = currentBookCard.querySelector('.book-author');
    const img = currentBookCard.querySelector('.current-book img');
    const pagesProgress = currentBookCard.querySelector('.pages-progress');
    const readBook = currentBookCard.querySelector('.readBook');
    if (h4) { h4.style.fontSize = '27.3px'; h4.style.fontWeight = '600'; }
    if (author) { author.style.fontSize = '17px'; author.style.marginTop = '8px'; }
    if (img) { img.style.width = '11rem'; img.style.height = '11rem'; }
    if (pagesProgress) pagesProgress.style.fontSize = '16.5px';
    if (readBook) { readBook.style.height = '50px'; readBook.style.fontSize = '15.5px'; }
  }

  if (dailyArticleCard) {
    dailyArticleCard.style.width = '320px';
    dailyArticleCard.style.height = '192px';
    dailyArticleCard.style.transform = 'translateY(25px) translateX(20px)';
  }
 const mainArticle = document.querySelector('.mainArticle')
  
  if (mainArticle) {
    mainArticle.style.gap = '0px';
    mainArticle.style.justifyContent = 'space-around';
    mainArticle.style.height = '80%';
  }

  document.querySelectorAll('.daily-article h2').forEach(el => el.style.fontSize = '20px');
  document.querySelectorAll('.daily-article .readArticle').forEach(el => el.style.width = '20px');
  document.querySelectorAll('.daily-article .readArticle p').forEach(el => el.style.fontSize = '17.5px');
  break;

    case '1250':
      dashboard.style.width = '90%';

      if (userInfo) {
        userInfo.style.fontSize = '30px';
        userInfo.style.marginTop = '20px';
        userInfo.style.marginBottom = '32px';
      }

      topStatsTitle.forEach(h3 => {
        h3.style.fontSize = '1.44rem';
      });

      day.forEach(d => d.style.fontSize = '1.2rem');
      dayImg.forEach(img => img.style.width = '1.7rem');

      statIcon.forEach(icon => {
        icon.style.fontSize = '2rem';
      });

      statInfoP.forEach(p => {
        p.style.fontSize = '0.8rem';
        p.style.width = '85px';
      });

      if (readingProgressCard) {
        readingProgressCard.style.height = '12rem';
        readingProgressCard.style.width = '25rem';
        readingProgressCard.style.gap = '5px';
      }

      if (growthCard) {
        growthCard.style.width = '250px';
        growthCard.style.height = '250px';
        const h4 = growthCard.querySelector('h4');
        const h3 = growthCard.querySelector('h3');
        const sub = growthCard.querySelector('.growth-sub');
        const level = growthCard.querySelector('.growth-level');
        if (h4) { h4.style.fontSize = '29px'; h4.style.fontWeight = '500'; }
        if (h3) h3.style.fontSize = '32px';
        if (sub) { sub.style.marginTop = '8px'; sub.style.fontSize = '15px'; }
        if (level) level.style.transform = 'translateY(77px)';
      }

      if (xpCount) xpCount.style.fontSize = '14px';

      if (progressRing) {
        progressRing.style.width = '150px';
        progressRing.style.height = '160px';
      }
      if (ringBg) {
        ringBg.style.cx = '75';
        ringBg.style.cy = '80';
        ringBg.style.r = '58';
        ringBg.style.strokeWidth = '17px';
      }

      document.querySelector('.card-title').style.fontSize = '26.5px';
      document.querySelector('.goal-info').style.fontSize = '28.5px';
      document.querySelector('.circle-text').style.fontSize = '1.8rem';
      document.querySelectorAll('.inside-card span').forEach(el => {
        el.style.top = '28.5%';
        el.style.left = '37%';
        el.style.fontSize = '52px';
      });
      document.querySelectorAll('.inside-card p').forEach(el => el.style.fontSize = '14px');
      bottomStats.style.marginTop = '2.8rem'
      if (currentBookCard) {
        currentBookCard.style.height = '13rem';
        currentBookCard.style.width = '23rem';
        currentBookCard.style.gap = '18px';

        const h4 = currentBookCard.querySelector('h4');
        const author = currentBookCard.querySelector('.book-author');
        const img = currentBookCard.querySelector('.current-book img');
        const pagesProgress = currentBookCard.querySelector('.pages-progress');
        const readBook = currentBookCard.querySelector('.readBook');

        if (h4) { h4.style.fontSize = '26.6px'; h4.style.fontWeight = '600'; }
        if (author) { author.style.fontSize = '16px'; author.style.marginTop = '11px'; }
        if (img) { img.style.width = '110px'; img.style.height = '168px'; img.style.borderRadius = '5px'; }
        if (pagesProgress) pagesProgress.style.fontSize = '16px';
        if (readBook) { readBook.style.height = '44px'; readBook.style.fontSize = '15px'; }
      }

      if (dailyArticleCard) {
        dailyArticleCard.style.width = '273px';
        dailyArticleCard.style.height = '170px';
        dailyArticleCard.style.padding = '10px 15px';
        dailyArticleCard.style.transform = 'translateY(44px)';
      }

      document.querySelectorAll('.daily-article h2').forEach(el => el.style.fontSize = '15px');
      document.querySelectorAll('.daily-article p').forEach(el => el.style.fontSize = '13px');
      document.querySelectorAll('.daily-article .readArticle p').forEach(el => el.style.fontSize = '14px');
      break;
    case 'reset':

  document.querySelectorAll('[data-smaller-nav-style="true"]').forEach(el => {
    el.removeAttribute('style');
    el.removeAttribute('data-smaller-nav-style');
  });

  const allResetEls = document.querySelectorAll(`
    #dashboard, .user-info, .dashboard-top-stats, .stat-icon, .stat-info, 
    .stat-info h3, .stat-info p, .reading-progress-card, .growth-card, 
    .growth-card h4, .growth-card h3, .growth-sub, .growth-level, .xp-count, 
    .progress-ring, .progress-ring__background, .card-title, .goal-info, 
    .circle-text, .inside-card span, .inside-card p, .dashboard-bottom-stats, 
    .current-book-card, .current-book-card h4, .book-author, 
    .current-book img, .pages-progress, .readBook, .daily-article-card, 
    .mainArticle, .daily-article h2, .daily-article p, 
    .daily-article .readArticle, .daily-article .readArticle p, .daily-article svg
  `);

  allResetEls.forEach(el => el.removeAttribute('style'));

  break;
  }
  const allSections = [
        dashboard,
        discover,
        library,
        focusMode,
        settings,
        document.getElementById('saved'),
        document.getElementById('achievements'),
        document.getElementById('wishlist')
  ];
  document.querySelectorAll('.nav a, .mini-nav svg').forEach(el => {
      if(el.id!=='active') {
        el.removeAttribute('id');
        console.log(el)
        allSections.forEach(sec => {
          if(sec.id===el.className) {
            sec.style.opacity = '0';
          setTimeout(() => {
            sec.style.display = 'none';
          }, 200);
          }
      });
      } else {
        document.querySelector(`#${el.className}`).style.display = 'block';
        setTimeout(() => {
          document.querySelector(`#${el.className}`).style.opacity = '1';
        }, 250);
        
      }
    
  });
  
}

function smallerNavBar(message){
  if(width<768) return;
  navBarContent.style.opacity = '0';
  
  setTimeout(() => {
      const miniCat = miniNav.querySelectorAll('svg');
      if(width>=1250 && width<=1336) {
        smallerNavSection.style.padding = '15px 18px';
        smallerNavSection.style.width='30px';
        smallerNavSection.style.width='37px';
        navBar.style.width = '7%';  
        navs.style.gap = '17px';
        miniNav.style.gap = '20px';
        navBar.style.paddingTop = '20px';
        nav.forEach(nav=>{
          const navCategory = nav.querySelectorAll('a');
          navCategory.forEach(nc=>{
            nc.style.width = '25px';
            nc.style.padding = '22px';
          })
        })
        miniCat.forEach(mc=>{
          mc.style.width='24px';
          mc.style.padding = '26px 24.5px';
        });
        achievementsBtn.style.width = '27px';
        achievementsBtn.style.padding = '25px';
        
      } else if(width>=1336 && width<1600) {
        smallerNavSection.style.padding = '25px 28px';
        navBar.style.width = '9%';
        miniNav.style.gap = '24px';
        navBar.style.paddingTop = '20px';
        navs.style.gap = '18px';
        nav.forEach(nav=>{
          const navCategory = nav.querySelectorAll('a');
          navCategory.forEach(nc=>{
            nc.style.width = '33px';
            nc.style.padding = '30px';
          })
        })
        miniCat.forEach(mc=>{
          mc.style.padding = '30px ';
          mc.style.width = '30px'
        });
      } else if(width>=1600 && width<1900) {
        smallerNavSection.style.padding = '22px 25px';
        smallerNavSection.style.width = '45px';
        smallerNavSection.style.height='40px';
        navBar.style.width = '8.5%';
        miniNav.style.gap = '24px';
        navs.style.gap = '16px';
        nav.forEach(nav=>{
          const navCategory = nav.querySelectorAll('a');
          navCategory.forEach(nc=>{
            nc.style.width = '32px';
            nc.style.padding = '30px';
          })
        })
        miniCat.forEach(mc=>{
          mc.style.padding = '33px 31px';
          mc.style.width = '31px'
        });
        
      } else if(width>=1900){
        navBar.style.width = '9.5%';
        navBar.style.paddingTop='0px';
        navs.style.gap = '26px';
        nav.forEach(nav=>{
          const navCategory = nav.querySelectorAll('a');
          navCategory.forEach(nc=>{
            nc.style.width = '42px';
            nc.style.padding = '40px';
            nc.style.borderRadius = '35px';
          })
        })
        miniCat.forEach(mc=>{
          mc.style.width = '42px';
          mc.style.padding = '40px';
        });
      }
      
      preNav.style.transform = 'translateY(15px)';
      preNav.style.justifyContent = 'center';
      preNav.style.marginBottom='0px';
      welcomeLogo.style.opacity = '0';
      editBtn.style.opacity = '0';
      smallerNavSection.style.boxShadow = '0px 1px 19px rgba(0, 0, 0, 0.18)';
      navBar.style.paddingRight = '24px';
      navBar.style.paddingTop='0';
      navBar.style.paddingLeft = '16px';
      showStarsDiv.style.bottom = '110px';
      showStarsDiv.style.left = '31px';
      showStars.style.width = '22px';
      navBar.style.gap = '12px';
      links.style.opacity = '0';
      navs.style.alignItems = 'center';
      miniNav.style.alignItems = 'center';
      nav.forEach(nav=>{
        nav.style.flexDirection='column';
        const navCategory = nav.querySelectorAll('a');
        navCategory.forEach(nc=>{
        nc.textContent = '';
            
            nc.style.boxShadow = ' 0px 1px 19px rgba(0, 0, 0, 0.18)';
            if(nc.className==='dashboard') nc.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path class="icon-stroke" d="M22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274" 
                stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path> <path class="icon-stroke" d="M15 18H9" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path> </g></svg>`
            if(nc.className==='library') nc.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> 
                <path class="icon-stroke" d="M19.8978 16H7.89778C6.96781 16 6.50282 16 6.12132 16.1022C5.08604 16.3796 4.2774 17.1883 4 18.2235" stroke="#1C274D" stroke-width="1.5"></path> 
                <path class="icon-stroke" d="M7 16V2.5" stroke="#1C274D" stroke-width="1.5" stroke-linecap="round"></path> <path class="icon-stroke" d="M10 22C7.17157 22 5.75736 22 4.87868 21.1213C4 20.2426 4 18.8284 4 16V8C4 5.17157 4 3.75736 4.87868 2.87868C5.75736 2 7.17157 2 10 2H14C16.8284 2 18.2426 2 19.1213 2.87868C20 3.75736 20 5.17157 20 8M14 22C16.8284 22 18.2426 22 19.1213 21.1213C20 20.2426 20 18.8284 20 16V12" 
                stroke="#1C274D" stroke-width="1.5" stroke-linecap="round"></path> </g></svg>`         
            if(nc.className==='discover') nc.innerHTML = ` <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M16.982 8.99791C17.5399 7.7427 16.2573 6.46011 15.0021 7.01799L10.0018 9.24033C9.66249 9.39115 9.39115 9.66249 9.24033 10.0018L7.01798 15.0021C6.46011 16.2573 7.74269 17.5399 8.99791 16.982L13.9982 14.7597C14.3375 14.6089 14.6089 14.3375 14.7597 13.9982L16.982 8.99791ZM10.9898 10.9898L14.6264 9.37359L13.0102 13.0102L9.37359 14.6264L10.9898 10.9898Z" fill="white"></path> <path class="fill" fill-rule="evenodd" clip-rule="evenodd" d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM12 20.9869C7.03665 20.9869 3.01306 16.9633 3.01306 12C3.01306 7.03665 7.03665 3.01306 12 3.01306C16.9633 3.01306 20.9869 7.03665 20.9869 12C20.9869 16.9633 16.9633 20.9869 12 20.9869Z" fill="#0F0F0F" class="fill"></path> </g></svg></a>`
            if(nc.className==='focusMode') nc.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> 
                <path class="icon-stroke" d="M14.5 4.5C14.5 5.88071 13.3807 7 12 7C10.6193 7 9.5 5.88071 9.5 4.5C9.5 3.11929 10.6193 2 12 2C13.3807 2 14.5 3.11929 14.5 4.5Z" stroke="#1C274C" stroke-width="1.5"></path> <path d="M21 17L19.8423 16.61C19.6151 16.5335 19.399 16.4267 19.1998 16.2925L19.0985 16.2243C18.4122 15.762 18 14.9837 18 14.1502C18 11.713 16.2563 9.63312 13.8772 9.23246L12.9864 9.08245C12.5 8.99986 11.5 9 11.0136 9.08245L10.1228 9.23246C7.74373 9.63312 6 11.713 6 14.1502C6 14.9837 5.58776 15.762 4.90145 16.2243L4.80022 16.2925C4.60096 16.4267 4.38488 16.5335 4.1577 16.61L3 17" 
                class="icon-stroke" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M9.5 16L8.57549 17.2327C8.42794 17.4294 8.35416 17.5278 8.27135 17.6144C8.06638 17.8287 7.81632 17.9947 7.53929 18.1004C7.42736 18.1432 7.30805 18.173 7.06948 18.2326L5.27607 18.681C4.52611 18.8685 4 19.5423 4 20.3153C4 21.2458 4.75425 22 5.68466 22H6.36842C8.07661 22 9.73871 21.446 11.1053 20.4211L13 19M14.5 16L15.2267 16.9689C15.5701 17.4269 15.7419 17.6558 15.9648 17.825C16.0318 17.8759 16.102 17.9225 16.1749 17.9645C16.4174 18.1043 16.695 18.1738 17.2503 18.3126L18.7239 18.681C19.4739 18.8685 20 19.5423 20 20.3153C20 21.2458 19.2458 22 18.3153 22H17.3776C16.8153 22 16.5342 22 16.2554 21.9844C15.4319 21.9384 14.6172 21.7907 13.83 21.5446C13.5635 21.4613 13.3003 21.3626 12.7738 21.1652L11 20.5" class="icon-stroke" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg></a>
            `;
            nc.querySelector('svg').style.position = 'relative';
            nc.querySelector('svg').style.top = 'unset';
            nc.querySelector('svg').style.right = 'unset';
            nc.querySelector('svg').style.height='100%';
        })
      })
      miniNav.style.flexDirection = 'column';
      miniCat.forEach(mc=>{
        mc.style.boxShadow = '0px 1px 19px rgba(0, 0, 0, 0.18)';  
      });
      showStars.style.boxShadow = 'none';
      
      setTimeout(()=>{
          welcomeLogo.style.display = 'none';
          editBtn.style.display = 'none';
          links.style.display = 'none';
      },100);
      articlesTopics.querySelectorAll('p').forEach(p=>{p.style.fontSize = '18px';})
      articlesTopSection.querySelector('h3').style.fontSize = '28px';
    
      const dashboardStyles = {
        '.section': { marginTop: '0' },
        '.dashboard-top-stats': { marginBottom: '30px' },
        '.streak-days.day': { fontSize: '1.3rem' },
        '.day img': { width: '1.8rem' },
        '.stat-icon': { fontSize: '2.2rem' },
        '.stat-info h3': { fontSize: '2rem' },
        '.reading-progress-card': { height: '12.5rem', width: '28rem', gap: '13px' },
        '.growth-card h4': { fontSize: '33px', fontWeight: '600' },
        '.growth-sub': { marginTop: '15px', fontSize: '18px' },
        '.growth-level': { transform: 'translateY(73px)' },
        '.growth-card h3': { fontSize: '35px' },
        '.xp-count': { fontSize: '17px' },
        'h5': { fontSize: '16px', fontWeight: '700', paddingTop: '8px', marginBottom: '26px' },
        '.progress-ring': { width: '11.25rem', height: '11.25rem' },
        '.progress-ring__background': { cx: '93', cy: '85', r: '73' },
        '.card-title': { fontSize: '30px' },
        '.goal-info': { fontSize: '33px' },
        '.circle-text': { fontSize: '30px' },
        '.inside-card span': { top: '33%', left: '42%' },
        '.inside-card p': { fontSize: '17px' },
        '.dashboard-bottom-stats': { marginTop: '60px' },
        '.current-book-card': { width: '25rem', height: '14rem', gap: '25px' },
        '.current-book-card h4': { fontSize: '28px', fontWeight: '600' },
        '.book-author': { fontSize: '17px', marginTop: '8px' },
        '.current-book img': { width: '10rem', height: '10.5rem' },
        '.pages-progress': { fontSize: '17.5px' },
        '.current-book .readBook': { height: '50px', fontSize: '16.5px' },
        '.daily-article-card': { width: '320px', height: '192px', transform: 'translateY(45px) translateX(20px)' },
        '.mainArticle': { gap: '0px', justifyContent: 'space-around', height: '80%' },
        '.daily-article h2': { fontSize: '20px' },
        '.daily-article .readArticle': { width: '22px' },
        '.daily-article .readArticle p': { fontSize: '17.5px' },
        '.user-info': { paddingTop: '15px', fontSize: '35px', fontWeight: '500' },
        '#dashboard': { width: '93%' }, 
        '.growth-card': { height: '270px', width: '300px' },
        '.stat-info p': { fontSize: '0.9rem', marginTop: '0.2rem', width: '100px' },
        '.dashboard-top-stats h3': { fontSize: '1.6rem', marginBottom: '14px' }
      };
    
      for (const selector in dashboardStyles) {
        document.querySelectorAll(selector).forEach(el => {
          Object.assign(el.style, dashboardStyles[selector]);
          el.dataset.smallerNavStyle = "true";
          navs.dataset.smallerNavStyle = 'true';
        });
        
      }
      applyDashboardTier(window.innerWidth, 'small');

      setTimeout(() => {
        navBarContent.style.opacity = '1';
      }, 250);
      if(document.querySelector(`.dashboard`).id==='active') {dashboard.style.display='block'; console.log(dashboard)}
  }, 330);

}

function normalNavBar() {
  if(width<768) return

  navBarContent.style.opacity = '0';
  
  setTimeout(() => {
    const smallerNav = document.querySelector('.smallerNav');
    [
      navBar,navs, smallerNavSection,smallerNav, miniNav,
      preNav, links, editBtn, showStars
    ].forEach(el => {
      if (el) el.removeAttribute('style');
    });

    if (nav && nav.length) {
      nav.forEach(navEl => {
        navEl.removeAttribute('style');
        const navCategory = navEl.querySelectorAll('a');
            navCategory.forEach(nc => {
      nc.removeAttribute('style'); 

      switch (nc.className) {
        case 'dashboard':
          nc.innerHTML = `Dashboard <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z" stroke="#ffffff" stroke-width="1.5"></path>
              <path d="M9 16C9.85038 16.6303 10.8846 17 12 17C13.1154 17 14.1496 16.6303 15 16" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path>
            </g>
          </svg>`;
          break;

        case 'library':
          nc.innerHTML = `Library <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path class="icon-stroke" d="M19.8978 16H7.89778C6.96781 16 6.50282 16 6.12132 16.1022C5.08604 16.3796 4.2774 17.1883 4 18.2235" stroke="#1C274D" stroke-width="1.5"></path>
              <path class="icon-stroke" d="M7 16V2.5" stroke="#1C274D" stroke-width="1.5" stroke-linecap="round"></path>
              <path class="icon-stroke" d="M10 22C7.17157 22 5.75736 22 4.87868 21.1213C4 20.2426 4 18.8284 4 16V8C4 5.17157 4 3.75736 4.87868 2.87868C5.75736 2 7.17157 2 10 2H14C16.8284 2 18.2426 2 19.1213 2.87868C20 3.75736 20 5.17157 20 8M14 22C16.8284 22 18.2426 22 19.1213 21.1213C20 20.2426 20 18.8284 20 16V12" stroke="#1C274D" stroke-width="1.5" stroke-linecap="round"></path>
            </g>
          </svg>`;
          break;

        case 'discover':
          nc.innerHTML = `Discover <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path class="fill" fill-rule="evenodd" clip-rule="evenodd" d="M16.982 8.99791C17.5399 7.7427 16.2573 6.46011 15.0021 7.01799L10.0018 9.24033C9.66249 9.39115 9.39115 9.66249 9.24033 10.0018L7.01798 15.0021C6.46011 16.2573 7.74269 17.5399 8.99791 16.982L13.9982 14.7597C14.3375 14.6089 14.6089 14.3375 14.7597 13.9982L16.982 8.99791ZM10.9898 10.9898L14.6264 9.37359L13.0102 13.0102L9.37359 14.6264L10.9898 10.9898Z" fill="white"></path>
              <path class="fill" fill-rule="evenodd" clip-rule="evenodd" d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM12 20.9869C7.03665 20.9869 3.01306 16.9633 3.01306 12C3.01306 7.03665 7.03665 3.01306 12 3.01306C16.9633 3.01306 20.9869 7.03665 20.9869 12C20.9869 16.9633 16.9633 20.9869 12 20.9869Z" fill="#0F0F0F"></path>
            </g>
          </svg>`;
          break;

        case 'focusMode':
          nc.innerHTML = `Focus Mode <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> 
          <path class="icon-stroke" d="M14.5 4.5C14.5 5.88071 13.3807 7 12 7C10.6193 7 9.5 5.88071 9.5 4.5C9.5 3.11929 10.6193 2 12 2C13.3807 2 14.5 3.11929 14.5 4.5Z" stroke="#1C274C" stroke-width="1.5"></path> <path d="M21 17L19.8423 16.61C19.6151 16.5335 19.399 16.4267 19.1998 16.2925L19.0985 16.2243C18.4122 15.762 18 14.9837 18 14.1502C18 11.713 16.2563 9.63312 13.8772 9.23246L12.9864 9.08245C12.5 8.99986 11.5 9 11.0136 9.08245L10.1228 9.23246C7.74373 9.63312 6 11.713 6 14.1502C6 14.9837 5.58776 15.762 4.90145 16.2243L4.80022 16.2925C4.60096 16.4267 4.38488 16.5335 4.1577 16.61L3 17" 
          class="icon-stroke" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M9.5 16L8.57549 17.2327C8.42794 17.4294 8.35416 17.5278 8.27135 17.6144C8.06638 17.8287 7.81632 17.9947 7.53929 18.1004C7.42736 18.1432 7.30805 18.173 7.06948 18.2326L5.27607 18.681C4.52611 18.8685 4 19.5423 4 20.3153C4 21.2458 4.75425 22 5.68466 22H6.36842C8.07661 22 9.73871 21.446 11.1053 20.4211L13 19M14.5 16L15.2267 16.9689C15.5701 17.4269 15.7419 17.6558 15.9648 17.825C16.0318 17.8759 16.102 17.9225 16.1749 17.9645C16.4174 18.1043 16.695 18.1738 17.2503 18.3126L18.7239 18.681C19.4739 18.8685 20 19.5423 20 20.3153C20 21.2458 19.2458 22 18.3153 22H17.3776C16.8153 22 16.5342 22 16.2554 21.9844C15.4319 21.9384 14.6172 21.7907 13.83 21.5446C13.5635 21.4613 13.3003 21.3626 12.7738 21.1652L11 20.5" class="icon-stroke" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`;
          break;

        default:
          nc.textContent = nc.className; 
      }
    });
      });
      
    }
    const miniCat = miniNav ? miniNav.querySelectorAll('svg') : [];
    miniCat.forEach(mc=>{
      mc.removeAttribute('style');
    })
    showStarsDiv.removeAttribute('style');
    showStars.removeAttribute('style')
    welcomeLogo.style.display='block';
    welcomeLogo.style.opacity='1';

    if (preNav) preNav.style.transform = 'none';

    const width = window.innerWidth;
    applyDashboardTier(width, 'normal')
    
  if (body) body.style.filter = 'brightness(1)';

  if (navBar) {
    navBar.style.backgroundColor = '#0000002b';
    navBar.style.backdropFilter = 'blur(32px)';
  }

  if (preNav) {
    preNav.querySelectorAll('svg').forEach(svg => svg.style.opacity = '1');
    preNav.style.transform = 'translateY(5px)';
  }

  if (navs) {
    navs.style.opacity = '1';
    navs.style.marginTop = '5px';
  }

  if (miniNav) miniNav.style.opacity = '1';
  if (smallerNav) smallerNav.style.opacity = '1';

  if (links) {
    links.style.opacity = '1';
    links.style.transform = 'translateX(15px) translateY(21px)';
  }

  if (editBtn) editBtn.style.opacity = '1';
  if (showStarsDiv) showStarsDiv.style.opacity = '1';

  if (welcomeLogo) {
    welcomeLogo.style.top = '1.5%';
    welcomeLogo.style.left = '2.5%';
    welcomeLogo.style.fontSize = '29px';
    if (width >= 1440 && width < 1600) {
      welcomeLogo.style.fontSize = '34px';
    } else if (width >= 1600 && width < 1900) {
      welcomeLogo.style.fontSize = '37.8px';
    } else if (width >= 1900) {
      welcomeLogo.style.fontSize = '45px';
    }
  }
  
    setTimeout(() => {
      navBarContent.style.opacity = '1';
    }, 150);

  }, 300);
}

export let initialized = false;
export let aboutBookOpen = false;

smallerNavSection.addEventListener('click', () => {
  if(aboutBookOpen) return;
  if(width>=768) {
    if(!initialized){
      initialized=true;
      smallerNavBar();
    } else {
      normalNavBar('notFocusMode');
      initialized=false;
    }
  } else {
    navBar.style.opacity ='0';
    
    setTimeout(() => {
      navBar.style.display = 'none';
      content.style.opacity = '1';
    }, 250);
  }

  
})


//GETTING BOOKS

const OPENLIBRARY_BASE = "https://openlibrary.org";
const COVER_BASE = "https://covers.openlibrary.org/b/id/";

const searchInputDiscover = document.querySelector(".discoverSearch");
const searchInputLibrary = document.querySelector(".librarySearch");

function dedupeBooks(books) {
  const seen = new Set();
  return books.filter(b => {
    const key = `${b.title.toLowerCase()}-${b.author.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

//3. SEARCH

async function searchBooks(query, limit = 30) {
  if (!query) return [];
  const url = `${OPENLIBRARY_BASE}/search.json?q=${encodeURIComponent(query)}&language=eng&limit=${limit}`;
   
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  const books = (json.docs || []).map(work => ({
    title: work.title,
    author: work.author_name?.[0] || "Unknown",
    cover: work.cover_i ? `${COVER_BASE}${work.cover_i}-M.jpg` : "",
    link: `${OPENLIBRARY_BASE}/works/${work.key?.replace("/works/", "") || ""}`
  }));
 
  return dedupeBooks(books);
}

function searchArticles(query) {
  if (!query) return [];
  const allArticles = getCachedAllArticles() || [];
  const q = query.toLowerCase();
  return allArticles.filter(a =>
    (a.title || "").toLowerCase().includes(q) ||
    (a.categories || []).some(cat => cat.toLowerCase().includes(q))
  );
}

async function handleGlobalSearch() {
  const query = searchInputDiscover.value.trim();
  container.style.display = 'block';
  container.style.opacity = '1';
  booksTopSection.style.opacity = '0';
  booksPreviewSection.style.opacity = '0';
  articlesMainSection.style.opacity = '0';
  articlesTopSection.style.opacity = '0';
  allBooksSection.style.opacity = '0';
  setTimeout(() => {
    booksTopSection.style.display = 'none';
    booksPreviewSection.style.display = 'none';
    articlesMainSection.style.display = 'none';
    articlesTopSection.style.display = 'none';
    allBooksSection.style.display = 'none';
    container.style.opacity = '1';
  }, 300);
  if (!container) return;
  if (!query) {
    resultsSummary.innerHTML = "Enter a search term to find books or articles.";
    return;
  }
  resultsSummary.innerHTML = "Searching…";
  const [books, articles] = await Promise.all([searchBooks(query), searchArticles(query)]);
  
  if (!books.length && !articles.length) {
    resultsSummary.innerHTML = "No results";
    return;
  }

  if (books.length) {
    resultsSummary.innerHTML = `Results for ${query}`;
    renderBooks(books, resultsList);
  }

  if (articles.length) {
    resultsSummary.innerHTML = `Results for ${query}`;
    articles.forEach(article => {
      container.innerHTML += createArticleHTML(article);
    });
  }
}
const searchResult = document.querySelector('.searchResult');
const searchSum = searchResult.querySelector('p');

async function handleBookSearch() {
  const query = searchInputLibrary.value.trim();
  if (!query) {
    searchResult.style.display = 'flex';
    searchSum.innerHTML = "Enter a search term to find books";
    return;
  }
  searchSum.innerHTML = "Searching…";
  const [books, articles] = await Promise.all([searchBooks(query), searchArticles(query)]);
  console.log(books)
  if (!books.length) {
    searchResult.style.display = 'flex';
    searchSum.innerHTML = "No results";
    return;
  }
  
  if (books.length) {
    searchResult.innerHTML = '';
    addBookSection.style.height = '100%';
    searchResult.style.display ='grid';
    searchResult.style.alignSelf = 'auto';
    renderOfflineBooks(books, searchResult, addOfflineSection);
    
  }
  
}
returnBtn.addEventListener('click', ()=>{
  
  container.style.opacity = '0';
  booksTopSection.style.opacity = '1';
  booksPreviewSection.style.opacity = '1';
  articlesMainSection.style.opacity = '1';
  articlesTopSection.style.opacity = '1';
  booksTopSection.style.display = 'block';
  booksPreviewSection.style.display = 'flex';
  articlesMainSection.style.display = 'flex';
  articlesTopSection.style.display = 'block';
  setTimeout(() => {
    container.style.display = 'none';
    booksTopSection.style.opacity = '1';
  booksPreviewSection.style.opacity = '1';
  articlesMainSection.style.opacity = '1';
  articlesTopSection.style.opacity = '1';
  }, 300);
})

searchInputDiscover.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleGlobalSearch();

    if(aboutBookSection.style.opacity = '1'){
      aboutBookSection.style.opacity = "0";
      mainDisplay.style.boxShadow = '2px 2px 30px rgba(0, 0, 0, 0.252)';
      setTimeout(() => (aboutBookSection.style.display = "none"), 300);
    }
    
  }
});

searchInputLibrary.addEventListener("keydown", (e)=>{
  if (e.key === "Enter") {
    handleBookSearch();

    if(aboutBookSection.style.opacity = '1'){
      aboutBookSection.style.opacity = "0";
      mainDisplay.style.boxShadow = '2px 2px 30px rgba(0, 0, 0, 0.252)';
      setTimeout(() => (aboutBookSection.style.display = "none"), 300);
    }
    
  }
})

const click = document.querySelector('.click')
click.addEventListener('click', ()=>{
  if(click.classList.contains('discover')) {handleGlobalSearch();} else{
    handleBookSearch();
  }

});

function renderUserCollections() {
  const userRef = doc(db, "users", auth.currentUser.uid);

  onSnapshot(userRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();

    renderSavedArticles(data.savedArticles || [], data);
    renderWishlist(data.wishlist || [], data);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if(width<768) {
    body.style.filter = ' brightness(1) ';

    dashboard.style.display = 'block';
    dashboard.style.opacity='1';
    welcomeLogo.style.top = '1.5%';
        welcomeLogo.style.left = '2.5%';
        welcomeLogo.style.fontSize = '29px';
        setTimeout(() => {
          document.querySelector('.logo').style.opacity = '0';
          setTimeout(() => {
            bg.style.filter = 'brightness(0.74)';
            mainDisplay.style.opacity = '1';
          }, 180);
        }, 950);
    
  } else {

    setTimeout(() => {
    body.style.filter = ' brightness(1)';
    bg.style.filter = 'brightness(0.74) blur(10px)';
    bg.style.width = '100%';
    dashboard.style.display = 'block';
    
    setTimeout(() => {
      dashboard.style.opacity = '1';
      if (welcomeLogo) {
        welcomeLogo.style.top = '1.5%';
        welcomeLogo.style.left = '2.5%';
        welcomeLogo.style.fontSize = '29px';

          if (width >= 1440 && width<1600) {
            welcomeLogo.style.left='2.5%';
            welcomeLogo.style.fontSize = '34px';
          } else if(width>=1600 && width<1900){
            welcomeLogo.style.fontSize ='37.8px';
          } else if(width>=1900) {
            welcomeLogo.style.fontSize = '45px';
          }

        
      }
      setTimeout(() => {
        if (content) {
          content.style.opacity = '1';
          content.style.marginTop = '0px';
        }
        if (navBar) {
          navBar.style.backgroundColor = '#0000002b';
          navBar.style.backdropFilter = 'blur(32px)';
        };
        if (preNav) {
          preNav.querySelectorAll('svg').forEach(svg=>{
            svg.style.opacity = '1';
          })
          preNav.style.transform = 'translateY(5px)';
        }
         bg.style.filter = 'brightness(0.74)';
        setTimeout(() => {
          if (topStats) {
            topStats.style.opacity = '1';
            topStats.style.marginTop = '0px';
          }

          navs.style.opacity = '1';
          navs.style.marginTop = '5px';
          if (miniNav) miniNav.style.opacity = '1';
            
          setTimeout(() => {
            if (middleStats) {
              middleStats.style.opacity = '1';
              middleStats.style.marginTop = '20px';
            }
            if (bottomStats) {
              bottomStats.style.opacity = '1';
              
            }

            if (links) {
              links.style.opacity = '1';
              links.style.transform = 'translateX(15px) translateY(21px)';
            }
          }, 300);
        }, 200);
      }, 1230);
    }, 600);
  }, 730);
  }
  
});

export let userData;

export function hideAllSections() {
      const allSections = [
        dashboard,
        discover,
        library,
        focusMode,
        settings,
        document.getElementById('saved'),
        document.getElementById('achievements'),
        document.getElementById('wishlist')
      ];

      allSections.forEach(sec => {
        if (!sec) return;
        sec.style.opacity = '0';
        setTimeout(() => {
          sec.style.display = 'none';
        }, 200);
      });
      if(width<768) {
        navBar.style.opacity = '0';
        setTimeout(() => {
          navBar.style.display = 'none';
          content.style.opacity = '1';
        }, 200);
      }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    thisUser = user;
    const userRef = doc(db, "users", user.uid);
    let schedulerInitialized = false;
    const snap = await getDoc(userRef);
    userData = snap.data();
    if (snap.exists()) {
      const daily = snap.data().achievements?.daily || {};
      if (daily.logIn !== "claimed") {
        await updateDoc(userRef, {
          "achievements.daily.logIn": true
        });
      }
    }

    onSnapshot(userRef, async (snap) => {
      if (!snap.exists()) return;
      
      const data = snap.data();
      if (!data.reachedQuestionnaire) {
        window.location.href = "/public/personalization/pers.html";
        return;
      }
      userData = data;
      initThemePicker(thisUser)
      renderLibrary(userData, userRef);
      renderUserCollections();
      renderDashboard(userData);
      updateAssignedBookUI(userData);
      initTimer(userData, thisUser);
      renderFocusSessions(userData);
      monitorSessions(userData);
      renderQuoteSelections(userData);
      checkLevelUp(userRef, data);
      renderDailyAchievements(userData);
      renderWeeklyAchievements(userData);
      renderMilestones(userData)
      renderStreakIcons(userData)
      
      await resetDailyIfNeeded(userRef)
      await resetWeeklyIfNeeded(userRef);
      if(userData.globalTheme) document.querySelector('.bg').src = `${userData.globalTheme}`
      if (!schedulerInitialized) {
        initScheduler(thisUser, userData);
        setupNewSessionModal(thisUser, userData);
        schedulerInitialized = true;
      } else {

        window.__booksyLatestUserData = userData;
      }
    });
    

    function resetActive() {
      document.querySelectorAll('.nav a, .mini-nav svg').forEach(el => {
        el.removeAttribute('id');
      });

      settingsLink.removeAttribute('id');
    }
    const openNav = document.querySelector('.open-nav') 

    openNav.addEventListener('click', () => {
      navBar.style.display ='block';
      content.style.opacity = '0.5'
      setTimeout(() => {
        navBar.style.opacity = '1';
      }, 250);

    })

    function setupNavigation() {
      const navLinks = document.querySelectorAll('.nav a');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if(document.getElementById('active').classList.contains('focusMode')){
            normalNavBar('focusMode')
          }
          resetActive(); 
          link.setAttribute('id', 'active');

          hideAllSections();

          const target = link.classList[0];

          if (target === 'dashboard') {
            setTimeout(() => {
              dashboard.style.display = 'block';
              mainDisplay.style.gap = '55px';
              setTimeout(() => {
                dashboard.style.opacity = '1';
              }, 200);
            }, 200);
          }

          if (target === 'discover') {
            setTimeout(() => {
              discover.style.display = 'block';
              mainDisplay.style.gap = '40px';
              //initDiscover(userData || {});
              bg.style.filter = 'brightness(0.7) blur(20px)';
              setTimeout(() => {
                discover.style.opacity = '1';
              }, 200);
            }, 200);
          }

          if (target === 'library') {
            setTimeout(() => {
              library.style.display = 'block';
              mainDisplay.style.gap = '40px';
              setTimeout(() => {
                library.style.opacity = '1';
              }, 200);
            }, 200);
          }

          if (target === 'focusMode') {
            smallerNavBar('focus');
            hideAllSections();

            setTimeout(() => {
              focusMode.style.display = 'block';
              if(width>=768) {
                smallerNavSection.style.display = 'none';
                nav.forEach(nav => nav.style.gap = '15px');
                  navs.style.gap = '15px';
                  miniNav.style.gap = '15px';
              }
              setTimeout(() => {
                focusMode.style.opacity = '1';
              }, 200);
            }, 200);
          }
          if(target!=='discover'){
            bg.style.filter = 'brightness(0.74)';
          }
          
        });
      });
    }

    function setupMiniNavigation() {
      const miniNavLinks = document.querySelectorAll('.mini-nav svg');
      const savedSection = document.getElementById('saved');
      const achievementsSection = document.getElementById('achievements');
      const wishlistSection = document.getElementById('wishlist');
      miniNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();

          resetActive(); 
          link.setAttribute('id', 'active');

          hideAllSections();

          const target = link.classList[0];
          let chosenSection;

          if (target === 'saved') chosenSection = savedSection;
          if (target === 'achievements') chosenSection = achievementsSection;
          if (target === 'wishlist') chosenSection = wishlistSection;
          
          if (chosenSection) {
            setTimeout(() => {
              chosenSection.style.display = 'block';
              setTimeout(() => {
                chosenSection.style.opacity = '1';
              }, 200);
            }, 200);
            bg.style.filter = 'brightness(0.7)';
          }
        });
      });
      settingsLink.addEventListener('click', (e)=>{
        e.preventDefault();
        resetActive();
        settingsLink.setAttribute('id', 'active');
        hideAllSections();
        //normalNavBar();
        setTimeout(() => {
          settings.style.display = 'block';
          
          mainDisplay.style.gap = '0px';
          setTimeout(() => {
            settings.style.opacity = '1';
          }, 200);
        }, 200);
      })
    }

    setupNavigation();
  
    setupMiniNavigation()

    const goalInfo = document.querySelector('.goal-info');
    const level = document.querySelector('.level');
    const pagesRead = document.querySelector('.pagesRead');
    const articlesRead = document.querySelector('.articlesRead');
    const focusSessions = document.querySelector('.focusSessions');
    const streakDays = document.querySelector('.streakDays');

    if (userData?.progress) {
      if (level) level.innerHTML = `Lvl ${userData.progress.level}`;
      if (goalInfo) goalInfo.innerHTML = `${userData.progress.booksRead}/${userData.progress.booksGoal}`;
      if (pagesRead) pagesRead.innerHTML = `${userData.progress.pagesRead}`;
      if (articlesRead) articlesRead.innerHTML = `${userData.progress.articlesRead}`;
      if (focusSessions) focusSessions.innerHTML = `${userData.progress.focusSessions}`;
      if (streakDays) streakDays.innerHTML = `${userData.progress.streakDays}`;
    }

    const progressCircle = document.querySelector('.progress-ring__circle');
    const progressText = document.querySelector('.circle-text');

    const goalText = (goalInfo && goalInfo.textContent) ? goalInfo.textContent : "0/10";
    const [booksReadVal, booksGoalVal] = goalText.split('/').map(n => parseInt(n, 10) || 0);

    const radius = 55;
    const circumference = 2 * Math.PI * radius;
    if (progressCircle) progressCircle.style.strokeDasharray = circumference;

    const readCount = userData.progress?.booksRead ?? booksReadVal;
    const goalCount = userData.booksGoal > 0 ? userData.booksGoal : 1;

    let targetPercent = (readCount / userData.booksGoal) * 100;

    if (readCount > 0 && targetPercent < 1) {
      targetPercent = 1;
    }

    targetPercent = Math.min(targetPercent, 100);


    let startPercent = sessionStorage.getItem("lastProgressPercent");
    startPercent = startPercent ? parseFloat(startPercent) : 0;

    if (!sessionStorage.getItem("hasLoggedIn")) {
      startPercent = 0;
      sessionStorage.setItem("hasLoggedIn", "true");
    }

    if (progressText) progressText.textContent = `${Math.round(targetPercent)}%`;


    let currentPercent = startPercent;
    const duration = 800;
    const fps = 60;
    const totalFrames = Math.round((duration / 1000) * fps);
    let frame = 0;

    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      currentPercent = startPercent + (targetPercent - startPercent) * progress;
      const offset = circumference - (currentPercent / 100) * circumference;
      if (progressCircle) progressCircle.style.strokeDashoffset = offset;
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        sessionStorage.setItem("lastProgressPercent", targetPercent);
      }
    };
    requestAnimationFrame(animate);

    function renderLibrary(userData, userRef) {
      if(userData){
        let activeFilter = "all";
        if (!userData.library || userData.library.length === 0) {
          noLib.style.zIndex = "1";
          noLib.style.opacity = "1";
          showLib.style.zIndex = "1";
          showLib.style.opacity = "0";
          
        }

        h2.textContent = "Your Library";
        noLib.style.opacity = "0";
        noLib.style.zIndex = "0";
        showLib.style.opacity = "1";
        showLib.style.zIndex = "1";

        const libraryNav = showLib.querySelector(".library-nav");


        renderLibBooks(userData.library, userRef, userData, thisUser);

        function setActive(el) {
          libraryNav.querySelectorAll("p").forEach(p => p.removeAttribute("id"));
          el.setAttribute("id", "set");
        }
        addBook.addEventListener('click', () => {
          
          addBook.style.opacity = '0';
          showLib.style.opacity = ' 0.6';
          showLib.style.zIndex = '0';
          document.querySelector('.libraryh2').style.zIndex = '0';

          setTimeout(() => {
            addBookSection.style.display = 'block';
            mainDisplay.style.gap = '30px';
            setTimeout(() => {
                          
            addBook.style.display = 'none';
            showLib.style.position = 'absolute';
              addBookSection.style.opacity = '1';
              
              
            }, 150);

          }, 200);
        });

        closeAddSection.forEach(closeAddSection=>{

          closeAddSection.addEventListener('click', () => {
            addBook.style.display = 'flex';
            addBookSection.style.opacity = '0';
            showLib.style.width ='100%';
           // addBookSection.style.height = '78vh';
            setTimeout(() => {
              showLib.style.opacity = '1';
              showLib.style.position = 'relative';
              showLib.style.zIndex = '1';
              document.querySelector('.libraryh2').style.zIndex = '1';
              setTimeout(() => {
                  addBookSection.style.display = 'none';
                  addBook.style.opacity = '1';
                }, 250);
            }, 600);
        })
        })
        
        libraryNav.querySelector(".all").addEventListener("click", () => {
        activeFilter = "all";
        renderLibBooks(userData.library, userRef);
        setActive(libraryNav.querySelector(".all"));
        });

        libraryNav.querySelector(".inProgress").addEventListener("click", () => {
          activeFilter = "inProgress";
          const filtered = (userData.library || []).filter(
            b => !b.finished && b.currentPage > 0 && b.currentPage < b.totalPages
          );
          renderLibBooks(filtered, userRef);
          setActive(libraryNav.querySelector(".inProgress"));
        });

        libraryNav.querySelector(".finished").addEventListener("click", () => {
          activeFilter = "finished";
          const filtered = (userData.library || []).filter(b => b.finished);
          renderLibBooks(filtered, userRef);
          setActive(libraryNav.querySelector(".finished"));
        });

        offlineOption.addEventListener('click', () => {
          addMain.style.opacity = '0';
          setTimeout(() => {
            addMain.style.display = 'none';
            addOfflineSection.style.display = 'flex';
              setTimeout(() => {
                addOfflineSection.style.opacity = '1';
              }, 250);
          }, 150);
        })
        closeOfflineSection.addEventListener('click', ()=>{

          addBookSection.style.height = '78vh';
          setTimeout(() => {
            addMain.style.opacity = '1';
            addOfflineSection.style.opacity = '0';
              setTimeout(() => {
                addOfflineSection.style.display = 'none';
                addMain.style.display = 'flex';
              }, 250);
          }, 150);
        })

      }

    }
  
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (!hasStartedOnce && startBtn.textContent === "Start") {

          if (!userData?.unplannedSession?.assignedBook) {
            popup.style.display = 'block';
            focus.style.filter = 'blur(7px)';
            bg.style.filter = 'blur(7px) brightness(0.74)';
            setTimeout(() => {
              popup.style.opacity = '1';
            }, 150);
          } else {
            beginTimer(hasStartedOnce, userData, thisUser);
          }

          hasStartedOnce = true;
        } else {
          togglePause();
        }
      });
    }
   
    noPopup.addEventListener('click', async () => {
      hidePopup();
      beginTimer(hasStartedOnce, userData, thisUser);
      hasStartedOnce = true;

      if (thisUser) {
        const userRef = doc(db, "users", thisUser.uid);
        await updateDoc(userRef, { hideFocusPopup: true });
      }
    });

    closePopup.addEventListener('click', () => {
      hidePopup();
      beginTimer(hasStartedOnce, userData, thisUser);
      hasStartedOnce = true;
    });

    function hidePopup() {
      popup.style.opacity = '0';
      focus.style.filter ='blur(0px)';
      bg.style.filter ='brightness(0.74)';
      setTimeout(() => {

        focus.style.removeProperty('filter');
      }, 250);

      //focusMain.style.removeProperty('filter');
      setTimeout(() => {
        popup.style.display = 'none';
      }, 150);
    }

    const assignBookBtn = document.querySelector('.assignBook');

    if (assignBookBtn) {
      assignBookBtn.addEventListener('click', () => {
        document.querySelector('.library').setAttribute('id', 'active');
        document.querySelector('.focusMode').removeAttribute('id', 'active');
        focusMode.style.opacity = '0';
        normalNavBar();
        smallerNavSection.style.display = 'block';
        setTimeout(() => {
          focusMode.style.display = 'none';
          library.style.display = 'block';
          setTimeout(() => {
            mainDisplay.style.gap = '40px';
            library.style.opacity = '1';
          }, 350);
        }, 350);
        
      });
    }
    editFocusBtn.addEventListener('click', ()=>{
      editFocus.style.display = 'flex';

      mainDisplay.style.overflow = 'hidden';
      setTimeout(() => {
        editFocus.style.opacity = '1';
      }, 350);
    })

    closeEditFocus.addEventListener('click', ()=>{
      editFocus.style.opacity = '0';
      focusMain.style.removeProperty = 'filter';
      mainDisplay.style.overflow = 'auto';
      setTimeout(() => {
        editFocus.style.display = 'none';
      }, 350);
    })
    document.querySelectorAll(".edit-categories > div").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".edit-categories > div").forEach(c => c.removeAttribute("id"));
        btn.id = "shown";

        const target = btn.getAttribute("data-target");

        document.querySelectorAll(".shown-edit-category .category-content")
          .forEach(c => c.style.display = "none");

        const selectedContent = document.querySelector(`.shown-edit-category [data-category="${target}"]`);
        if (selectedContent) selectedContent.style.display = "block";
      });
    });

    await resetDailyIfNeeded(userRef);
    checkAllDailyComplete(userRef)
    initAccountSettings(userData);
    initDiscover(userData || {});
    initBooks(userData || {});

  } else {
    window.location.href = "/index.html";
  }
});



