"use client"

import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-12">
          <h1 className="text-2xl font-bold">
            {'DisCouponGen'.split('').map((char, i) => (
              <span key={i} style={{ color: ['#e53e3e','#dd6b20','#d69e2e','#38a169','#3182ce','#805ad5','#d53f8c','#e53e3e','#dd6b20','#d69e2e','#38a169','#3182ce'][i % 12] }}>{char}</span>
            ))}
          </h1>
          <div>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-4">
                <Link 
                  href="/product" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Go to App
                </Link>
                <UserButton showName={true} />
              </div>
            </SignedIn>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center py-24">
          <h2 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
             Domestic Flight Booking
            <br />
             Discount Coupon Generator
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Designed by Pankaj
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Powered by Gemini
          </p>
          
          {/* Pricing Preview */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-6 max-w-sm mx-auto mb-8">
            <h3 className="text-2xl font-bold mb-2">Premium Subscription</h3>
            <p className="text-4xl font-bold text-blue-600 mb-2">$5<span className="text-lg text-gray-600">/month</span></p>
            <ul className="text-left text-gray-600 dark:text-gray-400 mb-6">
              <li className="mb-2">✓ Get Exclusive Coupons</li>
              <li className="mb-2">✓ Additional 5% cashback</li>
              <li className="mb-2">✓ Get automated emails for New Coupons</li>
            </ul>
          </div>
          
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105">
                Start Your Free Trial
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/product">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105">
                Access Premium Features
              </button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </main>
  );
}