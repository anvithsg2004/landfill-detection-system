import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ProgressBar from '../UI/ProgressBar';

const FileDropzone = () => {
  const { uploadedFiles, setUploadedFiles, processingStatus, processingProgress, processFiles } =
    useAppContext();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setUploadedFiles(acceptedFiles);
      processFiles(acceptedFiles);
    },
    [setUploadedFiles, processFiles]
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/tiff': ['.tif', '.tiff'],
    },
    maxSize: 10485760, // 10MB
    multiple: true,
  });

  const getBorderColor = () => {
    if (isDragAccept) return 'border-secondary-500';
    if (isDragReject) return 'border-error';
    if (isDragActive) return 'border-primary-500';
    return 'border-neutral-300';
  };

  const isProcessing = processingStatus === 'processing';

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer hover:bg-neutral-50 text-center ${getBorderColor()}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          <Upload className="h-12 w-12 text-primary-400 mb-4" />
          <p className="text-lg font-medium mb-1">Drag & drop satellite images here</p>
          <p className="text-neutral-500 mb-4">or click to browse files</p>
          <p className="text-xs text-neutral-400">
            Supported formats: PNG, JPG, TIFF (max 10MB)
          </p>
        </div>
      </div>

      {isProcessing && (
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Processing images...</span>
            <span className="text-sm font-medium">{processingProgress}%</span>
          </div>
          <ProgressBar progress={processingProgress} />
        </div>
      )}

      {processingStatus === 'error' && (
        <div className="mt-4 p-3 bg-error bg-opacity-10 border border-error rounded-md text-error text-sm">
          Failed to process images. Please try again.
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2">
            Uploaded files ({uploadedFiles.length})
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center p-3 bg-white rounded-md border border-neutral-200"
              >
                <File className="h-5 w-5 text-primary-500 mr-3" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-neutral-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;