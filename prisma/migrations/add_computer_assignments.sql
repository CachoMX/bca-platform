IF NOT EXISTS (
  SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id=s.schema_id
  WHERE s.name='benjaise_sqluser2' AND t.name='ComputerAssignments'
)
BEGIN
  CREATE TABLE benjaise_sqluser2.ComputerAssignments (
    Id         INT       NOT NULL IDENTITY(1,1),
    ComputerId INT       NOT NULL,
    UserId     INT       NOT NULL,
    AssignedAt DATETIME2 NOT NULL CONSTRAINT DF_CA_AssignedAt DEFAULT GETUTCDATE(),
    CONSTRAINT PK_ComputerAssignments PRIMARY KEY (Id),
    CONSTRAINT UQ_ComputerAssignments_Computer_User UNIQUE (ComputerId, UserId),
    CONSTRAINT FK_CA_Computer FOREIGN KEY (ComputerId) REFERENCES benjaise_sqluser2.Computers(Id),
    CONSTRAINT FK_CA_User FOREIGN KEY (UserId) REFERENCES dbo.Users(IdUser)
  );
  CREATE INDEX IX_ComputerAssignments_User ON benjaise_sqluser2.ComputerAssignments(UserId);
  PRINT 'Created ComputerAssignments table';
END
ELSE PRINT 'ComputerAssignments already exists';

-- Migrate existing single-user assignments
INSERT INTO benjaise_sqluser2.ComputerAssignments (ComputerId, UserId)
SELECT c.Id, c.AssignedUserId
FROM benjaise_sqluser2.Computers c
WHERE c.AssignedUserId IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM benjaise_sqluser2.ComputerAssignments ca
    WHERE ca.ComputerId = c.Id AND ca.UserId = c.AssignedUserId
  );
PRINT 'Migrated existing assignments';
