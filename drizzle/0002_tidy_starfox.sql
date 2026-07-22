ALTER TABLE `company_settings` ADD `requireTwoFactorForAdmins` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `sessionTimeoutMinutes` integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `failedLoginAttemptsLimit` integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `ipWhitelistingEnabled` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `dailyBonusBaseAmount` integer DEFAULT 100;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `dailyBonusStreakMilestones` text DEFAULT '{"7":500,"14":1000,"30":3000}';--> statement-breakpoint
ALTER TABLE `company_settings` ADD `referralCommissionRate` real DEFAULT 0.18;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `referralCommissionOnRenewals` integer DEFAULT false;