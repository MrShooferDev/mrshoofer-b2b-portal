namespace Application.ViewModels.Agency;

public enum AgencyFinanceKind
{
  Charge,
  Spend,
  Pending,
  Failed
}

public sealed class AgencyFinanceEntryViewModel
{
  public DateTime At { get; init; }
  public AgencyFinanceKind Kind { get; init; }
  public string Title { get; init; } = "";
  public string? Detail { get; init; }
  public string? Reference { get; init; }
  public int AmountToman { get; init; }
  public bool IsCredit { get; init; }
  public string StatusLabel { get; init; } = "";
}

public sealed class AgencyFinanceLedgerViewModel
{
  public IReadOnlyList<AgencyFinanceEntryViewModel> Entries { get; init; } = Array.Empty<AgencyFinanceEntryViewModel>();
  public long TotalCharged { get; init; }
  public long TotalSpent { get; init; }
  public long Net => TotalCharged - TotalSpent;
  public int ChargeCount { get; init; }
  public int SpendCount { get; init; }
}
