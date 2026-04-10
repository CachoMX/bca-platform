-- Grant maintenance permissions
-- Role 1 = Admin, Role 2 = Closer, Role 3 = Remote Agent

-- Admin gets both maintenance and admin_maintenance
IF NOT EXISTS (SELECT 1 FROM benjaise_sqluser2.RolePermission WHERE IdRole=1 AND PermissionKey='maintenance')
  INSERT INTO benjaise_sqluser2.RolePermission (IdRole, PermissionKey, Enabled) VALUES (1, 'maintenance', 1);
ELSE
  UPDATE benjaise_sqluser2.RolePermission SET Enabled=1 WHERE IdRole=1 AND PermissionKey='maintenance';

IF NOT EXISTS (SELECT 1 FROM benjaise_sqluser2.RolePermission WHERE IdRole=1 AND PermissionKey='admin_maintenance')
  INSERT INTO benjaise_sqluser2.RolePermission (IdRole, PermissionKey, Enabled) VALUES (1, 'admin_maintenance', 1);
ELSE
  UPDATE benjaise_sqluser2.RolePermission SET Enabled=1 WHERE IdRole=1 AND PermissionKey='admin_maintenance';

-- Remote Agent (role 3) gets employee maintenance view
IF NOT EXISTS (SELECT 1 FROM benjaise_sqluser2.RolePermission WHERE IdRole=3 AND PermissionKey='maintenance')
  INSERT INTO benjaise_sqluser2.RolePermission (IdRole, PermissionKey, Enabled) VALUES (3, 'maintenance', 1);
ELSE
  UPDATE benjaise_sqluser2.RolePermission SET Enabled=1 WHERE IdRole=3 AND PermissionKey='maintenance';

PRINT 'Maintenance permissions granted';
