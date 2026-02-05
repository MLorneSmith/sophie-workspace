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
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
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
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
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
			fix_dynamic_table: { Args: { table_name: string }; Returns: boolean };
			get_downloads_for_collection: {
				Args: { collection_id: string; collection_type: string };
				Returns: {
					download_id: string;
				}[];
			};
			get_relationship_data: {
				Args: { fallback_column?: string; id: string; table_name: string };
				Returns: string;
			};
			safe_uuid_conversion: { Args: { text_value: string }; Returns: string };
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
					enable_courses: boolean;
					enable_team_account_billing: boolean;
					enable_team_accounts: boolean;
				};
				Insert: {
					billing_provider?: Database["public"]["Enums"]["billing_provider"];
					enable_account_billing?: boolean;
					enable_courses?: boolean;
					enable_team_account_billing?: boolean;
					enable_team_accounts?: boolean;
				};
				Update: {
					billing_provider?: Database["public"]["Enums"]["billing_provider"];
					enable_account_billing?: boolean;
					enable_courses?: boolean;
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
			maintenance_log: {
				Row: {
					created_at: string | null;
					duration_ms: number | null;
					id: number;
					message: string | null;
					operation: string;
					status: string;
				};
				Insert: {
					created_at?: string | null;
					duration_ms?: number | null;
					id?: number;
					message?: string | null;
					operation: string;
					status?: string;
				};
				Update: {
					created_at?: string | null;
					duration_ms?: number | null;
					id?: number;
					message?: string | null;
					operation?: string;
					status?: string;
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
					last_verification_ip: unknown;
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
					last_verification_ip?: unknown;
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
					last_verification_ip?: unknown;
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
					phase: string | null;
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
					phase?: string | null;
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
					phase?: string | null;
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
			timezone_cache: {
				Row: {
					abbrev: string | null;
					is_dst: boolean | null;
					name: string | null;
					utc_offset: unknown;
				};
				Relationships: [];
			};
			timezone_performance_monitor: {
				Row: {
					avg_duration_ms: number | null;
					cached_timezones: number | null;
					last_checked: string | null;
					query_type: string | null;
					total_calls: number | null;
					total_duration_ms: number | null;
					total_timezones: number | null;
				};
				Relationships: [];
			};
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
				Args: never;
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
					p_completion_tokens: number;
					p_model: string;
					p_prompt_tokens: number;
					p_provider: string;
				};
				Returns: number;
			};
			can_action_account_member: {
				Args: { target_team_account_id: string; target_user_id: string };
				Returns: boolean;
			};
			check_ai_usage_limits: {
				Args: {
					p_cost: number;
					p_entity_id: string;
					p_entity_type: string;
					p_tokens: number;
				};
				Returns: {
					current_usage: number;
					limit_exceeded: boolean;
					limit_type: string;
					max_value: number;
					time_period: string;
				}[];
			};
			check_is_aal2: { Args: never; Returns: boolean };
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
				SetofOptions: {
					from: "*";
					to: "invitations";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			create_nonce: {
				Args: {
					p_expires_in_seconds?: number;
					p_metadata?: Json;
					p_purpose?: string;
					p_revoke_previous?: boolean;
					p_scopes?: string[];
					p_user_id?: string;
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
				SetofOptions: {
					from: "*";
					to: "accounts";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			deduct_ai_credits: {
				Args: {
					p_amount: number;
					p_entity_id: string;
					p_entity_type: string;
					p_feature: string;
					p_request_id: string;
				};
				Returns: boolean;
			};
			get_account_invitations: {
				Args: { account_slug: string };
				Returns: {
					account_id: string;
					created_at: string;
					email: string;
					expires_at: string;
					id: number;
					invited_by: string;
					inviter_email: string;
					inviter_name: string;
					role: string;
					updated_at: string;
				}[];
			};
			get_account_members: {
				Args: { account_slug: string };
				Returns: {
					account_id: string;
					created_at: string;
					email: string;
					id: string;
					name: string;
					picture_url: string;
					primary_owner_user_id: string;
					role: string;
					role_hierarchy_level: number;
					updated_at: string;
					user_id: string;
				}[];
			};
			get_config: { Args: never; Returns: Json };
			get_is_super_admin: { Args: never; Returns: boolean };
			get_nonce_status: { Args: { p_id: string }; Returns: Json };
			get_upper_system_role: { Args: never; Returns: string };
			has_active_subscription: {
				Args: { target_account_id: string };
				Returns: boolean;
			};
			has_more_elevated_role: {
				Args: {
					role_name: string;
					target_account_id: string;
					target_user_id: string;
				};
				Returns: boolean;
			};
			has_permission: {
				Args: {
					account_id: string;
					permission_name: Database["public"]["Enums"]["app_permissions"];
					user_id: string;
				};
				Returns: boolean;
			};
			has_role_on_account: {
				Args: { account_id: string; account_role?: string };
				Returns: boolean;
			};
			has_same_role_hierarchy_level: {
				Args: {
					role_name: string;
					target_account_id: string;
					target_user_id: string;
				};
				Returns: boolean;
			};
			insert_certificate: {
				Args: { p_course_id: string; p_file_path: string; p_user_id: string };
				Returns: {
					id: string;
				}[];
			};
			is_aal2: { Args: never; Returns: boolean };
			is_account_owner: { Args: { account_id: string }; Returns: boolean };
			is_account_team_member: {
				Args: { target_account_id: string };
				Returns: boolean;
			};
			is_mfa_compliant: { Args: never; Returns: boolean };
			is_set: { Args: { field_name: string }; Returns: boolean };
			is_super_admin: { Args: never; Returns: boolean };
			is_team_member: {
				Args: { account_id: string; user_id: string };
				Returns: boolean;
			};
			refresh_timezone_cache: { Args: never; Returns: string };
			reset_ai_allocations: { Args: never; Returns: number };
			revoke_nonce: {
				Args: { p_id: string; p_reason?: string };
				Returns: boolean;
			};
			team_account_workspace: {
				Args: { account_slug: string };
				Returns: {
					id: string;
					name: string;
					permissions: Database["public"]["Enums"]["app_permissions"][];
					picture_url: string;
					primary_owner_user_id: string;
					role: string;
					role_hierarchy_level: number;
					slug: string;
					subscription_status: Database["public"]["Enums"]["subscription_status"];
				}[];
			};
			transfer_team_account_ownership: {
				Args: { new_owner_id: string; target_account_id: string };
				Returns: undefined;
			};
			upsert_order: {
				Args: {
					billing_provider: Database["public"]["Enums"]["billing_provider"];
					currency: string;
					line_items: Json;
					status: Database["public"]["Enums"]["payment_status"];
					target_account_id: string;
					target_customer_id: string;
					target_order_id: string;
					total_amount: number;
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
				SetofOptions: {
					from: "*";
					to: "orders";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			upsert_subscription: {
				Args: {
					active: boolean;
					billing_provider: Database["public"]["Enums"]["billing_provider"];
					cancel_at_period_end: boolean;
					currency: string;
					line_items: Json;
					period_ends_at: string;
					period_starts_at: string;
					status: Database["public"]["Enums"]["subscription_status"];
					target_account_id: string;
					target_customer_id: string;
					target_subscription_id: string;
					trial_ends_at?: string;
					trial_starts_at?: string;
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
				SetofOptions: {
					from: "*";
					to: "subscriptions";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			verify_nonce: {
				Args: {
					p_ip?: unknown;
					p_max_verification_attempts?: number;
					p_purpose: string;
					p_required_scopes?: string[];
					p_token: string;
					p_user_agent?: string;
					p_user_id?: string;
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
					type: Database["storage"]["Enums"]["buckettype"];
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
					type?: Database["storage"]["Enums"]["buckettype"];
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
					type?: Database["storage"]["Enums"]["buckettype"];
					updated_at?: string | null;
				};
				Relationships: [];
			};
			buckets_analytics: {
				Row: {
					created_at: string;
					format: string;
					id: string;
					type: Database["storage"]["Enums"]["buckettype"];
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					format?: string;
					id: string;
					type?: Database["storage"]["Enums"]["buckettype"];
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					format?: string;
					id?: string;
					type?: Database["storage"]["Enums"]["buckettype"];
					updated_at?: string;
				};
				Relationships: [];
			};
			iceberg_namespaces: {
				Row: {
					bucket_id: string;
					created_at: string;
					id: string;
					name: string;
					updated_at: string;
				};
				Insert: {
					bucket_id: string;
					created_at?: string;
					id?: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					bucket_id?: string;
					created_at?: string;
					id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "iceberg_namespaces_bucket_id_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets_analytics";
						referencedColumns: ["id"];
					},
				];
			};
			iceberg_tables: {
				Row: {
					bucket_id: string;
					created_at: string;
					id: string;
					location: string;
					name: string;
					namespace_id: string;
					updated_at: string;
				};
				Insert: {
					bucket_id: string;
					created_at?: string;
					id?: string;
					location: string;
					name: string;
					namespace_id: string;
					updated_at?: string;
				};
				Update: {
					bucket_id?: string;
					created_at?: string;
					id?: string;
					location?: string;
					name?: string;
					namespace_id?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "iceberg_tables_bucket_id_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets_analytics";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "iceberg_tables_namespace_id_fkey";
						columns: ["namespace_id"];
						isOneToOne: false;
						referencedRelation: "iceberg_namespaces";
						referencedColumns: ["id"];
					},
				];
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
				Args: { bucketid: string; metadata: Json; name: string; owner: string };
				Returns: undefined;
			};
			delete_leaf_prefixes: {
				Args: { bucket_ids: string[]; names: string[] };
				Returns: undefined;
			};
			delete_prefix: {
				Args: { _bucket_id: string; _name: string };
				Returns: boolean;
			};
			extension: { Args: { name: string }; Returns: string };
			filename: { Args: { name: string }; Returns: string };
			foldername: { Args: { name: string }; Returns: string[] };
			get_level: { Args: { name: string }; Returns: number };
			get_prefix: { Args: { name: string }; Returns: string };
			get_prefixes: { Args: { name: string }; Returns: string[] };
			get_size_by_bucket: {
				Args: never;
				Returns: {
					bucket_id: string;
					size: number;
				}[];
			};
			list_multipart_uploads_with_delimiter: {
				Args: {
					bucket_id: string;
					delimiter_param: string;
					max_keys?: number;
					next_key_token?: string;
					next_upload_token?: string;
					prefix_param: string;
				};
				Returns: {
					created_at: string;
					id: string;
					key: string;
				}[];
			};
			list_objects_with_delimiter: {
				Args: {
					bucket_id: string;
					delimiter_param: string;
					max_keys?: number;
					next_token?: string;
					prefix_param: string;
					start_after?: string;
				};
				Returns: {
					id: string;
					metadata: Json;
					name: string;
					updated_at: string;
				}[];
			};
			lock_top_prefixes: {
				Args: { bucket_ids: string[]; names: string[] };
				Returns: undefined;
			};
			operation: { Args: never; Returns: string };
			search: {
				Args: {
					bucketname: string;
					levels?: number;
					limits?: number;
					offsets?: number;
					prefix: string;
					search?: string;
					sortcolumn?: string;
					sortorder?: string;
				};
				Returns: {
					created_at: string;
					id: string;
					last_accessed_at: string;
					metadata: Json;
					name: string;
					updated_at: string;
				}[];
			};
			search_legacy_v1: {
				Args: {
					bucketname: string;
					levels?: number;
					limits?: number;
					offsets?: number;
					prefix: string;
					search?: string;
					sortcolumn?: string;
					sortorder?: string;
				};
				Returns: {
					created_at: string;
					id: string;
					last_accessed_at: string;
					metadata: Json;
					name: string;
					updated_at: string;
				}[];
			};
			search_v1_optimised: {
				Args: {
					bucketname: string;
					levels?: number;
					limits?: number;
					offsets?: number;
					prefix: string;
					search?: string;
					sortcolumn?: string;
					sortorder?: string;
				};
				Returns: {
					created_at: string;
					id: string;
					last_accessed_at: string;
					metadata: Json;
					name: string;
					updated_at: string;
				}[];
			};
			search_v2: {
				Args: {
					bucket_name: string;
					levels?: number;
					limits?: number;
					prefix: string;
					sort_column?: string;
					sort_column_after?: string;
					sort_order?: string;
					start_after?: string;
				};
				Returns: {
					created_at: string;
					id: string;
					key: string;
					last_accessed_at: string;
					metadata: Json;
					name: string;
					updated_at: string;
				}[];
			};
		};
		Enums: {
			buckettype: "STANDARD" | "ANALYTICS";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	"public"
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
		Enums: {
			buckettype: ["STANDARD", "ANALYTICS"],
		},
	},
} as const;
