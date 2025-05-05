import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Filter, FileText, ArrowRight, Trash2, X } from 'lucide-react';
import { HistoryItem } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { AnimatePresence, motion } from 'framer-motion';

interface HistoryTableProps {
  historyItems: HistoryItem[];
}

type SortField = 'fileName' | 'dateProcessed' | 'detectionCount' | 'confidence';
type SortOrder = 'asc' | 'desc';

// Define variants for the disintegration effect
const rowVariants = {
  initial: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: {
    opacity: 0,
    scale: 0.95,
    filter: 'blur(3px)',
    transition: {
      duration: 1, // Slower duration for a dramatic effect
      staggerChildren: 0.1, // Stagger the child animations
    },
  },
};

// Define variants for table cells to simulate particle dispersion
const cellVariants = {
  initial: { opacity: 1, x: 0, y: 0 },
  exit: {
    opacity: 0,
    transition: { duration: 0.8 },
  },
};

const HistoryTable = ({ historyItems }: HistoryTableProps) => {
  const { deleteImage } = useAppContext();
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('dateProcessed');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterConfidenceMin, setFilterConfidenceMin] = useState<number>(0);
  const [filterConfidenceMax, setFilterConfidenceMax] = useState<number>(100);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const applyFilters = (items: HistoryItem[]) => {
    return items.filter((item) => {
      const matchesStatus = filterStatus ? item.status === filterStatus : true;
      const confidence = item.confidence * 100;
      const matchesConfidence =
        confidence >= filterConfidenceMin && confidence <= filterConfidenceMax;
      return matchesStatus && matchesConfidence;
    });
  };

  const handleDeleteClick = (imageId: string) => {
    setItemToDelete(imageId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteImage(itemToDelete);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const sortedItems = applyFilters([...historyItems]).sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'fileName':
        comparison = a.fileName.localeCompare(b.fileName);
        break;
      case 'dateProcessed':
        comparison = new Date(a.dateProcessed).getTime() - new Date(b.dateProcessed).getTime();
        break;
      case 'detectionCount':
        comparison = a.detectionCount - b.detectionCount;
        break;
      case 'confidence':
        comparison = a.confidence - b.confidence;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-success text-white';
      case 'processing':
        return 'bg-accent-500 text-dark';
      case 'error':
        return 'bg-error text-white';
      case 'pending':
        return 'bg-neutral-400 text-white';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (field !== sortField) return <ChevronDown size={14} className="opacity-30" />;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="overflow-x-auto">
      {/* Filter Button and Dropdown */}
      <div className="mb-4 flex items-center justify-between relative">
        <h3 className="text-base font-semibold text-primary-500">
          Processing History
        </h3>
        <div>
          <button
            className="btn btn-outline text-sm flex items-center space-x-1 px-3 py-1.5"
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
          {showFilter && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-md shadow-lg p-4 z-10">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-neutral-600">Filter Options</h4>
                <button onClick={() => setShowFilter(false)}>
                  <X size={16} className="text-neutral-500" />
                </button>
              </div>
              <div className="mb-3">
                <label className="block text-sm text-neutral-600 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-md text-sm"
                >
                  <option value="">All</option>
                  <option value="complete">Complete</option>
                  <option value="processing">Processing</option>
                  <option value="error">Error</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm text-neutral-600 mb-1">Confidence Range</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={filterConfidenceMin}
                    onChange={(e) => setFilterConfidenceMin(Number(e.target.value))}
                    min={0}
                    max={100}
                    placeholder="Min"
                    className="w-1/2 p-2 border border-neutral-300 rounded-md text-sm"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={filterConfidenceMax}
                    onChange={(e) => setFilterConfidenceMax(Number(e.target.value))}
                    min={0}
                    max={100}
                    placeholder="Max"
                    className="w-1/2 p-2 border border-neutral-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-md p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-neutral-600 mb-6">
              Are you sure you want to delete this image? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-200 hover:bg-neutral-300 rounded-md transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-error hover:bg-error-dark rounded-md transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">
              <button className="flex items-center" onClick={() => handleSort('fileName')}>
                <span>File Name</span>
                {renderSortIcon('fileName')}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">
              <button
                className="flex items-center"
                onClick={() => handleSort('dateProcessed')}
              >
                <span>Date Processed</span>
                {renderSortIcon('dateProcessed')}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">
              <button
                className="flex items-center"
                onClick={() => handleSort('detectionCount')}
              >
                <span>Detections</span>
                {renderSortIcon('detectionCount')}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">
              <button
                className="flex items-center"
                onClick={() => handleSort('confidence')}
              >
                <span>Confidence</span>
                {renderSortIcon('confidence')}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">
              <span>Status</span>
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-600">
              <span>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {sortedItems.map((item) => {
              // Precompute random x and y offsets for each cell
              const cellExitProps = {
                x: Math.random() > 0.5 ? Math.random() * 20 : -Math.random() * 20,
                y: Math.random() > 0.5 ? Math.random() * 10 : -Math.random() * 10,
              };

              return (
                <motion.tr
                  key={item.id}
                  variants={rowVariants}
                  initial="initial"
                  exit="exit"
                  className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <motion.td
                    variants={cellVariants}
                    custom={cellExitProps}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: cellExitProps.x, y: cellExitProps.y }}
                    className="px-4 py-3 text-sm"
                  >
                    <div className="flex items-center">
                      <FileText size={16} className="text-neutral-400 mr-2" />
                      {item.fileName}
                    </div>
                  </motion.td>
                  <motion.td
                    variants={cellVariants}
                    custom={cellExitProps}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: cellExitProps.x, y: cellExitProps.y }}
                    className="px-4 py-3 text-sm text-neutral-600"
                  >
                    {new Date(item.dateProcessed).toLocaleString()}
                  </motion.td>
                  <motion.td
                    variants={cellVariants}
                    custom={cellExitProps}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: cellExitProps.x, y: cellExitProps.y }}
                    className="px-4 py-3 text-sm text-neutral-600"
                  >
                    {item.detectionCount}
                  </motion.td>
                  <motion.td
                    variants={cellVariants}
                    custom={cellExitProps}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: cellExitProps.x, y: cellExitProps.y }}
                    className="px-4 py-3 text-sm text-neutral-600"
                  >
                    {(item.confidence * 100).toFixed(0)}%
                  </motion.td>
                  <motion.td
                    variants={cellVariants}
                    custom={cellExitProps}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: cellExitProps.x, y: cellExitProps.y }}
                    className="px-4 py-3 text-sm"
                  >
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </motion.td>
                  <motion.td
                    variants={cellVariants}
                    custom={cellExitProps}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: cellExitProps.x, y: cellExitProps.y }}
                    className="px-4 py-3 text-sm text-right space-x-2"
                  >
                    <Link
                      to={`/analysis/${item.id}`}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-colors duration-200"
                    >
                      <span>View</span>
                      <ArrowRight size={14} className="ml-1" />
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-error hover:bg-error-dark rounded-md transition-colors duration-200"
                    >
                      <Trash2 size={14} className="mr-1" />
                      <span>Delete</span>
                    </button>
                  </motion.td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>

      {sortedItems.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-neutral-500">No history items found</p>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;