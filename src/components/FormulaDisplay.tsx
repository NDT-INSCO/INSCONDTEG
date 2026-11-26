import React from 'react';

type Node = React.ReactNode;

function readGroup(source: string, start: number): [string, number] {
  if (source[start] !== '{') return [source[start] || '', start + 1];
  let depth = 1;
  let i = start + 1;
  for (; i < source.length && depth > 0; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
  }
  return [source.slice(start + 1, i - 1), i];
}

function renderLatex(source: string, keyPrefix = 'm'): Node[] {
  const out: Node[] = [];
  let text = '';
  const flush = () => { if (text) { out.push(text); text = ''; } };
  const greek: Record<string, string> = {
    lambda:'λ', theta:'θ', gamma:'γ', mu:'μ', sigma:'σ', phi:'ϕ', Phi:'Φ',
    Delta:'Δ', pi:'π', rho:'ρ', omega:'ω', Omega:'Ω', alpha:'α', beta:'β',
    epsilon:'ε', tau:'τ'
  };
  for (let i = 0; i < source.length;) {
    if (source[i] === '\\') {
      const match = source.slice(i + 1).match(/^[A-Za-z]+/);
      if (!match) { text += source[i + 1] || ''; i += 2; continue; }
      const command = match[0];
      i += command.length + 1;
      if (command === 'frac') {
        flush();
        const [numerator, afterNumerator] = readGroup(source, i); i = afterNumerator;
        const [denominator, afterDenominator] = readGroup(source, i); i = afterDenominator;
        out.push(<span className="insco-math-frac" key={keyPrefix + i}><span>{renderLatex(numerator, keyPrefix+'n'+i)}</span><span>{renderLatex(denominator, keyPrefix+'d'+i)}</span></span>);
      } else if (command === 'sqrt') {
        flush(); const [inside, end] = readGroup(source, i); i = end;
        out.push(<span className="insco-math-root" key={keyPrefix+i}>√<span>{renderLatex(inside,keyPrefix+'r'+i)}</span></span>);
      } else if (command === 'text' || command === 'mathrm') {
        const [inside, end] = readGroup(source, i); i = end; text += inside;
      } else if (command === 'quad' || command === 'qquad') {
        flush(); out.push(<span key={keyPrefix+i} className="insco-math-space">{command === 'quad' ? '　' : '　　'}</span>);
      } else if (command === 'cdot') text += ' · ';
      else if (command === 'times') text += ' × ';
      else if (command === 'le' || command === 'leq') text += ' ≤ ';
      else if (command === 'ge' || command === 'geq') text += ' ≥ ';
      else if (command === 'neq') text += ' ≠ ';
      else if (command === 'pm') text += ' ± ';
      else if (command === 'sin' || command === 'cos' || command === 'log' || command === 'min' || command === 'max') text += command;
      else if (greek[command]) text += greek[command];
      else if (command === 'left' || command === 'right' || command === 'displaystyle' || command === 'mathrm') { /* layout-only command */ }
      else text += command;
      continue;
    }
    if (source[i] === '^' || source[i] === '_') {
      flush(); const type = source[i++]; let value = '';
      if (source[i] === '{') { [value, i] = readGroup(source, i); }
      else value = source[i++] || '';
      out.push(type === '^'
        ? <sup key={keyPrefix+i}>{renderLatex(value,keyPrefix+'s'+i)}</sup>
        : <sub key={keyPrefix+i}>{renderLatex(value,keyPrefix+'b'+i)}</sub>);
      continue;
    }
    if (source[i] === '{' || source[i] === '}') { i++; continue; }
    if (source[i] === '&') { text += ' '; i++; continue; }
    text += source[i++];
  }
  flush();
  return out;
}

export const FormulaDisplay: React.FC<{ latex: string; className?: string }> = ({ latex, className = '' }) => (
  <div className={`insco-math-display ${className}`} dir="ltr" aria-label={latex}>
    {renderLatex(latex)}
  </div>
);
