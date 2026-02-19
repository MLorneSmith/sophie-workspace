export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  payload: {
    Tables: {
      _course_lessons_v: {
        Row: {
          created_at: string
          id: string
          latest: boolean | null
          parent_id: string | null
          updated_at: string
          version__status:
            | Database["payload"]["Enums"]["enum__course_lessons_v_version_status"]
            | null
          version_bunny_library_id: string | null
          version_bunny_video_id: string | null
          version_content: Json | null
          version_course_id_id: string | null
          version_created_at: string | null
          version_description: string | null
          version_estimated_duration: number | null
          version_lesson_image_id: string | null
          version_lesson_number: number | null
          version_published_at: string | null
          version_quiz_id_id: string | null
          version_slug: string | null
          version_survey_id_id: string | null
          version_thumbnail_id: string | null
          version_title: string | null
          version_todo: Json | null
          version_todo_complete_quiz: boolean | null
          version_todo_course_project: Json | null
          version_todo_read_content: Json | null
          version_todo_watch_content: Json | null
          version_updated_at: string | null
          version_video_source_type:
            | Database["payload"]["Enums"]["enum__course_lessons_v_version_video_source_type"]
            | null
          version_youtube_video_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__course_lessons_v_version_status"]
            | null
          version_bunny_library_id?: string | null
          version_bunny_video_id?: string | null
          version_content?: Json | null
          version_course_id_id?: string | null
          version_created_at?: string | null
          version_description?: string | null
          version_estimated_duration?: number | null
          version_lesson_image_id?: string | null
          version_lesson_number?: number | null
          version_published_at?: string | null
          version_quiz_id_id?: string | null
          version_slug?: string | null
          version_survey_id_id?: string | null
          version_thumbnail_id?: string | null
          version_title?: string | null
          version_todo?: Json | null
          version_todo_complete_quiz?: boolean | null
          version_todo_course_project?: Json | null
          version_todo_read_content?: Json | null
          version_todo_watch_content?: Json | null
          version_updated_at?: string | null
          version_video_source_type?:
            | Database["payload"]["Enums"]["enum__course_lessons_v_version_video_source_type"]
            | null
          version_youtube_video_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__course_lessons_v_version_status"]
            | null
          version_bunny_library_id?: string | null
          version_bunny_video_id?: string | null
          version_content?: Json | null
          version_course_id_id?: string | null
          version_created_at?: string | null
          version_description?: string | null
          version_estimated_duration?: number | null
          version_lesson_image_id?: string | null
          version_lesson_number?: number | null
          version_published_at?: string | null
          version_quiz_id_id?: string | null
          version_slug?: string | null
          version_survey_id_id?: string | null
          version_thumbnail_id?: string | null
          version_title?: string | null
          version_todo?: Json | null
          version_todo_complete_quiz?: boolean | null
          version_todo_course_project?: Json | null
          version_todo_read_content?: Json | null
          version_todo_watch_content?: Json | null
          version_updated_at?: string | null
          version_video_source_type?:
            | Database["payload"]["Enums"]["enum__course_lessons_v_version_video_source_type"]
            | null
          version_youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_course_lessons_v_parent_id_course_lessons_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_course_lessons_v_version_course_id_id_courses_id_fk"
            columns: ["version_course_id_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_course_lessons_v_version_lesson_image_id_media_id_fk"
            columns: ["version_lesson_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_course_lessons_v_version_quiz_id_id_course_quizzes_id_fk"
            columns: ["version_quiz_id_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_course_lessons_v_version_survey_id_id_surveys_id_fk"
            columns: ["version_survey_id_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_course_lessons_v_version_thumbnail_id_media_id_fk"
            columns: ["version_thumbnail_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      _course_lessons_v_rels: {
        Row: {
          downloads_id: string | null
          id: number
          order: number | null
          parent_id: string
          path: string
        }
        Insert: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id: string
          path: string
        }
        Update: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "_course_lessons_v_rels_downloads_fk"
            columns: ["downloads_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_course_lessons_v_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "_course_lessons_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _course_quizzes_v: {
        Row: {
          created_at: string
          id: string
          latest: boolean | null
          parent_id: string | null
          updated_at: string
          version__status:
            | Database["payload"]["Enums"]["enum__course_quizzes_v_version_status"]
            | null
          version_course_id_id: string | null
          version_created_at: string | null
          version_description: string | null
          version_pass_threshold: number | null
          version_slug: string | null
          version_title: string | null
          version_updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__course_quizzes_v_version_status"]
            | null
          version_course_id_id?: string | null
          version_created_at?: string | null
          version_description?: string | null
          version_pass_threshold?: number | null
          version_slug?: string | null
          version_title?: string | null
          version_updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__course_quizzes_v_version_status"]
            | null
          version_course_id_id?: string | null
          version_created_at?: string | null
          version_description?: string | null
          version_pass_threshold?: number | null
          version_slug?: string | null
          version_title?: string | null
          version_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_course_quizzes_v_parent_id_course_quizzes_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_course_quizzes_v_version_course_id_id_courses_id_fk"
            columns: ["version_course_id_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      _course_quizzes_v_rels: {
        Row: {
          id: number
          order: number | null
          parent_id: string
          path: string
          quiz_questions_id: string | null
        }
        Insert: {
          id?: number
          order?: number | null
          parent_id: string
          path: string
          quiz_questions_id?: string | null
        }
        Update: {
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
          quiz_questions_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_course_quizzes_v_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "_course_quizzes_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_course_quizzes_v_rels_quiz_questions_fk"
            columns: ["quiz_questions_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      _courses_v: {
        Row: {
          created_at: string
          id: string
          latest: boolean | null
          parent_id: string | null
          updated_at: string
          version__status:
            | Database["payload"]["Enums"]["enum__courses_v_version_status"]
            | null
          version_content: Json | null
          version_created_at: string | null
          version_description: string | null
          version_published_at: string | null
          version_slug: string | null
          version_status:
            | Database["payload"]["Enums"]["enum__courses_v_version_status"]
            | null
          version_title: string | null
          version_updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__courses_v_version_status"]
            | null
          version_content?: Json | null
          version_created_at?: string | null
          version_description?: string | null
          version_published_at?: string | null
          version_slug?: string | null
          version_status?:
            | Database["payload"]["Enums"]["enum__courses_v_version_status"]
            | null
          version_title?: string | null
          version_updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__courses_v_version_status"]
            | null
          version_content?: Json | null
          version_created_at?: string | null
          version_description?: string | null
          version_published_at?: string | null
          version_slug?: string | null
          version_status?:
            | Database["payload"]["Enums"]["enum__courses_v_version_status"]
            | null
          version_title?: string | null
          version_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_courses_v_parent_id_courses_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      _courses_v_rels: {
        Row: {
          downloads_id: string | null
          id: number
          order: number | null
          parent_id: string
          path: string
        }
        Insert: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id: string
          path: string
        }
        Update: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "_courses_v_rels_downloads_fk"
            columns: ["downloads_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_courses_v_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "_courses_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _documentation_v: {
        Row: {
          created_at: string
          id: string
          latest: boolean | null
          parent_id: string | null
          updated_at: string
          version__status:
            | Database["payload"]["Enums"]["enum__documentation_v_version_status"]
            | null
          version_content: Json | null
          version_created_at: string | null
          version_description: string | null
          version_order: number | null
          version_parent_id: string | null
          version_published_at: string | null
          version_slug: string | null
          version_status:
            | Database["payload"]["Enums"]["enum__documentation_v_version_status"]
            | null
          version_title: string | null
          version_updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__documentation_v_version_status"]
            | null
          version_content?: Json | null
          version_created_at?: string | null
          version_description?: string | null
          version_order?: number | null
          version_parent_id?: string | null
          version_published_at?: string | null
          version_slug?: string | null
          version_status?:
            | Database["payload"]["Enums"]["enum__documentation_v_version_status"]
            | null
          version_title?: string | null
          version_updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__documentation_v_version_status"]
            | null
          version_content?: Json | null
          version_created_at?: string | null
          version_description?: string | null
          version_order?: number | null
          version_parent_id?: string | null
          version_published_at?: string | null
          version_slug?: string | null
          version_status?:
            | Database["payload"]["Enums"]["enum__documentation_v_version_status"]
            | null
          version_title?: string | null
          version_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_documentation_v_parent_id_documentation_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_documentation_v_version_parent_id_documentation_id_fk"
            columns: ["version_parent_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
        ]
      }
      _documentation_v_rels: {
        Row: {
          downloads_id: string | null
          id: number
          order: number | null
          parent_id: string
          path: string
        }
        Insert: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id: string
          path: string
        }
        Update: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "_documentation_v_rels_downloads_fk"
            columns: ["downloads_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_documentation_v_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "_documentation_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _documentation_v_version_breadcrumbs: {
        Row: {
          _order: number
          _parent_id: string
          _uuid: string | null
          doc_id: string | null
          id: string
          label: string | null
          url: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          _uuid?: string | null
          doc_id?: string | null
          id?: string
          label?: string | null
          url?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          _uuid?: string | null
          doc_id?: string | null
          id?: string
          label?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_documentation_v_version_breadcrumbs_doc_id_documentation_id_fk"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_documentation_v_version_breadcrumbs_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_documentation_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _documentation_v_version_categories: {
        Row: {
          _order: number
          _parent_id: string
          _uuid: string | null
          category: string | null
          id: string
        }
        Insert: {
          _order: number
          _parent_id: string
          _uuid?: string | null
          category?: string | null
          id?: string
        }
        Update: {
          _order?: number
          _parent_id?: string
          _uuid?: string | null
          category?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "_documentation_v_version_categories_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_documentation_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _documentation_v_version_tags: {
        Row: {
          _order: number
          _parent_id: string
          _uuid: string | null
          id: string
          tag: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          _uuid?: string | null
          id?: string
          tag?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          _uuid?: string | null
          id?: string
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_documentation_v_version_tags_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_documentation_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _posts_v: {
        Row: {
          created_at: string
          id: string
          latest: boolean | null
          parent_id: string | null
          updated_at: string
          version__status:
            | Database["payload"]["Enums"]["enum__posts_v_version_status"]
            | null
          version_content: Json | null
          version_created_at: string | null
          version_description: string | null
          version_image_id_id: string | null
          version_published_at: string | null
          version_slug: string | null
          version_status:
            | Database["payload"]["Enums"]["enum__posts_v_version_status"]
            | null
          version_title: string | null
          version_updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__posts_v_version_status"]
            | null
          version_content?: Json | null
          version_created_at?: string | null
          version_description?: string | null
          version_image_id_id?: string | null
          version_published_at?: string | null
          version_slug?: string | null
          version_status?:
            | Database["payload"]["Enums"]["enum__posts_v_version_status"]
            | null
          version_title?: string | null
          version_updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__posts_v_version_status"]
            | null
          version_content?: Json | null
          version_created_at?: string | null
          version_description?: string | null
          version_image_id_id?: string | null
          version_published_at?: string | null
          version_slug?: string | null
          version_status?:
            | Database["payload"]["Enums"]["enum__posts_v_version_status"]
            | null
          version_title?: string | null
          version_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_posts_v_parent_id_posts_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_posts_v_version_image_id_id_media_id_fk"
            columns: ["version_image_id_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      _posts_v_rels: {
        Row: {
          downloads_id: string | null
          id: number
          order: number | null
          parent_id: string
          path: string
        }
        Insert: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id: string
          path: string
        }
        Update: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "_posts_v_rels_downloads_fk"
            columns: ["downloads_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_posts_v_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "_posts_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _posts_v_version_categories: {
        Row: {
          _order: number
          _parent_id: string
          _uuid: string | null
          category: string | null
          id: string
        }
        Insert: {
          _order: number
          _parent_id: string
          _uuid?: string | null
          category?: string | null
          id?: string
        }
        Update: {
          _order?: number
          _parent_id?: string
          _uuid?: string | null
          category?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "_posts_v_version_categories_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_posts_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _posts_v_version_tags: {
        Row: {
          _order: number
          _parent_id: string
          _uuid: string | null
          id: string
          tag: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          _uuid?: string | null
          id?: string
          tag?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          _uuid?: string | null
          id?: string
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_posts_v_version_tags_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_posts_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _private_posts_v: {
        Row: {
          created_at: string
          id: string
          latest: boolean | null
          parent_id: string | null
          updated_at: string
          version__status:
            | Database["payload"]["Enums"]["enum__private_posts_v_version_status"]
            | null
          version_content: Json | null
          version_created_at: string | null
          version_description: string | null
          version_featured_image_id_id: string | null
          version_image_id_id: string | null
          version_published_at: string | null
          version_slug: string | null
          version_status:
            | Database["payload"]["Enums"]["enum__private_posts_v_version_status"]
            | null
          version_title: string | null
          version_updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__private_posts_v_version_status"]
            | null
          version_content?: Json | null
          version_created_at?: string | null
          version_description?: string | null
          version_featured_image_id_id?: string | null
          version_image_id_id?: string | null
          version_published_at?: string | null
          version_slug?: string | null
          version_status?:
            | Database["payload"]["Enums"]["enum__private_posts_v_version_status"]
            | null
          version_title?: string | null
          version_updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__private_posts_v_version_status"]
            | null
          version_content?: Json | null
          version_created_at?: string | null
          version_description?: string | null
          version_featured_image_id_id?: string | null
          version_image_id_id?: string | null
          version_published_at?: string | null
          version_slug?: string | null
          version_status?:
            | Database["payload"]["Enums"]["enum__private_posts_v_version_status"]
            | null
          version_title?: string | null
          version_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_private_posts_v_parent_id_private_posts_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "private_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_private_posts_v_version_featured_image_id_id_downloads_id_fk"
            columns: ["version_featured_image_id_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_private_posts_v_version_image_id_id_downloads_id_fk"
            columns: ["version_image_id_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
        ]
      }
      _private_posts_v_rels: {
        Row: {
          downloads_id: string | null
          id: number
          order: number | null
          parent_id: string
          path: string
        }
        Insert: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id: string
          path: string
        }
        Update: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "_private_posts_v_rels_downloads_fk"
            columns: ["downloads_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_private_posts_v_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "_private_posts_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _private_posts_v_version_categories: {
        Row: {
          _order: number
          _parent_id: string
          _uuid: string | null
          category: string | null
          id: string
        }
        Insert: {
          _order: number
          _parent_id: string
          _uuid?: string | null
          category?: string | null
          id?: string
        }
        Update: {
          _order?: number
          _parent_id?: string
          _uuid?: string | null
          category?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "_private_posts_v_version_categories_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_private_posts_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _private_posts_v_version_tags: {
        Row: {
          _order: number
          _parent_id: string
          _uuid: string | null
          id: string
          tag: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          _uuid?: string | null
          id?: string
          tag?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          _uuid?: string | null
          id?: string
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_private_posts_v_version_tags_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_private_posts_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _survey_questions_v: {
        Row: {
          created_at: string
          id: string
          latest: boolean | null
          parent_id: string | null
          updated_at: string
          version__status:
            | Database["payload"]["Enums"]["enum__survey_questions_v_version_status"]
            | null
          version_category: string | null
          version_created_at: string | null
          version_description: string | null
          version_position: number | null
          version_question_slug: string | null
          version_questionspin:
            | Database["payload"]["Enums"]["enum__survey_questions_v_version_questionspin"]
            | null
          version_required: boolean | null
          version_text: string | null
          version_type:
            | Database["payload"]["Enums"]["enum__survey_questions_v_version_type"]
            | null
          version_updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__survey_questions_v_version_status"]
            | null
          version_category?: string | null
          version_created_at?: string | null
          version_description?: string | null
          version_position?: number | null
          version_question_slug?: string | null
          version_questionspin?:
            | Database["payload"]["Enums"]["enum__survey_questions_v_version_questionspin"]
            | null
          version_required?: boolean | null
          version_text?: string | null
          version_type?:
            | Database["payload"]["Enums"]["enum__survey_questions_v_version_type"]
            | null
          version_updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__survey_questions_v_version_status"]
            | null
          version_category?: string | null
          version_created_at?: string | null
          version_description?: string | null
          version_position?: number | null
          version_question_slug?: string | null
          version_questionspin?:
            | Database["payload"]["Enums"]["enum__survey_questions_v_version_questionspin"]
            | null
          version_required?: boolean | null
          version_text?: string | null
          version_type?:
            | Database["payload"]["Enums"]["enum__survey_questions_v_version_type"]
            | null
          version_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_survey_questions_v_parent_id_survey_questions_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      _survey_questions_v_version_options: {
        Row: {
          _order: number
          _parent_id: string
          _uuid: string | null
          id: string
          option: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          _uuid?: string | null
          id?: string
          option?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          _uuid?: string | null
          id?: string
          option?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_survey_questions_v_version_options_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_survey_questions_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _surveys_v: {
        Row: {
          created_at: string
          id: string
          latest: boolean | null
          parent_id: string | null
          updated_at: string
          version__status:
            | Database["payload"]["Enums"]["enum__surveys_v_version_status"]
            | null
          version_created_at: string | null
          version_description: string | null
          version_published_at: string | null
          version_slug: string | null
          version_title: string | null
          version_updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__surveys_v_version_status"]
            | null
          version_created_at?: string | null
          version_description?: string | null
          version_published_at?: string | null
          version_slug?: string | null
          version_title?: string | null
          version_updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latest?: boolean | null
          parent_id?: string | null
          updated_at?: string
          version__status?:
            | Database["payload"]["Enums"]["enum__surveys_v_version_status"]
            | null
          version_created_at?: string | null
          version_description?: string | null
          version_published_at?: string | null
          version_slug?: string | null
          version_title?: string | null
          version_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_surveys_v_parent_id_surveys_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      _surveys_v_rels: {
        Row: {
          id: number
          order: number | null
          parent_id: string
          path: string
          survey_questions_id: string | null
        }
        Insert: {
          id?: number
          order?: number | null
          parent_id: string
          path: string
          survey_questions_id?: string | null
        }
        Update: {
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
          survey_questions_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_surveys_v_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "_surveys_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_surveys_v_rels_survey_questions_fk"
            columns: ["survey_questions_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          _status:
            | Database["payload"]["Enums"]["enum_course_lessons_status"]
            | null
          bunny_library_id: string | null
          bunny_video_id: string | null
          content: Json | null
          course_id_id: string | null
          created_at: string
          description: string | null
          estimated_duration: number | null
          id: string
          lesson_image_id: string | null
          lesson_number: number | null
          published_at: string | null
          quiz_id_id: string | null
          slug: string | null
          survey_id_id: string | null
          thumbnail_id: string | null
          title: string | null
          todo: Json | null
          todo_complete_quiz: boolean | null
          todo_course_project: Json | null
          todo_read_content: Json | null
          todo_watch_content: Json | null
          updated_at: string
          video_source_type:
            | Database["payload"]["Enums"]["enum_course_lessons_video_source_type"]
            | null
          youtube_video_id: string | null
        }
        Insert: {
          _status?:
            | Database["payload"]["Enums"]["enum_course_lessons_status"]
            | null
          bunny_library_id?: string | null
          bunny_video_id?: string | null
          content?: Json | null
          course_id_id?: string | null
          created_at?: string
          description?: string | null
          estimated_duration?: number | null
          id?: string
          lesson_image_id?: string | null
          lesson_number?: number | null
          published_at?: string | null
          quiz_id_id?: string | null
          slug?: string | null
          survey_id_id?: string | null
          thumbnail_id?: string | null
          title?: string | null
          todo?: Json | null
          todo_complete_quiz?: boolean | null
          todo_course_project?: Json | null
          todo_read_content?: Json | null
          todo_watch_content?: Json | null
          updated_at?: string
          video_source_type?:
            | Database["payload"]["Enums"]["enum_course_lessons_video_source_type"]
            | null
          youtube_video_id?: string | null
        }
        Update: {
          _status?:
            | Database["payload"]["Enums"]["enum_course_lessons_status"]
            | null
          bunny_library_id?: string | null
          bunny_video_id?: string | null
          content?: Json | null
          course_id_id?: string | null
          created_at?: string
          description?: string | null
          estimated_duration?: number | null
          id?: string
          lesson_image_id?: string | null
          lesson_number?: number | null
          published_at?: string | null
          quiz_id_id?: string | null
          slug?: string | null
          survey_id_id?: string | null
          thumbnail_id?: string | null
          title?: string | null
          todo?: Json | null
          todo_complete_quiz?: boolean | null
          todo_course_project?: Json | null
          todo_read_content?: Json | null
          todo_watch_content?: Json | null
          updated_at?: string
          video_source_type?:
            | Database["payload"]["Enums"]["enum_course_lessons_video_source_type"]
            | null
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_id_courses_id_fk"
            columns: ["course_id_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_lesson_image_id_media_id_fk"
            columns: ["lesson_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_quiz_id_id_course_quizzes_id_fk"
            columns: ["quiz_id_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_survey_id_id_surveys_id_fk"
            columns: ["survey_id_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_thumbnail_id_media_id_fk"
            columns: ["thumbnail_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons_rels: {
        Row: {
          downloads_id: string | null
          id: number
          order: number | null
          parent_id: string
          path: string
        }
        Insert: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id: string
          path: string
        }
        Update: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_rels_downloads_fk"
            columns: ["downloads_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quizzes: {
        Row: {
          _status:
            | Database["payload"]["Enums"]["enum_course_quizzes_status"]
            | null
          course_id_id: string | null
          created_at: string
          description: string | null
          id: string
          pass_threshold: number | null
          slug: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          _status?:
            | Database["payload"]["Enums"]["enum_course_quizzes_status"]
            | null
          course_id_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pass_threshold?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          _status?:
            | Database["payload"]["Enums"]["enum_course_quizzes_status"]
            | null
          course_id_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pass_threshold?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_quizzes_course_id_id_courses_id_fk"
            columns: ["course_id_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quizzes_rels: {
        Row: {
          id: number
          order: number | null
          parent_id: string
          path: string
          quiz_questions_id: string | null
        }
        Insert: {
          id?: number
          order?: number | null
          parent_id: string
          path: string
          quiz_questions_id?: string | null
        }
        Update: {
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
          quiz_questions_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_quizzes_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_quizzes_rels_quiz_questions_fk"
            columns: ["quiz_questions_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          _status: Database["payload"]["Enums"]["enum_courses_status"] | null
          content: Json | null
          created_at: string
          description: string | null
          id: string
          published_at: string | null
          slug: string | null
          status: Database["payload"]["Enums"]["enum_courses_status"] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          _status?: Database["payload"]["Enums"]["enum_courses_status"] | null
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string | null
          slug?: string | null
          status?: Database["payload"]["Enums"]["enum_courses_status"] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          _status?: Database["payload"]["Enums"]["enum_courses_status"] | null
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string | null
          slug?: string | null
          status?: Database["payload"]["Enums"]["enum_courses_status"] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      courses_rels: {
        Row: {
          downloads_id: string | null
          id: number
          order: number | null
          parent_id: string
          path: string
        }
        Insert: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id: string
          path: string
        }
        Update: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_rels_downloads_fk"
            columns: ["downloads_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation: {
        Row: {
          _status:
            | Database["payload"]["Enums"]["enum_documentation_status"]
            | null
          content: Json | null
          created_at: string
          description: string | null
          id: string
          order: number | null
          parent_id: string | null
          published_at: string | null
          slug: string | null
          status:
            | Database["payload"]["Enums"]["enum_documentation_status"]
            | null
          title: string | null
          updated_at: string
        }
        Insert: {
          _status?:
            | Database["payload"]["Enums"]["enum_documentation_status"]
            | null
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          order?: number | null
          parent_id?: string | null
          published_at?: string | null
          slug?: string | null
          status?:
            | Database["payload"]["Enums"]["enum_documentation_status"]
            | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          _status?:
            | Database["payload"]["Enums"]["enum_documentation_status"]
            | null
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          order?: number | null
          parent_id?: string | null
          published_at?: string | null
          slug?: string | null
          status?:
            | Database["payload"]["Enums"]["enum_documentation_status"]
            | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentation_parent_id_documentation_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_breadcrumbs: {
        Row: {
          _order: number
          _parent_id: string
          doc_id: string | null
          id: string
          label: string | null
          url: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          doc_id?: string | null
          id: string
          label?: string | null
          url?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          doc_id?: string | null
          id?: string
          label?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentation_breadcrumbs_doc_id_documentation_id_fk"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_breadcrumbs_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_categories: {
        Row: {
          _order: number
          _parent_id: string
          category: string | null
          id: string
        }
        Insert: {
          _order: number
          _parent_id: string
          category?: string | null
          id: string
        }
        Update: {
          _order?: number
          _parent_id?: string
          category?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentation_categories_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_rels: {
        Row: {
          downloads_id: string | null
          id: number
          order: number | null
          parent_id: string
          path: string
        }
        Insert: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id: string
          path: string
        }
        Update: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentation_rels_downloads_fk"
            columns: ["downloads_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_tags: {
        Row: {
          _order: number
          _parent_id: string
          id: string
          tag: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          id: string
          tag?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          id?: string
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentation_tags_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
        ]
      }
      downloads: {
        Row: {
          access_level:
            | Database["payload"]["Enums"]["enum_downloads_access_level"]
            | null
          category:
            | Database["payload"]["Enums"]["enum_downloads_category"]
            | null
          created_at: string
          description: string | null
          download_count: number | null
          featured: boolean | null
          filename: string | null
          filesize: number | null
          focal_x: number | null
          focal_y: number | null
          height: number | null
          id: string
          mime_type: string | null
          thumbnail_u_r_l: string | null
          title: string
          updated_at: string
          url: string | null
          width: number | null
        }
        Insert: {
          access_level?:
            | Database["payload"]["Enums"]["enum_downloads_access_level"]
            | null
          category?:
            | Database["payload"]["Enums"]["enum_downloads_category"]
            | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          featured?: boolean | null
          filename?: string | null
          filesize?: number | null
          focal_x?: number | null
          focal_y?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          thumbnail_u_r_l?: string | null
          title: string
          updated_at?: string
          url?: string | null
          width?: number | null
        }
        Update: {
          access_level?:
            | Database["payload"]["Enums"]["enum_downloads_access_level"]
            | null
          category?:
            | Database["payload"]["Enums"]["enum_downloads_category"]
            | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          featured?: boolean | null
          filename?: string | null
          filesize?: number | null
          focal_x?: number | null
          focal_y?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          thumbnail_u_r_l?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          width?: number | null
        }
        Relationships: []
      }
      downloads_tags: {
        Row: {
          _order: number
          _parent_id: string
          id: string
          tag: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          id: string
          tag?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          id?: string
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downloads_tags_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt: string
          caption: string | null
          created_at: string
          filename: string | null
          filesize: number | null
          focal_x: number | null
          focal_y: number | null
          height: number | null
          id: string
          mime_type: string | null
          thumbnail_u_r_l: string | null
          type: Database["payload"]["Enums"]["enum_media_type"] | null
          updated_at: string
          url: string | null
          width: number | null
        }
        Insert: {
          alt: string
          caption?: string | null
          created_at?: string
          filename?: string | null
          filesize?: number | null
          focal_x?: number | null
          focal_y?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          thumbnail_u_r_l?: string | null
          type?: Database["payload"]["Enums"]["enum_media_type"] | null
          updated_at?: string
          url?: string | null
          width?: number | null
        }
        Update: {
          alt?: string
          caption?: string | null
          created_at?: string
          filename?: string | null
          filesize?: number | null
          focal_x?: number | null
          focal_y?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          thumbnail_u_r_l?: string | null
          type?: Database["payload"]["Enums"]["enum_media_type"] | null
          updated_at?: string
          url?: string | null
          width?: number | null
        }
        Relationships: []
      }
      media_tags: {
        Row: {
          _order: number
          _parent_id: string
          id: string
          tag: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          id: string
          tag?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          id?: string
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_tags_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_kv: {
        Row: {
          data: Json
          id: string
          key: string
        }
        Insert: {
          data: Json
          id?: string
          key: string
        }
        Update: {
          data?: Json
          id?: string
          key?: string
        }
        Relationships: []
      }
      payload_locked_documents: {
        Row: {
          created_at: string
          global_slug: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          global_slug?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          global_slug?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      payload_locked_documents_rels: {
        Row: {
          course_lessons_id: string | null
          course_quizzes_id: string | null
          courses_id: string | null
          documentation_id: string | null
          downloads_id: string | null
          id: number
          media_id: string | null
          order: number | null
          parent_id: string
          path: string
          posts_id: string | null
          private_posts_id: string | null
          quiz_questions_id: string | null
          survey_questions_id: string | null
          surveys_id: string | null
          users_id: string | null
        }
        Insert: {
          course_lessons_id?: string | null
          course_quizzes_id?: string | null
          courses_id?: string | null
          documentation_id?: string | null
          downloads_id?: string | null
          id?: number
          media_id?: string | null
          order?: number | null
          parent_id: string
          path: string
          posts_id?: string | null
          private_posts_id?: string | null
          quiz_questions_id?: string | null
          survey_questions_id?: string | null
          surveys_id?: string | null
          users_id?: string | null
        }
        Update: {
          course_lessons_id?: string | null
          course_quizzes_id?: string | null
          courses_id?: string | null
          documentation_id?: string | null
          downloads_id?: string | null
          id?: number
          media_id?: string | null
          order?: number | null
          parent_id?: string
          path?: string
          posts_id?: string | null
          private_posts_id?: string | null
          quiz_questions_id?: string | null
          survey_questions_id?: string | null
          surveys_id?: string | null
          users_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_locked_documents_rels_course_lessons_fk"
            columns: ["course_lessons_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_course_quizzes_fk"
            columns: ["course_quizzes_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_courses_fk"
            columns: ["courses_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_documentation_fk"
            columns: ["documentation_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_downloads_fk"
            columns: ["downloads_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_media_fk"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "payload_locked_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_posts_fk"
            columns: ["posts_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_private_posts_fk"
            columns: ["private_posts_id"]
            isOneToOne: false
            referencedRelation: "private_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_quiz_questions_fk"
            columns: ["quiz_questions_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_survey_questions_fk"
            columns: ["survey_questions_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_surveys_fk"
            columns: ["surveys_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_users_fk"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_migrations: {
        Row: {
          batch: number | null
          created_at: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          batch?: number | null
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          batch?: number | null
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payload_preferences: {
        Row: {
          created_at: string
          id: string
          key: string | null
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key?: string | null
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string | null
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      payload_preferences_rels: {
        Row: {
          id: number
          order: number | null
          parent_id: string
          path: string
          users_id: string | null
        }
        Insert: {
          id?: number
          order?: number | null
          parent_id: string
          path: string
          users_id?: string | null
        }
        Update: {
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
          users_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_preferences_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "payload_preferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_preferences_rels_users_fk"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          _status: Database["payload"]["Enums"]["enum_posts_status"] | null
          content: Json | null
          created_at: string
          description: string | null
          id: string
          image_id_id: string | null
          published_at: string | null
          slug: string | null
          status: Database["payload"]["Enums"]["enum_posts_status"] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          _status?: Database["payload"]["Enums"]["enum_posts_status"] | null
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_id_id?: string | null
          published_at?: string | null
          slug?: string | null
          status?: Database["payload"]["Enums"]["enum_posts_status"] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          _status?: Database["payload"]["Enums"]["enum_posts_status"] | null
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_id_id?: string | null
          published_at?: string | null
          slug?: string | null
          status?: Database["payload"]["Enums"]["enum_posts_status"] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_image_id_id_media_id_fk"
            columns: ["image_id_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_categories: {
        Row: {
          _order: number
          _parent_id: string
          category: string | null
          id: string
        }
        Insert: {
          _order: number
          _parent_id: string
          category?: string | null
          id: string
        }
        Update: {
          _order?: number
          _parent_id?: string
          category?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_categories_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_rels: {
        Row: {
          downloads_id: string | null
          id: number
          order: number | null
          parent_id: string
          path: string
        }
        Insert: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id: string
          path: string
        }
        Update: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_rels_downloads_fk"
            columns: ["downloads_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_tags: {
        Row: {
          _order: number
          _parent_id: string
          id: string
          tag: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          id: string
          tag?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          id?: string
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_tags_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      private_posts: {
        Row: {
          _status:
            | Database["payload"]["Enums"]["enum_private_posts_status"]
            | null
          content: Json | null
          created_at: string
          description: string | null
          featured_image_id_id: string | null
          id: string
          image_id_id: string | null
          published_at: string | null
          slug: string | null
          status:
            | Database["payload"]["Enums"]["enum_private_posts_status"]
            | null
          title: string | null
          updated_at: string
        }
        Insert: {
          _status?:
            | Database["payload"]["Enums"]["enum_private_posts_status"]
            | null
          content?: Json | null
          created_at?: string
          description?: string | null
          featured_image_id_id?: string | null
          id?: string
          image_id_id?: string | null
          published_at?: string | null
          slug?: string | null
          status?:
            | Database["payload"]["Enums"]["enum_private_posts_status"]
            | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          _status?:
            | Database["payload"]["Enums"]["enum_private_posts_status"]
            | null
          content?: Json | null
          created_at?: string
          description?: string | null
          featured_image_id_id?: string | null
          id?: string
          image_id_id?: string | null
          published_at?: string | null
          slug?: string | null
          status?:
            | Database["payload"]["Enums"]["enum_private_posts_status"]
            | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_posts_featured_image_id_id_downloads_id_fk"
            columns: ["featured_image_id_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_posts_image_id_id_downloads_id_fk"
            columns: ["image_id_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
        ]
      }
      private_posts_categories: {
        Row: {
          _order: number
          _parent_id: string
          category: string | null
          id: string
        }
        Insert: {
          _order: number
          _parent_id: string
          category?: string | null
          id: string
        }
        Update: {
          _order?: number
          _parent_id?: string
          category?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_posts_categories_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "private_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      private_posts_rels: {
        Row: {
          downloads_id: string | null
          id: number
          order: number | null
          parent_id: string
          path: string
        }
        Insert: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id: string
          path: string
        }
        Update: {
          downloads_id?: string | null
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_posts_rels_downloads_fk"
            columns: ["downloads_id"]
            isOneToOne: false
            referencedRelation: "downloads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_posts_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "private_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      private_posts_tags: {
        Row: {
          _order: number
          _parent_id: string
          id: string
          tag: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          id: string
          tag?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          id?: string
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_posts_tags_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "private_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          explanation: Json | null
          id: string
          order: number | null
          question: string
          question_slug: string
          questiontype:
            | Database["payload"]["Enums"]["enum_quiz_questions_questiontype"]
            | null
          type: Database["payload"]["Enums"]["enum_quiz_questions_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation?: Json | null
          id?: string
          order?: number | null
          question: string
          question_slug: string
          questiontype?:
            | Database["payload"]["Enums"]["enum_quiz_questions_questiontype"]
            | null
          type?: Database["payload"]["Enums"]["enum_quiz_questions_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: Json | null
          id?: string
          order?: number | null
          question?: string
          question_slug?: string
          questiontype?:
            | Database["payload"]["Enums"]["enum_quiz_questions_questiontype"]
            | null
          type?: Database["payload"]["Enums"]["enum_quiz_questions_type"]
          updated_at?: string
        }
        Relationships: []
      }
      quiz_questions_options: {
        Row: {
          _order: number
          _parent_id: string
          id: string
          is_correct: boolean | null
          text: string
        }
        Insert: {
          _order: number
          _parent_id: string
          id: string
          is_correct?: boolean | null
          text: string
        }
        Update: {
          _order?: number
          _parent_id?: string
          id?: string
          is_correct?: boolean | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_options_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          _status:
            | Database["payload"]["Enums"]["enum_survey_questions_status"]
            | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          position: number | null
          question_slug: string | null
          questionspin:
            | Database["payload"]["Enums"]["enum_survey_questions_questionspin"]
            | null
          required: boolean | null
          text: string | null
          type:
            | Database["payload"]["Enums"]["enum_survey_questions_type"]
            | null
          updated_at: string
        }
        Insert: {
          _status?:
            | Database["payload"]["Enums"]["enum_survey_questions_status"]
            | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          position?: number | null
          question_slug?: string | null
          questionspin?:
            | Database["payload"]["Enums"]["enum_survey_questions_questionspin"]
            | null
          required?: boolean | null
          text?: string | null
          type?:
            | Database["payload"]["Enums"]["enum_survey_questions_type"]
            | null
          updated_at?: string
        }
        Update: {
          _status?:
            | Database["payload"]["Enums"]["enum_survey_questions_status"]
            | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          position?: number | null
          question_slug?: string | null
          questionspin?:
            | Database["payload"]["Enums"]["enum_survey_questions_questionspin"]
            | null
          required?: boolean | null
          text?: string | null
          type?:
            | Database["payload"]["Enums"]["enum_survey_questions_type"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      survey_questions_options: {
        Row: {
          _order: number
          _parent_id: string
          id: string
          option: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          id: string
          option?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          id?: string
          option?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_options_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          _status: Database["payload"]["Enums"]["enum_surveys_status"] | null
          created_at: string
          description: string | null
          id: string
          published_at: string | null
          slug: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          _status?: Database["payload"]["Enums"]["enum_surveys_status"] | null
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string | null
          slug?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          _status?: Database["payload"]["Enums"]["enum_surveys_status"] | null
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string | null
          slug?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      surveys_rels: {
        Row: {
          id: number
          order: number | null
          parent_id: string
          path: string
          survey_questions_id: string | null
        }
        Insert: {
          id?: number
          order?: number | null
          parent_id: string
          path: string
          survey_questions_id?: string | null
        }
        Update: {
          id?: number
          order?: number | null
          parent_id?: string
          path?: string
          survey_questions_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_rels_survey_questions_fk"
            columns: ["survey_questions_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          hash: string | null
          id: string
          lock_until: string | null
          login_attempts: number | null
          name: string | null
          reset_password_expiration: string | null
          reset_password_token: string | null
          role: Database["payload"]["Enums"]["enum_users_role"]
          salt: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          hash?: string | null
          id?: string
          lock_until?: string | null
          login_attempts?: number | null
          name?: string | null
          reset_password_expiration?: string | null
          reset_password_token?: string | null
          role?: Database["payload"]["Enums"]["enum_users_role"]
          salt?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          hash?: string | null
          id?: string
          lock_until?: string | null
          login_attempts?: number | null
          name?: string | null
          reset_password_expiration?: string | null
          reset_password_token?: string | null
          role?: Database["payload"]["Enums"]["enum_users_role"]
          salt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      users_sessions: {
        Row: {
          _order: number
          _parent_id: string
          created_at: string | null
          expires_at: string
          id: string
        }
        Insert: {
          _order: number
          _parent_id: string
          created_at?: string | null
          expires_at: string
          id: string
        }
        Update: {
          _order?: number
          _parent_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_sessions_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      collection_has_download: {
        Args: {
          collection_id: string
          collection_type: string
          download_id: string
        }
        Returns: boolean
      }
      ensure_downloads_id_column: {
        Args: { table_name: string }
        Returns: undefined
      }
      ensure_downloads_id_column_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      ensure_relationship_columns: {
        Args: { table_name: string }
        Returns: undefined
      }
      fix_dynamic_table: { Args: { table_name: string }; Returns: boolean }
      get_downloads_for_collection: {
        Args: { collection_id: string; collection_type: string }
        Returns: {
          download_id: string
        }[]
      }
      get_relationship_data: {
        Args: { fallback_column?: string; id: string; table_name: string }
        Returns: string
      }
      safe_uuid_conversion: { Args: { text_value: string }; Returns: string }
    }
    Enums: {
      enum__course_lessons_v_version_status: "draft" | "published"
      enum__course_lessons_v_version_video_source_type: "youtube" | "vimeo"
      enum__course_quizzes_v_version_status: "draft" | "published"
      enum__courses_v_version_status: "draft" | "published"
      enum__documentation_v_version_status: "draft" | "published"
      enum__posts_v_version_status: "draft" | "published"
      enum__private_posts_v_version_status: "draft" | "published"
      enum__survey_questions_v_version_questionspin: "Positive" | "Negative"
      enum__survey_questions_v_version_status: "draft" | "published"
      enum__survey_questions_v_version_type:
        | "multiple_choice"
        | "text_field"
        | "textarea"
        | "scale"
      enum__surveys_v_version_status: "draft" | "published"
      enum_course_lessons_status: "draft" | "published"
      enum_course_lessons_video_source_type: "youtube" | "vimeo"
      enum_course_quizzes_status: "draft" | "published"
      enum_courses_status: "draft" | "published"
      enum_documentation_status: "draft" | "published"
      enum_downloads_access_level: "public" | "registered" | "premium"
      enum_downloads_category:
        | "document"
        | "template"
        | "resource"
        | "software"
        | "media"
        | "archive"
        | "other"
      enum_media_type: "image" | "video" | "document"
      enum_posts_status: "draft" | "published"
      enum_private_posts_status: "draft" | "published"
      enum_quiz_questions_questiontype: "single-answer" | "multi-answer"
      enum_quiz_questions_type: "multiple_choice"
      enum_survey_questions_questionspin: "Positive" | "Negative"
      enum_survey_questions_status: "draft" | "published"
      enum_survey_questions_type:
        | "multiple_choice"
        | "text_field"
        | "textarea"
        | "scale"
      enum_surveys_status: "draft" | "published"
      enum_users_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_personal_account: boolean
          name: string
          picture_url: string | null
          primary_owner_user_id: string
          public_data: Json
          slug: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_personal_account?: boolean
          name: string
          picture_url?: string | null
          primary_owner_user_id?: string
          public_data?: Json
          slug?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_personal_account?: boolean
          name?: string
          picture_url?: string | null
          primary_owner_user_id?: string
          public_data?: Json
          slug?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      accounts_memberships: {
        Row: {
          account_id: string
          account_role: string
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          account_role: string
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          account_role?: string
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_memberships_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_memberships_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_memberships_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_memberships_account_role_fkey"
            columns: ["account_role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
      ai_cost_configuration: {
        Row: {
          created_at: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          input_cost_per_1k_tokens: number
          is_active: boolean | null
          markup_percentage: number | null
          model: string
          output_cost_per_1k_tokens: number
          provider: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          input_cost_per_1k_tokens: number
          is_active?: boolean | null
          markup_percentage?: number | null
          model: string
          output_cost_per_1k_tokens: number
          provider: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          input_cost_per_1k_tokens?: number
          is_active?: boolean | null
          markup_percentage?: number | null
          model?: string
          output_cost_per_1k_tokens?: number
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_credit_transactions: {
        Row: {
          allocation_id: string | null
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          team_id: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          allocation_id?: string | null
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          team_id?: string | null
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          allocation_id?: string | null
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          team_id?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_credit_transactions_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_credit_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_credit_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_credit_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_request_logs: {
        Row: {
          completion_tokens: number
          cost: number
          created_at: string | null
          error: string | null
          feature: string | null
          id: string
          model: string
          portkey_verified: boolean | null
          prompt_tokens: number
          provider: string
          request_id: string | null
          request_timestamp: string | null
          session_id: string | null
          status: string | null
          team_id: string | null
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number
          cost?: number
          created_at?: string | null
          error?: string | null
          feature?: string | null
          id?: string
          model: string
          portkey_verified?: boolean | null
          prompt_tokens?: number
          provider: string
          request_id?: string | null
          request_timestamp?: string | null
          session_id?: string | null
          status?: string | null
          team_id?: string | null
          total_tokens?: number
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number
          cost?: number
          created_at?: string | null
          error?: string | null
          feature?: string | null
          id?: string
          model?: string
          portkey_verified?: boolean | null
          prompt_tokens?: number
          provider?: string
          request_id?: string | null
          request_timestamp?: string | null
          session_id?: string | null
          status?: string | null
          team_id?: string | null
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_request_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_request_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_request_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_allocations: {
        Row: {
          allocation_type: string
          created_at: string | null
          credits_allocated: number
          credits_used: number
          id: string
          is_active: boolean | null
          next_reset_at: string | null
          reset_frequency: string | null
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allocation_type: string
          created_at?: string | null
          credits_allocated?: number
          credits_used?: number
          id?: string
          is_active?: boolean | null
          next_reset_at?: string | null
          reset_frequency?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allocation_type?: string
          created_at?: string | null
          credits_allocated?: number
          credits_used?: number
          id?: string
          is_active?: boolean | null
          next_reset_at?: string | null
          reset_frequency?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_allocations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_allocations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_allocations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_limits: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          limit_type: string
          max_value: number
          team_id: string | null
          time_period: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          limit_type: string
          max_value: number
          team_id?: string | null
          time_period: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          limit_type?: string
          max_value?: number
          team_id?: string | null
          time_period?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_limits_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_limits_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_limits_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      assemble_outputs: {
        Row: {
          account_id: string
          argument_map: Json
          complication: string
          created_at: string
          id: string
          presentation_id: string
          presentation_type: string
          question_type: string
          situation: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          argument_map?: Json
          complication?: string
          created_at?: string
          id?: string
          presentation_id: string
          presentation_type: string
          question_type: string
          situation?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          argument_map?: Json
          complication?: string
          created_at?: string
          id?: string
          presentation_id?: string
          presentation_type?: string
          question_type?: string
          situation?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assemble_outputs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assemble_outputs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assemble_outputs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assemble_outputs_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: true
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      audience_profiles: {
        Row: {
          account_id: string
          adaptive_answers: Json
          brief_structured: Json
          brief_text: string | null
          company: string | null
          created_at: string
          enrichment_data: Json
          id: string
          linkedin_url: string | null
          person_name: string
          presentation_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          adaptive_answers?: Json
          brief_structured?: Json
          brief_text?: string | null
          company?: string | null
          created_at?: string
          enrichment_data?: Json
          id?: string
          linkedin_url?: string | null
          person_name: string
          presentation_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          adaptive_answers?: Json
          brief_structured?: Json
          brief_text?: string | null
          company?: string | null
          created_at?: string
          enrichment_data?: Json
          id?: string
          linkedin_url?: string | null
          person_name?: string
          presentation_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audience_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_customers: {
        Row: {
          account_id: string
          customer_id: string
          email: string | null
          id: number
          provider: Database["public"]["Enums"]["billing_provider"]
        }
        Insert: {
          account_id: string
          customer_id: string
          email?: string | null
          id?: number
          provider: Database["public"]["Enums"]["billing_provider"]
        }
        Update: {
          account_id?: string
          customer_id?: string
          email?: string | null
          id?: number
          provider?: Database["public"]["Enums"]["billing_provider"]
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_customers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_customers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      building_blocks_submissions: {
        Row: {
          answer: string | null
          audience: string | null
          complication: string | null
          created_at: string | null
          id: string
          outline: string | null
          presentation_type: string | null
          question_type: string | null
          situation: string | null
          storyboard: Json | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          answer?: string | null
          audience?: string | null
          complication?: string | null
          created_at?: string | null
          id?: string
          outline?: string | null
          presentation_type?: string | null
          question_type?: string | null
          situation?: string | null
          storyboard?: Json | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          answer?: string | null
          audience?: string | null
          complication?: string | null
          created_at?: string | null
          id?: string
          outline?: string | null
          presentation_type?: string | null
          question_type?: string | null
          situation?: string | null
          storyboard?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          course_id: string
          created_at: string | null
          file_path: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          file_path: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          file_path?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      config: {
        Row: {
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          enable_account_billing: boolean
          enable_courses: boolean
          enable_team_account_billing: boolean
          enable_team_accounts: boolean
        }
        Insert: {
          billing_provider?: Database["public"]["Enums"]["billing_provider"]
          enable_account_billing?: boolean
          enable_courses?: boolean
          enable_team_account_billing?: boolean
          enable_team_accounts?: boolean
        }
        Update: {
          billing_provider?: Database["public"]["Enums"]["billing_provider"]
          enable_account_billing?: boolean
          enable_courses?: boolean
          enable_team_account_billing?: boolean
          enable_team_accounts?: boolean
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          certificate_generated: boolean | null
          completed_at: string | null
          completion_percentage: number | null
          course_id: string
          current_lesson_id: string | null
          id: string
          last_accessed_at: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          certificate_generated?: boolean | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_id: string
          current_lesson_id?: string | null
          id?: string
          last_accessed_at?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          certificate_generated?: boolean | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_id?: string
          current_lesson_id?: string | null
          id?: string
          last_accessed_at?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generate_outputs: {
        Row: {
          account_id: string
          created_at: string
          export_format: string | null
          export_url: string | null
          generated_at: string | null
          id: string
          presentation_id: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          export_format?: string | null
          export_url?: string | null
          generated_at?: string | null
          id?: string
          presentation_id: string
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          export_format?: string | null
          export_url?: string | null
          generated_at?: string | null
          id?: string
          presentation_id?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generate_outputs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generate_outputs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generate_outputs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generate_outputs_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: true
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          account_id: string
          created_at: string
          email: string
          expires_at: string
          id: number
          invite_token: string
          invited_by: string
          role: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: number
          invite_token: string
          invited_by: string
          role: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: number
          invite_token?: string
          invited_by?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          course_id: string
          id: string
          lesson_id: string
          started_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          course_id: string
          id?: string
          lesson_id: string
          started_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          course_id?: string
          id?: string
          lesson_id?: string
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      maintenance_log: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          id: number
          message: string | null
          operation: string
          status: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          id?: number
          message?: string | null
          operation: string
          status?: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          id?: number
          message?: string | null
          operation?: string
          status?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          content: string | null
          created_at: string
          file_url: string | null
          id: string
          mime_type: string | null
          name: string
          presentation_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          mime_type?: string | null
          name: string
          presentation_id: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          presentation_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      nonces: {
        Row: {
          client_token: string
          created_at: string
          expires_at: string
          id: string
          last_verification_at: string | null
          last_verification_ip: unknown
          last_verification_user_agent: string | null
          metadata: Json | null
          nonce: string
          purpose: string
          revoked: boolean
          revoked_reason: string | null
          scopes: string[] | null
          used_at: string | null
          user_id: string | null
          verification_attempts: number
        }
        Insert: {
          client_token: string
          created_at?: string
          expires_at: string
          id?: string
          last_verification_at?: string | null
          last_verification_ip?: unknown
          last_verification_user_agent?: string | null
          metadata?: Json | null
          nonce: string
          purpose: string
          revoked?: boolean
          revoked_reason?: string | null
          scopes?: string[] | null
          used_at?: string | null
          user_id?: string | null
          verification_attempts?: number
        }
        Update: {
          client_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_verification_at?: string | null
          last_verification_ip?: unknown
          last_verification_user_agent?: string | null
          metadata?: Json | null
          nonce?: string
          purpose?: string
          revoked?: boolean
          revoked_reason?: string | null
          scopes?: string[] | null
          used_at?: string | null
          user_id?: string | null
          verification_attempts?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          account_id: string
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          dismissed: boolean
          expires_at: string | null
          id: number
          link: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          account_id: string
          body: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          dismissed?: boolean
          expires_at?: string | null
          id?: never
          link?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          account_id?: string
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          dismissed?: boolean
          expires_at?: string | null
          id?: never
          link?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          personal_project: string | null
          primary_goal: string | null
          school_level: string | null
          school_major: string | null
          secondary_goals: Json | null
          theme_preference: string | null
          updated_at: string | null
          user_id: string
          work_industry: string | null
          work_role: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          personal_project?: string | null
          primary_goal?: string | null
          school_level?: string | null
          school_major?: string | null
          secondary_goals?: Json | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id: string
          work_industry?: string | null
          work_role?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          personal_project?: string | null
          primary_goal?: string | null
          school_level?: string | null
          school_major?: string | null
          secondary_goals?: Json | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id?: string
          work_industry?: string | null
          work_role?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_amount: number | null
          product_id: string
          quantity: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          id: string
          order_id: string
          price_amount?: number | null
          product_id: string
          quantity?: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_amount?: number | null
          product_id?: string
          quantity?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          account_id: string
          billing_customer_id: number
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["payment_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          account_id: string
          billing_customer_id: number
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          created_at?: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["payment_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          billing_customer_id?: number
          billing_provider?: Database["public"]["Enums"]["billing_provider"]
          created_at?: string
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_billing_customer_id_fkey"
            columns: ["billing_customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      outline_contents: {
        Row: {
          account_id: string
          created_at: string
          id: string
          presentation_id: string
          sections: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          presentation_id: string
          sections?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          presentation_id?: string
          sections?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outline_contents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outline_contents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outline_contents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outline_contents_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: true
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentations: {
        Row: {
          account_id: string
          audience_profile_id: string | null
          completed_steps: string[]
          created_at: string
          current_step: string
          id: string
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          audience_profile_id?: string | null
          completed_steps?: string[]
          created_at?: string
          current_step?: string
          id?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          audience_profile_id?: string | null
          completed_steps?: string[]
          created_at?: string
          current_step?: string
          id?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentations_audience_profile_id_fkey"
            columns: ["audience_profile_id"]
            isOneToOne: false
            referencedRelation: "audience_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          course_id: string
          id: string
          lesson_id: string
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          course_id: string
          id?: string
          lesson_id: string
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          course_id?: string
          id?: string
          lesson_id?: string
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["app_permissions"]
          role: string
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["app_permissions"]
          role: string
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["app_permissions"]
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
      roles: {
        Row: {
          hierarchy_level: number
          name: string
        }
        Insert: {
          hierarchy_level: number
          name: string
        }
        Update: {
          hierarchy_level?: number
          name?: string
        }
        Relationships: []
      }
      storyboard_contents: {
        Row: {
          account_id: string
          created_at: string
          id: string
          presentation_id: string
          slides: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          presentation_id: string
          slides?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          presentation_id?: string
          slides?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storyboard_contents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_contents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_contents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_contents_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: true
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_items: {
        Row: {
          created_at: string
          id: string
          interval: string
          interval_count: number
          price_amount: number | null
          product_id: string
          quantity: number
          subscription_id: string
          type: Database["public"]["Enums"]["subscription_item_type"]
          updated_at: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          id: string
          interval: string
          interval_count: number
          price_amount?: number | null
          product_id: string
          quantity?: number
          subscription_id: string
          type: Database["public"]["Enums"]["subscription_item_type"]
          updated_at?: string
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interval?: string
          interval_count?: number
          price_amount?: number | null
          product_id?: string
          quantity?: number
          subscription_id?: string
          type?: Database["public"]["Enums"]["subscription_item_type"]
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_items_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          account_id: string
          active: boolean
          billing_customer_id: number
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          cancel_at_period_end: boolean
          created_at: string
          currency: string
          id: string
          period_ends_at: string
          period_starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          trial_starts_at: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          active: boolean
          billing_customer_id: number
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          cancel_at_period_end: boolean
          created_at?: string
          currency: string
          id: string
          period_ends_at: string
          period_starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_starts_at?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          active?: boolean
          billing_customer_id?: number
          billing_provider?: Database["public"]["Enums"]["billing_provider"]
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          id?: string
          period_ends_at?: string
          period_starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_account_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_billing_customer_id_fkey"
            columns: ["billing_customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean | null
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_progress: {
        Row: {
          created_at: string | null
          current_question_index: number | null
          id: string
          last_answered_at: string | null
          progress_percentage: number | null
          survey_id: string
          total_questions: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_question_index?: number | null
          id?: string
          last_answered_at?: string | null
          progress_percentage?: number | null
          survey_id: string
          total_questions: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_question_index?: number | null
          id?: string
          last_answered_at?: string | null
          progress_percentage?: number | null
          survey_id?: string
          total_questions?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          category_scores: Json | null
          completed: boolean | null
          created_at: string | null
          highest_scoring_category: string | null
          id: string
          lowest_scoring_category: string | null
          responses: Json | null
          survey_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_scores?: Json | null
          completed?: boolean | null
          created_at?: string | null
          highest_scoring_category?: string | null
          id?: string
          lowest_scoring_category?: string | null
          responses?: Json | null
          survey_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_scores?: Json | null
          completed?: boolean | null
          created_at?: string | null
          highest_scoring_category?: string | null
          id?: string
          lowest_scoring_category?: string | null
          responses?: Json | null
          survey_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          account_id: string
          created_at: string
          description: string | null
          id: string
          phase: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          description?: string | null
          id?: string
          phase?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string | null
          id?: string
          phase?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          content: string
          created_at: string
          customer_avatar_url: string | null
          customer_company_name: string | null
          customer_name: string
          id: string
          link: string | null
          rating: number
          source: string
          status: Database["public"]["Enums"]["testimonial_status"]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string
          customer_avatar_url?: string | null
          customer_company_name?: string | null
          customer_name: string
          id?: string
          link?: string | null
          rating: number
          source?: string
          status?: Database["public"]["Enums"]["testimonial_status"]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          customer_avatar_url?: string | null
          customer_company_name?: string | null
          customer_name?: string
          id?: string
          link?: string | null
          rating?: number
          source?: string
          status?: Database["public"]["Enums"]["testimonial_status"]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      timezone_cache: {
        Row: {
          abbrev: string | null
          is_dst: boolean | null
          name: string | null
          utc_offset: unknown
        }
        Relationships: []
      }
      timezone_performance_monitor: {
        Row: {
          avg_duration_ms: number | null
          cached_timezones: number | null
          last_checked: string | null
          query_type: string | null
          total_calls: number | null
          total_duration_ms: number | null
          total_timezones: number | null
        }
        Relationships: []
      }
      user_account_workspace: {
        Row: {
          id: string | null
          name: string | null
          picture_url: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          id: string | null
          name: string | null
          picture_url: string | null
          role: string | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_memberships_account_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: {
        Args: { token: string; user_id: string }
        Returns: string
      }
      add_default_ai_allocations_for_existing_users: {
        Args: never
        Returns: number
      }
      add_invitations_to_account: {
        Args: {
          account_slug: string
          invitations: Database["public"]["CompositeTypes"]["invitation"][]
        }
        Returns: Database["public"]["Tables"]["invitations"]["Row"][]
      }
      calculate_ai_cost: {
        Args: {
          p_completion_tokens: number
          p_model: string
          p_prompt_tokens: number
          p_provider: string
        }
        Returns: number
      }
      can_action_account_member: {
        Args: { target_team_account_id: string; target_user_id: string }
        Returns: boolean
      }
      check_ai_usage_limits: {
        Args: {
          p_cost: number
          p_entity_id: string
          p_entity_type: string
          p_tokens: number
        }
        Returns: {
          current_usage: number
          limit_exceeded: boolean
          limit_type: string
          max_value: number
          time_period: string
        }[]
      }
      check_is_aal2: { Args: never; Returns: boolean }
      create_invitation: {
        Args: { account_id: string; email: string; role: string }
        Returns: {
          account_id: string
          created_at: string
          email: string
          expires_at: string
          id: number
          invite_token: string
          invited_by: string
          role: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_nonce: {
        Args: {
          p_expires_in_seconds?: number
          p_metadata?: Json
          p_purpose?: string
          p_revoke_previous?: boolean
          p_scopes?: string[]
          p_user_id?: string
        }
        Returns: Json
      }
      create_team_account: {
        Args: { account_name: string }
        Returns: {
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_personal_account: boolean
          name: string
          picture_url: string | null
          primary_owner_user_id: string
          public_data: Json
          slug: string | null
          updated_at: string | null
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      deduct_ai_credits: {
        Args: {
          p_amount: number
          p_entity_id: string
          p_entity_type: string
          p_feature: string
          p_request_id: string
        }
        Returns: boolean
      }
      get_account_invitations: {
        Args: { account_slug: string }
        Returns: {
          account_id: string
          created_at: string
          email: string
          expires_at: string
          id: number
          invited_by: string
          inviter_email: string
          inviter_name: string
          role: string
          updated_at: string
        }[]
      }
      get_account_members: {
        Args: { account_slug: string }
        Returns: {
          account_id: string
          created_at: string
          email: string
          id: string
          name: string
          picture_url: string
          primary_owner_user_id: string
          role: string
          role_hierarchy_level: number
          updated_at: string
          user_id: string
        }[]
      }
      get_config: { Args: never; Returns: Json }
      get_is_super_admin: { Args: never; Returns: boolean }
      get_nonce_status: { Args: { p_id: string }; Returns: Json }
      get_upper_system_role: { Args: never; Returns: string }
      has_active_subscription: {
        Args: { target_account_id: string }
        Returns: boolean
      }
      has_more_elevated_role: {
        Args: {
          role_name: string
          target_account_id: string
          target_user_id: string
        }
        Returns: boolean
      }
      has_permission: {
        Args: {
          account_id: string
          permission_name: Database["public"]["Enums"]["app_permissions"]
          user_id: string
        }
        Returns: boolean
      }
      has_role_on_account: {
        Args: { account_id: string; account_role?: string }
        Returns: boolean
      }
      has_same_role_hierarchy_level: {
        Args: {
          role_name: string
          target_account_id: string
          target_user_id: string
        }
        Returns: boolean
      }
      insert_certificate: {
        Args: { p_course_id: string; p_file_path: string; p_user_id: string }
        Returns: {
          id: string
        }[]
      }
      is_aal2: { Args: never; Returns: boolean }
      is_account_owner: { Args: { account_id: string }; Returns: boolean }
      is_account_team_member: {
        Args: { target_account_id: string }
        Returns: boolean
      }
      is_mfa_compliant: { Args: never; Returns: boolean }
      is_set: { Args: { field_name: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_team_member: {
        Args: { account_id: string; user_id: string }
        Returns: boolean
      }
      refresh_timezone_cache: { Args: never; Returns: string }
      reset_ai_allocations: { Args: never; Returns: number }
      revoke_nonce: {
        Args: { p_id: string; p_reason?: string }
        Returns: boolean
      }
      team_account_workspace: {
        Args: { account_slug: string }
        Returns: {
          id: string
          name: string
          permissions: Database["public"]["Enums"]["app_permissions"][]
          picture_url: string
          primary_owner_user_id: string
          role: string
          role_hierarchy_level: number
          slug: string
          subscription_status: Database["public"]["Enums"]["subscription_status"]
        }[]
      }
      transfer_team_account_ownership: {
        Args: { new_owner_id: string; target_account_id: string }
        Returns: undefined
      }
      upsert_order: {
        Args: {
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          currency: string
          line_items: Json
          status: Database["public"]["Enums"]["payment_status"]
          target_account_id: string
          target_customer_id: string
          target_order_id: string
          total_amount: number
        }
        Returns: {
          account_id: string
          billing_customer_id: number
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["payment_status"]
          total_amount: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_subscription: {
        Args: {
          active: boolean
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          cancel_at_period_end: boolean
          currency: string
          line_items: Json
          period_ends_at: string
          period_starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          target_account_id: string
          target_customer_id: string
          target_subscription_id: string
          trial_ends_at?: string
          trial_starts_at?: string
        }
        Returns: {
          account_id: string
          active: boolean
          billing_customer_id: number
          billing_provider: Database["public"]["Enums"]["billing_provider"]
          cancel_at_period_end: boolean
          created_at: string
          currency: string
          id: string
          period_ends_at: string
          period_starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          trial_starts_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_nonce: {
        Args: {
          p_ip?: unknown
          p_max_verification_attempts?: number
          p_purpose: string
          p_required_scopes?: string[]
          p_token: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_permissions:
        | "roles.manage"
        | "billing.manage"
        | "settings.manage"
        | "members.manage"
        | "invites.manage"
      billing_provider: "stripe" | "lemon-squeezy" | "paddle"
      notification_channel: "in_app" | "email"
      notification_type: "info" | "warning" | "error"
      payment_status: "pending" | "succeeded" | "failed"
      subscription_item_type: "flat" | "per_seat" | "metered"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
      task_priority: "low" | "medium" | "high"
      task_status: "do" | "doing" | "done"
      testimonial_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      invitation: {
        email: string | null
        role: string | null
      }
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          format: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          format?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  payload: {
    Enums: {
      enum__course_lessons_v_version_status: ["draft", "published"],
      enum__course_lessons_v_version_video_source_type: ["youtube", "vimeo"],
      enum__course_quizzes_v_version_status: ["draft", "published"],
      enum__courses_v_version_status: ["draft", "published"],
      enum__documentation_v_version_status: ["draft", "published"],
      enum__posts_v_version_status: ["draft", "published"],
      enum__private_posts_v_version_status: ["draft", "published"],
      enum__survey_questions_v_version_questionspin: ["Positive", "Negative"],
      enum__survey_questions_v_version_status: ["draft", "published"],
      enum__survey_questions_v_version_type: [
        "multiple_choice",
        "text_field",
        "textarea",
        "scale",
      ],
      enum__surveys_v_version_status: ["draft", "published"],
      enum_course_lessons_status: ["draft", "published"],
      enum_course_lessons_video_source_type: ["youtube", "vimeo"],
      enum_course_quizzes_status: ["draft", "published"],
      enum_courses_status: ["draft", "published"],
      enum_documentation_status: ["draft", "published"],
      enum_downloads_access_level: ["public", "registered", "premium"],
      enum_downloads_category: [
        "document",
        "template",
        "resource",
        "software",
        "media",
        "archive",
        "other",
      ],
      enum_media_type: ["image", "video", "document"],
      enum_posts_status: ["draft", "published"],
      enum_private_posts_status: ["draft", "published"],
      enum_quiz_questions_questiontype: ["single-answer", "multi-answer"],
      enum_quiz_questions_type: ["multiple_choice"],
      enum_survey_questions_questionspin: ["Positive", "Negative"],
      enum_survey_questions_status: ["draft", "published"],
      enum_survey_questions_type: [
        "multiple_choice",
        "text_field",
        "textarea",
        "scale",
      ],
      enum_surveys_status: ["draft", "published"],
      enum_users_role: ["admin", "user"],
    },
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
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
    },
  },
} as const

