"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Locale = 'ko' | 'en';

type Placement =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'diagonal-single'
  | 'diagonal-tile';

type Controls = {
  text: string;
  placement: Placement;
  opacity: number;
  margin: number;
  fontSize: number;
  color: string;
};

const DEFAULT_CONTROLS: Controls = {
  text: 'example',
  placement: 'bottom-right',
  opacity: 0.35,
  margin: 24,
  fontSize: 48,
  color: '#cbc8c8',
};

const COPY = {
  ko: {
    title: '이미지 텍스트 워터마크',
    settings: '설정',
    uploadTitle: '이미지 업로드',
    uploadHint: '클릭, 드래그 앤 드롭, Ctrl+V 붙여넣기 지원',
    chooseFile: '파일 선택',
    selectedFile: (name: string) => `선택된 파일: ${name}`,
    noFile: '아직 업로드한 이미지가 없습니다.',
    watermarkText: '워터마크 문구',
    placement: '배치 위치',
    opacity: '투명도',
    margin: '여백',
    fontSize: '글자 크기',
    textColor: '글자 색상',
    download: '워터마크 PNG 다운로드',
    processing: '처리 중...',
    preview: '미리보기',
    previewEmptyTitle: '아직 미리보기가 없습니다',
    previewEmptyHint: '이미지를 업로드하거나 붙여넣으면 결과가 여기 표시됩니다.',
    invalidImage: '이미지 파일만 업로드할 수 있습니다.',
    previewFailed: '미리보기를 생성하지 못했습니다.',
    exportFailed: '이미지를 내보내지 못했습니다.',
    defaultDownloadName: '워터마크-이미지.png',
    localeKo: '한국어',
    localeEn: 'English',
  },
  en: {
    title: 'Image Text Watermark',
    settings: 'Settings',
    uploadTitle: 'Upload image',
    uploadHint: 'Click, drag and drop, or paste with Ctrl+V',
    chooseFile: 'Choose file',
    selectedFile: (name: string) => `Selected file: ${name}`,
    noFile: 'No image has been uploaded yet.',
    watermarkText: 'Watermark text',
    placement: 'Placement',
    opacity: 'Opacity',
    margin: 'Margin',
    fontSize: 'Font size',
    textColor: 'Text color',
    download: 'Download watermarked PNG',
    processing: 'Processing...',
    preview: 'Preview',
    previewEmptyTitle: 'No preview yet',
    previewEmptyHint: 'Upload or paste an image and the result will appear here.',
    invalidImage: 'Only image files can be uploaded.',
    previewFailed: 'Failed to generate preview.',
    exportFailed: 'Failed to export image.',
    defaultDownloadName: 'watermarked-image.png',
    localeKo: '한국어',
    localeEn: 'English',
  },
} as const;

const PLACEMENT_OPTIONS: Array<{
  value: Placement;
  label: Record<Locale, string>;
  description: Record<Locale, string>;
}> = [
  {
    value: 'top-left',
    label: { ko: '좌측 상단', en: 'Top left' },
    description: { ko: '왼쪽 위 가로 배치', en: 'Horizontal placement in the top-left corner' },
  },
  {
    value: 'top-right',
    label: { ko: '우측 상단', en: 'Top right' },
    description: { ko: '오른쪽 위 가로 배치', en: 'Horizontal placement in the top-right corner' },
  },
  {
    value: 'bottom-left',
    label: { ko: '좌측 하단', en: 'Bottom left' },
    description: { ko: '왼쪽 아래 가로 배치', en: 'Horizontal placement in the bottom-left corner' },
  },
  {
    value: 'bottom-right',
    label: { ko: '우측 하단', en: 'Bottom right' },
    description: { ko: '오른쪽 아래 가로 배치', en: 'Horizontal placement in the bottom-right corner' },
  },
  {
    value: 'diagonal-single',
    label: { ko: '대각선 1회', en: 'Single diagonal' },
    description: { ko: '중앙에 45도 고정 배치', en: 'Centered with a fixed 45° angle' },
  },
  {
    value: 'diagonal-tile',
    label: { ko: '대각선 반복', en: 'Diagonal tile' },
    description: { ko: '45도로 반복 배치', en: 'Repeated placement with a fixed 45° angle' },
  },
];

export function WatermarkTool() {
  const [locale, setLocale] = useState<Locale>('ko');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [controls, setControls] = useState<Controls>(DEFAULT_CONTROLS);
  const [isRendering, setIsRendering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const nextLocale = navigator.language.toLowerCase().startsWith('ko') ? 'ko' : 'en';
      setLocale(nextLocale);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsRendering(true);
      setError(null);

      try {
        const form = new FormData();
        form.append('image', file);
        Object.entries(controls).forEach(([key, value]) => form.append(key, String(value)));

        const response = await fetch('/api/preview', { method: 'POST', body: form });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || COPY[locale].previewFailed);
        }

        const blob = await response.blob();
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(blob);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : COPY[locale].previewFailed);
      } finally {
        setIsRendering(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [file, controls, locale]);

  const handleFile = (nextFile: File | null) => {
    if (!nextFile) {
      setError(null);
      return;
    }

    if (!nextFile.type.startsWith('image/')) {
      setError(COPY[locale].invalidImage);
      return;
    }

    setError(null);
    setFile(nextFile);
  };

  const updateNumber = (key: keyof Controls) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setControls((current) => ({ ...current, [key]: Number(value) }));
  };

  const canExport = useMemo(() => Boolean(file && previewUrl && !isRendering), [file, previewUrl, isRendering]);

  const handleDownload = async () => {
    if (!file) return;

    setIsRendering(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('image', file);
      Object.entries(controls).forEach(([key, value]) => form.append(key, String(value)));
      const response = await fetch('/api/export', { method: 'POST', body: form });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || COPY[locale].exportFailed);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const disposition = response.headers.get('Content-Disposition');
      const utf8Match = disposition?.match(/filename\*=UTF-8''([^;]+)/i);
      const asciiMatch = disposition?.match(/filename="([^"]+)"/i);
      const decodedFilename = utf8Match ? decodeURIComponent(utf8Match[1]) : asciiMatch?.[1];
      anchor.href = url;
      anchor.download = decodedFilename || COPY[locale].defaultDownloadName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : COPY[locale].exportFailed);
    } finally {
      setIsRendering(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0] || null;
    handleFile(dropped);
  };

  const t = COPY[locale];

  return (
    <main
      className="min-h-screen bg-slate-50"
      onPaste={(event) => {
        const pastedFile = Array.from(event.clipboardData.files).find((item) => item.type.startsWith('image/')) || null;
        if (pastedFile) handleFile(pastedFile);
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{t.title}</h1>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setLocale('ko')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                locale === 'ko' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {COPY.ko.localeKo}
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                locale === 'en' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {COPY.en.localeEn}
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>{t.settings}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={cn(
                  'rounded-xl border border-dashed p-6 text-center transition-colors',
                  isDragging ? 'border-slate-900 bg-slate-100' : 'border-slate-300 bg-slate-50',
                )}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={handleDrop}
              >
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">{t.uploadTitle}</p>
                  <p className="text-sm text-slate-500">{t.uploadHint}</p>
                </div>
                <Button type="button" variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                  {t.chooseFile}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleFile(event.target.files?.[0] || null)}
                />
                <p className="mt-4 text-xs text-slate-500">{file ? t.selectedFile(file.name) : t.noFile}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="watermark-text">{t.watermarkText}</Label>
                <Input
                  id="watermark-text"
                  value={controls.text}
                  maxLength={120}
                  placeholder="example"
                  onChange={(event) => setControls((current) => ({ ...current, text: event.target.value }))}
                />
              </div>

              <div className="space-y-3">
                <Label>{t.placement}</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PLACEMENT_OPTIONS.map((option) => {
                    const selected = controls.placement === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setControls((current) => ({ ...current, placement: option.value }))}
                        className={cn(
                          'rounded-lg border px-3 py-3 text-left transition-colors',
                          selected
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
                        )}
                      >
                        <div className="text-sm font-semibold">{option.label[locale]}</div>
                        <div className={cn('mt-1 text-xs', selected ? 'text-slate-300' : 'text-slate-500')}>
                          {option.description[locale]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4">
                {[
                  [t.opacity, 'opacity', controls.opacity, 0.05, 1, 0.05],
                  [t.margin, 'margin', controls.margin, 1, 120, 1],
                  [t.fontSize, 'fontSize', controls.fontSize, 12, 160, 1],
                ].map(([label, key, value, min, max, step]) => (
                  <div key={String(key)} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <Label>{label}</Label>
                      <span className="text-slate-500">{value}</span>
                    </div>
                    <input
                      type="range"
                      min={Number(min)}
                      max={Number(max)}
                      step={Number(step)}
                      value={Number(value)}
                      onChange={updateNumber(key as keyof Controls)}
                      className="range-input"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="watermark-color">{t.textColor}</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="watermark-color"
                    type="color"
                    value={controls.color}
                    onChange={(event) => setControls((current) => ({ ...current, color: event.target.value }))}
                    className="h-11 w-14 rounded-md border border-slate-200 bg-white p-1"
                  />
                  <Input
                    value={controls.color}
                    onChange={(event) => setControls((current) => ({ ...current, color: event.target.value }))}
                    className="uppercase"
                  />
                </div>
              </div>

              <Button type="button" className="w-full" disabled={!canExport} onClick={handleDownload}>
                {isRendering ? t.processing : t.download}
              </Button>

              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>{t.preview}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[560px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={t.preview} className="max-h-[760px] w-auto rounded-lg object-contain shadow-sm" />
                ) : (
                  <div className="space-y-3 text-center">
                    <p className="text-base font-medium text-slate-700">{t.previewEmptyTitle}</p>
                    <p className="text-sm text-slate-500">{t.previewEmptyHint}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
