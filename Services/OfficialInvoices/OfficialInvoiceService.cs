using System.Globalization;
using System.Text.Json;
using Application.Data;
using Application.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace Application.Services.OfficialInvoices
{
    public class InvoiceSerialSettings
    {
        public string Pattern { get; set; } = "{n}-{prefix}";
        public string Prefix { get; set; } = "2209";
        public int NextSequence { get; set; } = 1;
        public string Preview { get; set; } = "1-2209";
    }

    public static class OfficialInvoiceSeller
    {
        public const string CompanyName = "گروه فناوری رهنگار";
        public const string EconomicNo = "14015483891";
        public const string RegistrationNo = "676497";
        public const string NationalId = "14015483891";
        public const string Phone = "021-28422243";
        public const string Province = "تهران";
        public const string County = "تهران";
        public const string City = "تهران";
        public const string PostalCode = "1815767431";
        public const string Address = "تهران میرداماد میدان مادر خیابان شاه نظری کوچه ابن سینا پلاک ۲";
        public const string Title = "صورتحساب فروش خدمات از مسترشوفر (گروه فناوری رهنگار)";
        public const string MoodianNote =
            "این فاکتور ظرف مدت ۵ روز کاری پس از صدور، در سامانه مودیان بارگزاری خواهد شد";
    }

    public class InvoiceTemplateAssets
    {
        public string LogoUrl { get; set; } = "/logo_full_b.png";
        public string StampUrl { get; set; } = "/invoice/rahnegar-stamp.png";
    }

    public enum TicketInvoiceEligibility
    {
        Ok = 0,
        NotFound = 1,
        Cancelled = 2,
        AlreadyInvoiced = 3,
        MixedPassengers = 4
    }

    public class EligibleTicketItem
    {
        public int TicketId { get; set; }
        public string TicketCode { get; set; } = "";
        public string PassengerName { get; set; } = "";
        public string? NationalId { get; set; }
        public string RouteLabel { get; set; } = "";
        public string? ServiceName { get; set; }
        public int AmountToman { get; set; }
        public DateTime RegisteredAt { get; set; }
        public bool Eligible { get; set; }
        public string? BlockReason { get; set; }
        public int? ActiveInvoiceId { get; set; }
        public string? ActiveInvoiceSerial { get; set; }
        public OfficialInvoiceUploadStatus? ActiveInvoiceStatus { get; set; }
    }

    public interface IOfficialInvoiceService
    {
        InvoiceSerialSettings GetSerialSettings();
        string FormatSerial(string pattern, string prefix, int sequence, DateTime at);
        Task<OfficialInvoice> CreateAsync(OfficialInvoice invoice, CancellationToken cancellationToken = default);
        Task<OfficialInvoice> CreateFromTicketsAsync(
            int agencyId, IReadOnlyList<string> ticketCodes, string? createdBy, CancellationToken cancellationToken = default);
        Task<(TicketInvoiceEligibility Status, Ticket? Ticket, OfficialInvoice? ExistingInvoice)> ResolveEligibleTicketAsync(
            string ticketCode, int agencyId, CancellationToken cancellationToken = default);
        Task PrefillFromTicketAsync(OfficialInvoice invoice, Ticket ticket, int agencyId);
        Task<IReadOnlyList<EligibleTicketItem>> ListEligibleTicketsAsync(
            int agencyId, bool isOrganization, CancellationToken cancellationToken = default);
        Task<OfficialInvoice?> CancelPendingAsync(
            int invoiceId, int agencyId, CancellationToken cancellationToken = default);
        Task<OfficialInvoice?> SetUploadStatusAsync(
            int invoiceId, OfficialInvoiceUploadStatus status, string? changedBy, CancellationToken cancellationToken = default);
        Task<InvoiceSellerProfile> GetSellerProfileAsync(CancellationToken cancellationToken = default);
        Task<InvoiceSellerProfile> SaveSellerProfileAsync(InvoiceSellerProfile profile, CancellationToken cancellationToken = default);
        InvoiceTemplateAssets GetAssets();
    }

    public class OfficialInvoiceService : IOfficialInvoiceService
    {
        private static readonly JsonSerializerOptions JsonOpts = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private readonly AppDbContext _db;
        private readonly IWebHostEnvironment _env;

        public OfficialInvoiceService(AppDbContext db, IWebHostEnvironment env)
        {
            _db = db;
            _env = env;
        }

        public InvoiceTemplateAssets GetAssets()
        {
            var root = _env.WebRootPath ?? "wwwroot";
            var stamp = Path.Combine(root, "invoice", "rahnegar-stamp.png");
            var logo = Path.Combine(root, "logo_full_b.png");
            var stampTick = File.Exists(stamp) ? File.GetLastWriteTimeUtc(stamp).Ticks : 0;
            var logoTick = File.Exists(logo) ? File.GetLastWriteTimeUtc(logo).Ticks : 0;
            return new InvoiceTemplateAssets
            {
                LogoUrl = $"/logo_full_b.png?v={logoTick}",
                StampUrl = $"/invoice/rahnegar-stamp.png?v={stampTick}"
            };
        }

        public InvoiceSerialSettings GetSerialSettings()
        {
            var s = _db.InvoiceSerialConfigs.AsNoTracking().FirstOrDefault();
            var settings = new InvoiceSerialSettings
            {
                Pattern = string.IsNullOrWhiteSpace(s?.Pattern) ? "{n}-{prefix}" : s.Pattern.Trim(),
                Prefix = string.IsNullOrWhiteSpace(s?.Prefix) ? "2209" : s.Prefix.Trim(),
                NextSequence = s == null || s.NextSequence < 1 ? 1 : s.NextSequence
            };
            settings.Preview = FormatSerial(settings.Pattern, settings.Prefix, settings.NextSequence, DateTime.Now);
            return settings;
        }

        public string FormatSerial(string pattern, string prefix, int sequence, DateTime at)
        {
            var pc = new PersianCalendar();
            var yyyy = pc.GetYear(at).ToString(CultureInfo.InvariantCulture);
            var text = (pattern ?? "{n}-{prefix}")
                .Replace("{yyyy}", yyyy, StringComparison.OrdinalIgnoreCase)
                .Replace("{yy}", yyyy.Length >= 2 ? yyyy[^2..] : yyyy, StringComparison.OrdinalIgnoreCase)
                .Replace("{prefix}", prefix ?? string.Empty, StringComparison.OrdinalIgnoreCase)
                .Replace("{n}", sequence.ToString(CultureInfo.InvariantCulture), StringComparison.OrdinalIgnoreCase);
            return text.Trim();
        }

        public async Task<OfficialInvoice> CreateAsync(OfficialInvoice invoice, CancellationToken cancellationToken = default)
        {
            invoice.Lines ??= new List<OfficialInvoiceLine>();
            invoice.Lines = invoice.Lines
                .Where(l => !string.IsNullOrWhiteSpace(l.Description) || l.UnitAmountRials > 0)
                .ToList();
            Recalc(invoice);

            if (invoice.TicketId == null || string.IsNullOrWhiteSpace(invoice.TicketCode))
                throw new InvalidOperationException("Official invoice requires a purchased ticket.");
            if (invoice.Lines.Count == 0 || invoice.PayableRials <= 0)
                throw new InvalidOperationException("Official invoice requires a non-zero service line from the ticket.");

            invoice.UploadStatus = OfficialInvoiceUploadStatus.Pending;
            invoice.UploadedAt = null;
            invoice.UploadedBy = null;
            invoice.Notes = OfficialInvoiceSeller.MoodianNote;

            await AssignSerialAsync(invoice, cancellationToken);

            if (invoice.InvoiceDate == default) invoice.InvoiceDate = DateTime.Today;
            invoice.CreatedAt = DateTime.Now;
            invoice.LinesJson = JsonSerializer.Serialize(invoice.Lines, JsonOpts);

            if (invoice.InvoiceTickets.Count == 0 && invoice.TicketId is int tid)
            {
                invoice.InvoiceTickets.Add(new OfficialInvoiceTicket
                {
                    TicketId = tid,
                    TicketCode = invoice.TicketCode ?? "",
                    AmountToman = (int)Math.Max(0, invoice.PayableRials / 10),
                    PassengerName = invoice.BuyerName,
                    RouteLabel = null
                });
            }

            _db.OfficialInvoices.Add(invoice);
            await _db.SaveChangesAsync(cancellationToken);
            return invoice;
        }

        public async Task<OfficialInvoice> CreateFromTicketsAsync(
            int agencyId, IReadOnlyList<string> ticketCodes, string? createdBy, CancellationToken cancellationToken = default)
        {
            var codes = (ticketCodes ?? Array.Empty<string>())
                .Select(c => (c ?? "").Trim())
                .Where(c => c.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            if (codes.Count == 0)
                throw new InvalidOperationException("حداقل یک بلیط انتخاب کنید.");

            var agency = await _db.Agencies.AsNoTracking().FirstOrDefaultAsync(a => a.Id == agencyId, cancellationToken)
                ?? throw new InvalidOperationException("آژانس پیدا نشد.");

            var tickets = new List<Ticket>();
            foreach (var code in codes)
            {
                var (status, ticket, existing) = await ResolveEligibleTicketAsync(code, agencyId, cancellationToken);
                if (status == TicketInvoiceEligibility.AlreadyInvoiced && existing != null)
                    throw new InvalidOperationException($"بلیط {code} قبلاً در فاکتور {existing.SerialNumber} استفاده شده است.");
                if (status != TicketInvoiceEligibility.Ok || ticket == null)
                    throw new InvalidOperationException(EligibilityMessage(status, code));
                tickets.Add(ticket);
            }

            if (!agency.IsOrganization)
            {
                var nationalIds = tickets
                    .Select(t => (t.NaCode ?? "").Trim())
                    .Where(n => n.Length > 0)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
                if (nationalIds.Count > 1)
                    throw new InvalidOperationException(
                        "برای آژانس فروشنده، همه بلیط‌های یک فاکتور باید متعلق به یک مسافر (یک کد ملی) باشند.");
            }

            var invoice = new OfficialInvoice
            {
                AgencyId = agencyId,
                CreatedBy = createdBy,
                InvoiceTickets = new List<OfficialInvoiceTicket>()
            };
            await PrefillFromTicketsInternalAsync(invoice, tickets, agency);
            return await CreateAsync(invoice, cancellationToken);
        }

        public async Task<(TicketInvoiceEligibility Status, Ticket? Ticket, OfficialInvoice? ExistingInvoice)> ResolveEligibleTicketAsync(
            string ticketCode, int agencyId, CancellationToken cancellationToken = default)
        {
            ticketCode = (ticketCode ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(ticketCode))
                return (TicketInvoiceEligibility.NotFound, null, null);

            var ticket = await _db.Tickets.AsNoTracking()
                .FirstOrDefaultAsync(t => t.TicketCode == ticketCode
                                          && EF.Property<int>(t, "AgencyId") == agencyId, cancellationToken);
            if (ticket == null)
                return (TicketInvoiceEligibility.NotFound, null, null);
            if (ticket.IsCancelled)
                return (TicketInvoiceEligibility.Cancelled, ticket, null);

            var viaJunction = await _db.OfficialInvoiceTickets.AsNoTracking()
                .Where(t => t.TicketId == ticket.Id)
                .Join(
                    _db.OfficialInvoices.AsNoTracking().Where(i =>
                        i.AgencyId == agencyId &&
                        (i.UploadStatus == OfficialInvoiceUploadStatus.Pending ||
                         i.UploadStatus == OfficialInvoiceUploadStatus.Uploaded)),
                    t => t.OfficialInvoiceId,
                    i => i.Id,
                    (_, i) => i)
                .OrderByDescending(i => i.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (viaJunction != null)
                return (TicketInvoiceEligibility.AlreadyInvoiced, ticket, viaJunction);

            var viaLegacy = await _db.OfficialInvoices.AsNoTracking()
                .Where(i => i.AgencyId == agencyId
                            && i.TicketId == ticket.Id
                            && (i.UploadStatus == OfficialInvoiceUploadStatus.Pending
                                || i.UploadStatus == OfficialInvoiceUploadStatus.Uploaded))
                .OrderByDescending(i => i.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (viaLegacy != null)
                return (TicketInvoiceEligibility.AlreadyInvoiced, ticket, viaLegacy);

            return (TicketInvoiceEligibility.Ok, ticket, null);
        }

        public async Task PrefillFromTicketAsync(OfficialInvoice invoice, Ticket ticket, int agencyId)
        {
            var agency = await _db.Agencies.AsNoTracking().FirstOrDefaultAsync(a => a.Id == agencyId);
            await PrefillFromTicketsInternalAsync(invoice, new[] { ticket }, agency);
        }

        public async Task<IReadOnlyList<EligibleTicketItem>> ListEligibleTicketsAsync(
            int agencyId, bool isOrganization, CancellationToken cancellationToken = default)
        {
            // All non-cancelled tickets — recent and already-travelled alike.
            // Newest registration first; cancelled tickets stay out of the invoice picker.
            var tickets = await _db.Tickets.AsNoTracking()
                .Where(t => EF.Property<int>(t, "AgencyId") == agencyId && !t.IsCancelled)
                .OrderByDescending(t => t.RegisteredAt)
                .ThenByDescending(t => t.Id)
                .Take(500)
                .ToListAsync(cancellationToken);

            var ticketIds = tickets.Select(t => t.Id).ToList();

            var activeLinks = ticketIds.Count == 0
                ? new List<(int TicketId, OfficialInvoice Invoice)>()
                : (await (
                    from link in _db.OfficialInvoiceTickets.AsNoTracking()
                    join inv in _db.OfficialInvoices.AsNoTracking() on link.OfficialInvoiceId equals inv.Id
                    where ticketIds.Contains(link.TicketId)
                          && inv.AgencyId == agencyId
                          && (inv.UploadStatus == OfficialInvoiceUploadStatus.Pending
                              || inv.UploadStatus == OfficialInvoiceUploadStatus.Uploaded)
                    select new { link.TicketId, Invoice = inv }
                ).ToListAsync(cancellationToken))
                .Select(x => (x.TicketId, x.Invoice))
                .ToList();

            var legacy = ticketIds.Count == 0
                ? new List<OfficialInvoice>()
                : await _db.OfficialInvoices.AsNoTracking()
                    .Where(i => i.AgencyId == agencyId
                                && i.TicketId != null
                                && ticketIds.Contains(i.TicketId.Value)
                                && (i.UploadStatus == OfficialInvoiceUploadStatus.Pending
                                    || i.UploadStatus == OfficialInvoiceUploadStatus.Uploaded))
                    .ToListAsync(cancellationToken);

            var activeByTicket = new Dictionary<int, OfficialInvoice>();
            foreach (var row in activeLinks)
                activeByTicket.TryAdd(row.TicketId, row.Invoice);
            foreach (var inv in legacy)
            {
                if (inv.TicketId is int tid)
                    activeByTicket.TryAdd(tid, inv);
            }

            var items = new List<EligibleTicketItem>(tickets.Count);
            foreach (var ticket in tickets)
            {
                var passenger = $"{ticket.Firstname} {ticket.Lastname}".Trim();
                var route = $"{ticket.TripOrigin} به {ticket.TripDestination}";
                var item = new EligibleTicketItem
                {
                    TicketId = ticket.Id,
                    TicketCode = ticket.TicketCode,
                    PassengerName = passenger,
                    NationalId = NullIfBlank(ticket.NaCode),
                    RouteLabel = route,
                    ServiceName = NullIfBlank(ticket.ServiceName),
                    AmountToman = ticket.TicketFinalPrice,
                    RegisteredAt = ticket.RegisteredAt
                };

                if (activeByTicket.TryGetValue(ticket.Id, out var inv))
                {
                    item.Eligible = false;
                    item.ActiveInvoiceId = inv.Id;
                    item.ActiveInvoiceSerial = inv.SerialNumber;
                    item.ActiveInvoiceStatus = inv.UploadStatus;
                    item.BlockReason = inv.UploadStatus == OfficialInvoiceUploadStatus.Uploaded
                        ? "ثبت‌شده در مودیان"
                        : "درحال صدور";
                }
                else
                {
                    item.Eligible = true;
                }

                items.Add(item);
            }

            // Seller UX: mixed-passenger rule is enforced at create time.
            _ = isOrganization;
            return items;
        }

        public async Task<OfficialInvoice?> CancelPendingAsync(
            int invoiceId, int agencyId, CancellationToken cancellationToken = default)
        {
            var invoice = await _db.OfficialInvoices
                .FirstOrDefaultAsync(i => i.Id == invoiceId && i.AgencyId == agencyId, cancellationToken);
            if (invoice == null) return null;
            if (invoice.UploadStatus != OfficialInvoiceUploadStatus.Pending)
                throw new InvalidOperationException("فقط درخواست‌های درحال صدور قابل لغو هستند.");

            invoice.UploadStatus = OfficialInvoiceUploadStatus.Cancelled;
            invoice.UploadedAt = null;
            invoice.UploadedBy = null;
            await _db.SaveChangesAsync(cancellationToken);
            return invoice;
        }

        private async Task PrefillFromTicketsInternalAsync(
            OfficialInvoice invoice, IReadOnlyList<Ticket> tickets, Agency? agency)
        {
            if (tickets.Count == 0)
                throw new InvalidOperationException("حداقل یک بلیط لازم است.");

            var first = tickets[0];
            var agencyId = agency?.Id ?? invoice.AgencyId;
            var isOrg = agency?.IsOrganization == true;

            invoice.TicketId = first.Id;
            invoice.TicketCode = first.TicketCode;
            invoice.AgencyId = agencyId;
            invoice.InvoiceDate = DateTime.Today;
            invoice.PaymentIsCash = true;
            invoice.Notes = OfficialInvoiceSeller.MoodianNote;
            invoice.UploadStatus = OfficialInvoiceUploadStatus.Pending;
            invoice.UploadedAt = null;
            invoice.UploadedBy = null;

            var passengerName = $"{first.Firstname} {first.Lastname}".Trim();
            if (isOrg && agency != null)
            {
                invoice.BuyerName = agency.Name;
                invoice.BuyerNationalId = NullIfBlank(agency.NationalId) ?? first.NaCode;
                invoice.BuyerEconomicNo = NullIfBlank(agency.EconomicNo);
                invoice.BuyerRegistrationNo = NullIfBlank(agency.RegistrationNo);
                invoice.BuyerAddress = NullIfBlank(agency.Address);
                invoice.BuyerPhone = NullIfBlank(agency.PhoneNumber) ?? first.PhoneNumber;
                invoice.BuyerFax = NullIfBlank(agency.Fax);
                invoice.BuyerProvince = NullIfBlank(agency.Province);
                invoice.BuyerCounty = NullIfBlank(agency.County);
                invoice.BuyerCity = NullIfBlank(agency.City);
                invoice.BuyerPostalCode = NullIfBlank(agency.PostalCode);
            }
            else
            {
                invoice.BuyerName = passengerName;
                invoice.BuyerNationalId = NullIfBlank(first.NaCode);
                invoice.BuyerEconomicNo = null;
                invoice.BuyerRegistrationNo = null;
                invoice.BuyerAddress = null;
                invoice.BuyerPhone = NullIfBlank(first.PhoneNumber);
                invoice.BuyerFax = null;
                invoice.BuyerProvince = null;
                invoice.BuyerCounty = null;
                invoice.BuyerCity = null;
                invoice.BuyerPostalCode = null;
            }

            invoice.Lines = new List<OfficialInvoiceLine>();
            invoice.InvoiceTickets = new List<OfficialInvoiceTicket>();

            foreach (var ticket in tickets)
            {
                var name = $"{ticket.Firstname} {ticket.Lastname}".Trim();
                var rials = (long)ticket.TicketFinalPrice * 10;
                var serviceBit = string.IsNullOrWhiteSpace(ticket.ServiceName) ? "" : $" ({ticket.ServiceName})";
                var route = $"{ticket.TripOrigin} به {ticket.TripDestination}";
                invoice.Lines.Add(new OfficialInvoiceLine
                {
                    ItemCode = ticket.TicketCode,
                    Description =
                        $"بابت سفر {ticket.TripOrigin} به {ticket.TripDestination}{serviceBit} با کد بلیط {ticket.TicketCode} به مبلغ {rials.ToString("N0")} ریال. برای مسافر: {name}",
                    Quantity = 1,
                    Unit = "سفر",
                    UnitAmountRials = rials
                });
                invoice.InvoiceTickets.Add(new OfficialInvoiceTicket
                {
                    TicketId = ticket.Id,
                    TicketCode = ticket.TicketCode,
                    AmountToman = ticket.TicketFinalPrice,
                    PassengerName = name,
                    RouteLabel = route
                });
            }

            Recalc(invoice);
        }

        public async Task<OfficialInvoice?> SetUploadStatusAsync(
            int invoiceId, OfficialInvoiceUploadStatus status, string? changedBy, CancellationToken cancellationToken = default)
        {
            if (status == OfficialInvoiceUploadStatus.Cancelled)
                throw new InvalidOperationException("Admin cannot set Cancelled via upload status; use CancelPending.");

            var invoice = await _db.OfficialInvoices.FirstOrDefaultAsync(i => i.Id == invoiceId, cancellationToken);
            if (invoice == null) return null;

            invoice.UploadStatus = status;
            if (status == OfficialInvoiceUploadStatus.Uploaded)
            {
                invoice.UploadedAt = DateTime.Now;
                invoice.UploadedBy = changedBy;
            }
            else
            {
                invoice.UploadedAt = null;
                invoice.UploadedBy = null;
            }

            await _db.SaveChangesAsync(cancellationToken);
            return invoice;
        }

        public async Task<InvoiceSellerProfile> GetSellerProfileAsync(CancellationToken cancellationToken = default)
        {
            var profile = await _db.InvoiceSellerProfiles.AsNoTracking().OrderBy(p => p.Id).FirstOrDefaultAsync(cancellationToken);
            if (profile != null) return profile;

            profile = new InvoiceSellerProfile();
            _db.InvoiceSellerProfiles.Add(profile);
            await _db.SaveChangesAsync(cancellationToken);
            return profile;
        }

        public async Task<InvoiceSellerProfile> SaveSellerProfileAsync(InvoiceSellerProfile input, CancellationToken cancellationToken = default)
        {
            var profile = await _db.InvoiceSellerProfiles.OrderBy(p => p.Id).FirstOrDefaultAsync(cancellationToken);
            if (profile == null)
            {
                profile = new InvoiceSellerProfile();
                _db.InvoiceSellerProfiles.Add(profile);
            }

            profile.CompanyName = (input.CompanyName ?? string.Empty).Trim();
            profile.EconomicNo = (input.EconomicNo ?? string.Empty).Trim();
            profile.RegistrationNo = (input.RegistrationNo ?? string.Empty).Trim();
            profile.NationalId = (input.NationalId ?? string.Empty).Trim();
            profile.Phone = (input.Phone ?? string.Empty).Trim();
            profile.Province = (input.Province ?? string.Empty).Trim();
            profile.County = (input.County ?? string.Empty).Trim();
            profile.City = (input.City ?? string.Empty).Trim();
            profile.PostalCode = (input.PostalCode ?? string.Empty).Trim();
            profile.Address = (input.Address ?? string.Empty).Trim();
            profile.InvoiceTitle = (input.InvoiceTitle ?? string.Empty).Trim();

            await _db.SaveChangesAsync(cancellationToken);
            return profile;
        }

        public static void HydrateLines(OfficialInvoice invoice)
        {
            if (invoice.Lines is { Count: > 0 }) return;
            if (string.IsNullOrWhiteSpace(invoice.LinesJson))
            {
                invoice.Lines = new List<OfficialInvoiceLine>();
                return;
            }
            invoice.Lines = JsonSerializer.Deserialize<List<OfficialInvoiceLine>>(invoice.LinesJson, JsonOpts)
                            ?? new List<OfficialInvoiceLine>();
        }

        public static void Recalc(OfficialInvoice invoice)
        {
            invoice.Lines ??= new List<OfficialInvoiceLine>();
            invoice.TotalRials = invoice.Lines.Sum(l => l.LineTotalRials);
            invoice.DiscountRials = invoice.Lines.Sum(l => l.DiscountRials);
            invoice.VatRials = invoice.Lines.Sum(l => l.VatRials);
            invoice.PayableRials = invoice.Lines.Sum(l => l.PayableRials);
        }

        public static string EligibilityMessage(TicketInvoiceEligibility status, string? ticketCode = null)
        {
            var codeBit = string.IsNullOrWhiteSpace(ticketCode) ? "" : $" ({ticketCode.Trim()})";
            return status switch
            {
                TicketInvoiceEligibility.Cancelled => $"برای بلیط لغوشده نمی‌توان فاکتور رسمی صادر کرد{codeBit}.",
                TicketInvoiceEligibility.AlreadyInvoiced => $"برای این بلیط قبلاً فاکتور صادر شده است{codeBit}.",
                TicketInvoiceEligibility.MixedPassengers => "بلیط‌های انتخاب‌شده متعلق به مسافران مختلف هستند.",
                _ => $"این بلیط متعلق به آژانس شما نیست، پیدا نشد، یا قابل صدور فاکتور نیست{codeBit}."
            };
        }

        private async Task AssignSerialAsync(OfficialInvoice invoice, CancellationToken cancellationToken)
        {
            var s = await _db.InvoiceSerialConfigs.FirstOrDefaultAsync(cancellationToken);
            if (s == null)
            {
                s = new InvoiceSerialConfig();
                _db.InvoiceSerialConfigs.Add(s);
            }
            var pattern = string.IsNullOrWhiteSpace(s.Pattern) ? "{n}-{prefix}" : s.Pattern.Trim();
            var prefix = string.IsNullOrWhiteSpace(s.Prefix) ? "2209" : s.Prefix.Trim();
            var seq = s.NextSequence < 1 ? 1 : s.NextSequence;
            invoice.SerialNumber = FormatSerial(pattern, prefix, seq, invoice.InvoiceDate == default ? DateTime.Now : invoice.InvoiceDate);
            s.NextSequence = seq + 1;
        }

        private static string? NullIfBlank(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
