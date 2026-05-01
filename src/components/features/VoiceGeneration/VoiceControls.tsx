import { useTranslation } from "react-i18next";

interface VoiceControlsProps {
  speed: number;
  pitch: number;
  onSpeedChange: (speed: number) => void;
  onPitchChange: (pitch: number) => void;
}

export const VoiceControls = ({ speed, pitch, onSpeedChange, onPitchChange }: VoiceControlsProps) => {
  const { t } = useTranslation();
  const safeSpeed = Math.min(Math.max(speed || 1, 0.7), 1.2);
  const safePitch = Math.min(Math.max(pitch || 0, -1), 1);

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("voice.voiceParams")}</h2>

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
