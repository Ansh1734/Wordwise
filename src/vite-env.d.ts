/// <reference types="vite/client" />

interface Window {
	SpeechRecognition?: new () => any;
	webkitSpeechRecognition?: new () => any;
}
