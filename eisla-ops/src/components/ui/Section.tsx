interface SectionProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function Section({ title, actions, children }: SectionProps) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm border border-light">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-teal">{title}</h2>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
