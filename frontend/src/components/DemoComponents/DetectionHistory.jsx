import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiDownload } from 'react-icons/fi';

const DetectionHistory = () => {
    const [detections, setDetections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState({
        timeframe: 'all',
        status: 'all'
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'dateProcessed', direction: 'desc' });

    const toggleFilter = () => setIsFilterOpen(!isFilterOpen);

    // Generate mock detection data
    useEffect(() => {
        const mockStatuses = ['Completed', 'Processing', 'Failed'];

        const generateRandomDate = () => {
            const start = new Date(2025, 0, 1);
            const end = new Date();
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        };

        const mockData = Array.from({ length: 20 }, (_, i) => ({
            id: `DET-${(1000 + i).toString()}`,
            fileName: `analysis_${i + 1}.log`,
            dateProcessed: generateRandomDate(),
            detections: Math.floor(Math.random() * 10),
            confidence: `${(Math.random() * (100 - 80) + 80).toFixed(2)}%`,
            status: mockStatuses[Math.floor(Math.random() * mockStatuses.length)],
        }));

        // Sort by dateProcessed (newest first)
        mockData.sort((a, b) => b.dateProcessed - a.dateProcessed);

        setTimeout(() => {
            setDetections(mockData);
            setLoading(false);
        }, 1200);
    }, []);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'Processing':
                return 'bg-blue-100 text-blue-800';
            case 'Failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleFilterChange = (filterType, value) => {
        setActiveFilters({
            ...activeFilters,
            [filterType]: value
        });
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />;
    };

    const filteredDetections = detections.filter(detection => {
        // Filter by search query
        if (searchQuery && !detection.fileName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !detection.id.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        // Filter by timeframe
        if (activeFilters.timeframe !== 'all') {
            const today = new Date();
            const detectionDate = new Date(detection.dateProcessed);

            if (activeFilters.timeframe === 'today') {
                if (detectionDate.toDateString() !== today.toDateString()) {
                    return false;
                }
            } else if (activeFilters.timeframe === 'week') {
                const weekAgo = new Date();
                weekAgo.setDate(today.getDate() - 7);
                if (detectionDate < weekAgo) {
                    return false;
                }
            } else if (activeFilters.timeframe === 'month') {
                const monthAgo = new Date();
                monthAgo.setMonth(today.getMonth() - 1);
                if (detectionDate < monthAgo) {
                    return false;
                }
            }
        }

        // Filter by status
        if (activeFilters.status !== 'all' && detection.status !== activeFilters.status) {
            return false;
        }

        return true;
    }).sort((a, b) => {
        if (sortConfig.key === 'dateProcessed') {
            return sortConfig.direction === 'asc'
                ? new Date(a.dateProcessed) - new Date(b.dateProcessed)
                : new Date(b.dateProcessed) - a.dateProcessed;
        }

        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    return (
        <motion.div
            className="bg-white rounded-lg shadow-sm p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <h2 className="text-xl font-semibold mb-4">Detection History</h2>

            {/* Control bar */}
            <div className="mb-4">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    {/* Search */}
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search detections..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter button */}
                    <div className="flex-shrink-0">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={toggleFilter}
                            className={`flex items-center px-4 py-2 border font-medium rounded-md text-sm ${Object.values(activeFilters).some(val => val !== 'all')
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <FiFilter className="mr-2" />
                            Filter
                            <FiChevronDown className={`ml-1 transition-transform ${isFilterOpen ? 'transform rotate-180' : ''}`} />
                        </motion.button>
                    </div>

                    {/* Export */}
                    <div className="flex-shrink-0">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 font-medium rounded-md text-sm hover:bg-gray-50"
                        >
                            <FiDownload className="mr-2" />
                            Export
                        </motion.button>
                    </div>
                </div>

                {/* Filter panel */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-2 p-4 border border-gray-200 rounded-md bg-gray-50"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Timeframe filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
                                    <select
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        value={activeFilters.timeframe}
                                        onChange={(e) => handleFilterChange('timeframe', e.target.value)}
                                    >
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">Last 7 Days</option>
                                        <option value="month">Last 30 Days</option>
                                    </select>
                                </div>

                                {/* Status filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        value={activeFilters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Failed">Failed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                                    onClick={() => setActiveFilters({ timeframe: 'all', status: 'all' })}
                                >
                                    Reset Filters
                                </button>
                                <button
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none"
                                    onClick={toggleFilter}
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Applied filters */}
                {Object.values(activeFilters).some(val => val !== 'all') && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-500">Active filters:</span>

                        {activeFilters.timeframe !== 'all' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {activeFilters.timeframe === 'today' ? 'Today' :
                                    activeFilters.timeframe === 'week' ? 'Last 7 days' : 'Last 30 days'}
                                <button
                                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:text-blue-500 focus:outline-none"
                                    onClick={() => handleFilterChange('timeframe', 'all')}
                                >
                                    <span className="sr-only">Remove filter</span>
                                    <svg className="h-2.5 w-2.5" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                        <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {activeFilters.status !== 'all' && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activeFilters.status)}`}>
                                {activeFilters.status}
                                <button
                                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:text-blue-500 focus:outline-none"
                                    onClick={() => handleFilterChange('status', 'all')}
                                >
                                    <span className="sr-only">Remove filter</span>
                                    <svg className="h-2.5 w-2.5" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                        <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                    </svg>
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Detections list */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg">
                {loading ? (
                    <div className="p-8 flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue- OLS500"></div>
                    </div>
                ) : filteredDetections.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">No detections found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('fileName')}
                                    >
                                        <div className="flex items-center">
                                            File Name {getSortIcon('fileName')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('dateProcessed')}
                                    >
                                        <div className="flex items-center">
                                            Date Processed {getSortIcon('dateProcessed')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('detections')}
                                    >
                                        <div className="flex items-center">
                                            Detections {getSortIcon('detections')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('confidence')}
                                    >
                                        <div className="flex items-center">
                                            Confidence {getSortIcon('confidence')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center">
                                            Status {getSortIcon('status')}
                                        </div>
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredDetections.map((detection) => (
                                    <motion.tr
                                        key={detection.id}
                                        whileHover={{ backgroundColor: '#f9fafb' }}
                                        className="cursor-pointer"
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {detection.fileName}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(detection.dateProcessed)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {detection.detections}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {detection.confidence}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(detection.status)}`}>
                                                {detection.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-blue-600 hover:text-blue-900">
                                                View
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default DetectionHistory;
