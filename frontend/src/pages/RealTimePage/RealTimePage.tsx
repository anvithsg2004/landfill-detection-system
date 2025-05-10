import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import ImageViewer from '../../components/Analysis/ImageViewer';
import DetectionList from '../../components/Analysis/DetectionList';
import { ProcessedImage, Detection } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface ImageEntry {
    id: string;
    filename: string;
    processed_at: string;
    detection_count: number;
    source: 'uploaded' | 'realtime';
}

const RealTimePage = () => {
    const {
        setCurrentPage,
        isRealTimeAnalysisRunning,
        startRealTimeAnalysis,
        processedImages,
        processingStatus,
        user,
        isUserLoading,
    } = useAppContext();
    const navigate = useNavigate();
    const [imageList, setImageList] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [classes, setClasses] = useState<string[]>([]);
    const [currentSessionImages, setCurrentSessionImages] = useState<ProcessedImage[]>([]);

    // Generate random API key on mount
    useEffect(() => {
        const newApiKey = uuidv4();
        setApiKey(newApiKey);
    }, []);

    // Handle unauthorized events
    useEffect(() => {
        const handleUnauthorized = () => {
            console.log('Unauthorized event detected, redirecting to login from RealTimePage');
            navigate('/login');
        };

        window.addEventListener('unauthorized', handleUnauthorized);
        return () => {
            window.removeEventListener('unauthorized', handleUnauthorized);
        };
    }, [navigate]);

    // Set the current page
    useEffect(() => {
        setCurrentPage('/realtime');
        return () => {
            setCurrentPage('');
        };
    }, [setCurrentPage]);

    // Start real-time analysis with the random API key
    useEffect(() => {
        if (!apiKey) return;

        const startAnalysis = async () => {
            try {
                const response = await axios.get('http://localhost:5000/realtime-status', {
                    withCredentials: true,
                });
                if (!response.data.isRunning) {
                    await axios.post(
                        'http://localhost:5000/realtime',
                        { apiKey },
                        { withCredentials: true }
                    );
                    startRealTimeAnalysis(); // Update context
                    console.log('Real-time analysis started with API key:', apiKey);
                }
            } catch (err) {
                setError('Failed to start real-time analysis.');
                console.error('Error starting real-time analysis:', err);
                toast.error('Failed to start real-time analysis.', {
                    position: 'top-right',
                    autoClose: 3000,
                });
            }
        };

        startAnalysis();
    }, [apiKey, startRealTimeAnalysis]);

    // Update the fetchImageList function
    const fetchImageList = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5000/images-list', {
                withCredentials: true,
            });

            // Fetch details for each image in the list
            const imagesWithDetails = await Promise.all(
                response.data.images.map(async (filename: string) => {
                    try {
                        const imagesResponse = await axios.get('http://localhost:5000/images', {
                            withCredentials: true,
                        });
                        const imageEntry = imagesResponse.data.find(
                            (img: ImageEntry) => img.filename === filename && img.source === 'realtime'
                        );

                        if (!imageEntry) return null;

                        const detailsResponse = await axios.get(
                            `http://localhost:5000/realtime-images/${imageEntry.id}`,
                            { withCredentials: true }
                        );

                        const imageDetails = detailsResponse.data;
                        const detectionConfidences = imageDetails.detections.map((d: Detection) => d.confidence);
                        const avgConfidence = detectionConfidences.length > 0
                            ? detectionConfidences.reduce((sum, conf) => sum + conf, 0) / detectionConfidences.length
                            : 0;

                        return {
                            id: imageDetails.id,
                            fileName: imageDetails.filename,
                            originalUrl: imageDetails.original_url,
                            processedUrl: imageDetails.annotated_url,
                            detections: imageDetails.detections,
                            dateProcessed: imageDetails.processed_at,
                            confidence: avgConfidence,
                        };
                    } catch (error) {
                        console.error('Error fetching image details:', error);
                        return null;
                    }
                })
            );

            setCurrentSessionImages(imagesWithDetails.filter(Boolean) as ProcessedImage[]);
            setImageList(response.data.images);
        } catch (err) {
            setError('Failed to fetch image list. Please try again.');
            console.error('Error fetching image list:', err);
        }
    }, []);

    // Poll for image list updates
    useEffect(() => {
        fetchImageList();
        const interval = setInterval(() => {
            fetchImageList();
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [fetchImageList]);

    // Handle image click to show analysis
    const handleImageClick = async (filename: string) => {
        setLoading(true);
        setError(null);
        setSelectedImage(null);
        setSelectedClass(null);
        setClasses([]);

        try {
            const imagesResponse = await axios.get('http://localhost:5000/images', {
                withCredentials: true,
            });
            const imageEntry = imagesResponse.data.find(
                (img: ImageEntry) => img.filename === filename && img.source === 'realtime'
            );

            if (!imageEntry) {
                setError('Image not found in database.');
                console.error('Image not found:', filename);
                setLoading(false);
                return;
            }

            const response = await axios.get(`http://localhost:5000/realtime-images/${imageEntry.id}`, {
                withCredentials: true,
            });
            const imageDetails = response.data;

            const detectionConfidences = imageDetails.detections.map((d: Detection) => d.confidence);
            const avgConfidence =
                detectionConfidences.length > 0
                    ? detectionConfidences.reduce((sum: number, conf: number) => sum + conf, 0) /
                    detectionConfidences.length
                    : 0;

            const processedImage: ProcessedImage = {
                id: imageDetails.id,
                fileName: imageDetails.filename,
                originalUrl: imageDetails.original_url,
                processedUrl: imageDetails.annotated_url,
                detections: imageDetails.detections,
                dateProcessed: imageDetails.processed_at,
                confidence: avgConfidence,
            };

            setSelectedImage(processedImage);

            if (imageDetails.detections) {
                const uniqueClasses = Array.from(
                    new Set(imageDetails.detections.map((d: Detection) => d.type))
                );
                setClasses(uniqueClasses);
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                window.dispatchEvent(new Event('unauthorized'));
            } else {
                setError('Failed to load image details.');
                console.error('Error fetching image details:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    // Export analysis results as CSV
    const exportResults = () => {
        if (!selectedImage) return;

        const imageMetadata = [
            ['Real-Time Image Analysis Report'],
            ['Image ID', selectedImage.id],
            ['File Name', selectedImage.fileName],
            ['Original URL', selectedImage.originalUrl],
            ['Processed URL', selectedImage.processedUrl],
            ['Date Processed', new Date(selectedImage.dateProcessed).toLocaleString()],
            ['Average Confidence', `${(selectedImage.confidence * 100).toFixed(0)}%`],
            [],
        ];

        const detectionsHeader = [
            [
                'Detection ID',
                'Confidence',
                'Type',
                'Area (m²)',
                'Latitude',
                'Longitude',
                'Date Detected',
                'Bounding Box TopLeft X',
                'Bounding Box TopLeft Y',
                'Bounding Box BottomRight X',
                'Bounding Box BottomRight Y',
                'Segmentation Coordinates',
            ],
        ];

        const filteredDetections = selectedClass
            ? selectedImage.detections.filter((d) => d.type === selectedClass)
            : selectedImage.detections;

        const detectionsData = filteredDetections.map((d) => [
            d.id,
            d.confidence,
            d.type,
            d.area,
            d.location.lat,
            d.location.lng,
            new Date(d.dateDetected).toLocaleDateString(),
            d.boundingBox.topLeft.x,
            d.boundingBox.topLeft.y,
            d.boundingBox.bottomRight.x,
            d.boundingBox.bottomRight.y,
            d.segmentation && d.segmentation[0] ? d.segmentation[0].join(';') : '',
        ]);

        const csvContent = [...imageMetadata, ...detectionsHeader, ...detectionsData]
            .map((row) => row.map((cell) => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedImage.fileName}_realtime_analysis_report.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Download JSON annotations
    const downloadJson = async () => {
        if (!selectedImage) return;

        try {
            const response = await axios.get(`http://localhost:5000/realtime-images/${selectedImage.id}`, {
                withCredentials: true,
            });
            const jsonUrl = response.data.annotations_url;
            const jsonResponse = await axios.get(jsonUrl, { responseType: 'blob', withCredentials: true });
            const url = window.URL.createObjectURL(jsonResponse.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedImage.fileName}_annotations.json`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Failed to download JSON.', {
                position: 'top-right',
                autoClose: 3000,
            });
        }
    };

    // Share URL
    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard
            .writeText(url)
            .then(() => {
                toast.success('URL copied to clipboard!', {
                    position: 'top-right',
                    autoClose: 3000,
                });
            })
            .catch((err) => {
                toast.error('Failed to copy URL to clipboard.', {
                    position: 'top-right',
                    autoClose: 3000,
                });
                console.error('Error copying to clipboard:', err);
            });
    };

    // Close analysis view
    const closeAnalysis = () => {
        setSelectedImage(null);
        setSelectedClass(null);
        setClasses([]);
        setError(null);
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold text-primary-500">Real-Time Analysis</h1>
                <div className="flex items-center space-x-4">
                    {apiKey && (
                        <div className="flex items-center space-x-2">
                            <p className="text-sm text-neutral-600">API Key:</p>
                            <p className="text-sm font-mono bg-neutral-100 p-2 rounded">{apiKey}</p>
                        </div>
                    )}
                    {isRealTimeAnalysisRunning && (
                        <div className="w-5 h-5 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-error/10 text-error rounded-md">{error}</div>
            )}

            {!selectedImage ? (
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-1/4 border-r border-neutral-200 p-4 overflow-y-auto">
                        <h2 className="text-lg font-semibold text-primary-500 mb-4">Current Session Images</h2>
                        {imageList.length > 0 ? (
                            <ul className="space-y-2">
                                {imageList.map((image) => (
                                    <li
                                        key={image}
                                        className="p-2 rounded cursor-pointer text-neutral-600 hover:bg-neutral-100"
                                        onClick={() => handleImageClick(image)}
                                    >
                                        {image}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-neutral-600">
                                {processingStatus === 'processing'
                                    ? 'Waiting for images from the server...'
                                    : 'Analysis will start shortly...'}
                            </p>
                        )}
                    </div>

                    <div className="w-3/4 p-4 overflow-y-auto">
                        {currentSessionImages.length > 0 ? (
                            currentSessionImages.map((image) => (
                                <div key={image.id} className="mb-6">
                                    <h3 className="text-md font-medium text-neutral-600 mb-2">
                                        Analyzed Image: {image.fileName}
                                    </h3>
                                    {image.detections.length > 0 ? (
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-primary-50">
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
                                                {image.detections.map((detection) => (
                                                    <tr key={detection.id} className="border-b border-neutral-200">
                                                        <td className="p-3 text-neutral-600">{detection.type}</td>
                                                        <td className="p-3 text-neutral-600">
                                                            ({detection.location.lat.toFixed(2)},{' '}
                                                            {detection.location.lng.toFixed(2)})
                                                        </td>
                                                        <td className="p-3 text-neutral-600">
                                                            {detection.area.toFixed(2)}
                                                        </td>
                                                        <td className="p-3 text-neutral-600">
                                                            {(detection.confidence * 100).toFixed(0)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="text-neutral-600">No detections found in this image.</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            processingStatus !== 'processing' && !error && (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-neutral-600">
                                        Waiting for analysis to start...
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <button
                                className="p-1 rounded-md hover:bg-neutral-100 mr-2"
                                onClick={closeAnalysis}
                            >
                                <ArrowLeft size={20} className="text-primary-500" />
                            </button>
                            <h2 className="text-xl font-semibold text-primary-500 truncate">
                                Analysis: {selectedImage.fileName}
                            </h2>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                className="btn btn-outline flex items-center space-x-1.5 text-sm"
                                onClick={handleShare}
                            >
                                <Share2 size={16} />
                                <span>Share</span>
                            </button>
                            <button
                                className="btn btn-outline flex items-center space-x-1.5 text-sm"
                                onClick={downloadJson}
                            >
                                <Download size={16} />
                                <span>Download JSON</span>
                            </button>
                            <button
                                className="btn btn-primary flex items-center space-x-1.5 text-sm"
                                onClick={exportResults}
                            >
                                <Download size={16} />
                                <span>Export CSV</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 flex-1">
                            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-neutral-600 mt-4">Loading image details...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 flex-1">
                            <p className="text-error mb-4">{error}</p>
                            <button onClick={closeAnalysis} className="btn btn-primary">
                                Back to Images
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                            <div className="lg:col-span-1 bg-primary-50 p-4 rounded-md border border-neutral-200">
                                <h3 className="text-lg font-semibold text-primary-500 mb-4">Detection Classes</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedClass(null)}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${selectedClass === null
                                            ? 'bg-primary-500 text-white'
                                            : 'text-primary-500 hover:bg-primary-100'
                                            }`}
                                    >
                                        Show All
                                    </button>
                                    {classes.map((className) => (
                                        <button
                                            key={className}
                                            onClick={() => setSelectedClass(className)}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${selectedClass === className
                                                ? 'bg-primary-500 text-white'
                                                : 'text-primary-500 hover:bg-primary-100'
                                                }`}
                                        >
                                            {className}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-2 h-full flex flex-col">
                                <ImageViewer processedImage={selectedImage} />
                            </div>

                            <div className="flex flex-col">
                                <DetectionList
                                    detections={
                                        selectedClass
                                            ? selectedImage.detections.filter((d) => d.type === selectedClass)
                                            : selectedImage.detections
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RealTimePage;
