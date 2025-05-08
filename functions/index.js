/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true }); // Add CORS middleware
const { OpenAI } = require("openai");
const { Readable } = require("stream");

admin.initializeApp();
const db = admin.firestore();

// Use Firebase remote config for the OpenAI API key
const openai = new OpenAI({ apiKey: functions.config().openai.key });

exports.interviewStep = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      // Debugging logs
      console.log("Request received:", req.body);

      const { audioBase64 } = req.body;
      if (!audioBase64) throw new functions.https.HttpsError("invalid-argument", "Missing audio data");

      const buffer = Buffer.from(audioBase64, "base64");
      const audioStream = Readable.from(buffer);

      const transcription = await openai.audio.transcriptions.create({
        file: audioStream,
        model: "whisper-1",
        response_format: "text",
        language: "en"
      });

      const prompt = `You are a voice-based interviewer. Ask follow-up questions and extract structured data.\nTranscript: "${transcription}"\nReply:\n1. Follow-up question.\n2. JSON under ###PAYLOAD### with new facts.`;

      const chat = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `
You are a smart, voice-based interviewer for an event discovery platform.
Your job is to ask the user meaningful follow-up questions based on their previous answers.
(etc.)
`
          },
          { role: "user", content: prompt }
        ]
      });

      const response = chat.choices[0].message.content;
      const [question, payloadText] = response.split("###PAYLOAD###");
      const payload = JSON.parse(payloadText || "{}");

      await db.collection("users").add({
        profile: payload,
        rawTranscripts: {
          transcript: transcription,
          question,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }
      });

      res.status(200).send({ question, transcript: transcription, payload });
    } catch (error) {
      console.error("Error in interviewStep:", error);
      res.set("Access-Control-Allow-Origin", "*");
      res.status(500).send({ error: error.message });
    }
  });
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });