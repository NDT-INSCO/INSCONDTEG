//#region src/utils/publicUrl.ts
/**
* Absolute URL for a file shipped in `public/`.
*
* GitHub Pages serves this app from a sub-path (`/INSCONDTEG/`), so a
* root-relative string such as `/images/hero.jpg` resolves to
* `https://ndt-insco.github.io/images/hero.jpg` and 404s. Everything that
* points at a `public/` file has to go through the Vite base instead:
*
*     publicUrl('images/hero.jpg')  →  /INSCONDTEG/images/hero.jpg
*
* During `vite build` the base is baked in; outside the bundler (tests, plain
* node) it falls back to `/`, which is what the dev server and jsdom expect.
*/
function publicUrl(relative) {
	const base = "/INSCONDTEG/";
	return `${base.endsWith("/") ? base : `${base}/`}${relative.replace(/^\/+/, "")}`;
}
//#endregion
export { publicUrl as t };
