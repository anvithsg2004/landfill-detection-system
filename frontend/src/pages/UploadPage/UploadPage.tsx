import { Upload as UploadIcon, FileType } from 'lucide-react';
import FileDropzone from '../../components/Upload/FileDropzone';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const UploadPage = () => {
  const { processingStatus, processingProgress, activeImageId, resetProcessingState } = useAppContext();
  const navigate = useNavigate();

  // Navigate to analysis page when processing completes
  useEffect(() => {
    if (processingStatus === 'complete' && activeImageId) {
      navigate(`/analysis/${activeImageId}`, { replace: false });
      resetProcessingState(); // Reset state after redirection
    }
  }, [processingStatus, activeImageId, navigate, resetProcessingState]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <UploadIcon size={24} className="text-primary-500 mr-2" />
        <h1 className="text-2xl font-bold text-primary-500">Upload Satellite Images</h1>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Images for Processing</h2>
        <p className="text-neutral-600 mb-6">
          Drag and drop satellite or aerial imagery to analyze for potential landfill sites. Our AI system will process these images to detect active, inactive, and potential landfill locations.
        </p>

        <FileDropzone />

        {processingStatus === 'error' && (
          <div className="mt-4 p-3 bg-error bg-opacity-10 border border-error rounded-md text-error text-sm">
            Failed to process the image. Please ensure the backend server is running and try again.
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Supported Image Formats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-neutral-200 rounded-md bg-neutral-50">
            <div className="flex items-center mb-2">
              <FileType size={20} className="text-primary-500 mr-2" />
              <h3 className="font-medium">PNG</h3>
            </div>
            <p className="text-sm text-neutral-600">
              High-quality lossless compression, good for detailed imagery
            </p>
          </div>

          <div className="p-4 border border-neutral-200 rounded-md bg-neutral-50">
            <div className="flex items-center mb-2">
              <FileType size={20} className="text-primary-500 mr-2" />
              <h3 className="font-medium">JPG/JPEG</h3>
            </div>
            <p className="text-sm text-neutral-600">
              Standard format with good compression for satellite imagery
            </p>
          </div>

          <div className="p-4 border border-neutral-200 rounded-md bg-neutral-50">
            <div className="flex items-center mb-2">
              <FileType size={20} className="text-primary-500 mr-2" />
              <h3 className="font-medium">TIFF</h3>
            </div>
            <p className="text-sm text-neutral-600">
              Professional format that preserves geospatial metadata
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 border border-neutral-200 rounded-md bg-accent-50">
          <p className="text-sm text-accent-700">
            <strong>Note:</strong> For best results, use high-resolution imagery with a ground sample distance (GSD) of 1 meter or better. Images should be georeferenced when possible to allow for accurate mapping.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;