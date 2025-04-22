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
      'e61916ea-cf50-428a-a0c7-a380f6bc2a5d', 
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
      '6dd21f09-bcd2-4cbc-bb24-f75c92fbba6c', 
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
      'c9d14bd1-edb0-4fea-a189-5922be16aa0c', 
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
      '43b00f66-57af-4817-b5cf-311ffe23912e', 
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
      'e7de7d93-2137-4e97-8012-9b9c26c5968e', 
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
      '4005020c-61a1-44e3-9274-4074dd427469', 
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
      'de9b358b-8d75-4573-a6a4-b6d33a33799b', 
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
      'b893dce7-75ed-475f-af3b-c5aac45ef456', 
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
      '6abc5ae4-ff4a-487e-8b9f-1bf53d50aff4', 
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
      '17b24b1a-5f47-4362-b853-0261faabc74b', 
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
      'f25c09ac-2125-4116-9555-ff175243e6fb', 
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
      'fac8c55a-da80-4eeb-8166-cbf1eaee4b08', 
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
      '3d0ebdb2-09ee-4a6e-a891-da3b351c713c', 
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
      '3f5e2b36-0f0c-4225-a82f-a277d170169f', 
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
      'c33fbf2d-2720-4f05-8f95-6a52e99c783c', 
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
      '3ea391bb-2233-4c94-9b89-7550123253ec', 
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
      '2737ac36-8fa0-44fe-a930-fa594c2b2ed4', 
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

