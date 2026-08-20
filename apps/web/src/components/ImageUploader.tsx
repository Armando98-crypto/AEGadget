"use client";

import { useState, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { apiRequest, ApiError } from "@/lib/api";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

interface UploadResult {
  url: string;
  originalName: string;
  size: number;
}

interface ImageUploaderProps {
  imagensExistentes?: { id?: string; url: string; ordem: number }[];
  onImagensChange: (imagens: { url: string; ordem: number }[]) => void;
  maxImagens?: number;
}

export default function ImageUploader({
  imagensExistentes = [],
  onImagensChange,
  maxImagens = 6,
}: ImageUploaderProps) {
  const { accessToken } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = maxImagens - imagensExistentes.length;
    if (remaining <= 0) {
      setError(`Máximo de ${maxImagens} imagens permitidas`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    if (filesToUpload.length < files.length) {
      setError(`Apenas ${remaining} imagem(ns) adicional(ns) permitida(s)`);
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      filesToUpload.forEach((file) => formData.append("imagens", file));

      const result = await apiRequest<{ imagens: UploadResult[] }>("/upload", {
        method: "POST",
        token: accessToken || undefined,
        body: formData,
        isFormData: true,
      });

      const novasImagens = result.imagens.map((img, i) => ({
        url: img.url,
        ordem: imagensExistentes.length + i,
      }));

      onImagensChange([...imagensExistentes, ...novasImagens]);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro ao fazer upload");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removerImagem(index: number) {
    const novas = imagensExistentes
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, ordem: i }));
    onImagensChange(novas);
  }

  function moverImagem(de: number, para: number) {
    if (para < 0 || para >= imagensExistentes.length) return;
    const novas = [...imagensExistentes];
    const [item] = novas.splice(de, 1);
    novas.splice(para, 0, item);
    onImagensChange(novas.map((img, i) => ({ ...img, ordem: i })));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Imagens do Produto ({imagensExistentes.length}/{maxImagens})
        </label>
        {imagensExistentes.length < maxImagens && (
          <label className="flex cursor-pointer items-center gap-1 text-xs text-primary-500 hover:text-primary-600">
            <Upload size={14} />
            Adicionar
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</p>
      )}

      {imagensExistentes.length === 0 && !uploading && (
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-8 transition-colors hover:border-primary-300 hover:bg-primary-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={32} className="mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">
            Clique para adicionar imagens
          </p>
          <p className="text-xs text-gray-400">
            JPG, PNG, WebP • Máx. 5MB cada
          </p>
        </div>
      )}

      {uploading && (
        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-primary-200 bg-primary-50 py-8">
          <Loader2 size={24} className="animate-spin text-primary-500" />
          <span className="ml-2 text-sm text-primary-600">A enviar...</span>
        </div>
      )}

      {imagensExistentes.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {imagensExistentes.map((img, i) => (
            <div key={i} className="group relative">
              <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                <img
                  src={img.url}
                  alt={`Imagem ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Badge principal */}
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-primary-500 px-1 py-0.5 text-[8px] font-bold text-white">
                  PRINCIPAL
                </span>
              )}

              {/* Controles */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moverImagem(i, i - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-700 hover:bg-white"
                    title="Mover para esquerda"
                  >
                    ←
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removerImagem(i)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                  title="Remover"
                >
                  <X size={12} />
                </button>
                {i < imagensExistentes.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moverImagem(i, i + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-700 hover:bg-white"
                    title="Mover para direita"
                  >
                    →
                  </button>
                )}
              </div>

              {/* Número */}
              <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1 text-[10px] text-white">
                {i + 1}
              </span>
            </div>
          ))}

          {/* Botão adicionar mais */}
          {imagensExistentes.length < maxImagens && !uploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-primary-300 hover:bg-primary-50"
            >
              <Upload size={20} className="text-gray-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
