"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  imagem: string;
  titulo: string;
  descricao: string;
  link?: string;
}

interface CarrosselProps {
  slides: Slide[];
  autoplayMs?: number;
}

/**
 * Carrossel de imagens — AE Gadget
 *
 * Suporta:
 * - Navegação manual (setas)
 * - Autoplay com pausa ao hover
 * - Indicadores (dots)
 * - Transições suaves
 */
export default function Carrossel({ slides, autoplayMs = 5000 }: CarrosselProps) {
  const [slideAtual, setSlideAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [transicao, setTransicao] = useState(false);

  const totalSlides = slides.length;

  const avancar = useCallback(() => {
    setTransicao(true);
    setTimeout(() => {
      setSlideAtual((prev) => (prev + 1) % totalSlides);
      setTransicao(false);
    }, 300);
  }, [totalSlides]);

  const retroceder = useCallback(() => {
    setTransicao(true);
    setTimeout(() => {
      setSlideAtual((prev) => (prev - 1 + totalSlides) % totalSlides);
      setTransicao(false);
    }, 300);
  }, [totalSlides]);

  const irPara = (index: number) => {
    setTransicao(true);
    setTimeout(() => {
      setSlideAtual(index);
      setTransicao(false);
    }, 300);
  };

  // Autoplay
  useEffect(() => {
    if (pausado || totalSlides <= 1) return;
    const timer = setInterval(avancar, autoplayMs);
    return () => clearInterval(timer);
  }, [pausado, avancar, autoplayMs, totalSlides]);

  if (totalSlides === 0) return null;

  const slide = slides[slideAtual];

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* Slides */}
      <div
        className={`relative h-[300px] transition-opacity duration-300 sm:h-[400px] md:h-[450px] ${
          transicao ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Imagem de fundo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slide.imagem})` }}
        >
          {/* Overlay escuro para legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </div>

        {/* Conteúdo */}
        <div className="relative flex h-full flex-col justify-center px-8 md:px-16">
          <div className="max-w-lg">
            <h2 className="mb-3 text-2xl font-bold text-white drop-shadow-lg md:text-4xl">
              {slide.titulo}
            </h2>
            <p className="mb-6 text-sm text-white/90 drop-shadow md:text-lg">
              {slide.descricao}
            </p>
            {slide.link && (
              <a
                href={slide.link}
                className="inline-block rounded-lg bg-primary-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-600"
              >
                Ver Produtos
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Setas de navegação */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={retroceder}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={avancar}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Indicadores (dots) */}
      {totalSlides > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => irPara(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === slideAtual
                  ? "w-8 bg-primary-500"
                  : "w-2.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
