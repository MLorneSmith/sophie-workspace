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
      'f29a9ff2-094b-4c10-a40b-a2dcec2168f1', 
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
      'c5eb1e4d-45ae-4f44-80e7-2afb1ec9252e', 
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
      '2f1380b7-e18d-43a2-bc82-b52cb8f2b9fe', 
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
      '6813f1b3-5a5e-40ec-8743-8e2228bb428e', 
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
      '7d4fb8c6-6685-4f79-8deb-d602be1d4e01', 
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
      'fbb06a37-25a8-44aa-88a7-11e0e8ece116', 
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
      '797b18a9-e150-49ff-816e-884d7fc5a2f1', 
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
      'ea01e869-68d4-4cea-84b2-40603df0feac', 
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
      '47628877-3fa4-4e62-86b8-8c6ee49f5171', 
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
      'ca2ee205-6dac-42f9-bdef-f796005be823', 
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
      '583e314f-fa7e-4d24-9b1a-bf1b7e89a04d', 
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
      '70bb61c8-63d3-4757-94a4-66e6351e2262', 
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
      '9a3eb70e-0f34-42bc-9c8e-d3e5fff0398c', 
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
      '069a0354-eab6-4cdf-83e8-a0ad40e7d801', 
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
      'b74602fb-9440-4cf4-a7c1-fdacb3643ccb', 
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
      '417303bc-48cb-478c-ac16-aaf5997dac14', 
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
      'b0b21e80-299d-46ba-8bac-293f5c53bb25', 
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

