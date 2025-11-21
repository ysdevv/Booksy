import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, updateDoc} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, updateProfile, updateEmail, updatePassword, GoogleAuthProvider} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { showToast, markArticleRead } from "./achievements.js";
import { escapeHtml } from "./articles.js";
import { loadBookIntoReader, loadImportedBookIntoReader } from "./books.js";
import { LEVELS, thisUser, width, smallerNavBar, normalNavBar, mainDisplay, content, getImportedBook, hideAllSections } from "./main.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSEhn9NopPvGDyYHWfYJx9EPOgu7U8mjc",
  authDomain: "booksy-app-a2c22.firebaseapp.com",
  projectId: "booksy-app-a2c22",
  storageBucket: "booksy-app-a2c22.appspot.com",
  messagingSenderId: "136774503415",
  appId: "1:136774503415:web:b332926d4b220b8ea47cf2",
  measurementId: "G-S30V4RDX67"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: "select_account",   

});

export async function initAccountSettings(userData) {
  const user = auth.currentUser;
  if (!user) return;

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const changeNameBtn = document.getElementById("changeName");
  const changeEmailBtn = document.getElementById("changeEmail");
  const changePasswordBtn = document.getElementById("changePassword");

  nameInput.value = userData.displayName || "";
  emailInput.value = userData.email || "";
  if (user.providerData.some(p => p.providerId === "google.com")) {
    passwordInput.placeholder = "Set your password";
    passwordInput.value = "";
  } else {
    passwordInput.placeholder = "********";
  }
  if (user.providerData.some(p => p.providerId === "google.com")) {
    emailInput.disabled = true;
    passwordInput.disabled = true;
    changeEmailBtn.disabled = true;
    changePasswordBtn.disabled = true;
    emailInput.value = "";
    emailInput.placeholder = "Managed by Google";
    passwordInput.placeholder = "Managed by Google";
  }
  changeNameBtn.addEventListener("click", async () => {
    const newName = nameInput.value.trim();
    if (!newName) return showToast("⚠️ Name cannot be empty.");

    try {
      await updateProfile(user, { displayName: newName });
      await updateDoc(doc(db, "users", user.uid), { displayName: newName });
      showToast("✅ Name changed successfully!");
    } catch (err) {
      showToast("❌ Failed to change name.");
    }
  });

  changeEmailBtn.addEventListener("click", async () => {
    const newEmail = emailInput.value.trim();
    if (!newEmail) return showToast("⚠️ Email cannot be empty.");

    try {
      await updateEmail(user, newEmail);
      await updateDoc(doc(db, "users", user.uid), { email: newEmail });
      showToast("✅ Email changed successfully!");
    } catch (err) {
      showToast("❌ Failed to change email. Try reauthenticating.");
    }
  });

  changePasswordBtn.addEventListener("click", async () => {
    const newPassword = passwordInput.value.trim();
    if (!newPassword || newPassword.length < 6)
      return showToast("⚠️ Password must be at least 6 characters.");

    try {
      await updatePassword(user, newPassword);
      showToast("✅ Password updated successfully!");
    } catch (err) {
      console.log(err)
      showToast("❌ Failed to change password. Try reauthenticating.");
    }
  });
}

function renderReadingGoal(uData) {
      const phraseEl = document.querySelector('.reading-progress-card p');
      const booksRead = uData.progress?.booksRead || 0;
      const booksGoal = uData.booksGoal || 1;
      const goalInfo = document.querySelector('.goal-info')
      const percent = Math.min((booksGoal === 0 ? 0 : (booksRead / booksGoal) * 100), 100);
      if (goalInfo) goalInfo.textContent = `${booksRead}/${booksGoal}`;

      let phrase = "books read in 2025. It’s never <br>too late to start!";
      if (booksRead >= 1 && percent < 20) {
        phrase = "First step taken! Keep it going!";
      } else if (percent >= 20 && percent < 50) {
        phrase = "You’re building momentum — don’t stop now!";
      } else if (percent >= 50 && percent < 80) {
        phrase = "Halfway there — amazing work!";
      } else if (percent >= 80 && percent < 100) {
        phrase = "Almost at the finish line, stay strong!";
      } else if (percent >= 100) {
        phrase = "Goal achieved! You’re a true Booksy Champion!";
      }
      if (phraseEl) phraseEl.innerHTML = phrase;
}

function renderLevelUI(uData) {
      const lvl = uData.progress?.level ?? 1;
      const xp = uData.progress?.xp ?? 0;

      const currentMeta = LEVELS[lvl - 1] || LEVELS[0];
      const nextMeta = LEVELS[lvl] || null; 

      const needed = nextMeta ? nextMeta.xp : currentMeta.xp; 
      const title = currentMeta.title;

      const header = document.querySelector('.user-info');
      if(width>=768) {
        header.innerHTML = `Welcome, ${thisUser.displayName || "Reader"}! <span>|</span> Level ${lvl} - ${title}`;
      } else {
        header.innerHTML = `Welcome, ${thisUser.displayName || "Reader"}! Lvl ${lvl} - ${title}`;
      }
      
      const xpCountEl = document.querySelector('.xp-count');
      if (xpCountEl) {
        if (nextMeta) {
          xpCountEl.textContent = `${xp} / ${needed} 🔮`;
        } else {
          xpCountEl.textContent = `${xp} 🔮 (MAX Level)`;
        }
      }

      const xpFill = document.querySelector('.xp-fill');
      let percent = 100;
      if (nextMeta) {
        percent = Math.max(0, Math.min((xp / needed) * 100, 100));
      }

      let startXpPercent = sessionStorage.getItem("lastXpPercent");
      const hasLoggedIn = sessionStorage.getItem("hasLoggedIn");

      if (!hasLoggedIn) {
        startXpPercent = 0;
        sessionStorage.setItem("hasLoggedIn", "true");
      } else {
        startXpPercent = startXpPercent ? parseFloat(startXpPercent) : 0;
      }

      if (xpFill) xpFill.style.width = `${startXpPercent}%`;

      requestAnimationFrame(() => {
        if (xpFill) xpFill.style.width = `${percent}%`;
        sessionStorage.setItem("lastXpPercent", percent.toFixed(2));
      });
}

async function extractEpubTextWithJSZip(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  let allText = "";
  for (const filename of Object.keys(zip.files)) {
    if (/\.(xhtml|html)$/i.test(filename)) {
      try {
        const content = await zip.files[filename].async("string");
        const tmp = document.createElement("div");
        tmp.innerHTML = content;
        allText += (tmp.textContent || "").trim() + "\n\n";
      } catch (err) {
        console.warn("Failed to read", filename, err);
      }
    }
  }
  return allText;
}

function renderCurrentBook(uData) {
      const currentBookCard = document.querySelector('.current-book-card');
      let currentBookId = uData.progress?.currentBook;
      let currentBook = null;
      if (currentBookId && Array.isArray(uData.library)) {
        currentBook = uData.library.find(b => b.id === currentBookId);
      }
      if (!currentBook && Array.isArray(uData.library) && uData.library.length > 0) {
        currentBook = uData.library.reduce((latest, book) => {
          return !latest || new Date(book.lastRead) > new Date(latest.lastRead) ? book : latest;
        }, null);
      }
      if (!currentBook) {
        if (currentBookCard) {
          currentBookCard.classList.add('no-book');
          currentBookCard.innerHTML = `
            <h3>No current book yet!</h3>
            <p>Find a new book to dive in or add one you are <br>currently reading</p>
            <div class="quick-action-btns">
              <a id="findBook">Find</a>
              <a id="addBook" style="color:black;">Add</a>
            </div>
          `;
        }
      } else {
        if (currentBookCard) {
          currentBookCard.classList.remove('no-book');
          currentBookCard.classList.add('current-book');
          
          currentBookCard.innerHTML = `
              <img src='${currentBook.cover}'>
              <div style='display:flex; flex-direction:column; justify-content:space-between; width:100%;'>
                <div>
                  <h4>${currentBook.title}</h4>
                  <p class='book-author'>by ${currentBook.author}</p>
                </div>
                <div style='display:flex; justify-content:space-between; height:unset;margin-bottom:5%;'>
                  <p class='pages-progress'>${currentBook.currentPage} of ${currentBook.totalPages} <br>pages read</p>
                  <button class='readBook'>Continue</button>
                </div>
              </div>
          `;
          if(currentBook.source ==='offline'){
              currentBookCard.querySelector('.readBook').style.display = 'flex';
              currentBookCard.querySelector('.readBook').innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> 
                    <path  d="M14.5 4.5C14.5 5.88071 13.3807 7 12 7C10.6193 7 9.5 5.88071 9.5 4.5C9.5 3.11929 10.6193 2 12 2C13.3807 2 14.5 3.11929 14.5 4.5Z" stroke="#1C274C" stroke-width="1.5"></path> <path d="M21 17L19.8423 16.61C19.6151 16.5335 19.399 16.4267 19.1998 16.2925L19.0985 16.2243C18.4122 15.762 18 14.9837 18 14.1502C18 11.713 16.2563 9.63312 13.8772 9.23246L12.9864 9.08245C12.5 8.99986 11.5 9 11.0136 9.08245L10.1228 9.23246C7.74373 9.63312 6 11.713 6 14.1502C6 14.9837 5.58776 15.762 4.90145 16.2243L4.80022 16.2925C4.60096 16.4267 4.38488 16.5335 4.1577 16.61L3 17" 
                     stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M9.5 16L8.57549 17.2327C8.42794 17.4294 8.35416 17.5278 8.27135 17.6144C8.06638 17.8287 7.81632 17.9947 7.53929 18.1004C7.42736 18.1432 7.30805 18.173 7.06948 18.2326L5.27607 18.681C4.52611 18.8685 4 19.5423 4 20.3153C4 21.2458 4.75425 22 5.68466 22H6.36842C8.07661 22 9.73871 21.446 11.1053 20.4211L13 19M14.5 16L15.2267 16.9689C15.5701 17.4269 15.7419 17.6558 15.9648 17.825C16.0318 17.8759 16.102 17.9225 16.1749 17.9645C16.4174 18.1043 16.695 18.1738 17.2503 18.3126L18.7239 18.681C19.4739 18.8685 20 19.5423 20 20.3153C20 21.2458 19.2458 22 18.3153 22H17.3776C16.8153 22 16.5342 22 16.2554 21.9844C15.4319 21.9384 14.6172 21.7907 13.83 21.5446C13.5635 21.4613 13.3003 21.3626 12.7738 21.1652L11 20.5"  stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg><p>Focus</p>`;
          }
          const readBookBtn = currentBookCard.querySelector(".readBook");
          readBookBtn.addEventListener("click", async () => {
           if (currentBook.source === 'offline') {
              try {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const defaultCommit = (uData && uData.unplannedSession && uData.unplannedSession.timeCommitment) || "15 min";

                await updateDoc(userRef, {
                  "unplannedSession.assignedBook": currentBook,
                  "unplannedSession.timeCommitment": defaultCommit
                });

                const focusEl = document.querySelector('.focusSection');
                if (focusEl) focusEl.dispatchEvent(new Event('click'));

                setTimeout(() => {
                  const startEl = document.querySelector('.start');
                  if (startEl) startEl.dispatchEvent(new Event('click'));
                }, 300);

              } catch (err) {
                console.error("Error launching offline book as unplanned session:", err);
              }
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
              return;
            }

            if(currentBook.source ==="imported") {
              
              getImportedBook(currentBook.id).then(async (buffer) => {
                                    if (!buffer) {
                                      console.warn("No stored data for imported book:", currentBook.id);
                                      return;
                                    }
                                    const textContent = await extractEpubTextWithJSZip(buffer);
                                    loadImportedBookIntoReader(currentBook, textContent);
                                  }).catch((err) => console.error("Failed to load imported book", err));
            } else {
              loadBookIntoReader({ title: currentBook.title, author: currentBook.author, cover: currentBook.cover });
            }
            
          });
          
        }
      }
}
const articleReader = document.querySelector('.articleReader');

function renderDailyArticle(uData) {
      const articleCard = document.querySelector('.daily-article-card');
      let article;
      
      if(uData.dailyArticle) article = uData.dailyArticle.article;

      if (!article) {
        if (articleCard) {
          articleCard.classList.remove('daily-article');
          articleCard.classList.add('no-article');
          articleCard.innerHTML = `
            <h4>No article picked yet 📰</h4>
            <p>Check back tomorrow for your personalized recommendation!</p>
          `;
        }
      } else {
        if (articleCard) {
          articleCard.classList.add('daily-article');
          articleCard.classList.remove('no-article');
          const title = escapeHtml(article.title);
          const author = escapeHtml(article.author);
          articleCard.innerHTML = `
              <img class="articleCover" src="${article.cover}" alt="">
              <div class="mainArticle">
                  <p class="duration">${article.duration || "~5-8 min read"}</p>
                  <h2 class="articleTitle">${title}</h2>

                 <div style='display:flex; justify-content:space-between;'>
                    <div>
                        <p> by ${author}</p>
                        <p>From <a href='https://medium.com/'>Medium</a></p>
                    </div>
                    <div class="readArticle"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3 6.1519V19.3095C3.99197 18.8639 5.40415 18.4 7 18.4C8.58915 18.4 9.9999 18.8602 11 19.3094V6.1519C10.7827 6.02653 10.4894 5.8706 10.1366 5.71427C9.31147 5.34869 8.20352 5 7 5C5.26385 5 3.74016 5.72499 3 6.1519ZM13 6.1519V19.3578C13.9977 18.9353 15.41 18.5 17 18.5C18.596 18.5 20.0095 18.9383 21 19.3578V6.1519C20.2598 5.72499 18.7362 5 17 5C15.7965 5 14.6885 5.34869 13.8634 5.71427C13.5106 5.8706 13.2173 6.02653 13 6.1519ZM12 4.41985C11.7302 4.26422 11.3734 4.07477 10.9468 3.88572C9.96631 3.45131 8.57426 3 7 3C4.69187 3 2.76233 3.97065 1.92377 4.46427C1.30779 4.82687 1 5.47706 1 6.11223V20.0239C1 20.6482 1.36945 21.1206 1.79531 21.3588C2.21653 21.5943 2.78587 21.6568 3.30241 21.3855C4.12462 20.9535 5.48348 20.4 7 20.4C8.90549 20.4 10.5523 21.273 11.1848 21.6619C11.6757 21.9637 12.2968 21.9725 12.7959 21.6853C13.4311 21.32 15.0831 20.5 17 20.5C18.5413 20.5 19.9168 21.0305 20.7371 21.4366C21.6885 21.9075 23 21.2807 23 20.0593V6.11223C23 5.47706 22.6922 4.82687 22.0762 4.46427C21.2377 3.97065 19.3081 3 17 3C15.4257 3 14.0337 3.45131 13.0532 3.88572C12.6266 4.07477 12.2698 4.26422 12 4.41985Z" fill="black"></path> </g></svg></div>
                 </div>
              </div>
          `;
          
          const readBtn = articleCard.querySelector(".readArticle");
          readBtn.addEventListener("click", () => {
            smallerNavBar();
            mainDisplay.style.gap = '0px';
            mainDisplay.scrollTo({ top: 0, behavior: "smooth" });
            content.style.opacity = '0';
            articleReader.style.display = "block";
            articleReader.innerHTML = `
              <svg id='closeArticle' fill="white" width='25px' viewBox="0 0 32 32">
                <path d="M0 21.984q0.032-0.8 0.608-1.376l4-4q0.448-0.48 
                        1.056-0.576t1.12 0.128 0.864 0.736 0.352 
                        1.12v1.984h18.016q0.8 0 1.376 0.576t0.576 
                        1.376-0.576 1.376-1.376 0.576h-18.016v1.984q0 
                        0.64-0.352 1.12t-0.864 0.736-1.12 
                        0.128-1.056-0.576l-4-4q-0.576-0.576-0.608-1.376z"></path>
              </svg>
              <h2>${article.title}</h2>
              
              <p>by ${article.author}</p>
              <div>${article.content}</div>
             
            `;
            const btn = document.createElement('button');
            btn.innerHTML = 'Mark as read'
            btn.id = 'markArticleRead';
            articleReader.appendChild(btn)
            setTimeout(() => {
              articleReader.style.opacity = '1';
              content.style.display='none';
            }, 150);
            document.getElementById("closeArticle").addEventListener("click", () => {
              normalNavBar('focusMode');
              mainDisplay.style.gap = '47px';
              articleReader.style.opacity = "0";
              content.style.opacity = '1';
              setTimeout(() => {
                content.style.display = 'block';
                normalNavBar();
                articleReader.innerHTML = '';
                articleReader.style.display = 'none';
              }, 350);
            });
            const markBtn = articleReader.querySelector("#markArticleRead");
            if (markBtn) {
              markBtn.addEventListener("click", async () => {
                const userRef = doc(db, "users", auth.currentUser.uid);
                await markArticleRead(userRef);
                markBtn.outerHTML = `<p id='articleRead'>Read ✅</p>`;
              });
            }
            
          });
        }
      }
}

export function renderDashboard(uData) {
  const goalInfo = document.querySelector('.goal-info');
  const level = document.querySelector('.level');
  const pagesRead = document.querySelector('.pagesRead');
  const articlesRead = document.querySelector('.articlesRead');
  const focusSessions = document.querySelector('.focusSessions');
  const streakDays = document.querySelector('.streakDays');

  if (uData?.progress) {
    if (level) level.innerHTML = `Level ${uData.progress.level}`;
    if (goalInfo) goalInfo.innerHTML = `${uData.progress.booksRead}/${uData.booksGoal || 0}`;
    if (pagesRead) pagesRead.innerHTML = `${uData.progress.pagesRead}`;
    if (articlesRead) articlesRead.innerHTML = `${uData.progress.articlesRead}`;
    if (focusSessions) focusSessions.innerHTML = `${uData.progress.focusSessions}`;
    if (streakDays) streakDays.innerHTML = `${uData.progress.streakDays}`;
  }

  renderReadingGoal(uData);
  renderLevelUI(uData);
  renderCurrentBook(uData);
  renderDailyArticle(uData);
} 

