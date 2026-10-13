ALTER TABLE `cart_items` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
CREATE INDEX `cart_items_session_idx` ON `cart_items` (`session_id`);--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_status` varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `fulfillment_status` varchar(50) DEFAULT 'unfulfilled' NOT NULL;--> statement-breakpoint
UPDATE `orders` SET `payment_status` = CASE WHEN `status` = 'paid' THEN 'paid' ELSE 'pending' END;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_method` varchar(50) DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `orders` ADD `tracking_number` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` ADD `discount_cents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paid_at` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `idempotency_key` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_idempotency_key_unique` UNIQUE(`idempotency_key`);--> statement-breakpoint
ALTER TABLE `orders` ADD `cart_session_id` varchar(255);--> statement-breakpoint
CREATE INDEX `orders_payment_status_idx` ON `orders` (`payment_status`);--> statement-breakpoint
CREATE INDEX `orders_fulfillment_status_idx` ON `orders` (`fulfillment_status`);--> statement-breakpoint
ALTER TABLE `order_items` ADD `meta` json;--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `provider_payment_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_provider_payment_id_unique` UNIQUE(`provider_payment_id`);--> statement-breakpoint
ALTER TABLE `products` DROP FOREIGN KEY `products_category_id_categories_id_fk`;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `category_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `order_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`from_status` varchar(50),
	`to_status` varchar(50),
	`actor` varchar(100) DEFAULT 'system' NOT NULL,
	`meta` json,
	`created_at` timestamp DEFAULT (now()) NOT NULL,
	CONSTRAINT `order_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `order_events_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
);--> statement-breakpoint
CREATE INDEX `order_events_order_idx` ON `order_events` (`order_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(50) NOT NULL,
	`event_id` varchar(255) NOT NULL,
	`type` varchar(100) NOT NULL,
	`processed_at` timestamp DEFAULT (now()) NOT NULL,
	CONSTRAINT `webhook_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_events_event_id_unique` UNIQUE(`event_id`)
);--> statement-breakpoint
CREATE INDEX `webhook_events_provider_idx` ON `webhook_events` (`provider`);
