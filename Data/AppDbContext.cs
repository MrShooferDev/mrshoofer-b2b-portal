using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Application.Models;

namespace Application.Data
{
  public class AppDbContext : IdentityDbContext<IdentityUser>
  {
    public DbSet<Agency> Agencies { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<AdminUser> AdminUsers { get; set; }
    public DbSet<AgencyBalanceCharge> AgencyBalanceCharges { get; set; }
    public DbSet<ChargePaymentRequest> ChargePaymentRequests { get; set; }

    public DbSet<ContactUsMessage> ContactMessages { get; set; }
    public DbSet<B2bRegistrationApplication> B2bRegistrationApplications { get; set; }
    public DbSet<B2bRegistrationPhoneVerification> B2bRegistrationPhoneVerifications { get; set; }
    public DbSet<ZarinpalChargeRequest> ZarinpalChargeRequests { get; set; }
    public DbSet<ZarinpalTicketPayment> ZarinpalTicketPayments { get; set; }
    public DbSet<AgencyEmployee> AgencyEmployees { get; set; }
    public DbSet<TicketCompanion> TicketCompanions { get; set; }
    public DbSet<OfficialInvoice> OfficialInvoices { get; set; }
    public DbSet<OfficialInvoiceTicket> OfficialInvoiceTickets { get; set; }
    public DbSet<InvoiceSerialConfig> InvoiceSerialConfigs { get; set; }
    public DbSet<InvoiceSellerProfile> InvoiceSellerProfiles { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      base.OnModelCreating(modelBuilder);

      modelBuilder.Entity<AgencyEmployee>(entity =>
      {
        entity.HasIndex(e => new { e.AgencyId, e.NaCode }).IsUnique();
        entity.HasOne(e => e.Agency)
          .WithMany(a => a.Employees)
          .HasForeignKey(e => e.AgencyId)
          .OnDelete(DeleteBehavior.Cascade);
      });

      modelBuilder.Entity<Ticket>(entity =>
      {
        entity.HasOne(t => t.AgencyEmployee)
          .WithMany(e => e.Tickets)
          .HasForeignKey(t => t.AgencyEmployeeId)
          .OnDelete(DeleteBehavior.SetNull);
      });

      modelBuilder.Entity<TicketCompanion>(entity =>
      {
        entity.HasOne(c => c.Ticket)
          .WithMany(t => t.Companions)
          .HasForeignKey(c => c.TicketId)
          .OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(c => c.AgencyEmployee)
          .WithMany()
          .HasForeignKey(c => c.AgencyEmployeeId)
          .OnDelete(DeleteBehavior.SetNull);
      });

      modelBuilder.Entity<B2bRegistrationApplication>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.ApplicationStatus).HasMaxLength(64).IsRequired();
        entity.Property(e => e.PanelStatus).HasMaxLength(64).IsRequired();
        entity.Property(e => e.MobileE164).HasMaxLength(20).IsRequired();
        entity.Property(e => e.FirstName).HasMaxLength(60).IsRequired();
        entity.Property(e => e.LastName).HasMaxLength(80).IsRequired();
        entity.Property(e => e.Email).HasMaxLength(150);
        entity.Property(e => e.Panel).HasMaxLength(32);
        entity.Property(e => e.BusinessType).HasMaxLength(64);
        entity.Property(e => e.DisplayName).HasMaxLength(150);
        entity.Property(e => e.WebsiteOrSocial).HasMaxLength(250);
        entity.Property(e => e.LegalForm).HasMaxLength(32);
        entity.Property(e => e.City).HasMaxLength(80);
        entity.Property(e => e.ServicesJson).HasColumnType("text").IsRequired();
        entity.Property(e => e.AttributionSource).HasMaxLength(64);
        entity.Property(e => e.PayloadJson).HasColumnType("text").IsRequired();
        entity.HasIndex(e => e.MobileE164);
        entity.HasIndex(e => e.CreatedAt);
      });

      modelBuilder.Entity<B2bRegistrationPhoneVerification>(entity =>
      {
        entity.HasKey(e => e.MobileE164);
        entity.Property(e => e.MobileE164).HasMaxLength(20);
      });

      modelBuilder.Entity<OfficialInvoice>(entity =>
      {
        entity.HasIndex(e => e.SerialNumber).IsUnique();
        entity.HasOne(e => e.Agency)
          .WithMany()
          .HasForeignKey(e => e.AgencyId)
          .OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(e => e.Ticket)
          .WithMany()
          .HasForeignKey(e => e.TicketId)
          .OnDelete(DeleteBehavior.SetNull);
      });

      modelBuilder.Entity<OfficialInvoiceTicket>(entity =>
      {
        entity.HasIndex(e => e.OfficialInvoiceId);
        entity.HasIndex(e => e.TicketId);
        entity.HasIndex(e => e.TicketCode);
        entity.Property(e => e.TicketCode).HasMaxLength(32).IsRequired();
        entity.HasOne(e => e.OfficialInvoice)
          .WithMany(i => i.InvoiceTickets)
          .HasForeignKey(e => e.OfficialInvoiceId)
          .OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(e => e.Ticket)
          .WithMany()
          .HasForeignKey(e => e.TicketId)
          .OnDelete(DeleteBehavior.Cascade);
      });
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
      base.OnConfiguring(optionsBuilder);
    }

    static AppDbContext()
    {
      // Configure Npgsql to use timestamp without time zone for DateTime
      AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
    }
  }
}
