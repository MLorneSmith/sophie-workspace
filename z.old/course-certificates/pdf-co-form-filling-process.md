# PDF.co Form Filling Process Documentation

This document provides a detailed explanation of how to use PDF.co to fill PDF forms, specifically for the certificate generation system in the SlideHeroes application.

## What is PDF.co?

PDF.co is a web API service that provides various PDF processing capabilities, including:

- PDF form filling
- PDF to HTML conversion
- PDF text extraction
- PDF merging and splitting
- And more

## PDF.co Form Filling Process

### 1. Authentication

PDF.co uses API keys for authentication. The API key should be stored in environment variables:

```
PDF_CO_API_KEY=your-api-key
```

### 2. Identifying Form Fields

Before filling a PDF form, you need to identify the field names in the form. PDF.co provides an API endpoint for this purpose:

```typescript
// Get the field names from the certificate form
const fieldInfoResponse = await fetch('https://api.pdf.co/v1/pdf/info/fields', {
  method: 'POST',
  headers: {
    'x-api-key': pdfCoApiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/ddm_certificate_form.pdf`,
    async: false,
  }),
});

const fieldInfo = await fieldInfoResponse.json();
```

The response will include a list of all form fields in the PDF, including their names, types, and other properties.

### 3. Filling Form Fields

Once you have identified the field names, you can use the PDF.co API to fill the form:

```typescript
// Fill the form with the user's name
const fillFormResponse = await fetch('https://api.pdf.co/v1/pdf/edit/add', {
  method: 'POST',
  headers: {
    'x-api-key': pdfCoApiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/ddm_certificate_form.pdf`,
    name: `certificate-${userId}-${courseId}.pdf`,
    async: false,
    fields: [
      {
        fieldName: 'name', // This will need to be updated with the actual field name
        pages: '0',
        text: fullName,
      },
    ],
  }),
});

const fillFormResult = await fillFormResponse.json();
```

The `fields` array contains objects with the following properties:

- `fieldName`: The name of the form field to fill
- `pages`: The page number(s) where the field is located (0-based)
- `text`: The text to fill the field with

### 4. Handling the Response

The API returns a JSON response with:

- `error`: Boolean indicating if an error occurred
- `url`: URL to download the filled PDF (if successful)
- `message`: Error message (if error is true)

```typescript
if (fillFormResult.error) {
  throw new Error(`Failed to fill form: ${fillFormResult.message}`);
}

// Get the URL to download the filled PDF
const certificateUrl = fillFormResult.url;
```

### 5. Downloading the Filled PDF

You can download the filled PDF using the URL returned in the response:

```typescript
// Download the filled form
const certificateResponse = await fetch(certificateUrl);
const certificateBuffer = await certificateResponse.arrayBuffer();
```

### 6. Storing the Filled PDF

After downloading the filled PDF, you can store it in your preferred storage solution. In our case, we're using Supabase Storage:

```typescript
// Store the certificate in Supabase Storage
const supabase = getSupabaseServerClient();
const fileName = `certificates/${userId}/${courseId}/${Date.now()}.pdf`;

const { data: uploadData, error: uploadError } = await supabase.storage
  .from('certificates')
  .upload(fileName, certificateBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  });

if (uploadError) {
  throw new Error(`Failed to upload certificate: ${uploadError.message}`);
}
```

## Complete Example

Here's a complete example of how to use PDF.co to fill a PDF form and store it in Supabase Storage:

```typescript
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
  const fieldInfoResponse = await fetch(
    'https://api.pdf.co/v1/pdf/info/fields',
    {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/ddm_certificate_form.pdf`,
        async: false,
      }),
    },
  );

  const fieldInfo = await fieldInfoResponse.json();

  if (fieldInfo.error) {
    throw new Error(`Failed to get field info: ${fieldInfo.message}`);
  }

  // 3. Fill the form with the user's name
  const fillFormResponse = await fetch('https://api.pdf.co/v1/pdf/edit/add', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/ddm_certificate_form.pdf`,
      name: `certificate-${userId}-${courseId}.pdf`,
      async: false,
      fields: [
        {
          fieldName: 'name', // This will need to be updated with the actual field name
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
  const supabase = getSupabaseServerClient();
  const fileName = `certificates/${userId}/${courseId}/${Date.now()}.pdf`;

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
  const { data: certificateData, error: certificateError } = await supabase
    .from('certificates')
    .insert({
      user_id: userId,
      course_id: courseId,
      file_path: fileName,
    })
    .select()
    .single();

  if (certificateError) {
    throw new Error(
      `Failed to store certificate information: ${certificateError.message}`,
    );
  }

  return {
    certificateId: certificateData.id,
    certificateUrl: urlData.publicUrl,
  };
}
```

## Additional PDF.co Features

PDF.co offers many other features that could be useful for the certificate generation system:

### 1. Asynchronous Processing

For large PDFs or batch processing, you can use the asynchronous mode:

```typescript
body: JSON.stringify({
  url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/ddm_certificate_form.pdf`,
  name: `certificate-${userId}-${courseId}.pdf`,
  async: true, // Set to true for asynchronous processing
  fields: [
    {
      fieldName: 'name',
      pages: '0',
      text: fullName,
    },
  ],
}),
```

With asynchronous processing, you'll need to poll the API to check the status of the job.

### 2. Batch Processing

You can process multiple PDFs in a single request:

```typescript
body: JSON.stringify({
  urls: [
    `${process.env.NEXT_PUBLIC_APP_URL}/certificates/ddm_certificate_form.pdf`,
    `${process.env.NEXT_PUBLIC_APP_URL}/certificates/other_form.pdf`,
  ],
  names: [
    `certificate-${userId}-${courseId}.pdf`,
    `other-certificate-${userId}-${courseId}.pdf`,
  ],
  async: false,
  fields: [
    {
      fieldName: 'name',
      pages: '0',
      text: fullName,
    },
  ],
}),
```

### 3. PDF Encryption

You can encrypt the generated PDF with a password:

```typescript
body: JSON.stringify({
  url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/ddm_certificate_form.pdf`,
  name: `certificate-${userId}-${courseId}.pdf`,
  async: false,
  fields: [
    {
      fieldName: 'name',
      pages: '0',
      text: fullName,
    },
  ],
  encrypt: {
    userPassword: 'user-password',
    ownerPassword: 'owner-password',
    encryptionLevel: 'AES_128',
  },
}),
```

### 4. PDF Merging

You can merge multiple PDFs into a single PDF:

```typescript
const mergeResponse = await fetch('https://api.pdf.co/v1/pdf/merge', {
  method: 'POST',
  headers: {
    'x-api-key': pdfCoApiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    urls: [
      `${process.env.NEXT_PUBLIC_APP_URL}/certificates/cover.pdf`,
      certificateUrl,
      `${process.env.NEXT_PUBLIC_APP_URL}/certificates/back.pdf`,
    ],
    name: `complete-certificate-${userId}-${courseId}.pdf`,
    async: false,
  }),
});
```

## Conclusion

PDF.co provides a powerful and flexible API for filling PDF forms. By following the steps outlined in this document, you can easily integrate PDF.co into your application to generate certificates for your users.
