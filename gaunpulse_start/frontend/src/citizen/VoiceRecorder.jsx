import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileAudio,
  Globe,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';

export default function VoiceRecorder({
  onRecording,
  language = 'ne-NP',
  onTranscript,
  onSpeechTextChange,
}) {
  const [supported, setSupported] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [uploadedName, setUploadedName] = useState('');
  const [speechText, setSpeechText] = useState('');
  const [speechAppended, setSpeechAppended] = useState(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const durationIntervalRef = useRef(null);

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
      // Clean up audio tracks on unmount
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
        const file = new File([blob], `voice-report-${Date.now()}.${ext}`, { type: effectiveMime });
        onRecording?.(file);
        setUploadedName(`Recorded voice note (${Math.max(1, Math.round(blob.size / 1024))} KB)`);

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start(250); // collect chunks every 250ms
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
        setError('Microphone permission was denied. Please allow microphone access in your browser settings.');
      } else {
        setError('Microphone recording is unavailable or not supported in this browser environment.');
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
    setDuration(0);
    setUploadedName('');
    onRecording?.(null);
  }

  // Speech-to-Text Recognition
  function startSpeechToText() {
    setError('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Browser speech recognition is not supported by your current browser. You can still record audio or type your report.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language || 'ne-NP';

      recognition.onstart = () => {
        setListening(true);
        setSpeechAppended(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.onerror = (event) => {
        setListening(false);
        if (event.error === 'not-allowed') {
          setError('Microphone access was denied for speech recognition.');
        } else if (event.error === 'no-speech') {
          // ignore brief silence
        } else {
          setError(`Speech recognition encountered an issue (${event.error}). You can continue speaking or edit manually.`);
        }
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        const cleaned = transcript.trim();
        if (cleaned) {
          setSpeechText(cleaned);
          onSpeechTextChange?.(cleaned);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('Could not start speech recognition: ' + err.message);
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

  function handleAddSpeechToDescription() {
    if (speechText) {
      onTranscript?.(speechText);
      setSpeechAppended(true);
    }
  }

  function uploadVoiceFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedMimes = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/x-wav'];
    const hasValidExt = file.name.match(/\.(webm|ogg|mp3|m4a|wav|aac)$/i);

    if (!allowedMimes.includes(file.type) && !hasValidExt) {
      setError('Please choose a valid audio file (.mp3, .wav, .m4a, .webm, or .ogg).');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Voice files must be 10 MB or smaller.');
      event.target.value = '';
      return;
    }

    setError('');
    setUploadedName(file.name);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(URL.createObjectURL(file));
    onRecording?.(file);
    event.target.value = '';
  }

  const minutes = String(Math.floor(duration / 60)).padStart(2, '0');
  const seconds = String(duration % 60).padStart(2, '0');

  return (
    <section className="citizen-recorder" style={{ background: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #d9e3db' }}>
      <div className="citizen-field-heading" style={{ marginBottom: '14px' }}>
        <div>
          <strong style={{ fontSize: '13.5px', color: '#172e25', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mic size={16} color="#267153" />
            Voice Message & Speech-to-Text (आवाज रेकर्ड)
          </strong>
          <span style={{ fontSize: '12px', color: '#66786d' }}>
            Record an audio description or speak to automatically transcribe your complaint.
          </span>
        </div>
        {recording && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: '#fdf3f2',
              color: '#c64f45',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#c64f45',
                animation: 'pulse 1s infinite',
              }}
            />
            Recording: {minutes}:{seconds}
          </span>
        )}
      </div>

      {/* Recording Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={!supported}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#123D30',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: supported ? 'pointer' : 'not-allowed',
            }}
          >
            <Mic size={15} />
            <span>Start Recording (रेकर्ड सुरु गर्नुहोस्)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#c64f45',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Square size={15} />
            <span>Stop Recording (रोक्नुहोस्)</span>
          </button>
        )}

        {/* Speech to Text Button */}
        {speechSupported ? (
          <button
            type="button"
            onClick={listening ? stopSpeechToText : startSpeechToText}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: listening ? '#eef5f1' : '#f7f7f3',
              color: listening ? '#123D30' : '#172e25',
              border: `1px solid ${listening ? '#267153' : '#d9e3db'}`,
              borderRadius: '7px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Volume2 size={15} color={listening ? '#267153' : '#66786d'} />
            <span>{listening ? 'Listening... Click to Stop' : 'Speak to Transcribe (बोलेर लेख्नुहोस्)'}</span>
          </button>
        ) : (
          <span style={{ fontSize: '11.5px', color: '#88988e', padding: '8px' }}>
            Speech recognition not supported in this browser.
          </span>
        )}

        {/* File Upload Option */}
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: '#f7f7f3',
            color: '#172e25',
            border: '1px solid #d9e3db',
            borderRadius: '7px',
            fontSize: '12.5px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Upload size={14} color="#66786d" />
          <span>Upload Audio File</span>
          <input
            type="file"
            accept="audio/*,.webm,.ogg,.mp3,.m4a,.wav"
            onChange={uploadVoiceFile}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Audio Playback Player */}
      {audioUrl && (
        <div
          style={{
            background: '#f7f7f3',
            border: '1px solid #e4e8e4',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileAudio size={18} color="#267153" />
            <div>
              <strong style={{ fontSize: '12.5px', color: '#172e25', display: 'block' }}>
                {uploadedName || 'Audio Recording Attached'}
              </strong>
              <small style={{ color: '#66786d', fontSize: '11px' }}>Ready to submit with report</small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <audio controls src={audioUrl} style={{ height: '36px' }} />
            <button
              type="button"
              onClick={deleteRecording}
              title="Delete audio recording"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                background: '#fdf3f2',
                color: '#a83228',
                border: '1px solid #f2c7c4',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Speech-to-Text Result Box */}
      {speechText && (
        <div
          style={{
            background: '#f7f7f3',
            border: '1px solid #d9e3db',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#172e25', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={14} color="#267153" />
              Recognized Speech ({language}):
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleAddSpeechToDescription}
                disabled={speechAppended}
                style={{
                  padding: '4px 10px',
                  background: speechAppended ? '#eef8f2' : '#123D30',
                  color: speechAppended ? '#1b7340' : '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: speechAppended ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {speechAppended ? <Check size={12} /> : null}
                <span>{speechAppended ? 'Added to Description' : 'Add to Description'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSpeechText('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#66786d',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            rows={2}
            value={speechText}
            onChange={(e) => {
              setSpeechText(e.target.value);
              onSpeechTextChange?.(e.target.value);
            }}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d9e3db',
              borderRadius: '6px',
              fontSize: '12.5px',
              color: '#172e25',
              boxSizing: 'border-box',
              background: '#ffffff',
            }}
          />
        </div>
      )}

      {error && (
        <div
          style={{
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
