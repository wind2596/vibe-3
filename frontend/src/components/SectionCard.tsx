import type { ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="section-card">
      <header className="section-card__header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
