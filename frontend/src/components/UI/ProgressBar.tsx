interface ProgressBarProps {
  progress: number;
  height?: string;
  className?: string;
}

const ProgressBar = ({ progress, height = 'h-2', className = '' }: ProgressBarProps) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`w-full bg-neutral-200 rounded-full overflow-hidden ${height} ${className}`}>
      <div 
        className="bg-secondary-500 h-full transition-all duration-500 ease-out"
        style={{ width: `${clampedProgress}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;