import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { CSVLink } from 'react-csv';
import { ChevronRight, MapPin, AlertTriangle, Image, Percent, Clock, Upload, Download } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval } from 'date-fns';

import StatisticCard from '../../components/UI/StatisticCard';
import ChartCard from '../../components/UI/ChartCard';
import { useAppContext } from '../../context/AppContext';
import { Detection } from '../../types';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const { history } = useAppContext();
  const navigate = useNavigate();

  // State for time period filtering
  const [timePeriod, setTimePeriod] = useState<'days' | 'weeks' | 'months' | 'years' | 'custom'>('months');
  const [periodCount, setPeriodCount] = useState<number>(6); // Default: Last 6 months
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Calculate metrics from history
  const totalDetections = history.reduce((sum, item) => sum + item.detectionCount, 0);

  const activeLandfills = history.reduce((sum, item) => {
    const activeDetections = item.detections?.filter((detection: Detection) =>
      detection.type.toLowerCase().includes('full')
    ).length || 0;
    return sum + activeDetections;
  }, 0);

  const imagesProcessed = history.filter((item) => item.status === 'complete').length;

  const averageConfidence =
    history.length > 0
      ? (history.reduce((sum, item) => sum + item.confidence, 0) / history.length) * 100
      : 0;

  // Define statistics based on calculated metrics
  const statistics = [
    {
      title: 'Total Detections',
      value: totalDetections,
      change: 12,
      trend: 'up' as const,
      icon: 'map-pin',
    },
    {
      title: 'Active Landfills',
      value: activeLandfills,
      change: 5,
      trend: 'up' as const,
      icon: 'alert-triangle',
    },
    {
      title: 'Images Processed',
      value: imagesProcessed,
      change: 8,
      trend: 'up' as const,
      icon: 'image',
    },
    {
      title: 'Average Confidence',
      value: `${averageConfidence.toFixed(0)}%`,
      change: 3,
      trend: 'up' as const,
      icon: 'percent',
    },
  ];

  // Calculate detections chart data based on the selected time period
  const now = new Date();
  let start: Date;
  let labels: string[] = [];
  let activeLandfillsData: number[] = [];
  let potentialSitesData: number[] = [];

  if (timePeriod === 'custom' && startDate && endDate) {
    // Custom date range
    start = startDate;
    const days = eachDayOfInterval({ start, end: endDate });
    labels = days.map((day) => format(day, 'MMM dd'));
    activeLandfillsData = new Array(days.length).fill(0);
    potentialSitesData = new Array(days.length).fill(0);

    history.forEach((item) => {
      const itemDate = new Date(item.dateProcessed);
      const dayIndex = days.findIndex((day) => format(day, 'yyyy-MM-dd') === format(itemDate, 'yyyy-MM-dd'));
      if (dayIndex !== -1) {
        const activeDetections = item.detections?.filter((detection: Detection) =>
          detection.type.toLowerCase().includes('full')
        ).length || 0;
        const potentialDetections = item.detections?.filter(
          (detection: Detection) => !detection.type.toLowerCase().includes('full')
        ).length || 0;
        activeLandfillsData[dayIndex] += activeDetections;
        potentialSitesData[dayIndex] += potentialDetections;
      }
    });
  } else {
    // Days, Weeks, Months, or Years
    let interval: Date[];
    if (timePeriod === 'days') {
      start = subDays(now, periodCount - 1);
      interval = eachDayOfInterval({ start, end: now });
      labels = interval.map((day) => format(day, 'MMM dd'));
    } else if (timePeriod === 'weeks') {
      start = subWeeks(now, periodCount - 1);
      interval = eachWeekOfInterval({ start, end: now });
      labels = interval.map((week) => format(week, 'MMM dd'));
    } else if (timePeriod === 'months') {
      start = subMonths(now, periodCount - 1);
      interval = eachMonthOfInterval({ start, end: now });
      labels = interval.map((month) => format(month, 'MMM'));
    } else {
      start = subYears(now, periodCount - 1);
      interval = eachYearOfInterval({ start, end: now });
      labels = interval.map((year) => format(year, 'yyyy'));
    }

    activeLandfillsData = new Array(interval.length).fill(0);
    potentialSitesData = new Array(interval.length).fill(0);

    history.forEach((item) => {
      const itemDate = new Date(item.dateProcessed);
      let index: number;

      if (timePeriod === 'days') {
        index = interval.findIndex((day) => format(day, 'yyyy-MM-dd') === format(itemDate, 'yyyy-MM-dd'));
      } else if (timePeriod === 'weeks') {
        index = interval.findIndex((week) => {
          const weekStart = format(week, 'yyyy-MM-dd');
          const weekEnd = format(addDays(week, 6), 'yyyy-MM-dd');
          const itemDay = format(itemDate, 'yyyy-MM-dd');
          return itemDay >= weekStart && itemDay <= weekEnd;
        });
      } else if (timePeriod === 'months') {
        index = interval.findIndex((month) => format(month, 'yyyy-MM') === format(itemDate, 'yyyy-MM'));
      } else {
        index = interval.findIndex((year) => format(year, 'yyyy') === format(itemDate, 'yyyy'));
      }

      if (index !== -1) {
        const activeDetections = item.detections?.filter((detection: Detection) =>
          detection.type.toLowerCase().includes('full')
        ).length || 0;
        const potentialDetections = item.detections?.filter(
          (detection: Detection) => !detection.type.toLowerCase().includes('full')
        ).length || 0;
        activeLandfillsData[index] += activeDetections;
        potentialSitesData[index] += potentialDetections;
      }
    });
  }

  const detectionChartData = {
    labels,
    datasets: [
      {
        label: 'Active Landfills',
        data: activeLandfillsData,
        backgroundColor: 'rgba(39, 174, 96, 0.5)',
        borderColor: 'rgba(39, 174, 96, 1)',
        borderWidth: 2,
      },
      {
        label: 'Potential Sites',
        data: potentialSitesData,
        backgroundColor: 'rgba(241, 196, 15, 0.5)',
        borderColor: 'rgba(241, 196, 15, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Calculate confidence distribution
  const confidenceBins = {
    '90-100%': 0,
    '80-90%': 0,
    '70-80%': 0,
    '60-70%': 0,
    '<60%': 0,
  };

  history.forEach((item) => {
    const confPercentage = item.confidence * 100;
    if (confPercentage >= 90) {
      confidenceBins['90-100%'] += item.detectionCount;
    } else if (confPercentage >= 80) {
      confidenceBins['80-90%'] += item.detectionCount;
    } else if (confPercentage >= 70) {
      confidenceBins['70-80%'] += item.detectionCount;
    } else if (confPercentage >= 60) {
      confidenceBins['60-70%'] += item.detectionCount;
    } else {
      confidenceBins['<60%'] += item.detectionCount;
    }
  });

  const confidenceChartData = {
    labels: Object.keys(confidenceBins),
    datasets: [
      {
        label: 'Detections',
        data: Object.values(confidenceBins),
        backgroundColor: [
          'rgba(39, 174, 96, 0.8)',
          'rgba(39, 174, 96, 0.6)',
          'rgba(241, 196, 15, 0.6)',
          'rgba(231, 76, 60, 0.6)',
          'rgba(231, 76, 60, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare CSV data for export
  const csvData = [
    ['Dashboard Statistics'],
    ['Metric', 'Value', 'Change', 'Trend'],
    ...statistics.map(stat => [
      stat.title,
      stat.value,
      stat.change || 0,
      stat.trend || 'neutral',
    ]),
    [],
    ['Detections by Period'],
    ['Period', 'Active Landfills', 'Potential Sites'],
    ...detectionChartData.labels.map((label, idx) => [
      label,
      detectionChartData.datasets[0].data[idx],
      detectionChartData.datasets[1].data[idx],
    ]),
    [],
    ['Confidence Distribution'],
    ['Range', 'Detections'],
    ...Object.entries(confidenceBins).map(([range, count]) => [range, count]),
  ];

  const detectionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} detections`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const periodLabel = detectionChartData.labels[index];
        // Navigate to the history page with a filter
        navigate(`/history?period=${periodLabel}`);
      }
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const recentDetections = history.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-500">Landfill Detection Dashboard</h1>
        <div className="flex items-center space-x-2">
          <CSVLink
            data={csvData}
            filename="landfill_detection_dashboard.csv"
            className="btn btn-outline flex items-center space-x-1.5 text-sm"
          >
            <Download size={18} className="mr-1.5" />
            Export Dashboard
          </CSVLink>
          <button
            onClick={() => navigate('/upload')}
            className="btn btn-primary flex items-center"
          >
            <Upload size={18} className="mr-1.5" />
            Upload New Images
          </button>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticCard
          statistic={statistics[0]}
          icon={<MapPin size={24} className="text-primary-500" />}
        />
        <StatisticCard
          statistic={statistics[1]}
          icon={<AlertTriangle size={24} className="text-accent-500" />}
        />
        <StatisticCard
          statistic={statistics[2]}
          icon={<Image size={24} className="text-secondary-500" />}
        />
        <StatisticCard
          statistic={statistics[3]}
          icon={<Percent size={24} className="text-primary-500" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="Detections by Period"
          subtitle={
            timePeriod === 'custom' && startDate && endDate
              ? `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`
              : `Last ${periodCount} ${timePeriod}`
          }
          className="lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <select
                value={timePeriod}
                onChange={(e) => {
                  setTimePeriod(e.target.value as 'days' | 'weeks' | 'months' | 'years' | 'custom');
                  setStartDate(null);
                  setEndDate(null);
                }}
                className="p-2 border border-neutral-300 rounded-md text-sm"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
                <option value="custom">Custom Range</option>
              </select>
              {timePeriod !== 'custom' ? (
                <input
                  type="number"
                  value={periodCount}
                  onChange={(e) => setPeriodCount(Number(e.target.value))}
                  min={1}
                  className="w-20 p-2 border border-neutral-300 rounded-md text-sm"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Start Date"
                    className="p-2 border border-neutral-300 rounded-md text-sm"
                  />
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate ?? undefined}
                    placeholderText="End Date"
                    className="p-2 border border-neutral-300 rounded-md text-sm"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="h-72">
            <Line
              options={detectionChartOptions}
              data={detectionChartData}
            />
          </div>
        </ChartCard>

        <ChartCard
          title="Confidence Distribution"
          subtitle="By percentage range"
        >
          <div className="h-72 flex items-center justify-center">
            <Doughnut
              options={pieChartOptions}
              data={confidenceChartData}
            />
          </div>
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary-500">Recent Activity</h2>
          <button
            onClick={() => navigate('/history')}
            className="text-primary-500 hover:text-primary-600 text-sm flex items-center"
          >
            View All <ChevronRight size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {recentDetections.map((item) => (
            <div
              key={item.id}
              className="p-3 border border-neutral-200 rounded-md hover:bg-neutral-50 cursor-pointer transition-colors flex items-center justify-between"
              onClick={() => navigate(`/analysis/${item.id}`)}
            >
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-primary-50 mr-3">
                  <Clock size={18} className="text-primary-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">{item.fileName}</h3>
                  <p className="text-xs text-neutral-500">
                    {new Date(item.dateProcessed).toLocaleString()} • {item.detectionCount} detections
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-primary-500 mr-2">
                  {(item.confidence * 100).toFixed(0)}%
                </span>
                <ChevronRight size={16} className="text-neutral-400" />
              </div>
            </div>
          ))}

          {recentDetections.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-neutral-500">No recent activity</p>
              <button
                onClick={() => navigate('/upload')}
                className="mt-2 text-primary-500 hover:text-primary-600"
              >
                Upload your first image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;