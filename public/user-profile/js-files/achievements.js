import { auth, db } from "./firebase.js";
import { doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { checkLevelUp } from "./main.js";

export function showRewardPopup(icon = "🔮", title, message, rewardText ) {
  const achReward = document.querySelector(".achReward");
  if (!achReward) return;

  achReward.innerHTML = `
    <span>${icon}</span>
    <h2>${title}</h2>
    <p>${message}</p>
    <p class="rewardText">${rewardText}</p>
  `;
  achReward.style.display = "flex";
  setTimeout(() => {
    achReward.style.opacity = "1";
   setTimeout(() => {
      achReward.style.opacity = "0";
      setTimeout(() => {
        achReward.style.display = "none";
      }, 350);
    }, 3500);
  }, 300);
}

export function showToast(message) {
  const container = document.querySelector(".toast-container");
  if (!container) return;
  const toast = document.querySelector(".toast");
  const toastContainer = document.querySelector('.toast-container')
  const showStars = document.querySelector('.showStars');
  toast.textContent = message;
  const content = document.querySelector('.content');

  const articleReader = document.querySelector('.articleReader');
  const reader = document.querySelector('.reader-container')
  const navBar = document.querySelector('.nav-bar');
  const bg = document.querySelector('.bg')
  toastContainer.style.display = 'flex';
  setTimeout(() => {
    toast.classList.add("show");
    content.style.filter = 'blur(10px)';
    navBar.style.filter = 'blur(10px)';
    bg.style.filter = 'blur(10px) brightness(0.74)';
    if(document.querySelector('.light').style.opacity ==='1'){

      toast.style.color = 'black';
      reader.style.filter = 'blur(5px)';
    }
    if(articleReader.style.opacity==='1'){
      articleReader.style.opacity = '0.35';
      articleReader.style.filter = 'blur(5px)';
    }
  }, 1680);
   setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toastContainer.style.display = 'none'
      toast.innerHTML='';
      toast.style.color = '#fff';
      bg.style.filter = 'brightness(0.74)';
      navBar.style.removeProperty('filter');
      content.style.removeProperty('filter');
      if(reader.style.opacity ==='0.35'){
        reader.style.opacity = '1';
        reader.style.removeProperty('filter');
      }
      if(articleReader.style.opacity==='0.35'){
        articleReader.style.opacity = '1';
        articleReader.style.removeProperty('filter');
      }
      setTimeout(() => {
        showStars.style.opacity = "1";
      }, 4000);
    }, 300);
  }, 4200);
  
}

function updateShowStars(userData) {
  const showStars = document.querySelector(".showStars");
  if (!showStars) return;
    const rewardDiv = document.querySelector('.daily-read');
   const progressP = rewardDiv.querySelector("p");
  const daily = userData.achievements?.daily || {};
  const weekly = userData.achievements?.weekly || {};

  const dailyUnclaimed =
    (daily.logIn === true) ||
    (daily.readArticle === true) ||
    (daily.sessionComplete === true) ||
    ((daily.readPages || 0) >= 20 && progressP==='Done');

  const weeklyUnclaimed =
    (typeof weekly.readArticles === "number" && weekly.readArticles >= 7 && weekly.readArticles !== "claimed") ||
    (typeof weekly.readPages === "number" && weekly.readPages >= 100 && weekly.readPages !== "claimed") ||
    (typeof weekly.focusTime === "number" && weekly.focusTime >= 150 && weekly.focusTime !== "claimed") ||
    (typeof weekly.streak === "number" && weekly.streak >= 5 && weekly.streak !== "claimed") ||
    (weekly.finishedBook === true);

  if (dailyUnclaimed || weeklyUnclaimed) {
    showStars.style.opacity = "1";
  } else {
    showStars.style.opacity = "0";
  }
}

function updateProgressSpans(dailyData) {

  const logInSpan = document.querySelector(".log-in .ach-progress");
  if (logInSpan) {
    logInSpan.textContent = dailyData.logIn ? "1/1" : "0/1";
  }

  const articleSpan = document.querySelector(".daily-read-article .ach-progress");
  if (articleSpan) {
    articleSpan.textContent = dailyData.readArticle ? "1/1" : "0/1";
  }

  const sessionSpan = document.querySelector(".complete-session .ach-progress");
  if (sessionSpan) {
    sessionSpan.textContent = dailyData.sessionComplete ? "1/1" : "0/1";
  }

  const pagesSpan = document.querySelector(".daily-read .ach-progress");
  if (pagesSpan) {
    pagesSpan.textContent = `${dailyData.readPages || 0}/20`;
  }
}

function updateWeeklySpans(weeklyData) {
  const articlesSpan = document.querySelector(".weekly-articles .ach-progress");
  if (articlesSpan) {
    articlesSpan.textContent = `${weeklyData.readArticles || 0}/7`;
  }
  const pagesSpan = document.querySelector(".weekly-read .ach-progress");
  if (pagesSpan) {
    pagesSpan.textContent = `${weeklyData.readPages || 0}/100`;
  }
  const focusSpan = document.querySelector(".weekly-focus .ach-progress");
  if (focusSpan) {
    focusSpan.textContent = `${weeklyData.focusTime || 0}/150`;
  }
  const streakSpan = document.querySelector(".weekly-streak .ach-progress");
  if (streakSpan) {
    streakSpan.textContent = `${weeklyData.streak || 0}/5`;
  }
  const bookSpan = document.querySelector(".weekly-book .ach-progress");
  if (bookSpan) {
    bookSpan.textContent = weeklyData.finishedBook ? "1/1" : "0/1";
  }
}

export async function markArticleRead(userRef) {
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const data = snap.data();

    const today = new Date().toLocaleDateString("en-CA"); 

    if (data.dailyArticle?.date === today && data.achievements?.daily?.readArticle === true || data.achievements?.daily?.readArticle === 'claimed') {
      return;
    }

    await updateDoc(userRef, {
      "achievements.daily.readArticle": true,
      "achievements.weekly.readArticles": increment(1),
      "dailyArticle.date": today 
    });

  } catch (err) {
    console.error("Error marking article read:", err);
  }
}

export async function renderDailyAchievements(userData) {
  const dailyData = userData.achievements?.daily || {};
  const userRef = doc(db, "users", auth.currentUser.uid);
  updateProgressSpans(dailyData);

  const mapping = {
    readPages: document.querySelector(".daily-read .reward"),
    logIn: document.querySelector(".log-in .reward"),
    readArticle: document.querySelector(".daily-read-article .reward"),
    sessionComplete: document.querySelector(".complete-session .reward"),
    
  };

  for (let key in mapping) {
    const rewardDiv = mapping[key];
    if (!rewardDiv) continue;

    const progressP = rewardDiv.querySelector("p");
    const xpSpan = rewardDiv.querySelector(".earned-xp");
    const xpValue = parseInt(xpSpan?.id || "0");
    if (key !== "readPages"&& key!=="claimedPages") {
      const state = dailyData[key];

      if (state === false) {
        if(!progressP) rewardDiv.appendChild(document.createElement("p")).textContent = "In progress";
        rewardDiv.querySelector("button")?.remove();
      }

      if (state === true) {
        if (!rewardDiv.dataset.toastShown) {
          
          rewardDiv.dataset.toastShown = "1";
          if(key==='logIn'){
            setTimeout(() => {
              showToast(`🌟Daily achievement complete.`);
            }, 2000);
          } else {
            showToast(`🌟Daily achievement complete`);
          }
          
        }

        progressP?.remove();
        if (!rewardDiv.querySelector("button")) {
          const btn = document.createElement("button");

          btn.textContent = "Claim";
          btn.addEventListener("click", async () => {
            const snap = await getDoc(userRef);
            if (!snap.exists()) return;
            const data = snap.data();
            const newXp = (data.progress?.xp || 0) + xpValue;
            await updateDoc(userRef, {
              [`achievements.daily.${key}`]: "claimed",
              "progress.xp": newXp
            });

            btn.remove();
            if (progressP) {
              progressP.textContent = "✅";
              progressP.style.fontSize = '20px'
              progressP.style.opacity = '1';
              progressP.style.transform = 'translateX(-8px)';
            }
            else {
              const progressp = document.createElement('p');
              progressp.textContent = '✅';
              progressp.style.fontSize = '20px'
              progressp.style.opacity = '1';
              progressp.style.transform = 'translateX(-8px)';
              rewardDiv.appendChild(progressp)
            }      
            const updatedSnap = await getDoc(userRef);
            await checkLevelUp(userRef, updatedSnap.data());
            checkAllDailyComplete(userRef);
          });
          rewardDiv.appendChild(btn);
          rewardDiv.style.flexDirection = 'row';
        }
      }

      if (state === "claimed") {
        rewardDiv.querySelector("button")?.remove();
        if (progressP) {
          rewardDiv.style.flexDirection = 'row';
          progressP.textContent = "✅";
          progressP.style.fontSize = '20px'
          progressP.style.opacity = '1';
          progressP.style.transform = 'translateX(-8px)';
        }
        else {
          rewardDiv.style.flexDirection = 'row';
          const progressp = document.createElement('p');
          progressp.textContent = '✅';
          progressp.style.fontSize = '20px'
          progressp.style.opacity = '1';
          progressp.style.transform = 'translateX(-8px)';
          rewardDiv.appendChild(progressp);
        }
      }
    }
  
    if (key === "readPages" ) {
      const span = rewardDiv.parentElement.querySelector(".ach-progress");
      span.textContent = `${dailyData.readPages || 0}/20`;

      if ((dailyData.readPages || 0) >= 20) {
          rewardDiv.style.flexDirection = 'row';

        if (progressP) progressP.textContent = "✅";
          progressP.style.fontSize = '20px'
          progressP.style.opacity = '1';
          progressP.style.transform = 'translateX(-8px)';
        if (dailyData.claimedPages !=="claimed") {
          const newXp = (userData.progress?.xp || 0) + 60;
          showToast("Daily achievement complete: 20 pages read!");

          rewardDiv.dataset.toastShown = "1";
          await updateDoc(userRef, {
            'achievements.daily.claimedPages': "claimed",
            "progress.xp": newXp
          });
        } 
        
      }
    }
    if(key === 'sessionComplete') {
      return;
    };
  }
  
  updateShowStars(userData);
}

export async function renderWeeklyAchievements(userData) {
  const weeklyData = userData.achievements?.weekly || {};
  const userRef = doc(db, "users", auth.currentUser.uid);

  updateWeeklySpans(weeklyData);

  const mapping = {
    readArticles: document.querySelector(".weekly-articles .reward"),
    readPages: document.querySelector(".weekly-read .reward"),
    focusTime: document.querySelector(".weekly-focus .reward"),
    streak: document.querySelector(".weekly-streak .reward"),
    finishedBook: document.querySelector(".weekly-book .reward")
  };

  for (let key in mapping) {
    const rewardDiv = mapping[key];
    if (!rewardDiv) continue;

    const progressP = rewardDiv.querySelector("p");
    const xpSpan = rewardDiv.querySelector(".earned-xp");
    const xpValue = parseInt(xpSpan?.id || "0");
    const state = weeklyData[key];

    if (typeof state === "number") {
      let target = 0;
      if (key === "readArticles") target = 7;
      if (key === "readPages") target = 100;
      if (key === "focusTime") target = 150;
      if (key === "streak") target = 5;

      if (state >= target) {
        if (!rewardDiv.dataset.toastShown) {
          showToast(`⭐Weekly achievement complete`);
          rewardDiv.dataset.toastShown = "1";
        }

        progressP?.remove();
        if (!rewardDiv.querySelector("button") && state !== "claimed") {
          const btn = document.createElement("button");
          btn.textContent = "Claim";
          btn.addEventListener("click", async () => {
            const snap = await getDoc(userRef);
            if (!snap.exists()) return;
            const data = snap.data();
            const newXp = (data.progress?.xp || 0) + xpValue;

            await updateDoc(userRef, {
              [`achievements.weekly.${key}`]: "claimed",
              "progress.xp": newXp
            });
            const updatedSnap = await getDoc(userRef);
            await checkLevelUp(userRef, updatedSnap.data());
            btn.remove();
            rewardDiv.style.flexDirection = 'row';
            let progressP = document.createElement("p");
            rewardDiv.appendChild(progressP);
            progressP.textContent = "✅";
            progressP.style.fontSize = '20px'
            progressP.style.opacity = '1';
            progressP.style.transform = 'translateX(-8px)';
        
          });

          rewardDiv.appendChild(btn);
        }
      }
    }

    if (typeof state === "boolean" && state === true) {
      if (!rewardDiv.dataset.toastShown) {
        showToast(`⭐Weekly achievement complete`);
        rewardDiv.dataset.toastShown = "1";
      }

      progressP?.remove();
      if (!rewardDiv.querySelector("button")) {
        const btn = document.createElement("button");
        btn.textContent = "Claim";
        btn.addEventListener("click", async () => {
          const snap = await getDoc(userRef);
          if (!snap.exists()) return;
          const data = snap.data();
          const newXp = (data.progress?.xp || 0) + xpValue;
          await updateDoc(userRef, {
            [`achievements.weekly.${key}`]: "claimed",
            "progress.xp": newXp
          });
          btn.remove();
          progressP.style.fontSize = '20px'
          progressP.style.opacity = '1';
          rewardDiv.style.flexDirection = 'row';
          progressP.style.transform = 'translateX(-8px)';
          await checkLevelUp(userRef, data);
          checkAllWeeklyComplete(userRef);
        });
        rewardDiv.appendChild(btn);
      }
    }

    if (state === "claimed") {
      rewardDiv.querySelector("button")?.remove();
      if (progressP) {
         progressP.style.fontSize = '20px'
        progressP.style.opacity = '1';
        rewardDiv.style.flexDirection = 'row';
        progressP.textContent = "✅";
        progressP.style.transform = 'translateX(-8px)';
      }
      else rewardDiv.appendChild(document.createElement("p")).textContent = "✅";
     
        
    }
  }
  updateShowStars(userData);
}

export async function renderMilestones(userData) {
  const userRef = doc(db, "users", auth.currentUser.uid);
  const progress = userData.progress || {};

  const milestones = [
    { key: "books-1", field: "booksRead", target: 1, title: "Finish 1 Book" },
    { key: "books-10", field: "booksRead", target: 10, title: "Finish 10 Books" },
    { key: "books-50", field: "booksRead", target: 50, title: "Finish 50 Books" },
    { key: "books-100", field: "booksRead", target: 100, title: "Finish 100 Books" },

    { key: "pages-200", field: "pagesRead", target: 200, title: "Read 200 Pages" },
    { key: "pages-500", field: "pagesRead", target: 500, title: "Read 500 Pages" },
    { key: "pages-1000", field: "pagesRead", target: 1000, title: "Read 1000 Pages" },
    { key: "pages-5000", field: "pagesRead", target: 5000, title: "Read 5000 Pages" },

    { key: "focus-5h", field: "focusSessions", target: 300, title: "Focus 5h" },
    { key: "focus-20h", field: "focusSessions", target: 1200, title: "Focus 20h" },
    { key: "focus-50h", field: "focusSessions", target: 3000, title: "Focus 50h" },
    { key: "focus-100h", field: "focusSessions", target: 6000, title: "Focus 100h" },

    { key: "streak-7", field: "streakDays", target: 7, title: "7 Day Streak" },
    { key: "streak-14", field: "streakDays", target: 14, title: "14 Day Streak" },
    { key: "streak-30", field: "streakDays", target: 30, title: "30 Day Streak" },
    { key: "streak-100", field: "streakDays", target: 100, title: "100 Day Streak" },

    { key: "articles-10", field: "articlesRead", target: 10, title: "Read 10 Articles" },
    { key: "articles-50", field: "articlesRead", target: 50, title: "Read 50 Articles" },
    { key: "articles-100", field: "articlesRead", target: 100, title: "Read 100 Articles" },

  ];

  milestones.forEach(async m=> {
    const div = document.querySelector(`.milestone-${m.key}`);
    if (!div) return;
    const milestoneMain = div.querySelector('.milestone-main')
    const xpSpan = div.querySelector(".earned-xp");
    const xpValue = parseInt(xpSpan?.id || "0");
    const progressSpan = div.querySelector(".ach-progress");
    const statusSpan = div.querySelector(".ach-status");
    const milestoneIcon = div.querySelector('svg');
    let newMilestoneIcon;
    const current = progress[m.field] || 0;

    progressSpan.textContent = `${current}/${m.target}`;

    const claimed = userData.achievements?.milestones?.[m.key] === "claimed";

    if (claimed) {
      if (statusSpan) statusSpan.remove();
      progressSpan.textContent = `${m.target}/${m.target}✅`;
      progressSpan.style.fontSize = '17px';
      if(m.field ==='booksRead'){
        milestoneIcon.remove();
        div.innerHTML += `<svg class="achievedMil" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" fill="#3d2714" stroke="#3d2714"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g transform="translate(1)"> <g> <path style="fill:#8b5a32;" d="M325.621,363.807c-23.835,4.414-46.786,11.476-70.621,20.303 c-69.738-28.248-143.89-37.959-211.862-8.828H34.31V48.662H7.828v344.276h317.793V363.807z"></path> <path style="fill:#8b5a32;" d="M475.69,48.662v326.621h-8.828c-22.069-10.593-45.903-15.89-70.621-16.772v34.428h105.931V48.662 H475.69z"></path> <path style="fill:#8b5a32;" d="M7.828,419.421h317.793v-26.483H7.828V419.421z"></path> <path style="fill:#8b5a32;" d="M396.241,419.421h105.931v-26.483H396.241V419.421z"></path> </g> <path style="fill:#980606;" d="M325.621,363.807v108.579l35.31-26.483l35.31,26.483V358.51 C373.29,356.745,349.455,358.51,325.621,363.807"></path> <path style="fill:#fdede2;" d="M255,384.11L255,384.11c-69.738-28.248-143.89-37.959-211.862-8.828H34.31V48.662h8.828 c66.207-23.834,145.655-23.834,211.862,0V384.11z"></path> <path style="fill:#845c24;" d="M255,384.11L255,384.11c73.269-28.248,149.186-37.959,211.862-8.828h8.828V48.662h-8.828 c-68.855-23.834-143.89-23.834-211.862,0V384.11z"></path> <path style="fill:#fdede2;" d="M263.828,375.283L263.828,375.283c73.269-28.248,113.876-37.959,176.552-8.828h8.828V39.834h-8.828 C371.524,16,331.8,16,263.828,39.834V375.283z"></path> <path d="M263.828,397.352l-12.359-4.414c-77.683-30.897-146.538-34.428-204.8-8.828h-1.766H25.483V39.834h15.89 C109.345,16,189.676,16,257.648,40.717l6.179,1.766V397.352z M130.531,348.8c36.193,0,74.152,7.945,115.641,22.069V54.841 c-63.559-21.186-137.71-20.303-200.386,1.766l-0.883,0.883h-1.766v308.083C70.503,354.097,99.634,348.8,130.531,348.8z"></path> <path d="M246.172,397.352V42.483l6.179-1.766C321.207,16,398.007,16,468.628,39.834h15.89V384.11h-19.421l-1.766-0.883 c-53.848-25.6-122.703-22.069-204.8,8.828L246.172,397.352z M263.828,54.841v316.028c79.448-28.248,147.421-30.014,203.034-6.179 V57.49h-1.766l-1.766-0.883C399.772,34.538,328.269,34.538,263.828,54.841z"></path> <path d="M202.034,119.283h-79.448c-5.297,0-8.828-3.531-8.828-8.828s3.531-8.828,8.828-8.828h79.448 c5.297,0,8.828,3.531,8.828,8.828S207.331,119.283,202.034,119.283z"></path> <path d="M202.034,163.421H87.276c-5.297,0-8.828-3.531-8.828-8.828s3.531-8.828,8.828-8.828h114.759 c5.297,0,8.828,3.531,8.828,8.828S207.331,163.421,202.034,163.421z"></path> <path d="M166.724,207.559H87.276c-5.297,0-8.828-3.531-8.828-8.828s3.531-8.828,8.828-8.828h79.448 c5.297,0,8.828,3.531,8.828,8.828S172.021,207.559,166.724,207.559z"></path> <path d="M202.034,251.697h-79.448c-5.297,0-8.828-3.531-8.828-8.828c0-5.297,3.531-8.828,8.828-8.828h79.448 c5.297,0,8.828,3.531,8.828,8.828C210.862,248.166,207.331,251.697,202.034,251.697z"></path> <path d="M202.034,295.834H87.276c-5.297,0-8.828-3.531-8.828-8.828c0-5.297,3.531-8.828,8.828-8.828h114.759 c5.297,0,8.828,3.531,8.828,8.828C210.862,292.303,207.331,295.834,202.034,295.834z"></path> <path d="M387.414,163.421h-79.448c-5.297,0-8.828-3.531-8.828-8.828s3.531-8.828,8.828-8.828h79.448 c5.297,0,8.828,3.531,8.828,8.828S392.71,163.421,387.414,163.421z"></path> <path d="M431.552,119.283H307.966c-5.297,0-8.828-3.531-8.828-8.828s3.531-8.828,8.828-8.828h123.586 c5.297,0,8.828,3.531,8.828,8.828S436.848,119.283,431.552,119.283z"></path> <path d="M431.552,295.834h-88.276c-5.297,0-8.828-3.531-8.828-8.828c0-5.297,3.531-8.828,8.828-8.828h88.276 c5.297,0,8.828,3.531,8.828,8.828C440.379,292.303,436.848,295.834,431.552,295.834z"></path> <path d="M387.414,251.697h-79.448c-5.297,0-8.828-3.531-8.828-8.828c0-5.297,3.531-8.828,8.828-8.828h79.448 c5.297,0,8.828,3.531,8.828,8.828C396.241,248.166,392.71,251.697,387.414,251.697z"></path> <path d="M431.552,207.559H307.966c-5.297,0-8.828-3.531-8.828-8.828s3.531-8.828,8.828-8.828h123.586 c5.297,0,8.828,3.531,8.828,8.828S436.848,207.559,431.552,207.559z"></path> <path d="M334.448,401.766H-1V39.834h44.138v325.738c60.91-25.6,132.414-22.069,211.862,8.828 c23.835-8.828,46.786-15.89,68.855-19.421l10.593-1.766V401.766z M281.483,384.11h35.31v-9.71 C305.317,377.048,293.841,380.579,281.483,384.11z M16.655,384.11H229.4c-68.855-22.952-130.648-23.835-182.731-0.883l-1.766,0.883 H25.483V57.49h-8.828V384.11z"></path> <path d="M511,401.766H387.414V348.8l9.71,0.883c25.6,1.766,48.552,7.062,69.738,15.89V39.834H511V401.766z M484.517,384.11h8.828 V57.49h-8.828V384.11z M405.069,384.11h79.448h-19.421l-1.766-0.883c-17.655-7.945-37.076-13.241-58.262-15.89V384.11z"></path> <path d="M334.448,428.248H-1V384.11h335.448V428.248z M16.655,410.593h300.138v-8.828H16.655V410.593z"></path> <path d="M511,428.248H387.414V384.11H511V428.248z M405.069,410.593h88.276v-8.828h-88.276V410.593z"></path> <path d="M405.069,490.041l-44.138-33.545l-44.138,33.545V355.862l7.062-1.766c25.6-5.297,50.317-7.062,73.269-5.297l7.945,0.883 V490.041z M360.931,435.31l26.483,19.421v-88.276c-16.772,0-34.428,0.883-52.966,4.414v83.862L360.931,435.31z"></path> </g> </g></svg>`;
        div.querySelector('.achievedMil').style.bottom = '60px';
        div.querySelector('.achievedMil').style.top = 'unset';
        div.querySelector('.achievedMil').style.opacity = '0.6';
        milestoneMain.style.gap = '3px';

        milestoneMain.style.transform = 'translateY(53px)';
      } else if(m.field==='focusSessions'){
        milestoneIcon.remove();
        div.innerHTML += `<svg class="achievedMil" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path style="fill:#C0E3F0;" d="M400.463,123.454V26.999H111.538v96.456c0,59.34,35.782,110.312,86.941,132.546 c-51.16,22.233-86.941,73.207-86.941,132.546v96.456h288.926v-96.456c0-59.34-35.782-110.312-86.941-132.546 C364.682,233.767,400.463,182.794,400.463,123.454z"></path> <path style="fill:#5A4146;" d="M410.369,0H101.631C86.72,0,74.632,12.089,74.632,26.999l0,0c0,14.912,12.088,26.999,26.999,26.999 h308.738c14.911,0,26.999-12.088,26.999-26.999l0,0C437.369,12.089,425.28,0,410.369,0z"></path> <path style="opacity:0.1;enable-background:new ;" d="M134.219,26.999C134.219,12.089,146.306,0,161.217,0h-59.586 C86.72,0,74.632,12.089,74.632,26.999c0,14.912,12.088,26.999,26.999,26.999h59.586C146.306,53.998,134.219,41.911,134.219,26.999z"></path> <path style="fill:#FFD782;" d="M364.712,123.454c0,59.944-48.768,108.712-108.712,108.712s-108.712-48.768-108.712-108.712H364.712z "></path> <path style="opacity:0.1;enable-background:new ;" d="M206.876,123.454H147.29c0,59.944,48.768,108.712,108.712,108.712 c10.327,0,20.321-1.448,29.793-4.151C240.287,215.03,206.876,173.071,206.876,123.454z"></path> <path style="fill:#FFD782;" d="M147.29,479.043v-42.828c0-59.944,48.768-108.712,108.712-108.712s108.712,48.768,108.712,108.712 v42.828H147.29z"></path> <path style="opacity:0.1;enable-background:new ;" d="M285.793,331.654c-9.472-2.703-19.466-4.151-29.793-4.151 c-59.944,0-108.712,48.768-108.712,108.712v42.828h59.586v-42.828C206.876,386.598,240.287,344.639,285.793,331.654z"></path> <path style="fill:#5A4146;" d="M410.369,512H101.631c-14.911,0-26.999-12.089-26.999-26.999l0,0 c0-14.912,12.088-26.999,26.999-26.999h308.738c14.911,0,26.999,12.088,26.999,26.999l0,0C437.369,499.911,425.28,512,410.369,512z"></path> <path style="opacity:0.1;enable-background:new ;" d="M134.219,485c0-14.912,12.088-26.999,26.999-26.999h-59.586 c-14.911,0-26.999,12.088-26.999,26.999c0,14.911,12.088,26.999,26.999,26.999h59.586C146.306,512,134.219,499.911,134.219,485z"></path> </g></svg>`;
        div.querySelector('.achievedMil').style.bottom = '60px';
        div.querySelector('.achievedMil').style.top = 'unset';
        div.querySelector('.achievedMil').style.opacity = '0.6';
         milestoneMain.style.gap = '3px';
        milestoneMain.style.transform = 'translateY(53px)';
      } else if(m.field==='streakDays') {
        milestoneIcon.remove();
        div.innerHTML += `<svg class="achievedMil" viewBox="-33 0 255 255" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs> <style> .cls-3 { fill: url(#linear-gradient-1); } .cls-4 { fill: #fc9502; } .cls-5 { fill: #fce202; } </style> <linearGradient id="linear-gradient-1" gradientUnits="userSpaceOnUse" x1="94.141" y1="255" x2="94.141" y2="0.188"> <stop offset="0" stop-color="#ff4c0d"></stop> <stop offset="1" stop-color="#fc9502"></stop> </linearGradient> </defs> <g id="fire"> <path d="M187.899,164.809 C185.803,214.868 144.574,254.812 94.000,254.812 C42.085,254.812 -0.000,211.312 -0.000,160.812 C-0.000,154.062 -0.121,140.572 10.000,117.812 C16.057,104.191 19.856,95.634 22.000,87.812 C23.178,83.513 25.469,76.683 32.000,87.812 C35.851,94.374 36.000,103.812 36.000,103.812 C36.000,103.812 50.328,92.817 60.000,71.812 C74.179,41.019 62.866,22.612 59.000,9.812 C57.662,5.384 56.822,-2.574 66.000,0.812 C75.352,4.263 100.076,21.570 113.000,39.812 C131.445,65.847 138.000,90.812 138.000,90.812 C138.000,90.812 143.906,83.482 146.000,75.812 C148.365,67.151 148.400,58.573 155.999,67.813 C163.226,76.600 173.959,93.113 180.000,108.812 C190.969,137.321 187.899,164.809 187.899,164.809 Z" id="path-1" class="cls-3" fill-rule="evenodd"></path> <path d="M94.000,254.812 C58.101,254.812 29.000,225.711 29.000,189.812 C29.000,168.151 37.729,155.000 55.896,137.166 C67.528,125.747 78.415,111.722 83.042,102.172 C83.953,100.292 86.026,90.495 94.019,101.966 C98.212,107.982 104.785,118.681 109.000,127.812 C116.266,143.555 118.000,158.812 118.000,158.812 C118.000,158.812 125.121,154.616 130.000,143.812 C131.573,140.330 134.753,127.148 143.643,140.328 C150.166,150.000 159.127,167.390 159.000,189.812 C159.000,225.711 129.898,254.812 94.000,254.812 Z" id="path-2" class="cls-4" fill-rule="evenodd"></path> <path d="M95.000,183.812 C104.250,183.812 104.250,200.941 116.000,223.812 C123.824,239.041 112.121,254.812 95.000,254.812 C77.879,254.812 69.000,240.933 69.000,223.812 C69.000,206.692 85.750,183.812 95.000,183.812 Z" id="path-3" class="cls-5" fill-rule="evenodd"></path> </g> </g></svg>`;
        
        div.querySelector('.achievedMil').style.opacity = '1';
      }

      return;
    }

    if (current >= m.target && !claimed) {
      const snap = await getDoc(userRef);
          if (!snap.exists()) return;
          const data = snap.data();
          const newXp = (data.progress?.xp || 0) + xpValue;

          await updateDoc(userRef, {
            [`achievements.milestones.${m.key}`]: "claimed",
            "progress.xp": newXp
          });

          showRewardPopup("🏅", `${m.title}`,"Milestone unlocked!",`+${xpValue} Knowledge Orbs`);
          await checkLevelUp(userRef, data);
          statusSpan.remove();
          progressSpan.textContent = `${m.target}/${m.target} ✅`;
          progressSpan.style.fontSize = '17px';
          if(m.field ==='booksRead'){
            milestoneIcon.remove();
            div.innerHTML += `<svg class="achievedMil" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" fill="#3d2714" stroke="#3d2714"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g transform="translate(1)"> <g> <path style="fill:#8b5a32;" d="M325.621,363.807c-23.835,4.414-46.786,11.476-70.621,20.303 c-69.738-28.248-143.89-37.959-211.862-8.828H34.31V48.662H7.828v344.276h317.793V363.807z"></path> <path style="fill:#8b5a32;" d="M475.69,48.662v326.621h-8.828c-22.069-10.593-45.903-15.89-70.621-16.772v34.428h105.931V48.662 H475.69z"></path> <path style="fill:#8b5a32;" d="M7.828,419.421h317.793v-26.483H7.828V419.421z"></path> <path style="fill:#8b5a32;" d="M396.241,419.421h105.931v-26.483H396.241V419.421z"></path> </g> <path style="fill:#980606;" d="M325.621,363.807v108.579l35.31-26.483l35.31,26.483V358.51 C373.29,356.745,349.455,358.51,325.621,363.807"></path> <path style="fill:#fdede2;" d="M255,384.11L255,384.11c-69.738-28.248-143.89-37.959-211.862-8.828H34.31V48.662h8.828 c66.207-23.834,145.655-23.834,211.862,0V384.11z"></path> <path style="fill:#845c24;" d="M255,384.11L255,384.11c73.269-28.248,149.186-37.959,211.862-8.828h8.828V48.662h-8.828 c-68.855-23.834-143.89-23.834-211.862,0V384.11z"></path> <path style="fill:#fdede2;" d="M263.828,375.283L263.828,375.283c73.269-28.248,113.876-37.959,176.552-8.828h8.828V39.834h-8.828 C371.524,16,331.8,16,263.828,39.834V375.283z"></path> <path d="M263.828,397.352l-12.359-4.414c-77.683-30.897-146.538-34.428-204.8-8.828h-1.766H25.483V39.834h15.89 C109.345,16,189.676,16,257.648,40.717l6.179,1.766V397.352z M130.531,348.8c36.193,0,74.152,7.945,115.641,22.069V54.841 c-63.559-21.186-137.71-20.303-200.386,1.766l-0.883,0.883h-1.766v308.083C70.503,354.097,99.634,348.8,130.531,348.8z"></path> <path d="M246.172,397.352V42.483l6.179-1.766C321.207,16,398.007,16,468.628,39.834h15.89V384.11h-19.421l-1.766-0.883 c-53.848-25.6-122.703-22.069-204.8,8.828L246.172,397.352z M263.828,54.841v316.028c79.448-28.248,147.421-30.014,203.034-6.179 V57.49h-1.766l-1.766-0.883C399.772,34.538,328.269,34.538,263.828,54.841z"></path> <path d="M202.034,119.283h-79.448c-5.297,0-8.828-3.531-8.828-8.828s3.531-8.828,8.828-8.828h79.448 c5.297,0,8.828,3.531,8.828,8.828S207.331,119.283,202.034,119.283z"></path> <path d="M202.034,163.421H87.276c-5.297,0-8.828-3.531-8.828-8.828s3.531-8.828,8.828-8.828h114.759 c5.297,0,8.828,3.531,8.828,8.828S207.331,163.421,202.034,163.421z"></path> <path d="M166.724,207.559H87.276c-5.297,0-8.828-3.531-8.828-8.828s3.531-8.828,8.828-8.828h79.448 c5.297,0,8.828,3.531,8.828,8.828S172.021,207.559,166.724,207.559z"></path> <path d="M202.034,251.697h-79.448c-5.297,0-8.828-3.531-8.828-8.828c0-5.297,3.531-8.828,8.828-8.828h79.448 c5.297,0,8.828,3.531,8.828,8.828C210.862,248.166,207.331,251.697,202.034,251.697z"></path> <path d="M202.034,295.834H87.276c-5.297,0-8.828-3.531-8.828-8.828c0-5.297,3.531-8.828,8.828-8.828h114.759 c5.297,0,8.828,3.531,8.828,8.828C210.862,292.303,207.331,295.834,202.034,295.834z"></path> <path d="M387.414,163.421h-79.448c-5.297,0-8.828-3.531-8.828-8.828s3.531-8.828,8.828-8.828h79.448 c5.297,0,8.828,3.531,8.828,8.828S392.71,163.421,387.414,163.421z"></path> <path d="M431.552,119.283H307.966c-5.297,0-8.828-3.531-8.828-8.828s3.531-8.828,8.828-8.828h123.586 c5.297,0,8.828,3.531,8.828,8.828S436.848,119.283,431.552,119.283z"></path> <path d="M431.552,295.834h-88.276c-5.297,0-8.828-3.531-8.828-8.828c0-5.297,3.531-8.828,8.828-8.828h88.276 c5.297,0,8.828,3.531,8.828,8.828C440.379,292.303,436.848,295.834,431.552,295.834z"></path> <path d="M387.414,251.697h-79.448c-5.297,0-8.828-3.531-8.828-8.828c0-5.297,3.531-8.828,8.828-8.828h79.448 c5.297,0,8.828,3.531,8.828,8.828C396.241,248.166,392.71,251.697,387.414,251.697z"></path> <path d="M431.552,207.559H307.966c-5.297,0-8.828-3.531-8.828-8.828s3.531-8.828,8.828-8.828h123.586 c5.297,0,8.828,3.531,8.828,8.828S436.848,207.559,431.552,207.559z"></path> <path d="M334.448,401.766H-1V39.834h44.138v325.738c60.91-25.6,132.414-22.069,211.862,8.828 c23.835-8.828,46.786-15.89,68.855-19.421l10.593-1.766V401.766z M281.483,384.11h35.31v-9.71 C305.317,377.048,293.841,380.579,281.483,384.11z M16.655,384.11H229.4c-68.855-22.952-130.648-23.835-182.731-0.883l-1.766,0.883 H25.483V57.49h-8.828V384.11z"></path> <path d="M511,401.766H387.414V348.8l9.71,0.883c25.6,1.766,48.552,7.062,69.738,15.89V39.834H511V401.766z M484.517,384.11h8.828 V57.49h-8.828V384.11z M405.069,384.11h79.448h-19.421l-1.766-0.883c-17.655-7.945-37.076-13.241-58.262-15.89V384.11z"></path> <path d="M334.448,428.248H-1V384.11h335.448V428.248z M16.655,410.593h300.138v-8.828H16.655V410.593z"></path> <path d="M511,428.248H387.414V384.11H511V428.248z M405.069,410.593h88.276v-8.828h-88.276V410.593z"></path> <path d="M405.069,490.041l-44.138-33.545l-44.138,33.545V355.862l7.062-1.766c25.6-5.297,50.317-7.062,73.269-5.297l7.945,0.883 V490.041z M360.931,435.31l26.483,19.421v-88.276c-16.772,0-34.428,0.883-52.966,4.414v83.862L360.931,435.31z"></path> </g> </g></svg>`;
            div.querySelector('.achievedMil').style.bottom = '70px';
            div.querySelector('.achievedMil').style.top = 'unset';
            div.querySelector('.achievedMil').style.opacity = '1';
          }
    }
  });
}

export async function checkAllDailyComplete(userRef) {
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const data = snap.data();

  const daily = data.achievements?.daily || {};
  const allDone =
    daily.logIn === "claimed" &&
    daily.readArticle === "claimed" &&
    daily.sessionComplete === "claimed" &&
    (daily.readPages || 0) >= 20;

  if(data.achievements.daily.streakClaimed===true) return;
  if (allDone) {
    const newStreak = (data.progress?.streakDays || 0) + 1;
    const newWeeklyStreak = (data.achievements?.weekly?.streak || 0) + 1;
    const achReward = document.querySelector('.achReward');
    const newStreakDays = (data.progress.streakWeekDays || []);

    if(!data.achievements.daily.streakCLaimed) {
      achReward.innerHTML =`
        <span>🔥</span>
        <h2>${newStreak} Days Streak</h2>
        <p>Focus, read, and gain knowledge in Booksy every day to continue your streak!</p>
        <p class="rewardText">+25🔮</p>
        <p class='rewardXp'>Knowledge Orbs</p>
      `;
      showRewardPopup('🔥', `${newStreak} Days Streak`, 'Focus, read, and gain knowledge in Booksy every day to continue your streak!', '+25🔮')
      

      const newXp = (data.progress?.xp || 0) + 25;
      const today = new Date();
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = days[today.getDay()];
      newStreakDays.push(dayName)
      console.log(dayName);

      await updateDoc(userRef, {
        "achievements.daily.streakClaimed": true,
        "progress.xp": newXp
      })
      await checkLevelUp(userRef, data);
    }
    
    await updateDoc(userRef, {
      "achievements.daily.allComplete": true,
      "progress.streakDays": newStreak,
      "achievements.weekly.streak": newWeeklyStreak,
      "progress.streakWeekDays": newStreakDays
    });
  }
}

async function checkAllWeeklyComplete(userRef) {
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const data = snap.data();

  const weekly = data.achievements?.weekly || {};
  const allDone =
    weekly.readArticles === "claimed" &&
    weekly.readPages === "claimed" &&
    weekly.focusTime === "claimed" &&
    weekly.streak === "claimed" &&
    weekly.finishedBook === "claimed";

  if (allDone) {
    await updateDoc(userRef, {
      "achievements.weekly.allComplete": true
    });
  }
}

export function renderStreakIcons(userData) {
  const streakDays = userData.progress?.streakWeekDays || [];

  const dayToId = {
    Sunday: "sunday",
    Monday: "monday",
    Tuesday: "tuesday",
    Wednesday: "wednesday",
    Thursday: "thursday",
    Friday: "friday",
    Saturday: "saturday",
  };

  streakDays.forEach(day => {
    const img = document.getElementById(dayToId[day]);
    if (img) {
      img.src = "/images/user-profile/streak.png"; 
      img.classList.add('streak-achieved')
    }
  });
}

export async function resetDailyIfNeeded(userRef) {
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const data = snap.data();

  const lastDate = data.achievements?.daily?.lastReset;
  const today = new Date().toISOString().split("T")[0];

  if (lastDate !== today) {
    await updateDoc(userRef, {
    "achievements.daily.allComplete": false,
    "achievements.daily.logIn": false,
    "achievements.daily.readArticle": false,
    "achievements.daily.sessionComplete": false,
    "achievements.daily.readPages": 0,
    "achievements.daily.claimedPages": false,
    "achievements.daily.streakClaimed": false,
    "achievements.daily.lastReset": today
  });

  }
}

export async function resetWeeklyIfNeeded(userRef) {
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const data = snap.data();

  const lastDate = data.achievements?.weekly?.lastReset;
  const today = new Date().toISOString().split("T")[0];

  const last = lastDate ? new Date(lastDate) : null;
  const now = new Date(today);

  const diffDays = last ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : 7;
  if (!last || diffDays >= 7) {
    await updateDoc(userRef, {
      "achievements.weekly.readArticles": 0,
      "achievements.weekly.readPages": 0,
      "achievements.weekly.focusTime": 0,
      "achievements.weekly.streak": 0,
      "achievements.weekly.finishedBook": false,
      "achievements.weekly.allComplete": false,
      "achievements.weekly.lastReset": today, 
      "progress.streakWeekDays": []
    });
  }
}
