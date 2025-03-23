import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FileItem, User } from './types';

interface AppState {
  user: User;
  files: FileItem[];
  setUser: (user: User) => void;
  clearUser: () => void;
  addFile: (file: FileItem) => void;
  updateFile: (id: string, updates: Partial<FileItem>) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  getFailedFiles: () => FileItem[];
  getCompletedFiles: () => FileItem[];
  getPendingFiles: () => FileItem[];
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: {},
      files: [],
      setUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
      clearUser: () => set({ user: {} }),
      addFile: (file) => set((state) => ({ files: [...state.files, file] })),
      updateFile: (id, updates) =>
        set((state) => ({
          files: state.files.map((file) =>
            file.id === id ? { ...file, ...updates } : file
          ),
        })),
      removeFile: (id) =>
        set((state) => ({
          files: state.files.filter((file) => file.id !== id),
        })),
      clearFiles: () => set({ files: [] }),
      getFailedFiles: () => get().files.filter(file => file.status === 'failed'),
      getCompletedFiles: () => get().files.filter(file => file.status === 'completed'),
      getPendingFiles: () => get().files.filter(file => file.status === 'pending' || file.status === 'uploading'),
    }),
    {
      name: 'stellum-storage',
    }
  )
);

export default useStore;