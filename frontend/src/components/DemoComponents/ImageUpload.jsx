import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiX, FiImage, FiCheckCircle } from 'react-icons/fi';

const ImageUpload = ({ onImagesUploaded }) => {
    const [dragActive, setDragActive] = useState(false);
    const [images, setImages] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const [processingImage, setProcessingImage] = useState(null);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (files) => {
        const newImages = Array.from(files).map(file => {
            const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            // Start simulated upload
            simulateUpload(id);
            return {
                id,
                file,
                name: file.name,
                size: file.size,
                url: URL.createObjectURL(file),
                status: 'uploading'
            };
        });

        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);

        // Call the callback with the updated images
        if (onImagesUploaded) {
            onImagesUploaded(updatedImages);
        }
    };

    const simulateUpload = (id) => {
        let progress = 0;
        setUploadProgress(prev => ({ ...prev, [id]: progress }));

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 10) + 1;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setUploadProgress(prev => ({ ...prev, [id]: progress }));

                // Update image status after upload completion
                setImages(prev => {
                    const updated = prev.map(img =>
                        img.id === id ? { ...img, status: 'uploaded' } : img
                    );
                    if (onImagesUploaded) {
                        onImagesUploaded(updated);
                    }
                    return updated;
                });

                // Simulate processing
                setTimeout(() => {
                    setProcessingImage(id);
                    setTimeout(() => {
                        setProcessingImage(null);
                        setImages(prev => {
                            const updated = prev.map(img =>
                                img.id === id ? { ...img, status: 'processed' } : img
                            );
                            if (onImagesUploaded) {
                                onImagesUploaded(updated);
                            }
                            return updated;
                        });
                    }, 2000);
                }, 500);

            } else {
                setUploadProgress(prev => ({ ...prev, [id]: progress }));
            }
        }, 100);
    };

    const removeImage = (id) => {
        setImages(prev => {
            const updated = prev.filter(img => img.id !== id);
            if (onImagesUploaded) {
                onImagesUploaded(updated);
            }
            return updated;
        });
    };

    const onButtonClick = () => {
        fileInputRef.current.click();
    };

    return (
        <motion.div
            className="bg-white rounded-lg shadow-sm p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <h2 className="text-xl font-semibold mb-4">Image Upload</h2>

            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-colors flex flex-col items-center justify-center cursor-pointer
          ${dragActive ? 'border-[#303c54] bg-[#303c54]/10' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
                style={{ minHeight: '200px' }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleChange}
                    accept="image/*"
                />

                <motion.div
                    className="text-center"
                    initial={{ scale: 1 }}
                    animate={{ scale: dragActive ? 1.05 : 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="mx-auto mb-4 p-4 bg-[#303c54]/20 text-[#303c54] rounded-full inline-flex"
                        animate={{
                            y: [0, -10, 0],
                            transition: { repeat: dragActive ? Infinity : 0, duration: 1 }
                        }}
                    >
                        <FiUploadCloud size={32} />
                    </motion.div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                        {dragActive ? 'Drop images here' : 'Drag & drop images here'}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3">or</p>
                    <button
                        className="px-4 py-2 text-white rounded-md transition-colors text-sm font-medium"
                        style={{
                            backgroundColor: '#303c54',
                            ':hover': { backgroundColor: '#3b4a66' }
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        Browse Files
                    </button>
                    <p className="text-xs text-gray-400 mt-3">Supported formats: JPG, PNG, TIFF (Max size: 10MB)</p>
                </motion.div>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {images.map((image) => (
                            <motion.div
                                key={image.id}
                                className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                layout
                            >
                                <div className="relative pt-[75%] bg-gray-100">
                                    <img
                                        src={image.url}
                                        alt={image.name}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />

                                    {/* Processing overlay */}
                                    {processingImage === image.id && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <div className="text-white text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
                                                <p className="text-sm">Analyzing...</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status indicator */}
                                    {image.status === 'processed' && (
                                        <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full">
                                            <FiCheckCircle size={16} />
                                        </div>
                                    )}
                                </div>

                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="truncate text-sm font-medium text-gray-800 mr-2">{image.name}</div>
                                        <button
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            onClick={() => removeImage(image.id)}
                                        >
                                            <FiX size={18} />
                                        </button>
                                    </div>

                                    {/* Progress bar */}
                                    {image.status === 'uploading' && (
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                                            <div
                                                className="bg-[#303c54] h-1.5 rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress[image.id] || 0}%` }}
                                            ></div>
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-500 flex items-center">
                                        {image.status === 'uploading' && (
                                            <>
                                                <span>Uploading... {uploadProgress[image.id] || 0}%</span>
                                            </>
                                        )}
                                        {image.status === 'uploaded' && (
                                            <>
                                                <FiImage className="mr-1" size={12} />
                                                <span>{(image.size / 1024 / 1024).toFixed(2)} MB</span>
                                            </>
                                        )}
                                        {image.status === 'processed' && (
                                            <span className="text-green-500">Analysis Complete</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Empty state */}
            {images.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                    <p>No images uploaded yet</p>
                </div>
            )}
        </motion.div>
    );
};

export default ImageUpload;
