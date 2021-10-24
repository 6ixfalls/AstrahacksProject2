import express from "express";
import path = require("path");
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import rateLimit from "express-rate-limit";
import createDOMPurify from "dompurify";
import marked from "marked";
import { json } from "body-parser";
import { JSDOM } from "jsdom";
import { getEnabledCategories } from "trace_events";

// setup express & firebase
const serviceAccount = require(path.join(__dirname, "../admin-sdk.json"));

initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore();
const app = express();

// host static files
app.use(
    "/static",
    express.static(path.join(__dirname, "../../client/static/"))
);
app.use(json());

const tagsCollection = db.collection("tags");

const getTags = async () => {
    const snapshot = await tagsCollection.get();
    const mapped = snapshot.docs.map((doc) =>
        Object.assign(doc.data(), { id: doc.id })
    );

    const objectMapped: any = {};
    mapped.forEach((tag) => {
        objectMapped[tag.id] = tag;
    });

    return objectMapped;
};

let tags = [];

// API handler
const postLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 2, // limit each IP to 2 requests per windowMs
    message: {
        status: 429,
        message: undefined,
        error: "Too many requests, please try again later.",
    },
});

const commentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 4, // limit each IP to 4 requests per windowMs
    message: {
        status: 429,
        message: undefined,
        error: "Too many requests, please try again later.",
    },
});

app.get("/", async (req, res) => {
    res.sendFile(path.join(__dirname, "../../client/index.html"));
});

app.get("/posts", async (req, res) => {
    res.sendFile(path.join(__dirname, "../../client/posts.html"));
});

app.post("/api/comment", commentLimiter, async (req, res) => {
    try {
        const postRef = db.collection("posts").doc(req.body.postId);
        const post = await postRef.get();

        if (!post.exists) {
            res.status(404).send({ error: "Post not found!" });
        } else {
            const window = new JSDOM("").window;
            // typescript cant cast from jsdom window to dompurify window, so ignoring errors
            // @ts-ignore
            const domPurify = createDOMPurify(window);

            const markdownParsed = domPurify.sanitize(marked(req.body.content));

            const comment = {
                author: req.body.author,
                content: markdownParsed,
                createdAt: Timestamp.fromDate(new Date()),
            };

            postRef.update({
                comments: FieldValue.arrayUnion(comment),
            });

            res.status(200).send({});
        }
    } catch (e) {
        res.status(500).send({ error: "Internal server error occured." });
    }
});

app.post("/api/post", postLimiter, async (req, res) => {
    try {
        const postRef = db.collection("posts").doc();

        const window = new JSDOM("").window;
        // typescript cant cast from jsdom window to dompurify window, so ignoring errors
        // @ts-ignore
        const domPurify = createDOMPurify(window);

        const markdownParsed = domPurify.sanitize(marked(req.body.content));

        await postRef.set({
            title: req.body.title,
            content: markdownParsed,
            author: req.body.author,
            comments: [],
            createdAt: Timestamp.fromDate(new Date()),
        });

        res.status(200).send({ postId: postRef.id });
    } catch (e) {
        res.status(500).send({ error: "Internal server error occured." });
    }
});

app.listen(80, async () => {
    console.log(`Listening on port 80!`);
    tags = await getTags();
    console.log(tags);
});
