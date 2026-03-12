const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const ids = [9936, 9901, 9867, 9836, 9806];

  for (const id of ids) {
    await p.$executeRaw`
      UPDATE benjaise_sqluser2.EmployeeTimeLog
      SET FirstBreakIn = '08:10:00',
          LunchOut = '10:00:00',
          SecondBreakIn = '12:40:00',
          ClockOut = '14:30:00',
          TotalHours = 8.50,
          OvertimeHours = 0.00
      WHERE TimeLogID = ${id}
    `;
    console.log('Updated TimeLogID:', id);
  }

  // Verify
  const rows = await p.$queryRaw`
    SELECT TimeLogID, LogDate, ClockIn, FirstBreakOut, FirstBreakIn,
           LunchOut, LunchIn, SecondBreakOut, SecondBreakIn, ClockOut,
           TotalHours, OvertimeHours
    FROM benjaise_sqluser2.EmployeeTimeLog
    WHERE TimeLogID IN (9936, 9901, 9867, 9836, 9806)
    ORDER BY LogDate DESC
  `;
  console.log('\nVerification:');
  rows.forEach(r => console.log(r));

  await p.$disconnect();
})();
