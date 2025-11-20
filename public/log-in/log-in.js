import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  fetchSignInMethodsForEmail
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";

import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyDSEhn9NopPvGDyYHWfYJx9EPOgu7U8mjc",
  authDomain: "booksy-app-a2c22.firebaseapp.com",
  projectId: "booksy-app-a2c22",
  storageBucket: "booksy-app-a2c22.appspot.com",
  messagingSenderId: "136774503415",
  appId: "1:136774503415:web:b332926d4b220b8ea47cf2",
  measurementId: "G-S30V4RDX67"
};



const logo = document.querySelector('h1');
const bg = document.querySelector('#bg');
const passRecover = document.getElementById('pass-recover');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const forgot = document.querySelector('.forgot');
const header = document.querySelector('h2');
const miniNav = document.querySelector('.mini-nav');
const mainButtons = document.querySelector('.buttons');
const resetBtn = document.getElementById('back');
const logIn = document.getElementById('log-in');
const name = document.getElementById('name');
const agreements = document.querySelector('.agreements');
const question = document.getElementById('question');
const choice = document.querySelector('.choice-log-in');
const register = document.querySelector('.register');
const message = document.getElementById('message');
const body = document.querySelector('body');
const next = document.querySelector('.continue');
const welcomeBg = document.getElementById('welcome-bg');
const emailInput = document.getElementById('email');
const mainDisplay = document.querySelector('.main-display')
const db = getFirestore(app);
document.addEventListener('DOMContentLoaded', ()=>{
  setTimeout(()=>{
    logInSection.style.opacity = '1';
    logo.style.opacity = '1';
    body.style.filter = 'brightness(1)';
  }, 100)
  
})
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is logged in:", user.email);
  } else {
    console.log("No user logged in");
  }
});

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";


const logInSection = document.querySelector('.log-in-section');
const logInContent = logInSection.querySelector('.log-in-content')
const emailForm = document.getElementById("email-registration-form");
const emailRegistration = document.getElementById('choice-email');

function welcomeUI(text, user, wid){
   
    next.style.display = 'none';
    body.style.filter = 'brightness(0) blur(3px)';
    welcomeBg.style.filter = 'brightness(0) blur(3px)';
    welcomeBg.style.opacity= '1';
    logo.style.opacity = '0';
    message.style.display = 'flex';
    setTimeout(()=>{
      logo.style.opacity = '0';
      welcomeBg.style.opacity = '1';
      welcomeBg.style.zIndex='-1';
      logInSection.style.display = 'none';
      message.style.background = 'none';
      message.querySelector('p').innerHTML = text;
      message.style.backdropFilter = 'none';
      message.querySelector('h3').style.fontSize = '53px';
      message.querySelector('p').style.fontSize = '22px';
      logo.style.textAlign = 'center';
      logo.style.fontWeight = '200';
      logo.style.fontSize = '15px';
      logo.style.marginTop = '110px';
      message.style.top = '33%';
      message.querySelector('p').style.opacity = '0.32';
      message.querySelector('p').style.margin= '1px';
      message.querySelector('p').style.marginTop= '8px';
      message.style.alignItems = 'center';
      message.querySelector('p').style.width= `${wid}%`;
      message.querySelector('p').style.fontSize = '17px'
      message.querySelector('h3').style.background = 'linear-gradient(to right, #D8E6F2 0%,rgba(85, 146, 199, 0.89) 100%';
      message.querySelector('h3').style.backgroundClip = 'text';
      message.querySelector('h3').innerHTML = `Welcome, ${user.displayName}`;
      bg.style.filter = 'brightness(0) blur(3px)';
      logInSection.style.filter = 'brightness(0) blur(3px)';
      setTimeout(()=>{
        logo.style.marginLeft = '79px';
        message.style.opacity = '1';
        logo.style.opacity = '0.28';
        welcomeBg.style.filter = 'brightness(0.66)';
        body.style.filter = 'brightness(1) blur(0px)';
    }, 150)
    setTimeout(() => {
      redirect();
    }, 3000);
    }, 850);
}

emailForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = emailForm.email.value;
  const password = emailForm.password.value;
  const nameValue = emailForm.name?.value;
  
  if (register.innerHTML.toLowerCase().includes('sign up')) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (nameValue) {
        await updateProfile(user, {
          displayName: nameValue
        });
      }
      await setDoc(doc(db, "users", user.uid), {
      email: email,
      library: [] , 
      dailyArticle: null
    });
    next.classList.add('next');
      redirect(); 
      emailForm.reset();
    } catch (error) {
      next.classList.remove('next'); 
      message.style.display = 'flex';
      message.style.top = '22%';
      bg.style.filter = 'blur(3px) brightness(0.6)';
      logo.style.filter = 'blur(3px) brightness(0.6)';
      logInSection.style.filter = 'blur(3px) brightness(0.6)';
      message.querySelector('h3').innerHTML = 'Registration failed :('
      next.style.opacity = '0.4';   
      setTimeout(()=>{
         message.style.top = '27.5%';
        message.style.opacity = '1';
      }, 150);
      if(error.code ==='auth/email-already-in-use'){
        message.querySelector('p').innerHTML = `Email ${email } is already in use. <br>Please log in or use another email.`;
        next.innerHTML = 'Click here to continue';
        emailInput.style.borderColor = 'red';
      } 

    }
  } else {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      welcomeUI("Let's focus on what matters and keep growing your library, and knowledge together.", user, 80);
    
  } catch (error) {
    console.log(error)
      next.style.opacity = '0.4';   
      next.classList.remove('next');
      message.style.display = 'flex';
      message.style.top = '22%';
      bg.style.filter = 'blur(3px) brightness(0.6)';
      logo.style.filter = 'blur(3px) brightness(0.6)';
      logInSection.style.filter = 'blur(3px) brightness(0.6)';
      message.querySelector('h3').innerHTML = 'Login failed :(';
      setTimeout(()=>{
        message.style.top = '27.5%';
        message.style.opacity = '1';
      }, 150);
       if(error.code === 'auth/account-exists-with-different-credential'||error.code === 'auth/invalid-login-credentials') {
            message.querySelector('p').innerHTML = `An account already exists with the email ${email} using Google sign up method <span>or the password is incorrect</span>. <br> Please sign in with your Google account or try again.`;
            next.innerHTML = 'Click here to continue';
                   
      } else {
        console.log(error.message);
      }  

    }
  }
});

emailRegistration.addEventListener('click', ()=>{
  logInContent.style.opacity = '0';
  
  setTimeout(()=>{
    if(window.innerWidth<768) mainDisplay.style.gap ='30px';
    logInSection.style.top = '53%';
    
    header.style.width = '100%';
    header.style.fontSize = '36px';
    header.style.marginBottom = '7px';
    header.innerHTML = 'Create your account and reclaim your attention';
    logInContent.style.opacity = '1';
    mainButtons.style.display = 'none'
    emailForm.style.display = 'flex';
    miniNav.style.display = 'flex';
   
  }, 500);
   

})

document.getElementById("choice-google").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    console.log(result);
    const user = result.user;
    const isNewUser = result._tokenResponse?.isNewUser;
    if (isNewUser) {
      await setDoc(doc(db, "users", user.uid), {
      email: user.email,
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
      library: [],
      achievements: {
        daily: {
          logIn:false,
          readArticle:false,
          readPages: 0,
          sessionComplete:false,
          allComplete: false
        },
        weekly: {
          readArticles: 0,
          readPages: 0,
          finishedBook:false,
          focusTime: 0,
          streak: 0
        }
      },
      dailyArticle: null
    });
      next.classList.add('next');
      redirect();
    } else {
      body.style.filter = 'brightness(0) blur(3px)';
     setTimeout(()=>{
        window.location.href = '/user-profile/user-profile.html';
     }, 1800)
    }

  } catch (error) {
    next.classList.remove('next');
    console.error("Login failed:", error.message);

    message.querySelector('h3').innerHTML = 'Login failed';
    setTimeout(() => {
      message.style.opacity = '1';
    }, 150);

    if (
      error.code === 'auth/account-exists-with-different-credential' ||
      error.code === 'auth/invalid-login-credentials'
    ) {
      const email = error.customData.email;
      const methods = await fetchSignInMethodsForEmail(auth, email);
      message.style.display = 'flex';

      if (methods.includes('password')) {
        message.querySelector('p').innerHTML = `An account already exists with the email ${email} using an email/password method. Please sign in with your email & password.`;
      } else {
        message.querySelector('p').innerHTML = `An account already exists with the email ${email} using a different method: ${methods.join(", ")}`;
      }
    } else {
      console.log(error.message);
    }
  }
});

function downloadFile(filePath, fileName) {
    const link = document.createElement("a");
    link.href = filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  document.getElementById("terms").addEventListener("click", function (event) {
    event.preventDefault();
    console.log('downloading')
    downloadFile("terms.pdf", "Booksy_Terms_of_Service.pdf");
  });
function redirect(){
    if(next.classList.contains('next')){
      body.style.filter = 'brightness(0) blur(3px)';
      setTimeout(()=>{
        window.location.href = '/personalization/pers.html';
      }, 1800)
    } else {
      message.style.display = 'none';
      bg.style.filter = 'blur(0px) brightness(1)';
      logo.style.filter = 'blur(0px) brightness(1)';
      logInSection.style.filter = 'blur(0px) brightness(1)';
      message.querySelector('h3').innerHTML = 'Password reset email sent! Please check your inbox.';
      message.querySelector('p').innerHTML = 'If you cannot find the link in your inbox, try to check the spam.';
      next.style.opacity = '0.4';   
      setTimeout(()=>{
         message.style.top = '33.5%';
        message.style.opacity = '0';
      }, 150);
    }
}

if(welcomeBg.style.opacity ==='1'|| !next.classList.contains('next')) {
  message.addEventListener('click', redirect);
  bg.addEventListener('click', redirect)
}

function resetUI() {
  name.disabled = 'false';
  name.removeAttribute('disabled');

  logInSection.style.top = '51%';
  logInContent.style.opacity = '0';
  setTimeout(() => {
    logInSection.style.gap = '28px'; 
    logInSection.style.top = '55%';
    if(window.innerWidth <768) {logInContent.style.width ='100%';} else {
      logInContent.style.width ='50%';
    }
    
    mainDisplay.style.gap = '100px';
    header.style.width = '80%';
    header.style.fontSize = '42px';
    header.style.marginBottom = '20px';
    header.innerHTML = 'Where your reading habit lives'; 
    logInContent.style.opacity = '1';
    mainButtons.style.display = 'flex';
    emailForm.style.display = 'none';
    miniNav.style.display = 'none';
  }, 500);
}
resetBtn.addEventListener('click', resetUI);
 
let clicked = false;

logIn.addEventListener('click', ()=>{
  if(!clicked){
    
    emailForm.style.opacity = '0';
    agreements.style.opacity='0';
    header.style.opacity = '0';
    setTimeout(()=>{
      logInSection.style.top = '56%';
      header.style.opacity = '1';
      header.style.height = '90px';
      header.style.marginBottom = '0px';
      question.innerHTML = "No account yet?";
      header.innerHTML = "Ready to continue your reading streak?"
      logIn.innerHTML = 'Sign Up';
      register.innerHTML = 'Log in';
      forgot.style.display = 'block';
      name.style.display = 'none';
      name.disabled = 'true';
      agreements.style.opacity = '0.4';
      emailForm.style.opacity = '1';
    }, 500);
    clicked = true;

  } else{
    name.disabled = 'false';
    name.removeAttribute('disabled');

    logInSection.style.top = '55%';
    emailForm.style.opacity = '0';
    agreements.style.opacity='0';
    header.style.opacity = '0';
    setTimeout(()=>{
      question.innerHTML = "Already have an account?";
      header.style.height = '90px';
      header.style.marginBottom = '0px';
      header.style.opacity='1';
      header.innerHTML = 'Create your account and reclaim your attention'
      logIn.innerHTML = 'Log-in';
      register.innerHTML = 'Sign up';
      forgot.style.display = 'none';
      

      choice.style.transform = 'translateY(8px)';
      name.style.display = 'block';
      agreements.style.opacity = '0.4';
      forgot.style.transform ='translateX(17px)';
      agreements.style.transform = '';
      emailForm.style.opacity = '1';
    }, 500);
    clicked= false;
  }
 
})

forgot.addEventListener('click', ()=>{
  logInSection.style.opacity = '0';
  setTimeout(()=>{
    passRecover.style.display = 'flex';
    emailForm.style.display = 'none';
    header.style.marginBottom = '0px'
    miniNav.style.display = 'none';
    agreements.style.display = 'none';
    logInSection.style.opacity = '1';
    logInSection.style.gap = '10px';
    header.innerHTML = 'No worries — we’ll help you get back in';
  }, 500)
})

import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";

const resetEmailInput = document.getElementById("reset-email");
const resetPasswordBtn = document.getElementById("reset-password");

resetPasswordBtn.addEventListener("click", async () => {
  const email = resetEmailInput.value.trim();
  try {
    await sendPasswordResetEmail(auth, email);
    logInSection.style.opacity = '0';
    message.style.display = 'flex';
    setTimeout(()=>{
      message.style.top = '28%';
      bg.style.filter = 'blur(5px) brightness(0.6)';
      bg.style.width = '120%';
      bg.style.height = '120%';
       bg.style.transform = 'translate(-10px, -10px)';
      logo.style.filter = 'blur(5px) brightness(0.6)'
      logInSection.style.filter = 'blur(5px) brightness(0.4)';
      message.style.opacity = '1';
      logInSection.style.opacity = '1';
      logInSection.style.left = '68.5%';
    }, 300)
    
  } catch (error) {
    console.error("Password reset failed:", error.message);
    alert("Error: " + error.message);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('choice-google');
  const img = button.querySelector('img');
  const hidden = document.getElementById('hidden');
  const password = document.getElementById('password');
  let visible = false;
  hidden.addEventListener('click', ()=>{
    if(!visible ){
      password.type = 'text';
      hidden.src = '/public/images/log-in-page/visible.png'
      visible = true;
    }else{
      password.type = 'password';
      hidden.src = '/public/images/log-in-page/hidden.png'
      visible = false;
    }
  })
  button.addEventListener('mouseover', () => {
    img.src = '/public/images/log-in-page/google-hovered.png';
  });

  button.addEventListener('mouseout', () => {
    img.src = '/public/images/log-in-page/google.png';
  });
});
