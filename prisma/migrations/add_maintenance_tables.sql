-- ============================================================
-- IT Maintenance Module: Computers, MaintenanceLogs, Tickets
-- ============================================================

-- 1. Computers
IF NOT EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id=s.schema_id WHERE s.name='benjaise_sqluser2' AND t.name='Computers')
BEGIN
  CREATE TABLE benjaise_sqluser2.Computers (
    Id                        INT           NOT NULL IDENTITY(1,1),
    ComputerName              NVARCHAR(200) NOT NULL,
    RemotePcId                NVARCHAR(200) NULL,
    AssignedUserId            INT           NULL,
    OperatingSystem           NVARCHAR(200) NULL,
    Specs                     NVARCHAR(MAX) NULL,
    Notes                     NVARCHAR(MAX) NULL,
    Status                    NVARCHAR(20)  NOT NULL CONSTRAINT DF_Computers_Status DEFAULT 'active',
    MaintenanceIntervalMonths INT           NOT NULL CONSTRAINT DF_Computers_Interval DEFAULT 3,
    CreatedAt                 DATETIME2     NOT NULL CONSTRAINT DF_Computers_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt                 DATETIME2     NOT NULL CONSTRAINT DF_Computers_UpdatedAt DEFAULT GETUTCDATE(),
    CONSTRAINT PK_Computers PRIMARY KEY (Id)
  );
  PRINT 'Created Computers table';
END
ELSE PRINT 'Computers table already exists';

-- 2. MaintenanceTickets (created before Logs because Logs references it)
IF NOT EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id=s.schema_id WHERE s.name='benjaise_sqluser2' AND t.name='MaintenanceTickets')
BEGIN
  CREATE TABLE benjaise_sqluser2.MaintenanceTickets (
    Id               INT           NOT NULL IDENTITY(1,1),
    ComputerId       INT           NOT NULL,
    ReportedByUserId INT           NOT NULL,
    Subject          NVARCHAR(200) NOT NULL,
    Description      NVARCHAR(MAX) NOT NULL,
    Priority         NVARCHAR(20)  NOT NULL CONSTRAINT DF_Tickets_Priority DEFAULT 'normal',
    Status           NVARCHAR(20)  NOT NULL CONSTRAINT DF_Tickets_Status   DEFAULT 'open',
    ResolvedDate     DATETIME2     NULL,
    ResolutionNotes  NVARCHAR(MAX) NULL,
    AssignedToUserId INT           NULL,
    CreatedAt        DATETIME2     NOT NULL CONSTRAINT DF_Tickets_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt        DATETIME2     NOT NULL CONSTRAINT DF_Tickets_UpdatedAt DEFAULT GETUTCDATE(),
    CONSTRAINT PK_MaintenanceTickets PRIMARY KEY (Id)
  );
  PRINT 'Created MaintenanceTickets table';
END
ELSE PRINT 'MaintenanceTickets table already exists';

-- 3. MaintenanceLogs
IF NOT EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id=s.schema_id WHERE s.name='benjaise_sqluser2' AND t.name='MaintenanceLogs')
BEGIN
  CREATE TABLE benjaise_sqluser2.MaintenanceLogs (
    Id              INT           NOT NULL IDENTITY(1,1),
    ComputerId      INT           NOT NULL,
    MaintenanceType NVARCHAR(20)  NOT NULL,
    PerformedDate   DATETIME2     NOT NULL,
    TechnicianId    INT           NOT NULL,
    DurationMinutes INT           NULL,
    ToolsUsed       NVARCHAR(MAX) NULL,
    IssuesFound     NVARCHAR(MAX) NULL,
    ActionsTaken    NVARCHAR(MAX) NULL,
    Notes           NVARCHAR(MAX) NULL,
    RelatedTicketId INT           NULL,
    CreatedAt       DATETIME2     NOT NULL CONSTRAINT DF_Logs_CreatedAt DEFAULT GETUTCDATE(),
    CONSTRAINT PK_MaintenanceLogs PRIMARY KEY (Id)
  );
  PRINT 'Created MaintenanceLogs table';
END
ELSE PRINT 'MaintenanceLogs table already exists';

-- ============================================================
-- Foreign Keys (added after all tables exist)
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_Computers_AssignedUser')
  ALTER TABLE benjaise_sqluser2.Computers
    ADD CONSTRAINT FK_Computers_AssignedUser FOREIGN KEY (AssignedUserId)
    REFERENCES dbo.Users(IdUser);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_MaintenanceLogs_Computer')
  ALTER TABLE benjaise_sqluser2.MaintenanceLogs
    ADD CONSTRAINT FK_MaintenanceLogs_Computer FOREIGN KEY (ComputerId)
    REFERENCES benjaise_sqluser2.Computers(Id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_MaintenanceLogs_Technician')
  ALTER TABLE benjaise_sqluser2.MaintenanceLogs
    ADD CONSTRAINT FK_MaintenanceLogs_Technician FOREIGN KEY (TechnicianId)
    REFERENCES dbo.Users(IdUser);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_MaintenanceLogs_RelatedTicket')
  ALTER TABLE benjaise_sqluser2.MaintenanceLogs
    ADD CONSTRAINT FK_MaintenanceLogs_RelatedTicket FOREIGN KEY (RelatedTicketId)
    REFERENCES benjaise_sqluser2.MaintenanceTickets(Id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_Tickets_Computer')
  ALTER TABLE benjaise_sqluser2.MaintenanceTickets
    ADD CONSTRAINT FK_Tickets_Computer FOREIGN KEY (ComputerId)
    REFERENCES benjaise_sqluser2.Computers(Id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_Tickets_ReportedBy')
  ALTER TABLE benjaise_sqluser2.MaintenanceTickets
    ADD CONSTRAINT FK_Tickets_ReportedBy FOREIGN KEY (ReportedByUserId)
    REFERENCES dbo.Users(IdUser);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_Tickets_AssignedTo')
  ALTER TABLE benjaise_sqluser2.MaintenanceTickets
    ADD CONSTRAINT FK_Tickets_AssignedTo FOREIGN KEY (AssignedToUserId)
    REFERENCES dbo.Users(IdUser);

-- ============================================================
-- Indexes
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Computers_Status')
  CREATE INDEX IX_Computers_Status ON benjaise_sqluser2.Computers(Status);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Computers_AssignedUser')
  CREATE INDEX IX_Computers_AssignedUser ON benjaise_sqluser2.Computers(AssignedUserId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_MaintenanceLogs_Computer_Date')
  CREATE INDEX IX_MaintenanceLogs_Computer_Date ON benjaise_sqluser2.MaintenanceLogs(ComputerId, PerformedDate);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_MaintenanceLogs_Type')
  CREATE INDEX IX_MaintenanceLogs_Type ON benjaise_sqluser2.MaintenanceLogs(MaintenanceType);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_MaintenanceTickets_Computer')
  CREATE INDEX IX_MaintenanceTickets_Computer ON benjaise_sqluser2.MaintenanceTickets(ComputerId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_MaintenanceTickets_Status')
  CREATE INDEX IX_MaintenanceTickets_Status ON benjaise_sqluser2.MaintenanceTickets(Status);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_MaintenanceTickets_ReportedBy')
  CREATE INDEX IX_MaintenanceTickets_ReportedBy ON benjaise_sqluser2.MaintenanceTickets(ReportedByUserId);

PRINT 'Migration complete';
