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
        processingStatus,
        isRealTimeAnalysisRunning,
        startRealTimeAnalysis,
    } = useAppContext();
    const navigate = useNavigate();

    // Persist the same API key for the life of the tab
    const [apiKey] = useState<string>(() => {
        const existing = sessionStorage.getItem('realtimeApiKey');
        if (existing) return existing;
        const fresh = uuidv4();
        sessionStorage.setItem('realtimeApiKey', fresh);
        return fresh;
    });

    // Persist last-selected image
    const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(() => {
        const json = sessionStorage.getItem('selectedRealtimeImage');
        return json ? JSON.parse(json) : null;
    });

    // Persist the session’s list of images
    const [currentSessionImages, setCurrentSessionImages] = useState<ProcessedImage[]>(() => {
        const saved = sessionStorage.getItem('sessionImages');
        return saved ? JSON.parse(saved) : [];
    });

    const [imageList, setImageList] = useState<string[]>(() => {
        const saved = sessionStorage.getItem('sessionImageList');
        return saved ? JSON.parse(saved) : [];
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [classes, setClasses] = useState<string[]>([]);

    // Handle unauthorized globally
    useEffect(() => {
        const onUnauth = () => navigate('/login');
        window.addEventListener('unauthorized', onUnauth);
        return () => window.removeEventListener('unauthorized', onUnauth);
    }, [navigate]);

    // Mark this page as active
    useEffect(() => {
        setCurrentPage('/realtime');
        return () => setCurrentPage('');
    }, [setCurrentPage]);

    // Kick off the real-time stream exactly once
    useEffect(() => {
        if (!apiKey || isRealTimeAnalysisRunning) return;
        ; (async () => {
            try {
                const status = await axios.get('http://localhost:5000/realtime-status', { withCredentials: true });
                if (!status.data.isRunning) {
                    await axios.post(
                        'http://localhost:5000/realtime',
                        { apiKey },
                        { withCredentials: true }
                    );
                    startRealTimeAnalysis();
                }
            } catch (e) {
                setError('Failed to start real-time analysis.');
                toast.error('Failed to start real-time analysis.', { position: 'top-right', autoClose: 3000 });
            }
        })();
    }, [apiKey, isRealTimeAnalysisRunning, startRealTimeAnalysis]);

    // Fetch & dedupe session images, then persist
    const fetchImageList = useCallback(async () => {
        try {
            const resp = await axios.get('http://localhost:5000/images-list', { withCredentials: true });
            const filenames = Array.from(new Set(resp.data.images as string[]));

            const details = await Promise.all(
                filenames.map(async (fn) => {
                    try {
                        const imgs = await axios.get('http://localhost:5000/images', { withCredentials: true });
                        const entry: ImageEntry | undefined = imgs.data.find(
                            (i: ImageEntry) => i.filename === fn && i.source === 'realtime'
                        );
                        if (!entry) return null;

                        const det = await axios.get(
                            `http://localhost:5000/realtime-images/${entry.id}`,
                            { withCredentials: true }
                        );
                        const data = det.data;
                        const creds = data.detections.map((d: Detection) => d.confidence);
                        const avg = creds.length
                            ? creds.reduce((s, c) => s + c, 0) / creds.length
                            : 0;

                        return {
                            id: data.id,
                            fileName: data.filename,
                            originalUrl: data.original_url,
                            processedUrl: data.annotated_url,
                            detections: data.detections,
                            dateProcessed: data.processed_at,
                            confidence: avg,
                        } as ProcessedImage;
                    } catch {
                        return null;
                    }
                })
            );

            const valid = details.filter((d): d is ProcessedImage => Boolean(d));
            const unique = valid.reduce<ProcessedImage[]>((acc, img) => {
                if (!acc.some(x => x.id === img.id)) acc.push(img);
                return acc;
            }, []);

            setCurrentSessionImages(unique);
            sessionStorage.setItem('sessionImages', JSON.stringify(unique));
            setImageList(filenames);
            sessionStorage.setItem('sessionImageList', JSON.stringify(filenames));
        } catch {
            setError('Failed to fetch image list. Please try again.');
        }
    }, []);

    // Poll every 5s
    useEffect(() => {
        fetchImageList();
        const iv = setInterval(fetchImageList, 5000);
        return () => clearInterval(iv);
    }, [fetchImageList]);

    // When user clicks an image name
    const handleImageClick = async (filename: string) => {
        setLoading(true);
        setError(null);
        setSelectedImage(null);
        setSelectedClass(null);
        setClasses([]);

        try {
            const imgs = await axios.get('http://localhost:5000/images', { withCredentials: true });
            const entry: ImageEntry | undefined = imgs.data.find(
                (i: ImageEntry) => i.filename === filename && i.source === 'realtime'
            );
            if (!entry) throw new Error('not found');

            const res = await axios.get(`http://localhost:5000/realtime-images/${entry.id}`, {
                withCredentials: true,
            });
            const data = res.data;
            const creds = data.detections.map((d: Detection) => d.confidence);
            const avg = creds.length
                ? creds.reduce((s, c) => s + c, 0) / creds.length
                : 0;

            const obj: ProcessedImage = {
                id: data.id,
                fileName: data.filename,
                originalUrl: data.original_url,
                processedUrl: data.annotated_url,
                detections: data.detections,
                dateProcessed: data.processed_at,
                confidence: avg,
            };
            setSelectedImage(obj);
            sessionStorage.setItem('selectedRealtimeImage', JSON.stringify(obj));

            const uniq = Array.from(new Set(data.detections.map((d: Detection) => d.type)));
            setClasses(uniq);
        } catch {
            setError('Failed to load image details.');
        } finally {
            setLoading(false);
        }
    };

    // Close the detail view
    const closeAnalysis = () => {
        setSelectedImage(null);
        setSelectedClass(null);
        setClasses([]);
        setError(null);
        sessionStorage.removeItem('selectedRealtimeImage');
    };

    // Export CSV
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
                        <div className="w-5 h-5 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-error/10 text-error rounded-md">{error}</div>
            )}

            {!selectedImage ? (
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-1/4 border-r border-neutral-200 p-4 overflow-y-auto">
                        <h2 className="text-lg font-semibold text-primary-500 mb-4">
                            Current Session Images
                        </h2>
                        {imageList.length > 0 ? (
                            <ul className="space-y-2">
                                {imageList.map(name => (
                                    <li
                                        key={name}
                                        className="p-2 rounded cursor-pointer text-neutral-600 hover:bg-neutral-100"
                                        onClick={() => handleImageClick(name)}
                                    >
                                        {name}
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
                        {currentSessionImages.map(img => (
                            <div key={img.id} className="mb-6">
                                <h3 className="text-md font-medium text-neutral-600 mb-2">
                                    Analyzed Image: {img.fileName}
                                </h3>
                                {img.detections.length > 0 ? (
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
                                            {img.detections.map(d => (
                                                <tr key={d.id} className="border-b border-neutral-200">
                                                    <td className="p-3 text-neutral-600">{d.type}</td>
                                                    <td className="p-3 text-neutral-600">
                                                        ({d.location.lat.toFixed(2)},{' '}
                                                        {d.location.lng.toFixed(2)})
                                                    </td>
                                                    <td className="p-3 text-neutral-600">{d.area.toFixed(2)}</td>
                                                    <td className="p-3 text-neutral-600">
                                                        {(d.confidence * 100).toFixed(0)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-neutral-600">No detections found in this image.</p>
                                )}
                            </div>
                        ))}
                        {currentSessionImages.length === 0 && processingStatus !== 'processing' && !error && (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-neutral-600">Waiting for analysis to start...</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    {/* Your detailed analysis UI goes here exactly as before */}
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
                                <Share2 size={16} /> <span>Share</span>
                            </button>
                            <button
                                className="btn btn-outline flex items-center space-x-1.5 text-sm"
                                onClick={downloadJson}
                            >
                                <Download size={16} /> <span>Download JSON</span>
                            </button>
                            <button
                                className="btn btn-primary flex items-center space-x-1.5 text-sm"
                                onClick={exportResults}
                            >
                                <Download size={16} /> <span>Export CSV</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 flex-1">
                            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
                            {/* Detection Classes sidebar */}
                            <div className="lg:col-span-1 bg-primary-50 p-4 rounded-md border border-neutral-200">
                                <h3 className="text-lg font-semibold text-primary-500 mb-4">
                                    Detection Classes
                                </h3>
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
                                    {classes.map(cn => (
                                        <button
                                            key={cn}
                                            onClick={() => setSelectedClass(cn)}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${selectedClass === cn
                                                ? 'bg-primary-500 text-white'
                                                : 'text-primary-500 hover:bg-primary-100'
                                                }`}
                                        >
                                            {cn}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Image Viewer */}
                            <div className="lg:col-span-2 h-full flex flex-col">
                                <ImageViewer processedImage={selectedImage} />
                            </div>

                            {/* Detection List */}
                            <div className="flex flex-col">
                                <DetectionList
                                    detections={
                                        selectedClass
                                            ? selectedImage.detections.filter(d => d.type === selectedClass)
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
