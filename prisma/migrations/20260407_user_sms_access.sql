-- Migration: Add SmsAccess column to Users table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.Users') AND name='SmsAccess')
  ALTER TABLE dbo.Users ADD SmsAccess BIT NOT NULL DEFAULT 0;
