using Application.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Application.Migrations
{
  [DbContext(typeof(AppDbContext))]
  [Migration("20261021120000_AddB2bRegistrationApplications")]
  public partial class AddB2bRegistrationApplications : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("""
        CREATE TABLE IF NOT EXISTS "B2bRegistrationApplications" (
          "Id" uuid NOT NULL,
          "ApplicationStatus" character varying(64) NOT NULL,
          "PanelStatus" character varying(64) NOT NULL,
          "MobileE164" character varying(20) NOT NULL,
          "MobileVerified" boolean NOT NULL DEFAULT FALSE,
          "FirstName" character varying(60) NOT NULL,
          "LastName" character varying(80) NOT NULL,
          "Email" character varying(150) NULL,
          "Panel" character varying(32) NULL,
          "BusinessType" character varying(64) NULL,
          "DisplayName" character varying(150) NULL,
          "WebsiteOrSocial" character varying(250) NULL,
          "LegalForm" character varying(32) NULL,
          "City" character varying(80) NULL,
          "ServicesJson" text NOT NULL DEFAULT '[]',
          "AttributionSource" character varying(64) NULL,
          "PayloadJson" text NOT NULL,
          "CreatedAt" timestamp without time zone NOT NULL,
          "UpdatedAt" timestamp without time zone NULL,
          CONSTRAINT "PK_B2bRegistrationApplications" PRIMARY KEY ("Id")
        );
        CREATE INDEX IF NOT EXISTS "IX_B2bRegistrationApplications_MobileE164"
          ON "B2bRegistrationApplications" ("MobileE164");
        """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("""DROP TABLE IF EXISTS "B2bRegistrationApplications";""");
    }
  }
}
