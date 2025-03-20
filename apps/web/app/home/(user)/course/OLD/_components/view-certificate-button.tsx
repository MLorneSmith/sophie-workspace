'use client';

import React, { useEffect, useState } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';

interface ViewCertificateButtonProps {
  userId: string;
  courseId: string;
}

const ViewCertificateButton: React.FC<ViewCertificateButtonProps> = ({
  userId,
  courseId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCertificateUrl() {
      console.log(
        'Fetching certificate URL for user:',
        userId,
        'and course:',
        courseId,
      );

      try {
        const response = await fetch(
          `/api/certificates?userId=${userId}&courseId=${courseId}`,
        );
        if (!response.ok) {
          throw new Error('Failed to fetch certificate URL');
        }
        const data = await response.json();
        console.log('Certificate URL fetched:', data.certificateUrl);
        setCertificateUrl(data.certificateUrl);
      } catch (error) {
        console.error('Error fetching certificate URL:', error);
      }
    }

    fetchCertificateUrl();
  }, [userId, courseId]);

  const handleViewCertificate = async () => {
    if (!certificateUrl) {
      toast.error('Certificate not found. Please complete the course first.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/certificates/download?filename=${certificateUrl}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = certificateUrl;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error fetching certificate:', err);
      toast.error('Failed to retrieve certificate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleViewCertificate}
      variant="default"
      disabled={isLoading || !certificateUrl}
    >
      {isLoading ? 'Loading...' : 'Download Certificate'}
    </Button>
  );
};

export default ViewCertificateButton;
