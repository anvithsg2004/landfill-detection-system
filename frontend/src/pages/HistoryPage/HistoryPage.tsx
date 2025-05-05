import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import HistoryTable from '../../components/History/HistoryTable';
import { useAppContext } from '../../context/AppContext';

const HistoryPage = () => {
  const { history } = useAppContext();
  const location = useLocation();
  const [filteredHistory, setFilteredHistory] = useState(history);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const period = params.get('period'); // e.g., "May" or "May 01"

    if (period) {
      const filtered = history.filter((item) => {
        const itemDate = new Date(item.dateProcessed);
        const monthFormat = format(itemDate, 'MMM');
        const dayFormat = format(itemDate, 'MMM dd');
        const yearFormat = format(itemDate, 'yyyy');
        return monthFormat === period || dayFormat === period || yearFormat === period;
      });
      setFilteredHistory(filtered);
    } else {
      setFilteredHistory(history);
    }
  }, [location.search, history]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center mb-6">
        <Clock size={24} className="text-primary-500 mr-2" />
        <h1 className="text-2xl font-bold text-primary-500">Detection History</h1>
      </div>

      <div className="card flex-1">
        <HistoryTable historyItems={filteredHistory} />
      </div>
    </div>
  );
};

export default HistoryPage;