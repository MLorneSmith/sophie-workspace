'use client';

import React, { useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Button } from '@kit/ui/button';

interface ViewCertificateButtonProps {
  userId: string;
  courseId: string;
}

interface CourseProgressData {
  certificate_url: string | null;
}

const ViewCertificateButton: React.FC<ViewCertificateButtonProps> = ({
  userId,
  courseId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase();

  useEffect(() => {
    let isMounted = true;

    async function fetchCertificateUrl() {
      try {
        console.log(
          'Fetching certificate URL for user:',
          userId,
          'and course:',
          courseId,
        );

        if (!userId || !courseId) {
          throw new Error('Missing required user or course information');
        }

        const { data, error: supabaseError } = await supabase
          .from('course_progress')
          .select('certificate_url')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .single();

        if (supabaseError) {
          // Handle "no rows returned" differently than other errors
          if (supabaseError.code === 'PGRST116') {
            console.log('No certificate found yet for this course');
            if (isMounted) {
              setCertificateUrl(null);
              setError(null);
            }
            return;
          }
          throw supabaseError;
        }

        if (isMounted) {
          console.log('Certificate URL fetched:', data?.certificate_url);
          setCertificateUrl(data?.certificate_url);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching certificate URL:', err);
        if (isMounted) {
          setError('Failed to fetch certificate information');
          setCertificateUrl(null);
        }
      }
    }

    fetchCertificateUrl();

    return () => {
      isMounted = false;
    };
  }, [supabase, userId, courseId]);

  const handleViewCertificate = async () => {
    if (!certificateUrl) {
      toast.error(
        error || 'Certificate not available. Please complete the course first.',
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/get-certificate?filename=${encodeURIComponent(certificateUrl)}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // Use a more user-friendly filename
      a.download = `course-certificate-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded successfully');
    } catch (err) {
      console.error('Error downloading certificate:', err);
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to download certificate. Please try again.',
      );
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
      {isLoading ? 'Downloading...' : 'Download Certificate'}
    </Button>
  );
};

export default ViewCertificateButton;
