import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiChevronDown, FiChevronUp, FiInfo, FiCheck, FiX, FiAlertTriangle, FiSettings, FiRefreshCw } from 'react-icons/fi';

// Import components
import DashboardOverview from '../../components/DemoComponents/DashboardOverview';
import ImageUpload from '../../components/DemoComponents/ImageUpload';
import AutomatedDetection from '../../components/DemoComponents/AutomatedDetection';
import DetailedAnalysisResults from '../../components/DemoComponents/DetailedAnalysisResults';
import DetectionHistory from '../../components/DemoComponents/DetectionHistory';
import RealTimeAnalysis from '../../components/DemoComponents/RealTimeAnalysis';

const DemoPage = () => {
    // Main state
    const [activeComponent, setActiveComponent] = useState(null);
    const [demoMode, setDemoMode] = useState(false);
    const [demoStep, setDemoStep] = useState(0);
    const [expandedSections, setExpandedSections] = useState({
        dashboard: true,
        upload: false,
        detection: false,
        analysis: false,
        history: false,
        realtime: false
    });
    const [completedSteps, setCompletedSteps] = useState([]);
    const [showDemoCompleteDialog, setShowDemoCompleteDialog] = useState(false);

    // Refs for scrolling
    const sectionRefs = {
        dashboard: useRef(null),
        upload: useRef(null),
        detection: useRef(null),
        analysis: useRef(null),
        history: useRef(null),
        realtime: useRef(null)
    };

    // Shared state between components
    const [uploadedImages, setUploadedImages] = useState([]);
    const [detectionResults, setDetectionResults] = useState(null);
    const [analysisComplete, setAnalysisComplete] = useState(false);

    // Demo guide content
    const demoSteps = [
        {
            title: "Overview Dashboard",
            description: "Start by exploring the dashboard to understand current security metrics and trends.",
            section: "dashboard",
            action: "Examine the dashboard metrics and charts to understand the security posture.",
            component: "dashboard"
        },
        {
            title: "Upload Security Images",
            description: "Upload images for security analysis. This is where the scanning process begins.",
            section: "upload",
            action: "Drag and drop or select images to upload for analysis.",
            component: "upload"
        },
        {
            title: "Run Automated Detection",
            description: "Process the uploaded images through the automated threat detection system.",
            section: "detection",
            action: "Click 'Start Detection' to analyze the uploaded images for security threats.",
            component: "detection"
        },
        {
            title: "Review Analysis Results",
            description: "Examine the detailed analysis of detected threats and vulnerabilities.",
            section: "analysis",
            action: "Explore the different tabs to understand all aspects of the security analysis.",
            component: "analysis"
        },
        {
            title: "Check Detection History",
            description: "Review past detection events and their outcomes to track security over time.",
            section: "history",
            action: "Filter and search through the detection history to identify patterns.",
            component: "history"
        },
        {
            title: "Monitor Real-Time Analysis",
            description: "Watch the real-time security monitoring system detect and respond to threats.",
            section: "realtime",
            action: "Observe the real-time data and notifications as they come in.",
            component: "realtime"
        }
    ];

    // Start guided demo
    const startDemo = () => {
        setDemoMode(true);
        setDemoStep(0);
        setCompletedSteps([]);
        setExpandedSections({
            dashboard: true,
            upload: false,
            detection: false,
            analysis: false,
            history: false,
            realtime: false
        });
        setActiveComponent('dashboard');

        setTimeout(() => {
            sectionRefs.dashboard.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Next demo step
    const nextDemoStep = () => {
        const nextStep = demoStep + 1;

        if (nextStep < demoSteps.length) {
            setDemoStep(nextStep);
            setCompletedSteps([...completedSteps, demoStep]);

            const nextSection = demoSteps[nextStep].section;
            setExpandedSections(prev => ({
                ...prev,
                [nextSection]: true
            }));
            setActiveComponent(demoSteps[nextStep].component);

            setTimeout(() => {
                sectionRefs[nextSection].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            setCompletedSteps([...completedSteps, demoStep]);
            setShowDemoCompleteDialog(true);
        }
    };

    // Previous demo step
    const prevDemoStep = () => {
        if (demoStep > 0) {
            const prevStep = demoStep - 1;
            setDemoStep(prevStep);

            const prevSection = demoSteps[prevStep].section;
            setActiveComponent(demoSteps[prevStep].component);

            setTimeout(() => {
                sectionRefs[prevSection].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    // Handle section toggle
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));

        if (!expandedSections[section]) {
            setActiveComponent(section);

            setTimeout(() => {
                sectionRefs[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    // Complete demo
    const completeDemo = () => {
        setDemoMode(false);
        setShowDemoCompleteDialog(false);

        setExpandedSections({
            dashboard: true,
            upload: true,
            detection: true,
            analysis: true,
            history: true,
            realtime: true
        });
    };

    // Mock functions for integrated demo flow
    const handleImageUpload = (images) => {
        setUploadedImages(images);

        if (demoMode && demoStep === 1 && images.length > 0) {
            setTimeout(() => {
                nextDemoStep();
            }, 1500);
        }
    };

    const handleDetectionComplete = (results) => {
        setDetectionResults(results);
        setAnalysisComplete(true);

        if (demoMode && demoStep === 2) {
            setTimeout(() => {
                nextDemoStep();
            }, 1500);
        }
    };

    const EnhancedImageUpload = () => {
        return <ImageUpload onImagesUploaded={handleImageUpload} />;
    };

    const EnhancedAutomatedDetection = () => {
        return <AutomatedDetection onDetectionComplete={handleDetectionComplete} images={uploadedImages} />;
    };

    return (
        <div className="min-h-screen pb-12">
            {/* Demo Header */}
            <div className="bg-white py-6 px-6 md:px-8 border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl md:text-3xl font-semibold mb-2 text-gray-900">Security Analysis Platform</h1>
                    <p className="text-gray-500 mb-4">An interactive demonstration of our security analysis capabilities</p>

                    {!demoMode ? (
                        <motion.button
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 transition-colors flex items-center font-medium"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={startDemo}
                        >
                            <span>Try Guided Demo</span>
                            <FiArrowRight className="ml-2" />
                        </motion.button>
                    ) : (
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <div className="flex items-center text-sm">
                                <div className="flex-shrink-0 mr-4 hidden md:block">
                                    <span className="font-medium text-gray-700">Guided Demo:</span> Step {demoStep + 1} of {demoSteps.length}
                                </div>
                                <div className="flex-grow">
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                            style={{ width: `${((demoStep + 1) / demoSteps.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="flex space-x-2 ml-4">
                                    <button
                                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={prevDemoStep}
                                        disabled={demoStep === 0}
                                    >
                                        Previous
                                    </button>
                                    {demoStep < demoSteps.length - 1 ? (
                                        <button
                                            className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
                                            onClick={nextDemoStep}
                                        >
                                            Next
                                        </button>
                                    ) : (
                                        <button
                                            className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
                                            onClick={nextDemoStep}
                                        >
                                            Complete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Demo Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
                {/* Current Demo Step Guide */}
                {demoMode && (
                    <motion.div
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 relative z-10"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-blue-50 rounded-full p-2 mr-4">
                                <FiInfo size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-medium text-gray-900 mb-1">{demoSteps[demoStep].title}</h2>
                                <p className="text-gray-500 mb-2">{demoSteps[demoStep].description}</p>
                                <div className="bg-blue-50 p-3 rounded-md text-sm text-gray-700 flex items-center">
                                    <FiArrowRight className="mr-2 flex-shrink-0 text-blue-500" />
                                    <span><strong>Try this:</strong> {demoSteps[demoStep].action}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Demo Complete Dialog */}
                <AnimatePresence>
                    {showDemoCompleteDialog && (
                        <motion.div
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: 'spring', damping: 20 }}
                            >
                                <div className="text-center mb-4">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-4">
                                        <FiCheck size={32} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900">Demo Complete!</h3>
                                    <p className="text-gray-500 mt-2">
                                        You've successfully completed the guided demo. Now you can explore all features freely!
                                    </p>
                                </div>

                                <div className="border-t border-gray-200 pt-4 mt-4">
                                    <div className="flex flex-col sm:flex-row-reverse space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
                                        <button
                                            className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                                            onClick={completeDemo}
                                        >
                                            Continue Exploring
                                        </button>
                                        <button
                                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                            onClick={startDemo}
                                        >
                                            Restart Demo
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Components */}
                <div className="mt-8">
                    {/* Dashboard Overview */}
                    <div className="mb-6" ref={sectionRefs.dashboard}>
                        <div
                            className={`bg-white rounded-lg shadow-sm overflow-hidden border ${expandedSections.dashboard ? 'border-gray-200' : 'border-gray-200'}`}
                        >
                            <div
                                className={`flex items-center justify-between px-6 py-4 cursor-pointer ${expandedSections.dashboard ? 'bg-gray-50' : 'bg-white'}`}
                                onClick={() => toggleSection('dashboard')}
                            >
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${expandedSections.dashboard ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                                        {completedSteps.includes(0) ? (
                                            <FiCheck size={18} className="text-green-500" />
                                        ) : (
                                            <span className="text-sm font-medium">1</span>
                                        )}
                                    </div>
                                    <h2 className={`text-lg font-medium ${expandedSections.dashboard ? 'text-gray-900' : 'text-gray-700'}`}>
                                        Dashboard Overview
                                    </h2>
                                </div>
                                <div className={expandedSections.dashboard ? 'text-gray-500' : 'text-gray-400'}>
                                    {expandedSections.dashboard ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedSections.dashboard && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <DashboardOverview />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="mb-6" ref={sectionRefs.upload}>
                        <div
                            className={`bg-white rounded-lg shadow-sm overflow-hidden border ${expandedSections.upload ? 'border-gray-200' : 'border-gray-200'}`}
                        >
                            <div
                                className={`flex items-center justify-between px-6 py-4 cursor-pointer ${expandedSections.upload ? 'bg-gray-50' : 'bg-white'}`}
                                onClick={() => toggleSection('upload')}
                            >
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${expandedSections.upload ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                                        {completedSteps.includes(1) ? (
                                            <FiCheck size={18} className="text-green-500" />
                                        ) : (
                                            <span className="text-sm font-medium">2</span>
                                        )}
                                    </div>
                                    <h2 className={`text-lg font-medium ${expandedSections.upload ? 'text-gray-900' : 'text-gray-700'}`}>
                                        Image Upload
                                    </h2>

                                    {uploadedImages.length > 0 && !expandedSections.upload && (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                            {uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''} ready
                                        </span>
                                    )}
                                </div>
                                <div className={expandedSections.upload ? 'text-gray-500' : 'text-gray-400'}>
                                    {expandedSections.upload ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedSections.upload && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <EnhancedImageUpload />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Automated Detection */}
                    <div className="mb-6" ref={sectionRefs.detection}>
                        <div
                            className={`bg-white rounded-lg shadow-sm overflow-hidden border ${expandedSections.detection ? 'border-gray-200' : 'border-gray-200'}`}
                        >
                            <div
                                className={`flex items-center justify-between px-6 py-4 cursor-pointer ${expandedSections.detection ? 'bg-gray-50' : 'bg-white'}`}
                                onClick={() => toggleSection('detection')}
                            >
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${expandedSections.detection ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                                        {completedSteps.includes(2) ? (
                                            <FiCheck size={18} className="text-green-500" />
                                        ) : (
                                            <span className="text-sm font-medium">3</span>
                                        )}
                                    </div>
                                    <h2 className={`text-lg font-medium ${expandedSections.detection ? 'text-gray-900' : 'text-gray-700'}`}>
                                        Automated Detection
                                    </h2>

                                    {uploadedImages.length > 0 && !expandedSections.detection && (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                            {uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''} ready
                                        </span>
                                    )}
                                </div>
                                <div className={expandedSections.detection ? 'text-gray-500' : 'text-gray-400'}>
                                    {expandedSections.detection ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedSections.detection && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <EnhancedAutomatedDetection />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Detailed Analysis Results */}
                    <div className="mb-6" ref={sectionRefs.analysis}>
                        <div
                            className={`bg-white rounded-lg shadow-sm overflow-hidden border ${expandedSections.analysis ? 'border-gray-200' : 'border-gray-200'}`}
                        >
                            <div
                                className={`flex items-center justify-between px-6 py-4 cursor-pointer ${expandedSections.analysis ? 'bg-gray-50' : 'bg-white'}`}
                                onClick={() => toggleSection('analysis')}
                            >
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${expandedSections.analysis ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                                        {completedSteps.includes(3) ? (
                                            <FiCheck size={18} className="text-green-500" />
                                        ) : (
                                            <span className="text-sm font-medium">4</span>
                                        )}
                                    </div>
                                    <h2 className={`text-lg font-medium ${expandedSections.analysis ? 'text-gray-900' : 'text-gray-700'}`}>
                                        Detailed Analysis Results
                                    </h2>

                                    {analysisComplete && !expandedSections.analysis && (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                            Results ready
                                        </span>
                                    )}
                                </div>
                                <div className={expandedSections.analysis ? 'text-gray-500' : 'text-gray-400'}>
                                    {expandedSections.analysis ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedSections.analysis && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <DetailedAnalysisResults results={detectionResults} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Detection History */}
                    <div className="mb-6" ref={sectionRefs.history}>
                        <div
                            className={`bg-white rounded-lg shadow-sm overflow-hidden border ${expandedSections.history ? 'border-gray-200' : 'border-gray-200'}`}
                        >
                            <div
                                className={`flex items-center justify-between px-6 py-4 cursor-pointer ${expandedSections.history ? 'bg-gray-50' : 'bg-white'}`}
                                onClick={() => toggleSection('history')}
                            >
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${expandedSections.history ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                                        {completedSteps.includes(4) ? (
                                            <FiCheck size={18} className="text-green-500" />
                                        ) : (
                                            <span className="text-sm font-medium">5</span>
                                        )}
                                    </div>
                                    <h2 className={`text-lg font-medium ${expandedSections.history ? 'text-gray-900' : 'text-gray-700'}`}>
                                        Detection History
                                    </h2>
                                </div>
                                <div className={expandedSections.history ? 'text-gray-500' : 'text-gray-400'}>
                                    {expandedSections.history ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedSections.history && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <DetectionHistory />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Real-Time Analysis */}
                    <div className="mb-6" ref={sectionRefs.realtime}>
                        <div
                            className={`bg-white rounded-lg shadow-sm overflow-hidden border ${expandedSections.realtime ? 'border-gray-200' : 'border-gray-200'}`}
                        >
                            <div
                                className={`flex items-center justify-between px-6 py-4 cursor-pointer ${expandedSections.realtime ? 'bg-gray-50' : 'bg-white'}`}
                                onClick={() => toggleSection('realtime')}
                            >
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${expandedSections.realtime ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                                        {completedSteps.includes(5) ? (
                                            <FiCheck size={18} className="text-green-500" />
                                        ) : (
                                            <span className="text-sm font-medium">6</span>
                                        )}
                                    </div>
                                    <h2 className={`text-lg font-medium ${expandedSections.realtime ? 'text-gray-900' : 'text-gray-700'}`}>
                                        Real-Time Analysis
                                    </h2>
                                </div>
                                <div className={expandedSections.realtime ? 'text-gray-500' : 'text-gray-400'}>
                                    {expandedSections.realtime ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedSections.realtime && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <RealTimeAnalysis />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Floating action buttons */}
                <div className="fixed bottom-6 right-6 flex flex-col space-y-2">
                    {!demoMode && (
                        <motion.button
                            className="bg-gray-100 text-gray-600 p-3 rounded-full shadow-sm hover:bg-gray-200 focus:outline-none"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={startDemo}
                        >
                            <FiRefreshCw size={20} />
                        </motion.button>
                    )}
                    <motion.button
                        className="bg-gray-100 text-gray-600 p-3 rounded-full shadow-sm hover:bg-gray-200 focus:outline-none"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <FiSettings size={20} />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default DemoPage;