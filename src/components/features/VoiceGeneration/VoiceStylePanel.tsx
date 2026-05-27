import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  VOICE_PRESET_OPTIONS,
  VOICE_PRESET_SETTINGS,
  type VoicePresetId
} from "../../../constants/voicePresets";
import { TTS_LANGUAGE_OPTIONS, type TtsLanguageCode } from "../../../constants/ttsLanguages";
import { Button } from "../../ui/Button";

function chipClassName(active: boolean): string {
  return `shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
    active
      ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
  }`;
}

const SPEED_SLIDER_MIN = -10;
const SPEED_SLIDER_MAX = 10;

function sliderStepToSpeed(step: number): number {
  const clamped = Math.min(Math.max(step, SPEED_SLIDER_MIN), SPEED_SLIDER_MAX);
  return clamped <= 0 ? 1 + (0.3 * clamped) / 10 : 1 + (0.2 * clamped) / 10;
}

function speedToSliderStep(value: number): number {
  let nearestStep = 0;
  let nearestDiff = Number.POSITIVE_INFINITY;
  for (let step = SPEED_SLIDER_MIN; step <= SPEED_SLIDER_MAX; step += 1) {
    const candidate = sliderStepToSpeed(step);
    const diff = Math.abs(candidate - value);
    if (diff < nearestDiff) {
      nearestDiff = diff;
      nearestStep = step;
    }
  }
  return nearestStep;
}

type VoiceStylePanelProps = {
  languageCode: TtsLanguageCode;
  speed: number;
  pitch: number;
  presetId: VoicePresetId | null;
  onLanguageCodeChange: (languageCode: TtsLanguageCode) => void;
  onSpeedChange: (speed: number) => void;
  onPitchChange: (pitch: number) => void;
  onPresetChange: (presetId: VoicePresetId | null) => void;
  onReset: () => void;
};

export const VoiceStylePanel = ({
  languageCode,
  speed,
  pitch,
  presetId,
  onLanguageCodeChange,
  onSpeedChange,
  onPitchChange,
  onPresetChange,
  onReset
}: VoiceStylePanelProps) => {
  const { t } = useTranslation();
  const safeSpeed = Math.min(Math.max(speed || 1, 0.7), 1.2);
  const safePitch = Math.min(Math.max(pitch || 0, -1), 1);

  const isCustom = presetId === null;
  const slidersDirty = Math.abs(safeSpeed - 1) > 0.0001 || Math.abs(safePitch) > 0.0001;
  const showReset = !isCustom || slidersDirty;

  const selectPreset = (id: VoicePresetId | null) => {
    if (id === null) {
      onPresetChange(null);
      return;
    }
    const settings = VOICE_PRESET_SETTINGS[id];
    onPresetChange(id);
    onSpeedChange(settings.speed);
    onPitchChange(settings.pitch);
  };

  const handleSpeedChange = (value: number) => {
    if (presetId) {
      onPresetChange(null);
    }
    onSpeedChange(value);
  };

  const handlePitchChange = (value: number) => {
    if (presetId) {
      onPresetChange(null);
    }
    onPitchChange(value);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("voice.styleTitle")}</h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t("voice.styleHint")}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className={`shrink-0 px-3 py-1.5 text-xs font-medium dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 ${!showReset ? "invisible pointer-events-none" : ""}`}
          onClick={onReset}
          tabIndex={showReset ? undefined : -1}
          aria-hidden={!showReset}
        >
          {t("voice.resetSliders")}
        </Button>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("voice.presetSection")}
        </span>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => selectPreset(null)}
            className={chipClassName(isCustom)}
          >
            {t("presets.custom")}
          </button>
          {VOICE_PRESET_OPTIONS.map((option) => {
            const active = presetId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectPreset(option.id)}
                className={chipClassName(active)}
              >
                {t(option.labelKey)}
              </button>
            );
          })}
        </div>
        {!isCustom ? (
          <p className="text-xs text-blue-700 dark:text-blue-300">{t("presets.overrideNotice")}</p>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("voice.narrationLanguage")}
        </span>
        <div
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="listbox"
          aria-label={t("voice.narrationLanguage")}
        >
          {TTS_LANGUAGE_OPTIONS.map((option) => {
            const active = languageCode === option.code;
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onLanguageCodeChange(option.code)}
                className={chipClassName(active)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("voice.manualSection")}
        </span>

        <label className={`block space-y-2 ${!isCustom ? "opacity-80" : ""}`}>
          <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
            <span>{t("voice.speed")}</span>
            <span className="tabular-nums">{safeSpeed.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min={SPEED_SLIDER_MIN}
            max={SPEED_SLIDER_MAX}
            step={1}
            value={speedToSliderStep(safeSpeed)}
            onChange={(event) => handleSpeedChange(sliderStepToSpeed(Number(event.target.value)))}
            className="vs-range w-full"
            aria-label={t("voice.speed")}
          />
        </label>

        <label className={`block space-y-2 ${!isCustom ? "opacity-80" : ""}`}>
          <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
            <span>{t("voice.pitch")}</span>
            <span className="tabular-nums">{safePitch.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.1}
            value={safePitch}
            onChange={(event) => handlePitchChange(Math.min(Math.max(Number(event.target.value), -1), 1))}
            className="vs-range w-full"
            aria-label={t("voice.pitch")}
          />
        </label>

        {!isCustom ? (
          <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">{t("voice.presetSliderHint")}</p>
        ) : null}
      </div>
    </div>
  );
};
