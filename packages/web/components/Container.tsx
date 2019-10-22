import React, { ReactNode } from 'react';

export const Container = ({ children }: { children: ReactNode }) => {
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
};
