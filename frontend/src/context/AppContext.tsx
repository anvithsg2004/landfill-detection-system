import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Detection, ProcessedImage, HistoryItem, User } from '../types';

interface AppContextType {
  user: User | null;
  detections: Detection[];
  processingStatus: 'idle' | 'processing' | 'complete' | 'error';
  processingProgress: number;
  history: HistoryItem[];
  processedImages: ProcessedImage[];
  activeImageId: string | null;
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  addDetection: (detection: Detection) => void;
  removeDetection: (id: string) => void;
  setProcessingStatus: (status: 'idle' | 'processing' | 'complete' | 'error') => void;
  setProcessingProgress: (progress: number) => void;
  addProcessedImage: (image: ProcessedImage) => void;
  setActiveImageId: (id: string | null) => void;
  processFiles: (files: File[]) => Promise<void>;
  exportResults: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  fetchHistory: () => Promise<void>;
  resetProcessingState: () => void;
  deleteImage: (imageId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const api = axios.create({
    baseURL: 'http://localhost:5000',
  });

  const addDetection = (detection: Detection) => {
    setDetections((prev) => [...prev, detection]);
  };

  const removeDetection = (id: string) => {
    setDetections((prev) => prev.filter((detection) => detection.id !== id));
  };

  const addProcessedImage = (image: ProcessedImage) => {
    setProcessedImages((prev) => [...prev, image]);

    const historyItem: HistoryItem = {
      id: image.id,
      fileName: image.fileName,
      original_url: image.originalUrl,
      annotated_url: image.processedUrl,
      dateProcessed: image.dateProcessed,
      detectionCount: image.detections.length,
      confidence: image.confidence,
      status: 'complete',
      detections: image.detections,
    };

    setHistory((prev) => [historyItem, ...prev]);
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setProcessingStatus('processing');
    setProcessingProgress(0);

    try {
      let lastImageId: string | null = null;

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round((event.loaded * 100) / event.total);
              setProcessingProgress(percent);
            }
          },
        });

        const { image_id } = uploadResponse.data;

        const imageDetailsResponse = await api.get(`/images/${image_id}`);
        const imageDetails = imageDetailsResponse.data;

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
          detections: imageDetails.detections.map((det: any) => ({
            ...det,
            segmentation: det.segmentation, // Map the segmentation data
          })),
          dateProcessed: imageDetails.processed_at,
          confidence: avgConfidence,
          metadata: {
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toISOString(),
          },
        };

        addProcessedImage(processedImage);
        lastImageId = processedImage.id;
      }

      setProcessingStatus('complete');
      if (lastImageId) {
        setActiveImageId(lastImageId);
        await fetchHistory();
      }
    } catch (error) {
      setProcessingStatus('error');
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          console.error('Network error: Flask server may not be running on http://localhost:5000');
        } else if (error.response) {
          console.error('API error:', error.response.data);
        }
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/images');
      const historyItems = await Promise.all(
        response.data.map(async (item: any): Promise<HistoryItem> => {
          const imageDetailsResponse = await api.get(`/images/${item.id}`);
          const imageDetails = imageDetailsResponse.data;

          const detectionConfidences = imageDetails.detections.map((d: Detection) => d.confidence);
          const avgConfidence =
            detectionConfidences.length > 0
              ? detectionConfidences.reduce((sum: number, conf: number) => sum + conf, 0) /
              detectionConfidences.length
              : 0;

          return {
            id: item.id,
            fileName: item.filename,
            original_url: imageDetails.original_url,
            annotated_url: imageDetails.annotated_url,
            dateProcessed: item.processed_at,
            detectionCount: item.detection_count,
            confidence: avgConfidence,
            status: 'complete',
            detections: imageDetails.detections.map((det: any) => ({
              ...det,
              segmentation: det.segmentation, // Map the segmentation data
            })),
          };
        })
      );
      setHistory(historyItems);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to fetch history.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      await api.delete(`/images/${imageId}`);
      setProcessedImages((prev) => prev.filter((image) => image.id !== imageId));
      setHistory((prev) => prev.filter((item) => item.id !== imageId));
      if (activeImageId === imageId) {
        setActiveImageId(null);
      }
      toast.success('Image deleted successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const exportResults = () => {
    alert('Results exported successfully!');
  };

  const login = async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (email === 'demo@example.com' && password === 'password') {
      const user: User = {
        id: '1',
        email,
        name: 'Demo User',
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user: User = {
      id: Date.now().toString(),
      email,
      name,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const resetProcessingState = () => {
    setProcessingStatus('idle');
    setProcessingProgress(0);
    setActiveImageId(null);
    setUploadedFiles([]);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchHistory();
  }, []);

  const contextValue: AppContextType = {
    user,
    detections,
    processingStatus,
    processingProgress,
    history,
    processedImages,
    activeImageId,
    uploadedFiles,
    setUploadedFiles,
    addDetection,
    removeDetection,
    setProcessingStatus,
    setProcessingProgress,
    addProcessedImage,
    setActiveImageId,
    processFiles,
    exportResults,
    login,
    register,
    logout,
    fetchHistory,
    resetProcessingState,
    deleteImage,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};