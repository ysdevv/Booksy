
export let questionnaireData = {};
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSEhn9NopPvGDyYHWfYJx9EPOgu7U8mjc",
  authDomain: "booksy-app-a2c22.firebaseapp.com",
  projectId: "booksy-app-a2c22",
  storageBucket: "booksy-app-a2c22.appspot.com",
  messagingSenderId: "136774503415",
  appId: "1:136774503415:web:b332926d4b220b8ea47cf2",
  measurementId: "G-S30V4RDX67"
};

//Global variables

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const body = document.body;
const background = document.querySelector('.bg');
const welcomeScreen = document.getElementById('welcome-screen');
const countdownScreen = document.getElementById('countdown-screen');
const questionnaireScreen = document.getElementById('questionnaire-screen');
const questionsSection = document.querySelector('.questions-section');
const countdownMonths = document.getElementById('countdown-months');
const countdownWeeks = document.getElementById('countdown-weeks');
const countdownDays = document.getElementById('countdown-days');
const message = document.getElementById('welcome');
const messageHeader = message?.querySelector('h3');
const year = countdownScreen.querySelector('span');
const continu = document.querySelector('.continue');
const motivatorCont = document.querySelector('.motivator-cont');
const question = document.querySelector('.q1');
const hourList = document.getElementById('hour-list');
const minuteList = document.getElementById('minute-list');
const scrollPicker = document.querySelector('.scroll-picker');
const confirmBtn = document.getElementById('confirm-time-picker');
const focusScheduler = document.querySelector('.focus-scheduler');
const focusStart = document.getElementById('focus-start');
const focusEnd = document.getElementById('focus-end');
const part2 = document.querySelector('.part2');
let userTimeCommitment = '15 min'; 
const sectionsnav = document.querySelector('.sections');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Logged in user:", user.displayName, user.email);

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().reachedQuestionnaire) {
      directToQuestionnaire(user);
    } else {
      await setDoc(userRef, {
        reachedQuestionnaire: false,
        email: user.email,
        displayName: user.displayName || null,
        progress: {
          level: 1,
          title: "Novice Reader",
          xp: 0,
          pagesRead: 0,
          booksRead: 0,
          articlesRead: 0,
          focusSessions: 0,
          streakDays: 0,
          currentBook: null
       },
      }, { merge: true });
      welcomeUI(user);
    }

  } else {
    window.location.href = "/index.html";
  }
});

function welcomeUI(user) {
  body.style.filter = 'brightness(1)';
  sectionsnav.style.opacity = '1';
  background.style.filter = 'brightness(0)';
  setTimeout(() => {
    message.style.top = '55%';
    message.style.opacity = '1';
  }, 600);

  startTransitionSequence(user);
}

function calculateTimeLeft() {
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const msLeft = endOfYear - now;

  const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  const months = Math.floor(daysLeft / 30);
  const weeks = Math.floor((daysLeft % 30) / 7);
  const days = daysLeft % 7;

  return { months, weeks, days };
}

function updateCountdownText() {
  const { months, weeks, days } = calculateTimeLeft();
  countdownMonths.textContent = `Only ${months} month${months !== 1 ? 's' : ''},`;
  countdownWeeks.textContent = `${weeks} week${weeks !== 1 ? 's' : ''}, and `;
  countdownDays.textContent = `${days} day${days !== 1 ? 's' : ''} left`;
  year.textContent = `in ${new Date().getFullYear()}.`;
}

//Questionnaire: functions

async function markUserReachedQuestionnaire(user) {
  const userRef = doc(db, "users", user.uid);
  sectionsnav.style.opacity = '1';
  await updateDoc(userRef, {
    reachedQuestionnaire: true,
  });
}

function directToQuestionnaire(user) {
  messageHeader.innerHTML = `Welcome, ${user.displayName || 'Reader'}!`;
  body.style.filter = 'brightness(1)';
  welcomeScreen.style.display = 'none';
  countdownScreen.style.display = 'none';
  motivatorCont.style.display = 'none';
  background.src = '/background-images/themes/quiz-bg.png';
  background.style.filter = 'blur(0px) brightness(0.78)';
    
  questionnaireScreen.style.opacity = '1';
  setTimeout((questionnaireScreen.style.display = 'flex'), 200);
}

//Questionnaire: switching sections/questions

function showScreen(fromId) {
  const fromEl = document.getElementById(fromId);
   fromEl.style.opacity = '0';
   
  setTimeout(() => {
   
    background.style.filter = 'brightness(0.33) blur(0px)'
    setTimeout(() => {
      fromEl.style.display = 'none';
      countdownMonths.style.opacity = '1';
      setTimeout(() => {
        countdownWeeks.style.opacity = '1';
        setTimeout(() => {
          countdownDays.style.opacity = '1';
          year.style.opacity = '1';
          setTimeout(() => {
            countdownScreen.style.opacity = '0';
            setTimeout(() => {
              countdownScreen.style.display = 'none';
              motivatorCont.style.opacity = '1';
              setTimeout(() => {
                continu.style.opacity = '0.2';
              }, 300);
            }, 1500);
          }, 1000);
        }, 1000);
      }, 900);
    }, 600);
  }, 500);
}

function startTransitionSequence(user) {
  setTimeout(() => {
    updateCountdownText();
    showScreen('welcome');
  }, 1600 );
  
  background.addEventListener('click', async () => {
    if (motivatorCont.style.opacity === '1') {
      motivatorCont.style.opacity = '0';
      background.style.opacity = '1';

      questionnaireScreen.style.display = 'flex';
      body.style.filter = 'brightness(0)';
      await markUserReachedQuestionnaire(user);

      setTimeout(() => {

        body.style.filter = 'brightness(1)';
        background.style.opacity = '1';
         
        background.src = '/background-images/themes/quiz-bg.png';
        background.style.filter = 'blur(0px)';
        setTimeout(() => {
          motivatorCont.style.display = 'none';
          questionnaireScreen.style.opacity = '1';
         sectionsnav.style.opacity = '1';
        }, 300);
      }, 1200);
    }
  });
}
const sectionsCont = document.querySelector('.sections');
const sections = sectionsCont.querySelectorAll('img');
const sectionElements = document.querySelectorAll('.section');
let currentSectionIndex = 0;

function showSection(index) {
  sectionElements.forEach((section, i) => {
    section.style.opacity = '0';
    section.style.pointerEvents = 'none';
    sections.forEach(section => section.style.height = '1.5px');
    section.style.transition = 'opacity 0.6s ease';
    setTimeout(() => section.style.display = 'none', 500);
  });
  sections.forEach(section => section.style.opacity = '0.4');

  const target = sectionElements[index];
  const index2 = index + 1;

  const sectionTarget = document.getElementById(index2);
  const navButtons = target.querySelector('.nav-buttons');
  

  setTimeout(() => {
    target.style.display = 'flex';
    setTimeout(() => {
      sectionTarget.style.opacity = '1';
      sectionTarget.style.height = '3px';
      target.style.opacity = '1';
      target.style.pointerEvents = 'auto';
    }, 50);
  }, 550);
}

sectionElements.forEach((section, i) => {
  

  if (i > 0) {
    const prevBtn = document.querySelectorAll('.previous');
    prevBtn.forEach(pb=>{
      pb.onclick = () => {
      if (currentSectionIndex > 0) {
        currentSectionIndex--;
        showSection(currentSectionIndex);
      }
    };
    
    })
    
  }

  if (i < sectionElements.length - 1) {
    const nextBtn = document.querySelectorAll('.next');
  
    nextBtn.forEach(nb=>{
      
      nb.style.padding = '13px 35px';
      nb.onclick = () => {
      if (currentSectionIndex < sectionElements.length - 1) {
        currentSectionIndex++;
        showSection(currentSectionIndex);
      }
    };
    })
    
  }

  
});

const observer = new MutationObserver(() => {
  if (questionnaireScreen.style.opacity === '1') {
    showSection(currentSectionIndex);
    observer.disconnect();
  }
});
observer.observe(questionnaireScreen, { attributes: true, attributeFilter: ['style'] });

//Questionnaire, Section 1 and 2: Selecting books goals and books' genres.
const q1 = document.querySelector('.q1');
const q2 = document.querySelector('.q2');
const q3 = document.querySelector(".q3");
const q4 = document.querySelector('.q4');
const goalButtons = question.querySelectorAll('p');
const goalInput = q1.querySelector('input');
q1.querySelector('.selected').style.backgroundColor = 'rgb(255 255 255 / 0%)';
goalButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    goalButtons.forEach(b => {b.classList.remove('selected'); b.style.backgroundColor = 'rgba(255, 255, 255, 0.038)';});
    btn.classList.add('selected');
    btn.style.backgroundColor = 'rgb(255 255 255 / 0%)';
    goalInput.value = '';
    goalInput.classList.remove('selected');

    goalInput.style.backgroundColor = '#ffffff09';
  });
});
goalInput.addEventListener('click', ()=>{
  goalButtons.forEach(b => {b.classList.remove('selected'); b.style.backgroundColor = 'rgba(255, 255, 255, 0.038)';});
  goalInput.classList.add('selected');
  goalInput.style.backgroundColor = 'rgb(255 255 255 / 0%)';
})
document.addEventListener("DOMContentLoaded", () => {
  const allOptionsQ3 = q3.querySelectorAll('p');
  const allOptionsQ2 = q2.querySelectorAll('p');
  const allOptionsQ4 = q4.querySelectorAll('p');

  allOptionsQ2.forEach(p => {
  p.addEventListener("click", () => {
    const selected = document.querySelectorAll(".div .selected"); 

    if (p.classList.contains("selected") && selected.length === 1) {
  
      return;
    }
    
    p.classList.toggle("selected");
    console.log(p.classList)
    if(p.classList.contains('selected')) {p.style.backgroundColor = 'rgb(255 255 255 / 0%)'; } else {
      p.style.backgroundColor = '#ffffff09';
      p.classList.remove('selected');
    }
  });
});

allOptionsQ3.forEach(p => {
  p.addEventListener("click", () => {
    const selected = document.querySelectorAll(".div .selected"); 

    if (p.classList.contains("selected") && selected.length === 1) {
      return;
    }
    
    p.classList.toggle("selected");
    if(p.classList.contains('selected')) {p.style.backgroundColor = 'rgb(255 255 255 / 0%)';}else {
      p.style.backgroundColor = '#ffffff09';
      p.classList.remove('selected');
    }
  });
});

   allOptionsQ4.forEach(p => {
    p.addEventListener("click", () => {
      const selected = document.querySelectorAll(".q4 .selected"); 

      if (p.classList.contains("selected") && selected.length === 1) {
        return;
      }
      
      p.classList.toggle("selected");
      if(p.classList.contains('selected')) {p.style.backgroundColor = 'rgb(255 255 255 / 0%)';}else {
        p.style.backgroundColor = '#ffffff09';
        p.classList.remove('selected');
      }
    });
  });

    document.querySelectorAll(".toggle").forEach(toggle => {
      toggle.addEventListener("click", () => {
        if(toggle.innerHTML ==='See more...'){
          q2.style.opacity = '0';
          
          setTimeout(() => {
            q3.style.display = 'grid';
            q2.style.display = 'none';
            setTimeout(() => {
             
             q3.style.opacity = '1';
           }, 50);
          }, 400);
           
        } else {
          q3.style.opacity = '0';
          setTimeout(() => {
            q2.style.display = 'grid';
            q3.style.display = 'none';
            setTimeout(() => {
             q2.style.opacity = '1';
             
           }, 50);
          }, 450);
           
        }
       
      });
    });
});


//Questionnaire, Section 3: Daily focus time.

let userHasInteracted = false; 

for (let i = 0; i < 24; i++) {
  const li = document.createElement('li');
  li.textContent = i.toString().padStart(2, '0');
  hourList.appendChild(li);
  li.classList.add('gradient');
}
for (let i = 0; i < 60; i++) {
  const li = document.createElement('li');
  li.textContent = i.toString().padStart(2, '0');
  minuteList.appendChild(li);
  li.classList.add('gradient');
}

function scrollToItem(column, item, smooth = true) {
  if (!item) return;
  const top = item.offsetTop - column.clientHeight / 2 + item.clientHeight / 2;
  column.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  column.querySelectorAll('li').forEach(li => li.classList.remove('active'));
  item.classList.add('active');
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

  children.forEach(c => c.classList.remove('active'));
  if (closest) closest.classList.add('active');
}


function calculateEndTime() {
  const activeHour = hourList.querySelector('.active')?.textContent;
  const activeMinute = minuteList.querySelector('.active')?.textContent;

  if (activeHour && activeMinute) {
    focusStart.querySelector('span').textContent = `${activeHour}:${activeMinute}`;

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

    focusEnd.querySelector('span').textContent = `${endHour}:${endMinute}`;
  }
}

setTimeout(() => {
  const defaultHour = hourList.querySelector('li:nth-child(9)');
  const defaultMinute = minuteList.querySelector('li:nth-child(31)'); 

  if (defaultHour && defaultMinute) {
    defaultHour.classList.add('active');
    defaultMinute.classList.add('active');

    scrollToItem(hourList, defaultHour, false); 
    scrollToItem(minuteList, defaultMinute, false);

    focusStart.querySelector('span').textContent = '08:30';
    calculateEndTime();
  }
}, 0);

focusStart.addEventListener('click', () => {
  scrollPicker.style.display = 'flex';
  focusScheduler.style.height = '300px';
  confirmBtn.style.display = 'block';
  setTimeout(() => {
    scrollPicker.style.opacity = '1';
    confirmBtn.style.opacity = '1';
  }, 200);
  focusStart.classList.add('active');
  part2.style.display='none';
  const hourItem = [...hourList.children].find(li => li.classList.contains('active'));
  const minuteItem = [...minuteList.children].find(li => li.classList.contains('active'));

  if (hourItem && minuteItem) {
    scrollToItem(hourList, hourItem, false); 
    scrollToItem(minuteList, minuteItem, false);
    setTimeout(() => {
      updateActive(hourList);
      updateActive(minuteList);
      calculateEndTime();
    }, 400);
  }
});

confirmBtn.addEventListener('click', () => {
  scrollPicker.style.opacity = '0';
  confirmBtn.style.opacity = '0';
  focusScheduler.style.height = '100px';
  setTimeout(() => {
    scrollPicker.style.display = 'none';
    confirmBtn.style.display = 'none';
  }, 200);
   part2.style.display='flex';
  focusStart.classList.remove('active');
});


[hourList, minuteList].forEach(list => {
  list.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
      userHasInteracted = true;
      scrollToItem(list, e.target);
    }
  });
});


let scrollTimeout;
[hourList, minuteList].forEach(list => {
  list.addEventListener('scroll', () => {
    userHasInteracted = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      updateActive(hourList);
      updateActive(minuteList);
      calculateEndTime();
    }, 300);
  });
});

//Questionnaire, Section 3: Selecting focus time duration

const timeOptions = document.querySelectorAll('#time p');
const customDurationPicker = document.getElementById('custom-duration-picker');
const confirmDurationBtn = document.getElementById('confirm-duration-picker');
const durationHourList = document.getElementById('duration-hour-list');
const durationMinuteList = document.getElementById('duration-minute-list');
const frequencyLabel = document.querySelector('.frequency h3');
const frequencyPicker = document.querySelector('.frequency');
const time = document.getElementById('time');
function createPaddedPicker(list, max, pad = 2) {
  for (let i = 0; i < pad; i++) list.appendChild(document.createElement('li'));
  for (let i = 0; i <= max; i++) {
    const li = document.createElement('li');
    li.textContent = i.toString().padStart(2, '0');
    li.classList.add('gradient');
    list.appendChild(li);
  }
  for (let i = 0; i < pad; i++) list.appendChild(document.createElement('li'));
}

createPaddedPicker(durationHourList, 5);
createPaddedPicker(durationMinuteList, 59);


[durationHourList, durationMinuteList].forEach(list => {
  list.addEventListener('click', e => {
    if (e.target.tagName === 'LI') scrollToItem(list, e.target);
  });
  list.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      updateActive(durationHourList);
      updateActive(durationMinuteList);
    }, 200);
  });
});

// Time option logic
timeOptions.forEach(option => {
  option.addEventListener('click', () => {
    timeOptions.forEach(o => o.classList.remove('chosen'));
    const isCustom = option.id === 'editEndTime';
    if (isCustom) {
      option.classList.add('chosen');
      customDurationPicker.style.display = 'flex';
      confirmDurationBtn.style.display = 'block';
      
      setTimeout(() => {
        customDurationPicker.style.opacity = '1';
        confirmDurationBtn.style.opacity = '1';
        frequencyPicker.style.opacity = '0';
        time.style.opacity = '0';
      }, 350);
      const defaultHour = durationHourList.querySelector('li:nth-child(3)');
      const defaultMinute = durationMinuteList.querySelector('li:nth-child(33)');
      durationHourList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
      durationMinuteList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
      defaultHour?.classList.add('active');
      defaultMinute?.classList.add('active');
      scrollToItem(durationHourList, defaultHour, false);
      scrollToItem(durationMinuteList, defaultMinute, false);
    } else {
      option.classList.add('chosen');
      userTimeCommitment = option.textContent.trim();
      customDurationPicker.style.opacity = '0';
      confirmDurationBtn.style.opacity = '0';
      setTimeout(() => {
        customDurationPicker.style.display = 'none';
        frequencyPicker.style.filter = 'blur(0px)';
        confirmDurationBtn.style.display = 'none';
        time.style.filter = 'blur(0px)';
      }, 200);
      calculateEndTime();
      saveTimeCommitmentToFirebase(userTimeCommitment);
    }
  });
});

confirmDurationBtn.addEventListener('click', async () => {
  const hour = durationHourList.querySelector('.active')?.textContent || '00';
  const minute = durationMinuteList.querySelector('.active')?.textContent || '00';
  const h = parseInt(hour, 10), m = parseInt(minute, 10);
  if (h === 0 && m === 0) return alert("Please select more than 0 minutes.");
  userTimeCommitment = h > 0 ? `${h}h ${m}min` : `${m}min`;
  customDurationPicker.style.opacity = '0';
  confirmDurationBtn.style.opacity = '0';
  setTimeout(() => {
    customDurationPicker.style.display = 'none';
    confirmDurationBtn.style.display = 'none';
    frequencyPicker.style.opacity = '1';
    time.style.opacity = '1';
  }, 200);
  calculateEndTime();

});


const dayPicker = document.getElementById('day-picker');
const dayElements = dayPicker.querySelectorAll('p');
const selectAll = document.querySelector('#setEveryday')
let selectedDays = [];
let selected = 0;

dayElements.forEach(day => {
  day.addEventListener('click', () => {
    day.classList.toggle('chosen');
    const dayId = day.id;

    if (day.classList.contains('chosen')) {
      if (!selectedDays.includes(dayId)) selectedDays.push(dayId);
    } else {
      selectedDays = selectedDays.filter(d => d !== dayId);
    }

   // saveSelectedDaysToFirebase(selectedDays);
    // Update selectAll text
    selectAll.textContent = selectedDays.length === dayElements.length ? 'Unselect All' : 'Set for everyday';
  });
});

selectAll.addEventListener('click', () => {
  const allSelected = selectedDays.length === dayElements.length;

  if (allSelected) {
    
    dayElements.forEach(day => day.classList.remove('chosen'));
    selectedDays = [];
    selectAll.textContent = 'Set for everyday';
  } else {
    
    dayElements.forEach(day => day.classList.add('chosen'));
    selectedDays = Array.from(dayElements).map(day => day.id);
    selectAll.textContent = 'Unselect All';
  }

  //saveSelectedDaysToFirebase(selectedDays);
});



//End of the Quesionnaire, Submitting Section 1, 2, and 4

const submitQuestionnaire = document.getElementById('submitQuestionnaire');

submitQuestionnaire.addEventListener('click', async () => {
  const booksGoal = q1.querySelector('.selected');
  const prefGenres = document.querySelectorAll('.genres .selected');
  const userMotivation = q4.querySelectorAll('.selected');
  const focusStart = document.getElementById('focus-start');
  let focusStartTime = focusStart.querySelector('span').textContent;
  const allSetScreen = document.querySelector('.all-set');
  const allSetTitle = allSetScreen.querySelector('h3');
  const allSetText = allSetScreen.querySelector('p');
  let genres = Array.from(prefGenres).map(p => p.id);
  let motivations = Array.from(userMotivation).map(p => p.id);

  const user = auth.currentUser;
  const userRef = doc(db, "users", user.uid);
  if(genres.length === 0 || motivations.length === 0 || focusStartTime === '' || selectedDays.length === 0) {
    genres.push('other');
    genres.push('classic')
    motivations.push('self-care');
    focusStartTime = '08:30';
    selectedDays = ['everyday'];
  }
  questionnaireData = {
    booksGoal: booksGoal.id ,
    preferredGenres: genres,
    motivations: motivations,
    focusStart: focusStartTime,
    reachedQuestionnaire: true
  };
  try {
    if(booksGoal.id==='books-amount'){
      await updateDoc(userRef,{
        focusSessionsSchedule: {
          demo:{
            name: 'Default',
            timeCommitment: userTimeCommitment,
            selectedDays: selectedDays,
            focusStart: focusStartTime,
            assignedBook: null,
            readingMode: 'offBooksy'
          }
        },
        unplannedSession: {
          timeCommitment: userTimeCommitment,
          assignedBook: null
        },
        booksGoal: booksGoal.value,
        preferredGenres: genres,
        motivations: motivations,
        reachedQuestionnaire: true
      });
    }else{
      await updateDoc(userRef, {
      focusSessionsSchedule: {
          demo:{
            name: 'Default',
            timeCommitment: userTimeCommitment,
            selectedDays: selectedDays,
            focusStart: focusStartTime,
            assignedBook: null,
            readingMode: 'offBooksy'
          }
        },
      unplannedSession: {
        timeCommitment: userTimeCommitment,
        assignedBook: null
      },
      booksGoal: booksGoal.id,
      preferredGenres: genres,
      motivations: motivations,
      reachedQuestionnaire: true
    });
    }
  
  } catch (err) {
    console.error("Failed to save questionnaire data:", err);
  }
   questionnaireScreen.style.opacity = '0';
  questionsSection.style.opacity = '0';
    sectionsCont.style.opacity = '0';

  background.style.filter = 'blur(2px) brightness(0)';


  setTimeout(() => {
    window.location.href = '/user-profile/user-profile.html';
  }, 2000);

            
});

