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
      <audio controls src={audioUrl} className="w-full rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {t("generate.audioNotSupported", { defaultValue: "Ваш браузер не поддерживает аудио." })}
      </audio>
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
