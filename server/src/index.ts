import express from "express";
import path = require("path");
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import rateLimit from "express-rate-limit";
import createDOMPurify from "dompurify";
import marked from "marked";
import { json } from "body-parser";
import { JSDOM } from "jsdom";

// setup express & firebase
const serviceAccount = require(path.join(__dirname, "../admin-sdk.json"));

initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore();
const app = express();

// host static files
app.use(express.static(path.join(__dirname, "../../client/")));
app.use(json());

// API handler
const postLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 2, // limit each IP to 2 requests per windowMs
});

const commentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 4, // limit each IP to 4 requests per windowMs
});

app.post("/api/comment", commentLimiter, async (req, res) => {
    const postRef = db.collection("posts").doc(req.body.postId);
    const post = await postRef.get();

    if (!post.exists) {
        res.status(404).send("Post not found");
    } else {
        const window = new JSDOM("").window;
        // typescript cant cast from jsdom window to this window, so ignoring errors
        // @ts-ignore
        const DOMPurify = createDOMPurify(window);

        const markdownParsed = DOMPurify.sanitize(marked(req.body.content));

        const comment = {
            author: req.body.author,
            content: markdownParsed,
            createdAt: Timestamp.fromDate(new Date()),
        };

        postRef.update({
            comments: FieldValue.arrayUnion(comment),
        });

        res.status(200).send("Comment added");
    }
});

app.post("/api/post", postLimiter, async (req, res) => {
    const postRef = db.collection("posts").doc();

    const window = new JSDOM("").window;
    // typescript cant cast from jsdom window to this window, so ignoring errors
    // @ts-ignore
    const DOMPurify = createDOMPurify(window);

    const markdownParsed = DOMPurify.sanitize(marked(req.body.content));

    await postRef.set({
        title: req.body.title,
        content: markdownParsed,
        author: req.body.author,
        comments: [],
        createdAt: Timestamp.fromDate(new Date()),
    });

    res.status(200).send({ postId: postRef.id });
});

app.listen(80, () => {
    console.log(`Listening on port 80!`);
});
