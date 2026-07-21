CREATE TABLE `crypto_currencies` (
	`id` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`network` text NOT NULL,
	`contractAddress` text,
	`decimalPlaces` integer DEFAULT 8 NOT NULL,
	`minDeposit` real DEFAULT 0 NOT NULL,
	`maxDeposit` real,
	`minWithdrawal` real DEFAULT 0 NOT NULL,
	`maxWithdrawal` real,
	`withdrawalFee` real DEFAULT 0 NOT NULL,
	`depositFee` real DEFAULT 0 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`isDepositEnabled` integer DEFAULT true NOT NULL,
	`isWithdrawalEnabled` integer DEFAULT true NOT NULL,
	`confirmationsRequired` integer DEFAULT 3 NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `crypto_currencies_symbol_unique` ON `crypto_currencies` (`symbol`);--> statement-breakpoint
CREATE INDEX `crypto_currencies_symbol_idx` ON `crypto_currencies` (`symbol`);--> statement-breakpoint
CREATE INDEX `crypto_currencies_network_idx` ON `crypto_currencies` (`network`);--> statement-breakpoint
CREATE INDEX `crypto_currencies_active_idx` ON `crypto_currencies` (`isActive`);--> statement-breakpoint
CREATE TABLE `crypto_deposits` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`walletId` text NOT NULL,
	`currency` text NOT NULL,
	`amount` real NOT NULL,
	`usdAmount` real NOT NULL,
	`fee` real DEFAULT 0 NOT NULL,
	`netAmount` real NOT NULL,
	`txHash` text,
	`fromAddress` text,
	`toAddress` text,
	`confirmations` integer DEFAULT 0 NOT NULL,
	`requiredConfirmations` integer DEFAULT 3 NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`processedBy` text,
	`processedAt` text,
	`completedAt` text,
	`metadata` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`walletId`) REFERENCES `crypto_wallets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`processedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `crypto_deposits_user_idx` ON `crypto_deposits` (`userId`);--> statement-breakpoint
CREATE INDEX `crypto_deposits_wallet_idx` ON `crypto_deposits` (`walletId`);--> statement-breakpoint
CREATE INDEX `crypto_deposits_tx_hash_idx` ON `crypto_deposits` (`txHash`);--> statement-breakpoint
CREATE INDEX `crypto_deposits_status_idx` ON `crypto_deposits` (`status`);--> statement-breakpoint
CREATE INDEX `crypto_deposits_created_at_idx` ON `crypto_deposits` (`createdAt`);--> statement-breakpoint
CREATE TABLE `crypto_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`currency` text NOT NULL,
	`usdRate` real NOT NULL,
	`eurRate` real,
	`rwfRate` real,
	`marketCap` real,
	`volume24h` real,
	`change24h` real,
	`lastUpdated` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `crypto_rates_currency_unique` ON `crypto_rates` (`currency`);--> statement-breakpoint
CREATE INDEX `crypto_rates_currency_idx` ON `crypto_rates` (`currency`);--> statement-breakpoint
CREATE TABLE `crypto_wallets` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`currency` text NOT NULL,
	`address` text NOT NULL,
	`privateKey` text,
	`publicKey` text,
	`balance` real DEFAULT 0 NOT NULL,
	`lockedBalance` real DEFAULT 0 NOT NULL,
	`totalDeposited` real DEFAULT 0 NOT NULL,
	`totalWithdrawn` real DEFAULT 0 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`lastActivityAt` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `crypto_wallets_address_unique` ON `crypto_wallets` (`address`);--> statement-breakpoint
CREATE INDEX `crypto_wallets_user_idx` ON `crypto_wallets` (`userId`);--> statement-breakpoint
CREATE INDEX `crypto_wallets_currency_idx` ON `crypto_wallets` (`currency`);--> statement-breakpoint
CREATE INDEX `crypto_wallets_address_idx` ON `crypto_wallets` (`address`);--> statement-breakpoint
CREATE INDEX `crypto_wallets_user_currency_idx` ON `crypto_wallets` (`userId`,`currency`);--> statement-breakpoint
CREATE TABLE `crypto_withdrawals` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`walletId` text NOT NULL,
	`currency` text NOT NULL,
	`amount` real NOT NULL,
	`usdAmount` real NOT NULL,
	`fee` real DEFAULT 0 NOT NULL,
	`netAmount` real NOT NULL,
	`toAddress` text NOT NULL,
	`memo` text,
	`txHash` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`processedBy` text,
	`processedAt` text,
	`completedAt` text,
	`failureReason` text,
	`metadata` text,
	`requestedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`walletId`) REFERENCES `crypto_wallets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`processedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `crypto_withdrawals_user_idx` ON `crypto_withdrawals` (`userId`);--> statement-breakpoint
CREATE INDEX `crypto_withdrawals_wallet_idx` ON `crypto_withdrawals` (`walletId`);--> statement-breakpoint
CREATE INDEX `crypto_withdrawals_tx_hash_idx` ON `crypto_withdrawals` (`txHash`);--> statement-breakpoint
CREATE INDEX `crypto_withdrawals_status_idx` ON `crypto_withdrawals` (`status`);--> statement-breakpoint
CREATE INDEX `crypto_withdrawals_created_at_idx` ON `crypto_withdrawals` (`createdAt`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`passwordHash` text,
	`roleId` text,
	`phone` text,
	`avatar` text,
	`avatarKey` text,
	`isActive` integer DEFAULT false NOT NULL,
	`lastLoginAt` text,
	`emailVerifiedAt` text,
	`emailVerificationToken` text,
	`passwordResetToken` text,
	`passwordResetExpires` text,
	`failedLoginAttempts` integer DEFAULT 0 NOT NULL,
	`accountLockedUntil` text,
	`failedVerificationAttempts` integer DEFAULT 0,
	`verificationLockedUntil` text,
	`is2FAEnabled` integer DEFAULT false NOT NULL,
	`twoFAEnabledMethods` text DEFAULT '[]',
	`twoFADefaultMethod` text,
	`totpSecret` text,
	`totpBackupCodes` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_emailVerificationToken_unique` ON `users` (`emailVerificationToken`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_passwordResetToken_unique` ON `users` (`passwordResetToken`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`roleId`);--> statement-breakpoint
CREATE INDEX `users_email_verification_token_idx` ON `users` (`emailVerificationToken`);--> statement-breakpoint
CREATE INDEX `users_password_reset_token_idx` ON `users` (`passwordResetToken`);--> statement-breakpoint
CREATE TABLE `otp_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`code` text NOT NULL,
	`type` text NOT NULL,
	`expiresAt` text NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `otp_user_id_idx` ON `otp_verifications` (`userId`);--> statement-breakpoint
CREATE INDEX `otp_code_idx` ON `otp_verifications` (`code`);--> statement-breakpoint
CREATE INDEX `otp_expires_at_idx` ON `otp_verifications` (`expiresAt`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` text NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `sessions_token_idx` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expiresAt`);--> statement-breakpoint
CREATE TABLE `sudo_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` text NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`verifiedAt` text,
	`isVerified` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sudo_sessions_token_unique` ON `sudo_sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sudo_sessions_user_idx` ON `sudo_sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `sudo_sessions_token_idx` ON `sudo_sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sudo_sessions_expires_at_idx` ON `sudo_sessions` (`expiresAt`);--> statement-breakpoint
CREATE TABLE `sudo_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`sessionDuration` integer DEFAULT 15 NOT NULL,
	`codeExpiration` integer DEFAULT 5 NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sudo_settings_userId_unique` ON `sudo_settings` (`userId`);--> statement-breakpoint
CREATE INDEX `sudo_settings_user_idx` ON `sudo_settings` (`userId`);--> statement-breakpoint
CREATE TABLE `two_fa_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expiresAt` text NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `twofa_session_user_id_idx` ON `two_fa_sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `twofa_session_expires_at_idx` ON `two_fa_sessions` (`expiresAt`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`action` text NOT NULL,
	`entityType` text,
	`entityId` text,
	`oldData` text,
	`newData` text,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_user_idx` ON `audit_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `audit_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_logs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `audit_created_at_idx` ON `audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_user_action_idx` ON `audit_logs` (`userId`,`action`);--> statement-breakpoint
CREATE INDEX `audit_entity_action_idx` ON `audit_logs` (`entityType`,`action`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`userId` text,
	`type` text DEFAULT 'INFO',
	`isRead` integer DEFAULT false NOT NULL,
	`link` text,
	`linkText` text,
	`entityType` text,
	`entityId` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notifications_is_read_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `notifications_created_at_idx` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE TABLE `company_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`companyName` text DEFAULT 'Boostly' NOT NULL,
	`logoUrl` text,
	`logoKey` text,
	`phone` text,
	`email` text,
	`address` text,
	`city` text,
	`country` text DEFAULT 'Rwanda',
	`postalCode` text,
	`website` text,
	`description` text,
	`tin` text,
	`vatNumber` text,
	`registrationNumber` text,
	`baseCurrency` text DEFAULT 'USD',
	`baseCurrencySymbol` text DEFAULT '$',
	`supportedCurrencies` text DEFAULT '["RWF","UGX","TZS","KES","BIF","SOS","ETB","DJF","ERN","SSP","NGN","GHS","XOF","GNF","SLE","LRD","GMD","MRU","CVE","STN","XAF","CDF","AOA","ZAR","ZMW","MWK","BWP","NAD","SZL","LSL","MZN","ZWL","MGA","EGP","DZD","MAD","TND","LYD","SDG","MUR","SCR","KMF","USD","EUR","GBP","CHF","CAD","AUD","JPY","CNY","INR","BRL","SAR","AED","QAR","KWD","BHD","OMR","ILS","PKR","BDT","LKR","NPR","IDR","MYR","PHP","SGD","THB","VND"]',
	`currencyPosition` text DEFAULT 'before',
	`decimalPlaces` integer DEFAULT 2,
	`thousandSeparator` text DEFAULT ',',
	`decimalSeparator` text DEFAULT '.',
	`autoUpdateRates` integer DEFAULT true,
	`rateUpdateInterval` integer DEFAULT 3600,
	`lastRateUpdate` text,
	`rateProvider` text DEFAULT 'exchangerate-api',
	`rateApiKey` text,
	`rateApiUrl` text,
	`customRates` text DEFAULT '{}',
	`cryptoEnabled` integer DEFAULT false,
	`cryptoAutoUpdateRates` integer DEFAULT true,
	`cryptoRateProvider` text DEFAULT 'coingecko',
	`cryptoRateApiKey` text,
	`supportedCryptoCurrencies` text DEFAULT '["BTC","ETH","USDT","USDC","SOL","XRP","ADA","DOT","AVAX","MATIC"]',
	`currency` text DEFAULT 'RWF' NOT NULL,
	`currencySymbol` text DEFAULT 'RWF' NOT NULL,
	`timezone` text DEFAULT 'Africa/Kigali',
	`dateFormat` text DEFAULT 'MMM DD, YYYY',
	`timeFormat` text DEFAULT 'HH:mm',
	`weekStartDay` integer DEFAULT 1,
	`smtpHost` text,
	`smtpPort` text DEFAULT '587',
	`smtpUsername` text,
	`smtpPassword` text,
	`fromName` text,
	`fromEmail` text,
	`encryption` text DEFAULT 'TLS',
	`replyTo` text,
	`notifications` text DEFAULT '{"email":true,"inApp":true,"sms":false,"lowStock":true,"overduePayment":true,"newSale":true,"dailySummary":true,"weeklyReport":true,"monthlyReport":true,"withdrawalAlerts":true,"cryptoDepositAlerts":true}',
	`features` text DEFAULT '{"referrals":true,"badges":true,"subscriptions":true,"crypto":false,"ads":true,"games":true,"surveys":true,"videos":true,"leaderboard":true,"dailyBonus":true}',
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `oauth_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`providerEmail` text,
	`providerEmailVerified` integer DEFAULT false NOT NULL,
	`providerName` text,
	`providerAvatar` text,
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` text,
	`lastUsedAt` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `oauth_accounts_user_idx` ON `oauth_accounts` (`userId`);--> statement-breakpoint
CREATE INDEX `oauth_accounts_email_idx` ON `oauth_accounts` (`providerEmail`);--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_accounts_provider_account_idx` ON `oauth_accounts` (`provider`,`providerAccountId`);--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_accounts_user_provider_idx` ON `oauth_accounts` (`userId`,`provider`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`module` text NOT NULL,
	`description` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_key_unique` ON `permissions` (`key`);--> statement-breakpoint
CREATE INDEX `permissions_key_idx` ON `permissions` (`key`);--> statement-breakpoint
CREATE INDEX `permissions_module_idx` ON `permissions` (`module`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`roleId` text NOT NULL,
	`permissionId` text NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `role_permissions_role_idx` ON `role_permissions` (`roleId`);--> statement-breakpoint
CREATE INDEX `role_permissions_permission_idx` ON `role_permissions` (`permissionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `role_permissions_roleId_permissionId_unique` ON `role_permissions` (`roleId`,`permissionId`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`isSystem` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE INDEX `roles_name_idx` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`permissionId` text NOT NULL,
	`grantedBy` text,
	`grantedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_permissions_user_idx` ON `user_permissions` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_permissions_userId_permissionId_unique` ON `user_permissions` (`userId`,`permissionId`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`roleId` text NOT NULL,
	`assignedBy` text,
	`assignedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_roles_user_idx` ON `user_roles` (`userId`);--> statement-breakpoint
CREATE INDEX `user_roles_role_idx` ON `user_roles` (`roleId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_roles_userId_roleId_unique` ON `user_roles` (`userId`,`roleId`);--> statement-breakpoint
CREATE TABLE `playlist_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`playlistId` text NOT NULL,
	`videoId` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`playlistId`) REFERENCES `video_playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`videoId`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `playlist_videos_playlist_idx` ON `playlist_videos` (`playlistId`);--> statement-breakpoint
CREATE INDEX `playlist_videos_video_idx` ON `playlist_videos` (`videoId`);--> statement-breakpoint
CREATE UNIQUE INDEX `playlist_videos_playlist_video_idx` ON `playlist_videos` (`playlistId`,`videoId`);--> statement-breakpoint
CREATE TABLE `video_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`videoId` text NOT NULL,
	`userId` text NOT NULL,
	`parentId` text,
	`content` text NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`isPinned` integer DEFAULT false NOT NULL,
	`isHidden` integer DEFAULT false NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`videoId`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `video_comments_video_idx` ON `video_comments` (`videoId`);--> statement-breakpoint
CREATE INDEX `video_comments_user_idx` ON `video_comments` (`userId`);--> statement-breakpoint
CREATE INDEX `video_comments_parent_idx` ON `video_comments` (`parentId`);--> statement-breakpoint
CREATE INDEX `video_comments_created_at_idx` ON `video_comments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `video_comments_is_hidden_idx` ON `video_comments` (`isHidden`);--> statement-breakpoint
CREATE TABLE `video_engagements` (
	`id` text PRIMARY KEY NOT NULL,
	`videoId` text NOT NULL,
	`userId` text NOT NULL,
	`type` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`videoId`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `video_engagements_video_idx` ON `video_engagements` (`videoId`);--> statement-breakpoint
CREATE INDEX `video_engagements_user_idx` ON `video_engagements` (`userId`);--> statement-breakpoint
CREATE INDEX `video_engagements_type_idx` ON `video_engagements` (`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `video_engagements_user_video_type_idx` ON `video_engagements` (`userId`,`videoId`,`type`);--> statement-breakpoint
CREATE TABLE `video_playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`thumbnailUrl` text,
	`thumbnailKey` text,
	`createdBy` text,
	`isPublic` integer DEFAULT true NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `video_playlists_created_by_idx` ON `video_playlists` (`createdBy`);--> statement-breakpoint
CREATE INDEX `video_playlists_is_public_idx` ON `video_playlists` (`isPublic`);--> statement-breakpoint
CREATE INDEX `video_playlists_featured_idx` ON `video_playlists` (`featured`);--> statement-breakpoint
CREATE TABLE `video_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`videoId` text NOT NULL,
	`userId` text NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewedBy` text,
	`reviewedAt` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`videoId`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `video_reports_video_idx` ON `video_reports` (`videoId`);--> statement-breakpoint
CREATE INDEX `video_reports_user_idx` ON `video_reports` (`userId`);--> statement-breakpoint
CREATE INDEX `video_reports_status_idx` ON `video_reports` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `video_reports_user_video_idx` ON `video_reports` (`userId`,`videoId`);--> statement-breakpoint
CREATE TABLE `video_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`videoId` text NOT NULL,
	`tag` text NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`videoId`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `video_tags_video_idx` ON `video_tags` (`videoId`);--> statement-breakpoint
CREATE INDEX `video_tags_tag_idx` ON `video_tags` (`tag`);--> statement-breakpoint
CREATE UNIQUE INDEX `video_tags_unique_idx` ON `video_tags` (`videoId`,`tag`);--> statement-breakpoint
CREATE TABLE `video_watches` (
	`id` text PRIMARY KEY NOT NULL,
	`videoId` text NOT NULL,
	`userId` text NOT NULL,
	`watchPercent` real DEFAULT 0 NOT NULL,
	`watchDuration` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`watchPoints` integer DEFAULT 0 NOT NULL,
	`rewardClaimed` integer DEFAULT false NOT NULL,
	`rewardAmount` real,
	`deviceType` text,
	`browserInfo` text,
	`startedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`completedAt` text,
	`lastPosition` integer DEFAULT 0 NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`videoId`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `video_watches_video_idx` ON `video_watches` (`videoId`);--> statement-breakpoint
CREATE INDEX `video_watches_user_idx` ON `video_watches` (`userId`);--> statement-breakpoint
CREATE INDEX `video_watches_completed_idx` ON `video_watches` (`completed`);--> statement-breakpoint
CREATE INDEX `video_watches_reward_claimed_idx` ON `video_watches` (`rewardClaimed`);--> statement-breakpoint
CREATE INDEX `video_watches_started_at_idx` ON `video_watches` (`startedAt`);--> statement-breakpoint
CREATE INDEX `video_watches_user_date_idx` ON `video_watches` (`userId`,date("createdAt"));--> statement-breakpoint
CREATE INDEX `video_watches_video_user_date_idx` ON `video_watches` (`videoId`,`userId`,date("createdAt"));--> statement-breakpoint
CREATE UNIQUE INDEX `video_watches_user_video_idx` ON `video_watches` (`userId`,`videoId`);--> statement-breakpoint
CREATE TABLE `videos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`difficulty` text DEFAULT 'BEGINNER',
	`duration` integer,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`videoKey` text,
	`thumbnailKey` text,
	`rewardAmount` real DEFAULT 40 NOT NULL,
	`bonusReward` real,
	`isSponsored` integer DEFAULT false NOT NULL,
	`sponsorName` text,
	`sponsorLogo` text,
	`sponsorWebsite` text,
	`sponsoredUntil` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`watchTime` integer DEFAULT 0 NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`dislikes` integer DEFAULT 0 NOT NULL,
	`shares` integer DEFAULT 0 NOT NULL,
	`saves` integer DEFAULT 0 NOT NULL,
	`completionRate` real DEFAULT 0,
	`createdBy` text,
	`updatedBy` text,
	`publishedAt` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `videos_category_idx` ON `videos` (`category`);--> statement-breakpoint
CREATE INDEX `videos_status_idx` ON `videos` (`status`);--> statement-breakpoint
CREATE INDEX `videos_created_at_idx` ON `videos` (`createdAt`);--> statement-breakpoint
CREATE INDEX `videos_reward_idx` ON `videos` (`rewardAmount`);--> statement-breakpoint
CREATE INDEX `videos_sponsored_idx` ON `videos` (`isSponsored`);--> statement-breakpoint
CREATE INDEX `videos_published_at_idx` ON `videos` (`publishedAt`);--> statement-breakpoint
CREATE INDEX `videos_difficulty_idx` ON `videos` (`difficulty`);--> statement-breakpoint
CREATE TABLE `game_plays` (
	`id` text PRIMARY KEY NOT NULL,
	`gameId` text NOT NULL,
	`userId` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`duration` integer,
	`verifiedSeconds` integer DEFAULT 0 NOT NULL,
	`heartbeatCount` integer DEFAULT 0 NOT NULL,
	`lastHeartbeatAt` text,
	`achievedGoal` integer DEFAULT false NOT NULL,
	`rewardEarned` real,
	`rewardClaimed` integer DEFAULT false NOT NULL,
	`periodDate` text NOT NULL,
	`startedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`completedAt` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_plays_game_idx` ON `game_plays` (`gameId`);--> statement-breakpoint
CREATE INDEX `game_plays_user_idx` ON `game_plays` (`userId`);--> statement-breakpoint
CREATE INDEX `game_plays_reward_claimed_idx` ON `game_plays` (`rewardClaimed`);--> statement-breakpoint
CREATE INDEX `game_plays_achieved_idx` ON `game_plays` (`achievedGoal`);--> statement-breakpoint
CREATE INDEX `game_plays_user_game_idx` ON `game_plays` (`userId`,`gameId`);--> statement-breakpoint
CREATE INDEX `game_plays_created_at_idx` ON `game_plays` (`createdAt`);--> statement-breakpoint
CREATE INDEX `game_plays_status_idx` ON `game_plays` (`status`);--> statement-breakpoint
CREATE INDEX `game_plays_user_period_idx` ON `game_plays` (`userId`,`periodDate`);--> statement-breakpoint
CREATE INDEX `game_plays_user_game_period_idx` ON `game_plays` (`userId`,`gameId`,`periodDate`);--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`icon` text,
	`thumbnailUrl` text,
	`thumbnailKey` text,
	`gameUrl` text,
	`provider` text DEFAULT 'SELF_HOSTED' NOT NULL,
	`orientation` text DEFAULT 'BOTH' NOT NULL,
	`baseReward` real DEFAULT 50 NOT NULL,
	`maxReward` real DEFAULT 150 NOT NULL,
	`isSponsored` integer DEFAULT false NOT NULL,
	`sponsorName` text,
	`sponsorLogo` text,
	`sponsorWebsite` text,
	`sponsoredUntil` text,
	`maxPlaysPerDay` integer DEFAULT 10 NOT NULL,
	`minPlayDuration` integer DEFAULT 30 NOT NULL,
	`maxRewardedSecondsPerDay` integer DEFAULT 600 NOT NULL,
	`difficulty` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`totalPlays` integer DEFAULT 0 NOT NULL,
	`totalPlayers` integer DEFAULT 0 NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`shares` integer DEFAULT 0 NOT NULL,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `games_category_idx` ON `games` (`category`);--> statement-breakpoint
CREATE INDEX `games_status_idx` ON `games` (`status`);--> statement-breakpoint
CREATE INDEX `games_created_at_idx` ON `games` (`createdAt`);--> statement-breakpoint
CREATE INDEX `games_reward_idx` ON `games` (`baseReward`);--> statement-breakpoint
CREATE INDEX `games_sponsored_idx` ON `games` (`isSponsored`);--> statement-breakpoint
CREATE INDEX `games_provider_idx` ON `games` (`provider`);--> statement-breakpoint
CREATE TABLE `survey_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`surveyId` text NOT NULL,
	`question` text NOT NULL,
	`description` text,
	`order` integer DEFAULT 0 NOT NULL,
	`type` text DEFAULT 'single_choice' NOT NULL,
	`options` text NOT NULL,
	`required` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`surveyId`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `survey_questions_survey_idx` ON `survey_questions` (`surveyId`);--> statement-breakpoint
CREATE INDEX `survey_questions_order_idx` ON `survey_questions` (`order`);--> statement-breakpoint
CREATE INDEX `survey_questions_type_idx` ON `survey_questions` (`type`);--> statement-breakpoint
CREATE TABLE `survey_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`surveyId` text NOT NULL,
	`userId` text NOT NULL,
	`rating` integer NOT NULL,
	`feedback` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`surveyId`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `survey_ratings_survey_idx` ON `survey_ratings` (`surveyId`);--> statement-breakpoint
CREATE INDEX `survey_ratings_user_idx` ON `survey_ratings` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `survey_ratings_user_survey_idx` ON `survey_ratings` (`userId`,`surveyId`);--> statement-breakpoint
CREATE TABLE `survey_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`surveyId` text NOT NULL,
	`userId` text NOT NULL,
	`answers` text,
	`timeSpent` integer DEFAULT 0,
	`deviceType` text,
	`rewardClaimed` integer DEFAULT false NOT NULL,
	`rewardAmount` real,
	`completed` integer DEFAULT false NOT NULL,
	`completedAt` text,
	`rating` integer,
	`startedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`surveyId`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `survey_responses_survey_idx` ON `survey_responses` (`surveyId`);--> statement-breakpoint
CREATE INDEX `survey_responses_user_idx` ON `survey_responses` (`userId`);--> statement-breakpoint
CREATE INDEX `survey_responses_completed_idx` ON `survey_responses` (`completed`);--> statement-breakpoint
CREATE INDEX `survey_responses_reward_claimed_idx` ON `survey_responses` (`rewardClaimed`);--> statement-breakpoint
CREATE INDEX `survey_responses_created_at_idx` ON `survey_responses` (`createdAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `survey_responses_user_survey_idx` ON `survey_responses` (`userId`,`surveyId`);--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`brand` text NOT NULL,
	`brandLogo` text,
	`brandLogoKey` text,
	`category` text NOT NULL,
	`questionsCount` integer DEFAULT 5 NOT NULL,
	`estimatedTime` integer DEFAULT 5 NOT NULL,
	`rewardAmount` real DEFAULT 200 NOT NULL,
	`isSponsored` integer DEFAULT false NOT NULL,
	`sponsorName` text,
	`sponsorLogo` text,
	`sponsorWebsite` text,
	`sponsoredUntil` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`maxParticipants` integer,
	`currentParticipants` integer DEFAULT 0 NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`completionRate` real DEFAULT 0,
	`averageRating` real DEFAULT 0,
	`createdBy` text,
	`updatedBy` text,
	`startsAt` text,
	`endsAt` text,
	`publishedAt` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `surveys_status_idx` ON `surveys` (`status`);--> statement-breakpoint
CREATE INDEX `surveys_brand_idx` ON `surveys` (`brand`);--> statement-breakpoint
CREATE INDEX `surveys_category_idx` ON `surveys` (`category`);--> statement-breakpoint
CREATE INDEX `surveys_created_at_idx` ON `surveys` (`createdAt`);--> statement-breakpoint
CREATE INDEX `surveys_reward_idx` ON `surveys` (`rewardAmount`);--> statement-breakpoint
CREATE INDEX `surveys_ends_at_idx` ON `surveys` (`endsAt`);--> statement-breakpoint
CREATE INDEX `surveys_sponsored_idx` ON `surveys` (`isSponsored`);--> statement-breakpoint
CREATE INDEX `surveys_published_at_idx` ON `surveys` (`publishedAt`);--> statement-breakpoint
CREATE TABLE `ad_watches` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`advertiser` text NOT NULL,
	`rewardAmount` real NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`watchDuration` integer,
	`rewardClaimed` integer DEFAULT false NOT NULL,
	`startedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`completedAt` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ad_watches_user_idx` ON `ad_watches` (`userId`);--> statement-breakpoint
CREATE INDEX `ad_watches_completed_idx` ON `ad_watches` (`completed`);--> statement-breakpoint
CREATE INDEX `ad_watches_reward_claimed_idx` ON `ad_watches` (`rewardClaimed`);--> statement-breakpoint
CREATE INDEX `ad_watches_created_at_idx` ON `ad_watches` (`createdAt`);--> statement-breakpoint
CREATE TABLE `daily_bonuses` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`streakDay` integer DEFAULT 1 NOT NULL,
	`bonusAmount` real NOT NULL,
	`claimed` integer DEFAULT false NOT NULL,
	`claimedAt` text,
	`date` text NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `daily_bonuses_user_idx` ON `daily_bonuses` (`userId`);--> statement-breakpoint
CREATE INDEX `daily_bonuses_date_idx` ON `daily_bonuses` (`date`);--> statement-breakpoint
CREATE INDEX `daily_bonuses_claimed_idx` ON `daily_bonuses` (`claimed`);--> statement-breakpoint
CREATE UNIQUE INDEX `daily_bonuses_user_date_idx` ON `daily_bonuses` (`userId`,`date`);--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`baseAmount` real NOT NULL,
	`multiplier` real DEFAULT 1 NOT NULL,
	`description` text,
	`sourceId` text,
	`sourceType` text,
	`dedupeKey` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`claimedAt` text,
	`metadata` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `rewards_user_idx` ON `rewards` (`userId`);--> statement-breakpoint
CREATE INDEX `rewards_type_idx` ON `rewards` (`type`);--> statement-breakpoint
CREATE INDEX `rewards_status_idx` ON `rewards` (`status`);--> statement-breakpoint
CREATE INDEX `rewards_created_at_idx` ON `rewards` (`createdAt`);--> statement-breakpoint
CREATE INDEX `rewards_source_idx` ON `rewards` (`sourceId`,`sourceType`);--> statement-breakpoint
CREATE INDEX `rewards_user_type_idx` ON `rewards` (`userId`,`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `rewards_user_dedupe_idx` ON `rewards` (`userId`,`dedupeKey`);--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`baseCurrency` text DEFAULT 'USD' NOT NULL,
	`targetCurrency` text NOT NULL,
	`rate` real NOT NULL,
	`change24h` real DEFAULT 0,
	`volume24h` real DEFAULT 0,
	`marketCap` real DEFAULT 0,
	`lastUpdated` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `exchange_rates_target_currency_idx` ON `exchange_rates` (`targetCurrency`);--> statement-breakpoint
CREATE INDEX `exchange_rates_base_currency_idx` ON `exchange_rates` (`baseCurrency`);--> statement-breakpoint
CREATE INDEX `exchange_rates_base_target_idx` ON `exchange_rates` (`baseCurrency`,`targetCurrency`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`walletId` text NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text NOT NULL,
	`amountInBase` real NOT NULL,
	`description` text NOT NULL,
	`referenceId` text,
	`referenceType` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`metadata` text,
	`completedAt` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`walletId`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `transactions_wallet_idx` ON `transactions` (`walletId`);--> statement-breakpoint
CREATE INDEX `transactions_user_idx` ON `transactions` (`userId`);--> statement-breakpoint
CREATE INDEX `transactions_type_idx` ON `transactions` (`type`);--> statement-breakpoint
CREATE INDEX `transactions_status_idx` ON `transactions` (`status`);--> statement-breakpoint
CREATE INDEX `transactions_currency_idx` ON `transactions` (`currency`);--> statement-breakpoint
CREATE INDEX `transactions_created_at_idx` ON `transactions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `transactions_reference_idx` ON `transactions` (`referenceId`,`referenceType`);--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`defaultCurrency` text DEFAULT 'RWF' NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`totalEarned` real DEFAULT 0 NOT NULL,
	`totalWithdrawn` real DEFAULT 0 NOT NULL,
	`pendingWithdrawal` real DEFAULT 0 NOT NULL,
	`lastActivityAt` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wallets_userId_unique` ON `wallets` (`userId`);--> statement-breakpoint
CREATE INDEX `wallets_user_idx` ON `wallets` (`userId`);--> statement-breakpoint
CREATE INDEX `wallets_balance_idx` ON `wallets` (`balance`);--> statement-breakpoint
CREATE INDEX `wallets_default_currency_idx` ON `wallets` (`defaultCurrency`);--> statement-breakpoint
CREATE TABLE `withdrawals` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text NOT NULL,
	`amountInBase` real NOT NULL,
	`method` text NOT NULL,
	`phoneNumber` text,
	`bankAccount` text,
	`accountName` text,
	`bankName` text,
	`cryptoAddress` text,
	`cryptoNetwork` text,
	`txHash` text,
	`memo` text,
	`fee` real DEFAULT 0,
	`netAmount` real,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`processedBy` text,
	`processedAt` text,
	`completedAt` text,
	`reference` text,
	`failureReason` text,
	`metadata` text,
	`requestedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`processedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `withdrawals_user_idx` ON `withdrawals` (`userId`);--> statement-breakpoint
CREATE INDEX `withdrawals_status_idx` ON `withdrawals` (`status`);--> statement-breakpoint
CREATE INDEX `withdrawals_method_idx` ON `withdrawals` (`method`);--> statement-breakpoint
CREATE INDEX `withdrawals_currency_idx` ON `withdrawals` (`currency`);--> statement-breakpoint
CREATE INDEX `withdrawals_created_at_idx` ON `withdrawals` (`createdAt`);--> statement-breakpoint
CREATE INDEX `withdrawals_requested_at_idx` ON `withdrawals` (`requestedAt`);--> statement-breakpoint
CREATE INDEX `withdrawals_tx_hash_idx` ON `withdrawals` (`txHash`);--> statement-breakpoint
CREATE TABLE `referral_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`code` text NOT NULL,
	`timesUsed` integer DEFAULT 0 NOT NULL,
	`maxUses` integer,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referral_codes_userId_unique` ON `referral_codes` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `referral_codes_code_unique` ON `referral_codes` (`code`);--> statement-breakpoint
CREATE INDEX `referral_codes_user_idx` ON `referral_codes` (`userId`);--> statement-breakpoint
CREATE INDEX `referral_codes_code_idx` ON `referral_codes` (`code`);--> statement-breakpoint
CREATE INDEX `referral_codes_active_idx` ON `referral_codes` (`isActive`);--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`referrerId` text NOT NULL,
	`refereeId` text NOT NULL,
	`code` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`referrerReward` real DEFAULT 200 NOT NULL,
	`refereeReward` real DEFAULT 50 NOT NULL,
	`referrerRewardClaimed` integer DEFAULT false NOT NULL,
	`refereeRewardClaimed` integer DEFAULT false NOT NULL,
	`joinedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`activatedAt` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`referrerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`refereeId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referrals_refereeId_unique` ON `referrals` (`refereeId`);--> statement-breakpoint
CREATE INDEX `referrals_referrer_idx` ON `referrals` (`referrerId`);--> statement-breakpoint
CREATE INDEX `referrals_referee_idx` ON `referrals` (`refereeId`);--> statement-breakpoint
CREATE INDEX `referrals_code_idx` ON `referrals` (`code`);--> statement-breakpoint
CREATE INDEX `referrals_status_idx` ON `referrals` (`status`);--> statement-breakpoint
CREATE INDEX `referrals_referrer_claimed_idx` ON `referrals` (`referrerRewardClaimed`);--> statement-breakpoint
CREATE TABLE `badges` (
	`id` text PRIMARY KEY NOT NULL,
	`tier` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`earningsBoost` real NOT NULL,
	`oneTimeReward` real NOT NULL,
	`price` real NOT NULL,
	`features` text NOT NULL,
	`icon` text,
	`color` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `badges_tier_unique` ON `badges` (`tier`);--> statement-breakpoint
CREATE INDEX `badges_tier_idx` ON `badges` (`tier`);--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`tier` text NOT NULL,
	`priceMonthly` real NOT NULL,
	`priceYearly` real,
	`dailyEarnings` real NOT NULL,
	`features` text NOT NULL,
	`maxDailyVideos` integer DEFAULT 10 NOT NULL,
	`maxDailyGames` integer DEFAULT 5 NOT NULL,
	`maxDailyAds` integer DEFAULT 10 NOT NULL,
	`maxDailySurveys` integer DEFAULT 3 NOT NULL,
	`badgeBoost` real DEFAULT 0 NOT NULL,
	`priorityWithdrawal` integer DEFAULT false NOT NULL,
	`vipSupport` integer DEFAULT false NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `subscription_plans_tier_idx` ON `subscription_plans` (`tier`);--> statement-breakpoint
CREATE INDEX `subscription_plans_active_idx` ON `subscription_plans` (`isActive`);--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`badgeId` text NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`purchasedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`expiredAt` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`badgeId`) REFERENCES `badges`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_badges_user_idx` ON `user_badges` (`userId`);--> statement-breakpoint
CREATE INDEX `user_badges_badge_idx` ON `user_badges` (`badgeId`);--> statement-breakpoint
CREATE INDEX `user_badges_active_idx` ON `user_badges` (`isActive`);--> statement-breakpoint
CREATE INDEX `user_badges_user_badge_idx` ON `user_badges` (`userId`,`badgeId`);--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`planId` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`startsAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`expiresAt` text,
	`cancelledAt` text,
	`billingCycle` text DEFAULT 'MONTHLY' NOT NULL,
	`autoRenew` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updatedAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`planId`) REFERENCES `subscription_plans`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_subscriptions_userId_unique` ON `user_subscriptions` (`userId`);--> statement-breakpoint
CREATE INDEX `user_subscriptions_user_idx` ON `user_subscriptions` (`userId`);--> statement-breakpoint
CREATE INDEX `user_subscriptions_plan_idx` ON `user_subscriptions` (`planId`);--> statement-breakpoint
CREATE INDEX `user_subscriptions_status_idx` ON `user_subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `user_subscriptions_expires_idx` ON `user_subscriptions` (`expiresAt`);--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`to` text NOT NULL,
	`subject` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`sentAt` text,
	`error` text,
	`createdAt` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `email_logs_to_idx` ON `email_logs` (`to`);--> statement-breakpoint
CREATE INDEX `email_logs_type_idx` ON `email_logs` (`type`);--> statement-breakpoint
CREATE INDEX `email_logs_status_idx` ON `email_logs` (`status`);