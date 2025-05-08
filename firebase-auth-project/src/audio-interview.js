import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-functions.js';
import firebaseConfig from '../config/firebaseConfig.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const interviewStep = httpsCallable(functions, 'interviewStep');

let mediaRecorder;
let audioChunks = [];
let isInterviewActive = true;
const transcriptionDiv = document.getElementById('transcription');

// Function to start the audio interview
async function startAudioInterview() {
  console.log("Start Interview button clicked");
  const initialPrompt = "Tell me about the kind of events you're looking for.";
  const startUtterance = new SpeechSynthesisUtterance(initialPrompt);
  speechSynthesis.speak(startUtterance);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = async (event) => {
      audioChunks.push(event.data);

      if (audioChunks.length >= 1) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        audioChunks = [];

        // Convert audioBlob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];

          // Send base64 audio to Firebase callable function
          try {
            const response = await interviewStep({ audioBase64: base64Audio });
            const { question, transcript, payload } = response.data;

            // NOTE: AI should ask follow-up questions not only about event preferences,
            // but also about user behavior or role at events (e.g., performer, attendee, social goals).

            // Display the transcript
            transcriptionDiv.textContent += `\n${transcript}`;

            // Use Web Speech API to speak the follow-up question
            const utterance = new SpeechSynthesisUtterance(question);
            speechSynthesis.speak(utterance);
          } catch (error) {
            console.error('Error calling interviewStep:', error);
          }
        };
      }
    };

    mediaRecorder.start(5000); // Record in 5-second intervals

    // Stop the interview after 5 minutes
    setTimeout(() => {
      isInterviewActive = false;
      mediaRecorder.stop();
      transcriptionDiv.textContent += '\nInterview ended.';
    }, 5 * 60 * 1000);
  } catch (error) {
    console.error('Error accessing microphone:', error);
    alert('Please allow microphone access to start the interview.');
  }
}

window.startAudioInterview = startAudioInterview;

// Wait for user interaction to start the interview
function initInterview() {
  const startBtn = document.getElementById('start-button');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      startAudioInterview();
    });
  }
}