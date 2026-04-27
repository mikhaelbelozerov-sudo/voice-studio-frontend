import { useEffect, useMemo, useState } from "react";
import { AudioPlayer } from "../components/ui/AudioPlayer";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { TextEditor } from "../components/features/VoiceGeneration/TextEditor";
import { VoiceControls } from "../components/features/VoiceGeneration/VoiceControls";
import { VoiceSelector } from "../components/features/VoiceGeneration/VoiceSelector";
import { generateAudio, getVoices, Voice } from "../services/api";
import { useVoiceStore } from "../store/voiceStore";

export const GeneratePage = () => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const {
    selectedVoiceId,
    text,
    speed,
    pitch,
    setSelectedVoiceId,
    setText,
    setSpeed,
    setPitch
  } = useVoiceStore();

  useEffect(() => {
    const loadVoices = async () => {
      setIsLoadingVoices(true);
      setError(null);
      try {
        const data = await getVoices();
        setVoices(data.voices || []);
      } catch (requestError) {
        setError("Не удалось загрузить список голосов");
        setVoices([]);
      } finally {
        setIsLoadingVoices(false);
      }
    };

    void loadVoices();
  }, []);

  const canGenerate = useMemo(() => {
    return Boolean(selectedVoiceId && text.trim().length > 0 && text.length <= 1000 && !isGenerating);
  }, [isGenerating, selectedVoiceId, text]);

  const handleGenerate = async () => {
    if (!selectedVoiceId) {
      setError("Сначала выберите голос");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await generateAudio({
        text,
        voiceId: selectedVoiceId,
        speed,
        pitch
      });

      const generatedUrl = response.audioUrl || response.url;
      if (!generatedUrl) {
        throw new Error("Empty audio URL");
      }

      const absoluteUrl = generatedUrl.startsWith("http")
        ? generatedUrl
        : `${window.location.protocol}//${window.location.hostname}:3001${generatedUrl}`;

      setAudioUrl(absoluteUrl);
    } catch (requestError) {
      setError("Не удалось сгенерировать аудио");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">VoiceStudio Pro</h1>
        <p className="text-sm text-slate-600">Генерация речи для Telegram Mini App</p>
      </div>

      {error ? <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {isLoadingVoices ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner />
          <span>Загрузка голосов...</span>
        </div>
      ) : (
        <VoiceSelector
          voices={voices}
          selectedVoiceId={selectedVoiceId}
          onSelect={(voiceId) => setSelectedVoiceId(voiceId)}
        />
      )}

      <TextEditor value={text} onChange={setText} maxLength={1000} />

      <VoiceControls speed={speed} pitch={pitch} onSpeedChange={setSpeed} onPitchChange={setPitch} />

      <Button className="w-full gap-2" onClick={handleGenerate} disabled={!canGenerate} loading={isGenerating}>
        {isGenerating ? (
          <>
            <Spinner />
            Генерация...
          </>
        ) : (
          "Сгенерировать"
        )}
      </Button>

      {audioUrl ? <AudioPlayer audioUrl={audioUrl} /> : null}
    </div>
  );
};
