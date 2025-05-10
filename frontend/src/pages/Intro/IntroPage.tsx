import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GanttChart, ArrowRight } from 'lucide-react';

const IntroPage: React.FC = () => {
    const navigate = useNavigate();

    const handleTryNow = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
            <header className="container mx-auto px-6 py-8">
                <div className="flex items-center">
                    <GanttChart className="h-8 w-8 text-primary-500" />
                    <span className="ml-2 text-xl font-semibold text-primary-500">LandfillDetect</span>
                </div>
            </header>

            <main className="flex-grow flex flex-col md:flex-row items-center justify-center px-6 py-12">
                <div className="w-full md:w-1/2 md:pr-12 mb-12 md:mb-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-500 leading-tight mb-6">
                            Detect Environmental Changes with Precision
                        </h1>
                        <p className="text-lg md:text-xl text-neutral-700 mb-8 max-w-2xl">
                            Our cutting-edge AI technology helps identify and monitor landfills and environmental changes using satellite imagery, providing actionable insights for better environmental management.
                        </p>
                        <motion.button
                            className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-4 rounded-lg text-lg font-medium inline-flex items-center transition-colors duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleTryNow}
                        >
                            Try Now
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </motion.button>
                    </motion.div>
                </div>

                <motion.div
                    className="w-full md:w-1/2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="relative rounded-lg overflow-hidden shadow-xl">
                        <img
                            src="https://images.pexels.com/photos/1192774/pexels-photo-1192774.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                            alt="Satellite imagery of Earth"
                            className="w-full h-auto"
                        />
                        <div className="absolute inset-0 bg-primary-500 bg-opacity-20"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-primary-900 to-transparent">
                            <p className="text-white text-sm md:text-base">Advanced satellite imagery analysis for environmental monitoring</p>
                        </div>
                    </div>
                </motion.div>
            </main>

            <footer className="container mx-auto px-6 py-8 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:justify-between items-center">
                    <p className="text-neutral-600 mb-4 md:mb-0">
                        &copy; {new Date().getFullYear()} LandfillDetect. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <a href="#" className="text-neutral-600 hover:text-primary-500 transition-colors">About</a>
                        <a href="#" className="text-neutral-600 hover:text-primary-500 transition-colors">Features</a>
                        <a href="#" className="text-neutral-600 hover:text-primary-500 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default IntroPage;
