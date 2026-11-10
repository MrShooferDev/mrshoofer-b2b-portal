using Application.Data;
using Application.Models;
using Application.Services.OfficialInvoices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Application.Areas.AgencyArea.Controllers
{
    [Area("AgencyArea")]
    [Authorize]
    public class OfficialInvoicesController : Controller
    {
        private readonly AppDbContext _db;
        private readonly IOfficialInvoiceService _invoices;

        public OfficialInvoicesController(AppDbContext db, IOfficialInvoiceService invoices)
        {
            _db = db;
            _invoices = invoices;
        }

        public async Task<IActionResult> Index(
            int page = 1,
            int openInvoice = 0,
            string? ticketcode = null,
            CancellationToken cancellationToken = default)
        {
            const int pageSize = 20;
            if (page < 1) page = 1;

            var agency = await ResolveAgencyAsync(cancellationToken);
            if (agency == null) return RedirectToAction("Login", "Auth");

            ViewData["Title"] = "فاکتور رسمی";
            ViewBag.IsOrganization = agency.IsOrganization;
            ViewBag.openInvoiceModal = openInvoice == 1;
            ViewBag.preselectTicketCode = string.IsNullOrWhiteSpace(ticketcode) ? null : ticketcode.Trim();

            var query = _db.OfficialInvoices.AsNoTracking()
                .Where(i => i.AgencyId == agency.Id);

            var totalCount = await query.CountAsync(cancellationToken);
            var uploadedCount = await query.CountAsync(i => i.UploadStatus == OfficialInvoiceUploadStatus.Uploaded, cancellationToken);
            var pendingCount = await query.CountAsync(i => i.UploadStatus == OfficialInvoiceUploadStatus.Pending, cancellationToken);
            var buyerCount = await query
                .Where(i => i.UploadStatus != OfficialInvoiceUploadStatus.Cancelled)
                .Select(i => i.BuyerNationalId ?? i.BuyerName ?? ("#" + i.Id))
                .Distinct()
                .CountAsync(cancellationToken);
            var uploadedSum = await query
                .Where(i => i.UploadStatus == OfficialInvoiceUploadStatus.Uploaded)
                .SumAsync(i => (long?)i.PayableRials, cancellationToken) ?? 0L;
            var pendingSum = await query
                .Where(i => i.UploadStatus == OfficialInvoiceUploadStatus.Pending)
                .SumAsync(i => (long?)i.PayableRials, cancellationToken) ?? 0L;

            var totalPages = Math.Max(1, (int)Math.Ceiling(totalCount / (double)pageSize));
            if (page > totalPages) page = totalPages;

            var list = await query
                .Include(i => i.InvoiceTickets)
                .OrderByDescending(i => i.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            ViewBag.SerialPreview = _invoices.GetSerialSettings().Preview;
            ViewBag.HasInvoiceFinancialInfo = agency.HasInvoiceFinancialInfo;
            ViewBag.LegalProfileUrl = Url.Action("Index", "Agency", new { area = "AgencyArea" }) + "#financial";
            ViewBag.page = page;
            ViewBag.pageSize = pageSize;
            ViewBag.totalCount = totalCount;
            ViewBag.totalPages = totalPages;
            ViewBag.buyerCount = buyerCount;
            ViewBag.uploadedCount = uploadedCount;
            ViewBag.pendingCount = pendingCount;
            ViewBag.uploadedSum = uploadedSum;
            ViewBag.pendingSum = pendingSum;
            return View(list);
        }

        /// <summary>Legacy entry: opens the multi-select invoice modal on this page.</summary>
        [HttpGet]
        public async Task<IActionResult> Create(string? ticketcode, CancellationToken cancellationToken = default)
        {
            var agency = await ResolveAgencyAsync(cancellationToken);
            if (agency == null) return RedirectToAction("Login", "Auth");

            if (agency.IsOrganization && !agency.HasInvoiceFinancialInfo)
            {
                TempData["InvoiceBlocked"] = true;
                TempData["ErrorMessage"] = "برای صدور فاکتور رسمی ابتدا اطلاعات مالی آژانس (کد اقتصادی، شماره ثبت و شناسه ملی) را تکمیل کنید.";
                if (!string.IsNullOrWhiteSpace(ticketcode))
                    TempData["PendingInvoiceTicketCode"] = ticketcode.Trim();
                return Redirect(Url.Action("Index", "Agency", new { area = "AgencyArea" }) + "#financial");
            }

            return RedirectToAction(nameof(Index), new
            {
                openInvoice = 1,
                ticketcode = string.IsNullOrWhiteSpace(ticketcode) ? null : ticketcode.Trim()
            });
        }

        [HttpPost]
        [ActionName(nameof(Create))]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateConfirm([FromForm] string ticketCode, CancellationToken cancellationToken = default)
        {
            var agency = await ResolveAgencyAsync(cancellationToken);
            if (agency == null) return RedirectToAction("Login", "Auth");

            if (agency.IsOrganization && !agency.HasInvoiceFinancialInfo)
            {
                TempData["InvoiceBlocked"] = true;
                TempData["ErrorMessage"] = "برای صدور فاکتور رسمی ابتدا اطلاعات مالی آژانس (کد اقتصادی، شماره ثبت و شناسه ملی) را تکمیل کنید.";
                if (!string.IsNullOrWhiteSpace(ticketCode))
                    TempData["PendingInvoiceTicketCode"] = ticketCode.Trim();
                return Redirect(Url.Action("Index", "Agency", new { area = "AgencyArea" }) + "#financial");
            }

            try
            {
                var saved = await _invoices.CreateFromTicketsAsync(
                    agency.Id, new[] { ticketCode }, User.Identity?.Name, cancellationToken);
                TempData["Success"] = "فاکتور " + saved.SerialNumber + " صادر شد.";
                return RedirectToAction(nameof(Print), new { id = saved.Id });
            }
            catch (InvalidOperationException ex)
            {
                TempData["Error"] = ex.Message;
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpGet]
        public async Task<IActionResult> EligibleTickets(CancellationToken cancellationToken = default)
        {
            var agency = await ResolveAgencyAsync(cancellationToken);
            if (agency == null) return Unauthorized();

            if (agency.IsOrganization && !agency.HasInvoiceFinancialInfo)
            {
                return Json(new
                {
                    ok = false,
                    needsFinancial = true,
                    message = "برای صدور فاکتور رسمی ابتدا اطلاعات مالی آژانس را تکمیل کنید.",
                    legalProfileUrl = Url.Action("Index", "Agency", new { area = "AgencyArea" }) + "#financial"
                });
            }

            var items = await _invoices.ListEligibleTicketsAsync(agency.Id, agency.IsOrganization, cancellationToken);
            var eligibleCount = items.Count(t => t.Eligible);
            return Json(new
            {
                ok = true,
                isOrganization = agency.IsOrganization,
                totalCount = items.Count,
                eligibleCount,
                tickets = items.Select(t => new
                {
                    t.TicketId,
                    t.TicketCode,
                    t.PassengerName,
                    t.NationalId,
                    t.RouteLabel,
                    t.ServiceName,
                    t.AmountToman,
                    registeredAt = t.RegisteredAt.ToString("yyyy-MM-ddTHH:mm:ss"),
                    t.Eligible,
                    t.BlockReason,
                    t.ActiveInvoiceId,
                    t.ActiveInvoiceSerial,
                    activeInvoiceStatus = t.ActiveInvoiceStatus?.ToString()
                })
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateMulti([FromForm] List<string>? ticketCodes, CancellationToken cancellationToken = default)
        {
            var agency = await ResolveAgencyAsync(cancellationToken);
            if (agency == null) return Unauthorized();

            if (agency.IsOrganization && !agency.HasInvoiceFinancialInfo)
            {
                return Json(new
                {
                    ok = false,
                    needsFinancial = true,
                    message = "برای صدور فاکتور رسمی ابتدا اطلاعات مالی آژانس را تکمیل کنید.",
                    legalProfileUrl = Url.Action("Index", "Agency", new { area = "AgencyArea" }) + "#financial"
                });
            }

            try
            {
                var saved = await _invoices.CreateFromTicketsAsync(
                    agency.Id, ticketCodes ?? new List<string>(), User.Identity?.Name, cancellationToken);
                return Json(new
                {
                    ok = true,
                    id = saved.Id,
                    serial = saved.SerialNumber,
                    printUrl = Url.Action(nameof(Print), new { id = saved.Id }),
                    message = "فاکتور " + saved.SerialNumber + " صادر شد."
                });
            }
            catch (InvalidOperationException ex)
            {
                return Json(new { ok = false, message = ex.Message });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CancelPending(int id, CancellationToken cancellationToken = default)
        {
            var agency = await ResolveAgencyAsync(cancellationToken);
            if (agency == null) return RedirectToAction("Login", "Auth");

            try
            {
                var invoice = await _invoices.CancelPendingAsync(id, agency.Id, cancellationToken);
                if (invoice == null)
                {
                    TempData["Error"] = "فاکتور پیدا نشد.";
                    return RedirectToAction(nameof(Index));
                }

                TempData["Success"] = $"درخواست فاکتور {invoice.SerialNumber} لغو شد. بلیط‌ها دوباره قابل صدور هستند.";
            }
            catch (InvalidOperationException ex)
            {
                TempData["Error"] = ex.Message;
            }

            return RedirectToAction(nameof(Index));
        }

        [HttpGet]
        public async Task<IActionResult> Print(int id, CancellationToken cancellationToken = default)
        {
            var agency = await ResolveAgencyAsync(cancellationToken);
            if (agency == null) return RedirectToAction("Login", "Auth");

            var invoice = await _db.OfficialInvoices.AsNoTracking()
                .Include(i => i.InvoiceTickets)
                .FirstOrDefaultAsync(i => i.Id == id && i.AgencyId == agency.Id, cancellationToken);
            if (invoice == null) return NotFound();

            if (agency.IsOrganization)
                ApplyAgencyBuyerProfile(invoice, agency);

            OfficialInvoiceService.HydrateLines(invoice);
            ViewBag.Template = _invoices.GetAssets();
            ViewBag.Seller = await _invoices.GetSellerProfileAsync(cancellationToken);
            ViewBag.IsOrganization = agency.IsOrganization;
            ViewData["Title"] = "فاکتور " + invoice.SerialNumber;
            return View(invoice);
        }

        private static void ApplyAgencyBuyerProfile(OfficialInvoice invoice, Agency agency)
        {
            invoice.BuyerName = agency.Name;
            if (!string.IsNullOrWhiteSpace(agency.NationalId))
                invoice.BuyerNationalId = agency.NationalId.Trim();
            if (!string.IsNullOrWhiteSpace(agency.EconomicNo))
                invoice.BuyerEconomicNo = agency.EconomicNo.Trim();
            if (!string.IsNullOrWhiteSpace(agency.RegistrationNo))
                invoice.BuyerRegistrationNo = agency.RegistrationNo.Trim();
            if (!string.IsNullOrWhiteSpace(agency.Address))
                invoice.BuyerAddress = agency.Address.Trim();
            if (!string.IsNullOrWhiteSpace(agency.PhoneNumber))
                invoice.BuyerPhone = agency.PhoneNumber.Trim();
            if (!string.IsNullOrWhiteSpace(agency.Fax))
                invoice.BuyerFax = agency.Fax.Trim();
            if (!string.IsNullOrWhiteSpace(agency.Province))
                invoice.BuyerProvince = agency.Province.Trim();
            if (!string.IsNullOrWhiteSpace(agency.County))
                invoice.BuyerCounty = agency.County.Trim();
            if (!string.IsNullOrWhiteSpace(agency.City))
                invoice.BuyerCity = agency.City.Trim();
            if (!string.IsNullOrWhiteSpace(agency.PostalCode))
                invoice.BuyerPostalCode = agency.PostalCode.Trim();
        }

        private async Task<Agency?> ResolveAgencyAsync(CancellationToken cancellationToken)
        {
            var username = User?.Identity?.Name;
            if (string.IsNullOrWhiteSpace(username)) return null;
            return await _db.Agencies.AsNoTracking()
                .Include(a => a.IdentityUser)
                .FirstOrDefaultAsync(a => a.IdentityUser.UserName == username, cancellationToken);
        }
    }
}
