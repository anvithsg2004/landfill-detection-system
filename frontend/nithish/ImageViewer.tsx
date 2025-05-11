import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Maximize, Square, Image as ImageIcon, Layers } from 'lucide-react';
import { ProcessedImage } from '../../types';

interface ImageViewerProps {
  processedImage: ProcessedImage;
  setSelectedClass: (className: string | null) => void;
  selectedClass: string | null;
}

const ImageViewer = ({ processedImage, setSelectedClass, selectedClass }: ImageViewerProps) => {
  const [viewMode, setViewMode] = useState<'original' | 'processed' | 'split'>('processed');
  const [splitPosition, setSplitPosition] = useState(50);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isOriginalLoading, setIsOriginalLoading] = useState(true);
  const [isProcessedLoading, setIsProcessedLoading] = useState(true);
  const [originalError, setOriginalError] = useState<string | null>(null);
  const [processedError, setProcessedError] = useState<string | null>(null);
  const [showMasks, setShowMasks] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const originalImgRef = useRef<HTMLImageElement>(null);
  const processedImgRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Update container dimensions dynamically
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    // Initial update
    updateDimensions();

    // Add resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Add window resize listener as a fallback
    window.addEventListener('resize', updateDimensions);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const handleSplitDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const percentage = (mouseX / containerRect.width) * 100;

    setSplitPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (e.buttons !== 1) return; // Only drag when primary mouse button is pressed
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const percentage = (mouseX / containerRect.width) * 100;

    setSplitPosition(Math.min(Math.max(percentage, 0), 100));
  };

  useEffect(() => {
    if (viewMode === 'split') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener(
        'mouseup',
        () => {
          window.removeEventListener('mousemove', handleMouseMove);
        },
        { once: true }
      );
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [viewMode]);

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!isFullScreen) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable full-screen mode:', err);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
      // Force update dimensions when entering/exiting full-screen
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  useEffect(() => {
    const img = processedImgRef.current;
    if (img && img.complete) {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    }
  }, [isProcessedLoading]);

  const handleClassClick = (className: string) => {
    setSelectedClass(className);
  };

  const toggleMasks = () => {
    setShowMasks((prev) => {
      console.log('Toggling showMasks:', !prev); // Debug: Log state change
      return !prev;
    });
  };

  // Calculate scaling and offsets based on current container dimensions
  const calculateOverlayPositions = () => {
    const imgWidth = imageDimensions.width;
    const imgHeight = imageDimensions.height;
    const containerWidth = containerDimensions.width;
    const containerHeight = containerDimensions.height;

    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (containerWidth - imgWidth * scale) / 2;
    const offsetY = (containerHeight - imgHeight * scale) / 2;

    return { scale, offsetX, offsetY };
  };

  const { scale, offsetX, offsetY } = calculateOverlayPositions();

  return (
    <div className="card w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-primary-500">Image Analysis</h3>

        <div className="flex items-center space-x-2">
          <button
            className={`p-1.5 rounded ${viewMode === 'original'
              ? 'bg-primary-100 text-primary-500'
              : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            onClick={() => setViewMode('original')}
            title="View original image"
          >
            <Eye size={16} />
          </button>
          <button
            className={`p-1.5 rounded ${viewMode === 'processed'
              ? 'bg-primary-100 text-primary-500'
              : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            onClick={() => setViewMode('processed')}
            title="View processed image"
          >
            <EyeOff size={16} />
          </button>
          <button
            className={`p-1.5 rounded ${viewMode === 'split'
              ? 'bg-primary-100 text-primary-500'
              : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            onClick={() => setViewMode('split')}
            title="Split view"
          >
            <Square size={16} />
          </button>
          <button
            className={`p-1.5 rounded ${showMasks
              ? 'bg-primary-100 text-primary-500'
              : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            onClick={toggleMasks}
            title={showMasks ? 'Hide masks' : 'Show masks'}
          >
            <Layers size={16} />
          </button>

          <div className="h-4 w-px bg-neutral-200 mx-1"></div>

          <button
            className="p-1.5 rounded text-neutral-500 hover:bg-neutral-100"
            onClick={toggleFullScreen}
            title={isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden rounded-md bg-neutral-900"
        onMouseDown={viewMode === 'split' ? handleSplitDrag : undefined}
      >
        {/* Original Image */}
        {isOriginalLoading && viewMode !== 'processed' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-neutral-400">Loading original image...</p>
          </div>
        )}
        {originalError && viewMode !== 'processed' && (
          <div className="absolute inset-0 flex items-center justify-center text-error">
            <ImageIcon size={24} className="mr-2" />
            <p>{originalError}</p>
          </div>
        )}
        <img
          ref={originalImgRef}
          src={processedImage.originalUrl}
          alt="Original"
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            clipPath:
              viewMode === 'split'
                ? `inset(0 ${100 - splitPosition}% 0 0)`
                : viewMode === 'original'
                  ? 'inset(0)'
                  : 'inset(0 100% 0 0)',
            display: isOriginalLoading && viewMode !== 'processed' ? 'none' : 'block',
          }}
          onLoad={() => setIsOriginalLoading(false)}
          onError={() => {
            setIsOriginalLoading(false);
            setOriginalError('Failed to load original image.');
          }}
        />

        {/* Processed Image with Masks and Bounding Boxes */}
        {isProcessedLoading && viewMode !== 'original' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-neutral-400">Loading processed image...</p>
          </div>
        )}
        {processedError && viewMode !== 'original' && (
          <div className="absolute inset-0 flex items-center justify-center text-error">
            <ImageIcon size={24} className="mr-2" />
            <p>{processedError}</p>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            clipPath:
              viewMode === 'split'
                ? `inset(0 0 0 ${splitPosition}%)`
                : viewMode === 'processed'
                  ? 'inset(0)'
                  : 'inset(0 0 0 100%)',
          }}
        >
          <img
            ref={processedImgRef}
            src={processedImage.processedUrl}
            alt="Processed"
            className="w-full h-full object-contain"
            style={{
              display: isProcessedLoading && viewMode !== 'original' ? 'none' : 'block',
            }}
            onLoad={() => setIsProcessedLoading(false)}
            onError={() => {
              setIsProcessedLoading(false);
              setProcessedError('Failed to load processed image.');
            }}
          />
          {/* SVG Overlay for Masks and Bounding Boxes */}
          {viewMode !== 'original' && processedImgRef.current && containerDimensions.width > 0 && (
            <svg
              key={`svg-${showMasks}-${containerDimensions.width}-${containerDimensions.height}`}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ display: isProcessedLoading && viewMode !== 'original' ? 'none' : 'block' }}
            >
              {processedImage.detections
                .filter(d => !selectedClass || d.type === selectedClass)
                .map((detection) => {
                if (!detection.boundingBox) {
                  return null; // Skip if boundingBox is undefined
                }

                // Debug: Log segmentation data
                console.log(`Detection ${detection.id} Segmentation:`, detection.segmentation);

                // Calculate bounding box coordinates
                const topLeftLat = detection.boundingBox.topLeft.lat;
                const topLeftLng = detection.boundingBox.topLeft.lng;
                const bottomRightLat = detection.boundingBox.bottomRight.lat;
                const bottomRightLng = detection.boundingBox.bottomRight.lng;

                // Interpret as pixel coordinates [x1, y1, x2, y2]
                const x = topLeftLng; // x1
                const y = topLeftLat; // y1
                const width = bottomRightLng - topLeftLng; // x2 - x1
                const height = bottomRightLat - topLeftLat; // y2 - y1

                // Scale the coordinates based on the image's natural dimensions
                const imgWidth = processedImgRef.current.naturalWidth;
                const imgHeight = processedImgRef.current.naturalHeight;
                const containerWidth = containerDimensions.width;
                const containerHeight = containerDimensions.height;

                const scaleX = containerWidth / imgWidth;
                const scaleY = containerHeight / imgHeight;
                const scale = Math.min(scaleX, scaleY);

                const scaledX = x * scale;
                const scaledY = y * scale;
                const scaledWidth = width * scale;
                const scaledHeight = height * scale;

                const offsetX = (containerWidth - imgWidth * scale) / 2;
                const offsetY = (containerHeight - imgHeight * scale) / 2;

                // Render Mask
                const maskElement =
                  detection.segmentation &&
                  detection.segmentation[0] &&
                  detection.segmentation[0].length > 0 ? (
                    <polygon
                      points={detection.segmentation[0]
                        .map((coord, index) =>
                          index % 2 === 0
                            ? (coord * scale + offsetX).toString()
                            : (coord * scale + offsetY).toString()
                        )
                        .join(',')}
                      fill="rgba(255, 0, 0, 0.3)"
                      className="pointer-events-none"
                    />
                  ) : null;

                // Render Bounding Box and Class Label
                return (
                  <g key={detection.id}>
                    {maskElement}
                    <rect
                      x={scaledX + offsetX}
                      y={scaledY + offsetY}
                      width={scaledWidth}
                      height={scaledHeight}
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="2"
                      fill="none"
                      className="pointer-events-none"
                    />
                    <foreignObject
                      x={scaledX + offsetX}
                      y={scaledY + offsetY - 24}
                      width={Math.max(scaledWidth, 150)}
                      height="24"
                    >
                      <button
                        className="bg-primary-500 text-white text-xs px-2 py-1 rounded-t-md hover:bg-primary-600 cursor-pointer pointer-events-auto"
                        onClick={() => handleClassClick(detection.type)}
                      >
                        {detection.type} ({(detection.confidence * 100).toFixed(0)}%)
                      </button>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Split line */}
        {viewMode === 'split' && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-10 shadow-lg"
            style={{ left: `${splitPosition}%` }}
          ></div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">{processedImage.fileName}</span>
          <span className="text-neutral-500">
            Processed on {new Date(processedImage.dateProcessed).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
