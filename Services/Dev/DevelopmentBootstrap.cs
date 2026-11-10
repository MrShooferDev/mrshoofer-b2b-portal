using Application.Data;
using Application.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Application.Services.Dev;

/// <summary>
/// Development-only agency user + sample panel data.
/// Gated by environment in Program.cs; never call from Production.
/// </summary>
public static class DevelopmentBootstrap
{
  public const string DefaultUsername = "09121110000";
  public const string DefaultPassword = "devorg1";
  public const string SkipAutoLoginCookie = "DevSkipAutoLogin";

  public static async Task SeedAsync(
    AppDbContext db,
    UserManager<IdentityUser> userManager,
    RoleManager<IdentityRole> roleManager,
    IConfiguration config,
    ILogger logger,
    CancellationToken cancellationToken = default)
  {
    if (!config.GetValue("DevAuth:Enabled", true))
    {
      logger.LogInformation("DevAuth disabled — skipping development agency seed.");
      return;
    }

    var username = (config["DevAuth:Username"] ?? DefaultUsername).Trim();
    var password = config["DevAuth:Password"] ?? DefaultPassword;
    var phone = (config["DevAuth:Phone"] ?? username).Trim();
    var orsToken = config["DevAuth:OrsToken"]
      ?? config["MrShoofer:SellerToken"]
      ?? "dev-ors-token";

    if (!await roleManager.RoleExistsAsync("Agency"))
    {
      var roleResult = await roleManager.CreateAsync(new IdentityRole("Agency"));
      if (!roleResult.Succeeded)
        throw new Exception("Failed to create Agency role for development seed.");
    }

    var user = await userManager.FindByNameAsync(username);
    if (user == null)
    {
      user = new IdentityUser
      {
        UserName = username,
        PhoneNumber = phone,
        PhoneNumberConfirmed = true
      };

      var createResult = await userManager.CreateAsync(user, password);
      if (!createResult.Succeeded)
        throw new Exception($"Failed to create development user '{username}': {FormatErrors(createResult)}");
    }
    else
    {
      if (await userManager.HasPasswordAsync(user))
      {
        var remove = await userManager.RemovePasswordAsync(user);
        if (!remove.Succeeded)
          throw new Exception($"Failed to reset development password for '{username}': {FormatErrors(remove)}");
      }

      var add = await userManager.AddPasswordAsync(user, password);
      if (!add.Succeeded)
        throw new Exception($"Failed to set development password for '{username}': {FormatErrors(add)}");
    }

    if (!await userManager.IsInRoleAsync(user, "Agency"))
    {
      var addRole = await userManager.AddToRoleAsync(user, "Agency");
      if (!addRole.Succeeded)
        throw new Exception($"Failed to assign Agency role to '{username}': {FormatErrors(addRole)}");
    }

    var claims = await userManager.GetClaimsAsync(user);
    if (!claims.Any(c => c.Type == "Role" && c.Value == "Agency"))
    {
      var claimResult = await userManager.AddClaimAsync(user, new System.Security.Claims.Claim("Role", "Agency"));
      if (!claimResult.Succeeded)
        throw new Exception($"Failed to assign Agency claim to '{username}': {FormatErrors(claimResult)}");
    }

    var agency = await db.Agencies
      .Include(a => a.Employees)
      .FirstOrDefaultAsync(a => a.IdentityUserId == user.Id, cancellationToken);

    if (agency == null)
    {
      agency = new Agency
      {
        Name = "سازمان نمونه توسعه",
        PhoneNumber = phone,
        AdminMobile = phone,
        Address = "تهران، خیابان نمونه، پلاک ۱",
        DateJoined = DateTime.Now,
        ORSAPI_token = orsToken,
        Commission = 0,
        PanelType = AgencyPanelType.Organization,
        IdentityUserId = user.Id,
        EconomicNo = "41111111111",
        RegistrationNo = "123456",
        NationalId = "10100000000",
        Province = "تهران",
        County = "تهران",
        City = "تهران",
        PostalCode = "1234567890"
      };
      db.Agencies.Add(agency);
      await db.SaveChangesAsync(cancellationToken);
      logger.LogInformation("Created development organization agency for {Username}", username);
    }
    else
    {
      agency.Name = string.IsNullOrWhiteSpace(agency.Name) ? "سازمان نمونه توسعه" : agency.Name;
      agency.PanelType = AgencyPanelType.Organization;
      agency.Commission = 0;
      agency.AdminMobile = phone;
      agency.PhoneNumber = phone;
      // Keep using the real SellerToken — never leave a dead "dev-ors-token" on the agency.
      if (string.IsNullOrWhiteSpace(agency.ORSAPI_token)
          || string.Equals(agency.ORSAPI_token, "dev-ors-token", StringComparison.Ordinal))
        agency.ORSAPI_token = orsToken;
      if (string.IsNullOrWhiteSpace(agency.EconomicNo))
        agency.EconomicNo = "41111111111";
      if (string.IsNullOrWhiteSpace(agency.RegistrationNo))
        agency.RegistrationNo = "123456";
      if (string.IsNullOrWhiteSpace(agency.NationalId))
        agency.NationalId = "10100000000";
      await db.SaveChangesAsync(cancellationToken);
    }

    await EnsureEmployeesAsync(db, agency, cancellationToken);
    await EnsureTripsAsync(db, agency, cancellationToken);
    logger.LogInformation(
      "Development agency ready: user={Username} password={Password} agencyId={AgencyId}",
      username,
      password,
      agency.Id);
  }

  private static async Task EnsureEmployeesAsync(AppDbContext db, Agency agency, CancellationToken cancellationToken)
  {
    var samples = new[]
    {
      new { First = "علی", Last = "محمدی", Gender = "مرد", Na = "0012345678", Phone = "09121230001", Title = "مدیر اداری" },
      new { First = "سارا", Last = "کریمی", Gender = "زن", Na = "0012345679", Phone = "09121230002", Title = "کارشناس منابع انسانی" },
      new { First = "رضا", Last = "حسینی", Gender = "مرد", Na = "0012345680", Phone = "09121230003", Title = (string?)null }
    };

    var existingCodes = await db.AgencyEmployees.AsNoTracking()
      .Where(e => e.AgencyId == agency.Id)
      .Select(e => e.NaCode)
      .ToListAsync(cancellationToken);
    var known = new HashSet<string>(existingCodes, StringComparer.Ordinal);

    var now = DateTime.Now;
    foreach (var sample in samples)
    {
      if (known.Contains(sample.Na))
        continue;

      db.AgencyEmployees.Add(new AgencyEmployee
      {
        AgencyId = agency.Id,
        Firstname = sample.First,
        Lastname = sample.Last,
        Gender = sample.Gender,
        NaCode = sample.Na,
        PhoneNumber = sample.Phone,
        Email = $"{sample.Na}@dev.local",
        InternalTitle = sample.Title,
        CreatedAt = now,
        UpdatedAt = now
      });
    }

    await db.SaveChangesAsync(cancellationToken);
  }

  private static async Task EnsureTripsAsync(AppDbContext db, Agency agency, CancellationToken cancellationToken)
  {
    var employees = await db.AgencyEmployees
      .Where(e => e.AgencyId == agency.Id)
      .OrderBy(e => e.Id)
      .ToListAsync(cancellationToken);

    AgencyEmployee? Emp(string na) =>
      employees.FirstOrDefault(e => e.NaCode == na);

    // DaysFromToday: negative = already travelled (still invoiceable), positive = upcoming.
    // Used by the side-menu when ORS has no real trip for DEV-* codes.
    var samples = new (string TicketCode, string TripCode, string Origin, string Dest, string Service, string Car, int Price, bool Cancelled, int DaysFromToday, string Head, string EmpNa, (string First, string Last, string Gender, string Na)? Companion)[]
    {
      ("DEV-TKT-001", "DEV-TRIP-THR-ISF", "تهران", "اصفهان", "سواری دربستی", "تویوتا کمری", 2_850_000, false, 1, "واحد منابع انسانی", "0012345678", null),
      ("DEV-TKT-002", "DEV-TRIP-THR-MSH", "تهران", "مشهد", "ون تشریفات", "هیوندای H1", 4_200_000, false, 2, "امور اداری", "0012345679", ("مریم", "احمدی", "زن", "0012345691")),
      ("DEV-TKT-003", "DEV-TRIP-ISF-SHZ", "اصفهان", "شیراز", "سواری دربستی", "پژو پارس", 1_950_000, false, -45, "سفر کاری — انجام‌شده", "0012345680", null),
      ("DEV-TKT-004", "DEV-TRIP-THR-TBZ", "تهران", "تبریز", "سواری دربستی", "دنا پلاس", 3_100_000, true, -3, "لغو شده — نمونه", "0012345678", null),
      ("DEV-TKT-005", "DEV-TRIP-THR-QOM", "تهران", "قم", "ترانسفر فرودگاهی", "مکسوس", 1_200_000, false, -12, "ترانسفر انجام‌شده", "0012345679", null),
    };

    var existing = await db.Tickets
      .Where(t => EF.Property<int>(t, "AgencyId") == agency.Id && t.TicketCode.StartsWith("DEV-TKT-"))
      .ToListAsync(cancellationToken);
    var byCode = existing.ToDictionary(t => t.TicketCode, StringComparer.Ordinal);

    foreach (var sample in samples)
    {
      var employee = Emp(sample.EmpNa);
      // RegisteredAt doubles as trip timing for DEV samples (no ORS trip info).
      var dayOffset = sample.DaysFromToday;
      var hour = dayOffset == 0 ? Math.Max(DateTime.Now.Hour + 2, 11) : 10;
      var registeredAt = DateTime.Now.Date.AddDays(dayOffset).AddHours(hour).AddMinutes(15);

      if (byCode.TryGetValue(sample.TicketCode, out var ticket))
      {
        ticket.IsCancelled = sample.Cancelled;
        ticket.RegisteredAt = registeredAt;
        ticket.TripOrigin = sample.Origin;
        ticket.TripDestination = sample.Dest;
        ticket.ServiceName = sample.Service;
        ticket.CarName = sample.Car;
        ticket.TicketOriginalPrice = sample.Price;
        ticket.TicketFinalPrice = sample.Price;
        ticket.HeadOfPassengers = sample.Head;
        continue;
      }

      ticket = new Ticket
      {
        TicketCode = sample.TicketCode,
        Tripcode = sample.TripCode,
        Firstname = employee?.Firstname ?? "مسافر",
        Lastname = employee?.Lastname ?? "نمونه",
        Gender = employee?.Gender ?? "مرد",
        PhoneNumber = employee?.PhoneNumber ?? "09121239999",
        Email = employee?.Email,
        NaCode = employee?.NaCode ?? "0012345699",
        CompanyName = agency.Name,
        HeadOfPassengers = sample.Head,
        DOB = new DateTime(1990, 5, 12),
        TicketOriginalPrice = sample.Price,
        TicketFinalPrice = sample.Price,
        TripOrigin = sample.Origin,
        TripDestination = sample.Dest,
        RegisteredAt = registeredAt,
        IsCancelled = sample.Cancelled,
        ServiceName = sample.Service,
        CarName = sample.Car,
        AgencyEmployeeId = employee?.Id,
        Agency = agency
      };

      if (sample.Companion is { } companion)
      {
        ticket.Companions.Add(new TicketCompanion
        {
          SortOrder = 1,
          Firstname = companion.First,
          Lastname = companion.Last,
          Gender = companion.Gender,
          NaCode = companion.Na,
          PhoneNumber = "09121238888"
        });
      }

      db.Tickets.Add(ticket);
    }

    await db.SaveChangesAsync(cancellationToken);
  }

  private static string FormatErrors(IdentityResult result) =>
    string.Join(" | ", result.Errors.Select(e => e.Description));
}
