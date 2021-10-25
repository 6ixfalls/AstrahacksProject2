import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js';
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-analytics.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";
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

const postObject = $(".post").first();
const commentDefault = $(".comment").first();
const commentParent = commentDefault.parent();
const commentTemplate = commentDefault.clone();
commentTemplate.prop("style", "display: revert;");
commentDefault.remove();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const db = getFirestore(app);
        const postId = window.location.pathname.split("/").pop();

        // get posts
        const postRef = doc(db, "posts", postId);
        const post = await getDoc(postRef);

        const data = post.data();
        postObject.find(".post-title").text(data.title);
        postObject.find(".post-author").text(data.author);
        postObject.find(".comments").children("span").first().text(data.comments.length);
        postObject.find(".post-time").text(data.createdAt.toDate().toLocaleString());
        postObject.find(".content").html(data.content);
        postObject.parent().prop("style", "display: block !important;");

        data.comments.forEach((comment) => {
            const commentObject = commentTemplate.clone();
            commentObject.find(".post-author").text(comment.author);
            commentObject.find(".post-time").text(comment.createdAt.toDate().toLocaleString());
            commentObject.find(".post-content").html(comment.content);
            commentParent.append(commentObject);
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

// comment 
$("textarea").first().on("input propertychange paste", () => {
    $(".output-preview").first().html(marked($("textarea").first().val(), { breaks: true }));
});

$(".send-post").first().click(() => {
    $(".send-post").prop("disabled", true);
    axios({
        method: "post",
        url: "/api/comment",
        data: {
            content: $("textarea").first().val(),
            author: $(".output-title").first().val(),
            postId: window.location.pathname.split("/").pop(),
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

        window.location.reload();
    }).catch((error) => {
        Toastify({
            text: "Comment Error",
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