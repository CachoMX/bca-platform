-- Migration: add Status and GatewayId columns to Messages table
-- Run once against production DB before deploying the matching app version

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('benjaise_sqluser2.Messages')
    AND name = 'Status'
)
BEGIN
  ALTER TABLE benjaise_sqluser2.Messages ADD Status NVARCHAR(20) NULL;
END

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('benjaise_sqluser2.Messages')
    AND name = 'GatewayId'
)
BEGIN
  ALTER TABLE benjaise_sqluser2.Messages ADD GatewayId NVARCHAR(100) NULL;
END

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID('benjaise_sqluser2.Messages')
    AND name = 'IX_Messages_GatewayId'
)
BEGIN
  CREATE INDEX IX_Messages_GatewayId ON benjaise_sqluser2.Messages (GatewayId);
END
