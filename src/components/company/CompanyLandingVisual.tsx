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

export function CompanyLandingVisual({ language, chromeHeight, onVisibilityChange }: {
  language: Language;
  chromeHeight: number;
  onVisibilityChange?: (visible: boolean) => void;
}) {
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
    if (!stage || typeof IntersectionObserver !== 'function') return;
    // The shared nav is sticky, the masthead is not. Once the hero clears the
    // bottom of the nav, restore its usual surface and stop drawing frames.
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      onVisibilityChange?.(entry.isIntersecting);
    }, { rootMargin: `${-chromeHeight}px 0px 0px` });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [chromeHeight, onVisibilityChange]);

  useEffect(() => {
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!motion || !window.WebGL2RenderingContext) return;
    const syncMotion = () => {
      setMotionAllowed(!motion.matches);
      if (motion.matches) {
        setLoadScene(false);
        setSceneReady(false);
      }
    };
    const syncVisibility = () => setPageVisible(!document.hidden);
    syncMotion();
    syncVisibility();
    motion.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      motion.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  // Paint the heading, controls and photo before loading the original scene.
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
    <>
      <div className="corporate-masthead-backdrop" data-testid="corporate-masthead-backdrop"
        data-scene-ready={live || undefined} ref={stageRef} aria-hidden="true">
        <picture>
          <source type="image/webp" srcSet={`${publicUrl('images/insco-field-inspection-720.webp')} 720w, ${publicUrl('images/insco-field-inspection-1200.webp')} 1200w`} sizes="100vw" />
          <img src={COMPANY_MEDIA.heroInspection} width={1376} height={768} fetchPriority="high" decoding="async" alt="" />
        </picture>
        {loadScene && motionAllowed && (
          <div className="corporate-hero-backdrop" data-testid="corporate-hero-backdrop">
            <BackdropBoundary>
              <Suspense fallback={null}>
                <InspectionScene language={language} mode="ut" cameraPreset="overview" autoOrbit background
                  paused={paused || !inView || !pageVisible} onReadyChange={setSceneReady} />
              </Suspense>
            </BackdropBoundary>
          </div>
        )}
      </div>
      <div className="corporate-wrap corporate-hero-tools">
        <p><span aria-hidden="true" />{isAr ? 'مشهد توضيحي للفحص الصناعي' : 'Illustrative industrial inspection scene'}</p>
        {live && (
          <CtaButton variant="secondary" size="sm" className="corporate-hero-motion" onClick={() => setPaused(value => !value)}>
            <MotionIcon className="size-3.5 shrink-0" aria-hidden="true" />
            {paused ? (isAr ? 'شغّل الحركة' : 'Play motion') : (isAr ? 'أوقف الحركة' : 'Pause motion')}
          </CtaButton>
        )}
      </div>
    </>
  );
}
