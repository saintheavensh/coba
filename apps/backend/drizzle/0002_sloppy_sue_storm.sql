CREATE TABLE "user_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"login_time" timestamp DEFAULT now(),
	"logout_time" timestamp,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"min_weight" integer,
	"max_weight" integer,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "service_items" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text,
	"service_type_id" text,
	"technician_id" text,
	"description" text,
	"estimated_cost" integer,
	"actual_cost" integer,
	"status" text DEFAULT 'PENDING',
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "service_parts" (
	"id" text PRIMARY KEY NOT NULL,
	"service_item_id" text,
	"variant_batch_id" text,
	"quantity" integer NOT NULL,
	"purchase_price" integer,
	"selling_price" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_types" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text,
	"name" text NOT NULL,
	"weight" integer NOT NULL,
	"default_price" integer,
	"commission_percent" numeric(5, 2),
	"warranty_days" integer DEFAULT 30,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technician_commission_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"technician_id" text,
	"commission_type" text,
	"simple_rate" numeric(5, 2),
	"base_salary" integer,
	"value_per_point" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technician_commissions" (
	"id" text PRIMARY KEY NOT NULL,
	"technician_id" text,
	"service_item_id" text,
	"commission_type" text,
	"base_amount" integer,
	"commission_amount" integer,
	"paid" boolean DEFAULT false,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "supplier_product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text,
	"product_id" text,
	"variant_id" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "supplier_product_variants_supplier_id_product_id_variant_id_unique" UNIQUE("supplier_id","product_id","variant_id")
);
--> statement-breakpoint
CREATE TABLE "dead_phone_purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"device_name" text NOT NULL,
	"imei" text,
	"purchase_price" integer NOT NULL,
	"purchase_date" date NOT NULL,
	"supplier_id" text,
	"suspected_issue" text,
	"visual_condition" text,
	"status" text DEFAULT 'STORED',
	"storage_location" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forfeited_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text,
	"device_name" text,
	"forfeited_date" date NOT NULL,
	"status" text DEFAULT 'UTUH',
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "gambling_test_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"dead_phone_id" text,
	"trigger_service_id" text,
	"test_date" timestamp DEFAULT now(),
	"technician_id" text,
	"test_results" jsonb,
	"verdict" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "part_harvest_log" (
	"id" text PRIMARY KEY NOT NULL,
	"forfeited_device_id" text,
	"dead_phone_id" text,
	"part_type" text NOT NULL,
	"part_condition" text,
	"target_service_id" text,
	"technician_id" text,
	"harvest_date" timestamp DEFAULT now(),
	"new_batch_id" text,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_role_id_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_role_id_pk";--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "role" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_parts" ADD CONSTRAINT "service_parts_service_item_id_service_items_id_fk" FOREIGN KEY ("service_item_id") REFERENCES "public"."service_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_parts" ADD CONSTRAINT "service_parts_variant_batch_id_product_batches_id_fk" FOREIGN KEY ("variant_batch_id") REFERENCES "public"."product_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technician_commission_settings" ADD CONSTRAINT "technician_commission_settings_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technician_commissions" ADD CONSTRAINT "technician_commissions_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technician_commissions" ADD CONSTRAINT "technician_commissions_service_item_id_service_items_id_fk" FOREIGN KEY ("service_item_id") REFERENCES "public"."service_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_product_variants" ADD CONSTRAINT "supplier_product_variants_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_product_variants" ADD CONSTRAINT "supplier_product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_product_variants" ADD CONSTRAINT "supplier_product_variants_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dead_phone_purchases" ADD CONSTRAINT "dead_phone_purchases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forfeited_devices" ADD CONSTRAINT "forfeited_devices_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gambling_test_logs" ADD CONSTRAINT "gambling_test_logs_dead_phone_id_dead_phone_purchases_id_fk" FOREIGN KEY ("dead_phone_id") REFERENCES "public"."dead_phone_purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gambling_test_logs" ADD CONSTRAINT "gambling_test_logs_trigger_service_id_services_id_fk" FOREIGN KEY ("trigger_service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gambling_test_logs" ADD CONSTRAINT "gambling_test_logs_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_harvest_log" ADD CONSTRAINT "part_harvest_log_forfeited_device_id_forfeited_devices_id_fk" FOREIGN KEY ("forfeited_device_id") REFERENCES "public"."forfeited_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_harvest_log" ADD CONSTRAINT "part_harvest_log_dead_phone_id_dead_phone_purchases_id_fk" FOREIGN KEY ("dead_phone_id") REFERENCES "public"."dead_phone_purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_harvest_log" ADD CONSTRAINT "part_harvest_log_target_service_id_services_id_fk" FOREIGN KEY ("target_service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_harvest_log" ADD CONSTRAINT "part_harvest_log_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_harvest_log" ADD CONSTRAINT "part_harvest_log_new_batch_id_product_batches_id_fk" FOREIGN KEY ("new_batch_id") REFERENCES "public"."product_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" DROP COLUMN "role_id";--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "price_not_negative" CHECK ("product_batches"."buy_price" >= 0 AND "product_batches"."sell_price" >= 0);--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "stock_not_negative" CHECK ("product_batches"."current_stock" >= 0);