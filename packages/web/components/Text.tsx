import React from 'react';

export function Text({
  children,
  size = 0,
}: {
  children: string;
  size?: number;
}) {
  const baseFontSize = 16;
  const baseLineHeight = 24;
  // https://www.modularscale.com/
  const modularScale = 4 / 3;

  // Compute modular fontSize.
  const fontSize = baseFontSize * modularScale ** size;

  // http://inlehmansterms.net/2014/06/09/groove-to-a-vertical-rhythm
  function computeRhythmLineHeight() {
    const lines = Math.ceil(fontSize / baseLineHeight);
    return lines * baseLineHeight;
  }
  const lineHeight = computeRhythmLineHeight();

  return (
    <>
      <div>{children}</div>
      <style jsx>{`
        div {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
            'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
            'Helvetica Neue', sans-serif;
          color: #333;
          font-size: ${fontSize}px;
          line-height: ${lineHeight}px;
          margin-bottom: ${baseLineHeight}px;
        }
      `}</style>
    </>
  );
}
