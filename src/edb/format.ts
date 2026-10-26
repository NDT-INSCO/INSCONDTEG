/**
 * Bilingual text helpers shared by the EDB reader and the EPUB builder.
 *
 * `formatFormula` renders the lightweight formula notation used in the book
 * data as readable Unicode. It is deliberately not TeX: the sources are short
 * engineering expressions, and a full TeX engine would add weight without
 * improving legibility.
 */

const SYMBOLS: Record<string, string> = {
  '\\lambda': 'λ',
  '\\theta': 'θ',
  '\\rho': 'ρ',
  '\\mu': 'μ',
  '\\pi': 'π',
  '\\Delta': 'Δ',
  '\\delta': 'δ',
  '\\gamma': 'γ',
  '\\infty': '∞',
  '\\times': '×',
  '\\cdot': '·',
  '\\sqrt': '√',
  '\\approx': '≈',
  '\\le': '≤',
  '\\ge': '≥',
  '\\pm': '±',
  '\\%': '%',
  '\\,': ' ',
  '\\left': '',
  '\\right': '',
};

export function formatFormula(expression: string): string {
  let output = expression;
  // LaTeX-ish text wrappers and spacing carry no meaning on screen.
  output = output.replace(/\\text\{([^{}]*)\}/g, '$1');
  output = output.replace(/\\mathrm\{([^{}]*)\}/g, '$1');
  output = output.replace(/\\operatorname\{([^{}]*)\}/g, '$1');
  output = output.replace(/\\quad|\\qquad/g, '  ');
  output = output.replace(/\\[,;:!]/g, ' ');
  Object.entries(SYMBOLS).forEach(([from, to]) => {
    output = output.split(from).join(to);
  });
  output = output.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  output = output.replace(/\^\{([^{}]+)\}/g, '^($1)');
  output = output.replace(/_\{([^{}]+)\}/g, '_($1)');
  output = output.replace(/\\([a-zA-Z]+)/g, '$1');
  return output.replace(/\s+/g, ' ').trim();
}
