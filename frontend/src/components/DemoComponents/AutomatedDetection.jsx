import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiClock, FiSearch, FiBarChart2 } from 'react-icons/fi';

const AutomatedDetection = ({ onDetectionComplete, images = [] }) => {
    const [detectionState, setDetectionState] = useState('idle'); // idle, running, complete, error
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Effect for handling images prop changes
    useEffect(() => {
        // Reset if no images
        if (images.length === 0 && detectionState !== 'idle') {
            setDetectionState('idle');
            setProgress(0);
            setResults(null);
        }

        // Highlight processed images readiness
        if (images.some(img => img.status === 'processed') && detectionState === 'idle') {
            // Visual indication that images are ready for detection could go here
        }
    }, [images, detectionState]);

    const startDetection = () => {
        if (detectionState === 'running') return;

        setDetectionState('running');
        setProgress(0);
        setResults(null);

        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + Math.random() * 5;
                if (next >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setDetectionState('complete');
                        const detectionResults = {
                            timeElapsed: '4.2s',
                            detectionCount: 3,
                            confidence: 97.8,
                            categories: [
                                { name: 'Suspicious Activity', confidence: 97.8, count: 2 },
                                { name: 'Potential Threat', confidence: 85.3, count: 1 },
                                { name: 'Normal Behavior', confidence: 12.4, count: 0 }
                            ],
                            regions: [
                                { id: 1, x: 32, y: 45, width: 120, height: 85, confidence: 97.8, label: 'Suspicious Activity' },
                                { id: 2, x: 215, y: 90, width: 85, height: 65, confidence: 95.2, label: 'Suspicious Activity' },
                                { id: 3, x: 352, y: 120, width: 110, height: 78, confidence: 85.3, label: 'Potential Threat' }
                            ]
                        };
                        setResults(detectionResults);

                        // Notify parent component
                        if (onDetectionComplete) {
                            onDetectionComplete(detectionResults);
                        }
                    }, 500);
                    return 100;
                }
                return next;
            });
        }, 80);
    };

    const resetDetection = () => {
        setDetectionState('idle');
        setProgress(0);
        setResults(null);
    };

    // Steps in the detection process
    const detectionSteps = [
        { name: 'Image Preprocessing', icon: <FiClock />, status: progress >= 25 ? 'complete' : progress > 0 ? 'current' : 'pending' },
        { name: 'Feature Extraction', icon: <FiSearch />, status: progress >= 50 ? 'complete' : progress >= 25 ? 'current' : 'pending' },
        { name: 'Model Inference', icon: <FiBarChart2 />, status: progress >= 75 ? 'complete' : progress >= 50 ? 'current' : 'pending' },
        { name: 'Results Analysis', icon: <FiCheckCircle />, status: progress >= 100 ? 'complete' : progress >= 75 ? 'current' : 'pending' }
    ];

    return (
        <motion.div
            className="bg-white rounded-lg shadow-sm p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <h2 className="text-xl font-semibold mb-4">Automated Detection</h2>

            {/* Main content area */}
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-5 mb-4">
                {detectionState === 'idle' && (
                    <div className="text-center py-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-500 mb-4">
                            <FiSearch size={32} />
                        </div>
                        <h3 className="text-xl font-medium text-gray-800 mb-3">Ready to Begin Detection</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            {images.length > 0
                                ? `${images.length} image${images.length !== 1 ? 's' : ''} ready for analysis.`
                                : 'The automated detection system is ready to analyze your images for any suspicious activities or anomalies.'}
                        </p>
                        <motion.button
                            className={`px-6 py-3 transition-colors font-medium rounded-lg ${images.length > 0
                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            whileHover={images.length > 0 ? { scale: 1.03 } : {}}
                            whileTap={images.length > 0 ? { scale: 0.98 } : {}}
                            onClick={images.length > 0 ? startDetection : undefined}
                            disabled={images.length === 0}
                        >
                            Start Detection
                        </motion.button>
                        {images.length === 0 && (
                            <p className="text-sm text-gray-500 mt-3">
                                Upload images first to enable detection
                            </p>
                        )}
                    </div>
                )}

                {detectionState === 'running' && (
                    <div className="py-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Detection in Progress</h3>

                        {/* Progress indicator */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                            <motion.div
                                className="bg-blue-500 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            ></motion.div>
                        </div>
                        <div className="text-right text-sm text-gray-500 mb-6">{Math.round(progress)}% Complete</div>

                        {/* Steps */}
                        <div className="max-w-2xl mx-auto">
                            <div className="flex items-center justify-between">
                                {detectionSteps.map((step, index) => (
                                    <React.Fragment key={step.name}>
                                        {/* Step icon */}
                                        <div className="flex flex-col items-center">
                                            <motion.div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center ${step.status === 'complete'
                                                    ? 'bg-green-100 text-green-500'
                                                    : step.status === 'current'
                                                        ? 'bg-blue-100 text-blue-500'
                                                        : 'bg-gray-100 text-gray-400'
                                                    }`}
                                                animate={step.status === 'current' ? { scale: [1, 1.1, 1] } : {}}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            >
                                                {step.icon}
                                            </motion.div>
                                            <span className={`text-xs mt-2 font-medium ${step.status === 'complete'
                                                ? 'text-green-500'
                                                : step.status === 'current'
                                                    ? 'text-blue-500'
                                                    : 'text-gray-400'
                                                }`}>
                                                {step.name}
                                            </span>
                                        </div>

                                        {/* Connecting line */}
                                        {index < detectionSteps.length - 1 && (
                                            <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                                                <motion.div
                                                    className="h-full bg-green-500"
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: step.status === 'complete' ? '100%' : step.status === 'current' ? `${(progress % 25) * 4}%` : '0%'
                                                    }}
                                                    transition={{ duration: 0.3 }}
                                                ></motion.div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {detectionState === 'complete' && results && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-500 flex items-center justify-center mr-3">
                                    <FiCheckCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800">Detection Complete</h3>
                                    <p className="text-sm text-gray-500">Time elapsed: {results.timeElapsed}</p>
                                </div>
                            </div>
                            <motion.button
                                className="px-4 py-2 border border-gray-300 hover:bg-gray-100 rounded-lg text-gray-600 text-sm font-medium transition-colors"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={resetDetection}
                            >
                                Run New Detection
                            </motion.button>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200 mb-4">
                            <div className="flex space-x-4">
                                <button
                                    className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'overview'
                                        ? 'text-blue-500 border-b-2 border-blue-500'
                                        : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    Overview
                                </button>
                                <button
                                    className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'regions'
                                        ? 'text-blue-500 border-b-2 border-blue-500'
                                        : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    onClick={() => setActiveTab('regions')}
                                >
                                    Detected Regions
                                </button>
                                <button
                                    className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'confidence'
                                        ? 'text-blue-500 border-b-2 border-blue-500'
                                        : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    onClick={() => setActiveTab('confidence')}
                                >
                                    Confidence Scores
                                </button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="py-2"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mr-4">
                                                <FiSearch size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Total Detections</p>
                                                <p className="text-2xl font-semibold">{results.detectionCount}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center">
                                            <div className="w-12 h-12 rounded-full bg-green-100 text-green-500 flex items-center justify-center mr-4">
                                                <FiCheckCircle size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Average Confidence</p>
                                                <p className="text-2xl font-semibold">{results.confidence}%</p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center">
                                            <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-500 flex items-center justify-center mr-4">
                                                <FiClock size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Processing Time</p>
                                                <p className="text-2xl font-semibold">{results.timeElapsed}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Detection Categories</h4>
                                    <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                                        {results.categories.map((category, index) => (
                                            <div key={category.name} className="p-4 flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-green-500'
                                                        }`}></div>
                                                    <span className="font-medium">{category.name}</span>
                                                </div>
                                                <div className="flex items-center space-x-6">
                                                    <div className="text-right">
                                                        <span className="text-sm text-gray-500">Confidence</span>
                                                        <p className="font-semibold">{category.confidence}%</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm text-gray-500">Count</span>
                                                        <p className="font-semibold">{category.count}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'regions' && (
                                <motion.div
                                    key="regions"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="py-2"
                                >
                                    <div className="relative bg-gray-200 rounded-lg overflow-hidden" style={{ height: '300px' }}>
                                        {/* If we have images, show the first one */}
                                        {images.length > 0 ? (
                                            <img
                                                src={images[0].url}
                                                alt="Detection source"
                                                className="w-full h-full object-cover opacity-75"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                                <p>Image with detected regions would appear here</p>
                                            </div>
                                        )}

                                        {/* Simulated detection regions */}
                                        {results.regions.map((region) => (
                                            <motion.div
                                                key={region.id}
                                                className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20 rounded-sm flex items-end justify-end"
                                                style={{
                                                    left: `${region.x}px`,
                                                    top: `${region.y}px`,
                                                    width: `${region.width}px`,
                                                    height: `${region.height}px`
                                                }}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3, delay: region.id * 0.1 }}
                                                whileHover={{
                                                    border: '2px solid #FF453A',
                                                    backgroundColor: 'rgba(255, 69, 58, 0.3)'
                                                }}
                                            >
                                                <div className="absolute -top-6 -right-1 bg-red-500 text-white text-xs rounded px-1 py-0.5 whitespace-nowrap">
                                                    {region.label} ({region.confidence}%)
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Detection Details</h4>
                                        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                                            {results.regions.map((region) => (
                                                <div key={region.id} className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${region.confidence > 95 ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'
                                                            }`}>
                                                            {region.id}
                                                        </div>
                                                        <span className="font-medium">{region.label}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm text-gray-500">Confidence</span>
                                                        <p className="font-semibold">{region.confidence}%</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'confidence' && (
                                <motion.div
                                    key="confidence"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="py-2"
                                >
                                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Confidence Score Distribution</h4>

                                        {/* Simulated confidence graph */}
                                        <div className="space-y-3">
                                            {results.categories.map((category, index) => (
                                                <div key={category.name}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium">{category.name}</span>
                                                        <span className="text-sm text-gray-500">{category.confidence}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <motion.div
                                                            className={`h-2 rounded-full ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-green-500'
                                                                }`}
                                                            style={{ width: '0%' }}
                                                            animate={{ width: `${category.confidence}%` }}
                                                            transition={{ duration: 1, delay: index * 0.2 }}
                                                        ></motion.div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Confidence Thresholds</h4>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">High Confidence (95%+)</span>
                                                    <span className="text-sm text-red-500 font-medium">Critical Alert</span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Detections with high confidence require immediate attention and verification. These typically indicate clear anomalies.
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">Medium Confidence (85-94%)</span>
                                                    <span className="text-sm text-orange-500 font-medium">Warning</span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Medium confidence detections should be investigated as they may represent potential issues.
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">Low Confidence (70-84%)</span>
                                                    <span className="text-sm text-yellow-500 font-medium">Watch</span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Low confidence detections might be false positives but should be monitored over time.
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">Very Low Confidence (&lt;70%)</span>
                                                    <span className="text-sm text-green-500 font-medium">No Action Required</span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Very low confidence detections are typically filtered out to reduce noise.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {detectionState === 'error' && (
                    <div className="text-center py-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                            <FiAlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-medium text-gray-800 mb-3">Detection Error</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            An error occurred during the detection process. Please try again or contact support if the issue persists.
                        </p>
                        <motion.button
                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={resetDetection}
                        >
                            Try Again
                        </motion.button>
                    </div>
                )}
            </div>

            <div className="text-sm text-gray-500">
                <p>The automated detection system uses advanced AI algorithms to identify patterns and anomalies in your images.</p>
            </div>
        </motion.div>
    );
};

export default AutomatedDetection;
