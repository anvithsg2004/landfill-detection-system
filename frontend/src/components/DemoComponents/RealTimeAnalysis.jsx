import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiCheckCircle, FiPause, FiPlay, FiSettings, FiBell, FiX } from 'react-icons/fi';

const RealTimeAnalysis = () => {
    const [isMonitoring, setIsMonitoring] = useState(true);
    const [events, setEvents] = useState([]);
    const [alertCount, setAlertCount] = useState(0);
    const [metrics, setMetrics] = useState({
        cpu: 0,
        memory: 0,
        network: 0,
        responseTime: 0
    });
    const [showNotification, setShowNotification] = useState(false);
    const [notificationData, setNotificationData] = useState(null);
    const [activeSection, setActiveSection] = useState('overview');

    const eventsRef = useRef(null);

    // Initialize monitoring
    useEffect(() => {
        if (!isMonitoring) return;

        // Simulate real-time metrics update
        const metricsInterval = setInterval(() => {
            setMetrics({
                cpu: Math.min(100, Math.max(10, metrics.cpu + (Math.random() * 10 - 5))),
                memory: Math.min(100, Math.max(20, metrics.memory + (Math.random() * 8 - 4))),
                network: Math.min(100, Math.max(5, metrics.network + (Math.random() * 12 - 6))),
                responseTime: Math.min(500, Math.max(50, metrics.responseTime + (Math.random() * 40 - 20)))
            });
        }, 2000);

        // Simulate events coming in
        const eventsInterval = setInterval(() => {
            const eventTypes = [
                { type: 'info', message: 'System scan completed', source: 'Scanner' },
                { type: 'info', message: 'Configuration updated', source: 'Admin' },
                { type: 'info', message: 'Backup completed successfully', source: 'Backup' },
                { type: 'warning', message: 'High memory usage detected', source: 'Monitor' },
                { type: 'warning', message: 'Failed login attempt', source: 'Auth' },
                { type: 'warning', message: 'Slow database query detected', source: 'Database' },
                { type: 'error', message: 'Network connection lost', source: 'Network' },
                { type: 'error', message: 'API endpoint unreachable', source: 'API' },
                { type: 'error', message: 'Suspicious activity detected', source: 'Security' }
            ];

            // Higher probability of info events, lower for warnings and errors
            const randomNum = Math.random();
            let typeIndex;

            if (randomNum < 0.7) {
                typeIndex = Math.floor(Math.random() * 3); // Info events (0-2)
            } else if (randomNum < 0.9) {
                typeIndex = 3 + Math.floor(Math.random() * 3); // Warning events (3-5)
            } else {
                typeIndex = 6 + Math.floor(Math.random() * 3); // Error events (6-8)
            }

            const newEvent = {
                id: `evt-${Date.now()}`,
                timestamp: new Date(),
                ...eventTypes[typeIndex]
            };

            setEvents(prev => [newEvent, ...prev].slice(0, 100));

            // Show notification for warning and error events
            if (newEvent.type !== 'info') {
                setAlertCount(prev => prev + 1);
                setNotificationData(newEvent);
                setShowNotification(true);

                // Auto-hide notification after 4 seconds
                setTimeout(() => {
                    setShowNotification(false);
                }, 4000);
            }

        }, Math.floor(Math.random() * 4000) + 3000);

        return () => {
            clearInterval(metricsInterval);
            clearInterval(eventsInterval);
        };
    }, [isMonitoring, metrics]);

    // Auto-scroll to newest events
    useEffect(() => {
        if (eventsRef.current && events.length > 0 && isMonitoring) {
            eventsRef.current.scrollTop = 0;
        }
    }, [events, isMonitoring]);

    const toggleMonitoring = () => {
        setIsMonitoring(!isMonitoring);
    };

    const dismissNotification = () => {
        setShowNotification(false);
    };

    const clearAlerts = () => {
        setAlertCount(0);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getStatusIcon = (status) => {
        if (status > 80) return 'bg-red-500';
        if (status > 60) return 'bg-orange-500';
        if (status > 40) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getEventIcon = (type) => {
        switch (type) {
            case 'error':
                return <FiAlertTriangle className="text-red-500" />;
            case 'warning':
                return <FiAlertTriangle className="text-yellow-500" />;
            default:
                return <FiCheckCircle className="text-green-500" />;
        }
    };

    const getEventClass = (type) => {
        switch (type) {
            case 'error':
                return 'bg-red-50 border-red-200 text-red-700';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 text-yellow-700';
            default:
                return 'bg-green-50 border-green-200 text-green-700';
        }
    };

    return (
        <motion.div
            className="bg-white rounded-lg shadow-sm p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Real-Time Analysis</h2>
                <div className="flex items-center space-x-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                        onClick={clearAlerts}
                    >
                        <FiBell size={20} className="text-gray-500" />
                        {alertCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                {alertCount > 9 ? '9+' : alertCount}
                            </span>
                        )}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FiSettings size={20} className="text-gray-500" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-2 rounded-full ${isMonitoring ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                        onClick={toggleMonitoring}
                    >
                        {isMonitoring ? <FiPause size={16} /> : <FiPlay size={16} />}
                    </motion.button>
                </div>
            </div>

            {/* Status indicator */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4 flex items-center">
                <div className={`h-3 w-3 rounded-full mr-2 ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="font-medium text-gray-800">
                    {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                    {isMonitoring ? 'Real-time data is being analyzed' : 'Analysis has been temporarily paused'}
                </span>
            </div>

            {/* Section Tabs */}
            <div className="mb-4 border-b border-gray-200">
                <div className="flex space-x-6">
                    <button
                        className={`py-2 px-1 text-sm font-medium border-b-2 ${activeSection === 'overview'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveSection('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`py-2 px-1 text-sm font-medium border-b-2 ${activeSection === 'events'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveSection('events')}
                    >
                        Event Log
                    </button>
                    <button
                        className={`py-2 px-1 text-sm font-medium border-b-2 ${activeSection === 'performance'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveSection('performance')}
                    >
                        Performance
                    </button>
                </div>
            </div>

            {/* Section Content */}
            <div>
                <AnimatePresence mode="wait">
                    {activeSection === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {/* System Status */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">System Status</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                                                <span className="text-sm font-medium text-gray-700">{Math.round(metrics.cpu)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <motion.div
                                                    className={`h-2 rounded-full ${getStatusIcon(metrics.cpu)}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${metrics.cpu}%` }}
                                                    transition={{ duration: 1 }}
                                                ></motion.div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">Memory</span>
                                                <span className="text-sm font-medium text-gray-700">{Math.round(metrics.memory)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <motion.div
                                                    className={`h-2 rounded-full ${getStatusIcon(metrics.memory)}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${metrics.memory}%` }}
                                                    transition={{ duration: 1 }}
                                                ></motion.div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">Network</span>
                                                <span className="text-sm font-medium text-gray-700">{Math.round(metrics.network)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <motion.div
                                                    className={`h-2 rounded-full ${getStatusIcon(metrics.network)}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${metrics.network}%` }}
                                                    transition={{ duration: 1 }}
                                                ></motion.div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">Response Time</span>
                                                <span className="text-sm font-medium text-gray-700">{Math.round(metrics.responseTime)}ms</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <motion.div
                                                    className={`h-2 rounded-full ${getStatusIcon(metrics.responseTime / 5)}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${metrics.responseTime / 5}%` }}
                                                    transition={{ duration: 1 }}
                                                ></motion.div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Alerts */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Alerts</h3>

                                    <div className="space-y-3 max-h-[230px] overflow-y-auto">
                                        {events
                                            .filter(event => event.type !== 'info')
                                            .slice(0, 5)
                                            .map(event => (
                                                <motion.div
                                                    key={event.id}
                                                    className={`p-2 rounded-lg border flex items-start ${event.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                                                        }`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <div className="h-6 w-6 flex-shrink-0 flex items-center justify-center mr-2 mt-0.5">
                                                        {getEventIcon(event.type)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">{event.message}</div>
                                                        <div className="text-xs text-gray-500 flex mt-1">
                                                            <span className="mr-2">{event.source}</span>
                                                            <span>{formatTime(event.timestamp)}</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}

                                        {events.filter(event => event.type !== 'info').length === 0 && (
                                            <div className="text-center py-4 text-gray-500">
                                                <p>No alerts detected</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Active Sessions */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Active Sessions</h3>

                                <div className="overflow-hidden overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">admin@example.com</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">192.168.1.45</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">New York, US</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">2h 15m</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">user1@example.com</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">192.168.1.32</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">London, UK</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">45m</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">user2@example.com</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">192.168.1.87</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">Tokyo, JP</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">5m</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Idle</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'events' && (
                        <motion.div
                            key="events"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            ref={eventsRef}
                            className="max-h-[500px] overflow-y-auto"
                        >
                            <div className="space-y-2">
                                {events.length > 0 ? (
                                    events.map(event => (
                                        <motion.div
                                            key={event.id}
                                            className={`p-3 rounded-lg border ${getEventClass(event.type)}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="flex items-start">
                                                <div className="mt-0.5 mr-3">
                                                    {getEventIcon(event.type)}
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">{event.message}</span>
                                                        <span className="text-xs">{formatTime(event.timestamp)}</span>
                                                    </div>
                                                    <div className="text-sm mt-1">Source: {event.source}</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500">
                                        <p>No events recorded yet</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'performance' && (
                        <motion.div
                            key="performance"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">System Performance Metrics</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-500">CPU</span>
                                            <span className={`text-sm font-medium ${metrics.cpu > 80 ? 'text-red-600' :
                                                metrics.cpu > 60 ? 'text-orange-600' :
                                                    'text-green-600'
                                                }`}>
                                                {Math.round(metrics.cpu)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                            <motion.div
                                                className={`h-2.5 rounded-full ${getStatusIcon(metrics.cpu)}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${metrics.cpu}%` }}
                                                transition={{ duration: 1 }}
                                            ></motion.div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {metrics.cpu > 80 ? 'Critical' :
                                                metrics.cpu > 60 ? 'High' :
                                                    metrics.cpu > 40 ? 'Moderate' : 'Normal'} usage
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-500">Memory</span>
                                            <span className={`text-sm font-medium ${metrics.memory > 80 ? 'text-red-600' :
                                                metrics.memory > 60 ? 'text-orange-600' :
                                                    'text-green-600'
                                                }`}>
                                                {Math.round(metrics.memory)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                            <motion.div
                                                className={`h-2.5 rounded-full ${getStatusIcon(metrics.memory)}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${metrics.memory}%` }}
                                                transition={{ duration: 1 }}
                                            ></motion.div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {metrics.memory > 80 ? 'Critical' :
                                                metrics.memory > 60 ? 'High' :
                                                    metrics.memory > 40 ? 'Moderate' : 'Normal'} usage
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-500">Network</span>
                                            <span className={`text-sm font-medium ${metrics.network > 80 ? 'text-red-600' :
                                                metrics.network > 60 ? 'text-orange-600' :
                                                    'text-green-600'
                                                }`}>
                                                {Math.round(metrics.network)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                            <motion.div
                                                className={`h-2.5 rounded-full ${getStatusIcon(metrics.network)}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${metrics.network}%` }}
                                                transition={{ duration: 1 }}
                                            ></motion.div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {metrics.network > 80 ? 'Critical' :
                                                metrics.network > 60 ? 'High' :
                                                    metrics.network > 40 ? 'Moderate' : 'Normal'} usage
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-500">Response Time</span>
                                            <span className={`text-sm font-medium ${metrics.responseTime > 400 ? 'text-red-600' :
                                                metrics.responseTime > 300 ? 'text-orange-600' :
                                                    'text-green-600'
                                                }`}>
                                                {Math.round(metrics.responseTime)}ms
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                            <motion.div
                                                className={`h-2.5 rounded-full ${getStatusIcon(metrics.responseTime / 5)}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${metrics.responseTime / 5}%` }}
                                                transition={{ duration: 1 }}
                                            ></motion.div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {metrics.responseTime > 400 ? 'Slow' :
                                                metrics.responseTime > 300 ? 'Moderate' :
                                                    'Fast'} response
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Process Monitor</h3>

                                <div className="overflow-hidden overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PID</th>
                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU</th>
                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory</th>
                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">security-service</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">1234</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">32%</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">512 MB</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Running</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">db-connector</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">1235</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">15%</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">256 MB</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Running</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">api-server</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">1236</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">28%</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">384 MB</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Running</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">web-server</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">1237</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">18%</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">192 MB</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Running</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">backup-service</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">1238</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">0%</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">64 MB</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Idle</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Notification pop-up */}
            <AnimatePresence>
                {showNotification && notificationData && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        transition={{ duration: 0.3 }}
                        className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg flex items-center z-50 max-w-md w-full ${notificationData.type === 'error' ? 'bg-red-100 border border-red-200' : 'bg-yellow-100 border border-yellow-200'
                            }`}
                    >
                        <div className="mr-3 flex-shrink-0">
                            {notificationData.type === 'error' ?
                                <FiAlertTriangle size={20} className="text-red-500" /> :
                                <FiAlertTriangle size={20} className="text-yellow-500" />
                            }
                        </div>
                        <div className="flex-grow">
                            <p className={`text-sm font-medium ${notificationData.type === 'error' ? 'text-red-800' : 'text-yellow-800'}`}>
                                {notificationData.message}
                            </p>
                            <p className="text-xs mt-0.5 text-gray-600">{notificationData.source} • {formatTime(notificationData.timestamp)}</p>
                        </div>
                        <button
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            onClick={dismissNotification}
                        >
                            <FiX size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default RealTimeAnalysis;