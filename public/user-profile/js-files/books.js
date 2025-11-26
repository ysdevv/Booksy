
import { db, auth } from "./firebase.js";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { smallerNavBar, normalNavBar, initialized, userData, width, getImportedBook, hideAllSections } from "./main.js";
export { initBooks, loadBookIntoReader, calculateGlobalProgress, renderBooks, renderOfflineBooks, loadImportedBookIntoReader, addBookToLibrary, updateReadingProgress };

const welcomeLogo = document.querySelector('.welcome-logo');
const readerDiv = document.querySelector(".reader-container");
const content = document.querySelector('.content');
const navBar = document.querySelector('.nav-bar');
const smallerNavSection = document.querySelector('.smallerNav');
const navLinks = document.querySelectorAll('.nav a');
const switchModeSection = document.querySelector('#switchMode');
const readerNav = document.querySelector('.reader-nav');
const mainDisplay = document.querySelector('.main-display');
const reader  = document.getElementById('reader');
const lightMode = document.querySelector('.light');
const darkMode = document.querySelector('.dark');
let counter = document.getElementById("pageCounter");
const loading = document.querySelector('.loading');
const seeAllBooksBtn = document.getElementById('seeAll');
const allBooksSection = document.querySelector('.allBooksSection');
const booksPreviewSection = document.querySelector('.booksPreview');
const articlesMainSection = document.querySelector('.readsForYou');
const articlesTopSection = document.querySelector('.readsTopSection');
const librarySection = document.getElementById("library");
const h2 = librarySection.querySelector("h2");
const noLib = librarySection.querySelector(".noLibrary");
const showLib = librarySection.querySelector(".showLibrary");
const addBook = librarySection.querySelector('.addBook');
const addBookSection = librarySection.querySelector('.addBookSection');
const addMain = librarySection.querySelector('.addMain');
const toast = document.querySelector(".toast");
const bg = document.querySelector('.bg')

lightMode.addEventListener('click', ()=>{
  document.getElementById("closeReader").style.color = 'white';
  darkMode.style.opacity = '1';
  darkMode.style.zIndex = '1';
  lightMode.style.opacity = '0';
  lightMode.style.zIndex = '0';
  readerDiv.style.background = '#1a1a1a';
  readerDiv.style.color = '#e6e6e6';
  reader.style.color = '#e6e6e6';
  reader.style.fontWeight = '200'
  toast.style.color = '#e6e6e6';

})

darkMode.addEventListener('click', ()=>{
  document.getElementById("closeReader").style.color = 'black';
  lightMode.style.opacity = '1';
  toast.style.color = 'black';
  lightMode.style.zIndex = '1';
  darkMode.style.opacity = '0';
  darkMode.style.zIndex = '0';
  readerDiv.style.background = 'white';
  readerDiv.style.color = 'black';
  reader.style.color = 'black';
  reader.style.fontWeight = '400';
})

function calculateGlobalProgress(library) {
  let pagesRead = 0;
  let booksRead = 0;

  library.forEach(book => {
    if(book){
      if (book.totalPages) {
      pagesRead += Math.min(book.currentPage || 0, book.totalPages);
    } 
    if (book.finished) {
      booksRead += 1;
    }
    }
    
  });

  return { pagesRead, booksRead };
}

const message = document.querySelector('.message');

async function loadBookIntoReader(bookRef) {
  mainDisplay.style.opacity = "0";
  readerNav.style.opacity = "1";
  loading.style.opacity = "1";
  smallerNavSection.xmlns = "http://www.w3.org/2000/svg";
  smallerNavSection.innerHTML = '<g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3 6.1519V19.3095C3.99197 18.8639 5.40415 18.4 7 18.4C8.58915 18.4 9.9999 18.8602 11 19.3094V6.1519C10.7827 6.02653 10.4894 5.8706 10.1366 5.71427C9.31147 5.34869 8.20352 5 7 5C5.26385 5 3.74016 5.72499 3 6.1519ZM13 6.1519V19.3578C13.9977 18.9353 15.41 18.5 17 18.5C18.596 18.5 20.0095 18.9383 21 19.3578V6.1519C20.2598 5.72499 18.7362 5 17 5C15.7965 5 14.6885 5.34869 13.8634 5.71427C13.5106 5.8706 13.2173 6.02653 13 6.1519ZM12 4.41985C11.7302 4.26422 11.3734 4.07477 10.9468 3.88572C9.96631 3.45131 8.57426 3 7 3C4.69187 3 2.76233 3.97065 1.92377 4.46427C1.30779 4.82687 1 5.47706 1 6.11223V20.0239C1 20.6482 1.36945 21.1206 1.79531 21.3588C2.21653 21.5943 2.78587 21.6568 3.30241 21.3855C4.12462 20.9535 5.48348 20.4 7 20.4C8.90549 20.4 10.5523 21.273 11.1848 21.6619C11.6757 21.9637 12.2968 21.9725 12.7959 21.6853C13.4311 21.32 15.0831 20.5 17 20.5C18.5413 20.5 19.9168 21.0305 20.7371 21.4366C21.6885 21.9075 23 21.2807 23 20.0593V6.11223C23 5.47706 22.6922 4.82687 22.0762 4.46427C21.2377 3.97065 19.3081 3 17 3C15.4257 3 14.0337 3.45131 13.0532 3.88572C12.6266 4.07477 12.2698 4.26422 12 4.41985Z" fill="white"></path> </g>';
  if(window.innerWidth>=768){
    smallerNavSection.style.width = '20px'; 
  smallerNavSection.style.padding = '17px 21px';
  smallerNavSection.style.height = '25px'; 
  }
  welcomeLogo.style.opacity = '0';
  setTimeout(() => {
    welcomeLogo.style.display = 'none';
    readerDiv.style.position = "relative";
    mainDisplay.style.width = '9%';
    mainDisplay.style.display = "none";
    readerDiv.style.opacity = "1";
  }, 320);

  let url;
  if (typeof bookRef === "string") {
    url = `https://us-central1-booksy-app-a2c22.cloudfunctions.net/api/ia/text?identifier=${encodeURIComponent(bookRef)}`;
  } else {
    url = `https://us-central1-booksy-app-a2c22.cloudfunctions.net/api/ia/text?title=${encodeURIComponent(
      bookRef.title
    )}&author=${encodeURIComponent(bookRef.author)}`;
  }

  try {
    const res = await fetch(url);
    const ct = res.headers.get("content-type") || "";
    
    if (ct.startsWith("text/plain")) {
      const text = await res.text();
      switchModeSection.style.opacity = "1";
      readerNav.style.display = "flex";
      paginateText(text);

      let savedPage = 0;
      if (typeof bookRef !== "string") {
        const user = auth.currentUser;
        if (user) {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            const existing = (data.library || []).find(
              (b) => b.title === bookRef.title && b.author === bookRef.author
            );

            if (existing) {
              savedPage = existing.currentPage || 0;
            }
            await addBookToLibrary(bookRef, pages.length, 'normal');
          }
        }
      }

      if (savedPage > 0 && savedPage < pages.length) {
        currentPage = savedPage;
        renderPage();
      }

      return;
    }
    let data;
    try {
      data = await res.json();
      console.log("Got JSON:", data);
    } catch (err) {
      console.error("Failed to parse JSON from backend:", err);
    }

    if (data && data.mode === "alt" && data.url) {
      const filename = data.url.split("/").pop();
      console.log("ALT fallback triggered, file:", filename);
      loading.style.opacity = "0";
      message.innerHTML = `
        <p>This book is available as <b>${data.type.toUpperCase()}</b>.</p>
        <p>
          <a href="${data.url}" download="${filename}" target="_blank" rel="noopener">
            📥 Download ${data.type.toUpperCase()} file
          </a>
        </p>
        <p>(You can later import this file into your Library to read inside the app.)</p>
      `;
      message.style.opacity = "1";
      return;
    }

    if (data?.error === "restricted") {
      reader.innerHTML = `
        <p>${data.message}</p>
        <p><a href="${data.borrowUrl}" target="_blank" rel="noopener">Borrow on Internet Archive</a></p>
      `;
      return;
    }

    if (data?.mode === "none") {
      console.log("none");
      const id = typeof bookRef === "string" ? bookRef : bookRef.identifier || "";
      message.style.opacity = "1";
      loading.style.opacity = "0";
      message.innerHTML = `
        <h2>Sorry, we could not load the book here.</h2>
        <p>You can try downloading the book from 
          <a href="https://archive.org/details/${id}" target="_blank" rel="noopener">
            the Internet Archive page
          </a>,<br> then add it to your library and read ❤️
        </p>
      `;
      return;
    }
    try {
      const raw = await res.text();
      console.error("Unexpected response from backend. Raw body:", raw);
    } catch (err) {
      console.error("Unexpected response and failed to read body:", err);
    }
    throw new Error("Unexpected response structure");
  } catch (e) {
    console.error("Error in loadBookIntoReader:", e);
    reader.innerHTML = "Failed to load book text.";
  }
}
async function loadImportedBookIntoReader(book, text) {
  const readerDiv = document.querySelector(".reader-container");
  const readerNav = document.querySelector(".reader-nav");
  const content = document.querySelector(".content");
  const loading = document.querySelector(".loading");
  const reader = document.getElementById("reader");
  const switchModeSection = document.querySelector("#switchMode");
  const message = document.querySelector(".message");
  const mainDisplay = document.querySelector(".main-display");

  readerNav.style.opacity = "1";
  loading.style.opacity = "1";

  smallerNavBar();

  setTimeout(() => {
    readerDiv.style.position = "relative";
    mainDisplay.style.width = "9%";
    mainDisplay.style.display = "none";
    readerDiv.style.opacity = "1";
  }, 320);

  switchModeSection.style.opacity = "1";
  readerNav.style.display = "flex";

  paginateText(text); 

  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const data = snap.data();
  const existing = (data.library || []).find(b => b.id === book.id);

  if (existing) {

    if (!existing.totalPages || existing.totalPages !== pages.length) {
      await updateDoc(userRef, {
        library: data.library.map(b =>
          b.id === book.id ? { ...b, totalPages: pages.length } : b
        ),
      });
    }

    if (existing.currentPage > 0 && existing.currentPage < pages.length) {
      currentPage = existing.currentPage;
      renderPage();
    }
  }
}

let pages = [], currentPage = 0;

function paginateText(text) {
  const words = text.split(/\s+/);
  let wordsPerPage;
  if(width>=768) wordsPerPage = 370;
  if(width<768) wordsPerPage = 150;
  pages = [];
  for (let i = 0; i < words.length; i += wordsPerPage) {
    pages.push(words.slice(i, i + wordsPerPage).join(" "));
  }
  currentPage = 0;
  renderPage();
}
function renderPage() {
  const loading = document.querySelector(".loading");
  loading.style.opacity = '0';
  reader.style.opacity='1';
  reader.textContent = pages[currentPage];
  counter.textContent = `Page ${currentPage + 1} / ${pages.length}`;

}
async function updateReadingProgress(title, author, currentPage, totalPages) {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();

    const updatedLibrary = (data.library || []).map(b => {
      if (b.title === title && b.author === author) {
        const percentRead = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
        const finished = currentPage >= totalPages;
        if(b.state==='offline') return;
        return {
          ...b,
          currentPage,
          lastRead: new Date().toISOString(),
          progress: percentRead,
          finished,
          current: true,
        };
      }
      return { ...b, current: false };
    });


    const { pagesRead, booksRead } = calculateGlobalProgress(updatedLibrary);

  
    const updates = {
      library: updatedLibrary,
      progress: {
        ...data.progress,
        pagesRead,
        booksRead,
        currentBook: title
      }
    };

    const oldPages = data.progress?.pagesRead || 0;
    const diff = pagesRead - oldPages;
    if (diff > 0) {
      updates["achievements.daily.readPages"] = increment(diff);
      updates["achievements.weekly.readPages"] = increment(diff);
    }

    await updateDoc(userRef, updates);
  }
}

async function addBookToLibrary(book, totalPages, state) {
  const user = auth.currentUser;
  if (!user) return;
  let bookEntry;
  const userRef = doc(db, "users", user.uid);
  if(state==='normal'){
    bookEntry = {
      title: book.title,
      author: book.author,
      cover: book.cover || null,
      currentPage: 0,
      totalPages: totalPages || 0,
      current: true,
      startedAt: new Date().toISOString(),
      finished: false
    };
  } else if(state==='offline') {
    bookEntry = {
      title: book.title,
      author: book.author,
      cover: book.cover || null,
      currentPage: 0,
      totalPages: totalPages || 0,
      current: true,
      startedAt: new Date().toISOString(),
      finished: false,
      source: "offline"
    };
  } else if (state === 'imported') {
  bookEntry = {
    id: book.id || `${book.title}-${Date.now()}`,  // ✅ store id in Firestore
    title: book.title || "Untitled",
    author: book.author || "Unknown Author",
    cover: book.cover || "",
    currentPage: 0,
    totalPages: totalPages || 1,
    current: true,
    startedAt: new Date().toISOString(),
    finished: false,
    source: "imported"
  };
}
  try {
    const snap = await getDoc(userRef);
    let updatedLibrary = [];
    if (snap.exists()) {
      const data = snap.data();
      const lib = Array.isArray(data.library) ? data.library : [];

      const idx = lib.findIndex(
        b => b.title === book.title && b.author === book.author
      );

      if (idx >= 0) {
        updatedLibrary = lib.map((b, i) =>
          i === idx
            ? {
                ...b,
                current: true,
                totalPages: totalPages || b.totalPages || 0,
                cover: book.cover || b.cover || null,
                lastRead: new Date().toISOString(),
              }
            : { ...b, current: false }
        );
      } else {
        updatedLibrary = lib.map(b => ({ ...b, current: false }));
        updatedLibrary.push(bookEntry);
      }
    } else {
      updatedLibrary = [bookEntry];
    }

    await updateDoc(userRef, { library: updatedLibrary });
  } catch (err) {
    console.error("Failed to add book to library:", err);
  }
}

async function toggleWishlist(book, wishlistBtn) {
  const user = auth.currentUser;
  if (!user) return alert("You need to be logged in.");
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const data = snap.data();
  const wishlist = data.wishlist || [];
  const exists = wishlist.some(
    (b) => b.title === book.title && b.author === book.author
  );
  
  if (exists) {
    await updateDoc(userRef, {
      wishlist: arrayRemove({
        title: book.title,
        author: book.author,
        cover: book.cover || null,
      }),
    });
    wishlistBtn.style.fill = "none"; 
    bg.style.filter = 'brightness(0.7) blur(20px)'
  } else {
    await updateDoc(userRef, {
      wishlist: arrayUnion({
        title: book.title,
        author: book.author,
        cover: book.cover || null,
      }),
    });
    wishlistBtn.style.fill = "white";

    bg.style.filter = 'brightness(0.7) blur(20px)'
  }
}

document.getElementById("nextPage").onclick = async () => {
  if (currentPage < pages.length - 1) {
    currentPage++;
    renderPage();

    const user = auth.currentUser;
    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        const current = (data.library || []).find(b => b.current);
        if (current) {
          await updateReadingProgress(current.title, current.author, currentPage);
        }
      }
    }
  }
};

document.getElementById("prevPage").onclick = async () => {
  if (currentPage > 0) {
    currentPage--;
    renderPage();
    const user = auth.currentUser;
    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        const current = (data.library || []).find(b => b.current);
        if (current) {
          await updateReadingProgress(current.title, current.author, currentPage);
        }
      }
    }
  }
};

document.getElementById("closeReader").onclick = () => {
  welcomeLogo.style.display = 'block;'
  welcomeLogo.style.opacity='1';
  readerDiv.style.opacity = "0";
  switchModeSection.style.opacity = '0';
  readerDiv.style.position = "absolute";
  message.style.opacity ='0';
  mainDisplay.style.width = '100%';
  mainDisplay.style.display = 'flex';
  smallerNavSection.style.height = '32px';
  smallerNavSection.style.width = '25px';
  smallerNavSection.xmlns = '';
  smallerNavSection.innerHTML = `<path fill='white' fill-rule='evenodd' d='M10 7h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-8zM9 7H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3zM4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z' clip-rule='evenodd'></path>
  `;
  smallerNavSection.padding = '10px 13px';
  setTimeout(() => {
    welcomeLogo.style.opacity = '1';
    mainDisplay.style.display = 'flex';
    setTimeout(() => {
      mainDisplay.style.opacity = '1';
      reader.innerHTML = '';
      counter.textContent = '';
    }, 150);
  }, 500);
  if(window.innerWidth>=768){normalNavBar();} else {
    welcomeLogo.style.display = 'block';
  } 
};

function renderBooks(books, container) {

  container.innerHTML = "";
  if (!books || !books.length) {
    container.innerHTML = `<p style="opacity:.8;">No books found right now. Try again later.</p>`;
    return;
  }

  books.forEach(book => {
    const maxLength = 60;
    let shortTitle = book.title;
    if (book.title.length > maxLength) {
      shortTitle = book.title.slice(0, maxLength) + "...";
    }
    const bookEl = document.createElement("div");
    bookEl.classList.add("book");
    bookEl.innerHTML = `
      <img class="bookCover" src="${book.cover}" alt="">
      <div class="bookInfo">
        <div class="general">
          <h4 class="bookTitle">${shortTitle}</h4>
          <p class="bookAuthor">by ${book.author}</p>
        </div>
        <svg class="toWishlist addToWishlist" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.7 4C18.87 4 21 6.98 21 9.76C21 15.39 12.16 20 12 20C11.84 20 3 15.39 3 9.76C3 6.98 5.13 4 8.3 4C10.12 4 11.31 4.91 12 5.71C12.69 4.91 13.88 4 15.7 4Z"
            stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="bookActions">
        <p class="aboutBook">About</p>
        <p class="readBook">Read</p>
      </div>
    `;
    container.appendChild(bookEl);
    let aboutBookOpen = false;
    const aboutBookBtn = bookEl.querySelector(".aboutBook");
    aboutBookBtn.addEventListener("click", async () => {
      aboutBookOpen=true;
      let description = "No description available.";
      let pages = "Unknown";
      try {
        const query = `${book.title} ${book.author}`;
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const info = data.items[0].volumeInfo;
            if (info.description) description = info.description;
            if (info.pageCount) pages = info.pageCount;
          }
        }
        if (description === "No description available." || pages === "Unknown") {
          const resOL = await fetch(book.link + ".json");
          if (resOL.ok) {
            const data = await resOL.json();
            if (data.description && description === "No description available.") {
              description =
                typeof data.description === "string"
                  ? data.description
                  : data.description.value;
            }
            if ((data.number_of_pages || data.pagination) && pages === "Unknown") {
              pages = data.number_of_pages || data.pagination;
            }
          }
        }
        
        aboutBookSection.style.display = "block";
        smallerNavBar();
        mainDisplay.style.boxShadow = '2px 2px 30px rgba(0, 0, 0, 0.152)';
        mainDisplay.style.gap = '8px';
        setTimeout(() => {
            aboutBookSection.style.opacity = "1";
        }, 100);
        
      } catch (err) {
        console.error("Failed to fetch book details:", err);
      }

     const maxLength = 222;
      let shortDescription = description;
      if (description.length > maxLength) {
        shortDescription = description.slice(0, maxLength) + "...";
      }
      aboutBookSection.innerHTML = `
        <div class="top"><p class="closeAbout">Close</p>
        <h3>Book Details</h3></div>
        <img src="${book.cover}" alt="Cover" class="aboutBookCover"/>
        <div class="aboutBookDetails">
          <h2>${book.title}</h2>
          <h4>by ${book.author}</h4>
          <p class="pagesAmount">${pages} pages</p>
          <hr>
          <p class="aboutBookDesc">${shortDescription}</p>
        </div>
        <div class="bookActions">
          <p class="toWishlist">To Wishlist</p>
          <p class="readBook">Read</p>
        </div>
      `;
      aboutBookSection.querySelector(".readBook").addEventListener("click", async () => {
        let identifier = book.ia || await findIAIdentifierForWork(book.link, `${book.title} ${book.author}`);
        if (!identifier) {
          alert("Sorry, no free full text was found for this title.");
          return;
        }
        loadBookIntoReader(identifier);
      });

      aboutBookSection
        .querySelector(".closeAbout")
        .addEventListener("click", () => {
          aboutBookOpen = false;
          normalNavBar();
          aboutBookSection.style.opacity = "0";
          mainDisplay.style.boxShadow = '2px 2px 30px rgba(0, 0, 0, 0.252)';
          setTimeout(() => (aboutBookSection.style.display = "none"), 300);
        });
    });
    const readBookBtn = bookEl.querySelector(".readBook");
    readBookBtn.addEventListener("click", async () => {
      loadBookIntoReader({ title: book.title, author: book.author, cover: book.cover });
    });
    const wishlistBtn = bookEl.querySelector(".addToWishlist");
    wishlistBtn.addEventListener("click", () => {
      
      addBookToWishlist(book);
      
    });


  });
}

function renderOfflineBooks(books, container) {
  books.forEach(book => {
    const maxLength = 60;
    let shortTitle = book.title;
    if (book.title.length > maxLength) {
      shortTitle = book.title.slice(0, maxLength) + "...";
    }

    const bookEl = document.createElement("div");
    bookEl.classList.add("bookResult");
    bookEl.innerHTML = `
      <img class="bookCover" src="${book.cover}" alt="">
      <div class="bookInfo">
        <h4 class="bookTitle">${shortTitle}</h4>
        <p class="bookAuthor">by ${book.author}</p>
      </div>
    `;
    container.appendChild(bookEl);
    const details = document.createElement("div");
    details.classList.add("details");
    details.style.display = "none";
    details.innerHTML = `
      <div>
        <input name="progress" class="userProgress" placeholder="Pages read" type="number" min="0">
        <input name="totalPages" class="totalPages" placeholder="Total pages" type="number" min="1">
      </div>
      <button class="toLibrary" disabled>Add</button>
    `;
    bookEl.appendChild(details);

    const userProgress = details.querySelector(".userProgress");
    const totalPages = details.querySelector(".totalPages");
    const addBtn = details.querySelector(".toLibrary");
    bookEl.addEventListener("click", e => {
      if (e.target.tagName.toLowerCase() === "input" || e.target.tagName.toLowerCase() === "button") {
        return; 
      }
      details.style.display = details.style.display === "none" ? "flex" : "none";
    });

    function validateInputs() {
      const progressVal = parseInt(userProgress.value, 10);
      const totalVal = parseInt(totalPages.value, 10);
      if (!isNaN(progressVal) && !isNaN(totalVal) && totalVal > 0 && progressVal >= 0 && progressVal <= totalVal) {
        addBtn.disabled = false;
      } else {
        addBtn.disabled = true;
      }
    }
    userProgress.addEventListener("input", validateInputs);
    totalPages.addEventListener("input", validateInputs);

    addBtn.addEventListener("click", async () => {
      const progressVal = parseInt(userProgress.value, 10);
      const totalVal = parseInt(totalPages.value, 10);

      if (isNaN(progressVal) || isNaN(totalVal) || totalVal <= 0) return;

      await addBookToLibrary(
        { ...book },
        totalVal,
        "offline"
      );
      if (progressVal > 0) {
        await updateReadingProgress(book.title, book.author, progressVal, totalVal);
      }

      details.style.display = "none";
    });
  });
}
let aboutBookOpen = false;
const aboutBookSection = document.querySelector('.aboutBookSection');

async function showAboutBook(book) {
  aboutBookOpen=true;
      let description = "No description available.";
      let pages = "Unknown";
      try {
        const query = `${book.title} ${book.author}`;
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const info = data.items[0].volumeInfo;
            if (info.description) description = info.description;
            if (info.pageCount) pages = info.pageCount;
          }
        }
        if (description === "No description available." || pages === "Unknown") {
          const resOL = await fetch(book.link + ".json");
          if (resOL.ok) {
            const data = await resOL.json();
            if (data.description && description === "No description available.") {
              description =
                typeof data.description === "string"
                  ? data.description
                  : data.description.value;
            }
            if ((data.number_of_pages || data.pagination) && pages === "Unknown") {
              pages = data.number_of_pages || data.pagination;
            }
          }
        }
        
        
        
      } catch (err) {
        console.error("Failed to fetch book details:", err);
      }

     const maxLength = 422;
      let shortDescription = description;
      if (description.length > maxLength) {
        shortDescription = description.slice(0, maxLength) + "...";
      }
      aboutBookSection.innerHTML = `
        <div class="top"><p class="closeAbout">Close</p>
        <h3>Book Details</h3></div>
        <img src="${book.cover}" alt="Cover" class="aboutBookCover"/>
        <div class="about-main">
          
          <div class="aboutBookDetails">
            <h2>${book.title}</h2>
            <h4>by ${book.author}</h4>
            <p class="pagesAmount">${pages} pages</p>
            <hr>
            <p class="aboutBookDesc">${shortDescription}</p>
          </div>
          <div class="bookActions">
            <p class="toWishlist">To Wishlist</p>
            <p class="readBook">Read</p>
          </div>
        </div>
      `;
      aboutBookSection.querySelector(".readBook").addEventListener("click", async () => {
        let identifier = book.ia || await findIAIdentifierForWork(book.link, `${book.title} ${book.author}`);
        if (!identifier) {
          alert("Sorry, no free full text was found for this title.");
          return;
        }
        loadBookIntoReader(identifier);
      });

      aboutBookSection
        .querySelector(".closeAbout")
        .addEventListener("click", () => {
          aboutBookOpen = false;
          normalNavBar();
          aboutBookSection.style.opacity = "0";
          mainDisplay.style.gap = '55px';
          mainDisplay.style.boxShadow = '2px 2px 30px rgba(0, 0, 0, 0.252)';
          setTimeout(() => (aboutBookSection.style.display = "none"), 300);
        });
}
function createBookCard(book, userData) {
  const maxLength = 20;
  const shortTitle = book.title.length > maxLength
    ? book.title.slice(0, maxLength) + "..."
    : book.title;

  let bookCover = book.cover || "/images/user-profile/test2.jpg";

  const bookEl = document.createElement("div");
  bookEl.classList.add("book");
  bookEl.dataset.title = book.title;
  bookEl.dataset.author = book.author;
  const inWishlist = (userData?.wishlist || []).some(
    (b) => b.title === book.title && b.author === book.author
  );
  bookEl.innerHTML = `
    <img class="bookCover" src="${bookCover}" alt="">
    <div class="bookInfo">
      <div class="general">
        <h4 class="bookTitle">${shortTitle}</h4>
        <p class="bookAuthor">by ${book.author}</p>
      </div>
      <svg class="toWishlist addToWishlist" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
        style="fill:${inWishlist ? 'white' : 'none'}; stroke:#ffffff; stroke-width:2;">
        <path d="M15.7 4C18.87 4 21 6.98 21 9.76C21 15.39 12.16 20 12 20C11.84 20 3 15.39 3 9.76C3 6.98 5.13 4 8.3 4C10.12 4 11.31 4.91 12 5.71C12.69 4.91 13.88 4 15.7 4Z"stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="bookActions">
      <p class="aboutBook">About</p>
      <p class="readBook">Read</p>
    </div>
  `;
  
  bookEl.querySelector(".aboutBook").addEventListener("click", ()=>{showAboutBook(book); aboutBookSection.style.display = "block";
        smallerNavBar();
        mainDisplay.style.boxShadow = '2px 2px 30px rgba(0, 0, 0, 0.152)';
        mainDisplay.style.gap = '8px';
        setTimeout(() => {
            aboutBookSection.style.opacity = "1";
        }, 100);});

  bookEl.querySelector(".readBook").addEventListener("click", () => {
    loadBookIntoReader({ title: book.title, author: book.author, cover: book.cover});
  });
  const wishlistBtn = bookEl.querySelector(".addToWishlist");
  wishlistBtn.addEventListener("click", () => {
    toggleWishlist(book, wishlistBtn);
  });
  return bookEl;
}

function createWishlistCard(book, userData) {
  const maxLength = 60;
  const shortTitle = book.title.length > maxLength
    ? book.title.slice(0, maxLength) + "..."
    : book.title;

  let bookCover = book.cover || "/images/user-profile/test2.jpg";

  const bookEl = document.createElement("div");
  bookEl.classList.add("book");
  bookEl.dataset.title = book.title;
  bookEl.dataset.author = book.author;

  bookEl.innerHTML = `
    <img class="bookCover" src="${bookCover}" alt="">
    <div class="bookInfo">
      <div class="general">
        <h4 class="bookTitle">${shortTitle}</h4>
        <p class="bookAuthor">by ${book.author}</p>
      </div>
      <svg class="removeFromWishlist" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
        style="fill:white; stroke:#ffffff; stroke-width:2;">
        <path d="M15.7 4C18.87 4 21 6.98 21 9.76C21 15.39 12.16 20 12 20C11.84 20 3 15.39 3 9.76C3 6.98 5.13 4 8.3 4C10.12 4 11.31 4.91 12 5.71C12.69 4.91 13.88 4 15.7 4Z"stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="bookActions">
      <p class="aboutBook">About</p>
      <p class="readBook">Read</p>
    </div>
  `;

  bookEl.querySelector(".aboutBook").addEventListener("click", async () => {
    aboutBookSection.style.display = "block";
        smallerNavBar();
        mainDisplay.style.boxShadow = '2px 2px 30px rgba(0, 0, 0, 0.152)';
        mainDisplay.style.gap = '8px';
        setTimeout(() => {
            aboutBookSection.style.opacity = "1";
        }, 100);
    showAboutBook(book);
  });

  bookEl.querySelector(".readBook").addEventListener("click", () => {
    loadBookIntoReader({ title: book.title, author: book.author, cover: book.cover });
  });

  const removeBtn = bookEl.querySelector(".removeFromWishlist");
  removeBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return alert("You need to be logged in.");
    const userRef = doc(db, "users", user.uid);

    await updateDoc(userRef, {
      wishlist: arrayRemove({
        title: book.title,
        author: book.author,
        cover: book.cover || null
      }),
    });
    bookEl.remove();
  });

  return bookEl;
}

export function renderWishlist(userData) {
  const wishlistContainer = document.getElementById("wishlist");
  wishlistContainer.innerHTML = "<h3>Your Wishlist</h3><div class='wishlist-list'></div>";
  const list = wishlistContainer.querySelector(".wishlist-list");
  if (!userData.length) {
    list.innerHTML = `<p style="opacity:.7; margin:0px;">No book was added to wishlist yet.</p>`;
    return;
  }
  list.style.marginLeft = '10px';
  (userData || []).forEach(book => {
    const card = createWishlistCard(book, userData);
    list.appendChild(card);
  });
   bg.style.filter = 'brightness(0.7)';
}

async function fetchRecommendedFromBackend(preferred = []) {
 const qs = preferred.length
    ? `?preferred=${encodeURIComponent(preferred.join(","))}`
    : "";
  const res = await fetch(`https://us-central1-booksy-app-a2c22.cloudfunctions.net/api/books${qs}`);
  
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  return res.json();
}

function renderPreviewBooks(preview, userData) {
  const container = document.querySelector(".booksPreview");
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(preview) || preview.length === 0) {
    container.innerHTML = `<p style="opacity:.8;">No preferred genres found or no books available.</p>`;
    return;
  }

  preview.forEach(book => {
    container.appendChild(createBookCard(book, userData));
  });
}

function renderAllBooks(genresMap, userData) {
  const container = document.querySelector(".allBooks");
  if (!container) return;

  container.innerHTML = "";

  for (const [genre, books] of Object.entries(genresMap)) {
    if (!Array.isArray(books) || books.length === 0) continue;

    books.forEach(book => container.appendChild(createBookCard(book, userData)));
  }
}

function initGenresNav(genresMap) {
  const nav = document.querySelector("#genres");
  const container = document.querySelector(".allBooks");
  if (!nav || !container) return;

  nav.addEventListener("click", (e) => {
    const el = e.target.closest("p");
    if (!el) return;

    [...nav.querySelectorAll("p")].forEach(p => p.id = "");
    el.id = "shownGenre";

    const label = el.textContent.trim().toLowerCase();
    if (label === "all recs") {
      renderAllBooks(genresMap);
      return;
    }

    const list = genresMap[label];
    container.innerHTML = "";

    if (Array.isArray(list) && list.length) {
      list.forEach(book => container.appendChild(createBookCard(book)));
    } else {
      container.innerHTML = `<p style="opacity:.8;">No books for “${label}”.</p>`;
    }
  });
}

async function initCuratedBooks(preferredGenres, userData) {
  try {
    const data = await fetchRecommendedFromBackend(preferredGenres); 
    renderPreviewBooks(data.preview, userData);
    renderAllBooks(data.genres, userData);
    initGenresNav(data.genres); 
  } catch (err) {
    console.error("Failed to init curated books:", err);
  }
}

function initBooks(userData) {
  initCuratedBooks(userData?.preferredGenres || [], userData);
}

let allShown = false;

seeAllBooksBtn.addEventListener('click', ()=>{
  if(!allShown){
    allShown=true;
    seeAllBooksBtn.innerHTML = 'SEE LESS'
    allBooksSection.style.display = 'flex';
    //info.style.display ='block';
    booksPreviewSection.style.opacity = '0';
    articlesMainSection.style.opacity = '0';
    articlesTopSection.style.opacity = '0';
    setTimeout(()=>{
      allBooksSection.style.opacity = '1';
      booksPreviewSection.style.display = 'none';
      articlesMainSection.style.display = 'none';
      articlesTopSection.style.display = 'none';
    }, 400);
 } else{
  allShown = false;
  seeAllBooksBtn.innerHTML = 'SEE MORE'
  allBooksSection.style.opacity = '0';
    setTimeout(()=>{
      allBooksSection.style.display = 'none';
      booksPreviewSection.style.display = 'flex';
     articlesMainSection.style.display = 'flex';
     articlesTopSection.style.display = 'block';
       setTimeout(()=>{
        booksPreviewSection.style.opacity = '1';
        articlesMainSection.style.opacity = '1';
        articlesTopSection.style.opacity = '1';
    },80);
    }, 200)
   
 }
})

export function renderLibBooks(books, userRef, uData, thisUser) {

  let activeFilter = "all";
          showLib.querySelectorAll(".year-section").forEach(el => el.remove());
          const emptySection = document.querySelector('.empty-section');
          if(emptySection) showLib.removeChild(emptySection);
          if (!books.length) {
            const emptyDiv = document.createElement("div");
            emptyDiv.classList.add("empty-section");
            if (activeFilter === "all") {
              emptyDiv.innerHTML = `<p style="opacity:.8;">Your library is empty. Start adding books 📚</p>`;
            } else if (activeFilter === "inProgress") {
              emptyDiv.innerHTML = `<p style="opacity:.8;">You haven’t started reading anything yet.<br> Pick a book to begin 📖</p>`;
            } else if (activeFilter === "finished") {
              emptyDiv.innerHTML = `<p style="opacity:.8;">You haven’t finished a book yet.<br> Keep going 💪</p>`;
            }

            showLib.appendChild(emptyDiv);
            return;
          }

          const booksByYear = {};
          books.forEach(book => {
            const started = new Date(book.startedAt || book.lastRead).getFullYear();
            const finished = book.finishedAt ? new Date(book.finishedAt).getFullYear() : null;
            const year = finished || started;
            if (!booksByYear[year]) booksByYear[year] = [];
            booksByYear[year].push(book);
          });

          Object.keys(booksByYear).sort((a, b) => b - a).forEach(year => {
              const yearDiv = document.createElement("div");
              yearDiv.classList.add("year-section");
              yearDiv.innerHTML = `<h3>${year}</h3>`;
              const booksShelf = document.createElement("div");
              booksShelf.classList.add("books-shelf");
              if (initialized) {
                booksShelf.style.gridTemplateColumns = "repeat(3,1fr)";
              }
              yearDiv.appendChild(booksShelf);

              booksByYear[year].forEach(book => {
                const bookDiv = document.createElement("div");
                bookDiv.classList.add("book-entry");

                const currentPage = book.currentPage || 0;
                const totalPages = book.totalPages || 0;
                const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

                bookDiv.innerHTML = `
                  <img src="${book.cover}" alt="${book.title}" />
                  <div class='book-main' style='display:flex; flex-direction:column; justify-content: space-between;width:100%;'>
                    <div style='display:flex; justify-content:space-between;'>
                      <h4>${book.title}</h4>
                      <svg class='open-menu' viewBox="0 0 24 24" fill="none"><path d="M7 12C7 13.1 6.1 14 5 14S3 13.1 3 12s.9-2 2-2 2 .9 2 2zM14 12c0 1.1-1 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM21 12c0 1.1-1 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" fill="#fff"/></svg>
                    </div>
                    <p>${book.author || ""}</p>
                      <div class="progress-info">
                        <span>${currentPage} / ${totalPages}</span>
                        <span>${progress}%</span>
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill" style="width:${progress}%"></div>
                      </div>
                  </div>
                  <div class='book-menu'>
                    <p class='close-menu'>Back</p>
                    <div class='menu-actions'>
                       <div class='add-to-wishlist'>
                        <svg class="wishlist" viewBox="0 0 24 24" fill="none"><path d="M15.7 4C18.87 4 21 6.98 21 9.76C21 15.39 12.16 20 12 20C11.84 20 3 15.39 3 9.76C3 6.98 5.13 4 8.3 4C10.12 4 11.31 4.91 12 5.71C12.69 4.91 13.88 4 15.7 4Z" stroke="#fff" stroke-width="2"/></svg>
                        <p>Add To Wishlist</p>
                      </div>
                      <div class='mark-finished'>
                        <svg class='finish' fill="#000" viewBox="0 0 24 24"><path d="M12,21a9,9,0,1,1,9-9A9,9,0,0,1,12,21ZM8,11.5l3,3,5-5" stroke="#fff" stroke-width="1.5" fill="none"/></svg>
                        <p>Mark book as finished</p>
                      </div>
                      <div class='mark-inprogress'>
                        <svg class='finish' fill="lightgreen" viewBox="0 0 24 24"><path d="M12,21a9,9,0,1,1,9-9A9,9,0,0,1,12,21ZM8,11.5l3,3,5-5" stroke="lightgreen" stroke-width="1.5" fill="none"/></svg>
                        <p>Mark as not finished</p>
                      </div>
                      <div class='delete-book'>
                        <svg viewBox="0 0 24 24" fill="none"><path d="M12 19H5c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h4.6L12 7h7c1.1 0 2 .9 2 2v2" stroke="red" stroke-width="2"/><path d="M16 15l2.5 2.5M21 20l-2.5-2.5M18.5 17.5L21 15M18.5 17.5L16 20" stroke="red" stroke-width="2"/></svg>
                        <p>Delete book from library</p>
                      </div>
                    </div>
                  </div>
                `;

                booksShelf.appendChild(bookDiv);

                const bookMenu = bookDiv.querySelector('.book-menu');
                const bookMain = bookDiv.querySelector('.book-main');
                const btnWishlist = bookDiv.querySelector('.add-to-wishlist');
                const btnFinish = bookDiv.querySelector('.mark-finished');
                const btnInProgress = bookDiv.querySelector('.mark-inprogress');
                const btnDelete = bookDiv.querySelector('.delete-book');
                const finishedInfo = document.createElement('div');
                const progressInfo = bookDiv.querySelector('.progress-info');
                const progressBar = bookDiv.querySelector('.progress-bar');
                const menuActions = bookDiv.querySelector('.menu-actions');
                if (book.source === 'offline') {
                    const editProgress = document.createElement('div');
                    editProgress.classList.add('edit-progress');
                    editProgress.innerHTML = `
                      <svg class="editReadingProgress" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.9445 9.1875L14.9445 5.1875M18.9445 9.1875L13.946 14.1859C13.2873 14.8446 12.4878 15.3646 11.5699 15.5229C10.6431 15.6828 9.49294 15.736 8.94444 15.1875C8.39595 14.639 8.44915 13.4888 8.609 12.562C8.76731 11.6441 9.28735 10.8446 9.946 10.1859L14.9445 5.1875M18.9445 9.1875C18.9445 9.1875 21.9444 6.1875 19.9444 4.1875C17.9444 2.1875 14.9445 5.1875 14.9445 5.1875M20.5 12C20.5 18.5 18.5 20.5 12 20.5C5.5 20.5 3.5 18.5 3.5 12C3.5 5.5 5.5 3.5 12 3.5" 
                          stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <p>Edit progress</p>
                    `;
                    menuActions.appendChild(editProgress);
                    menuActions.replaceChild(editProgress, btnWishlist);

                    editProgress.addEventListener('click', (e) => {
                      e.stopPropagation();
                      const editProgressSection = document.createElement('div');
                      editProgressSection.classList.add('editProgressSection');
                      editProgressSection.innerHTML = `
                        <div class='change' style='display:flex'>
                          <div>
                          <label>
                            Pages read:
                            <input type="number" class="editPagesRead" min="0" value="${book.currentPage || 0}">
                          </label>
                        </div>
                        <div>
                          <label>
                            Total pages:
                            <input type="number" class="editTotalPages" min="1" value="${book.totalPages || 0}">
                          </label>
                        </div>
                        </div>
                        <button class="saveProgressBtn">Save Progress</button>
                      `;
                      menuActions.innerHTML = "";
                      menuActions.appendChild(editProgressSection);
                      const editPagesRead = editProgressSection.querySelector(".editPagesRead");
                      const editTotalPages = editProgressSection.querySelector(".editTotalPages");
                      const saveBtn = editProgressSection.querySelector(".saveProgressBtn");
                      function validateInputs() {
                        const readVal = parseInt(editPagesRead.value, 10);
                        const totalVal = parseInt(editTotalPages.value, 10);
                        if (!isNaN(readVal) && !isNaN(totalVal) && totalVal > 0 && readVal >= 0 && readVal <= totalVal) {
                          saveBtn.disabled = false;
                        } else {
                          saveBtn.disabled = true;
                        }
                      }
                  
                      editPagesRead.addEventListener("input", validateInputs);
                      editTotalPages.addEventListener("input", validateInputs);
                      editPagesRead.addEventListener('click', ()=>{
                        e.stopPropagation()
                      })
                      editTotalPages.addEventListener('click', ()=>{
                        e.stopPropagation()
                      })
                      validateInputs(); 

                      saveBtn.addEventListener("click", async (e) => {
                        e.stopPropagation()
                        const newRead = parseInt(editPagesRead.value, 10);
                        const newTotal = parseInt(editTotalPages.value, 10);
                        let pagesProgress = userData.achievements.daily.readPages;
                        if(newRead>currentPage) {
                          pagesProgress += newRead-currentPage;
                        }
                        
                        await updateReadingProgress(book.title, book.author, newRead, newTotal);
                        await updateDoc(userRef, {
                          "achievements.daily.readPages": pagesProgress,
                          "achievements.weekly.readPages": pagesProgress
                        });
                 
                        book.currentPage = newRead;
                        book.totalPages = newTotal;

                        menuActions.innerHTML = "";
                        menuActions.appendChild(editProgress);

                      });
                    });
                }

                finishedInfo.style.display = 'flex';
                finishedInfo.style.gap ='8px';
                finishedInfo.innerHTML = `
                  <svg class='finish' fill="lightgreen" viewBox="0 0 24 24"><path d="M12,21a9,9,0,1,1,9-9A9,9,0,0,1,12,21ZM8,11.5l3,3,5-5" stroke="lightgreen" stroke-width="1.5" fill="none"/></svg>
                  <p>Finished</p>
                `;
                finishedInfo.querySelector('svg').style.width = '22px';
                function setFinishedUI(isFinished) {
                  if (isFinished) {
                    btnInProgress.style.display = 'flex';
                    btnFinish.style.display = 'none';
                    progressInfo.style.display = 'none';
                    progressBar.style.transform = 'translateY(1px)';
                    bookMain.appendChild(finishedInfo);
                  } else {
                    btnInProgress.style.display = 'none';
                    btnFinish.style.display = 'flex';
                    progressInfo.style.display = 'flex';
                    progressBar.style.transform = 'translateY(-3px)';
                    if(bookMain.lastChild === finishedInfo) bookMain.removeChild(finishedInfo);
                  }
                }
                setFinishedUI(!!book.finished);

                bookDiv.querySelector('.open-menu').addEventListener('click', e => {
                  e.stopPropagation();
                  bookMenu.style.zIndex = '1';
                  bookMenu.style.opacity = '1';
                  bookDiv.style.backdropFilter = 'none';
                  bookDiv.style.removeProperty('backdropFilter');
                });
                bookDiv.querySelector('.close-menu').addEventListener('click', e => {
                  e.stopPropagation();
                  bookMenu.style.zIndex = '0';
                  bookMenu.style.opacity = '0';
                  bookDiv.style.backdropFilter = 'blur(10px)';
                });

                async function toggleFinished(desiredState) {
                  const user = auth.currentUser;
                  if (!user) return;

                  setFinishedUI(desiredState);

                  const userRef = doc(db, "users", user.uid);
                  try {
                    const snap = await getDoc(userRef);
                    if (!snap.exists()) return;
                    const data = snap.data();

                    const updatedLibrary = (data.library || []).map(b => {
                      if (b.title === book.title && b.author === book.author) {
                        const updated = { ...b, finished: desiredState };
                        if (desiredState) {
                          updated.finishedAt = new Date().toISOString();
                          updated.current = false;
                        } else {
                          delete updated.finishedAt;
                        }
                        return updated;
                      }
                      return b;
                    });

                    const { pagesRead, booksRead } = calculateGlobalProgress(updatedLibrary);

                    await updateDoc(userRef, {
                      library: updatedLibrary,
                      progress: {
                        ...data.progress,
                        pagesRead,
                        booksRead,
                        currentBook: desiredState ? null : data.progress?.currentBook ?? null
                      }
                    });

                    book.finished = desiredState;
                  } catch (err) {
                    console.error(err);
                    setFinishedUI(!desiredState);
                  }
                }

                btnFinish.addEventListener('click', async (e) => { 
                  e.stopPropagation(); 
                  toggleFinished(true); 
                  if(userData.achievements.weekly.finishedBook!== 'claimed'){
                    await updateDoc(userRef, {
                      [`achievements.weekly.finishedBook`]: true
                    });
                  }
                  
                });
                btnInProgress.addEventListener('click', e => { e.stopPropagation(); toggleFinished(false); });

                btnDelete.addEventListener('click', async e => {
                  e.stopPropagation();
                  const user = auth.currentUser;
                  if (!user) return;

                  const userRef = doc(db, "users", user.uid);
                  try {
                    const snap = await getDoc(userRef);
                    if (!snap.exists()) return;
                    const data = snap.data();

                    const updatedLibrary = (data.library || []).filter(b => !(b.title === book.title && b.author === book.author));
                    const { pagesRead, booksRead } = calculateGlobalProgress(updatedLibrary);

                    await updateDoc(userRef, {
                      library: updatedLibrary,
                      progress: { ...data.progress, pagesRead, booksRead }
                    });

                    bookDiv.remove();
                  } catch (err) {
                    console.error('Delete failed', err);
                  }
                });

                btnWishlist.addEventListener('click', async e => {
                  e.stopPropagation();
                  const user = auth.currentUser;
                  if (!user) return;
                  const userRef = doc(db, "users", user.uid);
                  try {
                    const snap = await getDoc(userRef);
                    if (!snap.exists()) return;
                    const data = snap.data();

                    const updatedLibrary = (data.library || []).filter(b => !(b.title === book.title && b.author === book.author));
                    const updatedWishlist = [...(data.wishlist || []), book];

                    await updateDoc(userRef, {
                      library: updatedLibrary,
                      wishlist: updatedWishlist
                    });

                    bookDiv.remove();
                  } catch (err) {
                    console.error('Wishlist failed', err);
                  }
                });
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
                function assignBookToSession(book) {
                if (!thisUser) return;

                const userRef = doc(db, "users", thisUser.uid);
                updateDoc(userRef, {
                  "unplannedSession.assignedBook": {
                    title: book.title,
                    author: book.author,
                    cover: book.cover,
                    pagesRead: book.currentPage,
                    totalPages: book.totalPages || 0,
                    progress: book.progress
                  },
                  "progress.currentBook": book.title 

                }).then(() => {
                  console.log("Book assigned to focus session:", book.title);
                });
                updateAssignedBookUI(userData)

                }
                bookDiv.addEventListener("click", () => {
                  if(document.querySelector('.editProgressSection')){
                    return
                  }
                  
                  if(book.source === 'offline') {
                    bookDiv.addEventListener("click", async () => {
                       try {
                                      const userRef = doc(db, "users", auth.currentUser.uid);
                                      const defaultCommit = (uData && uData.unplannedSession && uData.unplannedSession.timeCommitment) || "15 min";
                    
                      
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
                                    }, 200)
                                    console.log('here')
                    assignBookToSession(book);
                    setTimeout(() => {
                      //runFocusAnimation();
                      library.style.opacity = '0';
                      focusMode.style.display = 'block';
                      smallerNavBar();
                      smallerNavSection.style.display = 'none';
                      nav.forEach(nav =>{
                        nav.style.gap = '15px';
                      });
                      navs.style.gap='15px';
                      miniNav.style.gap = '15px';
                      setTimeout(() => {
                        library.style.display = 'none';
                        focusMode.style.opacity = '1';
                      }, 350);
                    }, 350);
                    
                  });

                    return;
                  } else if(book.source ==='imported'){
                      getImportedBook(book.id).then(async (buffer) => {
                      if (!buffer) {
                        console.warn("No stored data for imported book:", book.id);
                        return;
                      }
                      const textContent = await extractEpubTextWithJSZip(buffer);
                      loadImportedBookIntoReader(book, textContent);
                    }).catch((err) => console.error("Failed to load imported book", err));
                  } else {
                    loadBookIntoReader({ title: book.title, author: book.author, cover: book.cover });
                  }
                });
                const importBtn = document.querySelector(".optionImport");
                const fileInput = document.querySelector(".importFileInput");
                if (importBtn && fileInput) {
                    importBtn.addEventListener("click", () => {
                      fileInput.click();
                    });
                    async function openImportedDB() {
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
                    async function saveImportedBook(id, file) {
                      const buffer = await file.arrayBuffer();
                      const db = await openImportedDB();
                      return new Promise((resolve, reject) => {
                        const tx = db.transaction("books", "readwrite");
                        tx.objectStore("books").put({ id, buffer });
                        tx.oncomplete = () => resolve();
                        tx.onerror = (e) => reject(e.target.error);
                      });
                    }

                    fileInput.addEventListener("change", async (e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) return;

                      const ext = file.name.split('.').pop().toLowerCase();
                      const defaultTitle = file.name.replace(/\.[^/.]+$/, '');
                      const defaultAuthor = "Unknown Author";

                      
                      let textPreview = "";
                      try {
                        if (ext === "txt") {
                          textPreview = await file.text();
                        } else if (ext === "pdf") {
                          textPreview = await extractPdfText(file);
                        }
                      } catch (err) {
                        console.error("Failed to parse file:", err);
                        alert("Could not parse this book, but you can still add it manually.");
                      }

                      let totalPages = 0;
                      if (textPreview) {
                        const words = textPreview.split(/\s+/);
                        totalPages = Math.ceil(words.length / 300);
                      }

                      const modal = document.querySelector(".addImportedSection");
                      modal.innerHTML = `
                        <h3>Edit Book Details</h3>
                        <div class='editProperties'>
                          <div class='importCover'>
                            <div style='display:flex;'>
                              <svg fill="#ffffff" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M21,14a1,1,0,0,0-1,1v4a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V15a1,1,0,0,0-2,0v4a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V15A1,1,0,0,0,21,14Zm-9.71,1.71a1,1,0,0,0,.33.21.94.94,0,0,0,.76,0,1,1,0,0,0,.33-.21l4-4a1,1,0,0,0-1.42-1.42L13,12.59V3a1,1,0,0,0-2,0v9.59l-2.29-2.3a1,1,0,1,0-1.42,1.42Z"></path></g></svg>
                              <p>Import cover</p>
                            </div>
                            <input type="file" id="importCover" accept="image/*">
                          </div>
                          <div>
                            <label>Title: <input type="text" id="importTitle" value="${defaultTitle}" maxlength='25'></label>
                            <label>Author: <input type="text" id="importAuthor" value="${defaultAuthor}"></label>
                            <label>Total Pages: <input type="number" id="importTotal" value="${totalPages}" min="1"></label>
                          </div>
                        </div>
                        <div style='display: flex; justify-content: space-between; margin-top:30px;'>
                          <button id="cancelImport">Cancel</button>
                          <button id="confirmImport">Add to Library</button>
                        </div>
                      `;
                      addMain.style.opacity = '0';
                      setTimeout(() => {
                        addMain.style.display = 'none';
                        modal.style.opacity = '1';
                        if(window.innerWidth>=1080) addBookSection.style.width = '60%';
                      }, 350);

                      const coverInput = modal.querySelector("#importCover");
                      const coverBlock = modal.querySelector(".importCover div");
                      coverInput.addEventListener("change", () => {
                        const file = coverInput.files[0];
                        if (file) {
                          coverBlock.style.position = 'relative';
                          coverInput.style.position = 'absolute';
                          coverBlock.style.top = '0';
                          coverBlock.style.left = '0';
                          const imgURL = URL.createObjectURL(file);
                          coverBlock.innerHTML = `<img src="${imgURL}" alt="Cover preview" >`;
                        }
                      });

                      modal.querySelector("#confirmImport").addEventListener("click", async () => {
                        addBook.style.display = 'block';
                        addBookSection.style.opacity = '0';
                        setTimeout(() => {

                          showLib.style.opacity = '1';
                          showLib.style.position = 'relative';

                          showLib.style.zIndex = '1';
                          document.querySelector('.libraryh2').style.zIndex = '1';
                          document.querySelector('.libraryh2').style.filter = 'blur(0px)';
                          setTimeout(() => {
                            addBookSection.style.display = 'none';
                            addBook.style.opacity = '1';
                          }, 150);
                        }, 200);

                        const title = modal.querySelector("#importTitle").value.trim() || defaultTitle;
                        const author = modal.querySelector("#importAuthor").value.trim() || defaultAuthor;
                        const total = parseInt(modal.querySelector("#importTotal").value, 10) || totalPages;
                        const bookId = `${title}-${Date.now()}`;
                        await saveImportedBook(bookId, file);
                        let cover = "";
                        const coverFile = modal.querySelector("#importCover").files[0];
                        if (coverFile) {
                          cover = URL.createObjectURL(coverFile);
                        }

                        const bookMeta = {
                          id: bookId || `${title}-${Date.now()}`,
                          title: title || "Untitled",
                          author: author || "Unknown Author",
                          cover: cover || "",   
                          fileType: ext || "epub",
                        };

                        const safeTotalPages = Number.isFinite(total) && total > 0 ? total : 1;

                        try {
                          await addBookToLibrary(bookMeta, safeTotalPages, "imported");
                        } catch (err) {
                          console.error("Failed to add book to library:", err);
                          alert("Could not save book: " + err.message);
                        }


                        modal.innerHTML = '';
                      });

                      modal.querySelector("#cancelImport").addEventListener("click", () => {
                        addBook.style.display = 'block';
                        addBookSection.style.opacity = '0';
                        setTimeout(() => {
                          showLib.style.filter = 'blur(0px)';
                          showLib.style.removeProperty('filter');
                          showLib.style.opacity = '1';
                          showLib.style.position = 'relative';
                          noLib.style.filter = 'blur(0px)';
                          noLib.style.removeProperty('filter');
                          showLib.style.zIndex = '1';
                          document.querySelector('.libraryh2').style.zIndex = '1';
                          document.querySelector('.libraryh2').style.filter = 'blur(0px)';
                          setTimeout(() => {
                            addBookSection.style.display = 'none';
                            addBook.style.opacity = '1';
                          }, 150);
                        }, 200);
                        modal.style.opacity = '0';
                        setTimeout(() => {
                          modal.innerHTML = '';
                          setTimeout(() => {
                            addMain.style.display = 'block';
                            addBookSection.style.width = '65%';
                            setTimeout(() => {
                              addMain.style.opacity = '1';
                            }, 150);
                          }, 150);
                        }, 150);
                      });
                    });
                }

              });

              showLib.appendChild(yearDiv);
              
          });
}