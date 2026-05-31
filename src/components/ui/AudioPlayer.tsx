import { Download, Headphones } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";

interface AudioPlayerProps {
  audioUrl: string;
  onDownloadClick?: () => void;
}

export const AudioPlayer = ({ audioUrl, onDownloadClick }: AudioPlayerProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t("generate.resultTitle", { defaultValue: "Результат генерации" })}
          </h2>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {t("generate.resultHint", { defaultValue: "Прослушайте и скачайте готовую озвучку." })}
        </p>
      </div>

      {/*
        Native audio controls paint rounded chrome, but the element box stays square.
        A light clipping shell + overflow-hidden removes dark corner artifacts in dark UI.
      */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
        <audio
          controls
          src={audioUrl}
          className="block w-full bg-transparent [color-scheme:light] dark:[color-scheme:light]"
        >
          {t("generate.audioNotSupported", { defaultValue: "Ваш браузер не поддерживает аудио." })}
        </audio>
      </div>

      <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
        <a
          href={audioUrl}
          download
          target="_blank"
          rel="noreferrer"
          className="block"
          onClick={() => onDownloadClick?.()}
        >
          <Button className="w-full gap-2" variant="secondary">
            <Download size={16} />
            {t("generate.downloadMp3", { defaultValue: "Скачать MP3" })}
          </Button>
        </a>
      </div>
    </div>
  );
};
