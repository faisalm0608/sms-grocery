'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen }: LoginModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      router.push('/login');
    }
  }, [isOpen, router]);

  return null;
}
