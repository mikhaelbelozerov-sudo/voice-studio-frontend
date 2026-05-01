import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Voice } from "../../../services/api";
import { Button } from "../../ui/Button";

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoiceId: string | null;
  onSelect: (voiceId: string) => void;
}

export const VoiceSelector = ({ voices, selectedVoiceId, onSelect }: VoiceSelectorProps) => {
  const { t } = useTranslation();
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = (voice: Voice) => {
    if (!voice.preview_url) {
      return;
    }

    if (playingVoiceId === voice.voice_id && audioRef.current) {
      audioRef.current.pause();
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(voice.preview_url);
    audioRef.current = audio;
    setPlayingVoiceId(voice.voice_id);

    audio.onended = () => setPlayingVoiceId(null);
    void audio.play().catch(() => setPlayingVoiceId(null));
  };

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("voice.selectVoice")}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {voices.map((voice) => {
          const selected = selectedVoiceId === voice.voice_id;
          const isPlaying = playingVoiceId === voice.voice_id;

          return (
            <button
              key={voice.voice_id}
              type="button"
              onClick={() => onSelect(voice.voice_id)}
              className={`rounded-2xl border p-4 text-left transition ${
                selected
                  ? "border-blue-500 bg-blue-50 shadow-sm dark:bg-blue-950/40"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium text-slate-900 dark:text-slate-100">{voice.name}</p>
                {selected ? (
                  <span className="rounded-full bg-blue-600 px-2 py-1 text-xs text-white">{t("voice.selected")}</span>
                ) : null}
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2"
                onClick={(event) => {
                  event.stopPropagation();
                  handlePreview(voice);
                }}
                disabled={!voice.preview_url}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {voice.preview_url ? (isPlaying ? t("voice.pause") : t("voice.play")) : t("voice.noPreview")}
              </Button>
            </button>
          );
        })}
      </div>
    </div>
  );
};
