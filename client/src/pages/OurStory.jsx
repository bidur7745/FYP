import React, { useState, useEffect } from "react";
import { Sprout, Leaf, Brain, Target, HeartHandshake, Calendar, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { assets } from "../assets/images/assets";

const OurStory = () => {
  const { content } = useLanguage();
  const story = content?.ourStory || {};
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentSolutionSlide, setCurrentSolutionSlide] = useState(0);

  const problemImages = [assets.problem1, assets.problem2, assets.problem3];
  const solutionImages = [assets.supportImage, assets.weatherDetection, assets.smartAgriVector];

  // Auto-slide functionality for problem section
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % problemImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [problemImages.length]);

  // Auto-slide functionality for solution section
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSolutionSlide((prev) => (prev + 1) % solutionImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [solutionImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % problemImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + problemImages.length) % problemImages.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSolutionSlide = () => {
    setCurrentSolutionSlide((prev) => (prev + 1) % solutionImages.length);
  };

  const prevSolutionSlide = () => {
    setCurrentSolutionSlide((prev) => (prev - 1 + solutionImages.length) % solutionImages.length);
  };

  const goToSolutionSlide = (index) => {
    setCurrentSolutionSlide(index);
  };

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Video Background - Only 100vh */}
      <div className="absolute inset-0 h-screen w-full overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={assets.backgroundVideo}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-linear-to-br from-black/80 via-emerald-900/70 to-green-900/60" />
      </div>
      
      {/* Page container */}
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8 lg:py-20 text-slate-100">
        {/* Hero / Title */}
        <section className="text-center">
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            {story.hero?.title || "Growing Futures, One Farm at a Time"}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-slate-300 sm:text-base">
            {story.hero?.description || ""}
          </p>
        </section>

        {/* The Beginning */}
        <section className="grid gap-10 lg:grid-cols-[1.4fr,1fr] lg:items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold sm:text-3xl">{story.beginning?.title || "The Beginning"}</h2>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              {story.beginning?.paragraph1 || ""}
            </p>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              So, a simple question was asked:
              <span className="block pt-2 font-medium text-emerald-300">
                "{story.beginning?.question || ""}"
              </span>
            </p>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              {story.beginning?.paragraph2 || ""}
            </p>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-emerald-500/30 bg-black/40 backdrop-blur-xl p-6 shadow-xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
                {story.whyKrishiMitra?.title || "Why KrishiMitra?"}
              </p>
              <p className="mt-3 text-sm text-slate-100">
                {story.whyKrishiMitra?.description || ""}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-slate-300">
                <Leaf className="h-5 w-5 text-emerald-300" />
                <span>{story.whyKrishiMitra?.tagline || ""}</span>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-6 -top-6 hidden h-16 w-16 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 sm:block" />
          </div>
        </section>

        {/* The Problem We Saw & Our Solution */}
        <section className="grid gap-10  bg-black/40 lg:grid-cols-2">
          {/* Problem */}
          <div className="space-y-4 rounded-3xl border border-emerald-500/30 bg-black/40 backdrop-blur-xl p-6 shadow-lg">
            {/* Image Slideshow */}
            <div className="relative mb-4 h-64 w-full overflow-hidden rounded-2xl group">
              {/* Images Container */}
              <div className="relative h-full w-full">
                {problemImages.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === currentSlide ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Problem ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {problemImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? "w-8 bg-emerald-400"
                        : "w-2 bg-white/50 hover:bg-white/70"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <h2 className="text-2xl font-semibold sm:text-3xl">{story.problem?.title || "The Problem We Saw"}</h2>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              {story.problem?.description || ""}
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-200 sm:text-base">
              {story.problem?.items?.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Solution */}
          <div className="space-y-4 rounded-3xl border border-emerald-500/30 bg-black/40 backdrop-blur-xl p-6 shadow-lg">
            {/* Image Slideshow */}
            <div className="relative mb-4 h-64 w-full overflow-hidden rounded-2xl group">
              {/* Images Container */}
              <div className="relative h-full w-full">
                {solutionImages.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === currentSolutionSlide ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Solution ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSolutionSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextSolutionSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {solutionImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSolutionSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSolutionSlide
                        ? "w-8 bg-emerald-400"
                        : "w-2 bg-white/50 hover:bg-white/70"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <h2 className="flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
              <Brain className="h-6 w-6 text-emerald-300" />
              {story.solution?.title || "Our Solution"}
            </h2>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              {story.solution?.description || ""}
            </p>
            <ul className="mt-2 grid gap-2 text-sm text-slate-200 sm:grid-cols-2 sm:text-base">
              {story.solution?.items?.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="grid gap-8 rounded-3xl border border-emerald-500/25 bg-black/40 backdrop-blur-xl p-6 sm:p-8 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
              <Target className="h-6 w-6 text-emerald-300" />
              {story.mission?.title || "Our Mission"}
            </h2>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              {story.mission?.description || ""}
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
              <Leaf className="h-6 w-6 text-emerald-300" />
              {story.vision?.title || "Our Vision"}
            </h2>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              {story.vision?.description || ""}
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="space-y-6">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">{story.values?.title || "Our Values"}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {story.values?.items?.map((value, index) => {
              const icons = [HeartHandshake, Sprout, Brain, Target];
              const Icon = icons[index] || Target;
              return (
                <div key={index} className="rounded-2xl border border-emerald-500/30 bg-black/40 backdrop-blur-xl p-5 shadow-lg">
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                    <Icon className="h-5 w-5" />
                    {value.title}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Journey / Timeline */}
        <section className="space-y-6">
          <h2 className="flex items-center justify-center gap-2 text-2xl font-semibold sm:text-3xl">
            <Calendar className="h-6 w-6 text-emerald-300" />
            {story.journey?.title || "Our Journey"}
          </h2>
          <div className="relative space-y-6 border-l border-slate-700 pl-8">
            {story.journey?.items?.map((item, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-[38px] top-4 h-3 w-3 rounded-full border-2 border-emerald-300 bg-black" />
                <div className="rounded-2xl border border-emerald-500/30 bg-black/40 backdrop-blur-xl p-4 shadow-lg">
                  <p className="text-sm font-semibold text-slate-100 sm:text-base">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Meet the Project & Future */}
        <section className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold sm:text-3xl">{story.meetProject?.title || "Meet the Project"}</h2>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              {story.meetProject?.paragraph1 || ""}
            </p>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              Every feature is built with one question in mind:
              <span className="block pt-2 font-medium text-emerald-300">
                "{story.meetProject?.question || ""}"
              </span>
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-emerald-500/25 bg-black/40 backdrop-blur-xl p-6 shadow-lg">
            <h2 className="flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
              <Sparkles className="h-6 w-6 text-emerald-300" />
              {story.future?.title || "The Future of KrishiMitra"}
            </h2>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              {story.future?.description || ""}
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-200 sm:text-base">
              {story.future?.items?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing Note */}
        <section className="flex flex-col md:flex-row gap-8 rounded-3xl border border-emerald-500/30 bg-black/50 backdrop-blur-xl p-6 sm:p-8 items-center">
          <div className="w-full md:w-2/5 shrink-0 flex justify-center">
            <img
              src={assets.hopeForFuture}
              alt="Hope for Future"
              className="h-auto w-full max-w-sm rounded-2xl object-contain"
            />
          </div>
          <div className="w-full md:w-3/5 space-y-4 text-center md:text-left">
            <h2 className="text-2xl font-semibold sm:text-3xl">{story.closingNote?.title || "A Closing Note"}</h2>
            <p className="text-sm leading-relaxed text-slate-100 sm:text-base">
              {story.closingNote?.description || ""}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OurStory;
