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

const postDefault = $(".post").first();
const postParentFrame = postDefault.parent();
const postTemplate = postDefault.clone();
postTemplate.prop("style", "display: revert;")
postDefault.remove();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const db = getFirestore(app);

        // get posts
        const postRef = collection(db, "posts");
        const q = query(postRef, orderBy("createdAt", "desc"), limit(10));
        const querySnapshots = await getDocs(q);

        querySnapshots.docs.forEach((doc) => {
            const data = doc.data();
            console.log(data);
            const post = postTemplate.clone();
            post.find(".post-title").text(data.title);
            post.find(".post-author").text(data.author);
            post.find(".comments").children("span").first().text(data.comments.length);
            post.find(".post-time").text(data.createdAt.toDate().toLocaleString());
            post.click(() => {
                window.location.href = "post/" + doc.id;
            });
            postParentFrame.append(post);
        });
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

$("textarea").first().on("input propertychange paste", () => {
    console.log($("textarea").first().val());
    $(".output-preview").first().html(marked($("textarea").first().val(), { breaks: true }));
});

$(".send-post").first().click(() => {
    $(".send-post").prop("disabled", true);
    axios({
        method: "post",
        url: "/api/post",
        data: {
            content: $("textarea").first().val(),
            title: $(".output-title").first().val(),
            author: $(".output-author").first().val(),
        },
        validateStatus: (status) => {
            return status == 200;
        }
    }).then((response) => {
        Toastify({
            text: "Post Success",
            duration: 5000,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: "linear-gradient(to right, #66de72, #42ffba)",
                color: "#fff",
                "border-radius": "5px",
                "font-family": "'Roboto', sans-serif",
            }
        }).showToast();
    }).catch((error) => {
        Toastify({
            text: "Post Error",
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

        if (error.headers["X-RateLimit-Reset"]) {
            console.log("ratelimit header was found, waiting time to end");
            setTimeout(() => { $(".send-post").prop("disabled", false) }, ((new Date.now().getTime() / 1000) - error.headers["X-RateLimit-Reset"]) * 1000);
        } else {
            $(".send-post").prop("disabled", false);
        }
    });
});

$(".new-post").first().click(() => {
    $(".post-modal").first().prop("style", "display: block;");
});

$(".close-modal").first().click(() => {
    $(".post-modal").first().prop("style", "display: none;");
});