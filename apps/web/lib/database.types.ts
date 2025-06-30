export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					operationName?: string;
					query?: string;
					variables?: Json;
					extensions?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	payload: {
		Tables: {
			course_lessons: {
				Row: {
					bunny_library_id: string | null;
					bunny_video_id: string | null;
					content: string | null;
					course_id: string | null;
					course_id_id: string | null;
					created_at: string | null;
					description: string | null;
					downloads_id: string[] | null;
					estimated_duration: number | null;
					featured_image_id: string | null;
					featured_image_id_id: string | null;
					id: string;
					lesson_number: number | null;
					media_id: string | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					published_at: string | null;
					quiz_id: string | null;
					quiz_id_id: string | null;
					slug: string | null;
					survey_id: string | null;
					survey_id_id: string | null;
					title: string | null;
					todo: string | null;
					todo_complete_quiz: boolean | null;
					todo_course_project: string | null;
					todo_read_content: string | null;
					todo_watch_content: string | null;
					updated_at: string | null;
					video_source_type: string | null;
					youtube_video_id: string | null;
				};
				Insert: {
					bunny_library_id?: string | null;
					bunny_video_id?: string | null;
					content?: string | null;
					course_id?: string | null;
					course_id_id?: string | null;
					created_at?: string | null;
					description?: string | null;
					downloads_id?: string[] | null;
					estimated_duration?: number | null;
					featured_image_id?: string | null;
					featured_image_id_id?: string | null;
					id?: string;
					lesson_number?: number | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					published_at?: string | null;
					quiz_id?: string | null;
					quiz_id_id?: string | null;
					slug?: string | null;
					survey_id?: string | null;
					survey_id_id?: string | null;
					title?: string | null;
					todo?: string | null;
					todo_complete_quiz?: boolean | null;
					todo_course_project?: string | null;
					todo_read_content?: string | null;
					todo_watch_content?: string | null;
					updated_at?: string | null;
					video_source_type?: string | null;
					youtube_video_id?: string | null;
				};
				Update: {
					bunny_library_id?: string | null;
					bunny_video_id?: string | null;
					content?: string | null;
					course_id?: string | null;
					course_id_id?: string | null;
					created_at?: string | null;
					description?: string | null;
					downloads_id?: string[] | null;
					estimated_duration?: number | null;
					featured_image_id?: string | null;
					featured_image_id_id?: string | null;
					id?: string;
					lesson_number?: number | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					published_at?: string | null;
					quiz_id?: string | null;
					quiz_id_id?: string | null;
					slug?: string | null;
					survey_id?: string | null;
					survey_id_id?: string | null;
					title?: string | null;
					todo?: string | null;
					todo_complete_quiz?: boolean | null;
					todo_course_project?: string | null;
					todo_read_content?: string | null;
					todo_watch_content?: string | null;
					updated_at?: string | null;
					video_source_type?: string | null;
					youtube_video_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "course_lessons_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "course_lessons_course_id_id_fkey";
						columns: ["course_id_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "course_lessons_featured_image_id_fkey";
						columns: ["featured_image_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "course_lessons_featured_image_id_id_fkey";
						columns: ["featured_image_id_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "course_lessons_media_id_fkey";
						columns: ["media_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "course_lessons_quiz_id_fkey";
						columns: ["quiz_id"];
						isOneToOne: false;
						referencedRelation: "course_quizzes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "course_lessons_quiz_id_id_fkey";
						columns: ["quiz_id_id"];
						isOneToOne: false;
						referencedRelation: "course_quizzes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "fk_course_lessons_survey";
						columns: ["survey_id"];
						isOneToOne: false;
						referencedRelation: "surveys";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "fk_course_lessons_survey_id";
						columns: ["survey_id_id"];
						isOneToOne: false;
						referencedRelation: "surveys";
						referencedColumns: ["id"];
					},
				];
			};
			course_lessons__downloads: {
				Row: {
					created_at: string | null;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					order_column: number | null;
					parent_id: string;
					path: string | null;
					private_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id: string;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id?: string;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			course_lessons_downloads: {
				Row: {
					created_at: string | null;
					download_id: string;
					downloads_id: string | null;
					id: string;
					lesson_id: string;
					media_id: string | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					download_id: string;
					downloads_id?: string | null;
					id?: string;
					lesson_id: string;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					download_id?: string;
					downloads_id?: string | null;
					id?: string;
					lesson_id?: string;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "course_lessons_downloads_download_id_fkey";
						columns: ["download_id"];
						isOneToOne: false;
						referencedRelation: "downloads";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "course_lessons_downloads_download_id_fkey";
						columns: ["download_id"];
						isOneToOne: false;
						referencedRelation: "downloads_diagnostic";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "course_lessons_downloads_lesson_id_fkey";
						columns: ["lesson_id"];
						isOneToOne: false;
						referencedRelation: "course_lessons";
						referencedColumns: ["id"];
					},
				];
			};
			course_lessons_rels: {
				Row: {
					_order: number | null;
					_parent_id: string;
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string | null;
					documentation_id: string | null;
					downloads_id: string | null;
					field: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_id_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string | null;
					value: string | null;
				};
				Insert: {
					_order?: number | null;
					_parent_id: string;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "course_lessons_rels__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "course_lessons";
						referencedColumns: ["id"];
					},
				];
			};
			course_quizzes: {
				Row: {
					course_id_id: string | null;
					created_at: string | null;
					description: string | null;
					downloads_id: string[] | null;
					id: string;
					media_id: string | null;
					parent_id: string | null;
					pass_threshold: number | null;
					passing_score: number | null;
					path: string | null;
					private_id: string | null;
					slug: string | null;
					title: string | null;
					updated_at: string | null;
				};
				Insert: {
					course_id_id?: string | null;
					created_at?: string | null;
					description?: string | null;
					downloads_id?: string[] | null;
					id?: string;
					media_id?: string | null;
					parent_id?: string | null;
					pass_threshold?: number | null;
					passing_score?: number | null;
					path?: string | null;
					private_id?: string | null;
					slug?: string | null;
					title?: string | null;
					updated_at?: string | null;
				};
				Update: {
					course_id_id?: string | null;
					created_at?: string | null;
					description?: string | null;
					downloads_id?: string[] | null;
					id?: string;
					media_id?: string | null;
					parent_id?: string | null;
					pass_threshold?: number | null;
					passing_score?: number | null;
					path?: string | null;
					private_id?: string | null;
					slug?: string | null;
					title?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "course_quizzes_media_id_fkey";
						columns: ["media_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
				];
			};
			course_quizzes__downloads: {
				Row: {
					created_at: string | null;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					order_column: number | null;
					parent_id: string;
					path: string | null;
					private_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id: string;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id?: string;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			course_quizzes_rels: {
				Row: {
					_order: number | null;
					_parent_id: string;
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string | null;
					documentation_id: string | null;
					downloads_id: string | null;
					field: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_id_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string | null;
					value: string | null;
				};
				Insert: {
					_order?: number | null;
					_parent_id: string;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "course_quizzes_rels__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "course_quizzes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "course_quizzes_rels_quiz_questions_id_fkey";
						columns: ["quiz_questions_id"];
						isOneToOne: false;
						referencedRelation: "quiz_questions";
						referencedColumns: ["id"];
					},
				];
			};
			courses: {
				Row: {
					completion_content: Json | null;
					content: Json | null;
					created_at: string | null;
					description: string | null;
					downloads_id: string[] | null;
					estimated_duration: number | null;
					featured_image_id: string | null;
					featured_image_id_id: string | null;
					id: string;
					intro_content: Json | null;
					media_id: string | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					published_at: string | null;
					show_progress_bar: boolean | null;
					slug: string | null;
					status: string | null;
					title: string | null;
					updated_at: string | null;
				};
				Insert: {
					completion_content?: Json | null;
					content?: Json | null;
					created_at?: string | null;
					description?: string | null;
					downloads_id?: string[] | null;
					estimated_duration?: number | null;
					featured_image_id?: string | null;
					featured_image_id_id?: string | null;
					id?: string;
					intro_content?: Json | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					published_at?: string | null;
					show_progress_bar?: boolean | null;
					slug?: string | null;
					status?: string | null;
					title?: string | null;
					updated_at?: string | null;
				};
				Update: {
					completion_content?: Json | null;
					content?: Json | null;
					created_at?: string | null;
					description?: string | null;
					downloads_id?: string[] | null;
					estimated_duration?: number | null;
					featured_image_id?: string | null;
					featured_image_id_id?: string | null;
					id?: string;
					intro_content?: Json | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					published_at?: string | null;
					show_progress_bar?: boolean | null;
					slug?: string | null;
					status?: string | null;
					title?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "courses_featured_image_id_fkey";
						columns: ["featured_image_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_featured_image_id_id_fkey";
						columns: ["featured_image_id_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
				];
			};
			courses__downloads: {
				Row: {
					created_at: string | null;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					order_column: number | null;
					parent_id: string;
					path: string | null;
					private_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id: string;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id?: string;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			courses_rels: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string;
					documentation_id: string | null;
					downloads_id: string | null;
					field: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_id_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string;
					value: string | null;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
					value?: string | null;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
					value?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "courses_rels__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_rels_course_lessons_id_fkey";
						columns: ["course_lessons_id"];
						isOneToOne: false;
						referencedRelation: "course_lessons";
						referencedColumns: ["id"];
					},
				];
			};
			documentation: {
				Row: {
					_order: number | null;
					content: Json | null;
					created_at: string;
					description: string | null;
					downloads_id: string[] | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent: string | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					published_at: string | null;
					slug: string;
					status: string | null;
					title: string;
					updated_at: string;
				};
				Insert: {
					_order?: number | null;
					content?: Json | null;
					created_at?: string;
					description?: string | null;
					downloads_id?: string[] | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					published_at?: string | null;
					slug: string;
					status?: string | null;
					title: string;
					updated_at?: string;
				};
				Update: {
					_order?: number | null;
					content?: Json | null;
					created_at?: string;
					description?: string | null;
					downloads_id?: string[] | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					published_at?: string | null;
					slug?: string;
					status?: string | null;
					title?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			documentation__downloads: {
				Row: {
					created_at: string | null;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					order_column: number | null;
					parent_id: string;
					path: string | null;
					private_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id: string;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id?: string;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			documentation_breadcrumbs: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					created_at: string;
					doc: string | null;
					doc_id: string | null;
					downloads_id: string | null;
					id: string;
					label: string | null;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					updated_at: string;
					url: string | null;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					doc?: string | null;
					doc_id?: string | null;
					downloads_id?: string | null;
					id?: string;
					label?: string | null;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
					url?: string | null;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					doc?: string | null;
					doc_id?: string | null;
					downloads_id?: string | null;
					id?: string;
					label?: string | null;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
					url?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "documentation_breadcrumbs__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "documentation";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "documentation_breadcrumbs_doc_id_fkey";
						columns: ["doc_id"];
						isOneToOne: false;
						referencedRelation: "documentation";
						referencedColumns: ["id"];
					},
				];
			};
			documentation_categories: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					category: string | null;
					created_at: string;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					updated_at: string;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					category?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					category?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "documentation_categories_parent_id_fkey";
						columns: ["parent_id"];
						isOneToOne: false;
						referencedRelation: "documentation";
						referencedColumns: ["id"];
					},
				];
			};
			documentation_rels: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string;
					documentation_id: string | null;
					downloads_id: string | null;
					field: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_id_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string;
					value: string | null;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
					value?: string | null;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
					value?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "documentation_rels__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "documentation";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "documentation_rels_documentation_id_fkey";
						columns: ["documentation_id"];
						isOneToOne: false;
						referencedRelation: "documentation";
						referencedColumns: ["id"];
					},
				];
			};
			documentation_tags: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					created_at: string;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					tag: string | null;
					updated_at: string;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					tag?: string | null;
					updated_at?: string;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					tag?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "documentation_tags_parent_id_fkey";
						columns: ["parent_id"];
						isOneToOne: false;
						referencedRelation: "documentation";
						referencedColumns: ["id"];
					},
				];
			};
			downloads: {
				Row: {
					alt_text: string | null;
					caption: string | null;
					created_at: string | null;
					created_by: string | null;
					description: string | null;
					downloads_id: string | null;
					filename: string;
					filename_original: string | null;
					filesize: number | null;
					focal_x: number | null;
					focal_y: number | null;
					height: number | null;
					id: string;
					key: string | null;
					lesson_id: string | null;
					media_id: string | null;
					mime: string | null;
					mime_type: string | null;
					mimetype: string | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					sizes: Json | null;
					sizes_card_filename: string | null;
					sizes_card_filesize: number | null;
					sizes_card_height: number | null;
					sizes_card_mime_type: string | null;
					sizes_card_url: string | null;
					sizes_card_width: number | null;
					sizes_srcsets: Json | null;
					sizes_tablet_filename: string | null;
					sizes_tablet_filesize: number | null;
					sizes_tablet_height: number | null;
					sizes_tablet_mime_type: string | null;
					sizes_tablet_url: string | null;
					sizes_tablet_width: number | null;
					sizes_thumbnail_filename: string | null;
					sizes_thumbnail_filesize: number | null;
					sizes_thumbnail_height: number | null;
					sizes_thumbnail_mime_type: string | null;
					sizes_thumbnail_url: string | null;
					sizes_thumbnail_width: number | null;
					thumbnail_u_r_l: string | null;
					title: string | null;
					type: string | null;
					updated_at: string | null;
					updated_by: string | null;
					url: string;
					width: number | null;
				};
				Insert: {
					alt_text?: string | null;
					caption?: string | null;
					created_at?: string | null;
					created_by?: string | null;
					description?: string | null;
					downloads_id?: string | null;
					filename: string;
					filename_original?: string | null;
					filesize?: number | null;
					focal_x?: number | null;
					focal_y?: number | null;
					height?: number | null;
					id?: string;
					key?: string | null;
					lesson_id?: string | null;
					media_id?: string | null;
					mime?: string | null;
					mime_type?: string | null;
					mimetype?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					sizes?: Json | null;
					sizes_card_filename?: string | null;
					sizes_card_filesize?: number | null;
					sizes_card_height?: number | null;
					sizes_card_mime_type?: string | null;
					sizes_card_url?: string | null;
					sizes_card_width?: number | null;
					sizes_srcsets?: Json | null;
					sizes_tablet_filename?: string | null;
					sizes_tablet_filesize?: number | null;
					sizes_tablet_height?: number | null;
					sizes_tablet_mime_type?: string | null;
					sizes_tablet_url?: string | null;
					sizes_tablet_width?: number | null;
					sizes_thumbnail_filename?: string | null;
					sizes_thumbnail_filesize?: number | null;
					sizes_thumbnail_height?: number | null;
					sizes_thumbnail_mime_type?: string | null;
					sizes_thumbnail_url?: string | null;
					sizes_thumbnail_width?: number | null;
					thumbnail_u_r_l?: string | null;
					title?: string | null;
					type?: string | null;
					updated_at?: string | null;
					updated_by?: string | null;
					url: string;
					width?: number | null;
				};
				Update: {
					alt_text?: string | null;
					caption?: string | null;
					created_at?: string | null;
					created_by?: string | null;
					description?: string | null;
					downloads_id?: string | null;
					filename?: string;
					filename_original?: string | null;
					filesize?: number | null;
					focal_x?: number | null;
					focal_y?: number | null;
					height?: number | null;
					id?: string;
					key?: string | null;
					lesson_id?: string | null;
					media_id?: string | null;
					mime?: string | null;
					mime_type?: string | null;
					mimetype?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					sizes?: Json | null;
					sizes_card_filename?: string | null;
					sizes_card_filesize?: number | null;
					sizes_card_height?: number | null;
					sizes_card_mime_type?: string | null;
					sizes_card_url?: string | null;
					sizes_card_width?: number | null;
					sizes_srcsets?: Json | null;
					sizes_tablet_filename?: string | null;
					sizes_tablet_filesize?: number | null;
					sizes_tablet_height?: number | null;
					sizes_tablet_mime_type?: string | null;
					sizes_tablet_url?: string | null;
					sizes_tablet_width?: number | null;
					sizes_thumbnail_filename?: string | null;
					sizes_thumbnail_filesize?: number | null;
					sizes_thumbnail_height?: number | null;
					sizes_thumbnail_mime_type?: string | null;
					sizes_thumbnail_url?: string | null;
					sizes_thumbnail_width?: number | null;
					thumbnail_u_r_l?: string | null;
					title?: string | null;
					type?: string | null;
					updated_at?: string | null;
					updated_by?: string | null;
					url?: string;
					width?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "downloads_lesson_id_fkey";
						columns: ["lesson_id"];
						isOneToOne: false;
						referencedRelation: "course_lessons";
						referencedColumns: ["id"];
					},
				];
			};
			downloads_rels: {
				Row: {
					_parent_id: string;
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string | null;
					documentation_id: string | null;
					downloads_id: string | null;
					field: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					order_column: number | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string | null;
					value: string | null;
				};
				Insert: {
					_parent_id: string;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Update: {
					_parent_id?: string;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "downloads_rels_parent_fk";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "downloads";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "downloads_rels_parent_fk";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "downloads_diagnostic";
						referencedColumns: ["id"];
					},
				];
			};
			dynamic_uuid_tables: {
				Row: {
					created_at: string | null;
					needs_path_column: boolean | null;
					primary_key: string | null;
					table_name: string;
				};
				Insert: {
					created_at?: string | null;
					needs_path_column?: boolean | null;
					primary_key?: string | null;
					table_name: string;
				};
				Update: {
					created_at?: string | null;
					needs_path_column?: boolean | null;
					primary_key?: string | null;
					table_name?: string;
				};
				Relationships: [];
			};
			media: {
				Row: {
					alt: string;
					created_at: string;
					downloads_id: string | null;
					filename: string | null;
					filesize: number | null;
					focal_x: number | null;
					focal_y: number | null;
					height: number | null;
					id: string;
					media_id: string | null;
					mime_type: string | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					thumbnail_u_r_l: string | null;
					updated_at: string;
					url: string | null;
					width: number | null;
				};
				Insert: {
					alt: string;
					created_at?: string;
					downloads_id?: string | null;
					filename?: string | null;
					filesize?: number | null;
					focal_x?: number | null;
					focal_y?: number | null;
					height?: number | null;
					id?: string;
					media_id?: string | null;
					mime_type?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					thumbnail_u_r_l?: string | null;
					updated_at?: string;
					url?: string | null;
					width?: number | null;
				};
				Update: {
					alt?: string;
					created_at?: string;
					downloads_id?: string | null;
					filename?: string | null;
					filesize?: number | null;
					focal_x?: number | null;
					focal_y?: number | null;
					height?: number | null;
					id?: string;
					media_id?: string | null;
					mime_type?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					thumbnail_u_r_l?: string | null;
					updated_at?: string;
					url?: string | null;
					width?: number | null;
				};
				Relationships: [];
			};
			payload_locked_documents: {
				Row: {
					collection: string | null;
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string;
					document_id: string | null;
					documentation_id: string | null;
					downloads_id: string | null;
					global_slug: string | null;
					id: string;
					lock_expiration: string | null;
					media_id: string | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string;
				};
				Insert: {
					collection?: string | null;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					document_id?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					global_slug?: string | null;
					id?: string;
					lock_expiration?: string | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
				};
				Update: {
					collection?: string | null;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					document_id?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					global_slug?: string | null;
					id?: string;
					lock_expiration?: string | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "payload_locked_documents_course_lessons_id_fkey";
						columns: ["course_lessons_id"];
						isOneToOne: false;
						referencedRelation: "course_lessons";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payload_locked_documents_course_quizzes_id_fkey";
						columns: ["course_quizzes_id"];
						isOneToOne: false;
						referencedRelation: "course_quizzes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payload_locked_documents_courses_id_fkey";
						columns: ["courses_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payload_locked_documents_documentation_id_fkey";
						columns: ["documentation_id"];
						isOneToOne: false;
						referencedRelation: "documentation";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payload_locked_documents_media_id_fkey";
						columns: ["media_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payload_locked_documents_posts_id_fkey";
						columns: ["posts_id"];
						isOneToOne: false;
						referencedRelation: "posts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payload_locked_documents_quiz_questions_id_fkey";
						columns: ["quiz_questions_id"];
						isOneToOne: false;
						referencedRelation: "quiz_questions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payload_locked_documents_survey_questions_id_fkey";
						columns: ["survey_questions_id"];
						isOneToOne: false;
						referencedRelation: "survey_questions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payload_locked_documents_surveys_id_fkey";
						columns: ["surveys_id"];
						isOneToOne: false;
						referencedRelation: "surveys";
						referencedColumns: ["id"];
					},
				];
			};
			payload_locked_documents_rels: {
				Row: {
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string;
					documentation_id: string | null;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_id_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string;
					users_id: string | null;
				};
				Insert: {
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					documentation_id?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
					users_id?: string | null;
				};
				Update: {
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					documentation_id?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
					users_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "payload_locked_documents_rels_media_id_fkey";
						columns: ["media_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payload_locked_documents_rels_users_id_fkey";
						columns: ["users_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			payload_migrations: {
				Row: {
					batch: number | null;
					created_at: string;
					id: number;
					name: string | null;
					updated_at: string;
				};
				Insert: {
					batch?: number | null;
					created_at?: string;
					id?: number;
					name?: string | null;
					updated_at?: string;
				};
				Update: {
					batch?: number | null;
					created_at?: string;
					id?: number;
					name?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
			payload_preferences: {
				Row: {
					created_at: string;
					downloads_id: string | null;
					id: string;
					key: string | null;
					media_id: string | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					updated_at: string;
					user: string | null;
					value: Json | null;
				};
				Insert: {
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					key?: string | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
					user?: string | null;
					value?: Json | null;
				};
				Update: {
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					key?: string | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
					user?: string | null;
					value?: Json | null;
				};
				Relationships: [
					{
						foreignKeyName: "payload_preferences_user_fkey";
						columns: ["user"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			payload_preferences_rels: {
				Row: {
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string;
					documentation_id: string | null;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_id_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string;
					users_id: string | null;
				};
				Insert: {
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					documentation_id?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
					users_id?: string | null;
				};
				Update: {
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					documentation_id?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
					users_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "payload_preferences_rels_users_id_fkey";
						columns: ["users_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			posts: {
				Row: {
					content: Json | null;
					created_at: string;
					description: string | null;
					downloads_id: string[] | null;
					featured_image_id: string | null;
					featured_image_id_id: string | null;
					id: string;
					image_id: string | null;
					image_id_id: string | null;
					media_id: string | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					published_at: string | null;
					slug: string;
					status: string | null;
					title: string;
					updated_at: string;
				};
				Insert: {
					content?: Json | null;
					created_at?: string;
					description?: string | null;
					downloads_id?: string[] | null;
					featured_image_id?: string | null;
					featured_image_id_id?: string | null;
					id?: string;
					image_id?: string | null;
					image_id_id?: string | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					published_at?: string | null;
					slug: string;
					status?: string | null;
					title: string;
					updated_at?: string;
				};
				Update: {
					content?: Json | null;
					created_at?: string;
					description?: string | null;
					downloads_id?: string[] | null;
					featured_image_id?: string | null;
					featured_image_id_id?: string | null;
					id?: string;
					image_id?: string | null;
					image_id_id?: string | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					published_at?: string | null;
					slug?: string;
					status?: string | null;
					title?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "posts_featured_image_id_fkey";
						columns: ["featured_image_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "posts_featured_image_id_id_fkey";
						columns: ["featured_image_id_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "posts_image_id_fkey";
						columns: ["image_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "posts_image_id_id_fkey";
						columns: ["image_id_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
				];
			};
			posts__downloads: {
				Row: {
					created_at: string | null;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					order_column: number | null;
					parent_id: string;
					path: string | null;
					private_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id: string;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id?: string;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			posts_categories: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					category: string | null;
					created_at: string;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					updated_at: string;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					category?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					category?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "posts_categories__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "posts";
						referencedColumns: ["id"];
					},
				];
			};
			posts_rels: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string;
					documentation_id: string | null;
					downloads_id: string | null;
					field: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_id_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string;
					value: string | null;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
					value?: string | null;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
					value?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "posts_rels__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "posts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "posts_rels_media_id_fkey";
						columns: ["media_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
				];
			};
			posts_tags: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					created_at: string;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					tag: string | null;
					updated_at: string;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					tag?: string | null;
					updated_at?: string;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					tag?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "posts_tags__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "posts";
						referencedColumns: ["id"];
					},
				];
			};
			private: {
				Row: {
					content: Json | null;
					created_at: string;
					description: string | null;
					downloads_id: string[] | null;
					featured_image_id: string | null;
					featured_image_id_id: string | null;
					id: string;
					image_id: string | null;
					image_id_id: string | null;
					media_id: string | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					published_at: string | null;
					slug: string;
					status: string | null;
					title: string;
					updated_at: string;
				};
				Insert: {
					content?: Json | null;
					created_at?: string;
					description?: string | null;
					downloads_id?: string[] | null;
					featured_image_id?: string | null;
					featured_image_id_id?: string | null;
					id?: string;
					image_id?: string | null;
					image_id_id?: string | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					published_at?: string | null;
					slug: string;
					status?: string | null;
					title: string;
					updated_at?: string;
				};
				Update: {
					content?: Json | null;
					created_at?: string;
					description?: string | null;
					downloads_id?: string[] | null;
					featured_image_id?: string | null;
					featured_image_id_id?: string | null;
					id?: string;
					image_id?: string | null;
					image_id_id?: string | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					published_at?: string | null;
					slug?: string;
					status?: string | null;
					title?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "private_featured_image_id_fkey";
						columns: ["featured_image_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_featured_image_id_id_fkey";
						columns: ["featured_image_id_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_image_id_fkey";
						columns: ["image_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_image_id_id_fkey";
						columns: ["image_id_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
				];
			};
			private__downloads: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					created_at: string;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					updated_at: string;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "private__downloads__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "private";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private__downloads_downloads_id_fkey";
						columns: ["downloads_id"];
						isOneToOne: false;
						referencedRelation: "downloads";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private__downloads_downloads_id_fkey";
						columns: ["downloads_id"];
						isOneToOne: false;
						referencedRelation: "downloads_diagnostic";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private__downloads_parent_id_fkey";
						columns: ["parent_id"];
						isOneToOne: false;
						referencedRelation: "private";
						referencedColumns: ["id"];
					},
				];
			};
			private_categories: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					category: string | null;
					created_at: string;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					updated_at: string;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					category?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					category?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "private_categories__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "private";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_categories_parent_id_fkey";
						columns: ["parent_id"];
						isOneToOne: false;
						referencedRelation: "private";
						referencedColumns: ["id"];
					},
				];
			};
			private_rels: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string;
					documentation_id: string | null;
					downloads_id: string | null;
					field: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_id_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string;
					value: string | null;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
					value?: string | null;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string;
					value?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "private_rels__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "private";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_course_lessons_id_fkey";
						columns: ["course_lessons_id"];
						isOneToOne: false;
						referencedRelation: "course_lessons";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_course_quizzes_id_fkey";
						columns: ["course_quizzes_id"];
						isOneToOne: false;
						referencedRelation: "course_quizzes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_courses_id_fkey";
						columns: ["courses_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_documentation_id_fkey";
						columns: ["documentation_id"];
						isOneToOne: false;
						referencedRelation: "documentation";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_downloads_id_fkey";
						columns: ["downloads_id"];
						isOneToOne: false;
						referencedRelation: "downloads";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_downloads_id_fkey";
						columns: ["downloads_id"];
						isOneToOne: false;
						referencedRelation: "downloads_diagnostic";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_media_id_fkey";
						columns: ["media_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_parent_id_fkey";
						columns: ["parent_id"];
						isOneToOne: false;
						referencedRelation: "private";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_posts_id_fkey";
						columns: ["posts_id"];
						isOneToOne: false;
						referencedRelation: "posts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_private_id_fkey";
						columns: ["private_id"];
						isOneToOne: false;
						referencedRelation: "private";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_quiz_id_id_fkey";
						columns: ["quiz_id_id"];
						isOneToOne: false;
						referencedRelation: "course_quizzes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_quiz_questions_id_fkey";
						columns: ["quiz_questions_id"];
						isOneToOne: false;
						referencedRelation: "quiz_questions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_survey_questions_id_fkey";
						columns: ["survey_questions_id"];
						isOneToOne: false;
						referencedRelation: "survey_questions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_rels_surveys_id_fkey";
						columns: ["surveys_id"];
						isOneToOne: false;
						referencedRelation: "surveys";
						referencedColumns: ["id"];
					},
				];
			};
			private_tags: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					created_at: string;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					tag: string | null;
					updated_at: string;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					tag?: string | null;
					updated_at?: string;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					tag?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "private_tags__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "private";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "private_tags_parent_id_fkey";
						columns: ["parent_id"];
						isOneToOne: false;
						referencedRelation: "private";
						referencedColumns: ["id"];
					},
				];
			};
			quiz_questions: {
				Row: {
					_order: number | null;
					correct_answer: string | null;
					created_at: string | null;
					downloads_id: string | null;
					explanation: string | null;
					id: string;
					media_id: string | null;
					options: Json | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					question: string | null;
					quiz_id: string | null;
					quiz_id_id: string | null;
					type: string | null;
					updated_at: string | null;
				};
				Insert: {
					_order?: number | null;
					correct_answer?: string | null;
					created_at?: string | null;
					downloads_id?: string | null;
					explanation?: string | null;
					id?: string;
					media_id?: string | null;
					options?: Json | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					question?: string | null;
					quiz_id?: string | null;
					quiz_id_id?: string | null;
					type?: string | null;
					updated_at?: string | null;
				};
				Update: {
					_order?: number | null;
					correct_answer?: string | null;
					created_at?: string | null;
					downloads_id?: string | null;
					explanation?: string | null;
					id?: string;
					media_id?: string | null;
					options?: Json | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					question?: string | null;
					quiz_id?: string | null;
					quiz_id_id?: string | null;
					type?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "quiz_questions_media_id_fkey";
						columns: ["media_id"];
						isOneToOne: false;
						referencedRelation: "media";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_questions_quiz_id_fkey";
						columns: ["quiz_id"];
						isOneToOne: false;
						referencedRelation: "course_quizzes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_questions_quiz_id_id_fkey";
						columns: ["quiz_id_id"];
						isOneToOne: false;
						referencedRelation: "course_quizzes";
						referencedColumns: ["id"];
					},
				];
			};
			quiz_questions_options: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					created_at: string;
					downloads_id: string | null;
					id: string;
					is_correct: boolean | null;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					text: string | null;
					updated_at: string;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					is_correct?: boolean | null;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					text?: string | null;
					updated_at?: string;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					is_correct?: boolean | null;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					text?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "quiz_questions_options__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "quiz_questions";
						referencedColumns: ["id"];
					},
				];
			};
			quiz_questions_rels: {
				Row: {
					_order: number | null;
					_parent_id: string;
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string | null;
					documentation_id: string | null;
					downloads_id: string | null;
					field: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_id_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string | null;
					value: string | null;
				};
				Insert: {
					_order?: number | null;
					_parent_id: string;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "quiz_questions_rels__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "quiz_questions";
						referencedColumns: ["id"];
					},
				];
			};
			survey_questions: {
				Row: {
					_order: number | null;
					category: string | null;
					created_at: string | null;
					description: string | null;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					options: Json | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					position: number | null;
					private_id: string | null;
					question: string | null;
					questionspin: number | null;
					required: boolean | null;
					surveys_id: string | null;
					text: string | null;
					type: string | null;
					updated_at: string | null;
				};
				Insert: {
					_order?: number | null;
					category?: string | null;
					created_at?: string | null;
					description?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					options?: Json | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					position?: number | null;
					private_id?: string | null;
					question?: string | null;
					questionspin?: number | null;
					required?: boolean | null;
					surveys_id?: string | null;
					text?: string | null;
					type?: string | null;
					updated_at?: string | null;
				};
				Update: {
					_order?: number | null;
					category?: string | null;
					created_at?: string | null;
					description?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					options?: Json | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					position?: number | null;
					private_id?: string | null;
					question?: string | null;
					questionspin?: number | null;
					required?: boolean | null;
					surveys_id?: string | null;
					text?: string | null;
					type?: string | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "survey_questions_surveys_id_fkey";
						columns: ["surveys_id"];
						isOneToOne: false;
						referencedRelation: "surveys";
						referencedColumns: ["id"];
					},
				];
			};
			survey_questions_options: {
				Row: {
					_order: number | null;
					_parent_id: string | null;
					created_at: string;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					option: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					updated_at: string;
				};
				Insert: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					option?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string | null;
					created_at?: string;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					option?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "survey_questions_options__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "survey_questions";
						referencedColumns: ["id"];
					},
				];
			};
			survey_questions_rels: {
				Row: {
					_order: number | null;
					_parent_id: string;
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string | null;
					documentation_id: string | null;
					downloads_id: string | null;
					field: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_id_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string | null;
					value: string | null;
				};
				Insert: {
					_order?: number | null;
					_parent_id: string;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "survey_questions_rels__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "survey_questions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "survey_questions_rels_surveys_id_fkey";
						columns: ["surveys_id"];
						isOneToOne: false;
						referencedRelation: "surveys";
						referencedColumns: ["id"];
					},
				];
			};
			surveys: {
				Row: {
					created_at: string | null;
					description: string | null;
					downloads_id: string[] | null;
					end_message: string | null;
					id: string;
					media_id: string | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					published_at: string | null;
					show_progress_bar: boolean | null;
					slug: string | null;
					start_message: string | null;
					status: string | null;
					summary_content: Json | null;
					title: string | null;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					description?: string | null;
					downloads_id?: string[] | null;
					end_message?: string | null;
					id?: string;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					published_at?: string | null;
					show_progress_bar?: boolean | null;
					slug?: string | null;
					start_message?: string | null;
					status?: string | null;
					summary_content?: Json | null;
					title?: string | null;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					description?: string | null;
					downloads_id?: string[] | null;
					end_message?: string | null;
					id?: string;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					published_at?: string | null;
					show_progress_bar?: boolean | null;
					slug?: string | null;
					start_message?: string | null;
					status?: string | null;
					summary_content?: Json | null;
					title?: string | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			surveys__downloads: {
				Row: {
					created_at: string | null;
					downloads_id: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					order_column: number | null;
					parent_id: string;
					path: string | null;
					private_id: string | null;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id: string;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					downloads_id?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					order_column?: number | null;
					parent_id?: string;
					path?: string | null;
					private_id?: string | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			surveys_rels: {
				Row: {
					_order: number | null;
					_parent_id: string;
					course_lessons_id: string | null;
					course_quizzes_id: string | null;
					courses_id: string | null;
					created_at: string | null;
					documentation_id: string | null;
					downloads_id: string | null;
					field: string | null;
					id: string;
					media_id: string | null;
					order: number | null;
					parent_id: string | null;
					path: string | null;
					posts_id: string | null;
					private_id: string | null;
					quiz_id_id: string | null;
					quiz_questions_id: string | null;
					survey_questions_id: string | null;
					surveys_id: string | null;
					updated_at: string | null;
					value: string | null;
				};
				Insert: {
					_order?: number | null;
					_parent_id: string;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Update: {
					_order?: number | null;
					_parent_id?: string;
					course_lessons_id?: string | null;
					course_quizzes_id?: string | null;
					courses_id?: string | null;
					created_at?: string | null;
					documentation_id?: string | null;
					downloads_id?: string | null;
					field?: string | null;
					id?: string;
					media_id?: string | null;
					order?: number | null;
					parent_id?: string | null;
					path?: string | null;
					posts_id?: string | null;
					private_id?: string | null;
					quiz_id_id?: string | null;
					quiz_questions_id?: string | null;
					survey_questions_id?: string | null;
					surveys_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "surveys_rels__parent_id_fkey";
						columns: ["_parent_id"];
						isOneToOne: false;
						referencedRelation: "surveys";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "surveys_rels_survey_questions_id_fkey";
						columns: ["survey_questions_id"];
						isOneToOne: false;
						referencedRelation: "survey_questions";
						referencedColumns: ["id"];
					},
				];
			};
			users: {
				Row: {
					created_at: string;
					downloads_id: string | null;
					email: string;
					first_name: string | null;
					hash: string | null;
					id: string;
					last_name: string | null;
					lock_until: string | null;
					login_attempts: number | null;
					media_id: string | null;
					parent_id: string | null;
					path: string | null;
					private_id: string | null;
					reset_password_expiration: string | null;
					reset_password_token: string | null;
					salt: string | null;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					downloads_id?: string | null;
					email: string;
					first_name?: string | null;
					hash?: string | null;
					id?: string;
					last_name?: string | null;
					lock_until?: string | null;
					login_attempts?: number | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					reset_password_expiration?: string | null;
					reset_password_token?: string | null;
					salt?: string | null;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					downloads_id?: string | null;
					email?: string;
					first_name?: string | null;
					hash?: string | null;
					id?: string;
					last_name?: string | null;
					lock_until?: string | null;
					login_attempts?: number | null;
					media_id?: string | null;
					parent_id?: string | null;
					path?: string | null;
					private_id?: string | null;
					reset_password_expiration?: string | null;
					reset_password_token?: string | null;
					salt?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			downloads_diagnostic: {
				Row: {
					filename: string | null;
					id: string | null;
					lesson_refs: number | null;
					url: string | null;
				};
				Relationships: [];
			};
			downloads_relationships: {
				Row: {
					collection_type: string | null;
					download_id: string | null;
					table_name: string | null;
				};
				Relationships: [];
			};
		};
		Functions: {
			collection_has_download: {
				Args: {
					collection_id: string;
					collection_type: string;
					download_id: string;
				};
				Returns: boolean;
			};
			ensure_downloads_id_column: {
				Args: { table_name: string };
				Returns: undefined;
			};
			ensure_downloads_id_column_exists: {
				Args: { table_name: string };
				Returns: boolean;
			};
			ensure_relationship_columns: {
				Args: { table_name: string };
				Returns: undefined;
			};
			fix_dynamic_table: {
				Args: { table_name: string };
				Returns: boolean;
			};
			get_downloads_for_collection: {
				Args: { collection_id: string; collection_type: string };
				Returns: {
					download_id: string;
				}[];
			};
			get_relationship_data: {
				Args: { table_name: string; id: string; fallback_column?: string };
				Returns: string;
			};
			safe_uuid_conversion: {
				Args: { text_value: string };
				Returns: string;
			};
			scan_and_fix_uuid_tables: {
				Args: Record<PropertyKey, never>;
				Returns: undefined;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			accounts: {
				Row: {
					created_at: string | null;
					created_by: string | null;
					email: string | null;
					id: string;
					is_personal_account: boolean;
					name: string;
					picture_url: string | null;
					primary_owner_user_id: string;
					public_data: Json;
					slug: string | null;
					updated_at: string | null;
					updated_by: string | null;
				};
				Insert: {
					created_at?: string | null;
					created_by?: string | null;
					email?: string | null;
					id?: string;
					is_personal_account?: boolean;
					name: string;
					picture_url?: string | null;
					primary_owner_user_id?: string;
					public_data?: Json;
					slug?: string | null;
					updated_at?: string | null;
					updated_by?: string | null;
				};
				Update: {
					created_at?: string | null;
					created_by?: string | null;
					email?: string | null;
					id?: string;
					is_personal_account?: boolean;
					name?: string;
					picture_url?: string | null;
					primary_owner_user_id?: string;
					public_data?: Json;
					slug?: string | null;
					updated_at?: string | null;
					updated_by?: string | null;
				};
				Relationships: [];
			};
			accounts_memberships: {
				Row: {
					account_id: string;
					account_role: string;
					created_at: string;
					created_by: string | null;
					updated_at: string;
					updated_by: string | null;
					user_id: string;
				};
				Insert: {
					account_id: string;
					account_role: string;
					created_at?: string;
					created_by?: string | null;
					updated_at?: string;
					updated_by?: string | null;
					user_id: string;
				};
				Update: {
					account_id?: string;
					account_role?: string;
					created_at?: string;
					created_by?: string | null;
					updated_at?: string;
					updated_by?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "accounts_memberships_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "accounts_memberships_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "user_account_workspace";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "accounts_memberships_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "user_accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "accounts_memberships_account_role_fkey";
						columns: ["account_role"];
						isOneToOne: false;
						referencedRelation: "roles";
						referencedColumns: ["name"];
					},
				];
			};
			ai_cost_configuration: {
				Row: {
					created_at: string | null;
					effective_from: string | null;
					effective_to: string | null;
					id: string;
					input_cost_per_1k_tokens: number;
					is_active: boolean | null;
					markup_percentage: number | null;
					model: string;
					output_cost_per_1k_tokens: number;
					provider: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					effective_from?: string | null;
					effective_to?: string | null;
					id?: string;
					input_cost_per_1k_tokens: number;
					is_active?: boolean | null;
					markup_percentage?: number | null;
					model: string;
					output_cost_per_1k_tokens: number;
					provider: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					effective_from?: string | null;
					effective_to?: string | null;
					id?: string;
					input_cost_per_1k_tokens?: number;
					is_active?: boolean | null;
					markup_percentage?: number | null;
					model?: string;
					output_cost_per_1k_tokens?: number;
					provider?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			ai_credit_transactions: {
				Row: {
					allocation_id: string | null;
					amount: number;
					created_at: string | null;
					description: string | null;
					id: string;
					reference_id: string | null;
					team_id: string | null;
					transaction_type: string;
					user_id: string | null;
				};
				Insert: {
					allocation_id?: string | null;
					amount: number;
					created_at?: string | null;
					description?: string | null;
					id?: string;
					reference_id?: string | null;
					team_id?: string | null;
					transaction_type: string;
					user_id?: string | null;
				};
				Update: {
					allocation_id?: string | null;
					amount?: number;
					created_at?: string | null;
					description?: string | null;
					id?: string;
					reference_id?: string | null;
					team_id?: string | null;
					transaction_type?: string;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "ai_credit_transactions_allocation_id_fkey";
						columns: ["allocation_id"];
						isOneToOne: false;
						referencedRelation: "ai_usage_allocations";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "ai_credit_transactions_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "ai_credit_transactions_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "user_account_workspace";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "ai_credit_transactions_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "user_accounts";
						referencedColumns: ["id"];
					},
				];
			};
			ai_request_logs: {
				Row: {
					completion_tokens: number;
					cost: number;
					created_at: string | null;
					error: string | null;
					feature: string | null;
					id: string;
					model: string;
					portkey_verified: boolean | null;
					prompt_tokens: number;
					provider: string;
					request_id: string | null;
					request_timestamp: string | null;
					session_id: string | null;
					status: string | null;
					team_id: string | null;
					total_tokens: number;
					user_id: string | null;
				};
				Insert: {
					completion_tokens?: number;
					cost?: number;
					created_at?: string | null;
					error?: string | null;
					feature?: string | null;
					id?: string;
					model: string;
					portkey_verified?: boolean | null;
					prompt_tokens?: number;
					provider: string;
					request_id?: string | null;
					request_timestamp?: string | null;
					session_id?: string | null;
					status?: string | null;
					team_id?: string | null;
					total_tokens?: number;
					user_id?: string | null;
				};
				Update: {
					completion_tokens?: number;
					cost?: number;
					created_at?: string | null;
					error?: string | null;
					feature?: string | null;
					id?: string;
					model?: string;
					portkey_verified?: boolean | null;
					prompt_tokens?: number;
					provider?: string;
					request_id?: string | null;
					request_timestamp?: string | null;
					session_id?: string | null;
					status?: string | null;
					team_id?: string | null;
					total_tokens?: number;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "ai_request_logs_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "ai_request_logs_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "user_account_workspace";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "ai_request_logs_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "user_accounts";
						referencedColumns: ["id"];
					},
				];
			};
			ai_usage_allocations: {
				Row: {
					allocation_type: string;
					created_at: string | null;
					credits_allocated: number;
					credits_used: number;
					id: string;
					is_active: boolean | null;
					next_reset_at: string | null;
					reset_frequency: string | null;
					team_id: string | null;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					allocation_type: string;
					created_at?: string | null;
					credits_allocated?: number;
					credits_used?: number;
					id?: string;
					is_active?: boolean | null;
					next_reset_at?: string | null;
					reset_frequency?: string | null;
					team_id?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					allocation_type?: string;
					created_at?: string | null;
					credits_allocated?: number;
					credits_used?: number;
					id?: string;
					is_active?: boolean | null;
					next_reset_at?: string | null;
					reset_frequency?: string | null;
					team_id?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "ai_usage_allocations_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "ai_usage_allocations_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "user_account_workspace";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "ai_usage_allocations_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "user_accounts";
						referencedColumns: ["id"];
					},
				];
			};
			ai_usage_limits: {
				Row: {
					created_at: string | null;
					id: string;
					is_active: boolean | null;
					limit_type: string;
					max_value: number;
					team_id: string | null;
					time_period: string;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					is_active?: boolean | null;
					limit_type: string;
					max_value: number;
					team_id?: string | null;
					time_period: string;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					is_active?: boolean | null;
					limit_type?: string;
					max_value?: number;
					team_id?: string | null;
					time_period?: string;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "ai_usage_limits_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "ai_usage_limits_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "user_account_workspace";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "ai_usage_limits_team_id_fkey";
						columns: ["team_id"];
						isOneToOne: false;
						referencedRelation: "user_accounts";
						referencedColumns: ["id"];
					},
				];
			};
			billing_customers: {
				Row: {
					account_id: string;
					customer_id: string;
					email: string | null;
					id: number;
					provider: Database["public"]["Enums"]["billing_provider"];
				};
				Insert: {
					account_id: string;
					customer_id: string;
					email?: string | null;
					id?: number;
					provider: Database["public"]["Enums"]["billing_provider"];
				};
				Update: {
					account_id?: string;
					customer_id?: string;
					email?: string | null;
					id?: number;
					provider?: Database["public"]["Enums"]["billing_provider"];
				};
				Relationships: [
					{
						foreignKeyName: "billing_customers_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "billing_customers_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "user_account_workspace";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "billing_customers_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "user_accounts";
						referencedColumns: ["id"];
					},
				];
			};
			building_blocks_submissions: {
				Row: {
					answer: string | null;
					audience: string | null;
					complication: string | null;
					created_at: string | null;
					id: string;
					outline: string | null;
					presentation_type: string | null;
					question_type: string | null;
					situation: string | null;
					storyboard: Json | null;
					title: string;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					answer?: string | null;
					audience?: string | null;
					complication?: string | null;
					created_at?: string | null;
					id?: string;
					outline?: string | null;
					presentation_type?: string | null;
					question_type?: string | null;
					situation?: string | null;
					storyboard?: Json | null;
					title: string;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					answer?: string | null;
					audience?: string | null;
					complication?: string | null;
					created_at?: string | null;
					id?: string;
					outline?: string | null;
					presentation_type?: string | null;
					question_type?: string | null;
					situation?: string | null;
					storyboard?: Json | null;
					title?: string;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [];
			};
			certificates: {
				Row: {
					course_id: string;
					created_at: string | null;
					file_path: string;
					id: string;
					user_id: string;
				};
				Insert: {
					course_id: string;
					created_at?: string | null;
					file_path: string;
					id?: string;
					user_id: string;
				};
				Update: {
					course_id?: string;
					created_at?: string | null;
					file_path?: string;
					id?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			config: {
				Row: {
					billing_provider: Database["public"]["Enums"]["billing_provider"];
					enable_account_billing: boolean;
					enable_team_account_billing: boolean;
					enable_team_accounts: boolean;
				};
				Insert: {
					billing_provider?: Database["public"]["Enums"]["billing_provider"];
					enable_account_billing?: boolean;
					enable_team_account_billing?: boolean;
					enable_team_accounts?: boolean;
				};
				Update: {
					billing_provider?: Database["public"]["Enums"]["billing_provider"];
					enable_account_billing?: boolean;
					enable_team_account_billing?: boolean;
					enable_team_accounts?: boolean;
				};
				Relationships: [];
			};
			course_progress: {
				Row: {
					certificate_generated: boolean | null;
					completed_at: string | null;
					completion_percentage: number | null;
					course_id: string;
					current_lesson_id: string | null;
					id: string;
					last_accessed_at: string | null;
					started_at: string | null;
					user_id: string;
				};
				Insert: {
					certificate_generated?: boolean | null;
					completed_at?: string | null;
					completion_percentage?: number | null;
					course_id: string;
					current_lesson_id?: string | null;
					id?: string;
					last_accessed_at?: string | null;
					started_at?: string | null;
					user_id: string;
				};
				Update: {
					certificate_generated?: boolean | null;
					completed_at?: string | null;
					completion_percentage?: number | null;
					course_id?: string;
					current_lesson_id?: string | null;
					id?: string;
					last_accessed_at?: string | null;
					started_at?: string | null;
					user_id?: string;
				};
				Relationships: [];
			};
			invitations: {
				Row: {
					account_id: string;
					created_at: string;
					email: string;
					expires_at: string;
					id: number;
					invite_token: string;
					invited_by: string;
					role: string;
					updated_at: string;
				};
				Insert: {
					account_id: string;
					created_at?: string;
					email: string;
					expires_at?: string;
					id?: number;
					invite_token: string;
					invited_by: string;
					role: string;
					updated_at?: string;
				};
				Update: {
					account_id?: string;
					created_at?: string;
					email?: string;
					expires_at?: string;
					id?: number;
					invite_token?: string;
					invited_by?: string;
					role?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "invitations_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "invitations_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "user_account_workspace";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "invitations_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "user_accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "invitations_role_fkey";
						columns: ["role"];
						isOneToOne: false;
						referencedRelation: "roles";
						referencedColumns: ["name"];
					},
				];
			};
			lesson_progress: {
				Row: {
					completed_at: string | null;
					completion_percentage: number | null;
					course_id: string;
					id: string;
					lesson_id: string;
					started_at: string | null;
					user_id: string;
				};
				Insert: {
					completed_at?: string | null;
					completion_percentage?: number | null;
					course_id: string;
					id?: string;
					lesson_id: string;
					started_at?: string | null;
					user_id: string;
				};
				Update: {
					completed_at?: string | null;
					completion_percentage?: number | null;
					course_id?: string;
					id?: string;
					lesson_id?: string;
					started_at?: string | null;
					user_id?: string;
				};
				Relationships: [];
			};
			nonces: {
				Row: {
					client_token: string;
					created_at: string;
					expires_at: string;
					id: string;
					last_verification_at: string | null;
					last_verification_ip: unknown | null;
					last_verification_user_agent: string | null;
					metadata: Json | null;
					nonce: string;
					purpose: string;
					revoked: boolean;
					revoked_reason: string | null;
					scopes: string[] | null;
					used_at: string | null;
					user_id: string | null;
					verification_attempts: number;
				};
				Insert: {
					client_token: string;
					created_at?: string;
					expires_at: string;
					id?: string;
					last_verification_at?: string | null;
					last_verification_ip?: unknown | null;
					last_verification_user_agent?: string | null;
					metadata?: Json | null;
					nonce: string;
					purpose: string;
					revoked?: boolean;
					revoked_reason?: string | null;
					scopes?: string[] | null;
					used_at?: string | null;
					user_id?: string | null;
					verification_attempts?: number;
				};
				Update: {
					client_token?: string;
					created_at?: string;
					expires_at?: string;
					id?: string;
					last_verification_at?: string | null;
					last_verification_ip?: unknown | null;
					last_verification_user_agent?: string | null;
					metadata?: Json | null;
					nonce?: string;
					purpose?: string;
					revoked?: boolean;
					revoked_reason?: string | null;
					scopes?: string[] | null;
					used_at?: string | null;
					user_id?: string | null;
					verification_attempts?: number;
				};
				Relationships: [];
			};
			notifications: {
				Row: {
					account_id: string;
					body: string;
					channel: Database["public"]["Enums"]["notification_channel"];
					created_at: string;
					dismissed: boolean;
					expires_at: string | null;
					id: number;
					link: string | null;
					type: Database["public"]["Enums"]["notification_type"];
				};
				Insert: {
					account_id: string;
					body: string;
					channel?: Database["public"]["Enums"]["notification_channel"];
					created_at?: string;
					dismissed?: boolean;
					expires_at?: string | null;
					id?: never;
					link?: string | null;
					type?: Database["public"]["Enums"]["notification_type"];
				};
				Update: {
					account_id?: string;
					body?: string;
					channel?: Database["public"]["Enums"]["notification_channel"];
					created_at?: string;
					dismissed?: boolean;
					expires_at?: string | null;
					id?: never;
					link?: string | null;
					type?: Database["public"]["Enums"]["notification_type"];
				};
				Relationships: [
					{
						foreignKeyName: "notifications_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "notifications_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "user_account_workspace";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "notifications_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "user_accounts";
						referencedColumns: ["id"];
					},
				];
			};
			onboarding: {
				Row: {
					completed: boolean | null;
					completed_at: string | null;
					created_at: string | null;
					first_name: string | null;
					full_name: string | null;
					id: string;
					last_name: string | null;
					personal_project: string | null;
					primary_goal: string | null;
					school_level: string | null;
					school_major: string | null;
					secondary_goals: Json | null;
					theme_preference: string | null;
					updated_at: string | null;
					user_id: string;
					work_industry: string | null;
					work_role: string | null;
				};
				Insert: {
					completed?: boolean | null;
					completed_at?: string | null;
					created_at?: string | null;
					first_name?: string | null;
					full_name?: string | null;
					id?: string;
					last_name?: string | null;
					personal_project?: string | null;
					primary_goal?: string | null;
					school_level?: string | null;
					school_major?: string | null;
					secondary_goals?: Json | null;
					theme_preference?: string | null;
					updated_at?: string | null;
					user_id: string;
					work_industry?: string | null;
					work_role?: string | null;
				};
				Update: {
					completed?: boolean | null;
					completed_at?: string | null;
					created_at?: string | null;
					first_name?: string | null;
					full_name?: string | null;
					id?: string;
					last_name?: string | null;
					personal_project?: string | null;
					primary_goal?: string | null;
					school_level?: string | null;
					school_major?: string | null;
					secondary_goals?: Json | null;
					theme_preference?: string | null;
					updated_at?: string | null;
					user_id?: string;
					work_industry?: string | null;
					work_role?: string | null;
				};
				Relationships: [];
			};
			order_items: {
				Row: {
					created_at: string;
					id: string;
					order_id: string;
					price_amount: number | null;
					product_id: string;
					quantity: number;
					updated_at: string;
					variant_id: string;
				};
				Insert: {
					created_at?: string;
					id: string;
					order_id: string;
					price_amount?: number | null;
					product_id: string;
					quantity?: number;
					updated_at?: string;
					variant_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					order_id?: string;
					price_amount?: number | null;
					product_id?: string;
					quantity?: number;
					updated_at?: string;
					variant_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "order_items_order_id_fkey";
						columns: ["order_id"];
						isOneToOne: false;
						referencedRelation: "orders";
						referencedColumns: ["id"];
					},
				];
			};
			orders: {
				Row: {
					account_id: string;
					billing_customer_id: number;
					billing_provider: Database["public"]["Enums"]["billing_provider"];
					created_at: string;
					currency: string;
					id: string;
					status: Database["public"]["Enums"]["payment_status"];
					total_amount: number;
					updated_at: string;
				};
				Insert: {
					account_id: string;
					billing_customer_id: number;
					billing_provider: Database["public"]["Enums"]["billing_provider"];
					created_at?: string;
					currency: string;
					id: string;
					status: Database["public"]["Enums"]["payment_status"];
					total_amount: number;
					updated_at?: string;
				};
				Update: {
					account_id?: string;
					billing_customer_id?: number;
					billing_provider?: Database["public"]["Enums"]["billing_provider"];
					created_at?: string;
					currency?: string;
					id?: string;
					status?: Database["public"]["Enums"]["payment_status"];
					total_amount?: number;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "orders_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "orders_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "user_account_workspace";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "orders_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "user_accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "orders_billing_customer_id_fkey";
						columns: ["billing_customer_id"];
						isOneToOne: false;
						referencedRelation: "billing_customers";
						referencedColumns: ["id"];
					},
				];
			};
			quiz_attempts: {
				Row: {
					answers: Json | null;
					completed_at: string | null;
					course_id: string;
					id: string;
					lesson_id: string;
					passed: boolean | null;
					quiz_id: string;
					score: number | null;
					started_at: string | null;
					user_id: string;
				};
				Insert: {
					answers?: Json | null;
					completed_at?: string | null;
					course_id: string;
					id?: string;
					lesson_id: string;
					passed?: boolean | null;
					quiz_id: string;
					score?: number | null;
					started_at?: string | null;
					user_id: string;
				};
				Update: {
					answers?: Json | null;
					completed_at?: string | null;
					course_id?: string;
					id?: string;
					lesson_id?: string;
					passed?: boolean | null;
					quiz_id?: string;
					score?: number | null;
					started_at?: string | null;
					user_id?: string;
				};
				Relationships: [];
			};
			role_permissions: {
				Row: {
					id: number;
					permission: Database["public"]["Enums"]["app_permissions"];
					role: string;
				};
				Insert: {
					id?: number;
					permission: Database["public"]["Enums"]["app_permissions"];
					role: string;
				};
				Update: {
					id?: number;
					permission?: Database["public"]["Enums"]["app_permissions"];
					role?: string;
				};
				Relationships: [
					{
						foreignKeyName: "role_permissions_role_fkey";
						columns: ["role"];
						isOneToOne: false;
						referencedRelation: "roles";
						referencedColumns: ["name"];
					},
				];
			};
			roles: {
				Row: {
					hierarchy_level: number;
					name: string;
				};
				Insert: {
					hierarchy_level: number;
					name: string;
				};
				Update: {
					hierarchy_level?: number;
					name?: string;
				};
				Relationships: [];
			};
			subscription_items: {
				Row: {
					created_at: string;
					id: string;
					interval: string;
					interval_count: number;
					price_amount: number | null;
					product_id: string;
					quantity: number;
					subscription_id: string;
					type: Database["public"]["Enums"]["subscription_item_type"];
					updated_at: string;
					variant_id: string;
				};
				Insert: {
					created_at?: string;
					id: string;
					interval: string;
					interval_count: number;
					price_amount?: number | null;
					product_id: string;
					quantity?: number;
					subscription_id: string;
					type: Database["public"]["Enums"]["subscription_item_type"];
					updated_at?: string;
					variant_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					interval?: string;
					interval_count?: number;
					price_amount?: number | null;
					product_id?: string;
					quantity?: number;
					subscription_id?: string;
					type?: Database["public"]["Enums"]["subscription_item_type"];
					updated_at?: string;
					variant_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "subscription_items_subscription_id_fkey";
						columns: ["subscription_id"];
						isOneToOne: false;
						referencedRelation: "subscriptions";
						referencedColumns: ["id"];
					},
				];
			};
			subscriptions: {
				Row: {
					account_id: string;
					active: boolean;
					billing_customer_id: number;
					billing_provider: Database["public"]["Enums"]["billing_provider"];
					cancel_at_period_end: boolean;
					created_at: string;
					currency: string;
					id: string;
					period_ends_at: string;
					period_starts_at: string;
					status: Database["public"]["Enums"]["subscription_status"];
					trial_ends_at: string | null;
					trial_starts_at: string | null;
					updated_at: string;
				};
				Insert: {
					account_id: string;
					active: boolean;
					billing_customer_id: number;
					billing_provider: Database["public"]["Enums"]["billing_provider"];
					cancel_at_period_end: boolean;
					created_at?: string;
					currency: string;
					id: string;
					period_ends_at: string;
					period_starts_at: string;
					status: Database["public"]["Enums"]["subscription_status"];
					trial_ends_at?: string | null;
					trial_starts_at?: string | null;
					updated_at?: string;
				};
				Update: {
					account_id?: string;
					active?: boolean;
					billing_customer_id?: number;
					billing_provider?: Database["public"]["Enums"]["billing_provider"];
					cancel_at_period_end?: boolean;
					created_at?: string;
					currency?: string;
					id?: string;
					period_ends_at?: string;
					period_starts_at?: string;
					status?: Database["public"]["Enums"]["subscription_status"];
					trial_ends_at?: string | null;
					trial_starts_at?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "subscriptions_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "subscriptions_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "user_account_workspace";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "subscriptions_account_id_fkey";
						columns: ["account_id"];
						isOneToOne: false;
						referencedRelation: "user_accounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "subscriptions_billing_customer_id_fkey";
						columns: ["billing_customer_id"];
						isOneToOne: false;
						referencedRelation: "billing_customers";
						referencedColumns: ["id"];
					},
				];
			};
			subtasks: {
				Row: {
					created_at: string;
					id: string;
					is_completed: boolean | null;
					task_id: string;
					title: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					is_completed?: boolean | null;
					task_id: string;
					title: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					is_completed?: boolean | null;
					task_id?: string;
					title?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "subtasks_task_id_fkey";
						columns: ["task_id"];
						isOneToOne: false;
						referencedRelation: "tasks";
						referencedColumns: ["id"];
					},
				];
			};
			survey_progress: {
				Row: {
					created_at: string | null;
					current_question_index: number | null;
					id: string;
					last_answered_at: string | null;
					progress_percentage: number | null;
					survey_id: string;
					total_questions: number;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					current_question_index?: number | null;
					id?: string;
					last_answered_at?: string | null;
					progress_percentage?: number | null;
					survey_id: string;
					total_questions: number;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					current_question_index?: number | null;
					id?: string;
					last_answered_at?: string | null;
					progress_percentage?: number | null;
					survey_id?: string;
					total_questions?: number;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [];
			};
			survey_responses: {
				Row: {
					category_scores: Json | null;
					completed: boolean | null;
					created_at: string | null;
					highest_scoring_category: string | null;
					id: string;
					lowest_scoring_category: string | null;
					responses: Json | null;
					survey_id: string;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					category_scores?: Json | null;
					completed?: boolean | null;
					created_at?: string | null;
					highest_scoring_category?: string | null;
					id?: string;
					lowest_scoring_category?: string | null;
					responses?: Json | null;
					survey_id: string;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					category_scores?: Json | null;
					completed?: boolean | null;
					created_at?: string | null;
					highest_scoring_category?: string | null;
					id?: string;
					lowest_scoring_category?: string | null;
					responses?: Json | null;
					survey_id?: string;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [];
			};
			tasks: {
				Row: {
					account_id: string;
					created_at: string;
					description: string | null;
					id: string;
					image_url: string | null;
					priority: Database["public"]["Enums"]["task_priority"];
					status: Database["public"]["Enums"]["task_status"];
					title: string;
					updated_at: string;
				};
				Insert: {
					account_id: string;
					created_at?: string;
					description?: string | null;
					id?: string;
					image_url?: string | null;
					priority?: Database["public"]["Enums"]["task_priority"];
					status?: Database["public"]["Enums"]["task_status"];
					title: string;
					updated_at?: string;
				};
				Update: {
					account_id?: string;
					created_at?: string;
					description?: string | null;
					id?: string;
					image_url?: string | null;
					priority?: Database["public"]["Enums"]["task_priority"];
					status?: Database["public"]["Enums"]["task_status"];
					title?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			testimonials: {
				Row: {
					content: string;
					created_at: string;
					customer_avatar_url: string | null;
					customer_company_name: string | null;
					customer_name: string;
					id: string;
					link: string | null;
					rating: number;
					source: string;
					status: Database["public"]["Enums"]["testimonial_status"];
					updated_at: string;
					video_url: string | null;
				};
				Insert: {
					content: string;
					created_at?: string;
					customer_avatar_url?: string | null;
					customer_company_name?: string | null;
					customer_name: string;
					id?: string;
					link?: string | null;
					rating: number;
					source?: string;
					status?: Database["public"]["Enums"]["testimonial_status"];
					updated_at?: string;
					video_url?: string | null;
				};
				Update: {
					content?: string;
					created_at?: string;
					customer_avatar_url?: string | null;
					customer_company_name?: string | null;
					customer_name?: string;
					id?: string;
					link?: string | null;
					rating?: number;
					source?: string;
					status?: Database["public"]["Enums"]["testimonial_status"];
					updated_at?: string;
					video_url?: string | null;
				};
				Relationships: [];
			};
		};
		Views: {
			user_account_workspace: {
				Row: {
					id: string | null;
					name: string | null;
					picture_url: string | null;
					subscription_status:
						| Database["public"]["Enums"]["subscription_status"]
						| null;
				};
				Relationships: [];
			};
			user_accounts: {
				Row: {
					id: string | null;
					name: string | null;
					picture_url: string | null;
					role: string | null;
					slug: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "accounts_memberships_account_role_fkey";
						columns: ["role"];
						isOneToOne: false;
						referencedRelation: "roles";
						referencedColumns: ["name"];
					},
				];
			};
		};
		Functions: {
			accept_invitation: {
				Args: { token: string; user_id: string };
				Returns: string;
			};
			add_default_ai_allocations_for_existing_users: {
				Args: Record<PropertyKey, never>;
				Returns: number;
			};
			add_invitations_to_account: {
				Args: {
					account_slug: string;
					invitations: Database["public"]["CompositeTypes"]["invitation"][];
				};
				Returns: Database["public"]["Tables"]["invitations"]["Row"][];
			};
			calculate_ai_cost: {
				Args: {
					p_provider: string;
					p_model: string;
					p_prompt_tokens: number;
					p_completion_tokens: number;
				};
				Returns: number;
			};
			can_action_account_member: {
				Args: { target_team_account_id: string; target_user_id: string };
				Returns: boolean;
			};
			check_ai_usage_limits: {
				Args: {
					p_entity_type: string;
					p_entity_id: string;
					p_cost: number;
					p_tokens: number;
				};
				Returns: {
					limit_exceeded: boolean;
					limit_type: string;
					time_period: string;
					current_usage: number;
					max_value: number;
				}[];
			};
			create_invitation: {
				Args: { account_id: string; email: string; role: string };
				Returns: {
					account_id: string;
					created_at: string;
					email: string;
					expires_at: string;
					id: number;
					invite_token: string;
					invited_by: string;
					role: string;
					updated_at: string;
				};
			};
			create_nonce: {
				Args: {
					p_user_id?: string;
					p_purpose?: string;
					p_expires_in_seconds?: number;
					p_metadata?: Json;
					p_scopes?: string[];
					p_revoke_previous?: boolean;
				};
				Returns: Json;
			};
			create_team_account: {
				Args: { account_name: string };
				Returns: {
					created_at: string | null;
					created_by: string | null;
					email: string | null;
					id: string;
					is_personal_account: boolean;
					name: string;
					picture_url: string | null;
					primary_owner_user_id: string;
					public_data: Json;
					slug: string | null;
					updated_at: string | null;
					updated_by: string | null;
				};
			};
			deduct_ai_credits: {
				Args: {
					p_entity_type: string;
					p_entity_id: string;
					p_amount: number;
					p_feature: string;
					p_request_id: string;
				};
				Returns: boolean;
			};
			get_account_invitations: {
				Args: { account_slug: string };
				Returns: {
					id: number;
					email: string;
					account_id: string;
					invited_by: string;
					role: string;
					created_at: string;
					updated_at: string;
					expires_at: string;
					inviter_name: string;
					inviter_email: string;
				}[];
			};
			get_account_members: {
				Args: { account_slug: string };
				Returns: {
					id: string;
					user_id: string;
					account_id: string;
					role: string;
					role_hierarchy_level: number;
					primary_owner_user_id: string;
					name: string;
					email: string;
					picture_url: string;
					created_at: string;
					updated_at: string;
				}[];
			};
			get_config: {
				Args: Record<PropertyKey, never>;
				Returns: Json;
			};
			get_nonce_status: {
				Args: { p_id: string };
				Returns: Json;
			};
			get_upper_system_role: {
				Args: Record<PropertyKey, never>;
				Returns: string;
			};
			has_active_subscription: {
				Args: { target_account_id: string };
				Returns: boolean;
			};
			has_more_elevated_role: {
				Args: {
					target_user_id: string;
					target_account_id: string;
					role_name: string;
				};
				Returns: boolean;
			};
			has_permission: {
				Args: {
					user_id: string;
					account_id: string;
					permission_name: Database["public"]["Enums"]["app_permissions"];
				};
				Returns: boolean;
			};
			has_role_on_account: {
				Args: { account_id: string; account_role?: string };
				Returns: boolean;
			};
			has_same_role_hierarchy_level: {
				Args: {
					target_user_id: string;
					target_account_id: string;
					role_name: string;
				};
				Returns: boolean;
			};
			insert_certificate: {
				Args: { p_user_id: string; p_course_id: string; p_file_path: string };
				Returns: {
					id: string;
				}[];
			};
			is_aal2: {
				Args: Record<PropertyKey, never>;
				Returns: boolean;
			};
			is_account_owner: {
				Args: { account_id: string };
				Returns: boolean;
			};
			is_account_team_member: {
				Args: { target_account_id: string };
				Returns: boolean;
			};
			is_mfa_compliant: {
				Args: Record<PropertyKey, never>;
				Returns: boolean;
			};
			is_set: {
				Args: { field_name: string };
				Returns: boolean;
			};
			is_super_admin: {
				Args: Record<PropertyKey, never>;
				Returns: boolean;
			};
			is_team_member: {
				Args: { account_id: string; user_id: string };
				Returns: boolean;
			};
			reset_ai_allocations: {
				Args: Record<PropertyKey, never>;
				Returns: number;
			};
			revoke_nonce: {
				Args: { p_id: string; p_reason?: string };
				Returns: boolean;
			};
			team_account_workspace: {
				Args: { account_slug: string };
				Returns: {
					id: string;
					name: string;
					picture_url: string;
					slug: string;
					role: string;
					role_hierarchy_level: number;
					primary_owner_user_id: string;
					subscription_status: Database["public"]["Enums"]["subscription_status"];
					permissions: Database["public"]["Enums"]["app_permissions"][];
				}[];
			};
			transfer_team_account_ownership: {
				Args: { target_account_id: string; new_owner_id: string };
				Returns: undefined;
			};
			upsert_order: {
				Args: {
					target_account_id: string;
					target_customer_id: string;
					target_order_id: string;
					status: Database["public"]["Enums"]["payment_status"];
					billing_provider: Database["public"]["Enums"]["billing_provider"];
					total_amount: number;
					currency: string;
					line_items: Json;
				};
				Returns: {
					account_id: string;
					billing_customer_id: number;
					billing_provider: Database["public"]["Enums"]["billing_provider"];
					created_at: string;
					currency: string;
					id: string;
					status: Database["public"]["Enums"]["payment_status"];
					total_amount: number;
					updated_at: string;
				};
			};
			upsert_subscription: {
				Args: {
					target_account_id: string;
					target_customer_id: string;
					target_subscription_id: string;
					active: boolean;
					status: Database["public"]["Enums"]["subscription_status"];
					billing_provider: Database["public"]["Enums"]["billing_provider"];
					cancel_at_period_end: boolean;
					currency: string;
					period_starts_at: string;
					period_ends_at: string;
					line_items: Json;
					trial_starts_at?: string;
					trial_ends_at?: string;
				};
				Returns: {
					account_id: string;
					active: boolean;
					billing_customer_id: number;
					billing_provider: Database["public"]["Enums"]["billing_provider"];
					cancel_at_period_end: boolean;
					created_at: string;
					currency: string;
					id: string;
					period_ends_at: string;
					period_starts_at: string;
					status: Database["public"]["Enums"]["subscription_status"];
					trial_ends_at: string | null;
					trial_starts_at: string | null;
					updated_at: string;
				};
			};
			verify_nonce: {
				Args: {
					p_token: string;
					p_purpose: string;
					p_user_id?: string;
					p_required_scopes?: string[];
					p_max_verification_attempts?: number;
					p_ip?: unknown;
					p_user_agent?: string;
				};
				Returns: Json;
			};
		};
		Enums: {
			app_permissions:
				| "roles.manage"
				| "billing.manage"
				| "settings.manage"
				| "members.manage"
				| "invites.manage";
			billing_provider: "stripe" | "lemon-squeezy" | "paddle";
			notification_channel: "in_app" | "email";
			notification_type: "info" | "warning" | "error";
			payment_status: "pending" | "succeeded" | "failed";
			subscription_item_type: "flat" | "per_seat" | "metered";
			subscription_status:
				| "active"
				| "trialing"
				| "past_due"
				| "canceled"
				| "unpaid"
				| "incomplete"
				| "incomplete_expired"
				| "paused";
			task_priority: "low" | "medium" | "high";
			task_status: "do" | "doing" | "done";
			testimonial_status: "pending" | "approved" | "rejected";
		};
		CompositeTypes: {
			invitation: {
				email: string | null;
				role: string | null;
			};
		};
	};
	storage: {
		Tables: {
			buckets: {
				Row: {
					allowed_mime_types: string[] | null;
					avif_autodetection: boolean | null;
					created_at: string | null;
					file_size_limit: number | null;
					id: string;
					name: string;
					owner: string | null;
					owner_id: string | null;
					public: boolean | null;
					updated_at: string | null;
				};
				Insert: {
					allowed_mime_types?: string[] | null;
					avif_autodetection?: boolean | null;
					created_at?: string | null;
					file_size_limit?: number | null;
					id: string;
					name: string;
					owner?: string | null;
					owner_id?: string | null;
					public?: boolean | null;
					updated_at?: string | null;
				};
				Update: {
					allowed_mime_types?: string[] | null;
					avif_autodetection?: boolean | null;
					created_at?: string | null;
					file_size_limit?: number | null;
					id?: string;
					name?: string;
					owner?: string | null;
					owner_id?: string | null;
					public?: boolean | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			migrations: {
				Row: {
					executed_at: string | null;
					hash: string;
					id: number;
					name: string;
				};
				Insert: {
					executed_at?: string | null;
					hash: string;
					id: number;
					name: string;
				};
				Update: {
					executed_at?: string | null;
					hash?: string;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			objects: {
				Row: {
					bucket_id: string | null;
					created_at: string | null;
					id: string;
					last_accessed_at: string | null;
					level: number | null;
					metadata: Json | null;
					name: string | null;
					owner: string | null;
					owner_id: string | null;
					path_tokens: string[] | null;
					updated_at: string | null;
					user_metadata: Json | null;
					version: string | null;
				};
				Insert: {
					bucket_id?: string | null;
					created_at?: string | null;
					id?: string;
					last_accessed_at?: string | null;
					level?: number | null;
					metadata?: Json | null;
					name?: string | null;
					owner?: string | null;
					owner_id?: string | null;
					path_tokens?: string[] | null;
					updated_at?: string | null;
					user_metadata?: Json | null;
					version?: string | null;
				};
				Update: {
					bucket_id?: string | null;
					created_at?: string | null;
					id?: string;
					last_accessed_at?: string | null;
					level?: number | null;
					metadata?: Json | null;
					name?: string | null;
					owner?: string | null;
					owner_id?: string | null;
					path_tokens?: string[] | null;
					updated_at?: string | null;
					user_metadata?: Json | null;
					version?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "objects_bucketId_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets";
						referencedColumns: ["id"];
					},
				];
			};
			prefixes: {
				Row: {
					bucket_id: string;
					created_at: string | null;
					level: number;
					name: string;
					updated_at: string | null;
				};
				Insert: {
					bucket_id: string;
					created_at?: string | null;
					level?: number;
					name: string;
					updated_at?: string | null;
				};
				Update: {
					bucket_id?: string;
					created_at?: string | null;
					level?: number;
					name?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "prefixes_bucketId_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets";
						referencedColumns: ["id"];
					},
				];
			};
			s3_multipart_uploads: {
				Row: {
					bucket_id: string;
					created_at: string;
					id: string;
					in_progress_size: number;
					key: string;
					owner_id: string | null;
					upload_signature: string;
					user_metadata: Json | null;
					version: string;
				};
				Insert: {
					bucket_id: string;
					created_at?: string;
					id: string;
					in_progress_size?: number;
					key: string;
					owner_id?: string | null;
					upload_signature: string;
					user_metadata?: Json | null;
					version: string;
				};
				Update: {
					bucket_id?: string;
					created_at?: string;
					id?: string;
					in_progress_size?: number;
					key?: string;
					owner_id?: string | null;
					upload_signature?: string;
					user_metadata?: Json | null;
					version?: string;
				};
				Relationships: [
					{
						foreignKeyName: "s3_multipart_uploads_bucket_id_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets";
						referencedColumns: ["id"];
					},
				];
			};
			s3_multipart_uploads_parts: {
				Row: {
					bucket_id: string;
					created_at: string;
					etag: string;
					id: string;
					key: string;
					owner_id: string | null;
					part_number: number;
					size: number;
					upload_id: string;
					version: string;
				};
				Insert: {
					bucket_id: string;
					created_at?: string;
					etag: string;
					id?: string;
					key: string;
					owner_id?: string | null;
					part_number: number;
					size?: number;
					upload_id: string;
					version: string;
				};
				Update: {
					bucket_id?: string;
					created_at?: string;
					etag?: string;
					id?: string;
					key?: string;
					owner_id?: string | null;
					part_number?: number;
					size?: number;
					upload_id?: string;
					version?: string;
				};
				Relationships: [
					{
						foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey";
						columns: ["upload_id"];
						isOneToOne: false;
						referencedRelation: "s3_multipart_uploads";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			add_prefixes: {
				Args: { _bucket_id: string; _name: string };
				Returns: undefined;
			};
			can_insert_object: {
				Args: { bucketid: string; name: string; owner: string; metadata: Json };
				Returns: undefined;
			};
			delete_prefix: {
				Args: { _bucket_id: string; _name: string };
				Returns: boolean;
			};
			extension: {
				Args: { name: string };
				Returns: string;
			};
			filename: {
				Args: { name: string };
				Returns: string;
			};
			foldername: {
				Args: { name: string };
				Returns: string[];
			};
			get_level: {
				Args: { name: string };
				Returns: number;
			};
			get_prefix: {
				Args: { name: string };
				Returns: string;
			};
			get_prefixes: {
				Args: { name: string };
				Returns: string[];
			};
			get_size_by_bucket: {
				Args: Record<PropertyKey, never>;
				Returns: {
					size: number;
					bucket_id: string;
				}[];
			};
			list_multipart_uploads_with_delimiter: {
				Args: {
					bucket_id: string;
					prefix_param: string;
					delimiter_param: string;
					max_keys?: number;
					next_key_token?: string;
					next_upload_token?: string;
				};
				Returns: {
					key: string;
					id: string;
					created_at: string;
				}[];
			};
			list_objects_with_delimiter: {
				Args: {
					bucket_id: string;
					prefix_param: string;
					delimiter_param: string;
					max_keys?: number;
					start_after?: string;
					next_token?: string;
				};
				Returns: {
					name: string;
					id: string;
					metadata: Json;
					updated_at: string;
				}[];
			};
			operation: {
				Args: Record<PropertyKey, never>;
				Returns: string;
			};
			search: {
				Args: {
					prefix: string;
					bucketname: string;
					limits?: number;
					levels?: number;
					offsets?: number;
					search?: string;
					sortcolumn?: string;
					sortorder?: string;
				};
				Returns: {
					name: string;
					id: string;
					updated_at: string;
					created_at: string;
					last_accessed_at: string;
					metadata: Json;
				}[];
			};
			search_legacy_v1: {
				Args: {
					prefix: string;
					bucketname: string;
					limits?: number;
					levels?: number;
					offsets?: number;
					search?: string;
					sortcolumn?: string;
					sortorder?: string;
				};
				Returns: {
					name: string;
					id: string;
					updated_at: string;
					created_at: string;
					last_accessed_at: string;
					metadata: Json;
				}[];
			};
			search_v1_optimised: {
				Args: {
					prefix: string;
					bucketname: string;
					limits?: number;
					levels?: number;
					offsets?: number;
					search?: string;
					sortcolumn?: string;
					sortorder?: string;
				};
				Returns: {
					name: string;
					id: string;
					updated_at: string;
					created_at: string;
					last_accessed_at: string;
					metadata: Json;
				}[];
			};
			search_v2: {
				Args: {
					prefix: string;
					bucket_name: string;
					limits?: number;
					levels?: number;
					start_after?: string;
				};
				Returns: {
					key: string;
					name: string;
					id: string;
					updated_at: string;
					created_at: string;
					metadata: Json;
				}[];
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof Database },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	payload: {
		Enums: {},
	},
	public: {
		Enums: {
			app_permissions: [
				"roles.manage",
				"billing.manage",
				"settings.manage",
				"members.manage",
				"invites.manage",
			],
			billing_provider: ["stripe", "lemon-squeezy", "paddle"],
			notification_channel: ["in_app", "email"],
			notification_type: ["info", "warning", "error"],
			payment_status: ["pending", "succeeded", "failed"],
			subscription_item_type: ["flat", "per_seat", "metered"],
			subscription_status: [
				"active",
				"trialing",
				"past_due",
				"canceled",
				"unpaid",
				"incomplete",
				"incomplete_expired",
				"paused",
			],
			task_priority: ["low", "medium", "high"],
			task_status: ["do", "doing", "done"],
			testimonial_status: ["pending", "approved", "rejected"],
		},
	},
	storage: {
		Enums: {},
	},
} as const;
