import { Download } from "lucide-react";
import { Button } from "./Button";

interface AudioPlayerProps {
  audioUrl: string;
}

export const AudioPlayer = ({ audioUrl }: AudioPlayerProps) => {
  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">Результат генерации</h3>
      <audio controls src={audioUrl} className="w-full">
        Ваш браузер не поддерживает аудио.
      </audio>
      <a href={audioUrl} download target="_blank" rel="noreferrer" className="block">
        <Button className="w-full gap-2" variant="secondary">
          <Download size={16} />
          Скачать MP3
        </Button>
      </a>
    </div>
  );
};
