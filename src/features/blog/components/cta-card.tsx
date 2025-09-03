'use client';

import { Button } from '@/ui/components/button';
import { ArrowRight, BookOpen, Users } from 'lucide-react';
import Link from 'next/link';

export function CTACard() {
  return (
    <div className="col-span-full lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
      <div className="max-w-sm mx-auto">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold mb-3">
          Join Our Community
        </h3>
        
        <p className="text-blue-100 mb-6 leading-relaxed">
          Get access to exclusive content, developer insights, and stay updated with the latest tech trends.
        </p>
        
        <div className="space-y-3">
          <Link href="/auth/signup">
            <Button 
              size="lg" 
              className="w-full bg-white text-blue-600 hover:bg-gray-100"
            >
              Sign Up Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          
          <Link href="/auth/signin">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full border-white/30 text-white hover:bg-white/10"
            >
              Sign In
            </Button>
          </Link>
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center justify-center gap-1 text-blue-100 text-sm">
            <Users className="w-4 h-4" />
            <span>Join 10,000+ developers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
