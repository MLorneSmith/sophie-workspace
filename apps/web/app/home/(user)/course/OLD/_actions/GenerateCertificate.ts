import fs from 'fs';
import path from 'path';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

interface PdfCoResponse {
  url: string;
  error: boolean;
  status: number;
  name: string;
}

interface PresignedUrlResponse {
  presignedUrl: string;
  url: string;
}

async function getPresignedUrl(
  apiKey: string,
  fileName: string,
): Promise<PresignedUrlResponse> {
  const response = await fetch(
    'https://api.pdf.co/v1/file/upload/get-presigned-url?name=' + fileName,
    {
      method: 'GET',
      headers: { 'x-api-key': apiKey },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get presigned URL: ${response.statusText}`);
  }

  return response.json();
}

async function uploadFile(
  presignedUrl: string,
  fileContent: Buffer,
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: fileContent,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }
}

export async function generateCertificate(
  userId: string,
  courseId: string,
  completionDate: string,
) {
  console.log('Starting certificate generation process');
  console.log(`User ID: ${userId}`);
  console.log(`Course ID: ${courseId}`);
  console.log(`Completion Date: ${completionDate}`);

  const pdfCoApiKey = process.env.PDF_CO_API_KEY;
  if (!pdfCoApiKey) {
    console.error('PDF_CO_API_KEY is not set in the environment variables');
    throw new Error('PDF_CO_API_KEY is not set in the environment variables');
  }

  // Verify API key format
  if (!pdfCoApiKey.includes('@') || !pdfCoApiKey.includes('_')) {
    console.error('PDF_CO_API_KEY is not in the correct format');
    throw new Error(
      'PDF_CO_API_KEY is not in the correct format. It should be in the form: email_apikey',
    );
  }

  console.log('PDF_CO_API_KEY format is correct');

  try {
    // Fetch user's name from the database
    const supabase = getSupabaseServerClient();
    console.log('Supabase client created');

    console.log('Fetching user data from accounts table');
    const { data: userData, error: userError } = await supabase
      .from('accounts')
      .select('name')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      console.error('Error details:', JSON.stringify(userError, null, 2));
      throw new Error(`Failed to fetch user data: ${userError.message}`);
    }

    if (!userData) {
      console.error('No user data found for ID:', userId);
      throw new Error('User not found');
    }

    const studentName = userData.name || 'Student';
    console.log('Student Name:', studentName);

    console.log('Current working directory:', process.cwd());
    const certificateFormPath = path.join(
      process.cwd(),
      'public',
      'certificates',
      'ddm_certificate_form.pdf',
    );
    console.log('Full certificate form path:', certificateFormPath);

    if (!fs.existsSync(certificateFormPath)) {
      console.error(
        'Certificate form template not found at:',
        certificateFormPath,
      );
      throw new Error('Certificate form template not found');
    }

    // Read the file
    const fileBuffer = fs.readFileSync(certificateFormPath);

    // Get presigned URL
    console.log('Getting presigned URL for file upload');
    const { presignedUrl, url } = await getPresignedUrl(
      pdfCoApiKey,
      'ddm_certificate_form.pdf',
    );

    // Upload file
    console.log('Uploading file to presigned URL');
    await uploadFile(presignedUrl, fileBuffer);

    // Prepare the request to pdf.co API
    const requestBody = {
      name: 'result.pdf',
      url: url,
      annotations: [
        {
          type: 'text',
          text: studentName,
          x: 264.96,
          y: 352.55,
          width: 337.08,
          height: 28.8,
          font: 'Arial',
          fontsize: 14,
          color: '000000',
        },
        {
          type: 'text',
          text: completionDate,
          x: 271.92,
          y: 500.51,
          width: 99.96,
          height: 28.8,
          font: 'Arial',
          fontsize: 14,
          color: '000000',
        },
      ],
      async: false,
    };

    console.log('Calling pdf.co API to fill form');
    const response = await fetch('https://api.pdf.co/v1/pdf/edit/add', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('pdf.co API error:', response.status, errorText);
      throw new Error(`pdf.co API error: ${response.status} ${errorText}`);
    }

    const data: PdfCoResponse = await response.json();

    if (data.error) {
      console.error('pdf.co API returned an error:', data);
      throw new Error(`pdf.co API error: ${data.name}`);
    }

    // Generate a unique filename
    const filename = `${studentName.replace(/\s+/g, '_')}_${Date.now()}_certificate.pdf`;
    const outputPath = path.join(
      process.cwd(),
      'public',
      'certificates',
      filename,
    );

    console.log('Downloading filled PDF from:', data.url);
    const fileResponse = await fetch(data.url);
    if (!fileResponse.ok) {
      throw new Error(
        `Failed to download filled PDF: ${fileResponse.statusText}`,
      );
    }
    const fileArrayBuffer = await fileResponse.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(fileArrayBuffer));

    console.log('Certificate generated successfully:', outputPath);

    // Return the filename of the generated certificate
    return filename;
  } catch (error) {
    console.error('Error during certificate generation:', error);
    throw new Error('CertificateGenerationError: ' + (error as Error).message);
  }
}
