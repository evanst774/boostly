// src/components/admin/audit-logs/configs.tsx
import {
  Edit,
  Trash2,
  DollarSign,
  Package,
  Key,
  User,
  FileText,
  Activity,
} from 'lucide-react';

export const PAGE_SIZE = 20;

export const actionConfig: Record<
  string,
  {
    bg: string;
    color: string;
    label: string;
    icon: React.ReactNode;
    category: string;
  }
> = {
  LOGIN: {
    bg: 'rgba(100,116,139,0.15)',
    color: '#94a3b8',
    label: 'Login',
    icon: <Key className="w-3 h-3" />,
    category: 'auth',
  },
  USER_CREATED: {
    bg: 'rgba(37,99,235,0.12)',
    color: '#60a5fa',
    label: 'User Created',
    icon: <User className="w-3 h-3" />,
    category: 'edit',
  },
  USER_UPDATED: {
    bg: 'rgba(37,99,235,0.12)',
    color: '#60a5fa',
    label: 'User Updated',
    icon: <Edit className="w-3 h-3" />,
    category: 'edit',
  },
  USER_DELETED: {
    bg: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    label: 'User Deleted',
    icon: <Trash2 className="w-3 h-3" />,
    category: 'delete',
  },
  BIKE_CREATED: {
    bg: 'rgba(139,92,246,0.12)',
    color: '#c4b5fd',
    label: 'Bike Created',
    icon: <Package className="w-3 h-3" />,
    category: 'inventory',
  },
  BIKE_UPDATED: {
    bg: 'rgba(139,92,246,0.12)',
    color: '#c4b5fd',
    label: 'Bike Updated',
    icon: <Edit className="w-3 h-3" />,
    category: 'inventory',
  },
  BIKE_DELETED: {
    bg: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    label: 'Bike Deleted',
    icon: <Trash2 className="w-3 h-3" />,
    category: 'delete',
  },
  SALE_CREATED: {
    bg: 'rgba(37,99,235,0.12)',
    color: '#60a5fa',
    label: 'Sale Created',
    icon: <FileText className="w-3 h-3" />,
    category: 'edit',
  },
  SALE_UPDATED: {
    bg: 'rgba(37,99,235,0.12)',
    color: '#60a5fa',
    label: 'Sale Updated',
    icon: <Edit className="w-3 h-3" />,
    category: 'edit',
  },
  SALE_DELETED: {
    bg: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    label: 'Sale Deleted',
    icon: <Trash2 className="w-3 h-3" />,
    category: 'delete',
  },
  PAYMENT_RECORDED: {
    bg: 'rgba(34,197,94,0.12)',
    color: '#4ade80',
    label: 'Payment',
    icon: <DollarSign className="w-3 h-3" />,
    category: 'payment',
  },
  CUSTOMER_CREATED: {
    bg: 'rgba(37,99,235,0.12)',
    color: '#60a5fa',
    label: 'Customer Created',
    icon: <User className="w-3 h-3" />,
    category: 'edit',
  },
  CUSTOMER_UPDATED: {
    bg: 'rgba(37,99,235,0.12)',
    color: '#60a5fa',
    label: 'Customer Updated',
    icon: <Edit className="w-3 h-3" />,
    category: 'edit',
  },
  CUSTOMER_DELETED: {
    bg: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    label: 'Customer Deleted',
    icon: <Trash2 className="w-3 h-3" />,
    category: 'delete',
  },
  CONTRACT_UPLOADED: {
    bg: 'rgba(37,99,235,0.12)',
    color: '#60a5fa',
    label: 'Contract',
    icon: <FileText className="w-3 h-3" />,
    category: 'edit',
  },
  CONTRACT_DELETED: {
    bg: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    label: 'Contract Deleted',
    icon: <Trash2 className="w-3 h-3" />,
    category: 'delete',
  },
  default: {
    bg: 'rgba(100,116,139,0.15)',
    color: '#94a3b8',
    label: 'Action',
    icon: <Activity className="w-3 h-3" />,
    category: 'other',
  },
};

export const dateRangeOptions = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
];

export const actionFilterOptions = [
  { value: '', label: 'All Actions' },
  { value: 'edit', label: '✏️ Edits' },
  { value: 'delete', label: '🗑️ Deletes' },
  { value: 'payment', label: '💰 Payments' },
  { value: 'inventory', label: '📦 Inventory' },
];

export const moduleFilterOptions = [
  { value: '', label: 'All Modules' },
  { value: 'user', label: '👤 Users' },
  { value: 'bike', label: '🏍️ Inventory' },
  { value: 'sale', label: '🛒 Sales' },
  { value: 'payment', label: '💳 Finance' },
  { value: 'customer', label: '👥 Customers' },
  { value: 'contract', label: '📄 Contracts' },
];
