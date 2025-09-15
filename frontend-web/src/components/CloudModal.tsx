'use client';

import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { auth } from '@/lib/firebase';

interface CloudModalProps {
  onClose: () => void;
}

interface CloudFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  download_url: string;
  thumbnail_url?: string;
}

interface StorageInfo {
  used_mb: number;
  total_mb: number;
  ads_watched: number;
  remaining_ads: number;
}

export function CloudModal({ onClose }: CloudModalProps) {
  const { user } = useFirebaseAuth();
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdModal, setShowAdModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStorageInfo();
      fetchFiles();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const getFirebaseToken = async () => {
    if (user) {
      return await user.getIdToken();
    }
    return null;
  };

  const fetchStorageInfo = async () => {
    try {
      const token = await getFirebaseToken();
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/cloud/storage', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStorageInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch storage info:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const token = await getFirebaseToken();
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/cloud/files', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const watchAd = async () => {
    try {
      const token = await getFirebaseToken();
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/cloud/watch-ad', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        await fetchStorageInfo();
        setShowAdModal(false);
        // Show success message
        alert(`Ad watched! ${data.storage_increased ? 'Storage increased by 50MB!' : 'Keep watching ads to increase storage!'}`);
      }
    } catch (error) {
      console.error('Failed to watch ad:', error);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      const token = await getFirebaseToken();
      if (!token) return;
      
      const response = await fetch(`http://localhost:8000/cloud/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        await fetchFiles();
        await fetchStorageInfo();
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) {
    return (
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div 
          className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
          <p className="text-gray-400 mb-6">Please login to access your cloud storage</p>
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div 
          className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-xl"></div>
          
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl font-light transition-colors z-10"
          >
            ×
          </button>

          <div className="text-center mb-8 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent mb-2">
              Cloud Storage
            </h2>
            <p className="text-gray-400 text-sm">
              Your personal media library in the cloud
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Storage Info */}
              {storageInfo && (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-4">Storage Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{storageInfo.total_mb} MB</div>
                      <div className="text-gray-400 text-sm">Total Storage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{storageInfo.used_mb.toFixed(1)} MB</div>
                      <div className="text-gray-400 text-sm">Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{storageInfo.ads_watched}</div>
                      <div className="text-gray-400 text-sm">Ads Watched</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{storageInfo.remaining_ads}</div>
                      <div className="text-gray-400 text-sm">Ads Remaining</div>
                    </div>
                  </div>
                  
                  {/* Storage Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Storage Usage</span>
                      <span>{((storageInfo.used_mb / storageInfo.total_mb) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((storageInfo.used_mb / storageInfo.total_mb) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upgrade Options */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">Get More Storage</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-white font-semibold">Watch Ads</div>
                        <div className="text-gray-400 text-sm">+50MB per 5 ads</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowAdModal(true)}
                      className="w-full py-2 px-4 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
                    >
                      Watch Ad
                    </button>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-white font-semibold">Premium</div>
                        <div className="text-gray-400 text-sm">Unlimited storage</div>
                      </div>
                    </div>
                    <button className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-400 transition-colors">
                      Upgrade
                    </button>
                  </div>
                </div>
              </div>

              {/* Files List */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">Your Files ({files.length})</h3>
                {files.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                    </div>
                    <p className="text-gray-400">No files in cloud storage yet</p>
                    <p className="text-gray-500 text-sm">Download videos and save them to cloud</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            {file.file_type === 'video' ? (
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/>
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">{file.filename}</div>
                            <div className="text-gray-400 text-sm">
                              {formatFileSize(file.file_size)} • {formatDate(file.upload_date)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={file.download_url}
                            download
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                          </a>
                          <button
                            onClick={() => deleteFile(file.id)}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-60 p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Watch Ad for Storage</h3>
            <p className="text-gray-400 mb-6">
              Watch an ad to get +50MB of storage space!<br/>
              Watch 5 ads to unlock the bonus.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAdModal(false)}
                className="flex-1 py-3 px-6 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={watchAd}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300"
              >
                Watch Ad
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}