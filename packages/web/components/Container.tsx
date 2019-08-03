import React, { ReactNode } from 'react';

export function Container({ children }: { children: ReactNode }) {
  return (
    <div>
      {children}
      <style jsx>{`
        div {
          margin: 16px;
        }
      `}</style>
    </div>
  );
}
