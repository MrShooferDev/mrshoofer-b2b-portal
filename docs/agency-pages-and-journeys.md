# Agency portal — pages & journeys

Operational map of what users can do in the **AgencyArea** B2B portal (`mrshoofer-b2b-portal`).

Routing: `{controller}/{action}` with default area `AgencyArea` (e.g. `/TicketInfo`, `/Home`).

**Knowledge base:** this file is the catalog.  
Flow map: [visuals/agency-pages-and-journeys.html](./visuals/agency-pages-and-journeys.html) · UML sequences: [visuals/agency-journeys-sequence.html](./visuals/agency-journeys-sequence.html) · Index: [README.md](./README.md)

---

## Navigation map

### Side menu (ماموریت / عمومی)

| Menu label | Page | Route |
|---|---|---|
| سفر بین شهری | Home (intercity focus) | `/Home?tripFocus=intercity` |
| ترانسفر فرودگاهی | Home (airport focus) | `/Home?tripFocus=airport` |
| سفرهای ثبت شده | Tickets list | `/TicketInfo` |
| اعضای سازمان / مشتریان | Employees | `/Employees` |
| فاکتورها | Official invoices | `/OfficialInvoices` |
| گزارشات | Analytics | `/Analytics` |
| مدیریت اعتبار | Agency profile → balance | `/Agency#balance` |
| درخواست پیگیری | Support modal (no page) | `#agencySupportModal` |
| تنظیمات | Agency profile | `/Agency` |

### Account menu (footer of side menu)

| Action | Route |
|---|---|
| پروفایل آژانس / سازمان | `/Agency` |
| شارژ حساب | `/Agency#balance` (+ charge modal) |
| خروج | `/Auth/Logout` |

### Mobile bottom nav

| Tab | Route |
|---|---|
| جستجو | `/TaxiTrips` |
| سفرها | `/TicketInfo` |
| + (سفر جدید) | `/Home` |
| پشتیبانی | `tel:02128422243` |
| حساب | `/Agency` (or `/Auth/Login` if guest) |

---

## Pages catalog

### 1. Auth — ورود / خروج

| Page | Route | Operations |
|---|---|---|
| Login (password) | `/Auth/Login` | Sign in with credentials |
| Admin login | `/Auth/AdminLogin` | Admin credential login |
| OTP login | `/Auth/Loginotp` → submit | Send OTP → verify codes |
| Logout | `/Auth/Logout` | End session |

### 2. Create account — ثبت‌نام آژانس

| Page | Route | Operations |
|---|---|---|
| Registration wizard | `/CreateAccount` | Multi-step onboarding |
| API | `POST /CreateAccount/SendOtp` | Send registration OTP |
| API | `POST /CreateAccount/VerifyOtp` | Verify OTP |
| API | `POST /CreateAccount/Submit` | Submit registration application |

### 3. Home — سفر جدید

| Page | Route | Operations |
|---|---|---|
| Landing / trip search entry | `/Home` | Start intercity or airport search (`tripFocus`) |
| Privacy | `/Home/Privacy` | Static privacy |

### 4. TaxiTrips — جستجوی سفر

| Page | Route | Operations |
|---|---|---|
| Search results | `/TaxiTrips` | Search by origin / destination / date |
| API | `/TaxiTrips/AvailableDirection` | Direction list |
| API | `/TaxiTrips/SupportedCities` | Cities JSON |
| API | `/TaxiTrips/SearchHints` | Search hints |
| API | `/TaxiTrips/SearchTripsJson` | Live search JSON |

**Journey:** Home / bottom-nav جستجو → pick route & date → results → choose trip → Reserve.

### 5. Reserve — رزرو و صدور بلیط

| Step | Route | Operations |
|---|---|---|
| Start reserve | `/Reserve/Reservetrip?tripcode=…` | Enter passenger / trip details |
| Confirm & pay | `POST /Reserve/ConfirmInfo` | Confirm booking / wallet or gateway |
| Success | `/Reserve/ReserveConfirmed?ticketcode=…` | View issued ticket; optional display-price update |
| API | `POST /Reserve/UpdateTicketDisplayPrices` | Adjust ticket display prices |
| Charge shortcut | from reserve UI | Jump to `/Agency` charge modal if balance low |

**Journey:** Search → select trip → fill passengers → confirm → pay (wallet / Zarinpal) → confirmed ticket.

### 6. TicketInfo — سفرهای ثبت شده / بلیط‌ها

| Page | Route | Operations |
|---|---|---|
| Tickets list | `/TicketInfo` | Browse tickets; date filter; pagination |
| Filter | `/TicketInfo/Filter` | Date-range filter |

**Row عملیات (active tickets):**

| Action | Behavior |
|---|---|
| چاپ بلیط | `/CustomerService/TripReceiptPDF?reference={TicketCode}` |
| فاکتور رسمی | Confirm modal for **this ticket** → درخواست صدور (or legal-profile gate) |

**Page-level:**

| Action | Behavior |
|---|---|
| صدور فاکتور رسمی (toolbar) | Opens invoice modal in **browse / multi-select** mode |
| فیلتر تاریخ | Restrict list by date range |
| پاک کردن فیلتر | Reset to full list |
| جستجوی سفرها (empty) | Go to `/Home` |

**Journey A — row invoice (scoped):**  
عملیات → فاکتور رسمی → confirm card for that ticket → `درخواست صدور` → print/result URL.

**Journey B — browse invoice:**  
Toolbar صدور فاکتور رسمی → select one or more eligible tickets → صدور فاکتور.

Cancelled tickets: **no عملیات menu**.

### 7. OfficialInvoices — فاکتور رسمی

| Page | Route | Operations |
|---|---|---|
| Invoice list | `/OfficialInvoices` | List invoices; pagination |
| Eligible tickets API | `/OfficialInvoices/EligibleTickets` | Tickets available for invoicing |
| Create multi | `POST /OfficialInvoices/CreateMulti` | Issue from selected ticket codes |
| Create (legacy/single) | `/OfficialInvoices/Create` / `CreateConfirm` | Single-ticket paths |
| Print / preview | `/OfficialInvoices/Print/{id}` | Open invoice print view |
| Cancel pending | `POST /OfficialInvoices/CancelPending` | Cancel pending request (SweetAlert confirm) |

**Journey:** صدور فاکتور رسمی → multi-select eligible tickets → submit → print page.  
Pending rows: چاپ / پیش‌نمایش, لغو درخواست.

Org agencies need completed legal/financial profile before issue; passenger-named agency invoices may skip that gate.

### 8. Agency — تنظیمات / پروفایل / اعتبار

| Section | Route / anchor | Operations |
|---|---|---|
| Profile | `/Agency` `#profile` | Edit name, admin mobile, phone, address |
| Legal / financial | `/Agency` `#financial` or `/Agency/LegalProfile` | Economic code, registration, national id, etc. |
| Credit ledger | `/Agency#balance` | View balance, charges, spends; filter ledger |
| Charge wallet | Charge modal on Agency | Amount + Zarinpal → gateway |

**Payments (supporting):**

| Action | Route |
|---|---|
| Charge request | `/Payments/ChargePaymentRequest` |
| Start Zarinpal | `/Payments/InitiateZarinpalCharge` |
| Enter gateway | `/Payments/EnterGateway` |
| Callbacks | `/Payments/ZarinpalCallback`, `/Payments/ZarinpalTicketCallback` |

### 9. Employees — اعضای سازمان / مشتریان

| Page | Route | Operations |
|---|---|---|
| List | `/Employees` | Search; open create modal |
| Create | `POST /Employees/Create` | Add member/customer |
| Edit | `/Employees/Edit/{id}` | Update member |
| Delete | `POST /Employees/Delete` | Remove (confirm) |
| Member trips | `/Employees/Trips/{id}` | Trips for one member; receipt link |
| Spend report | `/Employees/SpendReport` | Spend aggregation |
| API | `/Employees/ListJson`, `QuickCreate` | JSON list / quick create |

### 10. Analytics — گزارشات

| Page | Route | Operations |
|---|---|---|
| Reports | `/Analytics` | Filter by year/month or from–to range |

### 11. Support & contact

| Surface | How | Operations |
|---|---|---|
| درخواست پیگیری | Side-menu → support modal | FAQ / contact CTA |
| Contact API | `POST /ContactUs/PostContactMessage` | Submit message |
| Phone support | Mobile nav پشتیبانی | Dial support number |

### 12. Customer service / media (supporting)

| Action | Route | Operations |
|---|---|---|
| Ticket receipt PDF | `/CustomerService/TripReceiptPDF?reference=…` | Printable ticket |
| Reserve info | `/CustomerService/CustomerReserveInfo?reference=…` | Lookup by reference |
| ORS media proxy | `/OrsMedia/Get?path=…` | Proxied media asset |

### 13. Errors / misc

| Page | Route |
|---|---|
| Error | `/Error`, `/Error/HandleError` |
| App layout demo | `/AppLayout` |

---

## End-to-end journeys (happy paths)

```text
1) Book a trip
   Home / TaxiTrips → pick trip → Reserve → ConfirmInfo → pay → ReserveConfirmed
   → appears on TicketInfo

2) Print a ticket
   TicketInfo → عملیات → چاپ بلیط
   (or Employees/Trips → receipt)

3) Official invoice — one ticket (from list row)
   TicketInfo → عملیات → فاکتور رسمی
   → confirm this ticket → درخواست صدور → Print

4) Official invoice — multi ticket
   TicketInfo toolbar or OfficialInvoices → صدور فاکتور رسمی
   → browse/select eligible tickets → صدور فاکتور → Print

5) Cancel pending invoice
   OfficialInvoices → عملیات → لغو درخواست (confirm) → tickets freed

6) Charge wallet
   Agency#balance / account menu شارژ حساب → amount → Zarinpal → callback → balance up

7) Register new agency
   CreateAccount wizard → OTP → submit application

8) Manage org members
   Employees → create / edit / delete → Trips / SpendReport
```

---

## Journey UX rules (product)

These match current product decisions — keep when changing UI:

| Journey | Expected UX |
|---|---|
| Ticket row → فاکتور رسمی | Confirm **this** ticket only (passenger + route first). CTA: `درخواست صدور`. No “pick other tickets” on confirm. |
| Toolbar / OfficialInvoices → صدور | Browse / multi-select list stays as-is. |
| Cancelled ticket | Hide عملیات entirely. |
| Pending invoice cancel | Minimal SweetAlert before submit. |
| After successful issue | Navigate to result/print — no success celebration popup. |
| Mobile side menu open | Dim overlay only — no page blur/frost. |

---

## Quick route index

| Controller | Main user routes |
|---|---|
| `Home` | `/`, `/Home` |
| `TaxiTrips` | `/TaxiTrips` |
| `Reserve` | `/Reserve/Reservetrip`, `/Reserve/ConfirmInfo`, `/Reserve/ReserveConfirmed` |
| `TicketInfo` | `/TicketInfo` |
| `OfficialInvoices` | `/OfficialInvoices`, `/OfficialInvoices/Print/{id}` |
| `Agency` | `/Agency`, `/Agency/LegalProfile` |
| `Employees` | `/Employees`, `/Employees/Edit/{id}`, `/Employees/Trips/{id}` |
| `Analytics` | `/Analytics` |
| `Auth` | `/Auth/Login`, `/Auth/Loginotp`, `/Auth/Logout` |
| `CreateAccount` | `/CreateAccount` |
| `Payments` | `/Payments/*` |
| `CustomerService` | `/CustomerService/TripReceiptPDF` |

---

*Generated from AgencyArea controllers, side menu, mobile nav, and current ticket/invoice UX. Update this file when you add or change a page journey.*
