import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { Language } from '../../types';
import { COMPANY_MEDIA } from '../../data/companyMedia';
import { publicUrl } from '../../utils/publicUrl';
import { CtaButton } from '../ui/CtaButton';

const InspectionScene = React.lazy(() =>
  import('./InscoHero3dBanner').then(module => ({ default: module.InscoHero3dBanner }))
);

// A failed optional scene chunk must never take down the landing page.
class BackdropBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() { return this.state.failed ? null : this.props.children; }
}

export function CompanyLandingVisual({ language }: { language: Language }) {
  const isAr = language === 'ar';
  const stageRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [loadScene, setLoadScene] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!stage || !motion || typeof IntersectionObserver === 'undefined' || !window.WebGL2RenderingContext) return;

    const syncMotion = () => {
      setMotionAllowed(!motion.matches);
      if (motion.matches) {
        setLoadScene(false);
        setSceneReady(false);
      }
    };
    const syncVisibility = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(stage);
    syncMotion();
    syncVisibility();
    motion.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  // Paint the heading, actions and responsive photo first. The original 3D
  // scene is a separate chunk, requested only when its backdrop can be seen.
  useEffect(() => {
    if (!motionAllowed || !inView || !pageVisible || loadScene) return;
    const start = () => setLoadScene(true);
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 300);
    return () => window.clearTimeout(id);
  }, [motionAllowed, inView, pageVisible, loadScene]);

  const live = sceneReady && motionAllowed;
  const MotionIcon = paused ? Play : Pause;

  return (
    <figure className="corporate-hero-media" data-scene-ready={live || undefined}>
      <div className="corporate-hero-stage" ref={stageRef}>
        <picture>
          <source type="image/webp" srcSet={`${publicUrl('images/insco-field-inspection-720.webp')} 720w, ${publicUrl('images/insco-field-inspection-1200.webp')} 1200w`} sizes="(min-width: 1120px) 590px, (min-width: 900px) 48vw, 94vw" />
          <img src={COMPANY_MEDIA.heroInspection} width={1376} height={768} fetchPriority="high" decoding="async"
            alt={isAr ? 'صورة توضيحية لفحص وصلة ملحومة في منشأة صناعية' : 'Illustration of a welded joint being inspected inside an industrial plant'} />
        </picture>
        {loadScene && motionAllowed && (
          <div className="corporate-hero-backdrop" data-testid="corporate-hero-backdrop" aria-hidden="true">
            <BackdropBoundary>
              <Suspense fallback={null}>
                <InspectionScene language={language} mode="ut" cameraPreset="overview" autoOrbit background
                  paused={paused || !inView || !pageVisible} onReadyChange={setSceneReady} />
              </Suspense>
            </BackdropBoundary>
          </div>
        )}
      </div>
      <figcaption>
        <span className="corporate-hero-caption-label">
          <span aria-hidden="true" className="corporate-hero-caption-dot" />
          {live
            ? (isAr ? 'محاكاة توضيحية لفحص الأنابيب' : 'Illustrative pipe inspection scene')
            : (isAr ? 'مشهد توضيحي · الفحص الصناعي' : 'Illustrative scene · industrial inspection')}
        </span>
        {live && (
          <CtaButton variant="secondary" size="sm" className="corporate-hero-motion" onClick={() => setPaused(value => !value)}>
            <MotionIcon className="size-3.5 shrink-0" aria-hidden="true" />
            {paused ? (isAr ? 'شغّل الحركة' : 'Play motion') : (isAr ? 'أوقف الحركة' : 'Pause motion')}
          </CtaButton>
        )}
      </figcaption>
    </figure>
  );
}
