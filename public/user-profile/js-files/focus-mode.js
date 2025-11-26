import { auth, db } from "./firebase.js";
import { doc, getDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { checkLevelUp } from "./main.js";
import { showToast,showRewardPopup  } from "./achievements.js";
export {initTimer, beginTimer, togglePause, updateAssignedBookUI }

const motivationQuotes = {
  "habits-consistency": [
    "Small steps daily build unstoppable momentum.",
    "Consistency beats intensity every time.",
    "A little progress each day adds up to big results.",
    "Discipline today creates freedom tomorrow."
  ],
  "knowledge": [
    "Every page turned is a step toward wisdom.",
    "Knowledge compounds like interest — keep reading.",
    "The curious mind never stops growing.",
    "Learn something today your future self will thank you for."
  ],
  "phone-detox": [
    "Silence the phone, amplify your focus.",
    "Real life begins when the screen goes dark.",
    "Detox your mind by decluttering your attention.",
    "Escape notifications, enter concentration."
  ],
  "book-lover": [
    "A book a day keeps boredom away.",
    "Lost in pages, found in stories.",
    "Books are uniquely portable magic.",
    "Your library is your superpower."
  ],
  "self-care": [
    "Reading is an act of self-love.",
    "A calm mind is a fertile ground for growth.",
    "Take care of yourself — the book will wait.",
    "Pause. Breathe. Read. Heal."
  ]
};
function pickMotivationQuotes(userData) {
  const quoteBox = document.querySelector('.quote');
  if (!quoteBox) return;

  const motivations = userData.motivations || [];
  let pool = [];

  motivations.forEach(m => {
    if (motivationQuotes[m]) {
      pool = pool.concat(motivationQuotes[m]);
    }
  });

  if (pool.length === 0) {
    pool = ["Stay focused. Your best self is waiting."];
  }

  const randomQuote = pool[Math.floor(Math.random() * pool.length)];
  quoteBox.textContent = randomQuote;
}
//general variables
const startBtn = document.querySelector('.start');
const popup = document.querySelector('.popupMessage');
const focus = document.querySelector('.focus');
const focusBtn = document.querySelector('.focusSection');
const scheduleBtn = document.querySelector('.scheduleSection');
const scheduleSection = document.querySelector('.schedule');
const quote = document.querySelector('.quote');
const timerEl = document.querySelector('.timer');
const focusModeNav = document.querySelector('.focusModeNav');

const schedulerHeader = document.querySelector('.schedule-header')
const modal = document.getElementById("newSessionModal");
const saveBtn = document.getElementById("saveSession");
const sessionsList = document.querySelector('.sessionsList')
let timerInterval;
let remainingSeconds = 0;
let isPaused = false;


function formatTime(totalMinutes) {
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function renderQuoteSelections(userData) {
  const quotes = document.querySelectorAll('.quotes-list p');
  const currentSet = new Set(userData.motivations || []);
  quotes.forEach(q => {
    q.classList.toggle('pickedQuotes', currentSet.has(q.id));

    q.onclick = async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);

      const snap = await getDoc(userRef);
      if (!snap.exists()) return;
      const latest = snap.data();
      const latestSet = new Set(latest.motivations || []);

      if (latestSet.has(q.id)) {
        if (latestSet.size <= 1) {
          alert("Please keep at least one motivation selected.");
          return;
        }
        latestSet.delete(q.id);
      } else {
        latestSet.add(q.id);
      }
      q.classList.toggle('pickedQuotes', latestSet.has(q.id));

      await updateDoc(userRef, { motivations: Array.from(latestSet) });
    };
  });
}
let userTimeCommitment;
function initTimer(userData, thisUser) {
  let commit = userData?.unplannedSession?.timeCommitment || "15 min";
    userTimeCommitment = userData.unplannedSession.timeCommitment;
  
  const match = commit.match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?/i);
  const hrs = parseInt(match?.[1] || "0", 10);
  const mins = parseInt(match?.[2] || "0", 10);

  let totalMinutes = hrs * 60 + mins;
  if (totalMinutes <= 0) totalMinutes = 15;

  timerEl.textContent = formatTime(totalMinutes);

  const hourInput = document.querySelector(".hour input");
  const minInput = document.querySelector(".mins input");
  if (hourInput && minInput) {
    hourInput.value = hrs;
    minInput.value = mins;
  }

  const saveBtn = document.getElementById("saveTimer");
  if (saveBtn && !saveBtn.dataset.bound) {
    saveBtn.dataset.bound = "true"; 
    saveBtn.addEventListener("click", async () => {
      const hours = parseInt(hourInput.value, 10) || 0;
      const minutes = parseInt(minInput.value, 10) || 0;

      let newCommit = "";
      if (hours > 0) newCommit += `${hours}h `;
      if (minutes > 0) newCommit += `${minutes}min`;
      newCommit = newCommit.trim() || "15 min";
  
      if (thisUser) {
        const userRef = doc(db, "users", thisUser.uid);
        await updateDoc(userRef, {
          "unplannedSession.timeCommitment": newCommit
        });
        
      }

      initTimer(
        { ...userData, unplannedSession: { ...(userData.unplannedSession || {}), timeCommitment: newCommit } },
        thisUser
      );
    });
  }

  pickMotivationQuotes(userData);
}

function resetTimer(userData) {
  clearInterval(timerInterval);
  isPaused = false;

  startBtn.textContent = "Start";
  initTimer(userData);
}

scheduleBtn.addEventListener('click', switchToSchedule);


async function beginTimer(hasStartedOnce, userData, thisUser) {

  clearInterval(timerInterval); 
    if (userData?.focusTheme) {
      document.querySelector('.bg').src = `${userData.focusTheme}`;
      document.querySelector('.bg').style.filter = 'brightness(0.75)';
  }

  const parts = timerEl.textContent.split(':').map(Number);

  if(parts.length===2) {
    if(parts[0]===0){
      remainingSeconds = parts[1]*60;
    } else {
      remainingSeconds = parts[0]*60+parts[1];
    }
    
  } 
   else {
    remainingSeconds = parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
  }

  isPaused = false;
  startBtn.textContent = "Pause";
  scheduleBtn.removeEventListener('click', switchToSchedule)
  timerInterval = setInterval(async () => {

    if (!isPaused && remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();
    }
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      startBtn.textContent = "Start";
      hasStartedOnce = false; 
      resetTimer(userData)
      showSessionComplete(userData,thisUser,hasStartedOnce, 70);
      
    }
  }, 1000);
}

async function togglePause() {
  if (!isPaused) {
    isPaused = true;
    scheduleBtn.addEventListener('click', switchToSchedule);
    startBtn.textContent = "Start";
  } else {
    isPaused = false;
    startBtn.textContent = "Pause";
  }
}

function updateTimerDisplay() {
  const h = Math.floor(remainingSeconds / 3600);
  const m = Math.floor((remainingSeconds % 3600) / 60);
  const s = remainingSeconds % 60;
  if(h===0) {
      timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
      timerEl.textContent = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

}

function updateAssignedBookUI(userData) {
  const actionsDiv = document.querySelector('.actions div');
  const focus = document.querySelector('.focus')
  if (!actionsDiv) return;

  const assigned = userData?.unplannedSession?.assignedBook;
  if (assigned) {
    actionsDiv.style.display = 'none';
    const bookEl = document.createElement('div');
          bookEl.classList.add('assignedBook');
          bookEl.innerHTML = `
            <img src="${assigned.cover}" alt="${assigned.title} by ${assigned.author}">
            <div>
              <div style='display:flex; justify-content:space-between; height:20px'>
                <h4>Now reading</h4>
                <em class='delete-assigned-book'>-</em>
              </div>
              <h3>${assigned.title}</h3>
              <p>${assigned.author}</p>
              <span>📖${assigned.currentPage} of ${assigned.totalPages} pages read</span>
                      <div class="progress-bar">
                        <div class="progress-fill" style="width:${assigned.progress}%"></div>
                      </div>
            </div>
            
          `;
          if(!focus.querySelector('.assignedBook')){
            focus.appendChild(bookEl);
          }
          const deleteAssignedBook = document.querySelector('.delete-assigned-book');
          deleteAssignedBook.addEventListener('click', async ()=>{
            const userRef = doc(db, "users", auth.currentUser.uid);
              await updateDoc(userRef, {
                "unplannedSession.assignedBook": null
              });
              bookEl.remove();

          })
  } else {
    actionsDiv.style.display = 'flex';
    actionsDiv.innerHTML = `
      <svg class="assignBook" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3 6.1519V19.3095C3.99197 18.8639 5.40415 18.4 7 18.4C8.58915 18.4 9.9999 18.8602 11 19.3094V6.1519C10.7827 6.02653 10.4894 5.8706 10.1366 5.71427C9.31147 5.34869 8.20352 5 7 5C5.26385 5 3.74016 5.72499 3 6.1519ZM13 6.1519V19.3578C13.9977 18.9353 15.41 18.5 17 18.5C18.596 18.5 20.0095 18.9383 21 19.3578V6.1519C20.2598 5.72499 18.7362 5 17 5C15.7965 5 14.6885 5.34869 13.8634 5.71427C13.5106 5.8706 13.2173 6.02653 13 6.1519ZM12 4.41985C11.7302 4.26422 11.3734 4.07477 10.9468 3.88572C9.96631 3.45131 8.57426 3 7 3C4.69187 3 2.76233 3.97065 1.92377 4.46427C1.30779 4.82687 1 5.47706 1 6.11223V20.0239C1 20.6482 1.36945 21.1206 1.79531 21.3588C2.21653 21.5943 2.78587 21.6568 3.30241 21.3855C4.12462 20.9535 5.48348 20.4 7 20.4C8.90549 20.4 10.5523 21.273 11.1848 21.6619C11.6757 21.9637 12.2968 21.9725 12.7959 21.6853C13.4311 21.32 15.0831 20.5 17 20.5C18.5413 20.5 19.9168 21.0305 20.7371 21.4366C21.6885 21.9075 23 21.2807 23 20.0593V6.11223C23 5.47706 22.6922 4.82687 22.0762 4.46427C21.2377 3.97065 19.3081 3 17 3C15.4257 3 14.0337 3.45131 13.0532 3.88572C12.6266 4.07477 12.2698 4.26422 12 4.41985Z" fill="#ffffff"></path> </g></svg>
      <p>No book assigned</p>
    `;
    const assignBookBtn = actionsDiv.querySelector('.assignBook');
    if (assignBookBtn) {
      assignBookBtn.addEventListener('click', () => {
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
  }
}

async function showSessionComplete(userData, thisUser, hasStartedOnce, gainedXP = 70) {
  scheduleBtn.addEventListener('click', switchToSchedule);
  const completeDiv = document.querySelector('.sessionReward');
  completeDiv.innerHTML = `
    <h2>Focus Session Complete 🎉</h2>
    <p class="rewardText">+${gainedXP} Knowledge Orbs</p>
  `;
  showRewardPopup('🧘🏼‍♀️', 'Focus Session Complete 🎉', '🌟 Great job! You stayed focused and made real progress today. Keep it up!', `+${gainedXP} Knowledge Orbs`)

  setTimeout(() => {
    completeDiv.style.opacity = '1';
    setTimeout(() => {
      completeDiv.style.opacity = '0';
      focus.style.filter = 'blur(0px)';
      focus.style.removeProperty('filter')
      quote.style.filter = 'blur(0px)';
      setTimeout(() => {
        completeDiv.style.display = 'none';
      }, 150);
    }, 3500);
  }, 200);

  if (thisUser) {
    const userRef = doc(db, "users", thisUser.uid);

    const [h, m, s] = timerEl.textContent.split(':').map(Number);
    let totalMinutes;
    if(s===undefined) {
      totalMinutes = Math.floor(((h || 0) * 3600 + m * 60 ) / 60);
    } else {
      totalMinutes = Math.floor(((h || 0) * 3600 + m * 60 + s) / 60);
    }

    const newXP = (userData.progress?.xp || 0) + gainedXP;
    if(userData.achievements.daily.sessionComplete==='claimed') {

      updateDoc(userRef, {
      "progress.xp": newXP,
      "progress.focusSessions": (userData.progress?.focusSessions || 0) + totalMinutes,
      "achievements.weekly.focusTime": (userData.achievements?.weekly?.focusTime || 0) + totalMinutes
    })
    } else {
      updateDoc(userRef, {
      "progress.xp": newXP,
      "progress.focusSessions": (userData.progress?.focusSessions || 0) + totalMinutes,
      "achievements.daily.sessionComplete": true,
      "achievements.weekly.focusTime": (userData.achievements?.weekly?.focusTime || 0) + totalMinutes
    }).then(() => {
      //console.log(`Session complete: +${gainedXP}xp, +${totalMinutes}min focus time`);
    });
    await checkLevelUp(userRef, userData);
    }
    
  }
}

function switchToFocus() {
  scheduleSection.style.opacity = '0';
  setTimeout(() => {
    scheduleSection.style.display = 'none';
    setTimeout(() => {
      focus.style.display = 'flex';
      setTimeout(() => {
        focus.style.opacity = '1';
        quote.style.opacity = '1';
        
      }, 240);
      }, 250);
    }, 450);

  focusBtn.setAttribute('id', 'on');
  scheduleBtn.removeAttribute('id');
}

function switchToSchedule() {
  focus.style.opacity = '0';
  quote.style.opacity = '0';
  setTimeout(() => {
    scheduleSection.style.display = 'block';
    setTimeout(() => {
      scheduleSection.style.opacity = '1';
      focus.style.display = 'none';
    }, 250);
  }, 350);

  scheduleBtn.setAttribute('id', 'on');
  focusBtn.removeAttribute('id');
}

focusBtn.addEventListener('click', switchToFocus);
scheduleBtn.addEventListener('click', switchToSchedule);

let selectedDays = [];

function createNumberList(container, from, to, pad = 2) {
  container.innerHTML = "";
  for (let i = 0; i < pad; i++) container.appendChild(document.createElement("li"));
  for (let i = from; i <= to; i++) {
    const li = document.createElement("li");
    li.textContent = i.toString().padStart(2, "0");
    li.classList.add("gradient");
    container.appendChild(li);
  }
  for (let i = 0; i < pad; i++) container.appendChild(document.createElement("li"));
}

function scrollToItem(column, item, smooth = true) {
  if (!item) return;
  const top = item.offsetTop - column.clientHeight / 2 + item.clientHeight / 2;
  column.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  column.querySelectorAll("li").forEach(li => li.classList.remove("active"));
  item.classList.add("active");
}

function updateActive(column) {
  const children = Array.from(column.children);
  let closest = null;
  let minDist = Infinity;
  const center = column.getBoundingClientRect().top + column.clientHeight / 2;

  children.forEach(child => {
    const rect = child.getBoundingClientRect();
    const childCenter = rect.top + rect.height / 2;
    const dist = Math.abs(childCenter - center);
    if (dist < minDist) {
      minDist = dist;
      closest = child;
    }
  });

  children.forEach(c => c.classList.remove("active"));
  if (closest) closest.classList.add("active");
}

function calculateEndTime(focusStartEl, focusEndEl, hourListEl, minuteListEl) {
  const activeHour = hourListEl.querySelector('.active')?.textContent;
  const activeMinute = minuteListEl.querySelector('.active')?.textContent;

  if (activeHour && activeMinute) {
    focusStartEl.querySelector('span').textContent = `${activeHour}:${activeMinute}`;
    
    const match = userTimeCommitment.match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?/i);
    const addH = parseInt(match?.[1] || '0', 10);
    const addM = parseInt(match?.[2] || '0', 10);

    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(activeHour),
      parseInt(activeMinute)
    );

    const endDate = new Date(startDate.getTime() + (addH * 60 + addM) * 60000);
    const endHour = endDate.getHours().toString().padStart(2, '0');
    const endMinute = endDate.getMinutes().toString().padStart(2, '0');

    focusEndEl.querySelector('span').textContent = `${endHour}:${endMinute}`;

  }
}

const closeBtn = document.getElementById("closeModal");

export function setupNewSessionModal(thisUser, userData) {
  const modal = document.getElementById("newSessionModal");
  const openBtn = document.getElementById("scheduleSession");

  const sessionsList = document.querySelector(".sessionsList");
  const scheduleHeader = document.querySelector(".schedule-header");

  if (!modal || !openBtn || !closeBtn) {
    console.warn("New Session Modal elements not found");
    return;
  }
  modal.dataset.editing=false;

  openBtn._latestUserData = userData;
  window.__booksyLatestUserData = userData;
  openBtn.dataset.booksyOpenAttached = "true";
  openBtn.addEventListener("click", () => {
      const latest = openBtn._latestUserData || window.__booksyLatestUserData || userData;

        modal.style.zIndex = "3";
        sessionsList.style.zIndex = "0";
        modal.style.opacity = "1";
        console.log('here')

        
      });
  if (!openBtn.dataset.booksyOpenAttached) {
    if (!modal.dataset.editing) {
    initScheduler(thisUser, latest, { resetForm: true });
  }

  }

  // Attach close listener only once
  if (!closeBtn.dataset.booksyCloseAttached) {
    closeBtn.dataset.booksyCloseAttached = "true";
    closeBtn.addEventListener("click", () => {
      modal.style.opacity = "0";
      modal.style.zIndex = "0";
      sessionsList.style.zIndex = "3";
    });
  }

  // Attach outside-click listener only once
  if (!window.__booksyModalOutsideAttached) {
    window.__booksyModalOutsideAttached = true;
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.opacity = "0";
        modal.style.zIndex = "0";
        sessionsList.style.zIndex = "3";
      }
    });
  }
}

export function attachMenuActions(card, sessId) {
  const deleteBtn = card.querySelector('.delete-session');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);

        await updateDoc(userRef, {
          [`focusSessionsSchedule.${sessId}`]: deleteField()
        });

        console.log(`Session ${sessId} deleted.`);
        renderFocusSessions(await getUserData(auth.currentUser.uid));
      } catch (err) {
        console.error("Error deleting session:", err);
      }
    });
  }
}

export function attachAssignBook(card, sess, sessId, userData) {
  const assignBtn = card.querySelector('.assignBook-session');
  const assignBookList = document.getElementById('assignBookList');
  if (assignBtn && assignBookList) {
    assignBtn.addEventListener('click', () => {
      console.log(sess)
      const sessName = sess || "Focus Session";
      assignBookList.innerHTML+=`<div style='display:flex;'><h3>Assign a book for</h3><em class="session-name">${sessName}</em></div>`;
      const closeBtn = document.createElement('span');
      closeBtn.className='close-assignBook-section';
      closeBtn.innerHTML ="&times;";
      const bookList = document.createElement('div');
      bookList.className = 'assign-book-list';
      assignBookList.appendChild(closeBtn);
      assignBookList.appendChild(bookList);

      closeBtn.addEventListener('click',()=>{
            assignBookList.style.opacity = '0';
            assignBookList.style.zIndex = '0';
            setTimeout(() => {
              assignBookList.innerHTML = '';
            }, 250);
      })

      const offlineBooks = (userData.library || []).filter(b => b.source === 'offline');
      
      assignBookList.style.opacity = '1';
      assignBookList.style.zIndex = '4';

      if (!offlineBooks.length) {
        assignBookList.style.display = 'block';
        document.querySelector('.assign-book-list').style.display = 'block';
        bookList.innerHTML = '<p>No offline books in your library.</p>';
        return;
      }
      offlineBooks.forEach(book => {
        const bookDiv = document.createElement('div');
        bookDiv.className = "assign-book-item";
        console.log(book.cover)
        bookDiv.innerHTML = `
          <img src='${book.cover}' alt='${book.title} by ${book.author}'>
          <div>
            <strong>${book.title}</strong> 
            <em>${book.author}</em>
          </div>
        `;
        
        bookDiv.addEventListener('click', async () => {
          try {
            const userRef = doc(db, "users", auth.currentUser.uid);

            await updateDoc(userRef, {
              [`focusSessionsSchedule.${sessId}.assignedBook`]: book
            });
            assignBookList.style.opacity = '0';
            assignBookList.style.zIndex = '0';
            setTimeout(() => {
              assignBookList.innerHTML = ""; 
            }, 250);

            //renderFocusSessions(await getUserData(auth.currentUser.uid));
          } catch (err) {
            console.error("Error assigning book:", err);
          }
        });

        bookList.appendChild(bookDiv);
      });
    });

  }
}

function addMinutesToTime(start, minutes) {
  const [h, m] = start.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0);
  date.setMinutes(date.getMinutes() + minutes);

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function attachEditSession(card, sess, sessId) {
  const editBtn = card.querySelector('.edit-session');
  if (!editBtn || !modal || !saveBtn) return;

  editBtn.addEventListener('click', () => {
    modal.dataset.editing = 'true';
    modal.dataset.editId = sessId;
    modal.style.zIndex = "4";
    modal.style.opacity = '1';

    document.getElementById("sessionName").value = sess.name || "";
    document.getElementById("readingMode").value = sess.readingMode || "onBooksy";

    const start = sess.focusStart || "--:--";
    document.querySelector("#focus-start span").textContent = start;

    const commitment = sess.timeCommitment || "15 min";
    let durationMin = 15;
    if (commitment.includes("min")) durationMin = parseInt(commitment);
    if (commitment.includes("h")) durationMin = parseFloat(commitment) * 60;

    const endTime = start !== "--:--" ? addMinutesToTime(start, durationMin) : "--:--";
    document.querySelector("#focus-end span").textContent = endTime;

    // Restore chosen duration button
    [...document.querySelectorAll("#time p")].forEach(p => {
      p.classList.toggle("chosen", p.textContent === commitment);
    });

    const selectedDays = sess.selectedDays || [];
    [...document.querySelectorAll("#day-picker p")].forEach(p => {
      if (selectedDays.includes(p.id)) {
        p.classList.add("chosen");
        p.style.padding = "10px 18px";
        p.style.backgroundColor = "#0000000e";
      } else {
        p.classList.remove("chosen");
        p.style.padding = "8px 14px";
        p.style.backgroundColor = "transparent";
      }
    });

function addMinutesToTime(timeStr, minutesToAdd) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutesToAdd;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const endH = Math.floor(wrapped / 60);
  const endM = wrapped % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

function diffMinutes(startStr, endStr) {
  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end < start) end += 1440;
  return end - start;
}

function formatCommitment(minutes) {
  if (minutes % 60 === 0) return `${minutes / 60} h`;
  if (minutes > 60) return `${(minutes / 60)} h`;
  return `${minutes} min`;
}

saveBtn.onclick = async () => {
  console.log('editted')
  try {
    const startTime = document.querySelector("#focus-start span").textContent;
    const userChosenEl = document.querySelector("#time .chosen");
    let chosen;
    let minutes = null;

    if (userChosenEl && userChosenEl.textContent!=='customize') {
      userTimeCommitment = userChosenEl.textContent;
      if (userTimeCommitment.includes("min")) minutes = parseInt(userTimeCommitment);
      if (userTimeCommitment.includes("h")) minutes = parseFloat(userTimeCommitment) * 60;
      if (!minutes) {
      if (startTime !== "--:--" && sessEnd !== "--:--") {
        userTimeCommitment = diffMinutes(startTime, sessEnd);
        userTimeCommitment = formatCommitment(minutes);
      } else {
        userTimeCommitment = sess?.timeCommitment || "15 min";
        if (userTimeCommitment.includes("min")) minutes = parseInt(userTimeCommitment);
        if (userTimeCommitment.includes("h")) minutes = parseFloat(userTimeCommitment) * 60;
      }
    }
    }

    const sessEnd = sess?.focusEnd || "--:--";


    const calcEnd = startTime !== "--:--" ? addMinutesToTime(startTime, minutes) : sessEnd;

    const userRef = doc(db, "users", auth.currentUser.uid);
    console.log(chosen, userTimeCommitment)
    await updateDoc(userRef, {
      [`focusSessionsSchedule.${sessId}`]: {
        ...sess,
        name: document.getElementById("sessionName").value,
        readingMode: document.getElementById("readingMode").value,
        focusStart: startTime,
        focusEnd: calcEnd,
        timeCommitment: userTimeCommitment,
        selectedDays: [...document.querySelectorAll("#day-picker p.chosen")].map(p => p.id)
      }
    });

    closeModalClean();
     modal.dataset.editing = 'false';
      openBtn.dataset.booksyOpenAttached = "true";
  } catch (err) {
    console.error("Error updating session:", err);
  }
};

    closeBtn.addEventListener("click", closeModalClean, { once: true });
  });
}

function closeModalClean() {
  document.getElementById("sessionName").value = "";
  document.getElementById("readingMode").value = "onBooksy";
  document.querySelector("#focus-start span").textContent = "--:--";
  document.querySelector("#focus-end span").textContent = "--:--";
    const focusStart = document.getElementById('focus-start');
  const focusEnd = document.getElementById('focus-end');
    const hourList = document.getElementById('hour-list');
  const minuteList = document.getElementById('minute-list');

    calculateEndTime(focusStart, focusEnd, hourList, minuteList);
  [...document.querySelectorAll("#time p")].forEach((p, i) => {
    p.classList.toggle("chosen", i === 0);
  });

  [...document.querySelectorAll("#day-picker p")].forEach(p => {
    p.classList.remove("chosen");
    p.style.padding = "8px 14px";
    p.style.backgroundColor = "transparent";
  });

  delete modal.dataset.editing;
  delete modal.dataset.editId;
  modal.style.opacity = "0";
  setTimeout(() => modal.style.zIndex = "-1", 200);
}

function parseDurationToMinutes(str) {
  if (!str || typeof str !== 'string') return 15;
  str = str.trim().toLowerCase();

  const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*h/);
  const minuteMatch = str.match(/(\d+)\s*min/);
  const minutesFromHours = hourMatch ? Math.round(parseFloat(hourMatch[1]) * 60) : 0;
  const minutesFromMinutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;

  if (!hourMatch && !minuteMatch) {
    const plain = str.replace(/\s+/g, '');
    const m = plain.match(/^(\d+)min$/);
    if (m) return parseInt(m[1], 10);
    const hOnly = plain.match(/^(\d+(\.\d+)?)h$/);
    if (hOnly) return Math.round(parseFloat(hOnly[1]) * 60);
  }
  const total = minutesFromHours + minutesFromMinutes;
  return total > 0 ? total : 15;
}

function getActiveStart(hourList, minuteList, focusStartEl) {
  const hourLi = [...hourList.children].find(li => li.classList.contains('active'));
  const minuteLi = [...minuteList.children].find(li => li.classList.contains('active'));
  const hh = hourLi ? hourLi.textContent.trim().padStart(2, '0') : '00';
  const mm = minuteLi ? minuteLi.textContent.trim().padStart(2, '0') : '00';
  const value = `${hh}:${mm}`;
  if (focusStartEl) {
    const sp = focusStartEl.querySelector('span');
    if (sp) sp.textContent = value;

  }
  return value;
}

function calculateEndtime(focusStartEl, focusEndEl, hourList, minuteList, durationString) {

  const start = getActiveStart(hourList, minuteList, focusStartEl);

  let duration = durationString;
  if (!duration) {
    const chosen = document.querySelector('#time .chosen');
    duration = chosen ? chosen.textContent.trim() : null;
  }

  const minutes = parseDurationToMinutes(duration);
  const end = start && start !== "--:--" ? addMinutesToTime(start, minutes) : "--:--";

  if (focusEndEl) {
    const sp = focusEndEl.querySelector('span');
    if (sp) sp.textContent = end;
  }

  return { start, end, minutes };
}

export async function initScheduler(thisUser, userData = {}) {
  const focusScheduler = document.getElementById('focus-scheduler');
  const focusStart = document.getElementById('focus-start');
  const focusEnd = document.getElementById('focus-end');
  const scrollPicker = document.getElementById('scroll-picker');
  const hourList = document.getElementById('hour-list');
  const minuteList = document.getElementById('minute-list');
  const confirmBtn = document.getElementById('confirm-time-picker');
  const frequency = document.querySelector('.frequency');
  const time = document.getElementById('time');
  const timeOptions = document.querySelectorAll('#time p');
  const customDurationPicker = document.getElementById('custom-duration-picker');
  const confirmDurationBtn = document.getElementById('confirm-duration-picker');
  const durationHourList = document.getElementById('duration-hour-list');
  const durationMinuteList = document.getElementById('duration-minute-list');
  const dayPicker = document.getElementById('day-picker');
  const dayElements = dayPicker?.querySelectorAll('p') || [];
  const selectAll = document.getElementById('setEveryday');
  const readingModeSel = document.getElementById('readingMode');
  const sessionNameInput = document.getElementById('sessionName');
  const saveSessionBtn = document.getElementById('saveSession');
  const closeModalBtn = document.getElementById('closeModal');
  createNumberList(hourList, 0, 23);
  createNumberList(minuteList, 0, 59);
  for (let i = 0; i < 2; i++) durationHourList.appendChild(document.createElement('li'));
  for (let i = 0; i <= 5; i++) {
    const li = document.createElement('li'); li.textContent = i.toString().padStart(2, '0'); li.classList.add('gradient'); durationHourList.appendChild(li);
  }
  for (let i = 0; i < 2; i++) durationHourList.appendChild(document.createElement('li'));

  for (let i = 0; i < 2; i++) durationMinuteList.appendChild(document.createElement('li'));
  for (let i = 0; i <= 59; i++) {
    const li = document.createElement('li'); li.textContent = i.toString().padStart(2, '0'); li.classList.add('gradient'); durationMinuteList.appendChild(li);
  }
  for (let i = 0; i < 2; i++) durationMinuteList.appendChild(document.createElement('li'));
  
  timeOptions.forEach(o => {
    if (o.textContent.trim() === userTimeCommitment) {
      timeOptions.forEach(x => x.classList.remove('chosen'));
      o.classList.add('chosen');
    }
  });

  selectedDays = [];
  const defaultHourIndex = 8; 
  const defaultMinuteIndex = 30; 
  const defaultHour = hourList.querySelectorAll('li')[defaultHourIndex + 2];
  const defaultMinute = minuteList.querySelectorAll('li')[defaultMinuteIndex + 2];

  if (defaultHour) { defaultHour.classList.add('active'); scrollToItem(hourList, defaultHour, false); }
  if (defaultMinute) { defaultMinute.classList.add('active'); scrollToItem(minuteList, defaultMinute, false); }
  calculateEndTime(focusStart, focusEnd, hourList, minuteList);
  focusStart.addEventListener('click', () => {
    scrollPicker.style.display = 'flex';
    time.style.filter = 'blur(12px)';
    frequency.style.filter = 'blur(12px)';

    confirmBtn.style.display = 'block';
    setTimeout(() => { scrollPicker.style.opacity = '1'; confirmBtn.style.opacity = '1'; }, 200);
    focusStart.classList.add('active');

    const hourItem = [...hourList.children].find(li => li.classList.contains('active'));
    const minuteItem = [...minuteList.children].find(li => li.classList.contains('active'));

    if (hourItem && minuteItem) {
      scrollToItem(hourList, hourItem, false);
      scrollToItem(minuteList, minuteItem, false);
      setTimeout(() => { updateActive(hourList); updateActive(minuteList); calculateEndTime(focusStart, focusEnd, hourList, minuteList); }, 400);
    }
  });

  confirmBtn.addEventListener('click', () => {
    scrollPicker.style.opacity = '0';
    time.style.filter = 'blur(0px)';
    frequency.style.filter = 'blur(0px)';
    confirmBtn.style.opacity = '0';
    setTimeout(() => { scrollPicker.style.display = 'none'; confirmBtn.style.display = 'none'; }, 200);
    focusStart.classList.remove('active');
  });

  [hourList, minuteList].forEach(list => {
    list.addEventListener('click', (e) => {
      if (e.target.tagName === 'LI') {
        scrollToItem(list, e.target);
      }
    });
    let scrollTimeout;
    list.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        updateActive(hourList);
        updateActive(minuteList);
        getActiveStart(hourList,minuteList,focusStart)
        calculateEndTime(focusStart, focusEnd, hourList, minuteList,userTimeCommitment);
      }, 250);
    });
  });

  timeOptions.forEach(option => {
    option.addEventListener('click', () => {
      timeOptions.forEach(o => o.classList.remove('chosen'));
      const isCustom = option.id === 'editEndTime';
      if (isCustom) {
        option.classList.add('chosen');
        customDurationPicker.style.display = 'flex';
        confirmDurationBtn.style.display = 'block';
        setTimeout(() => { customDurationPicker.style.opacity = '1'; confirmDurationBtn.style.opacity = '1'; }, 200);
        time.style.filter = 'blur(12px)';
        frequency.style.filter = 'blur(12px)';
        durationHourList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        durationMinuteList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        const defaultHour = durationHourList.querySelector('li:nth-child(3)');
        const defaultMinute = durationMinuteList.querySelector('li:nth-child(33)');
        defaultHour?.classList.add('active'); defaultMinute?.classList.add('active');
        scrollToItem(durationHourList, defaultHour, false);
        scrollToItem(durationMinuteList, defaultMinute, false);
      } else {
        option.classList.add('chosen');
        time.style.filter = 'blur(0px)';
        frequency.style.filter = 'blur(0px)';
        userTimeCommitment = option.textContent.trim();
        customDurationPicker.style.opacity = '0';
        confirmDurationBtn.style.opacity = '0';
        setTimeout(() => { customDurationPicker.style.display = 'none'; confirmDurationBtn.style.display = 'none'; }, 200);
        calculateEndtime(focusStart, focusEnd, hourList, minuteList, userTimeCommitment);
      }
    });
  });

confirmDurationBtn.addEventListener('click', () => {
  const hour = durationHourList.querySelector('.active')?.textContent || '00';
  const minute = durationMinuteList.querySelector('.active')?.textContent || '00';
  const h = parseInt(hour, 10), m = parseInt(minute, 10);
  if (h === 0 && m === 0) return alert("Please select more than 0 minutes.");

  userTimeCommitment = h > 0 ? `${h}h ${m}min` : `${m}min`;
  console.log('confirm',userTimeCommitment)
  const start = document.querySelector("#focus-start span").textContent;
  if (start && start !== "--:--") {
    const total = h * 60 + m;
    const end = addMinutesToTime(start, total);
    document.querySelector("#focus-end span").textContent = end;
  }

  customDurationPicker.style.opacity = '0';
  confirmDurationBtn.style.opacity = '0';
  time.style.filter = 'blur(0px)';
  frequency.style.filter = 'blur(0px)';

  setTimeout(() => {
    customDurationPicker.style.display = 'none';
    confirmDurationBtn.style.display = 'none';
  }, 200);
});


  [durationHourList, durationMinuteList].forEach(list => {
    list.addEventListener('click', e => {
      if (e.target.tagName === 'LI') scrollToItem(list, e.target);
    });
    list.addEventListener('scroll', () => {
      clearTimeout(list._deb);
      list._deb = setTimeout(() => {
        updateActive(durationHourList);
        updateActive(durationMinuteList);
      }, 200);
    });
  });

  dayElements.forEach(day => {
    day.addEventListener('click', () => {
      day.classList.toggle("chosen");

      if (day.classList.contains("chosen")) {
        day.style.padding = "10px 18px";
        day.style.backgroundColor = "#0000000e";
      } else {
        day.style.padding = "8px 14px";
        day.style.backgroundColor = "transparent";
      }

      console.log("Selected days:", 
        [...document.querySelectorAll("#day-picker p.chosen")].map(p => p.id)
      );
    });
  });
  if (!saveSessionBtn.dataset.booksySaveAttached) {
    saveSessionBtn.dataset.booksySaveAttached = "true";

    saveSessionBtn.addEventListener("click", async () => {
      if (modal.dataset.editing) return;

      const uid =
        (thisUser && thisUser.uid) || (auth.currentUser && auth.currentUser.uid);
      if (!uid) {
        alert("No signed-in user found. Can't save session.");
        return;
      }
      const start = focusStart.querySelector("span").textContent;
      const end = focusEnd.querySelector("span").textContent;
      const commit = userTimeCommitment || "15 min";
      const readingMode = readingModeSel.value || "onBooksy";
      const name = (sessionNameInput.value || "").trim() || "Focus Session";
      console.log(commit)
      const sessionId = `s_${Date.now()}`;
      const newSession = {
        id: sessionId,
        name,
        focusStart: start,
        focusEnd: end,
        timeCommitment: commit,
        readingMode,
        selectedDays: [...document.querySelectorAll("#day-picker p.chosen")]
          .map(p => p.id),
        assignedBook: null,
        createdAt: new Date().toISOString(),
      };

      try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
          [`focusSessionsSchedule.${sessionId}`]: newSession,
        });

        console.log("New session created:", sessionId);

        // close modal
        if (closeModalBtn) closeModalBtn.click();
      } catch (err) {
        console.error("Error saving session:", err);
        alert("Failed to save session. Check console.");
      }
    });
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', () => {
    const modal = document.getElementById('newSessionModal');
    if (modal) {
      modal.style.opacity = '0';
      modal.style.zIndex = '-1';
    }
  });
} 

function toMinutes(hhmm) {
  if (!hhmm || !hhmm.includes(":")) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function commitmentToSeconds(commitment) {
  if (!commitment) return 0;
  commitment = commitment.toLowerCase().replace(/\s+/g, ""); 

  const hMatch = commitment.match(/(\d+)h/);

  const mMatch = commitment.match(/(\d+)(?:min|m)/);

  const h = hMatch ? parseInt(hMatch[1], 10) : 0;
  const m = mMatch ? parseInt(mMatch[1], 10) : 0;

  return h * 3600 + m * 60;
}

let __focus_monitor_interval_id = null;
let __focus_monitor_started = false;
let __latestMonitorUserData = null;
let activeSession = null;

function minutesFromHHMM(hhmm) {
  if (!hhmm || typeof hhmm !== "string" || !hhmm.includes(":")) return null;
  const [hh, mm] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}
export function monitorSessions(userData) {
  try {

    if (__focus_monitor_started) {
      __latestMonitorUserData = userData;
      return;
    }

    __focus_monitor_started = true;
    __latestMonitorUserData = userData;

    const checkAndLaunch = () => {
      try {
        const ud = __latestMonitorUserData || userData;
        if (!ud) return;

        const schedule = ud.focusSessionsSchedule || {};
        if (!Object.keys(schedule).length) return;

        const now = new Date();
        const minutesNow = now.getHours() * 60 + now.getMinutes();
        const secondsNow =
          now.getHours() * 3600 +
          now.getMinutes() * 60 +
          now.getSeconds();

        const shortDay = now
          .toLocaleDateString("en-US", { weekday: "short" })
          .toLowerCase();

        const daysMap = {
            sun: "sunday",
            mon: "monday",
            tue: "tuesday",
            wed: "wednesday",
            thu: "thursday",
            fri: "friday",
            sat: "saturday"
        };

        const currentDay = daysMap[shortDay] || shortDay;

        const launch = (sess, sessId, reason) => {
          if (!activeSession) {
            activeSession = sess;
            console.log(
              "monitorSessions: LAUNCHING SESSION",
              sessId,
              "reason:",
              reason
            );
            try {
              launchFocusSession(sess);
            } catch (err) {
              console.error("launchFocusSession error:", err);
            }
          } else {
            console.log("monitorSessions: session already active, skip");
          }
        };

        for (const [sessId, sess] of Object.entries(schedule)) {
          try {
            if (!sess) continue;

            const selectedDays = sess.selectedDays || [];
            if (!selectedDays.includes(currentDay)) continue;

            const startMin = minutesFromHHMM(sess.focusStart);
            if (startMin === null) continue;

            const duration = parseInt(sess.timeCommitment, 10) || 0;
            const endMin = startMin + duration;

            const startSeconds = startMin * 60;
            const deltaSeconds = Math.abs(secondsNow - startSeconds);

            if (deltaSeconds <= 59) {
              launch(sess, sessId, "exact match");
              continue;
            }

            if (minutesNow > startMin && minutesNow < endMin) {
              launch(sess, sessId, "late but active");
              continue;
            }

          } catch (err) {
            console.error("monitorSessions: session loop error", err);
          }
        }
      } catch (err) {
        console.error("monitorSessions internal error:", err);
      }
    };
    checkAndLaunch();

    __focus_monitor_interval_id = setInterval(checkAndLaunch, 5000);
  } catch (err) {
    console.error("monitorSessions: failed to start:", err);
  }
}

function launchFocusSession(sess) {

  switchToFocus();

  const title = document.querySelector(".startSession h2");
  if (title) title.textContent = sess.name || "Focus Session";

  const assignBookContainer = document.querySelector(".startSession .actions div p");
  if (assignBookContainer) {
    assignBookContainer.textContent = sess.assignedBook
      ? `Book: ${sess.assignedBook}`
      : "No book assigned";
  }

  const totalSeconds = commitmentToSeconds(sess.timeCommitment);

  clearInterval(timerInterval);
  remainingSeconds = totalSeconds;
  isPaused = false;

  const displayEl = document.querySelector(".startSession .timer");
  if (!displayEl) return;
  startBtn.textContent = "Pause";
  
  scheduleBtn.removeEventListener("click", switchToSchedule);

  timerInterval = setInterval(() => {
    if (!isPaused && remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();
    }

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      startBtn.textContent = "Start";
      activeSession = null;
      showSessionComplete(__latestMonitorUserData, auth.currentUser, false, 70);
    }
  }, 1000);


  updateTimerDisplay();
}

function startCountdown(seconds, displayEl, onFinish) {
  let remaining = seconds;
  let timerId = null;   // <-- Declare FIRST

  function tick() {
    const h = String(Math.floor(remaining / 3600)).padStart(1, "0");
    const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    displayEl.textContent = `${h}:${m}:${s}`;

    if (remaining <= 0) {
      clearInterval(timerId);
      if (onFinish) onFinish();
    } else {
      remaining -= 1;
    }
  }

  tick();
  timerId = setInterval(tick, 1000); 
}


export async function initThemePicker(thisUser) {
  if (!thisUser) return;

  const userRef = doc(db, "users", thisUser.uid);
  const bgImg = document.querySelector(".bg");
  const focusThemes = document.querySelectorAll(".focus-theme");
  const globalThemes = document.querySelectorAll(".theme-option");
  let userData;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) userData = snap.data();
  } catch (err) {
    console.error("Error loading user themes:", err);
  }

  const savedFocusTheme = userData?.focusTheme || null;
  const savedGlobalTheme = userData?.globalTheme || null;

  if (savedFocusTheme) {
    focusThemes.forEach((img) => {
      
      if (img.src === savedFocusTheme) {
        img.id = "pickedTheme";
      } else {
        img.removeAttribute("id");
      }
    });
  }

  if (savedGlobalTheme) {

    if (bgImg) bgImg.src = savedGlobalTheme;

    globalThemes.forEach((img) => {
      if (img.src === savedGlobalTheme) {
        img.id = "pickedTheme";
      } else {
        img.removeAttribute("id");
      }
    });
      
  }

  focusThemes.forEach((img) => {
    img.addEventListener("click", async () => {
      focusThemes.forEach((i) => i.removeAttribute("id"));
      img.id = "pickedTheme";

      try {
        await updateDoc(userRef, { focusTheme: img.src });
        showToast("🎯 Focus theme updated!");
      } catch (err) {
        showToast("❌ Could not update focus theme.");
      }
    });
  });


  globalThemes.forEach((img) => {
    img.addEventListener("click", async () => {
      globalThemes.forEach((i) => i.removeAttribute("id"));
      img.id = "pickedTheme";

      try {
        await updateDoc(userRef, { globalTheme: img.src });

        if (bgImg) {
          
            bgImg.src = img.src;
            bgImg.style.opacity='1';
          
          
        }
      } catch (err) {

        showToast("❌ Could not update theme.");
      }
    });
  });
}

export function renderFocusSessions(userData) {
      const container = document.querySelector('.sessionsList');
      if (!container) return;
      container.innerHTML='';
      const scheduleSession = document.createElement('div');
      scheduleSession.id='scheduleSession';
      scheduleSession.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M9 20H6C3.79086 20 2 18.2091 2 16V7C2 4.79086 3.79086 3 6 3H17C19.2091 3 21 4.79086 21 7V10" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M8 2V4" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M15 2V4" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M2 8H21" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M18.5 15.6429L17 17.1429" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <circle cx="17" cy="17" r="5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle> </g></svg>
        <h3>Schedule a new session</h3>
      `;
      container.appendChild(scheduleSession)
      const schedule = userData.focusSessionsSchedule || {};
      const sessions = Object.entries(schedule);

      if (!sessions.length) {
        const info = document.createElement('p');
        info.classList.add('noSessions');
        info.textContent = 'No focus sessions scheduled yet.';
        container.appendChild(info);
        return;
      }

      const allDays = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

      sessions.forEach(([id, sess]) => {
        const card = document.createElement('div');
        card.className = 'session-card';
        const assignedBook = sess.assignedBook;
        const daysRow = allDays.map(d => {
          const isActive = sess.selectedDays.includes(d);
          return `<span class="day ${isActive ? "active" : ""}">${d[0].toUpperCase()}</span>`;
        }).join("");

        if (assignedBook) {
          const progress = assignedBook.totalPages
            ? Math.round((assignedBook.currentPage / assignedBook.totalPages) * 100)
            : (assignedBook.progress || 0);

          card.innerHTML = `
            <svg class="session-menu assigned" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6C12.5523 6 13 5.55228 13 5Z" stroke="#ffffff" stroke-width="2"/>
              <path d="M13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12Z" stroke="#ffffff" stroke-width="2"/>
              <path d="M13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19Z" stroke="#ffffff" stroke-width="2"/>
            </svg>
            <div class='menu'>
              <p class='close-menu'>Back</p>
              <div class='menu-actions'>
              <div class='assignBook-session'>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3 6.1519V19.3095C3.99197 18.8639 5.40415 18.4 7 18.4C8.58915 18.4 9.9999 18.8602 11 19.3094V6.1519C10.7827 6.02653 10.4894 5.8706 10.1366 5.71427C9.31147 5.34869 8.20352 5 7 5C5.26385 5 3.74016 5.72499 3 6.1519ZM13 6.1519V19.3578C13.9977 18.9353 15.41 18.5 17 18.5C18.596 18.5 20.0095 18.9383 21 19.3578V6.1519C20.2598 5.72499 18.7362 5 17 5C15.7965 5 14.6885 5.34869 13.8634 5.71427C13.5106 5.8706 13.2173 6.02653 13 6.1519ZM12 4.41985C11.7302 4.26422 11.3734 4.07477 10.9468 3.88572C9.96631 3.45131 8.57426 3 7 3C4.69187 3 2.76233 3.97065 1.92377 4.46427C1.30779 4.82687 1 5.47706 1 6.11223V20.0239C1 20.6482 1.36945 21.1206 1.79531 21.3588C2.21653 21.5943 2.78587 21.6568 3.30241 21.3855C4.12462 20.9535 5.48348 20.4 7 20.4C8.90549 20.4 10.5523 21.273 11.1848 21.6619C11.6757 21.9637 12.2968 21.9725 12.7959 21.6853C13.4311 21.32 15.0831 20.5 17 20.5C18.5413 20.5 19.9168 21.0305 20.7371 21.4366C21.6885 21.9075 23 21.2807 23 20.0593V6.11223C23 5.47706 22.6922 4.82687 22.0762 4.46427C21.2377 3.97065 19.3081 3 17 3C15.4257 3 14.0337 3.45131 13.0532 3.88572C12.6266 4.07477 12.2698 4.26422 12 4.41985Z" fill="#ffffff"></path> </g></svg>
                    <p>Assign a book</p>
                </div>
                <div class='edit-session'>
                    <svg  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.9445 9.1875L14.9445 5.1875M18.9445 9.1875L13.946 14.1859C13.2873 14.8446 12.4878 15.3646 11.5699 15.5229C10.6431 15.6828 9.49294 15.736 8.94444 15.1875C8.39595 14.639 8.44915 13.4888 8.609 12.562C8.76731 11.6441 9.28735 10.8446 9.946 10.1859L14.9445 5.1875M18.9445 9.1875C18.9445 9.1875 21.9444 6.1875 19.9444 4.1875C17.9444 2.1875 14.9445 5.1875 14.9445 5.1875M20.5 12C20.5 18.5 18.5 20.5 12 20.5C5.5 20.5 3.5 18.5 3.5 12C3.5 5.5 5.5 3.5 12 3.5" 
                    stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    <p>Edit details</p>
                </div>
                <div class='delete-session'>
                  <svg viewBox="0 0 24 24" fill="none"><path d="M12 19H5c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h4.6L12 7h7c1.1 0 2 .9 2 2v2" stroke="red" stroke-width="2"/><path d="M16 15l2.5 2.5M21 20l-2.5-2.5M18.5 17.5L21 15M18.5 17.5L16 20" stroke="red" stroke-width="2"/></svg>
                  <p>Delete session</p>
                </div>
              </div>
            </div>
            </div>
            <div class="session-card-main">
                <div class="session-assigned-book">
                <svg class="book-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M3 6.1519V19.3095C3.99197 18.8639 5.40415 18.4 7 18.4C8.58915 18.4 9.9999 18.8602 11 19.3094V6.1519C10.7827 6.02653 10.4894 5.8706 10.1366 5.71427C9.31147 5.34869 8.20352 5 7 5C5.26385 5 3.74016 5.72499 3 6.1519ZM13 6.1519V19.3578C13.9977 18.9353 15.41 18.5 17 18.5C18.596 18.5 20.0095 18.9383 21 19.3578V6.1519C20.2598 5.72499 18.7362 5 17 5C15.7965 5 14.6885 5.34869 13.8634 5.71427C13.5106 5.8706 13.2173 6.02653 13 6.1519ZM12 4.41985C11.7302 4.26422 11.3734 4.07477 10.9468 3.88572C9.96631 3.45131 8.57426 3 7 3C4.69187 3 2.76233 3.97065 1.92377 4.46427C1.30779 4.82687 1 5.47706 1 6.11223V20.0239C1 20.6482 1.36945 21.1206 1.79531 21.3588C2.21653 21.5943 2.78587 21.6568 3.30241 21.3855C4.12462 20.9535 5.48348 20.4 7 20.4C8.90549 20.4 10.5523 21.273 11.1848 21.6619C11.6757 21.9637 12.2968 21.9725 12.7959 21.6853C13.4311 21.32 15.0831 20.5 17 20.5C18.5413 20.5 19.9168 21.0305 20.7371 21.4366C21.6885 21.9075 23 21.2807 23 20.0593V6.11223C23 5.47706 22.6922 4.82687 22.0762 4.46427C21.2377 3.97065 19.3081 3 17 3C15.4257 3 14.0337 3.45131 13.0532 3.88572C12.6266 4.07477 12.2698 4.26422 12 4.41985Z" fill="#ffffff"/>
                </svg>
                <div class="book-info">
                  <h4>${assignedBook.title}</h4>
                  <p>${assignedBook.author}</p>
                </div>
                <div class="progress">${progress}%</div>
              </div>
              <div class="session-meta">
                <div>
                  <p>⏰ ${sess.focusStart}</p>
                  <span>time</span>
                </div>
                <div>
                  <p>⏳ ${sess.timeCommitment}</p>
                  <span>duration</span>
                </div>
                <div>
                  <p>📖 ${sess.readingMode === 'onBooksy' ? 'In Booksy' : 'Off Booksy'}</p>
                  <span>reading</span>
                </div>
              </div>
              <div class="session-days">${daysRow}</div>
            </div>
          `;
          container.appendChild(card);
          const sessionCardMain = document.querySelector('.session-card-main');
          sessionCardMain.style.paddingTop = '0px';
          
        } else {
          card.innerHTML = `
            <div class='menu'>
              <p class='close-menu'>Back</p>
              <div class='menu-actions'>
              <div class='assignBook-session'>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3 6.1519V19.3095C3.99197 18.8639 5.40415 18.4 7 18.4C8.58915 18.4 9.9999 18.8602 11 19.3094V6.1519C10.7827 6.02653 10.4894 5.8706 10.1366 5.71427C9.31147 5.34869 8.20352 5 7 5C5.26385 5 3.74016 5.72499 3 6.1519ZM13 6.1519V19.3578C13.9977 18.9353 15.41 18.5 17 18.5C18.596 18.5 20.0095 18.9383 21 19.3578V6.1519C20.2598 5.72499 18.7362 5 17 5C15.7965 5 14.6885 5.34869 13.8634 5.71427C13.5106 5.8706 13.2173 6.02653 13 6.1519ZM12 4.41985C11.7302 4.26422 11.3734 4.07477 10.9468 3.88572C9.96631 3.45131 8.57426 3 7 3C4.69187 3 2.76233 3.97065 1.92377 4.46427C1.30779 4.82687 1 5.47706 1 6.11223V20.0239C1 20.6482 1.36945 21.1206 1.79531 21.3588C2.21653 21.5943 2.78587 21.6568 3.30241 21.3855C4.12462 20.9535 5.48348 20.4 7 20.4C8.90549 20.4 10.5523 21.273 11.1848 21.6619C11.6757 21.9637 12.2968 21.9725 12.7959 21.6853C13.4311 21.32 15.0831 20.5 17 20.5C18.5413 20.5 19.9168 21.0305 20.7371 21.4366C21.6885 21.9075 23 21.2807 23 20.0593V6.11223C23 5.47706 22.6922 4.82687 22.0762 4.46427C21.2377 3.97065 19.3081 3 17 3C15.4257 3 14.0337 3.45131 13.0532 3.88572C12.6266 4.07477 12.2698 4.26422 12 4.41985Z" fill="#ffffff"></path> </g></svg>
                    <p>Assign a book</p>
                </div>
                <div class='edit-session'>
                    <svg  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.9445 9.1875L14.9445 5.1875M18.9445 9.1875L13.946 14.1859C13.2873 14.8446 12.4878 15.3646 11.5699 15.5229C10.6431 15.6828 9.49294 15.736 8.94444 15.1875C8.39595 14.639 8.44915 13.4888 8.609 12.562C8.76731 11.6441 9.28735 10.8446 9.946 10.1859L14.9445 5.1875M18.9445 9.1875C18.9445 9.1875 21.9444 6.1875 19.9444 4.1875C17.9444 2.1875 14.9445 5.1875 14.9445 5.1875M20.5 12C20.5 18.5 18.5 20.5 12 20.5C5.5 20.5 3.5 18.5 3.5 12C3.5 5.5 5.5 3.5 12 3.5" 
                    stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p>Edit details</p>
                </div>
                <div class='delete-session'>
                  <svg viewBox="0 0 24 24" fill="none"><path d="M12 19H5c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h4.6L12 7h7c1.1 0 2 .9 2 2v2" stroke="red" stroke-width="2"/><path d="M16 15l2.5 2.5M21 20l-2.5-2.5M18.5 17.5L21 15M18.5 17.5L16 20" stroke="red" stroke-width="2"/></svg>
                  <p>Delete session</p>
                </div>
              </div>
            </div>
            <div class="session-card-main">
              <div class="session-header">
                <svg class="session-menu " viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6C12.5523 6 13 5.55228 13 5Z" stroke="#ffffff" stroke-width="2"/>
                  <path d="M13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12Z" stroke="#ffffff" stroke-width="2"/>
                  <path d="M13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19Z" stroke="#ffffff" stroke-width="2"/>
                </svg>
                  <h4>${sess.name || 'Focus Session'}</h4>
                  <p class="noBook">no book assigned</p>
              </div>
              <div class="session-meta">
                <div>
                  <p>⏰ ${sess.focusStart}</p>
                  <span>time</span>
                </div>
                <div>
                  <p>⏳ ${sess.timeCommitment}</p>
                  <span>duration</span>
                </div>
                <div>
                  <p>📖 ${sess.readingMode === 'onBooksy' ? 'In Booksy' : 'Off Booksy'}</p>
                  <span>reading</span>
                </div>
              </div>
              <div class="session-days">${daysRow}</div>
            </div>
          `;
          container.appendChild(card);
        }
        const cardMain = card.querySelector('.session-card-main');
        const cardMenu = card.querySelector('.menu');
        card.querySelector('.session-menu').addEventListener('click', ()=>{
          cardMenu.style.opacity = '1';
          cardMenu.style.zIndex = '1';
          cardMenu.style.filter = 'blur(0px)';
          cardMain.style.filter = 'blur(10px)';
          cardMain.style.zIndex = '0';

        })
        card.querySelector('.close-menu').addEventListener('click', ()=>{
          cardMenu.style.opacity = '0';
          cardMenu.style.zIndex = '0';
          setTimeout(() => {
            cardMenu.style.filter = 'blur(10px)';
            cardMain.style.filter = 'blur(0px)';
            cardMain.style.zIndex = '2';
          }, 500);
        })
        

       
        attachMenuActions(card, id);
        attachAssignBook(card, sess.name, id, userData);
        attachEditSession(card, sess, id);

      });
}