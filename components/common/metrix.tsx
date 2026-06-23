
export const MetricCard = ({ 
  label, 
  value, 
  icon, 
  trend, 
  color,
  isCurrency = false 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  trend: string; 
  color: string;
  isCurrency?: boolean; 
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 hover:shadow-lg transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20`}>
        {icon}
      </div>
      <span className={`text-sm font-medium text-${color}-600 dark:text-${color}-400`}>
        {trend}
      </span>
    </div>
    <div className="mt-4">
      <h4 className="text-2xl font-bold text-gray-800 dark:text-white">
        {isCurrency ? `$${value.toLocaleString()}` : value.toLocaleString()}
      </h4>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {label}
      </p>
    </div>
  </div>
);