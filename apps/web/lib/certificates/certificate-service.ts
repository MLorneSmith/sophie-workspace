import { getSupabaseServerClient } from '@kit/supabase/server-client';

interface GenerateCertificateParams {
  userId: string;
  courseId: string;
  fullName: string;
}

export async function generateCertificate({
  userId,
  courseId,
  fullName,
}: GenerateCertificateParams) {
  // 1. Get PDF.co API key from environment variables
  const pdfCoApiKey = process.env.PDF_CO_API_KEY;

  if (!pdfCoApiKey) {
    throw new Error('PDF_CO_API_KEY is not defined in environment variables');
  }

  // 2. Get the field names from the certificate form
  console.log('Getting field names from certificate form');

  // Use the correct path to the certificate template
  const fs = require('fs');
  const path = require('path');
  const appDir = path.join(process.cwd(), 'apps', 'web');
  const templatePath = path.join(
    appDir,
    'lib',
    'certificates',
    'templates',
    'ddm_certificate_form.pdf',
  );

  console.log('Certificate template path:', templatePath);

  // Check if the file exists
  if (!fs.existsSync(templatePath)) {
    console.error('Certificate template file not found at path:', templatePath);
    throw new Error(
      `Certificate template file not found at path: ${templatePath}`,
    );
  }

  // Read the certificate template
  const certificateTemplate = fs.readFileSync(templatePath);
  const certificateTemplateBase64 =
    Buffer.from(certificateTemplate).toString('base64');

  const fieldInfoResponse = await fetch(
    'https://api.pdf.co/v1/pdf/info/fields',
    {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Use the base64-encoded template
        file: certificateTemplateBase64,
        async: false,
      }),
    },
  );

  const fieldInfo = await fieldInfoResponse.json();

  if (fieldInfo.error) {
    throw new Error(`Failed to get field info: ${fieldInfo.message}`);
  }

  // Extract the field name for the name field
  // This assumes the field name is something like "name" or "fullName"
  // We'll need to inspect the actual field name from the response
  let nameFieldName = '';
  if (fieldInfo.info?.FieldsInfo?.Fields) {
    const fields = fieldInfo.info.FieldsInfo.Fields;
    // Look for a field that might be for the name
    const nameField = fields.find(
      (field: any) =>
        field.FieldName.toLowerCase().includes('name') ||
        field.Type === 'EditBox',
    );

    if (nameField) {
      nameFieldName = nameField.FieldName;
    } else if (fields.length > 0) {
      // If we can't find a name field, use the first field
      nameFieldName = fields[0].FieldName;
    } else {
      throw new Error('No fields found in the certificate form');
    }
  } else {
    throw new Error('Failed to get field info: Invalid response format');
  }

  // 3. Fill the form with the user's name
  console.log('Filling form with user name:', fullName);
  console.log('Using field name:', nameFieldName);

  const fillFormResponse = await fetch('https://api.pdf.co/v1/pdf/edit/add', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Use the same base64-encoded template
      file: certificateTemplateBase64,
      name: `certificate-${userId}-${courseId}.pdf`,
      async: false,
      fields: [
        {
          fieldName: nameFieldName,
          pages: '0',
          text: fullName,
        },
      ],
    }),
  });

  const fillFormResult = await fillFormResponse.json();

  if (fillFormResult.error) {
    throw new Error(`Failed to fill form: ${fillFormResult.message}`);
  }

  // 4. Download the filled form
  const certificateUrl = fillFormResult.url;
  const certificateResponse = await fetch(certificateUrl);
  const certificateBuffer = await certificateResponse.arrayBuffer();

  // 5. Store the certificate in Supabase Storage
  console.log('Storing certificate in Supabase Storage');

  const supabase = getSupabaseServerClient();

  // Check if the certificates bucket exists, create it if it doesn't
  console.log('Checking if certificates bucket exists');

  const { data: buckets, error: bucketsError } =
    await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('Failed to list buckets:', bucketsError.message);
    throw new Error(`Failed to list buckets: ${bucketsError.message}`);
  }

  const certificatesBucket = buckets?.find(
    (bucket) => bucket.name === 'certificates',
  );

  if (!certificatesBucket) {
    console.log('Certificates bucket does not exist, creating it');

    const { error: createBucketError } = await supabase.storage.createBucket(
      'certificates',
      {
        public: true, // Make it public so we can access the files
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 10485760, // 10MB
      },
    );

    if (createBucketError) {
      console.error(
        'Failed to create certificates bucket:',
        createBucketError.message,
      );
      throw new Error(
        `Failed to create certificates bucket: ${createBucketError.message}`,
      );
    }

    console.log('Created certificates bucket successfully');
  } else {
    console.log('Certificates bucket already exists');
  }

  const fileName = `${userId}/${courseId}/${Date.now()}.pdf`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('certificates')
    .upload(fileName, certificateBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload certificate: ${uploadError.message}`);
  }

  // 6. Get the public URL for the certificate
  const { data: urlData } = await supabase.storage
    .from('certificates')
    .getPublicUrl(fileName);

  // 7. Store the certificate information in the database
  // Using raw SQL query since the certificates table might not be in the TypeScript types yet
  const { data: certificateData, error: certificateError } = await supabase.rpc(
    'insert_certificate',
    {
      p_user_id: userId,
      p_course_id: courseId,
      p_file_path: fileName,
    },
  );

  if (certificateError) {
    throw new Error(
      `Failed to store certificate information: ${certificateError.message}`,
    );
  }

  // Get the certificate ID from the returned data
  const certificateId =
    Array.isArray(certificateData) && certificateData.length > 0
      ? certificateData[0]?.id
      : null;

  // 8. Update the course_progress table to mark the certificate as generated
  const { error: updateError } = await supabase
    .from('course_progress')
    .update({ certificate_generated: true })
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (updateError) {
    throw new Error(`Failed to update course progress: ${updateError.message}`);
  }

  return {
    certificateId: certificateId,
    certificateUrl: urlData.publicUrl,
  };
}
