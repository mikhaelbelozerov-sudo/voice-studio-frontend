import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";

interface AudioPlayerProps {
  audioUrl: string;
  onDownloadClick?: () => void;
}

export const AudioPlayer = ({ audioUrl, onDownloadClick }: AudioPlayerProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("generate.resultTitle", { defaultValue: "Результат генерации" })}</h3>
      {/*
        Native audio controls paint rounded chrome, but the element box stays square.
        A light clipping shell + overflow-hidden removes dark corner artifacts in dark UI.
      */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-100">
        <audio
          controls
          src={audioUrl}
          className="block w-full bg-transparent [color-scheme:light] dark:[color-scheme:light]"
        >
          {t("generate.audioNotSupported", { defaultValue: "Ваш браузер не поддерживает аудио." })}
        </audio>
      </div>
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
  );
};
