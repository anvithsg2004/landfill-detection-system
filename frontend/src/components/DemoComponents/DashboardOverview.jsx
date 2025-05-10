import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const DashboardOverview = () => {
    const [activeTab, setActiveTab] = useState('daily');
    const [chartData, setChartData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalScans: 0,
        detectionRate: 0,
        averageTime: 0,
        accuracy: 0
    });

    // Simulating data loading
    useEffect(() => {
        setIsLoading(true);

        const timer = setTimeout(() => {
            generateChartData(activeTab);
            setIsLoading(false);

            // Animate stats
            const interval = setInterval(() => {
                setStats(prev => ({
                    totalScans: prev.totalScans >= 1245 ? 1245 : prev.totalScans + 15,
                    detectionRate: prev.detectionRate >= 92.7 ? 92.7 : prev.detectionRate + 1.1,
                    averageTime: prev.averageTime >= 2.3 ? 2.3 : prev.averageTime + 0.1,
                    accuracy: prev.accuracy >= 97.5 ? 97.5 : prev.accuracy + 1.2
                }));
            }, 50);

            return () => clearInterval(interval);
        }, 800);

        return () => clearTimeout(timer);
    }, [activeTab]);

    const generateChartData = (period) => {
        let labels = [];
        let detectionData = [];
        let scanData = [];

        switch (period) {
            case 'daily':
                labels = ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'];
                detectionData = [15, 28, 45, 32, 38, 42, 30];
                scanData = [18, 32, 50, 39, 42, 48, 35];
                break;
            case 'weekly':
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                detectionData = [120, 145, 162, 138, 156, 98, 78];
                scanData = [135, 158, 175, 149, 172, 110, 85];
                break;
            case 'monthly':
                labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                detectionData = [580, 620, 750, 690, 840, 920];
                scanData = [650, 680, 820, 750, 910, 980];
                break;
            default:
                labels = ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'];
                detectionData = [15, 28, 45, 32, 38, 42, 30];
                scanData = [18, 32, 50, 39, 42, 48, 35];
        }

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Detections',
                    data: detectionData,
                    borderColor: '#0A84FF',
                    backgroundColor: 'rgba(10, 132, 255, 0.2)',
                    tension: 0.3,
                },
                {
                    label: 'Scans',
                    data: scanData,
                    borderColor: '#5E5CE6',
                    backgroundColor: 'rgba(94, 92, 230, 0.2)',
                    tension: 0.3,
                }
            ]
        });
    };

    return (
        <motion.div
            className="bg-white rounded-lg shadow-sm p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col"
                    whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    transition={{ duration: 0.2 }}
                >
                    <span className="text-gray-500 text-sm">Total Scans</span>
                    <span className="text-2xl font-semibold text-gray-800">{stats.totalScans.toLocaleString()}</span>
                    <span className="text-green-500 text-xs mt-1">↑ 12.5% from last week</span>
                </motion.div>

                <motion.div
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col"
                    whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    transition={{ duration: 0.2 }}
                >
                    <span className="text-gray-500 text-sm">Detection Rate</span>
                    <span className="text-2xl font-semibold text-gray-800">{stats.detectionRate.toFixed(1)}%</span>
                    <span className="text-green-500 text-xs mt-1">↑ 3.2% from last week</span>
                </motion.div>

                <motion.div
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col"
                    whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    transition={{ duration: 0.2 }}
                >
                    <span className="text-gray-500 text-sm">Avg. Processing Time</span>
                    <span className="text-2xl font-semibold text-gray-800">{stats.averageTime.toFixed(1)}s</span>
                    <span className="text-green-500 text-xs mt-1">↓ 0.4s from last week</span>
                </motion.div>

                <motion.div
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col"
                    whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    transition={{ duration: 0.2 }}
                >
                    <span className="text-gray-500 text-sm">Accuracy</span>
                    <span className="text-2xl font-semibold text-gray-800">{stats.accuracy.toFixed(1)}%</span>
                    <span className="text-green-500 text-xs mt-1">↑ 1.8% from last week</span>
                </motion.div>
            </div>

            {/* Chart Section */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Performance Overview</h3>
                    <div className="ml-auto space-x-2">
                        <button
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${activeTab === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            onClick={() => setActiveTab('daily')}
                        >
                            Daily
                        </button>
                        <button
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${activeTab === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            onClick={() => setActiveTab('weekly')}
                        >
                            Weekly
                        </button>
                        <button
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${activeTab === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            onClick={() => setActiveTab('monthly')}
                        >
                            Monthly
                        </button>
                    </div>
                </div>

                <div className="h-64 w-full">
                    {isLoading ? (
                        <div className="h-full w-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        chartData && <Line
                            data={chartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        titleColor: '#333',
                                        bodyColor: '#333',
                                        borderColor: '#ddd',
                                        borderWidth: 1,
                                        padding: 12,
                                        boxPadding: 6,
                                        usePointStyle: true,
                                    },
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: 'rgba(0, 0, 0, 0.05)',
                                        },
                                    },
                                    x: {
                                        grid: {
                                            display: false,
                                        },
                                    },
                                },
                                elements: {
                                    point: {
                                        radius: 4,
                                        hoverRadius: 6,
                                    },
                                    line: {
                                        borderWidth: 2,
                                    },
                                },
                                animation: {
                                    duration: 1000,
                                },
                            }}
                        />
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardOverview;