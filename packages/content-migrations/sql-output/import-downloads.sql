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
      '9d482856-6860-4db3-ab41-8cfed5a258bf', 
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
      'f74efc63-a67c-42b7-a3b5-79c826508d72', 
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
      '9a5c2097-442e-47e3-98d1-33eab60742c6', 
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
      '5ff63fc3-0005-4cb4-ae9d-61d68c0d0cd2', 
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
      '59d98c3f-7594-4d40-a2f1-54fbb2520452', 
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
      '005507bd-ea99-426c-805a-d17c2451aa66', 
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
      '44f2d97b-2adb-44a4-af87-bcb77705dff5', 
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
      '85457c08-a88b-41b5-9cc0-ffe5ac9f84bd', 
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
      'aec828c4-6c2e-429d-aa68-aed49038519d', 
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
      'beb231c2-c873-493b-be6c-f9a8179c3065', 
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
      'd94d25ce-2bc0-459b-b843-47d4d274ac67', 
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
      '6ab40196-7ea4-44d6-91bd-bfa312d2f0c7', 
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
      '7293f57e-853e-444a-9fea-d28acb00fdea', 
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
      'e2f9d4cf-2d75-420c-a710-8004c3440f68', 
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
      '66b52334-d66c-4998-867f-939bbab1bda7', 
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
      '8e90cfca-a722-47bd-8b2a-3b2bd992a412', 
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
      '5cc8241c-babe-4bd3-86b2-7141740e716d', 
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

