"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { apiRequest, ApiError } from "@/lib/api";
import { Star, Send, Loader2 } from "lucide-react";

interface ReviewFormProps {
  productId: string;
  onReviewCreated: () => void;
}

export default function ReviewForm({ productId, onReviewCreated }: ReviewFormProps) {
  const { accessToken } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  if (!accessToken) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-500">
        Faça login para avaliar este produto
      </div>
    );
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setErro("Selecione uma avaliação de 1 a 5 estrelas");
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      await apiRequest("/reviews", {
        method: "POST",
        token: accessToken ?? undefined,
        body: JSON.stringify({
          productId,
          rating,
          comentario: comentario.trim() || undefined,
        }),
      });
      setSucesso(true);
      setRating(0);
      setComentario("");
      onReviewCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        setErro(err.message);
      } else {
        setErro("Erro ao enviar avaliação");
      }
    } finally {
      setEnviando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm font-medium text-green-700">
          Avaliação enviada com sucesso!
        </p>
        <button
          onClick={() => setSucesso(false)}
          className="mt-2 text-xs text-green-600 underline hover:text-green-800"
        >
          Avaliar novamente
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submeter} className="space-y-4 rounded-xl border border-gray-100 bg-white p-4">
      <h3 className="font-semibold text-gray-900">Escrever avaliação</h3>

      {/* Estrelas */}
      <div>
        <label className="mb-2 block text-sm text-gray-600">Avaliação *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={`${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                } transition-colors`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 self-center text-sm text-gray-500">
              {rating === 1 && "Mau"}
              {rating === 2 && "Razoável"}
              {rating === 3 && "Bom"}
              {rating === 4 && "Muito Bom"}
              {rating === 5 && "Excelente"}
            </span>
          )}
        </div>
      </div>

      {/* Comentário */}
      <div>
        <label className="mb-1 block text-sm text-gray-600">Comentário (opcional)</label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          className="input-base"
          rows={3}
          maxLength={500}
          placeholder="Partilhe a sua experiência com este produto..."
        />
        <p className="mt-1 text-right text-xs text-gray-400">{comentario.length}/500</p>
      </div>

      {erro && (
        <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{erro}</p>
      )}

      <button
        type="submit"
        disabled={enviando || rating === 0}
        className="btn-primary flex items-center gap-2"
      >
        {enviando ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {enviando ? "A enviar..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
