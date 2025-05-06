import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAppContext } from '../../context/AppContext';

interface RealTimeDetection {
    location: {
        lat: number;
        lng: number;
    };
    area: number;
    confidence: number;
    type: string;
}

interface ImageResult {
    image: string;
    detections: RealTimeDetection[];
}

const RealTimePage = () => {
    const {
        setFirstDetectionFound,
        setTotalDetections,
        setProcessingStatus,
        processingStatus,
        resetProcessingState,
        resetNotifications,
        setCurrentPage, // Add setCurrentPage from context
    } = useAppContext();
    const [imageList, setImageList] = useState<string[]>([]);
    const [results, setResults] = useState<ImageResult[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Set the current page when the component mounts
    useEffect(() => {
        setCurrentPage('/realtime');
        return () => {
            setCurrentPage(''); // Reset when leaving the page
        };
    }, [setCurrentPage]);

    // Fetch the list of images
    const fetchImageList = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5000/images-list');
            setImageList(response.data.images);
        } catch (err) {
            setError('Failed to fetch image list. Please try again.');
            console.error('Error fetching image list:', err);
            toast.error('Failed to fetch image list.', {
                position: 'top-right',
                autoClose: 3000,
            });
        }
    }, []);

    useEffect(() => {
        fetchImageList();
    }, [fetchImageList]);

    const handleRealTimeAnalysis = async () => {
        resetProcessingState();
        resetNotifications();
        setProcessingStatus('processing');
        setError(null);
        setResults([]);
        setSelectedImage(null);

        try {
            const response = await fetch('http://localhost:5000/realtime');
            if (!response.ok) {
                throw new Error('Failed to fetch real-time analysis data');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to read response stream');
            }

            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const data = JSON.parse(line);

                        if (data.error) {
                            setError(data.error);
                            toast.error(data.error, {
                                position: 'top-right',
                                autoClose: 3000,
                            });
                            setProcessingStatus('error');
                            continue;
                        }

                        if (data.firstDetection) {
                            setFirstDetectionFound(true);
                            continue;
                        }

                        if (data.completed) {
                            setTotalDetections(data.totalDetections);
                            setProcessingStatus('complete');
                            continue;
                        }

                        setResults((prev) => [...prev, { image: data.image, detections: data.detections }]);
                    } catch (parseErr) {
                        console.error('Error parsing streamed data:', parseErr);
                    }
                }
            }

            if (buffer.trim()) {
                try {
                    const data = JSON.parse(buffer);
                    if (data.error) {
                        setError(data.error);
                        toast.error(data.error, {
                            position: 'top-right',
                            autoClose: 3000,
                        });
                        setProcessingStatus('error');
                    } else if (data.completed) {
                        setTotalDetections(data.totalDetections);
                        setProcessingStatus('complete');
                    } else {
                        setResults((prev) => [...prev, { image: data.image, detections: data.detections }]);
                    }
                } catch (parseErr) {
                    console.error('Error parsing remaining buffer:', parseErr);
                }
            }
        } catch (err) {
            setError('Failed to fetch real-time analysis data. Please try again.');
            console.error('Error fetching real-time data:', err);
            toast.error('Failed to fetch real-time analysis data.', {
                position: 'top-right',
                autoClose: 3000,
            });
            setProcessingStatus('error');
        }
    };

    const displayedResults = selectedImage
        ? results.filter((result) => result.image === selectedImage)
        : results;

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold text-primary-500">Real-Time Analysis</h1>
                <button
                    onClick={handleRealTimeAnalysis}
                    className="btn btn-primary flex items-center space-x-1.5 text-sm"
                    disabled={processingStatus === 'processing'}
                >
                    {processingStatus === 'processing' ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <span>Start Real-Time Analysis</span>
                    )}
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-error/10 text-error rounded-md">{error}</div>
            )}

            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/4 border-r border-neutral-200 p-4 overflow-y-auto">
                    <h2 className="text-lg font-semibold text-primary-500 mb-4">Images</h2>
                    {imageList.length > 0 ? (
                        <ul className="space-y-2">
                            {imageList.map((image) => (
                                <li
                                    key={image}
                                    className={`p-2 rounded cursor-pointer ${selectedImage === image
                                        ? 'bg-primary-100 text-primary-500'
                                        : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                    onClick={() => setSelectedImage(image)}
                                >
                                    {image}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-neutral-600">No images found in the folder.</p>
                    )}
                </div>

                <div className="w-3/4 p-4 overflow-y-auto">
                    {displayedResults.length > 0 ? (
                        displayedResults.map((result, index) => (
                            <div key={index} className="mb-6">
                                <h3 className="text-md font-medium text-neutral-600 mb-2">
                                    Analyzed Image: {result.image}
                                </h3>
                                {result.detections.length > 0 ? (
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
                                            {result.detections.map((detection, detIndex) => (
                                                <tr key={detIndex} className="border-b border-neutral-200">
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
                        processingStatus !== 'processing' &&
                        !error && (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-neutral-600">
                                    Click "Start Real-Time Analysis" to view detection details, or select an image
                                    from the list.
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default RealTimePage;