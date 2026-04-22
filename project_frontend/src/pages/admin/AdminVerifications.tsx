import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Loader2, AlertCircle, Eye, User } from 'lucide-react';
import Layout from '../../components/Layout';

interface PendingVerification {
  _id: string;
  fullName: string;
  email: string;
  drivingLicenseNumber: string;
  drivingLicenseImage: string;
  createdAt: string;
}

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/pending-verifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch verifications');
      const data = await response.json();
      setVerifications(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string, status: 'verified' | 'rejected') => {
    setProcessingId(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/admin/verify-license/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${status} user`);
      }
      
      setVerifications(prev => prev.filter(v => v._id !== userId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium tracking-wide uppercase text-xs font-black">Loading requests...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
              License <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Verification</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">
              Review and authorize driver documentation
            </p>
          </div>
          <div className="bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl border-2 border-blue-100 flex items-center space-x-3 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-black text-sm uppercase tracking-wider">{verifications.length} Pending</span>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border-2 border-rose-100 text-rose-600 p-6 rounded-3xl mb-8 flex items-center space-x-4 animate-shake">
            <AlertCircle className="w-8 h-8 flex-shrink-0" />
            <p className="font-black text-sm uppercase italic">{error}</p>
          </div>
        )}

        {verifications.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-24 text-center border-2 border-dashed border-gray-100 shadow-sm">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-white shadow-inner">
              <CheckCircle className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Queue Clear</h3>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No pending verifications at this time</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {verifications.map((user) => (
              <div key={user._id} className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 overflow-hidden border border-white relative group transition-all hover:scale-[1.01]">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center border border-gray-100">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 leading-none">{user.fullName}</h3>
                        <p className="text-blue-600 font-bold text-xs mt-2 uppercase tracking-widest">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                      ID: {user._id.slice(-6)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">License Number</p>
                      <p className="font-black text-gray-900 tracking-wider truncate">{user.drivingLicenseNumber}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Submitted On</p>
                      <p className="font-black text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div 
                    className="relative rounded-3xl overflow-hidden aspect-video bg-gray-900 group/img cursor-zoom-in mb-8 shadow-inner border-4 border-white"
                    onClick={() => setSelectedImage(`http://localhost:5001/${user.drivingLicenseImage}`)}
                  >
                    <img 
                      src={`http://localhost:5001/${user.drivingLicenseImage}`} 
                      alt="Driving License"
                      className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-all group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center space-x-2 border border-white/30">
                        <Eye className="w-5 h-5 text-white" />
                        <span className="text-white font-black uppercase text-xs tracking-widest">Review Document</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleVerify(user._id, 'verified')}
                      disabled={!!processingId}
                      className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 h-16 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-lg shadow-green-100 active:scale-95 group/btn"
                    >
                      {processingId === user._id ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform" />
                          <span className="text-white font-black uppercase tracking-widest text-sm">Approve</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleVerify(user._id, 'rejected')}
                      disabled={!!processingId}
                      className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 h-16 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-lg shadow-rose-100 active:scale-95 group/btn"
                    >
                      {processingId === user._id ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform" />
                          <span className="text-white font-black uppercase tracking-widest text-sm">Reject</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-8 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
            <button 
              className="absolute top-0 right-0 p-4 text-white hover:text-gray-300 transition-colors z-[1001]"
              onClick={() => setSelectedImage(null)}
            >
              <XCircle className="w-10 h-10" />
            </button>
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-3xl border-4 border-white/10 animate-in zoom-in-95 duration-500" 
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
