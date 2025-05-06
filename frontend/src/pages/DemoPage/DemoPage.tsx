import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppContext } from '../../context/AppContext';
import { Detection } from '../../types';
import {
    LayoutDashboard,
    Upload,
    BarChart2,
    Clock,
    FileText,
    MapPin,
} from 'lucide-react';

interface DemoDetection extends Detection {
    image: string;
}

const DemoPage = () => {
    const { setCurrentPage, resetProcessingState, setProcessingStatus, processingStatus } = useAppContext();
    const [demoResults, setDemoResults] = useState<DemoDetection[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        setCurrentPage('/demo');
        resetProcessingState();

        return () => {
            setCurrentPage('');
        };
    }, []);

    const staticDemoData = {
        detections: [
            {
                id: "demo1",
                type: "FULL container",
                confidence: 0.95,
                location: { lat: 40.7128, lng: -74.0060 },
                area: 150.5,
                dateDetected: new Date().toISOString(),
                boundingBox: {
                    topLeft: { lat: 40.7128, lng: -74.0060 },
                    bottomRight: { lat: 40.7130, lng: -74.0058 },
                },
                segmentation: [],
                image: "demo-image-1.jpg",
            },
            {
                id: "demo2",
                type: "PARTIAL container",
                confidence: 0.82,
                location: { lat: 40.7140, lng: -74.0070 },
                area: 75.2,
                dateDetected: new Date().toISOString(),
                boundingBox: {
                    topLeft: { lat: 40.7140, lng: -74.0070 },
                    bottomRight: { lat: 40.7142, lng: -74.0068 },
                },
                segmentation: [],
                image: "demo-image-2.jpg",
            },
        ],
    };

    const handleDemoAnalysis = async () => {
        setProcessingStatus('processing');
        setError(null);
        setDemoResults([]);

        try {
            const demoData = staticDemoData;

            if (demoData.detections.length === 0) {
                setError('No demo data available.');
                toast.error('No demo data available.', {
                    position: 'top-right',
                    autoClose: 3000,
                });
                setProcessingStatus('error');
                return;
            }

            const detections: DemoDetection[] = demoData.detections.map((det: any) => ({
                id: det.id || Date.now().toString(),
                type: det.type,
                confidence: det.confidence,
                location: {
                    lat: det.location.lat,
                    lng: det.location.lng,
                },
                area: det.area,
                dateDetected: det.dateDetected || new Date().toISOString(),
                boundingBox: det.boundingBox,
                segmentation: det.segmentation || [],
                image: det.image,
            }));

            setDemoResults(detections);
            setProcessingStatus('complete');
            setShowResults(true);
            toast.success('Demo analysis completed successfully!', {
                position: 'top-right',
                autoClose: 3000,
            });

            // Scroll to results section
            document.getElementById('demo-results')?.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            setError('Failed to run demo analysis. Please try again.');
            toast.error('Failed to run demo analysis.', {
                position: 'top-right',
                autoClose: 3000,
            });
            setProcessingStatus('error');
        }
    };

    const features = [
        {
            title: "Dashboard Overview",
            description: "View a comprehensive overview of your landfill detection activities, including recent detections, key metrics, and actionable insights.",
            icon: <LayoutDashboard size={24} className="text-primary-500" />,
            mockup: (
                <div className="bg-gray-100 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                        <div className="w-1/2 h-16 bg-primary-200 rounded"></div>
                        <div className="w-1/3 h-16 bg-primary-200 rounded"></div>
                    </div>
                    <div className="h-24 bg-primary-100 rounded flex items-center justify-center">
                        <span className="text-neutral-500 text-sm">Recent Detections Chart</span>
                    </div>
                </div>
            ),
        },
        {
            title: "Image Upload",
            description: "Upload satellite or drone imagery effortlessly to initiate landfill detection. Supports multiple formats with a user-friendly interface.",
            icon: <Upload size={24} className="text-primary-500" />,
            mockup: (
                <div className="bg-gray-100 p-4 rounded-md">
                    <div className="border-2 border-dashed border-primary-300 rounded-md h-24 flex items-center justify-center mb-2">
                        <span className="text-neutral-500 text-sm">Drag & Drop Images Here</span>
                    </div>
                    <div className="flex space-x-2">
                        <div className="w-16 h-16 bg-primary-200 rounded"></div>
                        <div className="w-16 h-16 bg-primary-200 rounded"></div>
                    </div>
                </div>
            ),
        },
        {
            title: "Automated Detection",
            description: "Leverage our advanced AI model to automatically detect landfill containers with high accuracy, saving time and resources.",
            icon: <FileText size={24} className="text-primary-500" />,
            mockup: (
                <div className="bg-gray-100 p-4 rounded-md">
                    <div className="h-24 bg-primary-100 rounded mb-2 flex items-center justify-center">
                        <span className="text-neutral-500 text-sm">Image with Highlighted Detections</span>
                    </div>
                    <div className="w-full h-4 bg-primary-200 rounded">
                        <div className="w-2/3 h-full bg-primary-500 rounded animate-pulse"></div>
                    </div>
                </div>
            ),
        },
        {
            title: "Detailed Analysis Results",
            description: "Access detailed detection results, including confidence scores, geographic coordinates, and area measurements, presented in an intuitive format.",
            icon: <MapPin size={24} className="text-primary-500" />,
            mockup: (
                <div className="bg-gray-100 p-4 rounded-md">
                    <div className="h-24 bg-primary-100 rounded mb-2 flex items-center justify-center">
                        <span className="text-neutral-500 text-sm">Map with Detection Pins</span>
                    </div>
                    <div className="text-sm text-neutral-600">
                        <p>Container Type: FULL</p>
                        <p>Confidence: 95%</p>
                        <p>Area: 150.5 m²</p>
                    </div>
                </div>
            ),
        },
        {
            title: "Detection History",
            description: "Track all past detections in a comprehensive history log, allowing you to analyze trends and changes over time.",
            icon: <Clock size={24} className="text-primary-500" />,
            mockup: (
                <div className="bg-gray-100 p-4 rounded-md">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            <span className="text-neutral-600 text-sm">May 06, 2025 - FULL Container</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            <span className="text-neutral-600 text-sm">May 05, 2025 - PARTIAL Container</span>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "Real-Time Analysis",
            description: "Monitor landfill sites in real-time, receiving live updates and insights to support timely decision-making.",
            icon: <BarChart2 size={24} className="text-primary-500" />,
            mockup: (
                <div className="bg-gray-100 p-4 rounded-md">
                    <div className="h-24 bg-primary-100 rounded mb-2 flex items-center justify-center">
                        <span className="text-neutral-500 text-sm">Live Map with Real-Time Updates</span>
                    </div>
                    <div className="text-sm text-neutral-600">Last Update: Just Now</div>
                </div>
            ),
        },
    ];

    return (
        <div className="h-full flex flex-col p-6 overflow-y-auto">
            <h1 className="text-2xl font-semibold text-primary-500 mb-8 text-center">
                Discover All Features of LandfillDetect
            </h1>

            <div className="space-y-12">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="p-6 bg-primary-50 rounded-md shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col md:flex-row items-start md:items-center gap-6"
                    >
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                                {feature.icon}
                                <h2 className="text-xl font-semibold text-primary-500">{feature.title}</h2>
                            </div>
                            <p className="text-neutral-600 mb-4">{feature.description}</p>
                        </div>
                        <div className="w-full md:w-1/3">{feature.mockup}</div>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex flex-col items-center">
                <h2 className="text-xl font-semibold text-primary-500 mb-4">
                    Ready to See It in Action?
                </h2>
                <button
                    onClick={handleDemoAnalysis}
                    className="btn btn-primary flex items-center space-x-1.5 text-sm px-6 py-2 hover:bg-primary-600 transition-colors duration-200"
                    disabled={processingStatus === 'processing'}
                >
                    {processingStatus === 'processing' ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <span>Start Demo Analysis</span>
                    )}
                </button>
            </div>

            {error && (
                <div className="mt-6 p-4 bg-error/10 text-error rounded-md text-center">{error}</div>
            )}

            {showResults && demoResults.length > 0 && (
                <div id="demo-results" className="mt-12">
                    <h2 className="text-xl font-semibold text-primary-500 mb-4">Demo Analysis Results</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-primary-50">
                                <th className="p-3 text-left text-sm font-semibold text-primary-500 border-b border-neutral-200">
                                    Image
                                </th>
                                <th className="p-3 text-left text-sm font-semibold text-primary-500 border-b border-neutral-200">
                                    Detection Class
                                </th>
                                <th className="p-3 text-left text-sm font-semibold text-primary-500 border-b border-neutral-200">
                                    Location (Lat, Lng)
                                </th>
                                <th className="p-3 text-left text-sm font-semibold text-primary-500 border-b border-neutral-200">
                                    Area (m²)
                                </th>
                                <th className="p-3 text-left text-sm font-semibold text-primary-500 border-b border-neutral-200">
                                    Confidence
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {demoResults.map((result, index) => (
                                <tr key={index} className="border-b border-neutral-200 hover:bg-primary-100 transition-colors duration-200">
                                    <td className="p-3 text-neutral-600">{result.image}</td>
                                    <td className="p-3 text-neutral-600">{result.type}</td>
                                    <td className="p-3 text-neutral-600">
                                        ({result.location.lat.toFixed(2)}, {result.location.lng.toFixed(2)})
                                    </td>
                                    <td className="p-3 text-neutral-600">{result.area.toFixed(2)}</td>
                                    <td className="p-3 text-neutral-600">{(result.confidence * 100).toFixed(0)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DemoPage;