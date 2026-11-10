using Application.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Application.Migrations
{
  /// <summary>
  /// Adds queryable request columns for databases that already created the
  /// registration table, and stores OTP verification separately from memory.
  /// </summary>
  [DbContext(typeof(AppDbContext))]
  [Migration("20261022233000_StoreB2bRegistrationRequestFields")]
  public partial class StoreB2bRegistrationRequestFields : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("""
        ALTER TABLE "B2bRegistrationApplications" ADD COLUMN IF NOT EXISTS "Panel" character varying(32) NULL;
        ALTER TABLE "B2bRegistrationApplications" ADD COLUMN IF NOT EXISTS "DisplayName" character varying(150) NULL;
        ALTER TABLE "B2bRegistrationApplications" ADD COLUMN IF NOT EXISTS "WebsiteOrSocial" character varying(250) NULL;
        ALTER TABLE "B2bRegistrationApplications" ADD COLUMN IF NOT EXISTS "City" character varying(80) NULL;
        ALTER TABLE "B2bRegistrationApplications" ADD COLUMN IF NOT EXISTS "ServicesJson" text NOT NULL DEFAULT '[]';
        ALTER TABLE "B2bRegistrationApplications" ADD COLUMN IF NOT EXISTS "AttributionSource" character varying(64) NULL;
        CREATE INDEX IF NOT EXISTS "IX_B2bRegistrationApplications_CreatedAt" ON "B2bRegistrationApplications" ("CreatedAt");

        CREATE TABLE IF NOT EXISTS "B2bRegistrationPhoneVerifications" (
            "MobileE164" character varying(20) NOT NULL,
            "VerifiedAt" timestamp without time zone NOT NULL,
            "ExpiresAt" timestamp without time zone NOT NULL,
            CONSTRAINT "PK_B2bRegistrationPhoneVerifications" PRIMARY KEY ("MobileE164")
        );
        """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql("""
        DROP TABLE IF EXISTS "B2bRegistrationPhoneVerifications";
        DROP INDEX IF EXISTS "IX_B2bRegistrationApplications_CreatedAt";
        ALTER TABLE "B2bRegistrationApplications" DROP COLUMN IF EXISTS "AttributionSource";
        ALTER TABLE "B2bRegistrationApplications" DROP COLUMN IF EXISTS "ServicesJson";
        ALTER TABLE "B2bRegistrationApplications" DROP COLUMN IF EXISTS "City";
        ALTER TABLE "B2bRegistrationApplications" DROP COLUMN IF EXISTS "WebsiteOrSocial";
        ALTER TABLE "B2bRegistrationApplications" DROP COLUMN IF EXISTS "DisplayName";
        ALTER TABLE "B2bRegistrationApplications" DROP COLUMN IF EXISTS "Panel";
        """);
    }
  }
}
