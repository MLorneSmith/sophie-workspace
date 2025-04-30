-- SQL statements for inserting downloads
-- Run these statements directly against your database

-- Insert record for 201 Our Process.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      'c33ff344-e8cc-4af5-8709-ef3a0ac57619', 
      '201 Our Process.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf',
      'Our Process Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 202 The Who.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      'bb75c6cf-e0d6-4097-a838-018938ce7fa6', 
      '202 The Who.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf',
      'The Who Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 203 The Why Introductions.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      'eb1b99e7-f5ac-40b2-85ba-7bfe6c5488e0', 
      '203 The Why Introductions.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/203%20The%20Why%20-%20Introductions.pdf',
      'The Why - Introductions Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 204 The Why Next Steps.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '9040774b-b09b-46b9-89b3-c5bb3cca33fc', 
      '204 The Why Next Steps.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/204%20The%20Why%20-%20Next%20Steps.pdf',
      'The Why - Next Steps Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 205 Idea Generation.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '08b52b9d-6635-44ce-a79c-741318058a95', 
      '205 Idea Generation.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/205%20Idea%20Generation.pdf',
      'Idea Generation Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 206 What is Structure.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      'fa8770ab-9b7f-42b6-aa9d-e659cefdc189', 
      '206 What is Structure.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/206%20What%20is%20Structure.pdf',
      'What is Structure Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 207 Using Stories.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '44c2a19f-d840-4871-ab94-18d384829449', 
      '207 Using Stories.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/207%20Using%20Stories.pdf',
      'Using Stories Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 208 Storyboards in Presentations.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '3236aa16-b7c3-4223-9bec-74a82bca8251', 
      '208 Storyboards in Presentations.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/208%20Storyboards%20in%20Presentations.pdf',
      'Storyboards in Presentations Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 209 Visual Perception and Communication.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '606007ee-8fe8-4ed4-9ce7-ce3938cb4f4f', 
      '209 Visual Perception and Communication.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/209%20Visual%20Perception.pdf',
      'Visual Perception and Communication Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 210 Fundamental Elements of Design.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '76b7e8c0-ffd9-4225-932e-936664023b4c', 
      '210 Fundamental Elements of Design.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/210%20Fundamental%20Elements.pdf',
      'Fundamental Elements of Design Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 211 Gestalt Principles.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '523cf77a-5e55-46da-ad35-6cae0621546c', 
      '211 Gestalt Principles.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/504%20Gestalt%20Principles%20of%20Visual%20Perception.pdf',
      'Gestalt Principles Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 212 Slide Composition.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '6350326a-43bc-4d82-b33a-b99701d0acef', 
      '212 Slide Composition.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/212%20Slide%20Composition.pdf',
      'Slide Composition Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 213 Tables vs Graphs.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '9d794860-0f43-4cba-ac63-1b47f5e57ae2', 
      '213 Tables vs Graphs.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/213%20Tables%20vs%20Graphs.pdf',
      'Tables vs Graphs Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 214 Standard Graphs.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      'd777652d-662e-41f7-af25-48bc4896c998', 
      '214 Standard Graphs.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/214%20Standard%20Graphs.pdf',
      'Standard Graphs Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for 215 Fact-based Persuasion.pdf
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", filesize, "fileSize", 
      width, height, focal_x, focal_y, "focalX", "focalY", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '8ddb128c-3c31-45a3-93be-264459c0dc4b', 
      '215 Fact-based Persuasion.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/601%20Fact-based%20Persuasion%20Overview.pdf',
      'Fact-based Persuasion Slides',
      'reference',
      'application/pdf',
      'application/pdf',
      0,
      0,
      0,
      0,
      50,
      50,
      50,
      50,
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for SlideHeroes Presentation Template.zip
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      'bec3138b-a914-44ea-99f7-b2e30dd2fe49', 
      'SlideHeroes Presentation Template.zip',
      'https://downloads.slideheroes.com/SlideHeroes%20Presentation%20Template.zip',
      'SlideHeroes Presentation Template',
      'pptx_template',
      'application/zip',
      'application/zip',
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

-- Insert record for SlideHeroes Swipe File.zip
INSERT INTO payload.downloads (
      id, filename, url, title, type, mime_type, "mimeType", 
      thumbnail_url, "thumbnailURL", "thumbnail_u_r_l", "thumbnailUrl",
      
      -- Size variant columns for thumbnail
      sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, 
      sizes_thumbnail_mime_type, sizes_thumbnail_file_size, sizes_thumbnail_filesize,
      "sizes_thumbnail_mimeType", "sizes_thumbnail_fileSize", sizes_thumbnail_u_r_l,
      sizes_thumbnail_filename,
      
      -- Size variant columns for medium
      sizes_medium_url, sizes_medium_width, sizes_medium_height, 
      sizes_medium_mime_type, sizes_medium_file_size, sizes_medium_filesize,
      "sizes_medium_mimeType", "sizes_medium_fileSize", sizes_medium_u_r_l,
      sizes_medium_filename,
      
      -- Size variant columns for large
      sizes_large_url, sizes_large_width, sizes_large_height, 
      sizes_large_mime_type, sizes_large_file_size, sizes_large_filesize,
      "sizes_large_mimeType", "sizes_large_fileSize", sizes_large_u_r_l,
      sizes_large_filename,
      
      created_at, updated_at
    ) VALUES (
      '62ab27d3-2eed-41cf-9a11-ac7f9378f582', 
      'SlideHeroes Swipe File.zip',
      'https://downloads.slideheroes.com/SlideHeroes%20Swipe%20File.zip',
      'SlideHeroes Swipe File',
      'reference',
      'application/zip',
      'application/zip',
      NULL,
      NULL,
      NULL,
      NULL,
      
      -- Thumbnail variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- thumbnail filename
      
      -- Medium variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- medium filename
      
      -- Large variants set to NULL
      NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      NULL, -- large filename
      
      NOW(),
      NOW()
    );

