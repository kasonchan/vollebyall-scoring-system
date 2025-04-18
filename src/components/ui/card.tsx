// src/components/ui/card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
}

interface CardContentProps {
  children: React.ReactNode;
}

export function Card({ children }: CardProps) {
  return (
    <div className="rounded-xl border shadow-md p-4 bg-white">
      {children}
    </div>
  );
}

export function CardContent({ children }: CardContentProps) {
  return (
    <div className="p-2">
      {children}
    </div>
  );
}
