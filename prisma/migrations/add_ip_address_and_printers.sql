-- Add IpAddress column to Computers table
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('benjaise_sqluser2.Computers')
    AND name = 'IpAddress'
)
BEGIN
  ALTER TABLE benjaise_sqluser2.Computers
    ADD IpAddress NVARCHAR(45) NULL;
  PRINT 'Added IpAddress column to Computers';
END
ELSE PRINT 'IpAddress column already exists on Computers';

-- Create Printers table
IF NOT EXISTS (
  SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
  WHERE s.name = 'benjaise_sqluser2' AND t.name = 'Printers'
)
BEGIN
  CREATE TABLE benjaise_sqluser2.Printers (
    Id             INT            NOT NULL IDENTITY(1,1),
    PrinterName    NVARCHAR(100)  NOT NULL,
    BrandModel     NVARCHAR(100)  NULL,
    IpAddress      NVARCHAR(45)   NULL,
    Location       NVARCHAR(100)  NULL,
    FoldersSharing BIT            NOT NULL CONSTRAINT DF_Printers_FoldersSharing DEFAULT 0,
    SharedFolders  NVARCHAR(MAX)  NULL,
    Notes          NVARCHAR(MAX)  NULL,
    Status         NVARCHAR(20)   NOT NULL CONSTRAINT DF_Printers_Status DEFAULT 'active',
    CreatedAt      DATETIME2      NOT NULL CONSTRAINT DF_Printers_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt      DATETIME2      NOT NULL CONSTRAINT DF_Printers_UpdatedAt DEFAULT GETUTCDATE(),
    CONSTRAINT PK_Printers PRIMARY KEY (Id)
  );
  CREATE INDEX IX_Printers_Status ON benjaise_sqluser2.Printers(Status);
  PRINT 'Created Printers table';
END
ELSE PRINT 'Printers table already exists';
