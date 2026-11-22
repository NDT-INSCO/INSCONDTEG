import{n as e}from"./rolldown-runtime-XKyaHtl9.js";import{R as t,lt as n}from"./index-DbdhGCGG.js";var r=e({downloadTrainingSyllabus:()=>s});function i(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function a(){let e=0,n=0,r=0;for(let i of t)for(let t of i.levels)e+=1,n+=t.modules.length,r+=t.trainingHours||0;return{disciplineCount:t.length,levelCount:e,moduleCount:n,totalTrainingHours:r}}function o(e){let r=e===`ar`,o=a(),s=r?`rtl`:`ltr`,c=r?`ar`:`en`,l=t.map((e,t)=>{let n=r?e.titleAr:e.titleEn,a=r?e.overviewAr:e.overviewEn,o=e.levels.map(e=>{let t=r?`${e.nameAr} — ${e.academicStageAr}`:`${e.nameEn} — ${e.academicStageEn}`,n=e.modules.map(e=>{let t=r?e.titleAr:e.titleEn,n=((r?e.topicsAr:e.topicsEn)??[]).map(e=>`<li>${i(e)}</li>`).join(``);return`
              <div class="module-box">
                <div class="module-header">
                  <strong>${i(t)}</strong>
                  <span>${i(e.duration)}</span>
                </div>
                <ul>${n}</ul>
              </div>
            `}).join(``);return`
          <div class="level-block">
            <div class="level-meta">
              <strong>${i(t)}</strong>
              <span>${e.trainingHours}h · ${e.experienceMonths}m exp · ${i(e.applicableCodes.join(`, `))}</span>
            </div>
            ${n}
          </div>
        `}).join(``);return`
      <section class="discipline-section">
        <h2>${t+1}. ${i(n)}</h2>
        <p class="overview">${i(a)}</p>
        <div class="meta-line">
          <span>${r?`التقنيات:`:`Techniques:`} ${i(e.keyTechniques.join(`, `))}</span>
          <span> · </span>
          <span>${r?`الاعتمادات:`:`Accreditations:`} ${i(e.globalAccreditations.join(`, `))}</span>
        </div>
        ${o}
      </section>
    `}).join(``);return{filename:`INSCO_NDT_Training_Syllabus_2026.html`,mimeType:`text/html;charset=utf-8`,content:`<!doctype html>
<html lang="${c}" dir="${s}">
<head>
  <meta charset="utf-8" />
  <title>${i(r?`منهج التعلّم الذاتي لأكاديمية إنسكو الهندسية (ASNT / ISO 9712)`:`INSCO Engineering Academy — NDT & PWHT Self-Study Syllabus`)}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; margin: 32px auto; max-width: 960px; padding: 0 24px; color: #0f172a; line-height: 1.55; }
    header { border-bottom: 2px solid #0891b2; padding-bottom: 16px; margin-bottom: 24px; }
    h1 { margin: 4px 0 8px; font-size: 24px; color: #0f172a; }
    h2 { margin: 20px 0 6px; font-size: 18px; color: #0e7490; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    .eyebrow { font-family: monospace; font-size: 12px; color: #0891b2; font-weight: 700; }
    .stats { display: flex; flex-wrap: wrap; gap: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-bottom: 24px; }
    .discipline-section { margin-bottom: 28px; page-break-inside: avoid; }
    .overview { margin: 4px 0 8px; font-size: 13px; color: #334155; }
    .meta-line { font-family: monospace; font-size: 12px; color: #475569; margin-bottom: 12px; }
    .level-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .level-meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 13px; margin-bottom: 8px; color: #0f172a; }
    .module-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; margin-top: 8px; }
    .module-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 13px; }
    ul { margin: 6px 0 0; padding-inline-start: 20px; font-size: 12px; color: #334155; }
    footer { margin-top: 32px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 12px; color: #64748b; font-family: monospace; }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">${i(n.docRef)} · ASNT SNT-TC-1A &amp; EN ISO 9712</div>
    <h1>${i(r?`منهج التعلّم الذاتي للفحص غير الإتلافي والمعالجة الحرارية — أكاديمية إنسكو`:`INSCO NDT, PAUT/RT & PWHT Self-Study Syllabus`)}</h1>
    <div>${i(n.name[e])} — ${i(n.contacts.email)}</div>
  </header>
  <p>${r?`للتعلّم الذاتي فقط. لا يمثل هذا المنهج تدريبًا معتمدًا أو شهادة مهنية.`:`For self-study only. This syllabus is not accredited training or a professional credential.`}</p>
  <div class="stats">
    <span><strong>${o.disciplineCount}</strong> ${r?`تخصصات هندسية`:`Engineering Disciplines`}</span>
    <span>·</span>
    <span><strong>${o.levelCount}</strong> ${r?`مستويات دراسية (Level I–III)`:`Study Levels`}</span>
    <span>·</span>
    <span><strong>${o.moduleCount}</strong> ${r?`وحدة تدريبية`:`Course Modules`}</span>
    <span>·</span>
    <span><strong>${o.totalTrainingHours}h</strong> ${r?`ساعات الدراسة التقديرية`:`Estimated Study Hours`}</span>
  </div>
  ${l}
  <footer>
    ${i(n.name[e])} · ${i(n.contacts.headOffice[e])} · Tel: ${i(n.contacts.phones[0])}
  </footer>
</body>
</html>`,stats:o}}function s(e){let t=o(e);if(typeof document<`u`&&document.body){let e=``,n=!1;if(typeof Blob<`u`&&typeof URL<`u`&&typeof URL.createObjectURL==`function`){let r=new Blob([t.content],{type:t.mimeType});e=URL.createObjectURL(r),n=!0}else e=`data:${t.mimeType},${encodeURIComponent(t.content)}`;let r=document.createElement(`a`);r.href=e,r.download=t.filename,r.rel=`noopener`,r.className=`hidden`,document.body.appendChild(r),r.click(),document.body.removeChild(r),n&&typeof URL.revokeObjectURL==`function`&&window.setTimeout(()=>{URL.revokeObjectURL(e)},1500)}return t}export{a as n,r,s as t};