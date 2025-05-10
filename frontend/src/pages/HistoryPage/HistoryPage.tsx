import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import HistoryTable from '../../components/History/HistoryTable';
import { HistoryItem } from '../../types';

const HistoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUnauthorized = () => {
      console.log('Unauthorized event detected, redirecting to login from HistoryPage');
      navigate('/login');
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:5000/images-uploaded', {
          withCredentials: true,
        });
        const data = response.data;

        const mappedItems: HistoryItem[] = data
          .filter((item: any) => item.source === 'uploaded') // Safeguard: Ensure only manually uploaded images
          .map((item: any) => ({
            id: item.id,
            fileName: item.filename,
            dateProcessed: item.processed_at,
            detectionCount: item.detection_count,
            confidence: item.confidence,
            status: item.status,
            source: item.source,
          }));

        setHistoryItems(mappedItems);
        setFilteredHistory(mappedItems);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          console.error('Unauthorized access - redirecting to login');
          window.dispatchEvent(new Event('unauthorized'));
        } else {
          setError('Failed to fetch history items. Please try again later.');
          console.error('Error fetching history items:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const period = params.get('period');

    if (period) {
      const validFormats = ['MMM', 'MMM dd', 'yyyy'];
      const filtered = historyItems.filter((item) => {
        const itemDate = new Date(item.dateProcessed);
        if (isNaN(itemDate.getTime())) return false;

        const monthFormat = format(itemDate, 'MMM');
        const dayFormat = format(itemDate, 'MMM dd');
        const yearFormat = format(itemDate, 'yyyy');

        return monthFormat === period || dayFormat === period || yearFormat === period;
      });
      setFilteredHistory(filtered);
    } else {
      setFilteredHistory(historyItems);
    }
  }, [location.search, historyItems]);

  const handleDeleteSuccess = (deletedItemId: string) => {
    setHistoryItems((prevItems) => prevItems.filter((item) => item.id !== deletedItemId));
    setFilteredHistory((prevItems) => prevItems.filter((item) => item.id !== deletedItemId));
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-600 mt-4">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-neutral-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary px-4 py-2 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center mb-6">
        <Clock size={24} className="text-primary-500 mr-2" />
        <h1 className="text-2xl font-bold text-primary-500">Detection History</h1>
      </div>

      <div className="card flex-1">
        <HistoryTable historyItems={filteredHistory} onDeleteSuccess={handleDeleteSuccess} />
      </div>
    </div>
  );
};

export default HistoryPage;
