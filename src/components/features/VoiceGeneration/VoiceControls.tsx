import { useTranslation } from "react-i18next";
import { TTS_LANGUAGE_OPTIONS, TtsLanguageCode } from "../../../constants/ttsLanguages";

interface VoiceControlsProps {
  languageCode: TtsLanguageCode;
  speed: number;
  pitch: number;
  onLanguageCodeChange: (languageCode: TtsLanguageCode) => void;
  onSpeedChange: (speed: number) => void;
  onPitchChange: (pitch: number) => void;
}

export const VoiceControls = ({
  languageCode,
  speed,
  pitch,
  onLanguageCodeChange,
  onSpeedChange,
  onPitchChange
}: VoiceControlsProps) => {
  const { t } = useTranslation();
  const safeSpeed = Math.min(Math.max(speed || 1, 0.7), 1.2);
  const safePitch = Math.min(Math.max(pitch || 0, -1), 1);

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("voice.voiceParams")}</h2>

      <label className="block space-y-2">
        <span className="text-sm text-slate-700 dark:text-slate-300">{t("profile.language")}</span>
        <select
          value={languageCode}
          onChange={(event) => onLanguageCodeChange(event.target.value as TtsLanguageCode)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
        >
          {TTS_LANGUAGE_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
          <span>{t("voice.speed")}</span>
          <span>{safeSpeed.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min={0.7}
          max={1.2}
          step={0.05}
          value={safeSpeed}
          onChange={(event) => onSpeedChange(Math.min(Math.max(Number(event.target.value), 0.7), 1.2))}
          className="w-full"
        />
      </label>

      <label className="block space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
          <span>{t("voice.pitch")}</span>
          <span>{safePitch.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.1}
          value={safePitch}
          onChange={(event) => onPitchChange(Math.min(Math.max(Number(event.target.value), -1), 1))}
          className="w-full"
        />
      </label>
    </div>
  );
};
