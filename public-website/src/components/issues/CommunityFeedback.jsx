import React, { useState, useRef, useEffect } from 'react';
import {
  AlertCircle,
  Mic,
  Square,
  Trash2,
  X,
  Send,
  Info,
  CheckCircle,
} from 'lucide-react';

/**
 * Minimal monochrome black outline facial-expression SVG icons
 * matching The Public Today civic reaction widget.
 */
function ConcernedFaceIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
    </svg>
  );
}

function ImportantFaceIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="15" x2="16" y2="15" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
    </svg>
  );
}

function SupportFaceIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
    </svg>
  );
}

function NeedsAttentionFaceIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="15" r="2.2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
    </svg>
  );
}

const INITIAL_REACTIONS = [
  { id: 'concerned', label: 'Concerned', icon: ConcernedFaceIcon, count: 18 },
  { id: 'important', label: 'Important', icon: ImportantFaceIcon, count: 24 },
  { id: 'support', label: 'Support', icon: SupportFaceIcon, count: 12 },
  { id: 'attention', label: 'Needs Attention', icon: NeedsAttentionFaceIcon, count: 9 },
];

/**
 * Self-contained sample chime data URI for initial demonstration voice dispatch.
 * 100% offline, zero network requests, and universally playable in HTML5 audio.
 */
const SAMPLE_AUDIO_DATA_URL =
  'data:audio/wav;base64,UklGRqQMAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYAMAAB/qtDt/P3u066DWDEUBAIOKU13osnn+fzx2LSLYDkaBwIMJEZvmsLh9fvy3LuSaEAgCwMLIEBokrrb8fr04MGacEcmDwUKHDphirPV7fj148ahd08sEwcJGTVag6vP6Pb15suof1YzGAoJFjBTe6TI4/P16dCuhl45HQ0JFCxNdJzB3vD069S0jmVAIxAKEyhHbZW62ezz7Ni6lW1HKBQMESRBZo2z0+jy7dy/m3ROLhgNESE8X4aszeTw7t/EontVNBwQEB43WX+lx+Dt7uHJqINcOyESEBwzU3iewNvq7ePNrolkQSYVERovTXGXutbn7eXRtJBrRysYEhgrSGuQs9Dk6+bVuZdxTjAcExgoQ2SJrcvg6ufYvp14VTYgFRclPl6CpsXc6OfawqN/WzwkFxcjOVh8n7/Y5efcx6mGYkIpGhchNVN1mbnT4+beyq6MaEgtHRgfMk1vkrPO3+XfzrOSb04yIBkeL0lpjK3J3OTg0biYdVQ4JBsdLERjhafE2OLh07yefFo9KB0dKUBdf6G+1ODh1sCjgmFDLB8dJzxYeZq50N7g2MSpiGdIMCEeJjhTc5SzzNvg2ciujm1ONSQfJTVObY6tx9jf2suylHNUOiggJDJKZ4inwtXd2823mXlaPysiIzBFYoKivdHb28+7n39fRC8kIy5CXXycuM3Z29G+pIVlSTMmIyw+WHaWssnX2tPCqIprTjcoJCs7U3GQrcXU2dTFrZBxVDsrJSo4T2uKqMDR2NXHsZV3WUAvJik2S2aForzO19XKtZp8X0UyKCkzR2F/nbfK1dXMuZ+CZEo2KikyRF16l7LH09XNvKSHak85LCkwQFh0kq3D0NTOv6iMb1Q9LyovPlRvjKi+ztPPwqyRdFlCMisuO1Bqh6O6y9LQxLCWel5GNS0uOUxlgp22x9HQxrSbf2NLOC4uN0lhfJixxM/QyLefhGhPPDAuNkZdd5OswM3QybqkiW1UQDMvNENYco6ovcrPyryojnNZQzUwNEBVbomjucfOy7+rk3heRzgxMz5RaYSetMXMy8Gvl31iTDsyMzxOZX+ZsMHLy8Oym4FnUD40MztLYXqUrL7Jy8S1n4ZsVEI2MzlIXXaPp7vHysW3o4txWUU4NDlFWXGLo7fEyca6p492XUk7NThDVW2GnrPCyMa8qpR6Yk0+NjhBUmiBmq+/x8e+rZh/ZlFBODdAT2R9lau8xca/sJyEa1VEOjg+TGF4kae5w8bAs5+IcFlHPDg9Sl10jKO1wcXBtaOMdF1KPjk8SFpwiJ+yv8TCt6aQeGFOQDo8RlZsg5quvMPCuamUfWZSQzs8RFNof5aqusLCu6yYgWpVRj08Q1Fke5Knt8DCvK+chW5ZST88Qk5hd46jtL7BvbGfiXNdTEE9QUxdc4mfsLzBvrOijXdhT0M+QEpab4WbrbrAvrWlkXtlU0U/QEhXa4GXqre/vraolX9pVkhAQEdVaH2TprW9vriqmINtWktCQEZSZHmPorK7vrmtm4dxXU5EQUVQYXWLn6+6vbmvn4t1YVFGQUROXnKHm6y3vLqxoY55ZVRIQkRNW26Dl6m1u7qypJJ9aVdKQ0RLWWt/k6Wzurq0p5WBbVpNRURKVmd7kKKwubq1qZiFcF5PRkRJVGR4jJ+tt7q2q5uIdGFSSEVIUmF0iJurtbm2rZ6MeGVVSkVIUF9xhJeos7i3rqGPe2hYTEZHT1xtgZSlsbe3sKOSf2xbTkhHTlpqfZChrra3saWVg29eUUlHTVhneo2erLS2sqeYhnNhU0tITFZkdombqbO2s6mbiXZlVkxIS1Ric4aYp7G1s6udjHpoWU5JS1JfcIKUpK+0s6ygkH1rXFBKS1FdbX+Roa2zs62ikoFvX1JMS1BbanyOnqqys66klYRyYlVNS09ZZ3iKm6iws6+mmId1ZVdPS09XZXWHmKWvsrCnmop5aFpQTE5WYnKElaOtsbCpnY18a1xSTU5VYG+BkaCrsLCqn5B/bl9UTk5TXm19jp2pr7CroZOCcWJWT05SXGp6i5unrrCso5WFdGVYUU5SW2h3iJikra+tpJiId2hbUk9RWWV1hZWiq6+tppqLe2tdVFBRWGNygpKfqa6tp5yOfm5gVlFRV2Fvf4+dp62tqJ6QgHFiWFJRVl9tfIyapaytqaCTg3RlWlNRVV5qeYmYo6utqaGVhnZoXFRSVFxod4aVoamsqqOXiXlrXlZSVFtmdIOSn6esqqSZi3xtYVdTVFpkcYCPnKarqqWbjn9wY1lUVFlib36NmqSqqqadkIJzZVtVVFhgbXuKl6Kpqqeek4R2aF1WVFdfaniHlaCnqqeglYd4a19XVVddaHaEkp6mqaihl4l7bWFZVVZcZnOCkJykqKiimYx+cGRbVlZbZXF/jZmjqKijmo6AcmZcV1ZaY298ipehp6iknJCDdWheWFdaYW16iJWfpaeknZKFd2tgWVdZYGt4hZKdpKelnpSIem1iW1dZX2l1g5Cbo6aloJaKfW9kXFhZXmdzgI2ZoaaloZiMf3JmXllZXWVxfouXoKWloZmOgXRoX1pZXGRve4mUnqSlopuQhHdrYVtZXGNteYaSnKKlopyShnltY1xaW2Frd4SQmqGko52UiHxvZV1aW2BpdYGOmKCko56Win5xZ19bW19oc3+Llp6jo5+XjIB0aWBcW19mcX2JlJ2io6CYjoJ2a2JdW15lb3uHkpuho6CakIV4bWReXF5kbXiFkJmgoqCbkod7b2VfXF1ja3aCjpifoqGck4l9cWdgXV1ianSAjJadoaGdlYt/c2liXV1haHJ+ipScoKGdloyBdmtjXl1gZ3F8h5Kan6Gel46DeG1lX15gZm96hZCZnqCemZCFem9mYF5gZW14g46XnaCfmpGHfHFoYV5fZGx2gYyVnJ+fmpOJfnNqY19fY2p0f4qUm5+fm5SLgHVrZGBfY2lyfYiSmZ6fnJWNgndtZWFfYmhxe4aQmJ2enJeOhHlvZ2JgYmdveYSOlpyenZiQhntxaGNgYWZud4KMlZuenZiRiH1zamRhYWVsdoCKk5qdnZmSiX91bGVhYWVrdH6IkZicnZqUi4F3bWZiYWRqcnyGkJecnZqVjIN5b2hjYWRpcXqFjpabnJuWjoR6cWlkYmNob3mDjJSanJuWj4Z8c2tlYmNnbneBipOZm5uXkYh+dGxmY2NmbXV/iZGXm5uYkomAdm5nY2NmbHR9h5CWmpuYk4uCeG9oZGNla3J8hY6VmZuZlIyDenFqZWNlanF6g4yUmZqZlY6FfHNrZmRlaXB4gouSmJqZlY+HfXRtZ2RlaG93gImRl5mZlpCIf3ZuaGVlaG11foePlZmZl5GKgXhvaWVlZ2x0fYaOlJiZl5KLgnlxamZlZ2tye4SMk5eZl5OMhHtzbGdlZ2txeYKLkpeZmJSNhX10bWhmZmpweIGJkJaYmJSOh352bmlmZmlvdn+Hj5WYmJWQiIB3cGpnZmludX2GjpOXmJWQioF5cWtnZmhtdHyEjJKWl5aRi4N6c2xoZ2hsc3qDi5GWl5aSjIR8dG1pZ2hscnmBiZCVl5aTjYZ+dm9qZ2hrcHiAiI+UlpaTjod/d3BraGhqb3Z+ho2TlpaUj4iAeHFsaGhqb3V9hYySlZaUkImCenNtaWhqbnR7g4uRlZaUkYuDe3RuamhpbXN6gomPlJaVkYyFfXVva2lpbHJ5gIiOk5WVko2GfndwbGlpbHF3f4eNkpWVko6HgHhybGppa3B2foWMkZSVk46IgXpzbWppa291fISLkJSVk4+Jgnt0bmtqa250e4KJj5OUk5CKhHx1cGtqa25zeoGIjpKUk5CLhX53cWxqa21yeYCHjZGUk5GMhn94cm1ra21xd36FjJCTk5GNh4B5c25ra2xxdn2EipCTk5KOiIJ7dG9sa2xwdXyDiY+Sk5KPiYN8dXBsa2xvdHuCiI6Rk5KPioR9d3Fta2xvc3mAh42Rk5KQi4V+eHJubGxuc3h/houQkpKQjIaAeXNvbGxucnd+hIqPkpKQjYeBenRvbWxtcXZ9g4mOkZKRjYiCe3VwbWxtcHV7goiNkZKRjomDfXZxbmxtcHR6gYeMkJKRjoqEfnhybm1tb3R5gIaLj5GRj4uFf3lzb21tb3N4foWKjpGRj4uGgHp0cG1tb3J3fYOJjpCRkIyHgXt1cW5tbnJ2fIKIjZCRkI2Ignx2cm9tbnF2e4GHjI+RkI2Jg314c29ubnF1eoCGi4+QkI6KhH55dHBubnB0eQ==';

const INITIAL_COMMENTS = [
  {
    id: 1,
    name: 'Bishnu Bahadur Thapa',
    role: 'Ward 3 Agricultural Cooperative Liaison',
    date: '20 Nov 2026',
    comment:
      'We rely on this crossing daily to transport morning milk and cabbage harvest to the valley hub. A temporary gabion revetment must be installed before the next rainfall surge.',
    audioUrl: null,
    isAudio: false,
  },
  {
    id: 2,
    name: 'Shova Gurung',
    role: 'Sundar Gaun Community Member',
    date: '21 Nov 2026',
    comment:
      'School children from Tallo Basti are currently having to detour an extra 35 minutes along the ridge. Glad this is marked as field verified; hoping for rapid repair mobilization.',
    audioUrl: null,
    isAudio: false,
  },
  {
    id: 3,
    name: 'Dan Bahadur KC',
    role: 'Ward 4 Resident (Sample Voice Recording)',
    date: '21 Nov 2026',
    comment:
      'Audio observation documenting morning water swirl at the footing. Riverbed sand is receding after heavy rains.',
    audioUrl: SAMPLE_AUDIO_DATA_URL,
    isAudio: true,
    isSample: true,
  },
];

export function CommunityFeedback({ issueTitle = 'this infrastructure issue' }) {
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [reactions, setReactions] = useState(INITIAL_REACTIONS);
  const [comments, setComments] = useState(INITIAL_COMMENTS);

  // Form state
  const [formData, setFormData] = useState({ name: '', email: '', comment: '' });
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // Audio recording states
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'recorded'
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [micError, setMicError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const createdUrlsRef = useRef([]);

  // Cleanup audio tracks and object URLs on unmount
  useEffect(() => {
    const urlsToRevoke = createdUrlsRef.current;
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      urlsToRevoke.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
    };
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleReaction = (reactionId) => {
    if (selectedReaction === reactionId) {
      setSelectedReaction(null);
      setReactions((prev) =>
        prev.map((r) => (r.id === reactionId ? { ...r, count: Math.max(0, r.count - 1) } : r))
      );
    } else {
      setReactions((prev) =>
        prev.map((r) => {
          if (r.id === reactionId) return { ...r, count: r.count + 1 };
          if (r.id === selectedReaction) return { ...r, count: Math.max(0, r.count - 1) };
          return r;
        })
      );
      setSelectedReaction(reactionId);
    }
  };

  const startRecording = async () => {
    setMicError(null);
    if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMicError('Audio recording is not supported in this browser. You can still submit a written comment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        const url = URL.createObjectURL(blob);
        createdUrlsRef.current.push(url);
        setAudioUrl(url);
        setRecordingState('recorded');

        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }
      };

      mediaRecorder.start(250);
      setRecordingState('recording');
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const isDenied =
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setMicError(
        isDenied
          ? 'Microphone access was denied. Please allow microphone permissions in your browser or submit a written comment.'
          : 'Microphone was unavailable. You can still submit a written comment.'
      );
      setRecordingState('idle');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    setRecordingState('idle');
    setRecordingDuration(0);
    setAudioUrl(null);
  };

  const deleteRecording = () => {
    if (audioUrl) {
      try {
        URL.revokeObjectURL(audioUrl);
      } catch {}
    }
    setAudioUrl(null);
    setRecordingState('idle');
    setRecordingDuration(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasName = formData.name.trim().length > 0;
    const hasComment = formData.comment.trim().length > 0;
    const hasAudio = Boolean(audioUrl);

    if (!hasName || (!hasComment && !hasAudio)) return;

    const newComment = {
      id: Date.now(),
      name: formData.name.trim(),
      role: 'Community Observer',
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      comment: formData.comment.trim(),
      audioUrl: audioUrl || null,
      isAudio: hasAudio,
    };

    setComments([newComment, ...comments]);
    setFormData({ name: '', email: '', comment: '' });
    setAudioUrl(null);
    setRecordingState('idle');
    setRecordingDuration(0);
    setSubmittedMessage(true);
    setTimeout(() => setSubmittedMessage(false), 5000);
  };

  const canSubmit =
    formData.name.trim().length > 0 &&
    (formData.comment.trim().length > 0 || audioUrl !== null);

  return (
    <section className="pt-8 text-[#1B2923]">
      <div className="max-w-[760px] mx-auto text-left">
        {/* 1. Four Compact Reaction Cards (One row on desktop, 2 columns on mobile) */}
        <div className="pb-5 border-b border-[#E5E7EB]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {reactions.map((reaction) => {
              const Icon = reaction.icon;
              const isSelected = selectedReaction === reaction.id;

              return (
                <button
                  key={reaction.id}
                  type="button"
                  onClick={() => handleToggleReaction(reaction.id)}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-center justify-center py-3 px-2 sm:py-3.5 sm:px-3 rounded-[6px] border text-center transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-[#173D32] bg-[#F4F8F6] ring-1 ring-[#173D32]'
                      : 'border-[#E5E7EB] bg-white hover:border-[#CBD5E1] hover:bg-[#F9FAFB]'
                  }`}
                >
                  {/* Circular light-gray background with minimal black outline facial expression */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                      isSelected ? 'bg-[#E8F0EC] text-[#173D32]' : 'bg-[#F3F4F6] text-[#1B2923]'
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[1.8]" />
                  </div>

                  {/* Reaction Title */}
                  <span
                    className={`text-xs sm:text-[13px] font-semibold leading-tight mb-1.5 ${
                      isSelected ? 'text-[#173D32]' : 'text-[#1B2923]'
                    }`}
                  >
                    {reaction.label}
                  </span>

                  {/* Small light-gray oval badge displaying count */}
                  <span
                    className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border leading-none transition-colors ${
                      isSelected
                        ? 'bg-[#E8F0EC] text-[#173D32] border-[#173D32]/30 font-semibold'
                        : 'bg-[#F1F3F5] text-[#64748B] border-[#E5E7EB]'
                    }`}
                  >
                    {reaction.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Natural, Text-Based Comments List */}
        <div className="py-6 border-b border-[#E5E7EB]">
          <h3 className="text-sm sm:text-base font-bold text-[#173D32] mb-4">
            Comments ({comments.length})
          </h3>

          <div className="divide-y divide-[#E5E7EB]">
            {comments.map((c) => (
              <div key={c.id} className="py-3.5 first:pt-0 last:pb-0">
                {/* Author, Role & Date on one line */}
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-xs mb-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-[#173D32] text-xs sm:text-sm">
                      {c.name}
                    </span>
                    {c.role && (
                      <span className="text-[#64748B]">
                        • {c.role}
                      </span>
                    )}
                    {c.isAudio && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-[#E8F0EC] text-[#173D32] text-[10px] font-medium">
                        <Mic className="w-2.5 h-2.5" />
                        <span>Voice Note</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[#64748B] text-xs">
                    {c.date}
                  </span>
                </div>

                {/* Comment Text */}
                {c.comment && (
                  <p className="text-xs sm:text-sm text-[#2D3748] leading-relaxed font-normal">
                    {c.comment}
                  </p>
                )}

                {/* Voice Audio Player */}
                {c.audioUrl && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <audio
                      controls
                      preload="none"
                      src={c.audioUrl}
                      className="w-full max-w-sm h-8"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Leave a Comment Form with Voice Recording */}
        <div className="pt-6">
          <div className="mb-4">
            <h4 className="text-sm sm:text-base font-bold text-[#173D32] mb-0.5">
              Leave a Comment
            </h4>
            <p className="text-xs text-[#64748B]">
              Share ground-level conditions or local perspectives regarding {issueTitle}.
            </p>
          </div>

          {submittedMessage && (
            <div className="mb-3.5 p-2.5 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] flex items-center gap-2 text-xs font-medium text-[#173D32]">
              <CheckCircle className="w-4 h-4 text-[#173D32] shrink-0" />
              <span>Thank you. Your observation has been recorded in this demonstration session.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="fb-fullname"
                  className="block text-xs font-semibold text-[#173D32] mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fb-fullname"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ram Bahadur Thapa"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-[4px] text-[#173D32] placeholder-[#64748B]/60 focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="fb-email"
                  className="block text-xs font-semibold text-[#173D32] mb-1"
                >
                  Email Address <span className="text-[11px] text-[#64748B] font-normal">(optional)</span>
                </label>
                <input
                  id="fb-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. name@example.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-[4px] text-[#173D32] placeholder-[#64748B]/60 focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="fb-comment"
                className="block text-xs font-semibold text-[#173D32] mb-1"
              >
                Comment {!audioUrl && <span className="text-red-500">*</span>}
              </label>
              <textarea
                id="fb-comment"
                rows={3}
                required={!audioUrl}
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Describe ground-level conditions, detour experiences, or community hazards..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E7EB] rounded-[4px] text-[#173D32] placeholder-[#64748B]/60 focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] focus:outline-none transition-colors resize-y"
              />
            </div>

            {/* Audio Recording Controls Area */}
            <div className="pt-0.5">
              {recordingState === 'idle' && !audioUrl && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#E5E7EB] hover:border-[#173D32] hover:bg-[#F7F8FA] text-xs font-medium text-[#173D32] transition-colors cursor-pointer select-none"
                  >
                    <Mic className="w-3.5 h-3.5 text-[#173D32]" />
                    <span>Record a voice message</span>
                  </button>
                  <span className="text-[11px] text-[#64748B]">
                    (Speak your observation)
                  </span>
                </div>
              )}

              {recordingState === 'recording' && (
                <div className="p-2.5 rounded-[4px] bg-[#FEF2F2] border border-[#FCA5A5]/70 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="font-semibold text-red-700">Recording audio...</span>
                    <span className="font-mono text-xs text-red-700 bg-white px-1.5 py-0.5 rounded-[3px] border border-red-200">
                      {formatDuration(recordingDuration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-[3px] bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors cursor-pointer text-xs"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-white border border-[#E5E7EB] hover:bg-stone-50 text-[#64748B] transition-colors cursor-pointer text-xs"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}

              {audioUrl && recordingState !== 'recording' && (
                <div className="p-2.5 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#173D32] flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-[#438A70]" />
                      <span>Voice recording attached ({formatDuration(recordingDuration)})</span>
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="text-[11px] text-[#438A70] hover:text-[#173D32] underline cursor-pointer"
                      >
                        Record again
                      </button>
                      <button
                        type="button"
                        onClick={deleteRecording}
                        className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 cursor-pointer"
                        title="Delete recording"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  <audio
                    controls
                    preload="metadata"
                    src={audioUrl}
                    className="w-full h-8"
                  />
                </div>
              )}

              {micError && (
                <div className="mt-2 p-2 rounded-[4px] bg-amber-50 border border-amber-200 text-xs text-[#8F5E16] flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#8F5E16]" />
                  <span>{micError}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[4px] text-xs font-semibold transition-colors ${
                  canSubmit
                    ? 'bg-[#173D32] hover:bg-[#122F26] text-white cursor-pointer shadow-2xs'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Comment</span>
              </button>

              <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                <span>Demonstration mode: Comments and audio are stored in local session state.</span>
              </span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default CommunityFeedback;
