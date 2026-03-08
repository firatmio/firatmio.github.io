"use client";

import { useState, useCallback } from "react";
import Preloader from "@/components/Preloader";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Timeline from "@/components/sections/Timeline";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";
import type { GitHubRepo } from "@/lib/github";

interface PageContentProps {
  avatarUrl: string;
  repoCount: number;
  contributions: number;
  repos: GitHubRepo[];
}

export default function PageContent({
  avatarUrl,
  repoCount,
  contributions,
  repos,
}: PageContentProps) {
  const [loaded, setLoaded] = useState(false);

  const handlePreloadComplete = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <>
      {!loaded && <Preloader onComplete={handlePreloadComplete} />}
      <main>
        <Hero avatarUrl={avatarUrl} />
        <About repoCount={repoCount} contributions={contributions} />
        <Skills />
        <Projects repos={repos} />
        <Timeline />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
