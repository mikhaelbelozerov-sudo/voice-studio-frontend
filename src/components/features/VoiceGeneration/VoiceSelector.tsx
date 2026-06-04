import { Mic2, Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Voice } from "../../../services/api";
import { formatLocalizedVoiceName, parseVoiceDisplayName } from "../../../utils/localizeVoiceName";
import { Spinner } from "../../ui/Spinner";

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoiceId: string | null;
  isLoading?: boolean;
  onSelect: (voiceId: string) => void;
}

export const VoiceSelector = ({ voices, selectedVoiceId, isLoading = false, onSelect }: VoiceSelectorProps) => {
  const { t, i18n } = useTranslation();
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedVoice = voices.find((voice) => voice.voice_id === selectedVoiceId);
  const selectedDisplay = selectedVoice
    ? parseVoiceDisplayName(selectedVoice.name, t, i18n.language)
    : null;

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
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Mic2 className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("voice.selectVoice")}</h2>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t("voice.selectVoiceHint")}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-10 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          <Spinner />
          <span>{t("common.loading")}</span>
        </div>
      ) : voices.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
          {t("voice.noVoices")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {voices.map((voice) => {
            const selected = selectedVoiceId === voice.voice_id;
            const isPlaying = playingVoiceId === voice.voice_id;
            const display = parseVoiceDisplayName(voice.name, t, i18n.language);
            const ariaLabel = formatLocalizedVoiceName(voice.name, t, i18n.language);

            return (
              <button
                key={voice.voice_id}
                type="button"
                onClick={() => onSelect(voice.voice_id)}
                aria-label={ariaLabel}
                className={`rounded-xl border p-3 text-left transition ${
                  selected
                    ? "border-blue-600 bg-blue-50/80 dark:border-blue-500 dark:bg-blue-950/30"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
                }`}
              >
                <div className="mb-2 min-w-0">
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
                      {display.speaker}
                    </span>
                    {selected ? (
                      <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                        {t("voice.selected")}
                      </span>
                    ) : null}
                  </div>
                  {display.traits.length > 0 ? (
                    <ul
                      className="mt-1.5 flex flex-wrap gap-1"
                      aria-label={t("voice.traitsLabel")}
                    >
                      {display.traits.map((trait) => (
                        <li
                          key={trait}
                          className={`max-w-full rounded-md px-1.5 py-0.5 text-[10px] leading-snug ${
                            selected
                              ? "bg-blue-100/90 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100"
                              : "bg-white text-slate-600 ring-1 ring-slate-200/90 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                          }`}
                        >
                          {trait}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <span
                  role="button"
                  tabIndex={voice.preview_url ? 0 : -1}
                  onClick={(event) => {
                    event.stopPropagation();
                    handlePreview(voice);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    handlePreview(voice);
                  }}
                  className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${
                    voice.preview_url
                      ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                      : "cursor-not-allowed border-slate-100 text-slate-400 opacity-60 dark:border-slate-800"
                  }`}
                  aria-disabled={!voice.preview_url}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {voice.preview_url ? (isPlaying ? t("voice.pause") : t("voice.play")) : t("voice.noPreview")}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div
        className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-800"
        role="status"
      >
        <span className="font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("voice.selectedVoiceLabel")}
        </span>
        {selectedDisplay ? (
          <div className="min-w-0 text-right">
            <span className="font-semibold text-slate-900 dark:text-slate-50">{selectedDisplay.speaker}</span>
            {selectedDisplay.traits.length > 0 ? (
              <p className="mt-0.5 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
                {selectedDisplay.traits.join(" · ")}
              </p>
            ) : null}
          </div>
        ) : (
          <span className="font-semibold text-slate-900 dark:text-slate-50">{t("voice.selectedVoiceEmpty")}</span>
        )}
      </div>
    </div>
  );
};
