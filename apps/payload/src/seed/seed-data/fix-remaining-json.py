#!/usr/bin/env python3
import json
import os

# Fix posts.json
print("Fixing posts.json...")
with open('posts.json', 'r') as f:
    posts = json.load(f)

for i, post in enumerate(posts):
    # Add _ref field
    if '_ref' not in post:
        post['_ref'] = f"posts:{post['slug']}"
    
    # Ensure proper fields
    if 'description' not in post:
        post['description'] = ""
    
    # Add image_id as reference if there's a featured image
    # Based on the reference-mappings.json, we'd need to map these properly
    post['image_id'] = None  # Would need to map to actual media references
    
    # Ensure categories and tags are properly formatted
    if 'categories' not in post:
        post['categories'] = []
    if 'tags' not in post:
        post['tags'] = []
        
    # Add downloads field
    if 'downloads' not in post:
        post['downloads'] = []
        
    # Ensure publishedAt is set
    if 'publishedAt' not in post:
        post['publishedAt'] = "2024-01-15T10:00:00Z"
        
    # Ensure status is set
    if 'status' not in post:
        post['status'] = 'published'

with open('posts.json', 'w') as f:
    json.dump(posts, f, indent='\t', ensure_ascii=False)

# Fix course-quizzes.json
print("Fixing course-quizzes.json...")
if os.path.exists('course-quizzes.json'):
    with open('course-quizzes.json', 'r') as f:
        quizzes = json.load(f)
    
    for quiz in quizzes:
        if '_ref' not in quiz:
            # Use the slug as identifier
            quiz['_ref'] = f"course-quizzes:{quiz.get('slug', quiz.get('id', ''))}"
    
    with open('course-quizzes.json', 'w') as f:
        json.dump(quizzes, f, indent='\t', ensure_ascii=False)

# Fix quiz-questions.json
print("Fixing quiz-questions.json...")
if os.path.exists('quiz-questions.json'):
    with open('quiz-questions.json', 'r') as f:
        questions = json.load(f)
    
    for question in questions:
        if '_ref' not in question:
            # Use the id as identifier
            question['_ref'] = f"quiz-questions:{question.get('id', '')}"
    
    with open('quiz-questions.json', 'w') as f:
        json.dump(questions, f, indent='\t', ensure_ascii=False)

# Fix surveys.json
print("Fixing surveys.json...")
if os.path.exists('surveys.json'):
    with open('surveys.json', 'r') as f:
        surveys = json.load(f)
    
    for survey in surveys:
        if '_ref' not in survey:
            # Use the slug as identifier
            survey['_ref'] = f"surveys:{survey.get('slug', survey.get('id', ''))}"
    
    with open('surveys.json', 'w') as f:
        json.dump(surveys, f, indent='\t', ensure_ascii=False)

# Fix survey-questions.json
print("Fixing survey-questions.json...")
if os.path.exists('survey-questions.json'):
    with open('survey-questions.json', 'r') as f:
        questions = json.load(f)
    
    for question in questions:
        if '_ref' not in question:
            # Use the id as identifier
            question['_ref'] = f"survey-questions:{question.get('id', '')}"
    
    with open('survey-questions.json', 'w') as f:
        json.dump(questions, f, indent='\t', ensure_ascii=False)

# Fix documentation.json
print("Fixing documentation.json...")
if os.path.exists('documentation.json'):
    with open('documentation.json', 'r') as f:
        docs = json.load(f)
    
    for doc in docs:
        if '_ref' not in doc:
            # Use the slug as identifier
            doc['_ref'] = f"documentation:{doc.get('slug', doc.get('id', ''))}"
    
    with open('documentation.json', 'w') as f:
        json.dump(docs, f, indent='\t', ensure_ascii=False)

# Fix download-references.json
print("Fixing download-references.json...")
if os.path.exists('download-references.json'):
    with open('download-references.json', 'r') as f:
        downloads = json.load(f)
    
    # Check if it's wrapped in an object
    if isinstance(downloads, dict) and 'references' in downloads:
        downloads = downloads['references']
    
    for download in downloads:
        if '_ref' not in download:
            # Use the filename as identifier
            download['_ref'] = f"downloads:{download.get('filename', download.get('originalPath', ''))}"
    
    with open('download-references.json', 'w') as f:
        json.dump(downloads, f, indent='\t', ensure_ascii=False)

print("Done fixing JSON files!")