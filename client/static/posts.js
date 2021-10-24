import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js';
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-analytics.js";
import { getFirestore, query, orderBy, limit, collection, getDocs, Timestamp, FieldValue } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAHd6-39NMk368_8uBo1YBIqL0KsoBC6L8",
    authDomain: "astrahacks2.firebaseapp.com",
    projectId: "astrahacks2",
    storageBucket: "astrahacks2.appspot.com",
    messagingSenderId: "499081357518",
    appId: "1:499081357518:web:b72d15d3b88c5e6d19089f",
    measurementId: "G-DK6Y22K239"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth();
signInAnonymously(auth).then(() => {
    console.log("Signed in anonymously");
}).catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;

    console.error(errorMessage);

    Toastify({
        text: "Authentication Error " + errorCode,
        duration: 5000,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: "linear-gradient(to right, #f54254, #e6226a)",
            color: "#fff",
            "border-radius": "5px",
            "font-family": "'Roboto', sans-serif",
        }
    }).showToast();
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const db = getFirestore(app);

        // get posts
        const postRef = collection(db, "posts");
        const q = query(postRef, orderBy("timestamp", "desc"), limit(10));
        const querySnapshots = await getDocs(q);

        console.log(querySnapshots.size);
    } else {
        Toastify({
            text: "Authentication Logout",
            duration: 5000,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: "linear-gradient(to right, #f54254, #e6226a)",
                color: "#fff",
                "border-radius": "5px",
                "font-family": "'Roboto', sans-serif",
            }
        }).showToast();
    }
});