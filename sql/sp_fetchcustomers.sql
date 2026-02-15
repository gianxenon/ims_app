/*
  SQL Server Stored Procedure
  Purpose: lookup customers with customer group details for inbound pickers
*/
CREATE OR ALTER PROCEDURE dbo.usp_fetchcustomers
  @company NVARCHAR(50),
  @branch NVARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    c.CUSTNO,
    c.CUSTNAME,
    cg.CUSTGROUP,
    cg.GROUPNAME
  FROM customers c
  INNER JOIN customergroups cg
    ON c.custgroup = cg.CUSTGROUP
  WHERE c.branch = @branch
    AND c.company = @company
  ORDER BY c.CUSTNO;
END;
