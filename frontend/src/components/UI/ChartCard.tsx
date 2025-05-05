import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  subtitle?: string;
  className?: string;
  actions?: ReactNode;
}

const ChartCard = ({ title, subtitle, children, className = '', actions }: ChartCardProps) => {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-primary-500">{title}</h3>
          {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      <div className="w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;