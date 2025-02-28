SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', 'e6cf2c49-5ab2-4a27-80ac-23bece6bd5d6', '{"action":"login","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-02-24 22:18:58.185661+00', ''),
	('00000000-0000-0000-0000-000000000000', 'de0452a5-cf5c-4de3-ac6b-a5a78ff86cab', '{"action":"login","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-02-27 15:07:45.629477+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b4e363bb-5677-417d-a6e7-a9318418d4cc', '{"action":"token_refreshed","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"token"}', '2025-02-27 18:05:56.821505+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f7578834-9c3d-4cd5-a228-4903af6614ac', '{"action":"token_revoked","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"token"}', '2025-02-27 18:05:56.822806+00', ''),
	('00000000-0000-0000-0000-000000000000', '88f30594-7b41-431d-9a3e-ac276e4516ec', '{"action":"token_refreshed","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"token"}', '2025-02-27 18:05:56.847644+00', ''),
	('00000000-0000-0000-0000-000000000000', '58ab3fc3-fecf-4a3c-a3d2-353534150c6d', '{"action":"token_refreshed","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"token"}', '2025-02-27 18:05:56.87985+00', ''),
	('00000000-0000-0000-0000-000000000000', '754d4890-70fa-4109-9722-85a63023bc2d', '{"action":"token_refreshed","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"token"}', '2025-02-27 18:05:58.136443+00', ''),
	('00000000-0000-0000-0000-000000000000', '3f747d74-7d1f-4b9d-8929-c32b5ca92049', '{"action":"token_refreshed","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"token"}', '2025-02-27 19:18:23.221236+00', ''),
	('00000000-0000-0000-0000-000000000000', '37591d29-987f-4d18-9a21-694e89765779', '{"action":"token_revoked","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"token"}', '2025-02-27 19:18:23.222309+00', ''),
	('00000000-0000-0000-0000-000000000000', '5b1f6c75-516f-426f-8b16-7d36996360f8', '{"action":"token_refreshed","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"token"}', '2025-02-27 20:51:23.79047+00', ''),
	('00000000-0000-0000-0000-000000000000', '5c99954f-5467-4b98-ae34-c684223eb9bd', '{"action":"token_revoked","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"token"}', '2025-02-27 20:51:23.792152+00', ''),
	('00000000-0000-0000-0000-000000000000', '788cbe07-a745-499c-9e0e-a290323aad51', '{"action":"token_refreshed","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"token"}', '2025-02-27 20:51:23.811059+00', ''),
	('00000000-0000-0000-0000-000000000000', '937fba84-4b88-4885-80fe-97019dbdb4f3', '{"action":"token_refreshed","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"token"}', '2025-02-27 20:51:23.860738+00', ''),
	('00000000-0000-0000-0000-000000000000', '702b3880-0247-4e77-ac02-ec331cdd89b9', '{"action":"token_refreshed","actor_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479","actor_username":"test2@slideheroes.com","actor_via_sso":false,"log_type":"token"}', '2025-02-27 20:51:25.961628+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'b73eb03e-fb7a-424d-84ff-18e2791ce0b4', 'authenticated', 'authenticated', 'custom@makerkit.dev', '$2a$10$b3ZPpU6TU3or30QzrXnZDuATPAx2pPq3JW.sNaneVY3aafMSuR4yi', '2024-04-20 08:38:00.860548+00', NULL, '', '2024-04-20 08:37:43.343769+00', '', NULL, '', '', NULL, '2024-04-20 08:38:00.93864+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "b73eb03e-fb7a-424d-84ff-18e2791ce0b4", "email": "custom@makerkit.dev", "email_verified": false, "phone_verified": false}', NULL, '2024-04-20 08:37:43.3385+00', '2024-04-20 08:38:00.942809+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '31a03e74-1639-45b6-bfa7-77447f1a4762', 'authenticated', 'authenticated', 'test@makerkit.dev', '$2a$10$NaMVRrI7NyfwP.AfAVWt6O/abulGnf9BBqwa6DqdMwXMvOCGpAnVO', '2024-04-20 08:20:38.165331+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-04-20 09:36:02.521776+00', '{"role": "super-admin", "provider": "email", "providers": ["email"]}', '{"sub": "31a03e74-1639-45b6-bfa7-77447f1a4762", "email": "test@makerkit.dev", "email_verified": false, "phone_verified": false}', NULL, '2024-04-20 08:20:34.459113+00', '2024-04-20 10:07:48.554125+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', 'authenticated', 'authenticated', 'owner@makerkit.dev', '$2a$10$D6arGxWJShy8q4RTW18z7eW0vEm2hOxEUovUCj5f3NblyHfamm5/a', '2024-04-20 08:36:37.517993+00', NULL, '', '2024-04-20 08:36:27.639648+00', '', NULL, '', '', NULL, '2024-04-20 08:36:37.614337+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf", "email": "owner@makerkit.dev", "email_verified": false, "phone_verified": false}', NULL, '2024-04-20 08:36:27.630379+00', '2024-04-20 08:36:37.617955+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '6b83d656-e4ab-48e3-a062-c0c54a427368', 'authenticated', 'authenticated', 'member@makerkit.dev', '$2a$10$6h/x.AX.6zzphTfDXIJMzuYx13hIYEi/Iods9FXH19J2VxhsLycfa', '2024-04-20 08:41:15.376778+00', NULL, '', '2024-04-20 08:41:08.689674+00', '', NULL, '', '', NULL, '2024-04-20 08:41:15.484606+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "6b83d656-e4ab-48e3-a062-c0c54a427368", "email": "member@makerkit.dev", "email_verified": false, "phone_verified": false}', NULL, '2024-04-20 08:41:08.683395+00', '2024-04-20 08:41:15.485494+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'authenticated', 'authenticated', 'test2@slideheroes.com', '$2a$10$B6t76TzZFakA11BtvbuBzehMtDPAyWT5jMCBlnL5KoqNUuUN1Wd1a', '2024-04-20 08:20:38.165331+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-02-27 15:07:45.63147+00', '{"role": "super-admin", "provider": "email", "providers": ["email"]}', '{"sub": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "email": "test2@slideheroes.com", "email_verified": false, "phone_verified": false}', NULL, '2024-04-20 08:20:34.459113+00', '2025-02-27 20:51:23.79536+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '{"sub": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "email": "test2@slideheroes.com", "email_verified": false, "phone_verified": false}', 'email', '2024-04-20 08:20:34.46275+00', '2024-04-20 08:20:34.462773+00', '2024-04-20 08:20:34.462773+00', 'e89b6d6a-7b2c-4d3f-9d6e-d3f9b2c1a8b7'),
	('31a03e74-1639-45b6-bfa7-77447f1a4762', '31a03e74-1639-45b6-bfa7-77447f1a4762', '{"sub": "31a03e74-1639-45b6-bfa7-77447f1a4762", "email": "test@makerkit.dev", "email_verified": false, "phone_verified": false}', 'email', '2024-04-20 08:20:34.46275+00', '2024-04-20 08:20:34.462773+00', '2024-04-20 08:20:34.462773+00', '9bb58bad-24a4-41a8-9742-1b5b4e2d8abd'),
	('5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', '5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', '{"sub": "5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf", "email": "owner@makerkit.dev", "email_verified": false, "phone_verified": false}', 'email', '2024-04-20 08:36:27.637388+00', '2024-04-20 08:36:27.637409+00', '2024-04-20 08:36:27.637409+00', '090598a1-ebba-4879-bbe3-38d517d5066f'),
	('b73eb03e-fb7a-424d-84ff-18e2791ce0b4', 'b73eb03e-fb7a-424d-84ff-18e2791ce0b4', '{"sub": "b73eb03e-fb7a-424d-84ff-18e2791ce0b4", "email": "custom@makerkit.dev", "email_verified": false, "phone_verified": false}', 'email', '2024-04-20 08:37:43.342194+00', '2024-04-20 08:37:43.342218+00', '2024-04-20 08:37:43.342218+00', '4392e228-a6d8-4295-a7d6-baed50c33e7c'),
	('6b83d656-e4ab-48e3-a062-c0c54a427368', '6b83d656-e4ab-48e3-a062-c0c54a427368', '{"sub": "6b83d656-e4ab-48e3-a062-c0c54a427368", "email": "member@makerkit.dev", "email_verified": false, "phone_verified": false}', 'email', '2024-04-20 08:41:08.687948+00', '2024-04-20 08:41:08.687982+00', '2024-04-20 08:41:08.687982+00', 'd122aca5-4f29-43f0-b1b1-940b000638db');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('cc0980f9-172e-4f1e-9a78-262c044a56e6', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '2025-02-24 22:18:58.186539+00', '2025-02-24 22:18:58.186539+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', '172.21.0.1', NULL),
	('a814222d-37c7-4bc9-9e01-21783d5d2c14', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '2025-02-27 15:07:45.631542+00', '2025-02-27 20:51:25.963122+00', NULL, 'aal1', NULL, '2025-02-27 20:51:25.963037', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', '172.21.0.1', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('cc0980f9-172e-4f1e-9a78-262c044a56e6', '2025-02-24 22:18:58.188376+00', '2025-02-24 22:18:58.188376+00', 'password', '553b4798-32e7-4386-8d1d-eefa6e0d750c'),
	('a814222d-37c7-4bc9-9e01-21783d5d2c14', '2025-02-27 15:07:45.636234+00', '2025-02-27 15:07:45.636234+00', 'password', '79da3025-6b15-40bb-a580-30c99778e0f4');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 6, 'RHqV-E_Zf32zLeFgy4oUng', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', false, '2025-02-24 22:18:58.187146+00', '2025-02-24 22:18:58.187146+00', NULL, 'cc0980f9-172e-4f1e-9a78-262c044a56e6'),
	('00000000-0000-0000-0000-000000000000', 7, 'PoD_a87QA-n69ypLoL8rOg', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', true, '2025-02-27 15:07:45.633384+00', '2025-02-27 18:05:56.823682+00', NULL, 'a814222d-37c7-4bc9-9e01-21783d5d2c14'),
	('00000000-0000-0000-0000-000000000000', 8, 'mdexmlTH8J6e6kY7RVz9OQ', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', true, '2025-02-27 18:05:56.825552+00', '2025-02-27 19:18:23.222632+00', 'PoD_a87QA-n69ypLoL8rOg', 'a814222d-37c7-4bc9-9e01-21783d5d2c14'),
	('00000000-0000-0000-0000-000000000000', 9, 'ta1WYX_PW7BE_gP_2Bju9w', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', true, '2025-02-27 19:18:23.223297+00', '2025-02-27 20:51:23.792778+00', 'mdexmlTH8J6e6kY7RVz9OQ', 'a814222d-37c7-4bc9-9e01-21783d5d2c14'),
	('00000000-0000-0000-0000-000000000000', 10, 'FpCoWAWG1wKF5O956BbqFQ', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', false, '2025-02-27 20:51:23.793763+00', '2025-02-27 20:51:23.793763+00', 'ta1WYX_PW7BE_gP_2Bju9w', 'a814222d-37c7-4bc9-9e01-21783d5d2c14');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: documentation; Type: TABLE DATA; Schema: payload; Owner: postgres
--

INSERT INTO "payload"."documentation" ("id", "title", "slug", "description", "content", "published_at", "status", "order", "parent_id", "updated_at", "created_at") VALUES
	(1, 'Authentication', 'authentication/authentication', 'Learn how to set up authentication in your MakerKit application.', '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "\r\nMakerKit uses Supabase to manage authentication within your application.\r\n\r\nBy default, every kit comes with the following built-in authentication methods:\r\n- **Email/Password** - we added, by default, the traditional way of signing in\r\n- **Third Party Providers** - we also added by default Google Auth sign-in\r\n- **Email Links**\r\n- **Phone Number**\r\n\r\nYou''re free to add (or remove) any of the methods supported by Supabase''s\r\nAuthentication: we will see how.\r\n\r\nThis documentation will help you with the following:\r\n - **Setup** - setting up your Supabase project\r\n - **SSR** - use SSR to persist your users'' authentication, adding new\r\nproviders\r\n - **Customization** - an overview of how MakerKit works so that you can adapt\r\nit to your own application''s needs", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr"}], "direction": "ltr"}}', '2024-04-11 00:00:00+00', 'published', 1, NULL, '2025-02-26 18:43:47.207+00', '2025-02-26 18:43:47.203+00'),
	(2, 'Configuration', 'authentication/configuration', 'Learn how authentication works in MakerKit and how to configure it.', '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "\r\nThe way you want your users to authenticate can be driven via configuration.\r\n\r\nIf you open the global configuration at `src/configuration.ts`, you''ll find\r\nthe `auth` object:\r\n\r\n```tsx title=\"configuration.ts\"\r\nimport type { Provider } from ''@supabase/gotrue-js/src/lib/types'';\r\n\r\nauth: {\r\n  requireEmailConfirmation: false,\r\n  providers: {\r\n    emailPassword: true,\r\n    phoneNumber: false,\r\n    emailLink: false,\r\n    oAuth: [''google''] as Provider[],\r\n  },\r\n}\r\n```\r\n\r\nAs you can see, the `providers` object can be configured to only display the\r\nauth methods we want to use.\r\n\r\n1. For example, by setting both `phoneNumber` and `emailLink` to `true`, the\r\nauthentication pages will display the `Email Link` authentication\r\nand the `Phone Number` authentication forms.\r\n2. Instead, by setting `emailPassword` to `false`, we will remove the\r\n`email/password` form from the authentication and user profile pages.\r\n\r\n## Requiring Email Verification\r\n\r\nThis setting needs to match what you have set up in Supabase. If you require email confirmation before your users can sign in, you will have to flip the following flag in your configuration:\r\n\r\n```ts\r\nauth: {\r\n  requireEmailConfirmation: false,\r\n}\r\n```\r\n\r\nWhen the flag is set to `true`, the user will not be redirected to the onboarding flow, but will instead see a successful alert asking them to confirm their email. After confirmation, they will be able to sign in.\r\n\r\nWhen the flag is set to `false`, the application will redirect them directly to the onboarding flow.\r\n\r\n## Emails sent by Supabase\r\n\r\nSupabase spins up an [InBucket](http://localhost:54324/) instance where all the emails are sent: this is where you can find emails related to password reset, sign-in links, and email verifications.\r\n\r\nTo access the InBucket instance, you can go to the following URL: [http://localhost:54324/](http://localhost:54324/). Save this URL, you will use it very often.", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr"}], "direction": "ltr"}}', '2024-04-11 00:00:00+00', 'published', 1, NULL, '2025-02-26 18:43:47.229+00', '2025-02-26 18:43:47.229+00'),
	(3, 'Getting started with Makerkit', 'getting-started/getting-started', 'Makerkit is a SaaS Starter Kit that helps you build a SaaS. Learn how to get started with Makerkit.', '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "\r\nMakerkit is a SaaS Starter Kit that helps you build a SaaS. It provides you with a set of tools and best practices to help you build a SaaS quickly and efficiently.\r\n\r\n## Getting started\r\n\r\nTo get started follow these steps:\r\n\r\n1. Sign up for an account on the [website](#).\r\n2. Create a new project by clicking on the \"New Project\" button.\r\n3. Choose a template for your project. Makerkit provides several templates to help you get started quickly.\r\n\r\n## Features\r\n\r\nMakerkit provides the following features to help you build a SaaS:\r\n1. User authentication\r\n2. User management\r\n3. Subscription management\r\n4. Billing and payments\r\n5. Super Admin\r\n\r\n... and many more!\r\n", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr"}], "direction": "ltr"}}', '2024-04-11 00:00:00+00', 'published', 0, NULL, '2025-02-26 18:43:47.237+00', '2025-02-26 18:43:47.238+00'),
	(4, 'Installing Dependencies', 'getting-started/installing-dependencies', 'Learn how to install dependencies for your project.', '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "\r\nTo install dependencies in your project, please install `pnpm` by running the following command:\r\n\r\n```bash\r\nnpm install -g pnpm\r\n```\r\n\r\nNext, navigate to your project directory and run the following command:\r\n\r\n```bash\r\npnpm install\r\n```\r\n\r\nThis will install all the dependencies listed in your `package.json` file.", "type": "text", "style": "", "detail": 0, "format": 0, "version": 1}], "direction": "ltr"}], "direction": "ltr"}}', '2024-04-11 00:00:00+00', 'published', 0, NULL, '2025-02-26 18:43:47.246+00', '2025-02-26 18:43:47.246+00');


--
-- Data for Name: documentation_categories; Type: TABLE DATA; Schema: payload; Owner: postgres
--



--
-- Data for Name: documentation_tags; Type: TABLE DATA; Schema: payload; Owner: postgres
--



--
-- Data for Name: media; Type: TABLE DATA; Schema: payload; Owner: postgres
--



--
-- Data for Name: payload_locked_documents; Type: TABLE DATA; Schema: payload; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: payload; Owner: postgres
--

INSERT INTO "payload"."users" ("id", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until") VALUES
	(1, '2025-02-26 20:41:16.233+00', '2025-02-26 20:41:16.043+00', 'msmith@slideheroes.com', NULL, NULL, '148f5a504a416287d51a2d32a34ff450eccd2089c2e185d91beb3d39c4c4c690', 'cd554db7892fa1c52b0adb4c7884722802a3605d118ab941d543e2f377d45cc2bfc50166cbcd16266c7e4809c6626c29dd435580342c22ea59c1451044f2d701dd3086e2df17fece1ae08eb29f923a3fa2bd3dc6da78a0aabbb6839e4451a91839c36363f7e9e1e04d7bc2c48f1f8a995430f3140ebbcee376b0f14125cec01ac04aaaeb50c43a122c520693b37af5b7934aeeb96d70cb203227da9b53915148d69dee7da9443f62aeec9d51b8ee00638ffef03d3a3e5bc3cc9ce08d746e85d68497aff6c28d1dab594224e04fe263db29fb73929f8d4bbf7bde8ffd17e9e21def67794d68d7a24ab8931f3b090dfa122ec74494453c424192e8b5fe5f6dea18ebcbc11d1dcf3adc3b30d15e7bbc18547d7f17abf465155583bdf30aa747a9719f5f86e0da72a051ff48de34d95a6b4944753ee59d5e69fcddad2085ac66370e37286337e60df43f35ed001dda4c63d2f71b8fb2a2e18a450e231b823c23e29915a0ef8ac6e2cd7dfcb2244c54682a4ebabac940005193d33fe133b68a27fdbd49897b22f672eb77583f433971a8a96ff0f97dfdb8c3f7561bd5139b34808fbf3276ba04953c9890b43c1e83337d25a70ea748fe87ed3a33741ac2c594171200aea68b1d0336cd6b2241bffac7abb7fd15c9b6c676a874da4d1199f912ee2b8aab4d3b1a213134368bfad8d07c59aa6d3f56a668b155653485e3f6bf8b33e15d', 0, NULL);


--
-- Data for Name: payload_locked_documents_rels; Type: TABLE DATA; Schema: payload; Owner: postgres
--



--
-- Data for Name: payload_migrations; Type: TABLE DATA; Schema: payload; Owner: postgres
--

INSERT INTO "payload"."payload_migrations" ("id", "name", "batch", "updated_at", "created_at") VALUES
	(1, '20250226_163020_initial_schema', 1, '2025-02-26 18:02:54.331+00', '2025-02-26 18:02:54.047+00'),
	(2, 'dev', -1, '2025-02-27 20:51:35.334+00', '2025-02-26 18:57:21.373+00');


--
-- Data for Name: payload_preferences; Type: TABLE DATA; Schema: payload; Owner: postgres
--

INSERT INTO "payload"."payload_preferences" ("id", "key", "value", "updated_at", "created_at") VALUES
	(1, 'documentation-list', '{}', '2025-02-26 20:41:19.356+00', '2025-02-26 20:41:19.355+00'),
	(2, 'documentation-list', '{}', '2025-02-26 20:41:19.366+00', '2025-02-26 20:41:19.366+00');


--
-- Data for Name: payload_preferences_rels; Type: TABLE DATA; Schema: payload; Owner: postgres
--

INSERT INTO "payload"."payload_preferences_rels" ("id", "order", "parent_id", "path", "users_id") VALUES
	(1, NULL, 1, 'user', 1),
	(2, NULL, 2, 'user', 1);


--
-- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: supabase_admin
--



--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."testimonials" ("id", "customer_name", "customer_company_name", "customer_avatar_url", "content", "link", "video_url", "source", "rating", "status", "created_at", "updated_at") VALUES
	('11111111-1111-1111-1111-111111111111', 'Sarah Chen', 'Tech Innovator & Speaker', '/images/testimonials/michael.webp', 'This platform transformed how I create presentations. The AI tools are incredibly intuitive and save me hours of work.', NULL, NULL, 'manual', 5, 'approved', '2025-02-24 22:18:13.659973+00', '2025-02-24 22:18:13.659973+00'),
	('22222222-2222-2222-2222-222222222222', 'Marcus Rodriguez', 'Senior Product Manager', '/images/testimonials/michael.webp', 'The quality of slides I can create now is amazing. My presentations stand out and engage the audience better than ever.', NULL, NULL, 'manual', 5, 'approved', '2025-02-24 22:18:13.659973+00', '2025-02-24 22:18:13.659973+00'),
	('33333333-3333-3333-3333-333333333333', 'Emily Watson', 'Marketing Director', '/images/testimonials/michael.webp', 'Game-changer for our marketing presentations. The templates and AI suggestions make creating compelling decks so much faster.', NULL, NULL, 'manual', 5, 'approved', '2025-02-24 22:18:13.659973+00', '2025-02-24 22:18:13.659973+00'),
	('44444444-4444-4444-4444-444444444444', 'David Park', 'Startup Founder', '/images/testimonials/michael.webp', 'Finally, a presentation tool that understands what modern presenters need. The AI features are like having a design expert on call.', NULL, NULL, 'manual', 5, 'approved', '2025-02-24 22:18:13.659973+00', '2025-02-24 22:18:13.659973+00'),
	('55555555-5555-5555-5555-555555555555', 'Lisa Thompson', 'Sales Executive', '/images/testimonials/michael.webp', 'My sales presentations have never looked better. The platform makes it easy to create professional, engaging slides quickly.', NULL, NULL, 'manual', 5, 'approved', '2025-02-24 22:18:13.659973+00', '2025-02-24 22:18:13.659973+00'),
	('66666666-6666-6666-6666-666666666666', 'Michael Brown', 'Business Consultant', '/images/testimonials/michael.webp', 'An essential tool for any professional who presents regularly. The AI-powered features have revolutionized my workflow.', NULL, NULL, 'manual', 5, 'approved', '2025-02-24 22:18:13.659973+00', '2025-02-24 22:18:13.659973+00'),
	('77777777-7777-7777-7777-777777777777', 'Rachel Kim', 'Creative Director', '/images/testimonials/michael.webp', 'The design capabilities are outstanding. I can create visually stunning presentations that capture attention and convey our message effectively.', NULL, NULL, 'manual', 5, 'approved', '2025-02-24 22:18:13.659973+00', '2025-02-24 22:18:13.659973+00'),
	('88888888-8888-8888-8888-888888888888', 'James Wilson', 'Education Specialist', '/images/testimonials/michael.webp', 'Perfect for creating engaging educational content. The AI assistance helps me explain complex topics in a clear, visual way.', NULL, NULL, 'manual', 5, 'approved', '2025-02-24 22:18:13.659973+00', '2025-02-24 22:18:13.659973+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id") VALUES
	('account_image', 'account_image', NULL, '2025-02-24 22:18:13.305691+00', '2025-02-24 22:18:13.305691+00', true, false, NULL, NULL, NULL),
	('testimonials', 'testimonials', NULL, '2025-02-24 22:18:13.555713+00', '2025-02-24 22:18:13.555713+00', true, false, NULL, NULL, NULL),
	('task-images', 'task-images', NULL, '2025-02-24 22:27:36.634497+00', '2025-02-24 22:27:36.634497+00', false, false, 1048576, NULL, NULL);


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 10, true);


--
-- Name: documentation_id_seq; Type: SEQUENCE SET; Schema: payload; Owner: postgres
--

SELECT pg_catalog.setval('"payload"."documentation_id_seq"', 4, true);


--
-- Name: media_id_seq; Type: SEQUENCE SET; Schema: payload; Owner: postgres
--

SELECT pg_catalog.setval('"payload"."media_id_seq"', 1, false);


--
-- Name: payload_locked_documents_id_seq; Type: SEQUENCE SET; Schema: payload; Owner: postgres
--

SELECT pg_catalog.setval('"payload"."payload_locked_documents_id_seq"', 1, false);


--
-- Name: payload_locked_documents_rels_id_seq; Type: SEQUENCE SET; Schema: payload; Owner: postgres
--

SELECT pg_catalog.setval('"payload"."payload_locked_documents_rels_id_seq"', 1, false);


--
-- Name: payload_migrations_id_seq; Type: SEQUENCE SET; Schema: payload; Owner: postgres
--

SELECT pg_catalog.setval('"payload"."payload_migrations_id_seq"', 2, true);


--
-- Name: payload_preferences_id_seq; Type: SEQUENCE SET; Schema: payload; Owner: postgres
--

SELECT pg_catalog.setval('"payload"."payload_preferences_id_seq"', 2, true);


--
-- Name: payload_preferences_rels_id_seq; Type: SEQUENCE SET; Schema: payload; Owner: postgres
--

SELECT pg_catalog.setval('"payload"."payload_preferences_rels_id_seq"', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: payload; Owner: postgres
--

SELECT pg_catalog.setval('"payload"."users_id_seq"', 1, true);


--
-- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: supabase_admin
--

SELECT pg_catalog.setval('"pgsodium"."key_key_id_seq"', 1, false);


--
-- Name: billing_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."billing_customers_id_seq"', 1, false);


--
-- Name: invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."invitations_id_seq"', 19, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 19, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
