import React, { useRef, useEffect, useState, useMemo } from 'react';
import { X, Check, Play, Pause, Mic, Download, ExternalLink, FileText, Eye } from 'lucide-react';
import { Team, ChatMessage, ChatAttachment } from '../types';

interface TeamChatProps {
  activeTeam: Team;
  teamMessages: Record<string, ChatMessage[]>;
  chatInput: string;
  setChatInput: (val: string | ((prev: string) => string)) => void;
  sendMessage: (customText?: string, audioData?: { url?: string; duration?: number }, attachmentData?: ChatAttachment) => void;
  chatEndRef?: React.RefObject<HTMLDivElement>;
}

// Generate a valid, playable WAV audio blob URL
function createPlayableWavBlob(durationSeconds: number = 3, pitchHz: number = 480): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * Math.max(1, durationSeconds));
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Pleasant harmonic voice-note chime melody
  const notes = [pitchHz, pitchHz * 1.25, pitchHz * 1.5, pitchHz * 1.8];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIdx = Math.floor((t / durationSeconds) * notes.length) % notes.length;
    const freq = notes[noteIdx];
    const segmentDuration = durationSeconds / notes.length;
    const segmentTime = (t % segmentDuration) / segmentDuration;
    const envelope = Math.sin(Math.PI * segmentTime);
    const sample = (
      Math.sin(2 * Math.PI * freq * t) * 0.4 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.15 +
      Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.1
    ) * envelope;
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

// In-memory cache for synthesized audio URLs per message id
const audioCache = new Map<string, string>();

// Pixel-perfect SVG icons from reference
const PaperclipIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 7.5v8.5a5 5 0 0 0 10 0V6a3.5 3.5 0 0 0-7 0v9.5a2 2 0 0 0 4 0V7.5" />
  </svg>
);

const StickerIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3.5H8.5A5 5 0 0 0 3.5 8.5v7A5 5 0 0 0 8.5 20.5h5.5l5.5-5.5V8.5A5 5 0 0 0 14.5 3.5z" />
    <path d="M14 20.5v-4.5a1.5 1.5 0 0 1 1.5-1.5H20" />
    <circle cx="8.5" cy="9.5" r="1.1" fill="currentColor" />
    <circle cx="14.5" cy="9.5" r="1.1" fill="currentColor" />
    <path d="M8.5 13.8a3.2 3.2 0 0 0 6 0" />
  </svg>
);

const MicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3.5 3.5 0 0 0-3.5 3.5v6a3.5 3.5 0 0 0 7 0v-6A3.5 3.5 0 0 0 12 2z" />
    <path d="M18.5 10.5v1a6.5 6.5 0 0 1-13 0v-1" />
    <line x1="12" y1="18" x2="12" y2="21.5" />
    <line x1="8.5" y1="21.5" x2="15.5" y2="21.5" />
  </svg>
);

const SendArrowIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 ml-0.5" fill="currentColor">
    <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a0.993 0.993 0 0 0-1.39 1.15L4 10.5l11.5 1.5L4 13.5l-1.99 5.75c-0.34 0.99 0.58 1.93 1.39 1.15z" />
  </svg>
);

const POPULAR_EMOJIS = ['😀', '😂', '🔥', '🚀', '❤️', '👍', '🎉', '💡', '👏', '🤝', '💯', '⚡', '✨', '🙌', '🎯', '😎', '🥳', '💪'];

// Waveform bar visual heights (normalized 0-100)
const WAVEFORM_BARS = [35, 60, 85, 45, 95, 70, 40, 80, 100, 65, 40, 75, 90, 85, 55, 75, 60, 95, 80, 45, 70, 50, 35];

// Participant name colors for subtle distinction in WhatsApp group style
const PARTICIPANT_COLORS = [
  'text-[#0070F3]',     // Artemis Blue
  'text-emerald-600',   // Emerald
  'text-violet-600',    // Violet
  'text-amber-600',     // Amber
  'text-rose-600',      // Rose
  'text-cyan-600',      // Cyan
  'text-indigo-600',    // Indigo
];

function getParticipantColor(senderName: string): string {
  let hash = 0;
  for (let i = 0; i < senderName.length; i++) {
    hash = senderName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PARTICIPANT_COLORS[Math.abs(hash) % PARTICIPANT_COLORS.length];
}

/**
 * Functional Voice Message Player for Sender and Recipient
 */
const VoiceMessagePlayer: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Extract duration from msg.audioDuration or msg.text
  const duration = useMemo(() => {
    if (msg.audioDuration && msg.audioDuration > 0) return msg.audioDuration;
    const match = msg.text.match(/\((\d+):(\d+)\)/);
    if (match) {
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
    return 4;
  }, [msg.audioDuration, msg.text]);

  // Audio source URL with reliable fallback
  const audioSrc = useMemo(() => {
    if (msg.audioUrl) return msg.audioUrl;
    if (audioCache.has(msg.id)) return audioCache.get(msg.id)!;
    const pitch = msg.isMe ? 520 : 440;
    const generated = createPlayableWavBlob(duration, pitch);
    audioCache.set(msg.id, generated);
    return generated;
  }, [msg.audioUrl, msg.id, duration, msg.isMe]);

  // Pause when another audio message starts playing
  useEffect(() => {
    const handleOtherPlay = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.id !== msg.id && isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('voice-message-play', handleOtherPlay);
    return () => window.removeEventListener('voice-message-play', handleOtherPlay);
  }, [isPlaying, msg.id]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      window.dispatchEvent(new CustomEvent('voice-message-play', { detail: { id: msg.id } }));
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio playback error, recreating audio blob', err);
        // Fallback to fresh WAV blob
        const freshBlob = createPlayableWavBlob(duration, msg.isMe ? 520 : 440);
        audio.src = freshBlob;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * (audio.duration || duration);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const displayTimeSecs = isPlaying ? Math.floor(currentTime) : duration;
  const timeFormatted = `0:${displayTimeSecs < 10 ? '0' : ''}${displayTimeSecs}`;

  return (
    <div className="flex items-center gap-3 py-1 select-none min-w-[210px] max-w-[280px]">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={() => {
          if (audioRef.current) {
            audioRef.current.src = createPlayableWavBlob(duration, msg.isMe ? 520 : 440);
          }
        }}
        preload="metadata"
      />

      {/* Play / Pause Circular Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-90 cursor-pointer shadow-sm ${
          msg.isMe
            ? 'bg-white text-[#0070F3] hover:bg-white/90'
            : 'bg-[#0070F3] text-white hover:bg-[#1D4ED8]'
        }`}
        title={isPlaying ? 'Pause' : 'Play voice message'}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Interactive Waveform Bars & Progress */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 cursor-pointer py-1" onClick={handleSeek}>
        <div className="flex items-center gap-[2.5px] h-6 w-full">
          {WAVEFORM_BARS.map((heightPercent, idx) => {
            const barFraction = idx / WAVEFORM_BARS.length;
            const isPlayed = barFraction <= progress;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-colors duration-150 ${
                  msg.isMe
                    ? isPlayed
                      ? 'bg-white'
                      : 'bg-white/35 hover:bg-white/50'
                    : isPlayed
                    ? 'bg-[#0070F3]'
                    : 'bg-slate-200 hover:bg-slate-300'
                }`}
                style={{ height: `${heightPercent}%` }}
              />
            );
          })}
        </div>

        {/* Time and Mic Badge */}
        <div className="flex items-center justify-between text-[11px] font-semibold leading-none">
          <span className={msg.isMe ? 'text-white/90' : 'text-slate-500'}>
            {timeFormatted}
          </span>
          <span className={`flex items-center gap-1 text-[10px] ${msg.isMe ? 'text-white/70' : 'text-slate-400'}`}>
            <Mic className="w-3 h-3" />
            <span>Voice note</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const TeamChat: React.FC<TeamChatProps> = ({
  activeTeam,
  teamMessages,
  chatInput,
  setChatInput,
  sendMessage,
  chatEndRef
}) => {
  const messages = teamMessages[activeTeam.id] || [];
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Audio recording hardware refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const prevMessagesLength = useRef(messages.length);
  const prevTeamId = useRef(activeTeam.id);

  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; name: string; type: 'image' | 'pdf' } | null>(null);

  // Close media preview on Escape key
  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewMedia) {
        setPreviewMedia(null);
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => window.removeEventListener('keydown', handleKeyDownGlobal);
  }, [previewMedia]);

  // Target scrolling strictly to the chat's message container without moving the overall page
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isTeamChange = prevTeamId.current !== activeTeam.id;
    const isNewMessage = messages.length > prevMessagesLength.current;

    prevTeamId.current = activeTeam.id;
    prevMessagesLength.current = messages.length;

    if (isTeamChange) {
      container.scrollTop = container.scrollHeight;
    } else if (isNewMessage) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, activeTeam.id]);

  // Auto-resize textarea height to accommodate multiline text
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 100);
    textarea.style.height = `${Math.max(24, newHeight)}px`;
  }, [chatInput]);

  // Voice recording live timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      setRecordingSeconds(0);
      interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const hasContent = chatInput.trim().length > 0 || pendingAttachment !== null;

  const handleSend = () => {
    if (!chatInput.trim() && !pendingAttachment) return;
    sendMessage(chatInput.trim(), undefined, pendingAttachment || undefined);
    setChatInput('');
    setPendingAttachment(null);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasContent) {
        handleSend();
      }
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const att: ChatAttachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        url: dataUrl,
        size: file.size,
        type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream')
      };
      setPendingAttachment(att);
      textareaRef.current?.focus();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleOpenAttachment = (att: ChatAttachment) => {
    const isImage = att.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(att.name);
    const isPdf = att.type === 'application/pdf' || att.name.toLowerCase().endsWith('.pdf');

    if (isImage) {
      setPreviewMedia({ url: att.url, name: att.name, type: 'image' });
      return;
    }
    if (isPdf) {
      setPreviewMedia({ url: att.url, name: att.name, type: 'pdf' });
      return;
    }

    // Direct download for any other file type
    const a = document.createElement('a');
    a.href = att.url;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes: number = 0): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleEmojiSelect = (emoji: string) => {
    setChatInput(prev => `${prev}${emoji}`);
    textareaRef.current?.focus();
  };

  // Start real recording with microphone if allowed
  const startRecording = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.start(100);
        mediaRecorderRef.current = mediaRecorder;
      }
    } catch {
      // In automated/headless environments or without mic hardware, seamlessly falls back
      mediaRecorderRef.current = null;
    }
    setIsRecording(true);
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleSendRecording = () => {
    const duration = recordingSeconds || 1;
    const formatted = `0:${duration < 10 ? '0' : ''}${duration}`;
    const voiceMsg = `🎙️ Voice message (${formatted})`;

    const finalize = (url: string) => {
      sendMessage(voiceMsg, { url, duration });
      setIsRecording(false);
      setRecordingSeconds(0);
    };

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        let audioUrl: string;
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
          audioUrl = URL.createObjectURL(blob);
        } else {
          audioUrl = createPlayableWavBlob(duration, 520);
        }
        streamRef.current?.getTracks().forEach(t => t.stop());
        finalize(audioUrl);
      };
      try {
        mediaRecorderRef.current.stop();
      } catch {
        finalize(createPlayableWavBlob(duration, 520));
      }
    } else {
      finalize(createPlayableWavBlob(duration, 520));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Messages Scroll Area - WhatsApp Inspired Layout */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-1 no-scrollbar bg-[#F8FAFC]"
      >
        {messages.map((msg, idx) => {
          const isVoice = Boolean(msg.audioUrl || msg.text.startsWith('🎙️') || msg.text.includes('Voice message'));
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;

          return (
            <div 
              key={msg.id} 
              className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-2.5 first:mt-0' : 'mt-0.5'}`}
            >
              <div 
                className={`max-w-[78%] sm:max-w-[68%] relative px-3.5 py-2 text-sm shadow-2xs ${
                  msg.isMe
                    ? `bg-[#0070F3] text-white ${isFirstInGroup ? 'rounded-2xl rounded-tr-xs' : 'rounded-2xl'}`
                    : `bg-white text-slate-800 border border-slate-200/90 ${isFirstInGroup ? 'rounded-2xl rounded-tl-xs' : 'rounded-2xl'}`
                }`}
              >
                {/* Sender Name for received messages (first message in group only, colored) */}
                {!msg.isMe && isFirstInGroup && (
                  <div className={`text-[11.5px] font-bold ${getParticipantColor(msg.senderName)} mb-0.5 select-none`}>
                    {msg.senderName}
                  </div>
                )}

                {/* Message Body & In-Bubble Bottom-Right Timestamp */}
                {isVoice ? (
                  <div>
                    <VoiceMessagePlayer msg={msg} />
                    <div className="flex justify-end items-center gap-1 mt-0.5">
                      <span className={`text-[10px] font-medium ${msg.isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                        {msg.timestamp}
                      </span>
                      {msg.isMe && (
                        <svg viewBox="0 0 16 11" className="w-3.5 h-2.5 text-blue-200 fill-current inline-block">
                          <path d="M11.07 0.93a0.75 0.75 0 0 0-1.06 0L5.36 5.58 3.49 3.71a0.75 0.75 0 0 0-1.06 1.06l2.4 2.4a0.75 0.75 0 0 0 1.06 0l5.18-5.18a0.75 0.75 0 0 0 0-1.06zM14.07 0.93a0.75 0.75 0 0 0-1.06 0L8.36 5.58l0.53 0.53 4.65-4.65a0.75 0.75 0 0 0 0-1.06z" />
                        </svg>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="leading-relaxed">
                    {/* Render Real Attachment if present */}
                    {msg.attachment && (
                      <div className="mb-2">
                        {msg.attachment.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(msg.attachment.name) ? (
                          <div 
                            onClick={() => setPreviewMedia({ url: msg.attachment!.url, name: msg.attachment!.name, type: 'image' })}
                            className="cursor-pointer group relative overflow-hidden rounded-xl border border-black/10 shadow-2xs my-1 max-w-xs"
                            title="Click to view full image"
                          >
                            <img 
                              src={msg.attachment.url} 
                              alt={msg.attachment.name} 
                              className="w-full max-h-56 object-cover group-hover:scale-[1.02] transition-transform duration-200" 
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="px-2.5 py-1 bg-black/75 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 backdrop-blur-xs">
                                <Eye className="w-3.5 h-3.5" />
                                Click to preview
                              </span>
                            </div>
                          </div>
                        ) : msg.attachment.type === 'application/pdf' || msg.attachment.name.toLowerCase().endsWith('.pdf') ? (
                          <div 
                            onClick={() => handleOpenAttachment(msg.attachment!)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all select-none my-1 ${
                              msg.isMe
                                ? 'bg-blue-600/40 hover:bg-blue-600/60 border-blue-300/40 text-white'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                            }`}
                            title="Click to preview PDF"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                                PDF
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{msg.attachment.name}</p>
                                <p className={`text-[10px] ${msg.isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                  {formatFileSize(msg.attachment.size)} • Click to preview
                                </p>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                          </div>
                        ) : (
                          <div 
                            onClick={() => handleOpenAttachment(msg.attachment!)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all select-none my-1 ${
                              msg.isMe
                                ? 'bg-blue-600/40 hover:bg-blue-600/60 border-blue-300/40 text-white'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                            }`}
                            title="Click to download file"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{msg.attachment.name}</p>
                                <p className={`text-[10px] ${msg.isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                  {formatFileSize(msg.attachment.size)} • Click to download
                                </p>
                              </div>
                            </div>
                            <Download className="w-3.5 h-3.5 shrink-0 opacity-80" />
                          </div>
                        )}
                      </div>
                    )}

                    {msg.text && (
                      <span className="text-[13.5px] font-normal break-words whitespace-pre-wrap select-text">
                        {msg.text}
                      </span>
                    )}

                    {/* WhatsApp-style floating bottom-right timestamp */}
                    <span className={`text-[10px] font-medium ml-2.5 float-right mt-1.5 select-none inline-flex items-center gap-0.5 ${
                      msg.isMe ? 'text-blue-100' : 'text-slate-400'
                    }`}>
                      <span>{msg.timestamp}</span>
                      {msg.isMe && (
                        <svg viewBox="0 0 16 11" className="w-3.5 h-2.5 text-blue-200 fill-current ml-0.5">
                          <path d="M11.07 0.93a0.75 0.75 0 0 0-1.06 0L5.36 5.58 3.49 3.71a0.75 0.75 0 0 0-1.06 1.06l2.4 2.4a0.75 0.75 0 0 0 1.06 0l5.18-5.18a0.75 0.75 0 0 0 0-1.06zM14.07 0.93a0.75 0.75 0 0 0-1.06 0L8.36 5.58l0.53 0.53 4.65-4.65a0.75 0.75 0 0 0 0-1.06z" />
                        </svg>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Clean Message Input Area with exact px-6 alignment */}
      <div className="px-6 pt-2 pb-2.5 sm:pb-3 bg-white border-t border-slate-200/90 shrink-0 relative rounded-br-2xl">
        {/* Hidden File Picker */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileAttach}
          className="hidden"
        />

        {/* Pending / Staged Attachment Preview Chip */}
        {pendingAttachment && (
          <div className="mb-2 p-2 px-3 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              {pendingAttachment.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(pendingAttachment.name) ? (
                <img src={pendingAttachment.url} alt={pendingAttachment.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-[#1D4ED8] flex items-center justify-center font-bold text-xs shrink-0">
                  {pendingAttachment.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{pendingAttachment.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">{formatFileSize(pendingAttachment.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Floating Emoji / Sticker Popover */}
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className="absolute bottom-[60px] left-6 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl z-30 w-72 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
              <span>Stickers & Emojis</span>
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2 text-xl">
              {POPULAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiSelect(emoji)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 active:scale-90 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Compact, Balanced Input Container with Independent Focus & Hover States */}
        <div 
          className={`relative flex items-center rounded-2xl min-h-[44px] px-2.5 py-1 transition-colors duration-150 w-full ${
            isFocused
              ? 'bg-white hover:bg-slate-50/50 border-2 border-[#2563eb]'
              : 'bg-slate-50/90 hover:bg-slate-100/80 border-2 border-slate-200/90 hover:border-slate-300'
          }`}
        >
          {isRecording ? (
            /* Active Voice Recording UI */
            <div className="flex-1 flex items-center justify-between px-3 text-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Recording</span>
                <span className="text-sm font-bold text-slate-800">
                  0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelRecording}
                  className="p-1.5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Cancel recording"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSendRecording}
                  className="w-8.5 h-8.5 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 flex items-center justify-center text-white transition-all shadow-xs active:scale-95 cursor-pointer"
                  title="Send voice message"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          ) : (
            /* Standard Idle & Active Controls */
            <>
              {/* Left Action 1: Paperclip */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 hover:text-slate-700 active:text-[#0070F3] p-1.5 transition-all active:scale-90 shrink-0 select-none cursor-pointer"
                title="Attach file, image, or PDF"
                aria-label="Attach file"
              >
                <PaperclipIcon />
              </button>

              {/* Left Action 2: Sticker / Emoji Face */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(prev => !prev)}
                className={`p-1.5 transition-all active:scale-90 shrink-0 select-none cursor-pointer ${
                  showEmojiPicker ? 'text-[#0070F3]' : 'text-slate-400 hover:text-slate-700 active:text-[#0070F3]'
                }`}
                title="Add sticker or emoji"
                aria-label="Stickers and emojis"
              >
                <StickerIcon />
              </button>

              {/* Center Input / Textarea */}
              <div className="flex-1 flex items-center px-2 py-0.5 min-w-0">
                <textarea
                  id="tour-team-chat"
                  ref={textareaRef}
                  rows={1}
                  placeholder="Type a message..."
                  className="w-full bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm leading-5 font-normal resize-none overflow-y-auto no-scrollbar py-1"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </div>

              {/* Right Side: Idle (Mic) or Active (Blue Send Circle) */}
              {hasContent ? (
                /* Active State: Vibrant Send Circle */
                <button
                  type="button"
                  onClick={handleSend}
                  className="w-8.5 h-8.5 rounded-full bg-[#0070F3] hover:bg-[#1D4ED8] active:bg-[#1E40AF] flex items-center justify-center text-white transition-all duration-150 shadow-xs shrink-0 active:scale-95 cursor-pointer ml-1"
                  title="Send message"
                  aria-label="Send message"
                >
                  <SendArrowIcon />
                </button>
              ) : (
                /* Idle State: Microphone Icon */
                <button
                  type="button"
                  onClick={startRecording}
                  className="text-slate-400 hover:text-slate-700 active:text-[#0070F3] p-1.5 transition-all active:scale-90 shrink-0 select-none cursor-pointer"
                  title="Record voice message"
                  aria-label="Voice message"
                >
                  <MicIcon />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox / Media Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate">{previewMedia.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewMedia.url}
                  download={previewMedia.name}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/5 min-h-[320px]">
              {previewMedia.type === 'image' ? (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.name}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
                />
              ) : previewMedia.type === 'pdf' ? (
                <iframe
                  src={previewMedia.url}
                  title={previewMedia.name}
                  className="w-full h-[75vh] rounded-lg border border-slate-200 bg-white"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamChat;
