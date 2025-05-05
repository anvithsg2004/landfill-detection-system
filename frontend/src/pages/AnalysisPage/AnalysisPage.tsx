import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ProcessedImage, Detection } from '../../types';
import ImageViewer from '../../components/Analysis/ImageViewer';
import DetectionList from '../../components/Analysis/DetectionList';

const AnalysisPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState<ProcessedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    const fetchImageDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`http://localhost:5000/images/${id}`);
        const imageDetails = response.data;

        console.log('Fetched Image Details:', imageDetails);
        console.log('Original URL:', imageDetails.original_url);
        console.log('Processed URL:', imageDetails.annotated_url);

        const detectionConfidences = imageDetails.detections.map(
          (d: Detection) => d.confidence
        );
        const avgConfidence =
          detectionConfidences.length > 0
            ? detectionConfidences.reduce((sum: number, conf: number) => sum + conf, 0) /
            detectionConfidences.length
            : 0;

        const processedImage: ProcessedImage = {
          id: imageDetails.id,
          fileName: imageDetails.filename,
          originalUrl: imageDetails.original_url, // Map original_url to originalUrl
          processedUrl: imageDetails.annotated_url, // Map annotated_url to processedUrl
          detections: imageDetails.detections.map((det: any) => ({
            ...det,
            segmentation: det.segmentation, // Ensure segmentation is mapped
          })),
          dateProcessed: imageDetails.processed_at,
          confidence: avgConfidence,
        };

        setCurrentImage(processedImage);

        // Extract unique classes from detections
        if (imageDetails.detections) {
          const uniqueClasses = Array.from(
            new Set(imageDetails.detections.map((d: Detection) => d.type))
          );
          setClasses(uniqueClasses);
        }
      } catch (err) {
        setError('Failed to load image details. Please try again.');
        console.error('Error fetching image details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchImageDetails();
    }
  }, [id]);

  const exportResults = () => {
    if (!currentImage) return;

    const imageMetadata = [
      ['Image Analysis Report'],
      ['Image ID', currentImage.id],
      ['File Name', currentImage.fileName],
      ['Original URL', currentImage.originalUrl],
      ['Processed URL', currentImage.processedUrl],
      ['Date Processed', new Date(currentImage.dateProcessed).toLocaleString()],
      ['Average Confidence', `${(currentImage.confidence * 100).toFixed(0)}%`],
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
        'Bounding Box TopLeft Lat',
        'Bounding Box TopLeft Lng',
        'Bounding Box BottomRight Lat',
        'Bounding Box BottomRight Lng',
      ],
    ];

    const filteredDetections = selectedClass
      ? currentImage.detections.filter((d) => d.type === selectedClass)
      : currentImage.detections;

    const detectionsData = filteredDetections.map((d) => [
      d.id,
      d.confidence,
      d.type,
      d.area,
      d.location.lat,
      d.location.lng,
      new Date(d.dateDetected).toLocaleDateString(),
      d.boundingBox.topLeft.lat,
      d.boundingBox.topLeft.lng,
      d.boundingBox.bottomRight.lat,
      d.boundingBox.bottomRight.lng,
    ]);

    const csvContent = [...imageMetadata, ...detectionsHeader, ...detectionsData]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentImage.fileName}_analysis_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-600 mt-4">Loading image details...</p>
      </div>
    );
  }

  if (error || !currentImage) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-neutral-600 mb-4">{error || 'Image not found.'}</p>
        <button onClick={() => navigate('/upload')} className="btn btn-primary">
          Upload New Images
        </button>
      </div>
    );
  }

  const filteredDetections = selectedClass
    ? currentImage.detections.filter((d) => d.type === selectedClass)
    : currentImage.detections;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button
            className="p-1 rounded-md hover:bg-neutral-100 mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} className="text-primary-500" />
          </button>
          <h1 className="text-xl font-semibold text-primary-500 truncate">
            Analysis: {currentImage.fileName}
          </h1>
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
            className="btn btn-primary flex items-center space-x-1.5 text-sm"
            onClick={exportResults}
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Class Filter Sidebar */}
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
          <ImageViewer processedImage={currentImage} setSelectedClass={setSelectedClass} />
        </div>

        <div className="flex flex-col">
          <DetectionList detections={filteredDetections} />
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
