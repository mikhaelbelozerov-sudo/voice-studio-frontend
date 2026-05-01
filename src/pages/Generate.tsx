import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AudioPlayer } from "../components/ui/AudioPlayer";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { TextEditor } from "../components/features/VoiceGeneration/TextEditor";
import { VoiceControls } from "../components/features/VoiceGeneration/VoiceControls";
import { VoiceSelector } from "../components/features/VoiceGeneration/VoiceSelector";
import { generateAudio, getVoices, Voice } from "../services/api";
import { useVoiceStore } from "../store/voiceStore";
import { useTelegram } from "../hooks/useTelegram"; // добавляем хук Telegram

export const GeneratePage = () => {
  const { t } = useTranslation();
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

  // Получаем данные пользователя из Telegram
  const { telegramId } = useTelegram();

  useEffect(() => {
    const loadVoices = async () => {
      setIsLoadingVoices(true);
      setError(null);
      try {
        const data = await getVoices();
        setVoices(data.voices || []);
      } catch (requestError) {
        setError(t("generate.loadVoicesError"));
        setVoices([]);
      } finally {
        setIsLoadingVoices(false);
      }
    };

    void loadVoices();
  }, [t]);

  const canGenerate = useMemo(() => {
    return Boolean(telegramId && selectedVoiceId && text.trim().length > 0 && text.length <= 1000 && !isGenerating);
  }, [telegramId, isGenerating, selectedVoiceId, text]);

  const handleGenerate = async () => {
    if (!selectedVoiceId) {
      setError(t("generate.selectVoiceFirst"));
      return;
    }

    if (!telegramId) {
      setError(t("generate.telegramMissing"));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      console.log("[GeneratePage] sending controls", { speed, pitch, voiceId: selectedVoiceId, telegramId });
      const response = await generateAudio({
        text,
        voiceId: selectedVoiceId,
        speed,
        pitch,
        telegramId, // передаём ID пользователя на бэкенд
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
      // Если бэкенд вернул 403 (лимит исчерпан), покажем понятное сообщение
      const err = requestError as any;
      console.error("[GeneratePage] generation failed", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message
      });
      if (err?.response?.status === 403) {
        setError(t("generate.dailyLimit"));
      } else {
        setError(err?.response?.data?.error ?? t("generate.generateError"));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("generate.title")}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("generate.subtitle")}</p>
      </div>

      {error ? <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {isLoadingVoices ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner />
          <span>{t("common.loading")}</span>
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
            {t("generate.generating")}
          </>
        ) : (
          t("generate.generate")
        )}
      </Button>

      {audioUrl ? <AudioPlayer audioUrl={audioUrl} /> : null}
    </div>
  );
};