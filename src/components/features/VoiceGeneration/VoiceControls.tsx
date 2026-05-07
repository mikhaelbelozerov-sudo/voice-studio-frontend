import { useTranslation } from "react-i18next";
import { TTS_LANGUAGE_OPTIONS, TtsLanguageCode } from "../../../constants/ttsLanguages";
import { Button } from "../../ui/Button";
import { DropdownMenu } from "../../ui/DropdownMenu";

interface VoiceControlsProps {
  languageCode: TtsLanguageCode;
  speed: number;
  pitch: number;
  onLanguageCodeChange: (languageCode: TtsLanguageCode) => void;
  onSpeedChange: (speed: number) => void;
  onPitchChange: (pitch: number) => void;
  onResetSliders: () => void;
}

export const VoiceControls = ({
  languageCode,
  speed,
  pitch,
  onLanguageCodeChange,
  onSpeedChange,
  onPitchChange,
  onResetSliders
}: VoiceControlsProps) => {
  const { t } = useTranslation();
  const safeSpeed = Math.min(Math.max(speed || 1, 0.7), 1.2);
  const safePitch = Math.min(Math.max(pitch || 0, -1), 1);
  const SPEED_SLIDER_MIN = -10;
  const SPEED_SLIDER_MAX = 10;
  const sliderStepToSpeed = (step: number) => {
    const clamped = Math.min(Math.max(step, SPEED_SLIDER_MIN), SPEED_SLIDER_MAX);
    return clamped <= 0 ? 1 + (0.3 * clamped) / 10 : 1 + (0.2 * clamped) / 10;
  };
  const speedToSliderStep = (value: number) => {
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
  };

  const slidersDirty =
    Math.abs(safeSpeed - 1) > 0.0001 || Math.abs(safePitch) > 0.0001;

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("voice.voiceParams")}</h2>
        {slidersDirty ? (
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 px-3 py-1.5 text-xs font-medium dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
            onClick={onResetSliders}
          >
            {t("voice.resetSliders")}
          </Button>
        ) : null}
      </div>

      <div className="block space-y-2">
        <span className="text-sm text-slate-700 dark:text-slate-300">{t("profile.language")}</span>
        <DropdownMenu
          value={languageCode}
          options={TTS_LANGUAGE_OPTIONS.map((option) => ({ value: option.code, label: option.label }))}
          onChange={(nextValue) => onLanguageCodeChange(nextValue as TtsLanguageCode)}
        />
      </div>

      <label className="block space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
          <span>{t("voice.speed")}</span>
          <span>{safeSpeed.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min={SPEED_SLIDER_MIN}
          max={SPEED_SLIDER_MAX}
          step={1}
          value={speedToSliderStep(safeSpeed)}
          onChange={(event) => onSpeedChange(sliderStepToSpeed(Number(event.target.value)))}
          className="vs-range w-full"
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
          className="vs-range w-full"
        />
      </label>
    </div>
  );
};
