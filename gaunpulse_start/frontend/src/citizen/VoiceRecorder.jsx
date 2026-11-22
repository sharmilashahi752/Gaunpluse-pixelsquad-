import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Download,
  FileAudio,
  FileText,
  Languages,
  Loader2,
  Mic,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import { citizenService } from './citizenApi';

export default function VoiceRecorder({
  onRecording,
  language = 'ne-NP',
  onLanguageChange,
  onTranscript,
  onSpeechTextChange,
}) {
  const [supported, setSupported] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [selectedLang, setSelectedLang] = useState(language || 'ne-NP');
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [uploadedName, setUploadedName] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Speech to Text States
  const [listening, setListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copied, setCopied] = useState(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Sync external language prop if provided
  useEffect(() => {
    if (language && language !== selectedLang) {
      setSelectedLang(language);
    }
  }, [language]);

  // Check MediaRecorder and SpeechRecognition browser support
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setSupported(false);
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  function handleLanguageSelect(newLang) {
    setSelectedLang(newLang);
    onLanguageChange?.(newLang);
    // If recognition is running, restart with new language
    if (listening) {
      stopSpeechToText();
    }
  }

  function getAudioMimeType() {
    const candidateTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/wav',
    ];
    for (const t of candidateTypes) {
      if (window.MediaRecorder && window.MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  async function startRecording() {
    setError('');
    setInfoMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const effectiveMime = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: effectiveMime });

        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const ext = effectiveMime.includes('mp4') ? 'm4a' : effectiveMime.includes('ogg') ? 'ogg' : effectiveMime.includes('wav') ? 'wav' : 'webm';
        const file = new File([blob], `gaunpulse-voice-report-${Date.now()}.${ext}`, { type: effectiveMime });
        setAudioFile(file);
        onRecording?.(file);
        setUploadedName(`Recorded voice note (${Math.max(1, Math.round(blob.size / 1024))} KB)`);

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start(250);
      setDuration(0);
      setRecording(true);

      timerRef.current = window.setInterval(() => {
        setDuration((val) => {
          if (val >= 180) { // Max 3 minutes
            stopRecording();
            return 180;
          }
          return val + 1;
        });
      }, 1000);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
      } else {
        setError('Microphone recording is unavailable or not supported in this browser.');
      }
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  function deleteRecording() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl('');
    setAudioFile(null);
    setDuration(0);
    setUploadedName('');
    setInfoMessage('');
    onRecording?.(null);
  }

  function handleUploadVoiceFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedMimes = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/x-wav'];
    const hasValidExt = file.name.match(/\.(webm|ogg|mp3|m4a|wav|aac)$/i);

    if (!allowedMimes.includes(file.type) && !hasValidExt) {
      setError('Please choose a valid audio file (.webm, .ogg, .mp3, .m4a, or .wav).');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Voice files must be 10 MB or smaller.');
      event.target.value = '';
      return;
    }

    setError('');
    setInfoMessage('');
    setUploadedName(file.name);
    setAudioFile(file);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(URL.createObjectURL(file));
    onRecording?.(file);
    event.target.value = '';
  }

  // 1. Download Recorded / Uploaded Audio File
  function handleDownloadAudio() {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    const ext = audioFile?.name?.split('.').pop() || 'webm';
    a.download = `gaunpulse-voice-report.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // 2. Download Speech Transcription as UTF-8 Text File (preserving Nepali Devanagari)
  function handleDownloadTranscript() {
    if (!speechText.trim()) return;
    // Prepend UTF-8 BOM (\uFEFF) so Devanagari characters render cleanly in Notepad and Windows editors
    const blob = new Blob(['\uFEFF' + speechText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gaunpulse-transcript.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 3. Live Browser Speech-to-Text Recognition (Web Speech API)
  function startSpeechToText() {
    setError('');
    setInfoMessage('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Browser speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge, or type your report.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang || 'ne-NP';

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.onerror = (event) => {
        setListening(false);
        if (event.error === 'not-allowed') {
          setError('Microphone access was denied for live speech recognition.');
        } else if (event.error !== 'no-speech') {
          setError(`Speech recognition note (${event.error}). You can continue speaking or edit the text manually.`);
        }
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        const cleaned = transcript.trim();
        if (cleaned) {
          setSpeechText((prev) => {
            const next = prev ? `${prev} ${cleaned}` : cleaned;
            onSpeechTextChange?.(next);
            return next;
          });
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('Could not start live speech recognition: ' + err.message);
    }
  }

  function stopSpeechToText() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setListening(false);
  }

  // 4. Backend Audio File Transcription via /api/citizen/transcribe
  async function handleTranscribeAttachedAudio() {
    if (!audioFile) {
      setError('Please record audio or upload an audio file first.');
      return;
    }

    setIsTranscribing(true);
    setError('');
    setInfoMessage('');

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('language', selectedLang);

      const res = await citizenService.transcribeAudio(formData);

      if (res.success && res.transcript) {
        setSpeechText(res.transcript);
        onSpeechTextChange?.(res.transcript);
        setInfoMessage('Audio transcribed successfully! You can review and edit below.');
      } else {
        setInfoMessage(res.message || 'Speech recognition service is not configured. You can use live "Speak to Transcribe" or edit manually.');
      }
    } catch (err) {
      console.warn('Transcription request error:', err);
      setError('Backend speech transcription was unavailable. You can use the live "Speak to Transcribe" button above or type your description.');
    } finally {
      setIsTranscribing(false);
    }
  }

  function handleCopyTranscription() {
    if (speechText.trim()) {
      onTranscript?.(speechText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const minutes = String(Math.floor(duration / 60)).padStart(2, '0');
  const seconds = String(duration % 60).padStart(2, '0');
  const formattedTime = `${minutes}:${seconds}`;

  return (
    <section
      className="citizen-recorder"
      style={{
        background: '#ffffff',
        borderRadius: '10px',
        padding: '18px',
        border: '1px solid #d9e3db',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Heading & Voice Language Selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #edf1ee',
        }}
      >
        <div>
          <strong
            style={{
              fontSize: '14px',
              color: '#123D30',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontWeight: 700,
            }}
          >
            <Mic size={17} color="#267153" />
            Voice Reporting & Speech-to-Text (आवाज रेकर्ड तथा लेखाइ)
          </strong>
          <span style={{ fontSize: '12px', color: '#66786d', display: 'block', marginTop: '2px' }}>
            Record spoken audio in Nepali or English, or transcribe directly to text for municipal staff.
          </span>
        </div>

        {/* Voice Language Toggle (नेपाली / English) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#4d5e53', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Languages size={14} color="#267153" />
            Voice language:
          </span>
          <div
            style={{
              display: 'inline-flex',
              background: '#f2f5f3',
              padding: '3px',
              borderRadius: '7px',
              border: '1px solid #d9e3db',
            }}
          >
            <button
              type="button"
              onClick={() => handleLanguageSelect('ne-NP')}
              style={{
                padding: '4px 12px',
                borderRadius: '5px',
                border: 'none',
                background: selectedLang === 'ne-NP' ? '#123D30' : 'transparent',
                color: selectedLang === 'ne-NP' ? '#ffffff' : '#4d5e53',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              नेपाली
            </button>
            <button
              type="button"
              onClick={() => handleLanguageSelect('en-US')}
              style={{
                padding: '4px 12px',
                borderRadius: '5px',
                border: 'none',
                background: selectedLang === 'en-US' ? '#123D30' : 'transparent',
                color: selectedLang === 'en-US' ? '#ffffff' : '#4d5e53',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Recording Status / Active Indicator */}
      {recording && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#fdf3f2',
            border: '1px solid #f9d5d2',
            borderRadius: '8px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#c64f45',
                boxShadow: '0 0 0 4px rgba(198, 79, 69, 0.2)',
                animation: 'pulse 1.2s infinite',
              }}
            />
            <strong style={{ fontSize: '13px', color: '#c64f45' }}>
              Recording in progress ({selectedLang === 'ne-NP' ? 'नेपाली' : 'English'})...
            </strong>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#c64f45', fontVariantNumeric: 'tabular-nums' }}>
            {formattedTime}
          </span>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={!supported}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 16px',
              background: '#123D30',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: supported ? 'pointer' : 'not-allowed',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            }}
          >
            <Mic size={16} />
            <span>Start Recording (रेकर्ड सुरु गर्नुहोस्)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 16px',
              background: '#c64f45',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Square size={16} />
            <span>Stop Recording (रोक्नुहोस्)</span>
          </button>
        )}

        {/* Live Speech Recognition (Web Speech API) */}
        {speechSupported ? (
          <button
            type="button"
            onClick={listening ? stopSpeechToText : startSpeechToText}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 15px',
              background: listening ? '#eef5f1' : '#f7f7f3',
              color: listening ? '#123D30' : '#172e25',
              border: `1px solid ${listening ? '#267153' : '#d9e3db'}`,
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Volume2 size={16} color={listening ? '#267153' : '#66786d'} />
            <span>
              {listening
                ? 'Listening... Click to Stop (सुन्दैछ... रोक्नुहोस्)'
                : 'Speak to Transcribe (बोलेर लेख्नुहोस्)'}
            </span>
          </button>
        ) : null}

        {/* Upload Existing Audio File */}
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 15px',
            background: '#f7f7f3',
            color: '#172e25',
            border: '1px solid #d9e3db',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Upload size={15} color="#66786d" />
          <span>Upload Audio File (अडियो फाइल)</span>
          <input
            type="file"
            accept="audio/*,.webm,.ogg,.mp3,.m4a,.wav"
            onChange={handleUploadVoiceFile}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Audio Playback & Audio Download Section */}
      {audioUrl && (
        <div
          style={{
            background: '#f7f7f3',
            border: '1px solid #d9e3db',
            borderRadius: '9px',
            padding: '14px 16px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#267153',
                }}
              />
              <strong style={{ fontSize: '13px', color: '#172e25' }}>
                Recording saved
              </strong>
              <span style={{ fontSize: '12px', color: '#66786d' }}>
                · {duration > 0 ? formattedTime : 'Audio ready'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Transcribe Audio via backend */}
              <button
                type="button"
                onClick={handleTranscribeAttachedAudio}
                disabled={isTranscribing}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  background: '#eef5f1',
                  color: '#123D30',
                  border: '1px solid #267153',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isTranscribing ? 'not-allowed' : 'pointer',
                }}
              >
                {isTranscribing ? <Loader2 className="animate-spin" size={13} /> : <Sparkles size={13} color="#267153" />}
                <span>{isTranscribing ? 'Transcribing...' : 'Transcribe Audio (अडियो रूपान्तरण)'}</span>
              </button>

              {/* Download Audio Button */}
              <button
                type="button"
                onClick={handleDownloadAudio}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  background: '#ffffff',
                  color: '#172e25',
                  border: '1px solid #d9e3db',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Download size={13} color="#267153" />
                <span>Download Audio (अडियो डाउनलोड)</span>
              </button>

              {/* Delete Audio Button */}
              <button
                type="button"
                onClick={deleteRecording}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  background: '#fdf3f2',
                  color: '#a83228',
                  border: '1px solid #f2c7c4',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Native Audio Player */}
          <div style={{ marginTop: '6px' }}>
            <audio
              ref={audioPlayerRef}
              controls
              src={audioUrl}
              style={{ width: '100%', height: '38px', borderRadius: '4px' }}
            />
          </div>
        </div>
      )}

      {/* Speech-to-Text Transcription Box (Always accessible or when text exists) */}
      <div
        style={{
          background: '#f9faf9',
          border: '1px solid #d9e3db',
          borderRadius: '9px',
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={15} color="#267153" />
            <strong style={{ fontSize: '13px', color: '#172e25' }}>
              Speech transcription — {selectedLang === 'ne-NP' ? 'नेपाली' : 'English'}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Copy transcription to description button */}
            <button
              type="button"
              onClick={handleCopyTranscription}
              disabled={!speechText.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                background: copied ? '#eef8f2' : '#123D30',
                color: copied ? '#1b7340' : '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: speechText.trim() ? 'pointer' : 'not-allowed',
                opacity: speechText.trim() ? 1 : 0.6,
                transition: 'all 0.15s ease',
              }}
            >
              {copied ? <Check size={13} /> : null}
              <span>{copied ? 'Copied to Description (थपियो)' : 'Copy transcription (विवरणमा थप्नुहोस्)'}</span>
            </button>

            {/* Download Transcript (.txt) */}
            <button
              type="button"
              onClick={handleDownloadTranscript}
              disabled={!speechText.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                background: '#ffffff',
                color: '#172e25',
                border: '1px solid #d9e3db',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: speechText.trim() ? 'pointer' : 'not-allowed',
                opacity: speechText.trim() ? 1 : 0.6,
              }}
            >
              <Download size={13} color="#267153" />
              <span>Download Transcript (विवरण डाउनलोड)</span>
            </button>

            {speechText.trim() && (
              <button
                type="button"
                onClick={() => {
                  setSpeechText('');
                  onSpeechTextChange?.('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#66786d',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Editable Transcript Textarea */}
        <textarea
          rows={3}
          value={speechText}
          placeholder={
            selectedLang === 'ne-NP'
              ? 'बोलेको वा रूपान्तरण भएको विवरण यहाँ देखिनेछ। तपाईं यसलाई थप सम्पादन पनि गर्न सक्नुहुन्छ...'
              : 'Spoken or transcribed voice text will appear here. You can also edit it freely...'
          }
          onChange={(e) => {
            setSpeechText(e.target.value);
            onSpeechTextChange?.(e.target.value);
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d9e3db',
            borderRadius: '6px',
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#172e25',
            boxSizing: 'border-box',
            background: '#ffffff',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <small style={{ color: '#66786d', fontSize: '11px' }}>
            Citizens can freely edit or expand this transcription before sending to municipal staff.
          </small>
          <small style={{ color: '#88988e', fontSize: '11px' }}>
            {speechText.length} characters
          </small>
        </div>
      </div>

      {/* Informative Info Message */}
      {infoMessage && (
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            color: '#166534',
            fontSize: '12px',
          }}
        >
          <Sparkles size={14} />
          <span>{infoMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: '#fdf3f2',
            border: '1px solid #f2c7c4',
            borderRadius: '6px',
            color: '#a83228',
            fontSize: '12px',
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
