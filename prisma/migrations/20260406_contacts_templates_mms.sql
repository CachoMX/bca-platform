-- Migration: Contacts, SmsTemplates, and MMS fields on Messages
-- Run once against production DB

-- ── SmsContacts ─────────────────────────────────────────────────────────────
-- Note: 'Contacts' table already exists in schema with different columns, so
-- we use 'SmsContacts' to avoid conflicts.
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE name='SmsContacts' AND schema_id=SCHEMA_ID('benjaise_sqluser2'))
BEGIN
  CREATE TABLE benjaise_sqluser2.SmsContacts (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    PhoneNumber NVARCHAR(30)  NOT NULL,
    Name        NVARCHAR(100) NOT NULL,
    UpdatedAt   DATETIME2     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_SmsContacts_Phone UNIQUE (PhoneNumber)
  );
END

-- ── SmsTemplates ────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE name='SmsTemplates' AND schema_id=SCHEMA_ID('benjaise_sqluser2'))
BEGIN
  CREATE TABLE benjaise_sqluser2.SmsTemplates (
    Id        INT IDENTITY(1,1) PRIMARY KEY,
    Title     NVARCHAR(100) NOT NULL,
    Body      NVARCHAR(MAX) NOT NULL,
    SortOrder INT           NOT NULL DEFAULT 0
  );
END

-- ── MMS columns on Messages ─────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('benjaise_sqluser2.Messages') AND name='MediaData')
  ALTER TABLE benjaise_sqluser2.Messages ADD MediaData NVARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('benjaise_sqluser2.Messages') AND name='MediaType')
  ALTER TABLE benjaise_sqluser2.Messages ADD MediaType NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('benjaise_sqluser2.Messages') AND name='MediaName')
  ALTER TABLE benjaise_sqluser2.Messages ADD MediaName NVARCHAR(200) NULL;
