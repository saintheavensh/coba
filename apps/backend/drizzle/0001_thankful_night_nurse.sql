CREATE INDEX IF NOT EXISTS "product_batches_product_idx" ON "product_batches" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_batches_variant_idx" ON "product_batches" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_batches_supplier_idx" ON "product_batches" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variants_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_created_at_idx" ON "products" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_code_idx" ON "products" USING btree ("code");