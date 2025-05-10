import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Detection, ProcessedImage, HistoryItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { setupAxios } from '../../axiosConfig';

interface UserProfile {
  email: string;
  name: string;
  role: string;
  createdAt: string;
  apiKey: string;
}

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  detections: Detection[];
  processingStatus: 'idle' | 'processing' | 'complete' | 'error';
  processingProgress: number;
  history: HistoryItem[];
  processedImages: ProcessedImage[];
  activeImageId: string | null;
  uploadedFiles: File[];
  firstDetectionFound: boolean;
  totalDetections: number;
  currentPage: string;
  apiKey: string;
  isRealTimeAnalysisRunning: boolean;
  setCurrentPage: (page: string) => void;
  setFirstDetectionFound: (value: boolean) => void;
  setTotalDetections: (value: number) => void;
  setUploadedFiles: (files: File[]) => void;
  addDetection: (detection: Detection) => void;
  removeDetection: (id: string) => void;
  setProcessingStatus: (status: 'idle' | 'processing' | 'complete' | 'error') => void;
  setProcessingProgress: (progress: number) => void;
  addProcessedImage: (image: ProcessedImage) => void;
  setActiveImageId: (id: string | null) => void;
  processFiles: (files: File[]) => Promise<void>;
  exportResults: () => void;
  fetchHistory: () => Promise<void>;
  fetchUploadedImages: () => Promise<HistoryItem[]>;
  resetProcessingState: () => void;
  deleteImage: (imageId: string) => Promise<void>;
  resetNotifications: () => void;
  startRealTimeAnalysis: () => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [firstDetectionFound, setFirstDetectionFound] = useState(false);
  const [totalDetections, setTotalDetections] = useState(0);
  const [currentPage, setCurrentPage] = useState<string>('');
  const [hasShownFirstDetectionNotification, setHasShownFirstDetectionNotification] = useState(false);
  const [hasShownCompletionNotification, setHasShownCompletionNotification] = useState(false);
  const [apiKey] = useState<string>(uuidv4());
  const [isRealTimeAnalysisRunning, setIsRealTimeAnalysisRunning] = useState(false);
  const [hasFetchedHistory, setHasFetchedHistory] = useState(false);
  const [hasAttemptedInitialFetch, setHasAttemptedInitialFetch] = useState(false);

  const api = axios.create({
    baseURL: 'http://localhost:5000',
    withCredentials: true,
  });

  // Set up axios with stored credentials on app initialization
  useEffect(() => {
    const storedAuth = localStorage.getItem('userAuth');
    if (storedAuth) {
      // Extract email and password from the stored auth header
      const decodedAuth = atob(storedAuth.split(' ')[1]); // Decode Base64
      const [email, password] = decodedAuth.split(':');
      setupAxios(email, password); // Configure axios with stored credentials
    } else {
      setupAxios(null, null); // Clear Authorization header if no stored auth
    }
  }, []);

  // Fetch current user on initial load
  useEffect(() => {
    const fetchUser = async () => {
      const storedAuth = localStorage.getItem('userAuth');
      if (!storedAuth) {
        setUser(null);
        localStorage.removeItem('userEmail');
        setHasAttemptedInitialFetch(true);
        return;
      }

      try {
        const response = await api.get('/current-user', {
          headers: {
            Authorization: storedAuth,
          },
        });
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user with stored auth:', err);
        localStorage.removeItem('userAuth');
        localStorage.removeItem('userEmail');
        setUser(null);
        window.dispatchEvent(new Event('unauthorized'));
      }
      setHasAttemptedInitialFetch(true);
    };

    if (!hasAttemptedInitialFetch) {
      const userAuth = localStorage.getItem('userAuth');
      if (userAuth) {
        fetchUser();
      } else {
        setUser(null);
        localStorage.removeItem('userEmail');
        setHasAttemptedInitialFetch(true);
      }
    }
  }, [hasAttemptedInitialFetch]);

  // Global error handling for 401 Unauthorized
  useEffect(() => {
    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.error('Global 401 Unauthorized error detected:', error.response?.data);
          toast.error('Session expired. Please log in again.', {
            position: 'top-right',
            autoClose: 3000,
          });
          localStorage.removeItem('userEmail');
          setUser(null);
          window.dispatchEvent(new Event('unauthorized'));
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // Notification for first detection
  useEffect(() => {
    if (
      firstDetectionFound &&
      currentPage !== '/realtime' &&
      !hasShownFirstDetectionNotification
    ) {
      toast.info('First detection found!', {
        position: 'top-right',
        autoClose: 3000,
      });
      setHasShownFirstDetectionNotification(true);
    }
  }, [firstDetectionFound, currentPage, hasShownFirstDetectionNotification]);

  // Notification for completion
  useEffect(() => {
    if (
      totalDetections > 0 &&
      currentPage !== '/realtime' &&
      !hasShownCompletionNotification
    ) {
      toast.success(`All real-time image analysis completed. Total detections: ${totalDetections}`, {
        position: 'top-right',
        autoClose: 5000,
      });
      setHasShownCompletionNotification(true);
    }
  }, [totalDetections, currentPage, hasShownCompletionNotification]);

  const addDetection = (detection: Detection) => {
    setDetections((prev) => [...prev, detection]);
  };

  const removeDetection = (id: string) => {
    setDetections((prev) => prev.filter((detection) => detection.id !== id));
  };

  const fetchUploadedImages = async (): Promise<HistoryItem[]> => {
    try {
      const response = await api.get('/images-uploaded');
      const uploadedImages = response.data.map((item: any): HistoryItem => ({
        id: item.id,
        fileName: item.filename,
        original_url: `${api.defaults.baseURL}/real-time-outputs/${item.filename}`,
        annotated_url: `${api.defaults.baseURL}/real-time-outputs/${item.filename.replace(/\.[^/.]+$/, '')}_annotated.png`,
        dateProcessed: item.processed_at,
        detectionCount: item.detection_count,
        confidence: item.confidence,
        status: item.status,
        detections: [],
      }));
      return uploadedImages;
    } catch (error) {
      console.error('Error fetching uploaded images:', error);
      throw error;
    }
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
            segmentation: det.segmentation,
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
          toast.error('Network error: Server may not be running.', {
            position: 'top-right',
            autoClose: 3000,
          });
        } else if (error.response) {
          console.error('API error:', error.response.data);
          toast.error('Failed to process files.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      } else {
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
      throw error;
    }
  };

  const fetchHistory = async () => {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
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
                segmentation: det.segmentation,
              })),
            };
          })
        );
        setHistory(historyItems);
        break;
      } catch (error) {
        console.error('Error fetching history:', error);
        if (axios.isAxiosError(error)) {
          if (error.code === 'ERR_NETWORK') {
            retries++;
            if (retries === maxRetries) {
              toast.error('Network error: Unable to fetch history. Please try again later.', {
                position: 'top-right',
                autoClose: 3000,
              });
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
          } else {
            toast.error('Failed to fetch history.', {
              position: 'top-right',
              autoClose: 3000,
            });
            break;
          }
        } else {
          toast.error('Failed to fetch history.', {
            position: 'top-right',
            autoClose: 3000,
          });
          break;
        }
      }
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
      throw error;
    }
  };

  const exportResults = () => {
    alert('Results exported successfully!');
  };

  const resetProcessingState = () => {
    setProcessingStatus('idle');
    setProcessingProgress(0);
    setActiveImageId(null);
    setUploadedFiles([]);
    setFirstDetectionFound(false);
    setTotalDetections(0);
  };

  const resetNotifications = () => {
    setHasShownFirstDetectionNotification(false);
    setHasShownCompletionNotification(false);
  };

  const startRealTimeAnalysis = async () => {
    if (isRealTimeAnalysisRunning) return;

    setIsRealTimeAnalysisRunning(true);
    resetProcessingState();
    resetNotifications();
    setProcessingStatus('processing');

    try {
      const response = await fetch('http://localhost:5000/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ apiKey }),
      });

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
              toast.error(data.error, {
                position: 'top-right',
                autoClose: 3000,
              });
              setProcessingStatus('error');
              setIsRealTimeAnalysisRunning(false);
              continue;
            }

            if (data.firstDetection) {
              setFirstDetectionFound(true);
              continue;
            }

            if (data.completed) {
              setTotalDetections(data.totalDetections);
              setProcessingStatus('complete');
              setIsRealTimeAnalysisRunning(false);
              continue;
            }

            const isDuplicate = processedImages.some(
              (img) => img.fileName === data.image
            );
            if (!isDuplicate) {
              setProcessedImages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  fileName: data.image,
                  originalUrl: `http://localhost:5000/images/${data.image}`,
                  processedUrl: `http://localhost:5000/outputs/${data.image.replace(/\.[^/.]+$/, '')}_annotated.png`,
                  detections: data.detections.map((det: any) => ({
                    id: det.id || Date.now().toString(),
                    confidence: det.confidence,
                    type: det.type,
                    area: det.area,
                    location: det.location,
                    boundingBox: det.boundingBox || {
                      topLeft: { lat: det.location.lat, lng: det.location.lng },
                      bottomRight: { lat: det.location.lat, lng: det.location.lng },
                    },
                    segmentation: det.segmentation || [],
                    dateDetected: new Date().toISOString(),
                  })),
                  dateProcessed: new Date().toISOString(),
                  confidence:
                    data.detections.length > 0
                      ? data.detections.reduce((sum: number, det: any) => sum + det.confidence, 0) /
                      data.detections.length
                      : 0,
                },
              ]);
            }
          } catch (parseErr) {
            console.error('Error parsing streamed data:', parseErr);
          }
        }
      }

      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          if (data.error) {
            toast.error(data.error, {
              position: 'top-right',
              autoClose: 3000,
            });
            setProcessingStatus('error');
            setIsRealTimeAnalysisRunning(false);
          } else if (data.completed) {
            setTotalDetections(data.totalDetections);
            setProcessingStatus('complete');
            setIsRealTimeAnalysisRunning(false);
          } else {
            const isDuplicate = processedImages.some(
              (img) => img.fileName === data.image
            );
            if (!isDuplicate) {
              setProcessedImages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  fileName: data.image,
                  originalUrl: `http://localhost:5000/images/${data.image}`,
                  processedUrl: `http://localhost:5000/outputs/${data.image.replace(/\.[^/.]+$/, '')}_annotated.png`,
                  detections: data.detections.map((det: any) => ({
                    id: det.id || Date.now().toString(),
                    confidence: det.confidence,
                    type: det.type,
                    area: det.area,
                    location: det.location,
                    boundingBox: det.boundingBox || {
                      topLeft: { lat: det.location.lat, lng: det.location.lng },
                      bottomRight: { lat: det.location.lat, lng: det.location.lng },
                    },
                    segmentation: det.segmentation || [],
                    dateDetected: new Date().toISOString(),
                  })),
                  dateProcessed: new Date().toISOString(),
                  confidence:
                    data.detections.length > 0
                      ? data.detections.reduce((sum: number, det: any) => sum + det.confidence, 0) /
                      data.detections.length
                      : 0,
                },
              ]);
            }
          }
        } catch (parseErr) {
          console.error('Error parsing remaining buffer:', parseErr);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
      setProcessingStatus('error');
      setIsRealTimeAnalysisRunning(false);
    }
  };

  useEffect(() => {
    if (user && !hasFetchedHistory && !hasAttemptedInitialFetch) {
      setHasFetchedHistory(true);
      setHasAttemptedInitialFetch(true);
      fetchHistory().catch((error) => {
        console.error('Initial fetchHistory failed:', error);
      });
    }
  }, [user, hasFetchedHistory, hasAttemptedInitialFetch]);

  const contextValue: AppContextType = {
    user,
    setUser,
    detections,
    processingStatus,
    processingProgress,
    history,
    processedImages,
    activeImageId,
    uploadedFiles,
    firstDetectionFound,
    totalDetections,
    currentPage,
    apiKey,
    isRealTimeAnalysisRunning,
    setCurrentPage,
    setFirstDetectionFound,
    setTotalDetections,
    setUploadedFiles,
    addDetection,
    removeDetection,
    setProcessingStatus,
    setProcessingProgress,
    addProcessedImage,
    setActiveImageId,
    processFiles,
    exportResults,
    fetchHistory,
    fetchUploadedImages,
    resetProcessingState,
    deleteImage,
    resetNotifications,
    startRealTimeAnalysis,
  };

  return (
    <AppContext.Provider
      value={{
        ...contextValue,
        logout: () => {
          localStorage.removeItem('userAuth');
          localStorage.removeItem('userEmail');
          setUser(null);
          setupAxios(null, null); // Clear Authorization header on logout
          window.dispatchEvent(new Event('unauthorized'));
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
