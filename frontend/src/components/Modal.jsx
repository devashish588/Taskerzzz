import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${sizes[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white font-heading">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-base-700 text-base-300 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
