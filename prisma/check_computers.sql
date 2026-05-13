SELECT
  c.Id, c.ComputerName, c.RemotePcId, c.AssignedUserId, c.Status,
  u.Name, u.Lastname, u.Email
FROM benjaise_sqluser2.Computers c
LEFT JOIN dbo.Users u ON u.IdUser = c.AssignedUserId
ORDER BY c.Id;
