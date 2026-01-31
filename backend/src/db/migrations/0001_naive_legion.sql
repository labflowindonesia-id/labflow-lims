DO $$ BEGIN
 CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE', 'REJECT', 'GENERATE_PDF', 'LOCK', 'UNLOCK');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."change_request_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'APPLIED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."change_type" AS ENUM('ADD_TEST', 'REMOVE_TEST', 'UPDATE_TEST_DUE_DATE', 'UPDATE_METHOD_INSTRUMENT', 'UPDATE_SAMPLE_METADATA', 'UPDATE_STORAGE_LOCATION', 'UPDATE_CUSTOMER_CONTACT', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."compliance_status" AS ENUM('PASS', 'FAIL', 'NOT_EVALUATED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."condition_status" AS ENUM('INTACT', 'LEAK', 'DAMAGED', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."contract_review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."entity_type" AS ENUM('QUOTATION', 'QUOTATION_LINE', 'WORK_ORDER', 'SAMPLE', 'REQUESTED_TEST', 'TEST_TASK', 'REPORT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."instrument_status" AS ENUM('READY', 'IN_USE', 'MAINTENANCE', 'CALIBRATION');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."limit_type" AS ENUM('MAX', 'MIN', 'RANGE', 'NONE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."nd_reporting_style" AS ENUM('ND_TEXT', 'LT_LOD', 'LT_LOQ');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."nonconformity_status" AS ENUM('OPEN', 'RESOLVED', 'CLOSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_channel" AS ENUM('EMAIL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'SENT', 'FAILED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."qc_status" AS ENUM('PASS', 'FAIL', 'NONE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."quotation_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."report_status" AS ENUM('DRAFT', 'SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'LOCKED', 'RELEASED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."revision_scope" AS ENUM('ENTIRE_REPORT', 'SPECIFIC_TESTS');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sampling_method" AS ENUM('GRAB', 'COMPOSITE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."skill_level" AS ENUM('TRAINING', 'COMPETENT', 'EXPERT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."storage_location_type" AS ENUM('CHILLER', 'FREEZER', 'ROOM', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."submission_status" AS ENUM('SUBMITTED', 'RETURNED', 'APPROVED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."task_priority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."task_status" AS ENUM('PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_RECHECK', 'COMPLETED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."timeline_stage" AS ENUM('RECEIVED', 'LAB_ANALYSIS', 'REVIEW', 'COMPLETED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'MANAGER', 'ANALYST');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."work_order_status" AS ENUM('RECEIVED_DRAFT', 'RECEIVED_CONFIRMED', 'IN_ANALYSIS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analyst_skills" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"analyst_id" varchar(36) NOT NULL,
	"matrix_id" varchar(36),
	"parameter_id" varchar(36),
	"method_id" varchar(36),
	"instrument_id" varchar(36),
	"skill_level" "skill_level" DEFAULT 'COMPETENT' NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analysts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"employee_code" varchar(50),
	"department_id" varchar(36),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'ANALYST' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_contacts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"mobile" varchar(50),
	"address_override" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"address" text,
	"phone" varchar(50),
	"email" varchar(255),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instruments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"model" varchar(255),
	"serial_number" varchar(100),
	"location" varchar(255),
	"status" "instrument_status" DEFAULT 'READY',
	"calibration_due_date" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matrix_parameter_rules" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"matrix_id" varchar(36) NOT NULL,
	"parameter_id" varchar(36),
	"subparameter_id" varchar(36),
	"default_method_id" varchar(36),
	"default_instrument_id" varchar(36),
	"default_tat_days" integer DEFAULT 5 NOT NULL,
	"limit_type" "limit_type" DEFAULT 'NONE' NOT NULL,
	"limit_min" numeric(15, 6),
	"limit_max" numeric(15, 6),
	"limit_unit_id" varchar(36),
	"lod_default" numeric(15, 6),
	"loq_default" numeric(15, 6),
	"qc_recovery_min" numeric(5, 2) DEFAULT '80.00',
	"qc_recovery_max" numeric(5, 2) DEFAULT '120.00',
	"base_price" numeric(15, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "methods" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_accredited" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parameters" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"symbol" varchar(50),
	"group" varchar(100),
	"category" varchar(100),
	"default_unit_id" varchar(36),
	"has_subparameter" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_list" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"matrix_id" varchar(36) NOT NULL,
	"parameter_id" varchar(36),
	"subparameter_id" varchar(36),
	"price_amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR' NOT NULL,
	"effective_from" timestamp with time zone,
	"effective_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sample_matrices" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"category" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storage_locations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"location_type" "storage_location_type" DEFAULT 'ROOM' NOT NULL,
	"temperature_setpoint" numeric(5, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subparameters" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"parameter_id" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"cas_number" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_package_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"package_id" varchar(36) NOT NULL,
	"parameter_id" varchar(36),
	"subparameter_id" varchar(36),
	"method_id" varchar(36),
	"instrument_id" varchar(36),
	"price_override" numeric(15, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_packages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"matrix_id" varchar(36) NOT NULL,
	"description" text,
	"total_price" numeric(15, 2) NOT NULL,
	"tat_days" integer DEFAULT 5 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "units" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contract_reviews" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"quotation_id" varchar(36) NOT NULL,
	"laboratory_capability_ok" boolean,
	"resource_availability_ok" boolean,
	"sample_requirements_ok" boolean,
	"method_availability_ok" boolean,
	"subcontracting_ok" boolean,
	"delivery_timeline_ok" boolean,
	"status" "contract_review_status" DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"reviewed_by" varchar(36),
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_reviews_quotation_id_unique" UNIQUE("quotation_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotation_documents" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"quotation_id" varchar(36) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"generated_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotation_lines" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"quotation_id" varchar(36) NOT NULL,
	"line_number" integer NOT NULL,
	"parameter_id" varchar(36),
	"subparameter_id" varchar(36),
	"package_id" varchar(36),
	"method_id" varchar(36),
	"instrument_id" varchar(36),
	"parameter_name_snapshot" varchar(255),
	"method_code_snapshot" varchar(100),
	"unit_price" numeric(15, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"line_total" numeric(15, 2) NOT NULL,
	"tat_days" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"quotation_number" varchar(50) NOT NULL,
	"revision_number" integer DEFAULT 0 NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"contact_id" varchar(36),
	"customer_name_snapshot" varchar(255),
	"customer_address_snapshot" text,
	"matrix_id" varchar(36) NOT NULL,
	"sample_count" integer DEFAULT 1 NOT NULL,
	"sampling_type" varchar(50),
	"urgency_factor" numeric(5, 2) DEFAULT '1.00',
	"valid_until" timestamp with time zone NOT NULL,
	"tat_days" integer DEFAULT 5 NOT NULL,
	"status" "quotation_status" DEFAULT 'DRAFT' NOT NULL,
	"submitted_at" timestamp with time zone,
	"submitted_by" varchar(36),
	"approved_at" timestamp with time zone,
	"approved_by" varchar(36),
	"rejected_at" timestamp with time zone,
	"rejected_by" varchar(36),
	"rejection_reason" text,
	"subtotal" numeric(15, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(15, 2) DEFAULT '0',
	"tax_rate" numeric(5, 2) DEFAULT '11.00',
	"tax_amount" numeric(15, 2) DEFAULT '0',
	"grand_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR' NOT NULL,
	"internal_notes" text,
	"public_notes" text,
	"terms_conditions" text,
	"draft_pdf_path" varchar(500),
	"created_by" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotations_quotation_number_unique" UNIQUE("quotation_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "field_measurements" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"sample_id" varchar(36) NOT NULL,
	"parameter_name" varchar(100) NOT NULL,
	"value" numeric(15, 6) NOT NULL,
	"unit_symbol" varchar(50),
	"measured_at" timestamp with time zone,
	"measured_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "requested_tests" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"sample_id" varchar(36) NOT NULL,
	"parameter_id" varchar(36),
	"subparameter_id" varchar(36),
	"method_id" varchar(36),
	"instrument_id" varchar(36),
	"quotation_line_id" varchar(36),
	"tat_days" integer DEFAULT 5 NOT NULL,
	"due_date" timestamp with time zone,
	"price_amount" numeric(15, 2),
	"is_scheduled" boolean DEFAULT false NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sample_photos" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"sample_id" varchar(36) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"uploaded_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "samples" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"work_order_id" varchar(36) NOT NULL,
	"sample_lab_id" varchar(50) NOT NULL,
	"customer_sample_id" varchar(100),
	"sample_name" varchar(255),
	"description" text,
	"matrix_id" varchar(36) NOT NULL,
	"condition" "condition_status" DEFAULT 'INTACT' NOT NULL,
	"condition_notes" text,
	"storage_location_id" varchar(36),
	"storage_temperature" numeric(5, 2),
	"original_volume" numeric(10, 3),
	"volume_unit" varchar(20),
	"sampling_date" timestamp with time zone,
	"collected_by" varchar(255),
	"disposal_date" timestamp with time zone,
	"is_disposed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "samples_sample_lab_id_unique" UNIQUE("sample_lab_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sampling_details" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"sample_id" varchar(36) NOT NULL,
	"sampling_method" "sampling_method",
	"sampling_location" text,
	"sampling_point" varchar(255),
	"sampling_coordinates" varchar(100),
	"weather_condition" varchar(100),
	"ambient_temperature" numeric(5, 2),
	"field_observations" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sampling_details_sample_id_unique" UNIQUE("sample_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_orders" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"work_order_number" varchar(50) NOT NULL,
	"quotation_id" varchar(36),
	"customer_id" varchar(36) NOT NULL,
	"contact_id" varchar(36),
	"customer_name_snapshot" varchar(255),
	"customer_address_snapshot" text,
	"matrix_id" varchar(36) NOT NULL,
	"status" "work_order_status" DEFAULT 'RECEIVED_DRAFT' NOT NULL,
	"received_date" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"completed_date" timestamp with time zone,
	"total_samples" integer DEFAULT 1 NOT NULL,
	"receiver_notes" text,
	"created_by" varchar(36) NOT NULL,
	"confirmed_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_orders_work_order_number_unique" UNIQUE("work_order_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_status_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"task_id" varchar(36) NOT NULL,
	"previous_status" "task_status",
	"new_status" "task_status" NOT NULL,
	"changed_by" varchar(36),
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_tasks" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"task_number" varchar(50) NOT NULL,
	"requested_test_id" varchar(36) NOT NULL,
	"sample_id" varchar(36) NOT NULL,
	"work_plan_id" varchar(36),
	"parameter_id" varchar(36),
	"subparameter_id" varchar(36),
	"method_id" varchar(36),
	"instrument_id" varchar(36),
	"assigned_to_id" varchar(36),
	"assigned_by" varchar(36),
	"assigned_at" timestamp with time zone,
	"status" "task_status" DEFAULT 'PLANNED' NOT NULL,
	"priority" "task_priority" DEFAULT 'NORMAL' NOT NULL,
	"planned_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"is_overdue" boolean DEFAULT false NOT NULL,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "test_tasks_task_number_unique" UNIQUE("task_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_plans" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"planned_date" timestamp with time zone NOT NULL,
	"department_id" varchar(36),
	"notes" text,
	"created_by" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calculations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"result_id" varchar(36) NOT NULL,
	"formula" text,
	"input_values" jsonb,
	"calculated_value" numeric(15, 6),
	"calculated_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nonconformities" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"result_id" varchar(36),
	"task_id" varchar(36),
	"nc_number" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"root_cause" text,
	"corrective_action" text,
	"preventive_action" text,
	"status" "nonconformity_status" DEFAULT 'OPEN' NOT NULL,
	"raised_by" varchar(36),
	"raised_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_by" varchar(36),
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qc_checks" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"result_id" varchar(36) NOT NULL,
	"check_type" varchar(50) NOT NULL,
	"expected_value" numeric(15, 6),
	"actual_value" numeric(15, 6),
	"acceptance_min" numeric(15, 6),
	"acceptance_max" numeric(15, 6),
	"is_passed" boolean NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "result_attachments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"result_id" varchar(36) NOT NULL,
	"run_id" varchar(36),
	"file_path" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50),
	"file_size" integer,
	"description" text,
	"uploaded_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_results" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"task_id" varchar(36) NOT NULL,
	"run_id" varchar(36),
	"parameter_id" varchar(36),
	"subparameter_id" varchar(36),
	"result_value" numeric(15, 6),
	"result_text" varchar(100),
	"unit_id" varchar(36),
	"is_nd" boolean DEFAULT false NOT NULL,
	"nd_reporting_style" "nd_reporting_style",
	"lod_value" numeric(15, 6),
	"loq_value" numeric(15, 6),
	"uncertainty" numeric(15, 6),
	"uncertainty_unit" varchar(50),
	"limit_min" numeric(15, 6),
	"limit_max" numeric(15, 6),
	"compliance_status" "compliance_status" DEFAULT 'NOT_EVALUATED',
	"qc_recovery_percent" numeric(6, 2),
	"qc_status" "qc_status" DEFAULT 'NONE',
	"entered_by" varchar(36),
	"entered_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "test_results_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_runs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"task_id" varchar(36) NOT NULL,
	"run_number" integer DEFAULT 1 NOT NULL,
	"instrument_id" varchar(36),
	"dilution_factor" numeric(10, 4) DEFAULT '1',
	"raw_reading" numeric(15, 6),
	"blank_reading" numeric(15, 6),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"performed_by" varchar(36),
	"notes" text,
	"is_final" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qc_recovery_records" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"matrix_id" varchar(36),
	"parameter_id" varchar(36),
	"subparameter_id" varchar(36),
	"method_id" varchar(36),
	"instrument_id" varchar(36),
	"spiked_amount" numeric(15, 6) NOT NULL,
	"recovered_amount" numeric(15, 6) NOT NULL,
	"recovery_percent" numeric(6, 2) NOT NULL,
	"acceptance_min" numeric(5, 2) DEFAULT '80.00' NOT NULL,
	"acceptance_max" numeric(5, 2) DEFAULT '120.00' NOT NULL,
	"is_passed" boolean NOT NULL,
	"performed_by" varchar(36),
	"performed_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qc_trend_cache" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"matrix_id" varchar(36) NOT NULL,
	"parameter_id" varchar(36) NOT NULL,
	"method_id" varchar(36),
	"last_five_recoveries" jsonb,
	"average_recovery" numeric(6, 2),
	"std_deviation" numeric(6, 2),
	"warning_limit_low" numeric(6, 2),
	"warning_limit_high" numeric(6, 2),
	"control_limit_low" numeric(6, 2),
	"control_limit_high" numeric(6, 2),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_conformity_statements" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"report_id" varchar(36) NOT NULL,
	"statement_text" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_customer_snapshot" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"report_id" varchar(36) NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_address" text,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_customer_snapshot_report_id_unique" UNIQUE("report_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_documents" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"report_id" varchar(36) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_draft" boolean DEFAULT true NOT NULL,
	"has_watermark" boolean DEFAULT true NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"generated_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_locks" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"report_id" varchar(36) NOT NULL,
	"locked_by" varchar(36) NOT NULL,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text,
	"unlocked_by" varchar(36),
	"unlocked_at" timestamp with time zone,
	"unlock_reason" text,
	"change_request_id" varchar(36),
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_results" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"report_id" varchar(36) NOT NULL,
	"sample_snapshot_id" varchar(36),
	"result_id" varchar(36),
	"parameter_name" varchar(255) NOT NULL,
	"method_code" varchar(100),
	"result_value" varchar(100) NOT NULL,
	"unit" varchar(50),
	"limit_value" varchar(100),
	"compliance_status" varchar(20),
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_sample_snapshot" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"report_id" varchar(36) NOT NULL,
	"sample_id" varchar(36) NOT NULL,
	"sample_lab_id" varchar(50) NOT NULL,
	"sample_name" varchar(255),
	"matrix_name" varchar(255),
	"received_date" timestamp with time zone,
	"sampling_date" timestamp with time zone,
	"condition" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"report_number" varchar(50) NOT NULL,
	"revision_number" integer DEFAULT 0 NOT NULL,
	"work_order_id" varchar(36) NOT NULL,
	"status" "report_status" DEFAULT 'DRAFT' NOT NULL,
	"title" varchar(500),
	"regulation_reference" varchar(255),
	"generated_by" varchar(36),
	"generated_at" timestamp with time zone,
	"approved_by" varchar(36),
	"approved_at" timestamp with time zone,
	"signature_id" varchar(36),
	"signed_at" timestamp with time zone,
	"is_locked" boolean DEFAULT false NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" varchar(36),
	"released_at" timestamp with time zone,
	"released_by" varchar(36),
	"internal_notes" text,
	"public_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_report_number_unique" UNIQUE("report_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "result_submissions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"submission_number" varchar(50) NOT NULL,
	"work_order_id" varchar(36) NOT NULL,
	"status" "submission_status" DEFAULT 'SUBMITTED' NOT NULL,
	"submitted_by" varchar(36) NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" varchar(36),
	"reviewed_at" timestamp with time zone,
	"analyst_notes" text,
	"reviewer_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "result_submissions_submission_number_unique" UNIQUE("submission_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "result_versions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"result_id" varchar(36) NOT NULL,
	"version" integer NOT NULL,
	"result_data" jsonb NOT NULL,
	"changed_fields" jsonb,
	"change_reason" text,
	"changed_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revision_request_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"revision_request_id" varchar(36) NOT NULL,
	"task_id" varchar(36) NOT NULL,
	"issue_description" text,
	"correction_required" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revision_requests" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"revision_number" varchar(50) NOT NULL,
	"submission_id" varchar(36) NOT NULL,
	"scope" "revision_scope" DEFAULT 'SPECIFIC_TESTS' NOT NULL,
	"reason" text NOT NULL,
	"requested_by" varchar(36) NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_by" varchar(36),
	"resolved_at" timestamp with time zone,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "signatures" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"signatory_name" varchar(255) NOT NULL,
	"signatory_title" varchar(255),
	"signature_image_path" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "submission_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"submission_id" varchar(36) NOT NULL,
	"task_id" varchar(36) NOT NULL,
	"result_id" varchar(36),
	"is_approved" boolean,
	"return_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "change_request_attachments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"change_request_id" varchar(36) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50),
	"file_size" integer,
	"description" text,
	"uploaded_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "change_request_audit" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"change_request_id" varchar(36) NOT NULL,
	"action" varchar(50) NOT NULL,
	"previous_status" "change_request_status",
	"new_status" "change_request_status",
	"performed_by" varchar(36),
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "change_request_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"change_request_id" varchar(36) NOT NULL,
	"change_type" "change_type" NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" varchar(36) NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"description" text,
	"is_applied" boolean DEFAULT false NOT NULL,
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "change_requests" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"cr_number" varchar(50) NOT NULL,
	"work_order_id" varchar(36),
	"report_id" varchar(36),
	"status" "change_request_status" DEFAULT 'DRAFT' NOT NULL,
	"reason" text NOT NULL,
	"business_justification" text,
	"requested_by" varchar(36) NOT NULL,
	"requested_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"reviewed_by" varchar(36),
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"applied_by" varchar(36),
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "change_requests_cr_number_unique" UNIQUE("cr_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portal_access_policies" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"can_view_work_orders" boolean DEFAULT true NOT NULL,
	"can_view_reports" boolean DEFAULT true NOT NULL,
	"can_download_reports" boolean DEFAULT true NOT NULL,
	"can_view_status_timeline" boolean DEFAULT true NOT NULL,
	"report_retention_days" integer DEFAULT 1825,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portal_accounts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"contact_name" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"password_reset_token" varchar(255),
	"password_reset_expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portal_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portal_activity_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"account_id" varchar(36) NOT NULL,
	"session_id" varchar(36),
	"action" varchar(50) NOT NULL,
	"resource_type" varchar(50),
	"resource_id" varchar(36),
	"ip_address" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portal_sessions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"account_id" varchar(36) NOT NULL,
	"token" varchar(500) NOT NULL,
	"ip_address" varchar(50),
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portal_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_customer_visibility" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"report_id" varchar(36) NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"visible_from" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "status_timeline_events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"work_order_id" varchar(36) NOT NULL,
	"stage" "timeline_stage" NOT NULL,
	"status" varchar(50) NOT NULL,
	"description" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(36) NOT NULL,
	"action" "audit_action" NOT NULL,
	"user_id" varchar(36),
	"user_email" varchar(255),
	"user_role" varchar(50),
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_fields" jsonb,
	"reason" text,
	"ip_address" varchar(50),
	"user_agent" text,
	"related_entities" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entity_locks" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(36) NOT NULL,
	"locked_by" varchar(36) NOT NULL,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text,
	"expires_at" timestamp with time zone,
	"is_released" boolean DEFAULT false NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"recipient_type" varchar(20) NOT NULL,
	"recipient_id" varchar(36),
	"recipient_email" varchar(255),
	"channel" "notification_channel" NOT NULL,
	"subject" varchar(500),
	"message" text NOT NULL,
	"html_content" text,
	"entity_type" varchar(50),
	"entity_id" varchar(36),
	"status" "notification_status" DEFAULT 'PENDING' NOT NULL,
	"sent_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"webhook_response_code" integer,
	"webhook_response_body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "policy_violations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"violation_type" varchar(100) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"user_id" varchar(36),
	"ip_address" varchar(50),
	"description" text NOT NULL,
	"metadata" jsonb,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" varchar(36),
	"resolved_at" timestamp with time zone,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analyst_skills" ADD CONSTRAINT "analyst_skills_analyst_id_analysts_id_fk" FOREIGN KEY ("analyst_id") REFERENCES "public"."analysts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analysts" ADD CONSTRAINT "analysts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analysts" ADD CONSTRAINT "analysts_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matrix_parameter_rules" ADD CONSTRAINT "matrix_parameter_rules_matrix_id_sample_matrices_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."sample_matrices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matrix_parameter_rules" ADD CONSTRAINT "matrix_parameter_rules_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matrix_parameter_rules" ADD CONSTRAINT "matrix_parameter_rules_subparameter_id_subparameters_id_fk" FOREIGN KEY ("subparameter_id") REFERENCES "public"."subparameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matrix_parameter_rules" ADD CONSTRAINT "matrix_parameter_rules_default_method_id_methods_id_fk" FOREIGN KEY ("default_method_id") REFERENCES "public"."methods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matrix_parameter_rules" ADD CONSTRAINT "matrix_parameter_rules_default_instrument_id_instruments_id_fk" FOREIGN KEY ("default_instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matrix_parameter_rules" ADD CONSTRAINT "matrix_parameter_rules_limit_unit_id_units_id_fk" FOREIGN KEY ("limit_unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parameters" ADD CONSTRAINT "parameters_default_unit_id_units_id_fk" FOREIGN KEY ("default_unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_list" ADD CONSTRAINT "price_list_matrix_id_sample_matrices_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."sample_matrices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_list" ADD CONSTRAINT "price_list_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_list" ADD CONSTRAINT "price_list_subparameter_id_subparameters_id_fk" FOREIGN KEY ("subparameter_id") REFERENCES "public"."subparameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subparameters" ADD CONSTRAINT "subparameters_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_package_items" ADD CONSTRAINT "test_package_items_package_id_test_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."test_packages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_package_items" ADD CONSTRAINT "test_package_items_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_package_items" ADD CONSTRAINT "test_package_items_subparameter_id_subparameters_id_fk" FOREIGN KEY ("subparameter_id") REFERENCES "public"."subparameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_package_items" ADD CONSTRAINT "test_package_items_method_id_methods_id_fk" FOREIGN KEY ("method_id") REFERENCES "public"."methods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_package_items" ADD CONSTRAINT "test_package_items_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_packages" ADD CONSTRAINT "test_packages_matrix_id_sample_matrices_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."sample_matrices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contract_reviews" ADD CONSTRAINT "contract_reviews_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contract_reviews" ADD CONSTRAINT "contract_reviews_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_documents" ADD CONSTRAINT "quotation_documents_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_documents" ADD CONSTRAINT "quotation_documents_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_subparameter_id_subparameters_id_fk" FOREIGN KEY ("subparameter_id") REFERENCES "public"."subparameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_package_id_test_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."test_packages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_method_id_methods_id_fk" FOREIGN KEY ("method_id") REFERENCES "public"."methods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_contact_id_customer_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."customer_contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_matrix_id_sample_matrices_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."sample_matrices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "field_measurements" ADD CONSTRAINT "field_measurements_sample_id_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."samples"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requested_tests" ADD CONSTRAINT "requested_tests_sample_id_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."samples"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requested_tests" ADD CONSTRAINT "requested_tests_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requested_tests" ADD CONSTRAINT "requested_tests_subparameter_id_subparameters_id_fk" FOREIGN KEY ("subparameter_id") REFERENCES "public"."subparameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requested_tests" ADD CONSTRAINT "requested_tests_method_id_methods_id_fk" FOREIGN KEY ("method_id") REFERENCES "public"."methods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requested_tests" ADD CONSTRAINT "requested_tests_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sample_photos" ADD CONSTRAINT "sample_photos_sample_id_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."samples"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sample_photos" ADD CONSTRAINT "sample_photos_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "samples" ADD CONSTRAINT "samples_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "samples" ADD CONSTRAINT "samples_matrix_id_sample_matrices_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."sample_matrices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "samples" ADD CONSTRAINT "samples_storage_location_id_storage_locations_id_fk" FOREIGN KEY ("storage_location_id") REFERENCES "public"."storage_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sampling_details" ADD CONSTRAINT "sampling_details_sample_id_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."samples"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_contact_id_customer_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."customer_contacts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_matrix_id_sample_matrices_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."sample_matrices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_status_logs" ADD CONSTRAINT "task_status_logs_task_id_test_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."test_tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_status_logs" ADD CONSTRAINT "task_status_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_requested_test_id_requested_tests_id_fk" FOREIGN KEY ("requested_test_id") REFERENCES "public"."requested_tests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_sample_id_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."samples"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_work_plan_id_work_plans_id_fk" FOREIGN KEY ("work_plan_id") REFERENCES "public"."work_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_subparameter_id_subparameters_id_fk" FOREIGN KEY ("subparameter_id") REFERENCES "public"."subparameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_method_id_methods_id_fk" FOREIGN KEY ("method_id") REFERENCES "public"."methods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_assigned_to_id_analysts_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."analysts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_tasks" ADD CONSTRAINT "test_tasks_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_plans" ADD CONSTRAINT "work_plans_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_plans" ADD CONSTRAINT "work_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calculations" ADD CONSTRAINT "calculations_result_id_test_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."test_results"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calculations" ADD CONSTRAINT "calculations_calculated_by_users_id_fk" FOREIGN KEY ("calculated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nonconformities" ADD CONSTRAINT "nonconformities_result_id_test_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."test_results"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nonconformities" ADD CONSTRAINT "nonconformities_task_id_test_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."test_tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nonconformities" ADD CONSTRAINT "nonconformities_raised_by_users_id_fk" FOREIGN KEY ("raised_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nonconformities" ADD CONSTRAINT "nonconformities_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qc_checks" ADD CONSTRAINT "qc_checks_result_id_test_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."test_results"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "result_attachments" ADD CONSTRAINT "result_attachments_result_id_test_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."test_results"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "result_attachments" ADD CONSTRAINT "result_attachments_run_id_test_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."test_runs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "result_attachments" ADD CONSTRAINT "result_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_results" ADD CONSTRAINT "test_results_task_id_test_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."test_tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_results" ADD CONSTRAINT "test_results_run_id_test_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."test_runs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_results" ADD CONSTRAINT "test_results_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_results" ADD CONSTRAINT "test_results_subparameter_id_subparameters_id_fk" FOREIGN KEY ("subparameter_id") REFERENCES "public"."subparameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_results" ADD CONSTRAINT "test_results_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_results" ADD CONSTRAINT "test_results_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_task_id_test_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."test_tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qc_recovery_records" ADD CONSTRAINT "qc_recovery_records_matrix_id_sample_matrices_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."sample_matrices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qc_recovery_records" ADD CONSTRAINT "qc_recovery_records_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qc_recovery_records" ADD CONSTRAINT "qc_recovery_records_subparameter_id_subparameters_id_fk" FOREIGN KEY ("subparameter_id") REFERENCES "public"."subparameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qc_recovery_records" ADD CONSTRAINT "qc_recovery_records_method_id_methods_id_fk" FOREIGN KEY ("method_id") REFERENCES "public"."methods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qc_recovery_records" ADD CONSTRAINT "qc_recovery_records_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qc_recovery_records" ADD CONSTRAINT "qc_recovery_records_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qc_trend_cache" ADD CONSTRAINT "qc_trend_cache_matrix_id_sample_matrices_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."sample_matrices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qc_trend_cache" ADD CONSTRAINT "qc_trend_cache_parameter_id_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."parameters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qc_trend_cache" ADD CONSTRAINT "qc_trend_cache_method_id_methods_id_fk" FOREIGN KEY ("method_id") REFERENCES "public"."methods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_conformity_statements" ADD CONSTRAINT "report_conformity_statements_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_customer_snapshot" ADD CONSTRAINT "report_customer_snapshot_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_customer_snapshot" ADD CONSTRAINT "report_customer_snapshot_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_documents" ADD CONSTRAINT "report_documents_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_documents" ADD CONSTRAINT "report_documents_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_locks" ADD CONSTRAINT "report_locks_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_locks" ADD CONSTRAINT "report_locks_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_locks" ADD CONSTRAINT "report_locks_unlocked_by_users_id_fk" FOREIGN KEY ("unlocked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_results" ADD CONSTRAINT "report_results_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_results" ADD CONSTRAINT "report_results_sample_snapshot_id_report_sample_snapshot_id_fk" FOREIGN KEY ("sample_snapshot_id") REFERENCES "public"."report_sample_snapshot"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_results" ADD CONSTRAINT "report_results_result_id_test_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."test_results"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_sample_snapshot" ADD CONSTRAINT "report_sample_snapshot_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_sample_snapshot" ADD CONSTRAINT "report_sample_snapshot_sample_id_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."samples"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_released_by_users_id_fk" FOREIGN KEY ("released_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "result_submissions" ADD CONSTRAINT "result_submissions_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "result_submissions" ADD CONSTRAINT "result_submissions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "result_submissions" ADD CONSTRAINT "result_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "result_versions" ADD CONSTRAINT "result_versions_result_id_test_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."test_results"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "result_versions" ADD CONSTRAINT "result_versions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revision_request_items" ADD CONSTRAINT "revision_request_items_revision_request_id_revision_requests_id_fk" FOREIGN KEY ("revision_request_id") REFERENCES "public"."revision_requests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revision_request_items" ADD CONSTRAINT "revision_request_items_task_id_test_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."test_tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revision_requests" ADD CONSTRAINT "revision_requests_submission_id_result_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."result_submissions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revision_requests" ADD CONSTRAINT "revision_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revision_requests" ADD CONSTRAINT "revision_requests_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "signatures" ADD CONSTRAINT "signatures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submission_items" ADD CONSTRAINT "submission_items_submission_id_result_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."result_submissions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submission_items" ADD CONSTRAINT "submission_items_task_id_test_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."test_tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submission_items" ADD CONSTRAINT "submission_items_result_id_test_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."test_results"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "change_request_attachments" ADD CONSTRAINT "change_request_attachments_change_request_id_change_requests_id_fk" FOREIGN KEY ("change_request_id") REFERENCES "public"."change_requests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "change_request_attachments" ADD CONSTRAINT "change_request_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "change_request_audit" ADD CONSTRAINT "change_request_audit_change_request_id_change_requests_id_fk" FOREIGN KEY ("change_request_id") REFERENCES "public"."change_requests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "change_request_audit" ADD CONSTRAINT "change_request_audit_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "change_request_items" ADD CONSTRAINT "change_request_items_change_request_id_change_requests_id_fk" FOREIGN KEY ("change_request_id") REFERENCES "public"."change_requests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_applied_by_users_id_fk" FOREIGN KEY ("applied_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portal_access_policies" ADD CONSTRAINT "portal_access_policies_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portal_accounts" ADD CONSTRAINT "portal_accounts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portal_activity_logs" ADD CONSTRAINT "portal_activity_logs_account_id_portal_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."portal_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portal_activity_logs" ADD CONSTRAINT "portal_activity_logs_session_id_portal_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."portal_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_account_id_portal_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."portal_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_customer_visibility" ADD CONSTRAINT "report_customer_visibility_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_customer_visibility" ADD CONSTRAINT "report_customer_visibility_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "status_timeline_events" ADD CONSTRAINT "status_timeline_events_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "entity_locks" ADD CONSTRAINT "entity_locks_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_entity_idx" ON "audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_user_idx" ON "audit_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_created_at_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lock_entity_idx" ON "entity_locks" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_recipient_idx" ON "notifications" USING btree ("recipient_type","recipient_id");