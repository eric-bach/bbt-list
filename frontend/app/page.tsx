'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  Plus,
  PlusCircle,
  Globe,
  Award,
  Sparkles,
  X,
  Heart,
  Milk,
  Lock,
  LogIn,
  UserPlus,
  Mail,
} from 'lucide-react';
import { signIn, signUp, confirmSignUp } from '@/lib/cognito';

interface Shop {
  id: string;
  name: string;
  country: string;
  average_rating: number;
  review_count: number;
  favorite_drink?: string;
}

interface Review {
  id: string;
  shopId: string;
  rating: number;
  favorite_drinks?: string;
  review_text?: string;
  author: string;
  created_at: number;
}

export default function Home() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Modals state
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'confirm'>(
    'login',
  );
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmCode, setAuthConfirmCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Forms state
  const [newShopName, setNewShopName] = useState('');
  const [newShopCountry, setNewShopCountry] = useState('');

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFavDrink, setReviewFavDrink] = useState('');
  const [reviewText, setReviewText] = useState('');

  const API_BASE_URL = '';

  // Load auth from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('bbt_auth_token');
    const savedEmail = localStorage.getItem('bbt_auth_email');
    if (savedToken && savedEmail) {
      setToken(savedToken);
      setUserEmail(savedEmail);
    }
  }, []);

  const handleLogout = () => {
    setToken(null);
    setUserEmail(null);
    localStorage.removeItem('bbt_auth_token');
    localStorage.removeItem('bbt_auth_email');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const result = await signIn(authEmail, authPassword);
        setToken(result.idToken);
        setUserEmail(authEmail);
        localStorage.setItem('bbt_auth_token', result.idToken);
        localStorage.setItem('bbt_auth_email', authEmail);
        setIsAuthOpen(false);
        setAuthPassword('');
      } else if (authMode === 'register') {
        await signUp(authEmail, authPassword);
        setAuthMode('confirm');
      } else if (authMode === 'confirm') {
        await confirmSignUp(authEmail, authConfirmCode);
        alert('Verification successful! Please log in.');
        setAuthMode('login');
        setAuthConfirmCode('');
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred during authentication');
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch all shops
  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/shops`);
      if (!res.ok) throw new Error('Could not fetch shops');
      const data = await res.json();
      setShops(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(
        'Failed to fetch shops. Make sure your FastAPI backend is running!',
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch single shop and its reviews
  const fetchShopDetails = async (shopId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/shops/${shopId}`);
      if (!res.ok) throw new Error('Could not fetch shop details');
      const data = await res.json();
      setSelectedShop(data.shop);
      setReviews(data.reviews);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // Submit new shop
  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName || !newShopCountry) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/shops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: newShopName, country: newShopCountry }),
      });

      if (!res.ok) throw new Error('Failed to add shop');

      setNewShopName('');
      setNewShopCountry('');
      setIsAddShopOpen(false);
      fetchShops();
    } catch (err) {
      alert('Error adding shop. Please check if you are logged in.');
    }
  };

  // Submit new review
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/shops/${selectedShop.id}/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            rating: reviewRating,
            favorite_drinks: reviewFavDrink,
            review_text: reviewText,
          }),
        },
      );

      if (!res.ok) throw new Error('Failed to submit review');

      setReviewRating(5);
      setReviewFavDrink('');
      setReviewText('');
      setIsAddReviewOpen(false);

      // Refresh details and list
      fetchShopDetails(selectedShop.id);
      fetchShops();
    } catch (err) {
      alert('Error submitting review. Please make sure you are logged in.');
    }
  };

  return (
    <div className='flex flex-col min-h-screen'>
      {/* Top Banner / Navbar */}
      <header className='sticky top-0 z-40 w-full border-b border-[#eddcd2]/80 bg-[#fdfaf6]/90 backdrop-blur-md'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='p-2.5 bg-[#8c6239] rounded-xl text-white shadow-md flex items-center justify-center boba-bead'>
              <Milk className='w-6 h-6' />
            </div>
            <div>
              <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-[#2d2219] flex items-center gap-1.5'>
                BBT List{' '}
                <span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e6ccb2] text-[#8c6239]'>
                  MVP
                </span>
              </h1>
              <p className='text-xs text-[#7f6a5b] hidden sm:block'>
                The ultimate guide to bubble tea rankings
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {token ? (
              <>
                <span className='text-xs text-[#7f6a5b] font-medium hidden md:inline'>
                  Logged in as:{' '}
                  <strong className='text-[#2d2219]'>{userEmail}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className='px-3 py-1.5 border border-[#eddcd2] text-xs font-semibold text-[#8c6239] rounded-xl hover:bg-[#f5ebe0] transition-colors'
                >
                  Log Out
                </button>
                <button
                  onClick={() => setIsAddShopOpen(true)}
                  className='flex items-center gap-2 px-4 py-2 bg-[#8c6239] text-white rounded-xl font-medium hover:bg-[#b08968] active:scale-95 transition-all shadow-sm'
                >
                  <Plus className='w-4 h-4' /> Add Tea Shop
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthError(null);
                  setIsAuthOpen(true);
                  setAuthMode('login');
                }}
                className='flex items-center gap-2 px-4 py-2 bg-[#8c6239] text-white rounded-xl font-medium hover:bg-[#b08968] active:scale-95 transition-all shadow-sm'
              >
                Sign In to Rate / Add
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className='flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8'>
        {/* Left Side: Shop list and ranking */}
        <div className='flex-1'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3'>
            <div>
              <h2 className='text-2xl font-bold text-[#2d2219] flex items-center gap-2'>
                <Award className='w-6 h-6 text-[#8c6239]' /> Top Bubble Tea
                Shops
              </h2>
              <p className='text-sm text-[#7f6a5b]'>
                Ranked by customer reviews and ratings
              </p>
            </div>
          </div>

          {error && (
            <div className='p-4 bg-amber-50 border border-amber-200 text-[#8c6239] rounded-xl mb-6 text-sm flex flex-col gap-2 shadow-sm'>
              <span className='font-semibold'>{error}</span>
              <span>
                Backend operations are active. View rankings below or log in to
                submit entries.
              </span>
            </div>
          )}

          {loading ? (
            <div className='grid gap-4'>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className='h-28 rounded-2xl bg-white border border-[#eddcd2]/50 animate-pulse'
                />
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className='text-center py-16 bg-white border border-[#eddcd2] rounded-2xl shadow-sm'>
              <Sparkles className='w-12 h-12 mx-auto text-[#e6ccb2] mb-3' />
              <h3 className='text-lg font-bold text-[#2d2219]'>
                No shops registered yet
              </h3>
              <p className='text-sm text-[#7f6a5b] mt-1 max-w-md mx-auto px-4'>
                Be the first to add a bubble tea shop to BBT List!
              </p>
              {token ? (
                <button
                  onClick={() => setIsAddShopOpen(true)}
                  className='mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#8c6239] text-white rounded-xl font-medium hover:bg-[#b08968] transition-colors'
                >
                  Add Shop Now
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthError(null);
                    setIsAuthOpen(true);
                    setAuthMode('login');
                  }}
                  className='mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#8c6239] text-white rounded-xl font-medium hover:bg-[#b08968] transition-colors'
                >
                  Sign In to Add Shops
                </button>
              )}
            </div>
          ) : (
            <div className='grid gap-4'>
              {shops.map((shop, index) => {
                const isSelected = selectedShop?.id === shop.id;
                return (
                  <div
                    key={shop.id}
                    onClick={() => fetchShopDetails(shop.id)}
                    className={`tea-card p-5 rounded-2xl bg-white cursor-pointer relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                      isSelected
                        ? 'ring-2 ring-[#8c6239] border-transparent'
                        : ''
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className='absolute top-0 left-0 w-12 h-12 bg-[#e6ccb2] text-[#8c6239] font-extrabold flex items-center justify-center rounded-br-2xl text-lg shadow-inner'>
                      #{index + 1}
                    </div>

                    <div className='pl-12 flex-1'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <h3 className='text-lg font-bold text-[#2d2219]'>
                          {shop.name}
                        </h3>
                        <span className='inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f5ebe0] text-[#7f6a5b]'>
                          <Globe className='w-3 h-3' /> {shop.country}
                        </span>
                      </div>

                      {shop.favorite_drink && (
                        <p className='text-sm text-[#7f6a5b] mt-1.5 flex items-center gap-1.5'>
                          <Heart className='w-4 h-4 text-rose-400 fill-rose-400' />
                          Recommended:{' '}
                          <span className='font-medium text-[#2d2219]'>
                            {shop.favorite_drink}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className='flex items-center gap-4 pl-12 sm:pl-0'>
                      <div className='text-right'>
                        <div className='flex items-center gap-1 text-amber-500 justify-end'>
                          <Star className='w-5 h-5 fill-amber-500' />
                          <span className='font-bold text-lg text-[#2d2219]'>
                            {shop.average_rating > 0
                              ? shop.average_rating.toFixed(1)
                              : 'N/A'}
                          </span>
                        </div>
                        <p className='text-xs text-[#7f6a5b] flex items-center gap-1 mt-0.5 justify-end'>
                          <MessageSquare className='w-3.5 h-3.5' />{' '}
                          {shop.review_count} reviews
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Reviews detail panel */}
        <div className='w-full lg:w-96 flex flex-col gap-6'>
          {selectedShop ? (
            <div className='bg-white rounded-2xl border border-[#eddcd2] p-6 shadow-sm sticky top-24'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <h3 className='text-xl font-bold text-[#2d2219]'>
                    {selectedShop.name}
                  </h3>
                  <span className='inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#f5ebe0] text-[#7f6a5b] mt-1'>
                    <Globe className='w-3 h-3' /> {selectedShop.country}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedShop(null)}
                  className='p-1 hover:bg-[#f5ebe0] rounded-full transition-colors'
                >
                  <X className='w-5 h-5 text-[#7f6a5b]' />
                </button>
              </div>

              <div className='flex items-center gap-2 py-3 border-y border-[#eddcd2]/50 mb-4 justify-between'>
                <div>
                  <div className='flex items-center gap-1 text-amber-500'>
                    <Star className='w-5 h-5 fill-amber-500' />
                    <span className='font-bold text-lg text-[#2d2219]'>
                      {selectedShop.average_rating > 0
                        ? selectedShop.average_rating.toFixed(1)
                        : 'N/A'}
                    </span>
                  </div>
                  <p className='text-xs text-[#7f6a5b] mt-0.5'>
                    Average Rating
                  </p>
                </div>
                {token ? (
                  <button
                    onClick={() => setIsAddReviewOpen(true)}
                    className='px-4 py-2 bg-[#8c6239] text-white rounded-xl text-sm font-medium hover:bg-[#b08968] transition-colors flex items-center gap-1.5'
                  >
                    <PlusCircle className='w-4 h-4' /> Add Review
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setIsAuthOpen(true);
                      setAuthMode('login');
                    }}
                    className='px-3 py-1.5 border border-[#eddcd2] text-xs font-semibold text-[#8c6239] rounded-xl hover:bg-[#f5ebe0] transition-colors'
                  >
                    Sign In to Review
                  </button>
                )}
              </div>

              <h4 className='text-sm font-bold text-[#2d2219] uppercase tracking-wider mb-3'>
                Reviews
              </h4>

              {reviews.length === 0 ? (
                <div className='text-center py-8 text-[#7f6a5b] text-sm bg-[#fdfaf6] rounded-xl border border-[#eddcd2]/50 border-dashed'>
                  No reviews yet. Be the first to review!
                </div>
              ) : (
                <div className='grid gap-3 max-h-[350px] overflow-y-auto pr-1'>
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className='p-4 bg-[#fdfaf6] rounded-xl border border-[#eddcd2]/50 text-sm'
                    >
                      <div className='flex justify-between items-start mb-2'>
                        <span
                          className='font-semibold text-[#2d2219] max-w-[150px] truncate'
                          title={review.author}
                        >
                          {review.author.split('@')[0]}
                        </span>
                        <div className='flex items-center gap-0.5 text-amber-500'>
                          <Star className='w-3.5 h-3.5 fill-amber-500' />
                          <span className='font-bold text-xs'>
                            {review.rating}
                          </span>
                        </div>
                      </div>

                      {review.favorite_drinks && (
                        <p className='text-xs font-semibold text-[#8c6239] mb-1 flex items-center gap-1'>
                          <Heart className='w-3 h-3 fill-[#8c6239]' />{' '}
                          Recommended: {review.favorite_drinks}
                        </p>
                      )}

                      {review.review_text && (
                        <p className='text-[#7f6a5b] leading-relaxed text-xs italic'>
                          "{review.review_text}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className='bg-[#f5ebe0]/30 rounded-2xl border border-[#eddcd2]/60 p-8 text-center flex flex-col items-center justify-center h-72 border-dashed'>
              <Milk className='w-10 h-10 text-[#e6ccb2] mb-3 animate-pulse' />
              <h4 className='font-bold text-[#2d2219]'>
                Select a Bubble Tea Shop
              </h4>
              <p className='text-xs text-[#7f6a5b] mt-1 max-w-[200px]'>
                Click on any shop card to view detailed reviews, and add your
                own feedback.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Cognito Auth Modal */}
      {isAuthOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm'>
          <div className='bg-white rounded-2xl border border-[#eddcd2] w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200'>
            <div className='flex justify-between items-center mb-4'>
              <div className='flex items-center gap-2'>
                <Lock className='w-5 h-5 text-[#8c6239]' />
                <h3 className='text-lg font-bold text-[#2d2219]'>
                  {authMode === 'login' && 'Sign In'}
                  {authMode === 'register' && 'Register Account'}
                  {authMode === 'confirm' && 'Verify Email'}
                </h3>
              </div>
              <button
                onClick={() => setIsAuthOpen(false)}
                className='p-1 hover:bg-[#f5ebe0] rounded-full transition-colors'
              >
                <X className='w-5 h-5 text-[#7f6a5b]' />
              </button>
            </div>

            {authError && (
              <div className='p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl mb-4 text-xs font-medium'>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className='space-y-4'>
              {authMode !== 'confirm' ? (
                <>
                  <div>
                    <label className='block text-sm font-medium text-[#7f6a5b] mb-1'>
                      Email Address
                    </label>
                    <input
                      type='email'
                      required
                      placeholder='you@example.com'
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className='w-full px-4 py-2 rounded-xl border border-[#eddcd2] focus:outline-none focus:ring-2 focus:ring-[#8c6239] text-sm text-[#2d2219]'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-[#7f6a5b] mb-1'>
                      Password
                    </label>
                    <input
                      type='password'
                      required
                      placeholder='••••••••'
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className='w-full px-4 py-2 rounded-xl border border-[#eddcd2] focus:outline-none focus:ring-2 focus:ring-[#8c6239] text-sm text-[#2d2219]'
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className='block text-sm font-medium text-[#7f6a5b] mb-1'>
                    Verification Code
                  </label>
                  <p className='text-xs text-[#7f6a5b] mb-2'>
                    We sent a verification code to {authEmail}. Please enter it
                    below.
                  </p>
                  <input
                    type='text'
                    required
                    placeholder='123456'
                    value={authConfirmCode}
                    onChange={(e) => setAuthConfirmCode(e.target.value)}
                    className='w-full px-4 py-2 rounded-xl border border-[#eddcd2] focus:outline-none focus:ring-2 focus:ring-[#8c6239] text-sm text-[#2d2219] font-mono tracking-widest text-center text-lg'
                  />
                </div>
              )}

              <button
                type='submit'
                disabled={authLoading}
                className='w-full py-2.5 bg-[#8c6239] text-white rounded-xl font-medium hover:bg-[#b08968] active:scale-95 transition-all text-sm flex items-center justify-center gap-2'
              >
                {authLoading ? (
                  <span className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></span>
                ) : (
                  <>
                    {authMode === 'login' && (
                      <>
                        <LogIn className='w-4 h-4' /> Sign In
                      </>
                    )}
                    {authMode === 'register' && (
                      <>
                        <UserPlus className='w-4 h-4' /> Register
                      </>
                    )}
                    {authMode === 'confirm' && (
                      <>
                        <Mail className='w-4 h-4' /> Verify Code
                      </>
                    )}
                  </>
                )}
              </button>
            </form>

            <div className='mt-4 pt-4 border-t border-[#eddcd2]/50 text-center text-xs text-[#7f6a5b] flex flex-col gap-2'>
              {authMode === 'login' && (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                    }}
                    className='text-[#8c6239] font-bold hover:underline'
                  >
                    Register here
                  </button>
                </p>
              )}
              {authMode === 'register' && (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                    }}
                    className='text-[#8c6239] font-bold hover:underline'
                  >
                    Sign in here
                  </button>
                </p>
              )}
              {authMode === 'confirm' && (
                <p>
                  Need to verify a different account?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                    }}
                    className='text-[#8c6239] font-bold hover:underline'
                  >
                    Back to Register
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Shop Modal */}
      {isAddShopOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm'>
          <div className='bg-white rounded-2xl border border-[#eddcd2] w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-bold text-[#2d2219]'>
                Add a New Bubble Tea Shop
              </h3>
              <button
                onClick={() => setIsAddShopOpen(false)}
                className='p-1 hover:bg-[#f5ebe0] rounded-full transition-colors'
              >
                <X className='w-5 h-5 text-[#7f6a5b]' />
              </button>
            </div>
            <form onSubmit={handleAddShop} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-[#7f6a5b] mb-1'>
                  Shop Name
                </label>
                <input
                  type='text'
                  required
                  placeholder='e.g. Gong Cha, Tiger Sugar'
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  className='w-full px-4 py-2 rounded-xl border border-[#eddcd2] focus:outline-none focus:ring-2 focus:ring-[#8c6239] text-sm text-[#2d2219]'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-[#7f6a5b] mb-1'>
                  Origin Country
                </label>
                <input
                  type='text'
                  required
                  placeholder='e.g. Taiwan, Canada'
                  value={newShopCountry}
                  onChange={(e) => setNewShopCountry(e.target.value)}
                  className='w-full px-4 py-2 rounded-xl border border-[#eddcd2] focus:outline-none focus:ring-2 focus:ring-[#8c6239] text-sm text-[#2d2219]'
                />
              </div>
              <button
                type='submit'
                className='w-full py-2.5 bg-[#8c6239] text-white rounded-xl font-medium hover:bg-[#b08968] transition-colors text-sm'
              >
                Create Shop Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Review Modal */}
      {isAddReviewOpen && selectedShop && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm'>
          <div className='bg-white rounded-2xl border border-[#eddcd2] w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200'>
            <div className='flex justify-between items-center mb-4'>
              <div>
                <h3 className='text-lg font-bold text-[#2d2219]'>
                  Review {selectedShop.name}
                </h3>
                <p className='text-xs text-[#7f6a5b]'>
                  Share your BBT experience
                </p>
              </div>
              <button
                onClick={() => setIsAddReviewOpen(false)}
                className='p-1 hover:bg-[#f5ebe0] rounded-full transition-colors'
              >
                <X className='w-5 h-5 text-[#7f6a5b]' />
              </button>
            </div>
            <form onSubmit={handleAddReview} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-[#7f6a5b] mb-1'>
                  Rating
                </label>
                <div className='flex gap-2'>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type='button'
                      onClick={() => setReviewRating(star)}
                      className='p-1 transition-transform active:scale-95'
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= reviewRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-[#eddcd2]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-[#7f6a5b] mb-1'>
                  Favorite Drink Recommend
                </label>
                <input
                  type='text'
                  placeholder='e.g. Brown Sugar Pearl Milk Tea'
                  value={reviewFavDrink}
                  onChange={(e) => setReviewFavDrink(e.target.value)}
                  className='w-full px-4 py-2 rounded-xl border border-[#eddcd2] focus:outline-none focus:ring-2 focus:ring-[#8c6239] text-sm text-[#2d2219]'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-[#7f6a5b] mb-1'>
                  Review Details
                </label>
                <textarea
                  rows={3}
                  placeholder='What makes this shop stand out? How are the pearls?'
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className='w-full px-4 py-2 rounded-xl border border-[#eddcd2] focus:outline-none focus:ring-2 focus:ring-[#8c6239] text-sm text-[#2d2219]'
                />
              </div>
              <button
                type='submit'
                className='w-full py-2.5 bg-[#8c6239] text-white rounded-xl font-medium hover:bg-[#b08968] transition-colors text-sm'
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className='w-full border-t border-[#eddcd2]/80 py-6 bg-[#fdfaf6]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-[#7f6a5b]'>
          <p>© 2026 BBT List. Crafted with bubble tea passion.</p>
        </div>
      </footer>
    </div>
  );
}
