/**
 * SeoManager — keeps <head> in sync with portal, language, and route.
 * Injects hreflang, updates title/description/canonical, and
 * handles accessibility announcements for screen readers.
 */

import { useEffect, useRef } from 'react';
import { Language } from '../types';
import { PortalId } from '../utils/portalRoutes';
import { injectHreflangLinks, updateSeoTags } from '../utils/seo';
import { getRobotTarget } from '../i18n/translationStore';

interface Props {
  language: Language;
  portal: PortalId;
  routePath: string; // e.g. "#academy/disciplines"
}

const PORTAL_META: Record<PortalId, { ar: { title: string; desc: string }; en: { title: string; desc: string } }> = {
  company: {
    ar: {
      title: 'خدمات الفحص غير الإتلافي والمعالجة الحرارية',
      desc: 'خدمات إنسكو للفحص غير الإتلافي (UT، RT، MT، PT، ET، PAUT) والمعالجة الحرارية بعد اللحام (PWHT) — خبرة معتمدة منذ 2010.',
    },
    en: {
      title: 'NDT Inspection & PWHT Services',
      desc: 'INSCO NDT services (UT, RT, MT, PT, ET, PAUT) and Post-Weld Heat Treatment — certified expertise since 2010.',
    },
  },
  academy: {
    ar: {
      title: 'أكاديمية إنسكو الهندسية',
      desc: 'أكاديمية إنسكو: 8 تخصصات هندسية، مكتبة EDB، محاكيات تفاعلية، تقييم عملي، ومسارات تعلم — إفادة تعلم ذاتي.',
    },
    en: {
      title: 'INSCO Engineering Academy',
      desc: 'INSCO Academy: 8 disciplines, EDB library, interactive simulators, practical assessment, and learning paths.',
    },
  },
  client: {
    ar: {
      title: 'بوابة العملاء والملفات المكوّدة',
      desc: 'بوابة عملاء إنسكو: طلبات الخدمة، أرشيف الشركات المكوّدة، ملفات التقارير، والحضور.',
    },
    en: {
      title: 'Client & Coded Dossier Portal',
      desc: 'INSCO Client Portal: service requests, coded company archive, inspection dossiers, and time-clock.',
    },
  },
  network: {
    ar: {
      title: 'الشبكة الهندسية',
      desc: 'الشبكة الهندسية: منشورات، وظائف، ملفات شخصية، ومجموعات للمهندسين والفنيين.',
    },
    en: {
      title: 'Engineering Network',
      desc: 'Engineering Network: feed, jobs, profiles, and groups for engineers and technicians.',
    },
  },
};

export const SeoManager: React.FC<Props> = ({ language, portal, routePath }) => {
  const prevPath = useRef<string>('');

  useEffect(() => {
    const meta = PORTAL_META[portal] || PORTAL_META.company;
    const langMeta = language === 'ar' ? meta.ar : meta.en;

    // Respect robot translation for lang attribute — robot owns <html lang> when active
    const effectiveLang = getRobotTarget() || language;

    updateSeoTags({
      title: langMeta.title,
      description: langMeta.desc,
      path: routePath,
      lang: effectiveLang,
      type: portal === 'academy' ? 'article' : 'website',
    });

    // Hreflang — always inject for crawlers
    injectHreflangLinks(routePath);

    // Announce route change to screen readers (only when path actually changes)
    if (prevPath.current !== routePath) {
      prevPath.current = routePath;
      const announcer = document.getElementById('a11y-route-announcer');
      if (announcer) {
        announcer.textContent = language === 'ar'
          ? `تم الانتقال إلى ${langMeta.title}`
          : `Navigated to ${langMeta.title}`;
        // Clear after announcement
        setTimeout(() => { announcer.textContent = ''; }, 1000);
      }
    }
  }, [language, portal, routePath]);

  return (
    <>
      {/* Screen reader route announcer — visually hidden */}
      <div
        id="a11y-route-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      {/* Skip link target is #insco-main — SeoManager ensures it exists */}
    </>
  );
};
