using Application.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Application.Migrations
{
  [DbContext(typeof(AppDbContext))]
  [Migration("20261109170000_AddOfficialInvoiceTicketsAndCancelledStatus")]
  public partial class AddOfficialInvoiceTicketsAndCancelledStatus : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("""
        CREATE TABLE IF NOT EXISTS "OfficialInvoiceTickets" (
          "Id" serial PRIMARY KEY,
          "OfficialInvoiceId" integer NOT NULL,
          "TicketId" integer NOT NULL,
          "TicketCode" character varying(32) NOT NULL,
          "AmountToman" integer NOT NULL DEFAULT 0,
          "PassengerName" character varying(200) NULL,
          "RouteLabel" character varying(120) NULL,
          CONSTRAINT "FK_OfficialInvoiceTickets_OfficialInvoices_OfficialInvoiceId"
            FOREIGN KEY ("OfficialInvoiceId") REFERENCES "OfficialInvoices" ("Id") ON DELETE CASCADE,
          CONSTRAINT "FK_OfficialInvoiceTickets_Tickets_TicketId"
            FOREIGN KEY ("TicketId") REFERENCES "Tickets" ("Id") ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS "IX_OfficialInvoiceTickets_OfficialInvoiceId"
          ON "OfficialInvoiceTickets" ("OfficialInvoiceId");

        CREATE INDEX IF NOT EXISTS "IX_OfficialInvoiceTickets_TicketId"
          ON "OfficialInvoiceTickets" ("TicketId");

        CREATE INDEX IF NOT EXISTS "IX_OfficialInvoiceTickets_TicketCode"
          ON "OfficialInvoiceTickets" ("TicketCode");

        -- Backfill single-ticket invoices into the junction table.
        INSERT INTO "OfficialInvoiceTickets"
          ("OfficialInvoiceId", "TicketId", "TicketCode", "AmountToman", "PassengerName", "RouteLabel")
        SELECT i."Id", i."TicketId", COALESCE(i."TicketCode", ''), 0, NULL, NULL
        FROM "OfficialInvoices" i
        WHERE i."TicketId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM "OfficialInvoiceTickets" t
            WHERE t."OfficialInvoiceId" = i."Id" AND t."TicketId" = i."TicketId"
          );
        """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("""DROP TABLE IF EXISTS "OfficialInvoiceTickets";""");
    }
  }
}