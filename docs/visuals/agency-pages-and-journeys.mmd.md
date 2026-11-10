# Agency portal — pages & journeys (visual)

Source: [agency-pages-and-journeys.md](../agency-pages-and-journeys.md)

**To see rendered diagrams:** open [agency-pages-and-journeys.html](./agency-pages-and-journeys.html) in a browser (Cursor Markdown preview shows only the Mermaid text).

## Main journeys

```mermaid
flowchart TB
  subgraph auth [Auth]
    Login["/Auth/Login"]
    OTP["/Auth/Loginotp"]
    Reg["/CreateAccount"]
    Login --> Home
    OTP --> Home
    Reg --> Login
  end

  subgraph book [Book trip]
    Home["/Home"]
    Search["/TaxiTrips"]
    Reserve["/Reserve/Reservetrip"]
    Confirm["/Reserve/ConfirmInfo"]
    Done["/Reserve/ReserveConfirmed"]
    Home --> Search --> Reserve --> Confirm --> Done
    Confirm -->|low balance| Charge
  end

  subgraph tickets [Tickets]
    TicketInfo["/TicketInfo"]
    Print["TripReceiptPDF"]
    Done --> TicketInfo
    TicketInfo -->|row: چاپ بلیط| Print
  end

  subgraph invoice [Official invoice]
    InvConfirm["Row → confirm this ticket → درخواست صدور"]
    InvBrowse["Toolbar / OfficialInvoices → multi-select"]
    InvPrint["/OfficialInvoices/Print"]
    InvCancel["لغو درخواست"]
    TicketInfo -->|row: فاکتور رسمی| InvConfirm --> InvPrint
    TicketInfo -->|toolbar صدور| InvBrowse --> InvPrint
    InvList["/OfficialInvoices"] --> InvBrowse
    InvList --> InvCancel
    InvList --> InvPrint
  end

  subgraph account [Account]
    Agency["/Agency"]
    Balance["#balance"]
    Charge["Charge → Zarinpal"]
    Legal["LegalProfile"]
    Agency --> Balance --> Charge
    Agency --> Legal
  end

  subgraph people [People & reports]
    Employees["/Employees"]
    EmpTrips["/Employees/Trips"]
    Analytics["/Analytics"]
    Employees --> EmpTrips
    Employees --> Analytics
  end
```

## Side menu → pages

```mermaid
flowchart LR
  subgraph menu [Side menu]
    M1[سفر جدید] --> Home2["/Home"]
    M2[سفرهای ثبت شده] --> T["/TicketInfo"]
    M3[اعضا / مشتریان] --> E["/Employees"]
    M4[فاکتورها] --> I["/OfficialInvoices"]
    M5[گزارشات] --> A["/Analytics"]
    M6[مدیریت اعتبار] --> B["/Agency#balance"]
    M7[تنظیمات] --> Ag["/Agency"]
  end
```
