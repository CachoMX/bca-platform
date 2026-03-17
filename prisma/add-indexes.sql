-- Migration: Add indexes and unique constraints
-- Run this against the production database, then run `prisma db push` to sync schema state.

-- Calls table indexes (dbo schema)
CREATE NONCLUSTERED INDEX [IX_Calls_User_Date]
  ON [dbo].[Calls] ([IdUser], [CallDate]);

CREATE NONCLUSTERED INDEX [IX_Calls_Disposition_Date]
  ON [dbo].[Calls] ([IdDisposition], [CallDate]);

CREATE NONCLUSTERED INDEX [IX_Calls_Date]
  ON [dbo].[Calls] ([CallDate]);

-- Business name index (dbo schema)
CREATE NONCLUSTERED INDEX [IX_Businesses_Name]
  ON [dbo].[Businesses] ([BusinessName]);

-- Messages index (benjaise_sqluser2 schema)
CREATE NONCLUSTERED INDEX [IX_Messages_Phone_SentTime]
  ON [benjaise_sqluser2].[Messages] ([PhoneNumber], [SentTime]);

-- EmployeeTimeLog unique constraint — prevents duplicate daily clock records
-- NOTE: This will fail if duplicate (IdUser, LogDate) rows already exist.
--       Run this first to check: SELECT IdUser, LogDate, COUNT(*) FROM benjaise_sqluser2.EmployeeTimeLog GROUP BY IdUser, LogDate HAVING COUNT(*) > 1
CREATE UNIQUE NONCLUSTERED INDEX [UQ_EmployeeTimeLog_User_Date]
  ON [benjaise_sqluser2].[EmployeeTimeLog] ([IdUser], [LogDate]);

-- VideoViews unique constraint — prevents duplicate video views per user
-- NOTE: Same check: SELECT UserId, VideoId, COUNT(*) FROM benjaise_sqluser2.VideoViews GROUP BY UserId, VideoId HAVING COUNT(*) > 1
CREATE UNIQUE NONCLUSTERED INDEX [UQ_VideoViews_User_Video]
  ON [benjaise_sqluser2].[VideoViews] ([UserId], [VideoId]);
