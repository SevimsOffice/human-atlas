import { useTranslation } from 'react-i18next';

const LINKS = [
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/sevimsoffice/' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/sevimdurmus/' },
] as const;

/** Author credit with social links (new tab). */
export function PoweredBy({ testId = 'powered-by' }: { testId?: string }) {
  const { t } = useTranslation();
  return (
    <span className="whitespace-nowrap text-[11px] text-graphite-soft" data-testid={testId}>
      {t('credit.poweredBy')} <span className="text-graphite">Sevim Durmuş</span>
      {LINKS.map((l) => (
        <span key={l.id}>
          <span aria-hidden className="mx-1.5 text-line">·</span>
          <a href={l.href} target="_blank" rel="noopener noreferrer" data-testid={`${testId}-${l.id}`}
            className="underline decoration-line underline-offset-2 hover:text-graphite hover:decoration-graphite">{l.label}</a>
        </span>
      ))}
    </span>
  );
}
