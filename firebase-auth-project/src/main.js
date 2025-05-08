// src/main.js

import firebaseConfig from '../config/firebaseConfig.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import * as firebaseui from 'https://www.gstatic.com/firebasejs/ui/6.0.2/firebase-ui-auth__en.js';
import { getFirestore, setDoc, doc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import dotenv from 'https://cdn.jsdelivr.net/npm/dotenv@16.0.3/+esm';
dotenv.config();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// FirebaseUI config
const uiConfig = {
  signInSuccessUrl: '/',
  signInOptions: [
    firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
    firebaseui.auth.GoogleAuthProvider.PROVIDER_ID
  ],
};

// Initialize the FirebaseUI Widget
const ui = new firebaseui.auth.AuthUI(auth);
ui.start('#firebaseui-auth-container', uiConfig);

// Redirect authenticated users to the audio interview page
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = 'audio-interview.html';
  } else {
    document.getElementById('firebaseui-auth-container').style.display = 'block';
    document.getElementById('logged-in').style.display = 'none';
  }
});

// Sign out function
window.signOut = () => {
  signOut(auth).catch((error) => console.error('Sign out error:', error));
};

// Audio recording and OpenAI API integration

let mediaRecorder;
let audioChunks = [];

// Start recording audio
window.startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    audioChunks = [];

    // Send audioBlob to OpenAI API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Load secret from .env
      },
      body: formData,
    });

    const result = await response.json();
    console.log('Transcription:', result.text);

    // Save preferences to Firebase (example)
    const userPreferences = result.text;
    const userId = auth.currentUser.uid;
    const db = getFirestore(app);
    await setDoc(doc(db, 'users', userId), { preferences: userPreferences });
  };

  mediaRecorder.start();
  console.log('Recording started');
};

// Stop recording audio
window.stopRecording = () => {
  if (mediaRecorder) {
    mediaRecorder.stop();
    console.log('Recording stopped');
  }
};

// Audio interview logic

let isInterviewActive = true;
const transcriptionDiv = document.getElementById('transcription');

// Function to start the audio interview
async function startAudioInterview() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = async (event) => {
    audioChunks.push(event.data);

    if (audioChunks.length >= 1) {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      audioChunks = [];

      // Send audioBlob to Firebase Cloud Function
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');

      const response = await fetch('https://your-cloud-function-url', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      transcriptionDiv.textContent = result.transcription;

      // Use Web Speech API to ask the next question
      const utterance = new SpeechSynthesisUtterance(result.nextQuestion);
      speechSynthesis.speak(utterance);
    }
  };

  mediaRecorder.start(5000); // Record in 5-second intervals

  // Stop the interview after 5 minutes
  setTimeout(() => {
    isInterviewActive = false;
    mediaRecorder.stop();
    transcriptionDiv.textContent += '\nInterview ended.';
  }, 5 * 60 * 1000);
}

// Start the interview automatically
startAudioInterview();