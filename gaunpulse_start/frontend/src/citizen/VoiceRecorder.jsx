import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2, Volume2, Globe } from 'lucide-react';

export default function VoiceRecorder({ onRecording, language = 'en-NP', onTranscript }) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [uploadedName, setUploadedName] = useState('');

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setSupported(false);
    }
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      window.clearInterval(timerRef.current);
    };
  }, []);

  function getAudioMimeType() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/wav'];
    return types.find((type) => window.MediaRecorder.isTypeSupported(type)) || '';
  }

  async function startRecording() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `voice-complaint.${extension}`, { type: mimeType || 'audio/webm' });
        onRecording?.(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setDuration(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setDuration((value) => value + 1), 1000);
    } catch (requestError) {
      setError(
        requestError.name === 'NotAllowedError'
          ? 'Microphone access was denied. You can continue with text or upload.'
          : 'Microphone recording is unavailable in this browser.'
      );
    }
  }

  function stopRecording() {
    window.clearInterval(timerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setRecording(false);
  }

  function deleteRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl('');
    setDuration(0);
    onRecording?.(null);
  }

  function startSpeechToText() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech-to-text is not supported by this browser. You can still type or record voice.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError('Speech-to-text stopped. You can edit the text or try again.');
    };
    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      if (transcript) onTranscript?.(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopSpeechToText() {
    recognitionRef.current?.stop();
  }

  function uploadVoiceFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(webm|ogg|mp3|m4a|wav)$/i)) {
      setError('Choose a WebM, OGG, MP3, M4A or WAV voice file.');
      event.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('The voice file must be 10 MB or smaller.');
      event.target.value = '';
      return;
    }
    setError('');
    setUploadedName(file.name);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    onRecording?.(file);
  }

  function removeUploadedFile() {
    setUploadedName('');
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl('');
    onRecording?.(null);
  }

  const minutes = String(Math.floor(duration / 60)).padStart(2, '0');
  const seconds = String(duration % 60).padStart(2, '0');

  return (
    <section className="citizen-recorder">
      <div className="citizen-field-heading">
        <div>
          <strong>Voice Report & Speech-to-Text</strong>
          <span>Optional. Record audio or speak to automatically transcribe your complaint.</span>
        </div>
        {recording && (
          <span className="recording-status">
            <i /> Recording {minutes}:{seconds}
          </span>
        )}
      </div>

      {!supported ? (
        <p className="citizen-message">Voice recording is unavailable. Text submission remains fully supported.</p>
      ) : (
        <div className="recorder-actions">
          {!recording ? (
            <button type="button" className="citizen-secondary record-btn" onClick={startRecording}>
              <Mic size={15} /> Start Recording
            </button>
          ) : (
            <button type="button" className="citizen-secondary danger record-btn" onClick={stopRecording}>
              <Square size={15} /> Stop Recording
            </button>
          )}

          {audioUrl && (
            <div className="audio-playback-wrap">
              <audio controls src={audioUrl} />
              <button type="button" className="citizen-text-button delete-btn" onClick={deleteRecording} title="Delete recording">
                <Trash2 size={15} /> Delete
              </button>
            </div>
          )}
        </div>
      )}

      <div className="speech-actions">
        <button
          type="button"
          className={`citizen-secondary ${listening ? 'listening-active' : ''}`}
          onClick={listening ? stopSpeechToText : startSpeechToText}
        >
          <Volume2 size={15} /> {listening ? 'Stop Transcribing' : 'Speak to Transcribe'}
        </button>

        <label className="voice-file-upload">
          Upload Audio File
          <input
            type="file"
            accept=".webm,.ogg,.mp3,.m4a,.wav,audio/webm,audio/ogg,audio/mpeg,audio/mp4,audio/wav"
            onChange={uploadVoiceFile}
          />
        </label>
      </div>

      {uploadedName && (
        <div className="uploaded-voice-name">
          <span>Attached: {uploadedName}</span>
          <button type="button" className="citizen-text-button" onClick={removeUploadedFile}>
            Remove
          </button>
        </div>
      )}

      {error && <p className="citizen-message error">{error}</p>}
    </section>
  );
}
