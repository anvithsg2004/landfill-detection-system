import { ReactNode } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { StatisticItem } from '../../types';

interface StatisticCardProps {
  statistic: StatisticItem;
  icon: ReactNode;
}

const StatisticCard = ({ statistic, icon }: StatisticCardProps) => {
  const { title, value, change = 0, trend = 'neutral' } = statistic;

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUp size={14} className="text-success" />;
    if (trend === 'down') return <ArrowDown size={14} className="text-error" />;
    return <Minus size={14} className="text-neutral-400" />;
  };

  const getTrendTextColor = () => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-error';
    return 'text-neutral-400';
  };

  return (
    <div className="card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-primary-50">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center space-x-1">
        {getTrendIcon()}
        <span className={`text-sm font-medium ${getTrendTextColor()}`}>
          {change > 0 ? `+${change}` : change}%
        </span>
        <span className="text-sm text-neutral-500 ml-1">from last month</span>
      </div>
    </div>
  );
};

export default StatisticCard;