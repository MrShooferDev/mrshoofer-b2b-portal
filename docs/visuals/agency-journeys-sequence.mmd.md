# Agency portal — UML sequence diagrams

Source: [agency-pages-and-journeys.md](../agency-pages-and-journeys.md)

**Rendered view:** open [agency-journeys-sequence.html](./agency-journeys-sequence.html) in a browser.

---

## 1) Book a trip

```mermaid
sequenceDiagram
  actor User
  participant Home as Home / TaxiTrips
  participant Reserve as Reserve
  participant Pay as Wallet / Zarinpal
  participant Ticket as TicketInfo

  User->>Home: Search origin / dest / date
  Home-->>User: Trip results
  User->>Reserve: Select trip (Reservetrip)
  User->>Reserve: Submit passenger info
  Reserve->>Reserve: ConfirmInfo
  alt Balance OK
    Reserve->>Pay: Debit wallet
  else Low balance
    Reserve-->>User: Charge shortcut
    User->>Pay: Charge via Zarinpal
    Pay-->>Reserve: Resume
  end
  Pay-->>Reserve: Payment OK
  Reserve-->>User: ReserveConfirmed
  Reserve->>Ticket: Ticket appears on list
```

## 2) Official invoice — row (confirm this ticket)

```mermaid
sequenceDiagram
  actor User
  participant Tickets as TicketInfo
  participant Modal as Invoice modal (confirm)
  participant API as OfficialInvoices
  participant Print as Print view

  User->>Tickets: عملیات → فاکتور رسمی
  Tickets->>Modal: Open with data-ticket-code
  Modal->>API: GET EligibleTickets
  API-->>Modal: Ticket list
  Modal-->>User: Confirm card (this ticket only)
  User->>Modal: درخواست صدور
  Modal->>API: POST CreateMulti [this code]
  API-->>Modal: printUrl
  Modal->>Print: Navigate to Print
  Print-->>User: Invoice preview
```

## 3) Official invoice — browse / multi-select

```mermaid
sequenceDiagram
  actor User
  participant Entry as TicketInfo toolbar / OfficialInvoices
  participant Modal as Invoice modal (browse)
  participant API as OfficialInvoices
  participant Print as Print view

  User->>Entry: صدور فاکتور رسمی
  Entry->>Modal: Open browse mode
  Modal->>API: GET EligibleTickets
  API-->>Modal: Eligible + blocked tickets
  Modal-->>User: Multi-select list
  User->>Modal: Select tickets → صدور فاکتور
  Modal->>API: POST CreateMulti [codes]
  API-->>Modal: printUrl
  Modal->>Print: Navigate to Print
```

## 4) Cancel pending invoice

```mermaid
sequenceDiagram
  actor User
  participant List as OfficialInvoices
  participant Swal as SweetAlert
  participant API as OfficialInvoices API

  User->>List: عملیات → لغو درخواست
  List->>Swal: Confirm cancel?
  User->>Swal: بله، لغو شود
  Swal->>API: POST CancelPending
  API-->>List: Tickets freed / list refresh
```

## 5) Charge wallet

```mermaid
sequenceDiagram
  actor User
  participant Agency as Agency #balance
  participant Pay as Payments
  participant ZP as Zarinpal

  User->>Agency: شارژ حساب / open charge modal
  User->>Agency: Enter amount
  Agency->>Pay: InitiateZarinpalCharge
  Pay->>ZP: Create payment
  ZP-->>User: Gateway
  User->>ZP: Pay
  ZP->>Pay: Callback
  Pay-->>Agency: Balance updated
```
