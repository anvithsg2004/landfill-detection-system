import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiDownload, FiShare2, FiPrinter } from 'react-icons/fi';

const DetailedAnalysisResults = ({ results }) => {
    const [expandedSections, setExpandedSections] = useState({
        performance: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Sample data
    const analysisData = {
        id: 'ANL-2025062',
        timestamp: 'June 10, 2025 - 14:32:45',
        status: 'Complete',
        performance: {
            detectionClass: 'Intrusion',
            location: { lat: 40.7128, lng: -74.0060 },
            area: '150 m²',
            confidence: '95%'
        }
    };

    return (
        <motion.div
            className="bg-white rounded-lg shadow-sm p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Detailed Analysis Results</h2>
                <div className="flex space-x-2">
                    <motion.button
                        className="p-2 text-gray-500 hover:text-[#303c54] hover:bg-[#303c54]/10 rounded-full transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FiDownload size={18} />
                    </motion.button>
                    <motion.button
                        className="p-2 text-gray-500 hover:text-[#303c54] hover:bg-[#303c54]/10 rounded-full transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FiShare2 size={18} />
                    </motion.button>
                    <motion.button
                        className="p-2 text-gray-500 hover:text-[#303c54] hover:bg-[#303c54]/10 rounded-full transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FiPrinter size={18} />
                    </motion.button>
                </div>
            </div>

            {/* Analysis Header */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-4">
                <div className="flex flex-wrap justify-between">
                    <div className="mb-2 md:mb-0">
                        <div className="text-sm text-gray-500">Analysis ID</div>
                        <div className="font-medium">{analysisData.id}</div>
                    </div>
                    <div className="mb-2 md:mb-0">
                        <div className="text-sm text-gray-500">Timestamp</div>
                        <div className="font-medium">{analysisData.timestamp}</div>
                    </div>
                    <div className="mb-2 md:mb-0">
                        <div className="text-sm text-gray-500">Status</div>
                        <div className="font-medium text-green-500">{analysisData.status}</div>
                    </div>
                </div>
            </div>

            {/* Performance Section */}
            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div
                    className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer"
                    onClick={() => toggleSection('performance')}
                >
                    <h3 className="font-medium text-gray-800">Performance Metrics</h3>
                    <motion.div
                        animate={{ rotate: expandedSections.performance ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <FiChevronDown size={20} className="text-gray-500" />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {expandedSections.performance && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-4 py-3 border-t border-gray-200"
                        >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-[#303c54]/10 rounded-lg p-3 text-center border border-[#303c54]/20">
                                    <div className="text-xs text-gray-500 mb-1">Detection Class</div>
                                    <div className="text-xl font-semibold text-[#303c54]">{analysisData.performance.detectionClass}</div>
                                </div>

                                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
                                    <div className="text-xs text-gray-500 mb-1">Location (Lat, Lng)</div>
                                    <div className="text-xl font-semibold text-green-500">{`${analysisData.performance.location.lat}, ${analysisData.performance.location.lng}`}</div>
                                </div>

                                <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-100">
                                    <div className="text-xs text-gray-500 mb-1">Area</div>
                                    <div className="text-xl font-semibold text-purple-500">{analysisData.performance.area}</div>
                                </div>

                                <div className="bg-teal-50 rounded-lg p-3 text-center border border-teal-100">
                                    <div className="text-xs text-gray-500 mb-1">Confidence</div>
                                    <div className="text-xl font-semibold text-teal-500">{analysisData.performance.confidence}</div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default DetailedAnalysisResults;
